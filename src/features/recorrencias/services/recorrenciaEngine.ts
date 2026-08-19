import { TituloReceber } from '@/features/contas-receber/types';
import { RecorrenciaFinanceira } from '../types';
import { Contrato } from '@/features/contratos/types';

export interface ResumoFinanceiroCliente {
  valorEmAberto: number;
  totalRecebido: number;
  mensalidade: number;
  titulosAtrasados: number;
  titulosDoCliente: TituloReceber[];
  recorrenciasDoCliente: RecorrenciaFinanceira[];
}

/**
 * Calcula dinamicamente os indicadores financeiros de um cliente específico
 * consultando estritamente os títulos e recorrências vinculados ao clientId.
 */
export function calculateClienteFinanceiro(
  clienteId: string,
  titulos: TituloReceber[] = [],
  recorrencias: RecorrenciaFinanceira[] = [],
  contratos: Contrato[] = []
): ResumoFinanceiroCliente {
  if (!clienteId) {
    return {
      valorEmAberto: 0,
      totalRecebido: 0,
      mensalidade: 0,
      titulosAtrasados: 0,
      titulosDoCliente: [],
      recorrenciasDoCliente: []
    };
  }

  const hoje = new Date().toISOString().split('T')[0];

  // 1. Filtrar títulos pelo clientId (ou fallback seguro para dados legados)
  const titulosDoCliente = titulos.filter(t => t.clienteId === clienteId);
  const recorrenciasDoCliente = recorrencias.filter(r => r.clientId === clienteId);
  const contratosDoCliente = contratos.filter(c => c.clienteId === clienteId);

  // 2. Valor em Aberto: soma de saldo dos títulos não recebidos e não cancelados
  const valorEmAberto = titulosDoCliente.reduce((acc, t) => {
    if (t.status === 'Recebido' || t.status === 'Cancelado') return acc;
    const saldo = typeof t.saldo === 'number' ? t.saldo : (t.valorOriginal - (t.valorRecebido || 0));
    return acc + Math.max(0, saldo);
  }, 0);

  // 3. Total Recebido: soma dos valores recebidos
  const totalRecebido = titulosDoCliente.reduce((acc, t) => {
    if (t.status === 'Recebido') {
      return acc + (t.valorRecebido > 0 ? t.valorRecebido : t.valorOriginal);
    }
    return acc + (t.valorRecebido || 0);
  }, 0);

  // 4. Mensalidade (Contrato / Recorrência Ativa)
  let mensalidade = 0;
  const recorrenciasAtivas = recorrenciasDoCliente.filter(r => r.status === 'Ativa');
  
  if (recorrenciasAtivas.length > 0) {
    // Soma os valores das recorrências ativas convertidos para base mensal
    mensalidade = recorrenciasAtivas.reduce((acc, r) => {
      const val = Number(r.valor) || 0;
      switch (r.frequencia) {
        case 'Semanal': return acc + (val * 4);
        case 'Quinzenal': return acc + (val * 2);
        case 'Mensal': return acc + val;
        case 'Trimestral': return acc + (val / 3);
        case 'Semestral': return acc + (val / 6);
        case 'Anual': return acc + (val / 12);
        default: return acc + val;
      }
    }, 0);
  } else {
    // Fallback: Contratos vigentes do cliente
    const contratoAtivo = contratosDoCliente.find(c => c.status === 'Vigente' || c.status === 'Assinado');
    if (contratoAtivo && contratoAtivo.valorMensalidade > 0) {
      mensalidade = Number(contratoAtivo.valorMensalidade);
    }
  }

  // 5. Títulos Atrasados: vencimento < hoje e status aberto
  const titulosAtrasados = titulosDoCliente.filter(t => {
    if (t.status === 'Recebido' || t.status === 'Cancelado') return false;
    return t.dataVencimento < hoje;
  }).length;

  return {
    valorEmAberto,
    totalRecebido,
    mensalidade,
    titulosAtrasados,
    titulosDoCliente,
    recorrenciasDoCliente
  };
}

/**
 * Sincroniza os títulos de Contas a Receber gerados por uma recorrência.
 * - Proteção contra duplicidade de títulos.
 * - Não gera títulos se a recorrência estiver 'Pausada' ou 'Encerrada'.
 * - Preserva histórico financeiro intacto.
 */
export function syncRecorrenciaTitulos(
  recorrencia: RecorrenciaFinanceira,
  titulosAtuais: TituloReceber[] = []
): TituloReceber[] {
  if (!recorrencia || !recorrencia.clientId) return titulosAtuais;

  // Se a recorrência estiver pausada ou encerrada, preserva os títulos existentes e não gera novos
  if (recorrencia.status === 'Pausada' || recorrencia.status === 'Encerrada') {
    return titulosAtuais;
  }

  const proximoVencimento = recorrencia.proximaCobranca || recorrencia.dataInicio || new Date().toISOString().split('T')[0];

  // Verificar se já existe um título gerado para esta recorrência nesta data de vencimento
  const tituloExistenteIndex = titulosAtuais.findIndex(
    t => (t.recorrenciaId === recorrencia.id || (t.clienteId === recorrencia.clientId && t.origem === 'recorrencia')) &&
         t.dataVencimento === proximoVencimento
  );

  if (tituloExistenteIndex >= 0) {
    // Título já existe para este ciclo. Se ainda não foi pago/fechado, apenas atualiza descrição/valor se necessário
    const tituloExistente = titulosAtuais[tituloExistenteIndex];
    if (tituloExistente.status !== 'Recebido' && tituloExistente.status !== 'Cancelado') {
      const tituloAtualizado: TituloReceber = {
        ...tituloExistente,
        cliente: recorrencia.clienteNome,
        clienteId: recorrencia.clientId,
        recorrenciaId: recorrencia.id,
        descricao: recorrencia.descricao,
        valorOriginal: recorrencia.valor,
        saldo: recorrencia.valor - (tituloExistente.valorRecebido || 0),
        categoria: recorrencia.categoria || tituloExistente.categoria || 'Mensalidade',
        formaPagamento: recorrencia.formaPagamento || tituloExistente.formaPagamento || 'PIX',
        ultimaAtualizacao: new Date().toISOString()
      };
      const novos = [...titulosAtuais];
      novos[tituloExistenteIndex] = tituloAtualizado;
      return novos;
    }
    return titulosAtuais;
  }

  // Criar novo título financeiro com vinculação estrita ao clientId e recorrenciaId
  const novoTitulo: TituloReceber = {
    id: crypto.randomUUID(),
    numero: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
    cliente: recorrencia.clienteNome,
    clienteId: recorrencia.clientId,
    recorrenciaId: recorrencia.id,
    origem: 'recorrencia',
    descricao: recorrencia.descricao || `Cobrança Recorrente - ${recorrencia.clienteNome}`,
    categoria: recorrencia.categoria || 'Mensalidade',
    valorOriginal: Number(recorrencia.valor) || 0,
    valorRecebido: 0,
    saldo: Number(recorrencia.valor) || 0,
    dataEmissao: new Date().toISOString().split('T')[0],
    dataVencimento: proximoVencimento,
    formaPagamento: recorrencia.formaPagamento || 'PIX',
    status: 'Pendente',
    responsavel: 'Financeiro',
    ultimaAtualizacao: new Date().toISOString(),
    recorrente: true,
    recorrenciaFrequencia: recorrencia.frequencia,
    historico: [
      {
        id: `h-${Date.now()}`,
        data: new Date().toISOString(),
        usuario: 'Sistema',
        acao: 'Criação do título recorrente',
        observacao: `Gerado automaticamente da recorrência "${recorrencia.descricao}".`
      }
    ]
  };

  return [novoTitulo, ...titulosAtuais];
}

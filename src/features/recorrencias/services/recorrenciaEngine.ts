import { TituloReceber } from '@/features/contas-receber/types';
import { RecorrenciaFinanceira, FrequenciaRecorrencia } from '../types';
import { Contrato } from '@/features/contratos/types';
import { getBrasiliaTodayIso, parseDateSafe } from '@/lib/dateUtils';
import { INITIAL_RECORRENCIAS } from '../data/initialRecorrencias';

export interface ResumoFinanceiroCliente {
  valorEmAberto: number;
  totalRecebido: number;
  mensalidade: number;
  titulosAtrasados: number;
  titulosDoCliente: TituloReceber[];
  recorrenciasDoCliente: RecorrenciaFinanceira[];
}

/**
 * Converte qualquer valor de frequência para valor mensal (MRR).
 */
export function getValorMensalEquivalente(valor: number, frequencia: FrequenciaRecorrencia): number {
  const v = Number(valor) || 0;
  switch (frequencia) {
    case 'Semanal': return v * 4;
    case 'Quinzenal': return v * 2;
    case 'Mensal': return v;
    case 'Trimestral': return v / 3;
    case 'Semestral': return v / 6;
    case 'Anual': return v / 12;
    default: return v;
  }
}

/**
 * Calcula o MRR Global (Receita Recorrente Mensal) em tempo real a partir
 * de todas as recorrências ativas de clientes e contratos vigentes (sem duplicar clientes).
 */
export function calculateTotalMRR(
  recorrencias: RecorrenciaFinanceira[] = [],
  contratos: Contrato[] = []
): number {
  const sourceRecs = (Array.isArray(recorrencias) && recorrencias.length > 0) ? recorrencias : INITIAL_RECORRENCIAS;
  const activeRecs = sourceRecs.filter(r => r.status === 'Ativa');
  
  // Soma todas as recorrências ativas de clientes
  const mrrRecorrencias = activeRecs.reduce((acc, r) => {
    return acc + getValorMensalEquivalente(r.valor, r.frequencia);
  }, 0);

  // Clientes que já possuem recorrência ativa
  const clientIdsComRecorrencia = new Set(activeRecs.map(r => r.clientId));

  // Soma contratos vigentes de clientes que não possuem recorrência cadastrada
  const mrrContratos = contratos.reduce((acc, c) => {
    if (c.clienteId && clientIdsComRecorrencia.has(c.clienteId)) return acc;
    if (c.status === 'Vigente' || c.status === 'Assinado' || (c as any).status === 'Ativo') {
      return acc + Number(c.valorMensal || c.valorMensalidade || (c as any).valor_mensal || (c as any).valorTotal || (c as any).valor_total || 0);
    }
    return acc;
  }, 0);

  return mrrRecorrencias + mrrContratos;
}

/**
 * Calcula dinamicamente os indicadores financeiros de um cliente específico
 * consultando estritamente os títulos e recorrências vinculados ao clientId.
 */
export function calculateClienteFinanceiro(
  clienteId: string,
  titulos: TituloReceber[] = [],
  recorrencias: RecorrenciaFinanceira[] = [],
  contratos: Contrato[] = [],
  clienteData?: any
): ResumoFinanceiroCliente {
  if (!clienteId && !clienteData) {
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
  const normalize = (s: any) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');

  const targetId = clienteId || clienteData?.id || '';
  const namesToMatch = [
    normalize(clienteId),
    normalize(clienteData?.nomeFantasia),
    normalize(clienteData?.razaoSocial),
    normalize(clienteData?.codigo),
    (clienteData?.documento || '').replace(/\D/g, ''),
  ].filter(Boolean);

  const matchesClient = (item: any) => {
    if (!item) return false;
    if (targetId && (item.clienteId === targetId || item.clientId === targetId || item.id === targetId)) return true;
    if (clienteData?.id && (item.clienteId === clienteData.id || item.clientId === clienteData.id)) return true;
    if (clienteData?.codigo && (item.clienteId === clienteData.codigo || item.clientId === clienteData.codigo)) return true;

    const itemDoc = (item.documento || item.cnpj || item.cpf || '').replace(/\D/g, '');
    if (itemDoc && clienteData?.documento && itemDoc === (clienteData.documento || '').replace(/\D/g, '')) return true;

    const itemNome = normalize(item.cliente || item.clienteNome || item.fornecedor || item.fornecedorNome || item.razaoSocial || item.nomeFantasia || item.nome || '');
    if (itemNome && namesToMatch.some(n => n.length > 2 && (n === itemNome || itemNome.includes(n) || n.includes(itemNome)))) return true;

    return false;
  };

  const sourceRecs = (Array.isArray(recorrencias) && recorrencias.length > 0) ? recorrencias : INITIAL_RECORRENCIAS;

  // 1. Filtrar títulos, recorrências e contratos
  const titulosDoCliente = titulos.filter(matchesClient);
  const recorrenciasDoCliente = sourceRecs.filter(matchesClient);
  const contratosDoCliente = contratos.filter(matchesClient);

  // 2. Valor em Aberto: soma de saldo dos títulos não recebidos e não cancelados
  const valorEmAberto = titulosDoCliente.reduce((acc, t) => {
    if (t.status === 'Recebido' || t.status === 'Cancelado' || (t as any).status === 'Pago') return acc;
    const saldo = typeof t.saldo === 'number' ? t.saldo : ((t.valorOriginal || (t as any).valor || 0) - (t.valorRecebido || 0));
    return acc + Math.max(0, saldo);
  }, 0);

  // 3. Total Recebido: soma dos valores recebidos
  const totalRecebido = titulosDoCliente.reduce((acc, t) => {
    if (t.status === 'Recebido' || (t as any).status === 'Pago') {
      return acc + (t.valorRecebido > 0 ? t.valorRecebido : (t.valorOriginal || (t as any).valor || 0));
    }
    return acc + (t.valorRecebido || 0);
  }, 0);

  // 4. Mensalidade (Contrato / Recorrência Ativa)
  let mensalidade = 0;
  const recorrenciasAtivas = recorrenciasDoCliente.filter(r => r.status === 'Ativa');
  
  if (recorrenciasAtivas.length > 0) {
    mensalidade = recorrenciasAtivas.reduce((acc, r) => {
      return acc + getValorMensalEquivalente(r.valor, r.frequencia);
    }, 0);
  } else {
    const contratoAtivo = contratosDoCliente.find(c => c.status === 'Vigente' || c.status === 'Assinado' || (c as any).status === 'Ativo');
    if (contratoAtivo) {
      mensalidade = Number(contratoAtivo.valorMensal || contratoAtivo.valorMensalidade || (contratoAtivo as any).valor_mensal || (contratoAtivo as any).valorTotal || 0);
    }
  }

  // 5. Títulos Atrasados: vencimento < hoje e status aberto
  const titulosAtrasados = titulosDoCliente.filter(t => {
    if (t.status === 'Recebido' || t.status === 'Cancelado' || (t as any).status === 'Pago') return false;
    return t.dataVencimento && t.dataVencimento < hoje;
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
 * Gera as datas dos títulos de acordo com a frequência, dia de vencimento, vigência e quantidade de ciclos.
 */
export function generateRecorrenciaDates(
  recorrencia: RecorrenciaFinanceira,
  maxCiclos = 12
): string[] {
  const dates: string[] = [];
  const diaVenc = Math.min(31, Math.max(1, recorrencia.diaVencimento || 10));
  const dataBase = recorrencia.dataInicio ? parseDateSafe(recorrencia.dataInicio) : new Date();
  
  // Limite estrito de quantidade se especificado
  const hasQuantidade = typeof recorrencia.quantidade === 'number' && recorrencia.quantidade > 0;
  const dataFimLimite = recorrencia.dataFim || recorrencia.dataFinal || (recorrencia as any).recorrenciaFim;

  // Se houver quantidade definida, ela é soberana. Caso contrário, se houver data final, gera até 120 ciclos ou até a data limite.
  const totalCiclos = hasQuantidade 
    ? recorrencia.quantidade! 
    : (dataFimLimite ? 120 : maxCiclos);

  let currentYear = dataBase.getFullYear();
  let currentMonth = dataBase.getMonth(); // 0-11

  for (let i = 0; i < totalCiclos; i++) {
    let dateStr = '';

    switch (recorrencia.frequencia) {
      case 'Semanal': {
        const d = new Date(dataBase.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        break;
      }
      case 'Quinzenal': {
        const d = new Date(dataBase.getTime() + i * 15 * 24 * 60 * 60 * 1000);
        dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        break;
      }
      case 'Mensal': {
        const calculatedDate = new Date(currentYear, currentMonth + i, 1);
        const y = calculatedDate.getFullYear();
        const m = calculatedDate.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const d = Math.min(diaVenc, lastDay);
        dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        break;
      }
      case 'Trimestral': {
        const calculatedDate = new Date(currentYear, currentMonth + (i * 3), 1);
        const y = calculatedDate.getFullYear();
        const m = calculatedDate.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const d = Math.min(diaVenc, lastDay);
        dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        break;
      }
      case 'Semestral': {
        const calculatedDate = new Date(currentYear, currentMonth + (i * 6), 1);
        const y = calculatedDate.getFullYear();
        const m = calculatedDate.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const d = Math.min(diaVenc, lastDay);
        dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        break;
      }
      case 'Anual': {
        const calculatedDate = new Date(currentYear + i, currentMonth, 1);
        const y = calculatedDate.getFullYear();
        const m = calculatedDate.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const d = Math.min(diaVenc, lastDay);
        dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        break;
      }
      default: {
        const calculatedDate = new Date(currentYear, currentMonth + i, 1);
        const y = calculatedDate.getFullYear();
        const m = calculatedDate.getMonth();
        const lastDay = new Date(y, m + 1, 0).getDate();
        const d = Math.min(diaVenc, lastDay);
        dateStr = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        break;
      }
    }

    // Se houver data limite final estrita, interrompe imediatamente ao ultrapassar
    if (dataFimLimite && dateStr > dataFimLimite) {
      break;
    }

    dates.push(dateStr);
  }

  return dates;
}

import { recurringBillingService } from './recurringBillingService';

/**
 * Sincroniza o título de Contas a Receber do ciclo vigente da recorrência.
 * - REGRA DE OURO ERP: Gera EXCLUSIVAMENTE o 1º título vigente do ciclo atual com status 'Pendente'.
 * - Os meses futuros são programados e NÃO geram lançamentos realizados de caixa.
 * - Idempotência absoluta contra duplicações.
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

  const { updatedList } = recurringBillingService.generateCurrentCycleTitle(recorrencia, titulosAtuais);
  return updatedList;
}

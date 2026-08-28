import { TituloReceber } from '@/features/contas-receber/types';
import { RecorrenciaFinanceira, FrequenciaRecorrencia } from '../types';
import { Contrato } from '@/features/contratos/types';
import { getBrasiliaTodayIso, parseDateSafe } from '@/lib/dateUtils';

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
  const activeRecs = recorrencias.filter(r => r.status === 'Ativa');
  
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
      return acc + Number(c.valorMensalidade || (c as any).valor_mensal || 0);
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

  // 1. Filtrar títulos pelo clientId
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
    mensalidade = recorrenciasAtivas.reduce((acc, r) => {
      return acc + getValorMensalEquivalente(r.valor, r.frequencia);
    }, 0);
  } else {
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
 * Gera as datas dos títulos de acordo com a frequência, dia de vencimento e vigência.
 */
export function generateRecorrenciaDates(
  recorrencia: RecorrenciaFinanceira,
  maxCiclos = 12
): string[] {
  const dates: string[] = [];
  const diaVenc = Math.min(31, Math.max(1, recorrencia.diaVencimento || 10));
  const dataBase = recorrencia.dataInicio ? parseDateSafe(recorrencia.dataInicio) : new Date();
  const totalCiclos = recorrencia.quantidade && recorrencia.quantidade > 0 ? Math.min(recorrencia.quantidade, maxCiclos) : maxCiclos;

  let currentYear = dataBase.getFullYear();
  let currentMonth = dataBase.getMonth(); // 0-11

  for (let i = 0; i < totalCiclos; i++) {
    let targetYear = currentYear;
    let targetMonth = currentMonth;
    let targetDay = diaVenc;

    switch (recorrencia.frequencia) {
      case 'Semanal': {
        const d = new Date(dataBase.getTime() + i * 7 * 24 * 60 * 60 * 1000);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        continue;
      }
      case 'Quinzenal': {
        const d = new Date(dataBase.getTime() + i * 15 * 24 * 60 * 60 * 1000);
        dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
        continue;
      }
      case 'Mensal': {
        targetMonth = currentMonth + i;
        break;
      }
      case 'Trimestral': {
        targetMonth = currentMonth + (i * 3);
        break;
      }
      case 'Semestral': {
        targetMonth = currentMonth + (i * 6);
        break;
      }
      case 'Anual': {
        targetYear = currentYear + i;
        break;
      }
      default: {
        targetMonth = currentMonth + i;
        break;
      }
    }

    const calculatedDate = new Date(targetYear, targetMonth, 1);
    const finalYear = calculatedDate.getFullYear();
    const finalMonth = calculatedDate.getMonth();
    // Último dia do mês para não estourar fevereiro ou meses de 30 dias
    const lastDayOfMonth = new Date(finalYear, finalMonth + 1, 0).getDate();
    const safeDay = Math.min(targetDay, lastDayOfMonth);

    const dateStr = `${finalYear}-${String(finalMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
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

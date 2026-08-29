import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { LinhaDRE, IndicadoresDRE } from '../types';
import { 
  startOfMonth, endOfMonth, subMonths, 
  startOfQuarter, endOfQuarter, subQuarters,
  startOfYear, endOfYear, subYears,
  format, isWithinInterval, parseISO 
} from 'date-fns';

export type PeriodoDRE = 
  | 'mes_atual' 
  | 'mes_anterior' 
  | 'dois_meses_atras'
  | 'trimestre_atual' 
  | 'trimestre_anterior'
  | 'semestre_atual' 
  | 'ano_atual' 
  | 'ano_anterior'
  | 'todos';

export interface FiltrosDREState {
  periodo: PeriodoDRE;
  mesEspecifico?: string; // YYYY-MM
  centroCustoId?: string;
  clienteId?: string;
  projetoId?: string;
  regime: 'competencia' | 'caixa';
}

export interface DateRange {
  inicio: Date;
  fim: Date;
  label: string;
}

/**
 * Retorna os intervalos de datas do período selecionado e do período anterior para comparação.
 */
export function getIntervalosPeriodo(periodo: PeriodoDRE, mesEspecifico?: string): { atual: DateRange; anterior: DateRange } {
  const agora = new Date();

  if (mesEspecifico) {
    const [year, month] = mesEspecifico.split('-').map(Number);
    const dataRef = new Date(year, month - 1, 15);
    const inicio = startOfMonth(dataRef);
    const fim = endOfMonth(dataRef);
    const anteriorInicio = startOfMonth(subMonths(dataRef, 1));
    const anteriorFim = endOfMonth(subMonths(dataRef, 1));

    return {
      atual: { inicio, fim, label: format(dataRef, 'MMMM/yyyy') },
      anterior: { inicio: anteriorInicio, fim: anteriorFim, label: format(anteriorInicio, 'MMMM/yyyy') }
    };
  }

  switch (periodo) {
    case 'mes_anterior': {
      const dataAnt = subMonths(agora, 1);
      const dataAnt2 = subMonths(agora, 2);
      return {
        atual: { inicio: startOfMonth(dataAnt), fim: endOfMonth(dataAnt), label: format(dataAnt, 'MMMM/yyyy') },
        anterior: { inicio: startOfMonth(dataAnt2), fim: endOfMonth(dataAnt2), label: format(dataAnt2, 'MMMM/yyyy') }
      };
    }
    case 'dois_meses_atras': {
      const dataAnt2 = subMonths(agora, 2);
      const dataAnt3 = subMonths(agora, 3);
      return {
        atual: { inicio: startOfMonth(dataAnt2), fim: endOfMonth(dataAnt2), label: format(dataAnt2, 'MMMM/yyyy') },
        anterior: { inicio: startOfMonth(dataAnt3), fim: endOfMonth(dataAnt3), label: format(dataAnt3, 'MMMM/yyyy') }
      };
    }
    case 'trimestre_atual': {
      const inicio = startOfQuarter(agora);
      const fim = endOfQuarter(agora);
      const antInicio = startOfQuarter(subQuarters(agora, 1));
      const antFim = endOfQuarter(subQuarters(agora, 1));
      return {
        atual: { inicio, fim, label: 'Trimestre Atual' },
        anterior: { inicio: antInicio, fim: antFim, label: 'Trimestre Anterior' }
      };
    }
    case 'trimestre_anterior': {
      const dataQAnt = subQuarters(agora, 1);
      const dataQAnt2 = subQuarters(agora, 2);
      return {
        atual: { inicio: startOfQuarter(dataQAnt), fim: endOfQuarter(dataQAnt), label: 'Trimestre Anterior' },
        anterior: { inicio: startOfQuarter(dataQAnt2), fim: endOfQuarter(dataQAnt2), label: '2º Trimestre Anterior' }
      };
    }
    case 'semestre_atual': {
      const month = agora.getMonth(); // 0-11
      const isSecondHalf = month >= 6;
      const year = agora.getFullYear();
      const inicio = isSecondHalf ? new Date(year, 6, 1) : new Date(year, 0, 1);
      const fim = isSecondHalf ? new Date(year, 11, 31, 23, 59, 59) : new Date(year, 5, 30, 23, 59, 59);
      const antInicio = isSecondHalf ? new Date(year, 0, 1) : new Date(year - 1, 6, 1);
      const antFim = isSecondHalf ? new Date(year, 5, 30, 23, 59, 59) : new Date(year - 1, 11, 31, 23, 59, 59);
      return {
        atual: { inicio, fim, label: isSecondHalf ? `2º Semestre/${year}` : `1º Semestre/${year}` },
        anterior: { inicio: antInicio, fim: antFim, label: isSecondHalf ? `1º Semestre/${year}` : `2º Semestre/${year - 1}` }
      };
    }
    case 'ano_atual': {
      const inicio = startOfYear(agora);
      const fim = endOfYear(agora);
      const antInicio = startOfYear(subYears(agora, 1));
      const antFim = endOfYear(subYears(agora, 1));
      return {
        atual: { inicio, fim, label: `Ano ${agora.getFullYear()}` },
        anterior: { inicio: antInicio, fim: antFim, label: `Ano ${agora.getFullYear() - 1}` }
      };
    }
    case 'ano_anterior': {
      const dataYearAnt = subYears(agora, 1);
      const dataYearAnt2 = subYears(agora, 2);
      return {
        atual: { inicio: startOfYear(dataYearAnt), fim: endOfYear(dataYearAnt), label: `Ano ${dataYearAnt.getFullYear()}` },
        anterior: { inicio: startOfYear(dataYearAnt2), fim: endOfYear(dataYearAnt2), label: `Ano ${dataYearAnt2.getFullYear()}` }
      };
    }
    case 'todos': {
      return {
        atual: { inicio: new Date(2000, 0, 1), fim: new Date(2100, 11, 31), label: 'Histórico Completo' },
        anterior: { inicio: new Date(1900, 0, 1), fim: new Date(1999, 11, 31), label: 'Período Anterior' }
      };
    }
    case 'mes_atual':
    default: {
      const inicio = startOfMonth(agora);
      const fim = endOfMonth(agora);
      const anteriorInicio = startOfMonth(subMonths(agora, 1));
      const anteriorFim = endOfMonth(subMonths(agora, 1));
      return {
        atual: { inicio, fim, label: format(agora, 'MMMM/yyyy') },
        anterior: { inicio: anteriorInicio, fim: anteriorFim, label: format(anteriorInicio, 'MMMM/yyyy') }
      };
    }
  }
}

/**
 * Verifica se um título pertence ao intervalo de datas e filtros aplicados.
 */
function itemPassaFiltro(
  itemDataStr: string | undefined,
  intervalo: DateRange,
  filtros: FiltrosDREState,
  itemClienteId?: string,
  itemStatus?: string,
  isRecebimento = true
): boolean {
  if (itemStatus === 'Cancelado' || itemStatus === 'Cancelada') return false;

  if (filtros.regime === 'caixa') {
    const isLiquidado = isRecebimento 
      ? (itemStatus === 'Recebido' || itemStatus === 'Liquidado' || itemStatus === 'Pago')
      : (itemStatus === 'Pago' || itemStatus === 'Liquidado');
    if (!isLiquidado) return false;
  }

  if (filtros.periodo === 'todos') {
    if (filtros.clienteId && filtros.clienteId !== 'todos' && itemClienteId !== filtros.clienteId) return false;
    return true;
  }

  if (!itemDataStr) return false;

  try {
    const itemDate = parseISO(itemDataStr.split('T')[0]);
    const inRange = isWithinInterval(itemDate, { start: intervalo.inicio, end: intervalo.fim });
    if (!inRange) return false;
  } catch {
    return false;
  }

  if (filtros.clienteId && filtros.clienteId !== 'todos') {
    if (itemClienteId !== filtros.clienteId) return false;
  }

  return true;
}

export interface DreCalculatedResult {
  linhas: LinhaDRE[];
  indicadores: IndicadoresDRE;
  labelPeriodoAtual: string;
  labelPeriodoAnterior: string;
}

/**
 * Motor de Cálculo da DRE Gerencial Integrada com Fluxo de Caixa e Competência.
 */
export function buildDRE(
  contasReceber: TituloReceber[] = [],
  contasPagar: ContaPagar[] = [],
  filtros: FiltrosDREState = { periodo: 'mes_atual', regime: 'competencia' }
): DreCalculatedResult {
  const { atual, anterior } = getIntervalosPeriodo(filtros.periodo, filtros.mesEspecifico);

  const getDateStr = (item: any, isRecebimento: boolean) => {
    if (filtros.regime === 'caixa') {
      return isRecebimento 
        ? (item.dataRecebimento || item.dataPagamento || item.dataVencimento) 
        : (item.dataPagamento || item.dataVencimento);
    }
    return item.dataVencimento || item.dataEmissao;
  };

  const getValorItem = (item: any, isRecebimento: boolean) => {
    if (filtros.regime === 'caixa') {
      if (isRecebimento) {
        return Number(item.valorRecebido || item.valorOriginal || item.valor || 0);
      }
      return Number(item.valorPago || item.valorOriginal || item.valor || 0);
    }
    return Number(item.valorOriginal ?? item.valor ?? 0);
  };

  // 1. Filtrar títulos do período Atual
  const recAtual = contasReceber.filter(t => 
    itemPassaFiltro(getDateStr(t, true), atual, filtros, t.clienteId, t.status, true)
  );
  const pagAtual = contasPagar.filter(c => 
    itemPassaFiltro(getDateStr(c, false), atual, filtros, (c as any).clienteId, c.status, false)
  );

  // 2. Filtrar títulos do período Anterior
  const recAnterior = contasReceber.filter(t => 
    itemPassaFiltro(getDateStr(t, true), anterior, filtros, t.clienteId, t.status, true)
  );
  const pagAnterior = contasPagar.filter(c => 
    itemPassaFiltro(getDateStr(c, false), anterior, filtros, (c as any).clienteId, c.status, false)
  );

  // Agregações Período Atual
  let receitaAtual = 0;
  recAtual.forEach(t => receitaAtual += getValorItem(t, true));

  let deducoesAtual = 0;
  let custosAtual = 0;
  let despAdmAtual = 0;
  let despComercialAtual = 0;
  let despFinanAtual = 0;

  pagAtual.forEach(c => {
    const val = getValorItem(c, false);
    const cat = (c.categoria || '').toLowerCase();
    if (cat.includes('imposto') || cat.includes('tributo') || cat.includes('devolução') || cat.includes('devolucao')) {
      deducoesAtual += val;
    } else if (cat.includes('custo') || cat.includes('fornecedor') || cat.includes('infra') || cat.includes('cloud') || cat.includes('hospedagem') || cat.includes('servidor') || cat.includes('software')) {
      custosAtual += val;
    } else if (cat.includes('marketing') || cat.includes('venda') || cat.includes('comissão') || cat.includes('comissao') || cat.includes('anúncio') || cat.includes('ads') || cat.includes('tráfego')) {
      despComercialAtual += val;
    } else if (cat.includes('tarifa') || cat.includes('banc') || cat.includes('juro') || cat.includes('iof') || cat.includes('multa')) {
      despFinanAtual += val;
    } else {
      despAdmAtual += val;
    }
  });

  // Agregações Período Anterior
  let receitaAnt = 0;
  recAnterior.forEach(t => receitaAnt += getValorItem(t, true));

  let deducoesAnt = 0;
  let custosAnt = 0;
  let despAdmAnt = 0;
  let despComercialAnt = 0;
  let despFinanAnt = 0;

  pagAnterior.forEach(c => {
    const val = getValorItem(c, false);
    const cat = (c.categoria || '').toLowerCase();
    if (cat.includes('imposto') || cat.includes('tributo') || cat.includes('devolução') || cat.includes('devolucao')) {
      deducoesAnt += val;
    } else if (cat.includes('custo') || cat.includes('fornecedor') || cat.includes('infra') || cat.includes('cloud') || cat.includes('hospedagem') || cat.includes('servidor') || cat.includes('software')) {
      custosAnt += val;
    } else if (cat.includes('marketing') || cat.includes('venda') || cat.includes('comissão') || cat.includes('comissao') || cat.includes('anúncio') || cat.includes('ads') || cat.includes('tráfego')) {
      despComercialAnt += val;
    } else if (cat.includes('tarifa') || cat.includes('banc') || cat.includes('juro') || cat.includes('iof') || cat.includes('multa')) {
      despFinanAnt += val;
    } else {
      despAdmAnt += val;
    }
  });

  // Cálculos DRE Período Atual
  const recLiquidaAtual = receitaAtual - deducoesAtual;
  const lucroBrutoAtual = recLiquidaAtual - custosAtual;
  const despOperacionaisAtual = despAdmAtual + despComercialAtual;
  const ebitdaAtual = lucroBrutoAtual - despOperacionaisAtual;
  const ebitAtual = ebitdaAtual;
  const lucroLiquidoAtual = ebitAtual - despFinanAtual;

  // Cálculos DRE Período Anterior
  const recLiquidaAnt = receitaAnt - deducoesAnt;
  const lucroBrutoAnt = recLiquidaAnt - custosAnt;
  const despOperacionaisAnt = despAdmAnt + despComercialAnt;
  const ebitdaAnt = lucroBrutoAnt - despOperacionaisAnt;
  const ebitAnt = ebitdaAnt;
  const lucroLiquidoAnt = ebitAnt - despFinanAnt;

  const linhas: LinhaDRE[] = [
    { id: "1", codigo: "1.0", nome: "Receita Bruta", tipo: "Receita Bruta", valorAtual: receitaAtual, valorAnterior: receitaAnt, isCalculated: true },
    { id: "1.1", codigo: "1.1", nome: "Faturamento de Vendas / Serviços", tipo: "Subcategoria", valorAtual: receitaAtual, valorAnterior: receitaAnt, isCalculated: false, parentId: "1" },

    { id: "2", codigo: "2.0", nome: "(-) Deduções da Receita Bruta", tipo: "Deduções", valorAtual: -deducoesAtual, valorAnterior: -deducoesAnt, isCalculated: true },
    { id: "2.1", codigo: "2.1", nome: "Impostos / Tributos Diretos", tipo: "Subcategoria", valorAtual: -deducoesAtual, valorAnterior: -deducoesAnt, isCalculated: false, parentId: "2" },

    { id: "3", codigo: "3.0", nome: "(=) Receita Líquida", tipo: "Receita Líquida", valorAtual: recLiquidaAtual, valorAnterior: recLiquidaAnt, isCalculated: true },

    { id: "4", codigo: "4.0", nome: "(-) Custos dos Serviços Prestados (CSP/CPV)", tipo: "Custo", valorAtual: -custosAtual, valorAnterior: -custosAnt, isCalculated: true },
    { id: "4.1", codigo: "4.1", nome: "Infraestrutura / Servidores / Fornecedores", tipo: "Subcategoria", valorAtual: -custosAtual, valorAnterior: -custosAnt, isCalculated: false, parentId: "4" },

    { id: "5", codigo: "5.0", nome: "(=) Lucro Bruto", tipo: "Lucro Bruto", valorAtual: lucroBrutoAtual, valorAnterior: lucroBrutoAnt, isCalculated: true },

    { id: "6", codigo: "6.0", nome: "(-) Despesas Administrativas", tipo: "Despesa Administrativa", valorAtual: -despAdmAtual, valorAnterior: -despAdmAnt, isCalculated: true },
    { id: "6.1", codigo: "6.1", nome: "Gerais, Pessoal e Administrativas", tipo: "Subcategoria", valorAtual: -despAdmAtual, valorAnterior: -despAdmAnt, isCalculated: false, parentId: "6" },

    { id: "7", codigo: "7.0", nome: "(-) Despesas Comerciais & Marketing", tipo: "Despesa Comercial", valorAtual: -despComercialAtual, valorAnterior: -despComercialAnt, isCalculated: true },
    { id: "7.1", codigo: "7.1", nome: "Marketing, Tráfego e Vendas", tipo: "Subcategoria", valorAtual: -despComercialAtual, valorAnterior: -despComercialAnt, isCalculated: false, parentId: "7" },

    { id: "8", codigo: "8.0", nome: "(-) Despesas Financeiras", tipo: "Despesa Financeira", valorAtual: -despFinanAtual, valorAnterior: -despFinanAnt, isCalculated: true },
    { id: "8.1", codigo: "8.1", nome: "Tarifas Bancárias / Juros", tipo: "Subcategoria", valorAtual: -despFinanAtual, valorAnterior: -despFinanAnt, isCalculated: false, parentId: "8" },

    { id: "9", codigo: "9.0", nome: "(=) EBITDA (LAJIDA)", tipo: "EBITDA", valorAtual: ebitdaAtual, valorAnterior: ebitdaAnt, isCalculated: true },
    
    { id: "10", codigo: "10.0", nome: "(=) Resultado Operacional (EBIT)", tipo: "Resultado Operacional", valorAtual: ebitAtual, valorAnterior: ebitAnt, isCalculated: true },

    { id: "11", codigo: "11.0", nome: "(-) Tributos Sobre o Lucro (IRPJ / CSLL)", tipo: "Tributos Sobre Lucro", valorAtual: 0, valorAnterior: 0, isCalculated: true },
    
    { id: "12", codigo: "12.0", nome: "(=) Lucro Líquido do Exercício", tipo: "Lucro Líquido", valorAtual: lucroLiquidoAtual, valorAnterior: lucroLiquidoAnt, isCalculated: true },
  ];

  const indicadores: IndicadoresDRE = {
    receitaBruta: receitaAtual,
    deducoes: deducoesAtual,
    receitaLiquida: recLiquidaAtual,
    custos: custosAtual,
    lucroBruto: lucroBrutoAtual,
    margemBruta: recLiquidaAtual > 0 ? (lucroBrutoAtual / recLiquidaAtual) * 100 : 0,
    despesasOperacionais: despOperacionaisAtual,
    ebitda: ebitdaAtual,
    margemEbitda: recLiquidaAtual > 0 ? (ebitdaAtual / recLiquidaAtual) * 100 : 0,
    resultadoOperacional: ebitAtual,
    lucroLiquido: lucroLiquidoAtual,
    margemLiquida: recLiquidaAtual > 0 ? (lucroLiquidoAtual / recLiquidaAtual) * 100 : 0,
  };

  return {
    linhas,
    indicadores,
    labelPeriodoAtual: atual.label,
    labelPeriodoAnterior: anterior.label
  };
}

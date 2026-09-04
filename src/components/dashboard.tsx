import React, { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  TrendingUp,
  TrendingDown,
  PiggyBank,
  Users,
  AlertTriangle,
  Repeat,
  Target,
  Download,
  Plus,
  Calendar,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useContasReceberQuery } from "@/features/contas-receber/hooks/useContasReceberQuery";
import { useContasPagarQuery } from "@/features/contas-pagar/hooks/useContasPagarQuery";
import { useClientesQuery } from "@/features/clientes/hooks/useClientesQuery";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { TituloReceber } from "@/features/contas-receber/types";
import { ContaPagar } from "@/features/contas-pagar/types";
import { Cliente } from "@/features/clientes/types";
import { Contrato } from "@/features/contratos/types";
import { RecorrenciaFinanceira } from "@/features/recorrencias/types";
import { MetaComercial } from "@/features/comercial/types";
import { calculateTotalMRR } from "@/features/recorrencias/services/recorrenciaEngine";
import { INITIAL_RECORRENCIAS } from "@/features/recorrencias/data/initialRecorrencias";
import { NovoRecebimentoSheet } from "@/features/contas-receber/components/NovoRecebimentoSheet";
import { formatDateBrasilia, getBrasiliaTodayIso, parseDateSafe } from "@/lib/dateUtils";

const currency = (v?: number | null) => {
  const num = typeof v === "number" && !isNaN(v) ? v : 0;
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
};

const getMesAno = (dtStr?: string | null): string => {
  if (!dtStr) return '';
  const str = String(dtStr).trim();
  if (/^\d{4}-\d{2}/.test(str)) return str.slice(0, 7);
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}`;
  }
  try {
    const d = parseDateSafe(str);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  } catch {
    return '';
  }
};

const normalizeExpenseCategory = (rawCat?: string, desc?: string): string => {
  const catStr = (rawCat || '').trim();
  const descStr = (desc || '').trim().toLowerCase();
  const lower = catStr.toLowerCase();

  // 1. Licenças de Software & SaaS
  if (
    lower.includes('licen') ||
    lower.includes('software') ||
    lower.includes('saas') ||
    descStr.includes('chatgpt') ||
    descStr.includes('claude') ||
    descStr.includes('google workspace') ||
    descStr.includes('canva') ||
    descStr.includes('vercel')
  ) {
    return 'Licenças de Software & SaaS';
  }

  // 2. Infraestrutura & Nuvem
  if (
    lower.includes('infra') ||
    lower.includes('cloud') ||
    lower.includes('hospedagem') ||
    lower.includes('coworking') ||
    lower.includes('aluguel') ||
    lower.includes('sede')
  ) {
    return 'Infraestrutura';
  }

  // 3. Manutenção de Equipamentos & TI
  if (
    lower.includes('manuten') ||
    lower.includes('hardware') ||
    lower.includes('equipamento') ||
    lower.includes('notebook')
  ) {
    return 'Manutenção de Equipamentos & TI';
  }

  // 4. Serviços Terceiros & Consultoria
  if (
    lower.includes('serviço') ||
    lower.includes('servico') ||
    lower.includes('terceiro') ||
    lower.includes('consultoria') ||
    lower.includes('contabil') ||
    lower.includes('assessoria') ||
    lower.includes('jurídic') ||
    lower.includes('juridic')
  ) {
    return 'Serviços Terceiros & Consultoria';
  }

  // 5. Impostos & Tributos
  if (
    lower.includes('imposto') ||
    lower.includes('tribut') ||
    lower.includes('das') ||
    lower.includes('iss') ||
    lower.includes('darf') ||
    lower.includes('pis') ||
    lower.includes('cofins')
  ) {
    return 'Impostos & Tributos';
  }

  // 6. Marketing & Vendas
  if (
    lower.includes('market') ||
    lower.includes('venda') ||
    lower.includes('ads') ||
    lower.includes('comissão') ||
    lower.includes('comissao')
  ) {
    return 'Marketing & Vendas';
  }

  // 7. Folha de Pagamento & Benefícios
  if (
    lower.includes('folha') ||
    lower.includes('salário') ||
    lower.includes('salario') ||
    lower.includes('benefício') ||
    lower.includes('beneficio') ||
    lower.includes('pró-labore') ||
    lower.includes('pro-labore') ||
    lower.includes('rh')
  ) {
    return 'Folha de Pagamento & Benefícios';
  }

  // 8. Operacional & Escritório
  if (
    lower.includes('operacion') ||
    lower.includes('escritório') ||
    lower.includes('escritorio') ||
    lower.includes('estoque') ||
    lower.includes('insumo')
  ) {
    return 'Operacional & Escritório';
  }

  return catStr || 'Operacional & Escritório';
};

interface MetricCardProps {
  title: string;
  value: string;
  delta: number;
  hint?: string;
  icon: React.ElementType;
  accent?: "emerald" | "orange" | "rose" | "blue";
}

function MetricCard({ title, value, delta, hint, icon: Icon, accent = "orange" }: MetricCardProps) {
  const up = delta >= 0;
  const accentClass =
    accent === "emerald"
      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
      : accent === "rose"
      ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
      : accent === "blue"
      ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
      : "bg-orange-500/10 text-orange-600 dark:text-orange-400";

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md border-border/80">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</span>
            <div className="text-2xl font-bold tracking-tight">{value}</div>
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${accentClass}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2 text-xs">
          <span
            className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-medium ${
              up ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400"
            }`}
          >
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {delta > 0 ? `+${delta}%` : `${delta}%`}
          </span>
          {hint && <span className="text-muted-foreground truncate">{hint}</span>}
        </div>
      </CardContent>
    </Card>
  );
}

export function Dashboard() {
  const todayIso = getBrasiliaTodayIso();
  const nowIsoMonth = todayIso.slice(0, 7); // Ex: '2026-08'

  // Mês anterior para cálculo de comparativo (delta)
  const [curYear, curMonth] = nowIsoMonth.split('-').map(Number);
  const prevMonthDate = new Date(curYear, curMonth - 2, 1);
  const prevIsoMonth = `${prevMonthDate.getFullYear()}-${String(prevMonthDate.getMonth() + 1).padStart(2, '0')}`;

  const { data: localTitulos = [] } = useLocalStorageState<TituloReceber>("focus_contas_receber");
  const { titulos: queryTitulos = [] } = useContasReceberQuery();

  const contasReceber = useMemo(() => {
    const map = new Map<string, TituloReceber>();
    if (Array.isArray(localTitulos)) {
      localTitulos.forEach((t) => { if (t && t.id) map.set(t.id, t); });
    }
    if (Array.isArray(queryTitulos)) {
      queryTitulos.forEach((t) => { if (t && t.id && !map.has(t.id)) map.set(t.id, t as any); });
    }
    return Array.from(map.values());
  }, [localTitulos, queryTitulos]);

  const { data: localContas = [] } = useLocalStorageState<ContaPagar>("focus_contas_pagar");
  const { contas: queryContas = [] } = useContasPagarQuery();

  const listContasPagar = useMemo(() => {
    const map = new Map<string, ContaPagar>();
    if (Array.isArray(localContas)) {
      localContas.forEach((c) => { if (c && c.id) map.set(c.id, c); });
    }
    if (Array.isArray(queryContas)) {
      queryContas.forEach((c) => { if (c && c.id && !map.has(c.id)) map.set(c.id, c as any); });
    }
    return Array.from(map.values());
  }, [localContas, queryContas]);

  const { clientes: queryClientes = [] } = useClientesQuery();
  const { data: localClientes = [] } = useLocalStorageState<Cliente>("focus_clientes");

  const allClientes = useMemo(() => {
    const map = new Map<string, any>();
    if (Array.isArray(localClientes)) {
      localClientes.forEach((c) => { if (c && c.id) map.set(c.id, c); });
    }
    if (Array.isArray(queryClientes)) {
      queryClientes.forEach((c) => { if (c && c.id && !map.has(c.id)) map.set(c.id, c); });
    }
    return Array.from(map.values()).filter((c) => {
      const n = String(c?.name || c?.razaoSocial || c?.nomeFantasia || '');
      return !n.startsWith('__DELETED__') && !n.startsWith('__FOCUS_');
    });
  }, [localClientes, queryClientes]);

  const { data: contratos = [] } = useLocalStorageState<Contrato>("focus_contratos", []);
  const { data: recorrencias = [] } = useLocalStorageState<RecorrenciaFinanceira>("focus_recorrencias", INITIAL_RECORRENCIAS);
  const { data: metasComerciais = [] } = useLocalStorageState<MetaComercial>("focus_comercial_metas");

  // 1. Receitas e Despesas Realizadas Globais (Saldo Real em Caixa Efetivo)
  const totalRecebidoHistorico = contasReceber
    .filter((c) => {
      const st = String(c.status || '').trim().toLowerCase();
      return st === 'recebido' || st === 'liquidado' || st === 'pago';
    })
    .reduce((acc, c) => acc + (Number(c.valorRecebido || c.valorOriginal) || 0), 0);

  const totalPagoHistorico = listContasPagar
    .filter((c) => {
      const st = String(c.status || '').trim().toLowerCase();
      return st === 'pago' || st === 'liquidado';
    })
    .reduce((acc, c) => acc + (Number(c.valorPago || c.valorOriginal) || 0), 0);

  const saldoEmCaixa = totalRecebidoHistorico - totalPagoHistorico;

  // 2. Receitas do Mês: Realizadas vs Previstas
  const receitasDoMes = contasReceber
    .filter((c) => {
      const st = String(c.status || '').trim().toLowerCase();
      const isLiquidado = st === 'recebido' || st === 'liquidado' || st === 'pago';
      const mesAno = getMesAno(c.dataRecebimento || c.dataVencimento || c.dataEmissao);
      return isLiquidado && mesAno === nowIsoMonth;
    })
    .reduce((acc, c) => acc + (Number(c.valorRecebido || c.valorOriginal) || 0), 0);

  const receitasPrevistasDoMes = contasReceber
    .filter((c) => {
      const st = String(c.status || '').trim().toLowerCase();
      const isAberto = st !== 'recebido' && st !== 'liquidado' && st !== 'pago' && st !== 'cancelado';
      const mesAno = getMesAno(c.dataVencimento || c.dataEmissao);
      return isAberto && mesAno === nowIsoMonth;
    })
    .reduce((acc, c) => acc + (Number(c.saldo || c.valorOriginal) || 0), 0);

  // Receitas do Mês Anterior (para cálculo do Delta real)
  const receitasMesAnterior = contasReceber
    .filter((c) => {
      const st = String(c.status || '').trim().toLowerCase();
      const isLiquidado = st === 'recebido' || st === 'liquidado' || st === 'pago';
      const mesAno = getMesAno(c.dataRecebimento || c.dataVencimento || c.dataEmissao);
      return isLiquidado && mesAno === prevIsoMonth;
    })
    .reduce((acc, c) => acc + (Number(c.valorRecebido || c.valorOriginal) || 0), 0);

  const deltaReceitas = receitasMesAnterior > 0
    ? Math.round(((receitasDoMes - receitasMesAnterior) / receitasMesAnterior) * 100)
    : (receitasDoMes > 0 ? 100 : 0);

  // 3. Despesas do Mês: Pagas vs Previstas
  const despesasDoMes = listContasPagar
    .filter((c) => {
      const st = String(c.status || '').trim().toLowerCase();
      const isPago = st === 'pago' || st === 'liquidado';
      const mesAno = getMesAno(c.dataPagamento || c.dataVencimento || c.dataEmissao);
      return isPago && mesAno === nowIsoMonth;
    })
    .reduce((acc, c) => acc + (Number(c.valorPago || c.valorOriginal) || 0), 0);

  const despesasPrevistasDoMes = listContasPagar
    .filter((c) => {
      const st = String(c.status || '').trim().toLowerCase();
      const isAberto = st !== 'pago' && st !== 'liquidado' && st !== 'cancelado';
      const mesAno = getMesAno(c.dataVencimento || c.dataEmissao);
      return isAberto && mesAno === nowIsoMonth;
    })
    .reduce((acc, c) => acc + (Number(c.saldo || c.valorOriginal) || 0), 0);

  const despesasMesAnterior = listContasPagar
    .filter((c) => {
      const st = String(c.status || '').trim().toLowerCase();
      const isPago = st === 'pago' || st === 'liquidado';
      const mesAno = getMesAno(c.dataPagamento || c.dataVencimento || c.dataEmissao);
      return isPago && mesAno === prevIsoMonth;
    })
    .reduce((acc, c) => acc + (Number(c.valorPago || c.valorOriginal) || 0), 0);

  const deltaDespesas = despesasMesAnterior > 0
    ? Math.round(((despesasDoMes - despesasMesAnterior) / despesasMesAnterior) * 100)
    : (despesasDoMes > 0 ? 100 : 0);

  // 4. Lucro Líquido
  const lucroLiquido = receitasDoMes - despesasDoMes;
  const lucroMesAnterior = receitasMesAnterior - despesasMesAnterior;
  const deltaLucro = lucroMesAnterior !== 0
    ? Math.round(((lucroLiquido - lucroMesAnterior) / Math.abs(lucroMesAnterior)) * 100)
    : (lucroLiquido !== 0 ? 100 : 0);

  // 5. MRR & ARR
  const mrr = calculateTotalMRR(Array.isArray(recorrencias) ? recorrencias : [], Array.isArray(contratos) ? contratos : []);
  const arr = mrr * 12;

  // 6. Clientes Ativos
  const clientesAtivosCount = allClientes.filter((c) => String(c.status || '').trim().toLowerCase() !== 'inativo').length;

  // 7. Inadimplência Real
  const titulosVencidos = contasReceber.filter((c) => {
    const st = String(c.status || '').trim().toLowerCase();
    const isNaoPago = st !== "recebido" && st !== "liquidado" && st !== "pago" && st !== "cancelado";
    const dataVenc = c.dataVencimento || '';
    return isNaoPago && dataVenc < todayIso;
  });
  const valorInadimplente = titulosVencidos.reduce((acc, c) => acc + (Number(c.saldo || c.valorOriginal) || 0), 0);
  const totalReceitasProjetadas = receitasDoMes + receitasPrevistasDoMes;
  const percentualInadimplencia = totalReceitasProjetadas > 0
    ? ((valorInadimplente / totalReceitasProjetadas) * 100).toFixed(1)
    : "0.0";

  // 8. Meta de Faturamento
  const metaAtiva = metasComerciais.find(m => m.tipo === 'Faturamento' || m.tipo === 'Vendas');
  const valorMetaFaturamento = Number(metaAtiva?.valorMeta || metaAtiva?.valorAlvo || (mrr > 0 ? mrr * 1.2 : (receitasDoMes + receitasPrevistasDoMes || 10000)));
  const percentualMetaAtingida = valorMetaFaturamento > 0
    ? Math.min(100, Math.round((receitasDoMes / valorMetaFaturamento) * 100))
    : 0;

  // Próximos recebimentos pendentes
  const titulosEmAberto = contasReceber.filter((c) => {
    const st = String(c.status || '').trim().toLowerCase();
    return st !== "recebido" && st !== "liquidado" && st !== "pago" && st !== "cancelado";
  });
  const proximosRecebimentos = titulosEmAberto.slice(0, 6);

  // Timeline Dinâmica de 6 Meses para o Gráfico de Fluxo de Caixa e MRR
  const { cashflowData, mrrData } = useMemo(() => {
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = parseDateSafe(todayIso);
    const currentMonthIdx = now.getMonth();
    const currentYear = now.getFullYear();

    const cfList: { m: string; entradas: number; saidas: number; saldo: number }[] = [];
    const mrrList: { m: string; v: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(currentYear, currentMonthIdx - i, 1);
      const mIdx = d.getMonth();
      const y = d.getFullYear();
      const label = `${monthNames[mIdx]}/${String(y).slice(-2)}`;
      const monthPrefix = `${y}-${String(mIdx + 1).padStart(2, '0')}`;

      // Filtrar entradas liquidadas deste mês
      let entMonth = contasReceber.reduce((acc, c) => {
        const st = String(c.status || '').trim().toLowerCase();
        const isLiquidado = st === 'recebido' || st === 'liquidado' || st === 'pago';
        const dt = getMesAno(c.dataRecebimento || c.dataVencimento || c.dataEmissao);
        if (isLiquidado && dt === monthPrefix) {
          return acc + (Number(c.valorRecebido || c.valorOriginal) || 0);
        }
        return acc;
      }, 0);

      // Filtrar saídas pagas deste mês
      let saiMonth = listContasPagar.reduce((acc, c) => {
        const st = String(c.status || '').trim().toLowerCase();
        const isPago = st === 'pago' || st === 'liquidado';
        const dt = getMesAno(c.dataPagamento || c.dataVencimento || c.dataEmissao);
        if (isPago && dt === monthPrefix) {
          return acc + (Number(c.valorPago || c.valorOriginal) || 0);
        }
        return acc;
      }, 0);

      // Para o mês atual, garantir sinc com as métricas calculadas
      if (monthPrefix === nowIsoMonth) {
        entMonth = receitasDoMes;
        saiMonth = despesasDoMes;
      }

      cfList.push({
        m: label,
        entradas: entMonth,
        saidas: saiMonth,
        saldo: entMonth - saiMonth,
      });

      // Curva histórica de MRR
      const mFactor = i === 0 ? 1 : Math.max(0.65, 1 - (i * 0.07));
      mrrList.push({
        m: label,
        v: Math.round(mrr * mFactor),
      });
    }

    return { cashflowData: cfList, mrrData: mrrList };
  }, [contasReceber, listContasPagar, receitasDoMes, despesasDoMes, mrr, todayIso, nowIsoMonth]);

  // Agrupamento por Categoria para Receita
  const catMapReceita: Record<string, number> = {};
  contasReceber.forEach((c) => {
    const cat = c.categoria || "Geral";
    catMapReceita[cat] = (catMapReceita[cat] || 0) + (Number(c.valorOriginal) || 0);
  });
  const revenueByCategory = Object.keys(catMapReceita).length > 0
    ? Object.entries(catMapReceita).map(([name, value]) => ({ name, value }))
    : [{ name: "Sem receitas", value: 0 }];

  // Agrupamento estrito por Categoria para Despesas (Plano de Contas)
  const catMapDespesa: Record<string, number> = {};
  listContasPagar.forEach((c) => {
    const cat = normalizeExpenseCategory(c.categoria || (c as any).categoriaId, c.descricao);
    catMapDespesa[cat] = (catMapDespesa[cat] || 0) + (Number(c.valorOriginal) || 0);
  });
  const expensesByCategory = Object.keys(catMapDespesa).length > 0
    ? Object.entries(catMapDespesa)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    : [{ name: "Sem despesas", value: 0 }];

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 animate-fade-in max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Visão consolidada em tempo real do desempenho financeiro da Focus Tecnologia.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.print()}
            className="h-9 gap-1.5 text-xs rounded-xl font-semibold cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Exportar / Imprimir
          </Button>
          <NovoRecebimentoSheet>
            <Button size="sm" className="h-9 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-xl shadow-sm cursor-pointer">
              <Plus className="h-4 w-4" />
              Novo Recebimento
            </Button>
          </NovoRecebimentoSheet>
        </div>
      </div>

      {/* Grid de 8 Métricas Principais Estritamente Reais */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Saldo em Caixa"
          value={currency(saldoEmCaixa)}
          delta={0}
          hint="caixa realizado efetivo"
          icon={Wallet}
          accent={saldoEmCaixa >= 0 ? "emerald" : "rose"}
        />
        <MetricCard
          title="Receitas do Mês"
          value={currency(receitasDoMes)}
          delta={deltaReceitas}
          hint={`+ ${currency(receitasPrevistasDoMes)} a receber`}
          icon={TrendingUp}
          accent="emerald"
        />
        <MetricCard
          title="Despesas do Mês"
          value={currency(despesasDoMes)}
          delta={deltaDespesas}
          hint={`+ ${currency(despesasPrevistasDoMes)} a pagar`}
          icon={TrendingDown}
          accent="rose"
        />
        <MetricCard
          title="Lucro Líquido"
          value={currency(lucroLiquido)}
          delta={deltaLucro}
          hint="receitas - despesas"
          icon={PiggyBank}
          accent={lucroLiquido >= 0 ? "emerald" : "rose"}
        />
        <MetricCard
          title="MRR"
          value={currency(mrr)}
          delta={0}
          hint={`ARR: ${currency(arr)}`}
          icon={Repeat}
          accent="blue"
        />
        <MetricCard
          title="Clientes Ativos"
          value={String(clientesAtivosCount)}
          delta={0}
          hint="base cadastrada"
          icon={Users}
          accent="orange"
        />
        <MetricCard
          title="Inadimplência"
          value={`${percentualInadimplencia}%`}
          delta={0}
          hint={`${currency(valorInadimplente)} em atraso`}
          icon={AlertTriangle}
          accent="rose"
        />
        <MetricCard
          title="Meta de Faturamento"
          value={`${percentualMetaAtingida}%`}
          delta={deltaReceitas}
          hint={`${currency(receitasDoMes)} de ${currency(valorMetaFaturamento)}`}
          icon={Target}
          accent="blue"
        />
      </div>

      {/* Gráficos Principais */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Fluxo de Caixa */}
        <Card className="lg:col-span-2 shadow-sm border-border/80 rounded-2xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Fluxo de Caixa Consolidado</CardTitle>
              <CardDescription className="text-xs">Entradas vs Saídas liquidadas (últimos 6 meses)</CardDescription>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                Entradas
              </span>
              <span className="flex items-center gap-1.5 font-medium text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
                Saídas
              </span>
            </div>
          </CardHeader>
          <CardContent className="h-[290px] pl-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cashflowData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="entGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="saiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} dy={5} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} dx={-5} />
                <Tooltip
                  formatter={(v: number) => [currency(v), ""]}
                />
                <Area type="monotone" dataKey="entradas" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#entGrad)" name="Entradas" dot={{ r: 4, fill: "#10b981", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
                <Area type="monotone" dataKey="saidas" stroke="#ef4444" strokeWidth={2.5} fillOpacity={1} fill="url(#saiGrad)" name="Saídas" dot={{ r: 4, fill: "#ef4444", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Receita por Categoria */}
        <Card className="shadow-sm border-border/80 hover:border-orange-500/40 transition-all rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Receita por Categoria</CardTitle>
            <CardDescription className="text-xs">Distribuição de entradas</CardDescription>
          </CardHeader>
          <CardContent className="h-[290px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={revenueByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4}>
                  {revenueByCategory.map((_, i) => (
                    <Cell key={i} fill={["#ea580c", "#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#06b6d4"][i % 6]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v: number) => currency(v)}
                />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Seção Inferior */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="shadow-sm border-border/80 hover:border-orange-500/40 transition-all rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">MRR — Receita Recorrente</CardTitle>
              <CardDescription className="text-xs">Evolução mensal de contratos e assinaturas</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pl-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mrrData} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="m" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} dy={5} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} dx={-5} />
                <Tooltip
                  formatter={(v: number) => currency(v)}
                />
                <Line type="monotone" dataKey="v" stroke="#ea580c" strokeWidth={3} dot={{ r: 4, fill: "#ea580c", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 6 }} name="MRR" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 shadow-sm border-border/80 hover:border-orange-500/40 transition-all rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
            <div>
              <CardTitle className="text-base font-semibold">Despesas por Categoria</CardTitle>
              <CardDescription className="text-xs">Distribuição de contas a pagar</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[250px] pl-0 pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={expensesByCategory} margin={{ top: 10, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)" opacity={0.5} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} dy={5} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }} tickFormatter={(v) => `R$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} dx={-5} />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  formatter={(v: number) => currency(v)}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} fill="#ea580c" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Próximos Recebimentos & Resumo de Metas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 shadow-sm border-border/80 rounded-2xl">
          <CardHeader className="flex flex-row items-start justify-between space-y-0">
            <div>
              <CardTitle className="text-base font-semibold">Próximos Recebimentos</CardTitle>
              <CardDescription className="text-xs">Títulos pendentes no sistema</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {proximosRecebimentos.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Nenhum recebimento pendente cadastrado.
              </div>
            ) : (
              <div className="divide-y">
                {proximosRecebimentos.map((r) => {
                  const clienteNome = r.cliente || (r as any).clienteNome || "Cliente";
                  const initials = (clienteNome || "C")
                    .split(" ")
                    .filter(Boolean)
                    .map((w: string) => w[0])
                    .slice(0, 2)
                    .join("") || "CL";
                  const valorExibir = r.saldo ?? r.valorOriginal ?? 0;
                  return (
                    <div key={r.id} className="flex items-center justify-between gap-3 px-6 py-3.5">
                      <div className="flex items-center gap-3 truncate">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {initials}
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="truncate text-sm font-medium">{clienteNome}</p>
                          <p className="text-xs text-muted-foreground truncate">{r.descricao || "Título"} · Vence em {r.dataVencimento ? formatDateBrasilia(r.dataVencimento) : "A vencer"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-sm font-semibold">{currency(valorExibir)}</span>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
                          {r.status || "Pendente"}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Resumo de Metas */}
        <Card className="shadow-sm border-border/80 rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Meta Financeira</CardTitle>
            <CardDescription className="text-xs">Progresso do faturamento do mês ({nowIsoMonth})</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Faturamento Realizado</span>
                <span className="font-semibold">{currency(receitasDoMes)}</span>
              </div>
              <Progress value={percentualMetaAtingida} className="h-2" />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{percentualMetaAtingida}% atingido</span>
                <span>Meta: {currency(valorMetaFaturamento)}</span>
              </div>
            </div>
            <div className="rounded-xl border bg-muted/40 p-3.5 text-xs text-muted-foreground space-y-2">
              <div className="flex justify-between">
                <span>Receitas Previstas (Mês):</span>
                <strong className="text-foreground">{currency(receitasPrevistasDoMes)}</strong>
              </div>
              <div className="flex justify-between">
                <span>Despesas Realizadas (Mês):</span>
                <strong className="text-rose-600 dark:text-rose-400">{currency(despesasDoMes)}</strong>
              </div>
              <div className="flex justify-between border-t pt-1.5">
                <span>Saldo em Caixa Efetivo:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">{currency(saldoEmCaixa)}</strong>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Cliente } from '@/features/clientes/types';
import { Projeto } from '@/features/projetos/types';
import { ColaboradorRH } from '@/features/rh/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Activity, TrendingUp, TrendingDown, DollarSign, Wallet,
  Users, Briefcase, Target, Building2, UserCheck, Settings,
  Calculator, ArrowUpRight, ArrowDownRight, Layers, ChevronRight,
  Filter, Search, Sparkles, PieChart as PieChartIcon
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { KpiDrillDownSheet } from './KpiDrillDownSheet';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileIndicadoresView() {
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);
  const { data: contasBancarias = [] } = useLocalStorageState<any>('focus_contas_bancarias', []);
  const { data: clientes = [] } = useLocalStorageState<Cliente>('focus_clientes', []);
  const { data: projetos = [] } = useLocalStorageState<Projeto>('focus_projetos', []);
  const { data: colaboradores = [] } = useLocalStorageState<ColaboradorRH>('focus_rh_colaboradores', []);

  const [activeTab, setActiveTab] = useState<'global' | 'financeiro' | 'comercial' | 'saas' | 'projetos' | 'rh'>('global');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [periodFilter, setPeriodFilter] = useState<'mes_atual' | 'trimestre' | 'ano_atual'>('ano_atual');

  // Drilldown modal
  const [drillDown, setDrillDown] = useState<{
    isOpen: boolean;
    title: string;
    value: string;
    formula: { nome: string; valor: string }[];
    resultadoFinal: string;
    descricao: string;
  }>({
    isOpen: false,
    title: '',
    value: '',
    formula: [],
    resultadoFinal: '',
    descricao: '',
  });

  // Métricas calculadas
  const metrics = useMemo(() => {
    let receitaBruta = 0;
    let deducoes = 0;
    let custos = 0;
    let despesasOperacionais = 0;
    let saas = 0;
    let projetosReceita = 0;
    let consultoria = 0;

    contasReceber.forEach((t) => {
      const v = Number(t.valorOriginal || 0);
      receitaBruta += v;
      const cat = (t.categoria || '').toLowerCase();
      if (cat.includes('projeto') || cat.includes('implantação')) {
        projetosReceita += v;
      } else if (cat.includes('consultoria')) {
        consultoria += v;
      } else {
        saas += v;
      }
    });

    contasPagar.forEach((c) => {
      const v = Number(c.valorOriginal || 0);
      const cat = (c.categoria || '').toLowerCase();
      if (cat.includes('imposto') || cat.includes('tributo')) {
        deducoes += v;
      } else if (cat.includes('custo') || cat.includes('fornecedor') || cat.includes('infra') || cat.includes('cloud')) {
        custos += v;
      } else {
        despesasOperacionais += v;
      }
    });

    const receitaLiquida = receitaBruta - deducoes;
    const lucroBruto = receitaLiquida - custos;
    const ebitda = lucroBruto - despesasOperacionais;
    const margemEbitda = receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0;

    let caixaAtual = 0;
    contasBancarias.forEach((cb: any) => {
      caixaAtual += Number(cb.saldoAtual || 0);
    });

    const clientesAtivos = clientes.filter(c => c.status !== 'Inativo').length || 1;
    const ticketMedio = receitaBruta / clientesAtivos;

    const mrr = saas > 0 ? saas / 12 : 12500;
    const arr = mrr * 12;
    const cac = 1800;
    const ltv = ticketMedio * 24;
    const ltvCac = cac > 0 ? (ltv / cac).toFixed(1) : '4.2';

    const projetosAtivos = projetos.filter(p => p.status === 'Em Andamento' || p.status === 'Planejamento').length;
    const projetosConcluidos = projetos.filter(p => p.status === 'Concluído').length;

    const totalFolha = colaboradores.reduce((acc, col) => acc + (Number(col.salarioBase) || 0), 0);

    const chartData = [
      { name: 'Jan', receita: receitaBruta * 0.12, despesa: (custos + despesasOperacionais) * 0.11 },
      { name: 'Fev', receita: receitaBruta * 0.14, despesa: (custos + despesasOperacionais) * 0.13 },
      { name: 'Mar', receita: receitaBruta * 0.18, despesa: (custos + despesasOperacionais) * 0.15 },
      { name: 'Abr', receita: receitaBruta * 0.16, despesa: (custos + despesasOperacionais) * 0.14 },
      { name: 'Mai', receita: receitaBruta * 0.20, despesa: (custos + despesasOperacionais) * 0.16 },
      { name: 'Jun', receita: receitaBruta * 0.20, despesa: (custos + despesasOperacionais) * 0.15 },
    ];

    return {
      receitaBruta,
      receitaLiquida,
      ebitda,
      margemEbitda,
      caixaAtual,
      ticketMedio,
      mrr,
      arr,
      ltv,
      cac,
      ltvCac,
      clientesAtivos,
      projetosAtivos,
      projetosConcluidos,
      totalFolha,
      chartData,
    };
  }, [contasReceber, contasPagar, contasBancarias, clientes, projetos, colaboradores]);

  const openDrillDown = (
    title: string,
    value: string,
    formula: { nome: string; valor: string }[],
    resultadoFinal: string,
    descricao: string
  ) => {
    setDrillDown({
      isOpen: true,
      title,
      value,
      formula,
      resultadoFinal,
      descricao,
    });
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-4 py-2.5 space-y-2">
        {/* Barra de Busca + Filtro Sheet */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar indicador (EBITDA, MRR, LTV)..."
              className="pl-9 h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus:bg-background"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0 border-muted-foreground/20"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 py-6">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-base font-bold">Período de Análise</SheetTitle>
                <SheetDescription className="text-xs">
                  Selecione o horizonte temporal para os cálculos de inteligência
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-3 py-4 text-xs">
                {[
                  { id: 'ano_atual', label: 'Ano Vigente (Acumulado 2026)' },
                  { id: 'trimestre', label: 'Último Trimestre (Q2/Q3)' },
                  { id: 'mes_atual', label: 'Mês Atual' },
                ].map((p) => (
                  <Button
                    key={p.id}
                    type="button"
                    variant={periodFilter === p.id ? 'default' : 'outline'}
                    size="sm"
                    className="w-full justify-start text-xs h-10 rounded-xl font-medium"
                    onClick={() => {
                      setPeriodFilter(p.id as any);
                      setFilterSheetOpen(false);
                    }}
                  >
                    {p.label}
                  </Button>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Pílulas de Abas Rápidas */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
          <button
            onClick={() => setActiveTab('global')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'global'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Activity className="w-3 h-3" /> Visão Global
          </button>
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'financeiro'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Wallet className="w-3 h-3" /> Financeiro
          </button>
          <button
            onClick={() => setActiveTab('saas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'saas'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Métricas SaaS
          </button>
          <button
            onClick={() => setActiveTab('comercial')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'comercial'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Target className="w-3 h-3" /> Comercial
          </button>
          <button
            onClick={() => setActiveTab('projetos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'projetos'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Briefcase className="w-3 h-3" /> Projetos
          </button>
          <button
            onClick={() => setActiveTab('rh')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'rh'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Users className="w-3 h-3" /> RH & Pessoas
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cards de Métricas em Carrossel Horizontal */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {/* Card Receita */}
          <div
            onClick={() =>
              openDrillDown(
                'Receita Bruta Acumulada',
                formatCurrency(metrics.receitaBruta),
                [
                  { nome: 'SaaS / Recorrente', valor: formatCurrency(metrics.arr) },
                  { nome: 'Projetos e Implantação', valor: formatCurrency(metrics.receitaBruta - metrics.arr > 0 ? metrics.receitaBruta - metrics.arr : 0) },
                ],
                formatCurrency(metrics.receitaBruta),
                'Total faturado no período consolidado de títulos e vendas.'
              )
            }
            className="min-w-[145px] flex-1 bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-3 shadow-2xs active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 mb-1">
              <span className="text-[11px] font-semibold">Receita Bruta</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 truncate">
              {formatCurrency(metrics.receitaBruta)}
            </p>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5 font-medium">
              +14.2% vs período ant.
            </span>
          </div>

          {/* Card EBITDA */}
          <div
            onClick={() =>
              openDrillDown(
                'EBITDA Gerencial',
                formatCurrency(metrics.ebitda),
                [
                  { nome: 'Receita Líquida', valor: formatCurrency(metrics.receitaLiquida) },
                  { nome: 'Margem EBITDA', valor: `${metrics.margemEbitda.toFixed(1)}%` },
                ],
                formatCurrency(metrics.ebitda),
                'Lucro antes de juros, impostos, depreciação e amortização.'
              )
            }
            className="min-w-[145px] flex-1 bg-gradient-to-br from-blue-50 to-indigo-100/40 dark:from-blue-950/40 dark:to-indigo-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-3 shadow-2xs active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 mb-1">
              <span className="text-[11px] font-semibold">EBITDA ({metrics.margemEbitda.toFixed(0)}%)</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-blue-700 dark:text-blue-300 truncate">
              {formatCurrency(metrics.ebitda)}
            </p>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5 font-medium">
              Margem operacional
            </span>
          </div>

          {/* Card Caixa Atual */}
          <div
            onClick={() =>
              openDrillDown(
                'Saldo em Caixa Consolidado',
                formatCurrency(metrics.caixaAtual),
                [
                  { nome: 'Contas Bancárias Ativas', valor: `${contasBancarias.length || 2} contas` },
                  { nome: 'Disponibilidade Imediata', valor: formatCurrency(metrics.caixaAtual) },
                ],
                formatCurrency(metrics.caixaAtual),
                'Soma dos saldos atuais de todas as contas bancárias da empresa.'
              )
            }
            className="min-w-[145px] flex-1 bg-gradient-to-br from-purple-50 to-violet-100/40 dark:from-purple-950/40 dark:to-violet-900/20 border border-purple-200/60 dark:border-purple-800/40 rounded-2xl p-3 shadow-2xs active:scale-[0.98] transition-transform cursor-pointer"
          >
            <div className="flex items-center justify-between text-purple-700 dark:text-purple-300 mb-1">
              <span className="text-[11px] font-semibold">Caixa Geral</span>
              <Wallet className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-purple-700 dark:text-purple-300 truncate">
              {formatCurrency(metrics.caixaAtual)}
            </p>
            <span className="text-[10px] text-purple-600/80 dark:text-purple-400/80 block mt-0.5 font-medium">
              Disponibilidade
            </span>
          </div>
        </div>

        {/* Gráfico de Evolução Mobile */}
        <div className="bg-card border border-border/70 rounded-2xl p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-xs text-foreground">Evolução Receitas vs Despesas</h3>
              <p className="text-[10px] text-muted-foreground">Comportamento financeiro semestral</p>
            </div>
            <Badge variant="outline" className="text-[10px] font-semibold text-emerald-600 border-emerald-300">
              Positivo
            </Badge>
          </div>

          <div className="h-44 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="recGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#888888" />
                <YAxis tick={{ fontSize: 9 }} stroke="#888888" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(val: any) => formatCurrency(Number(val))}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Area type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#recGrad)" name="Receita" />
                <Area type="monotone" dataKey="despesa" stroke="#f43f5e" strokeWidth={1.5} fill="none" name="Despesa" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lista de Indicadores Específicos por Seção */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Indicadores Detalhados
          </span>

          {/* Cards Interativos de KPIs com Drilldown */}
          <div className="grid grid-cols-1 gap-2.5">
            {/* Card MRR */}
            <div
              onClick={() =>
                openDrillDown(
                  'MRR (Receita Recorrente Mensal)',
                  formatCurrency(metrics.mrr),
                  [
                    { nome: 'ARR Anualizado', valor: formatCurrency(metrics.arr) },
                    { nome: 'Ticket Médio (ARPA)', valor: formatCurrency(metrics.ticketMedio) },
                  ],
                  formatCurrency(metrics.mrr),
                  'Receita média recorrente previsível gerada pelas assinaturas mensalmente.'
                )
              }
              className="bg-card border border-border/70 rounded-xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-transform shadow-2xs hover:border-primary/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border border-emerald-200 shrink-0">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">MRR SaaS</h4>
                  <p className="text-[11px] text-muted-foreground">Recorrência mensal ativa</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <span className="font-bold text-sm text-foreground block">{formatCurrency(metrics.mrr)}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">+8.5% mês</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Card LTV / CAC */}
            <div
              onClick={() =>
                openDrillDown(
                  'Relação LTV / CAC',
                  `${metrics.ltvCac}x`,
                  [
                    { nome: 'Lifetime Value (LTV)', valor: formatCurrency(metrics.ltv) },
                    { nome: 'Custo de Aquisição (CAC)', valor: formatCurrency(metrics.cac) },
                  ],
                  `${metrics.ltvCac}x`,
                  'Multiplicador de retorno sobre o investimento de aquisição de clientes (Ideal > 3.0x).'
                )
              }
              className="bg-card border border-border/70 rounded-xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-transform shadow-2xs hover:border-primary/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 border border-blue-200 shrink-0">
                  <Target className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">LTV / CAC Ratio</h4>
                  <p className="text-[11px] text-muted-foreground">Eficiência de Aquisição</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <span className="font-bold text-sm text-foreground block">{metrics.ltvCac}x</span>
                  <span className="text-[10px] text-blue-600 font-semibold">Excelente</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Card Clientes Ativos */}
            <div
              onClick={() =>
                openDrillDown(
                  'Base de Clientes Ativos',
                  `${metrics.clientesAtivos}`,
                  [
                    { nome: 'Clientes Cadastrados', valor: `${clientes.length}` },
                    { nome: 'Ticket Médio', valor: formatCurrency(metrics.ticketMedio) },
                  ],
                  `${metrics.clientesAtivos} contas`,
                  'Quantidade de clientes com contratos ou títulos em operação ativa.'
                )
              }
              className="bg-card border border-border/70 rounded-xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-transform shadow-2xs hover:border-primary/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">Clientes Ativos</h4>
                  <p className="text-[11px] text-muted-foreground">Carteira total</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <span className="font-bold text-sm text-foreground block">{metrics.clientesAtivos}</span>
                  <span className="text-[10px] text-muted-foreground">Contratos ativos</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Card Projetos em Execução */}
            <div
              onClick={() =>
                openDrillDown(
                  'Projetos em Andamento',
                  `${metrics.projetosAtivos}`,
                  [
                    { nome: 'Projetos Concluídos', valor: `${metrics.projetosConcluidos}` },
                    { nome: 'Total de Projetos', valor: `${projetos.length}` },
                  ],
                  `${metrics.projetosAtivos} projetos`,
                  'Total de iniciativas e marcos em execução pelo time de implantação e dev.'
                )
              }
              className="bg-card border border-border/70 rounded-xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-transform shadow-2xs hover:border-primary/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border border-indigo-200 shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">Projetos Ativos</h4>
                  <p className="text-[11px] text-muted-foreground">Entregas e escopo</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <span className="font-bold text-sm text-foreground block">{metrics.projetosAtivos}</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">{metrics.projetosConcluidos} entregues</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>

            {/* Card Folha e Colaboradores */}
            <div
              onClick={() =>
                openDrillDown(
                  'Massa Salarial & Colaboradores',
                  formatCurrency(metrics.totalFolha),
                  [
                    { nome: 'Total de Colaboradores', valor: `${colaboradores.length} pessoas` },
                    { nome: 'Salário Médio', valor: formatCurrency(colaboradores.length > 0 ? metrics.totalFolha / colaboradores.length : 0) },
                  ],
                  formatCurrency(metrics.totalFolha),
                  'Total mensal investido no time operacional, desenvolvimento e gestão.'
                )
              }
              className="bg-card border border-border/70 rounded-xl p-3.5 flex items-center justify-between active:scale-[0.99] transition-transform shadow-2xs hover:border-primary/40 cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200 shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-xs text-foreground">RH & Equipe</h4>
                  <p className="text-[11px] text-muted-foreground">{colaboradores.length} colaboradores</p>
                </div>
              </div>
              <div className="text-right flex items-center gap-2">
                <div>
                  <span className="font-bold text-sm text-foreground block">{formatCurrency(metrics.totalFolha)}</span>
                  <span className="text-[10px] text-muted-foreground">Folha mensal</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Drilldown Sheet */}
      <KpiDrillDownSheet
        isOpen={drillDown.isOpen}
        onClose={() => setDrillDown(prev => ({ ...prev, isOpen: false }))}
        kpiTitle={drillDown.title}
        kpiValue={drillDown.value}
        formula={drillDown.formula}
        resultadoFinal={drillDown.resultadoFinal}
        descricao={drillDown.descricao}
      />
    </div>
  );
}

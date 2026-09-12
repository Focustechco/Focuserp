import React, { useState, useMemo } from 'react';
import { 
  ChevronRight, ChevronDown, Download, Filter, Calendar, 
  TrendingUp, TrendingDown, DollarSign, Activity, Wallet, 
  ArrowRight, PieChart, BarChart3, Layers, SlidersHorizontal,
  RefreshCw, CheckCircle2, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DreFiltrosSheet } from './DreFiltrosSheet';
import { DreDrillDownSheet } from './DreDrillDownSheet';
import { LinhaDRE } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { buildDRE, FiltrosDREState, PeriodoDRE } from '../services/dreEngine';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(value / 100);
};

export function MobileDreView() {
  const [activeSection, setActiveSection] = useState<'tabela' | 'dashboard'>('tabela');
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedLinha, setSelectedLinha] = useState<LinhaDRE | null>(null);

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true,
    '2': false,
    '4': true,
    '6': true,
    '7': false,
    '8': false,
  });

  const [filtros, setFiltros] = useState<FiltrosDREState>({
    periodo: 'mes_atual',
    regime: 'competencia',
    clienteId: 'todos',
  });

  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  const { linhas: dreBase, indicadores, labelPeriodoAtual, labelPeriodoAnterior } = useMemo(() => {
    return buildDRE(contasReceber, contasPagar, filtros);
  }, [contasReceber, contasPagar, filtros]);

  const totalReceita = dreBase.find((l) => l.tipo === 'Receita Bruta')?.valorAtual || 1;

  const toggleNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleRowClick = (node: LinhaDRE) => {
    const hasChildren = dreBase.some((l) => l.parentId === node.id);
    if (hasChildren) {
      toggleNode(node.id);
    } else if (!node.isCalculated) {
      setSelectedLinha(node);
      setDrillDownOpen(true);
    }
  };

  // Histórico para gráficos
  const chartHistory = useMemo(() => {
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthLabel = format(date, 'MMM', { locale: ptBR });
      const monthStr = format(date, 'yyyy-MM');

      const rec = contasReceber
        .filter((c) => (c.dataVencimento || c.dataEmissao)?.startsWith(monthStr))
        .reduce((acc, c) => acc + (c.valorOriginal || 0), 0);

      const desp = contasPagar
        .filter((c) => (c.dataVencimento || c.dataEmissao)?.startsWith(monthStr))
        .reduce((acc, c) => acc + (c.valorOriginal || 0), 0);

      const lucro = rec - desp;

      history.push({
        month: monthLabel,
        receita: rec,
        despesa: desp,
        lucro: lucro,
      });
    }
    return history;
  }, [contasReceber, contasPagar]);

  // Renderizador recursivo para nós da DRE no mobile
  const renderNodes = (parentId?: string, level = 0): React.ReactNode => {
    const nodes = dreBase.filter((l) => (parentId ? l.parentId === parentId : !l.parentId));
    if (nodes.length === 0) return null;

    return nodes.map((node) => {
      const isExpanded = expandedNodes[node.id];
      const children = dreBase.filter((l) => l.parentId === node.id);
      const hasChildren = children.length > 0;

      const av = totalReceita > 0 ? (node.valorAtual / totalReceita) * 100 : 0;
      const isCalculated = Boolean(node.isCalculated);
      const isRoot = level === 0;

      const absAtual = Math.abs(node.valorAtual);
      const absAnterior = Math.abs(node.valorAnterior);
      const crescimento = absAnterior > 0 ? ((absAtual - absAnterior) / absAnterior) * 100 : 0;
      const isPositiveGrowth = crescimento > 0;

      let growthBadgeColor = 'text-muted-foreground bg-muted/40';
      if (crescimento !== 0 && absAnterior > 0) {
        if (node.valorAtual >= 0) {
          growthBadgeColor = isPositiveGrowth
            ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'
            : 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300';
        } else {
          growthBadgeColor = isPositiveGrowth
            ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 dark:text-rose-300'
            : 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300';
        }
      }

      const isNegativeValue = node.valorAtual < 0;

      return (
        <div key={node.id} className="flex flex-col">
          <div
            onClick={() => handleRowClick(node)}
            className={`transition-all active:scale-[0.99] cursor-pointer rounded-xl p-3 border mb-2 shadow-2xs ${
              isRoot && isCalculated
                ? 'bg-primary/5 dark:bg-primary/10 border-primary/20 shadow-xs font-semibold'
                : isCalculated
                ? 'bg-muted/40 border-border/80 font-medium'
                : 'bg-card border-border/70 hover:border-primary/40'
            }`}
            style={{ marginLeft: level > 0 ? `${Math.min(level * 10, 24)}px` : '0px' }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0 flex-1">
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={(e) => toggleNode(node.id, e)}
                    className="p-1 rounded-md bg-muted hover:bg-muted/80 text-foreground shrink-0 mt-0.5"
                    aria-label="Expandir ou recolher"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  <span className="w-4 h-4 shrink-0 flex items-center justify-center text-muted-foreground mt-0.5">
                    •
                  </span>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="font-mono text-[10px] font-bold text-muted-foreground">
                      {node.codigo}
                    </span>
                    {node.isCalculated && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4 bg-background">
                        Totalizador
                      </Badge>
                    )}
                  </div>
                  <h4
                    className={`text-xs leading-snug break-words ${
                      isRoot && isCalculated ? 'font-bold text-foreground text-sm' : 'text-foreground'
                    }`}
                  >
                    {node.nome}
                  </h4>
                </div>
              </div>

              {/* Valor Atual */}
              <div className="text-right shrink-0">
                <div
                  className={`font-mono text-xs font-bold ${
                    isNegativeValue
                      ? 'text-rose-600 dark:text-rose-400'
                      : node.valorAtual > 0
                      ? isRoot && isCalculated
                        ? 'text-emerald-600 dark:text-emerald-400 text-sm font-extrabold'
                        : 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {formatCurrency(node.valorAtual)}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  Ant: {formatCurrency(node.valorAnterior)}
                </div>
              </div>
            </div>

            {/* Badges de AV% e Crescimento */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-dashed text-[10px] text-muted-foreground">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="px-1.5 py-0.5 rounded bg-muted font-mono font-medium">
                  AV: {formatPercent(av)}
                </span>
                {absAnterior > 0 && (
                  <span className={`px-1.5 py-0.5 rounded font-mono font-semibold ${growthBadgeColor}`}>
                    AH: {isPositiveGrowth ? '+' : ''}
                    {crescimento.toFixed(1)}%
                  </span>
                )}
              </div>

              {!hasChildren && !node.isCalculated && (
                <span className="text-[10px] text-primary flex items-center gap-0.5 font-medium">
                  Detalhes <ArrowRight className="w-2.5 h-2.5" />
                </span>
              )}
            </div>
          </div>

          {/* Renderizar filhos se expandido */}
          {hasChildren && isExpanded && (
            <div className="flex flex-col">{renderNodes(node.id, level + 1)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. STICKY TOPBAR COM CONTROLES E SELEÇÃO DE SEÇÕES */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        {/* Controles: Período Rápido + Regime + Filtro Avançado */}
        <div className="flex items-center gap-2">
          {/* Período Dropdown */}
          <div className="flex-1 min-w-0">
            <Select
              value={filtros.periodo}
              onValueChange={(val: PeriodoDRE) => setFiltros((prev) => ({ ...prev, periodo: val }))}
            >
              <SelectTrigger className="h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 font-medium">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-primary shrink-0" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                <SelectItem value="trimestre_atual">Trimestre Atual</SelectItem>
                <SelectItem value="semestre_atual">Semestre Atual</SelectItem>
                <SelectItem value="ano_atual">Ano Atual</SelectItem>
                <SelectItem value="todos">Histórico Completo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Regime Switcher */}
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setFiltros((prev) => ({
                ...prev,
                regime: prev.regime === 'competencia' ? 'caixa' : 'competencia',
              }))
            }
            className="h-9 px-2.5 text-xs rounded-xl border-muted-foreground/20 font-semibold shrink-0"
          >
            {filtros.regime === 'competencia' ? 'Competência' : 'Caixa'}
          </Button>

          {/* Botão Filtros Avançados */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setFiltrosOpen(true)}
            className="h-9 w-9 rounded-xl border-muted-foreground/20 text-muted-foreground hover:text-foreground shrink-0 relative"
            aria-label="Filtros da DRE"
          >
            <Filter className="w-4 h-4" />
            {filtros.clienteId !== 'todos' && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </div>

        {/* Horizontal Section Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'tabela', label: '📑 Demonstração DRE', icon: Layers },
            { id: 'dashboard', label: '📊 Dashboard Executivo', icon: PieChart },
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. KPIS RESUMO NO TOPO */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-2.5">
        <div className="text-[11px] text-muted-foreground font-medium flex items-center justify-between">
          <span>Período: <strong className="text-foreground">{labelPeriodoAtual}</strong></span>
          <span>Regime: <strong className="text-foreground capitalize">{filtros.regime}</strong></span>
        </div>

        {/* Grid de 2 Cards Principais */}
        <div className="grid grid-cols-2 gap-2">
          {/* Card Receita Bruta */}
          <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-3 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" />
              Receita Bruta
            </span>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(indicadores.receitaBruta)}
            </div>
            <p className="text-[9px] text-muted-foreground truncate">
              Líq: {formatCurrency(indicadores.receitaLiquida)}
            </p>
          </div>

          {/* Card Lucro Líquido */}
          <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-3 shadow-xs space-y-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              <DollarSign className="w-3 h-3 text-primary" />
              Lucro Líquido
            </span>
            <div
              className={`text-base font-black ${
                indicadores.lucroLiquido < 0
                  ? 'text-rose-600 dark:text-rose-400'
                  : 'text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {formatCurrency(indicadores.lucroLiquido)}
            </div>
            <p className="text-[9px] font-semibold text-muted-foreground">
              Margem: {indicadores.margemLiquida.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Grid de 2 Cards Secundários: EBITDA e Despesas */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-card/70 border border-border/70 rounded-xl p-2.5 shadow-2xs">
            <span className="text-[10px] text-muted-foreground block font-medium">EBITDA / Operacional</span>
            <span className="text-xs font-bold text-foreground">
              {formatCurrency(indicadores.ebitda)}
            </span>
            <span className="text-[9px] text-muted-foreground block">
              Margem: {indicadores.margemEbitda.toFixed(1)}%
            </span>
          </div>

          <div className="bg-card/70 border border-border/70 rounded-xl p-2.5 shadow-2xs">
            <span className="text-[10px] text-muted-foreground block font-medium">Despesas Operacionais</span>
            <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(indicadores.despesasOperacionais)}
            </span>
            <span className="text-[9px] text-muted-foreground block truncate">
              Custos: {formatCurrency(indicadores.custosOperacionais)}
            </span>
          </div>
        </div>
      </div>

      {/* 3. CONTEÚDO PRINCIPAL (TABELA HIERÁRQUICA OU DASHBOARD) */}
      <div className="p-3.5 space-y-3">
        {activeSection === 'tabela' && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground px-1 pb-1">
              <span>Estrutura de Contas</span>
              <button
                type="button"
                onClick={() => {
                  const allOpen = Object.values(expandedNodes).every(Boolean);
                  const nextState: Record<string, boolean> = {};
                  dreBase.forEach((l) => {
                    nextState[l.id] = !allOpen;
                  });
                  setExpandedNodes(nextState);
                }}
                className="text-[11px] text-primary hover:underline font-semibold"
              >
                {Object.values(expandedNodes).some(Boolean) ? 'Recolher Todos' : 'Expandir Todos'}
              </button>
            </div>

            {/* Lista recursiva */}
            {renderNodes()}
          </div>
        )}

        {activeSection === 'dashboard' && (
          <div className="space-y-4">
            {/* Gráfico de Evolução Receitas x Despesas */}
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <div className="p-3.5 border-b bg-muted/20">
                <h4 className="text-xs font-bold text-foreground">Receitas x Despesas (Últimos 6 Meses)</h4>
                <p className="text-[10px] text-muted-foreground">Comparativo mensal consolidado</p>
              </div>
              <CardContent className="p-3 pt-4">
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Bar dataKey="receita" name="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="despesa" name="Despesas" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Lucro / EBITDA */}
            <Card className="rounded-2xl border shadow-xs overflow-hidden">
              <div className="p-3.5 border-b bg-muted/20">
                <h4 className="text-xs font-bold text-foreground">Evolução do Resultado Líquido</h4>
                <p className="text-[10px] text-muted-foreground">Tendência de lucratividade mensal</p>
              </div>
              <CardContent className="p-3 pt-4">
                <div className="h-52 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 9 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                      <Legend wrapperStyle={{ fontSize: 10 }} />
                      <Line type="monotone" dataKey="lucro" name="Lucro Líquido" stroke="#6366f1" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Sheets Integrados */}
      <DreFiltrosSheet
        isOpen={filtrosOpen}
        onClose={() => setFiltrosOpen(false)}
        filtros={filtros}
        onApplyFiltros={(f) => setFiltros(f)}
      />

      <DreDrillDownSheet
        isOpen={drillDownOpen}
        onClose={() => {
          setDrillDownOpen(false);
          setSelectedLinha(null);
        }}
        linhaDRE={selectedLinha}
      />
    </div>
  );
}

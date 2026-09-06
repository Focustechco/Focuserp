import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { MovimentacaoFluxo } from '../types';
import { consolidateFluxoFromStores } from '../utils/consolidateData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjecoesSection } from './ProjecoesSection';
import { ComparativoSection } from './ComparativoSection';
import { Dashboard } from './Dashboard';
import {
  Search, Filter, ArrowUpRight, ArrowDownRight, Wallet,
  Calendar, CheckCircle2, ChevronRight, TrendingUp, TrendingDown,
  Layers, Plus, Download, ArrowRight, ExternalLink, RefreshCw,
  BarChart3, ArrowLeftRight, FileText
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { formatDateBrasilia, getBrasiliaTodayIso, parseDateSafe } from '@/lib/dateUtils';
import { NovoRecebimentoSheet } from '@/features/contas-receber/components/NovoRecebimentoSheet';
import { NovaContaSheet } from '@/features/contas-pagar/components/NovaContaSheet';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileFluxoCaixaView() {
  const navigate = useNavigate();
  const { data: titulos = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contas = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const [activeSection, setActiveSection] = useState<'extrato' | 'projecoes' | 'comparativo' | 'dashboard'>('extrato');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'entradas' | 'saidas' | 'mes_atual'>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [periodoFilter, setPeriodoFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [selectedMovimento, setSelectedMovimento] = useState<MovimentacaoFluxo | null>(null);

  const [novoRecebimentoOpen, setNovoRecebimentoOpen] = useState(false);
  const [novaContaOpen, setNovaContaOpen] = useState(false);

  const todayIso = getBrasiliaTodayIso();
  const currentYearMonth = todayIso.substring(0, 7); // "YYYY-MM"

  // Consolidação contábil do Fluxo de Caixa Realizado
  const fluxoConsolidado = useMemo(() => {
    return consolidateFluxoFromStores(titulos, contas);
  }, [titulos, contas]);

  // Estatísticas e KPIs consolidados
  const stats = useMemo(() => {
    let totalEntradas = 0;
    let totalSaidas = 0;

    fluxoConsolidado.forEach((mov) => {
      if (mov.tipo === 'Entrada') {
        totalEntradas += mov.valorRealizado;
      } else {
        totalSaidas += mov.valorRealizado;
      }
    });

    const saldoAtual = totalEntradas - totalSaidas;
    const totalMovimentacoes = fluxoConsolidado.length;

    return { totalEntradas, totalSaidas, saldoAtual, totalMovimentacoes };
  }, [fluxoConsolidado]);

  // Lista dinâmica de categorias presentes no extrato
  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    fluxoConsolidado.forEach((mov) => {
      if (mov.categoria) set.add(mov.categoria);
    });
    return Array.from(set);
  }, [fluxoConsolidado]);

  // Filtragem e busca
  const filteredData = useMemo(() => {
    return fluxoConsolidado.filter((mov) => {
      const matchesSearch =
        (mov.clienteFornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.moduloOrigem || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // Filtro por Tipo / Aba
      if (activeTab === 'entradas' && mov.tipo !== 'Entrada') return false;
      if (activeTab === 'saidas' && mov.tipo !== 'Saída') return false;
      if (activeTab === 'mes_atual') {
        const movMonth = (mov.dataCompetencia || '').substring(0, 7);
        if (movMonth !== currentYearMonth) return false;
      }

      // Filtro de Categoria
      if (categoriaFilter !== 'todas' && mov.categoria !== categoriaFilter) {
        return false;
      }

      // Filtro de Período
      if (periodoFilter === 'hoje') {
        if (mov.dataCompetencia.split('T')[0] !== todayIso) return false;
      } else if (periodoFilter === '7dias') {
        const movDate = parseDateSafe(mov.dataCompetencia).getTime();
        const diffDays = (Date.now() - movDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 7 || diffDays < 0) return false;
      } else if (periodoFilter === '30dias') {
        const movDate = parseDateSafe(mov.dataCompetencia).getTime();
        const diffDays = (Date.now() - movDate) / (1000 * 60 * 60 * 24);
        if (diffDays > 30 || diffDays < 0) return false;
      } else if (periodoFilter === 'ano_atual') {
        const movYear = mov.dataCompetencia.substring(0, 4);
        if (movYear !== todayIso.substring(0, 4)) return false;
      }

      return true;
    });
  }, [fluxoConsolidado, searchTerm, activeTab, categoriaFilter, periodoFilter, currentYearMonth, todayIso]);

  // Exportar Extrato em CSV
  const handleExportCSV = () => {
    if (filteredData.length === 0) {
      toast.info("Nenhuma movimentação para exportar.");
      return;
    }

    const headers = ["Data", "Tipo", "Cliente / Fornecedor", "Descrição", "Categoria", "Origem", "Valor Realizado (R$)", "Saldo Caixa (R$)"];
    const rows = filteredData.map(mov => [
      mov.dataCompetencia ? formatDateBrasilia(mov.dataCompetencia) : '',
      mov.tipo,
      `"${mov.clienteFornecedor || ''}"`,
      `"${mov.descricao || ''}"`,
      `"${mov.categoria || ''}"`,
      `"${mov.moduloOrigem || ''}"`,
      mov.valorRealizado.toFixed(2),
      mov.saldoAcumuladoDia.toFixed(2)
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extrato_fluxo_caixa_${todayIso}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Extrato exportado com sucesso!");
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. TOP CARDS & RESUMO KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        {/* Card Principal: Saldo Atual em Caixa */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-primary" />
              Saldo Real em Caixa
            </span>
            <div className={`text-2xl font-black tracking-tight ${
              stats.saldoAtual >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(stats.saldoAtual)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {stats.totalMovimentacoes} transações liquidadas consolidadas
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0.5 ${
              stats.saldoAtual >= 0
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-500/30'
            }`}>
              {stats.saldoAtual >= 0 ? 'Positivo' : 'Déficit'}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExportCSV}
              className="h-7 text-[10px] gap-1 px-2 text-muted-foreground hover:text-foreground"
            >
              <Download className="w-3 h-3" /> Exportar
            </Button>
          </div>
        </div>

        {/* Mini Cards: Entradas e Saídas */}
        <div className="grid grid-cols-2 gap-2.5">
          <div 
            onClick={() => setActiveTab(activeTab === 'entradas' ? 'todos' : 'entradas')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'entradas' ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                Entradas
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-base font-black text-emerald-600 dark:text-emerald-400 truncate">
              {formatCurrency(stats.totalEntradas)}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab(activeTab === 'saidas' ? 'todos' : 'saidas')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'saidas' ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <ArrowDownRight className="w-3 h-3 text-rose-500" />
                Saídas
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-base font-black text-rose-600 dark:text-rose-400 truncate">
              {formatCurrency(stats.totalSaidas)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY CONTROLS: SEÇÃO + BUSCA + FILTROS */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        {/* Horizontal Section Selector */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'extrato', label: 'Extrato / Timeline', icon: Layers },
            { id: 'projecoes', label: 'Projeções', icon: TrendingUp },
            { id: 'comparativo', label: 'Comparativo', icon: ArrowLeftRight },
            { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
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

        {/* Barra de Procura + Filtro para Extrato */}
        {activeSection === 'extrato' && (
          <>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por cliente, fornecedor, descrição..."
                  className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
                />
              </div>

              {/* Botão de Filtros */}
              <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-9 w-9 rounded-xl shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground relative"
                    aria-label="Filtrar"
                  >
                    <Filter className="w-4 h-4" />
                    {(categoriaFilter !== 'todas' || periodoFilter !== 'todos') && (
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
                  <SheetHeader className="pb-3 border-b">
                    <SheetTitle className="text-base font-bold text-left">Filtros do Extrato</SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground text-left">
                      Filtre as movimentações por período, tipo e categoria contábil.
                    </SheetDescription>
                  </SheetHeader>

                  <div className="py-4 space-y-4 text-xs">
                    {/* Período */}
                    <div>
                      <label className="font-semibold text-muted-foreground block mb-2">Período de Realização</label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'todos', label: 'Todo Período' },
                          { id: 'hoje', label: 'Hoje' },
                          { id: '7dias', label: 'Últimos 7 dias' },
                          { id: '30dias', label: 'Últimos 30 dias' },
                          { id: 'ano_atual', label: 'Ano Atual' },
                        ].map((p) => (
                          <Button
                            key={p.id}
                            type="button"
                            variant={periodoFilter === p.id ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setPeriodoFilter(p.id)}
                            className={`text-xs h-8 ${periodoFilter === p.id ? 'bg-primary text-white' : ''}`}
                          >
                            {p.label}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Categorias */}
                    {categoriasDisponiveis.length > 0 && (
                      <div>
                        <label className="font-semibold text-muted-foreground block mb-2">Categoria</label>
                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                          <Button
                            type="button"
                            variant={categoriaFilter === 'todas' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCategoriaFilter('todas')}
                            className={`text-xs h-7 rounded-full ${categoriaFilter === 'todas' ? 'bg-primary text-white' : ''}`}
                          >
                            Todas
                          </Button>
                          {categoriasDisponiveis.map((cat) => (
                            <Button
                              key={cat}
                              type="button"
                              variant={categoriaFilter === cat ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setCategoriaFilter(cat)}
                              className={`text-xs h-7 rounded-full ${categoriaFilter === cat ? 'bg-primary text-white' : ''}`}
                            >
                              {cat}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => setFilterSheetOpen(false)}
                      className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-10 rounded-xl font-bold"
                    >
                      Aplicar Filtros ({filteredData.length} resultados)
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            {/* Category Pills (Horizontal Scroll) */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
              {[
                { id: 'todos', label: `Todas (${fluxoConsolidado.length})` },
                { id: 'entradas', label: `Entradas (${fluxoConsolidado.filter(m => m.tipo === 'Entrada').length})` },
                { id: 'saidas', label: `Saídas (${fluxoConsolidado.filter(m => m.tipo === 'Saída').length})` },
                { id: 'mes_atual', label: 'Mês Atual' },
              ].map((pill) => {
                const isActive = activeTab === pill.id;
                return (
                  <button
                    key={pill.id}
                    onClick={() => setActiveTab(pill.id as any)}
                    className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 ${
                      isActive
                        ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                        : 'bg-background text-muted-foreground border-border hover:text-foreground'
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* 3. CONTEÚDO DA SEÇÃO SELECIONADA */}
      {activeSection === 'projecoes' && (
        <div className="p-3.5">
          <ProjecoesSection />
        </div>
      )}

      {activeSection === 'comparativo' && (
        <div className="p-3.5">
          <ComparativoSection />
        </div>
      )}

      {activeSection === 'dashboard' && (
        <div className="p-3.5">
          <Dashboard />
        </div>
      )}

      {activeSection === 'extrato' && (
        <div className="p-3.5 space-y-2.5">
          {filteredData.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Layers className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma movimentação encontrada</div>
              <p className="text-xs text-muted-foreground">
                Não foram encontradas transações liquidadas com os filtros ou termo pesquisado.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('todos');
                  setCategoriaFilter('todas');
                  setPeriodoFilter('todos');
                }}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            filteredData.map((mov) => {
              const isEntrada = mov.tipo === 'Entrada';

              return (
                <div
                  key={mov.id}
                  onClick={() => setSelectedMovimento(mov)}
                  className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2 relative overflow-hidden"
                >
                  {/* Linha superior indicadora de tipo */}
                  <div className={`h-1 w-full absolute top-0 left-0 ${
                    isEntrada ? 'bg-emerald-500' : 'bg-rose-500'
                  }`} />

                  <div className="flex items-start justify-between gap-2.5 pt-0.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isEntrada
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-500/30'
                      }`}>
                        {isEntrada ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-foreground truncate">
                          {mov.clienteFornecedor || mov.descricao || 'Movimentação'}
                        </h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {mov.descricao || mov.categoria}
                        </p>
                      </div>
                    </div>

                    {/* Valor Realizado */}
                    <div className="text-right shrink-0">
                      <div className={`font-mono text-xs font-extrabold ${
                        isEntrada ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isEntrada ? '+' : '-'} {formatCurrency(mov.valorRealizado)}
                      </div>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        Saldo: {formatCurrency(mov.saldoAcumuladoDia)}
                      </span>
                    </div>
                  </div>

                  {/* Linha Inferior: Data, Módulo de Origem e Categoria */}
                  <div className="flex items-center justify-between pt-1 border-t border-dashed text-[10px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-muted-foreground" />
                        {mov.dataCompetencia ? formatDateBrasilia(mov.dataCompetencia) : 'Data N/A'}
                      </span>
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 h-4 border-muted-foreground/30 font-medium">
                        {mov.categoria || 'Geral'}
                      </Badge>
                    </div>

                    <span className="font-medium text-primary text-[10px]">
                      {mov.moduloOrigem}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* 4. SHEET DE DETALHES DA MOVIMENTAÇÃO */}
      <Sheet open={Boolean(selectedMovimento)} onOpenChange={(open) => !open && setSelectedMovimento(null)}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-5 space-y-4">
          <SheetHeader className="pb-3 border-b text-left">
            <div className="flex items-center justify-between">
              <Badge className={`text-xs px-2.5 py-0.5 font-bold ${
                selectedMovimento?.tipo === 'Entrada'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {selectedMovimento?.tipo === 'Entrada' ? 'Entrada Confirmada' : 'Saída Confirmada'}
              </Badge>
              <span className="text-[11px] font-mono text-muted-foreground">
                {selectedMovimento?.dataCompetencia ? formatDateBrasilia(selectedMovimento.dataCompetencia) : ''}
              </span>
            </div>
            <SheetTitle className="text-base font-bold text-foreground mt-2">
              {selectedMovimento?.clienteFornecedor || selectedMovimento?.descricao}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {selectedMovimento?.descricao || 'Movimentação liquidada no fluxo financeiro.'}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2 bg-muted/40 p-3 rounded-xl">
              <div>
                <span className="text-[10px] text-muted-foreground block">Valor Liquidado</span>
                <span className={`text-base font-mono font-extrabold ${
                  selectedMovimento?.tipo === 'Entrada' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {selectedMovimento ? formatCurrency(selectedMovimento.valorRealizado) : 'R$ 0,00'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Saldo em Caixa Após Lançamento</span>
                <span className="text-base font-mono font-extrabold text-foreground">
                  {selectedMovimento ? formatCurrency(selectedMovimento.saldoAcumuladoDia) : 'R$ 0,00'}
                </span>
              </div>
            </div>

            <div className="space-y-2 border rounded-xl p-3 bg-card">
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Origem</span>
                <span className="font-semibold text-foreground">{selectedMovimento?.moduloOrigem}</span>
              </div>
              <div className="flex justify-between py-1 border-b">
                <span className="text-muted-foreground">Categoria</span>
                <span className="font-semibold text-foreground">{selectedMovimento?.categoria || 'Geral'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-muted-foreground">Status Contábil</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Liquidada
                </span>
              </div>
            </div>

            <Button
              onClick={() => {
                const target = selectedMovimento?.moduloOrigem === 'Contas a Receber' ? '/contas-a-receber' : '/contas-a-pagar';
                setSelectedMovimento(null);
                navigate({ to: target });
              }}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-10 rounded-xl gap-2 mt-2"
            >
              <ExternalLink className="w-4 h-4" />
              Ver no Módulo {selectedMovimento?.moduloOrigem}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Sheets de Criação Rápida */}
      <NovoRecebimentoSheet open={novoRecebimentoOpen} onOpenChange={setNovoRecebimentoOpen} />
      <NovaContaSheet open={novaContaOpen} onOpenChange={setNovaContaOpen} />
    </div>
  );
}

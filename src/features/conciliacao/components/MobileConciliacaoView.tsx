import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaBancaria, MovimentacaoBancaria } from '../types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { TituloReceber } from '@/features/contas-receber/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, ArrowUpRight, ArrowDownRight, Landmark,
  CheckCircle2, AlertTriangle, Clock, ChevronRight, Check, RefreshCw,
  Link as LinkIcon, Unlink, UploadCloud, Building2, ExternalLink,
  Scale, BarChart3
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ImportarExtrato } from './ImportarExtrato';
import { NovaContaBancariaSheet } from './NovaContaBancariaSheet';
import { DivergenciasList } from './DivergenciasList';
import { ContasBancariasList } from './ContasBancariasList';
import { Dashboard } from './Dashboard';
import { formatDateBrasilia, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  const val = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export function MobileConciliacaoView() {
  const { data: contasBancarias = [] } = useLocalStorageState<ContaBancaria>('focus_contas_bancarias', []);
  const { data: extratos = [], updateItem: updateExtrato } = useLocalStorageState<MovimentacaoBancaria>('focus_extratos', []);
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);

  const [activeSection, setActiveSection] = useState<'conciliacao' | 'divergencias' | 'importar' | 'contas' | 'dashboard'>('conciliacao');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'pendentes' | 'conciliados'>('todos');
  const [selectedContaFilter, setSelectedContaFilter] = useState<string>('todas');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [importarModalOpen, setImportarModalOpen] = useState(false);
  const [novaContaModalOpen, setNovaContaModalOpen] = useState(false);
  const [selectedExtrato, setSelectedExtrato] = useState<MovimentacaoBancaria | null>(null);

  // Mapa de contas bancárias por ID
  const contasMap = useMemo(() => {
    const map = new Map<string, ContaBancaria>();
    contasBancarias.forEach((c) => {
      if (c && c.id) map.set(c.id, c);
    });
    return map;
  }, [contasBancarias]);

  // KPIs
  const stats = useMemo(() => {
    let saldoTotalContas = 0;
    contasBancarias.forEach((c) => {
      saldoTotalContas += Number(c.saldoAtual ?? c.saldoInicial ?? 0);
    });

    let countConciliados = 0;
    let countPendentes = 0;
    let totalValorPendentes = 0;

    extratos.forEach((e) => {
      const isConciliado = e.status === 'Conciliado';
      if (isConciliado) {
        countConciliados++;
      } else {
        countPendentes++;
        totalValorPendentes += Math.abs(Number(e.valor || 0));
      }
    });

    const totalExtratos = extratos.length;
    const taxaConciliacao = totalExtratos > 0 ? (countConciliados / totalExtratos) * 100 : 0;

    return { saldoTotalContas, countConciliados, countPendentes, totalValorPendentes, taxaConciliacao };
  }, [contasBancarias, extratos]);

  // Filtragem
  const filteredExtratos = useMemo(() => {
    return extratos.filter((e) => {
      if (!e) return false;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (e.descricao || '').toLowerCase().includes(search) ||
        (e.documento || '').toLowerCase().includes(search) ||
        (e.tipo || '').toLowerCase().includes(search) ||
        (contasMap.get(e.contaBancariaId)?.nomeConta || '').toLowerCase().includes(search) ||
        (contasMap.get(e.contaBancariaId)?.banco || '').toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Filtro de Conta Bancária
      if (selectedContaFilter !== 'todas' && e.contaBancariaId !== selectedContaFilter) {
        return false;
      }

      // Filtro de Aba
      if (activeTab === 'pendentes' && e.status === 'Conciliado') return false;
      if (activeTab === 'conciliados' && e.status !== 'Conciliado') return false;

      return true;
    });
  }, [extratos, searchTerm, selectedContaFilter, activeTab, contasMap]);

  // Alternar conciliação direta
  const handleToggleConciliar = (e: MovimentacaoBancaria, ev: React.MouseEvent) => {
    ev.stopPropagation();
    const newStatus = e.status === 'Conciliado' ? 'Pendente' : 'Conciliado';
    updateItem(e.id, {
      status: newStatus,
      dataConciliacao: newStatus === 'Conciliado' ? getBrasiliaTodayIso() : undefined,
    });

    if (newStatus === 'Conciliado') {
      toast.success('Extrato conciliado com sucesso!');
    } else {
      toast.info('Extrato desconciliado e retornado para pendentes.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. STICKY TOP CONTROLS: SELETOR DE SEÇÕES PRINCIPAIS + BUSCA + FILTROS */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        {/* Seletor de Seções Principais (Tabs Mobile Scrollável) */}
        <div className="flex items-center gap-1 p-1 bg-muted/60 rounded-xl border overflow-x-auto scrollbar-hide">
          <button
            type="button"
            onClick={() => setActiveSection('conciliacao')}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
              activeSection === 'conciliacao'
                ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-primary" />
            <span>Conciliar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('divergencias')}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
              activeSection === 'divergencias'
                ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
            <span>Divergências</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('importar')}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
              activeSection === 'importar'
                ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5 text-blue-500" />
            <span>Importar OFX</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('contas')}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
              activeSection === 'contas'
                ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Landmark className="w-3.5 h-3.5 text-amber-500" />
            <span>Contas Bancárias</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('dashboard')}
            className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shrink-0 ${
              activeSection === 'dashboard'
                ? 'bg-white dark:bg-zinc-800 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Dashboard</span>
          </button>
        </div>

        {/* Busca, Filtros & Ação para Conciliação (Visível na seção conciliação) */}
        {activeSection === 'conciliacao' && (
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar extrato por histórico, valor, banco..."
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
                  {selectedContaFilter !== 'todas' && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
                <SheetHeader className="pb-3 border-b">
                  <SheetTitle className="text-base font-bold text-left">Filtros de Conciliação</SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground text-left">
                    Selecione a conta bancária para filtrar o extrato.
                  </SheetDescription>
                </SheetHeader>

                <div className="py-4 space-y-4 text-xs">
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-2">Conta Bancária</label>
                    <div className="space-y-1.5">
                      <Button
                        type="button"
                        variant={selectedContaFilter === 'todas' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedContaFilter('todas')}
                        className={`w-full justify-start text-xs h-9 rounded-xl ${selectedContaFilter === 'todas' ? 'bg-primary text-white' : ''}`}
                      >
                        Todas as Contas ({contasBancarias.length})
                      </Button>
                      {contasBancarias.map((conta) => (
                        <Button
                          key={conta.id}
                          type="button"
                          variant={selectedContaFilter === conta.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedContaFilter(conta.id)}
                          className={`w-full justify-start text-xs h-9 rounded-xl gap-2 ${selectedContaFilter === conta.id ? 'bg-primary text-white' : ''}`}
                        >
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="truncate">{conta.banco} - {conta.nomeConta}</span>
                        </Button>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => setFilterSheetOpen(false)}
                    className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-10 rounded-xl font-bold"
                  >
                    Aplicar Filtros ({filteredExtratos.length} resultados)
                  </Button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Botão Importar OFX */}
            <Button
              size="sm"
              onClick={() => setActiveSection('importar')}
              className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
            >
              <UploadCloud className="w-3.5 h-3.5" />
              OFX
            </Button>
          </div>
        )}
      </div>

      {/* RENDERIZAÇÃO DA SEÇÃO ATIVA */}
      {activeSection === 'divergencias' && (
        <div className="p-3.5">
          <DivergenciasList />
        </div>
      )}

      {activeSection === 'importar' && (
        <div className="p-3.5">
          <ImportarExtrato />
        </div>
      )}

      {activeSection === 'contas' && (
        <div className="p-3.5">
          <ContasBancariasList />
        </div>
      )}

      {activeSection === 'dashboard' && (
        <div className="p-3.5">
          <Dashboard />
        </div>
      )}

      {activeSection === 'conciliacao' && (
        <>
          {/* 2. CARDS & RESUMO KPI (ABAIXO DOS CONTROLES DO TOPO) */}
          <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
            {/* Card Principal: Saldo Consolidado em Bancos */}
            <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-primary" />
                  Saldo Bancário Consolidado
                </span>
                <div className="text-2xl font-black tracking-tight text-foreground">
                  {formatCurrency(stats.saldoTotalContas)}
                </div>
                <p className="text-[10px] text-muted-foreground">
                  {contasBancarias.length} contas bancárias ativas cadastradas
                </p>
              </div>

              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/30">
                  {stats.taxaConciliacao.toFixed(0)}% Conciliado
                </Badge>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setNovaContaModalOpen(true)}
                  className="h-7 text-[10px] gap-1 px-2 text-muted-foreground hover:text-foreground"
                >
                  <Plus className="w-3 h-3" /> Nova Conta
                </Button>
              </div>
            </div>

            {/* Mini Cards Interativos: Pendentes vs Conciliados */}
            <div className="grid grid-cols-2 gap-2.5">
              <div 
                onClick={() => setActiveTab(activeTab === 'pendentes' ? 'todos' : 'pendentes')}
                className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
                  activeTab === 'pendentes' ? 'border-amber-500 ring-2 ring-amber-500/20 bg-amber-50/50 dark:bg-amber-950/30' : 'border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-500" />
                    Pendentes
                  </span>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                </div>
                <div className="text-base font-black text-amber-600 dark:text-amber-400">
                  {stats.countPendentes} lançamentos
                </div>
              </div>

              <div 
                onClick={() => setActiveTab(activeTab === 'conciliados' ? 'todos' : 'conciliados')}
                className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
                  activeTab === 'conciliados' ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/30' : 'border-border/80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                    Conciliados
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                </div>
                <div className="text-base font-black text-emerald-600 dark:text-emerald-400 truncate">
                  {stats.countConciliados} transações
                </div>
              </div>
            </div>

            {/* Chips de Status Rápidos */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pt-1">
              <button
                type="button"
                onClick={() => setActiveTab('todos')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === 'todos'
                    ? 'bg-primary text-white shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                Todos ({extratos.length})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pendentes')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeTab === 'pendentes'
                    ? 'bg-amber-500 text-white shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Pendentes ({stats.countPendentes})
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('conciliados')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1 ${
                  activeTab === 'conciliados'
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                Conciliados ({stats.countConciliados})
              </button>
            </div>
          </div>

      {/* 3. LISTA DE CONCILIAÇÃO */}
      <div className="p-3.5 space-y-2.5">
          {filteredExtratos.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Landmark className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum extrato encontrado</div>
              <p className="text-xs text-muted-foreground">
                Não encontramos movimentações bancárias com os filtros aplicados.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('todos');
                  setSelectedContaFilter('todas');
                }}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            filteredExtratos.map((extrato) => {
              const conta = contasMap.get(extrato.contaBancariaId);
              const isConciliado = extrato.status === 'Conciliado';
              const isCredito = extrato.tipo === 'Crédito' || Number(extrato.valor) > 0;
              const valorAbs = Math.abs(Number(extrato.valor || 0));

              return (
                <div
                  key={extrato.id}
                  onClick={() => setSelectedExtrato(extrato)}
                  className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2 relative overflow-hidden"
                >
                  {/* Linha superior indicadora */}
                  <div className={`h-1 w-full absolute top-0 left-0 ${
                    isConciliado ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />

                  <div className="flex items-start justify-between gap-2.5 pt-0.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                        isCredito
                          ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border-rose-500/30'
                      }`}>
                        {isCredito ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[9px] font-semibold px-1 rounded bg-muted text-muted-foreground">
                            {conta?.banco || 'Banco'}
                          </span>
                          <Badge variant="outline" className={`text-[9px] py-0 px-1.5 font-bold ${
                            isConciliado
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-500/30'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-500/30'
                          }`}>
                            {isConciliado ? 'Conciliado' : 'Pendente'}
                          </Badge>
                        </div>
                        <h4 className="font-bold text-xs text-foreground truncate">
                          {extrato.descricao || extrato.documento || 'Movimentação Bancária'}
                        </h4>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className={`font-mono text-xs font-extrabold ${
                        isCredito ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {isCredito ? '+' : '-'} {formatCurrency(valorAbs)}
                      </div>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {extrato.data ? formatDateBrasilia(extrato.data) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center justify-between pt-1 border-t border-dashed text-[10px]">
                    <span className="text-muted-foreground truncate">
                      {extrato.lancamentoFinanceiroId ? 'Vinculado a lançamento' : 'Extrato Bancário OFX'}
                    </span>

                    <Button
                      size="sm"
                      variant={isConciliado ? 'outline' : 'default'}
                      onClick={(ev) => handleToggleConciliar(extrato, ev)}
                      className={`h-6 px-2 text-[10px] font-bold rounded-lg gap-1 ${
                        isConciliado ? 'border-muted-foreground/30 text-muted-foreground' : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Check className="w-3 h-3" />
                      {isConciliado ? 'Desconciliar' : 'Conciliar'}
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
        </>
      )}

      {/* Sheets / Modais */}
      <NovaContaBancariaSheet open={novaContaModalOpen} onOpenChange={setNovaContaModalOpen} />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useContasReceberQuery } from '../hooks/useContasReceberQuery';
import { financeiroService } from '@/services/financeiroService';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, TrendingUp, CheckCircle2, Clock,
  AlertTriangle, ChevronRight, Check, RefreshCw, Trash2,
  DollarSign, BarChart3
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NovoRecebimentoSheet } from './NovoRecebimentoSheet';
import { DetalhesRecebimentoSheet } from './DetalhesRecebimentoSheet';
import { RecebimentosFuturosTab } from './RecebimentosFuturosTab';
import { Dashboard } from './Dashboard';
import { formatDateBrasilia, getBrasiliaTodayIso, parseDateSafe } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileRecebimentosView() {
  const queryClient = useQueryClient();
  const { data: localTitulos = [], saveItem: saveLocalTitulo, removeItem: deleteLocalTitulo } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { titulos: queryTitulos = [], isLoading, refetch, saveTitulo: saveQueryTitulo, deleteTitulo: deleteQueryTitulo } = useContasReceberQuery();

  const [activeSection, setActiveSection] = useState<'titulos' | 'futuros' | 'dashboard'>('titulos');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'a_receber' | 'vencidos' | 'recebidos'>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [novoRecebimentoOpen, setNovoRecebimentoOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [tituloSelecionado, setTituloSelecionado] = useState<any | null>(null);

  const todayIso = getBrasiliaTodayIso();

  // Fusão consistente para garantir que todos os títulos reais sincronizados apareçam
  const titulos = useMemo(() => {
    const map = new Map<string, any>();
    localTitulos.forEach(t => {
      if (t && t.id && ((t.cliente || t.clienteNome) || t.descricao || (t.numero && !t.numero.startsWith('REC-0000')) || Number(t.valorOriginal || t.valor || 0) > 0)) {
        map.set(t.id, t);
      }
    });
    queryTitulos.forEach(t => {
      if (t && t.id && ((t.cliente || t.clienteNome) || t.descricao || (t.numero && !t.numero.startsWith('REC-0000')) || Number(t.valorOriginal || t.valor || 0) > 0)) {
        if (!map.has(t.id)) map.set(t.id, t);
      }
    });
    return Array.from(map.values());
  }, [localTitulos, queryTitulos]);

  const enrichedTitulos = useMemo(() => {
    return titulos.map((t) => {
      const valorNum = Number(t.valorOriginal ?? t.valor ?? t.saldo ?? 0) || 0;
      const valorRecebido = Number(t.valorRecebido ?? 0) || 0;
      const clienteNome = t.cliente || t.clienteNome || t.nomeCliente || 'Cliente';
      const statusNorm = (t.status || '').trim().toLowerCase();
      const isPago = statusNorm === 'recebido' || statusNorm === 'liquidado' || statusNorm === 'pago';
      const dataVenc = t.dataVencimento || t.vencimento || t.data_vencimento || '';
      const isVencido = !isPago && Boolean(dataVenc) && dataVenc < todayIso;

      return {
        ...t,
        clienteNome,
        valorNum,
        valorRecebido,
        dataVencimento: dataVenc,
        isPago,
        isVencido,
      };
    });
  }, [titulos, todayIso]);

  const stats = useMemo(() => {
    let totalAReceber = 0;
    let totalVencido = 0;
    let totalRecebido = 0;

    enrichedTitulos.forEach((t) => {
      if (t.isPago) {
        totalRecebido += (t.valorRecebido || t.valorNum);
      } else if (t.isVencido) {
        totalVencido += t.valorNum;
      } else {
        totalAReceber += t.valorNum;
      }
    });

    return { totalAReceber, totalVencido, totalRecebido };
  }, [enrichedTitulos]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    enrichedTitulos.forEach(t => {
      if (t.categoria) set.add(t.categoria);
    });
    return Array.from(set);
  }, [enrichedTitulos]);

  const filteredList = useMemo(() => {
    return enrichedTitulos.filter((t) => {
      const matchesSearch =
        (t.clienteNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (categoriaFilter !== 'todas' && t.categoria !== categoriaFilter) {
        return false;
      }

      if (activeTab === 'a_receber') return !t.isPago && !t.isVencido;
      if (activeTab === 'vencidos') return t.isVencido;
      if (activeTab === 'recebidos') return t.isPago;

      return true;
    });
  }, [enrichedTitulos, searchTerm, activeTab, categoriaFilter]);

  const handleBaixarTitulo = async (titulo: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const today = getBrasiliaTodayIso();
      const updated = {
        ...titulo,
        status: 'Recebido',
        dataRecebimento: today,
        valorRecebido: titulo.valorNum,
        saldo: 0,
      };

      saveLocalTitulo(updated);

      await financeiroService.liquidarTituloReceber(titulo.id, {
        dataRecebimento: today,
        valorRecebido: titulo.valorNum,
      });

      queryClient.setQueryData(['contas_receber'], (old: any) => {
        if (!Array.isArray(old)) return [updated];
        return old.map((item: any) => item.id === titulo.id ? updated : item);
      });
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa'] });

      toast.success(`Título de ${formatCurrency(titulo.valorNum)} baixado com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao dar baixa: ${err?.message || 'Falha na operação'}`);
    }
  };

  const handleExcluirTitulo = async (titulo: any) => {
    try {
      deleteLocalTitulo(titulo.id);
      queryClient.setQueryData(['contas_receber'], (old: any) => {
        if (!Array.isArray(old)) return [];
        return old.filter((item: any) => item.id !== titulo.id);
      });
      await financeiroService.deleteContaReceber(titulo.id);
      queryClient.invalidateQueries({ queryKey: ['contas_receber'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa'] });
      toast.success('Título excluído com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao excluir título: ' + (err?.message || 'Tente novamente.'));
    }
  };

  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success('Dados sincronizados com o servidor!');
    } catch {
      toast.error('Erro ao sincronizar.');
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. STICKY TOP CONTROLS: BUSCA + FILTROS + SELETOR DE SEÇÕES */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        {/* Busca, Filtros, Refresh & Botão Novo */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, descrição, doc..."
              className="h-8.5 pl-8.5 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-[#FF6A00]"
            />
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="h-8.5 w-8.5 rounded-xl shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground"
            aria-label="Atualizar"
            title="Sincronizar"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#FF6A00]' : ''}`} />
          </Button>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant={categoriaFilter !== 'todas' ? 'default' : 'outline'}
                size="icon"
                className={`h-8.5 w-8.5 rounded-xl shrink-0 ${
                  categoriaFilter !== 'todas'
                    ? 'bg-[#FF6A00] text-white'
                    : 'border-muted-foreground/20 text-muted-foreground hover:text-foreground'
                }`}
                aria-label="Filtrar"
              >
                <Filter className="w-3.5 h-3.5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" hideCloseButton className="rounded-t-2xl max-h-[80vh] p-4 bg-background">
              <SheetHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <SheetTitle className="text-base font-bold text-left">Filtros de Recebimentos</SheetTitle>
                  <p className="text-xs text-muted-foreground text-left">Filtre por categoria e status financeiro</p>
                </div>
                <button
                  type="button"
                  onClick={() => setFilterSheetOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100/90 dark:bg-zinc-800/90 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white transition-all active:scale-95 cursor-pointer shadow-xs"
                  aria-label="Fechar"
                >
                  <span className="text-sm font-bold leading-none">&times;</span>
                </button>
              </SheetHeader>
              <div className="py-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-2">Categoria</label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    <button
                      type="button"
                      onClick={() => setCategoriaFilter('todas')}
                      className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                        categoriaFilter === 'todas'
                          ? 'bg-[#FF6A00] text-white border-[#FF6A00] font-semibold'
                          : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                      }`}
                    >
                      Todas ({enrichedTitulos.length})
                    </button>
                    {categoriasDisponiveis.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoriaFilter(cat)}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                          categoriaFilter === cat
                            ? 'bg-[#FF6A00] text-white border-[#FF6A00] font-semibold'
                            : 'bg-muted/40 border-border text-foreground hover:bg-muted'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setCategoriaFilter('todas');
                      setSearchTerm('');
                    }}
                    className="flex-1 h-10 rounded-xl"
                  >
                    Limpar
                  </Button>
                  <Button
                    onClick={() => setFilterSheetOpen(false)}
                    className="flex-1 bg-[#FF6A00] hover:bg-orange-600 text-white h-10 rounded-xl font-bold"
                  >
                    Aplicar ({filteredList.length})
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            size="sm"
            onClick={() => setNovoRecebimentoOpen(true)}
            className="h-8.5 px-3 rounded-xl bg-[#FF6A00] hover:bg-orange-600 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </Button>
        </div>
      </div>

      {/* 2. CARDS KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
          {/* Mini Cards de Resumo Financeiro */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-card p-2.5 rounded-xl border border-border/80 shadow-xs">
              <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <Clock className="w-3 h-3 text-[#FF6A00]" /> A Receber
              </div>
              <div className="text-xs font-bold text-foreground mt-0.5 truncate">
                {formatCurrency(stats.totalAReceber)}
              </div>
            </div>
            <div className="bg-white dark:bg-card p-2.5 rounded-xl border border-border/80 shadow-xs">
              <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" /> Vencidos
              </div>
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5 truncate">
                {formatCurrency(stats.totalVencido)}
              </div>
            </div>
            <div className="bg-white dark:bg-card p-2.5 rounded-xl border border-border/80 shadow-xs">
              <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Recebido
              </div>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
                {formatCurrency(stats.totalRecebido)}
              </div>
            </div>
          </div>
        </div>

      {/* 3. LISTA DE TÍTULOS */}
      <div className="p-3 space-y-2.5">
          {filteredList.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <TrendingUp className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum recebimento encontrado</div>
              <p className="text-xs text-muted-foreground">
                Altere os filtros ou adicione um novo recebimento.
              </p>
            </div>
          ) : (
            filteredList.map((t) => (
              <div
                key={t.id}
                onClick={() => {
                  setTituloSelecionado(t);
                  setDetalhesOpen(true);
                }}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-xs text-foreground truncate">
                      {t.clienteNome || 'Cliente não identificado'}
                    </div>
                    <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                      {t.descricao || 'Título a Receber'}
                    </div>
                    {t.categoria && (
                      <span className="inline-block mt-1 text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md font-medium">
                        {t.categoria}
                      </span>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm text-foreground">
                      {formatCurrency(t.valorNum)}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[9px] px-1.5 py-0 mt-0.5 rounded-md font-semibold ${
                        t.isPago
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                          : t.isVencido
                          ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                          : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                      }`}
                    >
                      {t.isPago ? 'Recebido' : t.isVencido ? 'Vencido' : 'Pendente'}
                    </Badge>
                  </div>
                </div>

                {/* Data de Vencimento e Ação Rápida */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed border-border/60 text-[11px] text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      Vencimento: {t.dataVencimento ? formatDateBrasilia(t.dataVencimento) : 'Sem data'}
                    </span>
                  </div>

                  {!t.isPago ? (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => handleBaixarTitulo(t, e)}
                      className="h-7 px-2.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Baixar
                    </Button>
                  ) : (
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                      Liquidado
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

      {/* Sheet de Detalhes da Conta Selecionada (Descrição e Dados Completos) */}
      <DetalhesRecebimentoSheet
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        titulo={tituloSelecionado}
        onBaixar={(t) => handleBaixarTitulo(t, { stopPropagation: () => {} } as any)}
        onExcluir={handleExcluirTitulo}
      />

      {/* Sheet de Criação de Novo Recebimento */}
      <NovoRecebimentoSheet
        open={novoRecebimentoOpen}
        onOpenChange={setNovoRecebimentoOpen}
      />
    </div>
  );
}

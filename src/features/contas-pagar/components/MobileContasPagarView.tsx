import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useContasPagarQuery } from '../hooks/useContasPagarQuery';
import { financeiroService } from '@/services/financeiroService';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaPagar } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, TrendingDown, CheckCircle2, Clock,
  AlertTriangle, ChevronRight, Check, RefreshCw, Trash2
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NovaContaSheet } from './NovaContaSheet';
import { DetalhesContaPagarSheet } from './DetalhesContaPagarSheet';
import { formatDateBrasilia, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileContasPagarView() {
  const queryClient = useQueryClient();
  const { data: localContas = [], saveItem: saveLocalConta, removeItem: deleteLocalConta } = useLocalStorageState<ContaPagar>('focus_contas_pagar');
  const { contas: queryContas = [], isLoading, refetch, saveConta: saveQueryConta, deleteConta: deleteQueryConta } = useContasPagarQuery();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'a_pagar' | 'vencidas' | 'pagas'>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [novaContaOpen, setNovaContaOpen] = useState(false);
  const [detalhesOpen, setDetalhesOpen] = useState(false);
  const [contaSelecionada, setContaSelecionada] = useState<any | null>(null);

  const todayIso = getBrasiliaTodayIso();

  // Fusão consistente para garantir que todas as contas reais apareçam
  const contas = useMemo(() => {
    const map = new Map<string, any>();
    localContas.forEach(c => {
      if (c && c.id && ((c.fornecedor || c.fornecedorNome || c.beneficiario) || c.descricao || Number(c.valorOriginal || c.valor || 0) > 0)) {
        map.set(c.id, c);
      }
    });
    queryContas.forEach(c => {
      if (c && c.id && ((c.fornecedor || c.fornecedorNome || c.beneficiario) || c.descricao || Number(c.valorOriginal || c.valor || 0) > 0)) {
        if (!map.has(c.id)) map.set(c.id, c);
      }
    });
    return Array.from(map.values());
  }, [localContas, queryContas]);

  const enrichedContas = useMemo(() => {
    return contas.map((c) => {
      const valorNum = Number(c.valorOriginal ?? c.valor ?? c.saldo ?? 0) || 0;
      const valorPago = Number(c.valorPago ?? 0) || 0;
      const fornecedorNome = c.fornecedor || c.fornecedorNome || c.beneficiario || 'Fornecedor';
      const statusNorm = (c.status || '').trim().toLowerCase();
      const isPago = statusNorm === 'pago' || statusNorm === 'liquidado' || statusNorm === 'paga';
      const dataVenc = c.dataVencimento || c.vencimento || c.data_vencimento || '';
      const isVencido = !isPago && Boolean(dataVenc) && dataVenc < todayIso;

      return {
        ...c,
        fornecedorNome,
        valorNum,
        valorPago,
        dataVencimento: dataVenc,
        isPago,
        isVencido,
      };
    });
  }, [contas, todayIso]);

  const stats = useMemo(() => {
    let totalAPagar = 0;
    let totalVencido = 0;
    let totalPago = 0;

    enrichedContas.forEach((c) => {
      if (c.isPago) {
        totalPago += (c.valorPago || c.valorNum);
      } else if (c.isVencido) {
        totalVencido += c.valorNum;
      } else {
        totalAPagar += c.valorNum;
      }
    });

    return { totalAPagar, totalVencido, totalPago };
  }, [enrichedContas]);

  const categoriasDisponiveis = useMemo(() => {
    const set = new Set<string>();
    enrichedContas.forEach(c => {
      if (c.categoria) set.add(c.categoria);
    });
    return Array.from(set);
  }, [enrichedContas]);

  const filteredList = useMemo(() => {
    return enrichedContas.filter((c) => {
      const matchesSearch =
        (c.fornecedorNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (categoriaFilter !== 'todas' && c.categoria !== categoriaFilter) {
        return false;
      }

      if (activeTab === 'a_pagar') return !c.isPago && !c.isVencido;
      if (activeTab === 'vencidas') return c.isVencido;
      if (activeTab === 'pagas') return c.isPago;

      return true;
    });
  }, [enrichedContas, searchTerm, activeTab, categoriaFilter]);

  const handlePagarConta = async (conta: any, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const today = getBrasiliaTodayIso();
      const updated = {
        ...conta,
        status: 'Pago',
        dataPagamento: today,
        valorPago: conta.valorNum,
        saldo: 0,
      };

      saveLocalConta(updated);

      await financeiroService.liquidarContaPagar(conta.id, {
        dataPagamento: today,
        valorPago: conta.valorNum,
      });

      queryClient.setQueryData(['contas_pagar'], (old: any) => {
        if (!Array.isArray(old)) return [updated];
        return old.map((item: any) => item.id === conta.id ? updated : item);
      });
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa'] });

      toast.success(`Conta de ${formatCurrency(conta.valorNum)} liquidada com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao liquidar conta: ${err?.message || 'Falha na operação'}`);
    }
  };

  const handleExcluirConta = async (conta: any) => {
    try {
      deleteLocalConta(conta.id);
      queryClient.setQueryData(['contas_pagar'], (old: any) => {
        if (!Array.isArray(old)) return [];
        return old.filter((item: any) => item.id !== conta.id);
      });
      await financeiroService.deleteContaPagar(conta.id);
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });
      queryClient.invalidateQueries({ queryKey: ['fluxo_caixa'] });
      toast.success('Conta excluída com sucesso!');
    } catch (err: any) {
      toast.error('Erro ao excluir conta: ' + (err?.message || 'Tente novamente.'));
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
      {/* 1. STICKY TOP CONTROLS: BUSCA + FILTROS */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        {/* Busca, Filtros, Refresh & Botão Novo */}
        <div className="flex items-center gap-1.5">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar fornecedor, despesa..."
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
                  <SheetTitle className="text-base font-bold text-left">Filtros de Pagamentos</SheetTitle>
                  <p className="text-xs text-muted-foreground text-left">Filtre por categoria e status de pagamento</p>
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
                      Todas ({enrichedContas.length})
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
            onClick={() => setNovaContaOpen(true)}
            className="h-8.5 px-3 rounded-xl bg-[#FF6A00] hover:bg-orange-600 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova
          </Button>
        </div>
      </div>

      {/* 2. CARDS KPI (ABAIXO DO HEADER STICKY) */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card p-2.5 rounded-xl border shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" /> A Pagar
            </div>
            <div className="text-xs font-bold text-foreground mt-0.5 truncate">
              {formatCurrency(stats.totalAPagar)}
            </div>
          </div>
          <div className="bg-card p-2.5 rounded-xl border shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-500" /> Vencidas
            </div>
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5 truncate">
              {formatCurrency(stats.totalVencido)}
            </div>
          </div>
          <div className="bg-card p-2.5 rounded-xl border shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Pagas
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {formatCurrency(stats.totalPago)}
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Cards Touch */}
      <div className="p-3 space-y-2.5">
        {filteredList.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
            <TrendingDown className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <div className="font-semibold text-sm text-foreground">Nenhuma conta encontrada</div>
            <p className="text-xs text-muted-foreground">
              Altere os filtros ou adicione uma nova despesa a pagar.
            </p>
          </div>
        ) : (
          filteredList.map((c) => (
            <div
              key={c.id}
              onClick={() => {
                setContaSelecionada(c);
                setDetalhesOpen(true);
              }}
              className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2.5 hover:border-orange-500/40"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">
                    {c.fornecedorNome || 'Fornecedor não informado'}
                  </div>
                  <div className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                    {c.descricao || 'Despesa / Conta a Pagar'}
                  </div>
                  {c.categoria && (
                    <span className="inline-block mt-1 text-[10px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded-md font-medium">
                      {c.categoria}
                    </span>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-sm text-foreground">
                    {formatCurrency(c.valorNum)}
                  </div>
                  <Badge
                    variant="outline"
                    className={`text-[9px] px-1.5 py-0 mt-0.5 rounded-md font-semibold ${
                      c.isPago
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400'
                        : c.isVencido
                        ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400'
                        : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400'
                    }`}
                  >
                    {c.isPago ? 'Pago' : c.isVencido ? 'Vencido' : 'A Pagar'}
                  </Badge>
                </div>
              </div>

              {/* Data de Vencimento e Ação Rápida */}
              <div className="flex items-center justify-between pt-2 border-t border-dashed border-border/60 text-[11px] text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>
                    Vencimento: {c.dataVencimento ? formatDateBrasilia(c.dataVencimento) : 'Sem data'}
                  </span>
                </div>

                {!c.isPago ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => handlePagarConta(c, e)}
                    className="h-7 px-2.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Pagar
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
      <DetalhesContaPagarSheet
        open={detalhesOpen}
        onOpenChange={setDetalhesOpen}
        conta={contaSelecionada}
        onPagar={(c) => handlePagarConta(c, { stopPropagation: () => {} } as any)}
        onExcluir={handleExcluirConta}
      />

      {/* Sheet de Cadastro / Nova Conta */}
      <NovaContaSheet
        open={novaContaOpen}
        onOpenChange={setNovaContaOpen}
      />
    </div>
  );
}

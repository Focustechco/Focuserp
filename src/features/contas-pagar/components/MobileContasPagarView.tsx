import React, { useState, useMemo } from 'react';
import { useContasPagarQuery } from '../hooks/useContasPagarQuery';
import { financeiroService } from '@/services/financeiroService';
import { ContaPagar } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, TrendingDown, CheckCircle2, Clock,
  AlertTriangle, ChevronRight, Check
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NovaContaSheet } from './NovaContaSheet';
import { formatDateBrasilia, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileContasPagarView() {
  const { contas, isLoading, saveConta } = useContasPagarQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'a_pagar' | 'vencidas' | 'pagas'>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [novaContaOpen, setNovaContaOpen] = useState(false);
  const [contaParaEditar, setContaParaEditar] = useState<ContaPagar | null>(null);

  const todayIso = getBrasiliaTodayIso();

  const enrichedContas = useMemo(() => {
    return contas.map((c) => {
      const valor = Number(c.valor || 0);
      const statusNorm = (c.status || '').trim().toLowerCase();
      const isPago = statusNorm === 'pago' || statusNorm === 'liquidado' || statusNorm === 'paga';
      const isVencido = !isPago && c.dataVencimento && c.dataVencimento < todayIso;
      return {
        ...c,
        valorNum: valor,
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
        totalPago += c.valorNum;
      } else if (c.isVencido) {
        totalVencido += c.valorNum;
      } else {
        totalAPagar += c.valorNum;
      }
    });

    return { totalAPagar, totalVencido, totalPago };
  }, [enrichedContas]);

  const filteredList = useMemo(() => {
    return enrichedContas.filter((c) => {
      const matchesSearch =
        (c.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.categoria || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (activeTab === 'a_pagar') return !c.isPago && !c.isVencido;
      if (activeTab === 'vencidas') return c.isVencido;
      if (activeTab === 'pagas') return c.isPago;

      return true;
    });
  }, [enrichedContas, searchTerm, activeTab]);

  const handlePagarConta = async (conta: ContaPagar, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await financeiroService.liquidarContaPagar(conta.id, {
        dataPagamento: getBrasiliaTodayIso(),
        valorPago: conta.valor,
      });
      toast.success(`Conta de ${formatCurrency(conta.valor)} liquidada com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao liquidar conta: ${err?.message || 'Falha na operação'}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* Top Mobile Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Contas a Pagar</h1>
            <p className="text-[11px] text-muted-foreground">{contas.length} despesas e contas cadastradas</p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setContaParaEditar(null);
              setNovaContaOpen(true);
            }}
            className="h-8 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs shadow-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Despesa
          </Button>
        </div>

        {/* Mini Cards de Resumo Financeiro */}
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

        {/* Busca e Filtros */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar fornecedor, despesa..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-orange-500"
            />
          </div>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0 border-muted-foreground/20 text-muted-foreground"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[80vh] p-4">
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Filtros de Pagamentos</SheetTitle>
              </SheetHeader>
              <div className="py-4 space-y-3 text-xs">
                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white h-10 rounded-xl"
                >
                  Aplicar Filtros ({filteredList.length} encontrados)
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Status Horizontal Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'todos', label: 'Todos' },
            { id: 'a_pagar', label: 'A Pagar' },
            { id: 'vencidas', label: 'Vencidas' },
            { id: 'pagas', label: 'Pagas' },
          ].map((pill) => {
            const isActive = activeTab === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setActiveTab(pill.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 ${
                  isActive
                    ? 'bg-rose-600 text-white border-rose-600 font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
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
                setContaParaEditar(c);
                setNovaContaOpen(true);
              }}
              className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">
                    {c.fornecedor || 'Fornecedor não informado'}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {c.descricao || 'Despesa / Conta a Pagar'}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-sm text-foreground">
                    {formatCurrency(c.valor)}
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
                    className="h-7 px-2.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 rounded-lg gap-1"
                  >
                    <Check className="w-3 h-3" />
                    Pagar
                  </Button>
                ) : (
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                    Pago
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sheet de Cadastro / Edição */}
      <NovaContaSheet
        open={novaContaOpen}
        onOpenChange={(op) => {
          setNovaContaOpen(op);
          if (!op) setContaParaEditar(null);
        }}
        contaParaEditar={contaParaEditar}
      />
    </div>
  );
}

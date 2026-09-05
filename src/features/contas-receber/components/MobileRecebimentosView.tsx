import React, { useState, useMemo } from 'react';
import { useContasReceberQuery } from '../hooks/useContasReceberQuery';
import { financeiroService } from '@/services/financeiroService';
import { TituloReceber } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, TrendingUp, CheckCircle2, Clock,
  AlertTriangle, ChevronRight, Check
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { NovoRecebimentoSheet } from './NovoRecebimentoSheet';
import { formatDateBrasilia, getBrasiliaTodayIso, parseDateSafe } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileRecebimentosView() {
  const { titulos, isLoading, saveTitulo } = useContasReceberQuery();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'a_receber' | 'vencidos' | 'recebidos'>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [novoRecebimentoOpen, setNovoRecebimentoOpen] = useState(false);
  const [tituloParaEditar, setTituloParaEditar] = useState<TituloReceber | null>(null);

  const todayIso = getBrasiliaTodayIso();

  const enrichedTitulos = useMemo(() => {
    return titulos.map((t) => {
      const valor = Number(t.valor || 0);
      const statusNorm = (t.status || '').trim().toLowerCase();
      const isPago = statusNorm === 'recebido' || statusNorm === 'liquidado' || statusNorm === 'pago';
      const isVencido = !isPago && t.dataVencimento && t.dataVencimento < todayIso;
      return {
        ...t,
        valorNum: valor,
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
        totalRecebido += t.valorNum;
      } else if (t.isVencido) {
        totalVencido += t.valorNum;
      } else {
        totalAReceber += t.valorNum;
      }
    });

    return { totalAReceber, totalVencido, totalRecebido };
  }, [enrichedTitulos]);

  const filteredList = useMemo(() => {
    return enrichedTitulos.filter((t) => {
      const matchesSearch =
        (t.clienteNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.numeroDocumento || '').includes(searchTerm);

      if (!matchesSearch) return false;

      if (activeTab === 'a_receber') return !t.isPago && !t.isVencido;
      if (activeTab === 'vencidos') return t.isVencido;
      if (activeTab === 'recebidos') return t.isPago;

      return true;
    });
  }, [enrichedTitulos, searchTerm, activeTab]);

  const handleBaixarTitulo = async (titulo: TituloReceber, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await financeiroService.liquidarTituloReceber(titulo.id, {
        dataRecebimento: getBrasiliaTodayIso(),
        valorRecebido: titulo.valor,
      });
      toast.success(`Título de ${formatCurrency(titulo.valor)} baixado com sucesso!`);
    } catch (err: any) {
      toast.error(`Erro ao dar baixa: ${err?.message || 'Falha na operação'}`);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* Top Mobile Sticky Header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-4 py-3 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground tracking-tight">Contas a Receber</h1>
            <p className="text-[11px] text-muted-foreground">{titulos.length} lançamentos registrados</p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setTituloParaEditar(null);
              setNovoRecebimentoOpen(true);
            }}
            className="h-8 px-3 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium text-xs shadow-xs gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Recebimento
          </Button>
        </div>

        {/* Mini Cards de Resumo Financeiro */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card p-2.5 rounded-xl border shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <Clock className="w-3 h-3 text-blue-500" /> A Receber
            </div>
            <div className="text-xs font-bold text-foreground mt-0.5 truncate">
              {formatCurrency(stats.totalAReceber)}
            </div>
          </div>
          <div className="bg-card p-2.5 rounded-xl border shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <AlertTriangle className="w-3 h-3 text-rose-500" /> Vencidos
            </div>
            <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5 truncate">
              {formatCurrency(stats.totalVencido)}
            </div>
          </div>
          <div className="bg-card p-2.5 rounded-xl border shadow-2xs">
            <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Recebido
            </div>
            <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">
              {formatCurrency(stats.totalRecebido)}
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
              placeholder="Buscar cliente, descrição, doc..."
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
                <SheetTitle className="text-base font-bold text-left">Filtros de Recebimentos</SheetTitle>
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
            { id: 'a_receber', label: 'A Vencer' },
            { id: 'vencidos', label: 'Vencidos' },
            { id: 'recebidos', label: 'Recebidos' },
          ].map((pill) => {
            const isActive = activeTab === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setActiveTab(pill.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 ${
                  isActive
                    ? 'bg-orange-500 text-white border-orange-500 font-semibold shadow-xs'
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
                setTituloParaEditar(t);
                setNovoRecebimentoOpen(true);
              }}
              className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-foreground truncate">
                    {t.clienteNome || 'Cliente não identificado'}
                  </div>
                  <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                    {t.descricao || 'Título a Receber'}
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-sm text-foreground">
                    {formatCurrency(t.valor)}
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
                    className="h-7 px-2.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-50 rounded-lg gap-1"
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

      {/* Sheet de Cadastro / Edição */}
      <NovoRecebimentoSheet
        open={novoRecebimentoOpen}
        onOpenChange={(op) => {
          setNovoRecebimentoOpen(op);
          if (!op) setTituloParaEditar(null);
        }}
        tituloParaEditar={tituloParaEditar}
      />
    </div>
  );
}

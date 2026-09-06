import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Cobranca, StatusCobranca, CanalDisparo } from '../types';
import { INITIAL_COBRANCAS } from '../mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, Send, MessageSquare, Mail, Smartphone,
  CheckCircle2, AlertTriangle, Clock, ChevronRight, Eye, RefreshCw,
  TrendingUp, DollarSign, ExternalLink, Check, MoreVertical, Trash2
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { NovaCobrancaSheet } from './NovaCobrancaSheet';
import { CobrancaDetalhesModal } from './CobrancaDetalhesModal';
import { RegistrarRespostaModal } from './RegistrarRespostaModal';
import { formatDateBrasilia, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileCobrancasView() {
  const { data: cobrancasData = [], updateItem, deleteItem } = useLocalStorageState<Cobranca>('focus_cobrancas', INITIAL_COBRANCAS);
  const cobrancas = Array.isArray(cobrancasData) ? cobrancasData : [];

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todas' | 'pendentes' | 'vencidas' | 'pagas' | 'whatsapp'>('todas');
  const [canalFilter, setCanalFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [novaCobrancaOpen, setNovoCobrancaOpen] = useState(false);
  const [selectedCobranca, setSelectedCobranca] = useState<Cobranca | null>(null);
  const [respostaModalCobranca, setRespostaModalCobranca] = useState<Cobranca | null>(null);

  const stats = useMemo(() => {
    let totalValor = 0;
    let totalPago = 0;
    let totalVencido = 0;
    let countPendentes = 0;
    let countVencidas = 0;
    let countPagas = 0;

    cobrancas.forEach((c) => {
      const v = Number(c.valor || c.valorOriginal || 0);
      totalValor += v;

      if (c.statusCobranca === 'Paga') {
        totalPago += v;
        countPagas++;
      } else if (c.statusCobranca === 'Vencida') {
        totalVencido += v;
        countVencidas++;
      } else {
        countPendentes++;
      }
    });

    const taxaRecuperacao = totalValor > 0 ? (totalPago / totalValor) * 100 : 0;

    return { totalValor, totalPago, totalVencido, countPendentes, countVencidas, countPagas, taxaRecuperacao };
  }, [cobrancas]);

  const filteredData = useMemo(() => {
    return cobrancas.filter((c) => {
      if (!c) return false;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (c.cliente || '').toLowerCase().includes(search) ||
        (c.id || '').toLowerCase().includes(search) ||
        (c.tituloReferencia || '').toLowerCase().includes(search) ||
        (c.documento || '').includes(search);

      if (!matchSearch) return false;

      // Filtro de Aba Rápida
      if (activeTab === 'pendentes' && (c.statusCobranca === 'Paga' || c.statusCobranca === 'Vencida')) return false;
      if (activeTab === 'vencidas' && c.statusCobranca !== 'Vencida') return false;
      if (activeTab === 'pagas' && c.statusCobranca !== 'Paga') return false;
      if (activeTab === 'whatsapp' && !(c.canal || []).includes('WhatsApp')) return false;

      // Filtros detalhados
      if (statusFilter !== 'todos' && c.statusCobranca !== statusFilter) return false;
      if (canalFilter !== 'todos' && !(c.canal || []).includes(canalFilter as any)) return false;

      return true;
    });
  }, [cobrancas, searchTerm, activeTab, statusFilter, canalFilter]);

  const handleMarcarPaga = (cobranca: Cobranca, e: React.MouseEvent) => {
    e.stopPropagation();
    updateItem(cobranca.id, {
      statusCobranca: 'Paga',
      historicoInteracoes: [
        ...(cobranca.historicoInteracoes || []),
        {
          id: `hist-${Date.now()}`,
          dataHora: new Date().toISOString(),
          canal: 'Sistema',
          tipo: 'Pagamento Confirmado',
          statusEntrega: 'Entregue',
          mensagem: 'Cobrança marcada como Paga manualmente no app mobile.'
        }
      ]
    });
    toast.success(`Cobrança de "${cobranca.cliente}" liquidada com sucesso!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Paga':
        return <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Paga</Badge>;
      case 'Vencida':
        return <Badge variant="destructive" className="text-[10px] font-bold">Vencida</Badge>;
      case 'Respondida':
        return <Badge className="bg-indigo-600 text-white text-[10px] font-bold">Respondida</Badge>;
      case 'Lida':
        return <Badge className="bg-blue-600 text-white text-[10px] font-bold">Lida</Badge>;
      case 'Enviada':
        return <Badge className="bg-sky-600 text-white text-[10px] font-bold">Enviada</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] font-bold">{status || 'Pendente'}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. TOP CARDS & RESUMO KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        {/* Card Principal: Total em Carteira */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-primary" />
              Total em Cobrança
            </span>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {formatCurrency(stats.totalValor)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {stats.taxaRecuperacao.toFixed(1)}% recuperado ({formatCurrency(stats.totalPago)})
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
              {cobrancas.length} títulos
            </Badge>
          </div>
        </div>

        {/* Mini Cards: Pendentes & Vencidas */}
        <div className="grid grid-cols-2 gap-2.5">
          <div 
            onClick={() => setActiveTab(activeTab === 'pendentes' ? 'todas' : 'pendentes')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'pendentes' ? 'border-primary ring-1 ring-primary/20' : 'border-border/80'
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
              {stats.countPendentes} cobranças
            </div>
          </div>

          <div 
            onClick={() => setActiveTab(activeTab === 'vencidas' ? 'todas' : 'vencidas')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'vencidas' ? 'border-rose-500 ring-1 ring-rose-500/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" />
                Vencidas
              </span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-base font-black text-rose-600 dark:text-rose-400 truncate">
              {formatCurrency(stats.totalVencido)}
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY SEARCH & FILTER BAR */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, título, valor..."
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
                {(statusFilter !== 'todos' || canalFilter !== 'todos') && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Filtros de Cobrança</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Filtre por canal de comunicação e status de envio.
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4 text-xs">
                {/* Status */}
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Status da Cobrança</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'Pendente', label: 'Pendente' },
                      { id: 'Enviada', label: 'Enviada' },
                      { id: 'Lida', label: 'Lida' },
                      { id: 'Vencida', label: 'Vencida' },
                      { id: 'Paga', label: 'Paga' },
                    ].map((st) => (
                      <Button
                        key={st.id}
                        type="button"
                        variant={statusFilter === st.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter(st.id)}
                        className={`text-xs h-8 ${statusFilter === st.id ? 'bg-primary text-white' : ''}`}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Canal */}
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Canal de Disparo</label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'WhatsApp', label: 'WhatsApp' },
                      { id: 'E-mail', label: 'E-mail' },
                      { id: 'SMS', label: 'SMS' },
                    ].map((c) => (
                      <Button
                        key={c.id}
                        type="button"
                        variant={canalFilter === c.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCanalFilter(c.id)}
                        className={`text-xs h-8 ${canalFilter === c.id ? 'bg-primary text-white' : ''}`}
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-10 rounded-xl font-bold"
                >
                  Aplicar Filtros ({filteredData.length} resultados)
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Nova Cobrança */}
          <Button
            size="sm"
            onClick={() => setNovoCobrancaOpen(true)}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova
          </Button>
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'todas', label: `Todas (${cobrancas.length})` },
            { id: 'pendentes', label: `Pendentes (${stats.countPendentes})` },
            { id: 'vencidas', label: `Vencidas (${stats.countVencidas})` },
            { id: 'pagas', label: `Pagas (${stats.countPagas})` },
            { id: 'whatsapp', label: 'WhatsApp' },
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
      </div>

      {/* 3. LISTA DE COBRANÇAS (CARDS TOUCH) */}
      <div className="p-3.5 space-y-2.5">
        {filteredData.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
            <Send className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <div className="font-semibold text-sm text-foreground">Nenhuma cobrança encontrada</div>
            <p className="text-xs text-muted-foreground">
              Não encontramos cobranças correspondentes aos filtros aplicados.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setActiveTab('todas');
                setStatusFilter('todos');
                setCanalFilter('todos');
              }}
              className="text-xs"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          filteredData.map((c) => {
            const canais = Array.isArray(c.canal) ? c.canal : [];
            const isPaga = c.statusCobranca === 'Paga';
            const isVencida = c.statusCobranca === 'Vencida';
            const cleanPhone = (c.telefone || '').replace(/\D/g, '');

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCobranca(c)}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2.5 relative overflow-hidden"
              >
                {/* Linha superior colorida de status */}
                <div className={`h-1 w-full absolute top-0 left-0 ${
                  isPaga ? 'bg-emerald-500' : isVencida ? 'bg-rose-500' : 'bg-primary'
                }`} />

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                        {c.id}
                      </span>
                      {getStatusBadge(c.statusCobranca)}
                    </div>
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {c.cliente || 'Cliente'}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {c.tituloReferencia || 'Título Financeiro'}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-foreground">
                      {formatCurrency(c.valor || c.valorOriginal)}
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      Venc: {c.dataVencimento ? formatDateBrasilia(c.dataVencimento) : 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Canais e Ações Rápidas */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed gap-2">
                  <div className="flex items-center gap-1.5">
                    {canais.map((cn) => (
                      <span key={cn} className="flex items-center gap-0.5 text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {cn === 'WhatsApp' ? <MessageSquare className="w-3 h-3 text-green-600" /> : cn === 'E-mail' ? <Mail className="w-3 h-3 text-blue-600" /> : <Smartphone className="w-3 h-3 text-amber-600" />}
                        {cn}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    {/* Botão WhatsApp Direto */}
                    {cleanPhone && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const msg = encodeURIComponent(`Olá ${c.cliente}, informamos que o seu título ${c.tituloReferencia || ''} no valor de ${formatCurrency(c.valor)} está disponível para pagamento.`);
                          window.open(`https://wa.me/55${cleanPhone}?text=${msg}`, '_blank');
                        }}
                        className="h-7 px-2 text-[10px] font-bold text-green-700 bg-green-50 dark:bg-green-950/40 border-green-500/30 gap-1 rounded-lg"
                      >
                        <MessageSquare className="w-3 h-3" />
                        Zap
                      </Button>
                    )}

                    {/* Botão Marcar como Paga */}
                    {!isPaga && (
                      <Button
                        size="sm"
                        onClick={(e) => handleMarcarPaga(c, e)}
                        className="h-7 px-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 rounded-lg"
                      >
                        <Check className="w-3 h-3" />
                        Baixar
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modais Integrados */}
      <NovaCobrancaSheet open={novaCobrancaOpen} onOpenChange={setNovoCobrancaOpen} />
      <CobrancaDetalhesModal cobranca={selectedCobranca} open={Boolean(selectedCobranca)} onOpenChange={(op) => !op && setSelectedCobranca(null)} />
      <RegistrarRespostaModal cobranca={respostaModalCobranca} open={Boolean(respostaModalCobranca)} onOpenChange={(op) => !op && setRespostaModalCobranca(null)} />
    </div>
  );
}

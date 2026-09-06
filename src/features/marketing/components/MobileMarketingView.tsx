import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Search, Filter, Plus, Megaphone, Target, DollarSign,
  TrendingUp, Calendar, Trash2, CheckCircle2, Clock,
  Layers, ArrowUpRight, Share2, Sparkles, MoreVertical
} from 'lucide-react';
import { CampanhaMarketing } from './CampanhasMarketingView';
import { toast } from "sonner";

const defaultCampanhas: CampanhaMarketing[] = [
  {
    id: 'camp-1',
    nome: 'Black Friday 2026',
    objetivo: 'Aquisição de novos clientes via promoção de fim de ano',
    status: 'Em Andamento',
    progresso: 65,
    orcamentoTotal: 'R$ 12.000',
    gasto: 'R$ 7.800',
    dataInicio: '2026-11-01',
    dataFim: '2026-11-30',
    canais: ['Meta Ads', 'Google Ads', 'E-mail'],
    responsavel: 'Ana Lima',
  },
  {
    id: 'camp-2',
    nome: 'Captação de Leads ERP Q3',
    objetivo: 'Geração de leads qualificados para o produto ERP',
    status: 'Em Andamento',
    progresso: 40,
    orcamentoTotal: 'R$ 8.500',
    gasto: 'R$ 3.400',
    dataInicio: '2026-07-01',
    dataFim: '2026-09-30',
    canais: ['Google Ads', 'LinkedIn Ads'],
    responsavel: 'Carlos Oliveira',
  },
  {
    id: 'camp-3',
    nome: 'Webinar: Gestão Financeira 2027',
    objetivo: 'Posicionamento de marca e captação de leads via evento online',
    status: 'Planejamento',
    progresso: 15,
    orcamentoTotal: 'R$ 3.200',
    gasto: 'R$ 480',
    dataInicio: '2026-09-10',
    dataFim: '2026-09-10',
    canais: ['LinkedIn Ads', 'E-mail'],
    responsavel: 'Beatriz Santos',
  },
];

const CANAIS_OPCOES = ['Meta Ads', 'Google Ads', 'LinkedIn Ads', 'TikTok Ads', 'E-mail Marketing', 'SEO / Orgânico', 'YouTube', 'WhatsApp'];

const parseCurrencyString = (str?: string): number => {
  if (!str) return 0;
  const clean = str.replace(/[^\d,.-]/g, '').replace(',', '.');
  return parseFloat(clean) || 0;
};

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export function MobileMarketingView() {
  const { data: campanhas = [], addItem, removeItem, updateItem } = useLocalStorageState<CampanhaMarketing>('focus_marketing_campanhas', defaultCampanhas);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todas' | 'andamento' | 'planejamento' | 'concluidas' | 'pausadas'>('todas');
  const [canalFilter, setCanalFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [novoModalOpen, setNovoModalOpen] = useState(false);
  const [selectedCampanha, setSelectedCampanha] = useState<CampanhaMarketing | null>(null);

  // Form State
  const [form, setForm] = useState({
    nome: '',
    objetivo: '',
    status: 'Planejamento',
    orcamentoTotal: '',
    dataInicio: '',
    dataFim: '',
    responsavel: '',
    canais: [] as string[],
  });

  const toggleFormCanal = (canal: string) => {
    setForm(f => ({
      ...f,
      canais: f.canais.includes(canal) ? f.canais.filter(c => c !== canal) : [...f.canais, canal],
    }));
  };

  const handleCriarCampanha = () => {
    if (!form.nome.trim()) { toast.error('Informe o nome da campanha'); return; }
    if (!form.objetivo.trim()) { toast.error('Informe o objetivo'); return; }
    if (form.canais.length === 0) { toast.error('Selecione ao menos um canal'); return; }

    const nova: CampanhaMarketing = {
      id: `camp-${Date.now()}`,
      nome: form.nome,
      objetivo: form.objetivo,
      status: form.status,
      progresso: form.status === 'Em Andamento' ? 10 : 0,
      orcamentoTotal: form.orcamentoTotal || 'R$ 0',
      gasto: 'R$ 0',
      dataInicio: form.dataInicio || new Date().toISOString().split('T')[0],
      dataFim: form.dataFim || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      canais: form.canais,
      responsavel: form.responsavel || 'Equipe Marketing',
    };

    addItem(nova);
    toast.success(`Campanha "${nova.nome}" criada com sucesso!`);
    setNovoModalOpen(false);
    setForm({ nome: '', objetivo: '', status: 'Planejamento', orcamentoTotal: '', dataInicio: '', dataFim: '', responsavel: '', canais: [] });
  };

  // KPIs
  const stats = useMemo(() => {
    let totalOrcamento = 0;
    let totalGasto = 0;
    let ativas = 0;
    let planejamento = 0;
    let concluidas = 0;
    let somaProgresso = 0;

    campanhas.forEach(c => {
      totalOrcamento += parseCurrencyString(c.orcamentoTotal);
      totalGasto += parseCurrencyString(c.gasto);
      somaProgresso += Number(c.progresso) || 0;

      if (c.status === 'Em Andamento') ativas++;
      else if (c.status === 'Planejamento') planejamento++;
      else if (c.status === 'Concluída') concluidas++;
    });

    const progressoMedio = campanhas.length > 0 ? Math.round(somaProgresso / campanhas.length) : 0;

    return {
      totalOrcamento,
      totalGasto,
      ativas,
      planejamento,
      concluidas,
      progressoMedio,
      totalCount: campanhas.length
    };
  }, [campanhas]);

  // Filtragem
  const filteredData = useMemo(() => {
    return campanhas.filter(c => {
      if (!c) return false;
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (c.nome || '').toLowerCase().includes(search) ||
        (c.objetivo || '').toLowerCase().includes(search) ||
        (c.responsavel || '').toLowerCase().includes(search) ||
        (c.canais || []).some(cn => cn.toLowerCase().includes(search));

      if (!matchSearch) return false;

      // Abas Rápidas
      if (activeTab === 'andamento' && c.status !== 'Em Andamento') return false;
      if (activeTab === 'planejamento' && c.status !== 'Planejamento') return false;
      if (activeTab === 'concluidas' && c.status !== 'Concluída') return false;
      if (activeTab === 'pausadas' && c.status !== 'Pausada') return false;

      // Filtros detalhados
      if (statusFilter !== 'todos' && c.status !== statusFilter) return false;
      if (canalFilter !== 'todos' && !(c.canais || []).includes(canalFilter)) return false;

      return true;
    });
  }, [campanhas, searchTerm, activeTab, statusFilter, canalFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Em Andamento':
        return <Badge className="bg-blue-600 text-white text-[10px] font-bold">Em Andamento</Badge>;
      case 'Concluída':
        return <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Concluída</Badge>;
      case 'Planejamento':
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-[10px] font-bold">Planejamento</Badge>;
      case 'Pausada':
        return <Badge variant="secondary" className="text-slate-600 dark:text-slate-400 text-[10px] font-bold">Pausada</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. TOP CARDS & RESUMO KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        {/* Card Principal */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Megaphone className="w-3.5 h-3.5 text-primary" />
              Orçamento de Marketing
            </span>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {formatCurrency(stats.totalOrcamento)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Consumido: <span className="font-semibold text-rose-600 dark:text-rose-400">{formatCurrency(stats.totalGasto)}</span> ({stats.totalOrcamento > 0 ? Math.round((stats.totalGasto / stats.totalOrcamento) * 100) : 0}%)
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
              {stats.ativas} ativas
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {stats.progressoMedio}% progresso médio
            </span>
          </div>
        </div>

        {/* Mini Cards: Ativas & Planejamento */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => setActiveTab(activeTab === 'andamento' ? 'todas' : 'andamento')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'andamento' ? 'border-primary ring-1 ring-primary/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-blue-500" />
                Em Andamento
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="text-base font-black text-blue-600 dark:text-blue-400">
              {stats.ativas} campanhas
            </div>
          </div>

          <div
            onClick={() => setActiveTab(activeTab === 'planejamento' ? 'todas' : 'planejamento')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'planejamento' ? 'border-amber-500 ring-1 ring-amber-500/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Clock className="w-3 h-3 text-amber-500" />
                Planejamento
              </span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-base font-black text-amber-600 dark:text-amber-400">
              {stats.planejamento} em pauta
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
              placeholder="Buscar campanha, canal, objetivo..."
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
                <SheetTitle className="text-base font-bold text-left">Filtros de Marketing</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Filtre por canal de veiculação e status da campanha.
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4 text-xs">
                {/* Status */}
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Status</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'todos', label: 'Todos os Status' },
                      { id: 'Em Andamento', label: 'Em Andamento' },
                      { id: 'Planejamento', label: 'Planejamento' },
                      { id: 'Concluída', label: 'Concluída' },
                      { id: 'Pausada', label: 'Pausada' },
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
                  <label className="font-semibold text-muted-foreground block mb-2">Canal de Mídia</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={canalFilter === 'todos' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setCanalFilter('todos')}
                      className={`text-xs h-8 ${canalFilter === 'todos' ? 'bg-primary text-white' : ''}`}
                    >
                      Todos os Canais
                    </Button>
                    {CANAIS_OPCOES.map((c) => (
                      <Button
                        key={c}
                        type="button"
                        variant={canalFilter === c ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCanalFilter(c)}
                        className={`text-xs h-8 ${canalFilter === c ? 'bg-primary text-white' : ''}`}
                      >
                        {c}
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

          {/* Botão Nova Campanha */}
          <Button
            size="sm"
            onClick={() => setNovoModalOpen(true)}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova
          </Button>
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'todas', label: `Todas (${campanhas.length})` },
            { id: 'andamento', label: `Em Andamento (${stats.ativas})` },
            { id: 'planejamento', label: `Planejamento (${stats.planejamento})` },
            { id: 'concluidas', label: `Concluídas (${stats.concluidas})` },
            { id: 'pausadas', label: 'Pausadas' },
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

      {/* 3. LISTA DE CAMPANHAS (CARDS TOUCH) */}
      <div className="p-3.5 space-y-2.5">
        {filteredData.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
            <Megaphone className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <div className="font-semibold text-sm text-foreground">Nenhuma campanha encontrada</div>
            <p className="text-xs text-muted-foreground">
              Não encontramos campanhas correspondentes aos filtros aplicados.
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
            const canais = Array.isArray(c.canais) ? c.canais : [];

            return (
              <div
                key={c.id}
                onClick={() => setSelectedCampanha(c)}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2.5 relative overflow-hidden"
              >
                {/* Linha superior colorida */}
                <div className={`h-1 w-full absolute top-0 left-0 ${
                  c.status === 'Em Andamento' ? 'bg-blue-500' :
                  c.status === 'Concluída' ? 'bg-emerald-500' :
                  c.status === 'Planejamento' ? 'bg-amber-500' : 'bg-slate-400'
                }`} />

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      {getStatusBadge(c.status)}
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                        <Avatar className="h-4 w-4">
                          <AvatarFallback className="text-[8px] bg-primary/20 text-primary font-bold">
                            {c.responsavel?.charAt(0) || 'M'}
                          </AvatarFallback>
                        </Avatar>
                        {c.responsavel || 'Marketing'}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {c.nome}
                    </h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {c.objetivo}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-foreground">
                      {c.orcamentoTotal || 'R$ 0'}
                    </div>
                    <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold block mt-0.5">
                      Gasto: {c.gasto || 'R$ 0'}
                    </span>
                  </div>
                </div>

                {/* Barra de Progresso */}
                <div className="space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-muted-foreground">Progresso</span>
                    <span className="font-bold text-foreground">{c.progresso}%</span>
                  </div>
                  <Progress value={c.progresso} className="h-1.5" />
                </div>

                {/* Canais e Datas */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed gap-2">
                  <div className="flex flex-wrap gap-1 items-center">
                    {canais.slice(0, 3).map((cn) => (
                      <span key={cn} className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                        {cn}
                      </span>
                    ))}
                    {canais.length > 3 && (
                      <span className="text-[10px] text-muted-foreground font-bold">
                        +{canais.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        removeItem(c.id);
                        toast.success('Campanha removida com sucesso!');
                      }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova Campanha */}
      <Dialog open={novoModalOpen} onOpenChange={setNovoModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Megaphone className="w-5 h-5 text-primary" /> Nova Campanha de Marketing
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome da Campanha *</Label>
              <Input
                placeholder="Ex: Black Friday 2026"
                value={form.nome}
                onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Objetivo Principal *</Label>
              <Textarea
                placeholder="Descreva o objetivo da campanha..."
                value={form.objetivo}
                onChange={e => setForm(f => ({ ...f, objetivo: e.target.value }))}
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Status</Label>
                <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejamento">Planejamento</SelectItem>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Pausada">Pausada</SelectItem>
                    <SelectItem value="Concluída">Concluída</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Orçamento Total</Label>
                <Input
                  placeholder="Ex: R$ 5.000"
                  value={form.orcamentoTotal}
                  onChange={e => setForm(f => ({ ...f, orcamentoTotal: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data Início</Label>
                <Input
                  type="date"
                  value={form.dataInicio}
                  onChange={e => setForm(f => ({ ...f, dataInicio: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data Fim</Label>
                <Input
                  type="date"
                  value={form.dataFim}
                  onChange={e => setForm(f => ({ ...f, dataFim: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Responsável</Label>
              <Input
                placeholder="Ex: Ana Lima"
                value={form.responsavel}
                onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Canais de Mídia *</Label>
              <div className="flex flex-wrap gap-1.5">
                {CANAIS_OPCOES.map(canal => (
                  <button
                    key={canal}
                    type="button"
                    onClick={() => toggleFormCanal(canal)}
                    className={`px-2.5 py-1 rounded-full border text-[11px] font-medium transition-all ${
                      form.canais.includes(canal)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted/30 text-muted-foreground border-border hover:border-primary/50'
                    }`}
                  >
                    {canal}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setNovoModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCriarCampanha} className="gap-1 bg-primary text-white font-bold">
              <Plus className="w-4 h-4"/> Criar Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes da Campanha */}
      <Dialog open={Boolean(selectedCampanha)} onOpenChange={(op) => !op && setSelectedCampanha(null)}>
        {selectedCampanha && (
          <DialogContent className="max-w-md rounded-2xl p-5">
            <DialogHeader>
              <div className="flex items-center justify-between gap-2">
                {getStatusBadge(selectedCampanha.status)}
                <span className="text-xs text-muted-foreground">{selectedCampanha.responsavel}</span>
              </div>
              <DialogTitle className="text-lg font-bold mt-2">{selectedCampanha.nome}</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2 text-xs">
              <div>
                <span className="text-muted-foreground block mb-1 font-semibold">Objetivo</span>
                <p className="text-foreground bg-muted/30 p-2.5 rounded-xl border border-border/80">
                  {selectedCampanha.objetivo}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Orçamento Total</span>
                  <span className="font-extrabold text-sm text-foreground">{selectedCampanha.orcamentoTotal}</span>
                </div>
                <div className="bg-muted/30 p-2.5 rounded-xl border border-border/80">
                  <span className="text-muted-foreground block text-[10px]">Gasto Realizado</span>
                  <span className="font-extrabold text-sm text-rose-600 dark:text-rose-400">{selectedCampanha.gasto}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-muted-foreground">Progresso da Campanha</span>
                  <span className="font-bold">{selectedCampanha.progresso}%</span>
                </div>
                <Progress value={selectedCampanha.progresso} className="h-2" />
              </div>

              <div>
                <span className="text-muted-foreground block mb-1.5 font-semibold">Canais Ativos</span>
                <div className="flex flex-wrap gap-1.5">
                  {(selectedCampanha.canais || []).map(cn => (
                    <Badge key={cn} variant="secondary" className="text-xs">{cn}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const nextStatus = selectedCampanha.status === 'Em Andamento' ? 'Concluída' : 'Em Andamento';
                  updateItem(selectedCampanha.id, { status: nextStatus, progresso: nextStatus === 'Concluída' ? 100 : selectedCampanha.progresso });
                  toast.success(`Status alterado para "${nextStatus}"`);
                  setSelectedCampanha(null);
                }}
              >
                {selectedCampanha.status === 'Em Andamento' ? 'Marcar Concluída' : 'Ativar Campanha'}
              </Button>
              <Button size="sm" onClick={() => setSelectedCampanha(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </div>
  );
}

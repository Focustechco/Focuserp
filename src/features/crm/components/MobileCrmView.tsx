import React, { useState, useMemo } from 'react';
import { useCrmStore } from '../hooks/useCrmStore';
import { OportunidadeCrm, ClickUpStatusItem } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Plus, DollarSign, TrendingUp, Target,
  RefreshCw, Building2, User, Calendar, Tag, ExternalLink,
  Trash2, CheckCircle2, ChevronRight, Award, Flame, AlertCircle
} from 'lucide-react';
import { OportunidadeDetalhesModal } from './OportunidadeDetalhesModal';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileCrmView() {
  const {
    config,
    oportunidades,
    isLoadingClickUp,
    importRealClickUpTasks,
    moverOportunidadeEtapa,
    updateOportunidadeValor,
    addOportunidade,
    deleteOportunidade
  } = useCrmStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEtapaPill, setSelectedEtapaPill] = useState<string>('todas');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('todas');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [novaOpModalOpen, setNovaOpModalOpen] = useState(false);
  const [selectedOp, setSelectedOp] = useState<OportunidadeCrm | null>(null);

  // Form Nova Oportunidade
  const [formOp, setFormOp] = useState({
    titulo: '',
    empresaNome: '',
    contatoNome: '',
    valorR$: '',
    etapa: 'Qualificação',
    prioridade: 'Alta' as const,
    responsavel: '',
    proximaAcao: ''
  });

  const availableStatuses: ClickUpStatusItem[] = useMemo(() => {
    if (config.listStatuses && config.listStatuses.length > 0) {
      return config.listStatuses;
    }
    return [
      { status: 'Qualificação', color: '#6366f1' },
      { status: 'Proposta', color: '#3b82f6' },
      { status: 'Negociação', color: '#f59e0b' },
      { status: 'Fechado Ganho', color: '#10b981' },
      { status: 'Perdido', color: '#ef4444' },
    ];
  }, [config.listStatuses]);

  // KPIs
  const stats = useMemo(() => {
    let totalPipeline = 0;
    let totalGanho = 0;
    let countGanhos = 0;
    let countAbertas = 0;

    oportunidades.forEach(op => {
      const st = (op.etapa || '').toLowerCase();
      const val = Number(op.valorR$) || 0;
      const isGanho = st.includes('ganh') || st.includes('won') || st.includes('fechad') || st.includes('complet');
      const isPerdido = st.includes('perdid') || st.includes('lost') || st.includes('cancel');

      if (isGanho) {
        totalGanho += val;
        countGanhos++;
      } else if (!isPerdido) {
        totalPipeline += val;
        countAbertas++;
      }
    });

    const taxaConversao = oportunidades.length > 0 ? ((countGanhos / oportunidades.length) * 100).toFixed(1) : '0.0';

    return {
      totalPipeline,
      totalGanho,
      countGanhos,
      countAbertas,
      taxaConversao,
      totalCount: oportunidades.length
    };
  }, [oportunidades]);

  // Filtragem
  const filteredOportunidades = useMemo(() => {
    return oportunidades.filter(op => {
      if (!op) return false;
      const s = searchTerm.toLowerCase();
      const matchSearch =
        (op.titulo || '').toLowerCase().includes(s) ||
        (op.empresaNome || '').toLowerCase().includes(s) ||
        (op.clickUpTaskId || '').toLowerCase().includes(s) ||
        (op.responsavel || '').toLowerCase().includes(s);

      if (!matchSearch) return false;

      // Filtro da pílula
      if (selectedEtapaPill !== 'todas') {
        if (selectedEtapaPill === 'ganhos') {
          const st = (op.etapa || '').toLowerCase();
          if (!st.includes('ganh') && !st.includes('won') && !st.includes('fechad') && !st.includes('complet')) return false;
        } else if (selectedEtapaPill === 'perdidos') {
          const st = (op.etapa || '').toLowerCase();
          if (!st.includes('perdid') && !st.includes('lost') && !st.includes('cancel')) return false;
        } else {
          if (op.etapa?.toLowerCase() !== selectedEtapaPill.toLowerCase()) return false;
        }
      }

      // Filtro de Prioridade
      if (prioridadeFilter !== 'todas' && op.prioridade !== prioridadeFilter) return false;

      return true;
    });
  }, [oportunidades, searchTerm, selectedEtapaPill, prioridadeFilter]);

  const handleCreateOportunidade = async () => {
    if (!formOp.titulo.trim()) { toast.error('Informe o título da oportunidade'); return; }
    if (!formOp.empresaNome.trim()) { toast.error('Informe a empresa'); return; }

    const val = parseFloat(formOp.valorR$.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    await addOportunidade({
      titulo: formOp.titulo,
      empresaNome: formOp.empresaNome,
      contatoNome: formOp.contatoNome || 'Contato Comercial',
      valorR$: val,
      probabilidadePercent: formOp.etapa.toLowerCase().includes('ganh') ? 100 : 50,
      responsavel: formOp.responsavel || 'Time Comercial',
      pipeline: config.listName || 'Pipeline Geral',
      etapa: formOp.etapa,
      prioridade: formOp.prioridade,
      tags: ['Mobile'],
      dataPrevistaFechamento: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      proximaAcao: formOp.proximaAcao || 'Acompanhamento comercial'
    });

    setNovaOpModalOpen(false);
    setFormOp({ titulo: '', empresaNome: '', contatoNome: '', valorR$: '', etapa: 'Qualificação', prioridade: 'Alta', responsavel: '', proximaAcao: '' });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. TOP CARDS & RESUMO KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        {/* Card Principal: Pipeline Ativo */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              Pipeline em Aberto
            </span>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {formatCurrency(stats.totalPipeline)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {stats.countAbertas} oportunidades ativas
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              {formatCurrency(stats.totalGanho)}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {stats.taxaConversao}% conversão ({stats.countGanhos} ganhos)
            </span>
          </div>
        </div>

        {/* Mini Cards: Sincronização ClickUp & Status */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => importRealClickUpTasks()}
            className="bg-white dark:bg-card border border-border/80 rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99]"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <RefreshCw className={`w-3 h-3 text-orange-500 ${isLoadingClickUp ? 'animate-spin' : ''}`} />
                ClickUp Real
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-xs font-bold text-foreground truncate">
              {isLoadingClickUp ? 'Sincronizando...' : (config.listName || 'Sincronizar')}
            </div>
          </div>

          <div
            onClick={() => setSelectedEtapaPill('ganhos')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              selectedEtapaPill === 'ganhos' ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Award className="w-3 h-3 text-emerald-600" />
                Ganhos
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
              {stats.countGanhos} negócios
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
              placeholder="Buscar oportunidade, empresa..."
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
                {prioridadeFilter !== 'todas' && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Filtros do CRM</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Filtre por nível de prioridade da oportunidade.
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Prioridade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['todas', 'Urgente', 'Alta', 'Normal', 'Baixa'].map((pr) => (
                      <Button
                        key={pr}
                        type="button"
                        variant={prioridadeFilter === pr ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPrioridadeFilter(pr)}
                        className={`text-xs h-8 ${prioridadeFilter === pr ? 'bg-primary text-white' : ''}`}
                      >
                        {pr === 'todas' ? 'Todas' : pr}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-10 rounded-xl font-bold"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Nova Oportunidade */}
          <Button
            size="sm"
            onClick={() => setNovaOpModalOpen(true)}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </Button>
        </div>

        {/* Category Pills (Etapas do Pipeline) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          <button
            onClick={() => setSelectedEtapaPill('todas')}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 ${
              selectedEtapaPill === 'todas'
                ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            Todas ({oportunidades.length})
          </button>

          {availableStatuses.map((st) => {
            const isActive = selectedEtapaPill.toLowerCase() === st.status.toLowerCase();
            const count = oportunidades.filter(o => (o.etapa || '').toLowerCase() === st.status.toLowerCase()).length;
            return (
              <button
                key={st.status}
                onClick={() => setSelectedEtapaPill(st.status)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: st.color || '#94a3b8' }} />
                <span>{st.status} ({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LISTA DE OPORTUNIDADES (CARDS TOUCH) */}
      <div className="p-3.5 space-y-2.5">
        {filteredOportunidades.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
            <Target className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <div className="font-semibold text-sm text-foreground">Nenhuma oportunidade encontrada</div>
            <p className="text-xs text-muted-foreground">
              Não encontramos oportunidades com os filtros aplicados.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedEtapaPill('todas');
                setPrioridadeFilter('todas');
              }}
              className="text-xs"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          filteredOportunidades.map((op) => {
            const isGanho = (op.etapa || '').toLowerCase().includes('ganh') ||
                            (op.etapa || '').toLowerCase().includes('won') ||
                            (op.etapa || '').toLowerCase().includes('fechad') ||
                            (op.etapa || '').toLowerCase().includes('complet');

            return (
              <div
                key={op.id}
                onClick={() => setSelectedOp(op)}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2.5 relative overflow-hidden"
              >
                {/* Linha superior colorida de status */}
                <div
                  className="h-1 w-full absolute top-0 left-0"
                  style={{ backgroundColor: op.statusColor || (isGanho ? '#10b981' : '#f59e0b') }}
                />

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                        {op.clickUpTaskId}
                      </span>
                      <Badge
                        className="text-[10px] font-bold text-white"
                        style={{ backgroundColor: op.statusColor || '#6366f1' }}
                      >
                        {op.etapa}
                      </Badge>
                      <Badge variant="outline" className="text-[10px]">
                        {op.prioridade}
                      </Badge>
                    </div>

                    <h4 className="font-bold text-sm text-foreground truncate">
                      {op.titulo}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                      <Building2 className="w-3 h-3" /> {op.empresaNome}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-foreground">
                      {formatCurrency(op.valorR$)}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      {op.probabilidadePercent}% prob.
                    </span>
                  </div>
                </div>

                {/* Detalhes inferiores e Ações */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed gap-2">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground truncate">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-[8px] bg-orange-100 text-orange-600 font-bold">
                        {op.responsavel?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">{op.responsavel}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 text-[10px] font-bold text-primary">
                    Ver detalhes <ChevronRight className="w-3 h-3" />
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova Oportunidade */}
      <Dialog open={novaOpModalOpen} onOpenChange={setNovaOpModalOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Plus className="w-5 h-5 text-primary" /> Nova Oportunidade no CRM
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Título do Negócio *</Label>
              <Input
                placeholder="Ex: Licenciamento ERP Focus 50 Users"
                value={formOp.titulo}
                onChange={e => setFormOp(f => ({ ...f, titulo: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Empresa *</Label>
                <Input
                  placeholder="Nome da empresa"
                  value={formOp.empresaNome}
                  onChange={e => setFormOp(f => ({ ...f, empresaNome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Contato</Label>
                <Input
                  placeholder="Nome do contato"
                  value={formOp.contatoNome}
                  onChange={e => setFormOp(f => ({ ...f, contatoNome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor em R$</Label>
                <Input
                  placeholder="Ex: 25.000,00"
                  value={formOp.valorR$}
                  onChange={e => setFormOp(f => ({ ...f, valorR$: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Etapa Inicial</Label>
                <Select value={formOp.etapa} onValueChange={v => setFormOp(f => ({ ...f, etapa: v }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {availableStatuses.map(st => (
                      <SelectItem key={st.status} value={st.status}>{st.status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Prioridade</Label>
                <Select value={formOp.prioridade} onValueChange={v => setFormOp(f => ({ ...f, prioridade: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Responsável</Label>
                <Input
                  placeholder="Ex: Carlos Oliveira"
                  value={formOp.responsavel}
                  onChange={e => setFormOp(f => ({ ...f, responsavel: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Próxima Ação / Detalhes</Label>
              <Textarea
                placeholder="Ex: Agendar reunião de alinhamento com diretoria..."
                value={formOp.proximaAcao}
                onChange={e => setFormOp(f => ({ ...f, proximaAcao: e.target.value }))}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setNovaOpModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateOportunidade} className="bg-primary text-white font-bold">
              Criar Oportunidade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalhes da Oportunidade */}
      <OportunidadeDetalhesModal
        oportunidade={selectedOp}
        availableStatuses={availableStatuses}
        open={Boolean(selectedOp)}
        onOpenChange={(op) => !op && setSelectedOp(null)}
        onMoverEtapa={(id, novaEtapa, color) => {
          moverOportunidadeEtapa(id, novaEtapa, color);
          if (selectedOp && selectedOp.id === id) {
            setSelectedOp({ ...selectedOp, etapa: novaEtapa, statusColor: color || selectedOp.statusColor });
          }
        }}
        onUpdateValor={(id, novoValor) => {
          updateOportunidadeValor(id, novoValor);
          if (selectedOp && selectedOp.id === id) {
            setSelectedOp({ ...selectedOp, valorR$: novoValor });
          }
        }}
        onDelete={(id) => {
          deleteOportunidade(id);
          setSelectedOp(null);
        }}
      />
    </div>
  );
}

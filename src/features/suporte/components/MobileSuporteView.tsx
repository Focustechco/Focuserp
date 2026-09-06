import React, { useState, useMemo } from 'react';
import { useSuporte } from '../useSuporte';
import { ChamadoSuporte, StatusChamado, PrioridadeChamado } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Headphones, Search, Filter, Plus, ChevronRight, Clock,
  CheckCircle2, AlertTriangle, MessageSquare, Building2,
  Boxes, User, ArrowLeft, MoreVertical, ShieldAlert, Code2,
  Calendar, Eye, Send
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovoChamadoModal } from './NovoChamadoModal';
import { WorkspaceChamado } from './WorkspaceChamado';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

export function MobileSuporteView() {
  const {
    chamados,
    clientes,
    produtos,
    projetos,
    csCustomers,
    artigosKB,
    mensagens,
    timelineEvents,
    abrirNovoChamado,
    responderChamado,
    converterEmTarefaDev,
    getCsContextDoCliente,
  } = useSuporte();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'abertos' | 'atendimento' | 'criticos' | 'resolvidos' | 'dev'>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<ChamadoSuporte | null>(null);

  // Métricas
  const stats = useMemo(() => {
    const total = chamados.length;
    const abertos = chamados.filter(c => c.status === 'Aberto').length;
    const emAtendimento = chamados.filter(c => c.status === 'Em Atendimento' || c.status === 'Aguardando Cliente').length;
    const resolvidos = chamados.filter(c => c.status === 'Resolvido').length;
    const criticos = chamados.filter(c => c.prioridade === 'Crítica' || c.prioridade === 'Alta').length;

    return { total, abertos, emAtendimento, resolvidos, criticos };
  }, [chamados]);

  // Filtro
  const filteredChamados = useMemo(() => {
    return chamados.filter((c) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (c.numero || '').toLowerCase().includes(search) ||
        (c.titulo || '').toLowerCase().includes(search) ||
        (c.clienteNome || '').toLowerCase().includes(search) ||
        (c.produtoNome || '').toLowerCase().includes(search) ||
        (c.atendenteNome || '').toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Abas rápidas
      if (activeTab === 'abertos' && c.status !== 'Aberto') return false;
      if (activeTab === 'atendimento' && !['Em Atendimento', 'Aguardando Cliente'].includes(c.status)) return false;
      if (activeTab === 'criticos' && c.prioridade !== 'Crítica' && c.prioridade !== 'Alta') return false;
      if (activeTab === 'resolvidos' && c.status !== 'Resolvido') return false;
      if (activeTab === 'dev' && c.status !== 'Em Desenvolvimento') return false;

      // Filtros do Sheet
      if (statusFilter !== 'all' && c.status !== statusFilter) return false;
      if (prioridadeFilter !== 'all' && c.prioridade !== prioridadeFilter) return false;

      return true;
    });
  }, [chamados, searchTerm, activeTab, statusFilter, prioridadeFilter]);

  const getStatusBadge = (status: StatusChamado) => {
    switch (status) {
      case 'Aberto':
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white text-[10px] px-2 py-0.5">Aberto</Badge>;
      case 'Em Atendimento':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] px-2 py-0.5">Em Atendimento</Badge>;
      case 'Aguardando Cliente':
        return <Badge className="bg-purple-500 hover:bg-purple-600 text-white text-[10px] px-2 py-0.5">Aguardando Cliente</Badge>;
      case 'Em Desenvolvimento':
        return <Badge className="bg-indigo-500 hover:bg-indigo-600 text-white text-[10px] px-2 py-0.5">Em Desenvolvimento</Badge>;
      case 'Resolvido':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] px-2 py-0.5">Resolvido</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
    }
  };

  const getPrioridadeBadge = (prio: PrioridadeChamado) => {
    switch (prio) {
      case 'Crítica':
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-300 font-bold text-[10px] gap-1 animate-pulse">
            <AlertTriangle className="w-2.5 h-2.5 text-rose-600" /> Crítica
          </Badge>
        );
      case 'Alta':
        return (
          <Badge variant="outline" className="bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-300 font-semibold text-[10px]">
            Alta
          </Badge>
        );
      case 'Média':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 text-[10px]">
            Média
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground border-border/70 text-[10px]">
            Baixa
          </Badge>
        );
    }
  };

  // Se um chamado estiver selecionado, abre o Workspace em tela cheia mobile
  if (selectedChamado) {
    const csCtx = selectedChamado.clienteId ? getCsContextDoCliente(selectedChamado.clienteId) : undefined;

    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSelectedChamado(null)}
            className="h-8 w-8 rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-sm text-foreground truncate">
              {selectedChamado.numero}: {selectedChamado.titulo}
            </h2>
            <p className="text-[11px] text-muted-foreground truncate">
              {selectedChamado.clienteNome} • {selectedChamado.produtoNome}
            </p>
          </div>
        </div>

        <div className="p-4">
          <WorkspaceChamado
            chamado={selectedChamado}
            mensagens={mensagens}
            timelineEvents={timelineEvents}
            csContext={csCtx}
            projetos={projetos}
            artigosKB={artigosKB}
            onBack={() => setSelectedChamado(null)}
            onResponder={responderChamado}
            onConverterDev={converterEmTarefaDev}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-4 py-2.5 space-y-2">
        {/* Barra de Busca + Filtro Sheet + Botão Novo Chamado */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por número (TK-1001), assunto..."
              className="pl-9 h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus:bg-background"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-9 w-9 rounded-xl shrink-0 ${
                  statusFilter !== 'all' || prioridadeFilter !== 'all'
                    ? 'border-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-950/40'
                    : 'border-muted-foreground/20'
                }`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 py-6">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-base font-bold">Filtrar Chamados</SheetTitle>
                <SheetDescription className="text-xs">
                  Refine por status de atendimento e prioridade
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-2">Status do Chamado</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'Todos os Status' },
                      { id: 'Aberto', label: 'Aberto' },
                      { id: 'Em Atendimento', label: 'Em Atendimento' },
                      { id: 'Aguardando Cliente', label: 'Aguardando Cliente' },
                      { id: 'Em Desenvolvimento', label: 'Em Desenvolvimento' },
                      { id: 'Resolvido', label: 'Resolvido' },
                    ].map((st) => (
                      <Button
                        key={st.id}
                        type="button"
                        variant={statusFilter === st.id ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs h-9 rounded-lg"
                        onClick={() => setStatusFilter(st.id)}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-2">Prioridade</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'Todas as Prioridades' },
                      { id: 'Crítica', label: 'Crítica' },
                      { id: 'Alta', label: 'Alta' },
                      { id: 'Média', label: 'Média' },
                      { id: 'Baixa', label: 'Baixa' },
                    ].map((p) => (
                      <Button
                        key={p.id}
                        type="button"
                        variant={prioridadeFilter === p.id ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs h-9 rounded-lg"
                        onClick={() => setPrioridadeFilter(p.id)}
                      >
                        {p.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="flex-1 text-xs h-10 rounded-xl"
                  onClick={() => {
                    setStatusFilter('all');
                    prioridadeFilter !== 'all' && setPrioridadeFilter('all');
                    setFilterSheetOpen(false);
                  }}
                >
                  Limpar Filtros
                </Button>
                <Button
                  className="flex-1 text-xs h-10 rounded-xl font-semibold bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => setFilterSheetOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <Button
            onClick={() => setIsNovoModalOpen(true)}
            size="sm"
            className="h-9 px-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl gap-1.5 shadow-xs shrink-0"
          >
            <Plus className="w-4 h-4" /> Novo Chamado
          </Button>
        </div>

        {/* Pílulas de Abas Rápidas */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'todos'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Todos ({stats.total})
          </button>
          <button
            onClick={() => setActiveTab('abertos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'abertos'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Abertos ({stats.abertos})
          </button>
          <button
            onClick={() => setActiveTab('atendimento')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'atendimento'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Em Atendimento ({stats.emAtendimento})
          </button>
          <button
            onClick={() => setActiveTab('criticos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'criticos'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> Críticos ({stats.criticos})
          </button>
          <button
            onClick={() => setActiveTab('resolvidos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'resolvidos'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Resolvidos ({stats.resolvidos})
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cards de Métricas em Carrossel Horizontal */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-blue-50 to-blue-100/40 dark:from-blue-950/40 dark:to-blue-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 mb-1">
              <span className="text-[11px] font-semibold">Abertos</span>
              <Headphones className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-blue-700 dark:text-blue-300">
              {stats.abertos}
            </p>
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
              Aguardando triagem
            </span>
          </div>

          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-amber-50 to-amber-100/40 dark:from-amber-950/40 dark:to-amber-900/20 border border-amber-200/60 dark:border-amber-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-300 mb-1">
              <span className="text-[11px] font-semibold">Em Andamento</span>
              <Clock className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-amber-700 dark:text-amber-300">
              {stats.emAtendimento}
            </p>
            <span className="text-[10px] text-amber-600/80 dark:text-amber-400/80 block mt-0.5 font-medium">
              Com equipe técnica
            </span>
          </div>

          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 mb-1">
              <span className="text-[11px] font-semibold">Resolvidos</span>
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
              {stats.resolvidos}
            </p>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5 font-medium">
              Concluídos com sucesso
            </span>
          </div>
        </div>

        {/* Lista de Chamados */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {filteredChamados.length} {filteredChamados.length === 1 ? 'Chamado' : 'Chamados'} na Fila
            </span>
          </div>

          {filteredChamados.length === 0 ? (
            <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
              <Headphones className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm text-foreground">Nenhum chamado encontrado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                Tente alterar os filtros aplicados ou abra uma nova solicitação.
              </p>
              <Button onClick={() => setIsNovoModalOpen(true)} size="sm" className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                <Plus className="w-4 h-4 mr-1.5" /> Abrir Chamado
              </Button>
            </div>
          ) : (
            filteredChamados.map((chamado) => {
              return (
                <div
                  key={chamado.id}
                  onClick={() => setSelectedChamado(chamado)}
                  className="relative overflow-hidden bg-card border border-border/70 rounded-xl p-3.5 transition-all active:scale-[0.99] shadow-2xs hover:border-orange-500/40"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      {/* Header do Card com Número, Status e Prioridade */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded">
                          {chamado.numero}
                        </span>

                        {getStatusBadge(chamado.status)}
                        {getPrioridadeBadge(chamado.prioridade)}

                        {chamado.slaStatus === 'vencido' && (
                          <Badge variant="destructive" className="text-[10px] font-bold">
                            SLA Estourado
                          </Badge>
                        )}
                      </div>

                      {/* Título do Chamado */}
                      <h4 className="font-bold text-xs text-foreground truncate leading-snug">
                        {chamado.titulo}
                      </h4>

                      {/* Cliente e Produto */}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 truncate">
                        <span className="flex items-center gap-1 truncate text-primary font-medium">
                          <Building2 className="w-3 h-3 shrink-0" />
                          {chamado.clienteNome}
                        </span>
                        {chamado.produtoNome && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1 truncate">
                              <Boxes className="w-3 h-3 shrink-0" />
                              {chamado.produtoNome}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Botão de Workspace */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs font-semibold text-orange-600 hover:bg-orange-500/10 gap-1 rounded-lg"
                        onClick={() => setSelectedChamado(chamado)}
                      >
                        Abrir <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Rodapé do Card: Responsável, Mensagens e Data */}
                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1 truncate">
                      <User className="w-3 h-3 text-muted-foreground/70" />
                      <span className="truncate">{chamado.atendenteNome || 'Não atribuído'}</span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 text-muted-foreground/70" />
                        {chamado.mensagensCount || 1}
                      </span>
                      <span>•</span>
                      <span>{chamado.dataAbertura ? formatDateBrasilia(chamado.dataAbertura) : 'Hoje'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Novo Chamado */}
      <NovoChamadoModal
        open={isNovoModalOpen}
        onOpenChange={setIsNovoModalOpen}
        clientes={clientes}
        produtos={produtos}
        projetos={projetos}
        onAbrirChamado={abrirNovoChamado}
      />
    </div>
  );
}

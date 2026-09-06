import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flag,
  LayoutGrid,
  List,
  Filter,
  FolderKanban,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useProjetosAgenda } from './useProjetosAgenda';
import { CalendarioGridProjetos } from './CalendarioGridProjetos';
import { TimelineProjetos } from './TimelineProjetos';
import { NovoMarcoSheet } from './NovoMarcoSheet';
import { EventoProjeto } from './types';
import { Link } from '@tanstack/react-router';

export function MobileAgendaEntregasView() {
  const { eventos, projetos, addEventoCustomizado } = useProjetosAgenda();

  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modals & Sheets
  const [isNovoSheetOpen, setIsNovoSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventoProjeto | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Métricas da Agenda de Projetos
  const totalEventos = eventos.length;
  const entregasConcluidas = eventos.filter((e) => e.status === 'Concluído').length;
  const entregasAtrasadas = eventos.filter((e) => e.status === 'Atrasado').length;
  const proximasEntregas = eventos.filter(
    (e) => e.data >= todayStr && e.data <= next7DaysStr && e.status !== 'Concluído'
  ).length;

  const filteredEvents = eventos.filter((e) => {
    const matchesSearch =
      (e?.titulo || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (e?.projetoNome && e.projetoNome.toLowerCase().includes((searchTerm || '').toLowerCase())) ||
      (e?.responsavel && e.responsavel.toLowerCase().includes((searchTerm || '').toLowerCase()));
    const matchesTipo = tipoFilter === 'todos' || e.tipo === tipoFilter;
    const matchesStatus = statusFilter === 'todos' || e.status === statusFilter;
    return matchesSearch && matchesTipo && matchesStatus;
  });

  const tiposDisponiveis = [
    { id: 'todos', label: 'Todos os Tipos' },
    { id: 'Entrega de Projeto', label: 'Entregas' },
    { id: 'Kickoff', label: 'Kickoff' },
    { id: 'Homologação', label: 'Homologação' },
    { id: 'Implantação', label: 'Implantação' },
    { id: 'Marco / Milestone', label: 'Milestones' },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. STICKY TOP BAR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          {/* Busca */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar prazo, projeto, responsável..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
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

          {/* Drawer de Filtros */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-9 w-9 rounded-xl shrink-0 ${
                  tipoFilter !== 'todos' || statusFilter !== 'todos'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-muted-foreground/20'
                }`}
                aria-label="Filtros"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b text-left">
                <SheetTitle className="text-base font-bold">Filtros da Agenda de Entregas</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Filtre por tipo de entrega ou status de conclusão
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <span className="font-bold text-foreground text-xs block mb-2">Tipo de Entrega</span>
                  <div className="grid grid-cols-2 gap-2">
                    {tiposDisponiveis.map((t) => (
                      <Button
                        key={t.id}
                        type="button"
                        variant={tipoFilter === t.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTipoFilter(t.id)}
                        className={`text-xs h-9 justify-start ${
                          tipoFilter === t.id ? 'bg-primary text-white font-bold' : ''
                        }`}
                      >
                        {t.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-foreground text-xs block mb-2">Status</span>
                  <div className="grid grid-cols-2 gap-2">
                    {['todos', 'Previsto', 'Em Andamento', 'Concluído', 'Atrasado'].map((st) => (
                      <Button
                        key={st}
                        type="button"
                        variant={statusFilter === st ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter(st)}
                        className={`text-xs h-9 justify-start ${
                          statusFilter === st ? 'bg-primary text-white font-bold' : ''
                        }`}
                      >
                        {st === 'todos' ? 'Todos os Status' : st}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full h-10 bg-primary text-white font-bold rounded-xl mt-2"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Novo Marco */}
          <Button
            onClick={() => setIsNovoSheetOpen(true)}
            size="sm"
            className="h-9 px-3 bg-primary text-white font-bold text-xs rounded-xl gap-1 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Marco
          </Button>
        </div>

        {/* Pílulas de Alternância e Filtro */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {/* Toggle Grade / Linha do Tempo */}
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
              viewMode === 'grid'
                ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grade Mensal
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
              viewMode === 'timeline'
                ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                : 'bg-background text-muted-foreground border-border hover:text-foreground'
            }`}
          >
            <List className="w-3.5 h-3.5" /> Linha do Tempo
          </button>

          {/* Filtros Rápidos de Tipo */}
          {tiposDisponiveis.map((t) => {
            const isActive = tipoFilter === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTipoFilter(t.id)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border shrink-0 ${
                  isActive
                    ? 'bg-muted text-foreground border-foreground/30 font-bold'
                    : 'bg-background/60 text-muted-foreground border-border/70 hover:text-foreground'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. ÁREA DA AGENDA (AO TOPO / À FRENTE DOS CARDS NO MOBILE) */}
      <div className="p-3.5 space-y-4">
        <div>
          {viewMode === 'grid' ? (
            <CalendarioGridProjetos eventos={filteredEvents} onEventClick={setSelectedEvent} />
          ) : (
            <TimelineProjetos eventos={filteredEvents} onEventClick={setSelectedEvent} />
          )}
        </div>

        {/* 3. KPI CARDS (ABAIXO DA AGENDA NO MOBILE) */}
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Total Agendados
              </CardTitle>
              <CalendarIcon className="h-3.5 w-3.5 text-primary" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-extrabold text-foreground">{totalEventos}</div>
              <p className="text-[10px] text-muted-foreground">Marcos e datas</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Concluídas
              </CardTitle>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">
                {entregasConcluidas}
              </div>
              <p className="text-[10px] text-muted-foreground">Finalizadas</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Atrasadas / Risco
              </CardTitle>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">
                {entregasAtrasadas}
              </div>
              <p className="text-[10px] text-rose-500 font-semibold">Atenção PMO</p>
            </CardContent>
          </Card>

          <Card className="border-border/80 shadow-2xs">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 p-3">
              <CardTitle className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Próximos 7 Dias
              </CardTitle>
              <Clock className="h-3.5 w-3.5 text-amber-500" />
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="text-lg font-extrabold text-foreground">{proximasEntregas}</div>
              <p className="text-[10px] text-muted-foreground">Próximo horizonte</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* SHEET DE NOVO MARCO */}
      <NovoMarcoSheet
        open={isNovoSheetOpen}
        onOpenChange={setIsNovoSheetOpen}
        projetos={projetos}
        onAddEvent={addEventoCustomizado}
      />

      {/* MODAL DE DETALHES DO EVENTO */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Flag className="h-4 w-4 text-primary" /> Detalhes do Prazo / Marco
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informações consolidadas do evento no cronograma do projeto.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/30 border border-border space-y-1.5">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {selectedEvent.tipo}
                  </Badge>
                  <Badge
                    variant={
                      selectedEvent.status === 'Atrasado'
                        ? 'destructive'
                        : selectedEvent.status === 'Concluído'
                        ? 'outline'
                        : 'secondary'
                    }
                    className="text-[10px]"
                  >
                    {selectedEvent.status}
                  </Badge>
                </div>
                <h4 className="text-sm font-bold text-foreground leading-snug">{selectedEvent.titulo}</h4>
                {selectedEvent.projetoNome && (
                  <p className="text-xs font-semibold text-primary">Projeto: {selectedEvent.projetoNome}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg border border-border/60 text-xs">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Data do Prazo</span>
                  <span className="font-bold text-foreground">{selectedEvent.data}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Responsável</span>
                  <span className="font-semibold text-foreground">
                    {selectedEvent.responsavel || 'Não especificado'}
                  </span>
                </div>
              </div>

              {selectedEvent.observacoes && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Observações / Escopo:
                  </span>
                  <p className="p-2.5 rounded-lg bg-muted/20 text-xs text-foreground">
                    {selectedEvent.observacoes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="flex items-center justify-between pt-2">
            {selectedEvent && selectedEvent.projetoId ? (
              <Button asChild size="sm" className="gap-1.5 text-xs">
                <Link to="/projetos/$projetoId" params={{ projetoId: selectedEvent.projetoId }}>
                  <FolderKanban className="h-4 w-4" /> Ir ao Projeto
                </Link>
              </Button>
            ) : (
              <div />
            )}
            <Button variant="outline" size="sm" onClick={() => setSelectedEvent(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

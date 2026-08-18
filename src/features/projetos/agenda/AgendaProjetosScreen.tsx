import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  ListFilter,
  Plus,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Flag,
  CalendarDays,
  LayoutGrid,
  List,
  User,
  ArrowRight,
  FolderKanban,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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

export function AgendaProjetosScreen() {
  const { eventos, projetos, addEventoCustomizado, deleteCustomEvent } = useProjetosAgenda();

  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modals & Sheets
  const [isNovoSheetOpen, setIsNovoSheetOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<EventoProjeto | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

  // Mtricas da Agenda de Projetos
  const totalEventos = eventos.length;
  const entregasConcluidas = eventos.filter((e) => e.status === 'Concludo').length;
  const entregasAtrasadas = eventos.filter((e) => e.status === 'Atrasado').length;
  const proximasEntregas = eventos.filter(
    (e) => e.data >= todayStr && e.data <= next7DaysStr && e.status !== 'Concludo'
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

  return (
    <div className="space-y-6">
      {/* HEADER E KPI CARDS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-primary" /> Agenda de Entregas & Prazos PMO
          </h2>
          <p className="text-xs text-muted-foreground">
            Acompanhamento de prazos contratuais, datas de entrega de projetos, marcos de homologao e reunies
          </p>
        </div>
        <Button onClick={() => setIsNovoSheetOpen(true)} className="gap-2 text-xs font-semibold">
          <Plus className="h-4 w-4" /> Agendar Marco / Entrega
        </Button>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total de Prazos Agendados
            </CardTitle>

            <CalendarIcon className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{totalEventos}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Marcos e datas de projetos</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Entregas Concludas
            </CardTitle>

            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {entregasConcluidas}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Marcos finalizados com sucesso</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Entregas Atrasadas / Em Risco
            </CardTitle>

            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-rose-600 dark:text-rose-400">
              {entregasAtrasadas}
            </div>
            <p className="text-[11px] text-rose-500 font-semibold mt-1">Requerem ateno imediata do PMO</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Prximos 7 Dias
            </CardTitle>

            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{proximasEntregas}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Entregas no horizonte prximo</p>
          </CardContent>
        </Card>
      </div>

      {/* CONTROLES DE FILTRO E ALTERNNCIA DE VISO */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por prazo, nome do projeto ou responsvel..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>
            <div className="w-full sm:w-48">
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Tipo de Entrega" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Tipos</SelectItem>
                  <SelectItem value="Entrega de Projeto">Entrega de Projeto</SelectItem>
                  <SelectItem value="Kickoff">Kickoff</SelectItem>
                  <SelectItem value="Homologao">Homologao</SelectItem>
                  <SelectItem value="Implantao">Implantao</SelectItem>
                  <SelectItem value="Marco / Milestone">Marco / Milestone</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Previsto">Previsto</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concludo">Concludo</SelectItem>
                  <SelectItem value="Atrasado">Atrasado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* TOGGLE GRID / TIMELINE */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg shrink-0">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1.5 px-3"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Grade Mensal
            </Button>
            <Button
              variant={viewMode === 'timeline' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs gap-1.5 px-3"
              onClick={() => setViewMode('timeline')}
            >
              <List className="h-3.5 w-3.5" /> Linha do Tempo
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* REA DA AGENDA */}
      {viewMode === 'grid' ? (
        <CalendarioGridProjetos eventos={filteredEvents} onEventClick={setSelectedEvent} />
      ) : (
        <TimelineProjetos eventos={filteredEvents} onEventClick={setSelectedEvent} />
      )}

      {/* SHEET DE NOVO MARCO */}
      <NovoMarcoSheet
        open={isNovoSheetOpen}
        onOpenChange={setIsNovoSheetOpen}
        projetos={projetos}
        onAddEvent={addEventoCustomizado}
      />

      {/* MODAL DE DETALHES DO EVENTO DE PROJETO */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Flag className="h-5 w-5 text-primary" /> Detalhes do Prazo / Marco
            </DialogTitle>
            <DialogDescription className="text-xs">
              Informaes consolidadas do evento no cronograma do projeto.
            </DialogDescription>
          </DialogHeader>

          {selectedEvent && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3.5 rounded-xl bg-muted/30 border border-border space-y-2">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] uppercase font-bold">
                    {selectedEvent.tipo}
                  </Badge>
                  <Badge
                    variant={
                      selectedEvent.status === 'Atrasado'
                        ? 'destructive'
                        : selectedEvent.status === 'Concludo'
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

              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg border border-border/60">
                <div>
                  <span className="text-[10px] text-muted-foreground block">Data do Prazo</span>
                  <span className="font-bold text-foreground">{selectedEvent.data}</span>
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block">Responsvel</span>
                  <span className="font-semibold text-foreground">
                    {selectedEvent.responsavel || 'No especificado'}
                  </span>
                </div>
              </div>

              {selectedEvent.observacoes && (
                <div className="space-y-1">
                  <span className="text-[10px] text-muted-foreground font-semibold uppercase">
                    Observaes / Escopo:
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

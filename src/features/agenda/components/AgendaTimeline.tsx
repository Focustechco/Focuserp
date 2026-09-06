import React, { useState } from 'react';
import { CategoriaAgenda, EventoFinanceiro } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Calendar as CalendarIcon,
  Clock,
  ArrowRight,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  FileText,
  FileWarning,
  RefreshCw,
} from 'lucide-react';
import { format, isToday, isTomorrow, isYesterday, isPast } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from '@tanstack/react-router';
import { useAgendaEvents } from '../useAgendaEvents';
import { NovoEventoAgendaSheet } from './NovoEventoAgendaSheet';
import { parseDateSafe } from '@/lib/dateUtils';

const formatCurrency = (value?: number) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getCategoryIcon = (categoria: CategoriaAgenda) => {
  switch (categoria) {
    case 'Recebimento':
      return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
    case 'Recorrência':
      return <RefreshCw className="w-4 h-4 text-orange-500" />;
    case 'Pagamento':
      return <ArrowDownRight className="w-4 h-4 text-rose-500" />;
    case 'Imposto':
      return <FileWarning className="w-4 h-4 text-amber-500" />;
    case 'Contrato':
      return <FileText className="w-4 h-4 text-indigo-500" />;
    case 'Projeto':
      return <Briefcase className="w-4 h-4 text-violet-500" />;
    default:
      return <CalendarIcon className="w-4 h-4 text-slate-500" />;
  }
};

const getStatusBadge = (status: string) => {
  if (status === 'Pago' || status === 'Recebido' || status === 'Concluído')
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200 text-[10px] sm:text-xs font-semibold px-2 py-0.5">
        {status}
      </Badge>
    );
  if (status === 'Vencido')
    return (
      <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200 text-[10px] sm:text-xs font-semibold px-2 py-0.5">
        {status}
      </Badge>
    );
  if (status === 'Em Aberto' || status === 'Previsto')
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200 text-[10px] sm:text-xs font-semibold px-2 py-0.5">
        {status}
      </Badge>
    );
  return (
    <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300 text-[10px] sm:text-xs font-semibold px-2 py-0.5">
      {status}
    </Badge>
  );
};

const getDateLabel = (dateIso: string) => {
  const date = parseDateSafe(dateIso);
  if (isNaN(date.getTime())) return dateIso;
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
};

interface AgendaTimelineProps {
  onEventClick?: (evento: EventoFinanceiro) => void;
}

export function AgendaTimeline({ onEventClick }: AgendaTimelineProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('todas');
  const { eventos } = useAgendaEvents();

  const filteredEvents = eventos.filter((evt) => {
    const matchesSearch =
      (evt?.titulo || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
      (evt?.entidadeVinculo && evt.entidadeVinculo.toLowerCase().includes((searchTerm || '').toLowerCase()));

    let matchesCat = true;
    if (catFilter === 'rec') matchesCat = evt.categoria === 'Recebimento' || evt.categoria === 'Recorrência';
    if (catFilter === 'pag') matchesCat = evt.categoria === 'Pagamento';
    if (catFilter === 'imp') matchesCat = evt.categoria === 'Imposto' || evt.categoria === 'Obrigação Fiscal';

    return matchesSearch && matchesCat;
  });

  const groupedEvents: Record<string, EventoFinanceiro[]> = {};

  filteredEvents.forEach((evt) => {
    const key = getDateLabel(evt.data);
    if (!groupedEvents[key]) {
      groupedEvents[key] = [];
    }
    groupedEvents[key].push(evt);
  });

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pt-1 sm:pt-4">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-2.5 sm:gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar evento, entidade ou valor..."
              className="pl-8 text-xs sm:text-sm h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[140px] sm:w-[180px] h-9 text-xs sm:text-sm shrink-0">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Categorias</SelectItem>
              <SelectItem value="rec">Recebimentos</SelectItem>
              <SelectItem value="pag">Pagamentos</SelectItem>
              <SelectItem value="imp">Impostos</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden sm:flex items-center gap-2 w-full sm:w-auto">
          <NovoEventoAgendaSheet>
            <Button variant="default" size="sm" className="h-9">
              Agendar Lembrete
            </Button>
          </NovoEventoAgendaSheet>
        </div>
      </div>

      {/* Timeline Container */}
      <div className="bg-card border rounded-2xl p-3.5 sm:p-6 shadow-2xs">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-sm sm:text-base">Nenhum evento financeiro encontrado.</p>
            <p className="text-xs mt-1 text-muted-foreground/80">
              Crie lançamentos nos módulos financeiros ou clique em "Agendar Lembrete".
            </p>
          </div>
        ) : (
          <div className="relative border-l-2 border-primary/30 pl-3.5 sm:pl-6 ml-2 sm:ml-4 space-y-6 sm:space-y-8">
            {Object.entries(groupedEvents).map(([dateLabel, evtList]) => (
              <div key={dateLabel} className="relative">
                {/* Marcador na linha do tempo */}
                <div className="absolute -left-[21px] sm:-left-[31px] top-1 bg-background border-2 border-primary w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full shadow-xs" />

                {/* Título da Data */}
                <h3 className="text-sm sm:text-base font-bold text-foreground capitalize mb-3 flex items-center gap-2">
                  {dateLabel}
                  <Badge variant="secondary" className="text-[10px] sm:text-xs font-normal">
                    {evtList.length} {evtList.length === 1 ? 'evento' : 'eventos'}
                  </Badge>
                </h3>

                {/* Lista de Cards da Data */}
                <div className="space-y-2.5 sm:space-y-3">
                  {evtList.map((evt) => {
                    const evtDate = parseDateSafe(evt.data);
                    const isAtrasado =
                      !isNaN(evtDate.getTime()) &&
                      isPast(evtDate) &&
                      !isToday(evtDate) &&
                      evt.status !== 'Pago' &&
                      evt.status !== 'Recebido' &&
                      evt.status !== 'Concluído';

                    return (
                      <div
                        key={evt.id}
                        onClick={() => onEventClick && onEventClick(evt)}
                        className={`group flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-xl border bg-background transition-all hover:shadow-md cursor-pointer ${
                          isAtrasado
                            ? 'border-rose-300/80 bg-rose-50/40 dark:bg-rose-950/20'
                            : 'hover:border-primary/50'
                        }`}
                      >
                        {/* Lado Esquerdo: Ícone + Título + Origem */}
                        <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0">
                          <div className="mt-0.5 p-2 rounded-xl bg-muted/60 shrink-0">
                            {getCategoryIcon(evt.categoria)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {evt.hora && (
                                <span className="text-[10px] sm:text-xs font-medium text-muted-foreground flex items-center bg-muted px-1.5 py-0.5 rounded-md">
                                  <Clock className="w-2.5 h-2.5 mr-1" /> {evt.hora}
                                </span>
                              )}
                              <h4 className="font-semibold text-xs sm:text-sm text-foreground truncate">
                                {evt.titulo}
                              </h4>
                            </div>

                            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-muted-foreground mt-1 flex-wrap">
                              {evt.entidadeVinculo && (
                                <span className="font-medium text-primary/90">{evt.entidadeVinculo}</span>
                              )}
                              {evt.entidadeVinculo && <span>•</span>}
                              <span>
                                Origem:{' '}
                                <span className="underline decoration-muted-foreground/30 underline-offset-2">
                                  {evt.moduloOrigem}
                                </span>
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Lado Direito / Rodapé Mobile: Valor + Status + Link */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-4 mt-2.5 sm:mt-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40 shrink-0">
                          {evt.valor !== undefined && (
                            <div className="text-left sm:text-right">
                              <span
                                className={`font-bold text-xs sm:text-sm ${
                                  evt.categoria === 'Recebimento'
                                    ? 'text-emerald-600 dark:text-emerald-500'
                                    : evt.categoria === 'Pagamento' || evt.categoria === 'Imposto'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-foreground'
                                }`}
                              >
                                {evt.categoria === 'Pagamento' || evt.categoria === 'Imposto' ? '- ' : ''}
                                {formatCurrency(evt.valor)}
                              </span>
                            </div>
                          )}

                          <div className="flex items-center gap-1.5 shrink-0">
                            {getStatusBadge(evt.status)}

                            {evt.linkOrigem && (
                              <Link
                                to={evt.linkOrigem as any}
                                onClick={(e) => e.stopPropagation()}
                                className="p-1 sm:p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-colors ml-1"
                                title="Abrir Lançamento Original"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

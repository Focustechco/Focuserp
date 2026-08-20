import React, { useState } from 'react';
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  addMonths,
  subMonths
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EventoFinanceiro, CategoriaAgenda } from '../types';
import { useAgendaEvents } from '../useAgendaEvents';

interface CalendarioGridProps {
  onEventClick: (evento: EventoFinanceiro) => void;
}

const getCategoryColor = (categoria: CategoriaAgenda) => {
  switch(categoria) {
    case 'Recebimento': return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900';
    case 'Pagamento': return 'bg-rose-100 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900';
    case 'Imposto': return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900';
    case 'Contrato': return 'bg-indigo-100 text-indigo-800 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-900';
    case 'Projeto': return 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-950/40 dark:text-violet-300 dark:border-violet-900';
    default: return 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800';
  }
};

export function CalendarioGrid({ onEventClick }: CalendarioGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { eventos } = useAgendaEvents();

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const startDate = startOfWeek(firstDayOfMonth, { weekStartsOn: 0 });
  const endDate = endOfWeek(lastDayOfMonth, { weekStartsOn: 0 });

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEventsForDay = (day: Date) => {
    return eventos.filter(evento => isSameDay(new Date(evento.data), day));
  };

  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="flex flex-col h-[750px] bg-card border rounded-md shadow-sm overflow-hidden animate-fade-in pt-2">
      {/* Header do Calendário */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 border-b bg-muted/20 gap-3">
        <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-4">
          <h2 className="text-base sm:text-xl font-bold capitalize">
            {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
          </h2>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 text-xs sm:h-8" onClick={goToToday}>
              Hoje
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7 sm:h-8 sm:w-8" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
           <Button variant="ghost" size="sm" className="h-8 text-muted-foreground hover:text-primary">
             <Filter className="w-4 h-4 mr-2" />
             Filtros Avançados
           </Button>
        </div>
      </div>

      {/* Grid de Dias da Semana */}
      <div className="grid grid-cols-7 border-b bg-muted/10">
        {weekDays.map(day => (
          <div key={day} className="py-2 text-center text-sm font-semibold text-muted-foreground border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Grid do Calendário */}
      <div className="flex-1 grid grid-cols-7 bg-muted/5">
        {days.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const dayEvents = getEventsForDay(day);
          
          return (
            <div 
              key={i} 
              className={`min-h-[120px] border-b border-r last:border-r-0 p-1 flex flex-col transition-colors hover:bg-muted/30 ${!isCurrentMonth ? 'bg-muted/10 opacity-60' : 'bg-background'}`}
            >
              {/* Número do dia */}
              <div className="flex justify-end p-1">
                <span className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday(day) ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}>
                  {format(day, 'd')}
                </span>
              </div>

              {/* Eventos (Pílulas) */}
              <div className="flex-1 flex flex-col gap-1 overflow-y-auto pb-1 mt-1 px-0.5">
                {dayEvents.map(evento => (
                  <div
                    key={evento.id}
                    onClick={() => onEventClick(evento)}
                    className={`text-[10px] sm:text-xs font-medium truncate px-1.5 py-1 border rounded cursor-pointer transition-all hover:brightness-95 hover:shadow-sm ${getCategoryColor(evento.categoria)}`}
                    title={`${evento.titulo}`}
                  >
                    {evento.hora && <span className="opacity-70 mr-1">{evento.hora}</span>}
                    {evento.titulo}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { CategoriaAgenda, EventoFinanceiro } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Calendar as CalendarIcon, Clock, ArrowRight, ArrowUpRight, ArrowDownRight, Briefcase, FileText, FileWarning, RefreshCw } from 'lucide-react';
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
  switch(categoria) {
    case 'Recebimento': return <ArrowUpRight className="w-4 h-4 text-emerald-500" />;
    case 'Recorrência': return <RefreshCw className="w-4 h-4 text-orange-500" />;
    case 'Pagamento': return <ArrowDownRight className="w-4 h-4 text-rose-500" />;
    case 'Imposto': return <FileWarning className="w-4 h-4 text-amber-500" />;
    case 'Contrato': return <FileText className="w-4 h-4 text-indigo-500" />;
    case 'Projeto': return <Briefcase className="w-4 h-4 text-violet-500" />;
    default: return <CalendarIcon className="w-4 h-4 text-slate-500" />;
  }
};

const getStatusBadge = (status: string) => {
  if (status === 'Pago' || status === 'Recebido' || status === 'Concluído') return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">{status}</Badge>;
  if (status === 'Vencido') return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200">{status}</Badge>;
  if (status === 'Em Aberto' || status === 'Previsto') return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-200">{status}</Badge>;
  return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300">{status}</Badge>;
};

const getDateLabel = (dateIso: string) => {
  const date = parseDateSafe(dateIso);
  if (isNaN(date.getTime())) return dateIso;
  if (isToday(date)) return 'Hoje';
  if (isTomorrow(date)) return 'Amanhã';
  if (isYesterday(date)) return 'Ontem';
  return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
};

export function AgendaTimeline() {
  const [searchTerm, setSearchTerm] = useState('');
  const [catFilter, setCatFilter] = useState('todas');
  const { eventos } = useAgendaEvents();

  const filteredEvents = eventos.filter(evt => {
    const matchesSearch = (evt?.titulo || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
      (evt?.entidadeVinculo && evt.entidadeVinculo.toLowerCase().includes((searchTerm || '').toLowerCase()));
    
    let matchesCat = true;
    if (catFilter === 'rec') matchesCat = evt.categoria === 'Recebimento' || evt.categoria === 'Recorrência';
    if (catFilter === 'pag') matchesCat = evt.categoria === 'Pagamento';
    if (catFilter === 'imp') matchesCat = evt.categoria === 'Imposto' || evt.categoria === 'Obrigação Fiscal';

    return matchesSearch && matchesCat;
  });

  const groupedEvents: Record<string, EventoFinanceiro[]> = {};

  filteredEvents.forEach(evt => {
    const key = getDateLabel(evt.data);
    if (!groupedEvents[key]) {
      groupedEvents[key] = [];
    }
    groupedEvents[key].push(evt);
  });

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar evento, entidade ou valor..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={catFilter} onValueChange={setCatFilter}>
            <SelectTrigger className="w-[180px]">
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
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <NovoEventoAgendaSheet>
            <Button variant="default">
              Agendar Lembrete
            </Button>
          </NovoEventoAgendaSheet>
        </div>
      </div>

      <div className="bg-card border rounded-md p-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-medium text-base">Nenhum evento financeiro encontrado.</p>
            <p className="text-xs mt-1">Crie lançamentos nos módulos financeiros ou clique em "Agendar Lembrete".</p>
          </div>
        ) : (
          <div className="relative border-l-2 border-muted pl-6 ml-4 space-y-10">
            {Object.entries(groupedEvents).map(([dateLabel, evtList]) => (
              <div key={dateLabel} className="relative">
                <div className="absolute -left-[35px] bg-background border-2 border-primary w-4 h-4 rounded-full mt-1"></div>
                <h3 className="text-lg font-bold text-foreground capitalize mb-4 flex items-center gap-2">
                  {dateLabel}
                  <Badge variant="secondary" className="text-xs font-normal">
                    {evtList.length} eventos
                  </Badge>
                </h3>

                <div className="space-y-4">
                  {evtList.map(evt => {
                    const evtDate = parseDateSafe(evt.data);
                    const isAtrasado = !isNaN(evtDate.getTime()) && isPast(evtDate) && !isToday(evtDate) && evt.status !== 'Pago' && evt.status !== 'Recebido' && evt.status !== 'Concluído';
                    
                    return (
                      <div key={evt.id} className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border bg-background transition-all hover:shadow-md ${isAtrasado ? 'border-rose-200 bg-rose-50/30' : 'hover:border-primary/50'}`}>
                        <div className="flex items-start gap-4">
                          <div className="mt-1 p-2 rounded-full bg-muted/50">
                            {getCategoryIcon(evt.categoria)}
                          </div>
                          
                          <div>
                            <div className="flex items-center gap-2">
                              {evt.hora && (
                                <span className="text-xs font-medium text-muted-foreground flex items-center bg-muted px-2 py-0.5 rounded-md">
                                  <Clock className="w-3 h-3 mr-1" /> {evt.hora}
                                </span>
                              )}
                              <h4 className="font-semibold text-foreground">{evt.titulo}</h4>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                              {evt.entidadeVinculo && (
                                <span className="font-medium text-primary/80">{evt.entidadeVinculo}</span>
                              )}
                              {evt.entidadeVinculo && <span>•</span>}
                              <span>Origem: <span className="underline decoration-muted-foreground/30 underline-offset-2">{evt.moduloOrigem}</span></span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-6 mt-4 sm:mt-0">
                          {evt.valor !== undefined && (
                            <div className="text-right">
                              <span className={`font-bold text-base ${evt.categoria === 'Recebimento' ? 'text-emerald-600 dark:text-emerald-500' : 'text-foreground'}`}>
                                {evt.categoria === 'Pagamento' || evt.categoria === 'Imposto' ? '- ' : ''}
                                {formatCurrency(evt.valor)}
                              </span>
                            </div>
                          )}
                          
                          <div className="w-[100px] text-right">
                            {getStatusBadge(evt.status)}
                          </div>
                          
                          <Link to={evt.linkOrigem as any} className="hidden sm:flex p-2 rounded-full hover:bg-muted text-muted-foreground hover:text-primary transition-colors" title="Abrir Lançamento Original">
                            <ArrowRight className="w-4 h-4" />
                          </Link>
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

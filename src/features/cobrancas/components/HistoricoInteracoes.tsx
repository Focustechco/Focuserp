import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Cobranca, EventoTimeline } from '../types';
import { INITIAL_COBRANCAS } from '../mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  History, Search, Filter, MessageSquare, Mail, Smartphone, 
  CheckCircle2, Clock, Send, Eye, DollarSign, ArrowUpRight 
} from 'lucide-react';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { CobrancaDetalhesModal } from './CobrancaDetalhesModal';

interface TimelineItemComCobranca extends EventoTimeline {
  cobranca: Cobranca;
}

export function HistoricoInteracoes() {
  const { data: cobrancasData } = useLocalStorageState<Cobranca>('focus_cobrancas', INITIAL_COBRANCAS);
  const cobrancas = Array.isArray(cobrancasData) ? cobrancasData : [];
  
  const [searchTerm, setSearchTerm] = useState('');
  const [canalFilter, setCanalFilter] = useState('todos');
  const [selectedCobranca, setSelectedCobranca] = useState<Cobranca | null>(null);

  // Compilar todos os eventos da timeline em uma lista global ordenada cronologicamente
  const globalTimeline = useMemo(() => {
    const events: TimelineItemComCobranca[] = [];
    cobrancas.forEach(cob => {
      (cob.timeline || []).forEach(ev => {
        events.push({
          ...ev,
          cobranca: cob
        });
      });
    });

    return events.sort((a, b) => {
      return new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime();
    });
  }, [cobrancas]);

  const filteredEvents = useMemo(() => {
    return globalTimeline.filter(item => {
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        item.cobranca.cliente.toLowerCase().includes(search) ||
        item.cobranca.id.toLowerCase().includes(search) ||
        item.acao.toLowerCase().includes(search) ||
        (item.detalhes || '').toLowerCase().includes(search);

      const matchCanal = canalFilter === 'todos' || item.canal === canalFilter;

      return matchSearch && matchCanal;
    });
  }, [globalTimeline, searchTerm, canalFilter]);

  const getCanalIcon = (canal?: string) => {
    switch (canal) {
      case 'WhatsApp':
        return <div className="p-1.5 rounded-lg bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300"><MessageSquare className="w-4 h-4" /></div>;
      case 'E-mail':
        return <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"><Mail className="w-4 h-4" /></div>;
      case 'SMS':
        return <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300"><Smartphone className="w-4 h-4" /></div>;
      default:
        return <div className="p-1.5 rounded-lg bg-primary/10 text-primary"><Clock className="w-4 h-4" /></div>;
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Controles de Busca e Filtro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente, ID ou mensagem..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={canalFilter} onValueChange={setCanalFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Canais</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="E-mail">E-mail</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-xs text-muted-foreground">
          Total de <strong>{filteredEvents.length}</strong> eventos registrados na esteira de cobrança.
        </div>
      </div>

      {/* Feed da Timeline Global */}
      <div className="border rounded-xl bg-card p-6 shadow-xs">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground text-sm">
            Nenhuma interação encontrada para os filtros aplicados.
          </div>
        ) : (
          <div className="relative border-l-2 border-primary/20 ml-4 space-y-6">
            {filteredEvents.map((item, idx) => (
              <div key={`${item.id}-${idx}`} className="relative pl-7 group">
                <div className="absolute -left-[11px] top-1.5 bg-background border-2 border-primary w-5 h-5 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                </div>

                <div className="border rounded-xl p-4 bg-muted/20 hover:bg-muted/40 transition-colors space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="flex items-center gap-2">
                      {getCanalIcon(item.canal)}
                      <div>
                        <span className="font-bold text-sm text-foreground">{item.acao}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          • {item.cobranca.cliente} (<span className="font-mono text-primary">{item.cobranca.id}</span>)
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {formatDateBrasilia(item.dataHora)}
                      </span>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 text-xs gap-1"
                        onClick={() => setSelectedCobranca(item.cobranca)}
                      >
                        <Eye className="w-3.5 h-3.5" /> Ver Cobrança
                      </Button>
                    </div>
                  </div>

                  {item.detalhes && (
                    <p className="text-xs text-foreground bg-background p-3 rounded-lg border">
                      {item.detalhes}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                    <span>Operador / Origem: <strong>{item.usuario}</strong></span>
                    <span>Valor do Título: <strong>R$ {item.cobranca.valor.toLocaleString('pt-BR')}</strong></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <CobrancaDetalhesModal
        cobranca={selectedCobranca}
        open={!!selectedCobranca}
        onOpenChange={(open) => !open && setSelectedCobranca(null)}
      />
    </div>
  );
}

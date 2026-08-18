import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { EventoFinanceiro, CategoriaAgenda } from '../types';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, FileWarning, FileText, Briefcase, CalendarIcon, ExternalLink, Clock, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@tanstack/react-router';

interface DetalheEventoSheetProps {
  evento: EventoFinanceiro | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatCurrency = (value?: number) => {
  if (value === undefined) return '-';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getCategoryIcon = (categoria: CategoriaAgenda) => {
  switch(categoria) {
    case 'Recebimento': return <ArrowUpRight className="w-5 h-5 text-emerald-500" />;
    case 'Pagamento': return <ArrowDownRight className="w-5 h-5 text-rose-500" />;
    case 'Imposto': return <FileWarning className="w-5 h-5 text-amber-500" />;
    case 'Contrato': return <FileText className="w-5 h-5 text-indigo-500" />;
    case 'Projeto': return <Briefcase className="w-5 h-5 text-violet-500" />;
    default: return <CalendarIcon className="w-5 h-5 text-slate-500" />;
  }
};

export function DetalheEventoSheet({ evento, isOpen, onClose }: DetalheEventoSheetProps) {
  if (!evento) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px] flex flex-col p-0">
        <div className="p-6 pb-4 border-b bg-muted/20">
          <SheetHeader className="text-left space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-background border shadow-sm">
                {getCategoryIcon(evento.categoria)}
              </div>
              <Badge variant="secondary" className="capitalize">{evento.categoria}</Badge>
              <Badge variant="outline" className={`${
                evento.status === 'Pago' || evento.status === 'Recebido' || evento.status === 'Concluído' ? 'border-emerald-500 text-emerald-600' :
                evento.status === 'Vencido' ? 'border-rose-500 text-rose-600' : 'border-amber-500 text-amber-600'
              }`}>{evento.status}</Badge>
            </div>
            
            <SheetTitle className="text-xl leading-tight">
              {evento.titulo}
            </SheetTitle>
            <SheetDescription>
              Acompanhamento de {(evento?.categoria || '').toLowerCase()} centralizado na Agenda.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Valor (Se existir) */}
          {evento.valor !== undefined && (
            <div className="p-4 rounded-lg bg-background border flex flex-col items-center justify-center text-center">
              <p className="text-sm font-medium text-muted-foreground mb-1">Valor do Lançamento</p>
              <h3 className={`text-3xl font-bold tracking-tight ${evento.categoria === 'Recebimento' ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'}`}>
                {formatCurrency(evento.valor)}
              </h3>
            </div>
          )}

          {/* Dados Principais */}
          <div className="space-y-4 text-sm">
            <h4 className="font-semibold border-b pb-2">Informações Principais</h4>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-muted-foreground mb-1">Data</p>
                <p className="font-medium flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 opacity-70" />
                  {format(new Date(evento.data), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground mb-1">Horário Previsto</p>
                <p className="font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 opacity-70" />
                  {evento.hora || 'O dia todo'}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Entidade / Vinculação</p>
                <p className="font-medium">{evento.entidadeVinculo || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground mb-1">Módulo de Origem</p>
                <Badge variant="outline" className="bg-muted/50">{evento.moduloOrigem}</Badge>
              </div>
            </div>
          </div>

          {/* Observações */}
          {evento.observacoes && (
            <div className="space-y-2 text-sm p-4 bg-blue-50 dark:bg-blue-950/20 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-100 dark:border-blue-900">
              <h4 className="font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Observações
              </h4>
              <p>{evento.observacoes}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t bg-muted/10">
          <Link to={evento.linkOrigem as any}>
            <Button className="w-full gap-2">
              <ExternalLink className="w-4 h-4" />
              Acessar no módulo {evento.moduloOrigem}
            </Button>
          </Link>
          <p className="text-xs text-center text-muted-foreground mt-3">
            Modo Somente-Leitura. Altere os dados diretamente no módulo original.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

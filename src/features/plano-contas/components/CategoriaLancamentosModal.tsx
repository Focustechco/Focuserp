import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tag, DollarSign, ArrowUpRight, ArrowDownRight, Calendar, Building2, User, ExternalLink } from 'lucide-react';
import { CategoriaFinanceira } from '../types';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { Link } from '@tanstack/react-router';

interface CategoriaLancamentosModalProps {
  categoria: CategoriaFinanceira | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamentosReceber: TituloReceber[];
  lancamentosPagar: ContaPagar[];
}

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function CategoriaLancamentosModal({
  categoria,
  open,
  onOpenChange,
  lancamentosReceber,
  lancamentosPagar,
}: CategoriaLancamentosModalProps) {
  if (!categoria) return null;

  const isReceita = categoria.tipo === 'Receita';
  const lancamentos = isReceita ? lancamentosReceber : lancamentosPagar;
  const total = lancamentos.reduce((acc, l) => acc + (l.valorOriginal || 0), 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-2xl overflow-y-auto p-6 space-y-6">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                isReceita 
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {isReceita ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
              </div>
              <div>
                <SheetTitle className="text-lg font-bold flex items-center gap-2">
                  <span className="font-mono text-primary text-sm">{categoria.codigo}</span>
                  <span>{categoria.nome}</span>
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {categoria.tipo} • Natureza: {categoria.natureza} • {lancamentos.length} movimentações encontradas
                </SheetDescription>
              </div>
            </div>
            <Badge variant="outline" className={`text-xs ${
              isReceita ? 'border-emerald-300 text-emerald-700' : 'border-rose-300 text-rose-700'
            }`}>
              {categoria.tipo}
            </Badge>
          </div>
        </SheetHeader>

        {/* Resumo do Saldo Real */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 border rounded-xl bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground block">Total Acumulado ({categoria.tipo}s)</span>
            <div className={`text-xl font-bold ${isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(total)}
            </div>
          </div>
          <div className="p-3.5 border rounded-xl bg-card shadow-xs">
            <span className="text-[11px] text-muted-foreground block">Qtd. de Lançamentos Reais</span>
            <div className="text-xl font-bold text-foreground">
              {lancamentos.length}
            </div>
          </div>
        </div>

        {/* Lista de Transações Reais */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Lançamentos Vinculados a esta Conta
            </h4>
            <Link 
              to={isReceita ? "/contas-a-receber" : "/contas-a-pagar"} 
              className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
            >
              Ver no Módulo {isReceita ? 'Contas a Receber' : 'Contas a Pagar'} <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {lancamentos.length === 0 ? (
            <div className="p-10 text-center border border-dashed rounded-xl text-muted-foreground text-xs">
              <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
              Nenhum lançamento real registrado nesta categoria até o momento.
            </div>
          ) : (
            <div className="border rounded-xl bg-card overflow-hidden divide-y max-h-96 overflow-y-auto">
              {lancamentos.map((item: any) => (
                <div key={item.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs">
                  <div className="space-y-1 min-w-0 pr-2">
                    <div className="font-semibold text-foreground flex items-center gap-2 truncate">
                      <span className="font-mono text-primary font-bold">{item.numero}</span>
                      <span>• {item.cliente || item.fornecedor || 'Favorecido'}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px] truncate">
                      {item.descricao}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                      <span className="flex items-center gap-0.5">
                        <Calendar className="w-2.5 h-2.5" /> {formatDateBrasilia(item.dataVencimento)}
                      </span>
                      {item.centroCustoNome && (
                        <span>• CC: <strong>{item.centroCustoNome}</strong></span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className={`font-bold text-sm ${isReceita ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {formatCurrency(item.valorOriginal)}
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] mt-0.5 ${
                        item.status === 'Pago' || item.status === 'Recebido' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                          : item.status === 'Atrasado' || item.status === 'Vencido'
                          ? 'bg-rose-50 text-rose-700 border-rose-300'
                          : 'bg-amber-50 text-amber-700 border-amber-300'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

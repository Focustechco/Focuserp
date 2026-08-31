import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FolderTree, DollarSign, Calendar, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { CentroCusto } from '../types';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { Link } from '@tanstack/react-router';

interface CentroCustoLancamentosModalProps {
  centro: CentroCusto | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  lancamentosReceber: TituloReceber[];
  lancamentosPagar: ContaPagar[];
}

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function CentroCustoLancamentosModal({
  centro,
  open,
  onOpenChange,
  lancamentosReceber = [],
  lancamentosPagar = [],
}: CentroCustoLancamentosModalProps) {
  if (!centro) return null;

  const isReceita = centro.tipo === 'Receita';
  const totalReceita = lancamentosReceber.reduce((acc, t) => acc + (t.valorLiquido || t.valorOriginal || 0), 0);
  const totalDespesa = lancamentosPagar.reduce((acc, cp) => acc + (cp.valorFinal || cp.valorOriginal || 0), 0);
  const numLancamentos = isReceita ? lancamentosReceber.length : lancamentosPagar.length;

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
                <FolderTree className="w-5 h-5" />
              </div>
              <div>
                <SheetTitle className="text-lg font-bold flex items-center gap-2">
                  <span className="font-mono text-primary text-sm">{centro.codigo}</span>
                  <span>{centro.nome}</span>
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {centro.departamento} • Resp: {centro.responsavel} • {numLancamentos} {numLancamentos === 1 ? 'lançamento específico' : 'lançamentos específicos'}
                </SheetDescription>
              </div>
            </div>
            <Badge variant="outline" className={`text-xs gap-1 font-semibold ${
              isReceita ? 'border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40' : 'border-rose-300 text-rose-700 bg-rose-50 dark:bg-rose-950/40'
            }`}>
              {isReceita ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {centro.tipo}
            </Badge>
          </div>
        </SheetHeader>

        {/* Resumo do Saldo Real Específico */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`p-3.5 border rounded-xl bg-card shadow-xs ${!isReceita ? 'ring-1 ring-rose-500/30' : ''}`}>
            <span className="text-[11px] text-muted-foreground block font-medium">Despesas Incorridas (Contas a Pagar)</span>
            <div className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">
              {formatCurrency(totalDespesa)}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {lancamentosPagar.length} {lancamentosPagar.length === 1 ? 'despesa vinculada' : 'despesas vinculadas'}
            </span>
          </div>

          <div className={`p-3.5 border rounded-xl bg-card shadow-xs ${isReceita ? 'ring-1 ring-emerald-500/30' : ''}`}>
            <span className="text-[11px] text-muted-foreground block font-medium">Receitas Geradas (Contas a Receber)</span>
            <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatCurrency(totalReceita)}
            </div>
            <span className="text-[10px] text-muted-foreground block mt-0.5">
              {lancamentosReceber.length} {lancamentosReceber.length === 1 ? 'receita vinculada' : 'receitas vinculadas'}
            </span>
          </div>
        </div>

        {/* SEÇÃO PRINCIPAL DE ACORDO COM A NATUREZA */}
        {!isReceita ? (
          /* DESPESAS (NATUREZA DESPESA) */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingDown className="w-3.5 h-3.5 text-rose-600" />
                Despesas Vinculadas a este Centro ({lancamentosPagar.length})
              </h4>
              <Link 
                to="/contas-a-pagar"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                Abrir Contas a Pagar <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {lancamentosPagar.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-xs space-y-1">
                <DollarSign className="w-6 h-6 mx-auto mb-1 opacity-30 text-rose-500" />
                <p className="font-semibold text-foreground">Nenhuma despesa vinculada a este Centro de Custo.</p>
                <p className="text-[11px]">Para associar despesas, selecione este centro de custo ao cadastrar ou editar no Contas a Pagar.</p>
              </div>
            ) : (
              <div className="border rounded-xl bg-card overflow-hidden divide-y max-h-64 overflow-y-auto">
                {lancamentosPagar.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs">
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="font-semibold text-foreground flex items-center gap-2 truncate">
                        <span className="font-mono text-primary font-bold">{item.numero}</span>
                        <span>• {item.fornecedor || 'Fornecedor'}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] truncate">{item.descricao}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" /> {formatDateBrasilia(item.dataVencimento)}
                        </span>
                        <span>• Cat: <strong>{item.categoria}</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-rose-600">
                        {formatCurrency(item.valorFinal || item.valorOriginal)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] mt-0.5 ${
                          item.status === 'Pago' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                            : item.status === 'Vencido'
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

            {/* Receitas secundárias se houver */}
            {lancamentosReceber.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Receitas Atribuídas ({lancamentosReceber.length})
                </h4>
                <div className="border rounded-xl bg-card overflow-hidden divide-y max-h-48 overflow-y-auto">
                  {lancamentosReceber.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium truncate">{item.cliente || item.descricao}</span>
                      <span className="font-bold text-emerald-600">{formatCurrency(item.valorLiquido || item.valorOriginal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* RECEITAS (NATUREZA RECEITA) */
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                Receitas Vinculadas a este Centro ({lancamentosReceber.length})
              </h4>
              <Link 
                to="/contas-a-receber"
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                Abrir Contas a Receber <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {lancamentosReceber.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground text-xs space-y-1">
                <DollarSign className="w-6 h-6 mx-auto mb-1 opacity-30 text-emerald-500" />
                <p className="font-semibold text-foreground">Nenhuma receita vinculada a este Centro de Receita.</p>
                <p className="text-[11px]">Para associar receitas, selecione este centro ao cadastrar ou editar no Contas a Receber.</p>
              </div>
            ) : (
              <div className="border rounded-xl bg-card overflow-hidden divide-y max-h-64 overflow-y-auto">
                {lancamentosReceber.map((item) => (
                  <div key={item.id} className="p-3 flex items-center justify-between hover:bg-muted/30 transition-colors text-xs">
                    <div className="space-y-1 min-w-0 pr-2">
                      <div className="font-semibold text-foreground flex items-center gap-2 truncate">
                        <span className="font-mono text-primary font-bold">{item.numero}</span>
                        <span>• {item.cliente || 'Cliente'}</span>
                      </div>
                      <p className="text-muted-foreground text-[11px] truncate">{item.descricao}</p>
                      <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-0.5">
                          <Calendar className="w-2.5 h-2.5" /> {formatDateBrasilia(item.dataVencimento)}
                        </span>
                        <span>• Cat: <strong>{item.categoria}</strong></span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-bold text-xs text-emerald-600">
                        {formatCurrency(item.valorLiquido || item.valorOriginal)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-[9px] mt-0.5 ${
                          item.status === 'Recebido' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                            : item.status === 'Atrasado'
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

            {/* Despesas secundárias se houver */}
            {lancamentosPagar.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Despesas Atribuídas ({lancamentosPagar.length})
                </h4>
                <div className="border rounded-xl bg-card overflow-hidden divide-y max-h-48 overflow-y-auto">
                  {lancamentosPagar.map((item) => (
                    <div key={item.id} className="p-2.5 flex items-center justify-between text-xs">
                      <span className="font-medium truncate">{item.fornecedor || item.descricao}</span>
                      <span className="font-bold text-rose-600">{formatCurrency(item.valorFinal || item.valorOriginal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-2">
          <Link to={`/centro-de-custos/$centroId`} params={{ centroId: centro.id }} className="w-full">
            <Button className="w-full gap-2 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              <ExternalLink className="w-4 h-4" /> Ver Perfil Completo do Centro de Custo
            </Button>
          </Link>
        </div>
      </SheetContent>
    </Sheet>
  );
}

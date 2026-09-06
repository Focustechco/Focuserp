import React from 'react';
import {
  Sheet,
  SheetContent,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ContaPagar } from '../types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import {
  DollarSign,
  Calendar,
  Building2,
  FileText,
  CreditCard,
  User,
  FolderTree,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  Tag,
  Hash,
  Layers
} from 'lucide-react';

interface DetalhesContaPagarSheetProps {
  conta: ContaPagar | any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPagar?: (conta: any) => void;
  onExcluir?: (conta: any) => void;
}

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function DetalhesContaPagarSheet({
  conta,
  open,
  onOpenChange,
  onPagar,
  onExcluir,
}: DetalhesContaPagarSheetProps) {
  if (!conta) return null;

  const valorNum = Number(conta.valorOriginal ?? conta.valor ?? conta.saldo ?? 0) || 0;
  const valorPago = Number(conta.valorPago ?? 0) || 0;
  const fornecedorNome = conta.fornecedor || conta.fornecedorNome || conta.beneficiario || 'Fornecedor não informado';
  const statusNorm = (conta.status || '').trim().toLowerCase();
  const isPago = statusNorm === 'pago' || statusNorm === 'liquidado' || statusNorm === 'paga';
  const isVencido = conta.isVencido ?? false;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" hideCloseButton className="rounded-t-3xl max-h-[90vh] p-0 bg-background overflow-hidden flex flex-col">
        {/* Header com drag handle & fechar */}
        <div className="px-5 pt-3 pb-2 border-b bg-muted/20">
          <div className="w-12 h-1.5 bg-muted-foreground/30 rounded-full mx-auto mb-3" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={`text-xs px-2.5 py-0.5 rounded-lg font-bold ${
                  isPago
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/50 dark:text-emerald-400'
                    : isVencido
                    ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/50 dark:text-rose-400'
                    : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/50 dark:text-amber-400'
                }`}
              >
                {isPago ? 'Pago / Liquidado' : isVencido ? 'Vencido' : 'A Pagar / Pendente'}
              </Badge>
              {conta.numero && (
                <span className="text-xs text-muted-foreground font-mono flex items-center gap-0.5">
                  <Hash className="w-3 h-3" /> {conta.numero}
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted hover:bg-muted/80 text-muted-foreground transition-all active:scale-95"
              aria-label="Fechar"
            >
              <span className="text-base font-bold leading-none">&times;</span>
            </button>
          </div>
        </div>

        {/* Conteúdo com Scroll */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Card Destaque de Valor e Fornecedor */}
          <div className="bg-card rounded-2xl border p-4.5 shadow-2xs space-y-2">
            <div className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-rose-500" />
              Valor a Pagar
            </div>
            <div className="text-3xl font-black text-foreground">
              {formatCurrency(valorNum)}
            </div>

            <div className="pt-2 border-t border-dashed flex items-center justify-between text-xs">
              <div className="text-muted-foreground flex items-center gap-1.5 font-medium truncate">
                <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span className="truncate">{fornecedorNome}</span>
              </div>
              {isPago && valorPago > 0 && (
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold shrink-0">
                  Pago: {formatCurrency(valorPago)}
                </span>
              )}
            </div>
          </div>

          {/* Seção 1: Descrição Detalhada da Conta */}
          <div className="bg-card rounded-2xl border p-4 space-y-2 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <FileText className="w-4 h-4 text-[#FF6A00]" />
              Descrição da Despesa / Conta
            </div>
            <div className="bg-muted/30 p-3 rounded-xl text-xs text-foreground/90 font-medium leading-relaxed border">
              {conta.descricao || 'Sem descrição informada.'}
            </div>
          </div>

          {/* Seção 2: Informações Financeiras e Operacionais */}
          <div className="bg-card rounded-2xl border p-4 shadow-2xs space-y-3.5">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-primary" />
              Detalhes Financeiros
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {/* Categoria */}
              <div className="p-2.5 rounded-xl bg-muted/20 border space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <Tag className="w-3 h-3 text-amber-500" /> Categoria
                </span>
                <p className="font-semibold text-foreground truncate">
                  {conta.categoria || 'Despesa Operacional'}
                </p>
              </div>

              {/* Centro de Custos */}
              <div className="p-2.5 rounded-xl bg-muted/20 border space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <FolderTree className="w-3 h-3 text-purple-500" /> Centro de Custo
                </span>
                <p className="font-semibold text-foreground truncate">
                  {conta.centroCustoNome || conta.centroCusto || 'Geral / Administrativo'}
                </p>
              </div>

              {/* Forma de Pagamento */}
              <div className="p-2.5 rounded-xl bg-muted/20 border space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-cyan-500" /> Forma de Pagamento
                </span>
                <p className="font-semibold text-foreground">
                  {conta.formaPagamento || 'PIX'}
                </p>
              </div>

              {/* Responsável */}
              <div className="p-2.5 rounded-xl bg-muted/20 border space-y-1">
                <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-blue-500" /> Responsável
                </span>
                <p className="font-semibold text-foreground truncate">
                  {conta.responsavel || 'Operador Financeiro'}
                </p>
              </div>
            </div>

            {/* Datas */}
            <div className="p-3 rounded-xl bg-muted/20 border space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                  Data de Vencimento:
                </span>
                <span className={`font-bold ${isVencido ? 'text-rose-600' : 'text-foreground'}`}>
                  {conta.dataVencimento ? formatDateBrasilia(conta.dataVencimento) : 'Não informado'}
                </span>
              </div>

              {conta.dataEmissao && (
                <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t border-dashed pt-1.5">
                  <span>Data de Emissão:</span>
                  <span>{formatDateBrasilia(conta.dataEmissao)}</span>
                </div>
              )}

              {conta.dataPagamento && (
                <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 border-t border-dashed pt-1.5 font-medium">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Pago em:
                  </span>
                  <span>{formatDateBrasilia(conta.dataPagamento)}</span>
                </div>
              )}
            </div>

            {/* Observações */}
            {conta.observacoes && (
              <div className="space-y-1 text-xs">
                <span className="text-[10px] text-muted-foreground font-medium">Observações adicionais:</span>
                <div className="p-2.5 rounded-xl bg-muted/20 border text-muted-foreground italic">
                  "{conta.observacoes}"
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer com Ações */}
        <div className="p-4 border-t bg-background/95 flex gap-2">
          {onExcluir && (
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                onExcluir(conta);
                onOpenChange(false);
              }}
              className="h-11 px-3.5 rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700"
              title="Excluir conta"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}

          {!isPago && onPagar ? (
            <Button
              size="lg"
              onClick={() => {
                onPagar(conta);
                onOpenChange(false);
              }}
              className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-1.5 text-xs shadow-xs"
            >
              <Check className="w-4 h-4" />
              Dar Baixa (Pago)
            </Button>
          ) : (
            <Button
              variant="outline"
              size="lg"
              onClick={() => onOpenChange(false)}
              className="flex-1 h-11 rounded-xl font-semibold text-xs"
            >
              Fechar
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

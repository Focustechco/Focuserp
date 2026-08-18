import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaBancaria, MovimentacaoBancaria } from '../types';
import { toast } from 'sonner';

import { renderHistoricoSafe } from './ConciliacaoList';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatDateSafe = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
};

export function DivergenciasList() {
  const { data: contasBancarias } = useLocalStorageState<ContaBancaria>('focus_contas_bancarias', []);
  const { data: extratos, updateItem: updateExtrato } = useLocalStorageState<MovimentacaoBancaria>('focus_extratos', []);

  const divergentesExtrato = (extratos || []).filter(e => e.status === 'Divergente');

  const handleIgnorar = (id: string) => {
    updateExtrato(id, { status: 'Ignorado' });
    toast.success('Movimentação marcada como Ignorada.');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 rounded-lg border border-rose-200 dark:border-rose-800 flex-1">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold mb-1">Caça às Divergências</p>
            <p>Os itens abaixo foram identificados fisicamente no banco, mas a inteligência não conseguiu encontrar nenhum lançamento financeiro aberto no ERP com o mesmo valor ou data aproximada. Você precisará investigar e criar o lançamento manualmente no Contas a Pagar/Receber ou marcar como 'Ignorado' (ex: transferência entre contas de mesma titularidade).</p>
          </div>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data Bancária</TableHead>
              <TableHead>Conta Origem</TableHead>
              <TableHead>Histórico do Banco</TableHead>
              <TableHead>Doc (NSU)</TableHead>
              <TableHead className="text-right">Valor Extraviado</TableHead>
              <TableHead className="text-right">Ações Corretivas</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {divergentesExtrato.map(extrato => (
              <TableRow key={extrato.id} className="hover:bg-rose-50/50 dark:hover:bg-rose-900/10">
                <TableCell>{formatDateSafe(extrato.data)}</TableCell>
                <TableCell>{contasBancarias.find(c => c.id === extrato.contaBancariaId)?.banco || 'Banco'}</TableCell>
                <TableCell className="font-medium text-rose-700 dark:text-rose-400">{renderHistoricoSafe(extrato.historico)}</TableCell>
                <TableCell>{extrato.documento}</TableCell>
                <TableCell className="text-right font-bold text-rose-600">
                  {extrato.tipo === 'Crédito' ? '+' : '-'}{formatCurrency(extrato.valor)}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => handleIgnorar(extrato.id)}>
                    Ignorar Movimentação
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            
            {divergentesExtrato.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                  Nenhuma divergência encontrada. A contabilidade está perfeitamente alinhada! 🎉
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

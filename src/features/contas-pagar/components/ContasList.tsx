import React, { useState } from 'react';
import { useContasPagarQuery } from '../hooks/useContasPagarQuery';
import { ContaPagar } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, MoreHorizontal, Download, Plus } from 'lucide-react';
import { NovaContaSheet } from './NovaContaSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString('pt-BR');
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Pago': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Vencido': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'Pago Parcialmente': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export function ContasList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { contas, saveConta, deleteConta } = useContasPagarQuery();

  const filteredData = contas.filter(t => 
    (t.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por fornecedor, número ou descrição..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <NovaContaSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Conta
            </Button>
          </NovaContaSheet>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Saldo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhuma conta encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((conta) => (
                <TableRow key={conta.id}>
                  <TableCell className="font-medium">{conta.numero}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{conta.fornecedor}</span>
                      <span className="text-xs text-muted-foreground">{conta.descricao}</span>
                    </div>
                  </TableCell>
                  <TableCell>{conta.categoria}</TableCell>
                  <TableCell>{formatDate(conta.dataVencimento)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(conta.valorOriginal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(conta.saldo)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(conta.status) + " border-0"}>
                      {conta.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => {
                          saveConta({
                            ...conta,
                            status: 'Pago',
                            valorPago: conta.valorOriginal,
                            saldo: 0,
                          });
                        }}>
                          Registrar pagamento
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-red-600 cursor-pointer focus:bg-red-500/10 focus:text-red-600"
                          onSelect={async (e) => {
                            e.preventDefault();
                            if (window.confirm(`Tem certeza que deseja excluir a conta "${conta.descricao || conta.numero}"?`)) {
                              try {
                                await deleteConta(conta.id);
                              } catch (err) {
                                console.error('Erro ao excluir conta a pagar:', err);
                              }
                            }
                          }}
                        >
                          Excluir conta
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

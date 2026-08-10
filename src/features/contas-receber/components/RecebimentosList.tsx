import React, { useState } from 'react';
import { useContasReceberQuery } from '../hooks/useContasReceberQuery';
import { TituloReceber } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, MoreHorizontal, Download, Plus } from 'lucide-react';
import { NovoRecebimentoSheet } from './NovoRecebimentoSheet';
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
    case 'Recebido': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Atrasado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'Recebido Parcialmente': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

export function RecebimentosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { titulos, saveTitulo, deleteTitulo } = useContasReceberQuery();

  const filteredData = titulos.filter(t => 
    (t.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              placeholder="Buscar por cliente, número ou descrição..." 
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
          <NovoRecebimentoSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Recebimento
            </Button>
          </NovoRecebimentoSheet>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Cliente</TableHead>
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
                  Nenhum título encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((titulo) => (
                <TableRow key={titulo.id}>
                  <TableCell className="font-medium">{titulo.numero}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span>{titulo.cliente}</span>
                      <span className="text-xs text-muted-foreground">{titulo.descricao}</span>
                    </div>
                  </TableCell>
                  <TableCell>{titulo.categoria}</TableCell>
                  <TableCell>{formatDate(titulo.dataVencimento)}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(titulo.valorOriginal)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(titulo.saldo)}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusColor(titulo.status) + " border-0"}>
                      {titulo.status}
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
                          saveTitulo({
                            ...titulo,
                            status: 'Recebido',
                            valorRecebido: titulo.valorOriginal,
                            saldo: 0,
                          });
                        }}>
                          Registrar recebimento
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => {
                          deleteTitulo(titulo.id);
                        }}>
                          Excluir título
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

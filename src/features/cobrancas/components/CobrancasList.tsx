import React, { useState } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Cobranca } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, MoreHorizontal, Download, Plus, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { NovaCobrancaSheet } from './NovaCobrancaSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const getStatusCobrancaColor = (status: string) => {
  switch (status) {
    case 'Paga': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Vencida': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'Lida': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Agendada': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getStatusEntregaColor = (status: string) => {
  switch (status) {
    case 'Entregue': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    case 'Enviado': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'Pendente': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'Falhou': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getCanalIcon = (canal: string) => {
  switch (canal) {
    case 'WhatsApp': return <MessageSquare className="w-4 h-4 text-green-500" />;
    case 'E-mail': return <Mail className="w-4 h-4 text-blue-500" />;
    case 'SMS': return <Smartphone className="w-4 h-4 text-yellow-500" />;
    default: return null;
  }
};

export function CobrancasList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: cobrancasData, deleteItem } = useLocalStorageState<Cobranca>('focus_cobrancas');
  const cobrancas = Array.isArray(cobrancasData) ? cobrancasData : [];

  const filteredData = cobrancas.filter(c => {
    if (!c) return false;
    const search = searchTerm.toLowerCase();
    return (c.cliente || '').toLowerCase().includes(search) ||
           (c.id || '').toLowerCase().includes(search) ||
           (c.tituloReferencia || '').toLowerCase().includes(search);
  });

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente, ID ou referência..." 
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
          <NovaCobrancaSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Cobrança
            </Button>
          </NovaCobrancaSheet>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID / Referência</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Canais</TableHead>
              <TableHead>Status Entrega</TableHead>
              <TableHead>Status Cobrança</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                  Nenhuma cobrança encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((cobranca) => (
                <TableRow key={cobranca.id}>
                  <TableCell>
                    <div className="font-medium text-xs">{cobranca.id}</div>
                    <div className="text-xs text-muted-foreground">Tit: {cobranca.tituloReferencia}</div>
                  </TableCell>
                  <TableCell className="font-medium">{cobranca.cliente}</TableCell>
                  <TableCell>{new Date(cobranca.vencimento).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(cobranca.valor)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {cobranca.canal.map(c => (
                        <div key={c} title={c}>{getCanalIcon(c)}</div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusEntregaColor(cobranca.statusEntrega) + " border-0"}>
                      {cobranca.statusEntrega}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={getStatusCobrancaColor(cobranca.statusCobranca) + " border-0"}>
                      {cobranca.statusCobranca}
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
                        <DropdownMenuItem>Ver detalhes e Timeline</DropdownMenuItem>
                        <DropdownMenuItem>Registrar Resposta</DropdownMenuItem>
                        <DropdownMenuItem>Reenviar</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600">Cancelar cobrança</DropdownMenuItem>
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

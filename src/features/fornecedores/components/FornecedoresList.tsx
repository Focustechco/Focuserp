import React, { useState } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Fornecedor } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Plus, MoreHorizontal, User, Building2, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovoFornecedorSheet } from './NovoFornecedorSheet';
import { toast } from 'sonner';

export function FornecedoresList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: fornecedores, deleteItem } = useLocalStorageState<Fornecedor>('focus_fornecedores');

  const safeFornecedores = Array.isArray(fornecedores) ? fornecedores : [];

  const filteredData = safeFornecedores.filter(f => {
    if (!f) return false;
    const search = searchTerm.toLowerCase();
    return (f.nomeFantasia || f.razaoSocial || '').toLowerCase().includes(search) ||
           (f.codigo || '').toLowerCase().includes(search) ||
           (f.documento || '').includes(search);
  });

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar fornecedor, código ou documento..." 
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
          <NovoFornecedorSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Fornecedor
            </Button>
          </NovoFornecedorSheet>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Fornecedor</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Contato Principal</TableHead>
              <TableHead>Localidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum fornecedor encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((fornecedor) => {
                const contatos = Array.isArray(fornecedor?.contatos) ? fornecedor.contatos : [];
                const contatoPrincipal = contatos.find(c => c?.principal) || contatos[0];
                return (
                  <TableRow key={fornecedor.id || Math.random().toString()} className="group cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-xs text-muted-foreground">{fornecedor.codigo || 'N/D'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${fornecedor.tipo === 'Pessoa Jurídica' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400'}`}>
                          {fornecedor.tipo === 'Pessoa Jurídica' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">{fornecedor.nomeFantasia || fornecedor.razaoSocial || 'Fornecedor Sem Nome'}</span>
                          <span className="text-xs text-muted-foreground">{fornecedor.documento || 'N/D'}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">{fornecedor.categoria || 'Geral'}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{contatoPrincipal?.nome || 'N/D'}</span>
                        <span className="text-xs text-muted-foreground">{contatoPrincipal?.celular || contatoPrincipal?.email || 'Sem contato'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{fornecedor.endereco?.cidade || 'N/D'}</span>
                        <span className="text-xs text-muted-foreground">{fornecedor.endereco?.estado || ''}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={fornecedor.status === 'Ativo' ? 'default' : 'secondary'} className={fornecedor.status === 'Ativo' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                        {fornecedor.status || 'Ativo'}
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
                          <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                          <DropdownMenuItem>Editar Cadastro</DropdownMenuItem>
                          <DropdownMenuItem>Ver Financeiro</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => {
                            deleteItem(fornecedor.id);
                            toast.success("Fornecedor removido com sucesso!");
                          }}>
                            Excluir Fornecedor
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

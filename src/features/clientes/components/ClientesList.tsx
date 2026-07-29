import React, { useState } from 'react';
import { useClientesQuery } from '../hooks/useClientesQuery';
import { Cliente } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Plus, MoreHorizontal, User, Building2 } from 'lucide-react';
import { NovoClienteSheet } from './NovoClienteSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from '@tanstack/react-router';

export function ClientesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { clientes, isLoading, deleteCliente } = useClientesQuery();

  const filteredData = clientes.filter(c => 
    (c.razaoSocial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.nomeFantasia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.documento || '').includes(searchTerm) ||
    (c.codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Toolbar / Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, documento ou código..." 
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
          <NovoClienteSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </NovoClienteSheet>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente / Tipo</TableHead>
              <TableHead>Documento</TableHead>
              <TableHead>Contato Principal</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((cliente) => {
                const contatoPrincipal = cliente.contatos.find(c => c.principal) || cliente.contatos[0];
                return (
                  <TableRow key={cliente.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-xs">{cliente.codigo}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {cliente.tipo === 'Pessoa Jurídica' ? <Building2 className="w-4 h-4 text-blue-500" /> : <User className="w-4 h-4 text-amber-500" />}
                        <div className="flex flex-col">
                          <span className="font-medium">{cliente.nomeFantasia || cliente.razaoSocial}</span>
                          {cliente.tipo === 'Pessoa Jurídica' && (
                            <span className="text-xs text-muted-foreground">{cliente.razaoSocial}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{cliente.documento}</TableCell>
                    <TableCell>
                      {contatoPrincipal ? (
                        <div className="flex flex-col">
                          <span className="text-sm">{contatoPrincipal.nome}</span>
                          <span className="text-xs text-muted-foreground">{contatoPrincipal.email}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Sem contato</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">{cliente.endereco.cidade} - {cliente.endereco.estado}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.status === 'Ativo' ? 'default' : 'secondary'} className={cliente.status === 'Ativo' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                        {cliente.status}
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
                          <Link to="/clientes/$clienteId" params={{ clienteId: cliente.id }}>
                            <DropdownMenuItem className="cursor-pointer">Ver Perfil</DropdownMenuItem>
                          </Link>
                          
                          <NovoClienteSheet clienteToEdit={cliente}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                              Editar Cadastro
                            </DropdownMenuItem>
                          </NovoClienteSheet>

                          <Link to="/contas-a-receber">
                            <DropdownMenuItem className="cursor-pointer">Ver Financeiro</DropdownMenuItem>
                          </Link>
                          
                          <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => {
                            if (window.confirm('Tem certeza que deseja excluir este cliente?')) {
                              deleteCliente(cliente.id);
                            }
                          }}>
                            Excluir Cliente
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

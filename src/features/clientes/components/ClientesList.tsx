import React, { useState } from 'react';
import { useClientesQuery } from '../hooks/useClientesQuery';
import { Cliente } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Plus, MoreHorizontal, User, Building2, Eye, Edit3 } from 'lucide-react';
import { NovoClienteSheet } from './NovoClienteSheet';
import { ClientePerfilSheet } from './ClientePerfilSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from '@tanstack/react-router';

export function ClientesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { clientes, isLoading, deleteCliente } = useClientesQuery();

  // Estados para o Modal Lateral (Sheet) de Perfil Read-Only
  const [clientePerfil, setClientePerfil] = useState<Cliente | null>(null);
  const [perfilOpen, setPerfilOpen] = useState(false);

  // Estado para Edição rápida disparada pelo Perfil
  const [clienteParaEditar, setClienteParaEditar] = useState<Cliente | null>(null);

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
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </NovoClienteSheet>
        </div>
      </div>

      {/* Tabela de Clientes */}
      <div className="border rounded-lg bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">Código</TableHead>
              <TableHead>Cliente / Razão Social</TableHead>
              <TableHead>CPF / CNPJ</TableHead>
              <TableHead>Contato Principal</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Carregando carteira de clientes...
                </TableCell>
              </TableRow>
            ) : filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  Nenhum cliente encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((cliente) => {
                const contatoPrincipal = cliente.contatos.find(c => c.principal) || cliente.contatos[0];
                return (
                  <TableRow key={cliente.id} className="group hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-xs font-mono">{cliente.codigo}</TableCell>
                    <TableCell>
                      <div 
                        className="flex items-center gap-2.5 cursor-pointer group-hover:text-primary transition-colors"
                        onClick={() => {
                          setClientePerfil(cliente);
                          setPerfilOpen(true);
                        }}
                      >
                        {cliente.tipo === 'Pessoa Jurídica' ? <Building2 className="w-4 h-4 text-blue-500 shrink-0" /> : <User className="w-4 h-4 text-amber-500 shrink-0" />}
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-sm truncate">{cliente.nomeFantasia || cliente.razaoSocial}</span>
                          {cliente.tipo === 'Pessoa Jurídica' && (
                            <span className="text-xs text-muted-foreground truncate">{cliente.razaoSocial}</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs font-mono">{cliente.documento}</TableCell>
                    <TableCell>
                      {contatoPrincipal ? (
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-foreground">{contatoPrincipal.nome}</span>
                          <span className="text-[11px] text-muted-foreground">{contatoPrincipal.email || contatoPrincipal.celular || '-'}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">Sem contato</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col text-xs">
                        <span className="text-foreground">{cliente.endereco?.cidade || '-'} - {cliente.endereco?.estado || '-'}</span>
                        {cliente.endereco?.bairro && (
                          <span className="text-[11px] text-muted-foreground">{cliente.endereco.bairro}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={cliente.status === 'Ativo' ? 'default' : 'secondary'} className={cliente.status === 'Ativo' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
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
                          <DropdownMenuItem 
                            className="cursor-pointer font-medium"
                            onSelect={(e) => {
                              e.preventDefault();
                              setClientePerfil(cliente);
                              setPerfilOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-2 text-primary" />
                            Ver Perfil
                          </DropdownMenuItem>
                          
                          <NovoClienteSheet clienteToEdit={cliente}>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="cursor-pointer">
                              <Edit3 className="w-4 h-4 mr-2 text-slate-500" />
                              Editar Cadastro
                            </DropdownMenuItem>
                          </NovoClienteSheet>

                          <Link to="/contas-a-receber">
                            <DropdownMenuItem className="cursor-pointer">Ver Financeiro</DropdownMenuItem>
                          </Link>
                          
                          <DropdownMenuItem
                            className="text-red-600 cursor-pointer focus:bg-red-500/10 focus:text-red-600"
                            onSelect={async (e) => {
                              e.preventDefault();
                              if (window.confirm(`Tem certeza que deseja excluir o cliente "${cliente.nomeFantasia || cliente.razaoSocial}"?`)) {
                                try {
                                  await deleteCliente(cliente.id);
                                } catch (err) {
                                  console.error('Erro ao excluir cliente:', err);
                                }
                              }
                            }}
                          >
                            Excluir Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal Lateral / Sheet Read-Only de Ver Perfil 360 */}
      <ClientePerfilSheet
        cliente={clientePerfil}
        open={perfilOpen}
        onOpenChange={setPerfilOpen}
        onEdit={(cli) => {
          setClienteParaEditar(cli);
        }}
      />

      {/* Disparador de Edição a partir do Perfil */}
      {clienteParaEditar && (
        <NovoClienteSheet clienteToEdit={clienteParaEditar}>
          <button id="btn-trigger-edit-from-profile" className="hidden" />
        </NovoClienteSheet>
      )}
    </div>
  );
}

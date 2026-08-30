import React, { useState } from 'react';
import { useClientesQuery } from '../hooks/useClientesQuery';
import { Cliente } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, Download, Plus, MoreHorizontal, User, 
  Building2, Eye, Edit3, LayoutGrid, List, MapPin, Mail, Phone 
} from 'lucide-react';
import { NovoClienteSheet } from './NovoClienteSheet';
import { ClientePerfilSheet } from './ClientePerfilSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Link } from '@tanstack/react-router';

export function ClientesList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');
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
              className="pl-8 text-xs h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          {/* Alternador Lista / Cards */}
          <div className="flex items-center border rounded-lg p-0.5 bg-muted/40">
            <Button
              variant={viewMode === 'table' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="h-8 px-2.5 text-xs gap-1.5"
              title="Visualização em Lista / Tabela"
            >
              <List className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lista</span>
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('cards')}
              className="h-8 px-2.5 text-xs gap-1.5"
              title="Visualização em Cards"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
          </div>

          <NovoClienteSheet>
            <Button size="sm" className="bg-orange-600 hover:bg-orange-700 text-white h-8 text-xs font-semibold">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              Novo Cliente
            </Button>
          </NovoClienteSheet>
        </div>
      </div>

      {/* Conteúdo: Tabela ou Cards */}
      {viewMode === 'table' ? (
        <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow>
                <TableHead className="w-[100px] text-xs font-semibold">Código</TableHead>
                <TableHead className="text-xs font-semibold">Cliente / Razão Social</TableHead>
                <TableHead className="text-xs font-semibold">CPF / CNPJ</TableHead>
                <TableHead className="text-xs font-semibold">Contato Principal</TableHead>
                <TableHead className="text-xs font-semibold">Localização</TableHead>
                <TableHead className="text-xs font-semibold">Status</TableHead>
                <TableHead className="text-xs font-semibold text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                    Carregando carteira de clientes...
                  </TableCell>
                </TableRow>
              ) : filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                    Nenhum cliente encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((cliente) => {
                  const contatoPrincipal = cliente.contatos?.find(c => c.principal) || cliente.contatos?.[0];
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
                        <Badge variant={cliente.status === 'Ativo' ? 'default' : 'secondary'} className={cliente.status === 'Ativo' ? 'bg-emerald-600 hover:bg-emerald-700 text-[10px]' : 'text-[10px]'}>
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
      ) : (
        /* Visualização em Cards */
        <div>
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              Carregando carteira de clientes...
            </div>
          ) : filteredData.length === 0 ? (
            <div className="border rounded-xl p-12 text-center text-muted-foreground text-sm bg-card">
              <User className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
              Nenhum cliente encontrado para os critérios de busca.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredData.map((cliente) => {
                const contatoPrincipal = cliente.contatos?.find(c => c.principal) || cliente.contatos?.[0];
                return (
                  <Card 
                    key={cliente.id} 
                    className="border rounded-xl hover:border-primary/40 hover:shadow-md transition-all group flex flex-col justify-between overflow-hidden bg-card"
                  >
                    <CardHeader className="p-4 pb-3 border-b bg-muted/20">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${cliente.tipo === 'Pessoa Jurídica' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
                            {cliente.tipo === 'Pessoa Jurídica' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0">
                            <h3 
                              onClick={() => { setClientePerfil(cliente); setPerfilOpen(true); }}
                              className="font-bold text-sm text-foreground truncate hover:text-primary cursor-pointer transition-colors"
                              title={cliente.nomeFantasia || cliente.razaoSocial}
                            >
                              {cliente.nomeFantasia || cliente.razaoSocial}
                            </h3>
                            <p className="text-xs text-muted-foreground truncate">
                              {cliente.tipo === 'Pessoa Jurídica' ? cliente.razaoSocial : (cliente.segmento || 'Pessoa Física')}
                            </p>
                          </div>
                        </div>
                        <Badge 
                          variant={cliente.status === 'Ativo' ? 'default' : 'secondary'} 
                          className={`text-[10px] shrink-0 ${cliente.status === 'Ativo' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
                        >
                          {cliente.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="p-4 space-y-2.5 text-xs flex-1">
                      <div className="flex items-center justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">Código / ID:</span>
                        <span className="font-mono font-semibold text-foreground">{cliente.codigo || '-'}</span>
                      </div>

                      <div className="flex items-center justify-between py-1 border-b border-dashed">
                        <span className="text-muted-foreground">CPF / CNPJ:</span>
                        <span className="font-mono text-foreground">{cliente.documento || '-'}</span>
                      </div>

                      {contatoPrincipal && (
                        <div className="space-y-1 py-1 border-b border-dashed">
                          <span className="text-muted-foreground block text-[11px]">Contato Principal:</span>
                          <div className="flex items-center gap-1.5 text-foreground font-medium truncate">
                            <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{contatoPrincipal.nome}</span>
                          </div>
                          {contatoPrincipal.email && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                              <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span className="truncate">{contatoPrincipal.email}</span>
                            </div>
                          )}
                          {contatoPrincipal.celular && (
                            <div className="flex items-center gap-1.5 text-muted-foreground text-[11px] truncate">
                              <Phone className="w-3 h-3 text-muted-foreground shrink-0" />
                              <span>{contatoPrincipal.celular}</span>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> Localidade:
                        </span>
                        <span className="text-foreground font-medium truncate max-w-[170px]">
                          {cliente.endereco?.cidade ? `${cliente.endereco.cidade} - ${cliente.endereco.estado || ''}` : '-'}
                        </span>
                      </div>
                    </CardContent>

                    <CardFooter className="p-3 border-t bg-muted/10 flex items-center justify-between gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => { setClientePerfil(cliente); setPerfilOpen(true); }}
                        className="w-full text-xs h-8 gap-1.5 font-medium hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Perfil 360°
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
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
                            Ver Perfil Completo
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
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

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

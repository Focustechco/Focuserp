import React, { useState } from 'react';
import { useProjetosQuery } from '../hooks/useProjetosQuery';
import { useClientesQuery } from '@/features/clientes/hooks/useClientesQuery';
import { Projeto } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, Download, Plus, MoreHorizontal, LayoutGrid, List as ListIcon, 
  Calendar, Trash2, Building2, User, Clock, DollarSign, ArrowRight, Eye, 
  FolderKanban, CheckCircle2, AlertCircle, X
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { NovoProjetoSheet } from './NovoProjetoSheet';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatDateSafe = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Concluído':
      return <Badge className="bg-emerald-600 text-white font-semibold text-[11px]">Concluído</Badge>;
    case 'Em Desenvolvimento':
      return <Badge className="bg-blue-600 text-white font-semibold text-[11px]">Em Desenvolvimento</Badge>;
    case 'Em Homologação':
      return <Badge className="bg-purple-600 text-white font-semibold text-[11px]">Em Homologação</Badge>;
    case 'Aguardando Cliente':
      return <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:text-amber-400 text-[11px] font-semibold">Aguardando Cliente</Badge>;
    case 'Planejamento':
      return <Badge variant="secondary" className="text-[11px]">Planejamento</Badge>;
    case 'Cancelado':
      return <Badge variant="destructive" className="text-[11px]">Cancelado</Badge>;
    default:
      return <Badge variant="outline" className="text-[11px]">{status}</Badge>;
  }
};

const getPrioridadeBadge = (prio: string) => {
  switch (prio) {
    case 'Crítica':
      return <Badge variant="destructive" className="text-[10px] px-1.5 py-0 font-bold">Crítica</Badge>;
    case 'Alta':
      return <Badge variant="outline" className="text-orange-700 bg-orange-50 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 text-[10px] px-1.5 py-0 font-bold">Alta</Badge>;
    case 'Média':
      return <Badge variant="outline" className="text-blue-700 bg-blue-50 border-blue-300 dark:bg-blue-950/40 dark:text-blue-400 text-[10px] px-1.5 py-0 font-semibold">Média</Badge>;
    case 'Baixa':
      return <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Baixa</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px]">{prio}</Badge>;
  }
};

export function ProjetosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tabela' | 'cards'>('cards');
  const { projetos, deleteProjeto } = useProjetosQuery();
  const { clientes } = useClientesQuery();

  const filteredData = projetos.filter(p => 
    (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.responsavelPrincipal || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.tipo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* BARRA DE CONTROLE SUPERIOR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-3 rounded-lg border shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar projeto, código ou responsável..." 
              className="pl-8 text-xs h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Limpar
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Seletor de Modo de Visualização: Tabela vs Cards Detalhados */}
          <div className="flex items-center border rounded-md p-0.5 bg-muted/40">
            <Button 
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-1 text-xs"
              onClick={() => setViewMode('cards')}
              title="Visualização em Cards Detalhados"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-orange-600" /> Cards
            </Button>
            <Button 
              variant={viewMode === 'tabela' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-1 text-xs"
              onClick={() => setViewMode('tabela')}
              title="Visualização em Tabela"
            >
              <ListIcon className="w-3.5 h-3.5" /> Tabela
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="h-9 text-xs gap-1.5"
            onClick={() => toast.info("Exportação da listagem de projetos iniciada.")}
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>

          <NovoProjetoSheet>
            <Button size="sm" className="h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold gap-1.5 shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              Novo Projeto
            </Button>
          </NovoProjetoSheet>
        </div>
      </div>

      {/* MODO CARDS DETALHADOS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground text-xs bg-card rounded-lg border">
              <FolderKanban className="w-8 h-8 opacity-30 mx-auto mb-2" />
              <p className="font-semibold text-foreground text-sm">Nenhum projeto encontrado</p>
              <p className="mt-1">Tente ajustar os termos da busca ou cadastre um novo projeto.</p>
            </div>
          ) : (
            filteredData.map((projeto) => {
              const cliente = clientes.find(c => c.id === projeto.idCliente);
              const clienteNome = cliente?.nomeFantasia || cliente?.razaoSocial || 'Cliente';

              return (
                <div 
                  key={projeto.id} 
                  className="bg-card border rounded-xl p-5 hover:border-orange-500/50 hover:shadow-md transition-all flex flex-col justify-between group"
                >
                  {/* Topo do Card */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-[11px] font-bold text-orange-600 bg-orange-500/10 px-1.5 py-0.5 rounded">
                            {projeto.codigo}
                          </span>
                          {getPrioridadeBadge(projeto.prioridade)}
                        </div>
                        <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-orange-600 transition-colors line-clamp-1">
                          {projeto.nome}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {getStatusBadge(projeto.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <Link to="/projetos/$projetoId" params={{ projetoId: projeto.id }}>
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Eye className="w-3.5 h-3.5 text-primary" /> Ver Painel do Projeto
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-rose-600 focus:text-rose-600 gap-2 cursor-pointer" 
                              onClick={() => {
                                deleteProjeto(projeto.id);
                                toast.success("Projeto excluído com sucesso!");
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Projeto
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Vínculo de Cliente e Tipo */}
                    <div className="space-y-1 bg-muted/30 p-2.5 rounded-lg border text-xs">
                      <div className="flex items-center gap-1.5 text-foreground font-medium truncate">
                        <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{clienteNome}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span className="truncate">{projeto.tipo}</span>
                        <span>Resp: <strong>{projeto.responsavelPrincipal || 'Gestor'}</strong></span>
                      </div>
                    </div>

                    {/* Progresso do Projeto */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between items-center text-xs font-semibold">
                        <span className="text-muted-foreground text-[11px]">Progresso de Entrega</span>
                        <span className="text-foreground">{projeto.progressoGlobal || 0}%</span>
                      </div>
                      <Progress value={projeto.progressoGlobal || 0} className="h-2" />
                    </div>

                    {/* Dados Financeiros e Horas */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Valor Contratado</span>
                        <span className="font-bold text-xs sm:text-sm text-foreground">
                          {formatCurrency(projeto.valorContratado)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Horas Realizadas</span>
                        <span className="font-semibold text-xs text-muted-foreground">
                          {projeto.horasRealizadas || 0}h / {projeto.horasPlanejadas || 0}h
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card com Ação Direta */}
                  <div className="pt-4 mt-3 border-t flex items-center justify-between gap-2">
                    <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground/80" />
                      <span>Até {formatDateSafe(projeto.dataFinal)}</span>
                    </div>

                    <Link to="/projetos/$projetoId" params={{ projetoId: projeto.id }}>
                      <Button size="sm" variant="ghost" className="h-7 px-2.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 gap-1 font-semibold">
                        Acessar Painel <ArrowRight className="w-3 h-3" />
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODO TABELA */}
      {viewMode === 'tabela' && (
        <div className="rounded-lg border bg-card overflow-x-auto shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40 text-xs">
              <TableRow>
                <TableHead className="w-24">Código</TableHead>
                <TableHead>Projeto & Cliente</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead className="w-40">Progresso</TableHead>
                <TableHead className="text-right">Valor Contratado</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-xs">
                    Nenhum projeto encontrado.
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((projeto) => {
                  const cliente = clientes.find(c => c.id === projeto.idCliente);
                  const clienteNome = cliente?.nomeFantasia || cliente?.razaoSocial || 'Cliente';

                  return (
                    <TableRow key={projeto.id} className="group hover:bg-muted/40 transition-colors">
                      <TableCell className="font-mono font-bold text-xs text-orange-600">
                        {projeto.codigo}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Link 
                            to="/projetos/$projetoId" 
                            params={{ projetoId: projeto.id }}
                            className="font-bold text-xs sm:text-sm text-foreground hover:text-orange-600 transition-colors"
                          >
                            {projeto.nome}
                          </Link>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-0.5">
                            <span>{clienteNome}</span>
                            <span>•</span>
                            <span className="truncate">{projeto.tipo}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {projeto.responsavelPrincipal || '-'}
                      </TableCell>
                      <TableCell>
                        {getPrioridadeBadge(projeto.prioridade)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                            <span>{projeto.progressoGlobal || 0}%</span>
                            <span>{projeto.horasRealizadas || 0}h / {projeto.horasPlanejadas || 0}h</span>
                          </div>
                          <Progress value={projeto.progressoGlobal || 0} className="h-1.5" />
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-bold text-xs sm:text-sm text-foreground">
                        {formatCurrency(projeto.valorContratado)}
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatusBadge(projeto.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <Link to="/projetos/$projetoId" params={{ projetoId: projeto.id }}>
                              <DropdownMenuItem className="gap-2 cursor-pointer">
                                <Eye className="w-3.5 h-3.5 text-primary" /> Ver Painel do Projeto
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-rose-600 focus:text-rose-600 gap-2 cursor-pointer" 
                              onClick={() => {
                                deleteProjeto(projeto.id);
                                toast.success("Projeto excluído com sucesso!");
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Projeto
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
      )}
    </div>
  );
}

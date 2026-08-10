import React, { useState } from 'react';
import { useProjetosQuery } from '../hooks/useProjetosQuery';
import { useClientesQuery } from '@/features/clientes/hooks/useClientesQuery';
import { Projeto } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Plus, MoreHorizontal, Columns, Calendar, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { NovoProjetoSheet } from './NovoProjetoSheet';
import { Link } from '@tanstack/react-router';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Concluído': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-0';
    case 'Em Desenvolvimento': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-0';
    case 'Em Homologação': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-0';
    case 'Aguardando Cliente': return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-0';
    case 'Planejamento': return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300 border-0';
    case 'Cancelado': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-0';
    default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-0';
  }
};

const getPrioridadeColor = (prio: string) => {
  switch (prio) {
    case 'Crítica': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded-full text-xs font-semibold';
    case 'Alta': return 'text-orange-600 bg-orange-100 dark:bg-orange-900 dark:text-orange-300 px-2 py-0.5 rounded-full text-xs font-semibold';
    case 'Média': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-300 px-2 py-0.5 rounded-full text-xs font-semibold';
    case 'Baixa': return 'text-slate-600 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-full text-xs font-semibold';
    default: return '';
  }
};

export function ProjetosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const { projetos, deleteProjeto } = useProjetosQuery();
  const { clientes } = useClientesQuery();

  const filteredData = projetos.filter(p => 
    (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.codigo || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar projeto, código ou cliente..." 
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
          <Button variant="outline" size="icon" title="Visão Kanban (Em breve)">
            <Columns className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="outline" size="icon" title="Visão Cronograma (Em breve)">
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </Button>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <NovoProjetoSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Projeto
            </Button>
          </NovoProjetoSheet>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Projeto / Cliente</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead>Prioridade</TableHead>
              <TableHead>Progresso</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                  Nenhum projeto encontrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((projeto) => {
                const cliente = clientes.find(c => c.id === projeto.idCliente);
                return (
                  <TableRow key={projeto.id} className="group cursor-pointer hover:bg-muted/50">
                    <TableCell className="font-medium text-xs">{projeto.codigo}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-primary">{projeto.nome}</span>
                        <span className="text-xs text-muted-foreground">{cliente?.nomeFantasia} • {projeto.tipo}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{projeto.responsavelPrincipal}</div>
                    </TableCell>
                    <TableCell>
                      <span className={getPrioridadeColor(projeto.prioridade)}>{projeto.prioridade}</span>
                    </TableCell>
                    <TableCell className="w-[150px]">
                      <div className="flex flex-col gap-1">
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{projeto.progressoGlobal}%</span>
                        </div>
                        <Progress value={projeto.progressoGlobal} className="h-2" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStatusColor(projeto.status)}>
                        {projeto.status}
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
                          <Link to="/projetos/$projetoId" params={{ projetoId: projeto.id }}>
                            <DropdownMenuItem>Ver Painel do Projeto</DropdownMenuItem>
                          </Link>
                          <DropdownMenuItem>Apontar Horas</DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => {
                            deleteProjeto(projeto.id);
                          }}>
                            Excluir Projeto
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

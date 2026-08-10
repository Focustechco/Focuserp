import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Filter, MoreHorizontal, UserPlus, FileDown, Trash2, Edit3, CreditCard } from 'lucide-react';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { Colaborador } from '../types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ColaboradoresTableProps {
  onNewClick: () => void;
  onEditClick: (colab: Colaborador) => void;
}

export function ColaboradoresTable({ onNewClick, onEditClick }: ColaboradoresTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { colaboradores, deleteColaborador } = useColaboradoresQuery();

  const filteredColabs = colaboradores.filter(c => {
    const nome = c.nomeCompleto || '';
    const cargo = c.cargo || '';
    const depto = c.departamento || '';
    const matricula = c.matricula || '';
    return nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
           cargo.toLowerCase().includes(searchTerm.toLowerCase()) ||
           depto.toLowerCase().includes(searchTerm.toLowerCase()) ||
           matricula.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-none">Ativo</Badge>;
      case 'Inativo':
        return <Badge variant="outline" className="text-muted-foreground">Inativo</Badge>;
      case 'Férias':
        return <Badge className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border-none">Férias</Badge>;
      case 'Em Experiência':
        return <Badge className="bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border-none">Experiência</Badge>;
      case 'Afastado':
        return <Badge className="bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-none">Afastado</Badge>;
      default:
        return <Badge>{status || 'Ativo'}</Badge>;
    }
  };

  const getInitials = (name: string) => {
    return (name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2 w-full sm:w-1/2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, cargo, departamento ou PIX..."
              className="pl-8 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={onNewClick} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs">
            <UserPlus className="w-4 h-4" /> Novo Colaborador
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-hidden">
        <Table text-xs>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead>Colaborador</TableHead>
              <TableHead>Matrícula</TableHead>
              <TableHead>Cargo & Departamento</TableHead>
              <TableHead>Método de Pagamento</TableHead>
              <TableHead>Admissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredColabs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10 text-muted-foreground text-xs">
                  Nenhum colaborador cadastrado.
                </TableCell>
              </TableRow>
            ) : (
              filteredColabs.map((colab) => (
                <TableRow key={colab.id} className="hover:bg-muted/30 cursor-pointer text-xs">
                  <TableCell onClick={() => onEditClick(colab)}>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={colab.foto} alt={colab.nomeCompleto} />
                        <AvatarFallback className="font-bold bg-primary/10 text-primary">{getInitials(colab.nomeCompleto || '')}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{colab.nomeCompleto}</span>
                        <span className="text-[11px] text-muted-foreground">{colab.emailCorporativo || colab.telefone}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-muted-foreground">{colab.matricula}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{colab.cargo}</span>
                      <span className="text-[11px] text-muted-foreground">{colab.departamento}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-[11px]">
                      <span className="font-medium flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                        <CreditCard className="w-3 h-3" /> {colab.metodoPagamento?.formaPagamento || 'PIX'}
                      </span>
                      <span className="text-muted-foreground truncate max-w-[150px]">
                        {colab.metodoPagamento?.chavePix ? `PIX: ${colab.metodoPagamento.chavePix}` : (colab.metodoPagamento?.banco || 'Itaú')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {colab.dataAdmissao ? new Date(colab.dataAdmissao).toLocaleDateString('pt-BR') : '-'}
                  </TableCell>
                  <TableCell>{getStatusBadge(colab.status || 'Ativo')}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onEditClick(colab)}>
                          <Edit3 className="w-4 h-4 mr-2" /> Ver / Editar Perfil
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600" onClick={() => {
                          deleteColaborador(colab.id);
                        }}>
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir Colaborador
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

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
import { Search, MoreHorizontal, UserPlus, Trash2, Edit3, CreditCard } from 'lucide-react';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { Colaborador } from '../types';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface ColaboradoresTableProps {
  onNewClick?: () => void;
  onEditClick: (colab: Colaborador) => void;
  searchTerm?: string;
  hideToolbar?: boolean;
}

export function ColaboradoresTable({ onNewClick, onEditClick, searchTerm: externalSearch, hideToolbar }: ColaboradoresTableProps) {
  const [internalSearch, setInternalSearch] = useState("");
  const { colaboradores, deleteColaborador } = useColaboradoresQuery();

  const activeSearch = externalSearch !== undefined ? externalSearch : internalSearch;

  const filteredColabs = colaboradores.filter(c => {
    const nome = c.nomeCompleto || '';
    const cargo = c.cargo || '';
    const depto = c.departamento || '';
    const matricula = c.matricula || '';
    const pix = c.metodoPagamento?.chavePix || '';
    return nome.toLowerCase().includes(activeSearch.toLowerCase()) ||
           cargo.toLowerCase().includes(activeSearch.toLowerCase()) ||
           depto.toLowerCase().includes(activeSearch.toLowerCase()) ||
           pix.toLowerCase().includes(activeSearch.toLowerCase()) ||
           matricula.toLowerCase().includes(activeSearch.toLowerCase());
  });

  const colabsAtivos = filteredColabs.filter(c => c.status !== 'Inativo');
  const colabsInativos = filteredColabs.filter(c => c.status === 'Inativo');

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

  const renderColaboradoresTable = (lista: Colaborador[], isInactive = false) => {
    if (lista.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-xs border rounded-xl bg-card">
          Nenhum colaborador {isInactive ? 'inativo' : 'ativo'} encontrado.
        </div>
      );
    }

    return (
      <div className={`rounded-xl border bg-card overflow-hidden shadow-xs ${isInactive ? 'opacity-90' : ''}`}>
        <Table className="text-xs">
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
            {lista.map((colab) => (
              <TableRow key={colab.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={colab.foto} />
                      <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                        {getInitials(colab.nomeCompleto)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-semibold text-foreground">{colab.nomeCompleto}</div>
                      <div className="text-[11px] text-muted-foreground">{colab.emailCorporativo || 'Sem e-mail'}</div>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-xs font-medium">
                  {colab.matricula}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{colab.cargo}</div>
                  <div className="text-[11px] text-muted-foreground">{colab.departamento}</div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5 font-medium">
                    <CreditCard className="w-3.5 h-3.5 text-muted-foreground" />
                    {colab.metodoPagamento?.formaPagamento || 'PIX'}
                  </div>
                  <div className="text-[11px] text-muted-foreground">
                    {colab.metodoPagamento?.chavePix 
                      ? `PIX: ${colab.metodoPagamento.chavePix}` 
                      : (colab.metodoPagamento?.banco || 'Conta Bancária')}
                  </div>
                </TableCell>
                <TableCell className="text-xs">
                  {colab.dataAdmissao || 'Não informada'}
                </TableCell>
                <TableCell>
                  {getStatusBadge(colab.status)}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem onClick={() => onEditClick(colab)} className="gap-2 cursor-pointer">
                        <Edit3 className="w-3.5 h-3.5" /> Editar Perfil
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => deleteColaborador(colab.id)} 
                        className="gap-2 text-destructive focus:text-destructive cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {!hideToolbar && externalSearch === undefined && (
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="flex gap-2 w-full sm:w-1/2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome, cargo, departamento ou PIX..."
                className="pl-8 text-xs"
                value={internalSearch}
                onChange={(e) => setInternalSearch(e.target.value)}
              />
            </div>
          </div>
          {onNewClick && (
            <div className="flex gap-2">
              <Button onClick={onNewClick} className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold">
                <UserPlus className="w-4 h-4" /> Novo Colaborador
              </Button>
            </div>
          )}
        </div>
      )}

      {/* 1. LISTA DE COLABORADORES ATIVOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-foreground">Colaboradores Ativos</h3>
            <Badge variant="secondary" className="text-xs font-semibold">
              {colabsAtivos.length}
            </Badge>
          </div>
        </div>
        {renderColaboradoresTable(colabsAtivos, false)}
      </div>

      {/* 2. LISTA DE COLABORADORES INATIVOS */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-muted-foreground">Colaboradores Inativos / Desligados</h3>
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {colabsInativos.length}
            </Badge>
          </div>
        </div>
        {renderColaboradoresTable(colabsInativos, true)}
      </div>
    </div>
  );
}

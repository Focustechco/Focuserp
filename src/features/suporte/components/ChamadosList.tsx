import React, { useState } from 'react';
import { ChamadoSuporte } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Headphones,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Code2,
  User,
  Boxes,
  ShieldAlert,
  ArrowRight,
  Filter,
} from 'lucide-react';

interface ChamadosListProps {
  chamados: ChamadoSuporte[];
  onSelectChamado: (chamado: ChamadoSuporte) => void;
  onOpenNovoModal: () => void;
}

export function ChamadosList({ chamados, onSelectChamado, onOpenNovoModal }: ChamadosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [prioridadeFilter, setPrioridadeFilter] = useState<string>('all');

  const filteredChamados = chamados.filter((c) => {
    const matchesSearch =
      (c.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.clienteNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.produtoNome || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesPrioridade = prioridadeFilter === 'all' || c.prioridade === prioridadeFilter;

    return matchesSearch && matchesStatus && matchesPrioridade;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BARRA DE PESQUISA E FILTROS */}
      <Card className="border-border/80">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar chamados por número (TK-1001), assunto, cliente ou produto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="Aberto">Aberto</SelectItem>
                <SelectItem value="Em Atendimento">Em Atendimento</SelectItem>
                <SelectItem value="Aguardando Cliente">Aguardando Cliente</SelectItem>
                <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                <SelectItem value="Resolvido">Resolvido</SelectItem>
              </SelectContent>
            </Select>

            <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
              <SelectTrigger className="w-[140px] text-xs">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas Prioridades</SelectItem>
                <SelectItem value="Baixa">Baixa</SelectItem>
                <SelectItem value="Média">Média</SelectItem>
                <SelectItem value="Alta">Alta</SelectItem>
                <SelectItem value="Crítica">Crítica</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={onOpenNovoModal} size="sm" className="gap-1.5 text-xs font-semibold shrink-0">
              <Plus className="h-4 w-4" /> Novo Chamado
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE CHAMADOS */}
      <Card className="border-border/80">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Número</TableHead>
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Produto</TableHead>
                <TableHead className="text-xs">Assunto / Tipo</TableHead>
                <TableHead className="text-xs">Prioridade</TableHead>
                <TableHead className="text-xs">SLA Status</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredChamados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                    Nenhum chamado de suporte encontrado para os filtros selecionados.
                  </TableCell>
                </TableRow>
              ) : (
                filteredChamados.map((c) => (
                  <TableRow
                    key={c.id}
                    onClick={() => onSelectChamado(c)}
                    className="cursor-pointer hover:bg-muted/40 transition-colors"
                  >
                    <TableCell className="font-mono text-xs font-bold text-primary">{c.numero}</TableCell>
                    <TableCell className="font-semibold text-xs text-foreground">
                      {c.clienteNome}
                      <span className="text-[10px] text-muted-foreground block font-normal">
                        {c.contatoNome || 'Contato Direct'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] font-semibold">
                        {c.produtoNome}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-xs text-foreground truncate max-w-[240px]">{c.titulo}</div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <Badge variant="secondary" className="text-[9px]">
                          {c.tipo}
                        </Badge>
                        {c.devTaskId && (
                          <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-[9px]">
                            Dev Task Linked
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`text-[10px] ${
                          c.prioridade === 'Crítica'
                            ? 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                            : c.prioridade === 'Alta'
                            ? 'bg-amber-500/10 text-amber-600'
                            : ''
                        }`}
                      >
                        {c.prioridade}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] ${
                          c.slaStatus === 'Violado'
                            ? 'border-rose-500 text-rose-600 bg-rose-50'
                            : c.slaStatus === 'Em Risco'
                            ? 'border-amber-500 text-amber-600 bg-amber-50'
                            : 'border-emerald-500 text-emerald-600'
                        }`}
                      >
                        {c.slaStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`text-[10px] ${
                          c.status === 'Resolvido' || c.status === 'Fechado'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : c.status === 'Em Atendimento'
                            ? 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                            : ''
                        }`}
                      >
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" className="h-7 text-xs font-bold gap-1 text-primary">
                        Atender <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

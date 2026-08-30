import React, { useState } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CentroCusto } from '../types';
import { INITIAL_CENTROS } from '../data/initialData';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, Plus, MoreHorizontal, Network, List as ListIcon, FolderTree, ArrowRight, Trash2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovoCentroCustoSheet } from '@/features/centro-de-custos/components/NovoCentroCustoSheet';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function CentroCustosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tabela' | 'arvore'>('arvore');
  const { data: centros, deleteItem } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  // Calcula valores dinâmicos para cada Centro de Custo com base nas transações financeiras
  const centrosComTotais = centros.map(c => {
    let receita = 0;
    let despesa = 0;

    const catName = (c.categoria || c.nome || '').toLowerCase();
    const deptName = (c.departamento || '').toLowerCase();

    contasReceber.forEach(t => {
      const tCat = (t.categoria || '').toLowerCase();
      const isMatch = (t.centroCustoId && t.centroCustoId === c.id) ||
                      (t.centroCustoNome && t.centroCustoNome.toLowerCase() === c.nome.toLowerCase()) ||
                      (t.centroCusto && t.centroCusto.toLowerCase() === c.nome.toLowerCase()) ||
                      tCat.includes(catName) || catName.includes(tCat) || (deptName && tCat.includes(deptName));
      if (isMatch) {
        receita += t.valorOriginal || 0;
      }
    });

    contasPagar.forEach(cp => {
      const cpCat = (cp.categoria || '').toLowerCase();
      const isMatch = (cp.centroCustoId && cp.centroCustoId === c.id) ||
                      (cp.centroCustoNome && cp.centroCustoNome.toLowerCase() === c.nome.toLowerCase()) ||
                      (cp.centroCusto && cp.centroCusto.toLowerCase() === c.nome.toLowerCase()) ||
                      cpCat.includes(catName) || catName.includes(cpCat) || (deptName && cpCat.includes(deptName));
      if (isMatch) {
        despesa += cp.valorOriginal || 0;
      }
    });

    return {
      ...c,
      totalReceitaClassificada: receita,
      totalDespesaClassificada: despesa
    };
  });

  const filteredData = centrosComTotais.filter(c => {
    return (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.codigo || '').toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'Receita') {
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Receita</Badge>;
    }
    return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200">Despesa</Badge>;
  };

  // Renderização da Árvore Hierárquica
  const renderTree = () => {
    const raizes = filteredData.filter(c => !c.centroPaiId);
    
    const renderNode = (node: typeof centrosComTotais[0], level: number = 0) => {
      const filhos = centrosComTotais.filter(c => c.centroPaiId === node.id && c.id !== node.id);
      
      return (
        <React.Fragment key={node.id}>
          <TableRow className="group cursor-pointer hover:bg-muted/50">
            <TableCell>
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                {filhos.length > 0 ? (
                  <FolderTree className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/50 ml-1" />
                )}
                <span className={`font-medium ${level === 0 ? 'text-base' : 'text-sm'}`}>
                  {node.codigo} - {node.nome}
                </span>
              </div>
            </TableCell>
            <TableCell>{getTipoBadge(node.tipo)}</TableCell>
            <TableCell>{node.departamento}</TableCell>
            <TableCell>{node.responsavel}</TableCell>
            <TableCell className="text-right font-medium">
               <span className={node.tipo === 'Receita' ? 'text-emerald-600' : 'text-rose-600'}>
                 {formatCurrency(node.tipo === 'Receita' ? node.totalReceitaClassificada : node.totalDespesaClassificada)}
               </span>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link to="/centro-de-custos/$centroId" params={{ centroId: node.id }}>
                    <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="text-red-600" onClick={() => {
                    deleteItem(node.id);
                    toast.success("Centro de custo removido!");
                  }}>
                    Excluir Centro
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
          {filhos.map(filho => renderNode(filho, level + 1))}
        </React.Fragment>
      );
    };

    return (
      <TableBody>
        {raizes.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
              Nenhum centro encontrado.
            </TableCell>
          </TableRow>
        ) : (
          raizes.map(raiz => renderNode(raiz))
        )}
      </TableBody>
    );
  };

  // Renderização da Tabela Plana
  const renderFlat = () => (
    <TableBody>
      {filteredData.length === 0 ? (
        <TableRow>
          <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
            Nenhum centro encontrado.
          </TableCell>
        </TableRow>
      ) : (
        filteredData.map((node) => (
          <TableRow key={node.id} className="group cursor-pointer hover:bg-muted/50">
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium">{node.codigo} - {node.nome}</span>
                <span className="text-xs text-muted-foreground">{node.categoria}</span>
              </div>
            </TableCell>
            <TableCell>{getTipoBadge(node.tipo)}</TableCell>
            <TableCell>{node.departamento}</TableCell>
            <TableCell>{node.responsavel}</TableCell>
            <TableCell className="text-right font-medium">
               <span className={node.tipo === 'Receita' ? 'text-emerald-600' : 'text-rose-600'}>
                 {formatCurrency(node.tipo === 'Receita' ? node.totalReceitaClassificada : node.totalDespesaClassificada)}
               </span>
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <Link to="/centro-de-custos/$centroId" params={{ centroId: node.id }}>
                    <DropdownMenuItem>Ver Perfil</DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="text-red-600" onClick={() => {
                    deleteItem(node.id);
                    toast.success("Centro de custo removido!");
                  }}>
                    Excluir Centro
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))
      )}
    </TableBody>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por código ou nome..." 
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
          <div className="bg-muted p-1 flex rounded-md">
             <Button 
               variant={viewMode === 'arvore' ? 'secondary' : 'ghost'} 
               size="sm" 
               className="h-8 px-2 text-xs"
               onClick={() => setViewMode('arvore')}
             >
               <Network className="w-4 h-4 mr-1" /> Árvore
             </Button>
             <Button 
               variant={viewMode === 'tabela' ? 'secondary' : 'ghost'} 
               size="sm" 
               className="h-8 px-2 text-xs"
               onClick={() => setViewMode('tabela')}
             >
               <ListIcon className="w-4 h-4 mr-1" /> Lista Plana
             </Button>
          </div>
          <Button variant="outline" size="icon" className="h-10 w-10">
            <Download className="h-4 w-4" />
          </Button>
          <NovoCentroCustoSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Centro
            </Button>
          </NovoCentroCustoSheet>
        </div>
      </div>

      <div className="rounded-md border bg-card overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Centro de Custo</TableHead>
              <TableHead>Natureza</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right">Valor Classificado</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          {viewMode === 'arvore' ? renderTree() : renderFlat()}
        </Table>
      </div>
    </div>
  );
}

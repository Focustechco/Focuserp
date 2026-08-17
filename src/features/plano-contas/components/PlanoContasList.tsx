import React, { useState } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CategoriaFinanceira } from '../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Plus, ChevronRight, ChevronDown, Folder, File, Edit, MoreVertical, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovaCategoriaSheet } from './NovaCategoriaSheet';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function PlanoContasList() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaFinanceira | null>(null);
  const { data: planoContas, deleteItem } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas');

  const openNovaCategoria = () => {
    setCategoriaParaEditar(null);
    setSheetOpen(true);
  };

  const openEditarCategoria = (cat: CategoriaFinanceira) => {
    setCategoriaParaEditar(cat);
    setSheetOpen(true);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todas');
  
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'cat-1': true,
    'cat-2': true,
  });

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredData = planoContas.filter(c => {
    const matchSearch = (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.codigo || '').includes(searchTerm);
    const matchTipo = filterTipo === 'todas' || (c.tipo || '').toLowerCase() === filterTipo.toLowerCase();
    return matchSearch && matchTipo;
  });

  // Função recursiva para montar a árvore
  const renderTree = (parentId?: string, level = 0) => {
    const nodes = filteredData
      .filter(c => c.parentId === parentId)
      .sort((a, b) => (a?.codigo || '').localeCompare(b?.codigo || ''));

    if (nodes.length === 0) return null;

    return nodes.map(node => {
      const isExpanded = expandedNodes[node.id];
      const hasChildren = planoContas.some(c => c.parentId === node.id);
      
      return (
        <React.Fragment key={node.id}>
          <div className="group flex items-center justify-between p-3 border-b hover:bg-muted/50 transition-colors">
            {/* Lado Esquerdo: Identação, Ícone e Nome */}
            <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
              <div 
                className={`w-6 h-6 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground ${hasChildren ? '' : 'invisible'}`}
                onClick={() => toggleNode(node.id)}
              >
                {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </div>
              
              <div className={`p-1.5 rounded-md ${hasChildren ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                {hasChildren ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-semibold text-muted-foreground w-12">{node.codigo}</span>
                <span className={`font-medium ${level === 0 ? 'text-base font-bold' : 'text-sm'}`}>{node.nome}</span>
              </div>
            </div>

            {/* Lado Direito: Metadados */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex w-32 justify-end">
                <Badge variant="outline" className="font-normal text-xs">{node.natureza}</Badge>
              </div>
              
              <div className="w-24 text-right text-xs text-muted-foreground">
                {node.qtdLancamentos || 0} lanç.
              </div>
              
              <div className="w-32 text-right">
                <span className={`font-bold text-sm ${node.tipo === 'Receita' ? 'text-emerald-600 dark:text-emerald-500' : 'text-rose-600 dark:text-rose-500'}`}>
                  {formatCurrency(node.saldoAcumuladoMensal || 0)}
                </span>
              </div>

              <div className="w-10 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditarCategoria(node)}><Edit className="w-4 h-4 mr-2" /> Editar Categoria</DropdownMenuItem>
                    <DropdownMenuItem onClick={openNovaCategoria}><Plus className="w-4 h-4 mr-2" /> Nova Subcategoria</DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600" onClick={() => {
                      deleteItem(node.id);
                      toast.success("Categoria removida com sucesso!");
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir Categoria
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
          
          {/* Filhos - A recursividade mora aqui */}
          {hasChildren && isExpanded && renderTree(node.id, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-4 animate-fade-in pt-4">
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
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Contas</SelectItem>
              <SelectItem value="receita">Receitas (Entradas)</SelectItem>
              <SelectItem value="despesa">Despesas (Saídas)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button onClick={openNovaCategoria}>
            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-md overflow-hidden shadow-sm">
        {/* Cabeçalho da Árvore */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 font-medium text-sm text-muted-foreground">
          <div className="pl-14">Estrutura Contábil / Gerencial</div>
          <div className="flex items-center gap-6 pr-12">
            <div className="hidden md:block w-32 text-right">Natureza</div>
            <div className="w-24 text-right">Lançamentos</div>
            <div className="w-32 text-right">Saldo Acumulado</div>
          </div>
        </div>

        {/* Corpo (Renderização Recursiva) */}
        <div className="flex flex-col">
          {renderTree(undefined, 0)}
          
          {filteredData.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma categoria encontrada no Plano de Contas.
            </div>
          )}
        </div>
      </div>

      <NovaCategoriaSheet 
        isOpen={sheetOpen} 
        onClose={() => setSheetOpen(false)} 
        categoriaParaEditar={categoriaParaEditar} 
      />
    </div>
  );
}

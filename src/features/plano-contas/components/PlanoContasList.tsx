import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CategoriaFinanceira } from '../types';
import { INITIAL_CATEGORIAS } from '../mockData';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Plus, ChevronRight, ChevronDown, Folder, File, Edit, 
  MoreVertical, Trash2, Eye, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovaCategoriaSheet } from './NovaCategoriaSheet';
import { CategoriaLancamentosModal } from './CategoriaLancamentosModal';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function PlanoContasList() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaFinanceira | null>(null);
  const [categoriaLancamentos, setCategoriaLancamentos] = useState<CategoriaFinanceira | null>(null);
  
  const { data: planoContas = [], deleteItem } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todas');
  
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'cat-rec-1': true,
    'cat-desp-2': true,
  });

  const [parentInicialId, setParentInicialId] = useState<string | null>(null);

  const openNovaCategoria = () => {
    setCategoriaParaEditar(null);
    setParentInicialId(null);
    setSheetOpen(true);
  };

  const openNovaSubcategoria = (parentCat: CategoriaFinanceira) => {
    setCategoriaParaEditar(null);
    setParentInicialId(parentCat.id);
    setSheetOpen(true);
  };

  const openEditarCategoria = (cat: CategoriaFinanceira) => {
    setCategoriaParaEditar(cat);
    setParentInicialId(null);
    setSheetOpen(true);
  };

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Cálculo de dados reais agregados por categoria
  const categoriasComTotais = useMemo(() => {
    const directTotals: Record<string, { total: number; count: number; itemsReceber: TituloReceber[]; itemsPagar: ContaPagar[] }> = {};

    planoContas.forEach(cat => {
      const cName = (cat.nome || '').toLowerCase();
      const cId = cat.id;

      if (cat.tipo === 'Receita') {
        const matchingReceber = contasReceber.filter(t => 
          (t.categoriaId && t.categoriaId === cId) ||
          (t.categoria && t.categoria.toLowerCase() === cName) ||
          (t.categoria && cName.includes(t.categoria.toLowerCase()))
        );
        const total = matchingReceber.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
        directTotals[cId] = { total, count: matchingReceber.length, itemsReceber: matchingReceber, itemsPagar: [] };
      } else {
        const matchingPagar = contasPagar.filter(cp => 
          (cp.categoriaId && cp.categoriaId === cId) ||
          (cp.categoria && cp.categoria.toLowerCase() === cName) ||
          (cp.categoria && cName.includes(cp.categoria.toLowerCase()))
        );
        const total = matchingPagar.reduce((acc, cp) => acc + (cp.valorOriginal || 0), 0);
        directTotals[cId] = { total, count: matchingPagar.length, itemsReceber: [], itemsPagar: matchingPagar };
      }
    });

    const getAllDescendantIds = (parentId: string): string[] => {
      const children = planoContas.filter(c => c.parentId === parentId);
      let desc: string[] = children.map(c => c.id);
      children.forEach(ch => {
        desc = [...desc, ...getAllDescendantIds(ch.id)];
      });
      return desc;
    };

    return planoContas.map(cat => {
      const descendantIds = getAllDescendantIds(cat.id);
      const allIds = [cat.id, ...descendantIds];

      let aggregatedTotal = 0;
      let aggregatedCount = 0;
      let allItemsReceber: TituloReceber[] = [];
      let allItemsPagar: ContaPagar[] = [];

      allIds.forEach(id => {
        const dt = directTotals[id];
        if (dt) {
          aggregatedTotal += dt.total;
          aggregatedCount += dt.count;
          allItemsReceber = [...allItemsReceber, ...dt.itemsReceber];
          allItemsPagar = [...allItemsPagar, ...dt.itemsPagar];
        }
      });

      return {
        ...cat,
        saldoAcumuladoMensal: aggregatedTotal,
        qtdLancamentos: aggregatedCount,
        itensReceber: allItemsReceber,
        itensPagar: allItemsPagar
      };
    });
  }, [planoContas, contasReceber, contasPagar]);

  const filteredData = useMemo(() => {
    return categoriasComTotais.filter(c => {
      const matchSearch = (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || (c.codigo || '').includes(searchTerm);
      const matchTipo = filterTipo === 'todas' || (c.tipo || '').toLowerCase() === filterTipo.toLowerCase();
      return matchSearch && matchTipo;
    });
  }, [categoriasComTotais, searchTerm, filterTipo]);

  // Função recursiva para montar a árvore
  const renderTree = (parentId?: string, level = 0) => {
    const nodes = filteredData
      .filter(c => c.parentId === parentId)
      .sort((a, b) => (a?.codigo || '').localeCompare(b?.codigo || ''));

    if (nodes.length === 0) return null;

    return nodes.map(node => {
      const isExpanded = expandedNodes[node.id];
      const hasChildren = planoContas.some(c => c.parentId === node.id);
      const isReceita = node.tipo === 'Receita';
      
      return (
        <React.Fragment key={node.id}>
          <div className="group flex items-center justify-between p-3 border-b hover:bg-muted/40 transition-colors">
            {/* Lado Esquerdo: Identação, Ícone e Nome */}
            <div className="flex items-center gap-2 min-w-0 flex-1" style={{ paddingLeft: `${level * 24}px` }}>
              <div 
                className={`w-6 h-6 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground shrink-0 ${hasChildren ? '' : 'invisible'}`}
                onClick={() => toggleNode(node.id)}
              >
                {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </div>
              
              <div className={`p-1.5 rounded-md shrink-0 ${
                isReceita ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
              }`}>
                {hasChildren ? <Folder className="w-4 h-4" /> : <File className="w-4 h-4" />}
              </div>
              
              <div className="flex items-center gap-2 truncate">
                <span className="font-mono text-xs font-semibold text-muted-foreground w-12 shrink-0">{node.codigo}</span>
                <span className={`font-medium truncate ${level === 0 ? 'text-base font-bold' : 'text-sm'}`}>{node.nome}</span>
              </div>
            </div>

            {/* Lado Direito: Metadados e Ações */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              <div className="hidden md:flex w-28 justify-end">
                <Badge variant="outline" className="font-normal text-xs">{node.natureza}</Badge>
              </div>
              
              <div className="w-24 text-right flex justify-end">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-md"
                  onClick={() => setCategoriaLancamentos(node as any)}
                  title={`Ver ${node.qtdLancamentos || 0} lançamentos`}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="w-32 text-right">
                <span className={`font-bold text-sm flex items-center justify-end gap-1 ${
                  isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {isReceita ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                  {formatCurrency(node.saldoAcumuladoMensal || 0)}
                </span>
              </div>

              <div className="w-10 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="w-4 h-4" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setCategoriaLancamentos(node as any)}>
                      <Eye className="w-4 h-4 mr-2" /> Ver Lançamentos
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openEditarCategoria(node)}>
                      <Edit className="w-4 h-4 mr-2" /> Editar Categoria
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => openNovaSubcategoria(node)}>
                      <Plus className="w-4 h-4 mr-2" /> Nova Subcategoria
                    </DropdownMenuItem>
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
          
          {/* Filhos - A recursividade */}
          {hasChildren && isExpanded && renderTree(node.id, level + 1)}
        </React.Fragment>
      );
    });
  };

  const selectedNodeData = categoriasComTotais.find(c => c.id === categoriaLancamentos?.id);

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
          <Button onClick={openNovaCategoria}>
            <Plus className="w-4 h-4 mr-2" /> Nova Categoria
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-xs">
        {/* Cabeçalho da Árvore */}
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 font-medium text-xs text-muted-foreground uppercase tracking-wider">
          <div className="pl-14">Estrutura Contábil / Gerencial</div>
          <div className="flex items-center gap-4 sm:gap-6 pr-12">
            <div className="hidden md:block w-28 text-right">Natureza</div>
            <div className="w-24 text-right">Lançamentos</div>
            <div className="w-32 text-right">Saldo Acumulado</div>
          </div>
        </div>

        {/* Corpo (Renderização Recursiva) */}
        <div className="flex flex-col">
          {renderTree(undefined, 0)}
          
          {filteredData.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-sm">
              Nenhuma categoria encontrada no Plano de Contas.
            </div>
          )}
        </div>
      </div>

      <NovaCategoriaSheet 
        isOpen={sheetOpen} 
        onClose={() => setSheetOpen(false)} 
        categoriaParaEditar={categoriaParaEditar} 
        parentInicialId={parentInicialId}
      />

      <CategoriaLancamentosModal
        categoria={categoriaLancamentos}
        open={!!categoriaLancamentos}
        onOpenChange={(open) => !open && setCategoriaLancamentos(null)}
        lancamentosReceber={selectedNodeData?.itensReceber || []}
        lancamentosPagar={selectedNodeData?.itensPagar || []}
      />
    </div>
  );
}

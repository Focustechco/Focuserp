import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CategoriaFinanceira } from '../types';
import { INITIAL_CATEGORIAS } from '../mockData';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Network, Search, ChevronDown, ChevronRight, ArrowUpRight, ArrowDownRight, 
  FolderTree, ExternalLink, PlusCircle, Maximize2, Minimize2, Eye
} from 'lucide-react';
import { CategoriaLancamentosModal } from './CategoriaLancamentosModal';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function OrganogramaTree() {
  const { data: planoContas = [] } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState('todas');
  const [collapsedNodes, setCollapsedNodes] = useState<Record<string, boolean>>({});
  const [selectedCategoria, setSelectedCategoria] = useState<CategoriaFinanceira | null>(null);

  // Calcula totais reais agregados para cada categoria (incluindo subcategorias filhas)
  const categoriasComTotais = useMemo(() => {
    // Mapeamento de transações diretas por categoria (por id e por nome)
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

    // Função recursiva para obter todos os descendentes de uma categoria
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

  const toggleCollapse = (id: string) => {
    setCollapsedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => setCollapsedNodes({});
  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    categoriasComTotais.forEach(c => {
      if (categoriasComTotais.some(ch => ch.parentId === c.id)) {
        all[c.id] = true;
      }
    });
    setCollapsedNodes(all);
  };

  // Filtragem
  const filteredCategorias = useMemo(() => {
    return categoriasComTotais.filter(c => {
      const matchSearch = (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (c.codigo || '').includes(searchTerm);
      const matchTipo = filterTipo === 'todas' || (c.tipo || '').toLowerCase() === filterTipo.toLowerCase();
      return matchSearch && matchTipo;
    });
  }, [categoriasComTotais, searchTerm, filterTipo]);

  // Raízes
  const rootCategorias = useMemo(() => {
    return filteredCategorias.filter(c => !c.parentId || !categoriasComTotais.some(parent => parent.id === c.parentId));
  }, [filteredCategorias, categoriasComTotais]);

  // Renderização recursiva de cada nó do organograma
  const renderOrganogramaNode = (node: typeof categoriasComTotais[0], depth = 0) => {
    const children = categoriasComTotais.filter(c => c.parentId === node.id);
    const hasChildren = children.length > 0;
    const isCollapsed = !!collapsedNodes[node.id];
    const isReceita = node.tipo === 'Receita';

    return (
      <div key={node.id} className="flex flex-col items-center">
        {/* Card do Nó */}
        <div 
          className={`relative w-72 rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-all duration-200 group ${
            isReceita 
              ? 'border-emerald-200 dark:border-emerald-900/50 hover:border-emerald-400' 
              : 'border-rose-200 dark:border-rose-900/50 hover:border-rose-400'
          }`}
        >
          {/* Header do Nó */}
          <div className="flex items-center justify-between gap-2 mb-2">
            <Badge 
              variant="secondary" 
              className={`font-mono text-xs px-2 py-0.5 font-bold ${
                isReceita 
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' 
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
              }`}
            >
              {node.codigo}
            </Badge>

            <Badge variant="outline" className="text-[10px] uppercase font-semibold">
              {node.natureza}
            </Badge>
          </div>

          {/* Nome da Categoria */}
          <div className="mb-3">
            <h4 className="font-bold text-sm text-foreground leading-tight line-clamp-1" title={node.nome}>
              {node.nome}
            </h4>
            {node.descricao && (
              <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                {node.descricao}
              </p>
            )}
          </div>

          {/* Dados Financeiros Reais */}
          <div className="pt-2 border-t flex items-center justify-between bg-muted/20 -mx-4 -mb-4 p-3 rounded-b-2xl">
            <div>
              <span className="text-[10px] text-muted-foreground block font-medium">Saldo Acumulado Real</span>
              <span className={`text-sm font-bold flex items-center gap-1 ${
                isReceita ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}>
                {isReceita ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                {formatCurrency(node.saldoAcumuladoMensal)}
              </span>
            </div>

            <Button 
              size="sm" 
              variant="outline" 
              className="h-7 text-xs px-2 gap-1 rounded-lg hover:bg-primary hover:text-primary-foreground"
              onClick={() => setSelectedCategoria(node as any)}
            >
              <Eye className="w-3 h-3" />
              <span>{node.qtdLancamentos} lanç.</span>
            </Button>
          </div>

          {/* Botão de Expandir / Recolher Filhos */}
          {hasChildren && (
            <button
              onClick={() => toggleCollapse(node.id)}
              className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full border bg-background shadow-xs flex items-center justify-center text-muted-foreground hover:text-foreground hover:scale-110 transition-transform ${
                isReceita ? 'hover:border-emerald-500' : 'hover:border-rose-500'
              }`}
              title={isCollapsed ? "Expandir subcategorias" : "Recolher subcategorias"}
            >
              {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* Linhas Conectoras e Filhos */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col items-center mt-6 w-full">
            {/* Linha Vertical Superior */}
            <div className="w-0.5 h-5 bg-border -mt-6"></div>

            {/* Linha Horizontal e Sub-ramos */}
            <div className="relative flex justify-center gap-6 pt-5">
              {children.length > 1 && (
                <div 
                  className="absolute top-0 h-0.5 bg-border"
                  style={{
                    left: `calc(${100 / (children.length * 2)}%)`,
                    right: `calc(${100 / (children.length * 2)}%)`,
                  }}
                />
              )}

              {children.map(child => (
                <div key={child.id} className="relative flex flex-col items-center">
                  {/* Linha Vertical Conectando o Ramo ao Filho */}
                  <div className="absolute -top-5 w-0.5 h-5 bg-border" />
                  {renderOrganogramaNode(child, depth + 1)}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const selectedNodeData = categoriasComTotais.find(c => c.id === selectedCategoria?.id);

  return (
    <div className="space-y-6 pt-2 animate-fade-in">
      {/* Barra de Filtros e Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-xl border">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisar por conta ou código..." 
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
              <SelectItem value="todas">Todos os Ramos</SelectItem>
              <SelectItem value="receita">Receitas Operacionais</SelectItem>
              <SelectItem value="despesa">Despesas Operacionais</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={expandAll} className="gap-1 text-xs">
            <Maximize2 className="w-3.5 h-3.5" /> Expandir Todos
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll} className="gap-1 text-xs">
            <Minimize2 className="w-3.5 h-3.5" /> Recolher Ramos
          </Button>
        </div>
      </div>

      {/* Área do Organograma Visual */}
      <div className="w-full overflow-x-auto p-8 bg-muted/10 border rounded-2xl border-dashed min-h-[500px] flex justify-center items-start">
        {rootCategorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground">
            <FolderTree className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">Nenhuma categoria encontrada com os filtros selecionados.</p>
          </div>
        ) : (
          <div className="flex flex-wrap md:flex-nowrap justify-center gap-12 w-max min-w-full pb-10">
            {rootCategorias.map(root => renderOrganogramaNode(root, 0))}
          </div>
        )}
      </div>

      {/* Modal de Transações Reais da Categoria */}
      <CategoriaLancamentosModal
        categoria={selectedCategoria}
        open={!!selectedCategoria}
        onOpenChange={(open) => !open && setSelectedCategoria(null)}
        lancamentosReceber={selectedNodeData?.itensReceber || []}
        lancamentosPagar={selectedNodeData?.itensPagar || []}
      />
    </div>
  );
}

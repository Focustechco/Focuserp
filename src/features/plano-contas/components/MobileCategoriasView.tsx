import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CategoriaFinanceira, CategoriaTipo, CategoriaNatureza, CategoriaStatus } from '../types';
import { INITIAL_CATEGORIAS } from '../mockData';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, ChevronRight, ChevronDown, Folder, File, Edit,
  MoreVertical, Trash2, Eye, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Layers, RefreshCw, FolderTree, Tag, Building2, Check
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovaCategoriaSheet } from './NovaCategoriaSheet';
import { CategoriaLancamentosModal } from './CategoriaLancamentosModal';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileCategoriasView() {
  const { data: planoContas = [], deleteItem } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todas' | 'receitas' | 'despesas' | 'operacional' | 'administrativa' | 'ativas'>('todas');
  const [tipoFilter, setTipoFilter] = useState<string>('todas');
  const [naturezaFilter, setNaturezaFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todas');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais e Sheets
  const [sheetOpen, setSheetOpen] = useState(false);
  const [categoriaParaEditar, setCategoriaParaEditar] = useState<CategoriaFinanceira | null>(null);
  const [categoriaLancamentos, setCategoriaLancamentos] = useState<CategoriaFinanceira | null>(null);
  const [parentInicialId, setParentInicialId] = useState<string | null>(null);

  // Expansão de nós da árvore
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'cat-rec-1': true,
    'cat-desp-2': true,
  });

  const toggleNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const openNovaCategoria = () => {
    setCategoriaParaEditar(null);
    setParentInicialId(null);
    setSheetOpen(true);
  };

  const openNovaSubcategoria = (parentCat: CategoriaFinanceira, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCategoriaParaEditar(null);
    setParentInicialId(parentCat.id);
    setSheetOpen(true);
  };

  const openEditarCategoria = (cat: CategoriaFinanceira, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCategoriaParaEditar(cat);
    setParentInicialId(null);
    setSheetOpen(true);
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

  // Estatísticas agregadas de topo
  const stats = useMemo(() => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    let countReceitas = 0;
    let countDespesas = 0;

    // Apenas raízes para não duplicar somatórios nas métricas do topo
    const raizes = categoriasComTotais.filter(c => !c.parentId);

    raizes.forEach(c => {
      if (c.tipo === 'Receita') {
        totalReceitas += c.saldoAcumuladoMensal || 0;
      } else {
        totalDespesas += c.saldoAcumuladoMensal || 0;
      }
    });

    categoriasComTotais.forEach(c => {
      if (c.tipo === 'Receita') countReceitas++;
      else countDespesas++;
    });

    const totalCategorias = categoriasComTotais.length;
    const resultado = totalReceitas - totalDespesas;

    return { totalCategorias, totalReceitas, totalDespesas, resultado, countReceitas, countDespesas };
  }, [categoriasComTotais]);

  const filteredData = useMemo(() => {
    return categoriasComTotais.filter((c) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (c.nome || '').toLowerCase().includes(search) ||
        (c.codigo || '').toLowerCase().includes(search) ||
        (c.natureza || '').toLowerCase().includes(search) ||
        (c.setor || '').toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Abas rápidas
      if (activeTab === 'receitas' && c.tipo !== 'Receita') return false;
      if (activeTab === 'despesas' && c.tipo !== 'Despesa') return false;
      if (activeTab === 'operacional' && c.natureza !== 'Operacional') return false;
      if (activeTab === 'administrativa' && c.natureza !== 'Administrativa') return false;
      if (activeTab === 'ativas' && c.status === 'Inativa') return false;

      // Filtros do Sheet
      if (tipoFilter !== 'todas' && c.tipo !== tipoFilter) return false;
      if (naturezaFilter !== 'todas' && c.natureza !== naturezaFilter) return false;
      if (statusFilter !== 'todas' && c.status !== statusFilter) return false;

      return true;
    });
  }, [categoriasComTotais, searchTerm, activeTab, tipoFilter, naturezaFilter, statusFilter]);

  const naturezasDisponiveis: CategoriaNatureza[] = [
    'Operacional', 'Administrativa', 'Comercial', 'Financeira', 
    'Tributária', 'Investimento', 'Patrimônio', 'Extraordinária'
  ];

  const selectedNodeData = categoriasComTotais.find(c => c.id === categoriaLancamentos?.id);

  // Renderização recursiva de Cards Mobile
  const renderCategoryCards = (parentId?: string, level = 0) => {
    const nodes = filteredData
      .filter(c => {
        if (searchTerm || tipoFilter !== 'todas' || naturezaFilter !== 'todas' || statusFilter !== 'todas') {
          // Se houver busca ou filtros ativos, exibe na lista direta
          return true;
        }
        return c.parentId === parentId;
      })
      .sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));

    // Se estiver em modo busca/filtro plano, renderiza lista plana sem recursão
    if (searchTerm || tipoFilter !== 'todas' || naturezaFilter !== 'todas' || statusFilter !== 'todas') {
      if (nodes.length === 0) {
        return (
          <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
            <FolderTree className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-sm text-foreground">Nenhuma categoria encontrada</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
              Tente alterar os termos da busca ou os filtros aplicados.
            </p>
          </div>
        );
      }

      return (
        <div className="space-y-3">
          {nodes.map(node => renderSingleCard(node, 0, false))}
        </div>
      );
    }

    if (nodes.length === 0 && level === 0) {
      return (
        <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
          <FolderTree className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <p className="font-semibold text-sm text-foreground">Nenhuma categoria cadastrada</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
            Comece adicionando uma categoria de receita ou despesa.
          </p>
          <Button onClick={openNovaCategoria} size="sm" className="mt-4 bg-primary text-primary-foreground font-semibold">
            <Plus className="w-4 h-4 mr-1.5" /> Adicionar Categoria
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {nodes.map(node => {
          const isExpanded = expandedNodes[node.id];
          const children = planoContas.filter(c => c.parentId === node.id);
          const hasChildren = children.length > 0;

          return (
            <div key={node.id} className="space-y-2">
              {renderSingleCard(node, level, hasChildren, isExpanded)}
              {hasChildren && isExpanded && (
                <div className="pl-3 border-l-2 border-primary/20 space-y-2">
                  {renderCategoryCards(node.id, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSingleCard = (node: typeof categoriasComTotais[0], level: number, hasChildren: boolean, isExpanded?: boolean) => {
    const isReceita = node.tipo === 'Receita';
    const isRoot = !node.parentId;

    return (
      <div
        key={node.id}
        onClick={() => setCategoriaLancamentos(node as any)}
        className={`relative overflow-hidden bg-card border rounded-xl p-3.5 transition-all active:scale-[0.99] shadow-2xs ${
          isReceita 
            ? 'border-emerald-500/20 hover:border-emerald-500/40' 
            : 'border-rose-500/20 hover:border-rose-500/40'
        }`}
      >
        {/* Barra lateral de tipo */}
        <div 
          className={`absolute left-0 top-0 bottom-0 w-1.5 ${
            isReceita ? 'bg-emerald-500' : 'bg-rose-500'
          }`} 
        />

        <div className="flex items-start justify-between gap-2 pl-1">
          <div className="flex-1 min-w-0">
            {/* Header com código, tipo e status */}
            <div className="flex items-center gap-1.5 flex-wrap mb-1">
              <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded">
                {node.codigo}
              </span>

              <Badge
                variant="outline"
                className={`text-[10px] font-semibold px-2 py-0.5 ${
                  isReceita
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200'
                }`}
              >
                {isReceita ? (
                  <TrendingUp className="w-2.5 h-2.5 mr-1" />
                ) : (
                  <TrendingDown className="w-2.5 h-2.5 mr-1" />
                )}
                {node.tipo}
              </Badge>

              <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/70 py-0.5">
                {node.natureza}
              </Badge>

              {node.status === 'Inativa' && (
                <Badge variant="secondary" className="text-[10px] text-rose-600 bg-rose-50 border-rose-200">
                  Inativa
                </Badge>
              )}
            </div>

            {/* Nome da categoria */}
            <h4 className={`font-semibold text-foreground truncate ${isRoot ? 'text-sm' : 'text-xs'}`}>
              {node.nome}
            </h4>

            {node.descricao && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                {node.descricao}
              </p>
            )}
          </div>

          {/* Menu de ações rápidas */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium text-primary hover:bg-primary/10 gap-1 rounded-lg"
                onClick={(e) => toggleNode(node.id, e)}
              >
                {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </Button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="text-xs">
                <DropdownMenuItem onClick={() => setCategoriaLancamentos(node as any)} className="gap-2 cursor-pointer">
                  <Eye className="w-3.5 h-3.5 text-primary" /> Ver Lançamentos
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => openNovaSubcategoria(node, e as any)} className="gap-2 cursor-pointer">
                  <Plus className="w-3.5 h-3.5 text-emerald-600" /> Nova Subcategoria
                </DropdownMenuItem>
                <DropdownMenuItem onClick={(e) => openEditarCategoria(node, e as any)} className="gap-2 cursor-pointer">
                  <Edit className="w-3.5 h-3.5 text-blue-600" /> Editar Categoria
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-rose-600 focus:text-rose-600 gap-2 cursor-pointer"
                  onClick={() => {
                    deleteItem(node.id);
                    toast.success("Categoria removida com sucesso!");
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Categoria
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Rodapé do card: Saldo e Quantidade de Lançamentos */}
        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs pl-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Layers className="w-3.5 h-3.5 text-primary" />
            <span>{node.qtdLancamentos || 0} {node.qtdLancamentos === 1 ? 'lançamento' : 'lançamentos'}</span>
          </div>

          <div className="flex items-center gap-1">
            {isReceita ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span className={`font-bold ${
              (node.saldoAcumuladoMensal || 0) === 0 
                ? 'text-muted-foreground' 
                : isReceita 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(node.saldoAcumuladoMensal || 0)}
            </span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Plano de Contas</h1>
            <p className="text-[11px] text-muted-foreground">Categorias e estrutura financeira</p>
          </div>
          <Button
            onClick={openNovaCategoria}
            size="sm"
            className="h-9 px-3 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Nova Categoria
          </Button>
        </div>

        {/* Barra de Busca + Filtro Sheet */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar categoria ou código..."
              className="pl-9 h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus:bg-background"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-9 w-9 rounded-xl shrink-0 ${
                  tipoFilter !== 'todas' || naturezaFilter !== 'todas' || statusFilter !== 'todas'
                    ? 'border-primary text-primary bg-primary/5'
                    : 'border-muted-foreground/20'
                }`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 py-6">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-base font-bold">Filtrar Categorias</SheetTitle>
                <SheetDescription className="text-xs">
                  Refine por tipo de fluxo, natureza contábil e status
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-2">Tipo de Fluxo</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['todas', 'Receita', 'Despesa', 'Transferência'].map((tp) => (
                      <Button
                        key={tp}
                        type="button"
                        variant={tipoFilter === tp ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs h-9 rounded-lg"
                        onClick={() => setTipoFilter(tp)}
                      >
                        {tp === 'todas' ? 'Todos os Tipos' : tp}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-2">Natureza Contábil</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={naturezaFilter === 'todas' ? 'default' : 'outline'}
                      size="sm"
                      className="justify-start text-xs h-9 rounded-lg"
                      onClick={() => setNaturezaFilter('todas')}
                    >
                      Todas as Naturezas
                    </Button>
                    {naturezasDisponiveis.map((nat) => (
                      <Button
                        key={nat}
                        type="button"
                        variant={naturezaFilter === nat ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs h-9 rounded-lg"
                        onClick={() => setNaturezaFilter(nat)}
                      >
                        {nat}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-2">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['todas', 'Ativa', 'Inativa'].map((st) => (
                      <Button
                        key={st}
                        type="button"
                        variant={statusFilter === st ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-9 rounded-lg"
                        onClick={() => setStatusFilter(st)}
                      >
                        {st === 'todas' ? 'Todos' : st}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="flex-1 text-xs h-10 rounded-xl"
                  onClick={() => {
                    setTipoFilter('todas');
                    setNaturezaFilter('todas');
                    setStatusFilter('todas');
                    setFilterSheetOpen(false);
                  }}
                >
                  Limpar Filtros
                </Button>
                <Button
                  className="flex-1 text-xs h-10 rounded-xl font-semibold"
                  onClick={() => setFilterSheetOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Pílulas de Abas Rápidas */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
          <button
            onClick={() => setActiveTab('todas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'todas'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Todas ({stats.totalCategorias})
          </button>
          <button
            onClick={() => setActiveTab('receitas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'receitas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <TrendingUp className="w-3 h-3" /> Receitas ({stats.countReceitas})
          </button>
          <button
            onClick={() => setActiveTab('despesas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'despesas'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <TrendingDown className="w-3 h-3" /> Despesas ({stats.countDespesas})
          </button>
          <button
            onClick={() => setActiveTab('operacional')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'operacional'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Operacionais
          </button>
          <button
            onClick={() => setActiveTab('administrativa')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'administrativa'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Administrativas
          </button>
          <button
            onClick={() => setActiveTab('ativas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'ativas'
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Ativas
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cards de Métricas em Carrossel Horizontal */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          {/* Card Receitas */}
          <div className="min-w-[145px] flex-1 bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 mb-1">
              <span className="text-[11px] font-semibold">Total Receitas</span>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 truncate">
              {formatCurrency(stats.totalReceitas)}
            </p>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5 font-medium">
              {stats.countReceitas} contas cadastradas
            </span>
          </div>

          {/* Card Despesas */}
          <div className="min-w-[145px] flex-1 bg-gradient-to-br from-rose-50 to-rose-100/40 dark:from-rose-950/40 dark:to-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 mb-1">
              <span className="text-[11px] font-semibold">Total Despesas</span>
              <TrendingDown className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-rose-700 dark:text-rose-300 truncate">
              {formatCurrency(stats.totalDespesas)}
            </p>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block mt-0.5 font-medium">
              {stats.countDespesas} contas cadastradas
            </span>
          </div>

          {/* Card Resultado Operacional */}
          <div className="min-w-[145px] flex-1 bg-gradient-to-br from-blue-50 to-indigo-100/40 dark:from-blue-950/40 dark:to-indigo-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 mb-1">
              <span className="text-[11px] font-semibold">Resultado Liq.</span>
              <FolderTree className="w-3.5 h-3.5" />
            </div>
            <p className={`text-base font-bold truncate ${
              stats.resultado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(stats.resultado)}
            </p>
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
              Total {stats.totalCategorias} categorias
            </span>
          </div>
        </div>

        {/* Lista de Cards da Árvore / Categorias */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {searchTerm || tipoFilter !== 'todas' || naturezaFilter !== 'todas' || statusFilter !== 'todas'
                ? `Resultados (${filteredData.length})`
                : 'Estrutura do Plano de Contas'}
            </span>
          </div>

          {renderCategoryCards()}
        </div>
      </div>

      {/* Sheets e Modais */}
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

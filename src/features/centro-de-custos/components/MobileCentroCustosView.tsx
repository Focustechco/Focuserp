import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CentroCusto, TipoCentroCusto, StatusCentroCusto } from '../types';
import { INITIAL_CENTROS } from '../data/initialData';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, ChevronRight, ChevronDown, FolderTree, Building2,
  MoreVertical, Trash2, Eye, ExternalLink, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Layers, User, Briefcase, Check, X
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovoCentroCustoSheet } from '@/features/centro-de-custos/components/NovoCentroCustoSheet';
import { CentroCustoLancamentosModal } from './CentroCustoLancamentosModal';
import { isItemMatchingCentroStrict } from '../utils';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileCentroCustosView() {
  const { data: centros = [], deleteItem } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'receitas' | 'despesas' | 'ativos'>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [departamentoFilter, setDepartamentoFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [selectedCentroLancamentos, setSelectedCentroLancamentos] = useState<CentroCusto | null>(null);

  // Expansão de nós
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    'cc-1': true,
    'cc-2': true,
  });

  const toggleNode = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Calcula totais reais estritos por centro de custo com agregação em árvore
  const centrosComTotais = useMemo(() => {
    // 1. Identificar transações diretas e estritas de cada centro
    const directTotals: Record<string, { receita: number; despesa: number; itemsReceber: TituloReceber[]; itemsPagar: ContaPagar[] }> = {};

    centros.forEach(c => {
      const matchReceber = contasReceber.filter(t => isItemMatchingCentroStrict(t, c));
      const matchPagar = contasPagar.filter(cp => isItemMatchingCentroStrict(cp, c));

      const rec = matchReceber.reduce((acc, t) => acc + (t.valorLiquido || t.valorOriginal || 0), 0);
      const desp = matchPagar.reduce((acc, cp) => acc + (cp.valorFinal || cp.valorOriginal || 0), 0);

      directTotals[c.id] = {
        receita: rec,
        despesa: desp,
        itemsReceber: matchReceber,
        itemsPagar: matchPagar
      };
    });

    // 2. Função para obter todos os filhos descendentes na hierarquia
    const getAllDescendantIds = (parentId: string): string[] => {
      const children = centros.filter(c => c.centroPaiId === parentId && c.id !== parentId);
      let desc: string[] = children.map(c => c.id);
      children.forEach(ch => {
        desc = [...desc, ...getAllDescendantIds(ch.id)];
      });
      return desc;
    };

    // 3. Consolidar totais acumulados específicos
    return centros.map(c => {
      const descendantIds = getAllDescendantIds(c.id);
      const allIds = [c.id, ...descendantIds];

      let aggregatedReceita = 0;
      let aggregatedDespesa = 0;
      let allItemsReceber: TituloReceber[] = [];
      let allItemsPagar: ContaPagar[] = [];

      allIds.forEach(id => {
        const dt = directTotals[id];
        if (dt) {
          aggregatedReceita += dt.receita;
          aggregatedDespesa += dt.despesa;
          allItemsReceber = [...allItemsReceber, ...dt.itemsReceber];
          allItemsPagar = [...allItemsPagar, ...dt.itemsPagar];
        }
      });

      // Remove duplicidades de itens agregados
      const uniqueReceber = Array.from(new Map(allItemsReceber.map(item => [item.id, item])).values());
      const uniquePagar = Array.from(new Map(allItemsPagar.map(item => [item.id, item])).values());

      const isReceita = c.tipo === 'Receita';
      const valorClassificado = isReceita ? aggregatedReceita : aggregatedDespesa;
      const countLancamentos = isReceita ? uniqueReceber.length : uniquePagar.length;

      return {
        ...c,
        totalReceitaClassificada: aggregatedReceita,
        totalDespesaClassificada: aggregatedDespesa,
        valorClassificadoReal: valorClassificado,
        quantidadeLancamentos: countLancamentos,
        itensReceber: uniqueReceber,
        itensPagar: uniquePagar
      };
    });
  }, [centros, contasReceber, contasPagar]);

  // Departamentos distintos para filtro
  const departamentosDisponiveis = useMemo(() => {
    const deps = new Set<string>();
    centros.forEach(c => {
      if (c.departamento) deps.add(c.departamento);
    });
    return Array.from(deps);
  }, [centros]);

  // Estatísticas agregadas de topo
  const stats = useMemo(() => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    let countReceitas = 0;
    let countDespesas = 0;

    // Apenas raízes para não duplicar somatórios nas métricas do topo
    const raizes = centrosComTotais.filter(c => !c.centroPaiId);

    raizes.forEach(c => {
      if (c.tipo === 'Receita') {
        totalReceitas += c.totalReceitaClassificada || 0;
      } else {
        totalDespesas += c.totalDespesaClassificada || 0;
      }
    });

    centrosComTotais.forEach(c => {
      if (c.tipo === 'Receita') countReceitas++;
      else countDespesas++;
    });

    const totalCentros = centrosComTotais.length;
    const resultado = totalReceitas - totalDespesas;

    return { totalCentros, totalReceitas, totalDespesas, resultado, countReceitas, countDespesas };
  }, [centrosComTotais]);

  const filteredData = useMemo(() => {
    return centrosComTotais.filter((c) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (c.nome || '').toLowerCase().includes(search) ||
        (c.codigo || '').toLowerCase().includes(search) ||
        (c.departamento || '').toLowerCase().includes(search) ||
        (c.responsavel || '').toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Abas rápidas
      if (activeTab === 'receitas' && c.tipo !== 'Receita') return false;
      if (activeTab === 'despesas' && c.tipo !== 'Despesa') return false;
      if (activeTab === 'ativos' && c.status === 'Inativo') return false;

      // Filtros do Sheet
      if (tipoFilter !== 'todos' && c.tipo !== tipoFilter) return false;
      if (departamentoFilter !== 'todos' && c.departamento !== departamentoFilter) return false;
      if (statusFilter !== 'todos' && c.status !== statusFilter) return false;

      return true;
    });
  }, [centrosComTotais, searchTerm, activeTab, tipoFilter, departamentoFilter, statusFilter]);

  const selectedNodeData = centrosComTotais.find(c => c.id === selectedCentroLancamentos?.id);

  // Renderização de Cards Mobile
  const renderCentroCards = (parentId?: string, level = 0) => {
    const nodes = filteredData
      .filter(c => {
        if (searchTerm || tipoFilter !== 'todos' || departamentoFilter !== 'todos' || statusFilter !== 'todos') {
          return true;
        }
        return c.centroPaiId === parentId;
      })
      .sort((a, b) => (a.codigo || '').localeCompare(b.codigo || ''));

    if (searchTerm || tipoFilter !== 'todos' || departamentoFilter !== 'todos' || statusFilter !== 'todos') {
      if (nodes.length === 0) {
        return (
          <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
            <FolderTree className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="font-semibold text-sm text-foreground">Nenhum centro de custo encontrado</p>
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
          <p className="font-semibold text-sm text-foreground">Nenhum centro de custo cadastrado</p>
          <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
            Organize despesas e receitas por departamentos e centros de resultado.
          </p>
          <NovoCentroCustoSheet>
            <Button size="sm" className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              <Plus className="w-4 h-4 mr-1.5" /> Adicionar Centro de Custo
            </Button>
          </NovoCentroCustoSheet>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {nodes.map(node => {
          const isExpanded = expandedNodes[node.id];
          const children = centros.filter(c => c.centroPaiId === node.id && c.id !== node.id);
          const hasChildren = children.length > 0;

          return (
            <div key={node.id} className="space-y-2">
              {renderSingleCard(node, level, hasChildren, isExpanded)}
              {hasChildren && isExpanded && (
                <div className="pl-3 border-l-2 border-orange-500/20 space-y-2">
                  {renderCentroCards(node.id, level + 1)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSingleCard = (node: typeof centrosComTotais[0], level: number, hasChildren: boolean, isExpanded?: boolean) => {
    const isReceita = node.tipo === 'Receita';
    const isRoot = !node.centroPaiId;

    return (
      <div
        key={node.id}
        onClick={() => setSelectedCentroLancamentos(node as any)}
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
            {/* Header com código, tipo e departamento */}
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

              {node.departamento && (
                <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/70 py-0.5 flex items-center gap-1">
                  <Building2 className="w-2.5 h-2.5" />
                  {node.departamento}
                </Badge>
              )}

              {node.status === 'Inativo' && (
                <Badge variant="secondary" className="text-[10px] text-rose-600 bg-rose-50 border-rose-200">
                  Inativo
                </Badge>
              )}
            </div>

            {/* Nome do Centro */}
            <h4 className={`font-semibold text-foreground truncate ${isRoot ? 'text-sm' : 'text-xs'}`}>
              {node.nome}
            </h4>

            {node.responsavel && (
              <p className="text-[11px] text-muted-foreground truncate mt-0.5 flex items-center gap-1">
                <User className="w-3 h-3 text-muted-foreground/70" />
                Resp: {node.responsavel}
              </p>
            )}
          </div>

          {/* Ações rápidas */}
          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs font-medium text-orange-600 hover:bg-orange-500/10 gap-1 rounded-lg"
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
                <DropdownMenuItem onClick={() => setSelectedCentroLancamentos(node as any)} className="gap-2 cursor-pointer">
                  <Eye className="w-3.5 h-3.5 text-orange-600" /> Ver Lançamentos Específicos
                </DropdownMenuItem>
                <Link to={`/centro-de-custos/$centroId`} params={{ centroId: node.id }}>
                  <DropdownMenuItem className="gap-2 cursor-pointer">
                    <ExternalLink className="w-3.5 h-3.5 text-blue-600" /> Ver Perfil Completo
                  </DropdownMenuItem>
                </Link>
                <DropdownMenuItem 
                  className="text-rose-600 focus:text-rose-600 gap-2 cursor-pointer"
                  onClick={() => {
                    deleteItem(node.id);
                    toast.success("Centro de custo removido com sucesso!");
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" /> Excluir Centro
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Rodapé do card */}
        <div className="mt-3 pt-2.5 border-t border-border/50 flex items-center justify-between text-xs pl-1">
          <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
            <Layers className="w-3.5 h-3.5 text-orange-600" />
            <span>{node.quantidadeLancamentos} {node.quantidadeLancamentos === 1 ? 'lançamento' : 'lançamentos'}</span>
          </div>

          <div className="flex items-center gap-1">
            {isReceita ? (
              <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            )}
            <span className={`font-bold ${
              node.valorClassificadoReal === 0 
                ? 'text-muted-foreground' 
                : isReceita 
                ? 'text-emerald-600 dark:text-emerald-400' 
                : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(node.valorClassificadoReal)}
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
            <h1 className="text-xl font-bold tracking-tight text-foreground">Centro de Custos</h1>
            <p className="text-[11px] text-muted-foreground">Classificação financeira e departamentos</p>
          </div>
          <NovoCentroCustoSheet>
            <Button
              size="sm"
              className="h-9 px-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" /> Novo Centro
            </Button>
          </NovoCentroCustoSheet>
        </div>

        {/* Barra de Busca + Filtro Sheet */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nome, departamento..."
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
                  tipoFilter !== 'todos' || departamentoFilter !== 'todos' || statusFilter !== 'todos'
                    ? 'border-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-950/40'
                    : 'border-muted-foreground/20'
                }`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 py-6">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-base font-bold">Filtrar Centros de Custo</SheetTitle>
                <SheetDescription className="text-xs">
                  Refine por tipo de fluxo, departamento e status
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-2">Tipo de Fluxo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['todos', 'Receita', 'Despesa'].map((tp) => (
                      <Button
                        key={tp}
                        type="button"
                        variant={tipoFilter === tp ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-9 rounded-lg"
                        onClick={() => setTipoFilter(tp)}
                      >
                        {tp === 'todos' ? 'Todos' : tp}
                      </Button>
                    ))}
                  </div>
                </div>

                {departamentosDisponiveis.length > 0 && (
                  <div>
                    <label className="font-semibold text-foreground block mb-2">Departamento</label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        type="button"
                        variant={departamentoFilter === 'todos' ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs h-9 rounded-lg"
                        onClick={() => setDepartamentoFilter('todos')}
                      >
                        Todos Departamentos
                      </Button>
                      {departamentosDisponiveis.map((dep) => (
                        <Button
                          key={dep}
                          type="button"
                          variant={departamentoFilter === dep ? 'default' : 'outline'}
                          size="sm"
                          className="justify-start text-xs h-9 rounded-lg truncate"
                          onClick={() => setDepartamentoFilter(dep)}
                        >
                          {dep}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-semibold text-foreground block mb-2">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['todos', 'Ativo', 'Inativo'].map((st) => (
                      <Button
                        key={st}
                        type="button"
                        variant={statusFilter === st ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-9 rounded-lg"
                        onClick={() => setStatusFilter(st)}
                      >
                        {st === 'todos' ? 'Todos' : st}
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
                    setTipoFilter('todos');
                    setDepartamentoFilter('todos');
                    setStatusFilter('todos');
                    setFilterSheetOpen(false);
                  }}
                >
                  Limpar Filtros
                </Button>
                <Button
                  className="flex-1 text-xs h-10 rounded-xl font-semibold bg-orange-600 hover:bg-orange-700 text-white"
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
            onClick={() => setActiveTab('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'todos'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Todos ({stats.totalCentros})
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
            onClick={() => setActiveTab('ativos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'ativos'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Ativos
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
              {stats.countReceitas} centros de receita
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
              {stats.countDespesas} centros de despesa
            </span>
          </div>

          {/* Card Resultado Geral */}
          <div className="min-w-[145px] flex-1 bg-gradient-to-br from-amber-50 to-orange-100/40 dark:from-amber-950/40 dark:to-orange-900/20 border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-orange-700 dark:text-orange-300 mb-1">
              <span className="text-[11px] font-semibold">Resultado</span>
              <FolderTree className="w-3.5 h-3.5" />
            </div>
            <p className={`text-base font-bold truncate ${
              stats.resultado >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatCurrency(stats.resultado)}
            </p>
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
              {stats.totalCentros} centros ativos
            </span>
          </div>
        </div>

        {/* Lista de Centros de Custo */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {searchTerm || tipoFilter !== 'todos' || departamentoFilter !== 'todos' || statusFilter !== 'todos'
                ? `Resultados (${filteredData.length})`
                : 'Estrutura de Centros de Custo'}
            </span>
          </div>

          {renderCentroCards()}
        </div>
      </div>

      {/* Modal com as despesas e receitas reais deste Centro de Custo */}
      <CentroCustoLancamentosModal
        centro={selectedCentroLancamentos}
        open={!!selectedCentroLancamentos}
        onOpenChange={(open) => !open && setSelectedCentroLancamentos(null)}
        lancamentosReceber={selectedNodeData?.itensReceber || []}
        lancamentosPagar={selectedNodeData?.itensPagar || []}
      />
    </div>
  );
}

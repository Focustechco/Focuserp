import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CentroCusto } from '../types';
import { INITIAL_CENTROS } from '../data/initialData';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, Filter, Download, Plus, MoreHorizontal, Network, List as ListIcon, 
  FolderTree, ArrowRight, Trash2, Eye, ExternalLink, ArrowUpRight, ArrowDownRight,
  TrendingUp, TrendingDown, Layers, X
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovoCentroCustoSheet } from '@/features/centro-de-custos/components/NovoCentroCustoSheet';
import { CentroCustoLancamentosModal } from './CentroCustoLancamentosModal';
import { isItemMatchingCentroStrict } from '../utils';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function CentroCustosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'arvore' | 'tabela'>('arvore');
  const [selectedCentroLancamentos, setSelectedCentroLancamentos] = useState<CentroCusto | null>(null);

  const { data: centros, deleteItem } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

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

  const filteredData = useMemo(() => {
    return centrosComTotais.filter(c => {
      return (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (c.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
             (c.departamento || '').toLowerCase().includes(searchTerm.toLowerCase());
    });
  }, [centrosComTotais, searchTerm]);

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'Receita') {
      return (
        <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 gap-1 font-semibold text-[11px]">
          <TrendingUp className="w-3 h-3" /> Receita
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 gap-1 font-semibold text-[11px]">
        <TrendingDown className="w-3 h-3" /> Despesa
      </Badge>
    );
  };

  // Renderização da Árvore Hierárquica
  const renderTree = () => {
    const raizes = filteredData.filter(c => !c.centroPaiId);
    
    const renderNode = (node: typeof centrosComTotais[0], level: number = 0) => {
      const filhos = centrosComTotais.filter(c => c.centroPaiId === node.id && c.id !== node.id);
      const isReceita = node.tipo === 'Receita';
      const valorClassificado = node.valorClassificadoReal;

      return (
        <React.Fragment key={node.id}>
          <TableRow 
            className="group cursor-pointer hover:bg-muted/40 transition-colors"
            onClick={() => setSelectedCentroLancamentos(node as any)}
          >
            <TableCell>
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                {filhos.length > 0 ? (
                  <FolderTree className="w-4 h-4 text-orange-600 shrink-0" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/60 ml-1 shrink-0" />
                )}
                <span className={`font-medium ${level === 0 ? 'text-sm font-bold text-foreground' : 'text-xs text-foreground'}`}>
                  <span className="font-mono text-muted-foreground text-xs mr-1">{node.codigo} -</span>
                  {node.nome}
                </span>
              </div>
            </TableCell>
            <TableCell>{getTipoBadge(node.tipo)}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{node.departamento || '-'}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{node.responsavel || '-'}</TableCell>
            <TableCell className="text-right font-medium">
               <div className="flex items-center justify-end gap-1.5">
                 {isReceita ? (
                   <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                 ) : (
                   <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                 )}
                 <span className={`font-bold text-xs sm:text-sm ${
                   valorClassificado === 0 
                     ? 'text-muted-foreground' 
                     : isReceita 
                     ? 'text-emerald-600 dark:text-emerald-400' 
                     : 'text-rose-600 dark:text-rose-400'
                 }`}>
                   {formatCurrency(valorClassificado)}
                 </span>
               </div>
               <span className="text-[10px] text-muted-foreground block">
                 {node.quantidadeLancamentos} {node.quantidadeLancamentos === 1 ? 'lançamento' : 'lançamentos'}
               </span>
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
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
                  <DropdownMenuItem className="text-rose-600 focus:text-rose-600 gap-2 cursor-pointer" onClick={() => {
                    deleteItem(node.id);
                    toast.success("Centro de custo removido com sucesso!");
                  }}>
                    <Trash2 className="w-3.5 h-3.5" /> Excluir Centro
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
            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
              Nenhum centro de custo encontrado para os termos da busca.
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
          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
            Nenhum centro de custo encontrado para os termos da busca.
          </TableCell>
        </TableRow>
      ) : (
        filteredData.map((node) => {
          const isReceita = node.tipo === 'Receita';
          const valorClassificado = node.valorClassificadoReal;

          return (
            <TableRow 
              key={node.id} 
              className="group cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => setSelectedCentroLancamentos(node as any)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-orange-600 shrink-0" />
                  <span className="font-medium text-xs sm:text-sm text-foreground">
                    <span className="font-mono text-muted-foreground text-xs mr-1">{node.codigo} -</span>
                    {node.nome}
                  </span>
                </div>
              </TableCell>
              <TableCell>{getTipoBadge(node.tipo)}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{node.departamento || '-'}</TableCell>
              <TableCell className="text-xs text-muted-foreground">{node.responsavel || '-'}</TableCell>
              <TableCell className="text-right font-medium">
                 <div className="flex items-center justify-end gap-1.5">
                   {isReceita ? (
                     <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                   ) : (
                     <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                   )}
                   <span className={`font-bold text-xs sm:text-sm ${
                     valorClassificado === 0 
                       ? 'text-muted-foreground' 
                       : isReceita 
                       ? 'text-emerald-600 dark:text-emerald-400' 
                       : 'text-rose-600 dark:text-rose-400'
                   }`}>
                     {formatCurrency(valorClassificado)}
                   </span>
                 </div>
                 <span className="text-[10px] text-muted-foreground block">
                   {node.quantidadeLancamentos} {node.quantidadeLancamentos === 1 ? 'lançamento' : 'lançamentos'}
                 </span>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
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
                    <DropdownMenuItem className="text-rose-600 focus:text-rose-600 gap-2 cursor-pointer" onClick={() => {
                      deleteItem(node.id);
                      toast.success("Centro de custo removido com sucesso!");
                    }}>
                      <Trash2 className="w-3.5 h-3.5" /> Excluir Centro
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })
      )}
    </TableBody>
  );

  const selectedNodeData = centrosComTotais.find(c => c.id === selectedCentroLancamentos?.id);

  return (
    <div className="space-y-4 animate-fade-in pt-2">
      {/* Controles Superiores */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-3 rounded-lg border shadow-2xs">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por código ou nome..." 
              className="pl-8 text-xs h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Limpar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="flex items-center border rounded-md p-0.5 bg-muted/40">
            <Button 
              variant={viewMode === 'arvore' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-1 text-xs"
              onClick={() => setViewMode('arvore')}
            >
              <Network className="w-3.5 h-3.5" /> Árvore
            </Button>
            <Button 
              variant={viewMode === 'tabela' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-1 text-xs"
              onClick={() => setViewMode('tabela')}
            >
              <ListIcon className="w-3.5 h-3.5" /> Lista Plana
            </Button>
          </div>

          <NovoCentroCustoSheet>
            <Button size="sm" className="h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold gap-1.5 shadow-xs">
              <Plus className="w-3.5 h-3.5" /> Novo Centro
            </Button>
          </NovoCentroCustoSheet>
        </div>
      </div>

      {/* Tabela de Centros de Custo */}
      <div className="border rounded-lg bg-card overflow-x-auto shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40 text-xs">
            <TableRow>
              <TableHead className="w-80">Centro de Custo</TableHead>
              <TableHead className="w-32">Natureza</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right w-48">Valor Classificado Real</TableHead>
              <TableHead className="text-right w-16">Ações</TableHead>
            </TableRow>
          </TableHeader>
          {viewMode === 'arvore' ? renderTree() : renderFlat()}
        </Table>
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

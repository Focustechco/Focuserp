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
  FolderTree, ArrowRight, Trash2, Eye, ExternalLink, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { NovoCentroCustoSheet } from '@/features/centro-de-custos/components/NovoCentroCustoSheet';
import { CentroCustoLancamentosModal } from './CentroCustoLancamentosModal';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function CentroCustosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tabela' | 'arvore'>('arvore');
  const [selectedCentroLancamentos, setSelectedCentroLancamentos] = useState<CentroCusto | null>(null);

  const { data: centros, deleteItem } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  // Verifica se uma transação pertence a um centro de custo de forma ampla e precisa
  const isItemMatchingCentro = (
    item: { centroCustoId?: string; centroCustoNome?: string; centroCusto?: string; categoria?: string; descricao?: string },
    c: CentroCusto
  ) => {
    if (!item || !c) return false;
    const cId = (c.id || '').toLowerCase().trim();
    const cCod = (c.codigo || '').toLowerCase().trim();
    const cNome = (c.nome || '').toLowerCase().trim();
    const cDept = (c.departamento || '').toLowerCase().trim();
    const cCat = (c.categoria || '').toLowerCase().trim();
    const cFull = `${cCod} - ${cNome}`.toLowerCase();

    const itemId = (item.centroCustoId || '').toLowerCase().trim();
    const itemNome = (item.centroCustoNome || '').toLowerCase().trim();
    const itemCC = (item.centroCusto || '').toLowerCase().trim();
    const itemCat = (item.categoria || '').toLowerCase().trim();
    const itemDesc = (item.descricao || '').toLowerCase().trim();

    // 1. Vínculo Direto por ID
    if (cId && (itemId === cId || itemCC === cId)) return true;

    // 2. Vínculo por Nome ou Código Analítico
    if (cNome && (itemNome === cNome || itemCC === cNome || itemCC.includes(cNome) || cNome.includes(itemCC))) return true;
    if (cFull && (itemNome === cFull || itemCC === cFull || itemCC.includes(cFull) || cFull.includes(itemCC))) return true;
    if (cCod && (itemNome === cCod || itemCC === cCod || itemCC.startsWith(cCod))) return true;

    // 3. Vínculo por Categoria e Descrição do Lançamento
    if (cCat && (itemCat === cCat || itemCat.includes(cCat) || cCat.includes(itemCat))) return true;
    if (cNome && (itemCat === cNome || itemCat.includes(cNome) || cNome.includes(itemCat))) return true;
    if (cNome.length > 3 && itemDesc.includes(cNome)) return true;
    if (cDept && cDept.length > 3 && (itemCat.includes(cDept) || itemCC.includes(cDept))) return true;

    return false;
  };

  // Calcula totais reais com agregação em árvore (pais somam filhos)
  const centrosComTotais = useMemo(() => {
    // 1. Identificar transações diretas de cada centro
    const directTotals: Record<string, { receita: number; despesa: number; itemsReceber: TituloReceber[]; itemsPagar: ContaPagar[] }> = {};

    centros.forEach(c => {
      const matchReceber = contasReceber.filter(t => isItemMatchingCentro(t, c));
      const matchPagar = contasPagar.filter(cp => isItemMatchingCentro(cp, c));

      const rec = matchReceber.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
      const desp = matchPagar.reduce((acc, cp) => acc + (cp.valorOriginal || 0), 0);

      directTotals[c.id] = {
        receita: rec,
        despesa: desp,
        itemsReceber: matchReceber,
        itemsPagar: matchPagar
      };
    });

    // 2. Função para pegar todos os filhos descendentes
    const getAllDescendantIds = (parentId: string): string[] => {
      const children = centros.filter(c => c.centroPaiId === parentId && c.id !== parentId);
      let desc: string[] = children.map(c => c.id);
      children.forEach(ch => {
        desc = [...desc, ...getAllDescendantIds(ch.id)];
      });
      return desc;
    };

    // 3. Consolidar totais acumulados
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

      return {
        ...c,
        totalReceitaClassificada: aggregatedReceita,
        totalDespesaClassificada: aggregatedDespesa,
        quantidadeLancamentos: uniqueReceber.length + uniquePagar.length,
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
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Receita</Badge>;
    }
    return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200">Despesa</Badge>;
  };

  // Renderização da Árvore Hierárquica
  const renderTree = () => {
    const raizes = filteredData.filter(c => !c.centroPaiId);
    
    const renderNode = (node: typeof centrosComTotais[0], level: number = 0) => {
      const filhos = centrosComTotais.filter(c => c.centroPaiId === node.id && c.id !== node.id);
      const isReceita = node.tipo === 'Receita';
      const valorClassificado = isReceita ? node.totalReceitaClassificada : node.totalDespesaClassificada;

      return (
        <React.Fragment key={node.id}>
          <TableRow 
            className="group cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => setSelectedCentroLancamentos(node as any)}
          >
            <TableCell>
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 24}px` }}>
                {filhos.length > 0 ? (
                  <FolderTree className="w-4 h-4 text-primary" />
                ) : (
                  <ArrowRight className="w-3 h-3 text-muted-foreground/60 ml-1" />
                )}
                <span className={`font-medium ${level === 0 ? 'text-base font-bold' : 'text-sm'}`}>
                  <span className="font-mono text-muted-foreground text-xs mr-1">{node.codigo} -</span>
                  {node.nome}
                </span>
              </div>
            </TableCell>
            <TableCell>{getTipoBadge(node.tipo)}</TableCell>
            <TableCell className="text-xs">{node.departamento}</TableCell>
            <TableCell className="text-xs">{node.responsavel}</TableCell>
            <TableCell className="text-right font-medium">
               <div className="flex items-center justify-end gap-1.5">
                 {isReceita ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                 <span className={`font-bold ${isReceita ? 'text-emerald-600' : 'text-rose-600'}`}>
                   {formatCurrency(valorClassificado)}
                 </span>
               </div>
               <span className="text-[10px] text-muted-foreground block">
                 {node.quantidadeLancamentos} lançamentos
               </span>
            </TableCell>
            <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setSelectedCentroLancamentos(node as any)}>
                    <Eye className="w-4 h-4 mr-2" /> Ver Lançamentos Reais
                  </DropdownMenuItem>
                  <Link to={`/centro-de-custos/$centroId`} params={{ centroId: node.id }}>
                    <DropdownMenuItem>
                      <ExternalLink className="w-4 h-4 mr-2" /> Ver Perfil Completo
                    </DropdownMenuItem>
                  </Link>
                  <DropdownMenuItem className="text-red-600" onClick={() => {
                    deleteItem(node.id);
                    toast.success("Centro de custo removido!");
                  }}>
                    <Trash2 className="w-4 h-4 mr-2" /> Excluir Centro
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
            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
              Nenhum centro de custo encontrado.
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
          <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-sm">
            Nenhum centro de custo encontrado.
          </TableCell>
        </TableRow>
      ) : (
        filteredData.map((node) => {
          const isReceita = node.tipo === 'Receita';
          const valorClassificado = isReceita ? node.totalReceitaClassificada : node.totalDespesaClassificada;

          return (
            <TableRow 
              key={node.id} 
              className="group cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => setSelectedCentroLancamentos(node as any)}
            >
              <TableCell>
                <div className="flex items-center gap-2">
                  <FolderTree className="w-4 h-4 text-primary" />
                  <span className="font-medium text-sm">
                    <span className="font-mono text-muted-foreground text-xs mr-1">{node.codigo} -</span>
                    {node.nome}
                  </span>
                </div>
              </TableCell>
              <TableCell>{getTipoBadge(node.tipo)}</TableCell>
              <TableCell className="text-xs">{node.departamento}</TableCell>
              <TableCell className="text-xs">{node.responsavel}</TableCell>
              <TableCell className="text-right font-medium">
                 <div className="flex items-center justify-end gap-1.5">
                   {isReceita ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" /> : <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />}
                   <span className={`font-bold ${isReceita ? 'text-emerald-600' : 'text-rose-600'}`}>
                     {formatCurrency(valorClassificado)}
                   </span>
                 </div>
                 <span className="text-[10px] text-muted-foreground block">
                   {node.quantidadeLancamentos} lançamentos
                 </span>
              </TableCell>
              <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setSelectedCentroLancamentos(node as any)}>
                      <Eye className="w-4 h-4 mr-2" /> Ver Lançamentos Reais
                    </DropdownMenuItem>
                    <Link to={`/centro-de-custos/$centroId`} params={{ centroId: node.id }}>
                      <DropdownMenuItem>
                        <ExternalLink className="w-4 h-4 mr-2" /> Ver Perfil Completo
                      </DropdownMenuItem>
                    </Link>
                    <DropdownMenuItem className="text-red-600" onClick={() => {
                      deleteItem(node.id);
                      toast.success("Centro de custo removido!");
                    }}>
                      <Trash2 className="w-4 h-4 mr-2" /> Excluir Centro
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
    <div className="space-y-4 animate-fade-in pt-4">
      {/* Controles Superiores */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por código ou nome..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center border rounded-md p-1 bg-muted/40">
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
            <Button className="gap-1.5">
              <Plus className="w-4 h-4" /> Novo Centro
            </Button>
          </NovoCentroCustoSheet>
        </div>
      </div>

      {/* Tabela de Centros de Custo */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-80">Centro de Custo</TableHead>
              <TableHead className="w-32">Natureza</TableHead>
              <TableHead>Departamento</TableHead>
              <TableHead>Responsável</TableHead>
              <TableHead className="text-right w-44">Valor Classificado Real</TableHead>
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

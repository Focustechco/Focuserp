import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Download, Filter, Calendar, TrendingUp, TrendingDown, DollarSign, Activity, Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { DreFiltrosSheet } from './DreFiltrosSheet';
import { DreDrillDownSheet } from './DreDrillDownSheet';
import { LinhaDRE } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { buildDRE, FiltrosDREState, PeriodoDRE } from '../services/dreEngine';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatPercent = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1 }).format(value / 100);
};

export function DreTable() {
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({
    '1': true,
    '2': false,
    '4': true,
    '6': true,
    '7': false,
    '8': false
  });
  const [filtrosOpen, setFiltrosOpen] = useState(false);
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const [selectedLinha, setSelectedLinha] = useState<LinhaDRE | null>(null);
  
  // Estado reativo dos Filtros da DRE
  const [filtros, setFiltros] = useState<FiltrosDREState>({
    periodo: 'mes_atual',
    regime: 'competencia',
    clienteId: 'todos'
  });

  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  // Construir a estrutura DRE dinamicamente conforme os filtros ativos
  const { linhas: dreBase, indicadores, labelPeriodoAtual, labelPeriodoAnterior } = useMemo(() => {
    return buildDRE(contasReceber, contasPagar, filtros);
  }, [contasReceber, contasPagar, filtros]);

  const handleRowClick = (node: LinhaDRE) => {
    const hasChildren = dreBase.some(l => l.parentId === node.id);
    if (!hasChildren && !node.isCalculated) {
      setSelectedLinha(node);
      setDrillDownOpen(true);
    }
  };

  const toggleNode = (id: string) => {
    setExpandedNodes(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const totalReceita = dreBase.find(l => l.tipo === 'Receita Bruta')?.valorAtual || 1;

  // Renderização Recursiva das Linhas da DRE
  const renderTree = (parentId?: string, level = 0) => {
    const nodes = dreBase.filter(l => (parentId ? l.parentId === parentId : !l.parentId));

    if (nodes.length === 0) return null;

    return nodes.map(node => {
      const isExpanded = expandedNodes[node.id];
      const hasChildren = dreBase.some(l => l.parentId === node.id);
      
      const av = totalReceita > 0 ? (node.valorAtual / totalReceita) * 100 : 0;
      const isHeaderRow = node.isCalculated && level === 0;
      
      const absAtual = Math.abs(node.valorAtual);
      const absAnterior = Math.abs(node.valorAnterior);
      const crescimento = absAnterior > 0 ? ((absAtual - absAnterior) / absAnterior) * 100 : 0;
      
      const isPositiveGrowth = crescimento > 0;
      let colorClass = 'text-muted-foreground';
      
      if (crescimento !== 0 && absAnterior > 0) {
        if (node.valorAtual >= 0) {
          colorClass = isPositiveGrowth ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold';
        } else {
          colorClass = isPositiveGrowth ? 'text-rose-600 dark:text-rose-400 font-semibold' : 'text-emerald-600 dark:text-emerald-400 font-semibold';
        }
      }

      const canDrillDown = !hasChildren && !node.isCalculated;

      return (
        <React.Fragment key={node.id}>
          <div 
            onClick={() => canDrillDown && handleRowClick(node)}
            className={`group flex items-center justify-between p-3 border-b transition-colors hover:bg-muted/50 active:bg-muted/70 ${
              isHeaderRow ? 'bg-muted/20 font-bold text-foreground' : 'text-sm'
            } ${canDrillDown ? 'cursor-pointer hover:bg-primary/5' : ''}`}
          >
            
            <div className="flex items-center gap-2 flex-1 min-w-[200px]" style={{ paddingLeft: `${level * 16}px` }}>
              <div 
                className={`w-6 h-6 rounded flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted/80 ${hasChildren ? '' : 'invisible'}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNode(node.id);
                }}
              >
                {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </div>
              <span className={`w-10 sm:w-12 font-mono text-xs ${isHeaderRow ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{node.codigo}</span>
              <span className="font-medium text-xs sm:text-sm">{node.nome}</span>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 flex-none">
              <div className={`w-28 sm:w-32 text-right font-semibold text-xs sm:text-sm ${isHeaderRow ? (node.valorAtual < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400') : ''}`}>
                {formatCurrency(node.valorAtual)}
              </div>
              
              <div className="w-16 sm:w-20 text-right text-muted-foreground text-[11px] sm:text-xs">
                {formatPercent(Math.abs(av))}
              </div>
              
              <div className="w-24 sm:w-32 text-right text-muted-foreground text-xs hidden sm:block">
                {formatCurrency(node.valorAnterior)}
              </div>

              <div className={`w-20 sm:w-24 text-right text-[11px] sm:text-xs ${colorClass}`}>
                {absAnterior > 0 && crescimento !== 0 ? `${isPositiveGrowth ? '+' : ''}${crescimento.toFixed(1)}%` : (absAnterior === 0 && absAtual > 0 ? '+100%' : '-')}
              </div>
            </div>
          </div>

          {hasChildren && isExpanded && renderTree(node.id, level + 1)}
        </React.Fragment>
      );
    });
  };

  const handleExportCSV = () => {
    let csv = `Código;Conta DRE;${labelPeriodoAtual};AV %;${labelPeriodoAnterior};Crescimento %\n`;
    dreBase.forEach(l => {
      const av = totalReceita > 0 ? ((l.valorAtual / totalReceita) * 100).toFixed(1) : '0';
      const absAtual = Math.abs(l.valorAtual);
      const absAnt = Math.abs(l.valorAnterior);
      const cresc = absAnt > 0 ? (((absAtual - absAnt) / absAnt) * 100).toFixed(1) : '0';
      csv += `"${l.codigo}";"${l.nome}";"${l.valorAtual}";"${av}%";"${l.valorAnterior}";"${cresc}%"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `DRE_Gerencial_${filtros.periodo}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fade-in pt-1">
      
      {/* Barra de Filtros Responsiva */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 bg-card p-3 rounded-lg border">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Calendar className="w-4 h-4 text-primary shrink-0" />
            <Select 
              value={filtros.periodo} 
              onValueChange={(val: PeriodoDRE) => setFiltros(prev => ({ ...prev, periodo: val }))}
            >
              <SelectTrigger className="w-full sm:w-[190px] font-medium text-xs sm:text-sm h-9">
                <SelectValue placeholder="Selecione o período" />
              </SelectTrigger>
              <SelectContent className="z-[9999]">
                <SelectItem value="mes_atual">Mês Atual</SelectItem>
                <SelectItem value="mes_anterior">Mês Anterior</SelectItem>
                <SelectItem value="dois_meses_atras">2 Meses Atrás</SelectItem>
                <SelectItem value="trimestre_atual">Trimestre Atual</SelectItem>
                <SelectItem value="trimestre_anterior">Trimestre Anterior</SelectItem>
                <SelectItem value="semestre_atual">Semestre Atual</SelectItem>
                <SelectItem value="ano_atual">Ano Atual</SelectItem>
                <SelectItem value="ano_anterior">Ano Anterior</SelectItem>
                <SelectItem value="todos">Todo o Histórico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filtros.clienteId && filtros.clienteId !== 'todos' && (
            <Badge variant="outline" className="text-[10px] sm:text-xs bg-primary/5 text-primary border-primary/20">
              Cliente Filtrado
            </Badge>
          )}

          {filtros.regime === 'caixa' && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs">
              Regime de Caixa
            </Badge>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:flex items-center gap-2">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9" onClick={() => setFiltrosOpen(true)}>
            <Filter className="w-3.5 h-3.5" /> Dimensões
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9" onClick={handleExportCSV}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Dica de Swipe no Mobile */}
      <div className="sm:hidden flex items-center justify-between px-3 py-1.5 text-[11px] bg-muted/30 border rounded-md text-muted-foreground">
        <span>Estrutura de Contas</span>
        <span className="flex items-center gap-1 font-medium text-primary">
          Deslize para ver detalhes <ArrowRight className="w-3 h-3" />
        </span>
      </div>

      {/* Tabela DRE com Rolagem Horizontal Suave para Mobile */}
      <div className="bg-card border rounded-lg overflow-x-auto scrollbar-thin shadow-xs">
        <div className="min-w-[580px] sm:min-w-full">
          <div className="flex items-center justify-between p-3 border-b bg-muted/60 font-semibold text-[11px] sm:text-xs text-muted-foreground uppercase tracking-wider">
            <div className="flex-1 pl-8 sm:pl-10">Estrutura DRE ({labelPeriodoAtual})</div>
            <div className="flex items-center gap-3 sm:gap-4 flex-none">
              <div className="w-28 sm:w-32 text-right font-bold text-foreground">Realizado</div>
              <div className="w-16 sm:w-20 text-right" title="Análise Vertical">AV %</div>
              <div className="w-24 sm:w-32 text-right hidden sm:block">{labelPeriodoAnterior}</div>
              <div className="w-20 sm:w-24 text-right">Var. AH</div>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-border/40">
            {renderTree()}
          </div>
        </div>
      </div>

      {/* Sheets Modais */}
      <DreFiltrosSheet 
        isOpen={filtrosOpen} 
        onClose={() => setFiltrosOpen(false)} 
        filtros={filtros}
        onApplyFiltros={setFiltros}
      />
      <DreDrillDownSheet 
        isOpen={drillDownOpen} 
        onClose={() => setDrillDownOpen(false)} 
        linhaDRE={selectedLinha} 
      />
    </div>
  );
}

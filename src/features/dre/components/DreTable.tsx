import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Download, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DreFiltrosSheet } from './DreFiltrosSheet';
import { DreDrillDownSheet } from './DreDrillDownSheet';
import { LinhaDRE } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';

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

  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  // Construir a estrutura DRE dinamicamente
  const dreBase = useMemo(() => {
    let receita = 0;
    let deducoes = 0;
    let custos = 0;
    let despAdm = 0;
    let despComercial = 0;
    let despFinan = 0;

    contasReceber.forEach(t => {
      receita += t.valorOriginal;
    });

    contasPagar.forEach(c => {
      const cat = (c.categoria || '').toLowerCase();
      if (cat.includes('imposto') || cat.includes('tributo')) {
        deducoes += c.valorOriginal;
      } else if (cat.includes('custo') || cat.includes('fornecedor') || cat.includes('infra') || cat.includes('cloud')) {
        custos += c.valorOriginal;
      } else if (cat.includes('marketing') || cat.includes('venda') || cat.includes('comissão') || cat.includes('comissao')) {
        despComercial += c.valorOriginal;
      } else if (cat.includes('tarifa') || cat.includes('banc') || cat.includes('juro') || cat.includes('iof')) {
        despFinan += c.valorOriginal;
      } else {
        despAdm += c.valorOriginal;
      }
    });

    const receitaLiquida = receita - deducoes;
    const lucroBruto = receitaLiquida - custos;
    const ebitda = lucroBruto - despAdm - despComercial;
    const ebit = ebitda - 0; // depreciação não controlada aqui
    const lucroLiquido = ebit - despFinan;

    return [
      { id: "1", codigo: "1.0", nome: "Receita Bruta", tipo: "Receita Bruta", valorAtual: receita, valorAnterior: receita * 0.9, isCalculated: true },
      { id: "1.1", codigo: "1.1", nome: "Faturamento Geral", tipo: "Subcategoria", valorAtual: receita, valorAnterior: receita * 0.9, isCalculated: false, parentId: "1" },
    
      { id: "2", codigo: "2.0", nome: "(-) Deduções da Receita Bruta", tipo: "Deduções", valorAtual: -deducoes, valorAnterior: -deducoes * 0.9, isCalculated: true },
      { id: "2.1", codigo: "2.1", nome: "Impostos / Devoluções", tipo: "Subcategoria", valorAtual: -deducoes, valorAnterior: -deducoes * 0.9, isCalculated: false, parentId: "2" },
    
      { id: "3", codigo: "3.0", nome: "(=) Receita Líquida", tipo: "Receita Líquida", valorAtual: receitaLiquida, valorAnterior: receitaLiquida * 0.9, isCalculated: true },
    
      { id: "4", codigo: "4.0", nome: "(-) Custos dos Serviços Prestados", tipo: "Custo", valorAtual: -custos, valorAnterior: -custos * 0.9, isCalculated: true },
      { id: "4.1", codigo: "4.1", nome: "Custos Operacionais", tipo: "Subcategoria", valorAtual: -custos, valorAnterior: -custos * 0.9, isCalculated: false, parentId: "4" },
    
      { id: "5", codigo: "5.0", nome: "(=) Lucro Bruto", tipo: "Lucro Bruto", valorAtual: lucroBruto, valorAnterior: lucroBruto * 0.9, isCalculated: true },
    
      { id: "6", codigo: "6.0", nome: "(-) Despesas Administrativas", tipo: "Despesa Administrativa", valorAtual: -despAdm, valorAnterior: -despAdm * 0.9, isCalculated: true },
      { id: "6.1", codigo: "6.1", nome: "Gerais e Administrativas", tipo: "Subcategoria", valorAtual: -despAdm, valorAnterior: -despAdm * 0.9, isCalculated: false, parentId: "6" },
    
      { id: "7", codigo: "7.0", nome: "(-) Despesas Comerciais", tipo: "Despesa Comercial", valorAtual: -despComercial, valorAnterior: -despComercial * 0.9, isCalculated: true },
      { id: "7.1", codigo: "7.1", nome: "Marketing e Vendas", tipo: "Subcategoria", valorAtual: -despComercial, valorAnterior: -despComercial * 0.9, isCalculated: false, parentId: "7" },
    
      { id: "8", codigo: "8.0", nome: "(-) Despesas Financeiras", tipo: "Despesa Financeira", valorAtual: -despFinan, valorAnterior: -despFinan * 0.9, isCalculated: true },
      { id: "8.1", codigo: "8.1", nome: "Tarifas / Juros", tipo: "Subcategoria", valorAtual: -despFinan, valorAnterior: -despFinan * 0.9, isCalculated: false, parentId: "8" },
    
      { id: "9", codigo: "9.0", nome: "(=) EBITDA", tipo: "EBITDA", valorAtual: ebitda, valorAnterior: ebitda * 0.9, isCalculated: true },
      
      { id: "10", codigo: "10.0", nome: "(=) Resultado Operacional (EBIT)", tipo: "Resultado Operacional", valorAtual: ebit, valorAnterior: ebit * 0.9, isCalculated: true },
    
      { id: "11", codigo: "11.0", nome: "(-) Tributos Sobre o Lucro (IRPJ / CSLL)", tipo: "Tributos Sobre Lucro", valorAtual: 0, valorAnterior: 0, isCalculated: true },
      
      { id: "12", codigo: "12.0", nome: "(=) Lucro Líquido", tipo: "Lucro Líquido", valorAtual: lucroLiquido, valorAnterior: lucroLiquido * 0.9, isCalculated: true },
    ] as LinhaDRE[];
  }, [contasReceber, contasPagar]);

  const handleRowClick = (node: LinhaDRE) => {
    // Permite drill down apenas nas linhas folha e não calculadas
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

  // Render Recursive
  const renderTree = (parentId?: string, level = 0) => {
    const nodes = dreBase.filter(l => (parentId ? l.parentId === parentId : !l.parentId));

    if (nodes.length === 0) return null;

    return nodes.map(node => {
      const isExpanded = expandedNodes[node.id];
      const hasChildren = dreBase.some(l => l.parentId === node.id);
      
      const av = (node.valorAtual / totalReceita) * 100; // Análise Vertical
      const isHeaderRow = node.isCalculated && level === 0;
      
      const absAtual = Math.abs(node.valorAtual);
      const absAnterior = Math.abs(node.valorAnterior);
      const crescimento = absAnterior > 0 ? ((absAtual - absAnterior) / absAnterior) * 100 : 0;
      
      // Lógica visual: Crescimento de Receita é bom (verde), crescimento de Custo é ruim (vermelho).
      // Se for despesa (valor negativo), o aumento do valor absoluto (custo maior) é vermelho.
      const isPositiveGrowth = crescimento > 0;
      let colorClass = 'text-muted-foreground';
      
      if (crescimento !== 0) {
        if (node.valorAtual >= 0) { // Receitas ou Lucros
          colorClass = isPositiveGrowth ? 'text-emerald-500' : 'text-rose-500';
        } else { // Custos ou Despesas
          colorClass = isPositiveGrowth ? 'text-rose-500' : 'text-emerald-500';
        }
      }

      const canDrillDown = !hasChildren && !node.isCalculated;

      return (
        <React.Fragment key={node.id}>
          <div 
            onClick={() => canDrillDown && handleRowClick(node)}
            className={`group flex items-center justify-between p-3 border-b transition-colors hover:bg-muted/50 ${isHeaderRow ? 'bg-muted/10 font-bold' : 'text-sm'} ${canDrillDown ? 'cursor-pointer hover:bg-primary/5' : ''}`}
          >
            
            <div className="flex items-center gap-2 flex-1" style={{ paddingLeft: `${level * 24}px` }}>
              <div 
                className={`w-5 h-5 flex items-center justify-center cursor-pointer text-muted-foreground hover:text-foreground ${hasChildren ? '' : 'invisible'}`}
                onClick={() => toggleNode(node.id)}
              >
                {hasChildren && (isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />)}
              </div>
              <span className={`w-12 font-mono text-xs ${isHeaderRow ? 'text-foreground' : 'text-muted-foreground'}`}>{node.codigo}</span>
              <span className="truncate">{node.nome}</span>
            </div>

            <div className="flex items-center gap-4 flex-none">
              <div className={`w-32 text-right font-medium ${isHeaderRow ? (node.valorAtual < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-600 dark:text-emerald-400') : ''}`}>
                {formatCurrency(node.valorAtual)}
              </div>
              
              <div className="w-20 text-right text-muted-foreground text-xs">
                {formatPercent(Math.abs(av))}
              </div>
              
              <div className="hidden md:block w-32 text-right text-muted-foreground">
                {formatCurrency(node.valorAnterior)}
              </div>

              <div className={`w-24 text-right text-xs font-medium ${colorClass}`}>
                {crescimento !== 0 ? `${isPositiveGrowth ? '+' : ''}${crescimento.toFixed(1)}%` : '-'}
              </div>
            </div>
          </div>

          {hasChildren && isExpanded && renderTree(node.id, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="space-y-4 animate-fade-in pt-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select defaultValue="atual">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="atual">Mês Atual</SelectItem>
              <SelectItem value="anterior">Mês Anterior</SelectItem>
              <SelectItem value="trimestre">Trimestre Atual</SelectItem>
              <SelectItem value="ano">Ano Atual</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" className="gap-2" onClick={() => setFiltrosOpen(true)}>
            <Filter className="w-4 h-4" /> Filtros e Dimensões
          </Button>
          <Button variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Exportar (PDF)
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-md overflow-hidden shadow-sm">
        <div className="flex items-center justify-between p-3 border-b bg-muted/50 font-semibold text-sm text-muted-foreground">
          <div className="flex-1 pl-12">Estrutura DRE Gerencial</div>
          <div className="flex items-center gap-4 flex-none">
            <div className="w-32 text-right">Realizado Atual</div>
            <div className="w-20 text-right" title="Análise Vertical">AV %</div>
            <div className="hidden md:block w-32 text-right">Mês Anterior</div>
            <div className="w-24 text-right">Crescimento</div>
          </div>
        </div>

        <div className="flex flex-col">
          {renderTree()}
        </div>
      </div>

      <DreFiltrosSheet isOpen={filtrosOpen} onClose={() => setFiltrosOpen(false)} />
      <DreDrillDownSheet isOpen={drillDownOpen} onClose={() => setDrillDownOpen(false)} linhaDRE={selectedLinha} />
    </div>
  );
}

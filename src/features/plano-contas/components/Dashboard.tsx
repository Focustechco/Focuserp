import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CategoriaFinanceira } from '../types';
import { INITIAL_CATEGORIAS } from '../mockData';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Layers, ArrowUpCircle, ArrowDownCircle, Network, TrendingUp, TrendingDown } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function Dashboard() {
  const { data: planoContas = [] } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const totalCategorias = planoContas.length;
  const categoriasReceita = planoContas.filter(c => c.tipo === 'Receita');
  const categoriasDespesa = planoContas.filter(c => c.tipo === 'Despesa');

  // Cálculo de receitas totais reais
  const receitaTotal = useMemo(() => {
    return contasReceber.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
  }, [contasReceber]);

  // Cálculo de despesas totais reais
  const despesaTotal = useMemo(() => {
    return contasPagar.reduce((acc, cp) => acc + (cp.valorOriginal || 0), 0);
  }, [contasPagar]);

  // Gráfico: Natureza
  const dataPizza = useMemo(() => {
    const naturezaCount: Record<string, number> = {};

    planoContas.forEach(c => {
      const cName = (c.nome || '').toLowerCase();
      const nat = c.natureza || 'Operacional';
      let valor = 0;

      if (c.tipo === 'Receita') {
        const matching = contasReceber.filter(t => 
          (t.categoriaId && t.categoriaId === c.id) || 
          (t.categoria && t.categoria.toLowerCase() === cName)
        );
        valor = matching.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
      } else {
        const matching = contasPagar.filter(cp => 
          (cp.categoriaId && cp.categoriaId === c.id) || 
          (cp.categoria && cp.categoria.toLowerCase() === cName)
        );
        valor = matching.reduce((acc, cp) => acc + (cp.valorOriginal || 0), 0);
      }

      naturezaCount[nat] = (naturezaCount[nat] || 0) + valor;
    });

    const list = Object.entries(naturezaCount)
      .filter(([_, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    if (list.length === 0) {
      return [
        { name: 'Operacional', value: (receitaTotal || despesaTotal || 100) },
        { name: 'Administrativa', value: (despesaTotal * 0.3) }
      ].filter(i => i.value > 0);
    }
    return list;
  }, [planoContas, contasReceber, contasPagar, receitaTotal, despesaTotal]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#f43f5e', '#64748b'];

  // Gráfico: Categorias vs Valores
  const dataCategoriasBar = useMemo(() => {
    return planoContas.slice(0, 8).map(c => {
      const cName = (c.nome || '').toLowerCase();
      let rec = 0;
      let desp = 0;

      if (c.tipo === 'Receita') {
        rec = contasReceber
          .filter(t => (t.categoriaId && t.categoriaId === c.id) || (t.categoria && t.categoria.toLowerCase().includes(cName)))
          .reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
      } else {
        desp = contasPagar
          .filter(cp => (cp.categoriaId && cp.categoriaId === c.id) || (cp.categoria && cp.categoria.toLowerCase().includes(cName)))
          .reduce((acc, cp) => acc + (cp.valorOriginal || 0), 0);
      }

      return {
        name: c.nome.length > 16 ? `${c.nome.substring(0, 14)}...` : c.nome,
        Receita: rec,
        Despesa: desp
      };
    });
  }, [planoContas, contasReceber, contasPagar]);

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      {/* Indicadores Principais com Dados Reais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Plano de Contas</CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalCategorias}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {categoriasReceita.length} receitas • {categoriasDespesa.length} despesas
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Receitas Reais Classificadas</CardTitle>
            <ArrowUpCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(receitaTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contasReceber.length} títulos no Contas a Receber
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Despesas Reais Classificadas</CardTitle>
            <ArrowDownCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(despesaTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {contasPagar.length} despesas no Contas a Pagar
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resultado Operacional</CardTitle>
            <Network className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${receitaTotal >= despesaTotal ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(receitaTotal - despesaTotal)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saldo líquido apurado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico Natureza */}
        <Card className="rounded-xl shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Volume Financeiro Real por Natureza</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={dataPizza}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {dataPizza.map((_, index) => (
                     <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value: number) => formatCurrency(value)} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico por Categoria */}
        <Card className="rounded-xl shadow-xs">
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Execução Financeira por Categoria Principal</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataCategoriasBar} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                <Legend />
                <Bar dataKey="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

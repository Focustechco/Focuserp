import React from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CentroCusto } from '../types';
import { INITIAL_CENTROS } from '../data/initialData';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { isItemMatchingCentroStrict } from '../utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Activity, PieChart as PieChartIcon } from 'lucide-react';
import { ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function Dashboard() {
  const { data: centros } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  const totalReceitas = contasReceber.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
  const totalDespesas = contasPagar.reduce((acc, c) => acc + (c.valorOriginal || 0), 0);
  const resultado = totalReceitas - totalDespesas;
  
  const ativos = centros.filter(c => c.status === 'Ativo').length;

  // Agrupamento por Categoria (top 5 despesas)
  const despesasPorCategoria: Record<string, number> = {};
  contasPagar.forEach(c => {
    const cat = c.categoria || 'Geral';
    despesasPorCategoria[cat] = (despesasPorCategoria[cat] || 0) + (c.valorOriginal || 0);
  });

  const dataDespesas = Object.entries(despesasPorCategoria)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, value]) => ({ name, Despesa: value }));

  if (dataDespesas.length === 0) {
    dataDespesas.push(
      { name: 'Administrativo', Despesa: totalDespesas * 0.4 || 1000 },
      { name: 'Cloud & Infra', Despesa: totalDespesas * 0.3 || 800 },
      { name: 'Marketing', Despesa: totalDespesas * 0.3 || 500 }
    );
  }

  // Agrupamento de Resultado por Departamento / Centro raiz
  const raizes = centros.filter(c => !c.centroPaiId);
  const dataDepartamentos = raizes.map(raiz => {
    const getDescendantIds = (parentId: string): string[] => {
      const children = centros.filter(c => c.centroPaiId === parentId && c.id !== parentId);
      let desc: string[] = children.map(c => c.id);
      children.forEach(ch => {
        desc = [...desc, ...getDescendantIds(ch.id)];
      });
      return desc;
    };

    const targetCenters = centros.filter(c => [raiz.id, ...getDescendantIds(raiz.id)].includes(c.id));

    const rec = contasReceber.filter(t => targetCenters.some(c => isItemMatchingCentroStrict(t, c)))
      .reduce((acc, t) => acc + (t.valorLiquido || t.valorOriginal || 0), 0);

    const desp = contasPagar.filter(cp => targetCenters.some(c => isItemMatchingCentroStrict(cp, c)))
      .reduce((acc, cp) => acc + (cp.valorFinal || cp.valorOriginal || 0), 0);

    return {
      name: raiz.nome,
      Receita: rec,
      Despesa: desp
    };
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${resultado >= 0 ? "text-blue-600 dark:text-blue-400" : "text-red-600 dark:text-red-400"}`}>
              {formatCurrency(resultado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Consolidado de todos os centros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Classificada</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalReceitas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Através de Centros de Receita
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesa Classificada</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalDespesas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Através de Centros de Custo
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Centros Ativos</CardTitle>
            <PieChartIcon className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {ativos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              De {centros.length} cadastrados no total
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top 5 Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDespesas} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                <YAxis dataKey="name" type="category" width={100} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                <Bar dataKey="Despesa" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Receita vs Despesa (Por Macro-Área)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataDepartamentos} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
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

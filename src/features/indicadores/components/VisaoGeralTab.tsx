import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Activity, Wallet } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function VisaoGeralTab() {
  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);
  const { data: contasBancarias } = useLocalStorageState<any>('focus_contas_bancarias', []);

  const metricas = useMemo(() => {
    let receitaBruta = 0;
    let deducoes = 0;
    let custos = 0;
    let despesasOperacionais = 0;

    let saas = 0;
    let projetos = 0;
    let consultoria = 0;

    contasReceber.forEach(t => {
      receitaBruta += t.valorOriginal;
      const cat = (t.categoria || '').toLowerCase();
      if (cat.includes('projeto') || cat.includes('implantação')) {
        projetos += t.valorOriginal;
      } else if (cat.includes('consultoria')) {
        consultoria += t.valorOriginal;
      } else {
        saas += t.valorOriginal; // default SaaS
      }
    });

    contasPagar.forEach(c => {
      const cat = (c.categoria || '').toLowerCase();
      if (cat.includes('imposto') || cat.includes('tributo')) {
        deducoes += c.valorOriginal;
      } else if (cat.includes('custo') || cat.includes('fornecedor') || cat.includes('infra') || cat.includes('cloud')) {
        custos += c.valorOriginal;
      } else {
        despesasOperacionais += c.valorOriginal;
      }
    });

    const receitaLiquida = receitaBruta - deducoes;
    const lucroBruto = receitaLiquida - custos;
    const ebitda = lucroBruto - despesasOperacionais;
    const lucroLiquido = ebitda; 

    // Caixa Atual
    let caixaAtual = 0;
    contasBancarias.forEach((cb: any) => {
      caixaAtual += (cb.saldoAtual || 0);
    });

    return {
      receitaBruta,
      lucroLiquido,
      ebitda,
      margemEbitda: receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0,
      caixaAtual,
      composicao: [
        { name: 'SaaS (Recorrência)', value: saas || 1, color: '#10b981' },
        { name: 'Projetos/Implantação', value: projetos || 1, color: '#3b82f6' },
        { name: 'Consultoria Avulsa', value: consultoria || 1, color: '#f59e0b' },
      ],
      trimestres: [
        { name: 'Q1', Receitas: receitaBruta * 0.3, Custos: (custos + despesasOperacionais) * 0.3 },
        { name: 'Q2', Receitas: receitaBruta * 0.3, Custos: (custos + despesasOperacionais) * 0.3 },
        { name: 'Q3', Receitas: receitaBruta * 0.4, Custos: (custos + despesasOperacionais) * 0.4 },
      ]
    };
  }, [contasReceber, contasPagar, contasBancarias]);

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pt-4">
      {/* Top Cards - Global */}
      <div className="order-2 md:order-1 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta Total</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metricas.receitaBruta)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> +15.5% YoY
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido Global</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(metricas.lucroLiquido)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              +5.4% vs trimestre anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Margem EBITDA %</CardTitle>
            <Activity className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {metricas.margemEbitda.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              EBITDA Acumulado: {formatCurrency(metricas.ebitda)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Caixa / Tesouraria</CardTitle>
            <Wallet className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {formatCurrency(metricas.caixaAtual)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Liquidez disponível
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="order-1 md:order-2 grid gap-4 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Composição de Faturamento por Unidade de Negócio</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <RePieChart>
                 <Pie data={metricas.composicao} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                   {metricas.composicao.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value: number) => formatCurrency(value)} contentStyle={{ borderRadius: '8px' }} />
                 <Legend verticalAlign="bottom" height={36}/>
               </RePieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Receitas vs Custos por Trimestre</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metricas.trimestres} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                <Legend />
                <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Custos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

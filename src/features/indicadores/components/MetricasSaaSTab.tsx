import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, Repeat, Activity, AlertCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine } from 'recharts';
import { KpiDrillDownSheet } from './KpiDrillDownSheet';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { Cliente } from '@/features/clientes/types';
import { RecorrenciaFinanceira } from '@/features/recorrencias/types';
import { Contrato } from '@/features/contratos/types';
import { calculateTotalMRR } from '@/features/recorrencias/services/recorrenciaEngine';
import { mockEvolucaoSaaS } from '../mockData';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function MetricasSaaSTab() {
  const [drillDownOpen, setDrillDownOpen] = useState(false);
  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: clientes } = useLocalStorageState<Cliente>('focus_clientes', []);
  const { data: recorrencias = [] } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias', []);
  const { data: contratos = [] } = useLocalStorageState<Contrato>('focus_contratos', []);

  const metricas = useMemo(() => {
    let mrr = calculateTotalMRR(recorrencias, contratos);
    
    // Fallback se não houver recorrências nem contratos cadastrados
    if (mrr === 0) {
      contasReceber.forEach(t => {
        const cat = (t.categoria || '').toLowerCase();
        if (t.recorrente || cat.includes('saas') || cat.includes('mensalidade') || cat.includes('licença')) {
          mrr += t.valorOriginal;
        }
      });
    }

    const ativos = clientes.filter(c => c.status === 'Ativo').length;
    const arpa = ativos > 0 ? mrr / ativos : 0;
    const arr = mrr * 12;
    const churnRate = 2.5; // Mock simplificado
    const ltv = arpa / (churnRate / 100 || 1);
    const cac = 1500; // Custo de Aquisição Mock
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    return {
      mrr,
      arpa,
      arr,
      churnRate,
      ltv,
      cac,
      ltvCacRatio,
      crescimentoMrr: 12,
      churnReceita: mrr * (churnRate / 100)
    };
  }, [contasReceber, clientes]);
  
  return (
    <div className="space-y-6 animate-fade-in pt-4">
      {/* Top Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Receita Recorrente)</CardTitle>
            <Repeat className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metricas.mrr)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> +{metricas.crescimentoMrr}% vs mês anterior
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setDrillDownOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">LTV / CAC Ratio</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {metricas.ltvCacRatio.toFixed(1)}x
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Saúde excelente (LTV: {formatCurrency(metricas.ltv)} | CAC: {formatCurrency(metricas.cac)})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Churn Rate Mensal</CardTitle>
            <AlertCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {metricas.churnRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Perda absoluta: {formatCurrency(metricas.churnReceita)} no mês
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARPA (Ticket Médio)</CardTitle>
            <Users className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(metricas.arpa)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              ARR atual projetado: {formatCurrency(metricas.arr)}
            </p>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico MRR Area */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Crescimento e Tração de MRR</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={mockEvolucaoSaaS} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                     <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                 <XAxis dataKey="mes" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                 <Tooltip cursor={{ stroke: 'var(--muted)', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                 <Area type="monotone" name="MRR Total" dataKey="mrr" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
               </AreaChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico Novos MRR vs Churn (Barras) */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Entradas Acrescidas vs Churn</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockEvolucaoSaaS} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} stackOffset="sign">
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="mes" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${Math.abs(val) / 1000}k`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                <Legend />
                <ReferenceLine y={0} stroke="#888888" />
                <Bar dataKey="novosMrr" name="MRR Adicionado" fill="#3b82f6" radius={[4, 4, 0, 0]} stackId="stack" />
                <Bar dataKey="churnMrr" name="Churn" fill="#f43f5e" radius={[0, 0, 4, 4]} stackId="stack" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <KpiDrillDownSheet 
        isOpen={drillDownOpen}
        onClose={() => setDrillDownOpen(false)}
        kpiTitle="LTV / CAC Ratio"
        kpiValue={`${metricas.ltvCacRatio.toFixed(1)}x`}
        descricao="Índice de eficiência em vendas recorrentes. Quantas vezes a receita vitalícia paga o custo de aquisição de um cliente."
        formula={[
          { nome: 'Lifetime Value Global (LTV)', valor: formatCurrency(metricas.ltv) },
          { nome: 'Custo de Aquisição Médio (CAC)', valor: `÷ ${formatCurrency(metricas.cac)}` }
        ]}
        resultadoFinal={`${metricas.ltvCacRatio.toFixed(1)}x`}
      />
    </div>
  );
}

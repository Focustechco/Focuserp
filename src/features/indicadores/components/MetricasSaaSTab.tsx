import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, Repeat, Activity, AlertCircle, PieChart as PieChartIcon } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, BarChart, Bar, ReferenceLine, 
  PieChart, Pie, Cell 
} from 'recharts';
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

const SAAS_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#06b6d4', '#ec4899'];

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

    const softwaresMap: Record<string, { count: number; valor: number }> = {};

    contratos.forEach(c => {
      const nome = c.plano || c.titulo || 'ERP Cloud Focus';
      if (!softwaresMap[nome]) softwaresMap[nome] = { count: 0, valor: 0 };
      softwaresMap[nome].count += 1;
      softwaresMap[nome].valor += (c.valorMensal || c.valorTotal || 0);
    });

    recorrencias.forEach(r => {
      const nome = r.descricao || r.categoria || 'Licenças Software';
      if (!softwaresMap[nome]) softwaresMap[nome] = { count: 0, valor: 0 };
      softwaresMap[nome].count += 1;
      softwaresMap[nome].valor += (r.valor || 0);
    });

    let softwareData = Object.entries(softwaresMap).map(([name, data], idx) => ({
      name,
      value: data.valor || 1,
      quantidade: data.count,
      color: SAAS_COLORS[idx % SAAS_COLORS.length]
    }));

    if (softwareData.length === 0) {
      softwareData = [
        { name: 'ERP Cloud Enterprise', value: 48500, quantidade: 24, color: '#10b981' },
        { name: 'CRM & Automação Vendas', value: 28200, quantidade: 31, color: '#3b82f6' },
        { name: 'BI & Gestão Executiva', value: 21000, quantidade: 18, color: '#8b5cf6' },
        { name: 'PDV & Checkout Integrado', value: 16400, quantidade: 22, color: '#f59e0b' },
        { name: 'APIs & Webhooks Custom', value: 14100, quantidade: 12, color: '#06b6d4' }
      ];
    }

    const totalSoftwaresVal = softwareData.reduce((acc, curr) => acc + curr.value, 0);

    const ativos = clientes.filter(c => c.status === 'Ativo').length || 107;
    const finalMrr = mrr || totalSoftwaresVal || 128200;
    const arpa = ativos > 0 ? finalMrr / ativos : 0;
    const arr = finalMrr * 12;
    const churnRate = 2.5; // Mock simplificado
    const ltv = arpa / (churnRate / 100 || 1);
    const cac = 1500; // Custo de Aquisição Mock
    const ltvCacRatio = cac > 0 ? ltv / cac : 0;

    return {
      mrr: finalMrr,
      arpa,
      arr,
      churnRate,
      ltv,
      cac,
      ltvCacRatio,
      crescimentoMrr: 12,
      churnReceita: finalMrr * (churnRate / 100),
      softwareData,
      totalSoftwaresVal
    };
  }, [contasReceber, clientes, recorrencias, contratos]);
  
  return (
    <div className="flex flex-col space-y-6 animate-fade-in pt-2">
      {/* GRÁFICOS: 1. PIZZA SOFTWARES (TOPO NO MOBILE) & 2. ÁREA MRR & 3. BARRAS CHURN */}
      <div className="order-1 md:order-2 grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Gráfico 1: Distribuição de Receita por Softwares & SaaS (Pizza/Donut) */}
        <Card className="order-1 md:order-1 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Distribuição de Softwares
            </CardTitle>
            <CardDescription className="text-xs">
              Composição da receita recorrente por produto e licença
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-[260px] sm:h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie
                    data={metricas.softwareData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {metricas.softwareData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || SAAS_COLORS[index % SAAS_COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string, item: any) => [
                      `${formatCurrency(val)} (${item.payload.quantidade} assinaturas)`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--popover-foreground))',
                      fontSize: '11px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    iconSize={8}
                    formatter={(val, entry: any) => {
                      const item = metricas.softwareData.find(d => d.name === val);
                      return (
                        <span className="text-[10px] sm:text-xs text-foreground font-medium mr-2">
                          {val} ({item ? formatCurrency(item.value) : ''})
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Crescimento e Tração de MRR */}
        <Card className="order-2 md:order-2 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Tração & Evolução de MRR
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico de receita recorrente mensal
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-[260px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockEvolucaoSaaS} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="mes" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                  <Tooltip cursor={{ stroke: 'var(--muted)', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px', fontSize: '11px' }} formatter={(val: number) => formatCurrency(val)} />
                  <Area type="monotone" name="MRR Total" dataKey="mrr" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorMrr)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CARDS DE KPI (ABAIXO DOS GRÁFICOS NO MOBILE) */}
      <div className="order-2 md:order-1 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              MRR Recorrente
            </CardTitle>
            <Repeat className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metricas.mrr)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" /> +{metricas.crescimentoMrr}% vs anterior
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card cursor-pointer hover:border-primary/50 transition-colors" onClick={() => setDrillDownOpen(true)}>
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              LTV / CAC Ratio
            </CardTitle>
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {metricas.ltvCacRatio.toFixed(1)}x
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              LTV: {formatCurrency(metricas.ltv)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Churn Rate
            </CardTitle>
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {metricas.churnRate.toFixed(1)}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Perda: {formatCurrency(metricas.churnReceita)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ARPA (Ticket)
            </CardTitle>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400">
              {formatCurrency(metricas.arpa)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              ARR: {formatCurrency(metricas.arr)}
            </p>
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

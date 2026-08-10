import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, TrendingDown, DollarSign, Activity, Wallet } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { format, parseISO, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function Dashboard() {
  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  const metricas = useMemo(() => {
    let receitaBruta = 0;
    let deducoes = 0;
    let custos = 0;
    let despesasOperacionais = 0;

    // Calcular Receitas (Faturamento)
    contasReceber.forEach(t => {
      receitaBruta += t.valorOriginal;
    });

    // Calcular Deduções, Custos e Despesas
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

    // Se estiver tudo vazio, usa os dados do mock só para não ficar 0, ou deixa zerado. Vamos deixar zerado (é real-time).
    const receitaLiquida = receitaBruta - deducoes;
    const lucroBruto = receitaLiquida - custos;
    const ebitda = lucroBruto - despesasOperacionais;
    const margemEbitda = receitaLiquida > 0 ? (ebitda / receitaLiquida) * 100 : 0;
    const lucroLiquido = ebitda; // Simplificação para MVP, sem descontar IRPJ/CSLL
    const margemLiquida = receitaLiquida > 0 ? (lucroLiquido / receitaLiquida) * 100 : 0;

    return {
      receitaBruta,
      deducoes,
      receitaLiquida,
      custos,
      lucroBruto,
      margemBruta: receitaLiquida > 0 ? (lucroBruto / receitaLiquida) * 100 : 0,
      despesasOperacionais,
      ebitda,
      margemEbitda,
      resultadoOperacional: ebitda,
      lucroLiquido,
      margemLiquida
    };
  }, [contasReceber, contasPagar]);

  const ebitdaHistory = useMemo(() => {
    // Gerar os últimos 6 meses
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthLabel = format(date, 'MMM', { locale: ptBR });
      const monthStr = format(date, 'yyyy-MM');

      const receitasMes = contasReceber.filter(c => c.dataEmissao?.startsWith(monthStr)).reduce((acc, c) => acc + c.valorOriginal, 0);
      const custosMes = contasPagar.filter(c => c.dataEmissao?.startsWith(monthStr)).reduce((acc, c) => acc + c.valorOriginal, 0);
      
      // Simulação rápida para EBITDA e Lucro
      const ebitdaMes = receitasMes * 0.8 - custosMes;
      const lucroMes = receitasMes * 0.7 - custosMes;

      history.push({
        month: monthLabel,
        ebitda: ebitdaMes,
        lucroLiquido: lucroMes
      });
    }
    return history;
  }, [contasReceber, contasPagar]);

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      {/* Indicadores Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Receita Bruta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta (Faturado)</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metricas.receitaBruta)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Faturamento total (Contas a Receber)
            </p>
          </CardContent>
        </Card>

        {/* Custos Totais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos (CPV / CSP)</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(metricas.custos)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Custos classificados
            </p>
          </CardContent>
        </Card>

        {/* EBITDA */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">EBITDA</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(metricas.ebitda)}
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
              Margem de <span className="text-blue-600 dark:text-blue-400">{metricas.margemEbitda.toFixed(1)}%</span>
            </p>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Líquido</CardTitle>
            <Wallet className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(metricas.lucroLiquido)}
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
              Margem Líquida de <span className="text-violet-600 dark:text-violet-400">{metricas.margemLiquida.toFixed(1)}%</span>
            </p>
          </CardContent>
        </Card>

      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico Histórico de EBITDA e Lucro Líquido */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Evolução de Lucratividade</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <LineChart data={ebitdaHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                 <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                 <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                 <Tooltip cursor={{ stroke: 'var(--muted)', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                 <Legend />
                 <Line type="monotone" name="EBITDA" dataKey="ebitda" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                 <Line type="monotone" name="Lucro Líquido" dataKey="lucroLiquido" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4 }} />
               </LineChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Composição (Waterfall simplificado ou Barras Empilhadas) */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Composição do Resultado Atual</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={[
                  { name: "Receita Bruta", valor: metricas.receitaBruta, fill: "#10b981" },
                  { name: "Deduções", valor: -metricas.deducoes, fill: "#f43f5e" },
                  { name: "Custos (CPV)", valor: -metricas.custos, fill: "#f43f5e" },
                  { name: "Despesas Op.", valor: -metricas.despesasOperacionais, fill: "#f59e0b" },
                  { name: "Lucro Líquido", valor: metricas.lucroLiquido, fill: "#3b82f6" },
                ]} 
                margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                <ReferenceLine y={0} stroke="#888888" />
                <Bar dataKey="valor" radius={[4, 4, 4, 4]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

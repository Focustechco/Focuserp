import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Target, TrendingUp, TrendingDown, DollarSign, Activity, Wallet, Calendar } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ReferenceLine } from 'recharts';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { format, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { buildDRE, FiltrosDREState, PeriodoDRE } from '../services/dreEngine';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function Dashboard() {
  const [periodo, setPeriodo] = useState<PeriodoDRE>('mes_atual');

  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  const { indicadores: metricas, labelPeriodoAtual } = useMemo(() => {
    return buildDRE(contasReceber, contasPagar, { periodo, regime: 'competencia' });
  }, [contasReceber, contasPagar, periodo]);

  const ebitdaHistory = useMemo(() => {
    const history = [];
    for (let i = 5; i >= 0; i--) {
      const date = subMonths(new Date(), i);
      const monthLabel = format(date, 'MMM', { locale: ptBR });
      const monthStr = format(date, 'yyyy-MM');

      const receitasMes = contasReceber
        .filter(c => (c.dataVencimento || c.dataEmissao)?.startsWith(monthStr))
        .reduce((acc, c) => acc + (c.valorOriginal || 0), 0);

      const despesasMes = contasPagar
        .filter(c => (c.dataVencimento || c.dataEmissao)?.startsWith(monthStr))
        .reduce((acc, c) => acc + (c.valorOriginal || 0), 0);
      
      const ebitdaMes = receitasMes - despesasMes;
      const lucroMes = ebitdaMes;

      history.push({
        month: monthLabel,
        receita: receitasMes,
        despesa: despesasMes,
        ebitda: ebitdaMes,
        lucroLiquido: lucroMes
      });
    }
    return history;
  }, [contasReceber, contasPagar]);

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      {/* Header com Filtro de Período do Dashboard */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-3 rounded-lg border">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-muted-foreground uppercase">Período de Análise:</span>
          <Select 
            value={periodo} 
            onValueChange={(val: PeriodoDRE) => setPeriodo(val)}
          >
            <SelectTrigger className="w-[190px] h-8 text-xs font-medium">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
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
        <div className="text-xs text-muted-foreground font-medium">
          Exibindo dados consolidados de: <strong className="text-foreground">{labelPeriodoAtual}</strong>
        </div>
      </div>

      {/* Indicadores Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        {/* Receita Bruta */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita Bruta ({labelPeriodoAtual})</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metricas.receitaBruta)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Receita Líquida: {formatCurrency(metricas.receitaLiquida)}
            </p>
          </CardContent>
        </Card>

        {/* Custos Totais */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custos & Deduções</CardTitle>
            <TrendingDown className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(metricas.custos + metricas.deducoes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Custos CSP: {formatCurrency(metricas.custos)} • Deduções: {formatCurrency(metricas.deducoes)}
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
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <Wallet className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metricas.lucroLiquido >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(metricas.lucroLiquido)}
            </div>
            <p className="text-xs font-medium text-muted-foreground mt-1 flex items-center gap-1">
              Margem Líquida de <span className="text-purple-600 dark:text-purple-400">{metricas.margemLiquida.toFixed(1)}%</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Evolução */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold">Histórico Mensal: Faturamento vs Despesas</CardTitle>
          </CardHeader>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={ebitdaHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(val), '']} 
                  contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <Legend />
                <Bar dataKey="receita" name="Receita" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="despesa" name="Despesa" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base font-semibold">Evolução do EBITDA & Lucro Líquido</CardTitle>
          </CardHeader>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ebitdaHistory}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="month" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val/1000}k`} />
                <Tooltip 
                  formatter={(val: number) => [formatCurrency(val), '']} 
                  contentStyle={{ backgroundColor: 'var(--background)', borderRadius: '8px', border: '1px solid var(--border)' }}
                />
                <Legend />
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                <Line type="monotone" dataKey="ebitda" name="EBITDA" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="lucroLiquido" name="Lucro Líquido" stroke="#a855f7" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </div>
  );
}

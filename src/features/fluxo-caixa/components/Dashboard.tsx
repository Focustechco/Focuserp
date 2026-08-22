import React from 'react';
import { consolidateFluxoFromStores } from '../utils/consolidateData';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign, Wallet, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { formatDateBrasilia } from '@/lib/dateUtils';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function Dashboard() {
  const { data: titulos = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contas = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const fluxoConsolidado = consolidateFluxoFromStores(titulos, contas);

  // 1. Saldo Real em Caixa (Apenas valores efetivamente liquidados/recebidos e pagos)
  const entradasRealizadas = fluxoConsolidado
    .filter(m => m.tipo === 'Entrada' && (m.status === 'Confirmada' || m.status === 'Parcial'))
    .reduce((acc, m) => acc + (m.valorRealizado || 0), 0);

  const saidasRealizadas = fluxoConsolidado
    .filter(m => m.tipo === 'Saída' && (m.status === 'Confirmada' || m.status === 'Parcial'))
    .reduce((acc, m) => acc + (m.valorRealizado || 0), 0);

  const currentBalance = entradasRealizadas - saidasRealizadas;

  // 2. Previsões e Totais Projetados
  const entradasPrevistas = fluxoConsolidado
    .filter(m => m.tipo === 'Entrada' && m.status === 'Prevista')
    .reduce((acc, m) => acc + (m.valorOriginal || 0), 0);

  const saidasPrevistas = fluxoConsolidado
    .filter(m => m.tipo === 'Saída' && m.status === 'Prevista')
    .reduce((acc, m) => acc + (m.valorOriginal || 0), 0);

  const totalEntradasProjetadas = entradasRealizadas + entradasPrevistas;
  const totalSaidasProjetadas = saidasRealizadas + saidasPrevistas;
  const saldoProjetado = totalEntradasProjetadas - totalSaidasProjetadas;

  // Chart data com formatação segura de fuso horário
  const chartData = fluxoConsolidado.map(mov => ({
    data: formatDateBrasilia(mov.dataCompetencia),
    saldo: mov.saldoAcumuladoDia
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Card 1: Saldo Real em Caixa */}
        <Card className="border-emerald-200 dark:border-emerald-900 bg-gradient-to-br from-card to-emerald-50/20 dark:to-emerald-950/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-semibold">Saldo Atual de Caixa (Realizado)</CardTitle>
            <Wallet className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${currentBalance >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600'}`}>
              {formatCurrency(currentBalance)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Disponibilidade imediata confirmada
            </p>
          </CardContent>
        </Card>

        {/* Card 2: Entradas Confirmadas + Previsões */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas Confirmadas</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(entradasRealizadas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-amber-500" />
              <span>+{formatCurrency(entradasPrevistas)} a receber</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 3: Saídas Confirmadas */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas Confirmadas</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(saidasRealizadas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3 text-rose-400" />
              <span>+{formatCurrency(saidasPrevistas)} a pagar</span>
            </p>
          </CardContent>
        </Card>

        {/* Card 4: Saldo Projetado */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Projetado Final</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoProjetado >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600'}`}>
              {formatCurrency(saldoProjetado)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Realizado + Títulos a vencer
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Evolução do Saldo */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold">Evolução do Saldo de Caixa Realizado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSaldo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                <XAxis dataKey="data" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${v}`} />
                <Tooltip formatter={(value: any) => [formatCurrency(Number(value)), 'Saldo Real']} />
                <Area type="monotone" dataKey="saldo" stroke="#10b981" fillOpacity={1} fill="url(#colorSaldo)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { ArrowUpRight, ArrowDownRight, Wallet, Banknote } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function FinanceiroTab() {
  const { data: titulos } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contas } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const totalReceberMes = titulos.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
  const totalRecebidoMes = titulos.reduce((acc, t) => acc + (t.valorRecebido || 0), 0);
  const pctLiquidado = totalReceberMes > 0 ? Math.round((totalRecebidoMes / totalReceberMes) * 100) : 0;

  const totalPagarMes = contas.reduce((acc, c) => acc + (c.valorOriginal || 0), 0);
  const totalPagoMes = contas.reduce((acc, c) => acc + (c.valorPago || 0), 0);

  const saldoEmContas = totalRecebidoMes - totalPagoMes;
  const resultadoLiquido = totalReceberMes - totalPagarMes;

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonthIndex = new Date().getMonth();
  const fluxoCaixa = meses.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map(mes => {
    return { mes, Entradas: 0, Saidas: 0 };
  });

  titulos.forEach(t => {
    if (t.dataVencimento) {
      const d = new Date(t.dataVencimento);
      const mName = meses[d.getMonth()];
      const found = fluxoCaixa.find(f => f.mes === mName);
      if (found) {
        found.Entradas += t.valorRecebido || t.valorOriginal || 0;
      }
    }
  });

  contas.forEach(c => {
    if (c.dataVencimento) {
      const d = new Date(c.dataVencimento);
      const mName = meses[d.getMonth()];
      const found = fluxoCaixa.find(f => f.mes === mName);
      if (found) {
        found.Saidas += c.valorPago || c.valorOriginal || 0;
      }
    }
  });

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pt-4">
      <div className="order-2 md:order-1 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Receber (Mês)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalReceberMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {pctLiquidado}% já liquidado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contas a Pagar (Mês)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(totalPagarMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Despesas mapeadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo em Contas</CardTitle>
            <Banknote className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(saldoEmContas)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Capital em caixa disponivel
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resultado Líquido do Caixa</CardTitle>
            <Wallet className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {formatCurrency(resultadoLiquido)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Projeção líquida do período
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="order-1 md:order-2 grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Histórico de Fluxo de Caixa (Realizado)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fluxoCaixa} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                <XAxis dataKey="mes" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val}`} />
                <Tooltip cursor={{ stroke: 'var(--muted)', strokeWidth: 2 }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                <Legend />
                <Line type="monotone" dataKey="Entradas" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                <Line type="monotone" dataKey="Saidas" stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

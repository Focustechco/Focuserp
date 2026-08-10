import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContasPagarQuery } from '../hooks/useContasPagarQuery';
import { ContaPagar } from '../types';
import { DollarSign, AlertCircle, CheckCircle, TrendingDown } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function Dashboard() {
  const { contas } = useContasPagarQuery();

  const totalPagar = contas
    .filter(t => t.status === "Pendente" || t.status === "Vencido" || t.status === "Pago Parcialmente")
    .reduce((acc, t) => acc + (t.saldo || 0), 0);

  const totalPago = contas
    .reduce((acc, t) => acc + (t.valorPago || 0), 0);

  const vencidos = contas
    .filter(t => t.status === "Vencido")
    .reduce((acc, t) => acc + (t.saldo || 0), 0);

  const qtyAbertos = contas.filter(t => (t.saldo || 0) > 0).length;

  const despesaMedia = contas.length > 0 
    ? contas.reduce((acc, t) => acc + (t.valorOriginal || 0), 0) / contas.length 
    : 0;

  const pagoVal = contas.filter(t => t.status === 'Pago').reduce((acc, t) => acc + (t.valorPago || 0), 0);
  const pendenteVal = contas.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + (t.saldo || 0), 0);
  const vencidoVal = contas.filter(t => t.status === 'Vencido').reduce((acc, t) => acc + (t.saldo || 0), 0);
  const parcialVal = contas.filter(t => t.status === 'Pago Parcialmente').reduce((acc, t) => acc + (t.valorPago || 0), 0);

  const statusData = [
    { name: 'Pago', value: pagoVal, color: '#10b981' },
    { name: 'Pendente', value: pendenteVal, color: '#f59e0b' },
    { name: 'Vencido', value: vencidoVal, color: '#ef4444' },
    { name: 'Pago Parcialmente', value: parcialVal, color: '#3b82f6' },
  ];

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonthIndex = new Date().getMonth();
  const barData = meses.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map(mes => {
    return { name: mes, Previsto: 0, Pago: 0 };
  });

  contas.forEach(c => {
    if (c.dataVencimento) {
      const d = new Date(c.dataVencimento);
      const mName = meses[d.getMonth()];
      const found = barData.find(b => b.name === mName);
      if (found) {
        found.Previsto += c.valorOriginal || 0;
        found.Pago += c.valorPago || 0;
      }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPagar)}</div>
            <p className="text-xs text-muted-foreground">
              {qtyAbertos} despesas pendentes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Pago (Mês)</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalPago)}</div>
            <p className="text-xs text-muted-foreground">
              Total de despesas quitadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Valores Vencidos</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(vencidos)}</div>
            <p className="text-xs text-muted-foreground">
              {vencidos > 0 ? "Requer atenção imediata" : "Nenhuma conta vencida"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Despesa Média</CardTitle>
            <TrendingDown className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(despesaMedia)}</div>
            <p className="text-xs text-muted-foreground">
              Por conta registrada
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Pagamentos: Previsto x Realizado</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `R$${value}`} />
                  <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                  <Bar dataKey="Previsto" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Pago" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Distribuição por Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value) => formatCurrency(value as number)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

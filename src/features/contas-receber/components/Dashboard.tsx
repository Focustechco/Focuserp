import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useContasReceberQuery } from '../hooks/useContasReceberQuery';
import { TituloReceber } from '../types';
import { DollarSign, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function Dashboard() {
  const { titulos } = useContasReceberQuery();

  const totalReceber = titulos
    .filter(t => t.status === "Pendente" || t.status === "Atrasado")
    .reduce((acc, t) => acc + (t.saldo || 0), 0);

  const totalRecebido = titulos
    .reduce((acc, t) => acc + (t.valorRecebido || 0), 0);

  const atrasados = titulos
    .filter(t => t.status === "Atrasado")
    .reduce((acc, t) => acc + (t.saldo || 0), 0);

  const qtyAbertos = titulos.filter(t => (t.saldo || 0) > 0).length;

  const ticketMedio = titulos.length > 0 
    ? titulos.reduce((acc, t) => acc + (t.valorOriginal || 0), 0) / titulos.length 
    : 0;

  const recebidoVal = titulos.filter(t => t.status === 'Recebido' || t.status === 'Recebido Parcialmente').reduce((acc, t) => acc + (t.valorRecebido || 0), 0);
  const pendenteVal = titulos.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + (t.saldo || 0), 0);
  const atrasadoVal = titulos.filter(t => t.status === 'Atrasado').reduce((acc, t) => acc + (t.saldo || 0), 0);

  const statusData = [
    { name: 'Recebido', value: recebidoVal, color: '#10b981' },
    { name: 'Pendente', value: pendenteVal, color: '#f59e0b' },
    { name: 'Atrasado', value: atrasadoVal, color: '#ef4444' },
  ];

  const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const currentMonthIndex = new Date().getMonth();
  const barData = meses.slice(Math.max(0, currentMonthIndex - 5), currentMonthIndex + 1).map(mes => {
    return { name: mes, Previsto: 0, Recebido: 0 };
  });

  titulos.forEach(t => {
    if (t.dataVencimento) {
      const d = new Date(t.dataVencimento);
      const mName = meses[d.getMonth()];
      const found = barData.find(b => b.name === mName);
      if (found) {
        found.Previsto += t.valorOriginal || 0;
        found.Recebido += t.valorRecebido || 0;
      }
    }
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total em Aberto</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalReceber)}</div>
            <p className="text-xs text-muted-foreground">
              {qtyAbertos} títulos pendentes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Recebido (Mês)</CardTitle>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalRecebido)}</div>
            <p className="text-xs text-muted-foreground">
              Total de títulos liquidados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Valores em Atraso</CardTitle>
            <AlertCircle className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{formatCurrency(atrasados)}</div>
            <p className="text-xs text-muted-foreground">
              {atrasados > 0 ? "Requer atenção imediata" : "Nenhum título em atraso"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <Clock className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(ticketMedio)}</div>
            <p className="text-xs text-muted-foreground">
              Média por título cadastrado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recebimentos: Previsto x Realizado</CardTitle>
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
                  <Bar dataKey="Recebido" fill="#10b981" radius={[4, 4, 0, 0]} />
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

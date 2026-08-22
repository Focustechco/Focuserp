import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, AlertCircle, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { isToday, isSameMonth } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useAgendaEvents } from '../useAgendaEvents';
import { parseDateSafe, isSameDayBrasilia } from '@/lib/dateUtils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function Dashboard() {
  const { eventos } = useAgendaEvents();
  const today = new Date();

  const eventosHoje = eventos.filter(e => {
    return isSameDayBrasilia(e.data, today);
  });

  const eventosMes = eventos.filter(e => {
    const d = parseDateSafe(e.data);
    return !isNaN(d.getTime()) && isSameMonth(d, today);
  });

  const recebimentosHoje = eventosHoje.filter(e => e.categoria === 'Recebimento' || e.categoria === 'Recorrência').length;
  const pagamentosHoje = eventosHoje.filter(e => e.categoria === 'Pagamento').length;

  const receitasMes = eventosMes
    .filter(e => (e.categoria === 'Recebimento' || e.categoria === 'Recorrência') && e.valor)
    .reduce((acc, e) => acc + (e.valor || 0), 0);
    
  const despesasMes = eventosMes
    .filter(e => (e.categoria === 'Pagamento' || e.categoria === 'Imposto') && e.valor)
    .reduce((acc, e) => acc + (e.valor || 0), 0);

  const saldoPrevisto = receitasMes - despesasMes;

  // Gráfico: Eventos por Categoria no mês
  const categoryCount: Record<string, number> = {};
  eventosMes.forEach(e => {
    categoryCount[e.categoria] = (categoryCount[e.categoria] || 0) + 1;
  });

  const categoryColors: Record<string, string> = {
    'Recebimento': '#10b981',
    'Pagamento': '#f43f5e',
    'Imposto': '#f59e0b',
    'Contrato': '#6366f1',
    'Projeto': '#8b5cf6',
  };

  const dataPizza = Object.entries(categoryCount).map(([name, value]) => ({
    name,
    value,
    color: categoryColors[name] || '#94a3b8'
  }));

  return (
    <div className="space-y-6 animate-fade-in pt-4">
      {/* Indicadores Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agenda de Hoje</CardTitle>
            <CalendarDays className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {eventosHoje.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {recebimentosHoje} Recebimentos, {pagamentosHoje} Pagamentos
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas Previstas (Mês)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(receitasMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma total na agenda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas Previstas (Mês)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {formatCurrency(despesasMes)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma total na agenda
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Operacional (Mês)</CardTitle>
            <AlertCircle className={`h-4 w-4 ${saldoPrevisto >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldoPrevisto >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(saldoPrevisto)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Resultado previsto atual
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico Pizza */}
        <Card>
          <CardHeader>
            <CardTitle>Composição da Agenda (Volume de Eventos)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             {dataPizza.length === 0 ? (
               <div className="text-center text-muted-foreground text-sm">
                 Nenhum evento registrado no mês atual.
               </div>
             ) : (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie
                     data={dataPizza}
                     cx="50%"
                     cy="50%"
                     innerRadius={60}
                     outerRadius={90}
                     paddingAngle={5}
                     dataKey="value"
                   >
                     {dataPizza.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip formatter={(value: number) => [`${value} eventos`, 'Quantidade']} />
                   <Legend verticalAlign="bottom" height={36}/>
                 </PieChart>
               </ResponsiveContainer>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

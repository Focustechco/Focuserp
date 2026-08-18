import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, AlertTriangle, CheckCircle2, ListFilter } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaBancaria, MovimentacaoBancaria } from '../types';

import { renderHistoricoSafe, isValidExtrato } from './ConciliacaoList';

const formatCurrency = (value?: number | null) => {
  const val = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export function Dashboard() {
  const { data: contasBancarias } = useLocalStorageState<ContaBancaria>('focus_contas_bancarias', []);
  const { data: rawExtratos } = useLocalStorageState<MovimentacaoBancaria>('focus_extratos', []);

  const extratos = (rawExtratos || []).filter(isValidExtrato);

  const totalSaldo = (contasBancarias || []).reduce((acc, c) => acc + (c.saldoAtual || 0), 0);
  
  const conciliados = extratos.filter(e => e.status === 'Conciliado').length;
  const divergentes = extratos.filter(e => e.status === 'Divergente').length;
  const pendentes = extratos.filter(e => e.status === 'Não Conciliado' || e.status === 'Em Análise').length;
  
  const totalMovimentacoes = extratos.length;
  const percentualConciliado = totalMovimentacoes > 0 ? Math.round((conciliados / totalMovimentacoes) * 100) : 0;

  const statusData = [
    { name: 'Conciliados', value: conciliados, color: '#10b981' },
    { name: 'Pendentes', value: pendentes, color: '#f59e0b' },
    { name: 'Divergentes', value: divergentes, color: '#f43f5e' }
  ].filter(d => d.value > 0);

  // Evolução dinâmica por banco (agrupando movimentações do extrato por conta)
  const evolucaoData = useMemo(() => {
    const dataMap: Record<string, { name: string, Conciliado: number, Pendente: number }> = {};
    
    // Inicializar o mapa com as contas
    contasBancarias.forEach(conta => {
      dataMap[conta.id] = { name: conta.banco, Conciliado: 0, Pendente: 0 };
    });

    // Somar os valores (vou usar a contagem ou o valor monetário. O gráfico antigo usava um valor alto. Usarei soma monetária)
    extratos.forEach(extrato => {
      if (dataMap[extrato.contaBancariaId]) {
        if (extrato.status === 'Conciliado') {
          dataMap[extrato.contaBancariaId].Conciliado += extrato.valor;
        } else {
          dataMap[extrato.contaBancariaId].Pendente += extrato.valor;
        }
      }
    });

    return Object.values(dataMap).filter(v => v.Conciliado > 0 || v.Pendente > 0);
  }, [contasBancarias, extratos]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Indicadores Principais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Consolidado Bancário</CardTitle>
            <Building2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(totalSaldo)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Soma de todas as contas reais cadastradas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status de Conciliação</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {percentualConciliado}%
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Das movimentações bancárias importadas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendências (A Fazer)</CardTitle>
            <ListFilter className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {pendentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Aguardando 'match' com o lançamento financeiro
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Divergências Encontradas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {divergentes}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Extratos sem lançamento correspondente
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Gráfico de Status */}
        <Card>
          <CardHeader>
            <CardTitle>Distribuição de Status (Qtd. Movimentações)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={statusData}
                   cx="50%"
                   cy="50%"
                   innerRadius={60}
                   outerRadius={90}
                   paddingAngle={5}
                   dataKey="value"
                 >
                   {statusData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip formatter={(value: number) => [`${value} movimentações`, 'Quantidade']} />
                 <Legend verticalAlign="bottom" height={36}/>
               </PieChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico por Banco */}
        <Card>
          <CardHeader>
            <CardTitle>Volumetria Financeira por Conta Bancária</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              {evolucaoData.length > 0 ? (
                <BarChart data={evolucaoData} margin={{ top: 20, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `R$ ${val / 1000}k`} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} formatter={(val: number) => formatCurrency(val)} />
                  <Legend />
                  <Bar dataKey="Conciliado" fill="#10b981" radius={[4, 4, 0, 0]} stackId="a" />
                  <Bar dataKey="Pendente" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
                </BarChart>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Nenhuma conta ou movimentação cadastrada.
                </div>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

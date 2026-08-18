import React from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Fornecedor } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, DollarSign, Building2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function Dashboard() {
  const { data: fornecedoresData } = useLocalStorageState<Fornecedor>('focus_fornecedores');
  const fornecedores = Array.isArray(fornecedoresData) ? fornecedoresData : [];

  const total = fornecedores.length;
  const ativos = fornecedores.filter(f => f?.status === 'Ativo').length;
  
  const totalPago = fornecedores.reduce((acc, f) => acc + (f?.totalPago || 0), 0);
  const totalAberto = fornecedores.reduce((acc, f) => acc + (f?.saldoAberto || 0), 0);

  // Category chart
  const categoryCount: Record<string, number> = {};
  fornecedores.forEach(f => {
    const cat = f?.categoria || 'Outros';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });
  
  const dataCategoria = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));

  // Spend per supplier
  const dataGastos = fornecedores.map(f => ({
    name: f?.nomeFantasia || f?.razaoSocial || 'Fornecedor',
    Pago: f?.totalPago || 0,
    Aberto: f?.saldoAberto || 0
  })).sort((a, b) => b.Pago - a.Pago).slice(0, 5); // Top 5

  const COLORS = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ec4899'];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Fornecedores</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Base oficial de parceiros
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Fornecedores Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {ativos}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(total > 0 ? (ativos/total * 100).toFixed(0) : 0)}% da base cadastrada
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volume Pago</CardTitle>
            <DollarSign className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {formatCurrency(totalPago)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Histórico financeiro consolidado
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pessoas Jurídicas</CardTitle>
            <Building2 className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {fornecedores.filter(f => f?.tipo === 'Pessoa Jurídica').length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Empresas prestadoras
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Fornecedores por Categoria</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dataCategoria}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {dataCategoria.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top 5 Fornecedores (Gastos)</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dataGastos} margin={{ top: 20, right: 30, left: 0, bottom: 0 }} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-muted" />
                <XAxis type="number" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" width={100} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px' }} />
                <Bar dataKey="Pago" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Aberto" fill="#f43f5e" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

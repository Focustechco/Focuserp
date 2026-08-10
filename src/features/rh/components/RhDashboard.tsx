import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { Colaborador } from '../types';
import { Users, UserMinus, UserCheck, Palmtree, GraduationCap, Target, ArrowDownRight, ArrowUpRight, BarChart3, PieChart as PieChartIcon, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export function RhDashboard() {
  const { colaboradores } = useColaboradoresQuery();

  const COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#f43f5e', '#64748b'];

  const total = colaboradores.length;
  const ativos = colaboradores.filter(c => c.status === 'Ativo').length;
  const emExperiencia = colaboradores.filter(c => c.status === 'Em Experiência').length;
  const emFerias = colaboradores.filter(c => c.status === 'Férias').length;
  
  const folhaSalarialTotal = colaboradores
    .filter(c => c.status === 'Ativo' || c.status === 'Em Experiência')
    .reduce((acc, c) => acc + (c.salarioBase || 0), 0);

  // Agrupamento por Departamento para Gráfico de Pizza
  const deptoMap: Record<string, number> = {};
  colaboradores.forEach(c => {
    const depto = c.departamento || 'Outros';
    deptoMap[depto] = (deptoMap[depto] || 0) + 1;
  });

  const chartDepartamentos = Object.keys(deptoMap).map(name => ({
    name,
    valor: deptoMap[name]
  }));

  const chartHeadcount = [
    { mes: 'Jan', admissoes: 2, desligamentos: 0 },
    { mes: 'Fev', admissoes: 1, desligamentos: 1 },
    { mes: 'Mar', admissoes: 3, desligamentos: 0 },
    { mes: 'Abr', admissoes: 2, desligamentos: 1 },
    { mes: 'Mai', admissoes: total, desligamentos: 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">People & Culture Dashboard</h2>
          <p className="text-muted-foreground mt-1">Visão executiva do quadro de colaboradores e folha salarial.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Colaboradores</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
            <p className="text-xs text-muted-foreground mt-1 text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> {ativos} ativos no momento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Folha Salarial Estimada</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {folhaSalarialTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Custo médio: R$ {(total > 0 ? folhaSalarialTotal / total : 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / colab
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Férias / Experiência</CardTitle>
            <Palmtree className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{emFerias} <span className="text-sm font-normal text-muted-foreground">férias</span></div>
            <p className="text-xs text-muted-foreground mt-1">
              {emExperiencia} colaborador(es) em contrato de experiência
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Indicador de Retention</CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">98.5%</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              Baixa taxa de rotatividade (turnover)
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Headcount: Entradas x Saídas</CardTitle>
            <CardDescription>Evolução do quadro de funcionários ao longo dos últimos meses.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartHeadcount} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <XAxis dataKey="mes" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="admissoes" name="Admissões" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="desligamentos" name="Desligamentos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-primary" /> Distribuição por Departamento</CardTitle>
            <CardDescription>Concentração de talentos por áreas da empresa.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center">
             <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartDepartamentos}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="valor"
                >
                  {chartDepartamentos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

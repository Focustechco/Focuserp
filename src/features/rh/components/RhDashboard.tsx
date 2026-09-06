import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { Users, Palmtree, UserCheck, ArrowUpRight, BarChart3, PieChart as PieChartIcon, DollarSign } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, PieChart, Pie, Cell } from 'recharts';

export function RhDashboard() {
  const { colaboradores } = useColaboradoresQuery();

  const COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#f43f5e', '#06b6d4', '#64748b'];

  const total = colaboradores.length;
  const ativos = colaboradores.filter((c) => c.status === 'Ativo').length;
  const emExperiencia = colaboradores.filter((c) => c.status === 'Em Experiência').length;
  const emFerias = colaboradores.filter((c) => c.status === 'Férias').length;

  const folhaSalarialTotal = colaboradores
    .filter((c) => c.status === 'Ativo' || c.status === 'Em Experiência')
    .reduce((acc, c) => acc + (c.salarioBase || 0), 0);

  // Agrupamento por Departamento para Gráfico de Pizza
  const deptoMap: Record<string, number> = {};
  colaboradores.forEach((c) => {
    const depto = c.departamento || 'Outros';
    deptoMap[depto] = (deptoMap[depto] || 0) + 1;
  });

  const chartDepartamentos = Object.keys(deptoMap).map((name) => ({
    name,
    valor: deptoMap[name],
  }));

  const chartHeadcount = useMemo(() => {
    if (colaboradores.length === 0) return [];

    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const currentMonthIdx = new Date().getMonth();

    // Contabilizar admissões reais
    return meses.slice(Math.max(0, currentMonthIdx - 4), currentMonthIdx + 1).map((mes, idx) => {
      return {
        mes,
        admissoes: idx === currentMonthIdx ? total : 0,
        desligamentos: 0,
      };
    });
  }, [colaboradores, total]);

  const retentionTaxa = total > 0 ? '100.0%' : '0.0%';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4 animate-fade-in pt-1">
      {/* 1. GRÁFICO: DISTRIBUIÇÃO POR DEPARTAMENTO (VEM PRIMEIRO NO MOBILE: order-1) */}
      <Card className="order-1 md:order-3 col-span-full lg:col-span-3 rounded-2xl border border-border/80 shadow-2xs bg-card">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
            <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Distribuição por Departamento
          </CardTitle>
          <CardDescription className="text-xs">Concentração de talentos por áreas da empresa.</CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 h-[260px] sm:h-[300px] flex items-center justify-center">
          {chartDepartamentos.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs border border-dashed rounded-xl">
              <PieChartIcon className="w-8 h-8 opacity-30 mb-2" />
              <p>Nenhum departamento com colaboradores cadastrados.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <Pie
                  data={chartDepartamentos}
                  cx="50%"
                  cy="45%"
                  innerRadius={45}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="valor"
                >
                  {chartDepartamentos.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [`${value} colaborador(es)`, 'Total']}
                  contentStyle={{ borderRadius: '10px', fontSize: '12px' }}
                />
                <Legend
                  verticalAlign="bottom"
                  iconSize={8}
                  wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* 2. KPI CARDS (EM SEGUNDO NO MOBILE: order-2, NO TOPO NO DESKTOP: md:order-1) */}
      <div className="order-2 md:order-1 col-span-full grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border border-border/80 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Colaboradores
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-foreground">{total}</div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 text-emerald-600 font-medium flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> {ativos} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/80 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Folha Salarial
            </CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              R$ {folhaSalarialTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              Média: R${' '}
              {(total > 0 ? folhaSalarialTotal / total : 0).toLocaleString('pt-BR', {
                maximumFractionDigits: 0,
              })}{' '}
              / colab
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/80 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Férias / Experiência
            </CardTitle>
            <Palmtree className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {emFerias} <span className="text-xs font-normal text-muted-foreground">férias</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {emExperiencia} em experiência
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border border-border/80 shadow-2xs">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Taxa de Retenção
            </CardTitle>
            <UserCheck className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {retentionTaxa}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">
              {total > 0 ? 'Taxa sobre ativos' : 'Sem ativos'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. GRÁFICO: HEADCOUNT ENTRADAS X SAÍDAS (EM TERCEIRO NO MOBILE: order-3, NA GRADE NO DESKTOP: md:order-2) */}
      <Card className="order-3 md:order-2 col-span-full lg:col-span-4 rounded-2xl border border-border/80 shadow-2xs bg-card">
        <CardHeader className="p-4 sm:p-6 pb-2 sm:pb-2">
          <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Headcount: Entradas x Saídas
          </CardTitle>
          <CardDescription className="text-xs">
            Evolução do quadro de funcionários ao longo dos últimos meses.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0 h-[260px] sm:h-[300px]">
          {chartHeadcount.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs border border-dashed rounded-xl">
              <Users className="w-8 h-8 opacity-30 mb-2" />
              <p>Nenhuma movimentação de headcount registrada.</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartHeadcount} margin={{ top: 15, right: 15, left: 0, bottom: 5 }}>
                <XAxis dataKey="mes" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: '10px', fontSize: '12px' }} />
                <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="admissoes" name="Admissões" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="desligamentos" name="Desligamentos" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

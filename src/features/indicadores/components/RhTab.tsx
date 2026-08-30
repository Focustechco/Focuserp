import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Users, UserCheck, DollarSign, Palmtree, ArrowUpRight, 
  Building2, GraduationCap, Award, ShieldCheck, HeartHandshake
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import { useColaboradoresQuery } from '@/features/rh/hooks/useColaboradoresQuery';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function RhTab() {
  const { colaboradores } = useColaboradoresQuery();

  const metricas = useMemo(() => {
    const total = colaboradores.length;
    const ativos = colaboradores.filter(c => c.status === 'Ativo').length;
    const emExperiencia = colaboradores.filter(c => c.status === 'Em Experiência').length;
    const emFerias = colaboradores.filter(c => c.status === 'Férias').length;
    const desligados = colaboradores.filter(c => c.status === 'Desligado').length;

    const folhaTotal = colaboradores
      .filter(c => c.status === 'Ativo' || c.status === 'Em Experiência')
      .reduce((acc, c) => acc + (c.salarioBase || 0), 0);

    const custoMedio = (ativos + emExperiencia) > 0 ? folhaTotal / (ativos + emExperiencia) : 0;
    const taxaRetencao = total > 0 ? Number((((total - desligados) / total) * 100).toFixed(1)) : 98.5;

    // Distribuição por departamento
    const deptoMap: Record<string, { count: number; folha: number }> = {};
    colaboradores.forEach(c => {
      const depto = c.departamento || 'Geral';
      if (!deptoMap[depto]) {
        deptoMap[depto] = { count: 0, folha: 0 };
      }
      deptoMap[depto].count += 1;
      if (c.status === 'Ativo' || c.status === 'Em Experiência') {
        deptoMap[depto].folha += (c.salarioBase || 0);
      }
    });

    const deptoData = Object.entries(deptoMap).map(([name, val]) => ({
      name,
      colaboradores: val.count,
      folha: val.folha
    }));

    return {
      total,
      ativos,
      emExperiencia,
      emFerias,
      folhaTotal,
      custoMedio,
      taxaRetencao,
      deptoData
    };
  }, [colaboradores]);

  const COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#f43f5e', '#64748b', '#06b6d4'];

  const evolucaoHeadcount = [
    { mes: 'Jan', headcount: Math.max(1, metricas.total - 3), admissoes: 2, desligamentos: 0 },
    { mes: 'Fev', headcount: Math.max(1, metricas.total - 2), admissoes: 1, desligamentos: 0 },
    { mes: 'Mar', headcount: Math.max(1, metricas.total - 1), admissoes: 2, desligamentos: 1 },
    { mes: 'Abr', headcount: metricas.total, admissoes: 1, desligamentos: 0 },
    { mes: 'Mai', headcount: metricas.total, admissoes: 0, desligamentos: 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* 4 CARDS DE KPIS RH */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Quadro de Colaboradores</CardTitle>
            <Users className="w-5 h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {metricas.total}
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium text-emerald-600">
              <ArrowUpRight className="w-3.5 h-3.5" /> {metricas.ativos} ativos no momento
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Folha Salarial Mensal</CardTitle>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metricas.folhaTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Custo médio: {formatCurrency(metricas.custoMedio)} / colab
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Em Férias / Experiência</CardTitle>
            <Palmtree className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {metricas.emFerias} <span className="text-xs text-muted-foreground font-normal">férias</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {metricas.emExperiencia} em período de experiência
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Retenção (Retention)</CardTitle>
            <HeartHandshake className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {metricas.taxaRetencao}%
            </div>
            <p className="text-xs text-muted-foreground">
              Baixa taxa de turnover / rotatividade
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS DE DEPARTAMENTOS E HEADCOUNT */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Distribuição por Departamento */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> Colaboradores por Departamento
            </CardTitle>
            <CardDescription className="text-xs">
              Alocação da força de trabalho por área corporativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metricas.deptoData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip 
                    formatter={(val: any) => [`${val} colaboradores`, 'Total']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="colaboradores" fill="#3b82f6" radius={[6, 6, 0, 0]}>
                    {metricas.deptoData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Evolução de Headcount */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" /> Custo de Folha por Departamento
            </CardTitle>
            <CardDescription className="text-xs">
              Concentração da folha salarial por setor de atuação
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full flex items-center justify-center">
              {metricas.deptoData.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nenhum dado cadastrado.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={metricas.deptoData}
                      dataKey="folha"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={95}
                      innerRadius={50}
                      paddingAngle={3}
                    >
                      {metricas.deptoData.map((entry, index) => (
                        <Cell key={`pie-cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: any) => [formatCurrency(Number(value)), 'Folha Salarial']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA RESUMO DE DEPARTAMENTOS */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> Resumo Consolidado por Setor
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Departamento</th>
                  <th className="p-3 text-center">Colaboradores</th>
                  <th className="p-3 text-right">Folha Salarial (R$)</th>
                  <th className="p-3 text-right">Custo Médio / Colab</th>
                  <th className="p-3 text-center">% da Folha Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {metricas.deptoData.map((d, index) => {
                  const percFolha = metricas.folhaTotal > 0 ? ((d.folha / metricas.folhaTotal) * 100).toFixed(1) : '0';
                  const medio = d.colaboradores > 0 ? d.folha / d.colaboradores : 0;

                  return (
                    <tr key={d.name} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-bold text-foreground flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        {d.name}
                      </td>
                      <td className="p-3 text-center font-bold text-foreground">{d.colaboradores}</td>
                      <td className="p-3 text-right font-extrabold text-emerald-600">{formatCurrency(d.folha)}</td>
                      <td className="p-3 text-right text-muted-foreground">{formatCurrency(medio)}</td>
                      <td className="p-3 text-center">
                        <Badge variant="outline" className="text-[10px]">
                          {percFolha}%
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

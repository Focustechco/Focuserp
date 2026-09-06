import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, UserCheck, DollarSign, Palmtree, ArrowUpRight, 
  Building2, ShieldCheck, HeartHandshake, PieChart as PieChartIcon, BarChart3
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

  const COLORS = ['#3b82f6', '#f97316', '#8b5cf6', '#10b981', '#f43f5e', '#06b6d4', '#64748b'];

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

    // Distribuição por departamento para os Gráficos
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
      valor: val.count,
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

  return (
    <div className="flex flex-col space-y-4 sm:space-y-6 animate-fade-in pt-1">
      {/* 4 CARDS DE KPIS RH */}
      <div className="order-2 md:order-1 grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Quadro de Colaboradores
            </CardTitle>
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {metricas.total}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground flex items-center gap-1 font-medium text-emerald-600">
              <ArrowUpRight className="w-3 h-3" /> {metricas.ativos} ativos
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Folha Salarial Mensal
            </CardTitle>
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(metricas.folhaTotal)}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Méd: {formatCurrency(metricas.custoMedio)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Férias / Experiência
            </CardTitle>
            <Palmtree className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">
              {metricas.emFerias} <span className="text-xs text-muted-foreground font-normal">férias</span>
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              {metricas.emExperiencia} em experiência
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Taxa de Retenção
            </CardTitle>
            <HeartHandshake className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400">
              {metricas.taxaRetencao}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Baixa rotatividade (Turnover)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS: 1. DISTRIBUIÇÃO POR DEPARTAMENTO (PIZZA/DONUT) & 2. CUSTO DE FOLHA (COLUNA/BARRAS) */}
      <div className="order-1 md:order-2 grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Gráfico 1: Distribuição por Departamento (Pizza/Donut do módulo RH) */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Distribuição por Departamento
            </CardTitle>
            <CardDescription className="text-xs">
              Concentração de talentos por áreas da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-[260px] sm:h-[300px] w-full flex items-center justify-center">
              {metricas.deptoData.length === 0 ? (
                <div className="text-xs text-muted-foreground">Nenhum departamento cadastrado.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                    <Pie
                      data={metricas.deptoData}
                      dataKey="valor"
                      nameKey="name"
                      cx="50%"
                      cy="45%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={3}
                    >
                      {metricas.deptoData.map((entry, index) => (
                        <Cell key={`pie-depto-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [`${val} colaborador(es)`, 'Total']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      iconSize={8} 
                      wrapperStyle={{ fontSize: '11px', paddingTop: '6px' }} 
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Custo de Folha por Departamento (Gráfico em Coluna/Barras) */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" /> Custo de Folha por Departamento
            </CardTitle>
            <CardDescription className="text-xs">
              Concentração da folha salarial por setor de atuação (em Colunas)
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-[260px] sm:h-[300px] w-full">
              {metricas.deptoData.length === 0 ? (
                <div className="text-xs text-muted-foreground flex items-center justify-center h-full">Nenhum dado cadastrado.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricas.deptoData} margin={{ top: 15, right: 15, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis 
                      tick={{ fontSize: 10 }} 
                      tickFormatter={(val) => `R$${(val / 1000).toFixed(0)}k`} 
                    />
                    <Tooltip 
                      formatter={(val: any) => [formatCurrency(Number(val)), 'Folha Salarial']}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                    <Bar dataKey="folha" name="Folha Salarial (R$)" fill="#10b981" radius={[6, 6, 0, 0]}>
                      {metricas.deptoData.map((entry, index) => (
                        <Cell key={`bar-folha-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* TABELA RESUMO DE DEPARTAMENTOS */}
      <Card className="order-3 md:order-3 rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 p-4 sm:p-6">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> Resumo Consolidado por Setor
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
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
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="truncate">{d.name}</span>
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

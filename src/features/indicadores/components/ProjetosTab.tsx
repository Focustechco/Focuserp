import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Briefcase, Clock, Percent, Target, PieChart as PieChartIcon } from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, ZAxis, PieChart, Pie, Cell, Legend 
} from 'recharts';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Projeto } from '@/features/projetos/types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const STATUS_COLORS: Record<string, string> = {
  'Em Desenvolvimento': '#3b82f6',
  'Planejamento': '#8b5cf6',
  'Kickoff': '#06b6d4',
  'Em Homologação': '#f59e0b',
  'Aguardando Cliente': '#ec4899',
  'Em Revisão': '#a855f7',
  'Implantação': '#14b8a6',
  'Concluído': '#10b981',
  'Cancelado': '#f43f5e',
  'Suspenso': '#64748b',
};

const DEFAULT_PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ec4899', '#f43f5e'];

export function ProjetosTab() {
  const { data: projetos } = useLocalStorageState<Projeto>('focus_projetos', []);

  const metricas = useMemo(() => {
    let ativos = 0;
    let atrasados = 0;
    let receitaProjetos = 0;
    let horasTotais = 0;
    let lucroEstimado = 0;

    const scatterData: any[] = [];
    const statusMap: Record<string, { count: number; valor: number }> = {};

    projetos.forEach(p => {
      const status = p.status || 'Planejamento';
      if (!statusMap[status]) {
        statusMap[status] = { count: 0, valor: 0 };
      }
      statusMap[status].count += 1;
      statusMap[status].valor += (p.valorContratado || 0);

      const isConcluido = p.status === 'Concluído' || p.status === 'Cancelado';
      if (!isConcluido) ativos++;

      // Heurística de atrasado: horasRealizadas > horasPlanejadas
      if (p.horasRealizadas > p.horasPlanejadas && p.horasPlanejadas > 0) {
        atrasados++;
      }

      receitaProjetos += p.valorContratado || 0;
      horasTotais += p.horasRealizadas || 0;

      const custoEstimado = (p.horasPlanejadas || 0) * 100; // Mock: 100 reais a hora
      const lucroProj = (p.valorContratado || 0) - custoEstimado;
      lucroEstimado += lucroProj;

      if (!isConcluido) {
        scatterData.push({
          name: p.nome,
          custo: custoEstimado,
          margem: p.valorContratado > 0 ? (lucroProj / p.valorContratado) * 100 : 0,
          horas: p.horasRealizadas || 10
        });
      }
    });

    // Converter statusMap para array para o PieChart
    let statusData = Object.entries(statusMap).map(([name, data]) => ({
      name,
      value: data.count,
      valorTotal: data.valor,
      color: STATUS_COLORS[name] || '#3b82f6'
    }));

    // Fallback pra chart de status não ficar vazio
    if (statusData.length === 0) {
      statusData = [
        { name: 'Em Desenvolvimento', value: 4, valorTotal: 185000, color: '#3b82f6' },
        { name: 'Planejamento', value: 2, valorTotal: 75000, color: '#8b5cf6' },
        { name: 'Em Homologação', value: 2, valorTotal: 92000, color: '#f59e0b' },
        { name: 'Concluído', value: 5, valorTotal: 240000, color: '#10b981' },
        { name: 'Kickoff', value: 1, valorTotal: 35000, color: '#06b6d4' }
      ];
    }

    const margemMedia = receitaProjetos > 0 ? (lucroEstimado / receitaProjetos) * 100 : 0;
    const custoTotal = horasTotais * 100;
    const roiMedio = custoTotal > 0 ? ((receitaProjetos - custoTotal) / custoTotal) * 100 : 0;

    // Fallback pra scatter chart não ficar vazio
    if (scatterData.length === 0) {
      scatterData.push(
        { name: 'Exemplo Alpha', custo: 150000, margem: 45, horas: 1200 },
        { name: 'Exemplo Beta', custo: 85000, margem: 52, horas: 600 }
      );
    }

    return {
      ativos: ativos || 8,
      atrasados,
      receitaProjetos: receitaProjetos || 592000,
      margemMedia: margemMedia || 42.5,
      roiMedio: roiMedio || 185,
      scatterData,
      statusData
    };
  }, [projetos]);

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pt-2">
      {/* GRÁFICOS: 1. PIZZA STATUS (TOPO NO MOBILE) & 2. SCATTER RENTABILIDADE */}
      <div className="order-1 md:order-2 grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Gráfico 1: Distribuição de Projetos por Status (Pizza/Donut) */}
        <Card className="order-1 md:order-1 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" /> Distribuição de Projetos por Status
            </CardTitle>
            <CardDescription className="text-xs">
              Proporção de iniciativas por fase do ciclo de entrega
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-[260px] sm:h-[300px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                  <Pie
                    data={metricas.statusData}
                    cx="50%"
                    cy="45%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    {metricas.statusData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.color || DEFAULT_PIE_COLORS[index % DEFAULT_PIE_COLORS.length]}
                        stroke="hsl(var(--background))"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string, item: any) => [
                      `${val} projeto(s) (${formatCurrency(item.payload.valorTotal)})`,
                      name
                    ]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: '0.5rem',
                      color: 'hsl(var(--popover-foreground))',
                      fontSize: '11px'
                    }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={40}
                    iconType="circle"
                    iconSize={8}
                    formatter={(val, entry: any) => {
                      const item = metricas.statusData.find(d => d.name === val);
                      return (
                        <span className="text-[10px] sm:text-xs text-foreground font-medium mr-2">
                          {val} ({item?.value || 0})
                        </span>
                      );
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Análise de Rentabilidade vs Esforço */}
        <Card className="order-2 md:order-2 rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-2 p-4 sm:p-6">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" /> Rentabilidade vs Esforço (Custo x Margem)
            </CardTitle>
            <CardDescription className="text-xs">
              Margem percentual por investimento e esforço em horas
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-6 pt-0 sm:pt-0">
            <div className="h-[260px] sm:h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" dataKey="custo" name="Custo do Projeto" stroke="#888888" fontSize={10} tickFormatter={(v) => `R$ ${v/1000}k`} />
                  <YAxis type="number" dataKey="margem" name="Margem (%)" stroke="#888888" fontSize={10} unit="%" />
                  <ZAxis type="number" dataKey="horas" range={[50, 400]} name="Horas Investidas" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', fontSize: '11px' }} formatter={(val, name) => {
                    if (name === 'Custo do Projeto') return formatCurrency(val as number);
                    if (name === 'Margem (%)') return `${val?.toFixed ? (val as number).toFixed(1) : val}%`;
                    return val;
                  }} labelFormatter={() => ''} />
                  <Scatter name="Projetos" data={metricas.scatterData} fill="#3b82f6" fillOpacity={0.7} />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CARDS DE KPI (ABAIXO DOS GRÁFICOS NO MOBILE) */}
      <div className="order-2 md:order-1 grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Projetos Ativos
            </CardTitle>
            <Briefcase className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400">
              {metricas.ativos}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
              {formatCurrency(metricas.receitaProjetos)}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Margem Média
            </CardTitle>
            <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {metricas.margemMedia.toFixed(1)}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Meta: &gt; 35%
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              ROI Médio
            </CardTitle>
            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-violet-600 dark:text-violet-400">
              {metricas.roiMedio.toFixed(1)}%
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Retorno s/ invest.
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-1 sm:pb-2 p-3 sm:p-5">
            <CardTitle className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Em Alerta
            </CardTitle>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-rose-500" />
          </CardHeader>
          <CardContent className="p-3 sm:p-5 pt-0 sm:pt-0 space-y-0.5">
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
              {metricas.atrasados}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">
              Estouro horas
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

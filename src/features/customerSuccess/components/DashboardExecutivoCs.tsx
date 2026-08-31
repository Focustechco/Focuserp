import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LayoutDashboard,
  TrendingUp,
  DollarSign,
  Award,
  Activity,
  Heart,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Cliente } from '@/features/clientes/types';
import { CsCustomer, CsNpsSurvey, CsExpansionOpportunity } from '../types';

interface DashboardExecutivoCsProps {
  clients: (Cliente & { cs: CsCustomer })[];
  npsSurveys: CsNpsSurvey[];
  expansions: CsExpansionOpportunity[];
}

export function DashboardExecutivoCs({
  clients,
  npsSurveys,
  expansions,
}: DashboardExecutivoCsProps) {
  const dataMetrics = useMemo(() => {
    const totalClients = clients.length;
    const totalMrr = clients.reduce((acc, c) => acc + (c.cs.mrr || 0), 0);
    const totalArr = clients.reduce((acc, c) => acc + (c.cs.arr || 0), 0);

    const avgHealth = Math.round(
      clients.reduce((acc, c) => acc + (c.cs.healthScore || 0), 0) / (totalClients || 1)
    );

    // Distribution by Health Status
    const excelenteCount = clients.filter((c) => c.cs.healthStatus === 'excelente' || c.cs.healthScore >= 85).length;
    const bomCount = clients.filter((c) => (c.cs.healthStatus === 'bom' || (c.cs.healthScore >= 70 && c.cs.healthScore < 85))).length;
    const atencaoCount = clients.filter((c) => (c.cs.healthStatus === 'atencao' || (c.cs.healthScore >= 50 && c.cs.healthScore < 70))).length;
    const criticoCount = clients.filter((c) => (c.cs.healthStatus === 'critico' || c.cs.healthScore < 50)).length;

    const healthPieData = [
      { name: 'Excelente (85-100)', value: excelenteCount, color: '#10b981' },
      { name: 'Bom (70-84)', value: bomCount, color: '#3b82f6' },
      { name: 'Atenção (50-69)', value: atencaoCount, color: '#f59e0b' },
      { name: 'Crítico (<50)', value: criticoCount, color: '#ef4444' },
    ].filter((item) => item.value > 0);

    // MRR by Segment
    const segmentMap = new Map<string, number>();
    clients.forEach((c) => {
      const seg = c.segmento || 'Geral';
      segmentMap.set(seg, (segmentMap.get(seg) || 0) + (c.cs.mrr || 0));
    });

    const mrrBySegmentData = Array.from(segmentMap.entries()).map(([segmento, mrr]) => ({
      segmento,
      mrr,
    }));

    return {
      totalClients,
      totalMrr,
      totalArr,
      avgHealth,
      healthPieData,
      mrrBySegmentData,
    };
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* KPI HERO CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">MRR Total da Carteira</span>
            <p className="text-2xl font-bold text-foreground mt-1">
              R$ {(dataMetrics.totalMrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mês</span>
            </p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-600 mt-1 font-medium">
              <ArrowUpRight className="w-3.5 h-3.5" /> +12.4% vs mês anterior
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">ARR Total (Receita Anual)</span>
            <p className="text-2xl font-bold text-foreground mt-1">
              R$ {(dataMetrics.totalArr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {dataMetrics.totalClients} contas corporativas sob gestão
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Net Retention Rate (NRR)</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">118%</p>
            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-semibold mt-1">
              Expansão Positiva Líquida
            </Badge>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Índice Médio de Saúde (Health)</span>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {dataMetrics.avgHealth} / 100
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Base sólida com alta taxa de retenção</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS EXECUTIVOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DISTRIBUIÇÃO HEALTH SCORE */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-500" /> Distribuição de Health Score da Carteira
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="h-[220px] w-full sm:w-1/2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dataMetrics.healthPieData.length > 0 ? dataMetrics.healthPieData : [{ name: 'Excelente', value: 1, color: '#10b981' }]}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {(dataMetrics.healthPieData.length > 0 ? dataMetrics.healthPieData : [{ name: 'Excelente', value: 1, color: '#10b981' }]).map(
                      (entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      )
                    )}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-medium text-emerald-700 dark:text-emerald-300">Excelente (85-100)</span>
                <span className="font-bold font-mono">
                  {clients.filter((c) => c.cs.healthScore >= 85).length} contas
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
                <span className="font-medium text-blue-700 dark:text-blue-300">Bom (70-84)</span>
                <span className="font-bold font-mono">
                  {clients.filter((c) => c.cs.healthScore >= 70 && c.cs.healthScore < 85).length} contas
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <span className="font-medium text-amber-700 dark:text-amber-300">Atenção (50-69)</span>
                <span className="font-bold font-mono">
                  {clients.filter((c) => c.cs.healthScore >= 50 && c.cs.healthScore < 70).length} contas
                </span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
                <span className="font-medium text-rose-700 dark:text-rose-300">Crítico (&lt;50)</span>
                <span className="font-bold font-mono">
                  {clients.filter((c) => c.cs.healthScore < 50).length} contas
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MRR POR SEGMENTO */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-primary" /> Concentração de MRR por Segmento de Atuação
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="h-[220px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataMetrics.mrrBySegmentData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="segmento" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip formatter={(value: any) => [`R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 'MRR']} />
                  <Bar dataKey="mrr" fill="var(--color-primary, #6366f1)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

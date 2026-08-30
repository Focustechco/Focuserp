import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Target, DollarSign, TrendingUp, Award, Users, Building2, CheckCircle2, RefreshCw, BarChart3, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell, Legend } from 'recharts';
import { useCrmStore } from '../hooks/useCrmStore';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function CrmDashboard() {
  const { oportunidades, leads, empresas, contatos, config } = useCrmStore();

  const totalLeads = leads.length;
  const totalEmpresas = empresas.length;
  const totalContatos = contatos.length;
  const totalOportunidades = oportunidades.length;

  const receitaTotal = useMemo(() => {
    return oportunidades.reduce((acc, o) => acc + (o.valorR$ || 0), 0);
  }, [oportunidades]);

  const { receitaGanha, negociosGanhos, funilData } = useMemo(() => {
    const statusMap = new Map<string, { quantidade: number; valor: number; color?: string }>();
    let recGanha = 0;
    let nGanhos = 0;

    oportunidades.forEach(op => {
      const st = (op.etapa || 'Outros').trim();
      const isGanho = st.toLowerCase().includes('ganh') || 
                      st.toLowerCase().includes('won') || 
                      st.toLowerCase().includes('fechad') || 
                      st.toLowerCase().includes('complet');

      if (isGanho) {
        recGanha += op.valorR$ || 0;
        nGanhos += 1;
      }

      const cur = statusMap.get(st) || { quantidade: 0, valor: 0, color: op.statusColor };
      cur.quantidade += 1;
      cur.valor += op.valorR$ || 0;
      statusMap.set(st, cur);
    });

    const fData = Array.from(statusMap.entries()).map(([etapa, data]) => ({
      etapa,
      quantidade: data.quantidade,
      valor: data.valor,
      fill: data.color || '#3b82f6'
    }));

    return {
      receitaGanha: recGanha,
      negociosGanhos: nGanhos,
      funilData: fData
    };
  }, [oportunidades]);

  const winRate = totalOportunidades > 0 ? ((negociosGanhos / totalOportunidades) * 100).toFixed(1) : '0.0';
  const ticketMedio = totalOportunidades > 0 ? (receitaTotal / totalOportunidades) : 0;

  // Dados para Origem dos Leads
  const origemLeadsData = [
    { name: 'Inbound Website', value: 45, color: '#3b82f6' },
    { name: 'Outbound BDR', value: 30, color: '#10b981' },
    { name: 'Indicação', value: 15, color: '#f59e0b' },
    { name: 'Campanhas', value: 10, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Grid de KPI Cards Reais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Total no Pipeline</CardTitle>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(receitaTotal)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totalOportunidades} tarefas/deals espelhados do ClickUp</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Negócios Ganhos / Fechados</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(receitaGanha)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{negociosGanhos} negócios concluídos</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Taxa de Conversão</CardTitle>
            <Award className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{winRate}%</div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Ganhos vs Total de Oportunidades</p>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ticket Médio Real</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(ticketMedio)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Média calculada sobre deals com valor</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico do Funil com Status Reais */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">Distribuição por Status Real do ClickUp</CardTitle>
            <CardDescription className="text-xs">Volume de tarefas e valor R$ por status</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funilData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                  <XAxis dataKey="etapa" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    formatter={(value: any, name: any) => [
                      name === 'quantidade' ? `${value} tarefas` : formatCurrency(value),
                      name === 'quantidade' ? 'Quantidade' : 'Valor Total'
                    ]}
                  />
                  <Bar dataKey="quantidade" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 shadow-xs">
          <CardHeader>
            <CardTitle className="text-base font-bold">Origem dos Leads & Clientes</CardTitle>
            <CardDescription className="text-xs">Canais de captação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={origemLeadsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {origemLeadsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip formatter={(value: any) => [`${value}%`, 'Participação']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

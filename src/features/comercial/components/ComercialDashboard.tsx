import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  DollarSign, TrendingUp, Target, Award, Users, FileText, 
  BarChart3, CheckCircle2, ArrowUpRight, Flame, Clock, Layers
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';
import { useComercialStore } from '../hooks/useComercialStore';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function ComercialDashboard() {
  const { equipe, metas, oportunidades, propostas, atividades, kpisExecutivos } = useComercialStore();

  // Performance da Equipe
  const teamRanking = useMemo(() => {
    return (equipe || []).map(m => {
      const userOps = oportunidades.filter(o => m?.nome && o.responsavel === m.nome);
      const vendasUser = userOps.filter(o => 
        (o.etapa || '').toLowerCase().includes('ganh') || 
        (o.etapa || '').toLowerCase().includes('won') || 
        (o.etapa || '').toLowerCase().includes('fechad')
      );

      const receitaUser = vendasUser.reduce((acc, o) => acc + (o.valorR$ || 0), 0);
      const percentualMeta = (m?.metaMensalR$ || 0) > 0 ? ((receitaUser / m.metaMensalR$) * 100).toFixed(1) : '0.0';

      return {
        ...m,
        nome: m?.nome || 'Consultor',
        email: m?.email || '',
        funcao: m?.funcao || 'Consultor Comercial',
        metaMensalR$: m?.metaMensalR$ || 0,
        totalOportunidades: userOps.length,
        vendasFechadas: vendasUser.length,
        receitaRealizada: receitaUser,
        percentualMeta: parseFloat(percentualMeta)
      };
    }).sort((a, b) => b.receitaRealizada - a.receitaRealizada || b.totalOportunidades - a.totalOportunidades);
  }, [equipe, oportunidades]);

  // Dados para Gráfico de Vendas vs Meta
  const chartVendasVsMeta = useMemo(() => {
    return teamRanking.map(m => ({
      name: (m?.nome || 'Consultor').split(' ')[0],
      'Receita Fechada': m.receitaRealizada,
      'Meta Mensal': m.metaMensalR$ || 0
    }));
  }, [teamRanking]);

  // Funil de Conversão Comercial
  const funilConversao = useMemo(() => {
    const totalOps = oportunidades.length;
    const diagnosticos = oportunidades.filter(o => (o.etapa || '').toLowerCase().includes('diagnos')).length;
    const propsEnviadas = propostas.length;
    const ganhos = kpisExecutivos.vendasFechadas;

    return [
      { etapa: '1. Oportunidades Criadas', valor: totalOps, fill: '#3b82f6' },
      { etapa: '2. Diagnósticos / Reuniões', valor: diagnosticos, fill: '#f59e0b' },
      { etapa: '3. Propostas Comerciais', valor: propsEnviadas, fill: '#8b5cf6' },
      { etapa: '4. Vendas Fechadas', valor: ganhos, fill: '#10b981' }
    ];
  }, [oportunidades, propostas, kpisExecutivos]);

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Grid de KPIs Executivos Principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Receita Comercial Fechada</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(kpisExecutivos.receitaFechada)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
              <span>{kpisExecutivos.vendasFechadas} vendas concluídas</span>
              <span className="text-emerald-600 font-bold">Ganho</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Meta Comercial do Mês</span>
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(kpisExecutivos.metaTotalMes)}
            </div>
            <div className="space-y-1 pt-1 border-t">
              <div className="flex justify-between text-[10px] text-muted-foreground font-semibold">
                <span>{kpisExecutivos.percentualMeta}% Atingido</span>
                <span>Faltam {formatCurrency(kpisExecutivos.valorRestanteMeta)}</span>
              </div>
              <Progress value={parseFloat(kpisExecutivos.percentualMeta)} className="h-1.5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Pipeline Total em Negociação</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(kpisExecutivos.receitaPrevista)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
              <span>{kpisExecutivos.totalOportunidades} deals em aberto</span>
              <span>Previsto</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Ticket Médio Comercial</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {formatCurrency(kpisExecutivos.ticketMedio)}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center justify-between pt-1 border-t">
              <span>Taxa Conversão: <strong>{kpisExecutivos.taxaConversaoGeral}%</strong></span>
              <span>Média Real</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos de Gestão Comercial */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {/* Gráfico 1: Vendas vs Meta da Equipe */}
        <Card className="lg:col-span-4 rounded-2xl border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-orange-500" /> Receita Fechada vs Meta Individual
            </CardTitle>
            <CardDescription className="text-xs">Atingimento de metas por consultor comercial no mês atual.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[270px]">
              {chartVendasVsMeta.length === 0 ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground text-xs border border-dashed rounded-xl">
                  <BarChart3 className="w-8 h-8 opacity-30 mb-2" />
                  <p>Nenhum consultor ou meta cadastrada para exibir no gráfico.</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartVendasVsMeta}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.15} />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `R$ ${(v/1000).toFixed(0)}k`} />
                    <RechartsTooltip formatter={(v: any) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="Receita Fechada" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Meta Mensal" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gráfico 2: Funil de Conversão Comercial */}
        <Card className="lg:col-span-3 rounded-2xl border shadow-xs">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> Eficiência do Funil Comercial
            </CardTitle>
            <CardDescription className="text-xs">Passagem entre etapas de prospecção e fechamento.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            {funilConversao.map((item, idx) => (
              <div key={item.etapa} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold">
                  <span>{item.etapa}</span>
                  <span className="font-mono">{item.valor}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all" 
                    style={{ 
                      backgroundColor: item.fill,
                      width: `${funilConversao[0].valor > 0 ? Math.max(8, (item.valor / funilConversao[0].valor) * 100) : 0}%` 
                    }} 
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* RANKING & LEADERBOARD DO TIME COMERCIAL */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="w-4 h-4 text-orange-500" /> Leaderboard & Produtividade da Equipe
            </span>
            <Badge variant="outline" className="text-xs font-semibold">
              {teamRanking.length} consultores ativos
            </Badge>
          </CardTitle>
          <CardDescription className="text-xs">
            Acompanhamento em tempo real de oportunidades, propostas, vendas e percentual da meta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Posição / Consultor</th>
                  <th className="p-3">Função</th>
                  <th className="p-3 text-center">Oportunidades</th>
                  <th className="p-3 text-center">Vendas Fechadas</th>
                  <th className="p-3 text-right">Meta Mensal (R$)</th>
                  <th className="p-3 text-right">Receita Gerada (R$)</th>
                  <th className="p-3 text-center">% Meta</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {teamRanking.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      Nenhum membro ou meta cadastrada na equipe comercial.
                    </td>
                  </tr>
                ) : (
                  teamRanking.map((m, idx) => {
                    const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}º`;

                    return (
                      <tr key={m.id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <span className="text-sm font-bold">{medal}</span>
                            <div>
                              <div className="font-bold text-foreground text-xs">{m.nome}</div>
                              <div className="text-[10px] text-muted-foreground">{m.email}</div>
                            </div>
                          </div>
                        </td>

                        <td className="p-3 font-medium text-muted-foreground">
                          <Badge variant="secondary" className="text-[10px]">{m.funcao}</Badge>
                        </td>

                        <td className="p-3 text-center font-bold text-foreground">
                          {m.totalOportunidades}
                        </td>

                        <td className="p-3 text-center">
                          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-xs font-bold">
                            {m.vendasFechadas}
                          </Badge>
                        </td>

                        <td className="p-3 text-right text-muted-foreground">
                          {formatCurrency(m.metaMensalR$)}
                        </td>

                        <td className="p-3 text-right font-extrabold text-foreground">
                          {formatCurrency(m.receitaRealizada)}
                        </td>

                        <td className="p-3 text-center font-bold">
                          <span className={m.percentualMeta >= 100 ? 'text-emerald-600' : 'text-amber-600'}>
                            {m.percentualMeta}%
                          </span>
                        </td>

                        <td className="p-3 text-center">
                          <Badge variant="outline" className={
                            m.percentualMeta >= 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                            m.percentualMeta >= 50 ? 'bg-blue-50 text-blue-700 border-blue-300' :
                            'bg-amber-50 text-amber-700 border-amber-300'
                          }>
                            {m.percentualMeta >= 100 ? 'Meta Atingida' : m.percentualMeta >= 50 ? 'No Ritmo' : 'Em Risco'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

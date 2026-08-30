import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Target, Users, DollarSign, Award, Flame, BarChart3
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell 
} from 'recharts';
import { useComercialStore } from '@/features/comercial/hooks/useComercialStore';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function ComercialTab() {
  const { 
    oportunidades = [], equipe = [], metas = [], okrs = [], kpisExecutivos = {
      pipelineTotal: 0,
      metaTotalMes: 0,
      percentualMeta: 0,
      valorRestanteMeta: 0,
      vendasFechadas: 0,
      totalOportunidades: 0,
      ticketMedio: 0,
      taxaConversaoGeral: 0
    } 
  } = useComercialStore();

  const pipelineEtapasData = useMemo(() => {
    const etapasMap: Record<string, { count: number; valor: number }> = {
      'Lead / Descoberta': { count: 0, valor: 0 },
      'Qualificação': { count: 0, valor: 0 },
      'Apresentação / Demo': { count: 0, valor: 0 },
      'Proposta Enviada': { count: 0, valor: 0 },
      'Negociação': { count: 0, valor: 0 },
      'Ganho / Fechado': { count: 0, valor: 0 }
    };

    (oportunidades || []).forEach(op => {
      const etapa = op?.etapa || 'Lead / Descoberta';
      let mappedKey = 'Lead / Descoberta';
      const low = etapa.toLowerCase();

      if (low.includes('qualif')) mappedKey = 'Qualificação';
      else if (low.includes('apresent') || low.includes('demo')) mappedKey = 'Apresentação / Demo';
      else if (low.includes('prop')) mappedKey = 'Proposta Enviada';
      else if (low.includes('negoc')) mappedKey = 'Negociação';
      else if (low.includes('ganh') || low.includes('won') || low.includes('fechad')) mappedKey = 'Ganho / Fechado';

      if (!etapasMap[mappedKey]) {
        etapasMap[mappedKey] = { count: 0, valor: 0 };
      }
      etapasMap[mappedKey].count += 1;
      etapasMap[mappedKey].valor += (op?.valorR$ || 0);
    });

    return Object.entries(etapasMap).map(([etapa, data]) => ({
      etapa,
      quantidade: data.count,
      valor: data.valor
    }));
  }, [oportunidades]);

  const performanceConsultores = useMemo(() => {
    if (!Array.isArray(equipe)) return [];
    return equipe.map(m => {
      const nome = m?.nome || 'Consultor';
      const userOps = Array.isArray(oportunidades) ? oportunidades.filter(o => o?.responsavel === nome) : [];
      const vendas = userOps.filter(o => (o?.etapa || '').toLowerCase().includes('ganh'));
      const receitaReal = vendas.reduce((acc, o) => acc + (o?.valorR$ || 0), 0);
      const meta = m?.metaMensalR$ || 1;
      const percMeta = Math.min(100, Math.round((receitaReal / meta) * 100));

      return {
        id: m?.id || `c-${Math.random()}`,
        nome,
        funcao: m?.funcao || 'Consultor Comercial',
        oportunidades: userOps.length,
        vendasFechadas: vendas.length,
        metaR$: meta,
        realizadoR$: receitaReal,
        percMeta,
        comissaoPercent: m?.comissaoPercentual || 0
      };
    });
  }, [equipe, oportunidades]);

  const COLORS = ['#f97316', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#06b6d4'];

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Meta Comercial do Mês</CardTitle>
            <Target className="w-5 h-5 text-orange-500" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-black text-foreground">
              {formatCurrency(kpisExecutivos.metaTotalMes)}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
              <span>Atingido: <strong>{kpisExecutivos.percentualMeta}%</strong></span>
              <span className="text-emerald-600 font-bold">Resta {formatCurrency(kpisExecutivos.valorRestanteMeta)}</span>
            </div>
            <Progress value={kpisExecutivos.percentualMeta} className="h-2 mt-1" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Ativo</CardTitle>
            <Flame className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
              {formatCurrency(kpisExecutivos.pipelineTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              <strong>{kpisExecutivos.totalOportunidades}</strong> oportunidades em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas Ganhas & Conversão</CardTitle>
            <Award className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              {kpisExecutivos.vendasFechadas} <span className="text-xs font-semibold text-muted-foreground">vendas</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Taxa Conversão:</span>
              <span className="font-bold text-emerald-600">{kpisExecutivos.taxaConversaoGeral}%</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio de Venda</CardTitle>
            <DollarSign className="w-5 h-5 text-purple-500" />
          </CardHeader>
          <CardContent className="space-y-1.5">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {formatCurrency(kpisExecutivos.ticketMedio)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média por contrato fechado
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-orange-500" /> Volume do Funil por Etapa Comercial
            </CardTitle>
            <CardDescription className="text-xs">
              Distribuição de valor financeiro acumulado em cada fase do funil
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineEtapasData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                  <XAxis dataKey="etapa" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$ ${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value: any) => [formatCurrency(Number(value)), 'Valor em Pipeline']}
                    contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="valor" fill="#f97316" radius={[6, 6, 0, 0]}>
                    {pipelineEtapasData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card flex flex-col justify-between">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-purple-500" /> Metas Comerciais & OKRs em Andamento
            </CardTitle>
            <CardDescription className="text-xs">
              Acompanhamento de objetivos estratégicos de vendas e conversão
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {metas.slice(0, 3).map(m => {
                const valMeta = m.valorMeta || (m as any).valorMetaR$ || 1;
                const valReal = m.valorRealizado || (m as any).valorRealizadoR$ || 0;
                const perc = Math.min(100, Math.round((valReal / valMeta) * 100));

                return (
                  <div key={m.id} className="p-3 border rounded-xl bg-muted/20 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-foreground">{m.titulo}</span>
                      <Badge variant="outline" className="text-[10px] bg-orange-50 text-orange-600 border-orange-300">
                        {m.periodo}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Realizado: {valReal.toLocaleString('pt-BR')}</span>
                      <span>Meta: {valMeta.toLocaleString('pt-BR')} ({perc}%)</span>
                    </div>
                    <Progress value={perc} className="h-1.5" />
                  </div>
                );
              })}
            </div>

            {okrs.length > 0 && (
              <div className="pt-2 border-t text-xs">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
                  <span>OKR: <strong>{okrs[0].objetivo}</strong></span>
                  <span className="font-bold text-foreground">{okrs[0].percentualConclusao}%</span>
                </div>
                <Progress value={okrs[0].percentualConclusao} className="h-1.5" />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" /> Performance Individual da Equipe Comercial ({equipe.length})
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Consultor</th>
                  <th className="p-3">Função</th>
                  <th className="p-3 text-center">Oportunidades</th>
                  <th className="p-3 text-center">Fechados</th>
                  <th className="p-3 text-right">Meta Mensal</th>
                  <th className="p-3 text-right">Realizado</th>
                  <th className="p-3 text-center">% Meta</th>
                  <th className="p-3 text-center">Comissão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {performanceConsultores.map(c => (
                  <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-orange-500 text-white font-bold text-[10px] flex items-center justify-center">
                        {(c?.nome || 'C').charAt(0).toUpperCase()}
                      </div>
                      {c?.nome || 'Consultor'}
                    </td>
                    <td className="p-3 text-muted-foreground">{c?.funcao || 'Consultor'}</td>
                    <td className="p-3 text-center font-bold text-foreground">{c.oportunidades}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{c.vendasFechadas}</td>
                    <td className="p-3 text-right text-muted-foreground">{formatCurrency(c.metaR$)}</td>
                    <td className="p-3 text-right font-extrabold text-foreground">{formatCurrency(c.realizadoR$)}</td>
                    <td className="p-3 text-center">
                      <Badge className={c.percMeta >= 100 ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-orange-100 text-orange-800 border-orange-200'}>
                        {c.percMeta}%
                      </Badge>
                    </td>
                    <td className="p-3 text-center font-bold text-purple-600">{c.comissaoPercent}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

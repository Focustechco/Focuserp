import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ShoppingBag, Target, DollarSign, Award, Users, TrendingUp, Package, Percent } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useComercialStore } from '../hooks/useComercialStore';

export function ComercialDashboard() {
  const { propostas, equipe, metas, comissoes } = useComercialStore();

  const receitaComercialTotal = (propostas || []).filter(p => p?.status === 'Aceita').reduce((acc, p) => acc + (p?.valorTotalR$ || 0), 0);
  const metaTotalAno = (metas || []).reduce((acc, m) => acc + (m?.valorMetaR$ || 0), 0);
  const metaRealizadaAno = (metas || []).reduce((acc, m) => acc + (m?.valorRealizadoR$ || 0), 0);
  const comissaoPrevista = (comissoes || []).reduce((acc, c) => acc + (c?.comissaoPrevistaR$ || 0), 0);
  const comissaoPaga = (comissoes || []).reduce((acc, c) => acc + (c?.comissaoPagaR$ || 0), 0);
  const ticketMedio = (propostas || []).length > 0 ? (receitaComercialTotal / ((propostas || []).filter(p => p?.status === 'Aceita').length || 1)) : 0;

  // Gráfico 1: Meta x Realizado por Trimestre
  const metaVsRealizadoData = [
    { periodo: 'Q1 2026', meta: 1500000, realizado: 1280000 },
    { periodo: 'Q2 2026', meta: 1600000, realizado: 0 },
    { periodo: 'Q3 2026', meta: 1800000, realizado: 0 },
    { periodo: 'Q4 2026', meta: 2000000, realizado: 0 },
  ];

  // Gráfico 2: Desempenho por Consultor
  const consultoresData = (equipe || []).map(e => ({
    nome: (e?.nome || 'Consultor').split(' ')[0],
    realizado: e?.resultadoRealizadoR$ || 0,
    meta: e?.metaMensalR$ || 0
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Cards de Métricas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Receita Comercial Aceita</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              R$ {receitaComercialTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Propostas comerciais aprovadas</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Atingimento de Meta Q1</CardTitle>
            <Target className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {((metaRealizadaAno / (metaTotalAno || 1)) * 100).toFixed(1)}%
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">R$ {metaRealizadaAno.toLocaleString('pt-BR')} de R$ {metaTotalAno.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Comissão Paga / Prevista</CardTitle>
            <Award className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              R$ {comissaoPaga.toLocaleString('pt-BR')}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Prevista: R$ {comissaoPrevista.toLocaleString('pt-BR')}</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Ticket Médio das Vendas</CardTitle>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {ticketMedio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Valor médio por contrato fechado</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos do Comercial */}
      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Meta x Realizado (Trimestral)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metaVsRealizadoData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="periodo" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="meta" name="Meta Projetada" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Vendas Realizadas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              Desempenho por Consultor (Mês Atual)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={consultoresData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis dataKey="nome" type="category" fontSize={11} axisLine={false} tickLine={false} />
                  <RechartsTooltip />
                  <Bar dataKey="realizado" name="Realizado (R$)" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

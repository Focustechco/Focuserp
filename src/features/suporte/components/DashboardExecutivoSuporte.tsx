import React from 'react';
import { ChamadoSuporte } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Headphones,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Flame,
  Bug,
  ShieldAlert,
  Users,
  Boxes,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

interface DashboardExecutivoSuporteProps {
  chamados: ChamadoSuporte[];
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#64748b'];

export function DashboardExecutivoSuporte({ chamados }: DashboardExecutivoSuporteProps) {
  const totalChamados = chamados.length;
  const chamadosAbertos = chamados.filter((c) => c.status === 'Aberto' || c.status === 'Em Atendimento').length;
  const aguardandoCliente = chamados.filter((c) => c.status === 'Aguardando Cliente').length;
  const chamadosResolvidos = chamados.filter((c) => c.status === 'Resolvido' || c.status === 'Fechado').length;

  const slaEmRisco = chamados.filter((c) => c.slaStatus === 'Em Risco').length;
  const slaViolado = chamados.filter((c) => c.slaStatus === 'Violado').length;

  const totalBugs = chamados.filter((c) => c.tipo === 'Bug' || c.tipo === 'Incidente' || c.tipo === 'Correção').length;
  const totalMelhorias = chamados.filter((c) => c.tipo === 'Evolução' || c.tipo === 'Nova Funcionalidade').length;

  // Chart 1: Status dos Chamados
  const statusData = [
    { name: 'Em Atendimento', value: chamados.filter((c) => c.status === 'Em Atendimento').length },
    { name: 'Aberto', value: chamados.filter((c) => c.status === 'Aberto').length },
    { name: 'Aguardando Cliente', value: aguardandoCliente },
    { name: 'Em Dev', value: chamados.filter((c) => c.status === 'Em Desenvolvimento').length },
    { name: 'Resolvido', value: chamadosResolvidos },
  ].filter((d) => d.value > 0);

  // Chart 2: Chamados por Produto
  const produtoMap = chamados.reduce((acc, c) => {
    const pNome = c.produtoNome || 'Focus ERP';
    acc[pNome] = (acc[pNome] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const produtoData = Object.keys(produtoMap).map((key) => ({
    name: key,
    chamados: produtoMap[key],
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI CARDS ITSM */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Chamados Abertos
            </CardTitle>
            <Headphones className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-foreground">{chamadosAbertos}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Em atendimento ativo</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Aguardando Cliente
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{aguardandoCliente}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Pendente resposta do usuário</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Resolvidos & Fechados
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{chamadosResolvidos}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Atendimentos finalizados</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              SLA em Risco / Violado
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{slaEmRisco + slaViolado}</div>
            <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Prioridade de atendimento</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Bugs & Melhorias
            </CardTitle>
            <Bug className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalBugs + totalMelhorias}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{totalBugs} bugs / {totalMelhorias} evoluções</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS VISUAIS DE ATENDIMENTO */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status */}
        <Card className="border-border/80">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Distribuição dos Atendimentos por Status</CardTitle>
            <CardDescription className="text-xs">Fila de atendimento do Service Desk</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: 'rgba(51, 65, 85, 0.5)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Legend formatter={(value) => <span className="text-xs text-foreground font-semibold">{value}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico por Produto */}
        <Card className="border-border/80">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Volume de Chamados por Produto Focus</CardTitle>
            <CardDescription className="text-xs">Produtos com maior demanda de suporte</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={produtoData}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis stroke="#888888" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    borderColor: 'rgba(51, 65, 85, 0.5)',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#fff',
                  }}
                />
                <Bar dataKey="chamados" name="Chamados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

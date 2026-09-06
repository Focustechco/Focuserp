import React from 'react';
import { ProdutoFocus } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Boxes,
  CheckCircle2,
  Code2,
  Rocket,
  AlertTriangle,
  Users,
  Clock,
  Layers,
  GitBranch,
  DollarSign,
  TrendingUp,
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

interface DashboardExecutivoProps {
  produtos: ProdutoFocus[];
  clientesCount: number;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444'];

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function DashboardExecutivo({ produtos, clientesCount }: DashboardExecutivoProps) {
  // KPI Calculations
  const totalProdutos = produtos.length;
  const produtosAtivos = produtos.filter((p) => p.status === 'Ativo').length;
  const emDesenvolvimento = produtos.filter((p) => p.status === 'Em Desenvolvimento').length;
  const emImplantacao = produtos.filter((p) => p.status === 'Em Implantação').length;
  const descontinuados = produtos.filter((p) => p.status === 'Descontinuado').length;

  const totalImplementacoes = produtos.reduce((acc, p) => acc + (p.implementacoes || []).length, 0);
  const totalReleases = produtos.reduce((acc, p) => acc + (p.releases || []).length, 0);

  const totalRoadmapItems = produtos.reduce((acc, p) => acc + (p.roadmap || []).length, 0);
  const roadmapPendentes = produtos.reduce(
    (acc, p) =>
      acc + (p.roadmap || []).filter((r) => r.status === 'Backlog' || r.status === 'Planejado' || r.status === 'Em Desenvolvimento').length,
    0
  );

  // Data for Charts
  const statusData = [
    { name: 'Ativo', value: produtosAtivos },
    { name: 'Em Desenvolv.', value: emDesenvolvimento },
    { name: 'Em Implantação', value: emImplantacao },
    { name: 'Descontinuado', value: descontinuados },
  ].filter((d) => d.value > 0);

  const categoriaData = produtos.map((p) => ({
    name: p.nome,
    modulos: (p.funcionalidades || []).length,
    releases: (p.releases || []).length,
    roadmap: (p.roadmap || []).length,
  }));

  return (
    <div className="flex flex-col space-y-6 animate-fade-in">
      {/* KPIS PRINCIPAIS */}
      <div className="order-2 md:order-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Total de Produtos
            </CardTitle>
            <Boxes className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-foreground">{totalProdutos}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Portfólio Focus Tecnologia</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Produtos Ativos
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{produtosAtivos}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Em operação oficial</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Em Desenvolvimento
            </CardTitle>
            <Code2 className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{emDesenvolvimento}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Em construção pela engenharia</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Em Implantação
            </CardTitle>
            <Rocket className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{emImplantacao}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Fase de rollout de clientes</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Releases Publicadas
            </CardTitle>
            <GitBranch className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{totalReleases}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Versões lançadas no ecossistema</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS VISUAIS */}
      <div className="order-1 md:order-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribuição por Status */}
        <Card className="border-border/80">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Distribuição do Portfólio por Status</CardTitle>
            <CardDescription className="text-xs">
              Mapeamento do ciclo de vida dos softwares da Focus Tecnologia
            </CardDescription>
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

        {/* Gráfico de Módulos & Roadmap por Produto */}
        <Card className="border-border/80">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Densidade de Módulos e Roadmap por Produto</CardTitle>
            <CardDescription className="text-xs">
              Quantidade de módulos ativos e itens de roadmap planejados
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoriaData}>
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
                <Bar dataKey="modulos" name="Módulos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="roadmap" name="Itens no Roadmap" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import React from 'react';
import { Projeto } from '../projetos/types';
import {
  ItemBacklog,
  SprintDelivery,
  BugItem,
  DeployItem,
  ReleaseDelivery,
} from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Code2,
  GitBranch,
  Rocket,
  Bug,
  CheckCircle2,
  Clock,
  Layers,
  Terminal,
  Cpu,
  AlertTriangle,
  PlayCircle,
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
  AreaChart,
  Area,
} from 'recharts';

interface DashboardExecutivoDeliveryProps {
  projetosTecnicos?: Projeto[];
  backlogItems?: ItemBacklog[];
  sprints?: SprintDelivery[];
  bugs?: BugItem[];
  deploys?: DeployItem[];
  releases?: ReleaseDelivery[];
}

const SEVERITY_COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

export function DashboardExecutivoDelivery({
  projetosTecnicos = [],
  backlogItems = [],
  sprints = [],
  bugs = [],
  deploys = [],
  releases = [],
}: DashboardExecutivoDeliveryProps) {
  const totalProjetosDev = (projetosTecnicos || []).length;
  const totalBacklog = (backlogItems || []).length;
  const sprintsAtivas = (sprints || []).filter((s) => s && s.status === 'Em Andamento').length;

  const bugsAbertos = bugs.filter((b) => b.status !== 'Resolvido' && b.status !== 'Fechado').length;
  const bugsResolvidos = bugs.filter((b) => b.status === 'Resolvido' || b.status === 'Fechado').length;

  const totalReleases = releases.length;
  const totalDeploys = deploys.length;

  // Chart 1: Bugs por Severidade
  const bugSeveridadeData = [
    { name: 'Crítico', value: bugs.filter((b) => b.severidade === 'Crítico').length },
    { name: 'Alto', value: bugs.filter((b) => b.severidade === 'Alto').length },
    { name: 'Médio', value: bugs.filter((b) => b.severidade === 'Médio').length },
    { name: 'Baixo', value: bugs.filter((b) => b.severidade === 'Baixo').length },
  ].filter((d) => d.value > 0);

  // Chart 2: Status do Backlog por Coluna Kanban
  const kanbanStatusData = [
    { name: 'A Fazer', qtd: backlogItems.filter((b) => b.status === 'A Fazer' || b.status === 'Backlog').length },
    { name: 'Em Dev', qtd: backlogItems.filter((b) => b.status === 'Em Desenvolvimento').length },
    { name: 'Code Review', qtd: backlogItems.filter((b) => b.status === 'Code Review').length },
    { name: 'QA / Homolog.', qtd: backlogItems.filter((b) => b.status === 'QA' || b.status === 'Homologação').length },
    { name: 'Concluído', qtd: backlogItems.filter((b) => b.status === 'Concluído').length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI CARDS EXECUTIVOS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Projetos em Dev
            </CardTitle>
            <Code2 className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-foreground">{totalProjetosDev}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sincronizados via PMO</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Itens no Backlog
            </CardTitle>
            <Layers className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">{totalBacklog}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Histórias e Tarefas</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Sprints Ativas
            </CardTitle>
            <PlayCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">{sprintsAtivas}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Em execução agil</p>
          </CardContent>
        </Card>

        <Card className="border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Bugs Abertos
            </CardTitle>
            <Bug className="h-4 w-4 text-rose-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400">{bugsAbertos}</div>
            <p className="text-[10px] text-rose-500 font-semibold mt-0.5">Requerem correção</p>
          </CardContent>
        </Card>

        <Card className="border-border/80 col-span-2 sm:col-span-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-3 px-3">
            <CardTitle className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Deploys Realizados
            </CardTitle>
            <Rocket className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent className="px-3 pb-3">
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{totalDeploys}</div>
            <p className="text-[10px] text-muted-foreground mt-0.5">Staging & Produção</p>
          </CardContent>
        </Card>
      </div>

      {/* GRÁFICOS VISUAIS DE ENGENHARIA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Status do Fluxo Kanban */}
        <Card className="border-border/80">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Distribuição das Tarefas no Fluxo Kanban</CardTitle>
            <CardDescription className="text-xs">
              Mapeamento do progresso das histórias de usuário e tarefas técnicas
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kanbanStatusData}>
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
                <Bar dataKey="qtd" name="Quantidade" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Bugs por Severidade */}
        <Card className="border-border/80">
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-bold">Distribuição de Defeitos por Severidade</CardTitle>
            <CardDescription className="text-xs">
              Mapeamento de bugs críticos, altos, médios e baixos
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {bugSeveridadeData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                Nenhum bug em aberto registrado. Excelente qualidade técnica!
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bugSeveridadeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {bugSeveridadeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SEVERITY_COLORS[index % SEVERITY_COLORS.length]} />
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
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

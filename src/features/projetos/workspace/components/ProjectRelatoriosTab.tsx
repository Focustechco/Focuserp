import React from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  TrendingUp, 
  Download, 
  Printer, 
  PieChart,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'sonner';

interface ProjectRelatoriosTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

export function ProjectRelatoriosTab({ projeto }: ProjectRelatoriosTabProps) {
  const { stats, tasks, sprints, milestones, timeEntries } = useProjetoWorkspaceStore(projeto);

  const valorHora = stats.horasContratadas > 0 ? projeto.valorContratado / stats.horasContratadas : 0;
  const custoHorasExecutadas = stats.totalHorasApontadas * valorHora;
  const saldoFinanceiroRestante = Math.max(0, projeto.valorContratado - custoHorasExecutadas);

  const handleExport = () => {
    toast.success("Relatório gerado com sucesso!", {
      description: `O sumário executivo do projeto ${projeto.codigo} está pronto para impressão ou download em PDF.`
    });
    window.print();
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com Ação de Exportar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
        <div>
          <h3 className="font-bold text-base text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" /> Relatório Executivo & DRE Sintético do Projeto
          </h3>
          <p className="text-xs text-muted-foreground">
            Demonstrativo de progresso físico-financeiro, rentabilidade por hora e velocidade de entrega.
          </p>
        </div>

        <Button 
          onClick={handleExport}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-9 shadow-xs cursor-pointer"
        >
          <Printer className="w-4 h-4" /> Imprimir / Exportar PDF
        </Button>
      </div>

      {/* DRE Financeiro do Projeto */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Receita Contratada</span>
            <div className="text-2xl font-bold text-foreground">{formatCurrency(projeto.valorContratado)}</div>
            <p className="text-[11px] text-muted-foreground">Valor total acordado</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Custo Horário Realizado</span>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(custoHorasExecutadas)}</div>
            <p className="text-[11px] text-muted-foreground">{stats.totalHorasApontadas}h executadas a {formatCurrency(valorHora)}/h</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 space-y-1">
            <span className="text-xs text-muted-foreground font-medium">Margem Operacional Teórica</span>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(saldoFinanceiroRestante)}</div>
            <p className="text-[11px] text-muted-foreground">Saldo do orçamento financeiro</p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo de Eficiência Operacional */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <PieChart className="w-4 h-4 text-orange-500" /> Distribuição de Tasks por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">Concluídas ({stats.tasksConcluidas})</span>
                <span className="font-bold">{stats.totalTasks > 0 ? Math.round((stats.tasksConcluidas / stats.totalTasks) * 100) : 0}%</span>
              </div>
              <Progress value={stats.totalTasks > 0 ? (stats.tasksConcluidas / stats.totalTasks) * 100 : 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700 dark:text-blue-400 font-semibold">Em Andamento / Testes ({stats.tasksEmAndamento})</span>
                <span className="font-bold">{stats.totalTasks > 0 ? Math.round((stats.tasksEmAndamento / stats.totalTasks) * 100) : 0}%</span>
              </div>
              <Progress value={stats.totalTasks > 0 ? (stats.tasksEmAndamento / stats.totalTasks) * 100 : 0} className="h-2" />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground font-semibold">Backlog / A Fazer ({stats.totalTasks - stats.tasksConcluidas - stats.tasksEmAndamento})</span>
                <span className="font-bold">{stats.totalTasks > 0 ? Math.round(((stats.totalTasks - stats.tasksConcluidas - stats.tasksEmAndamento) / stats.totalTasks) * 100) : 0}%</span>
              </div>
              <Progress value={stats.totalTasks > 0 ? ((stats.totalTasks - stats.tasksConcluidas - stats.tasksEmAndamento) / stats.totalTasks) * 100 : 0} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-orange-500" /> Índices de Saúde do Projeto
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
              <div>
                <span className="font-bold text-foreground">Taxa de Conclusão Global</span>
                <p className="text-[11px] text-muted-foreground">Medição real por tasks e marcos</p>
              </div>
              <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-sm font-bold">
                {stats.progressoGlobal}%
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
              <div>
                <span className="font-bold text-foreground">Velocidade da Squad</span>
                <p className="text-[11px] text-muted-foreground">Média de horas apontadas</p>
              </div>
              <Badge variant="outline" className="text-sm font-bold">
                {stats.totalHorasApontadas}h
              </Badge>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
              <div>
                <span className="font-bold text-foreground">Aderência a Prazos</span>
                <p className="text-[11px] text-muted-foreground">{stats.tasksAtrasadas} tasks fora do prazo</p>
              </div>
              <Badge className={stats.tasksAtrasadas === 0 ? "bg-emerald-500/10 text-emerald-700" : "bg-rose-500/10 text-rose-700"}>
                {stats.tasksAtrasadas === 0 ? "100% no Prazo" : `${stats.tasksAtrasadas} Atrasadas`}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

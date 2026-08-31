import React from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Calendar, 
  Flag, 
  Layers, 
  Users, 
  Target, 
  Zap, 
  ArrowRight, 
  AlertCircle,
  Play,
  FileCheck2,
  DollarSign
} from 'lucide-react';

interface ProjectOverviewTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectOverviewTab({ projeto, onNavigateTab }: ProjectOverviewTabProps) {
  const { stats, tasks, milestones, sprints, updateTask, seedDefaultProjectData } = useProjetoWorkspaceStore(projeto);

  const upcomingTasks = tasks
    .filter(t => t.status !== 'Concluído')
    .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
    .slice(0, 5);

  const upcomingMilestones = milestones
    .sort((a, b) => new Date(a.dataPrevisao).getTime() - new Date(b.dataPrevisao).getTime())
    .slice(0, 4);

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'Crítica': return <Badge variant="destructive" className="text-[10px] font-bold">Crítica</Badge>;
      case 'Alta': return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]">Alta</Badge>;
      case 'Média': return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px]">Média</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">Baixa</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. Alertas Automatizados do Projeto */}
      {stats.alerts.length > 0 && (
        <div className="space-y-2">
          {stats.alerts.map(alert => (
            <div 
              key={alert.id}
              className={`flex items-start gap-3 p-3.5 rounded-2xl border ${
                alert.tipo === 'erro' 
                  ? 'bg-rose-50/50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900/40 text-rose-900 dark:text-rose-200' 
                  : 'bg-amber-50/50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40 text-amber-900 dark:text-amber-200'
              }`}
            >
              <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${alert.tipo === 'erro' ? 'text-rose-600' : 'text-amber-600'}`} />
              <div className="text-xs space-y-0.5">
                <p className="font-bold">{alert.titulo}</p>
                <p className="opacity-90">{alert.desc}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Botão de Inicialização Inteligente se vazio */}
      {tasks.length === 0 && (
        <Card className="rounded-2xl border-2 border-dashed border-orange-500/30 bg-orange-50/10 p-6 text-center">
          <div className="max-w-md mx-auto space-y-3">
            <Zap className="w-10 h-10 text-orange-500 mx-auto" />
            <h3 className="font-bold text-sm text-foreground">Inicializar Estrutura Padrão deste Projeto</h3>
            <p className="text-xs text-muted-foreground">
              Gere automaticamente os macro marcos, requisitos iniciais, primeira sprint e squad para este projeto com 1 clique.
            </p>
            <Button onClick={seedDefaultProjectData} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs">
              <Zap className="w-3.5 h-3.5 mr-1.5" /> Inicializar Dados de Exemplo
            </Button>
          </div>
        </Card>
      )}

      {/* 2. Grid de KPIs Operacionais */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-orange-500" /> Progresso do Projeto</span>
              <span className="text-orange-600 font-bold">{stats.progressoGlobal}%</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{stats.progressoGlobal}%</div>
            <Progress value={stats.progressoGlobal} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground">Calculado dinamicamente via Tasks e Marcos</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Status das Tasks
            </div>
            <div className="text-2xl font-bold text-foreground">
              <span className="text-emerald-600">{stats.tasksConcluidas}</span>
              <span className="text-sm font-normal text-muted-foreground"> / {stats.totalTasks}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="text-blue-600 font-semibold">{stats.tasksEmAndamento} em andamento</span>
              <span>•</span>
              <span className={stats.tasksBloqueadas > 0 ? "text-rose-600 font-bold" : ""}>{stats.tasksBloqueadas} bloqueadas</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Orçamento de Horas
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalHorasApontadas}h <span className="text-xs font-normal text-muted-foreground">/ {stats.horasContratadas}h</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Saldo: <strong>{stats.horasRestantes}h restantes</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Flag className="w-3.5 h-3.5 text-purple-500" /> Marcos de Entrega
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.milestonesConcluidos} <span className="text-xs font-normal text-muted-foreground">/ {stats.totalMilestones}</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {stats.totalMilestones - stats.milestonesConcluidos} marcos a entregar
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 3. Seção Principal: Sprint Atual & Próximas Tasks */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Card: Sprint Atual */}
        <Card className="rounded-2xl border shadow-xs bg-card lg:col-span-1 flex flex-col justify-between">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-500" /> Sprint Ativa
              </CardTitle>
              {stats.activeSprint && (
                <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px]">
                  {stats.activeSprint.status}
                </Badge>
              )}
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-4 text-xs flex-1">
            {stats.activeSprint ? (
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-sm text-foreground">{stats.activeSprint.nome}</h4>
                  <p className="text-muted-foreground mt-1 text-[11px] line-clamp-2">{stats.activeSprint.objetivo}</p>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-muted-foreground font-semibold">
                    <span>Progresso da Sprint</span>
                    <span className="text-foreground">{stats.sprintProgresso}%</span>
                  </div>
                  <Progress value={stats.sprintProgresso} className="h-2" />
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t text-[11px]">
                  <div className="p-2.5 rounded-xl border bg-muted/10">
                    <span className="text-muted-foreground block">Início:</span>
                    <strong>{new Date(stats.activeSprint.dataInicio).toLocaleDateString('pt-BR')}</strong>
                  </div>
                  <div className="p-2.5 rounded-xl border bg-muted/10">
                    <span className="text-muted-foreground block">Término:</span>
                    <strong>{new Date(stats.activeSprint.dataFim).toLocaleDateString('pt-BR')}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                  <span>Tasks: <strong>{stats.sprintTasks.length}</strong></span>
                  <span>Capacidade: <strong>{stats.activeSprint.capacidadeHoras}h</strong></span>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhuma sprint ativa no momento.</p>
              </div>
            )}
          </CardContent>

          <div className="p-4 border-t bg-muted/10 rounded-b-2xl">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => onNavigateTab('sprints')}
              className="w-full text-xs font-bold rounded-xl text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20 gap-1.5"
            >
              Acessar Painel de Sprints <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </Card>

        {/* Card: Próximas Tasks */}
        <Card className="rounded-2xl border shadow-xs bg-card lg:col-span-2">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" /> Próximas Tasks & Prazos
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigateTab('kanban')} 
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              Ver Kanban <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>

          <CardContent className="p-4 text-xs">
            {upcomingTasks.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-60" />
                <p>Todas as tasks cadastradas estão concluídas!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingTasks.map(task => (
                  <div 
                    key={task.id} 
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border bg-card hover:border-orange-500/40 transition-all gap-2 shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <button
                        onClick={() => updateTask(task.id, { status: 'Concluído' })}
                        className="w-5 h-5 rounded border border-muted-foreground/40 hover:border-emerald-500 hover:bg-emerald-50 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                        title="Marcar como concluída"
                      />
                      <div className="truncate">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[10px] text-orange-600">{task.codigo}</span>
                          <span className="font-bold text-foreground text-xs truncate">{task.titulo}</span>
                          {getPriorityBadge(task.prioridade)}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                          <span>Resp: <strong>{task.responsavel}</strong></span>
                          <span>•</span>
                          <span>Prazo: <strong>{new Date(task.prazo).toLocaleDateString('pt-BR')}</strong></span>
                          <span>•</span>
                          <span>{task.estimativaHoras}h est.</span>
                        </div>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[10px] shrink-0 self-start sm:self-auto">
                      {task.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 4. Marcos do Projeto & Matriz de Escopo */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Próximos Marcos */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Flag className="w-4 h-4 text-orange-500" /> Próximos Marcos (Milestones)
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onNavigateTab('marcos')} 
              className="text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              Ver Todos <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </CardHeader>
          <CardContent className="p-4 text-xs">
            {upcomingMilestones.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Nenhum marco cadastrado.
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingMilestones.map(m => {
                  const isDone = m.status === 'Concluído';
                  return (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl border bg-muted/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-orange-100 text-orange-600'}`}>
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : <Flag className="w-4 h-4" />}
                        </div>
                        <div>
                          <h4 className={`font-bold text-xs ${isDone ? 'line-through opacity-70 text-emerald-800 dark:text-emerald-300' : 'text-foreground'}`}>
                            {m.titulo}
                          </h4>
                          <p className="text-[11px] text-muted-foreground">Previsão: {new Date(m.dataPrevisao).toLocaleDateString('pt-BR')}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {m.status}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Matriz de Escopo */}
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Target className="w-4 h-4 text-orange-500" /> Diretrizes de Escopo do Projeto
            </CardTitle>
            <CardDescription className="text-xs">Alinhamento de expectativas e entregáveis.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3.5 pt-4 text-xs">
            <div>
              <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Escopo Incluído (In Scope)
              </span>
              <div className="p-3 rounded-xl border bg-emerald-50/20 dark:bg-emerald-950/10 text-foreground">
                {projeto.escopoIncluido || 'Módulos completos de gestão, backend APIs, banco de dados, frontend responsivo e documentação técnica.'}
              </div>
            </div>

            <div>
              <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-1">
                <AlertCircle className="w-3.5 h-3.5" /> Escopo Excluído (Out of Scope)
              </span>
              <div className="p-3 rounded-xl border bg-rose-50/20 dark:bg-rose-950/10 text-foreground">
                {projeto.escopoExcluido || 'Aquisição de hardware, licenças de serviços de terceiros e integrações não especificadas no contrato.'}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

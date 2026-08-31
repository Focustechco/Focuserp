import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { ProjectSprint, DiaSemana, ProjectTask } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Zap, 
  Plus, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  Trash2, 
  Layers, 
  Users, 
  ArrowRight,
  Play,
  Flame,
  Check
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';

interface ProjectSprintsTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

const DIAS_SEMANA: DiaSemana[] = [
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado'
];

export function ProjectSprintsTab({ projeto, onNavigateTab }: ProjectSprintsTabProps) {
  const { sprints, tasks, addSprint, updateSprint, deleteSprint, addTask, updateTask, deleteTask } = useProjetoWorkspaceStore(projeto);

  const [selectedSprintId, setSelectedSprintId] = useState<string>(
    sprints.find(s => s.status === 'Ativa')?.id || sprints[0]?.id || ''
  );

  const [openSprintModal, setOpenSprintModal] = useState(false);
  const [openTaskModal, setOpenTaskModal] = useState(false);

  // Form Sprint
  const [sprintNome, setSprintNome] = useState('');
  const [sprintObjetivo, setSprintObjetivo] = useState('');
  const [duracaoSemanas, setDuracaoSemanas] = useState('2');
  const [sprintDataInicio, setSprintDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [sprintCapacidade, setSprintCapacidade] = useState('80');

  // Form Task
  const [taskTitulo, setTaskTitulo] = useState('');
  const [taskDia, setTaskDia] = useState<DiaSemana>('Segunda-feira');
  const [taskResp, setTaskResp] = useState(projeto.responsavelPrincipal || '');
  const [taskPrio, setTaskPrio] = useState<any>('Média');
  const [taskTipo, setTaskTipo] = useState<any>('Desenvolvimento');
  const [taskHoras, setTaskHoras] = useState('4');

  const currentSprint = sprints.find(s => s.id === selectedSprintId) || sprints[0];
  const sprintTasks = currentSprint ? tasks.filter(t => t.sprintId === currentSprint.id) : [];

  const handleSaveSprint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sprintNome.trim()) return;

    const weeks = parseInt(duracaoSemanas) || 2;
    const startDate = new Date(sprintDataInicio);
    const endDate = new Date(startDate.getTime() + weeks * 7 * 24 * 60 * 60 * 1000);

    const newS = addSprint({
      nome: sprintNome,
      objetivo: sprintObjetivo,
      dataInicio: sprintDataInicio,
      dataFim: endDate.toISOString().split('T')[0],
      status: sprints.length === 0 ? 'Ativa' : 'Planejada',
      capacidadeHoras: parseInt(sprintCapacidade) || 80,
      horasPlanejadas: parseInt(sprintCapacidade) || 80,
      responsavel: projeto.responsavelPrincipal,
    });

    setSelectedSprintId(newS.id);
    setSprintNome('');
    setSprintObjetivo('');
    setOpenSprintModal(false);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitulo.trim() || !currentSprint) return;

    addTask({
      sprintId: currentSprint.id,
      titulo: taskTitulo,
      responsavel: taskResp || projeto.responsavelPrincipal,
      prioridade: taskPrio,
      status: 'A Fazer',
      tipo: taskTipo,
      prazo: currentSprint.dataFim,
      estimativaHoras: parseInt(taskHoras) || 4,
      horasRealizadas: 0,
      diaSemana: taskDia,
      tags: ['Sprint Task', taskDia],
      bloqueada: false,
      ordem: 1,
    });

    setTaskTitulo('');
    setOpenTaskModal(false);
  };

  const completedSprintTasks = sprintTasks.filter(t => t.status === 'Concluído').length;
  const sprintProgress = sprintTasks.length > 0 ? Math.round((completedSprintTasks / sprintTasks.length) * 100) : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com Seletor de Sprint e Ações */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-2xl border shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          <Select 
            value={currentSprint?.id || ''} 
            onValueChange={setSelectedSprintId}
          >
            <SelectTrigger className="w-56 rounded-xl font-bold text-xs h-9">
              <SelectValue placeholder="Selecione a Sprint" />
            </SelectTrigger>
            <SelectContent>
              {sprints.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.nome} ({s.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {currentSprint && (
            <div className="flex items-center gap-2">
              <Badge className={
                currentSprint.status === 'Ativa' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' 
                  : 'bg-muted text-muted-foreground'
              }>
                {currentSprint.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(currentSprint.dataInicio).toLocaleDateString('pt-BR')} até {new Date(currentSprint.dataFim).toLocaleDateString('pt-BR')}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {currentSprint && (
            <Dialog open={openTaskModal} onOpenChange={setOpenTaskModal}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Adicionar Task à Sprint
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Plus className="w-4 h-4 text-orange-500" /> Nova Tarefa para {currentSprint.nome}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSaveTask} className="space-y-4 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Título da Tarefa *</Label>
                    <Input 
                      placeholder="Ex: Desenvolver componente de paginação" 
                      value={taskTitulo} 
                      onChange={e => setTaskTitulo(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Dia de Execução (Sprint Daily)</Label>
                      <Select value={taskDia} onValueChange={(v: any) => setTaskDia(v)}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {DIAS_SEMANA.map(d => (
                            <SelectItem key={d} value={d}>{d}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Responsável</Label>
                      <Input 
                        value={taskResp} 
                        onChange={e => setTaskResp(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Tipo</Label>
                      <Select value={taskTipo} onValueChange={setTaskTipo}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                          <SelectItem value="Design">Design</SelectItem>
                          <SelectItem value="Teste">Teste</SelectItem>
                          <SelectItem value="Bug">Bug</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Prioridade</Label>
                      <Select value={taskPrio} onValueChange={(v: any) => setTaskPrio(v)}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Baixa">Baixa</SelectItem>
                          <SelectItem value="Média">Média</SelectItem>
                          <SelectItem value="Alta">Alta</SelectItem>
                          <SelectItem value="Crítica">Crítica</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Horas Estimadas</Label>
                      <Input 
                        type="number" 
                        value={taskHoras} 
                        onChange={e => setTaskHoras(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-3">
                    <Button type="button" variant="outline" onClick={() => setOpenTaskModal(false)} className="rounded-xl text-xs h-8">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                      Adicionar Task
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          <Dialog open={openSprintModal} onOpenChange={setOpenSprintModal}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-1.5 font-bold text-xs h-8">
                <Zap className="w-3.5 h-3.5 text-orange-500" /> Criar Sprint
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Zap className="w-4 h-4 text-orange-500" /> Criar Nova Sprint
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSaveSprint} className="space-y-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Nome da Sprint *</Label>
                  <Input 
                    placeholder="Ex: Sprint 02 — Módulo Financeiro & APIs" 
                    value={sprintNome} 
                    onChange={e => setSprintNome(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Objetivo da Sprint</Label>
                  <Textarea 
                    placeholder="Metas principais e entregáveis esperados ao fim do ciclo..." 
                    value={sprintObjetivo} 
                    onChange={e => setSprintObjetivo(e.target.value)} 
                    className="rounded-xl h-20 text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Duração</Label>
                    <Select value={duracaoSemanas} onValueChange={setDuracaoSemanas}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Semana</SelectItem>
                        <SelectItem value="2">2 Semanas (Padrão)</SelectItem>
                        <SelectItem value="3">3 Semanas</SelectItem>
                        <SelectItem value="4">4 Semanas</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Data Início</Label>
                    <Input 
                      type="date" 
                      value={sprintDataInicio} 
                      onChange={e => setSprintDataInicio(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Capacidade (h)</Label>
                    <Input 
                      type="number" 
                      value={sprintCapacidade} 
                      onChange={e => setSprintCapacidade(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenSprintModal(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Criar Sprint
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {currentSprint ? (
        <div className="space-y-6">
          {/* Card de Resumo da Sprint Selecionada */}
          <Card className="rounded-2xl border shadow-xs bg-card">
            <CardContent className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                <div className="md:col-span-2 space-y-1">
                  <h3 className="font-bold text-base text-foreground">{currentSprint.nome}</h3>
                  <p className="text-xs text-muted-foreground">{currentSprint.objetivo || 'Sem objetivo cadastrado.'}</p>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground font-semibold">
                    <span>Progresso da Sprint</span>
                    <span className="text-foreground">{sprintProgress}%</span>
                  </div>
                  <Progress value={sprintProgress} className="h-2" />
                  <p className="text-[11px] text-muted-foreground">{completedSprintTasks} de {sprintTasks.length} tasks concluídas</p>
                </div>

                <div className="flex items-center justify-end gap-2">
                  {currentSprint.status !== 'Concluída' ? (
                    <Button 
                      size="sm" 
                      onClick={() => updateSprint(currentSprint.id, { status: 'Concluída' })}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold gap-1 shadow-xs cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Concluir Sprint
                    </Button>
                  ) : (
                    <Badge className="bg-emerald-500/10 text-emerald-700 border-emerald-500/20 text-xs">
                      Sprint Encerrada
                    </Badge>
                  )}
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => deleteSprint(currentSprint.id)}
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                    title="Excluir sprint"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Planejamento Diário da Sprint (Segunda a Sábado) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" /> Distribuição Diária da Sprint (Daily Execution)
                </h4>
                <p className="text-xs text-muted-foreground">Distribua as tarefas da sprint entre os dias da semana.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DIAS_SEMANA.map((dia) => {
                const tasksDia = sprintTasks.filter(t => t.diaSemana === dia || (!t.diaSemana && dia === 'Segunda-feira'));

                return (
                  <Card key={dia} className="rounded-2xl border shadow-xs bg-card flex flex-col">
                    <CardHeader className="p-3.5 border-b bg-muted/20 flex flex-row items-center justify-between">
                      <CardTitle className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-orange-500" /> {dia}
                      </CardTitle>
                      <Badge variant="secondary" className="text-[10px]">
                        {tasksDia.length} task(s)
                      </Badge>
                    </CardHeader>

                    <CardContent className="p-3 space-y-2.5 flex-1">
                      {tasksDia.length === 0 ? (
                        <div className="py-6 text-center text-muted-foreground text-[11px]">
                          Nenhuma task agendada para {dia}.
                        </div>
                      ) : (
                        tasksDia.map((task) => {
                          const isDone = task.status === 'Concluído';

                          return (
                            <div 
                              key={task.id} 
                              className={`p-3 rounded-xl border transition-all text-xs space-y-2 ${
                                isDone 
                                  ? 'bg-emerald-50/20 border-emerald-500/30 dark:bg-emerald-950/10' 
                                  : 'bg-card hover:border-orange-500/40 shadow-2xs'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 truncate">
                                  <button
                                    onClick={() => updateTask(task.id, { 
                                      status: isDone ? 'A Fazer' : 'Concluído',
                                      horasRealizadas: isDone ? 0 : task.estimativaHoras 
                                    })}
                                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                                      isDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-muted-foreground/40 bg-background'
                                    }`}
                                  >
                                    {isDone && <Check className="w-3 h-3 stroke-[3]" />}
                                  </button>
                                  <span className={`font-bold text-xs truncate ${isDone ? 'line-through opacity-70 text-emerald-900 dark:text-emerald-200' : 'text-foreground'}`}>
                                    {task.titulo}
                                  </span>
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteTask(task.id)}
                                  className="h-5 w-5 p-0 text-muted-foreground hover:text-destructive rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                                <span>{task.responsavel}</span>
                                <div className="flex items-center gap-1.5">
                                  <span>{task.estimativaHoras}h</span>
                                  {/* Mudar dia */}
                                  <Select 
                                    value={task.diaSemana || dia} 
                                    onValueChange={(newDia: DiaSemana) => updateTask(task.id, { diaSemana: newDia })}
                                  >
                                    <SelectTrigger className="h-5 text-[10px] w-20 px-1 rounded">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {DIAS_SEMANA.map(d => (
                                        <SelectItem key={d} value={d} className="text-[11px]">{d.split('-')[0]}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <Card className="rounded-2xl border-2 border-dashed p-10 text-center">
          <Zap className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
          <h4 className="font-bold text-sm text-foreground">Nenhuma sprint criada neste projeto</h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Crie ciclos de desenvolvimento ágil de 1 ou 2 semanas para organizar suas entregas.
          </p>
          <Button 
            onClick={() => setOpenSprintModal(true)} 
            className="mt-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Criar Primeira Sprint
          </Button>
        </Card>
      )}
    </div>
  );
}

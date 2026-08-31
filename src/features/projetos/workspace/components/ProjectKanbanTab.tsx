import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { ProjectTask, StatusTask } from '../types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, 
  Search, 
  Trash2, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  User, 
  ArrowRight, 
  ArrowLeft,
  Filter,
  Flame,
  Check
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface ProjectKanbanTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

interface KanbanColumn {
  id: StatusTask;
  title: string;
  badgeColor: string;
}

const DEFAULT_COLUMNS: KanbanColumn[] = [
  { id: 'Backlog', title: 'Backlog', badgeColor: 'bg-muted text-muted-foreground' },
  { id: 'A Fazer', title: 'A Fazer', badgeColor: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20' },
  { id: 'Em Andamento', title: 'Em Andamento', badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20' },
  { id: 'Code Review', title: 'Code Review', badgeColor: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  { id: 'Em Teste', title: 'Testes & QA', badgeColor: 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20' },
  { id: 'Concluído', title: 'Concluído', badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' }
];

export function ProjectKanbanTab({ projeto }: ProjectKanbanTabProps) {
  const { tasks, addTask, updateTask, deleteTask, sprints } = useProjetoWorkspaceStore(projeto);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterResp, setFilterResp] = useState<string>('Todos');
  const [filterPrio, setFilterPrio] = useState<string>('Todas');

  // Modal para adicionar task em coluna específica
  const [openModal, setOpenModal] = useState(false);
  const [targetStatus, setTargetStatus] = useState<StatusTask>('A Fazer');
  const [taskTitulo, setTaskTitulo] = useState('');
  const [taskResp, setTaskResp] = useState(projeto.responsavelPrincipal || '');
  const [taskPrio, setTaskPrio] = useState<any>('Média');
  const [taskTipo, setTaskTipo] = useState<any>('Desenvolvimento');
  const [taskHoras, setTaskHoras] = useState('6');

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = (t.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (t.titulo || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesResp = filterResp === 'Todos' || t.responsavel === filterResp;
    const matchesPrio = filterPrio === 'Todas' || t.prioridade === filterPrio;
    return matchesSearch && matchesResp && matchesPrio;
  });

  const handleOpenAddModal = (status: StatusTask) => {
    setTargetStatus(status);
    setOpenModal(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitulo.trim()) return;

    addTask({
      titulo: taskTitulo,
      responsavel: taskResp || projeto.responsavelPrincipal,
      prioridade: taskPrio,
      status: targetStatus,
      tipo: taskTipo,
      prazo: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimativaHoras: parseInt(taskHoras) || 6,
      horasRealizadas: targetStatus === 'Concluído' ? parseInt(taskHoras) || 6 : 0,
      tags: ['Kanban', taskTipo],
      bloqueada: false,
      ordem: tasks.length,
    });

    setTaskTitulo('');
    setOpenModal(false);
  };

  const moveTask = (task: ProjectTask, direction: 'next' | 'prev') => {
    const currentIndex = DEFAULT_COLUMNS.findIndex(c => c.id === task.status);
    if (currentIndex === -1) return;

    const nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < DEFAULT_COLUMNS.length) {
      const newStatus = DEFAULT_COLUMNS[nextIndex].id;
      updateTask(task.id, { 
        status: newStatus,
        horasRealizadas: newStatus === 'Concluído' ? task.estimativaHoras : task.horasRealizadas
      });
    }
  };

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'Crítica': return <Badge variant="destructive" className="text-[9px] px-1.5 py-0 font-bold">Crítica</Badge>;
      case 'Alta': return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[9px] px-1.5 py-0">Alta</Badge>;
      case 'Média': return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[9px] px-1.5 py-0">Média</Badge>;
      default: return <Badge variant="secondary" className="text-[9px] px-1.5 py-0">Baixa</Badge>;
    }
  };

  const uniqueResponsaveis = Array.from(new Set(tasks.map(t => t.responsavel).filter(Boolean)));

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Filtros do Kanban */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card p-3.5 rounded-2xl border shadow-xs">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Filtrar tasks por nome ou código..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-8 text-xs h-8 rounded-xl"
            />
          </div>

          <Select value={filterResp} onValueChange={setFilterResp}>
            <SelectTrigger className="h-8 text-xs rounded-xl w-36">
              <SelectValue placeholder="Responsável" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Membros</SelectItem>
              {uniqueResponsaveis.map(r => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterPrio} onValueChange={setFilterPrio}>
            <SelectTrigger className="h-8 text-xs rounded-xl w-32">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas Prios</SelectItem>
              <SelectItem value="Crítica">Crítica</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          onClick={() => handleOpenAddModal('A Fazer')}
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Nova Tarefa
        </Button>
      </div>

      {/* Board Kanban Horizontal com Scroll Suave */}
      <div className="overflow-x-auto pb-4 scrollbar-hide">
        <div className="flex gap-4 min-w-[1300px]">
          {DEFAULT_COLUMNS.map((col, colIdx) => {
            const colTasks = filteredTasks.filter(t => t.status === col.id);

            return (
              <div 
                key={col.id} 
                className="w-72 shrink-0 bg-muted/20 border rounded-2xl flex flex-col max-h-[750px] shadow-2xs"
              >
                {/* Cabeçalho da Coluna */}
                <div className="p-3 border-b bg-card rounded-t-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-xs text-foreground">{col.title}</h3>
                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                      {colTasks.length}
                    </Badge>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleOpenAddModal(col.id)}
                    className="h-6 w-6 p-0 rounded-lg hover:bg-orange-50 hover:text-orange-600 text-muted-foreground"
                    title={`Adicionar em ${col.title}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* Lista de Tasks na Coluna */}
                <div className="p-2.5 space-y-2.5 flex-1 overflow-y-auto">
                  {colTasks.length === 0 ? (
                    <div className="py-10 text-center text-muted-foreground text-[11px] border border-dashed rounded-xl m-1">
                      Nenhuma task aqui
                    </div>
                  ) : (
                    colTasks.map((task) => {
                      const isDone = task.status === 'Concluído';

                      return (
                        <div 
                          key={task.id} 
                          className={`p-3 rounded-xl border bg-card hover:border-orange-500/50 transition-all text-xs space-y-2 shadow-2xs ${
                            task.bloqueada ? 'border-rose-400 bg-rose-50/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-mono font-bold text-[10px] text-orange-600">
                                {task.codigo}
                              </span>
                              {getPriorityBadge(task.prioridade)}
                              {task.bloqueada && (
                                <Badge variant="destructive" className="text-[9px] px-1 py-0 gap-0.5">
                                  <AlertTriangle className="w-2.5 h-2.5" /> Bloqueada
                                </Badge>
                              )}
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

                          <h4 className="font-bold text-xs text-foreground leading-snug">
                            {task.titulo}
                          </h4>

                          <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                            <span className="truncate max-w-[120px] font-medium">{task.responsavel}</span>
                            <span className="font-semibold">{task.estimativaHoras}h</span>
                          </div>

                          {/* Ações de navegação rápida de coluna */}
                          <div className="flex items-center justify-between pt-1 border-t">
                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={colIdx === 0}
                              onClick={() => moveTask(task, 'prev')}
                              className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-foreground disabled:opacity-30"
                              title="Mover para coluna anterior"
                            >
                              <ArrowLeft className="w-3 h-3 mr-0.5" /> Voltar
                            </Button>

                            <Button
                              size="sm"
                              variant="ghost"
                              disabled={colIdx === DEFAULT_COLUMNS.length - 1}
                              onClick={() => moveTask(task, 'next')}
                              className="h-6 px-1.5 text-[10px] text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/20 font-bold disabled:opacity-30"
                              title="Avançar para próxima coluna"
                            >
                              Avançar <ArrowRight className="w-3 h-3 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal para Adicionar Task no Kanban */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-500" /> Nova Tarefa no Kanban [{targetStatus}]
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveTask} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título da Tarefa *</Label>
              <Input 
                placeholder="Ex: Desenvolver tela de listagem e filtros" 
                value={taskTitulo} 
                onChange={e => setTaskTitulo(e.target.value)} 
                required 
                className="rounded-xl h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Responsável</Label>
                <Input 
                  value={taskResp} 
                  onChange={e => setTaskResp(e.target.value)} 
                  className="rounded-xl h-9 text-xs"
                />
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Tipo</Label>
                <Select value={taskTipo} onValueChange={setTaskTipo}>
                  <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                    <SelectItem value="Story">User Story</SelectItem>
                    <SelectItem value="Design">UI / UX</SelectItem>
                    <SelectItem value="Teste">QA & Testes</SelectItem>
                    <SelectItem value="Bug">Bugfix</SelectItem>
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
            </div>

            <DialogFooter className="pt-3">
              <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                Cancelar
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                Salvar no Kanban
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

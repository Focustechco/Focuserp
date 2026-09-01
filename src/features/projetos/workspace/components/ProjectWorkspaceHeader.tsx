import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Briefcase, 
  Plus, 
  Clock, 
  Calendar, 
  Flag, 
  Users, 
  Layers, 
  CheckCircle2, 
  FileText, 
  Download,
  AlertTriangle,
  Play,
  Settings
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { Progress } from '@/components/ui/progress';
import { NovoProjetoSheet } from '../../components/NovoProjetoSheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectWorkspaceHeaderProps {
  projeto: Projeto;
  clienteNome?: string;
}

export function ProjectWorkspaceHeader({ projeto, clienteNome }: ProjectWorkspaceHeaderProps) {
  const store = useProjetoWorkspaceStore(projeto);
  const { stats, addTask, addSprint, addMilestone, addTimeEntry, addRequirement } = store;

  // Dialogs de Ações Rápidas
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskTitulo, setTaskTitulo] = useState('');
  const [taskResponsavel, setTaskResponsavel] = useState(projeto.responsavelPrincipal || '');
  const [taskPrioridade, setTaskPrioridade] = useState<'Baixa' | 'Média' | 'Alta' | 'Crítica'>('Média');
  const [taskTipo, setTaskTipo] = useState<any>('Desenvolvimento');
  const [taskPrazo, setTaskPrazo] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [taskHoras, setTaskHoras] = useState('8');

  // Time Entry Modal
  const [timeModalOpen, setTimeModalOpen] = useState(false);
  const [timeHoras, setTimeHoras] = useState('2');
  const [timeDesc, setTimeDesc] = useState('');
  const [timeColaborador, setTimeColaborador] = useState(projeto.responsavelPrincipal || '');

  const handleQuickTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitulo.trim()) return;

    addTask({
      sprintId: stats.activeSprint?.id,
      titulo: taskTitulo,
      responsavel: taskResponsavel || projeto.responsavelPrincipal,
      prioridade: taskPrioridade,
      status: 'A Fazer',
      tipo: taskTipo,
      prazo: taskPrazo,
      estimativaHoras: parseInt(taskHoras) || 8,
      horasRealizadas: 0,
      tags: ['Rápida', taskTipo],
      bloqueada: false,
      ordem: 1,
    });

    setTaskTitulo('');
    setTaskModalOpen(false);
  };

  const handleQuickTime = (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeDesc.trim()) return;

    addTimeEntry({
      colaboradorNome: timeColaborador || projeto.responsavelPrincipal,
      data: new Date().toISOString().split('T')[0],
      horas: parseFloat(timeHoras) || 1,
      descricao: timeDesc,
      faturavel: true,
    });

    setTimeDesc('');
    setTimeModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Concluído</Badge>;
      case 'Em Desenvolvimento':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">Em Desenvolvimento</Badge>;
      case 'Em Homologação':
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">Em Homologação</Badge>;
      case 'Aguardando Cliente':
        return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Aguardando Cliente</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  return (
    <div className="bg-card rounded-2xl border shadow-xs p-5 space-y-4">
      {/* Top Row: Back button, Title, Status, Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <Link to="/projetos">
            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9 shrink-0 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-950/20">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{projeto.nome}</h1>
              {getStatusBadge(projeto.status)}
              <Badge variant="outline" className="text-xs font-mono font-bold text-orange-600 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                {projeto.codigo || 'PRJ-001'}
              </Badge>
              <Badge variant="secondary" className="text-[11px]">
                {projeto.tipo}
              </Badge>
            </div>

            <p className="text-xs text-muted-foreground mt-1 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-orange-500" />
                Cliente: <strong>{clienteNome || 'Cliente Corporativo'}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-orange-500" />
                PM: <strong>{projeto.responsavelPrincipal}</strong>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                {new Date(projeto.dataInicio).toLocaleDateString('pt-BR')} → {new Date(projeto.dataFinal).toLocaleDateString('pt-BR')}
              </span>
            </p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Task Modal */}
          <Dialog open={taskModalOpen} onOpenChange={setTaskModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Nova Task
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Plus className="w-4 h-4 text-orange-500" /> Criar Nova Task no Projeto
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleQuickTask} className="space-y-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Título da Tarefa *</Label>
                  <Input 
                    placeholder="Ex: Desenvolver integração com Webhook de Pagamento" 
                    value={taskTitulo} 
                    onChange={e => setTaskTitulo(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Tipo</Label>
                    <Select value={taskTipo} onValueChange={setTaskTipo}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Desenvolvimento">Desenvolvimento</SelectItem>
                        <SelectItem value="Story">User Story</SelectItem>
                        <SelectItem value="Bug">Bug / Correção</SelectItem>
                        <SelectItem value="Design">UI / UX Design</SelectItem>
                        <SelectItem value="Teste">Teste & QA</SelectItem>
                        <SelectItem value="Documentação">Documentação</SelectItem>
                        <SelectItem value="Deploy">Deploy & DevOps</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Prioridade</Label>
                    <Select value={taskPrioridade} onValueChange={(v: any) => setTaskPrioridade(v)}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa</SelectItem>
                        <SelectItem value="Média">Média</SelectItem>
                        <SelectItem value="Alta">Alta</SelectItem>
                        <SelectItem value="Crítica">Crítica (Urgente)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Responsável</Label>
                    <Input 
                      value={taskResponsavel} 
                      onChange={e => setTaskResponsavel(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Estimativa (Horas)</Label>
                    <Input 
                      type="number" 
                      value={taskHoras} 
                      onChange={e => setTaskHoras(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Prazo de Entrega</Label>
                  <Input 
                    type="date" 
                    value={taskPrazo} 
                    onChange={e => setTaskPrazo(e.target.value)} 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setTaskModalOpen(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Salvar Task
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          {/* Quick Time Logging */}
          <Dialog open={timeModalOpen} onOpenChange={setTimeModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="rounded-xl gap-1.5 font-bold text-xs h-8">
                <Clock className="w-3.5 h-3.5 text-orange-500" /> Apontar Horas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Registrar Apontamento de Horas
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleQuickTime} className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Horas Trabalhadas</Label>
                    <Input 
                      type="number" 
                      step="0.5" 
                      value={timeHoras} 
                      onChange={e => setTimeHoras(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs font-bold"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Colaborador</Label>
                    <Input 
                      value={timeColaborador} 
                      onChange={e => setTimeColaborador(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Descrição da Atividade Executada *</Label>
                  <Input 
                    placeholder="Ex: Refatoração da autenticação e testes de carga" 
                    value={timeDesc} 
                    onChange={e => setTimeDesc(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setTimeModalOpen(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Confirmar Apontamento
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <NovoProjetoSheet>
            <Button variant="ghost" size="icon" className="rounded-xl h-8 w-8 text-muted-foreground hover:text-foreground" title="Editar Parâmetros do Projeto">
              <Settings className="w-4 h-4" />
            </Button>
          </NovoProjetoSheet>
        </div>
      </div>

      {/* Metric Strip (Barra Rápida de Indicadores Executivos) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-3 border-t text-xs">
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Progresso Real</span>
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-foreground">{stats.progressoGlobal}%</span>
            <Progress value={stats.progressoGlobal} className="h-1.5 w-16" />
          </div>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Sprint Ativa</span>
          <p className="font-bold text-xs text-foreground truncate">
            {stats.activeSprint ? stats.activeSprint.nome : 'Sem Sprint ativa'}
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Tasks Concluídas</span>
          <p className="font-bold text-xs text-foreground">
            <strong className="text-emerald-600">{stats.tasksConcluidas}</strong> / {stats.totalTasks} totais
          </p>
        </div>

        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground font-medium">Horas Consumidas</span>
          <p className="font-bold text-xs text-foreground">
            <strong className="text-blue-600 dark:text-blue-400">{stats.totalHorasApontadas}h</strong> / {stats.horasContratadas}h
          </p>
        </div>

        <div className="space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] text-muted-foreground font-medium">Marcos Entregues</span>
          <p className="font-bold text-xs text-foreground">
            <strong className="text-orange-600">{stats.milestonesConcluidos}</strong> / {stats.totalMilestones} marcos
          </p>
        </div>
      </div>
    </div>
  );
}

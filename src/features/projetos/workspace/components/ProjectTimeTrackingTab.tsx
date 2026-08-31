import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Calendar, 
  User, 
  CheckCircle2, 
  DollarSign, 
  TrendingUp 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProjectTimeTrackingTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectTimeTrackingTab({ projeto }: ProjectTimeTrackingTabProps) {
  const { timeEntries, tasks, addTimeEntry, deleteTimeEntry, stats } = useProjetoWorkspaceStore(projeto);

  const [openModal, setOpenModal] = useState(false);
  const [taskId, setTaskId] = useState('');
  const [colaboradorNome, setColaboradorNome] = useState(projeto.responsavelPrincipal || '');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [horas, setHoras] = useState('2');
  const [descricao, setDescricao] = useState('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!descricao.trim()) return;

    const taskObj = tasks.find(t => t.id === taskId);

    addTimeEntry({
      taskId: taskId || undefined,
      taskTitulo: taskObj?.titulo,
      colaboradorNome: colaboradorNome || projeto.responsavelPrincipal,
      data,
      horas: parseFloat(horas) || 1,
      descricao,
      faturavel: true,
    });

    setDescricao('');
    setHoras('2');
    setTaskId('');
    setOpenModal(false);
  };

  const percentHours = Math.round((stats.totalHorasApontadas / stats.horasContratadas) * 100);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner de Horas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Consumo de Horas</span>
              <div className="text-2xl font-bold text-blue-600">{stats.totalHorasApontadas}h</div>
              <Progress value={percentHours} className="h-1.5 w-20" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Horas Contratadas</span>
              <div className="text-2xl font-bold text-foreground">{stats.horasContratadas}h</div>
              <p className="text-[11px] text-muted-foreground">Capacidade do contrato</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Saldo Restante</span>
              <div className="text-2xl font-bold text-emerald-600">{stats.horasRestantes}h</div>
              <p className="text-[11px] text-muted-foreground">Disponível para execução</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Valor Médio / Hora</span>
              <div className="text-2xl font-bold text-orange-600">
                {`R$ ${(projeto.valorContratado / (stats.horasContratadas || 1)).toFixed(2)}`}
              </div>
              <p className="text-[11px] text-muted-foreground">Rentabilidade horária</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Timesheet */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-500" /> Registro e Apontamento de Horas (Timesheet)
            </CardTitle>
            <CardDescription className="text-xs">
              Histórico de esforço dedicado por colaborador e tarefa no projeto {projeto.codigo}.
            </CardDescription>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Apontar Horas
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-500" /> Novo Apontamento de Horas
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Vincular a uma Tarefa (Opcional)</Label>
                  <Select value={taskId} onValueChange={setTaskId}>
                    <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue placeholder="Selecione a tarefa..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Geral do Projeto (Sem Task Específica)</SelectItem>
                      {tasks.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.codigo} - {t.titulo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Colaborador</Label>
                    <Input 
                      value={colaboradorNome} 
                      onChange={e => setColaboradorNome(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Horas Trabalhadas</Label>
                    <Input 
                      type="number" 
                      step="0.5" 
                      value={horas} 
                      onChange={e => setHoras(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Data do Trabalho</Label>
                  <Input 
                    type="date" 
                    value={data} 
                    onChange={e => setData(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Descrição do Trabalho Executado *</Label>
                  <Input 
                    placeholder="Ex: Desenvolvimento dos endpoints REST e documentação" 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Salvar Horas
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-5">
          {timeEntries.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <Clock className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhum apontamento de horas registrado</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Registre as horas trabalhadas da sua equipe para controle de produtividade e rentabilidade.
              </p>
              <Button 
                onClick={() => setOpenModal(true)} 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-xl text-xs gap-1.5 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              >
                <Plus className="w-3.5 h-3.5" /> Fazer Primeiro Apontamento
              </Button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {timeEntries.map((te) => (
                <div 
                  key={te.id} 
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl border bg-card hover:border-orange-500/40 transition-all text-xs gap-2 shadow-2xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{te.descricao}</span>
                      {te.taskTitulo && (
                        <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 bg-blue-50/50">
                          {te.taskTitulo}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-orange-500" /> {te.colaboradorNome}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted-foreground" /> {new Date(te.data).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-bold text-sm text-blue-600 dark:text-blue-400">{te.horas} horas</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteTimeEntry(te.id)}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { ProjectMilestone } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Flag, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Trash2, 
  Calendar, 
  Check, 
  Layers, 
  FileCheck2,
  ChevronRight
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProjectMilestonesTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectMilestonesTab({ projeto }: ProjectMilestonesTabProps) {
  const { milestones, tasks, addMilestone, updateMilestone, deleteMilestone } = useProjetoWorkspaceStore(projeto);

  const [openModal, setOpenModal] = useState(false);
  const [nivel, setNivel] = useState<1 | 2 | 3>(1);
  const [parentId, setParentId] = useState('');
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [dataPrevisao, setDataPrevisao] = useState('');
  const [responsavel, setResponsavel] = useState(projeto.responsavelPrincipal || '');
  const [entregavel, setEntregavel] = useState('');

  const concluidosCount = milestones.filter(m => m.status === 'Concluído').length;
  const totalCount = milestones.length;
  const percentualConclusao = totalCount > 0 ? Math.round((concluidosCount / totalCount) * 100) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    addMilestone({
      nivel,
      parentId: parentId || undefined,
      titulo,
      descricao,
      dataPrevisao: dataPrevisao || new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      responsavel: responsavel || projeto.responsavelPrincipal,
      status: 'Pendente',
      entregavel: entregavel || undefined,
    });

    setTitulo('');
    setDescricao('');
    setDataPrevisao('');
    setEntregavel('');
    setParentId('');
    setOpenModal(false);
  };

  const toggleStatus = (m: ProjectMilestone) => {
    const isConcluido = m.status === 'Concluído';
    updateMilestone(m.id, {
      status: isConcluido ? 'Em Andamento' : 'Concluído',
      dataConclusao: isConcluido ? undefined : new Date().toISOString().split('T')[0],
    });
  };

  // Calcular progresso do marco com base nas tasks vinculadas a ele
  const getMilestoneProgress = (m: ProjectMilestone) => {
    if (m.status === 'Concluído') return 100;
    const linkedTasks = tasks.filter(t => t.marcoId === m.id);
    if (linkedTasks.length === 0) return m.status === 'Em Andamento' ? 50 : 0;
    const doneTasks = linkedTasks.filter(t => t.status === 'Concluído').length;
    return Math.round((doneTasks / linkedTasks.length) * 100);
  };

  const macroMarcos = milestones.filter(m => m.nivel === 1 || !m.nivel);
  const marcosSecundarios = milestones.filter(m => m.nivel === 2 || m.nivel === 3);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner com Indicadores */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Conclusão de Marcos</span>
              <div className="text-2xl font-bold text-foreground">{percentualConclusao}%</div>
              <p className="text-[11px] text-muted-foreground">{concluidosCount} de {totalCount} entregues</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
              <Flag className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Macro Fases</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{macroMarcos.length}</div>
              <p className="text-[11px] text-muted-foreground">Grandes etapas estruturais</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Marcos Pendentes</span>
              <div className="text-2xl font-bold text-amber-600">{totalCount - concluidosCount}</div>
              <p className="text-[11px] text-muted-foreground">Em execução ou aguardando</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista Hierárquica de Marcos */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flag className="w-4 h-4 text-orange-500" /> Estrutura Hierárquica de Marcos
            </CardTitle>
            <CardDescription className="text-xs">
              Macro Fases (Nível 1), Marcos Principais (Nível 2) e Marcos Secundários (Nível 3).
            </CardDescription>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Adicionar Marco
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Flag className="w-4 h-4 text-orange-500" /> Novo Marco de Entrega
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Nível do Marco</Label>
                    <Select value={String(nivel)} onValueChange={(v: any) => setNivel(parseInt(v) as any)}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Nível 1 — Macro Marco (Fase)</SelectItem>
                        <SelectItem value="2">Nível 2 — Marco Principal</SelectItem>
                        <SelectItem value="3">Nível 3 — Marco Secundário</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Fase Pai (Opcional)</Label>
                    <Select value={parentId} onValueChange={setParentId}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue placeholder="Vincular Macro" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Nenhum (Raiz)</SelectItem>
                        {macroMarcos.map(m => (
                          <SelectItem key={m.id} value={m.id}>{m.titulo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Título do Marco *</Label>
                  <Input 
                    placeholder="Ex: Homologação do Módulo de Pagamentos" 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Descrição / Critérios de Aceite</Label>
                  <Input 
                    placeholder="Ex: Checkout testado em ambiente de homologação e aprovado pelo cliente" 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)} 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Data Prevista *</Label>
                    <Input 
                      type="date" 
                      value={dataPrevisao} 
                      onChange={e => setDataPrevisao(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Responsável</Label>
                    <Input 
                      value={responsavel} 
                      onChange={e => setResponsavel(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Entregável Associado</Label>
                  <Input 
                    placeholder="Ex: Versão v1.0.0 em Produção" 
                    value={entregavel} 
                    onChange={e => setEntregavel(e.target.value)} 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Salvar Marco
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-5">
          {milestones.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <Flag className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhum marco cadastrado</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Crie macro marcos (fases) e entregáveis principais para acompanhar o avanço real do projeto.
              </p>
              <Button 
                onClick={() => setOpenModal(true)} 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-xl text-xs gap-1.5 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              >
                <Plus className="w-3.5 h-3.5" /> Criar Primeiro Marco
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {macroMarcos.map((macro) => {
                const subMarcos = milestones.filter(m => m.parentId === macro.id);
                const isMacroDone = macro.status === 'Concluído';
                const progress = getMilestoneProgress(macro);

                return (
                  <div key={macro.id} className="space-y-2 border rounded-2xl p-4 bg-muted/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => toggleStatus(macro)}
                          className={`w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                            isMacroDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-muted-foreground/40 bg-background hover:border-orange-500'
                          }`}
                        >
                          {isMacroDone && <Check className="w-4 h-4 stroke-[3]" />}
                        </button>

                        <div>
                          <div className="flex items-center gap-2">
                            <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]">
                              Macro Marco (Fase)
                            </Badge>
                            <h4 className={`font-bold text-sm ${isMacroDone ? 'line-through opacity-70 text-emerald-900 dark:text-emerald-200' : 'text-foreground'}`}>
                              {macro.titulo}
                            </h4>
                          </div>
                          {macro.descricao && <p className="text-xs text-muted-foreground mt-0.5">{macro.descricao}</p>}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right text-xs">
                          <span className="text-muted-foreground block text-[10px]">Previsão:</span>
                          <strong className="text-foreground">{new Date(macro.dataPrevisao).toLocaleDateString('pt-BR')}</strong>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMilestone(macro.id)}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-xl"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Progresso calculado</span>
                        <span className="font-bold text-foreground">{progress}%</span>
                      </div>
                      <Progress value={progress} className="h-1.5" />
                    </div>

                    {/* Submarcos */}
                    {subMarcos.length > 0 && (
                      <div className="pl-6 pt-2 space-y-2 border-l-2 border-orange-500/20 ml-3">
                        {subMarcos.map(sub => {
                          const isSubDone = sub.status === 'Concluído';
                          return (
                            <div key={sub.id} className="flex items-center justify-between p-2.5 rounded-xl bg-card border text-xs">
                              <div className="flex items-center gap-2.5">
                                <button
                                  onClick={() => toggleStatus(sub)}
                                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 cursor-pointer ${
                                    isSubDone ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-muted-foreground/40 bg-background'
                                  }`}
                                >
                                  {isSubDone && <Check className="w-3 h-3 stroke-[3]" />}
                                </button>
                                <span className={`font-semibold ${isSubDone ? 'line-through opacity-70' : 'text-foreground'}`}>
                                  {sub.titulo}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span>{new Date(sub.dataPrevisao).toLocaleDateString('pt-BR')}</span>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => deleteMilestone(sub.id)}
                                  className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive rounded"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

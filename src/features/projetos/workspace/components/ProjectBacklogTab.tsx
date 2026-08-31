import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { ProjectBacklogItem, ComplexidadeBacklog } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Package, 
  Plus, 
  Search, 
  Trash2, 
  ArrowRight, 
  Layers, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Zap,
  SlidersHorizontal
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ProjectBacklogTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectBacklogTab({ projeto, onNavigateTab }: ProjectBacklogTabProps) {
  const { backlogs, sprints, requirements, addBacklogItem, updateBacklogItem, deleteBacklogItem, convertBacklogToSprintTask } = useProjetoWorkspaceStore(projeto);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('Todos');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<any>('Feature');
  const [prioridade, setPrioridade] = useState<any>('Média');
  const [complexidade, setComplexidade] = useState<ComplexidadeBacklog>('M');
  const [storyPoints, setStoryPoints] = useState('5');
  const [estimativaHoras, setEstimativaHoras] = useState('16');
  const [requisitoId, setRequisitoId] = useState('');
  const [responsavel, setResponsavel] = useState(projeto.responsavelPrincipal || '');

  const filteredBacklog = backlogs.filter(item => {
    const matchesSearch = (item.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (item.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'Todos' || item.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    addBacklogItem({
      titulo,
      descricao,
      tipo,
      prioridade,
      complexidade,
      storyPoints: parseInt(storyPoints) || 5,
      estimativaHoras: parseInt(estimativaHoras) || 16,
      requisitoId: requisitoId || undefined,
      status: 'Pronto para Sprint',
      responsavel: responsavel || undefined,
    });

    setTitulo('');
    setDescricao('');
    setStoryPoints('5');
    setEstimativaHoras('16');
    setOpenModal(false);
  };

  const activeSprint = sprints.find(s => s.status === 'Ativa') || sprints[0];

  const getComplexidadeBadge = (c: ComplexidadeBacklog) => {
    switch (c) {
      case 'GG': return <Badge variant="destructive" className="text-[10px] font-bold">GG (Muito Alta)</Badge>;
      case 'G': return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]">G (Grande)</Badge>;
      case 'M': return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 text-[10px]">M (Média)</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">P (Pequena)</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Resumo de Backlog */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Itens no Backlog</span>
              <div className="text-2xl font-bold text-foreground">{backlogs.length}</div>
              <p className="text-[11px] text-muted-foreground">Estórias e melhorias mapeadas</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
              <Package className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Total de Story Points</span>
              <div className="text-2xl font-bold text-purple-600">{backlogs.reduce((acc, b) => acc + (b.storyPoints || 0), 0)} pts</div>
              <p className="text-[11px] text-muted-foreground">Volume de complexidade</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/30 flex items-center justify-center text-purple-600">
              <Flame className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Prontos para Sprint</span>
              <div className="text-2xl font-bold text-emerald-600">{backlogs.filter(b => b.status === 'Pronto para Sprint').length}</div>
              <p className="text-[11px] text-muted-foreground">Refinados pela engenharia</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs text-muted-foreground font-medium">Horas Estimadas</span>
              <div className="text-2xl font-bold text-blue-600">{backlogs.reduce((acc, b) => acc + (b.estimativaHoras || 0), 0)}h</div>
              <p className="text-[11px] text-muted-foreground">Esforço previsto total</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Backlog List */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Package className="w-4 h-4 text-orange-500" /> Backlog de Produto & Refinamento
            </CardTitle>
            <CardDescription className="text-xs">
              Mapeie histórias de usuário, defina complexidade e envie para as Sprints de execução.
            </CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input 
                placeholder="Buscar no backlog..." 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
                className="pl-8 text-xs h-8 rounded-xl"
              />
            </div>

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 text-xs rounded-xl w-36">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todos os Status</SelectItem>
                <SelectItem value="Pronto para Sprint">Pronto para Sprint</SelectItem>
                <SelectItem value="Refinado">Refinado</SelectItem>
                <SelectItem value="Novo">Novo</SelectItem>
                <SelectItem value="Em Sprint">Em Sprint</SelectItem>
              </SelectContent>
            </Select>

            <Dialog open={openModal} onOpenChange={setOpenModal}>
              <DialogTrigger asChild>
                <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                  <Plus className="w-3.5 h-3.5" /> Novo Item
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg rounded-2xl">
                <DialogHeader>
                  <DialogTitle className="text-base font-bold flex items-center gap-2">
                    <Package className="w-4 h-4 text-orange-500" /> Adicionar Item ao Backlog
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Título do Item / Estória *</Label>
                    <Input 
                      placeholder="Ex: Como usuário, quero filtrar relatórios por data de emissão" 
                      value={titulo} 
                      onChange={e => setTitulo(e.target.value)} 
                      required 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Descrição / Critérios de Aceite</Label>
                    <Textarea 
                      placeholder="Especificação de comportamento, endpoints e componentes visuais..." 
                      value={descricao} 
                      onChange={e => setDescricao(e.target.value)} 
                      className="rounded-xl h-20 text-xs resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Tipo</Label>
                      <Select value={tipo} onValueChange={setTipo}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Feature">Feature / Funcionalidade</SelectItem>
                          <SelectItem value="Melhoria">Melhoria de Performance</SelectItem>
                          <SelectItem value="Bug">Bugfix</SelectItem>
                          <SelectItem value="Técnica">Dívida Técnica</SelectItem>
                          <SelectItem value="Pesquisa">Spike / Pesquisa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Requisito de Origem (Opcional)</Label>
                      <Select value={requisitoId} onValueChange={setRequisitoId}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue placeholder="Vincular Requisito" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Sem vínculo</SelectItem>
                          {requirements.map(r => (
                            <SelectItem key={r.id} value={r.id}>{r.codigo} - {r.titulo}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <Label className="font-semibold">Complexidade</Label>
                      <Select value={complexidade} onValueChange={(v: any) => setComplexidade(v)}>
                        <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="P">P (Pequena)</SelectItem>
                          <SelectItem value="M">M (Média)</SelectItem>
                          <SelectItem value="G">G (Grande)</SelectItem>
                          <SelectItem value="GG">GG (Muito Alta)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Story Points</Label>
                      <Input 
                        type="number" 
                        value={storyPoints} 
                        onChange={e => setStoryPoints(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="font-semibold">Estimativa (Horas)</Label>
                      <Input 
                        type="number" 
                        value={estimativaHoras} 
                        onChange={e => setEstimativaHoras(e.target.value)} 
                        className="rounded-xl h-9 text-xs"
                      />
                    </div>
                  </div>

                  <DialogFooter className="pt-3">
                    <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                      Cancelar
                    </Button>
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                      Salvar Item no Backlog
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-5">
          {filteredBacklog.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <Package className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhum item no Backlog</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Adicione histórias de usuário e tarefas para serem priorizadas nas próximas sprints.
              </p>
              <Button 
                onClick={() => setOpenModal(true)} 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-xl text-xs gap-1.5 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Primeiro Item
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredBacklog.map((item) => {
                const reqVinculado = requirements.find(r => r.id === item.requisitoId);

                return (
                  <div 
                    key={item.id} 
                    className="p-4 rounded-2xl border bg-card hover:border-orange-500/40 transition-all shadow-2xs space-y-2.5"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-xs text-purple-600 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-900">
                          {item.codigo}
                        </span>
                        <Badge variant="outline" className="text-[10px]">{item.tipo}</Badge>
                        {getComplexidadeBadge(item.complexidade)}
                        <h4 className="font-bold text-sm text-foreground">{item.titulo}</h4>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge className="bg-muted text-muted-foreground text-[10px]">
                          {item.status}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteBacklogItem(item.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
                          title="Excluir item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {item.descricao && (
                      <p className="text-xs text-muted-foreground">{item.descricao}</p>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t text-[11px] text-muted-foreground">
                      <div className="flex flex-wrap items-center gap-3">
                        <span>Story Points: <strong>{item.storyPoints} pts</strong></span>
                        <span>•</span>
                        <span>Estimativa: <strong>{item.estimativaHoras}h</strong></span>
                        {reqVinculado && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1 font-semibold">
                              <Layers className="w-3 h-3" /> Requisito {reqVinculado.codigo}
                            </span>
                          </>
                        )}
                      </div>

                      {activeSprint && item.status !== 'Em Sprint' && item.status !== 'Concluído' && (
                        <Button 
                          size="sm" 
                          onClick={() => convertBacklogToSprintTask(item.id, activeSprint.id)}
                          className="bg-orange-600 hover:bg-orange-700 text-white h-7 text-[11px] rounded-lg gap-1 font-bold shadow-xs cursor-pointer"
                        >
                          <Zap className="w-3 h-3" /> Mover para {activeSprint.nome}
                        </Button>
                      )}
                    </div>
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

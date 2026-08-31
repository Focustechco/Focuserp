import React, { useState } from 'react';
import { Projeto, ProjetoMilestone } from '../types';
import { useProjetoDetalhesStore } from '../hooks/useProjetoDetalhesStore';
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
  Layers, 
  Check, 
  Target,
  FileCheck2
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface ProjetoMilestonesViewProps {
  projeto: Projeto;
}

export function ProjetoMilestonesView({ projeto }: ProjetoMilestonesViewProps) {
  const { milestones, addMilestone, toggleMilestone, deleteMilestone } = useProjetoDetalhesStore(projeto.id);
  
  const [openModal, setOpenModal] = useState(false);
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
      titulo,
      descricao,
      dataPrevisao: dataPrevisao || new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      responsavel: responsavel || projeto.responsavelPrincipal,
      status: 'Pendente',
      entregavel: entregavel || undefined,
      percentualProgresso: 0
    });

    setTitulo('');
    setDescricao('');
    setDataPrevisao('');
    setEntregavel('');
    setOpenModal(false);
  };

  const getStatusBadge = (status: ProjetoMilestone['status']) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 gap-1"><CheckCircle2 className="w-3 h-3" /> Concluído</Badge>;
      case 'Em Andamento':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20 gap-1"><Clock className="w-3 h-3" /> Em Andamento</Badge>;
      case 'Atrasado':
        return <Badge className="bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 gap-1"><AlertTriangle className="w-3 h-3" /> Atrasado</Badge>;
      default:
        return <Badge variant="secondary" className="gap-1"><Clock className="w-3 h-3" /> Pendente</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner com Indicadores */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Progresso dos Marcos</span>
              <div className="text-2xl font-bold text-foreground">{percentualConclusao}%</div>
              <p className="text-[11px] text-muted-foreground">{concluidosCount} de {totalCount} marcos concluídos</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
              <Flag className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Marcos Concluídos</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{concluidosCount}</div>
              <p className="text-[11px] text-muted-foreground">Entregáveis homologados</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Marcos Pendentes</span>
              <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">{totalCount - concluidosCount}</div>
              <p className="text-[11px] text-muted-foreground">Em execução ou aguardando</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header da Seção de Marcos */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Flag className="w-4 h-4 text-orange-500" /> Milestones & Marcos de Entrega
            </CardTitle>
            <CardDescription className="text-xs">
              Pontos de controle e entregáveis do projeto {projeto.codigo} ({projeto.nome}).
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
                  <Flag className="w-4 h-4 text-orange-500" /> Novo Marco de Entrega (Milestone)
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Título do Marco *</Label>
                  <Input 
                    placeholder="Ex: Entrega e Homologação do MVP" 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Descrição / Critérios de Aceite</Label>
                  <Input 
                    placeholder="Ex: Telas de cadastro e relatórios aprovados pelo cliente..." 
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
                      placeholder="Nome do líder" 
                      value={responsavel} 
                      onChange={e => setResponsavel(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Entregável Associado (Opcional)</Label>
                  <Input 
                    placeholder="Ex: Versão v1.0.0 em Staging / Documento de Homologação" 
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
              <h4 className="font-bold text-sm text-foreground">Nenhum marco cadastrado para este projeto</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Adicione marcos de entrega importantes (Kickoff, Wireframes, MVP, Homologação, Go-Live) para acompanhar a evolução.
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
            <div className="space-y-3">
              {milestones.map((m, idx) => {
                const isConcluido = m.status === 'Concluído';
                return (
                  <div 
                    key={m.id} 
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition-all gap-3 ${
                      isConcluido ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-500/30' : 'bg-card hover:border-orange-500/40 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-3.5">
                      <button
                        onClick={() => toggleMilestone(m.id)}
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center mt-0.5 transition-colors cursor-pointer shrink-0 ${
                          isConcluido 
                            ? 'bg-emerald-600 border-emerald-600 text-white' 
                            : 'border-muted-foreground/40 hover:border-orange-500 bg-background'
                        }`}
                        title={isConcluido ? "Marcar como pendente" : "Marcar como concluído"}
                      >
                        {isConcluido && <Check className="w-4 h-4 stroke-[3]" />}
                      </button>

                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className={`text-sm font-bold text-foreground ${isConcluido ? 'line-through opacity-75 text-emerald-900 dark:text-emerald-200' : ''}`}>
                            {m.titulo}
                          </h4>
                          {getStatusBadge(m.status)}
                        </div>

                        {m.descricao && (
                          <p className="text-xs text-muted-foreground">{m.descricao}</p>
                        )}

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground pt-1">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-orange-500" /> Previsão: <strong>{new Date(m.dataPrevisao).toLocaleDateString('pt-BR')}</strong>
                          </span>
                          {m.dataConclusao && (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <CheckCircle2 className="w-3 h-3" /> Concluído em: {new Date(m.dataConclusao).toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {m.responsavel && (
                            <span>• Responsável: <strong>{m.responsavel}</strong></span>
                          )}
                          {m.entregavel && (
                            <span className="bg-muted px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1">
                              <FileCheck2 className="w-2.5 h-2.5" /> {m.entregavel}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteMilestone(m.id)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-xl cursor-pointer"
                        title="Excluir marco"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
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

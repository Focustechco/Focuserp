import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useProjetoWorkspaceStore } from '../useProjetoWorkspaceStore';
import { ProjectRisk, StatusRisco } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

interface ProjectRiscosTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

export function ProjectRiscosTab({ projeto }: ProjectRiscosTabProps) {
  const { risks, tasks, addRisk, updateRisk, deleteRisk, updateTask } = useProjetoWorkspaceStore(projeto);

  const [openModal, setOpenModal] = useState(false);
  const [titulo, setTitulo] = useState('');
  const [descricao, setDescricao] = useState('');
  const [probabilidade, setProbabilidade] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [impacto, setImpacto] = useState<'Baixo' | 'Médio' | 'Alto' | 'Crítico'>('Alto');
  const [responsavel, setResponsavel] = useState(projeto.responsavelPrincipal || '');
  const [planoMitigacao, setPlanoMitigacao] = useState('');

  const blockedTasks = tasks.filter(t => t.bloqueada || t.status === 'Bloqueado');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim()) return;

    const nivelRisco = (impacto === 'Crítico' || (impacto === 'Alto' && probabilidade === 'Alta')) ? 'Crítico' :
                       (impacto === 'Alto' || probabilidade === 'Alta') ? 'Alto' :
                       (impacto === 'Médio' || probabilidade === 'Média') ? 'Médio' : 'Baixo';

    addRisk({
      titulo,
      descricao,
      probabilidade,
      impacto,
      nivelRisco,
      responsavel: responsavel || projeto.responsavelPrincipal,
      planoMitigacao: planoMitigacao || 'Monitoramento preventivo semanal.',
      status: 'Identificado',
    });

    setTitulo('');
    setDescricao('');
    setPlanoMitigacao('');
    setOpenModal(false);
  };

  const getRiscoBadge = (nivel: string) => {
    switch (nivel) {
      case 'Crítico': return <Badge variant="destructive" className="text-[10px] font-bold">Risco Crítico</Badge>;
      case 'Alto': return <Badge className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20 text-[10px]">Risco Alto</Badge>;
      case 'Médio': return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 text-[10px]">Risco Médio</Badge>;
      default: return <Badge variant="secondary" className="text-[10px]">Risco Baixo</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Seção de Bloqueios Ativos de Tasks */}
      {blockedTasks.length > 0 && (
        <Card className="rounded-2xl border-rose-200 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-rose-700 dark:text-rose-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Bloqueios Ativos em Tarefas ({blockedTasks.length})
            </CardTitle>
            <CardDescription className="text-xs text-rose-600/80">
              Impedimentos operacionais necessitando de intervenção imediata para desatar a sprint.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-xs">
            {blockedTasks.map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-rose-200 dark:border-rose-900">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-orange-600">{t.codigo}</span>
                    <span className="font-bold text-foreground">{t.titulo}</span>
                  </div>
                  <p className="text-[11px] text-rose-600 font-medium">Motivo: {t.motivoBloqueio || 'Aguardando liberação de dependência externa ou cliente.'}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => updateTask(t.id, { bloqueada: false, status: 'Em Andamento' })}
                  className="rounded-lg text-[11px] text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7"
                >
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Desbloquear
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Matriz de Riscos */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-orange-500" /> Matriz de Riscos & Planos de Mitigação
            </CardTitle>
            <CardDescription className="text-xs">
              Mapeamento de riscos técnicos, operacionais e financeiros com planos de contingência.
            </CardDescription>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Mapear Novo Risco
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-orange-500" /> Mapear Risco do Projeto
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Título do Risco *</Label>
                  <Input 
                    placeholder="Ex: Atraso na liberação de chaves de API pelo cliente" 
                    value={titulo} 
                    onChange={e => setTitulo(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Descrição / Causa Raiz</Label>
                  <Textarea 
                    placeholder="Detalhamento do impacto potencial nas entregas e custos..." 
                    value={descricao} 
                    onChange={e => setDescricao(e.target.value)} 
                    className="rounded-xl h-20 text-xs resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Probabilidade</Label>
                    <Select value={probabilidade} onValueChange={(v: any) => setProbabilidade(v)}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixa">Baixa (&lt; 25%)</SelectItem>
                        <SelectItem value="Média">Média (25% - 60%)</SelectItem>
                        <SelectItem value="Alta">Alta (&gt; 60%)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Impacto</Label>
                    <Select value={impacto} onValueChange={(v: any) => setImpacto(v)}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Baixo">Baixo</SelectItem>
                        <SelectItem value="Médio">Médio</SelectItem>
                        <SelectItem value="Alto">Alto</SelectItem>
                        <SelectItem value="Crítico">Crítico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Plano de Mitigação / Ação de Contingência</Label>
                  <Textarea 
                    placeholder="O que será feito para evitar ou reduzir o impacto deste risco..." 
                    value={planoMitigacao} 
                    onChange={e => setPlanoMitigacao(e.target.value)} 
                    className="rounded-xl h-20 text-xs resize-none"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Salvar Risco
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-5">
          {risks.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <ShieldAlert className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhum risco mapeado</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Registre os riscos potenciais do projeto para manter a gestão preventiva e transparente.
              </p>
              <Button 
                onClick={() => setOpenModal(true)} 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-xl text-xs gap-1.5 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              >
                <Plus className="w-3.5 h-3.5" /> Mapear Primeiro Risco
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {risks.map((risk) => (
                <div 
                  key={risk.id} 
                  className="p-4 rounded-2xl border bg-card hover:border-orange-500/40 transition-all shadow-2xs space-y-2.5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {getRiscoBadge(risk.nivelRisco)}
                      <h4 className="font-bold text-sm text-foreground">{risk.titulo}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select 
                        value={risk.status} 
                        onValueChange={(newStatus: StatusRisco) => updateRisk(risk.id, { status: newStatus })}
                      >
                        <SelectTrigger className="h-7 text-[11px] rounded-lg w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Identificado">Identificado</SelectItem>
                          <SelectItem value="Em Monitoramento">Em Monitoramento</SelectItem>
                          <SelectItem value="Mitigado">Mitigado</SelectItem>
                          <SelectItem value="Ocorrido / Bloqueado">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteRisk(risk.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {risk.descricao && (
                    <p className="text-xs text-muted-foreground">{risk.descricao}</p>
                  )}

                  <div className="p-2.5 rounded-xl border bg-muted/20 text-xs">
                    <span className="font-bold text-foreground block text-[11px] text-orange-600 mb-0.5">Plano de Mitigação:</span>
                    <p className="text-muted-foreground text-[11px]">{risk.planoMitigacao}</p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t">
                    <span>Probabilidade: <strong>{risk.probabilidade}</strong> • Impacto: <strong>{risk.impacto}</strong></span>
                    <span>Resp: <strong>{risk.responsavel}</strong></span>
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

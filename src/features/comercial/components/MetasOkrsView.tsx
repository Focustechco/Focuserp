import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Award, Plus, Edit3, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useComercialStore } from '../hooks/useComercialStore';
import { MetaComercial, OkrComercial } from '../types';
import { toast } from 'sonner';

export function MetasOkrsView() {
  const { metas, okrs, addMetaItem, updateMetaItem, deleteMetaItem, addOkrItem, updateOkrItem, deleteOkrItem } = useComercialStore();

  // Estados de Edição/Criação de Metas
  const [openMeta, setOpenMeta] = useState(false);
  const [editingMeta, setEditingMeta] = useState<MetaComercial | null>(null);
  const [novaMeta, setNovaMeta] = useState<Partial<MetaComercial>>({
    tipo: 'Mensal',
    categoriaTarget: 'Receita Total',
    status: 'Em Andamento',
    valorRealizado: 0,
    valorMeta: 0,
    periodo: '',
    aplicadaA: 'Equipe Geral'
  });

  // Estados de Edição/Criação de OKRs
  const [openOkr, setOpenOkr] = useState(false);
  const [editingOkr, setEditingOkr] = useState<OkrComercial | null>(null);
  const [novoOkr, setNovoOkr] = useState<Partial<OkrComercial>>({
    status: 'No Prazo',
    percentualConclusao: 0,
    periodo: '',
    responsavel: ''
  });

  // Handlers para Metas
  const handleOpenCreateMeta = () => {
    setEditingMeta(null);
    setNovaMeta({
      titulo: '',
      tipo: 'Mensal',
      categoriaTarget: 'Receita Total',
      status: 'Em Andamento',
      valorRealizado: 0,
      valorMeta: 0,
      periodo: '',
      aplicadaA: 'Equipe Geral'
    });
    setOpenMeta(true);
  };

  const handleOpenEditMeta = (meta: MetaComercial) => {
    setEditingMeta(meta);
    setNovaMeta({
      ...meta,
      valorMeta: meta.valorMeta || (meta as any).valorMetaR$ || 0,
      valorRealizado: meta.valorRealizado || (meta as any).valorRealizadoR$ || 0
    });
    setOpenMeta(true);
  };

  const handleDeleteMeta = (meta: MetaComercial) => {
    if (window.confirm(`Tem certeza que deseja excluir a meta "${meta.titulo}"?`)) {
      deleteMetaItem(meta.id);
      toast.success(`Meta "${meta.titulo}" excluída com sucesso!`);
    }
  };

  const handleSaveMeta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMeta.titulo) {
      toast.error('Informe o título da meta.');
      return;
    }

    if (editingMeta) {
      updateMetaItem(editingMeta.id, {
        titulo: novaMeta.titulo,
        aplicadaA: novaMeta.aplicadaA || 'Equipe Geral',
        categoriaTarget: novaMeta.categoriaTarget || 'Receita Total',
        tipo: novaMeta.tipo || 'Mensal',
        valorMeta: Number(novaMeta.valorMeta) || 0,
        valorRealizado: Number(novaMeta.valorRealizado) || 0,
        periodo: novaMeta.periodo || 'Março 2026',
        status: novaMeta.status || 'Em Andamento'
      });
      toast.success('Meta comercial atualizada com sucesso!');
    } else {
      addMetaItem({
        id: `m-${Date.now()}`,
        titulo: novaMeta.titulo,
        aplicadaA: novaMeta.aplicadaA || 'Equipe Geral',
        categoriaTarget: novaMeta.categoriaTarget || 'Receita Total',
        tipo: novaMeta.tipo || 'Mensal',
        valorMeta: Number(novaMeta.valorMeta) || 0,
        valorRealizado: Number(novaMeta.valorRealizado) || 0,
        periodo: novaMeta.periodo || 'Março 2026',
        status: 'Em Andamento'
      } as MetaComercial);
      toast.success('Meta comercial adicionada com sucesso!');
    }

    setOpenMeta(false);
  };

  // Handlers para OKRs
  const handleOpenCreateOkr = () => {
    setEditingOkr(null);
    setNovoOkr({
      objetivo: '',
      keyResult: '',
      responsavel: 'Adriano Leal',
      periodo: 'Q1 2026',
      percentualConclusao: 0,
      status: 'No Prazo'
    });
    setOpenOkr(true);
  };

  const handleOpenEditOkr = (okr: OkrComercial) => {
    setEditingOkr(okr);
    setNovoOkr({ ...okr });
    setOpenOkr(true);
  };

  const handleDeleteOkr = (okr: OkrComercial) => {
    if (window.confirm(`Tem certeza que deseja excluir o OKR "${okr.objetivo}"?`)) {
      deleteOkrItem(okr.id);
      toast.success(`OKR "${okr.objetivo}" excluído com sucesso!`);
    }
  };

  const handleSaveOkr = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoOkr.objetivo || !novoOkr.keyResult) {
      toast.error('Preencha o Objetivo e Key Result.');
      return;
    }

    if (editingOkr) {
      updateOkrItem(editingOkr.id, {
        objetivo: novoOkr.objetivo,
        keyResult: novoOkr.keyResult,
        responsavel: novoOkr.responsavel || 'Adriano Leal',
        periodo: novoOkr.periodo || 'Q1 2026',
        percentualConclusao: Number(novoOkr.percentualConclusao) || 0,
        status: novoOkr.status || 'No Prazo'
      });
      toast.success('OKR comercial atualizado!');
    } else {
      addOkrItem({
        id: `okr-${Date.now()}`,
        objetivo: novoOkr.objetivo,
        keyResult: novoOkr.keyResult,
        responsavel: novoOkr.responsavel || 'Adriano Leal',
        periodo: novoOkr.periodo || 'Q1 2026',
        percentualConclusao: Number(novoOkr.percentualConclusao) || 0,
        status: novoOkr.status || 'No Prazo'
      } as OkrComercial);
      toast.success('OKR comercial cadastrado!');
    }

    setOpenOkr(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* SEÇÃO 1: METAS COMERCIAIS */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" /> Metas Comerciais
            </CardTitle>
            <CardDescription className="text-xs">
              Acompanhamento de metas financeiras, contratos e produtividade por consultor e time.
            </CardDescription>
          </div>
          <Button 
            onClick={handleOpenCreateMeta}
            size="sm" 
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1 text-xs h-8 font-bold shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Nova Meta
          </Button>
        </CardHeader>
        <CardContent>
          {metas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/20 text-xs">Nenhuma meta cadastrada.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metas.map(meta => {
                const valMeta = meta.valorMeta || (meta as any).valorMetaR$ || 1;
                const valReal = meta.valorRealizado || (meta as any).valorRealizadoR$ || 0;
                const perc = Math.min(100, Math.round((valReal / valMeta) * 100));

                return (
                  <div key={meta.id} className="p-4 border rounded-2xl bg-card space-y-3 shadow-2xs hover:border-orange-500/40 transition-all flex flex-col justify-between">
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        <Badge variant="outline" className="text-[10px]">{meta.tipo}</Badge>
                        <Badge 
                          className={
                            meta.status === 'Atingida' || meta.status === 'Superada' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px]' :
                            meta.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 text-[10px]' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 text-[10px]'
                          }
                        >
                          {meta.status}
                        </Badge>
                      </div>
                      <div>
                        <h4 className="font-bold text-sm leading-tight text-foreground">{meta.titulo}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">Alvo: <strong>{meta.aplicadaA}</strong> ({meta.periodo})</p>
                      </div>
                      <div className="space-y-1 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Progresso:</span>
                          <span className="font-bold text-foreground">{perc}%</span>
                        </div>
                        <Progress value={perc} className="h-2" />
                        <div className="flex justify-between text-[11px] pt-1 text-muted-foreground font-mono">
                          <span>{valReal.toLocaleString('pt-BR')}</span>
                          <span>Meta: {valMeta.toLocaleString('pt-BR')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-3 border-t mt-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleOpenEditMeta(meta)}
                        className="h-7 text-xs px-2 gap-1 cursor-pointer font-medium"
                      >
                        <Edit3 className="w-3 h-3 text-blue-600" /> Editar
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => handleDeleteMeta(meta)}
                        className="h-7 text-xs px-2 gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer font-medium"
                      >
                        <Trash2 className="w-3 h-3 text-rose-600" /> Excluir
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar / Editar Meta */}
      <Dialog open={openMeta} onOpenChange={setOpenMeta}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Target className="w-5 h-5 text-orange-500" /> {editingMeta ? 'Editar Meta Comercial' : 'Adicionar Nova Meta Comercial'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveMeta} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título da Meta *</Label>
              <Input required placeholder="Ex: Receita Comercial Q1 2026" value={novaMeta.titulo || ''} onChange={e => setNovaMeta({...novaMeta, titulo: e.target.value})} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Tipo</Label>
                <Select value={novaMeta.tipo} onValueChange={(val: any) => setNovaMeta({...novaMeta, tipo: val})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Mensal">Mensal</SelectItem>
                    <SelectItem value="Trimestral">Trimestral</SelectItem>
                    <SelectItem value="Semestral">Semestral</SelectItem>
                    <SelectItem value="Anual">Anual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Categoria</Label>
                <Select value={novaMeta.categoriaTarget} onValueChange={(val: any) => setNovaMeta({...novaMeta, categoriaTarget: val})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Receita Total">Receita Total</SelectItem>
                    <SelectItem value="Quantidade de Vendas">Quantidade de Vendas</SelectItem>
                    <SelectItem value="Contratos Recorrentes">Contratos Recorrentes</SelectItem>
                    <SelectItem value="Propostas Enviadas">Propostas Enviadas</SelectItem>
                    <SelectItem value="Contatos / Follow-ups">Contatos / Follow-ups</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Aplicada A</Label>
                <Input required placeholder="Ex: Equipe Geral ou Adriano" value={novaMeta.aplicadaA || ''} onChange={e => setNovaMeta({...novaMeta, aplicadaA: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Período</Label>
                <Input required placeholder="Ex: Março 2026" value={novaMeta.periodo || ''} onChange={e => setNovaMeta({...novaMeta, periodo: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Valor Alvo da Meta</Label>
                <Input type="number" required min="0" value={novaMeta.valorMeta || ''} onChange={e => setNovaMeta({...novaMeta, valorMeta: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Valor Realizado</Label>
                <Input type="number" min="0" value={novaMeta.valorRealizado || 0} onChange={e => setNovaMeta({...novaMeta, valorRealizado: Number(e.target.value)})} className="rounded-xl" />
              </div>
            </div>
            {editingMeta && (
              <div className="space-y-1.5">
                <Label className="font-semibold">Status da Meta</Label>
                <Select value={novaMeta.status} onValueChange={(val: any) => setNovaMeta({...novaMeta, status: val})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                    <SelectItem value="Atingida">Atingida</SelectItem>
                    <SelectItem value="Superada">Superada</SelectItem>
                    <SelectItem value="Em Risco">Em Risco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenMeta(false)} className="rounded-xl">Cancelar</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
                {editingMeta ? 'Atualizar Meta' : 'Salvar Meta'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* SEÇÃO 2: OKRs COMERCIAIS */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" /> OKRs Comerciais Estratégicos
            </CardTitle>
            <CardDescription className="text-xs">
              Objetivos e Key Results para impulsionar a conversão e eficiência comercial.
            </CardDescription>
          </div>
          <Button 
            onClick={handleOpenCreateOkr}
            size="sm" 
            variant="outline" 
            className="rounded-xl gap-1 text-xs h-8 font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Novo OKR
          </Button>
        </CardHeader>
        <CardContent>
          {okrs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-xl bg-muted/20 text-xs">Nenhum OKR cadastrado.</div>
          ) : (
            <div className="space-y-3 text-xs">
              {okrs.map(okr => (
                <div key={okr.id} className="p-4 border rounded-2xl bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-2xs hover:border-purple-500/40 transition-all">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{okr.periodo}</Badge>
                      <span className="font-bold text-sm text-foreground">{okr.objetivo}</span>
                    </div>
                    <p className="text-muted-foreground">🎯 Key Result: <strong>{okr.keyResult}</strong></p>
                    <p className="text-[11px] text-muted-foreground">Responsável: <strong>{okr.responsavel}</strong></p>
                  </div>
                  <div className="w-full md:w-48 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Conclusão:</span>
                      <span className="font-bold text-foreground">{okr.percentualConclusao}%</span>
                    </div>
                    <Progress value={okr.percentualConclusao} className="h-2" />
                  </div>
                  <div className="flex items-center gap-1.5 self-end md:self-center">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleOpenEditOkr(okr)}
                      className="h-7 text-xs px-2 gap-1 cursor-pointer font-medium"
                    >
                      <Edit3 className="w-3 h-3 text-blue-600" /> Editar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleDeleteOkr(okr)}
                      className="h-7 text-xs px-2 gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3 h-3 text-rose-600" /> Excluir
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Criar / Editar OKR */}
      <Dialog open={openOkr} onOpenChange={setOpenOkr}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-500" /> {editingOkr ? 'Editar OKR Comercial' : 'Adicionar Novo OKR Comercial'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSaveOkr} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Objetivo Maior (O) *</Label>
              <Input required placeholder="Ex: Aumentar a eficiência do funil comercial" value={novoOkr.objetivo || ''} onChange={e => setNovoOkr({...novoOkr, objetivo: e.target.value})} className="rounded-xl" />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Key Result (KR) *</Label>
              <Input required placeholder="Ex: Aumentar conversão para 25%" value={novoOkr.keyResult || ''} onChange={e => setNovoOkr({...novoOkr, keyResult: e.target.value})} className="rounded-xl" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Responsável</Label>
                <Input required value={novoOkr.responsavel || ''} onChange={e => setNovoOkr({...novoOkr, responsavel: e.target.value})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Período</Label>
                <Input required value={novoOkr.periodo || ''} onChange={e => setNovoOkr({...novoOkr, periodo: e.target.value})} className="rounded-xl" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">% Conclusão (0 - 100)</Label>
                <Input type="number" min="0" max="100" value={novoOkr.percentualConclusao || 0} onChange={e => setNovoOkr({...novoOkr, percentualConclusao: Number(e.target.value)})} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Status</Label>
                <Select value={novoOkr.status} onValueChange={(val: any) => setNovoOkr({...novoOkr, status: val})}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No Prazo">No Prazo</SelectItem>
                    <SelectItem value="Atenção">Atenção</SelectItem>
                    <SelectItem value="Atrasado">Atrasado</SelectItem>
                    <SelectItem value="Concluído">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setOpenOkr(false)} className="rounded-xl">Cancelar</Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
                {editingOkr ? 'Atualizar OKR' : 'Salvar OKR'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

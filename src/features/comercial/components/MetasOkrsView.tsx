import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Award, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useComercialStore } from '../hooks/useComercialStore';
import { MetaComercial, OkrComercial } from '../types';

export function MetasOkrsView() {
  const { metas, okrs, addMetaItem, addOkrItem } = useComercialStore();

  const [openMeta, setOpenMeta] = useState(false);
  const [novaMeta, setNovaMeta] = useState<Partial<MetaComercial>>({
    tipo: 'Mensal',
    categoriaTarget: 'Meta Financeira',
    status: 'Em Andamento',
    valorRealizadoR$: 0
  });

  const [openOkr, setOpenOkr] = useState(false);
  const [novoOkr, setNovoOkr] = useState<Partial<OkrComercial>>({
    status: 'No Prazo',
    percentualConclusao: 0
  });

  const handleAddMeta = (e: React.FormEvent) => {
    e.preventDefault();
    addMetaItem({
      ...novaMeta,
      id: `m-${Date.now()}`,
      titulo: novaMeta.titulo || 'Nova Meta',
      aplicadaA: novaMeta.aplicadaA || 'Equipe',
      valorMetaR$: Number(novaMeta.valorMetaR$) || 0,
      periodo: novaMeta.periodo || 'Ms Atual',
    } as MetaComercial);
    setOpenMeta(false);
  };

  const handleAddOkr = (e: React.FormEvent) => {
    e.preventDefault();
    addOkrItem({
      ...novoOkr,
      id: `okr-${Date.now()}`,
      objetivo: novoOkr.objetivo || 'Novo Objetivo',
      keyResult: novoOkr.keyResult || '',
      responsavel: novoOkr.responsavel || '',
      periodo: novoOkr.periodo || 'Trimestre',
    } as OkrComercial);
    setOpenOkr(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      {/* SEO 1: METAS COMERCIAIS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Metas Comerciais
          </CardTitle>
          <Dialog open={openMeta} onOpenChange={setOpenMeta}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1"><Plus className="w-4 h-4" /> Nova Meta</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Nova Meta</DialogTitle></DialogHeader>
              <form onSubmit={handleAddMeta} className="space-y-4 pt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label>Ttulo da Meta</Label>
                    <Input required value={novaMeta.titulo || ''} onChange={e => setNovaMeta({...novaMeta, titulo: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select value={novaMeta.tipo} onValueChange={(val: any) => setNovaMeta({...novaMeta, tipo: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Mensal">Mensal</SelectItem>
                        <SelectItem value="Trimestral">Trimestral</SelectItem>
                        <SelectItem value="Semestral">Semestral</SelectItem>
                        <SelectItem value="Anual">Anual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Categoria Alvo</Label>
                    <Select value={novaMeta.categoriaTarget} onValueChange={(val: any) => setNovaMeta({...novaMeta, categoriaTarget: val})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Meta Financeira">Meta Financeira</SelectItem>
                        <SelectItem value="Meta de Contratos">Meta de Contratos</SelectItem>
                        <SelectItem value="Meta de Projetos">Meta de Projetos</SelectItem>
                        <SelectItem value="Meta de Receita Recorrente">Meta de Receita Recorrente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Aplicada A (Responsvel/Equipe)</Label>
                    <Input required value={novaMeta.aplicadaA || ''} onChange={e => setNovaMeta({...novaMeta, aplicadaA: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Perodo (Ex: Q1 2026)</Label>
                    <Input required value={novaMeta.periodo || ''} onChange={e => setNovaMeta({...novaMeta, periodo: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor da Meta (R$)</Label>
                    <Input type="number" required min="0" step="0.01" value={novaMeta.valorMetaR$ || ''} onChange={e => setNovaMeta({...novaMeta, valorMetaR$: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Valor Realizado Inicial (R$)</Label>
                    <Input type="number" min="0" step="0.01" value={novaMeta.valorRealizadoR$ || 0} onChange={e => setNovaMeta({...novaMeta, valorRealizadoR$: Number(e.target.value)})} />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit">Salvar Meta</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {metas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">Nenhuma meta cadastrada.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {metas.map(meta => {
                const perc = Math.min(100, Math.round((meta.valorRealizadoR$ / (meta.valorMetaR$ || 1)) * 100));
                return (
                  <div key={meta.id} className="p-4 border rounded-lg bg-card space-y-3">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[10px]">{meta.tipo}</Badge>
                      <Badge 
                        className={
                          meta.status === 'Atingida' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]' :
                          meta.status === 'Em Andamento' ? 'bg-blue-100 text-blue-800 border-blue-200 text-[10px]' : 'bg-rose-100 text-rose-800 border-rose-200 text-[10px]'
                        }
                      >
                        {meta.status}
                      </Badge>
                    </div>
                    <div>
                      <h4 className="font-bold text-sm leading-tight">{meta.titulo}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Alvo: {meta.aplicadaA}</p>
                    </div>
                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Progresso:</span>
                        <span className="font-bold">{perc}%</span>
                      </div>
                      <Progress value={perc} className="h-2" />
                      <div className="flex justify-between text-[11px] pt-1 text-muted-foreground">
                        <span>R$ {meta.valorRealizadoR$.toLocaleString('pt-BR')}</span>
                        <span>Meta: R$ {meta.valorMetaR$.toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* SEO 2: OKRs COMERCIAIS */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Award className="w-5 h-5 text-purple-500" /> OKRs Comerciais
          </CardTitle>
          <Dialog open={openOkr} onOpenChange={setOpenOkr}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1"><Plus className="w-4 h-4" /> Novo OKR</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Adicionar Novo OKR</DialogTitle></DialogHeader>
              <form onSubmit={handleAddOkr} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Objetivo Maior (O)</Label>
                  <Input required value={novoOkr.objetivo || ''} onChange={e => setNovoOkr({...novoOkr, objetivo: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label>Key Result (KR)</Label>
                  <Input required value={novoOkr.keyResult || ''} onChange={e => setNovoOkr({...novoOkr, keyResult: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Responsvel</Label>
                    <Input required value={novoOkr.responsavel || ''} onChange={e => setNovoOkr({...novoOkr, responsavel: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Perodo</Label>
                    <Input required value={novoOkr.periodo || ''} onChange={e => setNovoOkr({...novoOkr, periodo: e.target.value})} />
                  </div>
                </div>
                <div className="flex justify-end pt-4">
                  <Button type="submit">Salvar OKR</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {okrs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground border rounded-lg bg-muted/20">Nenhum OKR cadastrado.</div>
          ) : (
            <div className="space-y-3 text-xs">
              {okrs.map(okr => (
                <div key={okr.id} className="p-4 border rounded-lg bg-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-[10px]">{okr.periodo}</Badge>
                      <span className="font-bold text-sm">{okr.objetivo}</span>
                    </div>
                    <p className="text-muted-foreground">Key Result: {okr.keyResult}</p>
                    <p className="text-[10px] text-muted-foreground">Responsvel: {okr.responsavel}</p>
                  </div>
                  <div className="w-full md:w-48 space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span>Concluso:</span>
                      <span className="font-bold">{okr.percentualConclusao}%</span>
                    </div>
                    <Progress value={okr.percentualConclusao} className="h-2" />
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

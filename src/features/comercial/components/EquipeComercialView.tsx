import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, Plus, Edit3, Trash2, Mail, Building2, User, DollarSign 
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { MembroEquipeComercial, FuncaoComercial } from '../types';
import { ComissoesView } from './ComissoesView';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function EquipeComercialView() {
  const { equipe, oportunidades, atividades, addEquipeItem, updateEquipeItem, deleteEquipeItem } = useComercialStore();
  const [activeSubTab, setActiveSubTab] = useState<'membros' | 'comissoes'>('membros');
  const [openModal, setOpenModal] = useState(false);
  const [editingMember, setEditingMember] = useState<MembroEquipeComercial | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [funcao, setFuncao] = useState<FuncaoComercial>('Consultor Comercial');
  const [supervisor, setSupervisor] = useState('');
  const [metaMensal, setMetaMensal] = useState('');
  const [comissaoPercent, setComissaoPercent] = useState('5');
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  const handleOpenCreate = () => {
    setEditingMember(null);
    setNome('');
    setEmail('');
    setFuncao('Consultor Comercial');
    setSupervisor('');
    setMetaMensal('');
    setComissaoPercent('5');
    setStatus('Ativo');
    setOpenModal(true);
  };

  const handleOpenEdit = (m: MembroEquipeComercial) => {
    setEditingMember(m);
    setNome(m.nome);
    setEmail(m.email);
    setFuncao(m.funcao);
    setSupervisor(m.supervisor || '');
    setMetaMensal(String(m.metaMensalR$ || 0));
    setComissaoPercent(String(m.comissaoPercentual || 0));
    setStatus(m.status || 'Ativo');
    setOpenModal(true);
  };

  const handleDelete = (m: MembroEquipeComercial) => {
    if (window.confirm(`Tem certeza que deseja remover o consultor "${m.nome}" do time comercial?`)) {
      deleteEquipeItem(m.id);
      toast.success(`Consultor "${m.nome}" removido do time comercial.`);
    }
  };

  const handleSave = () => {
    if (!nome.trim() || !email.trim()) {
      toast.error('Preencha o nome e e-mail do consultor.');
      return;
    }

    if (editingMember) {
      updateEquipeItem(editingMember.id, {
        nome: nome.trim(),
        email: email.trim(),
        funcao,
        supervisor: supervisor.trim() || undefined,
        metaMensalR$: parseFloat(metaMensal) || 0,
        comissaoPercentual: parseFloat(comissaoPercent) || 0,
        status
      });
      toast.success(`Consultor ${nome} atualizado com sucesso!`);
    } else {
      addEquipeItem({
        id: `eq-${Date.now()}`,
        nome: nome.trim(),
        email: email.trim(),
        funcao,
        supervisor: supervisor.trim() || undefined,
        metaMensalR$: parseFloat(metaMensal) || 0,
        comissaoPercentual: parseFloat(comissaoPercent) || 0,
        resultadoRealizadoR$: 0,
        status
      });
      toast.success(`Consultor ${nome} cadastrado na equipe comercial!`);
    }

    setOpenModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-orange-500" /> Time Comercial & Gestão de Vendas
          </h3>
          <p className="text-xs text-muted-foreground">
            Gestão de consultores, estrutura da equipe, metas e controle integrado de comissões.
          </p>
        </div>

        {activeSubTab === 'membros' && (
          <Button 
            onClick={handleOpenCreate} 
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Adicionar Consultor
          </Button>
        )}
      </div>

      <Tabs defaultValue="membros" value={activeSubTab} onValueChange={(v) => setActiveSubTab(v as any)} className="space-y-4">
        <div className="border-b pb-1 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/60 p-1 flex w-max justify-start gap-1">
            <TabsTrigger value="membros" className="gap-2 shrink-0 font-medium text-xs">
              <Users className="w-3.5 h-3.5" /> Membros do Time
            </TabsTrigger>
            <TabsTrigger value="comissoes" className="gap-2 shrink-0 font-medium text-xs">
              <DollarSign className="w-3.5 h-3.5" /> Gestão de Comissões
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="membros" className="space-y-4 outline-none">
          {/* Grid de Membros da Equipe */}
          {equipe.length === 0 ? (
            <div className="border rounded-2xl p-12 text-center text-muted-foreground text-xs bg-card">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-orange-500" />
              Nenhum consultor comercial cadastrado.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {equipe.map(m => {
                const userOps = oportunidades.filter(o => o.responsavel === m.nome);
                const vendas = userOps.filter(o => (o.etapa || '').toLowerCase().includes('ganh'));
                const receitaReal = vendas.reduce((acc, o) => acc + (o.valorR$ || 0), 0);
                const userAtividades = atividades.filter(a => a.responsavel === m.nome);

                return (
                  <Card key={m.id} className="rounded-2xl border shadow-xs bg-card hover:border-orange-500/40 transition-all flex flex-col justify-between overflow-hidden">
                    <CardHeader className="pb-3 border-b space-y-2 bg-muted/20">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                            {(m?.nome || 'Consultor').split(' ').map(p => p[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-foreground">{m?.nome || 'Consultor'}</h4>
                            <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-400 bg-orange-50 dark:bg-orange-950/30 mt-0.5">
                              {m?.funcao || 'Consultor Comercial'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[10px] ${m.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200' : 'bg-muted text-muted-foreground'}`}>
                            {m.status}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground space-y-0.5">
                        <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-muted-foreground" /> {m.email}</div>
                        {m.supervisor && <div className="text-[11px]">Supervisor: <strong>{m.supervisor}</strong></div>}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3 pt-3 text-xs flex-1 flex flex-col justify-between">
                      <div>
                        <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-muted/40 mb-3">
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-semibold">Oportunidades</span>
                            <span className="font-bold text-foreground">{userOps.length}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-semibold">Atividades</span>
                            <span className="font-bold text-blue-600">{userAtividades.length}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground block font-semibold">Fechados</span>
                            <span className="font-bold text-emerald-600">{vendas.length}</span>
                          </div>
                        </div>

                        <div className="space-y-1.5 bg-muted/20 p-2.5 rounded-xl border border-border/50">
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Meta Mensal:</span>
                            <span className="font-semibold">{formatCurrency(m.metaMensalR$)}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Realizado:</span>
                            <span className="font-bold text-emerald-600">{formatCurrency(receitaReal)}</span>
                          </div>
                          <div className="flex justify-between text-[11px]">
                            <span className="text-muted-foreground">Alíquota Comissão:</span>
                            <span className="font-bold text-orange-600">{m.comissaoPercentual || 0}%</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 pt-3 border-t mt-3">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleOpenEdit(m)}
                          className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        >
                          <Edit3 className="w-3 h-3" /> Editar
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDelete(m)}
                          className="h-7 px-2 text-xs gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                        >
                          <Trash2 className="w-3 h-3" /> Remover
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="comissoes" className="space-y-4 outline-none">
          <ComissoesView />
        </TabsContent>
      </Tabs>

      {/* Modal Criar / Editar Consultor */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="w-5 h-5 text-orange-500" /> {editingMember ? 'Editar Consultor Comercial' : 'Cadastrar Consultor Comercial'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Nome Completo *</Label>
              <Input 
                placeholder="Ex: Carlos Eduardo"
                value={nome}
                onChange={e => setNome(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">E-mail Corporativo *</Label>
              <Input 
                placeholder="carlos@focustech.com.br"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Função Comercial</Label>
                <Select value={funcao} onValueChange={(v: any) => setFuncao(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SDR">SDR / Pré-vendas</SelectItem>
                    <SelectItem value="BDR">BDR / Outbound</SelectItem>
                    <SelectItem value="Consultor Comercial">Consultor Comercial</SelectItem>
                    <SelectItem value="Closer">Closer / Fechador</SelectItem>
                    <SelectItem value="Executivo de Contas">Executivo de Contas</SelectItem>
                    <SelectItem value="Gerente Comercial">Gerente Comercial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Supervisor</Label>
                <Input 
                  value={supervisor}
                  onChange={e => setSupervisor(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Meta Mensal (R$)</Label>
                <Input 
                  type="number"
                  placeholder="120000"
                  value={metaMensal}
                  onChange={e => setMetaMensal(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Comissão Base (%)</Label>
                <Input 
                  type="number"
                  placeholder="7"
                  value={comissaoPercent}
                  onChange={e => setComissaoPercent(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            {editingMember && (
              <div className="space-y-1.5">
                <Label className="font-semibold">Status do Consultor</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativo">Ativo</SelectItem>
                    <SelectItem value="Inativo">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              {editingMember ? 'Atualizar Consultor' : 'Salvar Consultor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

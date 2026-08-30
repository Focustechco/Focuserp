import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, User, Target, Award, DollarSign, Plus, Edit3, 
  Trash2, Phone, Mail, CheckCircle2, TrendingUp, ArrowUpRight
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { MembroEquipeComercial, FuncaoComercial } from '../types';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function EquipeComercialView() {
  const { equipe, oportunidades, atividades, addEquipeItem, updateEquipeItem, deleteEquipeItem } = useComercialStore();
  const [openModal, setOpenModal] = useState(false);
  const [selectedMemberModal, setSelectedMemberModal] = useState<MembroEquipeComercial | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [funcao, setFuncao] = useState<FuncaoComercial>('Consultor Comercial');
  const [supervisor, setSupervisor] = useState('Adriano Leal');
  const [metaMensal, setMetaMensal] = useState('120000');
  const [comissaoPercent, setComissaoPercent] = useState('7');

  const handleSave = () => {
    if (!nome.trim() || !email.trim()) {
      toast.error('Preencha o nome e e-mail do consultor.');
      return;
    }

    addEquipeItem({
      id: `eq-${Date.now()}`,
      nome: nome.trim(),
      email: email.trim(),
      funcao,
      supervisor: supervisor.trim() || undefined,
      metaMensalR$: parseFloat(metaMensal) || 0,
      comissaoPercentual: parseFloat(comissaoPercent) || 0,
      resultadoRealizadoR$: 0,
      status: 'Ativo'
    });

    toast.success(`Consultor ${nome} cadastrado na equipe comercial!`);
    setOpenModal(false);
    setNome('');
    setEmail('');
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Users className="w-5 h-5 text-orange-500" /> Time Comercial & Gestão de Consultores
          </h3>
          <p className="text-xs text-muted-foreground">
            Gestão de metas individuais, alíquotas de comissão e estrutura hierárquica do time.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Consultor
        </Button>
      </div>

      {/* Grid de Membros da Equipe */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {equipe.map(m => {
          const userOps = oportunidades.filter(o => o.responsavel === m.nome);
          const vendas = userOps.filter(o => (o.etapa || '').toLowerCase().includes('ganh'));
          const receitaReal = vendas.reduce((acc, o) => acc + (o.valorR$ || 0), 0);
          const userAtividades = atividades.filter(a => a.responsavel === m.nome);

          return (
            <Card key={m.id} className="rounded-2xl border shadow-xs bg-card hover:border-orange-500/40 transition-all flex flex-col justify-between">
              <CardHeader className="pb-3 border-b space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold flex items-center justify-center text-sm shadow-xs">
                      {(m?.nome || 'Consultor').split(' ').map(p => p[0]).join('').slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{m?.nome || 'Consultor'}</h4>
                      <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-400 bg-orange-50 mt-0.5">
                        {m?.funcao || 'Consultor Comercial'}
                      </Badge>
                    </div>
                  </div>

                  <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">
                    {m.status}
                  </Badge>
                </div>

                <div className="text-xs text-muted-foreground space-y-0.5">
                  <div className="flex items-center gap-1"><Mail className="w-3 h-3 text-muted-foreground" /> {m.email}</div>
                  {m.supervisor && <div className="text-[11px]">Supervisor: <strong>{m.supervisor}</strong></div>}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 pt-3 text-xs">
                <div className="grid grid-cols-3 gap-2 text-center p-2 rounded-xl bg-muted/40">
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

                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Meta Mensal:</span>
                    <span className="font-bold text-foreground">{formatCurrency(m.metaMensalR$)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Comissão Fixada:</span>
                    <span className="font-bold text-purple-600">{m.comissaoPercentual}%</span>
                  </div>
                  <div className="flex justify-between text-xs pt-1 border-t">
                    <span className="text-muted-foreground font-semibold">Realizado no Mês:</span>
                    <span className="font-extrabold text-emerald-600">{formatCurrency(receitaReal)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Novo Consultor */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Users className="w-5 h-5 text-orange-500" /> Cadastrar Consultor Comercial
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              Salvar Consultor
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

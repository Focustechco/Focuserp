import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Users, Target, TrendingUp, Handshake, Award, Briefcase,
  Edit, PhoneCall, FileText, CheckCircle2, DollarSign, Percent
} from 'lucide-react';
import { useComercialStore, MetricasComercialUsuario } from '../hooks/useComercialStore';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { toast } from 'sonner';

const FUNCOES_COMERCIAIS = [
  'SDR',
  'BDR',
  'Consultor Comercial',
  'Closer',
  'Executivo de Contas',
  'Gerente Comercial',
  'Diretor Comercial',
];

interface FormState {
  oportunidades: string;
  diagnosticos: string;
  propostas: string;
  fechamentos: string;
  receitaFechadaR$: string;
  taxaConversaoPercentual: string;
  funcaoComercial: string;
  metaMensalR$: string;
  comissaoPercentual: string;
}

const DEFAULT_FORM: FormState = {
  oportunidades: '0',
  diagnosticos: '0',
  propostas: '0',
  fechamentos: '0',
  'receitaFechadaR$': '0',
  taxaConversaoPercentual: '0',
  funcaoComercial: 'Consultor Comercial',
  'metaMensalR$': '0',
  comissaoPercentual: '0',
};

function metricsToForm(m: MetricasComercialUsuario): FormState {
  return {
    oportunidades: String(m.oportunidades),
    diagnosticos: String(m.diagnosticos),
    propostas: String(m.propostas),
    fechamentos: String(m.fechamentos),
    'receitaFechadaR$': String(m['receitaFechadaR$']),
    taxaConversaoPercentual: String(m.taxaConversaoPercentual),
    funcaoComercial: m.funcaoComercial,
    'metaMensalR$': String(m['metaMensalR$']),
    comissaoPercentual: String(m.comissaoPercentual),
  };
}

function formToMetrics(f: FormState): Partial<MetricasComercialUsuario> {
  return {
    oportunidades: Number(f.oportunidades) || 0,
    diagnosticos: Number(f.diagnosticos) || 0,
    propostas: Number(f.propostas) || 0,
    fechamentos: Number(f.fechamentos) || 0,
    'receitaFechadaR$': Number(f['receitaFechadaR$']) || 0,
    taxaConversaoPercentual: Number(f.taxaConversaoPercentual) || 0,
    funcaoComercial: f.funcaoComercial,
    'metaMensalR$': Number(f['metaMensalR$']) || 0,
    comissaoPercentual: Number(f.comissaoPercentual) || 0,
  };
}

export function EquipeComercialView() {
  const { metricasUsuarios, getMetricasUsuario, upsertMetricasUsuario } = useComercialStore();
  const { data: todosUsuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);

  // Filter: comercial profile or comercial roles or vendas department
  const usuariosComerciais = todosUsuarios.filter(u =>
    u.perfil === 'Comercial' ||
    (u.rolesComplementares || []).some(r => ['Comercial', 'CRM', 'Vendas'].includes(r)) ||
    u.departamento === 'Vendas' ||
    u.departamento === 'Comercial'
  );

  const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openEdit = (u: Usuario) => {
    const metrics = getMetricasUsuario(u.id);
    setForm(metrics ? metricsToForm(metrics) : { ...DEFAULT_FORM });
    setSelectedUsuario(u);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!selectedUsuario) return;
    upsertMetricasUsuario(selectedUsuario.id, {
      usuarioId: selectedUsuario.id,
      ...formToMetrics(form)
    });
    toast.success(`Métricas de ${selectedUsuario.nomeExibicao} atualizadas!`);
    setDialogOpen(false);
    setSelectedUsuario(null);
  };

  const totalOportunidades = usuariosComerciais.reduce((acc, u) => {
    const m = getMetricasUsuario(u.id);
    return acc + (m?.oportunidades ?? 0);
  }, 0);
  const totalFechamentos = usuariosComerciais.reduce((acc, u) => {
    const m = getMetricasUsuario(u.id);
    return acc + (m?.fechamentos ?? 0);
  }, 0);
  const totalReceita = usuariosComerciais.reduce((acc, u) => {
    const m = getMetricasUsuario(u.id);
    return acc + (m?.['receitaFechadaR$'] ?? 0);
  }, 0);
  const totalMeta = usuariosComerciais.reduce((acc, u) => {
    const m = getMetricasUsuario(u.id);
    return acc + (m?.['metaMensalR$'] ?? 0);
  }, 0);

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-bold text-base flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Time Comercial — Usuários do Setor
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Usuários do perfil/departamento Comercial integrados ao módulo de Usuários.
            Métricas individuais de oportunidades, diagnósticos, propostas e fechamentos.
          </p>
        </div>
        <Badge variant="outline" className="text-xs">
          {usuariosComerciais.length} profissional{usuariosComerciais.length !== 1 ? 'is' : ''}
        </Badge>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Oportunidades</CardTitle>
            <PhoneCall className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOportunidades}</div>
            <p className="text-[11px] text-muted-foreground">Total do time</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Fechamentos</CardTitle>
            <Handshake className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalFechamentos}</div>
            <p className="text-[11px] text-muted-foreground">Contratos fechados</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Receita Fechada</CardTitle>
            <DollarSign className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-amber-600">
              R$ {totalReceita.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground">Acumulado do time</p>
          </CardContent>
        </Card>
        <Card className="hover:border-primary/40 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-xs font-medium text-muted-foreground">Meta Mensal Total</CardTitle>
            <Target className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">
              R$ {totalMeta.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <p className="text-[11px] text-muted-foreground">Soma das metas individuais</p>
          </CardContent>
        </Card>
      </div>

      {/* Team Table */}
      <Card>
        <CardContent className="pt-6">
          {usuariosComerciais.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Nenhum usuário do setor comercial encontrado</p>
              <p className="text-xs mt-1">Adicione usuários com perfil Comercial no módulo de Usuários.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-x-auto bg-card text-xs">
              <table className="w-full min-w-[900px]">
                <thead className="bg-muted/50 border-b text-left">
                  <tr>
                    <th className="p-3">Profissional</th>
                    <th className="p-3">Função Comercial</th>
                    <th className="p-3 text-center">Oportunidades</th>
                    <th className="p-3 text-center">Diagnósticos</th>
                    <th className="p-3 text-center">Propostas</th>
                    <th className="p-3 text-center">Fechamentos</th>
                    <th className="p-3 text-right">Receita Fechada</th>
                    <th className="p-3 text-center">Tx. Conversão</th>
                    <th className="p-3 text-center">Meta Mensal</th>
                    <th className="p-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosComerciais.map(usuario => {
                    const m = getMetricasUsuario(usuario.id);
                    const taxaConversao = m?.taxaConversaoPercentual ?? 0;
                    const receita = m?.['receitaFechadaR$'] ?? 0;
                    const meta = m?.['metaMensalR$'] ?? 0;
                    const atingimento = meta > 0 ? Math.min((receita / meta) * 100, 100) : 0;

                    return (
                      <tr key={usuario.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                        <td className="p-3">
                          <div className="font-semibold text-primary">{usuario.nomeExibicao}</div>
                          <div className="text-[10px] text-muted-foreground">{usuario.cargo}</div>
                          <div className="text-[10px] text-muted-foreground">{usuario.email}</div>
                        </td>
                        <td className="p-3">
                          <Badge variant="outline" className="text-[10px] whitespace-nowrap">
                            <Briefcase className="w-3 h-3 mr-1" />
                            {m?.funcaoComercial || 'Não definido'}
                          </Badge>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-blue-600">{m?.oportunidades ?? 0}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-indigo-600">{m?.diagnosticos ?? 0}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-orange-600">{m?.propostas ?? 0}</span>
                        </td>
                        <td className="p-3 text-center">
                          <span className="font-bold text-emerald-600">{m?.fechamentos ?? 0}</span>
                        </td>
                        <td className="p-3 text-right font-bold">
                          R$ {receita.toLocaleString('pt-BR')}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-bold ${taxaConversao >= 30 ? 'text-emerald-600' : taxaConversao >= 15 ? 'text-amber-600' : 'text-red-500'}`}>
                              {taxaConversao.toFixed(1)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className="font-bold">R$ {meta.toLocaleString('pt-BR')}</span>
                            {meta > 0 && (
                              <div className="w-full bg-muted rounded-full h-1.5 max-w-[80px]">
                                <div
                                  className={`h-1.5 rounded-full ${atingimento >= 80 ? 'bg-emerald-500' : atingimento >= 50 ? 'bg-amber-500' : 'bg-red-400'}`}
                                  style={{ width: `${atingimento}%` }}
                                />
                              </div>
                            )}
                            {meta > 0 && (
                              <span className="text-[10px] text-muted-foreground">{atingimento.toFixed(0)}% atingido</span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => openEdit(usuario)}
                          >
                            <Edit className="w-3 h-3" />
                            Editar
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Métricas — {selectedUsuario?.nomeExibicao}
            </DialogTitle>
          </DialogHeader>

          {selectedUsuario && (
            <div className="space-y-4 py-2">
              <div className="text-xs text-muted-foreground bg-muted/50 rounded p-2">
                <span className="font-semibold">{selectedUsuario.cargo}</span> · {selectedUsuario.departamento} · {selectedUsuario.email}
              </div>

              {/* Função Comercial */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Função Comercial</Label>
                <Select
                  value={form.funcaoComercial}
                  onValueChange={(v) => setForm(prev => ({ ...prev, funcaoComercial: v }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FUNCOES_COMERCIAIS.map(f => (
                      <SelectItem key={f} value={f}>{f}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Métricas principais */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <PhoneCall className="w-3 h-3 text-blue-500" />
                    Oportunidades
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    className="h-9 text-sm"
                    value={form.oportunidades}
                    onChange={e => setForm(p => ({ ...p, oportunidades: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-indigo-500" />
                    Diagnósticos
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    className="h-9 text-sm"
                    value={form.diagnosticos}
                    onChange={e => setForm(p => ({ ...p, diagnosticos: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <FileText className="w-3 h-3 text-orange-500" />
                    Propostas Enviadas
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    className="h-9 text-sm"
                    value={form.propostas}
                    onChange={e => setForm(p => ({ ...p, propostas: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Handshake className="w-3 h-3 text-emerald-500" />
                    Fechamentos
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    className="h-9 text-sm"
                    value={form.fechamentos}
                    onChange={e => setForm(p => ({ ...p, fechamentos: e.target.value }))}
                  />
                </div>
              </div>

              {/* Valores financeiros */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <DollarSign className="w-3 h-3 text-amber-500" />
                    Receita Fechada (R$)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-9 text-sm"
                    value={form['receitaFechadaR$']}
                    onChange={e => setForm(p => ({ ...p, 'receitaFechadaR$': e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Target className="w-3 h-3 text-purple-500" />
                    Meta Mensal (R$)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    className="h-9 text-sm"
                    value={form['metaMensalR$']}
                    onChange={e => setForm(p => ({ ...p, 'metaMensalR$': e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-teal-500" />
                    Taxa de Conversão (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="h-9 text-sm"
                    value={form.taxaConversaoPercentual}
                    onChange={e => setForm(p => ({ ...p, taxaConversaoPercentual: e.target.value }))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold flex items-center gap-1">
                    <Percent className="w-3 h-3 text-rose-500" />
                    Comissão (%)
                  </Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="h-9 text-sm"
                    value={form.comissaoPercentual}
                    onChange={e => setForm(p => ({ ...p, comissaoPercentual: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Salvar Métricas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

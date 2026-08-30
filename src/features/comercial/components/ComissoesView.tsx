import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, Percent, Plus, Edit3, Trash2, CheckCircle2, Clock 
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { RegraComissao, RegistroComissao } from '../types';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function ComissoesView() {
  const { 
    regrasComissao, registrosComissao, equipe, oportunidades, 
    addRegraComissaoItem, updateRegraComissaoItem, deleteRegraComissaoItem,
    addRegistroComissaoItem, updateRegistroComissaoItem, deleteRegistroComissaoItem 
  } = useComercialStore();

  const [openRegraModal, setOpenRegraModal] = useState(false);
  const [editingRegra, setEditingRegra] = useState<RegraComissao | null>(null);

  const [openRegistroModal, setOpenRegistroModal] = useState(false);
  const [editingRegistro, setEditingRegistro] = useState<RegistroComissao | null>(null);

  // Form Regra
  const [regraTitulo, setRegraTitulo] = useState('');
  const [funcaoOuConsultor, setFuncaoOuConsultor] = useState('Executivo de Contas / Closer');
  const [tipoRegra, setTipoRegra] = useState<RegraComissao['tipo']>('Percentual');
  const [aliquota, setAliquota] = useState('8');
  const [criterio, setCriterio] = useState<RegraComissao['criterioLiberacao']>('Na Assinatura');
  const [regraStatus, setRegraStatus] = useState<'Ativa' | 'Inativa'>('Ativa');

  // Form Registro
  const [clienteNome, setClienteNome] = useState('');
  const [consultorNome, setConsultorNome] = useState(equipe[0]?.nome || 'Adriano Leal');
  const [valorVenda, setValorVenda] = useState('');
  const [percentualAplicado, setPercentualAplicado] = useState('8');
  const [dataFechamento, setDataFechamento] = useState(new Date().toISOString().split('T')[0]);
  const [registroStatus, setRegistroStatus] = useState<'Prevista' | 'Aprovada' | 'Paga'>('Aprovada');

  // Handlers para Regras
  const handleOpenCreateRegra = () => {
    setEditingRegra(null);
    setRegraTitulo('');
    setFuncaoOuConsultor('Executivo de Contas / Closer');
    setTipoRegra('Percentual');
    setAliquota('8');
    setCriterio('Na Assinatura');
    setRegraStatus('Ativa');
    setOpenRegraModal(true);
  };

  const handleOpenEditRegra = (r: RegraComissao) => {
    setEditingRegra(r);
    setRegraTitulo(r.titulo);
    setFuncaoOuConsultor(r.funcaoOuConsultor);
    setTipoRegra(r.tipo);
    setAliquota(String(r.aliquotaPercentual || 0));
    setCriterio(r.criterioLiberacao);
    setRegraStatus(r.status || 'Ativa');
    setOpenRegraModal(true);
  };

  const handleDeleteRegra = (r: RegraComissao) => {
    if (window.confirm(`Tem certeza que deseja excluir a regra "${r.titulo}"?`)) {
      deleteRegraComissaoItem(r.id);
      toast.success(`Regra de comissão "${r.titulo}" excluída.`);
    }
  };

  const handleSaveRegra = () => {
    if (!regraTitulo.trim()) {
      toast.error('Informe o título da regra de comissão.');
      return;
    }

    if (editingRegra) {
      updateRegraComissaoItem(editingRegra.id, {
        titulo: regraTitulo.trim(),
        funcaoOuConsultor,
        tipo: tipoRegra,
        aliquotaPercentual: parseFloat(aliquota) || 0,
        criterioLiberacao: criterio,
        status: regraStatus
      });
      toast.success('Regra de comissionamento atualizada!');
    } else {
      addRegraComissaoItem({
        id: `reg-${Date.now()}`,
        titulo: regraTitulo.trim(),
        funcaoOuConsultor,
        tipo: tipoRegra,
        aliquotaPercentual: parseFloat(aliquota) || 0,
        criterioLiberacao: criterio,
        status: regraStatus
      });
      toast.success('Regra de comissionamento salva!');
    }

    setOpenRegraModal(false);
  };

  // Handlers para Registros
  const handleOpenCreateRegistro = () => {
    setEditingRegistro(null);
    setClienteNome('');
    setConsultorNome(equipe[0]?.nome || 'Adriano Leal');
    setValorVenda('');
    setPercentualAplicado('8');
    setDataFechamento(new Date().toISOString().split('T')[0]);
    setRegistroStatus('Aprovada');
    setOpenRegistroModal(true);
  };

  const handleOpenEditRegistro = (reg: RegistroComissao) => {
    setEditingRegistro(reg);
    setClienteNome(reg.clienteNome);
    setConsultorNome(reg.consultorNome);
    setValorVenda(String(reg.valorVendaR$));
    setPercentualAplicado(String(reg.percentualAplicado));
    setDataFechamento(reg.dataFechamento);
    setRegistroStatus(reg.status);
    setOpenRegistroModal(true);
  };

  const handleDeleteRegistro = (reg: RegistroComissao) => {
    if (window.confirm(`Tem certeza que deseja excluir esta comissão de "${reg.clienteNome}"?`)) {
      deleteRegistroComissaoItem(reg.id);
      toast.success('Registro de comissão excluído.');
    }
  };

  const handleSaveRegistro = () => {
    if (!clienteNome.trim() || !valorVenda) {
      toast.error('Preencha os dados da venda.');
      return;
    }

    const valVenda = parseFloat(valorVenda) || 0;
    const aliq = parseFloat(percentualAplicado) || 8;
    const valComissao = (valVenda * aliq) / 100;

    if (editingRegistro) {
      updateRegistroComissaoItem(editingRegistro.id, {
        clienteNome: clienteNome.trim(),
        consultorNome,
        valorVendaR$: valVenda,
        percentualAplicado: aliq,
        valorComissaoR$: valComissao,
        dataFechamento,
        status: registroStatus
      });
      toast.success('Registro de comissão atualizado!');
    } else {
      addRegistroComissaoItem({
        id: `rec-${Date.now()}`,
        vendaId: `MAN-${Date.now().toString().slice(-4)}`,
        clienteNome: clienteNome.trim(),
        consultorNome,
        valorVendaR$: valVenda,
        percentualAplicado: aliq,
        valorComissaoR$: valComissao,
        dataFechamento,
        dataPagamentoPrevista: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        status: registroStatus
      });
      toast.success('Comissão registrada com sucesso!');
    }

    setOpenRegistroModal(false);
  };

  // Cálculos de Comissões a partir de Vendas Ganhas
  const comissoesAutomaticas = useMemo(() => {
    const vendasGanhas = oportunidades.filter(o => 
      (o.etapa || '').toLowerCase().includes('ganh') || 
      (o.etapa || '').toLowerCase().includes('won') || 
      (o.etapa || '').toLowerCase().includes('fechad')
    );

    return vendasGanhas.map(v => {
      const membro = equipe.find(e => e.nome === v.responsavel);
      const aliq = membro?.comissaoPercentual || 8;
      const valorComissao = ((v.valorR$ || 0) * aliq) / 100;

      return {
        id: `com-auto-${v.id}`,
        vendaId: v.clickUpTaskId,
        clienteNome: v.empresaNome || v.titulo,
        consultorNome: v.responsavel,
        valorVendaR$: v.valorR$ || 0,
        percentualAplicado: aliq,
        valorComissaoR$: valorComissao,
        dataFechamento: v.dataPrevistaFechamento || new Date().toISOString().split('T')[0],
        dataPagamentoPrevista: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
        status: 'Prevista' as const
      };
    });
  }, [oportunidades, equipe]);

  const allRegistros = useMemo(() => {
    return [...registrosComissao, ...comissoesAutomaticas];
  }, [registrosComissao, comissoesAutomaticas]);

  const totalComissoesPrevistas = allRegistros.reduce((acc, r) => acc + r.valorComissaoR$, 0);
  const totalComissoesAprovadas = allRegistros.filter(r => r.status === 'Aprovada').reduce((acc, r) => acc + r.valorComissaoR$, 0);
  const totalComissoesPagas = allRegistros.filter(r => r.status === 'Paga').reduce((acc, r) => acc + r.valorComissaoR$, 0);

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <DollarSign className="w-5 h-5 text-orange-500" /> Comissões Comerciais & Resultados
          </h3>
          <p className="text-xs text-muted-foreground">
            Regras de comissionamento, apuração por venda fechada e previsão financeira do time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={handleOpenCreateRegra} 
            className="rounded-xl gap-1 font-semibold text-xs h-8 cursor-pointer"
          >
            <Percent className="w-3.5 h-3.5" /> Nova Regra
          </Button>

          <Button 
            onClick={handleOpenCreateRegistro} 
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1 font-bold text-xs h-8 shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Registrar Comissão
          </Button>
        </div>
      </div>

      {/* KPI Cards de Comissões */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Comissão Total Prevista</span>
            <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {formatCurrency(totalComissoesPrevistas)}
            </div>
            <p className="text-[10px] text-muted-foreground">Sobre todas as vendas ganhas no pipeline</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Comissões Aprovadas</span>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalComissoesAprovadas)}
            </div>
            <p className="text-[10px] text-muted-foreground">Liberadas para faturamento e pagamento</p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Comissões Pagas</span>
            <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
              {formatCurrency(totalComissoesPagas)}
            </div>
            <p className="text-[10px] text-muted-foreground">Quitadas no período</p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE REGRAS DE COMISSÃO */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Regras e Políticas de Comissionamento ({regrasComissao.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Título da Regra</th>
                  <th className="p-3">Aplicada A</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3 text-center">Alíquota / Valor</th>
                  <th className="p-3">Critério de Liberação</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {regrasComissao.map(r => (
                  <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3 font-bold text-foreground">{r.titulo}</td>
                    <td className="p-3 text-muted-foreground">{r.funcaoOuConsultor}</td>
                    <td className="p-3"><Badge variant="secondary">{r.tipo}</Badge></td>
                    <td className="p-3 text-center font-extrabold text-purple-600">
                      {r.aliquotaPercentual > 0 ? `${r.aliquotaPercentual}%` : formatCurrency(r.valorFixoR$)}
                    </td>
                    <td className="p-3 text-muted-foreground">{r.criterioLiberacao}</td>
                    <td className="p-3 text-center">
                      <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-xs font-semibold">{r.status}</Badge>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEditRegra(r)}
                          className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                          title="Editar Regra"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleDeleteRegra(r)}
                          className="h-7 w-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="Excluir Regra"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* TABELA DE APURAÇÃO DE COMISSÕES */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Apuração de Comissões por Venda Fechada</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Venda / Tarefa</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Consultor</th>
                  <th className="p-3 text-right">Valor da Venda (R$)</th>
                  <th className="p-3 text-center">Alíquota</th>
                  <th className="p-3 text-right">Comissão (R$)</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {allRegistros.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground text-xs">
                      Nenhuma comissão apurada ainda. Quando uma venda for marcada como ganha, ela aparecerá automaticamente aqui!
                    </td>
                  </tr>
                ) : (
                  allRegistros.map(reg => (
                    <tr key={reg.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-3 font-mono font-bold text-orange-600">{reg.vendaId}</td>
                      <td className="p-3 font-bold text-foreground">{reg.clienteNome}</td>
                      <td className="p-3 font-medium text-foreground">{reg.consultorNome}</td>
                      <td className="p-3 text-right font-semibold text-foreground">{formatCurrency(reg.valorVendaR$)}</td>
                      <td className="p-3 text-center font-bold text-purple-600">{reg.percentualAplicado}%</td>
                      <td className="p-3 text-right font-extrabold text-emerald-600">{formatCurrency(reg.valorComissaoR$)}</td>
                      <td className="p-3 text-center">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${
                            reg.status === 'Paga' ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300' :
                            reg.status === 'Aprovada' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' :
                            'bg-purple-50 text-purple-700 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300'
                          }`}
                        >
                          {reg.status}
                        </Badge>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleOpenEditRegistro(reg)}
                            className="h-7 w-7 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30"
                            title="Editar / Alterar Status"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDeleteRegistro(reg)}
                            className="h-7 w-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            title="Excluir Comissão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Criar / Editar Regra */}
      <Dialog open={openRegraModal} onOpenChange={setOpenRegraModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Percent className="w-5 h-5 text-orange-500" /> {editingRegra ? 'Editar Regra de Comissionamento' : 'Criar Regra de Comissionamento'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título da Regra *</Label>
              <Input 
                placeholder="Ex: Comissão Padrão Software Closer"
                value={regraTitulo}
                onChange={e => setRegraTitulo(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Aplicada A (Cargo ou Consultor)</Label>
              <Input 
                value={funcaoOuConsultor}
                onChange={e => setFuncaoOuConsultor(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Alíquota (%)</Label>
                <Input 
                  type="number"
                  placeholder="8"
                  value={aliquota}
                  onChange={e => setAliquota(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Critério de Liberação</Label>
                <Select value={criterio} onValueChange={(v: any) => setCriterio(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Na Assinatura">Na Assinatura</SelectItem>
                    <SelectItem value="No Pagamento da 1ª Parcela">No 1º Pagamento</SelectItem>
                    <SelectItem value="Mensal Recorrente">Mensal Recorrente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {editingRegra && (
              <div className="space-y-1.5">
                <Label className="font-semibold">Status da Regra</Label>
                <Select value={regraStatus} onValueChange={(v: any) => setRegraStatus(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Ativa">Ativa</SelectItem>
                    <SelectItem value="Inativa">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRegraModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSaveRegra} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              {editingRegra ? 'Atualizar Regra' : 'Salvar Regra'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Criar / Editar Registro de Comissão */}
      <Dialog open={openRegistroModal} onOpenChange={setOpenRegistroModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <DollarSign className="w-5 h-5 text-orange-500" /> {editingRegistro ? 'Editar Comissão' : 'Registrar Comissão Manual'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Cliente / Conta *</Label>
              <Input 
                placeholder="Nome do cliente"
                value={clienteNome}
                onChange={e => setClienteNome(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Consultor</Label>
                <Select value={consultorNome} onValueChange={setConsultorNome}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {equipe.map(m => (
                      <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Valor da Venda (R$)</Label>
                <Input 
                  type="number"
                  placeholder="0,00"
                  value={valorVenda}
                  onChange={e => setValorVenda(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Alíquota (%)</Label>
                <Input 
                  type="number"
                  placeholder="8"
                  value={percentualAplicado}
                  onChange={e => setPercentualAplicado(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Status</Label>
                <Select value={registroStatus} onValueChange={(v: any) => setRegistroStatus(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Prevista">Prevista</SelectItem>
                    <SelectItem value="Aprovada">Aprovada</SelectItem>
                    <SelectItem value="Paga">Paga</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenRegistroModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSaveRegistro} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              {editingRegistro ? 'Atualizar Comissão' : 'Salvar Comissão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

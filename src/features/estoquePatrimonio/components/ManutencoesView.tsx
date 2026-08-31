import React, { useState } from 'react';
import { 
  Wrench, Plus, CheckCircle2, Clock, DollarSign, Search, Trash2, 
  ArrowUpRight, Receipt, User, Building2, AlertCircle, X 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { toast } from 'sonner';

export function ManutencoesView() {
  const { 
    manutencoes, 
    updateManutencao, 
    deleteManutencao,
    abrirManutencaoComFinanceiro, 
    updateEquipamento, 
    equipamentos 
  } = useEstoquePatrimonio();

  const { data: clientes = [] } = useLocalStorageState<any>('focus_clientes', []);
  const { data: fornecedores = [] } = useLocalStorageState<any>('focus_fornecedores', []);

  const [searchTerm, setSearchTerm] = useState('');
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);

  // Form: Nova Manutenção
  const [novoForm, setNovoForm] = useState({
    equipamentoId: '',
    tipo: 'Preventiva' as 'Preventiva' | 'Corretiva' | 'Upgrade' | 'Troca',
    descricao: '',
    valor: 250.0,
    responsavel: 'Assistência Técnica Especializada',
    prestador: 'Assistência Técnica Especializada',
    gerarContaPagar: true,
    gerarContaReceber: false,
    clienteNome: '',
    vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
  });

  const filtered = manutencoes.filter((m) => {
    if (!m) return false;
    const search = searchTerm.toLowerCase();
    return (
      (m.equipamentoNome || '').toLowerCase().includes(search) ||
      (m.equipamentoCodigo || '').toLowerCase().includes(search) ||
      (m.descricao || '').toLowerCase().includes(search) ||
      (m.responsavelNome || '').toLowerCase().includes(search)
    );
  });

  const totalGastoManutencao = manutencoes.reduce((acc, m) => acc + (Number(m.valor) || 0), 0);

  const handleConcluirManutencao = (manutId: string, equipamentoId: string) => {
    updateManutencao(manutId, { status: 'Concluída' });

    // Atualizar situação do equipamento de volta para Disponível / Em Uso
    const eq = equipamentos.find((e) => e.id === equipamentoId);
    if (eq) {
      updateEquipamento(equipamentoId, {
        situacao: eq.colaboradorNome ? 'Em Uso' : 'Disponível',
      });
    }
    toast.success('Ordem de manutenção concluída com sucesso!');
  };

  const handleCreateManutencao = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoForm.equipamentoId || !novoForm.descricao) {
      toast.error('Selecione o equipamento e informe a descrição da manutenção.');
      return;
    }

    const vlr = Number(novoForm.valor) || 0;

    abrirManutencaoComFinanceiro({
      equipamentoId: novoForm.equipamentoId,
      tipo: novoForm.tipo,
      descricao: novoForm.descricao,
      valor: vlr,
      responsavel: novoForm.responsavel,
      prestador: novoForm.prestador,
      gerarContaPagar: novoForm.gerarContaPagar,
      gerarContaReceber: novoForm.gerarContaReceber,
      clienteNome: novoForm.clienteNome,
      vencimento: novoForm.vencimento,
    });

    let msg = `Ordem de manutenção [${novoForm.tipo}] registrada com sucesso!`;
    if (novoForm.gerarContaPagar) msg += ' Conta a Pagar gerada.';
    if (novoForm.gerarContaReceber && novoForm.clienteNome) msg += ' Faturamento gerado no Contas a Receber.';
    toast.success(msg);

    setIsNovoModalOpen(false);
    setNovoForm({
      equipamentoId: '',
      tipo: 'Preventiva',
      descricao: '',
      valor: 250.0,
      responsavel: 'Assistência Técnica Especializada',
      prestador: 'Assistência Técnica Especializada',
      gerarContaPagar: true,
      gerarContaReceber: false,
      clienteNome: '',
      vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Ordens de Manutenção & Upgrades</h2>
          <p className="text-xs text-muted-foreground">
            Controle de serviços preventivos, corretivos, reparos e integração financeira automática com Contas a Pagar e Receber
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => setIsNovoModalOpen(true)}
          className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-semibold"
        >
          <Plus className="h-4 w-4" /> Nova Ordem de Manutenção
        </Button>
      </div>

      {/* KPI GASTO EM MANUTENÇÃO */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-amber-500/5 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-amber-600 dark:text-amber-400 font-bold">
              Total em Manutenções & Upgrades
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              R$ {(totalGastoManutencao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Soma de upgrades e reparos técnicos</p>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-emerald-600 dark:text-emerald-400 font-bold">
              Ordens Concluídas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {manutencoes.filter((m) => m.status === 'Concluída' || m.status === 'Concluído').length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Serviços executados e validados</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-500/5 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs uppercase text-blue-600 dark:text-blue-400 font-bold">
              Em Execução / Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              {manutencoes.filter((m) => m.status !== 'Concluída' && m.status !== 'Concluído' && m.status !== 'Cancelada').length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Equipamentos em assistência técnica</p>
          </CardContent>
        </Card>
      </div>

      {/* SEARCH BAR */}
      <Card className="p-3 bg-card border shadow-2xs">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por equipamento, código, serviço ou técnico responsável..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 text-xs h-9"
          />
        </div>
      </Card>

      {/* TABELA DE MANUTENÇÕES */}
      <Card>
        <CardHeader className="py-4 border-b">
          <CardTitle className="text-sm font-semibold">Chamados de Manutenção ({filtered.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Data</TableHead>
                <TableHead className="text-xs">Equipamento</TableHead>
                <TableHead className="text-xs">Tipo</TableHead>
                <TableHead className="text-xs">Descrição do Serviço</TableHead>
                <TableHead className="text-xs text-right">Custo (R$)</TableHead>
                <TableHead className="text-xs">Técnico / Prestador</TableHead>
                <TableHead className="text-xs text-center">Status</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-xs text-muted-foreground space-y-1">
                    <Wrench className="w-8 h-8 opacity-30 mx-auto" />
                    <p className="font-semibold text-foreground text-sm">Nenhuma ordem de manutenção registrada</p>
                    <p>Clique em "Nova Ordem de Manutenção" para registrar reparos e gerar as despesas financeiras.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((m) => {
                  const isConcluida = m.status === 'Concluída' || m.status === 'Concluído';
                  return (
                    <TableRow key={m.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {m.data ? new Date(m.data).toLocaleDateString('pt-BR') : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-foreground">{m.equipamentoNome}</span>
                          <span className="text-[10px] font-mono text-orange-600 font-bold">{m.equipamentoCodigo}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs">
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] ${
                            m.tipo === 'Corretiva' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                            m.tipo === 'Upgrade' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                            'bg-blue-50 text-blue-700 border-blue-200'
                          }`}
                        >
                          {m.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[280px] truncate" title={m.descricao}>
                        {m.descricao}
                      </TableCell>
                      <TableCell className="text-xs text-right font-bold text-foreground">
                        R$ {(m.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{m.responsavelNome || '-'}</TableCell>
                      <TableCell className="text-center">
                        {isConcluida ? (
                          <Badge className="bg-emerald-600 text-white text-[10px]">Concluída</Badge>
                        ) : (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 text-[10px]">
                            {m.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {!isConcluida && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleConcluirManutencao(m.id, m.equipamentoId)}
                              className="h-7 text-[11px] px-2 gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 font-semibold"
                            >
                              <CheckCircle2 className="h-3 w-3" /> Concluir
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              deleteManutencao(m.id);
                              toast.success('Ordem de manutenção excluída com sucesso!');
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Excluir ordem"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* MODAL: NOVA ORDEM DE MANUTENÇÃO */}
      <Dialog open={isNovoModalOpen} onOpenChange={setIsNovoModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Wrench className="h-5 w-5 text-orange-600" /> Abertura de Ordem de Manutenção & Integração Financeira
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registre a ordem de serviço técnico e gere lançamentos automáticos em Contas a Pagar e Contas a Receber.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateManutencao} className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Equipamento a Manter *</Label>
              <Select
                value={novoForm.equipamentoId}
                onValueChange={(val) => setNovoForm({ ...novoForm, equipamentoId: val })}
              >
                <SelectTrigger className="text-xs h-8">
                  <SelectValue placeholder="Selecione o equipamento..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {equipamentos.map((eq) => (
                    <SelectItem key={eq.id} value={eq.id}>
                      {eq.codigoPatrimonial} - {eq.marca} {eq.modelo} ({eq.categoria})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo de Manutenção</Label>
                <Select
                  value={novoForm.tipo}
                  onValueChange={(val: 'Preventiva' | 'Corretiva' | 'Upgrade' | 'Troca') => setNovoForm({ ...novoForm, tipo: val })}
                >
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="Preventiva">Preventiva (Limpeza / Revisão)</SelectItem>
                    <SelectItem value="Corretiva">Corretiva (Reparo / Conserto)</SelectItem>
                    <SelectItem value="Upgrade">Upgrade (Memória / SSD / Placa)</SelectItem>
                    <SelectItem value="Troca">Troca de Peça / Componente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Custo do Reparo (R$) *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={novoForm.valor}
                  onChange={(e) => setNovoForm({ ...novoForm, valor: Number(e.target.value) })}
                  className="text-xs h-8 font-bold text-orange-600"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descrição do Serviço / Peças Trocadas *</Label>
              <Input
                required
                placeholder="Ex: Troca de tela touch, expansão para 32GB RAM, troca de pasta térmica"
                value={novoForm.descricao}
                onChange={(e) => setNovoForm({ ...novoForm, descricao: e.target.value })}
                className="text-xs h-8"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Técnico / Assistência Técnica</Label>
                <Input
                  placeholder="Nome do prestador ou técnico"
                  value={novoForm.prestador}
                  onChange={(e) => setNovoForm({ ...novoForm, prestador: e.target.value, responsavel: e.target.value })}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Data de Vencimento Financeiro</Label>
                <Input
                  type="date"
                  value={novoForm.vencimento}
                  onChange={(e) => setNovoForm({ ...novoForm, vencimento: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
            </div>

            {/* PAINEL DE INTEGRAÇÃO FINANCEIRA */}
            <div className="space-y-2.5 p-3 rounded-lg border bg-orange-500/5 dark:bg-orange-950/20 border-orange-500/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-300">
                  <Receipt className="w-4 h-4" />
                  Gerar Despesa em Contas a Pagar (Prestador)
                </div>
                <Switch
                  checked={novoForm.gerarContaPagar}
                  onCheckedChange={(checked) => setNovoForm({ ...novoForm, gerarContaPagar: checked })}
                />
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-orange-500/10">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                  <User className="w-4 h-4" />
                  Cobrar / Faturar para Cliente (Contas a Receber)
                </div>
                <Switch
                  checked={novoForm.gerarContaReceber}
                  onCheckedChange={(checked) => setNovoForm({ ...novoForm, gerarContaReceber: checked })}
                />
              </div>

              {novoForm.gerarContaReceber && (
                <div className="space-y-1 pt-1">
                  <Label className="text-[11px] font-semibold">Cliente a ser Cobrado *</Label>
                  <Input
                    required={novoForm.gerarContaReceber}
                    placeholder="Informe o nome do Cliente para faturamento"
                    value={novoForm.clienteNome}
                    onChange={(e) => setNovoForm({ ...novoForm, clienteNome: e.target.value })}
                    className="text-xs h-8 bg-card"
                  />
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoModalOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                Abrir Ordem & Gerar Financeiro
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

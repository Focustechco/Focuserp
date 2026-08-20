import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Building2,
  Plus,
  MoreVertical,
  CreditCard,
  Edit3,
  Trash2,
  CheckCircle2,
  XCircle,
  Copy,
  QrCode,
  Wallet,
  ArrowUpDown
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaBancaria } from '../types';
import { NovaContaBancariaSheet } from './NovaContaBancariaSheet';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  const val = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

export function ContasBancariasList() {
  const {
    data: contasBancarias = [],
    deleteItem,
    updateItem
  } = useLocalStorageState<ContaBancaria>('focus_contas_bancarias', []);

  const [selectedContaToEdit, setSelectedContaToEdit] = useState<ContaBancaria | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Modal para ajuste de saldo
  const [saldoModalOpen, setSaldoModalOpen] = useState(false);
  const [contaAjustarSaldo, setContaAjustarSaldo] = useState<ContaBancaria | null>(null);
  const [novoSaldoInput, setNovoSaldoInput] = useState('');

  // Confirmação de exclusão
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [contaToDelete, setContaToDelete] = useState<ContaBancaria | null>(null);

  const handleEdit = (conta: ContaBancaria) => {
    setSelectedContaToEdit(conta);
    setEditSheetOpen(true);
  };

  const handleToggleStatus = (conta: ContaBancaria) => {
    const nextStatus = conta.status === 'Ativa' ? 'Inativa' : 'Ativa';
    updateItem(conta.id, { status: nextStatus });
    toast.success(`Conta ${conta.banco} marcada como ${nextStatus}.`);
  };

  const handleOpenSaldoModal = (conta: ContaBancaria) => {
    setContaAjustarSaldo(conta);
    setNovoSaldoInput(String(conta.saldoAtual || 0));
    setSaldoModalOpen(true);
  };

  const handleSaveSaldo = () => {
    if (!contaAjustarSaldo) return;
    const val = Number(novoSaldoInput);
    if (isNaN(val)) {
      toast.error('Informe um valor numérico válido.');
      return;
    }

    updateItem(contaAjustarSaldo.id, { saldoAtual: val });
    toast.success(`Saldo da conta ${contaAjustarSaldo.banco} atualizado para ${formatCurrency(val)}.`);
    setSaldoModalOpen(false);
  };

  const handleDelete = () => {
    if (!contaToDelete) return;
    deleteItem(contaToDelete.id);
    toast.success(`Conta bancária ${contaToDelete.banco} excluída com sucesso.`);
    setDeleteModalOpen(false);
    setContaToDelete(null);
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  const totalSaldoAtivo = contasBancarias
    .filter(c => c.status === 'Ativa' || !c.status)
    .reduce((acc, c) => acc + (c.saldoAtual || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      
      {/* Header com Resumo Geral e Ação */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Contas Bancárias & Tesouraria
            </h2>
            <Badge variant="outline" className="font-semibold text-xs">
              {contasBancarias.length} {contasBancarias.length === 1 ? 'Conta' : 'Contas'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Cadastre, edite e gerencie as contas bancárias reais utilizadas para conciliação e fluxo de caixa.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden md:block text-right pr-4 border-r">
            <span className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider block">
              Saldo Consolidado Ativo
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(totalSaldoAtivo)}
            </span>
          </div>

          <NovaContaBancariaSheet>
            <Button className="w-full sm:w-auto gap-2">
              <Plus className="w-4 h-4" /> Adicionar Nova Conta
            </Button>
          </NovaContaBancariaSheet>
        </div>
      </div>

      {/* Grid de Contas Bancárias */}
      <div className="grid gap-4 sm:gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {contasBancarias.map(conta => {
          const isAtiva = conta.status === 'Ativa' || !conta.status;

          return (
            <Card
              key={conta.id}
              className={`relative overflow-hidden transition-all hover:shadow-md border ${
                isAtiva ? 'bg-card' : 'bg-muted/30 opacity-75'
              }`}
            >
              {/* Barra lateral indicadora de status */}
              <div
                className={`absolute top-0 left-0 w-1.5 h-full ${
                  isAtiva ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />

              <CardHeader className="pb-3 pt-5 px-5">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base sm:text-lg font-bold text-foreground truncate max-w-[180px]">
                          {conta.banco}
                        </CardTitle>
                        <Badge
                          variant={isAtiva ? 'default' : 'secondary'}
                          className={`text-[10px] py-0 px-1.5 h-5 ${
                            isAtiva
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {isAtiva ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs flex items-center gap-1.5 mt-0.5">
                        <CreditCard className="w-3 h-3" /> Conta {conta.tipoConta || 'Corrente'}
                      </CardDescription>
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 text-muted-foreground hover:text-foreground">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 z-[9999]">
                      <DropdownMenuItem onClick={() => handleEdit(conta)} className="gap-2 cursor-pointer">
                        <Edit3 className="w-4 h-4 text-blue-500" /> Editar Dados
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleOpenSaldoModal(conta)} className="gap-2 cursor-pointer">
                        <ArrowUpDown className="w-4 h-4 text-emerald-500" /> Ajustar Saldo Real
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleToggleStatus(conta)} className="gap-2 cursor-pointer">
                        {isAtiva ? (
                          <>
                            <XCircle className="w-4 h-4 text-amber-500" /> Inativar Conta
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Ativar Conta
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => {
                          setContaToDelete(conta);
                          setDeleteModalOpen(true);
                        }}
                        className="gap-2 text-rose-600 focus:text-rose-600 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" /> Excluir Conta
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardContent className="px-5 pb-5 space-y-4">
                {/* Dados de Agência e Conta */}
                <div className="grid grid-cols-2 gap-2 text-xs bg-muted/40 p-2.5 rounded-lg border">
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Agência</span>
                    <span className="font-bold text-foreground">{conta.agencia || '-'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Conta</span>
                    <span className="font-bold text-foreground">
                      {conta.conta ? `${conta.conta}-${conta.digito || '0'}` : '-'}
                    </span>
                  </div>
                </div>

                {/* Titular e PIX */}
                <div className="space-y-1.5 text-xs">
                  {conta.titular && (
                    <div className="flex items-center justify-between text-muted-foreground">
                      <span className="truncate max-w-[170px]" title={conta.titular}>
                        {conta.titular}
                      </span>
                      {conta.cnpj && (
                        <span className="font-mono text-[11px] text-foreground/80">{conta.cnpj}</span>
                      )}
                    </div>
                  )}

                  {conta.chavePix && (
                    <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <QrCode className="w-3 h-3 text-primary" /> PIX:
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(conta.chavePix, 'Chave PIX')}
                        className="font-mono text-primary font-medium hover:underline flex items-center gap-1 truncate max-w-[180px]"
                        title="Clique para copiar chave PIX"
                      >
                        {conta.chavePix} <Copy className="w-3 h-3 opacity-60 shrink-0" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Saldo Bancário */}
                <div className="pt-3 border-t flex items-baseline justify-between">
                  <div>
                    <span className="text-[11px] text-muted-foreground block font-medium">Saldo Atual</span>
                    <span className={`text-xl sm:text-2xl font-black ${
                      (conta.saldoAtual || 0) >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {formatCurrency(conta.saldoAtual)}
                    </span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs px-2 gap-1"
                    onClick={() => handleOpenSaldoModal(conta)}
                  >
                    <ArrowUpDown className="w-3 h-3" /> Ajustar
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* Card para Adicionar Nova Conta */}
        <NovaContaBancariaSheet>
          <Card className="border-dashed bg-card/40 hover:bg-muted/40 transition-colors flex flex-col items-center justify-center text-center p-8 min-h-[260px] cursor-pointer group">
            <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
            <CardTitle className="text-base font-bold text-foreground">
              Cadastrar Nova Conta
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground max-w-[220px] mt-1">
              Adicione contas do Itaú, Bradesco, Santander, Nubank, Inter ou qualquer outro banco.
            </CardDescription>
          </Card>
        </NovaContaBancariaSheet>
      </div>

      {/* Sheet de Edição Controlada */}
      <NovaContaBancariaSheet
        contaToEdit={selectedContaToEdit}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />

      {/* Modal de Ajuste de Saldo Rápido */}
      <Dialog open={saldoModalOpen} onOpenChange={setSaldoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              Ajustar Saldo Bancário
            </DialogTitle>
            <DialogDescription>
              Atualize a posição real de saldo da conta <strong>{contaAjustarSaldo?.banco}</strong> ({contaAjustarSaldo?.agencia}/{contaAjustarSaldo?.conta}).
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-3">
            <Label className="font-semibold text-xs">Novo Saldo Real (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={novoSaldoInput}
              onChange={e => setNovoSaldoInput(e.target.value)}
              placeholder="0.00"
              className="text-lg font-bold text-primary"
              autoFocus
            />
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaldoModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveSaldo}>Salvar Novo Saldo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" />
              Excluir Conta Bancária
            </DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir permanentemente a conta <strong>{contaToDelete?.banco}</strong>? Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}>Confirmar Exclusão</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

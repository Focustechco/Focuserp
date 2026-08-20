import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, Plus, Edit3, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaBancaria } from '../types';

export const BANCOS_BRASILEIROS = [
  'Itaú Unibanco',
  'Bradesco',
  'Banco do Brasil',
  'Santander',
  'Caixa Econômica Federal',
  'Nubank',
  'Banco Inter',
  'BTG Pactual',
  'C6 Bank',
  'PagBank',
  'Stone Pagamentos',
  'Sicoob',
  'Sicredi',
  'Mercado Pago',
  'Safra',
  'Outro Banco'
];

interface NovaContaBancariaSheetProps {
  children?: React.ReactNode;
  contaToEdit?: ContaBancaria | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NovaContaBancariaSheet({
  children,
  contaToEdit,
  open: externalOpen,
  onOpenChange: externalOnOpenChange
}: NovaContaBancariaSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalOnOpenChange || (() => {})) : setInternalOpen;

  const [banco, setBanco] = useState('Itaú Unibanco');
  const [outroBanco, setOutroBanco] = useState('');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [digito, setDigito] = useState('');
  const [tipoConta, setTipoConta] = useState<'Corrente' | 'Poupança' | 'Investimento'>('Corrente');
  const [titular, setTitular] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [chavePix, setChavePix] = useState('');
  const [saldoAtual, setSaldoAtual] = useState('');
  const [status, setStatus] = useState<'Ativa' | 'Inativa'>('Ativa');

  const { addItem, updateItem } = useLocalStorageState<ContaBancaria>('focus_contas_bancarias');

  useEffect(() => {
    if (contaToEdit) {
      const isCustomBanco = !BANCOS_BRASILEIROS.includes(contaToEdit.banco);
      if (isCustomBanco) {
        setBanco('Outro Banco');
        setOutroBanco(contaToEdit.banco);
      } else {
        setBanco(contaToEdit.banco);
        setOutroBanco('');
      }
      setAgencia(contaToEdit.agencia || '');
      setConta(contaToEdit.conta || '');
      setDigito(contaToEdit.digito || '');
      setTipoConta(contaToEdit.tipoConta || 'Corrente');
      setTitular(contaToEdit.titular || '');
      setCnpj(contaToEdit.cnpj || '');
      setChavePix(contaToEdit.chavePix || '');
      setSaldoAtual(String(contaToEdit.saldoAtual || 0));
      setStatus(contaToEdit.status || 'Ativa');
    } else {
      setBanco('Itaú Unibanco');
      setOutroBanco('');
      setAgencia('');
      setConta('');
      setDigito('');
      setTipoConta('Corrente');
      setTitular('');
      setCnpj('');
      setChavePix('');
      setSaldoAtual('');
      setStatus('Ativa');
    }
  }, [contaToEdit, open]);

  const handleSave = () => {
    const nomeBancoFinal = (banco === 'Outro Banco' ? outroBanco : banco).trim();

    if (!nomeBancoFinal) {
      toast.error('Informe o nome da instituição bancária.');
      return;
    }
    if (!agencia.trim()) {
      toast.error('Informe a agência bancária.');
      return;
    }
    if (!conta.trim()) {
      toast.error('Informe o número da conta.');
      return;
    }
    if (!titular.trim()) {
      toast.error('Informe o titular da conta.');
      return;
    }

    const valorSaldo = Number(saldoAtual) || 0;

    if (contaToEdit) {
      updateItem(contaToEdit.id, {
        banco: nomeBancoFinal,
        agencia: agencia.trim(),
        conta: conta.trim(),
        digito: digito.trim() || '0',
        tipoConta,
        titular: titular.trim(),
        cnpj: cnpj.trim(),
        chavePix: chavePix.trim(),
        saldoAtual: valorSaldo,
        status
      });
      toast.success(`Conta bancária "${nomeBancoFinal}" atualizada com sucesso!`);
    } else {
      const novaConta: ContaBancaria = {
        id: `cb-${Date.now()}`,
        banco: nomeBancoFinal,
        agencia: agencia.trim(),
        conta: conta.trim(),
        digito: digito.trim() || '0',
        tipoConta,
        titular: titular.trim(),
        cnpj: cnpj.trim(),
        chavePix: chavePix.trim(),
        saldoInicial: valorSaldo,
        saldoAtual: valorSaldo,
        status
      };
      addItem(novaConta);
      toast.success(`Conta bancária "${nomeBancoFinal}" cadastrada com sucesso!`);
    }

    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <SheetTrigger asChild>
          {children || (
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Nova Conta Bancária
            </Button>
          )}
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-2 text-xl font-bold">
            <Building2 className="w-5 h-5 text-primary" />
            {contaToEdit ? 'Editar Conta Bancária' : 'Nova Conta Bancária'}
          </SheetTitle>
          <SheetDescription>
            {contaToEdit
              ? 'Atualize os dados cadastrais, chaves e saldo atual desta conta.'
              : 'Cadastre suas contas correntes ou de investimentos para importação de extratos e conciliação.'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-2 text-sm">
          {/* Banco */}
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs">Instituição Financeira / Banco *</Label>
            <Select value={banco} onValueChange={setBanco}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o banco" />
              </SelectTrigger>
              <SelectContent className="max-h-64 z-[9999]">
                {BANCOS_BRASILEIROS.map(b => (
                  <SelectItem key={b} value={b}>{b}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {banco === 'Outro Banco' && (
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Nome do Banco / Fintech *</Label>
              <Input
                value={outroBanco}
                onChange={e => setOutroBanco(e.target.value)}
                placeholder="Ex: Banco BS2, Cora, Nomad..."
              />
            </div>
          )}

          {/* Agência, Conta e Dígito */}
          <div className="grid grid-cols-12 gap-3">
            <div className="space-y-1.5 col-span-4">
              <Label className="font-semibold text-xs">Agência *</Label>
              <Input
                value={agencia}
                onChange={e => setAgencia(e.target.value)}
                placeholder="0001"
              />
            </div>
            <div className="space-y-1.5 col-span-5">
              <Label className="font-semibold text-xs">Número da Conta *</Label>
              <Input
                value={conta}
                onChange={e => setConta(e.target.value)}
                placeholder="12345"
              />
            </div>
            <div className="space-y-1.5 col-span-3">
              <Label className="font-semibold text-xs">Dígito</Label>
              <Input
                value={digito}
                onChange={e => setDigito(e.target.value)}
                placeholder="0"
                maxLength={4}
              />
            </div>
          </div>

          {/* Tipo de Conta e Status */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Tipo de Conta *</Label>
              <Select value={tipoConta} onValueChange={(v: any) => setTipoConta(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="Corrente">Conta Corrente</SelectItem>
                  <SelectItem value="Poupança">Conta Poupança</SelectItem>
                  <SelectItem value="Investimento">Investimento / Tesouraria</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Status da Conta</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="z-[9999]">
                  <SelectItem value="Ativa">Ativa</SelectItem>
                  <SelectItem value="Inativa">Inativa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Titular e Documento */}
          <div className="space-y-1.5">
            <Label className="font-semibold text-xs">Razão Social / Titular da Conta *</Label>
            <Input
              value={titular}
              onChange={e => setTitular(e.target.value)}
              placeholder="Ex: Focus Tecnologia & Sistemas LTDA"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">CNPJ / CPF do Titular</Label>
              <Input
                value={cnpj}
                onChange={e => setCnpj(e.target.value)}
                placeholder="00.000.000/0001-00"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-xs">Chave PIX Principal</Label>
              <Input
                value={chavePix}
                onChange={e => setChavePix(e.target.value)}
                placeholder="CNPJ, E-mail ou Telefone"
              />
            </div>
          </div>

          {/* Saldo Atual */}
          <div className="space-y-1.5 bg-muted/40 p-3 rounded-lg border">
            <Label className="font-semibold text-xs">Saldo Atual em Conta (R$)</Label>
            <Input
              type="number"
              step="0.01"
              value={saldoAtual}
              onChange={e => setSaldoAtual(e.target.value)}
              placeholder="0.00"
              className="text-base font-bold text-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              Este valor representa a posição real de saldo para conferência e conciliação.
            </p>
          </div>
        </div>

        <SheetFooter className="mt-6">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-2">
            <CheckCircle2 className="w-4 h-4" /> {contaToEdit ? 'Salvar Alterações' : 'Cadastrar Conta'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

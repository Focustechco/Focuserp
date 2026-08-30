import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'sonner';

import { useContasPagarQuery } from '../hooks/useContasPagarQuery';
import { ContaPagar } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Fornecedor } from '@/features/fornecedores/types';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { RecorrenciaFinanceira, FrequenciaRecorrencia } from '@/features/recorrencias/types';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { addDays } from 'date-fns';

export function NovaContaSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [parcelado, setParcelado] = useState(false);
  const [recorrente, setRecorrente] = useState(false);
  const [fornecedor, setFornecedor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Infraestrutura');
  const [valorOriginal, setValorOriginal] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Boleto');
  const [responsavel, setResponsavel] = useState('');

  // Parcelamento
  const [qtdParcelas, setQtdParcelas] = useState('12');
  const [intervaloDias, setIntervaloDias] = useState('30');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');

  // Recorrência
  const [frequenciaRec, setFrequenciaRec] = useState<FrequenciaRecorrencia>('Mensal');
  const [dataInicioRec, setDataInicioRec] = useState('');
  const [dataFimRec, setDataFimRec] = useState('');
  const [quantidadeRec, setQuantidadeRec] = useState('');

  const { saveConta } = useContasPagarQuery();
  const { data: fornecedores = [] } = useLocalStorageState<Fornecedor>('focus_fornecedores');
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { data: recorrencias = [], setAllItems: setAllRecorrencias } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { notificar } = useNotificacoesStore();

  const selectedFornecedorObj = fornecedores.find(f => f.nomeFantasia === fornecedor || f.razaoSocial === fornecedor || f.id === fornecedor);
  const fornecedorNome = selectedFornecedorObj ? (selectedFornecedorObj.nomeFantasia || selectedFornecedorObj.razaoSocial) : fornecedor;
  const fornecedorId = selectedFornecedorObj?.id || '';

  const handleSave = () => {
    if (!fornecedor || fornecedor === 'none') {
      toast.error("Por favor, selecione um Fornecedor cadastrado no sistema.");
      return;
    }
    if (!descricao) {
      toast.error("Por favor, informe a Descrição da despesa.");
      return;
    }
    if (!valorOriginal || parseFloat(valorOriginal) <= 0) {
      toast.error("O Valor Original deve ser maior que zero!");
      return;
    }
    if (!dataVencimento && !primeiroVencimento && !dataInicioRec) {
      toast.error("A Data de Vencimento é obrigatória!");
      return;
    }
    if (!categoria) {
      toast.error("A Categoria é obrigatória!");
      return;
    }

    const val = parseFloat(valorOriginal) || 1000;
    const baseVencimento = dataVencimento || primeiroVencimento || dataInicioRec || new Date().toISOString().split('T')[0];

    // 1. Se for Recorrente, registra a Recorrência Financeira de Despesa
    if (recorrente) {
      const novaRecorrencia: RecorrenciaFinanceira = {
        id: `rec-pag-${Date.now()}`,
        fornecedorId: fornecedorId,
        fornecedorNome: fornecedorNome,
        tipo: 'Despesa',
        descricao: descricao,
        valor: val,
        frequencia: frequenciaRec,
        dataInicio: dataInicioRec || baseVencimento,
        dataFim: dataFimRec || undefined,
        dataFinal: dataFimRec || undefined,
        proximaCobranca: baseVencimento,
        diaVencimento: parseInt(baseVencimento.split('-')[2], 10) || 10,
        quantidade: quantidadeRec ? parseInt(quantidadeRec, 10) : null,
        status: 'Ativa',
        origem: 'despesa',
        categoria: categoria,
        formaPagamento: formaPagamento,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setAllRecorrencias([novaRecorrencia, ...recorrencias]);
    }

    // 2. Se for Parcelada, gera os títulos das parcelas
    if (parcelado) {
      const numParcelas = Math.max(1, parseInt(qtdParcelas, 10) || 1);
      const dias = parseInt(intervaloDias, 10) || 30;
      const valorPorParcela = +(val / numParcelas).toFixed(2);
      const codBase = Math.floor(100 + Math.random() * 900);

      for (let i = 1; i <= numParcelas; i++) {
        const dataVencParcela = addDays(new Date(primeiroVencimento || baseVencimento), (i - 1) * dias).toISOString().split('T')[0];
        const contaParcela: ContaPagar = {
          id: crypto.randomUUID(),
          numero: `PAG-${codBase}/${String(i).padStart(2, '0')}`,
          fornecedor: fornecedorNome,
          descricao: `${descricao} (Parcela ${i}/${numParcelas})`,
          categoria: categoria || 'Operacional',
          valorOriginal: valorPorParcela,
          valorPago: 0,
          saldo: valorPorParcela,
          dataEmissao: new Date().toISOString().split('T')[0],
          dataVencimento: dataVencParcela,
          formaPagamento: (formaPagamento as any) || 'Boleto',
          status: 'Pendente',
          responsavel: responsavel || 'Financeiro',
          ultimaAtualizacao: new Date().toISOString(),
          historico: [
            { id: `h-${Date.now()}-${i}`, data: new Date().toISOString(), usuario: 'Usuário', acao: `Criação da parcela ${i}/${numParcelas}` }
          ]
        };
        saveConta(contaParcela as any);
      }

      toast.success(`${numParcelas} parcelas de R$ ${valorPorParcela.toLocaleString('pt-BR')} cadastradas com sucesso!`);
    } else {
      // Conta avulsa ou primeiro ciclo de recorrência
      const novaConta: ContaPagar = {
        id: crypto.randomUUID(),
        numero: `PAG-${Math.floor(100 + Math.random() * 900)}`,
        fornecedor: fornecedorNome,
        descricao: recorrente ? `${descricao} (Recorrência Mensal)` : descricao,
        categoria: categoria || 'Operacional',
        valorOriginal: val,
        valorPago: 0,
        saldo: val,
        dataEmissao: new Date().toISOString().split('T')[0],
        dataVencimento: baseVencimento,
        formaPagamento: (formaPagamento as any) || 'Boleto',
        status: 'Pendente',
        responsavel: responsavel || 'Financeiro',
        recorrente: recorrente,
        recorrenciaFrequencia: frequenciaRec,
        recorrenciaFim: dataFimRec,
        ultimaAtualizacao: new Date().toISOString(),
        historico: [
          { id: `h-${Date.now()}`, data: new Date().toISOString(), usuario: 'Usuário', acao: 'Criação da conta' }
        ]
      };

      saveConta(novaConta as any);
      toast.success(recorrente ? "Despesa e plano recorrente cadastrados com sucesso!" : "Despesa cadastrada com sucesso!");
    }

    // Disparar Notificação Automática
    notificar({
      titulo: `Nova Conta a Pagar Lançada para ${fornecedorNome}`,
      descricao: `Despesa de R$ ${val.toLocaleString('pt-BR')} com vencimento em ${baseVencimento}.`,
      origem: 'Financeiro',
      tipo: 'Aviso',
      prioridade: 'Alta',
      targetUrl: '/contas-a-pagar',
      usuarioDestino: responsavel || 'Você'
    });

    setOpen(false);
    setDescricao('');
    setFornecedor('');
    setValorOriginal('');
    setRecorrente(false);
    setParcelado(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Nova Despesa</SheetTitle>
          <SheetDescription>
            Registre uma nova obrigação financeira a pagar.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="geral" className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1 mb-4">
            <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
              <TabsTrigger value="geral" className="shrink-0 whitespace-nowrap">Geral</TabsTrigger>
              <TabsTrigger value="financeiro" className="shrink-0 whitespace-nowrap">Financeiro</TabsTrigger>
              <TabsTrigger value="parcelamento" className="shrink-0 whitespace-nowrap gap-1">
                <Layers className="w-3 h-3" /> Parcelas
              </TabsTrigger>
              <TabsTrigger value="recorrencia" className="shrink-0 whitespace-nowrap gap-1">
                <RefreshCw className="w-3 h-3" /> Recorrência
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Aba: Geral */}
          <TabsContent value="geral" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fornecedor">Fornecedor / Favorecido *</Label>
              <Select value={fornecedor} onValueChange={setFornecedor}>
                <SelectTrigger id="fornecedor">
                  <SelectValue placeholder="Selecione um fornecedor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none" disabled>Selecione um fornecedor</SelectItem>
                  {fornecedores.map(f => (
                    <SelectItem key={f.id} value={f.nomeFantasia || f.razaoSocial}>
                      {f.nomeFantasia || f.razaoSocial} ({f.documento || 'Sem CNPJ'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição da Despesa *</Label>
              <Input 
                id="descricao" 
                placeholder="Ex: Licença Servidor AWS, Aluguel Escritório..." 
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria *</Label>
                <Select value={categoria} onValueChange={setCategoria}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Infraestrutura">Infraestrutura & Cloud</SelectItem>
                    <SelectItem value="Operacional">Operacional</SelectItem>
                    <SelectItem value="Software">Licenças de Software</SelectItem>
                    <SelectItem value="Marketing">Marketing & Vendas</SelectItem>
                    <SelectItem value="Folha de Pagamento">Folha de Pagamento</SelectItem>
                    <SelectItem value="Impostos">Impostos & Tributos</SelectItem>
                    <SelectItem value="Serviços Terceiros">Serviços Terceiros</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="responsavel">Responsável / Aprovador</Label>
                <SelectResponsavel 
                  usuarios={usuarios} 
                  value={responsavel} 
                  onChange={setResponsavel} 
                />
              </div>
            </div>
          </TabsContent>

          {/* Aba: Financeiro */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Original (R$) *</Label>
                <Input 
                  id="valor" 
                  type="number" 
                  placeholder="0,00" 
                  value={valorOriginal}
                  onChange={e => setValorOriginal(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vencimento">Data de Vencimento *</Label>
                <Input 
                  id="vencimento" 
                  type="date" 
                  value={dataVencimento}
                  onChange={e => setDataVencimento(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="forma">Forma de Pagamento</Label>
              <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                <SelectTrigger id="forma">
                  <SelectValue placeholder="Forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Transferência">TED / Transferência</SelectItem>
                  <SelectItem value="Cartão">Cartão Corporativo</SelectItem>
                  <SelectItem value="Débito">Débito Automático</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Aba: Parcelamento */}
          <TabsContent value="parcelamento" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h4 className="font-medium text-sm">Despesa Parcelada</h4>
                <p className="text-xs text-muted-foreground">Dividir este pagamento em várias parcelas/faturas.</p>
              </div>
              <Switch checked={parcelado} onCheckedChange={(val) => { setParcelado(val); if (val) setRecorrente(false); }} />
            </div>

            {parcelado && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Quantidade de Parcelas</Label>
                  <Input type="number" placeholder="Ex: 12" value={qtdParcelas} onChange={e => setQtdParcelas(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo entre Parcelas (dias)</Label>
                  <Input type="number" value={intervaloDias} onChange={e => setIntervaloDias(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label>1º Vencimento</Label>
                  <Input type="date" value={primeiroVencimento || dataVencimento} onChange={e => setPrimeiroVencimento(e.target.value)} />
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba: Recorrência */}
          <TabsContent value="recorrencia" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h4 className="font-medium text-sm">Despesa Recorrente</h4>
                <p className="text-xs text-muted-foreground">Obrigações contínuas (aluguel, licenças, folha, AWS).</p>
              </div>
              <Switch checked={recorrente} onCheckedChange={(val) => { setRecorrente(val); if (val) setParcelado(false); }} />
            </div>

            {recorrente && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label>Frequência</Label>
                  <Select value={frequenciaRec} onValueChange={(v: FrequenciaRecorrencia) => setFrequenciaRec(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a frequência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mensal">Mensal</SelectItem>
                      <SelectItem value="Semanal">Semanal</SelectItem>
                      <SelectItem value="Quinzenal">Quinzenal</SelectItem>
                      <SelectItem value="Trimestral">Trimestral</SelectItem>
                      <SelectItem value="Semestral">Semestral</SelectItem>
                      <SelectItem value="Anual">Anual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Data de Início</Label>
                  <Input type="date" value={dataInicioRec || dataVencimento} onChange={e => setDataInicioRec(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data Final (Opcional)</Label>
                  <Input type="date" value={dataFimRec} onChange={e => setDataFimRec(e.target.value)} />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Despesa</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

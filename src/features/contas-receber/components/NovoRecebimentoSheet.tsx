import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import { useContasReceberQuery } from '../hooks/useContasReceberQuery';
import { useClientesQuery } from '@/features/clientes/hooks/useClientesQuery';
import { TituloReceber, FormaPagamento } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { RecorrenciaFinanceira, FrequenciaRecorrencia } from '@/features/recorrencias/types';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';

export function NovoRecebimentoSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [parcelado, setParcelado] = useState(false);
  const [recorrente, setRecorrente] = useState(false);
  
  const [clienteId, setClienteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('Serviços');
  const [valorOriginal, setValorOriginal] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [responsavel, setResponsavel] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Recorrência
  const [frequencia, setFrequencia] = useState<FrequenciaRecorrencia>('Mensal');
  const [dataInicioRec, setDataInicioRec] = useState('');
  const [fimRecorrencia, setFimRecorrencia] = useState('');

  const { saveTitulo } = useContasReceberQuery();
  const { clientes } = useClientesQuery();
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { data: titulos = [], setAllItems: setAllTitulos } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: recorrencias = [], setAllItems: setAllRecorrencias } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { notificar } = useNotificacoesStore();

  const selectedClienteObj = clientes.find(c => c.id === clienteId);
  const clienteNome = selectedClienteObj ? (selectedClienteObj.nomeFantasia || selectedClienteObj.razaoSocial) : '';

  const handleSave = () => {
    if (!clienteId || clienteId === 'none') {
      toast.error("Por favor, selecione um Cliente cadastrado no sistema.");
      return;
    }
    if (!descricao) {
      toast.error("Por favor, informe a Descrição do recebimento.");
      return;
    }
    if (!valorOriginal || parseFloat(valorOriginal) <= 0) {
      toast.error("O Valor Original deve ser maior que zero!");
      return;
    }
    if (!dataVencimento) {
      toast.error("A Data de Vencimento é obrigatória!");
      return;
    }
    if (!categoria) {
      toast.error("A Categoria é obrigatória!");
      return;
    }

    const val = parseFloat(valorOriginal) || 1500;
    let recId: string | undefined = undefined;

    // Se habilitar recorrência, cadastrar/vincular a RecorrenciaFinanceira
    if (recorrente) {
      recId = `rec_${crypto.randomUUID()}`;
      const novaRecorrencia: RecorrenciaFinanceira = {
        id: recId,
        clientId: clienteId,
        clienteNome: clienteNome || 'Cliente',
        descricao: descricao || `Recorrência - ${clienteNome}`,
        valor: val,
        frequencia: frequencia,
        dataInicio: dataInicioRec || dataVencimento || new Date().toISOString().split('T')[0],
        proximaCobranca: dataVencimento || new Date().toISOString().split('T')[0],
        status: 'Ativa',
        origem: 'financeiro',
        categoria: categoria,
        formaPagamento: formaPagamento,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setAllRecorrencias([novaRecorrencia, ...recorrencias]);
    }

    const novoTitulo: TituloReceber = {
      id: crypto.randomUUID(),
      numero: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
      cliente: clienteNome,
      clienteId: clienteId,
      recorrenciaId: recId,
      origem: recorrente ? 'recorrencia' : 'manual',
      descricao,
      categoria: categoria || 'Serviços',
      valorOriginal: val,
      valorRecebido: 0,
      saldo: val,
      dataEmissao: new Date().toISOString().split('T')[0],
      dataVencimento: dataVencimento || new Date().toISOString().split('T')[0],
      formaPagamento: formaPagamento,
      status: 'Pendente',
      responsavel: responsavel || 'Financeiro',
      ultimaAtualizacao: new Date().toISOString(),
      recorrente: recorrente,
      recorrenciaFrequencia: recorrente ? frequencia : undefined,
      recorrenciaFim: fimRecorrencia || undefined,
      observacoes: observacoes || undefined,
      historico: [
        { 
          id: `h-${Date.now()}`, 
          data: new Date().toISOString(), 
          usuario: 'Usuário', 
          acao: recorrente ? 'Criação de título recorrente' : 'Criação do título' 
        }
      ]
    };

    setAllTitulos([novoTitulo, ...titulos.filter(t => t.id !== novoTitulo.id)]);
    saveTitulo(novoTitulo as any);

    // Disparar Notificação Automática
    notificar({
      titulo: `Novo Recebimento Cadastrado (${novoTitulo.numero})`,
      descricao: `Recebimento de R$ ${val.toLocaleString('pt-BR')} para ${clienteNome} com vencimento em ${dataVencimento}.`,
      origem: 'Financeiro',
      tipo: 'Sucesso',
      prioridade: 'Normal',
      targetUrl: '/contas-a-receber',
      usuarioDestino: responsavel || 'Você'
    });

    toast.success("Recebimento cadastrado com sucesso!");
    setOpen(false);
    setDescricao('');
    setClienteId('');
    setValorOriginal('');
    setRecorrente(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Novo Recebimento</SheetTitle>
          <SheetDescription>
            Preencha os dados para registrar um novo título a receber.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="geral" className="w-full">
          <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1 mb-4">
            <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
              <TabsTrigger value="geral" className="shrink-0 whitespace-nowrap">Geral</TabsTrigger>
              <TabsTrigger value="financeiro" className="shrink-0 whitespace-nowrap">Financeiro</TabsTrigger>
              <TabsTrigger value="parcelamento" className="shrink-0 whitespace-nowrap">Parcelas</TabsTrigger>
              <TabsTrigger value="recorrencia" className="shrink-0 whitespace-nowrap">Recorrência</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Aba: Geral */}
          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente *</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger id="cliente">
                    <SelectValue placeholder="Selecione o cliente cadastrado" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum cliente cadastrado. Cadastre no módulo Clientes primeiro.
                      </SelectItem>
                    ) : (
                      clientes.map((c) => {
                        const name = c.nomeFantasia || c.razaoSocial || 'Cliente Sem Nome';
                        return (
                          <SelectItem key={c.id} value={c.id}>
                            {name} ({c.documento || 'Sem doc'})
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição *</Label>
                <Input id="descricao" placeholder="Ex: Referente à consultoria de TI" value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="categoria">Categoria *</Label>
                  <Select value={categoria} onValueChange={setCategoria}>
                    <SelectTrigger id="categoria">
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Serviços">Serviços</SelectItem>
                      <SelectItem value="Produtos">Produtos</SelectItem>
                      <SelectItem value="Mensalidade">Mensalidade</SelectItem>
                      <SelectItem value="Consultoria">Consultoria</SelectItem>
                      <SelectItem value="Licenciamento">Licenciamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="responsavel">Responsável</Label>
                  <SelectResponsavel
                    value={responsavel}
                    onValueChange={setResponsavel}
                    placeholder="Selecione o Usuário Responsável"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observacoes">Observações</Label>
                <Input 
                  id="observacoes" 
                  placeholder="Informações adicionais..." 
                  value={observacoes} 
                  onChange={e => setObservacoes(e.target.value)} 
                />
              </div>
            </div>
          </TabsContent>

          {/* Aba: Financeiro */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valorOriginal">Valor Original (R$) *</Label>
                <Input id="valorOriginal" type="number" placeholder="0,00" value={valorOriginal} onChange={e => setValorOriginal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dataVencimento">Data de Vencimento *</Label>
                <Input id="dataVencimento" type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="formaPagamento">Forma de Pagamento</Label>
                <Select value={formaPagamento} onValueChange={(v: FormaPagamento) => setFormaPagamento(v)}>
                  <SelectTrigger id="formaPagamento">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="Boleto">Boleto</SelectItem>
                    <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                    <SelectItem value="Transferência">Transferência</SelectItem>
                    <SelectItem value="Dinheiro">Dinheiro</SelectItem>
                    <SelectItem value="Outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="desconto">Desconto (R$)</Label>
                <Input id="desconto" type="number" placeholder="0,00" />
              </div>
            </div>
          </TabsContent>

          {/* Aba: Parcelamento */}
          <TabsContent value="parcelamento" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h4 className="font-medium text-sm">Habilitar Parcelamento</h4>
                <p className="text-xs text-muted-foreground">Dividir este recebimento em múltiplas parcelas.</p>
              </div>
              <Switch checked={parcelado} onCheckedChange={setParcelado} />
            </div>

            {parcelado && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2">
                  <Label>Quantidade de Parcelas</Label>
                  <Input type="number" placeholder="Ex: 3" />
                </div>
                <div className="space-y-2">
                  <Label>Intervalo (dias)</Label>
                  <Input type="number" defaultValue="30" />
                </div>
                <div className="space-y-2">
                  <Label>1º Vencimento</Label>
                  <Input type="date" />
                </div>
                <div className="col-span-1 sm:col-span-2 pt-2">
                  <Button variant="secondary" className="w-full">Simular Parcelas</Button>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Aba: Recorrência */}
          <TabsContent value="recorrencia" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h4 className="font-medium text-sm">Habilitar Recorrência</h4>
                <p className="text-xs text-muted-foreground">Gerar este recebimento periodicamente (ex: assinaturas).</p>
              </div>
              <Switch checked={recorrente} onCheckedChange={setRecorrente} />
            </div>

            {recorrente && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label>Frequência</Label>
                  <Select value={frequencia} onValueChange={(v: FrequenciaRecorrencia) => setFrequencia(v)}>
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
                  <Input type="date" value={dataInicioRec} onChange={e => setDataInicioRec(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Fim da Recorrência (Opcional)</Label>
                  <Input type="date" value={fimRecorrencia} onChange={e => setFimRecorrencia(e.target.value)} />
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Recebimento</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

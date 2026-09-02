import React, { useState, useMemo } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Plus, Tag, FolderTree, RefreshCw, Layers } from 'lucide-react';
import { toast } from 'sonner';

import { useContasReceberQuery } from '../hooks/useContasReceberQuery';
import { useClientesQuery } from '@/features/clientes/hooks/useClientesQuery';
import { TituloReceber, FormaPagamento } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { RecorrenciaFinanceira, FrequenciaRecorrencia } from '@/features/recorrencias/types';
import { CategoriaFinanceira } from '@/features/plano-contas/types';
import { INITIAL_CATEGORIAS } from '@/features/plano-contas/mockData';
import { CentroCusto } from '@/features/centro-de-custos/types';
import { INITIAL_CENTROS } from '@/features/centro-de-custos/data/initialData';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
interface NovoRecebimentoSheetProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NovoRecebimentoSheet({ children, open: controlledOpen, onOpenChange: setControlledOpen }: NovoRecebimentoSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen || (() => {})) : setInternalOpen;
  const [parcelado, setParcelado] = useState(false);
  const [recorrente, setRecorrente] = useState(false);
  
  const [clienteId, setClienteId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState('');
  const [centroCusto, setCentroCusto] = useState('');
  const [valorOriginal, setValorOriginal] = useState('');
  const [dataVencimento, setDataVencimento] = useState('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('PIX');
  const [responsavel, setResponsavel] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // Parcelamento
  const [qtdParcelas, setQtdParcelas] = useState('12');
  const [intervaloDias, setIntervaloDias] = useState('30');
  const [primeiroVencimento, setPrimeiroVencimento] = useState('');

  // Recorrência
  const [frequencia, setFrequencia] = useState<FrequenciaRecorrencia>('Mensal');
  const [dataInicioRec, setDataInicioRec] = useState('');
  const [fimRecorrencia, setFimRecorrencia] = useState('');
  const [quantidadeRec, setQuantidadeRec] = useState('');

  const { saveTitulo } = useContasReceberQuery();
  const { clientes } = useClientesQuery();
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { data: planoContas = [] } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);
  const { data: centrosCusto = [] } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: titulos = [], setAllItems: setAllTitulos } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: recorrencias = [], setAllItems: setAllRecorrencias } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { notificar } = useNotificacoesStore();

  // Categorias de Receita no Plano de Contas
  const categoriasReceita = useMemo(() => {
    const ativas = planoContas.filter(c => c && c.status !== 'Inativa');
    const filtradas = ativas.filter(c => c.tipo === 'Receita' || !c.tipo);
    return filtradas.length > 0 ? filtradas : ativas;
  }, [planoContas]);

  // Centros de Custo disponíveis
  const centrosDisponiveis = useMemo(() => {
    const ativos = centrosCusto.filter(c => c && c.status !== 'Inativo');
    const filtrados = ativos.filter(c => c.tipo === 'Receita' || !c.tipo);
    return filtrados.length > 0 ? filtrados : ativos;
  }, [centrosCusto]);

  const selectedClienteObj = clientes.find(c => c.id === clienteId);
  const clienteNome = selectedClienteObj ? (selectedClienteObj.nomeFantasia || selectedClienteObj.razaoSocial) : '';

  const selectedCategoriaObj = categoriasReceita.find(c => c.nome === categoria || c.id === categoria);
  const categoriaNome = selectedCategoriaObj ? selectedCategoriaObj.nome : (categoria || 'Receitas Operacionais');
  const categoriaId = selectedCategoriaObj?.id;

  const selectedCentroObj = centrosDisponiveis.find(c => c.nome === centroCusto || c.id === centroCusto);
  const centroCustoNome = selectedCentroObj ? selectedCentroObj.nome : centroCusto;
  const centroCustoId = selectedCentroObj?.id;

  const handleCategoriaSelect = (catValue: string) => {
    setCategoria(catValue);
    const foundCat = categoriasReceita.find(c => c.id === catValue || c.nome === catValue);
    if (foundCat && foundCat.centroCustoPadraoId && (!centroCusto || centroCusto === 'none')) {
      const matchCC = centrosDisponiveis.find(cc => cc.id === foundCat.centroCustoPadraoId);
      if (matchCC) {
        setCentroCusto(matchCC.id);
      }
    }
  };

  const handleCentroCustoSelect = (ccValue: string) => {
    setCentroCusto(ccValue);
    const foundCC = centrosDisponiveis.find(cc => cc.id === ccValue || cc.nome === ccValue);
    if (foundCC && foundCC.categoria && (!categoria || categoria === 'none')) {
      const matchCat = categoriasReceita.find(c => c.nome === foundCC.categoria || c.id === foundCC.categoria);
      if (matchCat) {
        setCategoria(matchCat.id);
      }
    }
  };

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
    if (!dataVencimento && !primeiroVencimento && !dataInicioRec) {
      toast.error("A Data de Vencimento é obrigatória!");
      return;
    }

    const val = parseFloat(valorOriginal) || 1500;
    const baseVencimento = dataVencimento || primeiroVencimento || dataInicioRec || new Date().toISOString().split('T')[0];
    let recId: string | undefined = undefined;

    // 1. Se for Recorrente, registra a Recorrência Financeira
    if (recorrente) {
      recId = `rec_${crypto.randomUUID()}`;
      const novaRecorrencia: RecorrenciaFinanceira = {
        id: recId,
        clientId: clienteId,
        clienteNome: clienteNome || 'Cliente',
        tipo: 'Receita',
        descricao: descricao || `Recorrência - ${clienteNome}`,
        valor: val,
        frequencia: frequencia,
        dataInicio: dataInicioRec || baseVencimento,
        dataFim: fimRecorrencia || undefined,
        dataFinal: fimRecorrencia || undefined,
        proximaCobranca: baseVencimento,
        diaVencimento: parseInt(baseVencimento.split('-')[2], 10) || 10,
        quantidade: quantidadeRec ? parseInt(quantidadeRec, 10) : null,
        status: 'Ativa',
        origem: 'financeiro',
        categoria: categoriaNome,
        formaPagamento: formaPagamento,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setAllRecorrencias([novaRecorrencia, ...recorrencias]);
    }

    // 2. Se for Parcelado
    if (parcelado) {
      const numParcelas = Math.max(1, parseInt(qtdParcelas, 10) || 1);
      const dias = parseInt(intervaloDias, 10) || 30;
      const valorPorParcela = +(val / numParcelas).toFixed(2);
      const codBase = Math.floor(1000 + Math.random() * 9000);

      for (let i = 1; i <= numParcelas; i++) {
        const dataVencParcela = addDays(new Date(primeiroVencimento || baseVencimento), (i - 1) * dias).toISOString().split('T')[0];
        const novoTitulo: TituloReceber = {
          id: crypto.randomUUID(),
          numero: `REC-${codBase}/${String(i).padStart(2, '0')}`,
          cliente: clienteNome,
          clienteId: clienteId,
          origem: 'parcelamento',
          descricao: `${descricao} (Parcela ${i}/${numParcelas})`,
          categoria: categoriaNome,
          categoriaId: categoriaId,
          centroCusto: centroCustoNome,
          centroCustoNome: centroCustoNome,
          centroCustoId: centroCustoId,
          valorOriginal: valorPorParcela,
          valorRecebido: 0,
          saldo: valorPorParcela,
          dataEmissao: new Date().toISOString().split('T')[0],
          dataVencimento: dataVencParcela,
          formaPagamento: formaPagamento,
          status: 'Pendente',
          responsavel: responsavel || 'Financeiro',
          ultimaAtualizacao: new Date().toISOString(),
          observacoes: observacoes || undefined,
          historico: [
            { 
              id: `h-${Date.now()}-${i}`, 
              data: new Date().toISOString(), 
              usuario: 'Usuário', 
              acao: `Criação da parcela ${i}/${numParcelas}` 
            }
          ]
        };
        saveTitulo(novoTitulo as any);
      }
      toast.success(`${numParcelas} parcelas de R$ ${valorPorParcela.toLocaleString('pt-BR')} cadastradas com sucesso!`);
    } else {
      const novoTitulo: TituloReceber = {
        id: crypto.randomUUID(),
        numero: `REC-${Math.floor(1000 + Math.random() * 9000)}`,
        cliente: clienteNome,
        clienteId: clienteId,
        recorrenciaId: recId,
        origem: recorrente ? 'recorrencia' : 'manual',
        descricao,
        categoria: categoriaNome,
        categoriaId: categoriaId,
        centroCusto: centroCustoNome,
        centroCustoNome: centroCustoNome,
        centroCustoId: centroCustoId,
        valorOriginal: val,
        valorRecebido: 0,
        saldo: val,
        dataEmissao: new Date().toISOString().split('T')[0],
        dataVencimento: baseVencimento,
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
      toast.success(recorrente ? "Recebimento e recorrência cadastrados com sucesso!" : "Recebimento cadastrado com sucesso!");
    }

    // Disparar Notificação Automática
    notificar({
      titulo: `Novo Recebimento Cadastrado para ${clienteNome}`,
      descricao: `Recebimento de R$ ${val.toLocaleString('pt-BR')} [${categoriaNome}] com vencimento em ${baseVencimento}.`,
      origem: 'Financeiro',
      tipo: 'Sucesso',
      prioridade: 'Normal',
      targetUrl: '/contas-a-receber',
      usuarioDestino: responsavel || 'Você'
    });

    setOpen(false);
    setDescricao('');
    setClienteId('');
    setValorOriginal('');
    setCategoria('');
    setCentroCusto('');
    setRecorrente(false);
    setParcelado(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-2xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Novo Recebimento</SheetTitle>
          <SheetDescription>
            Registre um novo recebimento integrado ao Plano de Contas e Centro de Custos.
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
              <Label htmlFor="descricao">Descrição do Recebimento *</Label>
              <Input 
                id="descricao" 
                placeholder="Ex: Mensalidade Plano Enterprise, Consultoria em Cloud..." 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="categoria" className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-primary" /> Categoria (Plano de Contas) *
                </Label>
                <Select value={categoria} onValueChange={handleCategoriaSelect}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione a categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasReceita.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <span className="font-mono text-muted-foreground mr-1.5 text-[11px]">{cat.codigo}</span>
                        {cat.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="centroCusto" className="flex items-center gap-1.5">
                  <FolderTree className="w-3.5 h-3.5 text-emerald-500" /> Centro de Custos
                </Label>
                <Select value={centroCusto} onValueChange={handleCentroCustoSelect}>
                  <SelectTrigger id="centroCusto">
                    <SelectValue placeholder="Selecione o Centro de Custo" />
                  </SelectTrigger>
                  <SelectContent>
                    {centrosDisponiveis.map(cc => (
                      <SelectItem key={cc.id} value={cc.id}>
                        <span className="font-mono text-muted-foreground mr-1.5 text-[11px]">{cc.codigo}</span>
                        {cc.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável / Executivo</Label>
              <SelectResponsavel
                usuarios={usuarios}
                value={responsavel}
                onChange={setResponsavel}
                placeholder="Selecione o Responsável"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="observacoes">Observações Internas</Label>
              <Input 
                id="observacoes" 
                placeholder="Informações contratuais, notas de empenho..." 
                value={observacoes} 
                onChange={e => setObservacoes(e.target.value)} 
              />
            </div>
          </TabsContent>

          {/* Aba: Financeiro */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor do Título (R$) *</Label>
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
              <Label htmlFor="forma">Forma de Recebimento</Label>
              <Select value={formaPagamento} onValueChange={(v: FormaPagamento) => setFormaPagamento(v)}>
                <SelectTrigger id="forma">
                  <SelectValue placeholder="Forma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                  <SelectItem value="Cartão">Cartão de Crédito</SelectItem>
                  <SelectItem value="Transferência">TED / Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </TabsContent>

          {/* Aba: Parcelamento */}
          <TabsContent value="parcelamento" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <h4 className="font-medium text-sm">Recebimento Parcelado</h4>
                <p className="text-xs text-muted-foreground">Dividir em várias faturas mensais/periódicas.</p>
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
                <h4 className="font-medium text-sm">Receita Recorrente</h4>
                <p className="text-xs text-muted-foreground">Cobrança contínua (SaaS, assinaturas, contratos mensais).</p>
              </div>
              <Switch checked={recorrente} onCheckedChange={(val) => { setRecorrente(val); if (val) setParcelado(false); }} />
            </div>

            {recorrente && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 border rounded-lg animate-in fade-in slide-in-from-top-2">
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label>Frequência da Cobrança</Label>
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
                  <Label>Prazo</Label>
                  <Input 
                    type="number" 
                    placeholder="Ex: 2 (vazio = contínuo)" 
                    value={quantidadeRec} 
                    onChange={e => setQuantidadeRec(e.target.value)} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data de Início da Cobrança</Label>
                  <Input type="date" value={dataInicioRec || dataVencimento} onChange={e => setDataInicioRec(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-1 sm:col-span-2">
                  <Label>Data Final (Opcional)</Label>
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

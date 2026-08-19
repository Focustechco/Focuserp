import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Plus, Trash2, FileText, Upload, RefreshCw, Calendar, DollarSign, CheckCircle2, PauseCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { useClientesQuery } from '../hooks/useClientesQuery';
import { Cliente } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { Contrato } from '@/features/contratos/types';
import { RecorrenciaFinanceira, FrequenciaRecorrencia, StatusRecorrencia } from '@/features/recorrencias/types';
import { calculateClienteFinanceiro, syncRecorrenciaTitulos } from '@/features/recorrencias/services/recorrenciaEngine';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';

export function NovoClienteSheet({ children, clienteToEdit }: { children: React.ReactNode, clienteToEdit?: Cliente }) {
  const [open, setOpen] = useState(false);
  
  // Dados Gerais
  const [tipoPessoa, setTipoPessoa] = useState(clienteToEdit?.tipo === 'Pessoa Física' ? 'pf' : 'pj');
  const [documento, setDocumento] = useState(clienteToEdit?.documento || '');
  const [razaoSocial, setRazaoSocial] = useState(clienteToEdit?.razaoSocial || '');
  const [nomeFantasia, setNomeFantasia] = useState(clienteToEdit?.nomeFantasia || '');
  const [ie, setIe] = useState(clienteToEdit?.inscricaoEstadual || '');
  const [segmento, setSegmento] = useState(clienteToEdit?.segmento || '');
  const [porte, setPorte] = useState(clienteToEdit?.porteEmpresa || '');
  const [cidade, setCidade] = useState(clienteToEdit?.endereco?.cidade || '');
  const [estado, setEstado] = useState(clienteToEdit?.endereco?.estado || '');
  
  // Contatos
  const contatoPrincipal = clienteToEdit?.contatos?.find(c => c.principal) || clienteToEdit?.contatos?.[0];
  const [contatoNome, setContatoNome] = useState(contatoPrincipal?.nome || '');
  const [contatoEmail, setContatoEmail] = useState(contatoPrincipal?.email || '');
  const [contatoCelular, setContatoCelular] = useState(contatoPrincipal?.celular || '');

  // Dados da Recorrência Financeira
  const [recorrenciaHabilitada, setRecorrenciaHabilitada] = useState(false);
  const [recorrenciaId, setRecorrenciaId] = useState('');
  const [recorrenciaDescricao, setRecorrenciaDescricao] = useState('');
  const [recorrenciaValor, setRecorrenciaValor] = useState('');
  const [recorrenciaFrequencia, setRecorrenciaFrequencia] = useState<FrequenciaRecorrencia>('Mensal');
  const [recorrenciaDataInicio, setRecorrenciaDataInicio] = useState('');
  const [recorrenciaProximaCobranca, setRecorrenciaProximaCobranca] = useState('');
  const [recorrenciaDiaVencimento, setRecorrenciaDiaVencimento] = useState('10');
  const [recorrenciaQuantidade, setRecorrenciaQuantidade] = useState('');
  const [recorrenciaStatus, setRecorrenciaStatus] = useState<StatusRecorrencia>('Ativa');
  const [recorrenciaObservacoes, setRecorrenciaObservacoes] = useState('');

  // Stores Financeiros e de Contratos Reais
  const { saveCliente } = useClientesQuery();
  const { notificar } = useNotificacoesStore();
  const { data: titulos = [], setAllItems: setAllTitulos } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: recorrencias = [], setAllItems: setAllRecorrencias } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { data: contratos = [] } = useLocalStorageState<Contrato>('focus_contratos');

  // Resumo financeiro calculado em tempo real para este cliente
  const resumoFinanceiro = calculateClienteFinanceiro(clienteToEdit?.id || '', titulos, recorrencias, contratos);

  // Reset/Preenchimento dos campos ao abrir ou mudar cliente
  useEffect(() => {
    if (open) {
      setTipoPessoa(clienteToEdit?.tipo === 'Pessoa Física' ? 'pf' : 'pj');
      setDocumento(clienteToEdit?.documento || '');
      setRazaoSocial(clienteToEdit?.razaoSocial || '');
      setNomeFantasia(clienteToEdit?.nomeFantasia || '');
      setIe(clienteToEdit?.inscricaoEstadual || '');
      setSegmento(clienteToEdit?.segmento || '');
      setPorte(clienteToEdit?.porteEmpresa || '');
      setCidade(clienteToEdit?.endereco?.cidade || '');
      setEstado(clienteToEdit?.endereco?.estado || '');
      
      const principal = clienteToEdit?.contatos?.find(c => c.principal) || clienteToEdit?.contatos?.[0];
      setContatoNome(principal?.nome || '');
      setContatoEmail(principal?.email || '');
      setContatoCelular(principal?.celular || '');

      // Carregar recorrência existente se houver
      if (clienteToEdit?.id) {
        const recExistente = recorrencias.find(r => r.clientId === clienteToEdit.id);
        if (recExistente) {
          setRecorrenciaHabilitada(true);
          setRecorrenciaId(recExistente.id);
          setRecorrenciaDescricao(recExistente.descricao || '');
          setRecorrenciaValor(String(recExistente.valor || ''));
          setRecorrenciaFrequencia(recExistente.frequencia || 'Mensal');
          setRecorrenciaDataInicio(recExistente.dataInicio || '');
          setRecorrenciaProximaCobranca(recExistente.proximaCobranca || '');
          setRecorrenciaDiaVencimento(String(recExistente.diaVencimento || '10'));
          setRecorrenciaQuantidade(recExistente.quantidade ? String(recExistente.quantidade) : '');
          setRecorrenciaStatus(recExistente.status || 'Ativa');
          setRecorrenciaObservacoes(recExistente.observacoes || '');
        } else {
          resetRecorrenciaFields(clienteToEdit?.nomeFantasia || clienteToEdit?.razaoSocial || '');
        }
      } else {
        resetRecorrenciaFields('');
      }
    }
  }, [open, clienteToEdit, recorrencias]);

  const resetRecorrenciaFields = (nome: string) => {
    const hoje = new Date().toISOString().split('T')[0];
    setRecorrenciaHabilitada(false);
    setRecorrenciaId('');
    setRecorrenciaDescricao(nome ? `Mensalidade - ${nome}` : '');
    setRecorrenciaValor('');
    setRecorrenciaFrequencia('Mensal');
    setRecorrenciaDataInicio(hoje);
    setRecorrenciaProximaCobranca(hoje);
    setRecorrenciaDiaVencimento('10');
    setRecorrenciaQuantidade('');
    setRecorrenciaStatus('Ativa');
    setRecorrenciaObservacoes('');
  };

  const handleSave = () => {
    if (!razaoSocial && !nomeFantasia) {
      toast.error("Por favor, preencha a Razão Social ou Nome do cliente.");
      return;
    }

    if (!documento || documento.trim() === '') {
      toast.error(tipoPessoa === 'pj' ? "O CNPJ é obrigatório!" : "O CPF é obrigatório!");
      return;
    }

    if (!cidade || !estado) {
      toast.error("A Cidade e o Estado são obrigatórios!");
      return;
    }

    if (!contatoNome || !contatoCelular || !contatoEmail) {
      toast.error("Nome, E-mail e Celular do contato principal são obrigatórios!");
      return;
    }

    // Validações da Recorrência se habilitada
    if (recorrenciaHabilitada) {
      if (!recorrenciaDescricao) {
        toast.error("Informe a descrição/referência da recorrência.");
        return;
      }
      const valorNum = parseFloat(recorrenciaValor);
      if (isNaN(valorNum) || valorNum <= 0) {
        toast.error("O valor da recorrência deve ser maior que zero.");
        return;
      }
      if (!recorrenciaDataInicio) {
        toast.error("Informe a data de início da recorrência.");
        return;
      }
      if (!recorrenciaProximaCobranca) {
        toast.error("Informe a data da próxima cobrança.");
        return;
      }
    }

    const clienteId = clienteToEdit?.id || crypto.randomUUID();
    const clienteNomeOficial = nomeFantasia || razaoSocial;

    const clienteData = {
      tipo: tipoPessoa === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física',
      razaoSocial: razaoSocial || nomeFantasia,
      nomeFantasia: clienteNomeOficial,
      documento: documento,
      inscricaoEstadual: ie || 'Isento',
      status: clienteToEdit?.status || 'Ativo',
      segmento: segmento || 'Geral',
      porteEmpresa: porte || 'Médio',
      ultimaAtualizacao: new Date().toISOString(),
      endereco: {
        cep: clienteToEdit?.endereco?.cep || '',
        logradouro: clienteToEdit?.endereco?.logradouro || '',
        numero: clienteToEdit?.endereco?.numero || '',
        bairro: clienteToEdit?.endereco?.bairro || '',
        cidade: cidade,
        estado: estado,
        pais: 'Brasil'
      },
      contatos: [
        {
          id: contatoPrincipal?.id || crypto.randomUUID(),
          nome: contatoNome,
          cargo: contatoPrincipal?.cargo || 'Responsável',
          departamento: contatoPrincipal?.departamento || 'Geral',
          celular: contatoCelular,
          whatsapp: true,
          email: contatoEmail,
          principal: true
        }
      ]
    };

    // 1. Salvar ou Atualizar Cliente
    if (clienteToEdit) {
      saveCliente({
        ...clienteToEdit,
        ...clienteData,
        id: clienteId,
      } as any);
    } else {
      const novoCliente: Cliente = {
        id: clienteId,
        codigo: `CLI-${Math.floor(100 + Math.random() * 900)}`,
        dataCadastro: new Date().toISOString(),
        ...(clienteData as any)
      };
      saveCliente(novoCliente as any);
      
      notificar({
        titulo: `Novo Cliente Cadastrado (${novoCliente.nomeFantasia || novoCliente.razaoSocial})`,
        descricao: `Cliente ${novoCliente.tipo} registrado na base com documento ${novoCliente.documento}.`,
        origem: 'CRM',
        tipo: 'Sucesso',
        prioridade: 'Normal',
        targetUrl: '/clientes'
      });
    }

    // 2. Salvar/Atualizar Recorrência e Sincronizar Títulos Financeiros
    if (recorrenciaHabilitada) {
      const recId = recorrenciaId || `rec_${crypto.randomUUID()}`;
      const recExistente = recorrencias.find(r => r.id === recId || r.clientId === clienteId);
      
      const novaRecorrencia: RecorrenciaFinanceira = {
        id: recExistente?.id || recId,
        clientId: clienteId,
        clienteNome: clienteNomeOficial,
        descricao: recorrenciaDescricao,
        valor: parseFloat(recorrenciaValor) || 0,
        frequencia: recorrenciaFrequencia,
        dataInicio: recorrenciaDataInicio,
        proximaCobranca: recorrenciaProximaCobranca,
        diaVencimento: parseInt(recorrenciaDiaVencimento, 10) || 10,
        quantidade: recorrenciaQuantidade ? parseInt(recorrenciaQuantidade, 10) : null,
        status: recorrenciaStatus,
        observacoes: recorrenciaObservacoes,
        origem: 'cliente',
        categoria: 'Mensalidade',
        formaPagamento: 'PIX',
        createdAt: recExistente?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Atualizar lista de recorrências sem duplicidade
      const indexRec = recorrencias.findIndex(r => r.id === novaRecorrencia.id || r.clientId === clienteId);
      let novasRecorrencias: RecorrenciaFinanceira[];
      if (indexRec >= 0) {
        novasRecorrencias = [...recorrencias];
        novasRecorrencias[indexRec] = novaRecorrencia;
      } else {
        novasRecorrencias = [novaRecorrencia, ...recorrencias];
      }
      setAllRecorrencias(novasRecorrencias);

      // Sincronizar títulos a receber vinculados a esta recorrência e ao clientId
      const novosTitulos = syncRecorrenciaTitulos(novaRecorrencia, titulos);
      setAllTitulos(novosTitulos);

      toast.success(clienteToEdit ? "Cliente e recorrência atualizados com sucesso!" : "Cliente e recorrência cadastrados com sucesso!");
    } else {
      toast.success(clienteToEdit ? "Alterações do cliente salvas!" : "Cliente cadastrado com sucesso!");
    }
    
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>{clienteToEdit ? 'Editar Cliente' : 'Cadastro de Cliente'}</SheetTitle>
          <SheetDescription>
            Este é o cadastro mestre. As informações salvas aqui refletirão em todo o sistema.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="geral" className="w-full">
          {/* Scrollable Tabs List */}
          <div className="overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <TabsList className="w-max inline-flex">
              <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
              <TabsTrigger value="contatos">Contatos</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="contratos">Contratos</TabsTrigger>
              <TabsTrigger value="documentos">Documentos</TabsTrigger>
              <TabsTrigger value="historico">Histórico</TabsTrigger>
            </TabsList>
          </div>
          
          {/* 1. DADOS GERAIS */}
          <TabsContent value="geral" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Tipo de Cliente</Label>
                <div className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tipo-pj" checked={tipoPessoa === 'pj'} onCheckedChange={() => setTipoPessoa('pj')} />
                    <label htmlFor="tipo-pj" className="text-sm font-medium">Pessoa Jurídica</label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tipo-pf" checked={tipoPessoa === 'pf'} onCheckedChange={() => setTipoPessoa('pf')} />
                    <label htmlFor="tipo-pf" className="text-sm font-medium">Pessoa Física</label>
                  </div>
                </div>
              </div>

              {tipoPessoa === 'pj' ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input id="cnpj" placeholder="00.000.000/0001-00" value={documento} onChange={e => setDocumento(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="razaoSocial">Razão Social *</Label>
                      <Input id="razaoSocial" placeholder="Empresa XYZ Ltda" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nomeFantasia">Nome Fantasia</Label>
                      <Input id="nomeFantasia" placeholder="XYZ" value={nomeFantasia} onChange={e => setNomeFantasia(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ie">Inscrição Estadual</Label>
                      <Input id="ie" placeholder="Isento" value={ie} onChange={e => setIe(e.target.value)} />
                    </div>
                  </div>
                </>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input id="cpf" placeholder="000.000.000-00" value={documento} onChange={e => setDocumento(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nomePf">Nome Completo *</Label>
                    <Input id="nomePf" placeholder="João da Silva" value={razaoSocial} onChange={e => setRazaoSocial(e.target.value)} />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="situacao">Situação</Label>
                  <Select defaultValue="ativo">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ativo">Ativo</SelectItem>
                      <SelectItem value="inativo">Inativo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="segmento">Segmento</Label>
                  <Input id="segmento" placeholder="Ex: Tecnologia" value={segmento} onChange={e => setSegmento(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="porte">Porte da Empresa</Label>
                  <Select value={porte} onValueChange={setPorte}>
                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="me">Micro (ME)</SelectItem>
                      <SelectItem value="epp">Pequena (EPP)</SelectItem>
                      <SelectItem value="med">Média</SelectItem>
                      <SelectItem value="grd">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea id="obs" placeholder="Anotações internas sobre o cliente..." />
              </div>
            </div>
          </TabsContent>

          {/* 2. CONTATOS */}
          <TabsContent value="contatos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium">Contatos Vinculados</h4>
              <Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-2" /> Adicionar Contato</Button>
            </div>
            <div className="border rounded-md p-4 space-y-4 relative">
              <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500 h-8 w-8"><Trash2 className="w-4 h-4" /></Button>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome do Contato *</Label>
                  <Input value={contatoNome} onChange={e => setContatoNome(e.target.value)} placeholder="João Silva" />
                </div>
                <div className="space-y-2">
                  <Label>Cargo / Departamento</Label>
                  <Input defaultValue={contatoPrincipal?.cargo || "Diretor Financeiro"} />
                </div>
                <div className="space-y-2">
                  <Label>E-mail *</Label>
                  <Input type="email" value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} placeholder="joao@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Celular / WhatsApp *</Label>
                  <Input value={contatoCelular} onChange={e => setContatoCelular(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="principal" defaultChecked />
                <label htmlFor="principal" className="text-sm font-medium">Este é o contato principal (Cobranças/Avisos)</label>
              </div>
            </div>
          </TabsContent>

          {/* 3. ENDEREÇO */}
          <TabsContent value="endereco" className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2 col-span-1">
                <Label htmlFor="cep">CEP</Label>
                <Input id="cep" placeholder="00000-000" defaultValue={clienteToEdit?.endereco?.cep} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="logradouro">Logradouro</Label>
                <Input id="logradouro" placeholder="Avenida Brasil" defaultValue={clienteToEdit?.endereco?.logradouro} />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="numero">Número</Label>
                <Input id="numero" placeholder="1000" defaultValue={clienteToEdit?.endereco?.numero} />
              </div>
              <div className="space-y-2 col-span-1 sm:col-span-2">
                <Label htmlFor="complemento">Complemento</Label>
                <Input id="complemento" placeholder="Sala 101" />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="bairro">Bairro</Label>
                <Input id="bairro" placeholder="Centro" defaultValue={clienteToEdit?.endereco?.bairro} />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input id="cidade" placeholder="São Paulo" value={cidade} onChange={e => setCidade(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-1">
                <Label htmlFor="estado">Estado *</Label>
                <Select value={estado} onValueChange={setEstado}>
                  <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SP">SP</SelectItem>
                    <SelectItem value="RJ">RJ</SelectItem>
                    <SelectItem value="MG">MG</SelectItem>
                    <SelectItem value="PR">PR</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="RS">RS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* 4. FINANCEIRO & RECORRÊNCIA INTEGRADA */}
          <TabsContent value="financeiro" className="space-y-6">
            {/* Seção 1: Indicadores Calculados */}
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <div>
                <h3 className="font-semibold text-sm">Consulta Financeira (Contas a Receber)</h3>
                <p className="text-xs text-muted-foreground">
                  Visão consolidada calculada a partir dos lançamentos e títulos vinculados a este cliente.
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-left">
                <div className="border rounded-md p-3 bg-background/50">
                  <div className="text-[11px] text-muted-foreground font-medium">Valor em Aberto</div>
                  <div className="font-bold text-base text-rose-600 dark:text-rose-400 mt-0.5">
                    R$ {resumoFinanceiro.valorEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-background/50">
                  <div className="text-[11px] text-muted-foreground font-medium">Total Recebido</div>
                  <div className="font-bold text-base text-emerald-600 dark:text-emerald-400 mt-0.5">
                    R$ {resumoFinanceiro.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-background/50">
                  <div className="text-[11px] text-muted-foreground font-medium">Mensalidade (Contrato/Recorrência)</div>
                  <div className="font-bold text-base text-foreground mt-0.5">
                    R$ {resumoFinanceiro.mensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="border rounded-md p-3 bg-background/50">
                  <div className="text-[11px] text-muted-foreground font-medium">Títulos Atrasados</div>
                  <div className={`font-bold text-base mt-0.5 ${resumoFinanceiro.titulosAtrasados > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                    {resumoFinanceiro.titulosAtrasados}
                  </div>
                </div>
              </div>
            </div>

            {/* Seção 2: Recorrência Financeira do Cliente */}
            <div className="rounded-lg border bg-card p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-orange-500" />
                    Recorrência Financeira
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configurar cobrança recorrente diretamente para este cliente.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Label htmlFor="toggle-recorrencia" className="text-xs font-semibold">
                    {recorrenciaHabilitada ? 'Ativado' : 'Desativado'}
                  </Label>
                  <Switch 
                    id="toggle-recorrencia" 
                    checked={recorrenciaHabilitada} 
                    onCheckedChange={setRecorrenciaHabilitada} 
                  />
                </div>
              </div>

              {recorrenciaHabilitada && (
                <div className="space-y-4 pt-2 border-t animate-in fade-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rec-descricao">Descrição / Referência *</Label>
                      <Input 
                        id="rec-descricao" 
                        placeholder="Ex: Mensalidade de Desenvolvimento" 
                        value={recorrenciaDescricao} 
                        onChange={e => setRecorrenciaDescricao(e.target.value)} 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rec-valor">Valor da Recorrência (R$) *</Label>
                      <Input 
                        id="rec-valor" 
                        type="number" 
                        placeholder="2500,00" 
                        value={recorrenciaValor} 
                        onChange={e => setRecorrenciaValor(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rec-freq">Frequência *</Label>
                      <Select 
                        value={recorrenciaFrequencia} 
                        onValueChange={(v: FrequenciaRecorrencia) => setRecorrenciaFrequencia(v)}
                      >
                        <SelectTrigger id="rec-freq">
                          <SelectValue />
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
                      <Label htmlFor="rec-inicio">Data de Início *</Label>
                      <Input 
                        id="rec-inicio" 
                        type="date" 
                        value={recorrenciaDataInicio} 
                        onChange={e => setRecorrenciaDataInicio(e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rec-prox">Próxima Cobrança *</Label>
                      <Input 
                        id="rec-prox" 
                        type="date" 
                        value={recorrenciaProximaCobranca} 
                        onChange={e => setRecorrenciaProximaCobranca(e.target.value)} 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rec-dia">Dia do Vencimento</Label>
                      <Input 
                        id="rec-dia" 
                        type="number" 
                        min="1" 
                        max="31" 
                        placeholder="Ex: 10" 
                        value={recorrenciaDiaVencimento} 
                        onChange={e => setRecorrenciaDiaVencimento(e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rec-qtd">Quantidade (Vazia = Indefinida)</Label>
                      <Input 
                        id="rec-qtd" 
                        type="number" 
                        placeholder="Indefinida" 
                        value={recorrenciaQuantidade} 
                        onChange={e => setRecorrenciaQuantidade(e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rec-status">Status da Recorrência *</Label>
                      <Select 
                        value={recorrenciaStatus} 
                        onValueChange={(v: StatusRecorrencia) => setRecorrenciaStatus(v)}
                      >
                        <SelectTrigger id="rec-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativa">
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Ativa
                            </span>
                          </SelectItem>
                          <SelectItem value="Pausada">
                            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                              <PauseCircle className="w-3.5 h-3.5" /> Pausada
                            </span>
                          </SelectItem>
                          <SelectItem value="Encerrada">
                            <span className="flex items-center gap-1.5 text-rose-600 font-medium">
                              <XCircle className="w-3.5 h-3.5" /> Encerrada
                            </span>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="rec-obs">Observações da Cobrança Recorrente</Label>
                    <Textarea 
                      id="rec-obs" 
                      placeholder="Instruções de cobrança, contratos associados ou notas financeiras..." 
                      value={recorrenciaObservacoes} 
                      onChange={e => setRecorrenciaObservacoes(e.target.value)} 
                    />
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 5. CONTRATOS */}
          <TabsContent value="contratos" className="space-y-4">
            <div className="rounded-md border border-dashed p-6 text-center">
              <h3 className="font-semibold mb-2">Contratos Vinculados</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Consumo automático do módulo de Contratos.
              </p>
              {contratos.filter(c => c.clienteId === clienteToEdit?.id).length > 0 ? (
                <div className="space-y-2 text-left">
                  {contratos.filter(c => c.clienteId === clienteToEdit?.id).map(c => (
                    <div key={c.id} className="border rounded-md p-3 flex justify-between items-center bg-card">
                      <div>
                        <div className="font-semibold text-sm">{c.nome} ({c.numeroContrato || c.codigo})</div>
                        <div className="text-xs text-muted-foreground">Mensalidade: R$ {(c.valorMensalidade || 0).toLocaleString('pt-BR')} • Status: {c.status}</div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">{c.tipoServico}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border rounded text-center p-6 text-muted-foreground text-sm">
                  Nenhum contrato ativo registrado para este cliente.
                </div>
              )}
            </div>
          </TabsContent>

          {/* 6. DOCUMENTOS */}
          <TabsContent value="documentos" className="space-y-4">
            <div className="border rounded p-6 flex flex-col items-center justify-center border-dashed">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <h4 className="font-medium">Anexar Documentos</h4>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Arraste Contratos Sociais, CNH, Procurações ou PDFs.
              </p>
              <Button variant="secondary" size="sm">Selecionar Arquivos</Button>
            </div>
            
            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between border p-3 rounded">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="font-medium text-sm">Contrato_Social_Atualizado.pdf</div>
                    <div className="text-xs text-muted-foreground">Adicionado em 10/10/2025</div>
                  </div>
                </div>
                <Button variant="ghost" size="icon"><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            </div>
          </TabsContent>

          {/* 7. HISTÓRICO */}
          <TabsContent value="historico" className="space-y-4">
            <div className="relative border-l border-muted ml-4 pl-6 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 border-4 border-background" />
                <div className="text-sm font-medium">Cobrança Automática Enviada</div>
                <div className="text-xs text-muted-foreground">Sistema • Hoje, 08:30</div>
                <div className="text-sm mt-1">E-mail de lembrete de vencimento enviado com sucesso.</div>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] bg-blue-500 rounded-full w-4 h-4 border-4 border-background" />
                <div className="text-sm font-medium">Contrato Assinado</div>
                <div className="text-xs text-muted-foreground">Ana Silva • 15/06/2025, 14:00</div>
              </div>
              <div className="relative">
                <div className="absolute -left-[31px] bg-gray-500 rounded-full w-4 h-4 border-4 border-background" />
                <div className="text-sm font-medium">Cadastro Realizado</div>
                <div className="text-xs text-muted-foreground">João Silva • 10/06/2025, 10:15</div>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>{clienteToEdit ? 'Salvar Alterações' : 'Salvar Cliente'}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

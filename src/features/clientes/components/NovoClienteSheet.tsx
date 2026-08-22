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
import { 
  Plus, Trash2, FileText, Upload, RefreshCw, Calendar, DollarSign, 
  CheckCircle2, PauseCircle, XCircle, FolderOpen, UploadCloud, Download, 
  ExternalLink, Eye, ShieldCheck, Briefcase 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { useClientesQuery } from '../hooks/useClientesQuery';
import { Cliente } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { Contrato } from '@/features/contratos/types';
import { RecorrenciaFinanceira, FrequenciaRecorrencia, StatusRecorrencia } from '@/features/recorrencias/types';
import { calculateClienteFinanceiro, syncRecorrenciaTitulos } from '@/features/recorrencias/services/recorrenciaEngine';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { dmsService } from '@/services/dmsService';
import { DocumentoDMS } from '@/features/documentos/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

interface DocumentoAnexoLocal {
  id: string;
  nome: string;
  tamanho: string;
  tamanhoBytes?: number;
  dataUpload: string;
  urlConteudo?: string;
  categoria?: string;
}

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

  // Documentos Anexados (Integrados ao DMS)
  const [documentosAnexados, setDocumentosAnexados] = useState<DocumentoAnexoLocal[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Modal Rápido de Novo Contrato Vinculado
  const [modalNovoContratoOpen, setModalNovoContratoOpen] = useState(false);
  const [contratoNome, setContratoNome] = useState('');
  const [contratoTipo, setContratoTipo] = useState('Desenvolvimento de Software');
  const [contratoValorTotal, setContratoValorTotal] = useState('');
  const [contratoMensalidade, setContratoMensalidade] = useState('');
  const [contratoDataInicio, setContratoDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [contratoDataFim, setContratoDataFim] = useState(new Date(Date.now() + 365*24*3600*1000).toISOString().split('T')[0]);

  // Stores Financeiros, Contratos e Clientes
  const { saveCliente } = useClientesQuery();
  const { notificar } = useNotificacoesStore();
  const { data: titulos = [], setAllItems: setAllTitulos } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: recorrencias = [], setAllItems: setAllRecorrencias } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { data: contratos = [], addItem: addContrato } = useLocalStorageState<Contrato>('focus_contratos');

  const clienteNomeOficial = nomeFantasia || razaoSocial || 'Cliente';
  const currentClienteId = clienteToEdit?.id || '';

  // Carregar dados e documentos existentes ao abrir
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

      // Carregar documentos do DMS vinculados a este cliente
      if (clienteToEdit?.id) {
        const todosDocs = dmsService.getDocumentos();
        const docsDesteCliente = todosDocs.filter(
          d => d.clienteId === clienteToEdit.id || 
               d.caminhoPasta.toLowerCase().includes((clienteToEdit.nomeFantasia || clienteToEdit.razaoSocial || '').toLowerCase()) ||
               d.tags?.includes(clienteToEdit.id)
        ).map(d => ({
          id: d.id,
          nome: d.nome,
          tamanho: d.tamanho,
          tamanhoBytes: d.tamanhoBytes,
          dataUpload: d.dataUpload,
          urlConteudo: d.urlConteudo,
          categoria: d.categoria
        }));

        setDocumentosAnexados(docsDesteCliente);
      } else {
        setDocumentosAnexados([]);
      }

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

  // Upload de Documentos com Salvamento Direto no DMS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);

    Array.from(files).forEach((file) => {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const reader = new FileReader();

      reader.onload = (evt) => {
        const dataUrl = evt.target?.result as string;
        const targetId = currentClienteId || `temp-cli-${Date.now()}`;
        const targetNome = clienteNomeOficial || 'Novo Cliente';

        // 1. Salvar no módulo Gestão de Documentos (DMS) na pasta do cliente
        const savedDoc = dmsService.uploadFileFromModule({
          nome: file.name,
          tamanho: `${sizeInMb} MB`,
          tamanhoBytes: file.size,
          moduloOrigem: 'Clientes',
          clienteId: targetId,
          clienteNome: targetNome,
          categoria: file.name.toLowerCase().includes('contrato') ? 'Contratos' : 'Documentos do Cliente',
          tags: ['Clientes', targetNome],
          urlConteudo: dataUrl,
        });

        // 2. Adicionar na listagem da aba
        const newLocalDoc: DocumentoAnexoLocal = {
          id: savedDoc.id,
          nome: file.name,
          tamanho: `${sizeInMb} MB`,
          tamanhoBytes: file.size,
          dataUpload: new Date().toISOString(),
          urlConteudo: dataUrl,
          categoria: savedDoc.categoria
        };

        setDocumentosAnexados(prev => [newLocalDoc, ...prev]);
        toast.success(`Documento "${file.name}" anexado e salvo na pasta /Clientes/${targetNome} do DMS!`);
        setIsUploadingDoc(false);
      };

      reader.readAsDataURL(file);
    });
  };

  const handleRemoveDoc = (docId: string) => {
    setDocumentosAnexados(prev => prev.filter(d => d.id !== docId));
    toast.info("Documento removido da lista do cliente.");
  };

  // Criação Rápida de Contrato Vinculado
  const handleCriarContratoRapido = () => {
    if (!contratoNome.trim()) {
      toast.error("Informe o título do contrato.");
      return;
    }

    const valTotal = parseFloat(contratoValorTotal) || 0;
    const valMensal = parseFloat(contratoMensalidade) || 0;
    const targetCliId = currentClienteId || `cli-${Date.now()}`;
    const targetCliNome = clienteNomeOficial || 'Cliente';

    const novoContrato: Contrato = {
      id: `cnt-${Date.now()}`,
      codigo: `CTR-${Math.floor(1000 + Math.random() * 9000)}`,
      numeroContrato: `CTR-2026/${Math.floor(100 + Math.random() * 900)}`,
      nome: contratoNome.trim(),
      categoria: 'Receita',
      tipoServico: contratoTipo as any,
      entidadeVinculo: 'Cliente',
      clienteId: targetCliId,
      responsavelInterno: 'Administrador Focus',
      departamento: 'Comercial',
      status: 'Vigente',
      descricao: `Contrato de prestação de serviços para ${targetCliNome}.`,
      dataInicial: contratoDataInicio,
      dataFinal: contratoDataFim,
      renovacaoAutomatica: true,
      valorTotal: valTotal || (valMensal * 12),
      valorImplantacao: 0,
      valorMensalidade: valMensal,
      multaPercentual: 2,
      jurosAoMes: 1,
      aditivos: [],
      assinaturas: [
        {
          id: `ass-${Date.now()}`,
          parte: 'Contratante',
          representante: contatoNome || targetCliNome,
          cargo: 'Representante Legal',
          documento: documento || '000.000.000-00',
          status: 'Assinado',
          dataAssinatura: new Date().toISOString()
        }
      ]
    };

    addContrato(novoContrato);

    // Salvar também uma cópia digitalizada no DMS na pasta do cliente
    dmsService.uploadFileFromModule({
      nome: `Contrato_${novoContrato.numeroContrato.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
      moduloOrigem: 'Clientes',
      clienteId: targetCliId,
      clienteNome: targetCliNome,
      categoria: 'Contratos',
      tags: ['Contratos', novoContrato.codigo, targetCliNome],
    });

    toast.success(`Contrato "${novoContrato.nome}" criado e vinculado ao cliente com sucesso!`);
    setModalNovoContratoOpen(false);
    setContratoNome('');
    setContratoValorTotal('');
    setContratoMensalidade('');
  };

  const handleSave = () => {
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
    const nomeFinal = nomeFantasia || razaoSocial;

    const clienteData = {
      tipo: tipoPessoa === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física',
      razaoSocial: razaoSocial || nomeFantasia,
      nomeFantasia: nomeFinal,
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

    // Auto-gerar/Garantir pasta no DMS
    dmsService.ensureClientFolder({
      id: clienteId,
      nomeFantasia: nomeFinal,
      razaoSocial: razaoSocial || nomeFinal,
    });

    // 2. Salvar/Atualizar Recorrência e Sincronizar Títulos Financeiros
    if (recorrenciaHabilitada) {
      const recId = recorrenciaId || `rec_${crypto.randomUUID()}`;
      const recExistente = recorrencias.find(r => r.id === recId || r.clientId === clienteId);
      
      const novaRecorrencia: RecorrenciaFinanceira = {
        id: recExistente?.id || recId,
        clientId: clienteId,
        clientName: nomeFinal,
        descricao: recorrenciaDescricao,
        valor: parseFloat(recorrenciaValor) || 0,
        frequencia: recorrenciaFrequencia,
        dataInicio: recorrenciaDataInicio,
        proximaCobranca: recorrenciaProximaCobranca,
        diaVencimento: parseInt(recorrenciaDiaVencimento) || 10,
        quantidade: recorrenciaQuantidade ? parseInt(recorrenciaQuantidade) : undefined,
        status: recorrenciaStatus,
        observacoes: recorrenciaObservacoes,
        criadoEm: recExistente?.criadoEm || new Date().toISOString(),
        atualizadoEm: new Date().toISOString()
      };

      const novasRecorrencias = recExistente 
        ? recorrencias.map(r => r.id === novaRecorrencia.id ? novaRecorrencia : r)
        : [...recorrencias, novaRecorrencia];
      
      setAllRecorrencias(novasRecorrencias);

      if (novaRecorrencia.status === 'Ativa') {
        const novosTitulos = syncRecorrenciaTitulos(novaRecorrencia, titulos);
        setAllTitulos(novosTitulos);
      }
    }

    toast.success(clienteToEdit ? "Cliente atualizado com sucesso!" : "Cliente cadastrado com sucesso!");
    setOpen(false);
  };

  // Contratos vinculados a este cliente
  const contratosDoCliente = contratos.filter(
    c => c.clienteId === currentClienteId || 
         (clienteToEdit && (c.nome.toLowerCase().includes(clienteNomeOficial.toLowerCase()) || c.clienteId === clienteToEdit.id))
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle>{clienteToEdit ? 'Editar Cliente' : 'Cadastro de Cliente'}</SheetTitle>
          <SheetDescription>
            {clienteToEdit 
              ? 'Atualize os dados mestres, recorrência, documentos anexados e contratos vinculados.' 
              : 'Este é o cadastro mestre. As informações salvas aqui refletirão em todo o sistema.'}
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="gerais" className="mt-4">
          <TabsList className="grid grid-cols-4 sm:grid-cols-7 mb-4 h-auto p-1 gap-1">
            <TabsTrigger value="gerais" className="text-xs">Dados Gerais</TabsTrigger>
            <TabsTrigger value="contatos" className="text-xs">Contatos</TabsTrigger>
            <TabsTrigger value="endereco" className="text-xs">Endereço</TabsTrigger>
            <TabsTrigger value="financeiro" className="text-xs">Financeiro</TabsTrigger>
            <TabsTrigger value="contratos" className="text-xs font-semibold text-primary">
              Contratos ({contratosDoCliente.length})
            </TabsTrigger>
            <TabsTrigger value="documentos" className="text-xs font-semibold text-orange-600">
              Documentos ({documentosAnexados.length})
            </TabsTrigger>
            <TabsTrigger value="historico" className="text-xs">Histórico</TabsTrigger>
          </TabsList>

          {/* 1. DADOS GERAIS */}
          <TabsContent value="gerais" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Pessoa</Label>
                <Select value={tipoPessoa} onValueChange={setTipoPessoa}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                    <SelectItem value="pf">Pessoa Física</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="doc">{tipoPessoa === 'pj' ? 'CNPJ *' : 'CPF *'}</Label>
                <Input 
                  id="doc" 
                  placeholder={tipoPessoa === 'pj' ? "00.000.000/0000-00" : "000.000.000-00"} 
                  value={documento}
                  onChange={e => setDocumento(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="razao">{tipoPessoa === 'pj' ? 'Razão Social *' : 'Nome Completo *'}</Label>
              <Input 
                id="razao" 
                placeholder="Ex: Focus Tecnologia Ltda" 
                value={razaoSocial}
                onChange={e => setRazaoSocial(e.target.value)}
              />
            </div>

            {tipoPessoa === 'pj' && (
              <div className="space-y-2">
                <Label htmlFor="fantasia">Nome Fantasia</Label>
                <Input 
                  id="fantasia" 
                  placeholder="Ex: Focus ERP" 
                  value={nomeFantasia}
                  onChange={e => setNomeFantasia(e.target.value)}
                />
              </div>
            )}

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ie">Inscrição Estadual</Label>
                <Input 
                  id="ie" 
                  placeholder="Isento" 
                  value={ie}
                  onChange={e => setIe(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="segmento">Segmento</Label>
                <Input 
                  id="segmento" 
                  placeholder="Ex: Tecnologia" 
                  value={segmento}
                  onChange={e => setSegmento(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="porte">Porte</Label>
                <Select value={porte} onValueChange={setPorte}>
                  <SelectTrigger id="porte"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MEI">MEI</SelectItem>
                    <SelectItem value="Micro">Microempresa</SelectItem>
                    <SelectItem value="Pequeno">Pequeno Porte</SelectItem>
                    <SelectItem value="Médio">Médio Porte</SelectItem>
                    <SelectItem value="Grande">Grande Porte</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          {/* 2. CONTATOS */}
          <TabsContent value="contatos" className="space-y-4">
            <div className="border p-4 rounded-md space-y-3 bg-muted/20">
              <h4 className="font-semibold text-sm">Contato Principal *</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="c-nome">Nome do Responsável *</Label>
                  <Input 
                    id="c-nome" 
                    placeholder="Nome completo" 
                    value={contatoNome}
                    onChange={e => setContatoNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-email">E-mail *</Label>
                  <Input 
                    id="c-email" 
                    type="email" 
                    placeholder="contato@empresa.com" 
                    value={contatoEmail}
                    onChange={e => setContatoEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="c-celular">Celular / WhatsApp *</Label>
                  <Input 
                    id="c-celular" 
                    placeholder="(11) 90000-0000" 
                    value={contatoCelular}
                    onChange={e => setContatoCelular(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 3. ENDEREÇO */}
          <TabsContent value="endereco" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cidade">Cidade *</Label>
                <Input 
                  id="cidade" 
                  placeholder="Ex: São Paulo" 
                  value={cidade}
                  onChange={e => setCidade(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="uf">Estado (UF) *</Label>
                <Input 
                  id="uf" 
                  placeholder="Ex: SP" 
                  maxLength={2}
                  value={estado}
                  onChange={e => setEstado(e.target.value.toUpperCase())}
                />
              </div>
            </div>
          </TabsContent>

          {/* 4. FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="border rounded-lg p-5 space-y-4 bg-muted/10">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 text-orange-600" />
                    Contrato Recorrente / Mensalidade
                  </h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Geração automática de títulos no Contas a Receber
                  </p>
                </div>
                <Switch 
                  checked={recorrenciaHabilitada}
                  onCheckedChange={setRecorrenciaHabilitada}
                />
              </div>

              {recorrenciaHabilitada && (
                <div className="space-y-4 pt-3 border-t">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rec-desc">Descrição do Serviço *</Label>
                      <Input 
                        id="rec-desc" 
                        placeholder="Ex: Mensalidade Software ERP" 
                        value={recorrenciaDescricao} 
                        onChange={e => setRecorrenciaDescricao(e.target.value)} 
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rec-val">Valor Recorrente (R$) *</Label>
                      <Input 
                        id="rec-val" 
                        type="number" 
                        step="0.01" 
                        placeholder="0,00" 
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
                          <SelectItem value="Trimestral">Trimestral</SelectItem>
                          <SelectItem value="Semestral">Semestral</SelectItem>
                          <SelectItem value="Anual">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rec-ini">Data de Início *</Label>
                      <Input 
                        id="rec-ini" 
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
                      <Label htmlFor="rec-status">Status *</Label>
                      <Select 
                        value={recorrenciaStatus} 
                        onValueChange={(v: StatusRecorrencia) => setRecorrenciaStatus(v)}
                      >
                        <SelectTrigger id="rec-status">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Ativa">Ativa</SelectItem>
                          <SelectItem value="Pausada">Pausada</SelectItem>
                          <SelectItem value="Encerrada">Encerrada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* 5. CONTRATOS (INTEGRADO AO MÓDULO CONTRATOS) */}
          <TabsContent value="contratos" className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-primary" />
                  Contratos Registrados
                </h4>
                <p className="text-xs text-muted-foreground">
                  Integrado em tempo real com o módulo Gestão de Contratos (CLM).
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="gap-1.5 text-xs text-primary border-primary/30 hover:bg-primary/5"
                onClick={() => {
                  setContratoNome(`Contrato Prestação de Serviços - ${clienteNomeOficial}`);
                  setModalNovoContratoOpen(true);
                }}
              >
                <Plus className="w-3.5 h-3.5" /> Vincular Novo Contrato
              </Button>
            </div>

            {contratosDoCliente.length === 0 ? (
              <div className="border border-dashed rounded-lg p-8 text-center space-y-3 bg-muted/5">
                <FileText className="w-8 h-8 mx-auto text-muted-foreground opacity-50" />
                <p className="text-sm font-medium">Nenhum contrato formal vinculado ainda.</p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  Você pode gerar um contrato formal com valores, vigência e assinaturas clicando no botão acima.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {contratosDoCliente.map(c => (
                  <div key={c.id} className="border rounded-lg p-3.5 flex items-center justify-between bg-card hover:border-primary/40 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground">{c.nome}</span>
                        <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">
                          {c.numeroContrato || c.codigo}
                        </Badge>
                        <Badge variant="secondary" className="text-[10px]">
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex items-center gap-3">
                        <span>Serviço: <strong>{c.tipoServico}</strong></span>
                        <span>• Mensal: <strong>R$ {(c.valorMensalidade || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                        <span>• Total: <strong>R$ {(c.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong></span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[11px] font-medium">
                      {c.dataInicial ? new Date(c.dataInicial).toLocaleDateString('pt-BR') : 'Sem data'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 6. DOCUMENTOS (INTEGRADO AO MÓDULO GESTÃO DE DOCUMENTOS - DMS) */}
          <TabsContent value="documentos" className="space-y-4">
            {/* Dropzone de Upload Real */}
            <div className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-6 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer relative group text-center">
              <input 
                type="file" 
                multiple
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                onChange={handleFileUpload}
                disabled={isUploadingDoc}
              />
              <div className="bg-primary/10 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                <UploadCloud className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold text-sm text-foreground">
                {isUploadingDoc ? 'Enviando e indexando documento no DMS...' : 'Anexar Documentos do Cliente'}
              </h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-md">
                Arraste Contratos Sociais, CNH, Procurações, Notas, Comprovantes ou PDFs.
              </p>
              <p className="text-[11px] text-primary/80 mt-1 font-medium">
                📁 Os arquivos são salvos automaticamente na pasta <strong>/Clientes/{clienteNomeOficial}</strong> do DMS.
              </p>
            </div>

            {/* Lista de Documentos Anexados */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Arquivos na Pasta deste Cliente ({documentosAnexados.length})
                </span>
              </div>

              {documentosAnexados.length === 0 ? (
                <div className="py-6 text-center text-muted-foreground text-xs">
                  Nenhum documento anexado ainda. Clique no campo acima para selecionar arquivos.
                </div>
              ) : (
                <div className="space-y-2">
                  {documentosAnexados.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/40 bg-card transition-all">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 truncate">
                          <p className="font-semibold text-xs truncate">{doc.nome}</p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                            <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">{doc.categoria || 'Documentos do Cliente'}</span>
                            <span>{doc.tamanho}</span>
                            <span>• {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {doc.urlConteudo && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            asChild
                            className="h-8 text-xs gap-1"
                          >
                            <a href={doc.urlConteudo} download={doc.nome}>
                              <Download className="w-3.5 h-3.5" /> Baixar
                            </a>
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => handleRemoveDoc(doc.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 7. HISTÓRICO */}
          <TabsContent value="historico" className="space-y-4">
            <div className="relative border-l border-muted ml-4 pl-6 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 border-4 border-background" />
                <div className="text-sm font-medium">Cadastro Atualizado</div>
                <div className="text-xs text-muted-foreground">Sistema • Hoje</div>
                <div className="text-xs mt-1 text-muted-foreground">Módulo de Clientes e CRM sincronizados.</div>
              </div>
              {clienteToEdit && (
                <div className="relative">
                  <div className="absolute -left-[31px] bg-blue-500 rounded-full w-4 h-4 border-4 border-background" />
                  <div className="text-sm font-medium">Cliente Criado na Base</div>
                  <div className="text-xs text-muted-foreground">Sistema • {new Date(clienteToEdit.dataCadastro).toLocaleDateString('pt-BR')}</div>
                </div>
              )}
            </div>
          </TabsContent>

        </Tabs>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white font-semibold">
            {clienteToEdit ? 'Salvar Alterações' : 'Salvar Cliente'}
          </Button>
        </SheetFooter>
      </SheetContent>

      {/* MODAL PARA CRIAR CONTRATO RAPIDO VINCULADO AO CLIENTE */}
      <Dialog open={modalNovoContratoOpen} onOpenChange={setModalNovoContratoOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Briefcase className="w-4 h-4 text-primary" /> Novo Contrato para {clienteNomeOficial}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Gera o contrato comercial e salva automaticamente no módulo de Contratos e no DMS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Título / Objeto do Contrato *</Label>
              <Input 
                value={contratoNome} 
                onChange={e => setContratoNome(e.target.value)} 
                placeholder="Ex: Contrato de Prestação de Serviços de TI"
                className="text-xs h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Serviço</Label>
              <Select value={contratoTipo} onValueChange={setContratoTipo}>
                <SelectTrigger className="text-xs h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Desenvolvimento de Software">Desenvolvimento de Software</SelectItem>
                  <SelectItem value="Sistema Web">Sistema Web</SelectItem>
                  <SelectItem value="Licenciamento">Licenciamento de Software</SelectItem>
                  <SelectItem value="Suporte Técnico">Suporte Técnico & Manutenção</SelectItem>
                  <SelectItem value="Consultoria">Consultoria</SelectItem>
                  <SelectItem value="Prestação de Serviço">Prestação de Serviço Geral</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Mensalidade (R$)</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 2500.00" 
                  value={contratoMensalidade}
                  onChange={e => setContratoMensalidade(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Valor Total (R$)</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 30000.00" 
                  value={contratoValorTotal}
                  onChange={e => setContratoValorTotal(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Data de Início</Label>
                <Input 
                  type="date" 
                  value={contratoDataInicio}
                  onChange={e => setContratoDataInicio(e.target.value)}
                  className="text-xs h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Data de Término</Label>
                <Input 
                  type="date" 
                  value={contratoDataFim}
                  onChange={e => setContratoDataFim(e.target.value)}
                  className="text-xs h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setModalNovoContratoOpen(false)} className="text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCriarContratoRapido} className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
              Gerar & Vincular Contrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Sheet>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  Building2, User, MapPin, Phone, CreditCard, DollarSign, 
  FolderOpen, History, Plus, Search, UploadCloud, FileText, 
  Download, Trash2, Globe, Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Fornecedor, StatusFornecedor, TipoFornecedor } from '../types';
import { dmsService, DocumentoDMS } from '@/services/dmsService';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { TituloPagar } from '@/features/contas-pagar/types';

interface DocumentoAnexoLocal {
  id: string;
  nome: string;
  tamanho: string;
  tamanhoBytes?: number;
  dataUpload: string;
  urlConteudo?: string;
  categoria?: string;
}

interface NovoFornecedorSheetProps {
  children?: React.ReactNode;
  fornecedorToEdit?: Fornecedor | null;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NovoFornecedorSheet({ 
  children, 
  fornecedorToEdit, 
  open: controlledOpen, 
  onOpenChange: setControlledOpen 
}: NovoFornecedorSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;
  const setIsOpen = isControlled ? setControlledOpen! : setInternalOpen;

  // 1. Dados Gerais
  const [tipoPessoa, setTipoPessoa] = useState<'pj' | 'pf'>('pj');
  const [documento, setDocumento] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [nomeFantasia, setNomeFantasia] = useState('');
  const [ie, setIe] = useState('');
  const [im, setIm] = useState('');
  const [categoria, setCategoria] = useState('Serviços');
  const [segmento, setSegmento] = useState('Tecnologia');
  const [porte, setPorte] = useState('Médio');
  const [statusFornecedor, setStatusFornecedor] = useState<StatusFornecedor>('Ativo');
  const [site, setSite] = useState('');
  const [observacoes, setObservacoes] = useState('');

  // 2. Endereço
  const [cep, setCep] = useState('');
  const [logradouro, setLogradouro] = useState('');
  const [numero, setNumero] = useState('');
  const [complemento, setComplemento] = useState('');
  const [bairro, setBairro] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('SP');
  const [pais, setPais] = useState('Brasil');
  const [isBuscandoCep, setIsBuscandoCep] = useState(false);
  const [isConsultandoCnpj, setIsConsultandoCnpj] = useState(false);

  // 3. Contato Principal
  const [contatoNome, setContatoNome] = useState('');
  const [contatoCargo, setContatoCargo] = useState('Representante Comercial');
  const [contatoDepartamento, setContatoDepartamento] = useState('Comercial');
  const [contatoEmail, setContatoEmail] = useState('');
  const [contatoCelular, setContatoCelular] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [contatoWhatsapp, setContatoWhatsapp] = useState(true);

  // 4. Dados Bancários & Pagamento
  const [bancoNome, setBancoNome] = useState('');
  const [tipoConta, setTipoConta] = useState<'Corrente' | 'Poupança' | 'Pagamento'>('Corrente');
  const [agencia, setAgencia] = useState('');
  const [conta, setConta] = useState('');
  const [tipoChavePix, setTipoChavePix] = useState<'CNPJ' | 'CPF' | 'E-mail' | 'Telefone' | 'Chave Aleatória'>('CNPJ');
  const [chavePix, setChavePix] = useState('');
  const [favorecido, setFavorecido] = useState('');
  const [documentoFavorecido, setDocumentoFavorecido] = useState('');
  const [condicaoPagamento, setCondicaoPagamento] = useState('30 dias');
  const [formaPagamentoPadrao, setFormaPagamentoPadrao] = useState('PIX');

  // 5. Documentos Anexados
  const [documentosAnexados, setDocumentosAnexados] = useState<DocumentoAnexoLocal[]>([]);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stores
  const { data: fornecedores = [], saveItem: saveFornecedor } = useLocalStorageState<Fornecedor>('focus_fornecedores');
  const { data: contasPagar = [] } = useLocalStorageState<TituloPagar>('focus_contas_pagar');
  const { notificar } = useNotificacoesStore();

  const fornecedorNomeOficial = nomeFantasia || razaoSocial || 'Fornecedor';
  const isEditing = Boolean(fornecedorToEdit?.id);

  // Carregar dados existentes
  useEffect(() => {
    if (isOpen) {
      if (fornecedorToEdit) {
        setTipoPessoa(fornecedorToEdit.tipo === 'Pessoa Física' ? 'pf' : 'pj');
        setDocumento(fornecedorToEdit.documento || '');
        setRazaoSocial(fornecedorToEdit.razaoSocial || '');
        setNomeFantasia(fornecedorToEdit.nomeFantasia || '');
        setIe(fornecedorToEdit.inscricaoEstadual || '');
        setIm(fornecedorToEdit.inscricaoMunicipal || '');
        setCategoria(fornecedorToEdit.categoria || 'Serviços');
        setSegmento(fornecedorToEdit.segmento || 'Tecnologia');
        setPorte(fornecedorToEdit.porte || 'Médio');
        setStatusFornecedor(fornecedorToEdit.status || 'Ativo');
        setSite(fornecedorToEdit.site || '');
        setObservacoes(fornecedorToEdit.observacoes || '');

        // Endereço
        setCep(fornecedorToEdit.endereco?.cep || '');
        setLogradouro(fornecedorToEdit.endereco?.logradouro || '');
        setNumero(fornecedorToEdit.endereco?.numero || '');
        setComplemento(fornecedorToEdit.endereco?.complemento || '');
        setBairro(fornecedorToEdit.endereco?.bairro || '');
        setCidade(fornecedorToEdit.endereco?.cidade || '');
        setEstado(fornecedorToEdit.endereco?.estado || 'SP');
        setPais(fornecedorToEdit.endereco?.pais || 'Brasil');

        // Contatos
        const contatos = Array.isArray(fornecedorToEdit.contatos) ? fornecedorToEdit.contatos : [];
        const principal = contatos.find(c => c.principal) || contatos[0];
        setContatoNome(principal?.nome || '');
        setContatoCargo(principal?.cargo || 'Representante Comercial');
        setContatoDepartamento(principal?.departamento || 'Comercial');
        setContatoEmail(principal?.email || '');
        setContatoCelular(principal?.celular || '');
        setContatoTelefone(principal?.telefone || '');
        setContatoWhatsapp(principal?.whatsapp ?? true);

        // Dados Bancários
        const dadosBanc = Array.isArray(fornecedorToEdit.dadosBancarios) ? fornecedorToEdit.dadosBancarios[0] : null;
        setBancoNome(dadosBanc?.banco || '');
        setTipoConta(dadosBanc?.tipoConta || 'Corrente');
        setAgencia(dadosBanc?.agencia || '');
        setConta(dadosBanc?.conta || '');
        setTipoChavePix(dadosBanc?.tipoChavePix || 'CNPJ');
        setChavePix(dadosBanc?.chavePix || fornecedorToEdit.chavePix || '');
        setFavorecido(dadosBanc?.favorecido || fornecedorToEdit.razaoSocial || '');
        setDocumentoFavorecido(dadosBanc?.documentoFavorecido || fornecedorToEdit.documento || '');
        setCondicaoPagamento(fornecedorToEdit.condicaoPagamentoPadrao || '30 dias');
        setFormaPagamentoPadrao(fornecedorToEdit.formaPagamentoPadrao || 'PIX');

        // Documentos estritos por ID
        const docsFromFornec: DocumentoAnexoLocal[] = (fornecedorToEdit as any)?.documentos || [];
        const todosDocs = dmsService.getDocumentos() || [];
        const docsDMS: DocumentoAnexoLocal[] = todosDocs.filter(
          d => d && (d.fornecedorId === fornecedorToEdit.id || d.clienteId === fornecedorToEdit.id || (Array.isArray(d.tags) && d.tags.includes(fornecedorToEdit.id)))
        ).map(d => ({
          id: d.id,
          nome: d.nome,
          tamanho: d.tamanho,
          tamanhoBytes: d.tamanhoBytes,
          dataUpload: d.dataUpload,
          urlConteudo: d.urlConteudo,
          categoria: d.categoria
        }));

        const mapDocs = new Map<string, DocumentoAnexoLocal>();
        docsFromFornec.forEach(d => { if (d?.id) mapDocs.set(d.id, d); });
        docsDMS.forEach(d => { if (d?.id && !mapDocs.has(d.id)) mapDocs.set(d.id, d); });
        setDocumentosAnexados(Array.from(mapDocs.values()));
      } else {
        // Novo Fornecedor inicia limpo
        resetForm();
      }
    }
  }, [isOpen, fornecedorToEdit]);

  const resetForm = () => {
    setTipoPessoa('pj');
    setDocumento('');
    setRazaoSocial('');
    setNomeFantasia('');
    setIe('');
    setIm('');
    setCategoria('Serviços');
    setSegmento('Tecnologia');
    setPorte('Médio');
    setStatusFornecedor('Ativo');
    setSite('');
    setObservacoes('');
    setCep('');
    setLogradouro('');
    setNumero('');
    setComplemento('');
    setBairro('');
    setCidade('');
    setEstado('SP');
    setPais('Brasil');
    setContatoNome('');
    setContatoCargo('Representante Comercial');
    setContatoDepartamento('Comercial');
    setContatoEmail('');
    setContatoCelular('');
    setContatoTelefone('');
    setContatoWhatsapp(true);
    setBancoNome('');
    setTipoConta('Corrente');
    setAgencia('');
    setConta('');
    setTipoChavePix('CNPJ');
    setChavePix('');
    setFavorecido('');
    setDocumentoFavorecido('');
    setCondicaoPagamento('30 dias');
    setFormaPagamentoPadrao('PIX');
    setDocumentosAnexados([]);
  };

  // Consulta automática de CEP via ViaCEP
  const handleConsultarCep = async (cepValue: string) => {
    const limpo = cepValue.replace(/\D/g, '');
    if (limpo.length !== 8) return;
    setIsBuscandoCep(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${limpo}/json/`);
      const data = await res.json();
      if (data.erro) {
        toast.error("CEP não encontrado.");
      } else {
        setLogradouro(data.logradouro || '');
        setBairro(data.bairro || '');
        setCidade(data.localidade || '');
        setEstado(data.uf || 'SP');
        toast.success("Endereço preenchido automaticamente via CEP!");
      }
    } catch {
      toast.error("Erro ao consultar o CEP.");
    } finally {
      setIsBuscandoCep(false);
    }
  };

  // Consulta automática de CNPJ via BrasilAPI / ReceitaWS
  const handleConsultarCnpj = async () => {
    const limpo = documento.replace(/\D/g, '');
    if (limpo.length !== 14) {
      toast.error("Informe um CNPJ válido com 14 dígitos.");
      return;
    }
    setIsConsultandoCnpj(true);
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`);
      if (!res.ok) throw new Error("Erro na consulta");
      const data = await res.json();
      
      setRazaoSocial(data.razao_social || razaoSocial);
      setNomeFantasia(data.nome_fantasia || data.razao_social || nomeFantasia);
      if (data.cep) {
        setCep(data.cep);
        setLogradouro(data.logradouro || '');
        setNumero(data.numero || '');
        setComplemento(data.complemento || '');
        setBairro(data.bairro || '');
        setCidade(data.municipio || '');
        setEstado(data.uf || 'SP');
      }
      if (data.email) setContatoEmail(data.email);
      if (data.ddd_telefone_1) setContatoTelefone(data.ddd_telefone_1);
      toast.success("Dados cadastrais do fornecedor preenchidos via Receita Federal!");
    } catch {
      toast.error("Não foi possível consultar o CNPJ automaticamente.");
    } finally {
      setIsConsultandoCnpj(false);
    }
  };

  // Upload de Documentos no DMS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingDoc(true);
    const targetId = fornecedorToEdit?.id || `forn-${Date.now()}`;
    const targetNome = fornecedorNomeOficial || 'Fornecedor';

    Array.from(files).forEach(file => {
      const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
      const reader = new FileReader();

      reader.onload = evt => {
        const dataUrl = evt.target?.result as string;

        const savedDoc = dmsService.uploadFileFromModule({
          nome: file.name,
          tamanho: `${sizeInMb} MB`,
          tamanhoBytes: file.size,
          moduloOrigem: 'Fornecedores',
          clienteId: targetId,
          clienteNome: targetNome,
          categoria: file.name.toLowerCase().includes('cnd') ? 'Certidões Negativas' : file.name.toLowerCase().includes('contrato') ? 'Contratos' : 'Documentos de Fornecedor',
          tags: ['Fornecedores', targetNome, targetId],
          urlConteudo: dataUrl,
        });

        const newDoc: DocumentoAnexoLocal = {
          id: savedDoc.id,
          nome: file.name,
          tamanho: `${sizeInMb} MB`,
          tamanhoBytes: file.size,
          dataUpload: new Date().toISOString(),
          urlConteudo: dataUrl,
          categoria: savedDoc.categoria
        };

        setDocumentosAnexados(prev => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
        toast.success(`Documento "${file.name}" anexado e salvo com sucesso!`);
        setIsUploadingDoc(false);
      };

      reader.onerror = () => {
        toast.error(`Erro ao carregar o arquivo "${file.name}".`);
        setIsUploadingDoc(false);
      };

      reader.readAsDataURL(file);
    });

    if (e.target) e.target.value = '';
  };

  const handleRemoveDoc = (docId: string) => {
    setDocumentosAnexados(prev => prev.filter(d => d.id !== docId));
    toast.info("Documento removido da lista do fornecedor.");
  };

  // Salvar Fornecedor Completo
  const handleSave = () => {
    if (!razaoSocial.trim() && !nomeFantasia.trim()) {
      toast.error("Por favor, preencha o Nome Fantasia ou Razão Social.");
      return;
    }
    if (!documento.trim()) {
      toast.error("O CNPJ ou CPF é obrigatório!");
      return;
    }

    const targetId = fornecedorToEdit?.id || `forn-${Date.now()}`;
    const codigoOficial = fornecedorToEdit?.codigo || `F-${Math.floor(100 + Math.random() * 900)}`;

    const novoFornecedor: Fornecedor = {
      id: targetId,
      codigo: codigoOficial,
      tipo: tipoPessoa === 'pj' ? 'Pessoa Jurídica' : 'Pessoa Física',
      razaoSocial: razaoSocial.trim() || nomeFantasia.trim(),
      nomeFantasia: nomeFantasia.trim() || razaoSocial.trim(),
      documento: documento.trim(),
      inscricaoEstadual: ie.trim() || undefined,
      inscricaoMunicipal: im.trim() || undefined,
      categoria: categoria || 'Serviços',
      segmento: segmento || 'Tecnologia',
      porte: porte || 'Médio',
      status: statusFornecedor || 'Ativo',
      site: site.trim() || undefined,
      observacoes: observacoes.trim() || undefined,

      endereco: {
        cep: cep.trim() || '00000-000',
        logradouro: logradouro.trim() || 'Não informado',
        numero: numero.trim() || 'S/N',
        complemento: complemento.trim() || undefined,
        bairro: bairro.trim() || 'Centro',
        cidade: cidade.trim() || 'São Paulo',
        estado: estado.trim() || 'SP',
        pais: pais.trim() || 'Brasil'
      },

      contatos: [
        {
          id: `cont-${Date.now()}`,
          nome: contatoNome.trim() || 'Contato Comercial',
          cargo: contatoCargo.trim() || 'Representante',
          departamento: contatoDepartamento.trim() || 'Comercial',
          email: contatoEmail.trim() || '',
          celular: contatoCelular.trim() || '',
          telefone: contatoTelefone.trim() || '',
          whatsapp: contatoWhatsapp,
          principal: true
        }
      ],

      dadosBancarios: bancoNome ? [
        {
          id: `banc-${Date.now()}`,
          banco: bancoNome.trim(),
          tipoConta: tipoConta,
          agencia: agencia.trim(),
          conta: conta.trim(),
          tipoChavePix: tipoChavePix,
          chavePix: chavePix.trim(),
          favorecido: favorecido.trim() || razaoSocial.trim() || nomeFantasia.trim(),
          documentoFavorecido: documentoFavorecido.trim() || documento.trim(),
          principal: true
        }
      ] : (fornecedorToEdit?.dadosBancarios || []),

      condicaoPagamentoPadrao: condicaoPagamento,
      formaPagamentoPadrao: formaPagamentoPadrao,
      chavePix: chavePix.trim() || undefined,
      documentos: documentosAnexados,

      totalContratado: fornecedorToEdit?.totalContratado || 0,
      totalPago: fornecedorToEdit?.totalPago || 0,
      saldoAberto: fornecedorToEdit?.saldoAberto || 0,

      dataCadastro: fornecedorToEdit?.dataCadastro || new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString()
    };

    saveFornecedor(novoFornecedor);

    notificar({
      titulo: isEditing ? 'Fornecedor Atualizado' : 'Novo Fornecedor Cadastrado',
      descricao: `O fornecedor ${novoFornecedor.nomeFantasia} (${novoFornecedor.codigo}) foi ${isEditing ? 'atualizado' : 'cadastrado'} com sucesso.`,
      origem: 'Fornecedores',
      tipo: 'Sucesso',
      prioridade: 'Normal',
      targetUrl: '/fornecedores'
    });

    toast.success(isEditing ? 'Fornecedor atualizado com sucesso!' : 'Fornecedor cadastrado com sucesso!');
    setIsOpen(false);
  };

  // Títulos vinculados ao fornecedor no Contas a Pagar
  const titulosDoFornecedor = contasPagar.filter(
    t => t && (t.fornecedorId === fornecedorToEdit?.id || (t.fornecedor && t.fornecedor.toLowerCase() === fornecedorNomeOficial.toLowerCase()))
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      {children && <SheetTrigger asChild>{children}</SheetTrigger>}
      
      <SheetContent className="sm:max-w-3xl overflow-y-auto p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <SheetHeader className="border-b pb-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <SheetTitle className="text-xl font-bold flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-primary" />
                  {isEditing ? `Editar Fornecedor: ${fornecedorToEdit?.nomeFantasia || fornecedorToEdit?.razaoSocial}` : 'Novo Fornecedor'}
                </SheetTitle>
                <SheetDescription className="text-xs">
                  {isEditing ? `Código: ${fornecedorToEdit?.codigo || 'F-000'} • Atualize as informações cadastrais e financeiras.` : 'Preencha o cadastro mestre com dados bancários, fiscais e documentos.'}
                </SheetDescription>
              </div>
              <Badge variant={statusFornecedor === 'Ativo' ? 'default' : 'secondary'} className={statusFornecedor === 'Ativo' ? 'bg-emerald-600' : ''}>
                {statusFornecedor}
              </Badge>
            </div>
          </SheetHeader>

          <Tabs defaultValue="dados-gerais" className="w-full">
            <div className="overflow-x-auto scrollbar-hide border-b pb-1">
              <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
                <TabsTrigger value="dados-gerais" className="text-xs gap-1.5 shrink-0">
                  <Building2 className="w-3.5 h-3.5" /> Dados Gerais
                </TabsTrigger>
                <TabsTrigger value="endereco" className="text-xs gap-1.5 shrink-0">
                  <MapPin className="w-3.5 h-3.5" /> Endereço
                </TabsTrigger>
                <TabsTrigger value="contatos" className="text-xs gap-1.5 shrink-0">
                  <Phone className="w-3.5 h-3.5" /> Contatos
                </TabsTrigger>
                <TabsTrigger value="bancario" className="text-xs gap-1.5 shrink-0">
                  <CreditCard className="w-3.5 h-3.5" /> Dados Bancários & PIX
                </TabsTrigger>
                <TabsTrigger value="financeiro" className="text-xs gap-1.5 shrink-0">
                  <DollarSign className="w-3.5 h-3.5" /> Despesas ({titulosDoFornecedor.length})
                </TabsTrigger>
                <TabsTrigger value="documentos" className="text-xs gap-1.5 shrink-0">
                  <FolderOpen className="w-3.5 h-3.5" /> Documentos ({documentosAnexados.length})
                </TabsTrigger>
                <TabsTrigger value="historico" className="text-xs gap-1.5 shrink-0">
                  <History className="w-3.5 h-3.5" /> Auditoria
                </TabsTrigger>
              </TabsList>
            </div>

            {/* 1. DADOS GERAIS */}
            <TabsContent value="dados-gerais" className="space-y-4 pt-3">
              <div className="flex items-center gap-2 p-1 bg-muted/60 rounded-lg w-fit">
                <Button 
                  type="button"
                  size="sm"
                  variant={tipoPessoa === 'pj' ? 'default' : 'ghost'}
                  onClick={() => setTipoPessoa('pj')}
                  className="text-xs h-7 gap-1.5 font-medium"
                >
                  <Building2 className="w-3.5 h-3.5" /> Pessoa Jurídica (Empresa)
                </Button>
                <Button 
                  type="button"
                  size="sm"
                  variant={tipoPessoa === 'pf' ? 'default' : 'ghost'}
                  onClick={() => {
                    setTipoPessoa('pf');
                    if (tipoChavePix === 'CNPJ') setTipoChavePix('CPF');
                  }}
                  className="text-xs h-7 gap-1.5 font-medium"
                >
                  <User className="w-3.5 h-3.5" /> Pessoa Física (Prestador / CPF)
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">{tipoPessoa === 'pj' ? 'CNPJ *' : 'CPF *'}</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder={tipoPessoa === 'pj' ? '00.000.000/0001-00' : '000.000.000-00'} 
                      value={documento} 
                      onChange={e => setDocumento(e.target.value)}
                      className="text-xs font-mono"
                    />
                    {tipoPessoa === 'pj' && (
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        disabled={isConsultandoCnpj}
                        onClick={handleConsultarCnpj}
                        className="text-xs gap-1 shrink-0"
                      >
                        <Search className="w-3.5 h-3.5" />
                        {isConsultandoCnpj ? 'Buscando...' : 'Buscar CNPJ'}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold">Status do Fornecedor</Label>
                  <Select value={statusFornecedor} onValueChange={(v: StatusFornecedor) => setStatusFornecedor(v)}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Selecione o status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Ativo">Ativo / Homologado</SelectItem>
                      <SelectItem value="Homologado">Homologado</SelectItem>
                      <SelectItem value="Em Análise">Em Análise</SelectItem>
                      <SelectItem value="Inativo">Inativo</SelectItem>
                      <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {tipoPessoa === 'pf' ? (
                /* CAMPOS ESPECÍFICOS DE PESSOA FÍSICA / AUTÔNOMO */
                <div className="space-y-4 p-4 rounded-xl border bg-amber-500/5 dark:bg-amber-950/20 border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-300">
                    <User className="w-4 h-4" /> Dados do Prestador / Profissional Autônomo (Pessoa Física)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Nome Completo do Prestador *</Label>
                      <Input 
                        placeholder="Ex: Carlos Eduardo da Silva" 
                        value={razaoSocial} 
                        onChange={e => {
                          setRazaoSocial(e.target.value);
                          if (!nomeFantasia || nomeFantasia === razaoSocial) {
                            setNomeFantasia(e.target.value);
                          }
                        }}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Apelido / Nome Profissional (Opcional)</Label>
                      <Input 
                        placeholder="Ex: Cadu Tech / Carlos Consultoria" 
                        value={nomeFantasia} 
                        onChange={e => setNomeFantasia(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">RG / Documento de Identificação</Label>
                      <Input placeholder="Ex: 12.345.678-9 SSP/SP" value={ie} onChange={e => setIe(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Especialidade / Ramo Profissional</Label>
                      <Select value={categoria} onValueChange={setCategoria}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Desenvolvimento de Software">Desenvolvimento de Software</SelectItem>
                          <SelectItem value="Cloud">Cloud & Infraestrutura</SelectItem>
                          <SelectItem value="Equipamentos">Equipamentos & Manutenção</SelectItem>
                          <SelectItem value="Marketing">Design & Marketing</SelectItem>
                          <SelectItem value="Consultoria">Consultoria Técnica / Negócios</SelectItem>
                          <SelectItem value="Jurídico">Advocacia / Jurídico</SelectItem>
                          <SelectItem value="Contabilidade">Contabilidade & Finanças</SelectItem>
                          <SelectItem value="Serviços">Serviços Gerais</SelectItem>
                          <SelectItem value="Outros">Outros Serviços Autônomos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ) : (
                /* CAMPOS ESPECÍFICOS DE PESSOA JURÍDICA */
                <div className="space-y-4 p-4 rounded-xl border bg-blue-500/5 dark:bg-blue-950/20 border-blue-500/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <Building2 className="w-4 h-4" /> Dados Empresariais (Pessoa Jurídica)
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Nome Fantasia *</Label>
                      <Input 
                        placeholder="Ex: AWS Brasil, Google Cloud, TOTVS" 
                        value={nomeFantasia} 
                        onChange={e => setNomeFantasia(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Razão Social</Label>
                      <Input 
                        placeholder="Ex: Amazon Serviços de Varejo do Brasil Ltda" 
                        value={razaoSocial} 
                        onChange={e => setRazaoSocial(e.target.value)}
                        className="text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Inscrição Estadual (IE)</Label>
                      <Input placeholder="Isento ou Nº" value={ie} onChange={e => setIe(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Inscrição Municipal (IM)</Label>
                      <Input placeholder="Nº da inscrição" value={im} onChange={e => setIm(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Categoria / Especialidade</Label>
                      <Select value={categoria} onValueChange={setCategoria}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Categoria" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cloud">Cloud & Infraestrutura</SelectItem>
                          <SelectItem value="Desenvolvimento de Software">Desenvolvimento de Software</SelectItem>
                          <SelectItem value="Equipamentos">Equipamentos & Hardware</SelectItem>
                          <SelectItem value="Marketing">Marketing & Mídia</SelectItem>
                          <SelectItem value="Contabilidade">Contabilidade & Fiscal</SelectItem>
                          <SelectItem value="Jurídico">Jurídico</SelectItem>
                          <SelectItem value="Consultoria">Consultoria</SelectItem>
                          <SelectItem value="Recursos Humanos">Recursos Humanos & Treinamento</SelectItem>
                          <SelectItem value="Licenciamento">Licenciamento de Software</SelectItem>
                          <SelectItem value="Telefonia">Telefonia & Internet</SelectItem>
                          <SelectItem value="Serviços">Serviços Gerais</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Website / Portal do Fornecedor</Label>
                      <Input placeholder="https://fornecedor.com.br" value={site} onChange={e => setSite(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Porte da Empresa</Label>
                      <Select value={porte} onValueChange={setPorte}>
                        <SelectTrigger className="text-xs">
                          <SelectValue placeholder="Porte" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Microempresa (ME)">Microempresa (ME)</SelectItem>
                          <SelectItem value="Empresa de Pequeno Porte (EPP)">Empresa de Pequeno Porte (EPP)</SelectItem>
                          <SelectItem value="Médio">Médio Porte</SelectItem>
                          <SelectItem value="Grande">Grande Empresa / Multinacional</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Observações Internas</Label>
                <Textarea 
                  placeholder="Informações sobre prazos de entrega, SLAs contratados, canais de suporte ou acordos comerciais..." 
                  value={observacoes} 
                  onChange={e => setObservacoes(e.target.value)}
                  rows={3}
                  className="text-xs"
                />
              </div>
            </TabsContent>

            {/* 2. ENDEREÇO COMPLETO */}
            <TabsContent value="endereco" className="space-y-4 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">CEP</Label>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="00000-000" 
                      value={cep} 
                      onChange={e => {
                        setCep(e.target.value);
                        if (e.target.value.replace(/\D/g, '').length === 8) {
                          handleConsultarCep(e.target.value);
                        }
                      }}
                      className="text-xs"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      disabled={isBuscandoCep}
                      onClick={() => handleConsultarCep(cep)}
                      className="text-xs shrink-0"
                    >
                      {isBuscandoCep ? 'Buscando...' : 'Buscar CEP'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Logradouro / Rua</Label>
                  <Input placeholder="Ex: Av. Paulista" value={logradouro} onChange={e => setLogradouro(e.target.value)} className="text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Número</Label>
                  <Input placeholder="1000" value={numero} onChange={e => setNumero(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs">Complemento</Label>
                  <Input placeholder={tipoPessoa === 'pf' ? "Apto 42, Bloco B" : "Sala 1204, Bloco B"} value={complemento} onChange={e => setComplemento(e.target.value)} className="text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Bairro</Label>
                  <Input placeholder="Bela Vista" value={bairro} onChange={e => setBairro(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Cidade</Label>
                  <Input placeholder="São Paulo" value={cidade} onChange={e => setCidade(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Estado (UF)</Label>
                  <Input placeholder="SP" value={estado} onChange={e => setEstado(e.target.value)} className="text-xs uppercase" maxLength={2} />
                </div>
              </div>
            </TabsContent>

            {/* 3. CONTATOS */}
            <TabsContent value="contatos" className="space-y-4 pt-3">
              {tipoPessoa === 'pf' ? (
                /* CONTATO DIRETO PESSOA FÍSICA */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">Celular / WhatsApp *</Label>
                    <Input placeholder="(11) 99999-9999" value={contatoCelular} onChange={e => setContatoCelular(e.target.value)} className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">E-mail de Contato</Label>
                    <Input placeholder="prestador@email.com" value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Telefone Alternativo</Label>
                    <Input placeholder="(11) 3000-0000" value={contatoTelefone} onChange={e => setContatoTelefone(e.target.value)} className="text-xs" />
                  </div>
                </div>
              ) : (
                /* CONTATOS CORPORATIVOS PJ */
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Nome do Contato / Representante *</Label>
                      <Input placeholder="Ex: Carlos Silva" value={contatoNome} onChange={e => setContatoNome(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Cargo / Função</Label>
                      <Input placeholder="Ex: Gerente de Contas" value={contatoCargo} onChange={e => setContatoCargo(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Departamento</Label>
                      <Input placeholder="Ex: Comercial, Suporte, Financeiro" value={contatoDepartamento} onChange={e => setContatoDepartamento(e.target.value)} className="text-xs" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs">E-mail Corporativo</Label>
                      <Input placeholder="contato@fornecedor.com.br" value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-semibold">Celular / WhatsApp *</Label>
                      <Input placeholder="(11) 99999-9999" value={contatoCelular} onChange={e => setContatoCelular(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Telefone Comercial</Label>
                      <Input placeholder="(11) 3000-0000" value={contatoTelefone} onChange={e => setContatoTelefone(e.target.value)} className="text-xs" />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">E-mail Comercial</Label>
                  <Input placeholder="carlos@fornecedor.com" value={contatoEmail} onChange={e => setContatoEmail(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Celular</Label>
                  <Input placeholder="(11) 98765-4321" value={contatoCelular} onChange={e => setContatoCelular(e.target.value)} className="text-xs" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Telefone Fixo / 0800</Label>
                  <Input placeholder="(11) 3000-0000" value={contatoTelefone} onChange={e => setContatoTelefone(e.target.value)} className="text-xs" />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Switch checked={contatoWhatsapp} onCheckedChange={setContatoWhatsapp} id="forn-wpp" />
                <Label htmlFor="forn-wpp" className="text-xs cursor-pointer">
                  Este número possui WhatsApp ativo para comunicação rápida
                </Label>
              </div>
            </TabsContent>

            {/* 4. DADOS BANCÁRIOS & PAGAMENTO */}
            <TabsContent value="bancario" className="space-y-4 pt-3">
              <div className="p-3 bg-muted/40 rounded-lg border space-y-3">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" /> Conta Bancária Principal para Pagamentos
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Banco</Label>
                    <Input placeholder="Ex: Itaú, Bradesco, Nubank" value={bancoNome} onChange={e => setBancoNome(e.target.value)} className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Conta</Label>
                    <Select value={tipoConta} onValueChange={(v: any) => setTipoConta(v)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Tipo de conta" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Corrente">Conta Corrente</SelectItem>
                        <SelectItem value="Poupança">Conta Poupança</SelectItem>
                        <SelectItem value="Pagamento">Conta de Pagamento</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Agência</Label>
                      <Input placeholder="0001" value={agencia} onChange={e => setAgencia(e.target.value)} className="text-xs" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Conta</Label>
                      <Input placeholder="12345-6" value={conta} onChange={e => setConta(e.target.value)} className="text-xs" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Favorecido / Titular</Label>
                    <Input placeholder="Razão Social ou Nome do Titular" value={favorecido} onChange={e => setFavorecido(e.target.value)} className="text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">CPF / CNPJ do Favorecido</Label>
                    <Input placeholder="00.000.000/0001-00" value={documentoFavorecido} onChange={e => setDocumentoFavorecido(e.target.value)} className="text-xs" />
                  </div>
                </div>
              </div>

              {/* Chave PIX */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-lg border border-blue-200/60 dark:border-blue-800/40 space-y-3">
                <h4 className="text-xs font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-600" /> Chave PIX do Fornecedor
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tipo de Chave PIX</Label>
                    <Select value={tipoChavePix} onValueChange={(v: any) => setTipoChavePix(v)}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Tipo de chave" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CNPJ">CNPJ</SelectItem>
                        <SelectItem value="CPF">CPF</SelectItem>
                        <SelectItem value="E-mail">E-mail</SelectItem>
                        <SelectItem value="Telefone">Telefone</SelectItem>
                        <SelectItem value="Chave Aleatória">Chave Aleatória</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label className="text-xs">Chave PIX</Label>
                    <Input placeholder="Cole ou digite a chave PIX" value={chavePix} onChange={e => setChavePix(e.target.value)} className="text-xs font-mono" />
                  </div>
                </div>
              </div>

              {/* Condições Comerciais */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">Condição de Pagamento Padrão</Label>
                  <Select value={condicaoPagamento} onValueChange={setCondicaoPagamento}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Condição" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="À vista">À vista (PIX / Transferência)</SelectItem>
                      <SelectItem value="15 dias">Boleto 15 dias</SelectItem>
                      <SelectItem value="30 dias">Boleto 30 dias</SelectItem>
                      <SelectItem value="60 dias">Boleto 60 dias</SelectItem>
                      <SelectItem value="30/60/90 dias">Parcelado 30/60/90 dias</SelectItem>
                      <SelectItem value="Mensal Recorrente">Mensal Recorrente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Forma de Pagamento Preferencial</Label>
                  <Select value={formaPagamentoPadrao} onValueChange={setFormaPagamentoPadrao}>
                    <SelectTrigger className="text-xs">
                      <SelectValue placeholder="Forma de pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PIX">PIX</SelectItem>
                      <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                      <SelectItem value="TED/DOC">Transferência Bancária (TED/DOC)</SelectItem>
                      <SelectItem value="Cartão de Crédito">Cartão de Crédito Corporativo</SelectItem>
                      <SelectItem value="Débito Automático">Débito Automático</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* 5. FINANCEIRO / CONTAS A PAGAR */}
            <TabsContent value="financeiro" className="space-y-4 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground">Total Contratado / Comprado</span>
                  <div className="text-lg font-bold text-foreground">
                    R$ {(fornecedorToEdit?.totalContratado || titulosDoFornecedor.reduce((acc, t) => acc + (t.valorOriginal || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground">Total Pago / Liquidado</span>
                  <div className="text-lg font-bold text-emerald-600">
                    R$ {(fornecedorToEdit?.totalPago || titulosDoFornecedor.filter(t => t.status === 'Pago').reduce((acc, t) => acc + (t.valorOriginal || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="p-3 border rounded-lg bg-card space-y-1">
                  <span className="text-[11px] text-muted-foreground">Saldo Pendente a Pagar</span>
                  <div className="text-lg font-bold text-amber-600">
                    R$ {(fornecedorToEdit?.saldoAberto || titulosDoFornecedor.filter(t => t.status !== 'Pago').reduce((acc, t) => acc + (t.valorOriginal || 0), 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {titulosDoFornecedor.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-lg text-xs text-muted-foreground">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                  Nenhum título a pagar registrado para este fornecedor.
                </div>
              ) : (
                <div className="divide-y border rounded-lg bg-card max-h-60 overflow-y-auto">
                  {titulosDoFornecedor.map(titulo => (
                    <div key={titulo.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-foreground">{titulo.numero} • {titulo.descricao}</div>
                        <div className="text-[11px] text-muted-foreground">Vencimento: {titulo.dataVencimento}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">R$ {(titulo.valorOriginal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                        <Badge variant="outline" className={`text-[10px] ${titulo.status === 'Pago' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          {titulo.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 6. DOCUMENTOS & CERTIDÕES */}
            <TabsContent value="documentos" className="space-y-4 pt-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Documentos & Certidões</h4>
                  <p className="text-xs text-muted-foreground">Salvos automaticamente na pasta <code className="text-primary">/Fornecedores/{fornecedorNomeOficial}</code> do DMS</p>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    multiple
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <Button 
                    type="button" 
                    size="sm" 
                    disabled={isUploadingDoc}
                    onClick={() => fileInputRef.current?.click()}
                    className="gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white cursor-pointer"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> 
                    {isUploadingDoc ? 'Enviando...' : 'Anexar Documento'}
                  </Button>
                </div>
              </div>

              {documentosAnexados.length === 0 ? (
                <div className="p-8 text-center border border-dashed rounded-lg text-muted-foreground text-xs">
                  <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-500" />
                  Nenhum documento ou certidão anexada. Anexe contratos de fornecimento, CNDs, notas fiscais ou propostas.
                </div>
              ) : (
                <div className="space-y-2">
                  {documentosAnexados.map(d => (
                    <div key={d.id} className="p-3 border rounded-lg bg-card flex items-center justify-between text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText className="w-5 h-5 text-orange-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{d.nome}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {d.tamanho} • {new Date(d.dataUpload).toLocaleDateString('pt-BR')} • {d.categoria || 'Geral'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {d.urlConteudo && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" asChild>
                            <a href={d.urlConteudo} download={d.nome}>
                              <Download className="w-3.5 h-3.5" />
                            </a>
                          </Button>
                        )}
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500" onClick={() => handleRemoveDoc(d.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* 7. AUDITORIA & HISTÓRICO */}
            <TabsContent value="historico" className="space-y-4 pt-3 text-xs">
              <div className="border rounded-lg p-4 bg-muted/10 space-y-2">
                <h4 className="font-semibold text-sm">Trilha de Auditoria do Fornecedor</h4>
                <p className="text-muted-foreground">Registro automático de conformidade e homologação.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-muted-foreground">
                  <div>Data de Cadastro: <strong className="text-foreground">{fornecedorToEdit?.dataCadastro ? new Date(fornecedorToEdit.dataCadastro).toLocaleString('pt-BR') : 'Agora'}</strong></div>
                  <div>Última Atualização: <strong className="text-foreground">{fornecedorToEdit?.ultimaAtualizacao ? new Date(fornecedorToEdit.ultimaAtualizacao).toLocaleString('pt-BR') : 'Agora'}</strong></div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        <SheetFooter className="border-t pt-4 mt-6 flex flex-row items-center justify-between gap-3">
          <Button variant="outline" type="button" onClick={() => setIsOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleSave} className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-6">
            {isEditing ? 'Salvar Alterações' : 'Cadastrar Fornecedor'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

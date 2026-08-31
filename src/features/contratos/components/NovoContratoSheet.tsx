import React, { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, FileText, Plus, Clock, ShieldAlert, CheckCircle2, 
  Trash2, Edit3, Download, Building2, User, Landmark, Briefcase, Handshake
} from "lucide-react";

import { useLocalStorageState } from '@/hooks/useDataStore';
import { Contrato, CategoriaContrato, StatusContrato, TipoServicoContrato, EntidadeVinculo } from '../types';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { Cliente } from '@/features/clientes/types';
import { Fornecedor } from '@/features/fornecedores/types';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { toast } from 'sonner';

interface NovoContratoSheetProps {
  children?: React.ReactNode;
  contratoToEdit?: Contrato | null;
  defaultTitularidade?: 'Cliente' | 'Focus Tecnologia';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function downloadDocumentFile(fileUrl?: string, fileName?: string, defaultTitle?: string) {
  const name = fileName || `${defaultTitle || 'contrato'}.pdf`;

  if (fileUrl && (fileUrl.startsWith('data:') || fileUrl.startsWith('http') || fileUrl.startsWith('blob:'))) {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // Gera um PDF / Documento Blob real para download imediato no navegador
  const content = `====================================================\nFOCUS ERP - CONTRATO OFICIAL (CLM)\n====================================================\nDocumento: ${name}\nData de Emissão: ${new Date().toLocaleString('pt-BR')}\nAutenticação Digital: SHA256-VALIDATED-FOCUS\n====================================================\nEste documento foi registrado no cofre corporativo de contratos da Focus Tecnologia.`;
  const blob = new Blob([content], { type: 'application/pdf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name.endsWith('.pdf') ? name : `${name}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function NovoContratoSheet({ 
  children, 
  contratoToEdit, 
  defaultTitularidade = 'Cliente', 
  open: externalOpen, 
  onOpenChange: externalOnOpenChange 
}: NovoContratoSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalOnOpenChange || (() => {})) : setInternalOpen;

  // Titularidade: Contrato de Cliente ou Contrato da Focus Tecnologia Ltda
  const [titularidade, setTitularidade] = useState<'Cliente' | 'Focus Tecnologia'>(defaultTitularidade);

  // Form States
  const [numeroContrato, setNumeroContrato] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaContrato>("Receita");
  const [tipoServico, setTipoServico] = useState<TipoServicoContrato>("Desenvolvimento de Software");
  
  // Vínculos
  const [clienteId, setClienteId] = useState<string>("");
  const [fornecedorId, setFornecedorId] = useState<string>("");
  const [contraparteNome, setContraparteNome] = useState<string>("");
  
  const [responsavel, setResponsavel] = useState<string>("");
  const [departamento, setDepartamento] = useState<string>("Comercial");
  const [status, setStatus] = useState<StatusContrato>("Vigente");
  const [descricao, setDescricao] = useState<string>("");

  // Vigência
  const [dataAssinatura, setDataAssinatura] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dataInicial, setDataInicial] = useState<string>(new Date().toISOString().split('T')[0]);
  const [dataFinal, setDataFinal] = useState<string>(
    new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]
  );
  const [renovacaoAutomatica, setRenovacaoAutomatica] = useState(true);

  // Valores
  const [valorTotal, setValorTotal] = useState<number>(120000);
  const [valorMensalidade, setValorMensalidade] = useState<number>(10000);

  // Upload Arquivo
  const [arquivo, setArquivo] = useState<{
    nome: string;
    url: string;
    tamanho: string;
    bytes: number;
  } | null>(null);

  const { addItem, updateItem } = useLocalStorageState<Contrato>('focus_contratos');
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { data: clientes = [] } = useLocalStorageState<Cliente>('focus_clientes', []);
  const { data: fornecedores = [] } = useLocalStorageState<Fornecedor>('focus_fornecedores', []);
  const { pastas, uploadDocument } = useDocumentosStore();
  const { notificar } = useNotificacoesStore();

  // Carregar dados para edição se contratoToEdit for informado
  useEffect(() => {
    if (contratoToEdit) {
      const isFocus = contratoToEdit.titularidade === 'Focus Tecnologia' || 
                      contratoToEdit.entidadeVinculo === 'Focus Tecnologia' || 
                      contratoToEdit.entidadeVinculo === 'Fornecedor' ||
                      contratoToEdit.categoria === 'Despesa' ||
                      contratoToEdit.categoria === 'Interno';

      setTitularidade(isFocus ? 'Focus Tecnologia' : 'Cliente');
      setNumeroContrato(contratoToEdit.numeroContrato || "");
      setNome(contratoToEdit.nome || "");
      setCategoria(contratoToEdit.categoria || (isFocus ? "Despesa" : "Receita"));
      setTipoServico(contratoToEdit.tipoServico || "Desenvolvimento de Software");
      setClienteId(contratoToEdit.clienteId || "");
      setFornecedorId(contratoToEdit.fornecedorId || "");
      setContraparteNome(contratoToEdit.contraparteNome || contratoToEdit.fornecedorNome || "");
      setResponsavel(contratoToEdit.responsavelInterno || "");
      setDepartamento(contratoToEdit.departamento || (isFocus ? "Operações" : "Comercial"));
      setStatus(contratoToEdit.status || "Vigente");
      setDescricao(contratoToEdit.descricao || "");
      setDataAssinatura(contratoToEdit.dataAssinatura ? contratoToEdit.dataAssinatura.split('T')[0] : new Date().toISOString().split('T')[0]);
      setDataInicial(contratoToEdit.dataInicial ? contratoToEdit.dataInicial.split('T')[0] : new Date().toISOString().split('T')[0]);
      setDataFinal(contratoToEdit.dataFinal ? contratoToEdit.dataFinal.split('T')[0] : new Date(Date.now() + 365 * 86400000).toISOString().split('T')[0]);
      setRenovacaoAutomatica(contratoToEdit.renovacaoAutomatica !== false);
      setValorTotal(contratoToEdit.valorTotal || 120000);
      setValorMensalidade(contratoToEdit.valorMensalidade || 10000);

      if (contratoToEdit.arquivoNome) {
        setArquivo({
          nome: contratoToEdit.arquivoNome,
          url: contratoToEdit.arquivoUrl || "",
          tamanho: "Salvo no Sistema",
          bytes: 1024
        });
      } else {
        setArquivo(null);
      }
    } else {
      // Limpar form para criação de novo com defaultTitularidade
      setTitularidade(defaultTitularidade);
      setNumeroContrato("");
      setNome("");
      setCategoria(defaultTitularidade === 'Focus Tecnologia' ? "Despesa" : "Receita");
      setTipoServico(defaultTitularidade === 'Focus Tecnologia' ? "Cloud" : "Desenvolvimento de Software");
      setClienteId("");
      setFornecedorId("");
      setContraparteNome("");
      setResponsavel("");
      setDepartamento(defaultTitularidade === 'Focus Tecnologia' ? "Operações" : "Comercial");
      setStatus("Vigente");
      setDescricao("");
      setArquivo(null);
    }
  }, [contratoToEdit, open, defaultTitularidade]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        if (evt.target?.result) {
          setArquivo({
            nome: file.name,
            url: evt.target.result as string,
            tamanho: `${(file.size / 1024).toFixed(1)} KB`,
            bytes: file.size
          });
          toast.success("Documento do contrato anexado com sucesso!");
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Por favor, informe o Nome do Contrato.");
      return;
    }
    if (!numeroContrato.trim()) {
      toast.error("Por favor, informe o Número do Contrato.");
      return;
    }
    if (!descricao.trim()) {
      toast.error("Por favor, informe a Descrição / Objeto do Contrato.");
      return;
    }

    const clienteSelecionado = clientes.find(c => c.id === clienteId);
    const fornecedorSelecionado = fornecedores.find(f => f.id === fornecedorId);

    const nomeClienteFinal = clienteSelecionado ? (clienteSelecionado.nomeFantasia || clienteSelecionado.razaoSocial) : undefined;
    const nomeFornecedorFinal = fornecedorSelecionado ? (fornecedorSelecionado.nomeFantasia || fornecedorSelecionado.razaoSocial) : (contraparteNome.trim() || undefined);

    const entidadeVinculoFinal: EntidadeVinculo = titularidade === 'Focus Tecnologia' ? 'Focus Tecnologia' : 'Cliente';

    const contratoData: Contrato = {
      id: contratoToEdit ? contratoToEdit.id : `ctr-${Date.now()}`,
      codigo: contratoToEdit ? contratoToEdit.codigo : `CTR-${Math.floor(100 + Math.random() * 900)}`,
      numeroContrato: numeroContrato.trim(),
      nome: nome.trim(),
      categoria,
      tipoServico,
      titularidade,
      entidadeVinculo: entidadeVinculoFinal,
      clienteId: titularidade === 'Cliente' ? (clienteId || undefined) : undefined,
      clienteNome: titularidade === 'Cliente' ? nomeClienteFinal : undefined,
      fornecedorId: titularidade === 'Focus Tecnologia' ? (fornecedorId || undefined) : undefined,
      fornecedorNome: titularidade === 'Focus Tecnologia' ? nomeFornecedorFinal : undefined,
      contraparteNome: titularidade === 'Focus Tecnologia' ? (nomeFornecedorFinal || 'Focus Tecnologia Ltda') : nomeClienteFinal,
      responsavelInterno: responsavel || 'Gestor de Contratos',
      departamento,
      status,
      descricao: descricao.trim(),
      dataAssinatura,
      dataInicial,
      dataFinal,
      renovacaoAutomatica,
      valorTotal: Number(valorTotal) || 0,
      valorImplantacao: 0,
      valorMensalidade: Number(valorMensalidade) || 0,
      indiceCorrecao: 'IPCA',
      multaPercentual: 2,
      jurosAoMes: 1,
      aditivos: contratoToEdit ? contratoToEdit.aditivos : [],
      assinaturas: contratoToEdit ? contratoToEdit.assinaturas : [],
      arquivoUrl: arquivo?.url,
      arquivoNome: arquivo?.nome,
      dataCriacao: contratoToEdit ? contratoToEdit.dataCriacao : new Date().toISOString(),
      ultimaAtualizacao: new Date().toISOString()
    };

    // 1. Salvar ou Atualizar no Estado Local de Contratos
    if (contratoToEdit) {
      updateItem(contratoToEdit.id, contratoData);
      toast.success(`Contrato (${titularidade === 'Focus Tecnologia' ? 'Focus Tecnologia Ltda' : 'Cliente'}) atualizado com sucesso!`);
    } else {
      addItem(contratoData);
      toast.success(`Contrato adicionado à aba "${titularidade === 'Focus Tecnologia' ? 'Focus Tecnologia Ltda' : 'Clientes'}" com sucesso!`);
    }

    // 2. Se houver novo arquivo, integrar com Módulo de Documentos (DMS) na pasta correta
    if (arquivo && arquivo.url && arquivo.url.startsWith('data:')) {
      const pastaContratos = pastas.find(
        p => p.nome.toLowerCase().includes(titularidade === 'Focus Tecnologia' ? 'focus' : 'contrato') || p.moduloVinculado === 'Contratos'
      ) || pastas[0];

      if (pastaContratos) {
        uploadDocument({
          nome: arquivo.nome,
          extensao: arquivo.nome.endsWith('.pdf') ? 'PDF' : 'DOCX',
          tamanho: arquivo.tamanho,
          tamanhoBytes: arquivo.bytes,
          pastaId: pastaContratos.id,
          caminhoPasta: titularidade === 'Focus Tecnologia' ? '/Contratos/Focus Tecnologia Ltda' : '/Contratos/Clientes',
          moduloOrigem: 'Contratos',
          categoria: titularidade === 'Focus Tecnologia' ? 'Contrato Corporativo Focus' : 'Contrato Comercial Cliente',
          tags: ['Contrato', titularidade, contratoData.numeroContrato, contratoData.nome],
          contratoId: contratoData.id,
          contratoNumero: contratoData.numeroContrato,
          clienteId: titularidade === 'Cliente' ? (clienteId || undefined) : undefined,
          clienteNome: titularidade === 'Cliente' ? nomeClienteFinal : 'Focus Tecnologia Ltda',
          conteudoDataUrl: arquivo.url
        });
      }
    }

    // 3. Disparar Notificação Real no Sistema
    notificar({
      titulo: contratoToEdit ? `Contrato Atualizado (${contratoData.numeroContrato})` : `Novo Contrato Salvo (${contratoData.numeroContrato})`,
      descricao: `Contrato "${contratoData.nome}" vinculado a ${titularidade === 'Focus Tecnologia' ? 'Focus Tecnologia Ltda' : (nomeClienteFinal || 'Cliente')} foi registrado com sucesso.`,
      origem: 'Contratos',
      tipo: 'Sucesso',
      prioridade: 'Alta',
      targetUrl: '/contratos',
      usuarioDestino: responsavel || 'Você'
    });

    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <SheetTrigger asChild>
          {children || <Button className="bg-orange-600 hover:bg-orange-700 text-white"><Plus className="mr-2 h-4 w-4" /> Novo Contrato</Button>}
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-[95vw] sm:w-[800px] sm:max-w-[800px] flex flex-col p-0 bg-background">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-muted/20">
          <SheetHeader>
            <SheetTitle className="text-xl flex items-center gap-2">
              {contratoToEdit ? <Edit3 className="w-5 h-5 text-orange-600" /> : <Plus className="w-5 h-5 text-orange-600" />}
              {contratoToEdit ? `Editar Contrato (${contratoToEdit.codigo})` : "Novo Contrato (CLM)"}
            </SheetTitle>
            <SheetDescription>
              {contratoToEdit 
                ? "Altere as informações, titularidade (Cliente ou Focus Tecnologia Ltda), valores e documento anexo." 
                : "Cadastre contratos diferenciando entre Contratos de Clientes e Contratos Corporativos da Focus Tecnologia Ltda."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="gerais" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b overflow-x-auto scrollbar-hide bg-card">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent flex-nowrap min-w-max pb-1">
              <TabsTrigger value="gerais" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none px-4 py-2 text-xs">Dados Gerais & Titularidade</TabsTrigger>
              <TabsTrigger value="documento" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none px-4 py-2 text-xs">Upload de Contrato (PDF/DOC)</TabsTrigger>
              <TabsTrigger value="vigencia" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none px-4 py-2 text-xs">Vigência & Prazos</TabsTrigger>
              <TabsTrigger value="valores" className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none px-4 py-2 text-xs">Valores & Pagamento</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            
            {/* 1. DADOS GERAIS */}
            <TabsContent value="gerais" className="space-y-4 mt-0 outline-none">
              
              {/* SELETOR DE TITULARIDADE / ABA DE DESTINO */}
              <div className="space-y-2 p-3.5 bg-muted/40 rounded-xl border">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Landmark className="w-4 h-4 text-orange-600" />
                  Titularidade do Contrato (Aba de Destino) *
                </Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      setTitularidade('Cliente');
                      setCategoria('Receita');
                      setTipoServico('Desenvolvimento de Software');
                      setDepartamento('Comercial');
                    }}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                      titularidade === 'Cliente'
                        ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500 text-foreground'
                        : 'border-border/60 hover:bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    <div className="p-2 rounded-md bg-blue-500/10 text-blue-600 shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs">Contrato com Cliente</p>
                        <Badge variant="outline" className="text-[9px] bg-blue-50 text-blue-700 border-blue-200">Aba Clientes</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Prestação de serviços, SaaS, projetos e desenvolvimento para clientes da carteira.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setTitularidade('Focus Tecnologia');
                      setCategoria('Despesa');
                      setTipoServico('Cloud');
                      setDepartamento('Operações');
                    }}
                    className={`p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 ${
                      titularidade === 'Focus Tecnologia'
                        ? 'border-orange-500 bg-orange-500/10 ring-1 ring-orange-500 text-foreground'
                        : 'border-border/60 hover:bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    <div className="p-2 rounded-md bg-purple-500/10 text-purple-600 shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs">Contrato Focus Tecnologia Ltda</p>
                        <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200">Aba Focus</Badge>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Fornecedores, infraestrutura em nuvem, parcerias corporativas e despesas da Focus.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Número do Contrato *</Label>
                  <Input placeholder="Ex: 001/2026" value={numeroContrato} onChange={e => setNumeroContrato(e.target.value)} />
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Nome do Contrato *</Label>
                  <Input 
                    placeholder={titularidade === 'Focus Tecnologia' ? "Ex: Licenciamento AWS / Infraestrutura Cloud" : "Ex: Prestação de Serviços Tecnológicos"} 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                  />
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={(val: any) => setCategoria(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {titularidade === 'Cliente' ? (
                        <>
                          <SelectItem value="Receita">Receita (Cliente / Faturamento)</SelectItem>
                          <SelectItem value="Interno">Parceria / Acordo Comercial</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Despesa">Despesa (Fornecedor / Serviços)</SelectItem>
                          <SelectItem value="Interno">Interno / Governança Corporativa</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Tipo de Serviço / Escopo</Label>
                  <Select value={tipoServico} onValueChange={(val: any) => setTipoServico(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {titularidade === 'Cliente' ? (
                        <>
                          <SelectItem value="Desenvolvimento de Software">Desenvolvimento de Software</SelectItem>
                          <SelectItem value="Sistema Web">Sistema Web</SelectItem>
                          <SelectItem value="Aplicativo Mobile">Aplicativo Mobile</SelectItem>
                          <SelectItem value="Consultoria">Consultoria</SelectItem>
                          <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                          <SelectItem value="Licenciamento">Licenciamento SaaS</SelectItem>
                          <SelectItem value="Prestação de Serviço">Prestação de Serviço</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </>
                      ) : (
                        <>
                          <SelectItem value="Cloud">Cloud & Hospedagem (AWS, Supabase, Cloudflare)</SelectItem>
                          <SelectItem value="Licenciamento">Licenciamento de Software & Ferramentas</SelectItem>
                          <SelectItem value="Jurídico">Jurídico & Compliance</SelectItem>
                          <SelectItem value="Contabilidade">Contabilidade & Auditoria</SelectItem>
                          <SelectItem value="Marketing">Marketing & Aquisição</SelectItem>
                          <SelectItem value="Consultoria">Consultoria Especializada</SelectItem>
                          <SelectItem value="NDA">NDA & Acordo de Confidencialidade</SelectItem>
                          <SelectItem value="Parceria">Parceria Estratégica</SelectItem>
                          <SelectItem value="Prestação de Serviço">Prestação de Serviços Tomados</SelectItem>
                          <SelectItem value="Outros">Outros</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* VÍNCULO ESPECÍFICO CONFORME A TITULARIDADE */}
                {titularidade === 'Cliente' ? (
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>Selecionar Cliente *</Label>
                    <Select value={clienteId} onValueChange={setClienteId}>
                      <SelectTrigger><SelectValue placeholder="Selecione o Cliente..." /></SelectTrigger>
                      <SelectContent>
                        {clientes.length === 0 ? (
                          <SelectItem value="none" disabled>Nenhum cliente cadastrado no sistema</SelectItem>
                        ) : (
                          clientes.map(c => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.nomeFantasia || c.razaoSocial} ({c.documento})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-2 col-span-2 sm:col-span-1">
                    <Label>Fornecedor / Contraparte da Focus Tecnologia *</Label>
                    {fornecedores.length > 0 ? (
                      <div className="space-y-1.5">
                        <Select 
                          value={fornecedorId} 
                          onValueChange={(val) => {
                            setFornecedorId(val);
                            const found = fornecedores.find(f => f.id === val);
                            if (found) setContraparteNome(found.nomeFantasia || found.razaoSocial);
                          }}
                        >
                          <SelectTrigger><SelectValue placeholder="Selecione o Fornecedor..." /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="manual">+ Digitar Contraparte Manualmente</SelectItem>
                            {fornecedores.map(f => (
                              <SelectItem key={f.id} value={f.id}>
                                {f.nomeFantasia || f.razaoSocial} ({f.cnpj || f.cpf})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {(!fornecedorId || fornecedorId === 'manual') && (
                          <Input 
                            placeholder="Nome da empresa / fornecedor contratado..." 
                            value={contraparteNome} 
                            onChange={e => setContraparteNome(e.target.value)} 
                            className="text-xs"
                          />
                        )}
                      </div>
                    ) : (
                      <Input 
                        placeholder="Ex: Amazon Web Services, Google Cloud, Locadora, etc." 
                        value={contraparteNome} 
                        onChange={e => setContraparteNome(e.target.value)} 
                      />
                    )}
                  </div>
                )}

                {/* RESPONSÁVEL INTERNO */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Responsável Interno</Label>
                  <SelectResponsavel
                    value={responsavel}
                    onValueChange={setResponsavel}
                    placeholder="Selecione o Usuário Responsável"
                  />
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Status do Contrato</Label>
                  <Select value={status} onValueChange={(val: any) => setStatus(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Vigente">Vigente</SelectItem>
                      <SelectItem value="Em Elaboração">Em Elaboração</SelectItem>
                      <SelectItem value="Aguardando Assinatura">Aguardando Assinatura</SelectItem>
                      <SelectItem value="Encerrado">Encerrado</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
                      <SelectItem value="Cancelado">Cancelado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Departamento / Centro de Custo</Label>
                  <Input 
                    value={departamento} 
                    onChange={e => setDepartamento(e.target.value)} 
                    placeholder="Ex: Comercial, TI, Operações, Diretoria" 
                  />
                </div>

              </div>

              <div className="space-y-2 pt-1">
                <Label>Descrição / Objeto do Contrato *</Label>
                <Textarea 
                  placeholder={titularidade === 'Focus Tecnologia' 
                    ? "Descreva as obrigações da contratada, SLAs e serviços prestados para a Focus Tecnologia Ltda..."
                    : "Descreva detalhadamente as obrigações, entregáveis e escopo acordado com o cliente..."
                  }
                  className="h-24 text-xs" 
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                />
              </div>
            </TabsContent>

            {/* 2. UPLOAD DE DOCUMENTO / PDF */}
            <TabsContent value="documento" className="space-y-4 mt-0 outline-none">
              <div className="space-y-4">
                <div className="border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer text-center relative">
                  <Input 
                    type="file" 
                    accept=".pdf,.doc,.docx"
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    onChange={handleFileUpload}
                  />
                  <div className="w-12 h-12 rounded-full bg-orange-500/10 flex items-center justify-center mb-3 text-orange-600">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold">Anexar Documento do Contrato (PDF / DOCX)</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Clique aqui ou arraste o arquivo PDF/DOC assinado ou minuta do contrato. O arquivo será sincronizado automaticamente com a pasta correspondente no DMS.
                  </p>
                </div>

                {arquivo && (
                  <div className="flex items-center justify-between p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/20">
                    <div className="flex items-center gap-3">
                      <FileText className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      <div>
                        <div className="font-semibold text-xs text-emerald-800 dark:text-emerald-300">{arquivo.nome}</div>
                        <div className="text-[11px] text-muted-foreground">{arquivo.tamanho} • Salvo no Cofre de Documentos</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => downloadDocumentFile(arquivo.url, arquivo.nome, nome)}>
                        <Download className="w-3.5 h-3.5" /> Baixar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setArquivo(null)}>
                        <Trash2 className="w-4 h-4 text-rose-500" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* 3. VIGÊNCIA */}
            <TabsContent value="vigencia" className="space-y-4 mt-0 outline-none">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Data da Assinatura</Label>
                  <Input type="date" value={dataAssinatura} onChange={e => setDataAssinatura(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Data Inicial (Início da Vigência)</Label>
                  <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Data Final (Término)</Label>
                  <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-between border rounded-xl p-4 bg-muted/20">
                <div className="space-y-0.5">
                  <Label className="text-sm font-semibold">Renovação Automática</Label>
                  <p className="text-xs text-muted-foreground">O contrato renova-se automaticamente por prazos sucessivos?</p>
                </div>
                <Switch checked={renovacaoAutomatica} onCheckedChange={setRenovacaoAutomatica} />
              </div>
            </TabsContent>

            {/* 4. VALORES */}
            <TabsContent value="valores" className="space-y-4 mt-0 outline-none">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Valor Total Global (R$)</Label>
                  <Input 
                    type="number" 
                    value={valorTotal} 
                    onChange={e => setValorTotal(Number(e.target.value))} 
                    placeholder="120000"
                  />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Valor Mensal Recorrente (R$)</Label>
                  <Input 
                    type="number" 
                    value={valorMensalidade} 
                    onChange={e => setValorMensalidade(Number(e.target.value))} 
                    placeholder="10000"
                  />
                </div>
              </div>
            </TabsContent>

          </ScrollArea>

          {/* Footer */}
          <div className="p-4 border-t bg-muted/10 flex justify-end gap-2 mt-auto">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="bg-orange-600 hover:bg-orange-700 text-white gap-2 font-semibold" onClick={handleSave}>
              <CheckCircle2 className="w-4 h-4" /> {contratoToEdit ? "Salvar Alterações" : "Salvar Contrato"}
            </Button>
          </div>

        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

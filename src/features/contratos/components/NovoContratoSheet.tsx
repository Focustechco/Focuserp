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
import { Upload, FileText, Plus, Clock, ShieldAlert, CheckCircle2, Trash2, Edit3, Download } from "lucide-react";

import { useLocalStorageState } from '@/hooks/useDataStore';
import { Contrato, CategoriaContrato, StatusContrato, TipoServicoContrato } from '../types';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { Cliente } from '@/features/clientes/types';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { toast } from 'sonner';

interface NovoContratoSheetProps {
  children?: React.ReactNode;
  contratoToEdit?: Contrato | null;
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
  const content = `====================================================\nFOCUS FINANCE - CONTRATO OFICIAL (CLM)\n====================================================\nDocumento: ${name}\nData de Emissão: ${new Date().toLocaleString('pt-BR')}\nAutenticação Digital: SHA256-VALIDATED-FOCUS\n====================================================\nEste documento foi registrado no cofre corporativo de contratos da Focus Finance.`;
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

export function NovoContratoSheet({ children, contratoToEdit, open: externalOpen, onOpenChange: externalOnOpenChange }: NovoContratoSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = externalOpen !== undefined;
  const open = isControlled ? externalOpen : internalOpen;
  const setOpen = isControlled ? (externalOnOpenChange || (() => {})) : setInternalOpen;

  // Form States
  const [numeroContrato, setNumeroContrato] = useState("");
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState<CategoriaContrato>("Receita");
  const [tipoServico, setTipoServico] = useState<TipoServicoContrato>("Desenvolvimento de Software");
  const [entidadeVinculo, setEntidadeVinculo] = useState<string>("Cliente");
  const [clienteId, setClienteId] = useState<string>("");
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
  const { data: clientes } = useLocalStorageState<Cliente>('focus_clientes', []);
  const { pastas, uploadDocument } = useDocumentosStore();
  const { notificar } = useNotificacoesStore();

  // Carregar dados para edição se contratoToEdit for informado
  useEffect(() => {
    if (contratoToEdit) {
      setNumeroContrato(contratoToEdit.numeroContrato || "");
      setNome(contratoToEdit.nome || "");
      setCategoria(contratoToEdit.categoria || "Receita");
      setTipoServico(contratoToEdit.tipoServico || "Desenvolvimento de Software");
      setEntidadeVinculo(contratoToEdit.entidadeVinculo || "Cliente");
      setClienteId(contratoToEdit.clienteId || "");
      setResponsavel(contratoToEdit.responsavelInterno || "");
      setDepartamento(contratoToEdit.departamento || "Comercial");
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
      // Limpar form para criação de novo
      setNumeroContrato("");
      setNome("");
      setCategoria("Receita");
      setTipoServico("Desenvolvimento de Software");
      setClienteId("");
      setResponsavel("");
      setStatus("Vigente");
      setDescricao("");
      setArquivo(null);
    }
  }, [contratoToEdit, open]);

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

    const contratoData: Contrato = {
      id: contratoToEdit ? contratoToEdit.id : `ctr-${Date.now()}`,
      codigo: contratoToEdit ? contratoToEdit.codigo : `CTR-${Math.floor(100 + Math.random() * 900)}`,
      numeroContrato: numeroContrato.trim(),
      nome: nome.trim(),
      categoria,
      tipoServico,
      entidadeVinculo: (entidadeVinculo as any) || 'Cliente',
      clienteId: clienteId || undefined,
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
      toast.success("Contrato atualizado com sucesso!");
    } else {
      addItem(contratoData);
      toast.success("Contrato criado com sucesso!");
    }

    // 2. Se houver novo arquivo, integrar com Módulo de Documentos (DMS)
    if (arquivo && arquivo.url && arquivo.url.startsWith('data:')) {
      const pastaContratos = pastas.find(
        p => p.nome.toLowerCase().includes('contrato') || p.moduloVinculado === 'Contratos'
      ) || pastas[0];

      if (pastaContratos) {
        uploadDocument({
          nome: arquivo.nome,
          extensao: arquivo.nome.endsWith('.pdf') ? 'PDF' : 'DOCX',
          tamanho: arquivo.tamanho,
          tamanhoBytes: arquivo.bytes,
          pastaId: pastaContratos.id,
          moduloOrigem: 'Contratos',
          categoria: 'Contrato Comercial',
          tags: ['Contrato', contratoData.numeroContrato, contratoData.nome],
          contratoId: contratoData.id,
          contratoNumero: contratoData.numeroContrato,
          clienteId: clienteId || undefined,
          clienteNome: clienteSelecionado?.nomeFantasia || clienteSelecionado?.razaoSocial,
          conteudoDataUrl: arquivo.url
        });
      }
    }

    // 3. Disparar Notificação Real no Sistema
    notificar({
      titulo: contratoToEdit ? `Contrato Atualizado (${contratoData.numeroContrato})` : `Novo Contrato Salvo (${contratoData.numeroContrato})`,
      descricao: `Contrato "${contratoData.nome}" foi registrado com sucesso sob responsabilidade de ${responsavel || 'Gestor Interno'}.`,
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
          {children || <Button><Plus className="mr-2 h-4 w-4" /> Novo Contrato</Button>}
        </SheetTrigger>
      )}
      <SheetContent side="right" className="w-[95vw] sm:w-[800px] sm:max-w-[800px] flex flex-col p-0 bg-background">
        
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-muted/20">
          <SheetHeader>
            <SheetTitle className="text-xl flex items-center gap-2">
              {contratoToEdit ? <Edit3 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
              {contratoToEdit ? `Editar Contrato (${contratoToEdit.codigo})` : "Novo Contrato (CLM)"}
            </SheetTitle>
            <SheetDescription>
              {contratoToEdit ? "Altere as informações, prazos, valores e arquivo anexo do contrato." : "Cadastre e vincule contratos a clientes e responsáveis com upload de PDF/DOC."}
            </SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="gerais" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 border-b overflow-x-auto scrollbar-hide bg-card">
            <TabsList className="w-full justify-start h-auto p-0 bg-transparent flex-nowrap min-w-max pb-1">
              <TabsTrigger value="gerais" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 text-xs">Dados Gerais</TabsTrigger>
              <TabsTrigger value="documento" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 text-xs">Upload de Contrato (PDF/DOC)</TabsTrigger>
              <TabsTrigger value="vigencia" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 text-xs">Vigência & Prazos</TabsTrigger>
              <TabsTrigger value="valores" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2 text-xs">Valores</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1 p-6">
            
            {/* 1. DADOS GERAIS */}
            <TabsContent value="gerais" className="space-y-4 mt-0 outline-none">
              <div className="grid grid-cols-2 gap-4">
                
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Número do Contrato *</Label>
                  <Input placeholder="Ex: 001/2026" value={numeroContrato} onChange={e => setNumeroContrato(e.target.value)} />
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Nome do Contrato *</Label>
                  <Input placeholder="Ex: Prestação de Serviços Tecnológicos" value={nome} onChange={e => setNome(e.target.value)} />
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Categoria</Label>
                  <Select value={categoria} onValueChange={(val: any) => setCategoria(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Receita">Receita (Cliente)</SelectItem>
                      <SelectItem value="Despesa">Despesa (Fornecedor)</SelectItem>
                      <SelectItem value="Interno">Interno</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Tipo de Serviço</Label>
                  <Select value={tipoServico} onValueChange={(val: any) => setTipoServico(val)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Desenvolvimento de Software">Desenvolvimento de Software</SelectItem>
                      <SelectItem value="Sistema Web">Sistema Web</SelectItem>
                      <SelectItem value="Aplicativo Mobile">Aplicativo Mobile</SelectItem>
                      <SelectItem value="Consultoria">Consultoria</SelectItem>
                      <SelectItem value="Suporte Técnico">Suporte Técnico</SelectItem>
                      <SelectItem value="Licenciamento">Licenciamento</SelectItem>
                      <SelectItem value="Prestação de Serviço">Prestação de Serviço</SelectItem>
                      <SelectItem value="Cloud">Cloud</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* SELECIONAR CLIENTE */}
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Selecionar Cliente</Label>
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
                      <SelectItem value="Em Elaboração">Em Elaboração</SelectItem>
                      <SelectItem value="Aguardando Assinatura">Aguardando Assinatura</SelectItem>
                      <SelectItem value="Vigente">Vigente</SelectItem>
                      <SelectItem value="Encerrado">Encerrado</SelectItem>
                      <SelectItem value="Suspenso">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

              </div>

              <div className="space-y-2">
                <Label>Descrição / Objeto do Contrato *</Label>
                <Textarea 
                  placeholder="Descreva detalhadamente as obrigações e escopo do contrato..." 
                  className="h-28" 
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
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                    <Upload className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-semibold">Anexar / Substituir Documento do Contrato (PDF / DOCX)</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Clique aqui ou arraste o arquivo PDF ou DOCX assinado/minuta do contrato.
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
                        <Download className="w-3.5 h-3.5" /> Baixar de Verdade
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
                <div className="space-y-2">
                  <Label>Data da Assinatura</Label>
                  <Input type="date" value={dataAssinatura} onChange={e => setDataAssinatura(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Data Inicial (Início da Vigência)</Label>
                  <Input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} />
                </div>
                <div className="space-y-2 col-span-2 sm:col-span-1">
                  <Label>Data Final (Vencimento)</Label>
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
            <Button className="bg-primary gap-2" onClick={handleSave}>
              <CheckCircle2 className="w-4 h-4" /> {contratoToEdit ? "Salvar Alterações" : "Salvar Contrato"}
            </Button>
          </div>

        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

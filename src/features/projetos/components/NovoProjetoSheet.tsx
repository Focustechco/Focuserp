import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { 
  Briefcase, 
  Target, 
  DollarSign, 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  Calendar,
  Layers
} from 'lucide-react';
import { useProjetosQuery } from '../hooks/useProjetosQuery';
import { useClientesQuery } from '@/features/clientes/hooks/useClientesQuery';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';
import { FormatoArquivo } from '@/features/documentos/types';
import { toast } from 'sonner';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { useNotificacoesStore } from "@/features/notificacoes/useNotificacoesStore";
import { dmsService } from "@/services/dmsService";

interface NovoProjetoSheetProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function NovoProjetoSheet({ children, open: controlledOpen, onOpenChange: setControlledOpen }: NovoProjetoSheetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (setControlledOpen || (() => {})) : setInternalOpen;
  const [nome, setNome] = useState('');
  const [idCliente, setIdCliente] = useState('');
  const [tipo, setTipo] = useState('Software Sob Medida');
  const [responsavel, setResponsavel] = useState('');
  const [status, setStatus] = useState('Planejamento');
  const [prioridade, setPrioridade] = useState('Média');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFinal, setDataFinal] = useState('');
  const [valorContratado, setValorContratado] = useState('');
  const [horasPlanejadas, setHorasPlanejadas] = useState('120');
  const [descricao, setDescricao] = useState('');

  // Escopo
  const [objetivo, setObjetivo] = useState('');
  const [escopoIncluido, setEscopoIncluido] = useState('');
  const [escopoExcluido, setEscopoExcluido] = useState('');

  // Documentos anexados durante a criação
  const [documentosAnexados, setDocumentosAnexados] = useState<Array<{ nome: string; tamanho: string }>>([]);

  const { saveProjeto } = useProjetosQuery();
  const { clientes } = useClientesQuery();
  const { uploadDocument, pastas, createFolder } = useDocumentosStore();
  const { notificar } = useNotificacoesStore();

  // Handler de upload de arquivo com integração ao DMS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, categoria: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = (file.name.split('.').pop()?.toLowerCase() as FormatoArquivo) || 'pdf';

    let targetFolder = pastas.find(p => p.moduloVinculado === 'Projetos' || p.nome === 'Projetos');
    if (!targetFolder) {
      createFolder('Projetos', null, 'Projetos');
      targetFolder = pastas.find(p => p.nome === 'Projetos') || pastas[0];
    }

    const clienteObj = clientes.find(c => c.id === idCliente);

    uploadDocument({
      nome: file.name,
      extensao: ext,
      tamanho: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
      tamanhoBytes: file.size,
      pastaId: targetFolder ? targetFolder.id : 'p-root',
      moduloOrigem: 'Projetos',
      categoria,
      tags: ['Projeto', nome || 'Novo Projeto'],
      clienteId: idCliente || undefined,
      clienteNome: clienteObj?.nomeFantasia || clienteObj?.razaoSocial || undefined,
      projetoNome: nome || undefined
    });

    setDocumentosAnexados(prev => [...prev, { nome: file.name, tamanho: `${(file.size / 1024 / 1024).toFixed(2)} MB` }]);
    toast.success("Documento anexado com sucesso!", {
      description: `O arquivo "${file.name}" foi salvo automaticamente na pasta de Projetos no DMS.`
    });
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Erro de Validação", { description: "Por favor, preencha o Nome do Projeto." });
      return;
    }
    if (!idCliente) {
      toast.error("Erro de Validação", { description: "Selecione o Cliente vinculado ao projeto." });
      return;
    }
    if (!responsavel.trim()) {
      toast.error("Erro de Validação", { description: "O Responsável (PM) é obrigatório." });
      return;
    }

    const val = parseFloat(valorContratado.replace(/[^0-9,-]+/g, "").replace(",", ".")) || 0;

    const novoProjeto = {
      id: crypto.randomUUID(),
      codigo: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      nome,
      idCliente,
      tipo: tipo as any,
      categoria: 'Desenvolvimento Core',
      responsavelPrincipal: responsavel,
      prioridade: prioridade as any,
      status: status as any,
      dataInicio: dataInicio || new Date().toISOString().split('T')[0],
      dataFinal: dataFinal || new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      descricaoGeral: descricao || 'Projeto corporativo Focus ERP.',
      objetivo: objetivo || '',
      escopoIncluido: escopoIncluido || '',
      escopoExcluido: escopoExcluido || '',
      valorContratado: val,
      valorRecebido: 0,
      saldoRestante: val,
      progressoGlobal: 0,
      horasPlanejadas: parseInt(horasPlanejadas) || 120,
      horasRealizadas: 0,
      ultimaAtualizacao: new Date().toISOString()
    };

    saveProjeto(novoProjeto as any);
    
    // Auto-gerar pasta específica do projeto no módulo Gestão de Documentos (DMS)
    dmsService.ensureProjectFolder({
      id: novoProjeto.id,
      nome: novoProjeto.nome,
      codigo: novoProjeto.codigo,
    });
    
    // Notificação do Sistema
    notificar({
      titulo: `Você foi designado como responsável pelo projeto "${nome}"`,
      descricao: `Projeto ${novoProjeto.codigo} atribuído a ${responsavel} com orçamento de R$ ${val.toLocaleString('pt-BR')}.`,
      origem: 'Projetos',
      tipo: 'Informação',
      prioridade: (prioridade === 'Crítica' || prioridade === 'Alta') ? 'Alta' : 'Normal',
      targetUrl: `/projetos/${novoProjeto.id}`,
      usuarioDestino: responsavel
    });

    toast.success("Projeto cadastrado com sucesso!");
    setOpen(false);
    
    // Limpar campos
    setNome('');
    setIdCliente('');
    setTipo('Software Sob Medida');
    setResponsavel('');
    setPrioridade('Média');
    setDataInicio(new Date().toISOString().split('T')[0]);
    setDataFinal('');
    setValorContratado('');
    setHorasPlanejadas('120');
    setDescricao('');
    setObjetivo('');
    setEscopoIncluido('');
    setEscopoExcluido('');
    setDocumentosAnexados([]);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      {children && (
        <SheetTrigger asChild>
          {children}
        </SheetTrigger>
      )}
      <SheetContent className="sm:max-w-3xl overflow-y-auto bg-card border-l shadow-2xl">
        <SheetHeader className="mb-6 border-b pb-4">
          <SheetTitle className="text-xl font-bold flex items-center gap-2 text-foreground">
            <Briefcase className="w-5 h-5 text-orange-500" /> Cadastro de Novo Projeto
          </SheetTitle>
          <SheetDescription className="text-xs text-muted-foreground">
            Preencha os dados institucionais, escopo e orçamento inicial. Marcos, cronograma detalhado e equipe serão geridos no painel do projeto.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="geral" className="w-full space-y-4">
          <div className="border-b pb-2">
            <TabsList className="bg-muted/50 p-1 flex w-max gap-1">
              <TabsTrigger value="geral" className="gap-1.5 text-xs font-semibold">
                <Briefcase className="w-3.5 h-3.5" /> Dados Gerais
              </TabsTrigger>
              <TabsTrigger value="escopo" className="gap-1.5 text-xs font-semibold">
                <Target className="w-3.5 h-3.5" /> Escopo & Objetivos
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="gap-1.5 text-xs font-semibold">
                <DollarSign className="w-3.5 h-3.5" /> Orçamento & Horas
              </TabsTrigger>
              <TabsTrigger value="docs" className="gap-1.5 text-xs font-semibold">
                <UploadCloud className="w-3.5 h-3.5" /> Documentos Iniciais
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* 1. DADOS GERAIS */}
          <TabsContent value="geral" className="space-y-4 pt-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold">Nome do Projeto *</Label>
                <Input 
                  placeholder="Ex: ERP Integrado Focus Tech V2" 
                  value={nome} 
                  onChange={e => setNome(e.target.value)} 
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Cliente Vinculado *</Label>
                <Select value={idCliente} onValueChange={setIdCliente}>
                  <SelectTrigger className="rounded-xl h-9 text-xs">
                    <SelectValue placeholder="Selecione o Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clientes.length === 0 ? (
                      <SelectItem value="cli-none" disabled>Nenhum cliente cadastrado</SelectItem>
                    ) : (
                      clientes.map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nomeFantasia || c.razaoSocial}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold">Responsável (Project Manager) *</Label>
                <SelectResponsavel 
                  value={responsavel} 
                  onValueChange={setResponsavel} 
                  placeholder="Selecione o PM" 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Tipo de Solução</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Software Sob Medida">Software Sob Medida</SelectItem>
                    <SelectItem value="Sistema Web">Sistema Web</SelectItem>
                    <SelectItem value="Aplicativo Mobile">Aplicativo Mobile</SelectItem>
                    <SelectItem value="Automação">Automação & RPA</SelectItem>
                    <SelectItem value="Business Intelligence">Business Intelligence (BI)</SelectItem>
                    <SelectItem value="Inteligência Artificial">Inteligência Artificial (IA)</SelectItem>
                    <SelectItem value="API">API & Integração</SelectItem>
                    <SelectItem value="Consultoria">Consultoria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Prioridade</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crítica">Crítica (Urgente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold">Status Inicial</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejamento">Planejamento</SelectItem>
                    <SelectItem value="Kickoff">Kickoff</SelectItem>
                    <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                    <SelectItem value="Em Homologação">Em Homologação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Data de Início</Label>
                <Input 
                  type="date" 
                  value={dataInicio} 
                  onChange={e => setDataInicio(e.target.value)} 
                  className="rounded-xl h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Previsão de Conclusão</Label>
                <Input 
                  type="date" 
                  value={dataFinal} 
                  onChange={e => setDataFinal(e.target.value)} 
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Descrição Geral do Projeto</Label>
              <Textarea 
                placeholder="Breve resumo da finalidade do projeto e necessidades do cliente..." 
                value={descricao} 
                onChange={e => setDescricao(e.target.value)} 
                className="rounded-xl h-20 text-xs resize-none"
              />
            </div>
          </TabsContent>

          {/* 2. ESCOPO */}
          <TabsContent value="escopo" className="space-y-4 pt-1 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Objetivo Principal do Projeto</Label>
              <Input 
                placeholder="Ex: Otimizar o controle de estoque e integrar vendas com emissão fiscal..." 
                value={objetivo} 
                onChange={e => setObjetivo(e.target.value)} 
                className="rounded-xl h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Escopo Incluído (In Scope)</Label>
              <Textarea 
                className="rounded-xl h-24 text-xs resize-none" 
                placeholder="Liste as funcionalidades, módulos e entregas que fazem parte deste projeto..." 
                value={escopoIncluido} 
                onChange={e => setEscopoIncluido(e.target.value)} 
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-semibold">Escopo Excluído (Out of Scope)</Label>
              <Textarea 
                className="rounded-xl h-24 text-xs resize-none" 
                placeholder="Deixe claro o que NÃO faz parte da entrega deste projeto para alinhar expectativas..." 
                value={escopoExcluido} 
                onChange={e => setEscopoExcluido(e.target.value)} 
              />
            </div>
          </TabsContent>

          {/* 3. FINANCEIRO & ORÇAMENTO */}
          <TabsContent value="financeiro" className="space-y-4 pt-1 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="font-semibold">Valor Contratado (R$)</Label>
                <Input 
                  placeholder="Ex: 45.000,00" 
                  value={valorContratado} 
                  onChange={e => setValorContratado(e.target.value)} 
                  className="rounded-xl h-9 text-xs font-semibold"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Horas Planejadas Totais</Label>
                <Input 
                  type="number" 
                  placeholder="Ex: 120" 
                  value={horasPlanejadas} 
                  onChange={e => setHorasPlanejadas(e.target.value)} 
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl border bg-muted/20 mt-4">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Orçamento Total</span>
                <p className="text-base font-bold text-foreground">
                  {valorContratado ? `R$ ${valorContratado}` : 'R$ 0,00'}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Capacidade Estimada</span>
                <p className="text-base font-bold text-orange-600">
                  {horasPlanejadas || 0} horas
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground font-medium">Valor Médio / Hora</span>
                <p className="text-base font-bold text-emerald-600">
                  {horasPlanejadas && valorContratado ? (
                    `R$ ${(parseFloat(valorContratado.replace(/[^0-9,-]+/g, "").replace(",", ".")) / (parseInt(horasPlanejadas) || 1)).toFixed(2)}/h`
                  ) : 'R$ 0,00/h'}
                </p>
              </div>
            </div>
          </TabsContent>

          {/* 4. DOCUMENTOS INICIAIS */}
          <TabsContent value="docs" className="space-y-4 pt-1 text-xs">
            <label className="border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/20 transition-colors text-center">
              <UploadCloud className="w-8 h-8 text-orange-500 mb-2" />
              <h4 className="font-bold text-sm text-foreground">Anexar Documentos Iniciais (DMS Integrado)</h4>
              <p className="text-xs text-muted-foreground mb-3 max-w-md">
                Selecione Briefings, RFPs, Contratos ou Diagramas de Arquitetura. Serão salvos automaticamente na pasta de Projetos do DMS.
              </p>
              <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'Documentos Iniciais')} />
              <Button type="button" variant="secondary" size="sm" className="rounded-xl h-8 text-xs font-semibold">
                Selecionar Arquivo do Computador
              </Button>
            </label>

            {documentosAnexados.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-xs font-bold text-foreground">Arquivos Anexados nesta Sessão:</Label>
                {documentosAnexados.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between border p-3 rounded-xl bg-card shadow-2xs">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-orange-500" />
                      <div>
                        <div className="font-bold text-xs text-foreground">{doc.nome}</div>
                        <div className="text-[11px] text-muted-foreground">{doc.tamanho} • Salvo no DMS</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <SheetFooter className="mt-8 border-t pt-4 flex sm:flex-row justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} className="rounded-xl text-xs h-9">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave} 
            className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-9 shadow-xs cursor-pointer"
          >
            Salvar Projeto
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Trash2, Upload, FileText, Calendar as CalendarIcon, CheckCircle2, UserPlus, Clock } from 'lucide-react';
import { useProjetosQuery } from '../hooks/useProjetosQuery';
import { useClientesQuery } from '@/features/clientes/hooks/useClientesQuery';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';
import { FormatoArquivo } from '@/features/documentos/types';
import { toast } from 'sonner';
import { Projeto } from '../types';
import { Usuario } from '@/features/usuarios/types';
import { INITIAL_USUARIOS } from '@/features/usuarios/data/initialData';
import { SelectResponsavel } from '@/components/SelectResponsavel';

import { useNotificacoesStore } from "@/features/notificacoes/useNotificacoesStore";

export function NovoProjetoSheet({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [idCliente, setIdCliente] = useState('');
  const [tipo, setTipo] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [status, setStatus] = useState('Planejamento');
  const [prioridade, setPrioridade] = useState('');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [valorContratado, setValorContratado] = useState('');
  const [horasPlanejadas, setHorasPlanejadas] = useState('100');
  const [descricao, setDescricao] = useState('');

  // Escopo
  const [objetivo, setObjetivo] = useState('');
  const [escopoIncluido, setEscopoIncluido] = useState('');
  const [escopoExcluido, setEscopoExcluido] = useState('');

  // Documentos anexados durante a criao
  const [documentosAnexados, setDocumentosAnexados] = useState<Array<{ nome: string; tamanho: string }>>([]);

  const { saveProjeto } = useProjetosQuery();
  const { clientes } = useClientesQuery();
  const { data: usuarios } = useLocalStorageState<Usuario>('focus_usuarios', INITIAL_USUARIOS);
  const { uploadDocument, pastas, createFolder } = useDocumentosStore();
  const { notificar } = useNotificacoesStore();

  // Handler de upload de arquivo real com integrao ao DMS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, categoria: string) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const ext = file.name.split('.').pop()?.toLowerCase() as FormatoArquivo || 'pdf';

    // Garante que exista uma pasta de Projetos no DMS
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
      description: `O arquivo "${file.name}" foi salvo automaticamente no mdulo de Documentos (DMS).`
    });
  };

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("Erro de Validao", { description: "Por favor, preencha o Nome do Projeto." });
      return;
    }
    if (!idCliente) {
      toast.error("Erro de Validao", { description: "Selecione o Cliente do projeto." });
      return;
    }
    if (!responsavel.trim()) {
      toast.error("Erro de Validao", { description: "O Responsvel (PM)  obrigatrio." });
      return;
    }
    if (!tipo) {
      toast.error("Erro de Validao", { description: "Selecione o Tipo de Projeto." });
      return;
    }
    if (!prioridade) {
      toast.error("Erro de Validao", { description: "Selecione a Prioridade do projeto." });
      return;
    }
    if (!dataInicio) {
      toast.error("Erro de Validao", { description: "A Data de Incio  obrigatria." });
      return;
    }
    if (!dataFinal) {
      toast.error("Erro de Validao", { description: "A Data Final (Prevista)  obrigatria." });
      return;
    }
    if (!valorContratado || parseFloat(valorContratado) <= 0) {
      toast.error("Erro de Validao", { description: "O Valor Contratado  obrigatrio e deve ser maior que zero!" });
      return;
    }

    const val = parseFloat(valorContratado);
    if (isNaN(val)) {
      toast.error("Erro de Validao", { description: "O Valor Contratado deve ser um nmero vlido." });
      return;
    }

    const novoProjeto: Projeto = {
      id: `proj-${Date.now()}`,
      codigo: `PRJ-${Math.floor(100 + Math.random() * 900)}`,
      nome,
      idCliente,
      tipo: tipo as any,
      categoria: 'Desenvolvimento Core',
      responsavelPrincipal: responsavel,
      prioridade: (prioridade as any),
      status: (status as any),
      dataInicio,
      dataFinal,
      descricaoGeral: descricao || 'Projeto criado pelo formulrio.',
      valorContratado: val,
      valorRecebido: 0,
      saldoRestante: val,
      progressoGlobal: 0,
      horasPlanejadas: parseInt(horasPlanejadas) || 100,
      horasRealizadas: 0,
      ultimaAtualizacao: new Date().toISOString()
    };

    saveProjeto(novoProjeto as any);
    
    // Disparar Notificao Automtica no Sistema de Notificaes ERP com usuarioDestino
    notificar({
      titulo: `Voc foi designado como responsvel pelo projeto "${nome}"`,
      descricao: `Projeto ${novoProjeto.codigo} atribudo a ${responsavel || 'Usurio'} com oramento de R$ ${val.toLocaleString('pt-BR')} e prazo at ${dataFinal}.`,
      origem: 'Projetos',
      tipo: 'Informao',
      prioridade: (prioridade === 'Urgente' || prioridade === 'Alta') ? 'Alta' : 'Normal',
      targetUrl: '/projetos',
      usuarioDestino: responsavel || 'Voc'
    });

    toast.success("Projeto cadastrado com sucesso!");
    setOpen(false);
    
    // Limpar campos
    setNome('');
    setIdCliente('');
    setTipo('');
    setResponsavel('');
    setPrioridade('');
    setDataInicio('');
    setDataFinal('');
    setValorContratado('');
    setHorasPlanejadas('100');
    setDescricao('');
    setObjetivo('');
    setEscopoIncluido('');
    setEscopoExcluido('');
    setDocumentosAnexados([]);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {children}
      </SheetTrigger>
      <SheetContent className="sm:max-w-4xl overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Gesto do Projeto</SheetTitle>
          <SheetDescription>
            Configure escopo, horas, equipe e marcos do projeto de ponta a ponta.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="geral" className="w-full">
          <div className="overflow-x-auto pb-2 mb-4 scrollbar-hide">
            <TabsList className="w-max inline-flex">
              <TabsTrigger value="geral">Dados Gerais</TabsTrigger>
              <TabsTrigger value="escopo">Escopo</TabsTrigger>
              <TabsTrigger value="cronograma">Cronograma</TabsTrigger>
              <TabsTrigger value="marcos">Marcos</TabsTrigger>
              <TabsTrigger value="docs">Documentos</TabsTrigger>
              <TabsTrigger value="equipe">Equipe</TabsTrigger>
              <TabsTrigger value="horas">Horas</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
              <TabsTrigger value="historico">Timeline</TabsTrigger>
            </TabsList>
          </div>
          
          {/* 1. DADOS GERAIS */}
          <TabsContent value="geral" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome do Projeto *</Label>
                <Input placeholder="Ex: ERP Integrado V2" value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cliente Vinculado *</Label>
                <Select value={idCliente} onValueChange={setIdCliente}>
                  <SelectTrigger><SelectValue placeholder="Selecione o Cliente" /></SelectTrigger>
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

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Responsável (PM) *</Label>
                <SelectResponsavel 
                  value={responsavel} 
                  onValueChange={setResponsavel} 
                  placeholder="Selecione o Usuário" 
                />
              </div>
              <div className="space-y-2">
                <Label>Valor Contratado (R$) *</Label>
                <Input type="number" placeholder="Ex: 50000" value={valorContratado} onChange={e => setValorContratado(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Horas Planejadas</Label>
                <Input type="number" placeholder="Ex: 100" value={horasPlanejadas} onChange={e => setHorasPlanejadas(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Data de Incio *</Label>
                <Input type="date" value={dataInicio} onChange={e => setDataInicio(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Data Final (Prevista) *</Label>
                <Input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Projeto *</Label>
                <Select value={tipo} onValueChange={setTipo}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sistema Web">Sistema Web</SelectItem>
                    <SelectItem value="Aplicativo Mobile">Aplicativo Mobile</SelectItem>
                    <SelectItem value="Business Intelligence">Business Intelligence</SelectItem>
                    <SelectItem value="API">API / Integrao</SelectItem>
                    <SelectItem value="Website">Website Institucional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Prioridade *</Label>
                <Select value={prioridade} onValueChange={setPrioridade}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                    <SelectItem value="Mdia">Mdia</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Crtica">Crtica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Planejamento">Planejamento</SelectItem>
                    <SelectItem value="Kickoff">Kickoff</SelectItem>
                    <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                    <SelectItem value="Em Homologao">Em Homologao</SelectItem>
                    <SelectItem value="Concludo">Concludo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Descrio Geral / Resumo</Label>
              <Textarea placeholder="Descreva brevemente do que se trata o projeto..." value={descricao} onChange={e => setDescricao(e.target.value)} />
            </div>
          </TabsContent>

          {/* 2. ESCOPO */}
          <TabsContent value="escopo" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Documento de Escopo (Anexo no DMS)</Label>
                <label className="border rounded p-4 flex items-center justify-between border-dashed bg-muted/10 hover:bg-muted/30 transition-colors cursor-pointer block">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                      <Upload className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Anexar Arquivo de Escopo</h4>
                      <p className="text-xs text-muted-foreground">PDF, Word ou Excel (Salva automaticamente em Documentos DMS)</p>
                    </div>
                  </div>
                  <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'Escopo')} />
                  <Button variant="outline" size="sm" asChild>
                    <span>Selecionar Arquivo</span>
                  </Button>
                </label>
              </div>

              <div className="space-y-2">
                <Label>Objetivo Principal</Label>
                <Input placeholder="Qual a meta deste projeto?" value={objetivo} onChange={e => setObjetivo(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Escopo Includo (In Scope)</Label>
                <Textarea className="h-24" placeholder="Liste as funcionalidades, mdulos e entregas que fazem parte do projeto..." value={escopoIncluido} onChange={e => setEscopoIncluido(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Escopo Excludo (Out of Scope)</Label>
                <Textarea className="h-24" placeholder="Deixe claro o que NO faz parte da entrega deste projeto para evitar gargalos..." value={escopoExcluido} onChange={e => setEscopoExcluido(e.target.value)} />
              </div>
            </div>
          </TabsContent>

          {/* 3. CRONOGRAMA */}
          <TabsContent value="cronograma" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Etapas do Projeto</h4>
            </div>
            <p className="text-xs text-muted-foreground">As etapas do cronograma sero configuradas aps a criao inicial do projeto.</p>
          </TabsContent>

          {/* 4. MARCOS */}
          <TabsContent value="marcos" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Milestones (Marcos)</h4>
            </div>
            <p className="text-xs text-muted-foreground">Os marcos de entrega podero ser gerenciados no painel do projeto aps a gravao.</p>
          </TabsContent>

          {/* 5. DOCUMENTOS */}
          <TabsContent value="docs" className="space-y-4">
            <label className="border rounded p-6 flex flex-col items-center justify-center border-dashed cursor-pointer hover:bg-muted/20 transition-colors">
              <Upload className="w-8 h-8 text-muted-foreground mb-2" />
              <h4 className="font-medium">Repositrio do Projeto (DMS Integrado)</h4>
              <p className="text-sm text-muted-foreground mb-4 text-center">
                Clique para selecionar Briefings, Contratos, Diagramas ou PDFs. Todos sero arquivados automaticamente na pasta "Projetos" do mdulo Documentos.
              </p>
              <input type="file" className="hidden" onChange={e => handleFileUpload(e, 'Documentos do Projeto')} />
              <Button variant="secondary" size="sm" asChild>
                <span>Selecionar Arquivo</span>
              </Button>
            </label>

            {documentosAnexados.length > 0 && (
              <div className="space-y-2 mt-4">
                <Label className="text-xs font-semibold">Arquivos Anexados nesta Sesso (Salvos no DMS):</Label>
                {documentosAnexados.map((doc, idx) => (
                  <div key={idx} className="flex items-center justify-between border p-3 rounded bg-muted/10">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="font-medium text-sm">{doc.nome}</div>
                        <div className="text-xs text-muted-foreground">{doc.tamanho} " Salvo na pasta Projetos (DMS)</div>
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 6. EQUIPE */}
          <TabsContent value="equipe" className="space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-sm">Membros do Projeto</h4>
            </div>
            <p className="text-xs text-muted-foreground">A equipe e recursos sero alocados no painel completo do projeto.</p>
          </TabsContent>

          {/* 7. HORAS */}
          <TabsContent value="horas" className="space-y-4">
             <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div className="border rounded p-4 bg-muted/10">
                  <div className="text-xs text-muted-foreground">Horas Planejadas Totais</div>
                  <div className="text-2xl font-bold">{horasPlanejadas || 0}h</div>
                </div>
                <div className="border rounded p-4 bg-blue-50/50 dark:bg-blue-900/20">
                  <div className="text-xs text-blue-600 dark:text-blue-400">Horas Realizadas</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">0h</div>
                </div>
                <div className="border rounded p-4 bg-emerald-50/50 dark:bg-emerald-900/20">
                  <div className="text-xs text-emerald-600 dark:text-emerald-400">Saldo Restante</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{horasPlanejadas || 0}h</div>
                </div>
              </div>
          </TabsContent>

          {/* 8. FINANCEIRO */}
          <TabsContent value="financeiro" className="space-y-4">
            <div className="rounded-md border border-dashed p-6 text-center">
              <h3 className="font-semibold mb-2">Sade Financeira do Projeto</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Projeo inicial baseada no Valor Contratado.
              </p>
              <div className="grid grid-cols-3 gap-4 text-left">
                <div className="border rounded p-4">
                  <div className="text-xs text-muted-foreground">Valor Contratado</div>
                  <div className="font-bold text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorContratado) || 0)}
                  </div>
                </div>
                <div className="border rounded p-4">
                  <div className="text-xs text-muted-foreground">Total Recebido</div>
                  <div className="font-bold text-emerald-600 text-lg">R$ 0,00</div>
                </div>
                <div className="border rounded p-4">
                  <div className="text-xs text-muted-foreground">Saldo Restante</div>
                  <div className="font-bold text-red-600 text-lg">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(parseFloat(valorContratado) || 0)}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 9. HISTRICO */}
          <TabsContent value="historico" className="space-y-4">
             <div className="relative border-l border-muted ml-4 pl-6 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 border-4 border-background" />
                <div className="text-sm font-medium">Projeto Criado</div>
                <div className="text-xs text-muted-foreground">Sistema " Hoje</div>
              </div>
            </div>
          </TabsContent>

        </Tabs>

        <SheetFooter className="mt-8">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar Projeto</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

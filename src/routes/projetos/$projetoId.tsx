import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Projeto } from "@/features/projetos/types";
import { Cliente } from "@/features/clientes/types";
import { useDocumentosStore } from "@/features/documentos/hooks/useDocumentosStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Briefcase, Clock, Calendar, CheckCircle2, User, 
  DollarSign, Activity, Settings, FolderOpen, UploadCloud, Download, 
  Trash2, FileText, ExternalLink 
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { NovoProjetoSheet } from "@/features/projetos/components/NovoProjetoSheet";
import { toast } from "sonner";

export const Route = createFileRoute("/projetos/$projetoId")({
  component: PerfilProjetoPage,
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function PerfilProjetoPage() {
  const { projetoId } = Route.useParams();
  const { data: projetos = [] } = useLocalStorageState<Projeto>('focus_projetos', []);
  const { data: clientes = [] } = useLocalStorageState<Cliente>('focus_clientes', []);
  
  // Integração com o módulo de Gestão de Documentação (DMS)
  const { documentos, uploadFileFromModule, moveToTrash } = useDocumentosStore();
  const [isUploading, setIsUploading] = useState(false);

  const projeto = projetos.find(p => p.id === projetoId);

  if (!projeto) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <Link to="/projetos">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Projetos</Button>
        </Link>
      </div>
    );
  }

  const cliente = clientes.find(c => c.id === projeto.idCliente);
  const projetoNomeOficial = projeto.codigo ? `${projeto.codigo} - ${projeto.nome}` : projeto.nome;

  // Filtrar documentos deste projeto no DMS
  const projetoDocs = documentos.filter(
    (d) =>
      d.projetoId === projetoId ||
      d.caminhoPasta.toLowerCase().includes(projeto.nome.toLowerCase()) ||
      d.pastaId === `p-prj-${projetoId}`
  );

  // Upload direto para a pasta do projeto no DMS
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;

      uploadFileFromModule({
        nome: file.name,
        tamanho: `${sizeInMb} MB`,
        tamanhoBytes: file.size,
        moduloOrigem: 'Projetos',
        projetoId: projeto.id,
        projetoNome: projeto.nome,
        clienteId: cliente?.id,
        clienteNome: cliente?.nomeFantasia || cliente?.razaoSocial,
        categoria: 'Documentação Técnica & Entregáveis',
        tags: ['Projetos', projeto.codigo || 'PRJ', projeto.nome],
        urlConteudo: dataUrl,
      });

      setIsUploading(false);
      toast.success(`Documento "${file.name}" anexado e salvo na pasta /Projetos/${projetoNomeOficial} do DMS!`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/projetos">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{projeto.nome}</h1>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {projeto.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> {cliente?.nomeFantasia} • {projeto.codigo}
            </p>
          </div>
        </div>
        <NovoProjetoSheet>
          <Button><Settings className="w-4 h-4 mr-2" /> Gerenciar Projeto</Button>
        </NovoProjetoSheet>
      </div>

      {/* EXECUTIVE CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Progresso Global</div>
            <div className="text-2xl font-bold">{projeto.progressoGlobal}%</div>
            <Progress value={projeto.progressoGlobal} className="h-2 mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Esforço (Horas)</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{projeto.horasRealizadas}h <span className="text-sm font-normal text-muted-foreground">/ {projeto.horasPlanejadas}h</span></div>
            <div className="text-xs text-muted-foreground">Restam {projeto.horasPlanejadas - projeto.horasRealizadas}h no orçamento de tempo.</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Prazos</div>
            <div className="text-sm font-medium">Início: <span className="font-normal text-muted-foreground">{new Date(projeto.dataInicio).toLocaleDateString('pt-BR')}</span></div>
            <div className="text-sm font-medium">Fim: <span className="font-normal text-muted-foreground">{new Date(projeto.dataFinal).toLocaleDateString('pt-BR')}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> Financeiro</div>
            <div className="font-medium text-emerald-600">{formatCurrency(projeto.valorRecebido)} <span className="text-xs text-muted-foreground font-normal">Recebido</span></div>
            <div className="text-sm text-muted-foreground">{formatCurrency(projeto.valorContratado)} <span className="text-xs font-normal">Total do Contrato</span></div>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <Tabs defaultValue="visaogeral" className="space-y-6 mt-4">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="w-max min-w-full justify-start border-b-0 rounded-none h-auto p-0 bg-transparent gap-2">
            <TabsTrigger value="visaogeral" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Visão Geral</TabsTrigger>
            <TabsTrigger value="documentos" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5 font-semibold text-primary">
              <FolderOpen className="w-4 h-4 mr-1.5 inline" /> Documentos & Anexos ({projetoDocs.length})
            </TabsTrigger>
            <TabsTrigger value="lancamentos" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Lançamentos do Projeto</TabsTrigger>
            <TabsTrigger value="relatorio" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">DRE Sintético do Projeto</TabsTrigger>
          </TabsList>
        </div>
        
        {/* ABA: VISÃO GERAL */}
        <TabsContent value="visaogeral" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Categoria</h4>
                  <p className="text-sm text-muted-foreground">{projeto.tipo} - {projeto.categoria}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Descrição Geral</h4>
                  <p className="text-sm text-muted-foreground">{projeto.descricaoGeral}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">PM (Responsável)</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> {projeto.responsavelPrincipal}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Marcos (Milestones)</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b pb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Aprovação do Escopo</h4>
                      <p className="text-xs text-muted-foreground">Concluído em 15/10/2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Entrega do MVP</h4>
                      <p className="text-xs text-muted-foreground">Previsto para 30/11/2026</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA: DOCUMENTOS DMS INTEGRADOS */}
        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FolderOpen className="w-5 h-5 text-emerald-600" />
                  Repositório de Arquivos — /Projetos/{projetoNomeOficial}
                </CardTitle>
                <CardDescription className="text-xs">
                  Especificações técnicas, atas, diagramas e entregáveis salvos automaticamente no módulo <strong>Gestão de Documentação</strong>.
                </CardDescription>
              </div>
              <Link to="/documentos">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                  <ExternalLink className="w-3.5 h-3.5" /> Explorador Completo DMS
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Dropzone de Upload */}
              <div className="border-2 border-dashed border-primary/30 hover:border-primary/60 rounded-xl p-6 flex flex-col items-center justify-center bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer relative group text-center">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <div className="bg-primary/10 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {isUploading ? 'Enviando e indexando arquivo...' : 'Clique ou arraste arquivos para a pasta deste projeto'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, DOCX, ZIP, Plantas, Blueprints, Diagramas, Entregáveis (armazenamento ilimitado)
                </p>
              </div>

              {/* Lista de Documentos */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Arquivos na Pasta</span>
                  <Badge variant="secondary" className="text-xs">{projetoDocs.length} documento(s)</Badge>
                </div>

                {projetoDocs.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground text-sm">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum documento anexado ainda para este projeto. Faça o upload acima.
                  </div>
                ) : (
                  <div className="grid gap-2">
                    {projetoDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/40 bg-card transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="p-2 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 truncate">
                            <p className="font-semibold text-xs truncate">{doc.nome}</p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5">
                              <span className="bg-secondary px-1.5 py-0.5 rounded text-[10px]">{doc.categoria}</span>
                              <span>{doc.tamanho}</span>
                              <span>• {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</span>
                              <span>• v{doc.versaoAtual}</span>
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
                            onClick={() => {
                              moveToTrash(doc.id);
                              toast.info(`Documento "${doc.nome}" movido para a Lixeira do DMS.`);
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: LANÇAMENTOS */}
        <TabsContent value="lancamentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lançamentos Financeiros do Projeto</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Despesas e receitas atribuídas diretamente ao centro de custos deste projeto.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: RELATÓRIO */}
        <TabsContent value="relatorio" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">DRE Sintético</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Demonstrativo de resultado gerencial específico para a margem de lucro deste projeto.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

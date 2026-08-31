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
  Trash2, FileText, ExternalLink, Flag, Users, Target, Layers,
  Receipt, TrendingUp, Check
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { NovoProjetoSheet } from "@/features/projetos/components/NovoProjetoSheet";
import { ProjetoMilestonesView } from "@/features/projetos/components/ProjetoMilestonesView";
import { ProjetoCronogramaView } from "@/features/projetos/components/ProjetoCronogramaView";
import { ProjetoEquipeView } from "@/features/projetos/components/ProjetoEquipeView";
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
  
  // Integração com o módulo de Gestão de Documentos (DMS)
  const { documentos, uploadFileFromModule } = useDocumentosStore();
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Concluído':
        return <Badge className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Concluído</Badge>;
      case 'Em Desenvolvimento':
        return <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">Em Desenvolvimento</Badge>;
      case 'Em Homologação':
        return <Badge className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20">Em Homologação</Badge>;
      case 'Aguardando Cliente':
        return <Badge className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">Aguardando Cliente</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 pt-6 max-w-full overflow-x-hidden animate-fade-in">
      {/* HEADER DO PAINEL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Link to="/projetos">
            <Button variant="outline" size="icon" className="rounded-xl h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">{projeto.nome}</h1>
              {getStatusBadge(projeto.status)}
              <Badge variant="outline" className="text-xs font-semibold text-orange-600 border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                {projeto.codigo}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
              <Briefcase className="w-3.5 h-3.5 text-orange-500" /> 
              Cliente: <strong>{cliente?.nomeFantasia || cliente?.razaoSocial || 'Cliente Direto'}</strong> • Tipo: <strong>{projeto.tipo}</strong>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <NovoProjetoSheet>
            <Button variant="outline" className="rounded-xl gap-1.5 font-bold text-xs h-8">
              <Settings className="w-3.5 h-3.5" /> Editar Dados
            </Button>
          </NovoProjetoSheet>
        </div>
      </div>

      {/* EXECUTIVE KPI CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5 text-orange-500" /> Progresso Global</span>
              <span className="text-orange-600 font-bold">{projeto.progressoGlobal}%</span>
            </div>
            <div className="text-2xl font-bold text-foreground">{projeto.progressoGlobal}%</div>
            <Progress value={projeto.progressoGlobal} className="h-1.5" />
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Esforço de Horas
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {projeto.horasRealizadas}h <span className="text-xs font-normal text-muted-foreground">/ {projeto.horasPlanejadas}h planejadas</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Saldo: <strong>{projeto.horasPlanejadas - projeto.horasRealizadas}h restantes</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-purple-500" /> Prazos & Vigência
            </div>
            <div className="text-sm font-bold text-foreground">
              {new Date(projeto.dataInicio).toLocaleDateString('pt-BR')} até {new Date(projeto.dataFinal).toLocaleDateString('pt-BR')}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Responsável PM: <strong>{projeto.responsavelPrincipal}</strong>
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex flex-col justify-between gap-2">
            <div className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-500" /> Saúde Financeira
            </div>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {formatCurrency(projeto.valorContratado)}
            </div>
            <p className="text-[11px] text-muted-foreground">
              Recebido: <strong className="text-foreground">{formatCurrency(projeto.valorRecebido)}</strong>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* ABAS DO PAINEL DO PROJETO */}
      <Tabs defaultValue="visaogeral" className="space-y-4">
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="visaogeral" className="gap-2 shrink-0 font-medium text-xs">
              <Layers className="w-3.5 h-3.5" /> Visão Geral & Escopo
            </TabsTrigger>
            <TabsTrigger value="marcos" className="gap-2 shrink-0 font-medium text-xs">
              <Flag className="w-3.5 h-3.5" /> Marcos (Milestones)
            </TabsTrigger>
            <TabsTrigger value="cronograma" className="gap-2 shrink-0 font-medium text-xs">
              <Calendar className="w-3.5 h-3.5" /> Cronograma & Fases
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2 shrink-0 font-medium text-xs">
              <Users className="w-3.5 h-3.5" /> Squad & Equipe
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-2 shrink-0 font-medium text-xs">
              <FolderOpen className="w-3.5 h-3.5" /> Documentos ({projetoDocs.length})
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2 shrink-0 font-medium text-xs">
              <DollarSign className="w-3.5 h-3.5" /> Lançamentos & DRE
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* 1. VISÃO GERAL & ESCOPO */}
        <TabsContent value="visaogeral" className="space-y-6 focus-visible:outline-none">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Informações Gerais */}
            <Card className="rounded-2xl border shadow-xs bg-card">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-orange-500" /> Resumo do Projeto
                </CardTitle>
                <CardDescription className="text-xs">Informações cadastrais e diretrizes do contrato.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <span className="font-semibold text-muted-foreground">Finalidade / Descrição</span>
                  <p className="text-foreground mt-0.5">{projeto.descricaoGeral || 'Sem descrição cadastrada.'}</p>
                </div>
                {projeto.objetivo && (
                  <div>
                    <span className="font-semibold text-muted-foreground">Objetivo Principal</span>
                    <p className="text-foreground mt-0.5">{projeto.objetivo}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <span className="font-semibold text-muted-foreground">Categoria / Tipo</span>
                    <p className="text-foreground font-medium">{projeto.tipo} • {projeto.categoria}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Prioridade</span>
                    <p className="text-foreground font-medium">{projeto.prioridade}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                  <div>
                    <span className="font-semibold text-muted-foreground">Project Manager (PM)</span>
                    <p className="text-foreground font-medium flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-orange-500" /> {projeto.responsavelPrincipal}
                    </p>
                  </div>
                  <div>
                    <span className="font-semibold text-muted-foreground">Cliente Atendido</span>
                    <p className="text-foreground font-medium">{cliente?.nomeFantasia || cliente?.razaoSocial || 'Cliente'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Escopo do Projeto */}
            <Card className="rounded-2xl border shadow-xs bg-card">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <Target className="w-4 h-4 text-orange-500" /> Matriz de Escopo (In Scope & Out of Scope)
                </CardTitle>
                <CardDescription className="text-xs">Entregáveis acordados e exclusões de projeto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 pt-4 text-xs">
                <div>
                  <span className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Escopo Incluído (In Scope)
                  </span>
                  <div className="p-3 rounded-xl border bg-emerald-50/20 dark:bg-emerald-950/10 text-foreground">
                    {projeto.escopoIncluido || 'Módulos de backend, frontend, relatórios analíticos e parametrização cadastral.'}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1.5 mb-1">
                    <Trash2 className="w-3.5 h-3.5" /> Escopo Excluído (Out of Scope)
                  </span>
                  <div className="p-3 rounded-xl border bg-rose-50/20 dark:bg-rose-950/10 text-foreground">
                    {projeto.escopoExcluido || 'Desenvolvimento de hardware customizado, aquisição de licenças de terceiros e suporte 24x7 não previsto em SLA.'}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 2. MARCOS (MILESTONES) */}
        <TabsContent value="marcos" className="focus-visible:outline-none">
          <ProjetoMilestonesView projeto={projeto} />
        </TabsContent>

        {/* 3. CRONOGRAMA & FASES */}
        <TabsContent value="cronograma" className="focus-visible:outline-none">
          <ProjetoCronogramaView projeto={projeto} />
        </TabsContent>

        {/* 4. SQUAD & EQUIPE */}
        <TabsContent value="equipe" className="focus-visible:outline-none">
          <ProjetoEquipeView projeto={projeto} />
        </TabsContent>

        {/* 5. DOCUMENTOS & REPOSITÓRIO DMS */}
        <TabsContent value="documentos" className="space-y-4 focus-visible:outline-none">
          <Card className="rounded-2xl border shadow-xs bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FolderOpen className="w-4 h-4 text-orange-500" /> Repositório Oficial do Projeto — /Projetos/{projetoNomeOficial}
                </CardTitle>
                <CardDescription className="text-xs">
                  Especificações, diagramas, contratos e PDFs sincronizados diretamente com o módulo <strong>Gestão de Documentos (DMS)</strong>.
                </CardDescription>
              </div>
              <Link to="/documentos">
                <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 font-semibold">
                  <ExternalLink className="w-3.5 h-3.5" /> Abrir no DMS Completo
                </Button>
              </Link>
            </CardHeader>

            <CardContent className="space-y-6 pt-4 text-xs">
              {/* Dropzone de Upload */}
              <div className="border-2 border-dashed border-orange-500/30 hover:border-orange-500/60 rounded-2xl p-6 flex flex-col items-center justify-center bg-orange-50/10 hover:bg-orange-50/20 dark:bg-orange-950/10 transition-colors cursor-pointer relative group text-center">
                <input 
                  type="file" 
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                />
                <div className="bg-orange-100 dark:bg-orange-950/40 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-6 h-6 text-orange-600" />
                </div>
                <p className="text-xs font-bold text-foreground">
                  {isUploading ? 'Enviando e indexando arquivo no DMS...' : 'Clique ou arraste arquivos para anexar ao projeto'}
                </p>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Formatos suportados: PDF, DOCX, XLSX, PNG, JPG, ZIP (até 50MB)
                </p>
              </div>

              {/* Lista de Documentos */}
              {projetoDocs.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  Nenhum arquivo anexado a este projeto ainda.
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="font-bold text-xs">Documentos Armazenados ({projetoDocs.length})</Label>
                  <div className="grid gap-3 md:grid-cols-2">
                    {projetoDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl border bg-card shadow-2xs">
                        <div className="flex items-center gap-3 truncate">
                          <FileText className="w-5 h-5 text-orange-500 shrink-0" />
                          <div className="truncate">
                            <h4 className="font-bold text-xs text-foreground truncate">{doc.nome}</h4>
                            <p className="text-[11px] text-muted-foreground">{doc.tamanho} • {doc.categoria || 'Geral'}</p>
                          </div>
                        </div>
                        {doc.urlConteudo && (
                          <a href={doc.urlConteudo} download={doc.nome} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-lg">
                              <Download className="w-3.5 h-3.5 text-muted-foreground hover:text-foreground" />
                            </Button>
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 6. FINANCEIRO & LANÇAMENTOS */}
        <TabsContent value="financeiro" className="space-y-4 focus-visible:outline-none">
          <Card className="rounded-2xl border shadow-xs bg-card">
            <CardHeader className="pb-3 border-b bg-muted/20">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-orange-500" /> Extrato Financeiro & DRE do Projeto
              </CardTitle>
              <CardDescription className="text-xs">Faturamento, recebimentos e rentabilidade operacional.</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 text-xs space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left">
                <div className="border rounded-2xl p-4 bg-muted/10">
                  <div className="text-xs text-muted-foreground">Valor Total Contratado</div>
                  <div className="font-bold text-lg text-foreground mt-1">{formatCurrency(projeto.valorContratado)}</div>
                </div>
                <div className="border rounded-2xl p-4 bg-emerald-50/20 dark:bg-emerald-950/20">
                  <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">Total Recebido</div>
                  <div className="font-bold text-lg text-emerald-600 dark:text-emerald-400 mt-1">{formatCurrency(projeto.valorRecebido)}</div>
                </div>
                <div className="border rounded-2xl p-4 bg-orange-50/20 dark:bg-orange-950/20">
                  <div className="text-xs text-orange-700 dark:text-orange-400 font-medium">Saldo a Faturar</div>
                  <div className="font-bold text-lg text-orange-600 mt-1">
                    {formatCurrency(projeto.valorContratado - projeto.valorRecebido)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

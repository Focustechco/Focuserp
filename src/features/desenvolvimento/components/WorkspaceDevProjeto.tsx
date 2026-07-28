import React, { useState } from 'react';
import { Projeto } from '../projetos/types';
import {
  ItemBacklog,
  SprintDelivery,
  VersaoSemVer,
  RepositorioGitConfig,
  GitBranchItem,
  ReleaseDelivery,
  DeployItem,
  CasoTesteQA,
  BugItem,
  CorrecaoBugItem,
  AmbienteInfo,
  PublicacaoApp,
  LogDelivery,
  PipelineCICD,
  StatusKanban,
} from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ArrowLeft,
  Code2,
  GitBranch,
  Rocket,
  Bug,
  CheckCircle2,
  Clock,
  Layers,
  Terminal,
  Cpu,
  AlertTriangle,
  PlayCircle,
  Plus,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Globe,
  Settings,
  Server,
  Activity,
  UserCheck,
} from 'lucide-react';
import { NovoItemBacklogSheet } from './NovoItemBacklogSheet';
import { NovoBugSheet } from './NovoBugSheet';

interface WorkspaceDevProjetoProps {
  projeto: Projeto;
  backlogItems: ItemBacklog[];
  sprints: SprintDelivery[];
  versoes: VersaoSemVer[];
  repositriosGit: RepositorioGitConfig[];
  branches: GitBranchItem[];
  releases: ReleaseDelivery[];
  deploys: DeployItem[];
  casosQA: CasoTesteQA[];
  bugs: BugItem[];
  correcoes: CorrecaoBugItem[];
  ambientes: AmbienteInfo[];
  publicacoes: PublicacaoApp[];
  logsDelivery: LogDelivery[];
  pipelines: PipelineCICD[];
  onBack: () => void;
  onMoverItemKanban: (itemId: string, status: StatusKanban) => void;
  onCriarItemBacklog: (item: Omit<ItemBacklog, 'id' | 'createdAt'>) => void;
  onReportarBug: (bug: Omit<BugItem, 'id' | 'createdAt'>) => void;
  onResolverBug: (bugId: string, solucao: string, versao: string, responsavel: string) => void;
  onRegistrarDeploy: (dep: Omit<DeployItem, 'id' | 'dataHora'>) => void;
}

export function WorkspaceDevProjeto({
  projeto,
  backlogItems,
  sprints,
  versoes,
  repositriosGit,
  branches,
  releases,
  deploys,
  casosQA,
  bugs,
  correcoes,
  ambientes,
  publicacoes,
  logsDelivery,
  pipelines,
  onBack,
  onMoverItemKanban,
  onCriarItemBacklog,
  onReportarBug,
  onResolverBug,
  onRegistrarDeploy,
}: WorkspaceDevProjetoProps) {
  const [activeTab, setActiveTab] = useState('kanban');

  // Sheets Open State
  const [isNovoItemSheetOpen, setIsNovoItemSheetOpen] = useState(false);
  const [isNovoBugSheetOpen, setIsNovoBugSheetOpen] = useState(false);

  // Filter entities for this specific project
  const projBacklog = backlogItems.filter((b) => b.projetoId === projeto.id);
  const projSprints = sprints.filter((s) => s.projetoId === projeto.id);
  const projVersoes = versoes.filter((v) => v.projetoId === projeto.id);
  const projGit = repositriosGit.find((g) => g.projetoId === projeto.id);
  const projBranches = branches.filter((br) => br.projetoId === projeto.id);
  const projReleases = releases.filter((r) => r.projetoId === projeto.id);
  const projDeploys = deploys.filter((d) => d.projetoId === projeto.id);
  const projQA = casosQA.filter((q) => q.projetoId === projeto.id);
  const projBugs = bugs.filter((b) => b.projetoId === projeto.id);
  const projFixes = correcoes.filter((f) => f.projetoId === projeto.id);
  const projAmbientes = ambientes.filter((a) => a.projetoId === projeto.id);
  const projPublicacoes = publicacoes.filter((p) => p.projetoId === projeto.id);
  const projLogs = logsDelivery.filter((l) => l.projetoId === projeto.id);
  const projPipelines = pipelines.filter((p) => p.projetoId === projeto.id);

  const activeSprint = projSprints.find((s) => s.status === 'Em Andamento') || projSprints[0];

  const kanbanColumns: StatusKanban[] = [
    'Backlog',
    'A Fazer',
    'Em Desenvolvimento',
    'Code Review',
    'QA',
    'Homologao',
    'Pronto para Deploy',
    'Concludo',
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DO WORKSPACE TCNICO */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold shrink-0">
              <ArrowLeft className="h-4 w-4" /> Voltar aos Workspaces
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs font-bold">
                  {projeto.codigo}
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                  {projeto.tipo}
                </Badge>
                <h1 className="text-xl font-black tracking-tight text-foreground">{projeto.nome}</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cliente: <span className="font-semibold text-foreground">{projeto.idCliente || 'Cliente Corporativo'}</span> " Tech Lead: <span className="font-semibold text-foreground">{projeto.responsavelPrincipal || 'Lead'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setIsNovoItemSheetOpen(true)} size="sm" className="gap-1.5 text-xs font-semibold">
              <Plus className="h-4 w-4" /> Nova Tarefa / Item
            </Button>
            <Button onClick={() => setIsNovoBugSheetOpen(true)} variant="destructive" size="sm" className="gap-1.5 text-xs font-semibold">
              <Bug className="h-4 w-4" /> Reportar Bug
            </Button>
          </div>
        </div>
      </div>

      {/* TABS TCNICAS DO WORKSPACE (15 SUB-TABNAV) */}
      <Tabs defaultValue="kanban" value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="flex flex-wrap w-full justify-start h-auto p-1.5 bg-muted/60 border border-border">
          <TabsTrigger value="kanban" className="text-xs gap-1.5">
            <Layers className="h-3.5 w-3.5" /> Quadro Kanban
          </TabsTrigger>
          <TabsTrigger value="backlog" className="text-xs gap-1.5">
            <Code2 className="h-3.5 w-3.5" /> Backlog
          </TabsTrigger>
          <TabsTrigger value="sprints" className="text-xs gap-1.5">
            <PlayCircle className="h-3.5 w-3.5" /> Sprints & Burndown
          </TabsTrigger>
          <TabsTrigger value="git" className="text-xs gap-1.5">
            <GitBranch className="h-3.5 w-3.5" /> Git & Branches
          </TabsTrigger>
          <TabsTrigger value="releases" className="text-xs gap-1.5">
            <Rocket className="h-3.5 w-3.5" /> Releases
          </TabsTrigger>
          <TabsTrigger value="deploys" className="text-xs gap-1.5">
            <Terminal className="h-3.5 w-3.5" /> Deploys
          </TabsTrigger>
          <TabsTrigger value="qa" className="text-xs gap-1.5">
            <ShieldCheck className="h-3.5 w-3.5" /> QA Testes
          </TabsTrigger>
          <TabsTrigger value="bugs" className="text-xs gap-1.5">
            <Bug className="h-3.5 w-3.5" /> Bugs ({projBugs.filter((b) => b.status !== 'Resolvido').length})
          </TabsTrigger>
          <TabsTrigger value="ambientes" className="text-xs gap-1.5">
            <Server className="h-3.5 w-3.5" /> Ambientes
          </TabsTrigger>
          <TabsTrigger value="publicacoes" className="text-xs gap-1.5">
            <Smartphone className="h-3.5 w-3.5" /> Publicaes App
          </TabsTrigger>
          <TabsTrigger value="logs" className="text-xs gap-1.5">
            <Activity className="h-3.5 w-3.5" /> CI/CD & Logs
          </TabsTrigger>
        </TabsList>

        {/* SUB-TAB 1: KANBAN BOARD */}
        <TabsContent value="kanban" className="space-y-6 outline-none">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">Fluxo de Engenharia Software Delivery</h3>
            <span className="text-xs text-muted-foreground">Clique na coluna desejada para avanar uma tarefa</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {kanbanColumns.map((col) => {
              const colItems = projBacklog.filter((b) => b.status === col);
              return (
                <div key={col} className="space-y-3 p-3 rounded-xl bg-muted/20 border border-border min-h-[300px]">
                  <div className="flex items-center justify-between font-bold text-xs border-b border-border pb-2">
                    <span className="text-foreground">{col}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {colItems.length}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {colItems.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-muted-foreground border border-dashed rounded-lg">
                        Vazio
                      </div>
                    ) : (
                      colItems.map((item) => (
                        <Card
                          key={item.id}
                          className="p-3 space-y-2 border-l-4 border-l-primary hover:shadow-md transition-all cursor-pointer"
                        >
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-[9px] font-mono">
                              {item.tipoItem}
                            </Badge>
                            <Badge
                              variant="secondary"
                              className={`text-[9px] ${
                                item.prioridade === 'Crtica' || item.prioridade === 'Alta'
                                  ? 'bg-rose-500/10 text-rose-600'
                                  : ''
                              }`}
                            >
                              {item.storyPoints} SP
                            </Badge>
                          </div>
                          <h4 className="font-bold text-xs text-foreground leading-snug">{item.titulo}</h4>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">{item.descricao}</p>

                          {/* Quick Change Column dropdown / buttons */}
                          <div className="flex items-center justify-between text-[10px] pt-1 border-t border-border/40">
                            <span className="text-muted-foreground">{item.responsavel || 'Dev'}</span>
                            <div className="flex items-center gap-1">
                              {col !== 'Concludo' && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-5 text-[9px] px-1 text-primary font-bold"
                                  onClick={() => {
                                    const nextIdx = kanbanColumns.indexOf(col) + 1;
                                    if (nextIdx < kanbanColumns.length) {
                                      onMoverItemKanban(item.id, kanbanColumns[nextIdx]);
                                    }
                                  }}
                                >
                                  Mover 
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* SUB-TAB 2: BACKLOG */}
        <TabsContent value="backlog" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold">Product & Technical Backlog</CardTitle>
                <CardDescription className="text-xs">Lista completa de pendncias tcnicas e estrias</CardDescription>
              </div>
              <Button onClick={() => setIsNovoItemSheetOpen(true)} size="sm" className="gap-1.5 text-xs">
                <Plus className="h-4 w-4" /> Novo Item
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Tipo</TableHead>
                    <TableHead className="text-xs">Ttulo</TableHead>
                    <TableHead className="text-xs">Prioridade</TableHead>
                    <TableHead className="text-xs">Story Points</TableHead>
                    <TableHead className="text-xs">Responsvel</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projBacklog.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhum item cadastrado no backlog.
                      </TableCell>
                    </TableRow>
                  ) : (
                    projBacklog.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {item.tipoItem}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-xs text-foreground">{item.titulo}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-[10px]">
                            {item.prioridade}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs font-semibold">{item.storyPoints} SP</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{item.responsavel || 'Dev'}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {item.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUB-TAB 3: SPRINTS & BURNDOWN */}
        <TabsContent value="sprints" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold">Gesto de Sprints geis</CardTitle>
              <CardDescription className="text-xs">Velocidade da equipe e entregas por ciclo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {projSprints.map((sprint) => (
                <div key={sprint.id} className="p-4 rounded-xl border border-border bg-card space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">{sprint.nome}</h4>
                      <p className="text-xs text-muted-foreground">{sprint.objetivo}</p>
                    </div>
                    <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 text-xs font-bold">
                      {sprint.status}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-3 rounded-lg bg-muted/20 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Incio</span>
                      <span className="font-bold">{sprint.dataInicio}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Trmino</span>
                      <span className="font-bold">{sprint.dataFim}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Velocity Estimado</span>
                      <span className="font-bold">{sprint.velocityEstimado} SP</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Velocity Entregue</span>
                      <span className="font-bold text-emerald-600">{sprint.velocityRealizado} SP</span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUB-TAB 4: BUGS */}
        <TabsContent value="bugs" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-bold text-rose-600 flex items-center gap-2">
                  <Bug className="h-4 w-4" /> Defeitos & Bugs Reportados
                </CardTitle>
                <CardDescription className="text-xs">Rastreamento de erros e correes</CardDescription>
              </div>
              <Button onClick={() => setIsNovoBugSheetOpen(true)} variant="destructive" size="sm" className="gap-1.5 text-xs">
                <Plus className="h-4 w-4" /> Reportar Bug
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Severidade</TableHead>
                    <TableHead className="text-xs">Ttulo do Bug</TableHead>
                    <TableHead className="text-xs">Ambiente</TableHead>
                    <TableHead className="text-xs">Responsvel</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                    <TableHead className="text-xs text-right">Ao</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projBugs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-6 text-xs text-muted-foreground">
                        Nenhum bug cadastrado neste projeto.
                      </TableCell>
                    </TableRow>
                  ) : (
                    projBugs.map((bug) => (
                      <TableRow key={bug.id}>
                        <TableCell>
                          <Badge
                            variant="destructive"
                            className={`text-[10px] ${
                              bug.severidade === 'Crtico'
                                ? 'bg-rose-600'
                                : bug.severidade === 'Alto'
                                ? 'bg-orange-600'
                                : 'bg-amber-600'
                            }`}
                          >
                            {bug.severidade}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-xs text-foreground">{bug.titulo}</TableCell>
                        <TableCell className="text-xs font-semibold">{bug.ambiente}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{bug.responsavel}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {bug.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {bug.status !== 'Resolvido' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-[10px] font-bold text-emerald-600"
                              onClick={() => onResolverBug(bug.id, 'Correo aplicada e testada', 'v1.0.1', 'Dev Team')}
                            >
                              Resolver Bug
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUB-TAB 5: AMBIENTES */}
        <TabsContent value="ambientes" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {projAmbientes.map((amb) => (
              <Card key={amb.id} className="border-border/80">
                <CardHeader className="py-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                      <Server className="h-4 w-4 text-primary" /> {amb.tipo}
                    </CardTitle>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-[10px] font-bold">
                      {amb.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <a
                    href={amb.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2.5 rounded-lg border border-border/60 hover:bg-muted/40 font-mono text-[11px] text-primary truncate block"
                  >
                    {amb.url}
                  </a>
                  <div className="flex justify-between text-[11px] text-muted-foreground pt-2 border-t">
                    <span>Verso Atual:</span>
                    <span className="font-bold text-foreground">{amb.versaoAtual}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* SUB-TAB 6: CI/CD & LOGS */}
        <TabsContent value="logs" className="space-y-6 outline-none">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Terminal className="h-4 w-4 text-primary" /> Pipelines de CI/CD & Event Logs
              </CardTitle>
              <CardDescription className="text-xs">Histrico de execues automatizadas e builds</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {projPipelines.map((pipe) => (
                <div key={pipe.id} className="p-3 rounded-xl border border-border bg-muted/20 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{pipe.nomePipeline} ({pipe.buildNumber})</span>
                    <span className="text-[10px] text-muted-foreground">Provedor: {pipe.provedor} " Tempo: {pipe.tempoExecucaoSegundos}s</span>
                  </div>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[10px]">
                    {pipe.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* SHEETS DE CRIAO */}
      <NovoItemBacklogSheet
        open={isNovoItemSheetOpen}
        onOpenChange={setIsNovoItemSheetOpen}
        projetoId={projeto.id}
        sprintId={activeSprint?.id}
        onAddItem={onCriarItemBacklog}
      />

      <NovoBugSheet
        open={isNovoBugSheetOpen}
        onOpenChange={setIsNovoBugSheetOpen}
        projetoId={projeto.id}
        onReportBug={onReportarBug}
      />
    </div>
  );
}

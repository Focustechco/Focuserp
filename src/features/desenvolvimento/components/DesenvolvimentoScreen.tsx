import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDesenvolvimento } from '../useDesenvolvimento';
import { DashboardExecutivoDelivery } from './DashboardExecutivoDelivery';
import { ProjetosDeliveryList } from './ProjetosDeliveryList';
import { WorkspaceDevProjeto } from './WorkspaceDevProjeto';
import { Projeto } from '../projetos/types';
import { Code2, LayoutDashboard, Sparkles, Terminal } from 'lucide-react';

export function DesenvolvimentoScreen() {
  const {
    projetosTecnicos,
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
    moverItemKanban,
    criarCriarItemBacklog,
    registrarNovoBug,
    resolverBug,
    registrarDeploy,
  } = useDesenvolvimento();

  const [mainTab, setMainTab] = useState<'workspaces' | 'dashboard' | 'workspace_individual'>('workspaces');
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);

  const handleSelectProjeto = (proj: Projeto) => {
    setSelectedProjeto(proj);
    setMainTab('workspace_individual');
  };

  const handleBackToWorkspaces = () => {
    setSelectedProjeto(null);
    setMainTab('workspaces');
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Desenvolvimento
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Central de engenharia de software da Focus Tecnologia: Sprints, Backlog, Kanban, Git, CI/CD, Deploys e Bugs
          </p>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO */}
      <Tabs value={mainTab} onValueChange={(val: any) => setMainTab(val)} className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="workspaces" className="text-xs font-semibold gap-1.5 shrink-0">
              <Terminal className="h-4 w-4" /> Workspaces de Software
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs font-semibold gap-1.5 shrink-0">
              <LayoutDashboard className="h-4 w-4" /> Dashboard Executivo
            </TabsTrigger>
            <TabsTrigger value="workspace_individual" disabled={!selectedProjeto} className="text-xs font-semibold gap-1.5 shrink-0">
              <Sparkles className="h-4 w-4" /> Workspace {selectedProjeto ? `(${selectedProjeto.nome})` : ''}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: WORKSPACES DE PROJETOS TCNICOS */}
        <TabsContent value="workspaces" className="space-y-4 outline-none">
          <ProjetosDeliveryList
            projetosTecnicos={projetosTecnicos}
            backlogItems={backlogItems}
            bugs={bugs}
            sprints={sprints}
            onSelectProjeto={handleSelectProjeto}
          />
        </TabsContent>

        {/* ABA 2: DASHBOARD EXECUTIVO DELIVERY */}
        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <DashboardExecutivoDelivery
            projetosTecnicos={projetosTecnicos}
            backlogItems={backlogItems}
            sprints={sprints}
            bugs={bugs}
            deploys={deploys}
            releases={releases}
          />
        </TabsContent>

        {/* ABA 3: WORKSPACE EXCLUSIVO DO PROJETO SELECIONADO */}
        <TabsContent value="workspace_individual" className="space-y-4 outline-none">
          {selectedProjeto ? (
            <WorkspaceDevProjeto
              projeto={selectedProjeto}
              backlogItems={backlogItems}
              sprints={sprints}
              versoes={versoes}
              repositriosGit={repositriosGit}
              branches={branches}
              releases={releases}
              deploys={deploys}
              casosQA={casosQA}
              bugs={bugs}
              correcoes={correcoes}
              ambientes={ambientes}
              publicacoes={publicacoes}
              logsDelivery={logsDelivery}
              pipelines={pipelines}
              onBack={handleBackToWorkspaces}
              onMoverItemKanban={moverItemKanban}
              onCriarItemBacklog={criarCriarItemBacklog}
              onReportarBug={registrarNovoBug}
              onResolverBug={resolverBug}
              onRegistrarDeploy={registrarDeploy}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              Selecione um projeto de software na lista para abrir seu Workspace Tcnico.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

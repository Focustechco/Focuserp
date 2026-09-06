import React, { useState } from 'react';
import { Terminal, LayoutDashboard, Code2, Filter, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DashboardExecutivoDelivery } from './DashboardExecutivoDelivery';
import { ProjetosDeliveryList } from './ProjetosDeliveryList';
import { WorkspaceDevProjeto } from './WorkspaceDevProjeto';
import { Projeto } from '../projetos/types';
import { useDesenvolvimento } from '../useDesenvolvimento';

export function MobileDesenvolvimentoView() {
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

  const [activeTab, setActiveTab] = useState<'workspaces' | 'dashboard' | 'workspace_individual'>('workspaces');
  const [selectedProjeto, setSelectedProjeto] = useState<Projeto | null>(null);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const handleSelectProjeto = (proj: Projeto) => {
    setSelectedProjeto(proj);
    setActiveTab('workspace_individual');
  };

  const handleBackToWorkspaces = () => {
    setSelectedProjeto(null);
    setActiveTab('workspaces');
  };

  const sections = [
    { id: 'workspaces', label: `Workspaces (${projetosTecnicos.length})`, icon: Terminal },
    { id: 'dashboard', label: 'Dashboard Executivo', icon: LayoutDashboard },
    ...(selectedProjeto
      ? [{ id: 'workspace_individual', label: `Workspace: ${selectedProjeto.codigo || selectedProjeto.nome}`, icon: Code2 }]
      : []),
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. STICKY TOP BAR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          {activeTab === 'workspace_individual' ? (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackToWorkspaces}
              className="h-9 px-3 rounded-xl border-muted-foreground/20 text-xs font-bold flex items-center gap-1.5 flex-1 justify-start"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-primary" />
              <span className="truncate">Voltar aos Workspaces</span>
            </Button>
          ) : (
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl border-muted-foreground/20 text-xs font-medium flex items-center gap-1.5 flex-1 justify-start"
                >
                  <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="truncate">
                    {sections.find((s) => s.id === activeTab)?.label}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
                <SheetHeader className="pb-3 border-b text-left">
                  <SheetTitle className="text-base font-bold">Seções de Desenvolvimento</SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Engenharia de software, sprints, backlog, kanban e deploys
                  </SheetDescription>
                </SheetHeader>

                <div className="grid grid-cols-1 gap-2 py-4">
                  {sections.map((sec) => {
                    const Icon = sec.icon;
                    const isCurrent = activeTab === sec.id;
                    return (
                      <Button
                        key={sec.id}
                        type="button"
                        variant={isCurrent ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          setActiveTab(sec.id as any);
                          setFilterSheetOpen(false);
                        }}
                        className={`h-11 justify-start gap-2.5 text-xs rounded-xl ${
                          isCurrent ? 'bg-primary text-white font-bold' : ''
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {sec.label}
                      </Button>
                    );
                  })}
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Horizontal Section Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTEÚDO DA SEÇÃO ATIVA */}
      <div className="p-3.5 space-y-4">
        {activeTab === 'workspaces' && (
          <ProjetosDeliveryList
            projetosTecnicos={projetosTecnicos}
            backlogItems={backlogItems}
            bugs={bugs}
            sprints={sprints}
            onSelectProjeto={handleSelectProjeto}
          />
        )}

        {activeTab === 'dashboard' && (
          <DashboardExecutivoDelivery
            projetosTecnicos={projetosTecnicos}
            backlogItems={backlogItems}
            sprints={sprints}
            bugs={bugs}
            deploys={deploys}
            releases={releases}
          />
        )}

        {activeTab === 'workspace_individual' && selectedProjeto && (
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
        )}
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Projeto } from "@/features/projetos/types";
import { Cliente } from "@/features/clientes/types";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, 
  Layers, 
  FileCheck, 
  Package, 
  Zap, 
  Kanban, 
  TrendingUp, 
  Flag, 
  Users, 
  Clock, 
  FolderOpen, 
  FileCheck2, 
  ShieldAlert, 
  History, 
  BarChart3
} from "lucide-react";

import { ProjectWorkspaceHeader } from "@/features/projetos/workspace/components/ProjectWorkspaceHeader";
import { ProjectOverviewTab } from "@/features/projetos/workspace/components/ProjectOverviewTab";
import { ProjectRequisitosTab } from "@/features/projetos/workspace/components/ProjectRequisitosTab";
import { ProjectBacklogTab } from "@/features/projetos/workspace/components/ProjectBacklogTab";
import { ProjectSprintsTab } from "@/features/projetos/workspace/components/ProjectSprintsTab";
import { ProjectKanbanTab } from "@/features/projetos/workspace/components/ProjectKanbanTab";
import { ProjectRoadmapTab } from "@/features/projetos/workspace/components/ProjectRoadmapTab";
import { ProjectMilestonesTab } from "@/features/projetos/workspace/components/ProjectMilestonesTab";
import { ProjectEquipeTab } from "@/features/projetos/workspace/components/ProjectEquipeTab";
import { ProjectTimeTrackingTab } from "@/features/projetos/workspace/components/ProjectTimeTrackingTab";
import { ProjectDocumentosTab } from "@/features/projetos/workspace/components/ProjectDocumentosTab";
import { ProjectEntregasTab } from "@/features/projetos/workspace/components/ProjectEntregasTab";
import { ProjectRiscosTab } from "@/features/projetos/workspace/components/ProjectRiscosTab";
import { ProjectHistoricoTab } from "@/features/projetos/workspace/components/ProjectHistoricoTab";
import { ProjectRelatoriosTab } from "@/features/projetos/workspace/components/ProjectRelatoriosTab";

export const Route = createFileRoute("/projetos/$projetoId")({
  component: ProjetoWorkspacePage,
});

function ProjetoWorkspacePage() {
  const { projetoId } = Route.useParams();
  const { data: projetos = [] } = useLocalStorageState<Projeto[]>('focus_projetos', []);
  const { data: clientes = [] } = useLocalStorageState<Cliente[]>('focus_clientes', []);

  const [activeTab, setActiveTab] = useState('visaogeral');

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
  const clienteNome = cliente?.nomeFantasia || cliente?.razaoSocial || 'Cliente Corporativo';

  return (
    <div className="flex-1 space-y-6 p-4 sm:p-6 lg:p-8 pt-6 max-w-full overflow-x-hidden animate-fade-in">
      {/* 1. Header do Workspace */}
      <ProjectWorkspaceHeader projeto={projeto} clienteNome={clienteNome} />

      {/* 2. Menu de Navegação e Conteúdo do Workspace */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="visaogeral" className="gap-1.5 shrink-0 font-medium text-xs">
              <Layers className="w-3.5 h-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="requisitos" className="gap-1.5 shrink-0 font-medium text-xs">
              <FileCheck className="w-3.5 h-3.5" /> Requisitos
            </TabsTrigger>
            <TabsTrigger value="backlog" className="gap-1.5 shrink-0 font-medium text-xs">
              <Package className="w-3.5 h-3.5" /> Backlog
            </TabsTrigger>
            <TabsTrigger value="sprints" className="gap-1.5 shrink-0 font-medium text-xs">
              <Zap className="w-3.5 h-3.5" /> Sprints & Tasks
            </TabsTrigger>
            <TabsTrigger value="kanban" className="gap-1.5 shrink-0 font-medium text-xs">
              <Kanban className="w-3.5 h-3.5" /> Kanban
            </TabsTrigger>
            <TabsTrigger value="roadmap" className="gap-1.5 shrink-0 font-medium text-xs">
              <TrendingUp className="w-3.5 h-3.5" /> Roadmap
            </TabsTrigger>
            <TabsTrigger value="marcos" className="gap-1.5 shrink-0 font-medium text-xs">
              <Flag className="w-3.5 h-3.5" /> Marcos
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-1.5 shrink-0 font-medium text-xs">
              <Users className="w-3.5 h-3.5" /> Equipe
            </TabsTrigger>
            <TabsTrigger value="horas" className="gap-1.5 shrink-0 font-medium text-xs">
              <Clock className="w-3.5 h-3.5" /> Horas
            </TabsTrigger>
            <TabsTrigger value="documentos" className="gap-1.5 shrink-0 font-medium text-xs">
              <FolderOpen className="w-3.5 h-3.5" /> Documentação
            </TabsTrigger>
            <TabsTrigger value="entregas" className="gap-1.5 shrink-0 font-medium text-xs">
              <FileCheck2 className="w-3.5 h-3.5" /> Entregas
            </TabsTrigger>
            <TabsTrigger value="riscos" className="gap-1.5 shrink-0 font-medium text-xs">
              <ShieldAlert className="w-3.5 h-3.5" /> Riscos & Bloqueios
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-1.5 shrink-0 font-medium text-xs">
              <History className="w-3.5 h-3.5" /> Atividades
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-1.5 shrink-0 font-medium text-xs">
              <BarChart3 className="w-3.5 h-3.5" /> Relatórios
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB CONTENTS */}
        <TabsContent value="visaogeral" className="outline-none">
          <ProjectOverviewTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="requisitos" className="outline-none">
          <ProjectRequisitosTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="backlog" className="outline-none">
          <ProjectBacklogTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="sprints" className="outline-none">
          <ProjectSprintsTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="kanban" className="outline-none">
          <ProjectKanbanTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="roadmap" className="outline-none">
          <ProjectRoadmapTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="marcos" className="outline-none">
          <ProjectMilestonesTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="equipe" className="outline-none">
          <ProjectEquipeTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="horas" className="outline-none">
          <ProjectTimeTrackingTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="documentos" className="outline-none">
          <ProjectDocumentosTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="entregas" className="outline-none">
          <ProjectEntregasTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="riscos" className="outline-none">
          <ProjectRiscosTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="historico" className="outline-none">
          <ProjectHistoricoTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="relatorios" className="outline-none">
          <ProjectRelatoriosTab projeto={projeto} onNavigateTab={setActiveTab} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CrmDashboard } from "@/features/crm/components/CrmDashboard";
import { CrmKanbanView } from "@/features/crm/components/CrmKanbanView";
import { LeadsView } from "@/features/crm/components/LeadsView";
import { EmpresasContatosView } from "@/features/crm/components/EmpresasContatosView";
import { ClickUpConfigView } from "@/features/crm/components/ClickUpConfigView";
import { Target, LayoutGrid, Users, Building2, RefreshCw, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/crm")({
  component: ModuloCrmPage,
});

function ModuloCrmPage() {
  const [activeTab, setActiveTab] = useState("kanban");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Cabeçalho do Módulo CRM */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CRM & Pipeline Executivo</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Camada de gestão executiva integrada ao ClickUp em tempo real. Automação nativa para Clientes, Contratos e Financeiro.
          </p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <Tabs defaultValue="kanban" className="space-y-6 mt-2" onValueChange={setActiveTab}>
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="kanban" className="gap-2 text-orange-600 font-semibold shrink-0">
              <Target className="w-4 h-4" /> Pipeline (Kanban ClickUp)
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0">
              <LayoutGrid className="w-4 h-4" /> Dashboard CRM
            </TabsTrigger>
            <TabsTrigger value="leads" className="gap-2 shrink-0">
              <Users className="w-4 h-4" /> Leads & Scoring
            </TabsTrigger>
            <TabsTrigger value="empresas" className="gap-2 shrink-0">
              <Building2 className="w-4 h-4" /> Empresas & Decisores
            </TabsTrigger>
            <TabsTrigger value="clickup" className="gap-2 shrink-0">
              <RefreshCw className="w-4 h-4" /> ClickUp Engine & Logs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="kanban" className="space-y-4 outline-none">
          <CrmKanbanView />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <CrmDashboard />
        </TabsContent>

        <TabsContent value="leads" className="space-y-4 outline-none">
          <LeadsView />
        </TabsContent>

        <TabsContent value="empresas" className="space-y-4 outline-none">
          <EmpresasContatosView />
        </TabsContent>

        <TabsContent value="clickup" className="space-y-4 outline-none">
          <ClickUpConfigView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

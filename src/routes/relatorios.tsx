import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportDashboard } from "@/features/relatorios/components/ReportDashboard";
import { ReportCatalogView } from "@/features/relatorios/components/ReportCatalogView";
import { ReportGeneratorWizard } from "@/features/relatorios/components/ReportGeneratorWizard";
import { ReportHistoryView } from "@/features/relatorios/components/ReportHistoryView";
import { ReportSchedulesView } from "@/features/relatorios/components/ReportSchedulesView";
import { FileSpreadsheet, LayoutGrid, Wand2, Clock, Calendar, Sparkles, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/relatorios")({
  component: CentralRelatoriosPage,
});

function CentralRelatoriosPage() {
  const [activeTab, setActiveTab] = useState("catalogo");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Cabeçalho da Central de Relatórios */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shadow-sm">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Central de Relatórios</h1>
              <Badge variant="outline" className="border-orange-500/40 text-orange-600 font-semibold gap-1 bg-orange-50 dark:bg-orange-950/40">
                <ShieldCheck className="w-3.5 h-3.5" /> Enterprise Reporting Engine
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Mecanismo corporativo único para geração, padronização, agendamento e exportação de documentos do Focus Finance.
            </p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas Principais */}
      <Tabs defaultValue="catalogo" className="space-y-6 mt-2" onValueChange={setActiveTab}>
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="catalogo" className="gap-2 shrink-0">
              <FileSpreadsheet className="w-4 h-4" /> Catálogo de Relatórios
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0">
              <LayoutGrid className="w-4 h-4" /> Dashboard Executivo
            </TabsTrigger>
            <TabsTrigger value="wizard" className="gap-2 text-orange-600 font-semibold shrink-0">
              <Wand2 className="w-4 h-4" /> Gerador Wizard
            </TabsTrigger>
            <TabsTrigger value="historico" className="gap-2 shrink-0">
              <Clock className="w-4 h-4" /> Histórico & Auditoria
            </TabsTrigger>
            <TabsTrigger value="agendamentos" className="gap-2 shrink-0">
              <Calendar className="w-4 h-4" /> Agendamentos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <ReportDashboard />
        </TabsContent>

        <TabsContent value="catalogo" className="space-y-4 outline-none">
          <ReportCatalogView />
        </TabsContent>

        <TabsContent value="wizard" className="space-y-4 outline-none">
          <ReportGeneratorWizard />
        </TabsContent>

        <TabsContent value="historico" className="space-y-4 outline-none">
          <ReportHistoryView />
        </TabsContent>

        <TabsContent value="agendamentos" className="space-y-4 outline-none">
          <ReportSchedulesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

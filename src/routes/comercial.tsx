import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComercialDashboard } from "@/features/comercial/components/ComercialDashboard";
import { MinhaPerformanceView } from "@/features/comercial/components/MinhaPerformanceView";
import { EquipeComercialView } from "@/features/comercial/components/EquipeComercialView";
import { AtividadesContatosView } from "@/features/comercial/components/AtividadesContatosView";
import { MetasOkrsView } from "@/features/comercial/components/MetasOkrsView";
import { DocumentacaoComercialView } from "@/features/comercial/components/DocumentacaoComercialView";
import { CatalogosPrecosView } from "@/features/comercial/components/CatalogosPrecosView";
import { RelatoriosComerciaisView } from "@/features/comercial/components/RelatoriosComerciaisView";
import { 
  LayoutGrid, User, Users, Phone, Target, 
  Package, FileSpreadsheet, FolderOpen 
} from "lucide-react";

export const Route = createFileRoute("/comercial")({
  component: ModuloComercialOpsPage,
});

function ModuloComercialOpsPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* Cabeçalho Padrão do Módulo Comercial OS */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Comercial OS</h1>
        <p className="text-muted-foreground mt-2">
          Central operacional da equipe comercial para acompanhamento de performance, oportunidades, produtividade e estratégias de vendas.
        </p>
      </div>

      {/* Navegação por Abas Operacionais */}
      <Tabs defaultValue="dashboard" className="space-y-6" onValueChange={setActiveTab}>
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="dashboard" className="gap-2 shrink-0 font-medium">
              <LayoutGrid className="w-4 h-4" /> Dashboard Executivo
            </TabsTrigger>
            <TabsTrigger value="minha-performance" className="gap-2 shrink-0 font-medium">
              <User className="w-4 h-4" /> Minha Performance
            </TabsTrigger>
            <TabsTrigger value="atividades" className="gap-2 shrink-0 font-medium">
              <Phone className="w-4 h-4" /> Atividades & Contatos
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2 shrink-0 font-medium">
              <Users className="w-4 h-4" /> Time Comercial
            </TabsTrigger>
            <TabsTrigger value="metas" className="gap-2 shrink-0 font-medium">
              <Target className="w-4 h-4" /> Metas & OKRs
            </TabsTrigger>
            <TabsTrigger value="documentacao" className="gap-2 shrink-0 font-medium">
              <FolderOpen className="w-4 h-4" /> Documentação
            </TabsTrigger>
            <TabsTrigger value="catalogos" className="gap-2 shrink-0 font-medium">
              <Package className="w-4 h-4" /> Produtos & Serviços
            </TabsTrigger>
            <TabsTrigger value="relatorios" className="gap-2 shrink-0 font-medium">
              <FileSpreadsheet className="w-4 h-4" /> Relatórios
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <ComercialDashboard />
        </TabsContent>

        <TabsContent value="minha-performance" className="space-y-4 outline-none">
          <MinhaPerformanceView />
        </TabsContent>

        <TabsContent value="atividades" className="space-y-4 outline-none">
          <AtividadesContatosView />
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4 outline-none">
          <EquipeComercialView />
        </TabsContent>

        <TabsContent value="metas" className="space-y-4 outline-none">
          <MetasOkrsView />
        </TabsContent>

        <TabsContent value="documentacao" className="space-y-4 outline-none">
          <DocumentacaoComercialView />
        </TabsContent>

        <TabsContent value="catalogos" className="space-y-4 outline-none">
          <CatalogosPrecosView />
        </TabsContent>

        <TabsContent value="relatorios" className="space-y-4 outline-none">
          <RelatoriosComerciaisView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

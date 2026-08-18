import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ComercialDashboard } from "@/features/comercial/components/ComercialDashboard";
import { PropostasComerciaisView } from "@/features/comercial/components/PropostasComerciaisView";
import { EquipeComercialView } from "@/features/comercial/components/EquipeComercialView";
import { MetasOkrsView } from "@/features/comercial/components/MetasOkrsView";
import { CatalogosPrecosView } from "@/features/comercial/components/CatalogosPrecosView";
import { ShoppingBag, LayoutGrid, FileText, Users, Target, Package, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/comercial")({
  component: ModuloComercialPage,
});

function ModuloComercialPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Cabeçalho do Módulo Comercial */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão Comercial</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestão operacional do departamento comercial: equipe, metas, OKRs, comissões, catálogo de produtos/serviços e propostas.
          </p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <Tabs defaultValue="dashboard" className="space-y-6 mt-2" onValueChange={setActiveTab}>
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="dashboard" className="gap-2 shrink-0">
              <LayoutGrid className="w-4 h-4" /> Dashboard Executivo
            </TabsTrigger>
            <TabsTrigger value="propostas" className="gap-2 text-orange-600 font-semibold shrink-0">
              <FileText className="w-4 h-4" /> Propostas Comerciais
            </TabsTrigger>
            <TabsTrigger value="equipe" className="gap-2 shrink-0">
              <Users className="w-4 h-4" /> Time Comercial
            </TabsTrigger>
            <TabsTrigger value="metas" className="gap-2 shrink-0">
              <Target className="w-4 h-4" /> Metas & OKRs
            </TabsTrigger>
            <TabsTrigger value="catalogos" className="gap-2 shrink-0">
              <Package className="w-4 h-4" /> Catálogo & Preços
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <ComercialDashboard />
        </TabsContent>

        <TabsContent value="propostas" className="space-y-4 outline-none">
          <PropostasComerciaisView />
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4 outline-none">
          <EquipeComercialView />
        </TabsContent>

        <TabsContent value="metas" className="space-y-4 outline-none">
          <MetasOkrsView />
        </TabsContent>

        <TabsContent value="catalogos" className="space-y-4 outline-none">
          <CatalogosPrecosView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

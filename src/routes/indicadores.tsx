import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeralTab } from "@/features/indicadores/components/VisaoGeralTab";
import { MetricasSaaSTab } from "@/features/indicadores/components/MetricasSaaSTab";
import { ProjetosTab } from "@/features/indicadores/components/ProjetosTab";
import { ComercialTab } from "@/features/indicadores/components/ComercialTab";
import { FinanceiroTab } from "@/features/indicadores/components/FinanceiroTab";
import { LineChart, Rocket, Activity, Briefcase, Users, Wallet } from "lucide-react";

export const Route = createFileRoute("/indicadores")({
  component: IndicadoresPage,
});

function IndicadoresPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <LineChart className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Indicadores Estratégicos (KPIs)</h1>
          <p className="text-muted-foreground mt-1">
            Centro de inteligência gerencial e performance da operação.
          </p>
        </div>
      </div>

      <Tabs defaultValue="saas" className="space-y-6 mt-4">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <TabsList className="flex flex-wrap w-full bg-muted/50 p-1 h-auto">
            <TabsTrigger value="saas" className="gap-2 flex-1 min-w-[120px]">
              <Rocket className="w-4 h-4" /> SaaS
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2 flex-1 min-w-[120px]">
              <Wallet className="w-4 h-4" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="projetos" className="gap-2 flex-1 min-w-[120px]">
              <Briefcase className="w-4 h-4" /> Projetos
            </TabsTrigger>
            <TabsTrigger value="comercial" className="gap-2 flex-1 min-w-[120px]">
              <Users className="w-4 h-4" /> Clientes
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 flex-1 min-w-[200px]">
              <Activity className="w-4 h-4" /> Visão Global (C-Level)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="saas" className="space-y-4 outline-none">
          <MetricasSaaSTab />
        </TabsContent>
        
        <TabsContent value="financeiro" className="space-y-4 outline-none">
          <FinanceiroTab />
        </TabsContent>

        <TabsContent value="projetos" className="space-y-4 outline-none">
          <ProjetosTab />
        </TabsContent>

        <TabsContent value="comercial" className="space-y-4 outline-none">
          <ComercialTab />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <VisaoGeralTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

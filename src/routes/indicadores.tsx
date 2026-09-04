import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VisaoGeralTab } from "@/features/indicadores/components/VisaoGeralTab";
import { MetricasSaaSTab } from "@/features/indicadores/components/MetricasSaaSTab";
import { ProjetosTab } from "@/features/indicadores/components/ProjetosTab";
import { ComercialTab } from "@/features/indicadores/components/ComercialTab";
import { FinanceiroTab } from "@/features/indicadores/components/FinanceiroTab";
import { RhTab } from "@/features/indicadores/components/RhTab";
import { FornecedoresTab } from "@/features/indicadores/components/FornecedoresTab";
import { ClientesTab } from "@/features/indicadores/components/ClientesTab";
import { 
  Settings, Activity, Briefcase, Users, Wallet, 
  Target, Building2, UserCheck 
} from "lucide-react";

export const Route = createFileRoute("/indicadores")({
  component: IndicadoresPage,
});

function IndicadoresPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Indicadores Estratégicos (KPIs)</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Centro de inteligência gerencial e performance integrada de toda a operação.
        </p>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6 mt-2">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="dashboard" className="gap-2 shrink-0">
              <Activity className="w-4 h-4" /> Visão Global (C-Level)
            </TabsTrigger>
            <TabsTrigger value="financeiro" className="gap-2 shrink-0">
              <Wallet className="w-4 h-4" /> Financeiro
            </TabsTrigger>
            <TabsTrigger value="comercial" className="gap-2 shrink-0">
              <Target className="w-4 h-4" /> Comercial
            </TabsTrigger>
            <TabsTrigger value="rh" className="gap-2 shrink-0">
              <Users className="w-4 h-4" /> Recursos Humanos
            </TabsTrigger>
            <TabsTrigger value="fornecedores" className="gap-2 shrink-0">
              <Building2 className="w-4 h-4" /> Fornecedores
            </TabsTrigger>
            <TabsTrigger value="clientes" className="gap-2 shrink-0">
              <UserCheck className="w-4 h-4" /> Clientes
            </TabsTrigger>
            <TabsTrigger value="softwares" className="gap-2 shrink-0">
              <Settings className="w-4 h-4" /> Softwares
            </TabsTrigger>
            <TabsTrigger value="projetos" className="gap-2 shrink-0">
              <Briefcase className="w-4 h-4" /> Projetos
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <VisaoGeralTab />
        </TabsContent>

        <TabsContent value="financeiro" className="space-y-4 outline-none">
          <FinanceiroTab />
        </TabsContent>

        <TabsContent value="comercial" className="space-y-4 outline-none">
          <ComercialTab />
        </TabsContent>

        <TabsContent value="rh" className="space-y-4 outline-none">
          <RhTab />
        </TabsContent>

        <TabsContent value="fornecedores" className="space-y-4 outline-none">
          <FornecedoresTab />
        </TabsContent>

        <TabsContent value="clientes" className="space-y-4 outline-none">
          <ClientesTab />
        </TabsContent>

        <TabsContent value="softwares" className="space-y-4 outline-none">
          <MetricasSaaSTab />
        </TabsContent>
        
        <TabsContent value="projetos" className="space-y-4 outline-none">
          <ProjetosTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

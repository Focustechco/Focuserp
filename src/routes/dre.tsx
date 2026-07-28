import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/dre/components/Dashboard";
import { DreTable } from "@/features/dre/components/DreTable";
import { Calculator } from "lucide-react";

export const Route = createFileRoute("/dre")({
  component: DrePage,
});

function DrePage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Calculator className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">DRE Gerencial</h1>
          <p className="text-muted-foreground mt-1">
            Demonstração do Resultado do Exercício consolidada em tempo real.
          </p>
        </div>
      </div>

      <Tabs defaultValue="tabela" className="space-y-6 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px] bg-muted/50 p-1">
            <TabsTrigger value="tabela">DRE Principal</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard Executivo</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tabela" className="space-y-4 outline-none">
          <DreTable />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

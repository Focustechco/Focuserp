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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">DRE Gerencial</h1>
        <p className="text-muted-foreground mt-1">
          Demonstração do Resultado do Exercício consolidada em tempo real.
        </p>
      </div>

      <Tabs defaultValue="tabela" className="space-y-6 mt-4">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="tabela" className="shrink-0">DRE Principal</TabsTrigger>
            <TabsTrigger value="dashboard" className="shrink-0">Dashboard Executivo</TabsTrigger>
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

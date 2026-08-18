import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/centro-de-custos/components/Dashboard";
import { CentroCustosList } from "@/features/centro-de-custos/components/CentroCustosList";

export const Route = createFileRoute("/centro-de-custos")({
  component: CentroCustosPage,
});

function CentroCustosPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Centro de Custos</h1>
        <p className="text-muted-foreground mt-2">
          Estrutura organizacional de classificação financeira para receitas, despesas, departamentos e projetos.
        </p>
      </div>

      <Tabs defaultValue="lista" className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="lista" className="shrink-0">Explorar Estrutura</TabsTrigger>
            <TabsTrigger value="dashboard" className="shrink-0">Visão Geral</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="lista" className="space-y-4 outline-none">
          <CentroCustosList />
        </TabsContent>
      <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

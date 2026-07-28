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
        <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
          
          <TabsTrigger value="lista">Explorar Estrutura</TabsTrigger>
          <TabsTrigger value="dashboard">Visão Geral</TabsTrigger>
        </TabsList>
        
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

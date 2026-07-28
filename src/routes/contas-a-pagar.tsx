import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/contas-pagar/components/Dashboard";
import { ContasList } from "@/features/contas-pagar/components/ContasList";

export const Route = createFileRoute("/contas-a-pagar")({
  component: ContasPagarPage,
});

function ContasPagarPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie despesas, fornecedores, pagamentos e obrigações financeiras.
        </p>
      </div>

      <Tabs defaultValue="despesas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          
          <TabsTrigger value="despesas">Despesas</TabsTrigger>
          <TabsTrigger value="relatorios">Relatórios</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="despesas" className="space-y-4 outline-none">
          <ContasList />
        </TabsContent>
        <TabsContent value="relatorios" className="space-y-4 outline-none">
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <h3 className="mt-4 text-lg font-semibold">Relatórios de Despesas</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Em breve você poderá exportar PDF e Excel detalhados dos seus pagamentos.
              </p>
            </div>
          </div>
        </TabsContent>
      <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/contas-receber/components/Dashboard";
import { RecebimentosList } from "@/features/contas-receber/components/RecebimentosList";

export const Route = createFileRoute("/contas-a-receber")({
  component: ContasReceberPage,
});

function ContasReceberPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contas a Receber</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie todos os títulos, recebimentos, parcelamentos e recorrências.
        </p>
      </div>

      <Tabs defaultValue="titulos" className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="titulos" className="shrink-0">Títulos</TabsTrigger>
            <TabsTrigger value="relatorios" className="shrink-0">Relatórios</TabsTrigger>
            <TabsTrigger value="dashboard" className="shrink-0">Dashboard</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="titulos" className="space-y-4 outline-none">
          <RecebimentosList />
        </TabsContent>
        <TabsContent value="relatorios" className="space-y-4 outline-none">
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <h3 className="mt-4 text-lg font-semibold">Relatórios de Receitas</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Em breve você poderá exportar PDF e Excel detalhados dos seus recebimentos.
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

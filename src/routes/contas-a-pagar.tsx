import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/contas-pagar/components/Dashboard";
import { ContasList } from "@/features/contas-pagar/components/ContasList";
import { PagamentosFuturosTab } from "@/features/contas-pagar/components/PagamentosFuturosTab";
import { MobileContasPagarView } from "@/features/contas-pagar/components/MobileContasPagarView";
import { Clock } from "lucide-react";

export const Route = createFileRoute("/contas-a-pagar")({
  component: ContasPagarPage,
});

function ContasPagarPage() {
  return (
    <>
      <div className="md:hidden">
        <MobileContasPagarView />
      </div>
      <div className="hidden md:flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contas a Pagar</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie despesas, fornecedores, pagamentos, parcelamentos e recorrências.
          </p>
        </div>

        <Tabs defaultValue="despesas" className="space-y-6">
          <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
            <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
              <TabsTrigger value="despesas" className="shrink-0">Despesas Emitidas</TabsTrigger>
              <TabsTrigger value="futuros" className="shrink-0 gap-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-orange-500" />
                Pagamentos Futuros
              </TabsTrigger>
              <TabsTrigger value="relatorios" className="shrink-0">Relatórios</TabsTrigger>
              <TabsTrigger value="dashboard" className="shrink-0">Dashboard</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="despesas" className="space-y-4 outline-none">
            <ContasList />
          </TabsContent>

          <TabsContent value="futuros" className="space-y-4 outline-none">
            <PagamentosFuturosTab />
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
    </>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/conciliacao/components/Dashboard";
import { ConciliacaoList } from "@/features/conciliacao/components/ConciliacaoList";
import { ImportarExtrato } from "@/features/conciliacao/components/ImportarExtrato";
import { DivergenciasList } from "@/features/conciliacao/components/DivergenciasList";
import { ContasBancariasList } from "@/features/conciliacao/components/ContasBancariasList";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/conciliacao")({
  component: ConciliacaoPage,
});

function ConciliacaoPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h1>
        <p className="text-muted-foreground mt-1">
          Validação oficial entre os extratos bancários e os lançamentos financeiros do sistema.
        </p>
      </div>

      <Tabs defaultValue="conciliacao" className="space-y-6 mt-4">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="conciliacao" className="text-primary font-medium shrink-0">Conciliar (Lado a Lado)</TabsTrigger>
            <TabsTrigger value="divergencias" className="shrink-0">Divergências</TabsTrigger>
            <TabsTrigger value="importar" className="shrink-0">Importar Extrato</TabsTrigger>
            <TabsTrigger value="contas" className="shrink-0">Contas Bancárias</TabsTrigger>
            <TabsTrigger value="dashboard" className="shrink-0">Dashboard</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="conciliacao" className="space-y-4 outline-none">
          <ConciliacaoList />
        </TabsContent>

        <TabsContent value="divergencias" className="space-y-4 outline-none">
          <DivergenciasList />
        </TabsContent>

        <TabsContent value="importar" className="space-y-4 outline-none">
          <ImportarExtrato />
        </TabsContent>

        <TabsContent value="contas" className="space-y-4 outline-none">
          <ContasBancariasList />
        </TabsContent>
      <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

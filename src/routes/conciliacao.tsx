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
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Scale className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h1>
          <p className="text-muted-foreground mt-1">
            Validação oficial entre os extratos bancários e os lançamentos financeiros do sistema.
          </p>
        </div>
      </div>

      <Tabs defaultValue="conciliacao" className="space-y-6 mt-4">
        <TabsList className="grid w-full grid-cols-5 lg:w-[800px] bg-muted/50 p-1">
          
          <TabsTrigger value="conciliacao" className="text-primary font-medium">Conciliar (Lado a Lado)</TabsTrigger>
          <TabsTrigger value="divergencias">Divergências</TabsTrigger>
          <TabsTrigger value="importar">Importar Extrato</TabsTrigger>
          <TabsTrigger value="contas">Contas Bancárias</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

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

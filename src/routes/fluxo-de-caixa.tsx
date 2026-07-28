import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/fluxo-caixa/components/Dashboard";
import { FluxoTimeline } from "@/features/fluxo-caixa/components/FluxoTimeline";
import { ProjecoesSection } from "@/features/fluxo-caixa/components/ProjecoesSection";
import { ComparativoSection } from "@/features/fluxo-caixa/components/ComparativoSection";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export const Route = createFileRoute("/fluxo-de-caixa")({
  component: FluxoCaixaPage,
});

function FluxoCaixaPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Fluxo de Caixa</h1>
        <p className="text-muted-foreground mt-2">
          Visão consolidada do saldo, projeções preditivas, comparativo previsto vs. realizado e histórico financeiro.
        </p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Visualização Consolidada Automática</AlertTitle>
        <AlertDescription>
          O fluxo de caixa é alimentado e atualizado automaticamente em tempo real pelos módulos de Contas a Receber e Contas a Pagar.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="extrato" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-[550px]">
          <TabsTrigger value="extrato">Extrato / Timeline</TabsTrigger>
          <TabsTrigger value="projecoes">Projeções</TabsTrigger>
          <TabsTrigger value="comparativo">Comparativo</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="extrato" className="space-y-4 outline-none">
          <FluxoTimeline />
        </TabsContent>
        <TabsContent value="projecoes" className="space-y-4 outline-none">
          <ProjecoesSection />
        </TabsContent>
        <TabsContent value="comparativo" className="space-y-4 outline-none">
          <ComparativoSection />
        </TabsContent>
        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

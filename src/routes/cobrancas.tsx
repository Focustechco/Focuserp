import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/cobrancas/components/Dashboard";
import { CobrancasList } from "@/features/cobrancas/components/CobrancasList";

export const Route = createFileRoute("/cobrancas")({
  component: CobrancasPage,
});

function CobrancasPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Cobranças Automáticas</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie o envio de cobranças por WhatsApp, E-mail e SMS, acompanhando entrega, leitura e pagamentos.
        </p>
      </div>

      <Tabs defaultValue="cobrancas" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
          
          <TabsTrigger value="cobrancas">Cobranças</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>
        
        <TabsContent value="cobrancas" className="space-y-4 outline-none">
          <CobrancasList />
        </TabsContent>
        <TabsContent value="historico" className="space-y-4 outline-none">
          <div className="flex h-[450px] shrink-0 items-center justify-center rounded-md border border-dashed">
            <div className="mx-auto flex max-w-[420px] flex-col items-center justify-center text-center">
              <h3 className="mt-4 text-lg font-semibold">Histórico de Interações</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">
                Em breve você poderá visualizar a timeline global de mensagens enviadas e respostas recebidas.
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

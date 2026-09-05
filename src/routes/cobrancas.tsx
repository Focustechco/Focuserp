import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/cobrancas/components/Dashboard";
import { CobrancasList } from "@/features/cobrancas/components/CobrancasList";
import { HistoricoInteracoes } from "@/features/cobrancas/components/HistoricoInteracoes";
import { Send, History, BarChart3 } from "lucide-react";

export const Route = createFileRoute("/cobrancas")({
  component: CobrancasPage,
});

function CobrancasPage() {
  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-7xl mx-auto w-full">
      <div className="hidden md:block">
        <h1 className="text-3xl font-bold tracking-tight">Cobranças Multicanal</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie o disparo inteligente de cobranças por WhatsApp, E-mail e SMS, acompanhando entregas, respostas e quitações em tempo real.
        </p>
      </div>

      <Tabs defaultValue="cobrancas" className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="cobrancas" className="shrink-0 gap-1.5 font-medium">
              <Send className="w-4 h-4 text-primary" /> Cobranças
            </TabsTrigger>
            <TabsTrigger value="historico" className="shrink-0 gap-1.5">
              <History className="w-4 h-4" /> Histórico & Interações
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="shrink-0 gap-1.5">
              <BarChart3 className="w-4 h-4" /> Dashboard
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="cobrancas" className="space-y-4 outline-none">
          <CobrancasList />
        </TabsContent>
        
        <TabsContent value="historico" className="space-y-4 outline-none">
          <HistoricoInteracoes />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

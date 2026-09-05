import { createFileRoute } from "@tanstack/react-router";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { 
  Megaphone, 
  LayoutDashboard, 
  Target, 
  CalendarDays, 
  PenTool, 
  Share2, 
  MousePointerClick, 
  Palette, 
} from "lucide-react";
import { MarketingDashboard } from "@/features/marketing/components/MarketingDashboard";
import { AgendaMarketingView } from "@/features/marketing/components/AgendaMarketingView";
import { CalendarioEditorialView } from "@/features/marketing/components/CalendarioEditorialView";
import { TrafegoPagoView } from "@/features/marketing/components/TrafegoPagoView";
import { CampanhasMarketingView } from "@/features/marketing/components/CampanhasMarketingView";
import { AtivosMidiaView } from "@/features/marketing/components/AtivosMidiaView";
import { RedesSociaisView } from "@/features/marketing/components/RedesSociaisView";
import { PlanejamentoEstrategicoView } from "@/features/marketing/components/PlanejamentoEstrategicoView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/marketing")({
  component: MarketingRoute,
});

function MarketingRoute() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      <div className="flex items-center justify-between space-y-2 shrink-0">
        <div className="hidden md:block">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Marketing Ops
          </h2>
          <p className="text-muted-foreground">
            Central de Operações de Marketing e Crescimento
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="w-full whitespace-nowrap shrink-0 border-b pb-0">
          <TabsList className="w-full justify-start rounded-none h-auto p-0 bg-transparent gap-4 inline-flex">
            <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 pt-0 gap-2">
              <LayoutDashboard className="w-4 h-4"/>Executivo
            </TabsTrigger>
            <TabsTrigger value="estrategico" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 pt-0 gap-2">
              <Target className="w-4 h-4"/>Planejamento
            </TabsTrigger>
            <TabsTrigger value="campanhas" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 pt-0 gap-2">
              <Megaphone className="w-4 h-4"/>Campanhas
            </TabsTrigger>
            <TabsTrigger value="conteudo" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 pt-0 gap-2">
              <PenTool className="w-4 h-4"/>Conteúdo
            </TabsTrigger>
            <TabsTrigger value="agenda" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 pt-0 gap-2">
              <CalendarDays className="w-4 h-4"/>Agenda
            </TabsTrigger>
            <TabsTrigger value="sociais" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 pt-0 gap-2">
              <Share2 className="w-4 h-4"/>Redes Sociais
            </TabsTrigger>
            <TabsTrigger value="trafego" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 pt-0 gap-2">
              <MousePointerClick className="w-4 h-4"/>Tráfego Pago
            </TabsTrigger>
            <TabsTrigger value="brand" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-2 pb-2 pt-0 gap-2">
              <Palette className="w-4 h-4"/>Brand Center
            </TabsTrigger>
          </TabsList>
          <ScrollBar orientation="horizontal" className="invisible" />
        </ScrollArea>

        <ScrollArea className="flex-1 mt-4 pr-4">
          <TabsContent value="dashboard" className="m-0">
            <MarketingDashboard />
          </TabsContent>

          <TabsContent value="estrategico" className="m-0">
            <PlanejamentoEstrategicoView />
          </TabsContent>

          <TabsContent value="campanhas" className="m-0">
            <CampanhasMarketingView />
          </TabsContent>

          {/* Conteúdo agora inclui Editorial + Mídia internamente */}
          <TabsContent value="conteudo" className="m-0">
            <CalendarioEditorialView />
          </TabsContent>

          <TabsContent value="agenda" className="m-0">
            <AgendaMarketingView />
          </TabsContent>

          <TabsContent value="sociais" className="m-0">
            <RedesSociaisView />
          </TabsContent>

          {/* Tráfego Pago agora inclui SEO internamente */}
          <TabsContent value="trafego" className="m-0">
            <TrafegoPagoView />
          </TabsContent>

          <TabsContent value="brand" className="m-0">
            <AtivosMidiaView />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

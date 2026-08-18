import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/agenda/components/Dashboard";
import { AgendaTimeline } from "@/features/agenda/components/AgendaTimeline";
import { CalendarioGrid } from "@/features/agenda/components/CalendarioGrid";
import { DetalheEventoSheet } from "@/features/agenda/components/DetalheEventoSheet";
import { NovoEventoAgendaSheet } from "@/features/agenda/components/NovoEventoAgendaSheet";
import { CalendarDays, LayoutList, Calendar, MapPin, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventoFinanceiro } from "@/features/agenda/types";

export const Route = createFileRoute("/agenda")({
  component: AgendaPage,
});

function AgendaPage() {
  const [selectedEvent, setSelectedEvent] = useState<EventoFinanceiro | null>(null);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Agenda Financeira</h1>
          <p className="text-muted-foreground mt-1">
            Calendário inteligente agregando Títulos, Projetos, Contratos e Impostos automaticamente.
          </p>
        </div>

        <NovoEventoAgendaSheet>
          <Button className="gap-2">
            <Plus className="w-4 h-4" /> Novo Evento / Lembrete
          </Button>
        </NovoEventoAgendaSheet>
      </div>

      <Tabs defaultValue="mensal" className="space-y-6 mt-4">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="timeline" className="gap-2 shrink-0">
              <LayoutList className="w-4 h-4" /> Lista / Timeline
            </TabsTrigger>
            <TabsTrigger value="mensal" className="gap-2 text-primary font-medium shrink-0">
              <Calendar className="w-4 h-4" /> Calendário Mensal
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0">
              <MapPin className="w-4 h-4" /> Dashboard
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="timeline" className="space-y-4 outline-none">
          <AgendaTimeline />
        </TabsContent>

        <TabsContent value="mensal" className="space-y-4 outline-none">
          <CalendarioGrid onEventClick={setSelectedEvent} />
        </TabsContent>
        
        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>

      {/* Painel Lateral de Detalhamento Read-Only */}
      <DetalheEventoSheet 
        evento={selectedEvent} 
        isOpen={!!selectedEvent} 
        onClose={() => setSelectedEvent(null)} 
      />
    </div>
  );
}

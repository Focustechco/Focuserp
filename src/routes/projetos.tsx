import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/projetos/components/Dashboard";
import { ProjetosList } from "@/features/projetos/components/ProjetosList";
import { AgendaProjetosScreen } from "@/features/projetos/agenda/AgendaProjetosScreen";
import { MobileProjetosView } from "@/features/projetos/components/MobileProjetosView";

export const Route = createFileRoute("/projetos")({
  component: ProjetosPage,
});

function ProjetosPage() {
  return (
    <>
      {/* Visualização Mobile Otimizada */}
      <div className="md:hidden">
        <MobileProjetosView />
      </div>

      {/* Visualização Desktop */}
      <div className="hidden md:flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-7xl mx-auto w-full">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Projetos (PMO)</h1>
          <p className="text-muted-foreground mt-2">
            Central operacional para acompanhamento de escopo, cronograma, entregas, horas e status dos projetos.
          </p>
        </div>

        <Tabs defaultValue="lista" className="space-y-6">
          <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
            <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
              <TabsTrigger value="lista" className="shrink-0">Lista de Projetos</TabsTrigger>
              <TabsTrigger value="agenda" className="shrink-0">Agenda de Entregas</TabsTrigger>
              <TabsTrigger value="dashboard" className="shrink-0">Dashboard</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="lista" className="space-y-4 outline-none">
            <ProjetosList />
          </TabsContent>
          <TabsContent value="agenda" className="space-y-4 outline-none">
            <AgendaProjetosScreen />
          </TabsContent>
          <TabsContent value="dashboard" className="space-y-4 outline-none">
            <Dashboard />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

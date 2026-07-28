import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/projetos/components/Dashboard";
import { ProjetosList } from "@/features/projetos/components/ProjetosList";
import { AgendaProjetosScreen } from "@/features/projetos/agenda/AgendaProjetosScreen";

export const Route = createFileRoute("/projetos")({
  component: ProjetosPage,
});

function ProjetosPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Projetos (PMO)</h1>
        <p className="text-muted-foreground mt-2">
          Central operacional para acompanhamento de escopo, cronograma, entregas, horas e status dos projetos.
        </p>
      </div>

      <Tabs defaultValue="lista" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[500px]">
          <TabsTrigger value="lista">Lista de Projetos</TabsTrigger>
          <TabsTrigger value="agenda">Agenda de Entregas</TabsTrigger>
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
        </TabsList>

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
  );
}

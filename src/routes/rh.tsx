import { createFileRoute } from "@tanstack/react-router";
import { RhDashboard } from "@/features/rh/components/RhDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColaboradoresTable } from "@/features/rh/components/ColaboradoresTable";
import { OrganogramaView } from "@/features/rh/components/OrganogramaView";
import { ColaboradorSheet } from "@/features/rh/components/ColaboradorSheet";
import { Users, PieChart } from "lucide-react";
import { useState } from "react";
import { Colaborador } from "@/features/rh/types";

export const Route = createFileRoute("/rh")({
  component: RouteComponent,
});

function RouteComponent() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [colabParaEditar, setColabParaEditar] = useState<Colaborador | null>(null);

  const handleNewClick = () => {
    setColabParaEditar(null);
    setSheetOpen(true);
  };

  const handleEditClick = (colab: Colaborador) => {
    setColabParaEditar(colab);
    setSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-6 max-w-full overflow-x-hidden">
      <div>
        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">Recursos Humanos & Gestão de Pessoas</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Visão executiva do quadro de colaboradores e folha salarial.
        </p>
      </div>
      
      <Tabs defaultValue="dashboard" className="space-y-4">
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="dashboard" className="gap-2 shrink-0"><PieChart className="w-4 h-4" /> Painel Executivo</TabsTrigger>
            <TabsTrigger value="diretorio" className="gap-2 shrink-0"><Users className="w-4 h-4" /> Diretório & Organograma</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <RhDashboard />
        </TabsContent>

        <TabsContent value="diretorio" className="space-y-4">
          <Tabs defaultValue="lista" className="space-y-4">
            <div className="flex justify-end">
              <TabsList className="grid w-[300px] grid-cols-2">
                <TabsTrigger value="lista">Lista de Colaboradores</TabsTrigger>
                <TabsTrigger value="arvore">Organograma</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="lista">
              <ColaboradoresTable 
                onNewClick={handleNewClick} 
                onEditClick={handleEditClick} 
              />
            </TabsContent>
            <TabsContent value="arvore">
              <OrganogramaView />
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>

      <ColaboradorSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        colaboradorParaEditar={colabParaEditar}
      />
    </div>
  );
}

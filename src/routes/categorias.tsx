import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/plano-contas/components/Dashboard";
import { PlanoContasList } from "@/features/plano-contas/components/PlanoContasList";
import { Layers, MapPin, ListTree, Network } from "lucide-react";

import { OrganogramaTree } from "@/features/plano-contas/components/OrganogramaTree";

export const Route = createFileRoute("/categorias")({
  component: PlanoContasPage,
});

function PlanoContasPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Plano de Contas</h1>
        <p className="text-muted-foreground mt-1">
          Categorização hierárquica e contábil de receitas e despesas gerenciais.
        </p>
      </div>

      <Tabs defaultValue="arvore" className="space-y-6 mt-4">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="arvore" className="gap-2 text-primary font-medium shrink-0">
              <ListTree className="w-4 h-4" /> Estrutura em Árvore
            </TabsTrigger>
            <TabsTrigger value="organograma" className="gap-2 shrink-0">
              <Network className="w-4 h-4" /> Organograma
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0">
              <MapPin className="w-4 h-4" /> Dashboard
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="arvore" className="space-y-4 outline-none">
          <PlanoContasList />
        </TabsContent>

        <TabsContent value="organograma" className="space-y-4 outline-none">
          <OrganogramaTree />
        </TabsContent>
      <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

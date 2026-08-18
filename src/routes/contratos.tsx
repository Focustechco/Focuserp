import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/contratos/components/Dashboard";
import { ContratosList } from "@/features/contratos/components/ContratosList";

export const Route = createFileRoute("/contratos")({
  component: ContratosPage,
});

function ContratosPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contratos (CLM)</h1>
        <p className="text-muted-foreground mt-2">
          Gestão centralizada do ciclo de vida de contratos com clientes, fornecedores e parceiros.
        </p>
      </div>

      <Tabs defaultValue="lista" className="space-y-6">
        <div className="overflow-x-auto scrollbar-hide border-b w-full">
          <TabsList className="w-max min-w-full justify-start h-auto p-0 bg-transparent flex-nowrap pb-1">
            <TabsTrigger value="lista" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 shrink-0">Todos os Contratos</TabsTrigger>
            <TabsTrigger value="clientes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 shrink-0">Clientes</TabsTrigger>
            <TabsTrigger value="focus" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 shrink-0">Focus Tecnologia Ltda</TabsTrigger>
            <TabsTrigger value="dashboard" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-3 shrink-0">Dashboard Executivo</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="lista" className="space-y-4 outline-none">
          <ContratosList />
        </TabsContent>
        <TabsContent value="clientes" className="space-y-4 outline-none">
          <ContratosList filterEntidade={['Cliente', 'Projeto']} />
        </TabsContent>
        <TabsContent value="focus" className="space-y-4 outline-none">
          <ContratosList filterEntidade={['Fornecedor', 'Parceiro', 'Colaborador', 'Focus Tecnologia']} />
        </TabsContent>
      <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

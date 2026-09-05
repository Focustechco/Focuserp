import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dashboard } from "@/features/contratos/components/Dashboard";
import { ContratosList } from "@/features/contratos/components/ContratosList";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Contrato } from "@/features/contratos/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/contratos")({
  component: ContratosPage,
});

function ContratosPage() {
  const { data: contratos = [] } = useLocalStorageState<Contrato>('focus_contratos', []);

  // Contagem para as abas
  const countClientes = contratos.filter(c => 
    c.titularidade === 'Cliente' || 
    c.entidadeVinculo === 'Cliente' || 
    (c.clienteId && c.entidadeVinculo !== 'Focus Tecnologia' && c.categoria !== 'Despesa')
  ).length;

  const countFocus = contratos.filter(c => 
    c.titularidade === 'Focus Tecnologia' || 
    c.entidadeVinculo === 'Focus Tecnologia' || 
    c.entidadeVinculo === 'Fornecedor' || 
    c.entidadeVinculo === 'Parceiro' || 
    c.entidadeVinculo === 'Interno' || 
    c.categoria === 'Despesa' || 
    c.categoria === 'Interno'
  ).length;

  return (
    <div className="flex flex-col gap-4 sm:gap-6 p-3 sm:p-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="hidden md:block">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">Contratos (CLM)</h1>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1 max-w-2xl">
          Gestão centralizada do ciclo de vida de contratos com clientes, fornecedores e parceiros da Focus Tecnologia Ltda.
        </p>
      </div>

      <Tabs defaultValue="lista" className="space-y-6">
        <div className="overflow-x-auto scrollbar-hide border-b w-full">
          <TabsList className="w-max min-w-full justify-start h-auto p-0 bg-transparent flex-nowrap pb-1">
            <TabsTrigger 
              value="lista" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none px-4 py-3 shrink-0 text-xs sm:text-sm gap-2"
            >
              Todos os Contratos
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {contratos.length}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger 
              value="clientes" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none px-4 py-3 shrink-0 text-xs sm:text-sm gap-2"
            >
              Clientes
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300">
                {countClientes}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger 
              value="focus" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none px-4 py-3 shrink-0 text-xs sm:text-sm gap-2"
            >
              Focus Tecnologia Ltda
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300">
                {countFocus}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger 
              value="dashboard" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-orange-600 rounded-none px-4 py-3 shrink-0 text-xs sm:text-sm"
            >
              Dashboard Executivo
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="lista" className="space-y-4 outline-none">
          <ContratosList filterTitularidade="Todos" />
        </TabsContent>
        <TabsContent value="clientes" className="space-y-4 outline-none">
          <ContratosList filterTitularidade="Cliente" />
        </TabsContent>
        <TabsContent value="focus" className="space-y-4 outline-none">
          <ContratosList filterTitularidade="Focus Tecnologia" />
        </TabsContent>
        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <Dashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UsuariosDashboard } from "@/features/usuarios/components/UsuariosDashboard";
import { UsuariosTable } from "@/features/usuarios/components/UsuariosTable";
import { Shield, Users, Activity } from "lucide-react";

export const Route = createFileRoute("/usuarios")({
  component: UsuariosPage,
});

function UsuariosPage() {
  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Governança e Acessos (IAM)</h1>
          <p className="text-muted-foreground mt-1">
            Gestão centralizada de identidade, permissões e segurança corporativa.
          </p>
        </div>
      </div>

      <Tabs defaultValue="tabela" className="space-y-6 mt-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="grid w-full grid-cols-2 lg:w-[450px] bg-muted/50 p-1">
            <TabsTrigger value="tabela" className="gap-2">
              <Users className="w-4 h-4" /> Diretório de Usuários
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <Activity className="w-4 h-4" /> Monitor de Governança
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="tabela" className="space-y-4 outline-none">
          <UsuariosTable />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <UsuariosDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

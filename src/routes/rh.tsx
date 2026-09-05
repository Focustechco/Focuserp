import { createFileRoute } from "@tanstack/react-router";
import { RhDashboard } from "@/features/rh/components/RhDashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColaboradoresTable } from "@/features/rh/components/ColaboradoresTable";
import { OrganogramaView } from "@/features/rh/components/OrganogramaView";
import { ColaboradorSheet } from "@/features/rh/components/ColaboradorSheet";
import { RhFeriasView } from "@/features/rh/components/RhFeriasView";
import { RhBeneficiosView } from "@/features/rh/components/RhBeneficiosView";
import { RhDesempenhoView } from "@/features/rh/components/RhDesempenhoView";
import { RhTreinamentosView } from "@/features/rh/components/RhTreinamentosView";
import { RhOnboardingView } from "@/features/rh/components/RhOnboardingView";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Users, PieChart, Palmtree, Heart, Target, 
  GraduationCap, UserPlus, Network, Search 
} from "lucide-react";
import { useState } from "react";
import { Colaborador } from "@/features/rh/types";

export const Route = createFileRoute("/rh")({
  component: RouteComponent,
});

function RouteComponent() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [colabParaEditar, setColabParaEditar] = useState<Colaborador | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const handleNewClick = () => {
    setColabParaEditar(null);
    setSheetOpen(true);
  };

  const handleEditClick = (colab: Colaborador) => {
    setColabParaEditar(colab);
    setSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-4 p-3 sm:p-6 lg:p-8 pt-4 sm:pt-6 max-w-full overflow-x-hidden animate-fade-in">
      <div className="hidden md:block">
        <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">Recursos Humanos & Gestão de Pessoas</h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          Plataforma central de gestão de pessoas, diretório corporativo, benefícios, férias, desempenho e desenvolvimento.
        </p>
      </div>
      
      {/* O módulo abre diretamente na aba 'diretorio' (Diretório) */}
      <Tabs defaultValue="diretorio" className="space-y-4">
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="diretorio" className="gap-2 shrink-0 font-medium">
              <Users className="w-4 h-4" /> Diretório
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0 font-medium">
              <PieChart className="w-4 h-4" /> Painel Executivo
            </TabsTrigger>
            <TabsTrigger value="ferias" className="gap-2 shrink-0 font-medium">
              <Palmtree className="w-4 h-4" /> Férias & Ausências
            </TabsTrigger>
            <TabsTrigger value="beneficios" className="gap-2 shrink-0 font-medium">
              <Heart className="w-4 h-4" /> Benefícios Corporativos
            </TabsTrigger>
            <TabsTrigger value="desempenho" className="gap-2 shrink-0 font-medium">
              <Target className="w-4 h-4" /> Feedbacks
            </TabsTrigger>
            <TabsTrigger value="treinamentos" className="gap-2 shrink-0 font-medium">
              <GraduationCap className="w-4 h-4" /> Treinamentos (L&D)
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-2 shrink-0 font-medium">
              <UserPlus className="w-4 h-4" /> Admissão & Onboarding
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. DIRETÓRIO (ABA INICIAL PADRÃO) COM CONTROLES ALINHADOS NA MESMA LINHA */}
        <TabsContent value="diretorio" className="space-y-4 outline-none">
          <Tabs defaultValue="lista" className="space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Campo de Busca na Esquerda */}
              <div className="relative w-full sm:w-80 md:w-96">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, cargo, departamento ou PIX..."
                  className="pl-8 text-xs h-9 rounded-xl"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Sub-Abas [Lista | Organograma] e Botão [+ Novo Colaborador] na Direita na Mesma Linha */}
              <div className="flex flex-wrap items-center gap-2.5 justify-between sm:justify-end">
                <TabsList className="bg-muted/60 p-1 h-9 rounded-xl">
                  <TabsTrigger value="lista" className="gap-1.5 text-xs font-medium h-7 rounded-lg">
                    <Users className="w-3.5 h-3.5" /> Lista de Colaboradores
                  </TabsTrigger>
                  <TabsTrigger value="arvore" className="gap-1.5 text-xs font-medium h-7 rounded-lg">
                    <Network className="w-3.5 h-3.5" /> Organograma
                  </TabsTrigger>
                </TabsList>

                <Button 
                  onClick={handleNewClick} 
                  size="sm"
                  className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold h-9 rounded-xl shadow-xs shrink-0 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" /> Novo Colaborador
                </Button>
              </div>
            </div>

            <TabsContent value="lista" className="space-y-4 outline-none">
              <ColaboradoresTable 
                searchTerm={searchTerm}
                onNewClick={handleNewClick} 
                onEditClick={handleEditClick} 
              />
            </TabsContent>
            <TabsContent value="arvore" className="space-y-4 outline-none">
              <OrganogramaView />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* 2. PAINEL EXECUTIVO */}
        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <RhDashboard />
        </TabsContent>

        {/* 3. FÉRIAS & AUSÊNCIAS */}
        <TabsContent value="ferias" className="space-y-4 outline-none">
          <RhFeriasView />
        </TabsContent>

        {/* 4. BENEFÍCIOS CORPORATIVOS */}
        <TabsContent value="beneficios" className="space-y-4 outline-none">
          <RhBeneficiosView />
        </TabsContent>

        {/* 5. FEEDBACKS */}
        <TabsContent value="desempenho" className="space-y-4 outline-none">
          <RhDesempenhoView />
        </TabsContent>

        {/* 6. TREINAMENTOS & EDUCAÇÃO (L&D) */}
        <TabsContent value="treinamentos" className="space-y-4 outline-none">
          <RhTreinamentosView />
        </TabsContent>

        {/* 7. ADMISSÃO & ONBOARDING / OFFBOARDING */}
        <TabsContent value="onboarding" className="space-y-4 outline-none">
          <RhOnboardingView />
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

import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import {
  Heart,
  Users,
  Clock,
  Award,
  TrendingUp,
  ShieldCheck,
  LayoutDashboard,
  Plus,
} from 'lucide-react';
import { useCustomerSuccess } from '../useCustomerSuccess';
import { CarteiraClientesView } from './CarteiraClientesView';
import { OnboardingView } from './OnboardingView';
import { NpsSurveysView } from './NpsSurveysView';
import { ExpansaoPipelineView } from './ExpansaoPipelineView';
import { PlanosAcaoView } from './PlanosAcaoView';
import { ModalWorkspace360 } from './ModalWorkspace360';
import { DashboardExecutivoCs } from './DashboardExecutivoCs';
import { ModalRegistrarNps } from './ModalRegistrarNps';
import { ModalNovaAcaoCs } from './ModalNovaAcaoCs';
import { ModalNovaExpansao } from './ModalNovaExpansao';

export function CustomerSuccessScreen() {
  const {
    clients,
    csCustomers,
    onboardingSteps,
    healthFactors,
    npsSurveys,
    expansions,
    actionPlans,
    timelines,
    toggleOnboardingStep,
    addNpsSurvey,
    addActionPlanItem,
    addExpansionOpportunity,
  } = useCustomerSuccess();

  const [activeTab, setActiveTab] = useState<
    'carteira' | 'onboarding' | 'nps' | 'expansao' | 'planos' | 'dashboard'
  >('carteira');
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Modals
  const [isNpsModalOpen, setIsNpsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isExpansionModalOpen, setIsExpansionModalOpen] = useState(false);

  // Combined clients with CS customer metadata
  const combinedClients = useMemo(() => {
    return clients.map((client) => {
      const cs = csCustomers.find((c) => c.client_id === client.id) || {
        id: `cs-${client.id}`,
        client_id: client.id,
        healthScore: 90,
        healthStatus: 'excelente' as const,
        npsLatestScore: 10,
        npsCategory: 'promotor' as const,
        onboardingProgress: 100,
        onboardingStatus: 'concluido' as const,
        renewalDate: '2026-12-31',
        renewalStatus: 'em_dia' as const,
        mrr: 12500,
        arr: 150000,
        churnRisk: 'baixo' as const,
        csmResponsibleName: 'Ana Clara Ribeiro',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { ...client, cs };
    });
  }, [clients, csCustomers]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return combinedClients.find((c) => c.id === selectedClientId) || null;
  }, [combinedClients, selectedClientId]);

  const handleSelectClient = (clientId: string) => {
    setSelectedClientId(clientId);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* HEADER PRINCIPAL PADRONIZADO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="hidden md:block">
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Heart className="h-8 w-8 text-rose-500 fill-rose-500/20" /> Customer Service
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestão estratégica do ciclo de vida do cliente: Onboarding, Health Score, NPS, Retenção e Expansão
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => setIsNpsModalOpen(true)}
            size="sm"
            className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-xs"
          >
            <Award className="w-4 h-4" /> Registrar NPS
          </Button>
          <Button
            onClick={() => setIsActionModalOpen(true)}
            size="sm"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4" /> Nova Ação CS
          </Button>
          <Button
            onClick={() => setIsExpansionModalOpen(true)}
            size="sm"
            className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 shadow-xs"
          >
            <TrendingUp className="w-4 h-4" /> Oportunidade Upsell
          </Button>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO E SUBMÓDULOS */}
      <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="carteira" className="gap-2 shrink-0 text-xs font-semibold">
              <Users className="h-4 w-4" /> Carteira & Health Score
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="gap-2 shrink-0 text-xs font-semibold">
              <Clock className="h-4 w-4" /> Onboarding & Implantação
            </TabsTrigger>
            <TabsTrigger value="nps" className="gap-2 shrink-0 text-xs font-semibold">
              <Award className="h-4 w-4" /> NPS & Satisfação
            </TabsTrigger>
            <TabsTrigger value="expansao" className="gap-2 shrink-0 text-xs font-semibold">
              <TrendingUp className="h-4 w-4" /> Upsell & Expansão
            </TabsTrigger>
            <TabsTrigger value="planos" className="gap-2 shrink-0 text-xs font-semibold">
              <ShieldCheck className="h-4 w-4" /> Planos de Ação
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0 text-xs font-semibold">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: CARTEIRA DE CLIENTES & HEALTH SCORE */}
        <TabsContent value="carteira" className="m-0 focus-visible:outline-none">
          <CarteiraClientesView
            clients={combinedClients}
            onSelectClient={handleSelectClient}
            onOpenNovoNps={() => setIsNpsModalOpen(true)}
            onOpenNovaAcao={() => setIsActionModalOpen(true)}
            onOpenNovaExpansao={() => setIsExpansionModalOpen(true)}
          />
        </TabsContent>

        {/* ABA 2: ONBOARDING & IMPLANTAÇÃO */}
        <TabsContent value="onboarding" className="m-0 focus-visible:outline-none">
          <OnboardingView
            clients={combinedClients}
            onboardingSteps={onboardingSteps}
            toggleOnboardingStep={toggleOnboardingStep}
            onSelectClient={handleSelectClient}
          />
        </TabsContent>

        {/* ABA 3: NPS & PESQUISAS DE SATISFAÇÃO */}
        <TabsContent value="nps" className="m-0 focus-visible:outline-none">
          <NpsSurveysView
            clients={combinedClients}
            npsSurveys={npsSurveys}
            onOpenNovoNps={() => setIsNpsModalOpen(true)}
            onSelectClient={handleSelectClient}
          />
        </TabsContent>

        {/* ABA 4: PIPELINE DE UPSELL & EXPANSÃO */}
        <TabsContent value="expansao" className="m-0 focus-visible:outline-none">
          <ExpansaoPipelineView
            clients={combinedClients}
            expansions={expansions}
            onOpenNovaExpansao={() => setIsExpansionModalOpen(true)}
            onSelectClient={handleSelectClient}
          />
        </TabsContent>

        {/* ABA 5: PLANOS DE AÇÃO & PREVENÇÃO DE CHURN */}
        <TabsContent value="planos" className="m-0 focus-visible:outline-none">
          <PlanosAcaoView
            clients={combinedClients}
            actionPlans={actionPlans}
            onOpenNovaAcao={() => setIsActionModalOpen(true)}
            onSelectClient={handleSelectClient}
          />
        </TabsContent>

        {/* ABA 6: DASHBOARD EXECUTIVO CS (EXTREMA DIREITA) */}
        <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
          <DashboardExecutivoCs
            clients={combinedClients}
            npsSurveys={npsSurveys}
            expansions={expansions}
          />
        </TabsContent>
      </Tabs>

      {/* MODAL WORKSPACE 360° DO CLIENTE */}
      <ModalWorkspace360
        open={!!selectedClientId}
        onOpenChange={(open) => !open && setSelectedClientId(null)}
        client={selectedClient}
        onboardingSteps={onboardingSteps}
        healthFactors={healthFactors}
        npsSurveys={npsSurveys}
        expansions={expansions}
        actionPlans={actionPlans}
        timelines={timelines}
        toggleOnboardingStep={toggleOnboardingStep}
        onOpenNovoNps={() => setIsNpsModalOpen(true)}
        onOpenNovaAcao={() => setIsActionModalOpen(true)}
        onOpenNovaExpansao={() => setIsExpansionModalOpen(true)}
      />

      {/* MODAL REGISTRAR NPS */}
      <ModalRegistrarNps
        open={isNpsModalOpen}
        onOpenChange={setIsNpsModalOpen}
        clients={combinedClients}
        defaultClientId={selectedClientId}
        onAddNpsSurvey={addNpsSurvey}
      />

      {/* MODAL NOVA AÇÃO CS */}
      <ModalNovaAcaoCs
        open={isActionModalOpen}
        onOpenChange={setIsActionModalOpen}
        clients={combinedClients}
        defaultClientId={selectedClientId}
        onAddActionPlanItem={addActionPlanItem}
      />

      {/* MODAL NOVA EXPANSÃO */}
      <ModalNovaExpansao
        open={isExpansionModalOpen}
        onOpenChange={setIsExpansionModalOpen}
        clients={combinedClients}
        defaultClientId={selectedClientId}
        onAddExpansionOpportunity={addExpansionOpportunity}
      />
    </div>
  );
}

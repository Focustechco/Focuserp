import React, { useState, useMemo } from 'react';
import { useCustomerSuccess } from '../useCustomerSuccess';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Heart, Users, Clock, Award, TrendingUp, ShieldCheck,
  Search, Filter, Plus, ChevronRight, Activity, DollarSign,
  AlertTriangle, Layers, Building2, User, MoreVertical, MessageSquare,
  Sparkles, CheckCircle2, ArrowUpRight
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ModalWorkspace360 } from './ModalWorkspace360';
import { ModalRegistrarNps } from './ModalRegistrarNps';
import { ModalNovaAcaoCs } from './ModalNovaAcaoCs';
import { ModalNovaExpansao } from './ModalNovaExpansao';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileCustomerSuccessView() {
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

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'excelente' | 'estavel' | 'risco' | 'onboarding' | 'expansao'>('todos');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [churnFilter, setChurnFilter] = useState<string>('all');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isNpsModalOpen, setIsNpsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isExpansionModalOpen, setIsExpansionModalOpen] = useState(false);

  // Combina clientes com os dados do CS
  const combinedClients = useMemo(() => {
    return clients.map((client) => {
      const cs = csCustomers.find((c) => c.client_id === client.id) || {
        id: `cs-${client.id}`,
        client_id: client.id,
        healthScore: 85,
        healthStatus: 'bom' as const,
        npsLatestScore: 9,
        npsCategory: 'promotor' as const,
        onboardingProgress: 100,
        onboardingStatus: 'concluido' as const,
        renewalDate: '2026-12-31',
        renewalStatus: 'em_dia' as const,
        mrr: 8500,
        arr: 102000,
        churnRisk: 'baixo' as const,
        csmResponsibleName: 'Equipe CS Focus',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { ...client, cs };
    });
  }, [clients, csCustomers]);

  // Estatísticas de topo
  const metrics = useMemo(() => {
    const total = combinedClients.length;
    const mrrTotal = combinedClients.reduce((acc, c) => acc + (c.cs.mrr || 0), 0);
    const avgHealth = Math.round(
      combinedClients.reduce((acc, c) => acc + (c.cs.healthScore || 0), 0) / (total || 1)
    );
    const emRisco = combinedClients.filter((c) => c.cs.churnRisk === 'alto' || c.cs.churnRisk === 'critico' || c.cs.healthStatus === 'critico' || c.cs.healthStatus === 'em_risco').length;
    const countExcelentes = combinedClients.filter(c => c.cs.healthStatus === 'excelente' || c.cs.healthStatus === 'bom').length;

    return { total, mrrTotal, avgHealth, emRisco, countExcelentes };
  }, [combinedClients]);

  // Filtro
  const filteredClients = useMemo(() => {
    return combinedClients.filter((c) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (c.nomeFantasia || '').toLowerCase().includes(search) ||
        (c.razaoSocial || '').toLowerCase().includes(search) ||
        (c.segmento || '').toLowerCase().includes(search) ||
        (c.documento || '').includes(search) ||
        (c.cs.csmResponsibleName || '').toLowerCase().includes(search);

      if (!matchSearch) return false;

      // Abas rápidas
      if (activeTab === 'excelente' && c.cs.healthStatus !== 'excelente') return false;
      if (activeTab === 'estavel' && !['bom', 'estavel'].includes(c.cs.healthStatus)) return false;
      if (activeTab === 'risco' && !['em_risco', 'critico'].includes(c.cs.healthStatus) && c.cs.churnRisk !== 'alto' && c.cs.churnRisk !== 'critico') return false;
      if (activeTab === 'onboarding' && c.cs.onboardingStatus === 'concluido') return false;
      if (activeTab === 'expansao' && (c.cs.mrr || 0) <= 0) return false;

      // Filtros do Sheet
      if (healthFilter !== 'all' && c.cs.healthStatus !== healthFilter) return false;
      if (churnFilter !== 'all' && c.cs.churnRisk !== churnFilter) return false;

      return true;
    });
  }, [combinedClients, searchTerm, activeTab, healthFilter, churnFilter]);

  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return combinedClients.find((c) => c.id === selectedClientId) || null;
  }, [combinedClients, selectedClientId]);

  const getHealthBadge = (score: number, status: string) => {
    if (score >= 80 || status === 'excelente') {
      return (
        <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 gap-1">
          <Activity className="w-2.5 h-2.5" /> {score}/100 Excelente
        </Badge>
      );
    }
    if (score >= 60 || status === 'bom' || status === 'estavel') {
      return (
        <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-bold text-[10px] px-2 py-0.5 gap-1">
          <Activity className="w-2.5 h-2.5" /> {score}/100 Estável
        </Badge>
      );
    }
    return (
      <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5 gap-1">
        <AlertTriangle className="w-2.5 h-2.5" /> {score}/100 Em Risco
      </Badge>
    );
  };

  const getChurnRiskBadge = (risk: string) => {
    switch (risk) {
      case 'baixo':
        return <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-300">Risco Baixo</Badge>;
      case 'medio':
        return <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300">Risco Médio</Badge>;
      case 'alto':
      case 'critico':
        return <Badge variant="outline" className="text-[10px] text-rose-600 border-rose-300 bg-rose-50">Risco Alto</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] text-muted-foreground">Normal</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-1.5">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/20" /> Customer Service
            </h1>
            <p className="text-[11px] text-muted-foreground">Health score, retenção e ciclo do cliente</p>
          </div>
          <Button
            onClick={() => setIsActionModalOpen(true)}
            size="sm"
            className="h-9 px-3 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl gap-1.5 shadow-xs"
          >
            <Plus className="w-4 h-4" /> Nova Ação
          </Button>
        </div>

        {/* Barra de Busca + Filtro Sheet */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, segmento ou CSM..."
              className="pl-9 h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus:bg-background"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-9 w-9 rounded-xl shrink-0 ${
                  healthFilter !== 'all' || churnFilter !== 'all'
                    ? 'border-rose-600 text-rose-600 bg-rose-50 dark:bg-rose-950/40'
                    : 'border-muted-foreground/20'
                }`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 py-6">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-base font-bold">Filtrar Clientes CS</SheetTitle>
                <SheetDescription className="text-xs">
                  Refine por saúde da conta e risco de churn
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-2">Health Score</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'all', label: 'Todos os Status' },
                      { id: 'excelente', label: 'Excelente (80-100)' },
                      { id: 'bom', label: 'Bom / Estável (60-79)' },
                      { id: 'em_risco', label: 'Em Risco (<60)' },
                    ].map((st) => (
                      <Button
                        key={st.id}
                        type="button"
                        variant={healthFilter === st.id ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs h-9 rounded-lg"
                        onClick={() => setHealthFilter(st.id)}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-2">Risco de Churn</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'all', label: 'Todos' },
                      { id: 'baixo', label: 'Baixo' },
                      { id: 'medio', label: 'Médio' },
                      { id: 'alto', label: 'Alto' },
                    ].map((c) => (
                      <Button
                        key={c.id}
                        type="button"
                        variant={churnFilter === c.id ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-9 rounded-lg"
                        onClick={() => setChurnFilter(c.id)}
                      >
                        {c.label}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="flex-1 text-xs h-10 rounded-xl"
                  onClick={() => {
                    setHealthFilter('all');
                    setChurnFilter('all');
                    setFilterSheetOpen(false);
                  }}
                >
                  Limpar Filtros
                </Button>
                <Button
                  className="flex-1 text-xs h-10 rounded-xl font-semibold bg-rose-600 hover:bg-rose-700 text-white"
                  onClick={() => setFilterSheetOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Pílulas de Abas Rápidas */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
          <button
            onClick={() => setActiveTab('todos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'todos'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Todos ({metrics.total})
          </button>
          <button
            onClick={() => setActiveTab('excelente')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'excelente'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <Activity className="w-3 h-3" /> Saudáveis ({metrics.countExcelentes})
          </button>
          <button
            onClick={() => setActiveTab('risco')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'risco'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <AlertTriangle className="w-3 h-3" /> Em Risco ({metrics.emRisco})
          </button>
          <button
            onClick={() => setActiveTab('onboarding')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'onboarding'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Onboarding
          </button>
          <button
            onClick={() => setActiveTab('expansao')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'expansao'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Expansão
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cards de Métricas em Carrossel Horizontal */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-emerald-50 to-emerald-100/40 dark:from-emerald-950/40 dark:to-emerald-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 mb-1">
              <span className="text-[11px] font-semibold">MRR Carteira</span>
              <DollarSign className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300 truncate">
              {formatCurrency(metrics.mrrTotal)}
            </p>
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
              Sob Gestão CS
            </span>
          </div>

          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-blue-50 to-indigo-100/40 dark:from-blue-950/40 dark:to-indigo-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 mb-1">
              <span className="text-[11px] font-semibold">Health Médio</span>
              <Activity className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-blue-700 dark:text-blue-300">
              {metrics.avgHealth} / 100
            </p>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5 font-medium">
              {metrics.countExcelentes} saudáveis
            </span>
          </div>

          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-rose-50 to-rose-100/40 dark:from-rose-950/40 dark:to-rose-900/20 border border-rose-200/60 dark:border-rose-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-300 mb-1">
              <span className="text-[11px] font-semibold">Contas em Risco</span>
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-rose-700 dark:text-rose-300">
              {metrics.emRisco}
            </p>
            <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block mt-0.5 font-medium">
              Ação necessária
            </span>
          </div>
        </div>

        {/* Lista de Cards de Clientes */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {filteredClients.length} {filteredClients.length === 1 ? 'Cliente' : 'Clientes'} sob Gestão
            </span>
          </div>

          {filteredClients.length === 0 ? (
            <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
              <Heart className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm text-foreground">Nenhum cliente encontrado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                Tente alterar os termos da busca ou os filtros de saúde do cliente.
              </p>
            </div>
          ) : (
            filteredClients.map((client) => {
              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className="relative overflow-hidden bg-card border border-border/70 rounded-xl p-3.5 transition-all active:scale-[0.99] shadow-2xs hover:border-rose-500/40"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="flex-1 min-w-0">
                      {/* Header do card com Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {getHealthBadge(client.cs.healthScore, client.cs.healthStatus)}
                        {getChurnRiskBadge(client.cs.churnRisk)}
                        {client.segmento && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground">
                            {client.segmento}
                          </Badge>
                        )}
                      </div>

                      {/* Nome do Cliente */}
                      <h4 className="font-bold text-sm text-foreground truncate mt-0.5">
                        {client.nomeFantasia || client.razaoSocial}
                      </h4>

                      {/* Responsável CSM */}
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <User className="w-3 h-3 text-muted-foreground/70" />
                        CSM: <span className="font-medium text-foreground">{client.cs.csmResponsibleName || 'Não atribuído'}</span>
                      </p>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 text-xs font-semibold text-rose-600 hover:bg-rose-500/10 gap-1 rounded-lg"
                        onClick={() => setSelectedClientId(client.id)}
                      >
                        360° <ChevronRight className="w-3.5 h-3.5" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => setSelectedClientId(client.id)} className="gap-2 cursor-pointer">
                            <Sparkles className="w-3.5 h-3.5 text-rose-600" /> Abrir Workspace 360°
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsNpsModalOpen(true)} className="gap-2 cursor-pointer">
                            <Award className="w-3.5 h-3.5 text-amber-600" /> Registrar Pesquisa NPS
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsActionModalOpen(true)} className="gap-2 cursor-pointer">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Adicionar Plano de Ação
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setIsExpansionModalOpen(true)} className="gap-2 cursor-pointer">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-600" /> Nova Oportunidade Expansão
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Barra de Progresso Onboarding se aplicável */}
                  {client.cs.onboardingStatus !== 'concluido' && (
                    <div className="mt-2.5 space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                        <span>Progresso de Onboarding</span>
                        <span className="font-semibold text-foreground">{client.cs.onboardingProgress || 0}%</span>
                      </div>
                      <Progress value={client.cs.onboardingProgress || 0} className="h-1.5" />
                    </div>
                  )}

                  {/* Rodapé do card: MRR e NPS */}
                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-muted-foreground">MRR:</span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(client.cs.mrr)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span>NPS: <strong className="text-foreground">{client.cs.npsLatestScore || '-'}</strong></span>
                      <span>•</span>
                      <span>Renovação: <strong className="text-foreground">{client.cs.renewalDate ? client.cs.renewalDate.split('-')[0] : '2026'}</strong></span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modais Integrados */}
      <ModalWorkspace360
        client={selectedClient}
        isOpen={!!selectedClientId}
        onClose={() => setSelectedClientId(null)}
        onboardingSteps={onboardingSteps.filter(s => s.client_id === selectedClientId)}
        healthFactors={healthFactors.filter(f => f.client_id === selectedClientId)}
        npsSurveys={npsSurveys.filter(n => n.client_id === selectedClientId)}
        expansions={expansions.filter(e => e.client_id === selectedClientId)}
        actionPlans={actionPlans.filter(a => a.client_id === selectedClientId)}
        timelines={timelines.filter(t => t.client_id === selectedClientId)}
        onToggleOnboardingStep={toggleOnboardingStep}
        onOpenNovoNps={() => setIsNpsModalOpen(true)}
        onOpenNovaAcao={() => setIsActionModalOpen(true)}
        onOpenNovaExpansao={() => setIsExpansionModalOpen(true)}
      />

      <ModalRegistrarNps
        isOpen={isNpsModalOpen}
        onClose={() => setIsNpsModalOpen(false)}
        clients={clients}
        onSave={addNpsSurvey}
      />

      <ModalNovaAcaoCs
        isOpen={isActionModalOpen}
        onClose={() => setIsActionModalOpen(false)}
        clients={clients}
        onSave={addActionPlanItem}
      />

      <ModalNovaExpansao
        isOpen={isExpansionModalOpen}
        onClose={() => setIsExpansionModalOpen(false)}
        clients={clients}
        onSave={addExpansionOpportunity}
      />
    </div>
  );
}

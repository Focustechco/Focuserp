import React, { useState, useMemo } from 'react';
import {
  Heart,
  Sparkles,
  Users,
  DollarSign,
  Activity,
  Award,
  Clock,
  ShieldCheck,
  Search,
  Building2,
  ChevronRight,
  Plus,
  TrendingUp,
  X,
  CheckCircle2,
  MessageSquare,
  UserCheck,
  AlertTriangle,
  Layers,
  FolderOpen,
  Calendar,
} from 'lucide-react';
import { useCustomerSuccess } from '../useCustomerSuccess';

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

  // Active view state
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [workspaceTab, setWorkspaceTab] = useState<
    'overview' | 'onboarding' | 'health' | 'nps' | 'expansion' | 'kanban' | 'timeline'
  >('overview');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState<'all' | 'excelente' | 'bom' | 'atencao'>('all');

  // Modals state
  const [isNpsModalOpen, setIsNpsModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [isExpansionModalOpen, setIsExpansionModalOpen] = useState(false);

  // Forms state
  const [npsRating, setNpsRating] = useState(10);
  const [npsComment, setNpsComment] = useState('');
  const [npsRespondent, setNpsRespondent] = useState('');
  const [actionTitle, setActionTitle] = useState('');
  const [actionDescription, setActionDescription] = useState('');
  const [actionResponsible, setActionResponsible] = useState('');
  const [expTitle, setExpTitle] = useState('');
  const [expProduct, setExpProduct] = useState('');
  const [expValue, setExpValue] = useState(2500);

  // Combine Clients with CS Customer data
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
        mrr: 12500,
        arr: 150000,
        churnRisk: 'baixo' as const,
        csmResponsibleName: 'Ana Clara (CSM)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return { ...client, cs };
    });
  }, [clients, csCustomers]);

  // Filtered Clients
  const filteredClients = useMemo(() => {
    return combinedClients.filter((c) => {
      const matchesSearch =
        c.razaoSocial.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.nomeFantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.segmento.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.documento.includes(searchTerm);

      const matchesHealth = healthFilter === 'all' || c.cs.healthStatus === healthFilter;
      return matchesSearch && matchesHealth;
    });
  }, [combinedClients, searchTerm, healthFilter]);

  // Selected Client
  const selectedClient = useMemo(() => {
    if (!selectedClientId) return null;
    return combinedClients.find((c) => c.id === selectedClientId) || null;
  }, [combinedClients, selectedClientId]);

  // Executive Metrics
  const metrics = useMemo(() => {
    const totalClients = combinedClients.length;
    const totalArr = combinedClients.reduce((acc, c) => acc + c.cs.arr, 0);
    const totalMrr = combinedClients.reduce((acc, c) => acc + c.cs.mrr, 0);
    const avgHealth = Math.round(
      combinedClients.reduce((acc, c) => acc + c.cs.healthScore, 0) / (totalClients || 1)
    );
    const onboardingActive = combinedClients.filter((c) => c.cs.onboardingProgress < 100).length;

    return {
      totalClients,
      totalArr,
      totalMrr,
      avgHealth,
      onboardingActive,
    };
  }, [combinedClients]);

  // Selected client sub-data
  const selectedCsId = selectedClient?.cs.id;
  const clientOnboarding = useMemo(
    () => onboardingSteps.filter((s) => s.cs_customer_id === selectedCsId),
    [onboardingSteps, selectedCsId]
  );
  const clientHealthFactors = useMemo(
    () => healthFactors.filter((h) => h.cs_customer_id === selectedCsId),
    [healthFactors, selectedCsId]
  );
  const clientNps = useMemo(
    () => npsSurveys.filter((n) => n.cs_customer_id === selectedCsId),
    [npsSurveys, selectedCsId]
  );
  const clientExpansions = useMemo(
    () => expansions.filter((e) => e.cs_customer_id === selectedCsId),
    [expansions, selectedCsId]
  );
  const clientActionPlans = useMemo(
    () => actionPlans.filter((a) => a.cs_customer_id === selectedCsId),
    [actionPlans, selectedCsId]
  );
  const clientTimelines = useMemo(
    () => timelines.filter((t) => t.cs_customer_id === selectedCsId),
    [timelines, selectedCsId]
  );

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="bg-card border border-border rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Heart className="w-7 h-7 text-primary" /> Customer Success (CS)
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">
              Gestão estratégica do ciclo de vida dos clientes da software house. Acompanhe Onboarding, Health Score, NPS, Renovações e Expansão.
            </p>
          </div>

          <div className="text-right hidden sm:block">
            <p className="text-xs text-muted-foreground">MRR Total da Carteira</p>
            <p className="text-xl font-extrabold text-foreground">
              R$ {metrics.totalMrr.toLocaleString('pt-BR')} <span className="text-xs font-normal text-muted-foreground">/mês</span>
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Carteira (ARR Total)</span>
            <DollarSign className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">
            R$ {(metrics.totalArr / 1000).toFixed(0)}k
          </p>
          <p className="text-xs text-muted-foreground mt-1">{metrics.totalClients} clientes sob gestão</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Média Health Score</span>
            <Activity className="w-5 h-5 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{metrics.avgHealth} / 100</p>
          <p className="text-xs text-emerald-500 mt-1 font-medium">Saúde Operacional Excelente</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">NPS Médio</span>
            <Award className="w-5 h-5 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">+75</p>
          <p className="text-xs text-purple-500 mt-1 font-medium">Zona de Excelência</p>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Onboardings em Andamento</span>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-2xl font-bold text-foreground mt-2">{metrics.onboardingActive}</p>
          <p className="text-xs text-muted-foreground mt-1">Em fase de implementação</p>
        </div>
      </div>

      {/* Main View */}
      {!selectedClientId ? (
        /* Portfolio List */
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-border">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar cliente, documento ou segmento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-input rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={healthFilter}
                onChange={(e: any) => setHealthFilter(e.target.value)}
                className="bg-background border border-input text-xs text-foreground rounded-md px-3 py-2 focus:outline-none"
              >
                <option value="all">Health Score: Todos</option>
                <option value="excelente">Excelente (&gt;85)</option>
                <option value="bom">Bom (70-85)</option>
                <option value="atencao">Atenção (&lt;70)</option>
              </select>
              <span className="text-xs text-muted-foreground">
                {filteredClients.length} clientes na carteira
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClients.map((client) => (
              <div
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className="bg-background border border-border hover:border-primary/50 rounded-xl p-5 cursor-pointer transition-all hover:shadow-md group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-base line-clamp-1">
                        {client.nomeFantasia || client.razaoSocial}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Building2 className="w-3 h-3" /> {client.segmento}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-muted/30 p-3 rounded-lg border border-border mb-4 text-xs">
                    <div>
                      <p className="text-muted-foreground text-[11px]">MRR Atual</p>
                      <p className="font-semibold text-foreground">R$ {client.cs.mrr.toLocaleString('pt-BR')}/mês</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground text-[11px]">Documento</p>
                      <p className="font-semibold text-foreground truncate">{client.documento}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mb-4">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                      <Activity className="w-3 h-3" /> Score: {client.cs.healthScore}/100
                    </span>

                    <span className="text-xs px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 font-medium flex items-center gap-1">
                      <Award className="w-3 h-3" /> NPS: {client.cs.npsLatestScore}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-border flex items-center justify-between text-xs text-primary font-semibold group-hover:translate-x-1 transition-transform">
                  <span>Abrir Workspace 360°</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* 360 Workspace */
        <div className="bg-card border border-border rounded-xl p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSelectedClientId(null)}
                className="bg-muted hover:bg-muted/80 text-foreground px-3 py-2 rounded-md transition-colors text-xs font-semibold"
              >
                ← Voltar para Carteira
              </button>
              <div>
                <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                  {selectedClient?.nomeFantasia || selectedClient?.razaoSocial}
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-0.5 rounded-full font-normal">
                    {selectedClient?.segmento}
                  </span>
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  CNPJ/CPF: {selectedClient?.documento} • Contato:{' '}
                  {selectedClient?.contatos[0]?.email || 'Não informado'}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setIsNpsModalOpen(true)}
                className="bg-purple-600/10 text-purple-600 dark:text-purple-300 border border-purple-500/20 text-xs px-3 py-2 rounded-md font-semibold flex items-center gap-1.5"
              >
                <Award className="w-4 h-4" /> Registrar NPS
              </button>
              <button
                onClick={() => setIsActionModalOpen(true)}
                className="bg-blue-600/10 text-blue-600 dark:text-blue-300 border border-blue-500/20 text-xs px-3 py-2 rounded-md font-semibold flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Nova Ação CS
              </button>
              <button
                onClick={() => setIsExpansionModalOpen(true)}
                className="bg-emerald-600/10 text-emerald-600 dark:text-emerald-300 border border-emerald-500/20 text-xs px-3 py-2 rounded-md font-semibold flex items-center gap-1.5"
              >
                <TrendingUp className="w-4 h-4" /> Registrar Upsell
              </button>
            </div>
          </div>

          {/* Sub Navigation */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border text-xs">
            {[
              { id: 'overview', label: 'Visão Geral 360°', icon: Activity },
              { id: 'onboarding', label: 'Onboarding & Implantação', icon: Clock },
              { id: 'health', label: 'Health Score & Fatores', icon: Heart },
              { id: 'nps', label: 'NPS & Avaliações', icon: Award },
              { id: 'expansion', label: 'Upsell & Cross-Sell', icon: TrendingUp },
              { id: 'kanban', label: 'Plano de Ação (Kanban)', icon: Layers },
              { id: 'timeline', label: 'Timeline de Interações', icon: MessageSquare },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = workspaceTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setWorkspaceTab(tab.id as any)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md font-medium transition-all whitespace-nowrap ${
                    isActive ? 'bg-primary text-primary-foreground font-semibold' : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Sub Tab Contents */}
          <div className="pt-2">
            {workspaceTab === 'overview' && selectedClient && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-background border border-border rounded-xl p-4">
                      <p className="text-xs text-muted-foreground">MRR Mensal</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        R$ {selectedClient.cs.mrr.toLocaleString('pt-BR')}
                      </p>
                    </div>

                    <div className="bg-background border border-border rounded-xl p-4">
                      <p className="text-xs text-muted-foreground">Health Score</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {selectedClient.cs.healthScore} / 100
                      </p>
                    </div>

                    <div className="bg-background border border-border rounded-xl p-4">
                      <p className="text-xs text-muted-foreground">Progresso Onboarding</p>
                      <p className="text-xl font-bold text-foreground mt-1">
                        {selectedClient.cs.onboardingProgress}%
                      </p>
                    </div>
                  </div>

                  {/* Onboarding Checklist Box */}
                  <div className="bg-background border border-border rounded-xl p-5 space-y-3">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" /> Checklist de Implantação
                    </h4>

                    <div className="space-y-2">
                      {clientOnboarding.map((step) => (
                        <div
                          key={step.id}
                          className="flex items-center justify-between text-xs p-2.5 rounded-md bg-muted/40 border border-border"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={step.isCompleted}
                              onChange={() => toggleOnboardingStep(step.id)}
                              className="accent-primary w-4 h-4 rounded cursor-pointer"
                            />
                            <span className={step.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}>
                              {step.title}
                            </span>
                          </div>
                          <span className="text-muted-foreground text-[11px]">{step.responsibleName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-background border border-border rounded-xl p-5 space-y-3">
                    <h4 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-blue-500" /> Equipe de Atendimento
                    </h4>
                    <div className="space-y-2 text-xs">
                      <div className="p-3 rounded-md bg-muted/30 border border-border">
                        <p className="text-muted-foreground">CSM Responsável</p>
                        <p className="font-semibold text-foreground">Ana Clara Ribeiro</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {workspaceTab === 'health' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {clientHealthFactors.map((factor) => (
                  <div key={factor.id} className="bg-background border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-foreground text-sm">{factor.metricName}</h4>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded text-muted-foreground">
                        Peso: {factor.weight}%
                      </span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">{factor.score} / 100</p>
                    <p className="text-xs text-muted-foreground">{factor.notes}</p>
                  </div>
                ))}
              </div>
            )}

            {workspaceTab === 'nps' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Pesquisas NPS</h3>
                  <button
                    onClick={() => setIsNpsModalOpen(true)}
                    className="bg-purple-600 text-white text-xs px-3 py-1.5 rounded-md font-semibold"
                  >
                    + Nova Pesquisa
                  </button>
                </div>
                {clientNps.map((nps) => (
                  <div key={nps.id} className="bg-background border border-border rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-foreground">{nps.respondentName}</span>
                      <span className="text-muted-foreground">{nps.date}</span>
                    </div>
                    <p className="text-xs text-foreground italic">"{nps.comment}"</p>
                  </div>
                ))}
              </div>
            )}

            {workspaceTab === 'expansion' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-foreground">Oportunidades de Expansão</h3>
                  <button
                    onClick={() => setIsExpansionModalOpen(true)}
                    className="bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md font-semibold"
                  >
                    + Novo Upsell
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {clientExpansions.map((exp) => (
                    <div key={exp.id} className="bg-background border border-border rounded-xl p-4 space-y-2">
                      <h4 className="font-bold text-foreground">{exp.title}</h4>
                      <p className="text-xs text-muted-foreground">Produto: {exp.productOffered}</p>
                      <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        +R$ {exp.potentialValue.toLocaleString('pt-BR')}/mês
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {workspaceTab === 'kanban' && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {['a_fazer', 'em_progresso', 'revisao', 'concluido'].map((col) => (
                  <div key={col} className="bg-background border border-border rounded-xl p-3 space-y-3 min-h-[250px]">
                    <h4 className="font-bold text-foreground text-xs uppercase">{col.replace('_', ' ')}</h4>
                    {clientActionPlans
                      .filter((a) => a.status === col)
                      .map((item) => (
                        <div key={item.id} className="bg-muted/40 border border-border p-2.5 rounded-md text-xs">
                          <p className="font-semibold text-foreground">{item.title}</p>
                        </div>
                      ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NPS Modal */}
      {isNpsModalOpen && selectedClient && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-foreground">Registrar Avaliação NPS</h3>
              <button onClick={() => setIsNpsModalOpen(false)}>
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-muted-foreground">Nota (0 a 10)</label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={npsRating}
                  onChange={(e) => setNpsRating(Number(e.target.value))}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground mt-1"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Respondente</label>
                <input
                  type="text"
                  value={npsRespondent}
                  onChange={(e) => setNpsRespondent(e.target.value)}
                  placeholder="Nome do cliente..."
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground mt-1"
                />
              </div>
              <div>
                <label className="text-muted-foreground">Comentário</label>
                <textarea
                  value={npsComment}
                  onChange={(e) => setNpsComment(e.target.value)}
                  className="w-full bg-background border border-input rounded-md px-3 py-2 text-foreground mt-1 h-20"
                />
              </div>
              <button
                onClick={() => {
                  if (!npsRespondent) return alert('Informe o respondente');
                  addNpsSurvey(selectedClient.cs.id, {
                    rating: npsRating,
                    comment: npsComment,
                    respondentName: npsRespondent,
                    respondentRole: 'Gestor',
                    date: new Date().toISOString().split('T')[0],
                  });
                  setIsNpsModalOpen(false);
                }}
                className="w-full bg-primary text-primary-foreground font-semibold py-2 rounded-md mt-2"
              >
                Salvar NPS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CustomerSuccessScreen;

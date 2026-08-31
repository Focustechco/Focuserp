import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Sparkles,
  Building2,
  Phone,
  Mail,
  Calendar,
  Activity,
  Award,
  DollarSign,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  User,
  Layers,
  ArrowLeft,
  Plus,
} from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import {
  CsCustomer,
  CsOnboardingStep,
  CsHealthScoreFactor,
  CsNpsSurvey,
  CsExpansionOpportunity,
  CsActionPlanItem,
  CsTimelineEvent,
} from '../types';

interface Workspace360ViewProps {
  client: Cliente & { cs: CsCustomer };
  onboardingSteps: CsOnboardingStep[];
  healthFactors: CsHealthScoreFactor[];
  npsSurveys: CsNpsSurvey[];
  expansions: CsExpansionOpportunity[];
  actionPlans: CsActionPlanItem[];
  timelines: CsTimelineEvent[];
  toggleOnboardingStep: (stepId: string) => void;
  onOpenNovoNps: () => void;
  onOpenNovaAcao: () => void;
  onOpenNovaExpansao: () => void;
  onBackToCarteira: () => void;
}

export function Workspace360View({
  client,
  onboardingSteps,
  healthFactors,
  npsSurveys,
  expansions,
  actionPlans,
  timelines,
  toggleOnboardingStep,
  onOpenNovoNps,
  onOpenNovaAcao,
  onOpenNovaExpansao,
  onBackToCarteira,
}: Workspace360ViewProps) {
  const [subTab, setSubTab] = useState<'visao_geral' | 'onboarding' | 'nps' | 'expansao' | 'planos'>('visao_geral');

  const cs = client.cs;
  const clientSteps = onboardingSteps.filter((s) => s.cs_customer_id === cs.id);
  const clientNps = npsSurveys.filter((n) => n.cs_customer_id === cs.id);
  const clientExpansions = expansions.filter((e) => e.cs_customer_id === cs.id);
  const clientActionPlans = actionPlans.filter((a) => a.cs_customer_id === cs.id);

  return (
    <div className="space-y-6">
      {/* HEADER DO CLIENTE 360 */}
      <Card className="rounded-xl border shadow-xs bg-card">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToCarteira}
                  className="h-8 text-xs gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Voltar para Carteira
                </Button>
                <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                  Workspace 360°
                </Badge>
              </div>

              <h2 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                {client.nomeFantasia || client.razaoSocial}
                <Badge variant="outline" className="text-xs font-normal">
                  {client.segmento || 'Tecnologia'}
                </Badge>
              </h2>

              <p className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>CNPJ/CPF: {client.documento}</span>
                <span>Contato: {client.contatos?.[0]?.email || 'Não informado'}</span>
                <span>Telefone: {client.contatos?.[0]?.telefone || client.contatos?.[0]?.celular || 'Não informado'}</span>
                <span>CSM: {cs.csmResponsibleName || 'Ana Clara Ribeiro'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={onOpenNovoNps}
                size="sm"
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white gap-1"
              >
                <Award className="w-3.5 h-3.5" /> Registrar NPS
              </Button>
              <Button
                onClick={onOpenNovaAcao}
                size="sm"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Nova Ação CS
              </Button>
              <Button
                onClick={onOpenNovaExpansao}
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Oportunidade Upsell
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPI METRICS DO CLIENTE */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">MRR Atual da Conta</span>
            <p className="text-2xl font-bold text-foreground mt-1">
              R$ {(cs.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <span className="text-[10px] text-muted-foreground block mt-1">
              ARR: R$ {(cs.arr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Health Score</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{cs.healthScore} / 100</p>
            <Progress value={cs.healthScore} className="h-1.5 mt-2" />
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Última Nota NPS</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {cs.npsLatestScore ?? 10} / 10
            </p>
            <span className="text-[10px] text-muted-foreground block mt-1">
              Categoria: {cs.npsCategory || 'Promotor'}
            </span>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Progresso Onboarding</span>
              <Clock className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-1">{cs.onboardingProgress}%</p>
            <Progress value={cs.onboardingProgress} className="h-1.5 mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* SUB-TABS DO CLIENTE */}
      <Tabs value={subTab} onValueChange={(val: any) => setSubTab(val)} className="space-y-4">
        <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1 border-b">
          <TabsTrigger value="visao_geral" className="text-xs font-semibold gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Visão Geral 360°
          </TabsTrigger>
          <TabsTrigger value="onboarding" className="text-xs font-semibold gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Checklist Onboarding ({clientSteps.length})
          </TabsTrigger>
          <TabsTrigger value="nps" className="text-xs font-semibold gap-1.5">
            <Award className="w-3.5 h-3.5" /> Histórico NPS ({clientNps.length})
          </TabsTrigger>
          <TabsTrigger value="expansao" className="text-xs font-semibold gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> Oportunidades Upsell ({clientExpansions.length})
          </TabsTrigger>
          <TabsTrigger value="planos" className="text-xs font-semibold gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Planos de Ação ({clientActionPlans.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA: VISÃO GERAL */}
        <TabsContent value="visao_geral" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="rounded-xl border shadow-xs">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" /> Informações Corporativas e Contrato
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Razão Social:</span>
                  <span className="font-semibold text-foreground">{client.razaoSocial}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Nome Fantasia:</span>
                  <span className="font-semibold text-foreground">{client.nomeFantasia || '-'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">CNPJ / CPF:</span>
                  <span className="font-mono text-foreground">{client.documento}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Segmento:</span>
                  <span className="font-medium text-foreground">{client.segmento || 'Tecnologia'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b">
                  <span className="text-muted-foreground">Data de Renovação:</span>
                  <span className="font-mono font-semibold text-emerald-600">{cs.renewalDate || '2026-12-31'}</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">Status do Contrato:</span>
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                    {cs.renewalStatus || 'Em dia'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl border shadow-xs">
              <CardHeader className="py-4 border-b">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" /> Contatos Principais & Atendimento
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3 text-xs">
                <div className="bg-muted/30 p-3 rounded-lg border">
                  <p className="text-muted-foreground text-[10px]">CSM Responsável</p>
                  <p className="font-bold text-foreground text-sm mt-0.5">{cs.csmResponsibleName || 'Ana Clara Ribeiro'}</p>
                </div>

                {client.contatos && client.contatos.length > 0 ? (
                  client.contatos.map((ct, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg border bg-card space-y-1 text-xs">
                      <div className="flex justify-between font-semibold text-foreground">
                        <span>{ct.nome}</span>
                        <span className="text-muted-foreground text-[11px] font-normal">{ct.cargo || 'Contato'}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground flex flex-col">
                        <span>Email: {ct.email || 'Não informado'}</span>
                        <span>Telefone: {ct.telefone || ct.celular || 'Não informado'}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-muted-foreground py-4 text-center">Nenhum contato adicional cadastrado.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ABA: ONBOARDING */}
        <TabsContent value="onboarding" className="space-y-4">
          <Card className="rounded-xl border shadow-xs">
            <CardHeader className="py-4 border-b">
              <CardTitle className="text-sm font-semibold">Checklist de Implantação</CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {clientSteps.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma etapa pendente.</p>
              ) : (
                clientSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex items-start justify-between p-3 rounded-lg border text-xs ${
                      step.isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={step.isCompleted}
                        onCheckedChange={() => toggleOnboardingStep(step.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p className={`font-semibold ${step.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {idx + 1}. {step.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{step.description}</p>
                      </div>
                    </div>
                    <span className="text-muted-foreground text-[11px] font-medium">{step.responsibleName}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: NPS */}
        <TabsContent value="nps" className="space-y-4">
          <Card className="rounded-xl border shadow-xs">
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Pesquisas NPS deste Cliente</CardTitle>
              <Button onClick={onOpenNovoNps} size="sm" className="text-xs h-8 bg-purple-600 hover:bg-purple-700 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> Novo NPS
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {clientNps.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma avaliação NPS registrada para este cliente.</p>
              ) : (
                clientNps.map((n) => (
                  <div key={n.id} className="p-3 rounded-lg border bg-card space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        Nota: {n.rating}/10
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{n.date}</span>
                    </div>
                    <p className="text-muted-foreground italic">"{n.comment}"</p>
                    <span className="text-[11px] text-muted-foreground block">{n.respondentName} - {n.respondentRole}</span>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: EXPANSÃO */}
        <TabsContent value="expansao" className="space-y-4">
          <Card className="rounded-xl border shadow-xs">
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Oportunidades de Upsell / Cross-Sell</CardTitle>
              <Button onClick={onOpenNovaExpansao} size="sm" className="text-xs h-8 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nova Expansão
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {clientExpansions.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma oportunidade de expansão mapeada.</p>
              ) : (
                clientExpansions.map((e) => (
                  <div key={e.id} className="p-3 rounded-lg border bg-card flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">{e.title}</p>
                      <p className="text-[11px] text-muted-foreground">{e.productOffered}</p>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-emerald-600 block">+ R$ {e.potentialValue.toLocaleString('pt-BR')}/mês</span>
                      <Badge variant="outline" className="text-[10px]">{e.stage}</Badge>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA: PLANOS DE AÇÃO */}
        <TabsContent value="planos" className="space-y-4">
          <Card className="rounded-xl border shadow-xs">
            <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-semibold">Planos de Ação & Prevenção de Churn</CardTitle>
              <Button onClick={onOpenNovaAcao} size="sm" className="text-xs h-8 bg-blue-600 hover:bg-blue-700 text-white">
                <Plus className="w-3.5 h-3.5 mr-1" /> Nova Ação
              </Button>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {clientActionPlans.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhum plano de ação pendente para esta conta.</p>
              ) : (
                clientActionPlans.map((a) => (
                  <div key={a.id} className="p-3 rounded-lg border bg-card flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-foreground">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground">{a.description}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-[10px]">{a.status}</Badge>
                      <span className="text-[10px] text-muted-foreground block mt-1">Prazo: {a.dueDate}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

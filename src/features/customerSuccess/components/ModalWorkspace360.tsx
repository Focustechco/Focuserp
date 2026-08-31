import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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

interface ModalWorkspace360Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client: (Cliente & { cs: CsCustomer }) | null;
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
}

export function ModalWorkspace360({
  open,
  onOpenChange,
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
}: ModalWorkspace360Props) {
  const [subTab, setSubTab] = useState<'visao_geral' | 'onboarding' | 'nps' | 'expansao' | 'planos'>('visao_geral');

  if (!client) return null;

  const cs = client.cs;
  const clientSteps = onboardingSteps.filter((s) => s.cs_customer_id === cs.id);
  const clientNps = npsSurveys.filter((n) => n.cs_customer_id === cs.id);
  const clientExpansions = expansions.filter((e) => e.cs_customer_id === cs.id);
  const clientActionPlans = actionPlans.filter((a) => a.cs_customer_id === cs.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/30 font-semibold">
                  Workspace 360°
                </Badge>
                <Badge
                  variant="outline"
                  className={`text-[10px] ${
                    cs.churnRisk === 'baixo'
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                      : cs.churnRisk === 'medio'
                      ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                      : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                  }`}
                >
                  Risco de Churn: {cs.churnRisk}
                </Badge>
              </div>

              <DialogTitle className="text-xl font-bold text-foreground flex items-center gap-2">
                {client.nomeFantasia || client.razaoSocial}
                <Badge variant="outline" className="text-xs font-normal">
                  {client.segmento || 'Tecnologia'}
                </Badge>
              </DialogTitle>

              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                CNPJ/CPF: {client.documento} • CSM Responsável: {cs.csmResponsibleName || 'Ana Clara Ribeiro'}
              </DialogDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onOpenNovoNps();
                }}
                size="sm"
                className="text-xs bg-purple-600 hover:bg-purple-700 text-white h-7 gap-1"
              >
                <Award className="w-3.5 h-3.5" /> NPS
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onOpenNovaAcao();
                }}
                size="sm"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white h-7 gap-1"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Ação CS
              </Button>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  onOpenNovaExpansao();
                }}
                size="sm"
                className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white h-7 gap-1"
              >
                <TrendingUp className="w-3.5 h-3.5" /> Upsell
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* KPI METRICS DO CLIENTE */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="rounded-lg border p-3 bg-muted/20">
            <span className="text-[11px] text-muted-foreground">MRR Mensal</span>
            <p className="text-lg font-bold text-foreground mt-0.5">
              R$ {(cs.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-muted/20">
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Health Score</span>
              <Activity className="w-3.5 h-3.5 text-blue-500" />
            </div>
            <p className="text-lg font-bold text-foreground mt-0.5">{cs.healthScore} / 100</p>
            <Progress value={cs.healthScore} className="h-1 mt-1.5" />
          </div>

          <div className="rounded-lg border p-3 bg-muted/20">
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Último NPS</span>
              <Award className="w-3.5 h-3.5 text-purple-500" />
            </div>
            <p className="text-lg font-bold text-purple-600 dark:text-purple-400 mt-0.5">
              {cs.npsLatestScore ?? 10} / 10
            </p>
          </div>

          <div className="rounded-lg border p-3 bg-muted/20">
            <div className="flex justify-between items-center text-[11px] text-muted-foreground">
              <span>Onboarding</span>
              <Clock className="w-3.5 h-3.5 text-amber-500" />
            </div>
            <p className="text-lg font-bold text-foreground mt-0.5">{cs.onboardingProgress}%</p>
            <Progress value={cs.onboardingProgress} className="h-1 mt-1.5" />
          </div>
        </div>

        {/* SUB-TABS DO CLIENTE */}
        <Tabs value={subTab} onValueChange={(val: any) => setSubTab(val)} className="space-y-4 pt-2">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1 border-b">
            <TabsTrigger value="visao_geral" className="text-xs font-semibold gap-1.5">
              <Activity className="w-3.5 h-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="text-xs font-semibold gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Onboarding ({clientSteps.length})
            </TabsTrigger>
            <TabsTrigger value="nps" className="text-xs font-semibold gap-1.5">
              <Award className="w-3.5 h-3.5" /> NPS ({clientNps.length})
            </TabsTrigger>
            <TabsTrigger value="expansao" className="text-xs font-semibold gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" /> Upsell ({clientExpansions.length})
            </TabsTrigger>
            <TabsTrigger value="planos" className="text-xs font-semibold gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Planos de Ação ({clientActionPlans.length})
            </TabsTrigger>
          </TabsList>

          {/* ABA: VISÃO GERAL */}
          <TabsContent value="visao_geral" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="rounded-lg border shadow-xs">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" /> Informações Corporativas
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Razão Social:</span>
                    <span className="font-semibold text-foreground">{client.razaoSocial}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Nome Fantasia:</span>
                    <span className="font-semibold text-foreground">{client.nomeFantasia || '-'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">CNPJ / CPF:</span>
                    <span className="font-mono text-foreground">{client.documento}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Segmento:</span>
                    <span className="font-medium text-foreground">{client.segmento || 'Tecnologia'}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Status do Contrato:</span>
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                      {cs.renewalStatus || 'Em dia'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-lg border shadow-xs">
                <CardHeader className="py-3 px-4 border-b">
                  <CardTitle className="text-xs font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-500" /> Contatos & Atendimento
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2 text-xs">
                  <div className="bg-muted/30 p-2.5 rounded-lg border">
                    <p className="text-muted-foreground text-[10px]">CSM Responsável</p>
                    <p className="font-bold text-foreground text-xs mt-0.5">{cs.csmResponsibleName || 'Ana Clara Ribeiro'}</p>
                  </div>

                  {client.contatos && client.contatos.length > 0 ? (
                    client.contatos.map((ct, idx) => (
                      <div key={idx} className="p-2 rounded-lg border bg-card space-y-0.5 text-xs">
                        <div className="flex justify-between font-semibold text-foreground">
                          <span>{ct.nome}</span>
                          <span className="text-muted-foreground text-[10px] font-normal">{ct.cargo || 'Contato'}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          <span>{ct.email || 'Sem email'}</span> • <span>{ct.telefone || ct.celular || 'Sem fone'}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground py-2 text-center">Nenhum contato cadastrado.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ABA: ONBOARDING */}
          <TabsContent value="onboarding" className="space-y-3">
            <div className="space-y-2">
              {clientSteps.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-6">Nenhuma etapa pendente.</p>
              ) : (
                clientSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex items-start justify-between p-2.5 rounded-lg border text-xs ${
                      step.isCompleted ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-card'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
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
                    <span className="text-muted-foreground text-[10px] font-medium">{step.responsibleName}</span>
                  </div>
                ))
              )}
            </div>
          </TabsContent>

          {/* ABA: NPS */}
          <TabsContent value="nps" className="space-y-3">
            {clientNps.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">Nenhuma avaliação NPS registrada para este cliente.</p>
            ) : (
              clientNps.map((n) => (
                <div key={n.id} className="p-3 rounded-lg border bg-card space-y-1 text-xs">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="text-[10px] font-bold">
                      Nota: {n.rating}/10
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{n.date}</span>
                  </div>
                  <p className="text-muted-foreground italic text-xs">"{n.comment}"</p>
                  <span className="text-[10px] text-muted-foreground block">{n.respondentName} - {n.respondentRole}</span>
                </div>
              ))
            )}
          </TabsContent>

          {/* ABA: EXPANSÃO */}
          <TabsContent value="expansao" className="space-y-3">
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
          </TabsContent>

          {/* ABA: PLANOS DE AÇÃO */}
          <TabsContent value="planos" className="space-y-3">
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
                    <span className="text-[10px] text-muted-foreground block mt-0.5">Prazo: {a.dueDate}</span>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

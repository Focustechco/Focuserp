import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Clock, CheckCircle2, AlertCircle, Building2, UserCheck, Calendar } from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import { CsOnboardingStep } from '../types';

interface OnboardingViewProps {
  clients: (Cliente & { cs: any })[];
  onboardingSteps: CsOnboardingStep[];
  toggleOnboardingStep: (stepId: string) => void;
  onSelectClient: (clientId: string) => void;
}

export function OnboardingView({
  clients,
  onboardingSteps,
  toggleOnboardingStep,
  onSelectClient,
}: OnboardingViewProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(clients[0]?.id || '');

  const selectedClient = clients.find((c) => c.id === selectedClientId) || clients[0];
  const clientSteps = onboardingSteps.filter((s) => s.cs_customer_id === selectedClient?.cs?.id);

  const completedStepsCount = clientSteps.filter((s) => s.isCompleted).length;
  const totalStepsCount = clientSteps.length || 1;
  const progressPercent = Math.round((completedStepsCount / totalStepsCount) * 100);

  return (
    <div className="space-y-6">
      {/* HEADER EXECUTIVO DE ONBOARDING */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Clientes em Implantação</span>
            <p className="text-2xl font-bold text-foreground mt-1">
              {clients.filter((c) => c.cs.onboardingProgress < 100).length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Garantindo time-to-value acelerado</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Implantações Concluídas (Go-Live)</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {clients.filter((c) => c.cs.onboardingProgress >= 100).length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">100% dos marcos operacionais atingidos</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">SLA Médio de Setup</span>
            <p className="text-2xl font-bold text-foreground mt-1">14 dias</p>
            <p className="text-[11px] text-muted-foreground mt-1">Treinamento, integrações e migração de dados</p>
          </CardContent>
        </Card>
      </div>

      {/* PAINEL PRINCIPAL: SELETOR DE CLIENTE E ETAPAS DE SETUP */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LISTA DE CLIENTES E STATUS DE IMPLANTAÇÃO */}
        <Card className="rounded-xl border shadow-xs">
          <CardHeader className="py-4 border-b">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" /> Clientes em Onboarding
            </CardTitle>
          </CardHeader>
          <CardContent className="p-2 space-y-1.5 max-h-[500px] overflow-y-auto">
            {clients.map((client) => {
              const isSelected = client.id === selectedClientId;
              const isCompleted = client.cs.onboardingProgress >= 100;

              return (
                <div
                  key={client.id}
                  onClick={() => setSelectedClientId(client.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-primary/10 border-primary shadow-xs'
                      : 'bg-card hover:bg-muted/50 border-border'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-foreground truncate">
                      {client.nomeFantasia || client.razaoSocial}
                    </span>
                    {isCompleted ? (
                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                        Go-Live
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/30 shrink-0">
                        {client.cs.onboardingProgress}%
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground mt-2">
                    <span>{client.segmento || 'Geral'}</span>
                    <span>{client.cs.csmResponsibleName || 'CSM Responsável'}</span>
                  </div>
                  <Progress value={client.cs.onboardingProgress} className="h-1 mt-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* DETALHE DO CHECKLIST DO CLIENTE SELECIONADO */}
        <Card className="rounded-xl border shadow-xs lg:col-span-2">
          <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" /> Roadmap de Implantação:{' '}
                {selectedClient?.nomeFantasia || selectedClient?.razaoSocial}
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Marcos técnicos, homologação e liberação de acessos aos usuários
              </p>
            </div>
            {selectedClient && (
              <Button
                variant="outline"
                size="sm"
                className="text-xs h-8"
                onClick={() => onSelectClient(selectedClient.id)}
              >
                Abrir Workspace 360°
              </Button>
            )}
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            <div className="bg-muted/30 p-3.5 rounded-lg border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-foreground">Progresso Geral da Implantação</span>
                <span className="font-mono font-bold text-primary">{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>{completedStepsCount} de {totalStepsCount} etapas concluídas</span>
                <span>Previsão de Go-Live: Em dia</span>
              </div>
            </div>

            {/* LISTA DE ETAPAS */}
            <div className="space-y-2.5 pt-2">
              {clientSteps.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground border rounded-lg">
                  Nenhuma etapa de onboarding cadastrada para este cliente.
                </div>
              ) : (
                clientSteps.map((step, idx) => (
                  <div
                    key={step.id}
                    className={`flex items-start justify-between gap-3 p-3 rounded-lg border transition-all ${
                      step.isCompleted
                        ? 'bg-emerald-500/5 border-emerald-500/20'
                        : 'bg-card border-border hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={step.isCompleted}
                        onCheckedChange={() => toggleOnboardingStep(step.id)}
                        className="mt-0.5"
                      />
                      <div>
                        <p
                          className={`text-xs font-semibold ${
                            step.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {idx + 1}. {step.title}
                        </p>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          {step.description}
                        </p>
                        {step.completedAt && (
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 block mt-1">
                            Concluído em {new Date(step.completedAt).toLocaleDateString('pt-BR')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground block">{step.responsibleName || 'CSM'}</span>
                      {step.dueDate && <span>Prazo: {step.dueDate}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

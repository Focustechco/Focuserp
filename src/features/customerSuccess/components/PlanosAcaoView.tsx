import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Plus, AlertTriangle, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import { CsActionPlanItem } from '../types';

interface PlanosAcaoViewProps {
  clients: (Cliente & { cs: any })[];
  actionPlans: CsActionPlanItem[];
  onOpenNovaAcao: () => void;
  onSelectClient: (clientId: string) => void;
}

export function PlanosAcaoView({
  clients,
  actionPlans,
  onOpenNovaAcao,
  onSelectClient,
}: PlanosAcaoViewProps) {
  const [statusFilter, setStatusFilter] = useState<string>('todos');

  const filteredPlans = actionPlans.filter((p) => {
    if (statusFilter === 'todos') return true;
    return p.status === statusFilter;
  });

  return (
    <div className="space-y-6">
      {/* HEADER DE PLANOS DE AÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Total de Ações Preventivas</span>
            <p className="text-2xl font-bold text-foreground mt-1">{actionPlans.length}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Garantindo retenção e satisfação contínua</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Ações em Aberto / Urgentes</span>
            <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
              {actionPlans.filter((p) => p.status !== 'concluido' && p.priority === 'alta').length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Prioridade alta para evitar risco de churn</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Ações Concluídas com Sucesso</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {actionPlans.filter((p) => p.status === 'concluido').length}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Problemas mitigados e confiança restabelecida</p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE PLANOS DE AÇÃO */}
      <Card className="rounded-xl border shadow-xs">
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-500" /> Planos de Ação & Prevenção de Churn ({filteredPlans.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tarefas estratégicas de acompanhamento e intervenções técnicas
            </p>
          </div>
          <Button onClick={onOpenNovaAcao} size="sm" className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-3.5 h-3.5" /> Nova Ação CS
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Plano de Ação / Título</TableHead>
                <TableHead className="text-xs">Prioridade</TableHead>
                <TableHead className="text-xs">Status</TableHead>
                <TableHead className="text-xs">Prazo Limite</TableHead>
                <TableHead className="text-xs">Responsável</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPlans.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                    Nenhum plano de ação pendente. Clique no botão acima para adicionar uma nova ação de CS.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPlans.map((plan) => {
                  const client = clients.find((c) => c.cs.id === plan.cs_customer_id);

                  return (
                    <TableRow key={plan.id} className="hover:bg-muted/50">
                      <TableCell>
                        <span className="font-bold text-xs text-foreground block truncate">
                          {client?.nomeFantasia || client?.razaoSocial || 'Cliente'}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{client?.segmento || 'Geral'}</span>
                      </TableCell>

                      <TableCell className="text-xs">
                        <span className="font-semibold text-foreground block">{plan.title}</span>
                        <span className="text-[11px] text-muted-foreground line-clamp-1">{plan.description}</span>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            plan.priority === 'alta'
                              ? 'bg-rose-500/10 text-rose-600 border-rose-500/30 font-semibold'
                              : plan.priority === 'media'
                              ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
                          }`}
                        >
                          {plan.priority.toUpperCase()}
                        </Badge>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {plan.status === 'a_fazer' && 'A Fazer'}
                          {plan.status === 'em_progresso' && 'Em Progresso'}
                          {plan.status === 'revisao' && 'Em Revisão'}
                          {plan.status === 'concluido' && 'Concluído'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {plan.dueDate}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {plan.responsibleName}
                      </TableCell>

                      <TableCell className="text-right">
                        {client && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary"
                            onClick={() => onSelectClient(client.id)}
                          >
                            Ver Perfil
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

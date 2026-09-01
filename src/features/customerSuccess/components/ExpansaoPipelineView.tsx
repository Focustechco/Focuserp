import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Plus, DollarSign, Target, Building2 } from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import { CsExpansionOpportunity } from '../types';

interface ExpansaoPipelineViewProps {
  clients: (Cliente & { cs: any })[];
  expansions: CsExpansionOpportunity[];
  onOpenNovaExpansao: () => void;
  onSelectClient: (clientId: string) => void;
}

export function ExpansaoPipelineView({
  clients,
  expansions,
  onOpenNovaExpansao,
  onSelectClient,
}: ExpansaoPipelineViewProps) {
  const metrics = useMemo(() => {
    const totalPotentialMrr = expansions.reduce((acc, e) => acc + (e.potentialValue || 0), 0);
    const weightedMrr = expansions.reduce(
      (acc, e) => acc + ((e.potentialValue || 0) * (e.probability || 50)) / 100,
      0
    );
    const wonCount = expansions.filter((e) => e.stage === 'fechada_ganha').length;

    return { totalPotentialMrr, weightedMrr, wonCount };
  }, [expansions]);

  return (
    <div className="space-y-6">
      {/* HEADER DE EXPANSÃO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Pipeline Total de Expansão (MRR)</span>
            <p className="text-2xl font-bold text-foreground mt-1">
              R$ {(metrics.totalPotentialMrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mês</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">Oportunidades mapeadas na base instalada</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">MRR Ponderado por Probabilidade</span>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              R$ {(metrics.weightedMrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mês</span>
            </p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Expectativa realista de expansão líquida</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <span className="text-xs text-muted-foreground">Expansões Concluídas</span>
            <p className="text-2xl font-bold text-primary mt-1">{metrics.wonCount}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Upgrades e novos módulos ativados com sucesso</p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE OPORTUNIDADES */}
      <Card className="rounded-xl border shadow-xs">
        <CardHeader className="py-4 border-b flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Pipeline de Upsell & Cross-Sell ({expansions.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Oportunidades de crescimento dentro dos clientes ativos
            </p>
          </div>
          <Button onClick={onOpenNovaExpansao} size="sm" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
            <Plus className="w-3.5 h-3.5" /> Nova Oportunidade de Expansão
          </Button>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs">Cliente</TableHead>
                <TableHead className="text-xs">Oportunidade / Título</TableHead>
                <TableHead className="text-xs">Tipo</TableHead>
                <TableHead className="text-xs">Produto Ofertado</TableHead>
                <TableHead className="text-xs">MRR Adicional</TableHead>
                <TableHead className="text-xs">Probabilidade</TableHead>
                <TableHead className="text-xs">Estágio</TableHead>
                <TableHead className="text-xs text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expansions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-xs text-muted-foreground">
                    Nenhuma oportunidade de expansão registrada. Clique no botão acima para adicionar.
                  </TableCell>
                </TableRow>
              ) : (
                expansions.map((opp) => {
                  const client = clients.find((c) => c.cs.id === opp.cs_customer_id);

                  return (
                    <TableRow key={opp.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="flex flex-col min-w-0">
                          <span className="font-bold text-xs text-foreground truncate">
                            {client?.nomeFantasia || client?.razaoSocial || 'Cliente'}
                          </span>
                          <span className="text-[10px] text-muted-foreground">{client?.segmento || 'Geral'}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-xs font-semibold text-foreground">
                        {opp.title}
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${
                            opp.type === 'upsell'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                              : 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30'
                          }`}
                        >
                          {opp.type === 'upsell' ? 'Upsell (Upgrade)' : 'Cross-Sell (Novo Módulo)'}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground">{opp.productOffered}</TableCell>

                      <TableCell className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        + R$ {(opp.potentialValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                      </TableCell>

                      <TableCell className="text-xs">
                        <div className="w-24 space-y-1">
                          <span className="font-mono text-[10px] font-semibold">{opp.probability || 50}%</span>
                          <Progress value={opp.probability || 50} className="h-1.5" />
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge variant="outline" className="text-[10px]">
                          {opp.stage === 'identificada' && 'Identificada'}
                          {opp.stage === 'contato' && 'Em Contato'}
                          {opp.stage === 'proposta' && 'Proposta Enviada'}
                          {opp.stage === 'fechada_ganha' && 'Fechada & Ganha'}
                          {opp.stage === 'fechada_perdida' && 'Perdida'}
                        </Badge>
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

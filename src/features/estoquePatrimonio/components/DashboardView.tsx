import React from 'react';
import {
  Package,
  Laptop,
  CheckCircle2,
  Wrench,
  KeyRound,
  AlertTriangle,
  DollarSign,
  ClipboardList,
  TrendingDown,
  ArrowUpRight,
  ShieldCheck,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
}

export function DashboardView({ onNavigateTab }: DashboardViewProps) {
  const {
    equipamentos,
    estoqueItens,
    licencas,
    patrimonios,
    inventarios,
    manutencoes,
  } = useEstoquePatrimonio();

  // Metrics Calculations
  const totalAtivos = equipamentos.length;
  const equipamentosEmUso = equipamentos.filter((e) => e.situacao === 'Em Uso').length;
  const equipamentosDisponiveis = equipamentos.filter((e) => e.situacao === 'Disponível').length;
  const equipamentosManutencao = equipamentos.filter((e) => e.situacao === 'Manutenção').length;

  const licencasAtivas = licencas.length;
  const licencasProximasVencimento = licencas.filter((l) => {
    if (!l.vencimento) return false;
    const diffDays = (new Date(l.vencimento).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
    return diffDays >= 0 && diffDays <= 90;
  }).length;

  const valorPatrimonialTotal = patrimonios.reduce((acc, p) => acc + p.valorAtual, 0);
  const valorCompraTotal = patrimonios.reduce((acc, p) => acc + p.valorCompra, 0);

  const inventariosPendentes = inventarios.filter((i) => i.status !== 'Concluído').length;

  const estoqueBaixoCount = estoqueItens.filter((i) => i.quantidade <= i.quantidadeMinima).length;

  // Breakdown by Category
  const categoriasCount = equipamentos.reduce((acc, eq) => {
    acc[eq.categoria] = (acc[eq.categoria] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* ALERTA DO SISTEMA - ITAM */}
      {(estoqueBaixoCount > 0 || licencasProximasVencimento > 0 || equipamentosManutencao > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20 dark:border-amber-700/50 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                Atenção Operacional no Inventário de TI
              </h4>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                {estoqueBaixoCount > 0 && `${estoqueBaixoCount} item(ns) de estoque abaixo da quantidade mínima. `}
                {licencasProximasVencimento > 0 && `${licencasProximasVencimento} licenças vencendo nos próximos 90 dias. `}
                {equipamentosManutencao > 0 && `${equipamentosManutencao} equipamento(s) em manutenção.`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
              onClick={() => onNavigateTab('estoque')}
            >
              Ver Itens/Estoque
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300"
              onClick={() => onNavigateTab('licencas')}
            >
              Ver Licenças
            </Button>
          </div>
        </div>
      )}

      {/* KPI GRID (8 CARDS PRINCIPAIS) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total de Ativos */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total de Ativos
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Laptop className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{totalAtivos}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <span className="text-emerald-500 font-medium flex items-center">
                <ArrowUpRight className="h-3 w-3 inline" /> 100%
              </span>{' '}
              equipamentos catalogados
            </p>
          </CardContent>
        </Card>

        {/* Equipamentos em Uso */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Em Uso
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{equipamentosEmUso}</div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2">
              <div
                className="bg-emerald-500 h-1.5 rounded-full"
                style={{ width: `${totalAtivos ? (equipamentosEmUso / totalAtivos) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              {totalAtivos ? Math.round((equipamentosEmUso / totalAtivos) * 100) : 0}% alocados a colaboradores
            </p>
          </CardContent>
        </Card>

        {/* Equipamentos Disponíveis */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Disponíveis (Pool)
            </CardTitle>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600">
              <Package className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{equipamentosDisponiveis}</div>
            <p className="text-xs text-muted-foreground mt-1">Prontos para novos colaboradores</p>
          </CardContent>
        </Card>

        {/* Equipamentos em Manutenção */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Em Manutenção
            </CardTitle>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
              <Wrench className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{equipamentosManutencao}</div>
            <p className="text-xs text-muted-foreground mt-1">Preventivas ou upgrades em curso</p>
          </CardContent>
        </Card>

        {/* Licenças Ativas */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Licenças Ativas
            </CardTitle>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-600">
              <KeyRound className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{licencasAtivas}</div>
            <p className="text-xs text-muted-foreground mt-1">Softwares e assinaturas SaaS</p>
          </CardContent>
        </Card>

        {/* Licenças Próximas do Vencimento */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Vencimentos Próximos
            </CardTitle>
            <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{licencasProximasVencimento}</div>
            <p className="text-xs text-rose-500 mt-1 font-medium">Requerem renovação nos próximos 90d</p>
          </CardContent>
        </Card>

        {/* Valor Patrimonial */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Valor Patrimonial
            </CardTitle>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
              <DollarSign className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">
              R$ {(valorPatrimonialTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <TrendingDown className="h-3.5 w-3.5 text-muted-foreground" />
              Valor Original: R$ {(valorCompraTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </p>
          </CardContent>
        </Card>

        {/* Inventários Pendentes */}
        <Card className="hover:shadow-md transition-shadow border-border/80">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Inventários Pendentes
            </CardTitle>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
              <ClipboardList className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-extrabold text-foreground">{inventariosPendentes}</div>
            <p className="text-xs text-muted-foreground mt-1">Campanhas em andamento</p>
          </CardContent>
        </Card>
      </div>

      {/* DASHBOARD SEGUNDA SEÇÃO - DISTRIBUIÇÃO E RESUMO DE LICENÇAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Categoria */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold">Distribuição de Ativos por Categoria</CardTitle>
                <CardDescription className="text-xs">
                  Visão quantitativa de equipamentos corporativos em estoque e uso
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-xs text-primary" onClick={() => onNavigateTab('equipamentos')}>
                Gerenciar Equipamentos &rarr;
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {Object.entries(categoriasCount).map(([categoria, qtd]) => {
                const percentage = Math.round((qtd / totalAtivos) * 100);
                return (
                  <div
                    key={categoria}
                    className="p-3.5 rounded-xl border border-border bg-card/50 hover:bg-muted/40 transition-colors flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                        {categoria}
                      </span>
                      <Badge variant="secondary" className="text-[10px] font-mono">
                        {qtd} un
                      </Badge>
                    </div>
                    <Progress value={percentage} className="h-1.5 mb-1" />
                    <span className="text-[10px] text-muted-foreground">{percentage}% do total</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Resumo de Licenças e Assinaturas */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-bold">Softwares e Licenças Críticas</CardTitle>
              <ShieldCheck className="h-5 w-5 text-indigo-500" />
            </div>
            <CardDescription className="text-xs">Uso de assentos e expiração de SaaS</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {licencas.slice(0, 4).map((lic) => {
              const percUsado = Math.round((lic.quantidadeUsada / lic.quantidadeTotal) * 100);
              const isHigh = percUsado >= 90;
              return (
                <div key={lic.id} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground truncate max-w-[170px]">
                      {lic.nome}
                    </span>
                    <span className="text-muted-foreground font-mono">
                      {lic.quantidadeUsada}/{lic.quantidadeTotal}
                    </span>
                  </div>
                  <Progress
                    value={percUsado}
                    className={`h-2 ${isHigh ? 'bg-rose-100 dark:bg-rose-950' : ''}`}
                  />
                  <div className="flex items-center justify-between text-[10px] text-muted-foreground">
                    <span>{lic.plano}</span>
                    <span className={isHigh ? 'text-rose-500 font-bold' : ''}>
                      {percUsado}% utilizado
                    </span>
                  </div>
                </div>
              );
            })}
            <Button
              variant="outline"
              className="w-full text-xs mt-2"
              onClick={() => onNavigateTab('licencas')}
            >
              Ver Todas as {licencas.length} Licenças
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

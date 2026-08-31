import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  LayoutList,
  LayoutGrid,
  Building2,
  ChevronRight,
  Activity,
  Award,
  DollarSign,
  AlertTriangle,
  Clock,
  Sparkles,
  Users,
  ShieldCheck,
} from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import { CsCustomer } from '../types';

interface CarteiraClientesViewProps {
  clients: (Cliente & { cs: CsCustomer })[];
  onSelectClient: (clientId: string) => void;
  onOpenNovoNps: () => void;
  onOpenNovaAcao: () => void;
  onOpenNovaExpansao: () => void;
}

export function CarteiraClientesView({
  clients,
  onSelectClient,
  onOpenNovoNps,
  onOpenNovaAcao,
  onOpenNovaExpansao,
}: CarteiraClientesViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [healthFilter, setHealthFilter] = useState<string>('all');
  const [churnFilter, setChurnFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchSearch =
        (c.nomeFantasia || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.razaoSocial || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.segmento || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.documento || '').includes(searchTerm);

      const matchHealth = healthFilter === 'all' || c.cs.healthStatus === healthFilter;
      const matchChurn = churnFilter === 'all' || c.cs.churnRisk === churnFilter;

      return matchSearch && matchHealth && matchChurn;
    });
  }, [clients, searchTerm, healthFilter, churnFilter]);

  const metrics = useMemo(() => {
    const total = clients.length;
    const arr = clients.reduce((acc, c) => acc + (c.cs.arr || 0), 0);
    const mrr = clients.reduce((acc, c) => acc + (c.cs.mrr || 0), 0);
    const avgHealth = Math.round(
      clients.reduce((acc, c) => acc + (c.cs.healthScore || 0), 0) / (total || 1)
    );
    const emRisco = clients.filter((c) => c.cs.churnRisk === 'alto' || c.cs.churnRisk === 'critico').length;

    return { total, arr, mrr, avgHealth, emRisco };
  }, [clients]);

  return (
    <div className="space-y-6">
      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Carteira sob Gestão</span>
              <DollarSign className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">
              R$ {(metrics.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              <span className="text-xs font-normal text-muted-foreground ml-1">/mês</span>
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              ARR: R$ {(metrics.arr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Média Health Score</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{metrics.avgHealth} / 100</p>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              {metrics.avgHealth >= 80 ? 'Saúde Operacional Excelente' : 'Acompanhamento Regular'}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>NPS Geral Médio</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">+78</p>
            <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-1">
              Zona de Excelência
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-xl border shadow-xs bg-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between text-muted-foreground text-xs">
              <span>Contas em Risco</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <p className="text-2xl font-bold text-foreground mt-2">{metrics.emRisco}</p>
            <p className="text-[11px] text-muted-foreground mt-1">Requerem plano de ação preventivo</p>
          </CardContent>
        </Card>
      </div>

      {/* BARRA DE FILTROS, BUSCA E ALTERNADOR DE VISUALIZAÇÃO */}
      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente por razão social, nome fantasia, segmento ou documento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="w-full md:w-48">
            <Select value={healthFilter} onValueChange={setHealthFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Health Score" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Health Score: Todos</SelectItem>
                <SelectItem value="excelente" className="text-xs text-emerald-600">Excelente (&gt;85)</SelectItem>
                <SelectItem value="bom" className="text-xs text-blue-600">Bom (70-85)</SelectItem>
                <SelectItem value="atencao" className="text-xs text-amber-600">Atenção (50-70)</SelectItem>
                <SelectItem value="critico" className="text-xs text-rose-600">Crítico (&lt;50)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="w-full md:w-44">
            <Select value={churnFilter} onValueChange={setChurnFilter}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Risco Churn" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs">Risco Churn: Todos</SelectItem>
                <SelectItem value="baixo" className="text-xs text-emerald-600">Baixo</SelectItem>
                <SelectItem value="medio" className="text-xs text-amber-600">Médio</SelectItem>
                <SelectItem value="alto" className="text-xs text-rose-600">Alto / Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* TOGGLE MODO DE VISUALIZAÇÃO */}
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg shrink-0">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('table')}
              title="Visualização em Lista"
            >
              <LayoutList className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant={viewMode === 'cards' ? 'default' : 'ghost'}
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setViewMode('cards')}
              title="Visualização em Cards"
            >
              <LayoutGrid className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* RENDERIZAÇÃO CONDICIONAL: CARDS OU TABELA */}
      {viewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.length === 0 ? (
            <div className="col-span-full text-center py-12 text-muted-foreground text-xs border rounded-xl bg-card">
              Nenhum cliente encontrado com os filtros selecionados.
            </div>
          ) : (
            filteredClients.map((client) => {
              const cs = client.cs;
              const isPromoter = (cs.npsLatestScore || 10) >= 9;
              const isPassive = (cs.npsLatestScore || 10) >= 7 && (cs.npsLatestScore || 10) <= 8;

              return (
                <Card
                  key={client.id}
                  className="rounded-xl border shadow-xs hover:border-primary/50 transition-all bg-card flex flex-col justify-between cursor-pointer group"
                  onClick={() => onSelectClient(client.id)}
                >
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground group-hover:text-primary transition-colors text-sm truncate">
                          {client.nomeFantasia || client.razaoSocial}
                        </h3>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 shrink-0" /> {client.segmento || 'Tecnologia / Software'}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-[10px] shrink-0 ${
                          cs.churnRisk === 'baixo'
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : cs.churnRisk === 'medio'
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        }`}
                      >
                        Risco: {cs.churnRisk}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-3 text-xs flex-1">
                    <div className="grid grid-cols-2 gap-2 bg-muted/30 p-2.5 rounded-lg border text-[11px]">
                      <div>
                        <span className="text-[10px] text-muted-foreground block">MRR Mensal</span>
                        <span className="font-bold text-foreground">
                          R$ {(cs.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground block">CSM Responsável</span>
                        <span className="font-medium text-foreground truncate block">
                          {cs.csmResponsibleName || 'Ana Clara (CSM)'}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between text-[11px]">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-500" /> Health Score
                        </span>
                        <span className="font-mono font-bold text-foreground">{cs.healthScore}/100</span>
                      </div>
                      <Progress
                        value={cs.healthScore}
                        className="h-1.5"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Award className="w-3 h-3 text-purple-500" /> NPS Mais Recente:
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono font-bold ${
                          isPromoter
                            ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                            : isPassive
                            ? 'bg-amber-500/10 text-amber-600 border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-600 border-rose-500/30'
                        }`}
                      >
                        {cs.npsLatestScore ?? 10} / 10 ({cs.npsCategory || 'promotor'})
                      </Badge>
                    </div>
                  </CardContent>

                  <div className="p-3 border-t bg-muted/20 flex items-center justify-between text-xs text-primary font-semibold rounded-b-xl group-hover:bg-primary/5 transition-colors">
                    <span>Abrir Workspace 360°</span>
                    <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Card>
              );
            })
          )}
        </div>
      ) : (
        <Card>
          <CardHeader className="py-4">
            <CardTitle className="text-sm font-semibold">Carteira Geral de Clientes ({filteredClients.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs">Cliente / Razão Social</TableHead>
                  <TableHead className="text-xs">Segmento</TableHead>
                  <TableHead className="text-xs">MRR Mensal</TableHead>
                  <TableHead className="text-xs">Health Score</TableHead>
                  <TableHead className="text-xs">NPS</TableHead>
                  <TableHead className="text-xs">Onboarding</TableHead>
                  <TableHead className="text-xs">Risco Churn</TableHead>
                  <TableHead className="text-xs">CSM</TableHead>
                  <TableHead className="text-xs text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-xs text-muted-foreground">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClients.map((client) => {
                    const cs = client.cs;
                    return (
                      <TableRow
                        key={client.id}
                        className="hover:bg-muted/50 cursor-pointer"
                        onClick={() => onSelectClient(client.id)}
                      >
                        <TableCell>
                          <div className="flex flex-col min-w-0">
                            <span className="font-semibold text-xs text-foreground truncate">
                              {client.nomeFantasia || client.razaoSocial}
                            </span>
                            <span className="text-[10px] font-mono text-muted-foreground">{client.documento}</span>
                          </div>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">{client.segmento || 'Geral'}</TableCell>

                        <TableCell className="text-xs font-semibold text-foreground">
                          R$ {(cs.mrr || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </TableCell>

                        <TableCell className="text-xs">
                          <div className="w-24 space-y-1">
                            <div className="flex justify-between text-[10px] font-mono font-semibold">
                              <span>{cs.healthScore}/100</span>
                            </div>
                            <Progress value={cs.healthScore} className="h-1.5" />
                          </div>
                        </TableCell>

                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-mono">
                            {cs.npsLatestScore ?? 10}/10
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs font-medium">
                          {cs.onboardingProgress >= 100 ? (
                            <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                              Concluído
                            </Badge>
                          ) : (
                            <span className="text-amber-600 font-semibold">{cs.onboardingProgress}%</span>
                          )}
                        </TableCell>

                        <TableCell>
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
                            {cs.churnRisk}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-xs text-muted-foreground">
                          {cs.csmResponsibleName || 'Ana Clara'}
                        </TableCell>

                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs text-primary gap-1"
                            onClick={() => onSelectClient(client.id)}
                          >
                            <Sparkles className="w-3.5 h-3.5" /> 360°
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

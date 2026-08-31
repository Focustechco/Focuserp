import React, { useMemo } from 'react';
import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { CentroCusto } from "@/features/centro-de-custos/types";
import { INITIAL_CENTROS } from "@/features/centro-de-custos/data/initialData";
import { Projeto } from "@/features/projetos/types";
import { Contrato } from "@/features/contratos/types";
import { TituloReceber } from "@/features/contas-receber/types";
import { ContaPagar } from "@/features/contas-pagar/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  ArrowLeft, TrendingUp, TrendingDown, RefreshCw, FolderKanban, FileText, 
  Activity, DollarSign, Calendar, ExternalLink, ArrowUpRight, ArrowDownRight, Tag 
} from "lucide-react";
import { NovoCentroCustoSheet } from "@/features/centro-de-custos/components/NovoCentroCustoSheet";
import { isItemMatchingCentroStrict } from "@/features/centro-de-custos/utils";
import { formatDateBrasilia } from "@/lib/dateUtils";

export const Route = createFileRoute("/centro-de-custos_/$centroId")({
  component: PerfilCentroCustoPage,
});

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

function PerfilCentroCustoPage() {
  const { centroId } = Route.useParams();
  const { data: centros } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: projetos } = useLocalStorageState<Projeto>('focus_projetos', []);
  const { data: contratos } = useLocalStorageState<Contrato>('focus_contratos', []);
  const { data: contasReceber } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);
  const { data: contasPagar } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);

  const centro = centros.find(c => c.id === centroId);

  if (!centro) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Centro de Custo não encontrado</h2>
        <Link to="/centro-de-custos">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Estrutura</Button>
        </Link>
      </div>
    );
  }

  // Obter centro atual e seus descendentes na hierarquia
  const allCentroIds = useMemo(() => {
    if (!centro) return [];
    const getDescendants = (parentId: string): string[] => {
      const children = centros.filter(c => c.centroPaiId === parentId && c.id !== parentId);
      let desc: string[] = children.map(c => c.id);
      children.forEach(ch => {
        desc = [...desc, ...getDescendants(ch.id)];
      });
      return desc;
    };
    return [centro.id, ...getDescendants(centro.id)];
  }, [centro, centros]);

  const targetCentros = useMemo(() => {
    return centros.filter(c => allCentroIds.includes(c.id));
  }, [centros, allCentroIds]);

  // Despesas reais estritamente vinculadas
  const despesasVinculadas = useMemo(() => {
    return contasPagar.filter(cp => {
      return targetCentros.some(c => isItemMatchingCentroStrict(cp, c));
    });
  }, [contasPagar, targetCentros]);

  // Receitas reais estritamente vinculadas
  const receitasVinculadas = useMemo(() => {
    return contasReceber.filter(t => {
      return targetCentros.some(c => isItemMatchingCentroStrict(t, c));
    });
  }, [contasReceber, targetCentros]);

  const totalReceita = receitasVinculadas.reduce((acc, t) => acc + (t.valorLiquido || t.valorOriginal || 0), 0);
  const totalDespesa = despesasVinculadas.reduce((acc, cp) => acc + (cp.valorFinal || cp.valorOriginal || 0), 0);
  const numLancamentos = receitasVinculadas.length + despesasVinculadas.length;
  const resultadoLiquido = totalReceita - totalDespesa;

  const getTipoBadge = (tipo: string) => {
    if (tipo === 'Receita') {
      return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Centro de Receita</Badge>;
    }
    return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200">Centro de Despesa</Badge>;
  };

  // Filtrar projetos e contratos associados
  const projetosClassificados = projetos.filter(p => {
    const pTipo = (p.tipo || '').toLowerCase();
    return pTipo.includes(cName) || cName.includes(pTipo);
  });

  const contratosClassificados = contratos.filter(c => {
    const cDept = (c.departamento || '').toLowerCase();
    return cDept.includes(deptName) || cName.includes(cDept);
  });

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/centro-de-custos">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{centro.codigo} - {centro.nome}</h1>
              {getTipoBadge(centro.tipo)}
              <Badge variant={centro.status === 'Ativo' ? 'default' : 'outline'} className={centro.status === 'Ativo' ? 'bg-blue-500 hover:bg-blue-600' : ''}>
                {centro.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Activity className="w-4 h-4" /> {centro.categoria} • {centro.departamento} • Responsável: {centro.responsavel}
            </p>
          </div>
        </div>
        <NovoCentroCustoSheet>
          <Button><RefreshCw className="w-4 h-4 mr-2" /> Editar Centro</Button>
        </NovoCentroCustoSheet>
      </div>

      {/* EXECUTIVE CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-xl shadow-xs">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Resultado Líquido
            </div>
            <div className={`text-2xl font-bold ${resultadoLiquido >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {formatCurrency(resultadoLiquido)}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Balanço consolidado da área</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-xs">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Receitas Geradas
            </div>
            <div className="text-xl font-bold text-emerald-600">{formatCurrency(totalReceita)}</div>
            <div className="text-xs text-muted-foreground font-medium">{receitasVinculadas.length} entradas no Contas a Receber</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-xs">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500" /> Despesas Incorridas
            </div>
            <div className="text-xl font-bold text-rose-600">{formatCurrency(totalDespesa)}</div>
            <div className="text-xs text-muted-foreground font-medium">{despesasVinculadas.length} saídas no Contas a Pagar</div>
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-xs">
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-violet-500" /> Volumetria Total
            </div>
            <div className="text-xl font-bold">{numLancamentos} lançamentos</div>
            <div className="text-xs text-muted-foreground font-medium">Movimentações ativas apuradas</div>
          </CardContent>
        </Card>
      </div>

      {/* ABAS DE DETALHAMENTO REAL */}
      <Tabs defaultValue="despesas" className="space-y-4 mt-2">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="despesas" className="gap-2 shrink-0">
              <TrendingDown className="w-4 h-4 text-rose-500" /> Despesas Incorridas ({despesasVinculadas.length})
            </TabsTrigger>
            <TabsTrigger value="receitas" className="gap-2 shrink-0">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> Receitas Classificadas ({receitasVinculadas.length})
            </TabsTrigger>
            <TabsTrigger value="projetos" className="gap-2 shrink-0">
              <FolderKanban className="w-4 h-4" /> Projetos ({projetosClassificados.length})
            </TabsTrigger>
            <TabsTrigger value="contratos" className="gap-2 shrink-0">
              <FileText className="w-4 h-4" /> Contratos ({contratosClassificados.length})
            </TabsTrigger>
          </TabsList>
        </div>

        {/* TAB 1: DESPESAS REAIS */}
        <TabsContent value="despesas" className="space-y-4 outline-none">
          <Card className="rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Despesas Vinculadas do Contas a Pagar</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Todas as saídas e contas classificadas diretamente neste Centro de Custo ({centro.nome}).
                </p>
              </div>
              <Link to="/contas-a-pagar">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  Abrir Contas a Pagar <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {despesasVinculadas.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  Nenhuma despesa vinculada a este Centro de Custo até o momento.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-32">Nº / Código</TableHead>
                      <TableHead>Fornecedor / Favorecido</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor Original</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {despesasVinculadas.map((dp) => (
                      <TableRow key={dp.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-bold text-xs text-primary">{dp.numero}</TableCell>
                        <TableCell className="font-medium text-xs">{dp.fornecedor}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{dp.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">{dp.categoria || 'Geral'}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{formatDateBrasilia(dp.dataVencimento)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${
                              dp.status === 'Pago' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : dp.status === 'Vencido' 
                                ? 'bg-rose-50 text-rose-700 border-rose-300' 
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {dp.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-rose-600">
                          {formatCurrency(dp.valorOriginal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: RECEITAS REAIS */}
        <TabsContent value="receitas" className="space-y-4 outline-none">
          <Card className="rounded-xl shadow-xs overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base font-bold">Receitas Classificadas do Contas a Receber</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Títulos, contratos e recebimentos atribuídos a este Centro de Custo.
                </p>
              </div>
              <Link to="/contas-a-receber">
                <Button variant="outline" size="sm" className="text-xs gap-1">
                  Abrir Contas a Receber <ExternalLink className="w-3 h-3" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {receitasVinculadas.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground text-sm">
                  Nenhum recebimento vinculado a este Centro de Custo até o momento.
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="w-32">Nº / Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Vencimento</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor Original</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {receitasVinculadas.map((rec) => (
                      <TableRow key={rec.id} className="hover:bg-muted/30">
                        <TableCell className="font-mono font-bold text-xs text-primary">{rec.numero}</TableCell>
                        <TableCell className="font-medium text-xs">{rec.cliente}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">{rec.descricao}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[11px]">{rec.categoria || 'Geral'}</Badge>
                        </TableCell>
                        <TableCell className="text-xs">{formatDateBrasilia(rec.dataVencimento)}</TableCell>
                        <TableCell>
                          <Badge 
                            variant="outline" 
                            className={`text-[10px] ${
                              rec.status === 'Recebido' 
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300' 
                                : rec.status === 'Atrasado' 
                                ? 'bg-rose-50 text-rose-700 border-rose-300' 
                                : 'bg-amber-50 text-amber-700 border-amber-300'
                            }`}
                          >
                            {rec.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-bold text-xs text-emerald-600">
                          {formatCurrency(rec.valorOriginal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: PROJETOS */}
        <TabsContent value="projetos" className="space-y-4 outline-none">
          <Card className="rounded-xl shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FolderKanban className="w-5 h-5" /> Projetos Classificados ({projetosClassificados.length})</CardTitle>
            </CardHeader>
            <CardContent>
               {projetosClassificados.length === 0 ? (
                 <div className="text-sm text-muted-foreground text-center py-8">Nenhum projeto está utilizando este Centro de Custo.</div>
               ) : (
                 <div className="space-y-4">
                   {projetosClassificados.map(proj => (
                     <div key={proj.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                       <div>
                         <h4 className="text-sm font-medium">{proj.codigo} - {proj.nome}</h4>
                         <p className="text-xs text-muted-foreground">Status: {proj.status}</p>
                       </div>
                       <Link to={`/projetos/$projetoId`} params={{ projetoId: proj.id }}>
                         <Button variant="outline" size="sm">Ver Projeto</Button>
                       </Link>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: CONTRATOS */}
        <TabsContent value="contratos" className="space-y-4 outline-none">
          <Card className="rounded-xl shadow-xs">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5" /> Contratos Classificados ({contratosClassificados.length})</CardTitle>
            </CardHeader>
            <CardContent>
               {contratosClassificados.length === 0 ? (
                 <div className="text-sm text-muted-foreground text-center py-8">Nenhum contrato está utilizando este Centro de Custo.</div>
               ) : (
                 <div className="space-y-4">
                   {contratosClassificados.map(ctr => (
                     <div key={ctr.id} className="flex justify-between items-center border-b pb-4 last:border-0 last:pb-0">
                       <div>
                         <h4 className="text-sm font-medium">{ctr.numeroContrato} - {ctr.nome}</h4>
                         <p className="text-xs text-muted-foreground">{ctr.entidadeVinculo} • {formatCurrency(ctr.valorTotal)}</p>
                       </div>
                       <Link to={`/contratos/$contratoId`} params={{ contratoId: ctr.id }}>
                         <Button variant="outline" size="sm">Ver Contrato</Button>
                       </Link>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

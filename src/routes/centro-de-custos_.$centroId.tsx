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
import { ArrowLeft, TrendingUp, TrendingDown, RefreshCw, FolderKanban, FileText, Activity } from "lucide-react";
import { NovoCentroCustoSheet } from "@/features/centro-de-custos/components/NovoCentroCustoSheet";

export const Route = createFileRoute("/centro-de-custos_/$centroId")({
  component: PerfilCentroCustoPage,
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

  let totalReceita = 0;
  let totalDespesa = 0;
  let numLancamentos = 0;

  const cName = (centro.categoria || centro.nome || '').toLowerCase();
  const deptName = (centro.departamento || '').toLowerCase();

  contasReceber.forEach(t => {
    const tCat = (t.categoria || '').toLowerCase();
    const isMatch = (t.centroCustoId && t.centroCustoId === centro.id) ||
                    (t.centroCustoNome && t.centroCustoNome.toLowerCase() === centro.nome.toLowerCase()) ||
                    (t.centroCusto && t.centroCusto.toLowerCase() === centro.nome.toLowerCase()) ||
                    tCat.includes(cName) || cName.includes(tCat) || (deptName && tCat.includes(deptName));
    if (isMatch) {
      totalReceita += t.valorOriginal || 0;
      numLancamentos++;
    }
  });

  contasPagar.forEach(cp => {
    const cpCat = (cp.categoria || '').toLowerCase();
    const isMatch = (cp.centroCustoId && cp.centroCustoId === centro.id) ||
                    (cp.centroCustoNome && cp.centroCustoNome.toLowerCase() === centro.nome.toLowerCase()) ||
                    (cp.centroCusto && cp.centroCusto.toLowerCase() === centro.nome.toLowerCase()) ||
                    cpCat.includes(cName) || cName.includes(cpCat) || (deptName && cpCat.includes(deptName));
    if (isMatch) {
      totalDespesa += cp.valorOriginal || 0;
      numLancamentos++;
    }
  });

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
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Resultado Líquido</div>
            <div className={`text-2xl font-bold ${resultadoLiquido >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              {formatCurrency(resultadoLiquido)}
            </div>
            <div className="text-xs text-muted-foreground font-medium">Lucro/Prejuízo da Área</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Receita Gerada</div>
            <div className="text-lg font-bold text-emerald-600">{formatCurrency(totalReceita)}</div>
            <div className="text-xs text-muted-foreground font-medium">Total classificado no módulo</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingDown className="w-4 h-4" /> Despesa Incorrida</div>
            <div className="text-lg font-bold text-rose-600">{formatCurrency(totalDespesa)}</div>
            <div className="text-xs text-muted-foreground font-medium">Total classificado no módulo</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><RefreshCw className="w-4 h-4" /> Volumetria</div>
            <div className="text-lg font-bold">{numLancamentos} lançamentos</div>
            <div className="text-xs text-muted-foreground font-medium">Movimentações processadas</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-4">
        {/* PROJETOS VINCULADOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><FolderKanban className="w-5 h-5" /> Projetos Classificados ({projetosClassificados.length})</CardTitle>
          </CardHeader>
          <CardContent>
             {projetosClassificados.length === 0 ? (
               <div className="text-sm text-muted-foreground text-center py-6">Nenhum projeto está utilizando este Centro de Custo.</div>
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

        {/* CONTRATOS VINCULADOS */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Contratos Classificados ({contratosClassificados.length})</CardTitle>
          </CardHeader>
          <CardContent>
             {contratosClassificados.length === 0 ? (
               <div className="text-sm text-muted-foreground text-center py-6">Nenhum contrato está utilizando este Centro de Custo.</div>
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
      </div>
    </div>
  );
}

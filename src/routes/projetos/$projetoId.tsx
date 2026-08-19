import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Projeto } from "@/features/projetos/types";
import { Cliente } from "@/features/clientes/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Briefcase, Clock, Calendar, CheckCircle2, User, DollarSign, Activity, Settings } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { NovoProjetoSheet } from "@/features/projetos/components/NovoProjetoSheet";

export const Route = createFileRoute("/projetos/$projetoId")({
  component: PerfilProjetoPage,
});

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

function PerfilProjetoPage() {
  const { projetoId } = Route.useParams();
  const { data: projetos } = useLocalStorageState<Projeto>('focus_projetos', []);
  const { data: clientes } = useLocalStorageState<Cliente>('focus_clientes', []);
  
  const projeto = projetos.find(p => p.id === projetoId);

  if (!projeto) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Projeto não encontrado</h2>
        <Link to="/projetos">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Projetos</Button>
        </Link>
      </div>
    );
  }

  const cliente = clientes.find(c => c.id === projeto.idCliente);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/projetos">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{projeto.nome}</h1>
              <Badge variant="outline" className="bg-blue-100 text-blue-800">
                {projeto.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> {cliente?.nomeFantasia} • {projeto.codigo}
            </p>
          </div>
        </div>
        <NovoProjetoSheet>
          <Button><Settings className="w-4 h-4 mr-2" /> Gerenciar Projeto</Button>
        </NovoProjetoSheet>
      </div>

      {/* EXECUTIVE CARDS */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Progresso Global</div>
            <div className="text-2xl font-bold">{projeto.progressoGlobal}%</div>
            <Progress value={projeto.progressoGlobal} className="h-2 mt-1" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" /> Esforço (Horas)</div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{projeto.horasRealizadas}h <span className="text-sm font-normal text-muted-foreground">/ {projeto.horasPlanejadas}h</span></div>
            <div className="text-xs text-muted-foreground">Restam {projeto.horasPlanejadas - projeto.horasRealizadas}h no orçamento de tempo.</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Prazos</div>
            <div className="text-sm font-medium">Início: <span className="font-normal text-muted-foreground">{new Date(projeto.dataInicio).toLocaleDateString('pt-BR')}</span></div>
            <div className="text-sm font-medium">Fim: <span className="font-normal text-muted-foreground">{new Date(projeto.dataFinal).toLocaleDateString('pt-BR')}</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> Financeiro</div>
            <div className="font-medium text-emerald-600">{formatCurrency(projeto.valorRecebido)} <span className="text-xs text-muted-foreground font-normal">Recebido</span></div>
            <div className="text-sm text-muted-foreground">{formatCurrency(projeto.valorContratado)} <span className="text-xs font-normal">Total do Contrato</span></div>
          </CardContent>
        </Card>
      </div>

      {/* TABS */}
      <Tabs defaultValue="visaogeral" className="space-y-6 mt-4">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="w-max min-w-full justify-start border-b-0 rounded-none h-auto p-0 bg-transparent gap-2">
            <TabsTrigger value="visaogeral" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Visão Geral</TabsTrigger>
            <TabsTrigger value="lancamentos" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Lançamentos do Projeto</TabsTrigger>
            <TabsTrigger value="relatorio" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">DRE Sintético do Projeto</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="visaogeral" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Resumo do Projeto</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-semibold mb-1">Categoria</h4>
                  <p className="text-sm text-muted-foreground">{projeto.tipo} - {projeto.categoria}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Descrição Geral</h4>
                  <p className="text-sm text-muted-foreground">{projeto.descricaoGeral}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">PM (Responsável)</h4>
                  <p className="text-sm text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> {projeto.responsavelPrincipal}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Marcos (Milestones)</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                  <div className="flex items-center gap-4 border-b pb-4">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Aprovação do Escopo</h4>
                      <p className="text-xs text-muted-foreground">Concluído em 15/10/2026</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium">Entrega do MVP</h4>
                      <p className="text-xs text-muted-foreground">Previsto para 30/11/2026</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cronograma" className="space-y-4">
          <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <Calendar className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Gráfico de Gantt Interativo</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                A visualização avançada do cronograma está planejada para a próxima versão.
                Você pode gerenciar as etapas do cronograma através do botão "Gerenciar Projeto".
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="equipe" className="space-y-4">
          <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <User className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Painel da Equipe</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Visão detalhada de apontamentos de horas por membro da equipe.
                Acesse "Gerenciar Projeto" para alocar recursos.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

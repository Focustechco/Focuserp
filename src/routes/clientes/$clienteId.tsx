import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Cliente } from "@/features/clientes/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Building2, User, Mail, Phone, MapPin, DollarSign, FileText, Activity, AlertCircle } from "lucide-react";
import { NovoClienteSheet } from "@/features/clientes/components/NovoClienteSheet";

export const Route = createFileRoute("/clientes/$clienteId")({
  component: PerfilClientePage,
});

function PerfilClientePage() {
  const { clienteId } = Route.useParams();
  const { data: clientes } = useLocalStorageState<Cliente>('focus_clientes');
  const cliente = (clientes || []).find(c => c.id === clienteId);

  if (!cliente) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <h2 className="text-2xl font-bold">Cliente não encontrado</h2>
        <Link to="/clientes">
          <Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Clientes</Button>
        </Link>
      </div>
    );
  }

  const contatos = Array.isArray(cliente.contatos) ? cliente.contatos : [];
  const contatoPrincipal = contatos.find(c => c?.principal) || contatos[0];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clientes">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{cliente.nomeFantasia}</h1>
              <Badge variant={cliente.status === 'Ativo' ? 'default' : 'secondary'} className={cliente.status === 'Ativo' ? 'bg-emerald-500' : ''}>
                {cliente.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              {cliente.tipo === 'Pessoa Jurídica' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {cliente.documento} • {cliente.codigo}
            </p>
          </div>
        </div>
        <NovoClienteSheet>
          <Button>Editar Cliente</Button>
        </NovoClienteSheet>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Localização</div>
            <div className="font-medium">{cliente.endereco.cidade} - {cliente.endereco.estado}</div>
            <div className="text-xs text-muted-foreground">{cliente.endereco.logradouro}, {cliente.endereco.numero}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Contato Principal</div>
            <div className="font-medium">{contatoPrincipal?.nome || 'N/D'}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {contatoPrincipal?.celular || 'N/D'}</div>
            <div className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" /> {contatoPrincipal?.email || 'N/D'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> Financeiro (LTV)</div>
            <div className="font-medium text-emerald-600">R$ 45.000,00 <span className="text-xs text-muted-foreground font-normal">Recebido</span></div>
            <div className="text-sm text-red-600">R$ 5.400,00 <span className="text-xs text-muted-foreground font-normal">Em Aberto</span></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Relacionamento</div>
            <div className="text-sm">Desde: {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}</div>
            <div className="text-sm">Segmento: {cliente.segmento}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visaogeral" className="space-y-6 mt-4">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="w-max min-w-full justify-start border-b-0 rounded-none h-auto p-0 bg-transparent gap-2">
            <TabsTrigger value="visaogeral" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Visão Geral</TabsTrigger>
            <TabsTrigger value="titulos" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Títulos e Faturas</TabsTrigger>
            <TabsTrigger value="contratos" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Contratos</TabsTrigger>
            <TabsTrigger value="historico" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Timeline</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="visaogeral" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Próximos Vencimentos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between border-b pb-4">
                  <div>
                    <div className="font-medium">Mensalidade - Outubro/2026</div>
                    <div className="text-sm text-muted-foreground">Vencimento: 10/10/2026</div>
                  </div>
                  <div className="font-bold">R$ 1.500,00</div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Documentos Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="text-blue-500 w-5 h-5" />
                    <div>
                      <div className="font-medium text-sm">Contrato_Prestacao_Servico.pdf</div>
                      <div className="text-xs text-muted-foreground">Adicionado em {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}</div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">Download</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="titulos" className="space-y-4">
          <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Integração com Contas a Receber</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                Aqui serão exibidos todos os títulos vinculados a este cliente, puxando diretamente do módulo de Contas a Receber.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos" className="space-y-4">
          <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <FileText className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Integração com Contratos</h3>
              <p className="text-muted-foreground mt-2 max-w-md">
                O histórico de contratos ativos, inativos e distratados aparecerá aqui puxando do Módulo de Contratos.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
           <Card>
            <CardHeader>
              <CardTitle>Histórico de Eventos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative border-l border-muted ml-4 pl-6 space-y-6">
                <div className="relative">
                  <div className="absolute -left-[31px] bg-blue-500 rounded-full w-4 h-4 border-4 border-background" />
                  <div className="text-sm font-medium">Cadastro Criado</div>
                  <div className="text-xs text-muted-foreground">Sistema • {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}</div>
                </div>
                <div className="relative">
                  <div className="absolute -left-[31px] bg-emerald-500 rounded-full w-4 h-4 border-4 border-background" />
                  <div className="text-sm font-medium">Última Atualização</div>
                  <div className="text-xs text-muted-foreground">Admin • {new Date(cliente.ultimaAtualizacao).toLocaleDateString('pt-BR')}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

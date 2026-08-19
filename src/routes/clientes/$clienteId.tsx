import { createFileRoute, Link } from "@tanstack/react-router";
import { useLocalStorageState } from "@/hooks/useDataStore";
import { Cliente } from "@/features/clientes/types";
import { TituloReceber } from "@/features/contas-receber/types";
import { RecorrenciaFinanceira } from "@/features/recorrencias/types";
import { Contrato } from "@/features/contratos/types";
import { calculateClienteFinanceiro } from "@/features/recorrencias/services/recorrenciaEngine";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ArrowLeft, Building2, User, Mail, Phone, MapPin, DollarSign, 
  FileText, Activity, AlertCircle, RefreshCw, Calendar, CheckCircle2, 
  Clock, AlertTriangle 
} from "lucide-react";
import { NovoClienteSheet } from "@/features/clientes/components/NovoClienteSheet";

export const Route = createFileRoute("/clientes/$clienteId")({
  component: PerfilClientePage,
});

function PerfilClientePage() {
  const { clienteId } = Route.useParams();
  const { data: clientes = [] } = useLocalStorageState<Cliente>('focus_clientes');
  const { data: titulos = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: recorrencias = [] } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { data: contratos = [] } = useLocalStorageState<Contrato>('focus_contratos');

  const cliente = clientes.find(c => c.id === clienteId);

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

  const financeiro = calculateClienteFinanceiro(clienteId, titulos, recorrencias, contratos);
  const recorrenciaAtiva = financeiro.recorrenciasDoCliente.find(r => r.status === 'Ativa');
  const proximoTitulo = financeiro.titulosDoCliente
    .filter(t => t.status !== 'Recebido' && t.status !== 'Cancelado')
    .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))[0];

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/clientes">
            <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">{cliente.nomeFantasia || cliente.razaoSocial}</h1>
              <Badge variant={cliente.status === 'Ativo' ? 'default' : 'secondary'} className={cliente.status === 'Ativo' ? 'bg-emerald-500' : ''}>
                {cliente.status}
              </Badge>
              {recorrenciaAtiva && (
                <Badge variant="outline" className="border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/30 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Recorrência Ativa ({recorrenciaAtiva.frequencia})
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              {cliente.tipo === 'Pessoa Jurídica' ? <Building2 className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {cliente.documento} • {cliente.codigo}
            </p>
          </div>
        </div>
        <NovoClienteSheet clienteToEdit={cliente}>
          <Button>Editar Cliente</Button>
        </NovoClienteSheet>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" /> Localização</div>
            <div className="font-medium">{cliente.endereco?.cidade || 'N/D'} - {cliente.endereco?.estado || 'N/D'}</div>
            <div className="text-xs text-muted-foreground">{cliente.endereco?.logradouro || 'Sem endereço'}, {cliente.endereco?.numero || 'S/N'}</div>
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
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" /> Financeiro (Contas a Receber)</div>
            <div className="font-medium text-emerald-600">
              R$ {financeiro.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs text-muted-foreground font-normal">Recebido</span>
            </div>
            <div className="text-sm text-rose-600">
              R$ {financeiro.valorEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs text-muted-foreground font-normal">Em Aberto</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 flex flex-col gap-2">
            <div className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Activity className="w-4 h-4" /> Mensalidade & Atrasos</div>
            <div className="font-medium text-foreground">
              R$ {financeiro.mensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
              <span className="text-xs text-muted-foreground font-normal">/mês</span>
            </div>
            <div className={`text-xs font-semibold ${financeiro.titulosAtrasados > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
              {financeiro.titulosAtrasados} {financeiro.titulosAtrasados === 1 ? 'título em atraso' : 'títulos em atraso'}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="visaogeral" className="space-y-6 mt-4">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="w-max min-w-full justify-start border-b-0 rounded-none h-auto p-0 bg-transparent gap-2">
            <TabsTrigger value="visaogeral" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">Visão Geral</TabsTrigger>
            <TabsTrigger value="titulos" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">
              Títulos e Faturas ({financeiro.titulosDoCliente.length})
            </TabsTrigger>
            <TabsTrigger value="recorrencias" className="shrink-0 whitespace-nowrap data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-4 py-2.5">
              Recorrência ({financeiro.recorrenciasDoCliente.length})
            </TabsTrigger>
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
                {proximoTitulo ? (
                  <div className="flex items-center justify-between border-b pb-4">
                    <div>
                      <div className="font-medium text-sm">{proximoTitulo.descricao}</div>
                      <div className="text-xs text-muted-foreground">
                        Vencimento: {new Date(proximoTitulo.dataVencimento + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                    <div className="font-bold text-sm text-foreground">
                      R$ {proximoTitulo.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground py-4 text-center">
                    Nenhum título pendente com vencimento próximo.
                  </div>
                )}
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
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Títulos Financeiros do Cliente</CardTitle>
              <Badge variant="outline">{financeiro.titulosDoCliente.length} registros</Badge>
            </CardHeader>
            <CardContent>
              {financeiro.titulosDoCliente.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-center">
                  <AlertCircle className="w-10 h-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhum título financeiro encontrado</h3>
                  <p className="text-muted-foreground mt-2 max-w-md text-sm">
                    Configure uma recorrência financeira no cadastro ou registre um recebimento com este cliente.
                  </p>
                </div>
              ) : (
                <div className="divide-y border rounded-lg overflow-hidden">
                  {financeiro.titulosDoCliente.map(titulo => (
                    <div key={titulo.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{titulo.numero}</span>
                          <span className="text-xs text-muted-foreground">• {titulo.descricao}</span>
                          {titulo.origem === 'recorrencia' && (
                            <Badge variant="secondary" className="text-[10px] bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400">
                              Recorrência
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-3">
                          <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Vencimento: {new Date(titulo.dataVencimento + 'T12:00:00Z').toLocaleDateString('pt-BR')}</span>
                          <span>• Forma: {titulo.formaPagamento}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-sm">
                            R$ {titulo.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </div>
                          {titulo.valorRecebido > 0 && (
                            <div className="text-[11px] text-emerald-600 font-medium">
                              Pago: R$ {titulo.valorRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </div>
                          )}
                        </div>
                        <Badge 
                          variant={
                            titulo.status === 'Recebido' ? 'default' : 
                            titulo.status === 'Atrasado' ? 'destructive' : 'outline'
                          }
                          className={titulo.status === 'Recebido' ? 'bg-emerald-600' : ''}
                        >
                          {titulo.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recorrencias" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Configurações de Recorrência</CardTitle>
            </CardHeader>
            <CardContent>
              {financeiro.recorrenciasDoCliente.length === 0 ? (
                <div className="p-10 flex flex-col items-center justify-center text-center">
                  <RefreshCw className="w-10 h-10 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma recorrência configurada</h3>
                  <p className="text-muted-foreground mt-2 max-w-md text-sm">
                    Você pode ativar uma recorrência financeira ao editar este cliente.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {financeiro.recorrenciasDoCliente.map(rec => (
                    <div key={rec.id} className="border rounded-lg p-4 bg-card flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm">{rec.descricao}</span>
                          <Badge variant="outline" className="text-xs">
                            {rec.frequencia}
                          </Badge>
                          <Badge 
                            variant="outline" 
                            className={
                              rec.status === 'Ativa' ? 'text-emerald-600 border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20' : 
                              rec.status === 'Pausada' ? 'text-amber-600 border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20' : 
                              'text-rose-600 border-rose-500/30 bg-rose-50/50 dark:bg-rose-950/20'
                            }
                          >
                            {rec.status}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Próxima cobrança: {new Date(rec.proximaCobranca + 'T12:00:00Z').toLocaleDateString('pt-BR')} • Vencimento: dia {rec.diaVencimento || 10}
                        </div>
                      </div>
                      <div className="font-bold text-base text-foreground">
                        R$ {rec.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contratos" className="space-y-4">
          <Card>
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <FileText className="w-10 h-10 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">Contratos do Cliente</h3>
              {contratos.filter(c => c.clienteId === clienteId).length > 0 ? (
                <div className="w-full mt-4 space-y-2 text-left">
                  {contratos.filter(c => c.clienteId === clienteId).map(c => (
                    <div key={c.id} className="border rounded-md p-3 flex justify-between items-center bg-card">
                      <div>
                        <div className="font-semibold text-sm">{c.nome} ({c.numeroContrato || c.codigo})</div>
                        <div className="text-xs text-muted-foreground">Mensalidade: R$ {(c.valorMensalidade || 0).toLocaleString('pt-BR')} • Status: {c.status}</div>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-primary/10 text-primary rounded">{c.tipoServico}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                  Nenhum contrato ativo registrado para este cliente no módulo de Contratos.
                </p>
              )}
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

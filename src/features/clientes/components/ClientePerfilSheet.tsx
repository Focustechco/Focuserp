import React from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, User, Mail, Phone, MapPin, DollarSign, FileText, 
  Calendar, RefreshCw, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Tag, Info, ExternalLink 
} from 'lucide-react';
import { Cliente } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { RecorrenciaFinanceira } from '@/features/recorrencias/types';
import { Contrato } from '@/features/contratos/types';
import { calculateClienteFinanceiro } from '@/features/recorrencias/services/recorrenciaEngine';

interface ClientePerfilSheetProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (cliente: Cliente) => void;
}

export function ClientePerfilSheet({ cliente, open, onOpenChange, onEdit }: ClientePerfilSheetProps) {
  const { data: titulos = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: recorrencias = [] } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { data: contratos = [] } = useLocalStorageState<Contrato>('focus_contratos');

  if (!cliente) return null;

  const financeiro = calculateClienteFinanceiro(cliente.id, titulos, recorrencias, contratos);
  const recorrenciaAtiva = financeiro.recorrenciasDoCliente.find(r => r.status === 'Ativa');
  const contatos = Array.isArray(cliente.contatos) ? cliente.contatos : [];
  const contatoPrincipal = contatos.find(c => c.principal) || contatos[0];

  const dataCadastroFormatada = cliente.dataCadastro 
    ? new Date(cliente.dataCadastro).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'Data não informada';

  const ultimaAtualizacaoFormatada = cliente.ultimaAtualizacao
    ? new Date(cliente.ultimaAtualizacao).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : dataCadastroFormatada;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto w-full">
        {/* Header do Perfil (Read-Only) */}
        <SheetHeader className="pb-4 border-b space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                  {cliente.codigo}
                </span>
                <Badge 
                  variant={cliente.status === 'Ativo' ? 'default' : 'secondary'} 
                  className={cliente.status === 'Ativo' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
                >
                  {cliente.status}
                </Badge>
                {recorrenciaAtiva && (
                  <Badge variant="outline" className="border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/30 flex items-center gap-1 text-xs">
                    <RefreshCw className="w-3 h-3" /> Recorrência {recorrenciaAtiva.frequencia}
                  </Badge>
                )}
              </div>
              <SheetTitle className="text-2xl font-bold mt-1.5 flex items-center gap-2 text-foreground">
                {cliente.tipo === 'Pessoa Jurídica' ? <Building2 className="w-6 h-6 text-blue-500 shrink-0" /> : <User className="w-6 h-6 text-amber-500 shrink-0" />}
                <span>{cliente.nomeFantasia || cliente.razaoSocial}</span>
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {cliente.tipo} • {cliente.documento} {cliente.inscricaoEstadual && cliente.inscricaoEstadual !== 'Isento' ? `• IE: ${cliente.inscricaoEstadual}` : ''}
              </SheetDescription>
            </div>
          </div>

          {/* Banner de Auditoria de Criação */}
          <div className="bg-muted/40 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2 border">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <span>Cadastrado em: <strong className="text-foreground">{dataCadastroFormatada}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <span>Última atualização: <strong className="text-foreground">{ultimaAtualizacaoFormatada}</strong></span>
            </div>
          </div>
        </SheetHeader>

        {/* Conteúdo em Abas (Apenas Visualização) */}
        <Tabs defaultValue="dados" className="w-full mt-4">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="w-max inline-flex">
              <TabsTrigger value="dados">Dados Cadastrais</TabsTrigger>
              <TabsTrigger value="contatos">Contatos ({contatos.length})</TabsTrigger>
              <TabsTrigger value="endereco">Endereço</TabsTrigger>
              <TabsTrigger value="financeiro">Financeiro & Recorrência</TabsTrigger>
              <TabsTrigger value="contratos">Contratos ({financeiro.titulosDoCliente.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* 1. DADOS CADASTRAIS */}
          <TabsContent value="dados" className="space-y-4 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Tipo de Cliente</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.tipo}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">{cliente.tipo === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF'}</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.documento}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Razão Social / Nome Completo</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.razaoSocial}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Nome Fantasia</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.nomeFantasia || '-'}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Inscrição Estadual</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.inscricaoEstadual || 'Isento'}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Segmento de Mercado</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.segmento || 'Geral'}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Porte da Empresa</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.porteEmpresa || 'Médio'}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Situação Cadastral</div>
                <div className="font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cliente.status === 'Ativo' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  {cliente.status}
                </div>
              </div>
            </div>

            {cliente.observacoes && (
              <div className="p-3.5 rounded-lg border bg-card space-y-1">
                <div className="text-[11px] font-medium text-muted-foreground">Observações Internas</div>
                <div className="text-xs text-foreground whitespace-pre-wrap">{cliente.observacoes}</div>
              </div>
            )}
          </TabsContent>

          {/* 2. CONTATOS */}
          <TabsContent value="contatos" className="space-y-3 mt-3">
            {contatos.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg">
                Nenhum contato cadastrado.
              </div>
            ) : (
              contatos.map((contato, idx) => (
                <div key={contato.id || idx} className="p-4 rounded-lg border bg-card space-y-2 relative">
                  {contato.principal && (
                    <Badge className="absolute top-3 right-3 text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                      Contato Principal
                    </Badge>
                  )}
                  <div className="font-semibold text-sm text-foreground flex items-center gap-2">
                    <User className="w-4 h-4 text-primary" />
                    {contato.nome}
                    <span className="text-xs font-normal text-muted-foreground">• {contato.cargo || 'Responsável'}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                      <span className="text-foreground">{contato.email || 'Não informado'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="text-foreground">{contato.celular || contato.telefone || 'Não informado'}</span>
                      {contato.whatsapp && (
                        <span className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded font-medium">
                          WhatsApp
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          {/* 3. ENDEREÇO */}
          <TabsContent value="endereco" className="space-y-3 mt-3">
            <div className="p-4 rounded-lg border bg-card space-y-3">
              <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                <MapPin className="w-4 h-4 text-rose-500" />
                Endereço Cadastrado
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-muted-foreground block text-[11px]">Logradouro / Rua</span>
                  <span className="font-medium text-foreground">{cliente.endereco?.logradouro || 'Não informado'}, {cliente.endereco?.numero || 'S/N'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Complemento</span>
                  <span className="font-medium text-foreground">{cliente.endereco?.complemento || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Bairro</span>
                  <span className="font-medium text-foreground">{cliente.endereco?.bairro || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Cidade / Estado</span>
                  <span className="font-medium text-foreground">{cliente.endereco?.cidade || 'Não informado'} - {cliente.endereco?.estado || 'UF'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">CEP</span>
                  <span className="font-medium text-foreground">{cliente.endereco?.cep || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">País</span>
                  <span className="font-medium text-foreground">{cliente.endereco?.pais || 'Brasil'}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 4. FINANCEIRO & RECORRÊNCIA */}
          <TabsContent value="financeiro" className="space-y-4 mt-3">
            {/* Cards KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-lg border bg-card">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Valor em Aberto</div>
                <div className="font-bold text-sm text-rose-600 dark:text-rose-400 mt-0.5">
                  R$ {financeiro.valorEmAberto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Recebido</div>
                <div className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-0.5">
                  R$ {financeiro.totalRecebido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mensalidade (MRR)</div>
                <div className="font-bold text-sm text-foreground mt-0.5">
                  R$ {financeiro.mensalidade.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="p-3 rounded-lg border bg-card">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Títulos Atrasados</div>
                <div className={`font-bold text-sm mt-0.5 ${financeiro.titulosAtrasados > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {financeiro.titulosAtrasados}
                </div>
              </div>
            </div>

            {/* Recorrência Ativa */}
            {financeiro.recorrenciasDoCliente.length > 0 && (
              <div className="p-4 rounded-lg border bg-card space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-xs flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                    <RefreshCw className="w-3.5 h-3.5" />
                    Plano de Recorrência Configurado
                  </div>
                </div>
                {financeiro.recorrenciasDoCliente.map(rec => (
                  <div key={rec.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs border-t">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Descrição</span>
                      <span className="font-medium text-foreground">{rec.descricao}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Valor</span>
                      <span className="font-bold text-foreground">R$ {rec.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Frequência / Dia</span>
                      <span className="font-medium text-foreground">{rec.frequencia} (dia {rec.diaVencimento || 10})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Status</span>
                      <span className={`font-medium ${rec.status === 'Ativa' ? 'text-emerald-600' : 'text-amber-600'}`}>{rec.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Títulos do Cliente */}
            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Títulos a Receber Vinculados ({financeiro.titulosDoCliente.length})
              </div>
              {financeiro.titulosDoCliente.length === 0 ? (
                <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg">
                  Nenhum título a receber registrado para este cliente.
                </div>
              ) : (
                <div className="divide-y border rounded-lg max-h-56 overflow-y-auto">
                  {financeiro.titulosDoCliente.slice(0, 10).map(titulo => (
                    <div key={titulo.id} className="p-2.5 flex items-center justify-between text-xs hover:bg-muted/30">
                      <div>
                        <div className="font-medium text-foreground flex items-center gap-1.5">
                          <span>{titulo.numero}</span>
                          <span className="text-muted-foreground">• {titulo.descricao}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          Vencimento: {new Date(titulo.dataVencimento + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-foreground">
                          R$ {titulo.valorOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </div>
                        <Badge variant="outline" className="text-[10px] mt-0.5">
                          {titulo.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* 5. CONTRATOS */}
          <TabsContent value="contratos" className="space-y-3 mt-3">
            {contratos.filter(c => c.clienteId === cliente.id).length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground border rounded-lg">
                Nenhum contrato ativo registrado no módulo de Contratos.
              </div>
            ) : (
              contratos.filter(c => c.clienteId === cliente.id).map(contrato => (
                <div key={contrato.id} className="p-3.5 rounded-lg border bg-card flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-foreground">{contrato.nome} ({contrato.numeroContrato || contrato.codigo})</div>
                    <div className="text-muted-foreground text-[11px]">
                      Mensalidade: R$ {(contrato.valorMensalidade || 0).toLocaleString('pt-BR')} • Status: {contrato.status}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-[10px]">
                    {contrato.tipoServico}
                  </Badge>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Footer do Sheet */}
        <SheetFooter className="mt-6 pt-3 border-t flex flex-row items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          {onEdit && (
            <Button 
              size="sm" 
              onClick={() => {
                onOpenChange(false);
                onEdit(cliente);
              }}
            >
              Editar Cadastro
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

import React, { useState } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, User, Mail, Phone, MapPin, DollarSign, FileText, 
  Calendar, RefreshCw, CheckCircle2, Clock, AlertTriangle, ShieldCheck, 
  Tag, Info, ExternalLink, Download, Eye, FolderOpen, Briefcase, 
  TrendingUp, MessageSquare, Edit3, Globe, Check
} from 'lucide-react';
import { Cliente } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { RecorrenciaFinanceira } from '@/features/recorrencias/types';
import { Contrato } from '@/features/contratos/types';
import { calculateClienteFinanceiro, generateRecorrenciaDates } from '@/features/recorrencias/services/recorrenciaEngine';
import { dmsService } from '@/services/dmsService';
import { DocumentoDMS } from '@/features/documentos/types';
import { DmsPreviewModal } from '@/features/documentos/components/DmsPreviewModal';
import { OportunidadeCrm } from '@/features/crm/types';
import { INITIAL_OPORTUNIDADES } from '@/features/crm/data/initialData';
import { Link } from '@tanstack/react-router';

interface ClientePerfilSheetProps {
  cliente: Cliente | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (cliente: Cliente) => void;
}

export interface ItemTituloCronograma {
  id: string;
  numero: string;
  descricao: string;
  dataEmissao?: string;
  dataVencimento: string;
  valor: number;
  status: 'Recebido' | 'Pendente' | 'Atrasado' | 'Programado';
  isRecorrenciaFutura?: boolean;
  cicloInfo?: string;
}

import { formatDateBrasilia, formatDateTimeBrasilia } from '@/lib/dateUtils';

function formatCurrency(val: any): string {
  const num = typeof val === 'number' ? val : parseFloat(String(val || 0)) || 0;
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatDateSafe(dateVal: any): string {
  return formatDateBrasilia(dateVal);
}

function formatDateTimeSafe(dateVal: any): string {
  return formatDateTimeBrasilia(dateVal);
}

export function ClientePerfilSheet({ cliente, open, onOpenChange, onEdit }: ClientePerfilSheetProps) {
  const { data: titulos = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: recorrencias = [] } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { data: contratos = [] } = useLocalStorageState<Contrato>('focus_contratos');
  const { data: oportunidades = [] } = useLocalStorageState<OportunidadeCrm>('focus_crm_oportunidades', INITIAL_OPORTUNIDADES);
  const { data: projetos = [] } = useLocalStorageState<any>('focus_projetos', []);

  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentoDMS | null>(null);

  const nomeOficial = cliente?.nomeFantasia || cliente?.razaoSocial || 'Cliente';
  const financeiro = calculateClienteFinanceiro(cliente?.id || '', titulos, recorrencias, contratos);
  const recorrenciaAtiva = (financeiro?.recorrenciasDoCliente || []).find(r => r.status === 'Ativa');
  const contatos = Array.isArray(cliente?.contatos) ? cliente.contatos : [];

  const safeNome = String(nomeOficial || '').toLowerCase();

  // Monta a lista completa de títulos recebidos, pendentes e meses futuros da recorrência
  const cronogramaRecebimentos = React.useMemo(() => {
    if (!cliente) return [];
    const titulosEfetivos: ItemTituloCronograma[] = (financeiro?.titulosDoCliente || []).map(t => ({
      id: t.id,
      numero: t.numero,
      descricao: t.descricao,
      dataEmissao: t.dataEmissao,
      dataVencimento: t.dataVencimento,
      valor: t.valorOriginal || (t as any).valor || 0,
      status: (t.status === 'Pago' ? 'Recebido' : t.status) as any,
      isRecorrenciaFutura: false,
    }));

    const recorrenciasCliente = (financeiro?.recorrenciasDoCliente || []).filter(r => r.status === 'Ativa');
    const hoje = new Date().toISOString().split('T')[0];

    const datasTitulosExistentes = new Set(
      titulosEfetivos.map(t => {
        const v = t.dataVencimento || '';
        return v.substring(0, 7); // 'YYYY-MM'
      })
    );

    const titulosFuturos: ItemTituloCronograma[] = [];

    recorrenciasCliente.forEach(rec => {
      const qtdCiclos = rec.quantidade && rec.quantidade > 0 ? rec.quantidade : 12;
      const datas = generateRecorrenciaDates(rec, qtdCiclos);

      datas.forEach((dataVencStr, idx) => {
        const mesAno = dataVencStr.substring(0, 7);
        // Se já existe um título para este mês/ano, não duplica como futuro
        if (!datasTitulosExistentes.has(mesAno) && dataVencStr >= hoje) {
          titulosFuturos.push({
            id: `proj-${rec.id}-${dataVencStr}`,
            numero: `REC-PROG-${dataVencStr.replace(/-/g, '').slice(2, 6)}`,
            descricao: `${rec.descricao} (Recorrência Programada)`,
            dataEmissao: dataVencStr,
            dataVencimento: dataVencStr,
            valor: rec.valor,
            status: 'Programado',
            isRecorrenciaFutura: true,
            cicloInfo: `Mês ${idx + 1}${rec.quantidade ? `/${rec.quantidade}` : ''}`,
          });
        }
      });
    });

    const listaUnificada = [...titulosEfetivos, ...titulosFuturos];
    // Ordenar por data de vencimento crescente
    listaUnificada.sort((a, b) => (a.dataVencimento || '').localeCompare(b.dataVencimento || ''));

    return listaUnificada;
  }, [cliente, financeiro]);

  if (!cliente) return null;

  // 1. Documentos vinculados estritamente a este cliente (Isolamento por ID)
  const todosDocumentos = dmsService.getDocumentos() || [];
  const docsFromClient: any[] = (cliente as any)?.documentos || [];
  const docsDMS = todosDocumentos.filter(d => {
    if (!d) return false;
    if (d.clienteId === cliente.id) return true;
    if (Array.isArray(d.tags) && d.tags.includes(cliente.id)) return true;
    return false;
  });

  const mapDocs = new Map<string, any>();
  docsFromClient.forEach(d => { if (d?.id) mapDocs.set(d.id, d); });
  docsDMS.forEach(d => { if (d?.id && !mapDocs.has(d.id)) mapDocs.set(d.id, d); });
  const documentosDoCliente = Array.from(mapDocs.values());

  // 2. Contratos vinculados
  const contratosDoCliente = (contratos || []).filter(c => {
    if (!c) return false;
    if (c.clienteId === cliente.id) return true;
    if (c.clienteNome && String(c.clienteNome).toLowerCase() === safeNome) return true;
    if (c.nome && String(c.nome).toLowerCase().includes(safeNome)) return true;
    return false;
  });

  // 3. Projetos vinculados
  const projetosDoCliente = (projetos || []).filter((p: any) => {
    if (!p) return false;
    if (p.clienteId === cliente.id) return true;
    if (p.cliente && String(p.cliente).toLowerCase() === safeNome) return true;
    if (p.clienteNome && String(p.clienteNome).toLowerCase() === safeNome) return true;
    return false;
  });

  // 4. Oportunidades / CRM Deals
  const oportunidadesDoCliente = (oportunidades || []).filter(op => {
    if (!op) return false;
    if (op.clienteId === cliente.id) return true;
    if (op.empresa && String(op.empresa).toLowerCase() === safeNome) return true;
    if (op.titulo && String(op.titulo).toLowerCase().includes(safeNome)) return true;
    return false;
  });

  const dataCadastroFormatada = formatDateTimeSafe(cliente.dataCadastro);
  const ultimaAtualizacaoFormatada = formatDateTimeSafe(cliente.ultimaAtualizacao || cliente.dataCadastro);

  const enderecoTexto = [
    cliente.endereco?.logradouro,
    cliente.endereco?.numero ? `nº ${cliente.endereco.numero}` : '',
    cliente.endereco?.complemento,
    cliente.endereco?.bairro,
    cliente.endereco?.cidade,
    cliente.endereco?.estado,
    cliente.endereco?.cep ? `CEP ${cliente.endereco.cep}` : ''
  ].filter(Boolean).join(', ');

  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoTexto || `${cliente.endereco?.cidade || ''} ${cliente.endereco?.estado || ''}`)}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-4xl overflow-y-auto w-full">
        {/* Header do Perfil 360 */}
        <SheetHeader className="pb-4 border-b space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-muted text-muted-foreground font-semibold">
                  {cliente.codigo}
                </span>
                <Badge 
                  variant={cliente.status === 'Ativo' ? 'default' : 'secondary'} 
                  className={cliente.status === 'Ativo' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
                >
                  {cliente.status || 'Ativo'}
                </Badge>
                {recorrenciaAtiva && (
                  <Badge variant="outline" className="border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/30 flex items-center gap-1 text-xs">
                    <RefreshCw className="w-3 h-3" /> Recorrência {recorrenciaAtiva.frequencia}
                  </Badge>
                )}
                {cliente.segmento && (
                  <Badge variant="secondary" className="text-xs">
                    {cliente.segmento}
                  </Badge>
                )}
              </div>

              <SheetTitle className="text-2xl font-bold mt-2 flex items-center gap-2 text-foreground">
                {cliente.tipo === 'Pessoa Jurídica' ? <Building2 className="w-6 h-6 text-blue-500 shrink-0" /> : <User className="w-6 h-6 text-amber-500 shrink-0" />}
                <span>{nomeOficial}</span>
              </SheetTitle>

              <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                {cliente.tipo} • {cliente.documento} 
                {cliente.inscricaoEstadual && cliente.inscricaoEstadual !== 'Isento' ? ` • IE: ${cliente.inscricaoEstadual}` : ''}
                {cliente.inscricaoMunicipal ? ` • IM: ${cliente.inscricaoMunicipal}` : ''}
              </SheetDescription>
            </div>

            {onEdit && (
              <Button 
                size="sm" 
                onClick={() => {
                  onOpenChange(false);
                  onEdit(cliente);
                }}
                className="gap-1.5 text-xs bg-orange-600 hover:bg-orange-700 text-white shrink-0"
              >
                <Edit3 className="w-3.5 h-3.5" /> Editar Cadastro
              </Button>
            )}
          </div>

          {/* Banner de Auditoria de Criação */}
          <div className="bg-muted/30 rounded-lg p-3 text-xs flex flex-wrap items-center justify-between gap-2 border">
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

        {/* Conteúdo em Abas Integradas 360 */}
        <Tabs defaultValue="dados" className="w-full mt-4">
          <div className="overflow-x-auto pb-2 scrollbar-hide">
            <TabsList className="w-max inline-flex p-1 h-auto gap-1">
              <TabsTrigger value="dados" className="text-xs">Dados Cadastrais</TabsTrigger>
              <TabsTrigger value="endereco" className="text-xs">Endereço</TabsTrigger>
              <TabsTrigger value="contatos" className="text-xs">Contatos ({contatos.length})</TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs">Financeiro ({financeiro?.titulosDoCliente?.length || 0})</TabsTrigger>
              <TabsTrigger value="contratos" className="text-xs font-semibold text-primary">
                Contratos ({contratosDoCliente.length})
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs font-semibold text-orange-600">
                Documentos DMS ({documentosDoCliente.length})
              </TabsTrigger>
              <TabsTrigger value="projetos" className="text-xs">Projetos ({projetosDoCliente.length})</TabsTrigger>
              <TabsTrigger value="crm" className="text-xs">CRM & Negócios ({oportunidadesDoCliente.length})</TabsTrigger>
            </TabsList>
          </div>

          {/* 1. DADOS CADASTRAIS */}
          <TabsContent value="dados" className="space-y-4 mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Tipo de Cliente</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.tipo}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">{cliente.tipo === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF'}</div>
                <div className="font-semibold text-sm mt-0.5 font-mono">{cliente.documento}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Situação Cadastral</div>
                <div className="font-semibold text-sm mt-0.5 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${cliente.status === 'Ativo' ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                  {cliente.status || 'Ativo'}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card sm:col-span-2">
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
                <div className="text-[11px] font-medium text-muted-foreground">Inscrição Municipal</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.inscricaoMunicipal || 'Não informada'}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Data Fundação / Nascimento</div>
                <div className="font-semibold text-sm mt-0.5">
                  {formatDateSafe(cliente.dataFundacaoNascimento)}
                </div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Segmento de Atuação</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.segmento || 'Geral'}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Porte da Empresa</div>
                <div className="font-semibold text-sm mt-0.5">{cliente.porteEmpresa || 'Médio'}</div>
              </div>

              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[11px] font-medium text-muted-foreground">Website / Portal</div>
                <div className="font-semibold text-sm mt-0.5 truncate">
                  {cliente.site ? (
                    <a href={cliente.site.startsWith('http') ? cliente.site : `https://${cliente.site}`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 truncate">
                      <Globe className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{cliente.site}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  ) : (
                    'Não informado'
                  )}
                </div>
              </div>
            </div>

            {cliente.observacoes && (
              <div className="p-4 rounded-lg border bg-card space-y-1">
                <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-primary" /> Observações Internas & Comerciais
                </div>
                <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed mt-1">{cliente.observacoes}</div>
              </div>
            )}
          </TabsContent>

          {/* 2. ENDEREÇO COMPLETO */}
          <TabsContent value="endereco" className="space-y-4 mt-3">
            <div className="p-5 rounded-lg border bg-card space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-sm text-foreground">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  Localização e Endereço Físico
                </div>
                <Button variant="outline" size="sm" asChild className="text-xs gap-1.5 h-8">
                  <a href={googleMapsUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-3.5 h-3.5 text-primary" /> Ver no Google Maps
                  </a>
                </Button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <span className="text-muted-foreground block text-[11px]">Logradouro / Rua</span>
                  <span className="font-semibold text-sm text-foreground">{cliente.endereco?.logradouro || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Número</span>
                  <span className="font-semibold text-sm text-foreground">{cliente.endereco?.numero || 'S/N'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Complemento</span>
                  <span className="font-semibold text-sm text-foreground">{cliente.endereco?.complemento || '-'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Bairro</span>
                  <span className="font-semibold text-sm text-foreground">{cliente.endereco?.bairro || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">Cidade / Estado</span>
                  <span className="font-semibold text-sm text-foreground">{cliente.endereco?.cidade ? `${cliente.endereco.cidade}${cliente.endereco.estado ? ` - ${cliente.endereco.estado}` : ''}` : 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">CEP</span>
                  <span className="font-semibold text-sm text-foreground font-mono">{cliente.endereco?.cep || 'Não informado'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block text-[11px]">País</span>
                  <span className="font-semibold text-sm text-foreground">{cliente.endereco?.pais || 'Brasil'}</span>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 3. CONTATOS */}
          <TabsContent value="contatos" className="space-y-3 mt-3">
            {contatos.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                <User className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Nenhum contato cadastrado para este cliente.
              </div>
            ) : (
              contatos.map((contato, idx) => {
                const cleanPhone = (contato.celular || contato.telefone || '').replace(/\D/g, '');
                const waLink = cleanPhone ? `https://wa.me/55${cleanPhone}` : undefined;

                return (
                  <div key={contato.id || idx} className="p-4 rounded-lg border bg-card space-y-3 relative">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                          {(contato.nome || 'CT').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                            {contato.nome || 'Contato'}
                            {contato.principal && (
                              <Badge className="text-[10px] bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                                Contato Principal
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{contato.cargo || 'Responsável'} • {contato.departamento || 'Geral'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {waLink && (
                          <Button size="sm" variant="outline" asChild className="h-7 text-xs gap-1 text-emerald-600 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/30">
                            <a href={waLink} target="_blank" rel="noopener noreferrer">
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </a>
                          </Button>
                        )}
                        {contato.email && (
                          <Button size="sm" variant="outline" asChild className="h-7 text-xs gap-1 text-blue-600 border-blue-300 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/30">
                            <a href={`mailto:${contato.email}`}>
                              <Mail className="w-3 h-3" /> E-mail
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-2 border-t">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="text-foreground truncate">{contato.email || 'Não informado'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="text-foreground">{contato.celular || 'Não informado'}</span>
                      </div>
                      {contato.telefone && (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="text-foreground">{contato.telefone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>

          {/* 4. FINANCEIRO & RECORRÊNCIA INTEGRADA */}
          <TabsContent value="financeiro" className="space-y-4 mt-3">
            {/* Cards KPI */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Valor em Aberto</div>
                <div className="font-bold text-base text-rose-600 dark:text-rose-400 mt-1">
                  R$ {formatCurrency(financeiro?.valorEmAberto)}
                </div>
              </div>
              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Total Recebido</div>
                <div className="font-bold text-base text-emerald-600 dark:text-emerald-400 mt-1">
                  R$ {formatCurrency(financeiro?.totalRecebido)}
                </div>
              </div>
              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mensalidade (MRR)</div>
                <div className="font-bold text-base text-foreground mt-1">
                  R$ {formatCurrency(financeiro?.mensalidade)}
                </div>
              </div>
              <div className="p-3.5 rounded-lg border bg-card">
                <div className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Títulos Atrasados</div>
                <div className={`font-bold text-base mt-1 ${(financeiro?.titulosAtrasados || 0) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                  {financeiro?.titulosAtrasados || 0}
                </div>
              </div>
            </div>

            {/* Recorrência Ativa */}
            {(financeiro?.recorrenciasDoCliente || []).length > 0 && (
              <div className="p-4 rounded-lg border bg-card space-y-2">
                <div className="font-semibold text-xs flex items-center gap-1.5 text-orange-600 dark:text-orange-400">
                  <RefreshCw className="w-3.5 h-3.5" />
                  Plano de Recorrência Configurado
                </div>
                {financeiro.recorrenciasDoCliente.map(rec => (
                  <div key={rec.id} className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs border-t">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Descrição</span>
                      <span className="font-medium text-foreground">{rec.descricao}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Valor</span>
                      <span className="font-bold text-foreground">R$ {formatCurrency(rec.valor)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Frequência / Vencimento</span>
                      <span className="font-medium text-foreground">{rec.frequencia} (Todo dia {rec.diaVencimento || 10})</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground block">Status</span>
                      <span className={`font-medium ${rec.status === 'Ativa' ? 'text-emerald-600' : 'text-amber-600'}`}>{rec.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Títulos a Receber e Cronograma de Meses da Recorrência */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Títulos a Receber & Cronograma Recorrente ({cronogramaRecebimentos.length})
                </span>
                <Link to="/contas-a-receber" className="text-xs text-primary hover:underline flex items-center gap-1">
                  Ver no Contas a Receber <ExternalLink className="w-3 h-3" />
                </Link>
              </div>

              {cronogramaRecebimentos.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  Nenhum título ou recebimento programado para este cliente.
                </div>
              ) : (
                <div className="divide-y border rounded-lg max-h-80 overflow-y-auto bg-card">
                  {cronogramaRecebimentos.map(titulo => (
                    <div key={titulo.id} className="p-3 flex items-center justify-between text-xs hover:bg-muted/30 transition-colors">
                      <div className="space-y-0.5">
                        <div className="font-medium text-foreground flex items-center gap-2">
                          <span className={`font-mono font-bold ${titulo.isRecorrenciaFutura ? 'text-blue-600 dark:text-blue-400' : 'text-primary'}`}>
                            {titulo.numero}
                          </span>
                          <span>• {titulo.descricao}</span>
                          {titulo.cicloInfo && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-normal">
                              {titulo.cicloInfo}
                            </Badge>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          {titulo.dataEmissao && `Emissão: ${formatDateSafe(titulo.dataEmissao)} • `}
                          Vencimento: <strong className="text-foreground">{formatDateSafe(titulo.dataVencimento)}</strong>
                          {titulo.isRecorrenciaFutura && (
                            <span className="text-blue-600 dark:text-blue-400 ml-2 font-medium">• Lançamento Futuro Programado</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-sm text-foreground">
                          R$ {formatCurrency(titulo.valor)}
                        </div>
                        <Badge 
                          variant="outline" 
                          className={`text-[10px] mt-0.5 ${
                            titulo.status === 'Recebido' || (titulo as any).status === 'Pago'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' 
                              : titulo.status === 'Atrasado'
                              ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                              : titulo.status === 'Programado'
                              ? 'bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300'
                              : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
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
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Contratos Homologados ({contratosDoCliente.length})
              </span>
              <Link to="/contratos" className="text-xs text-primary hover:underline flex items-center gap-1">
                Abrir Módulo de Contratos <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {contratosDoCliente.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Nenhum contrato ativo registrado para este cliente.
              </div>
            ) : (
              <div className="space-y-2">
                {contratosDoCliente.map(contrato => (
                  <div key={contrato.id} className="p-3.5 rounded-lg border bg-card flex items-center justify-between text-xs hover:border-primary/50 transition-colors">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{contrato.nome}</span>
                        <Badge variant="outline" className="text-[10px] font-mono">{contrato.numeroContrato || contrato.codigo}</Badge>
                      </div>
                      <p className="text-muted-foreground text-[11px]">
                        {contrato.tipoServico} • Vigência: {formatDateSafe(contrato.dataInicio)} até {contrato.dataFim ? formatDateSafe(contrato.dataFim) : 'Indeterminado'}
                      </p>
                      <p className="text-muted-foreground text-[11px]">
                        Valor Total: <strong>R$ {formatCurrency(contrato.valorTotal || (contrato as any).valor)}</strong> • Mensal: R$ {formatCurrency(contrato.valorMensal || (contrato as any).valorMensalidade)}
                      </p>
                    </div>
                    <Badge className={contrato.status === 'Ativo' ? 'bg-emerald-600' : 'bg-slate-500'}>
                      {contrato.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 6. DOCUMENTOS DMS */}
          <TabsContent value="documentos" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Repositório de Documentos no DMS ({documentosDoCliente.length})
                </span>
                <p className="text-[11px] text-muted-foreground">Pasta central: <code>/Clientes/{nomeOficial}</code></p>
              </div>
              <Link to="/documentos" className="text-xs text-orange-600 hover:underline flex items-center gap-1 font-medium">
                Explorador DMS <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {documentosDoCliente.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-500" />
                Nenhum documento anexado ainda para este cliente.
              </div>
            ) : (
              <div className="space-y-2">
                {documentosDoCliente.map(doc => (
                  <div key={doc.id} className="p-3 rounded-lg border bg-card flex items-center justify-between text-xs hover:border-orange-500/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-6 h-6 text-orange-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-foreground truncate">{doc.nome}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                          <span>{doc.codigo}</span>
                          <span>• {doc.tamanho}</span>
                          <span>• {formatDateSafe(doc.dataUpload)}</span>
                          <span className="bg-secondary px-1 py-0.5 rounded text-[9px]">{doc.categoria || doc.moduloOrigem}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button 
                        size="sm" 
                        variant="secondary" 
                        onClick={() => setSelectedDocPreview(doc)} 
                        className="h-7 text-xs px-2 gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" /> Visualizar
                      </Button>
                      {doc.urlConteudo && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" asChild>
                          <a href={doc.urlConteudo} download={doc.nome}>
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 7. PROJETOS & ENTREGAS */}
          <TabsContent value="projetos" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Projetos Vinculados ({projetosDoCliente.length})
              </span>
              <Link to="/projetos" className="text-xs text-primary hover:underline flex items-center gap-1">
                Ver Módulo Projetos <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {projetosDoCliente.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Nenhum projeto vinculado a este cliente no momento.
              </div>
            ) : (
              <div className="space-y-2">
                {projetosDoCliente.map((proj: any) => (
                  <div key={proj.id} className="p-3.5 rounded-lg border bg-card flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{proj.nome || proj.title}</span>
                        {proj.codigo && <Badge variant="outline" className="text-[10px]">{proj.codigo}</Badge>}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        Responsável: {proj.responsavel || proj.gerente || 'Equipe Focus'} • Prazo: {proj.dataFim ? formatDateSafe(proj.dataFim) : 'A definir'}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {proj.status || 'Em Andamento'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 8. CRM & NEGÓCIOS */}
          <TabsContent value="crm" className="space-y-3 mt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Oportunidades no Pipeline CRM ({oportunidadesDoCliente.length})
              </span>
              <Link to="/crm" className="text-xs text-primary hover:underline flex items-center gap-1">
                Abrir Funil CRM <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {oportunidadesDoCliente.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-lg">
                <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-40" />
                Nenhuma oportunidade aberta no CRM para este cliente.
              </div>
            ) : (
              <div className="space-y-2">
                {oportunidadesDoCliente.map(op => (
                  <div key={op.id} className="p-3.5 rounded-lg border bg-card flex items-center justify-between text-xs">
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{op.titulo}</div>
                      <p className="text-[11px] text-muted-foreground">
                        Valor Estimado: <strong className="text-foreground">R$ {formatCurrency(op.valor)}</strong> • Probabilidade: {op.probabilidade || 0}%
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {op.etapa}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Footer do Sheet */}
        <SheetFooter className="mt-6 pt-3 border-t flex flex-row items-center justify-between sm:justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar
          </Button>
          {onEdit && (
            <Button 
              size="sm" 
              onClick={() => {
                onOpenChange(false);
                onEdit(cliente);
              }}
              className="text-xs bg-orange-600 hover:bg-orange-700 text-white"
            >
              Editar Cadastro
            </Button>
          )}
        </SheetFooter>

        {/* Modal de Preview do Documento Selecionado */}
        {selectedDocPreview && (
          <DmsPreviewModal
            doc={selectedDocPreview}
            open={!!selectedDocPreview}
            onOpenChange={(op) => !op && setSelectedDocPreview(null)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}

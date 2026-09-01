import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Building2, User, MapPin, Phone, Mail, Globe, 
  CreditCard, DollarSign, FolderOpen, History, 
  Edit, Plus, Copy, ExternalLink, Download, Eye, 
  QrCode, CheckCircle2, AlertTriangle, MessageSquare, Clock, Trash2
} from 'lucide-react';
import { Fornecedor } from '../types';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloPagar } from '@/features/contas-pagar/types';
import { dmsService, DocumentoDMS } from '@/services/dmsService';
import { DmsPreviewModal } from '@/features/documentos/components/DmsPreviewModal';
import { toast } from 'sonner';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { Link } from '@tanstack/react-router';

interface FornecedorPerfilSheetProps {
  fornecedor: Fornecedor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (fornecedor: Fornecedor) => void;
  onDelete?: (fornecedor: Fornecedor) => void;
}

const formatCurrency = (val?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

export function FornecedorPerfilSheet({ 
  fornecedor, 
  open, 
  onOpenChange, 
  onEdit,
  onDelete
}: FornecedorPerfilSheetProps) {
  const [selectedDocPreview, setSelectedDocPreview] = useState<DocumentoDMS | null>(null);

  const { data: contasPagar = [] } = useLocalStorageState<TituloPagar>('focus_contas_pagar');

  if (!fornecedor) return null;

  const nomeOficial = fornecedor.nomeFantasia || fornecedor.razaoSocial || 'Fornecedor';
  const contatos = Array.isArray(fornecedor.contatos) ? fornecedor.contatos : [];
  const contatoPrincipal = contatos.find(c => c.principal) || contatos[0];
  const dadosBanc = Array.isArray(fornecedor.dadosBancarios) ? fornecedor.dadosBancarios[0] : null;

  // Títulos vinculados ao fornecedor no Contas a Pagar
  const titulosDoFornecedor = contasPagar.filter(
    t => t && (t.fornecedorId === fornecedor.id || (t.fornecedor && t.fornecedor.toLowerCase() === nomeOficial.toLowerCase()))
  );

  const totalGasto = titulosDoFornecedor.reduce((acc, t) => acc + (t.valorOriginal || 0), 0) || fornecedor.totalContratado || 0;
  const totalPago = titulosDoFornecedor.filter(t => t.status === 'Pago').reduce((acc, t) => acc + (t.valorOriginal || 0), 0) || fornecedor.totalPago || 0;
  const totalPendente = titulosDoFornecedor.filter(t => t.status !== 'Pago').reduce((acc, t) => acc + (t.valorOriginal || 0), 0) || fornecedor.saldoAberto || 0;

  // Documentos no DMS vinculados estritamente a este fornecedor
  const todosDocumentos = dmsService.getDocumentos() || [];
  const docsFromFornec: any[] = (fornecedor as any)?.documentos || [];
  const docsDMS = todosDocumentos.filter(
    d => d && (d.fornecedorId === fornecedor.id || d.clienteId === fornecedor.id || (Array.isArray(d.tags) && d.tags.includes(fornecedor.id)))
  );

  const mapDocs = new Map<string, any>();
  docsFromFornec.forEach(d => { if (d?.id) mapDocs.set(d.id, d); });
  docsDMS.forEach(d => { if (d?.id && !mapDocs.has(d.id)) mapDocs.set(d.id, d); });
  const documentosDoFornecedor = Array.from(mapDocs.values());

  const handleCopyPix = (pix: string) => {
    if (!pix) return;
    navigator.clipboard.writeText(pix);
    toast.success("Chave PIX copiada para a área de transferência!");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-3xl overflow-y-auto p-6 space-y-6">
        {/* Header 360° */}
        <SheetHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-xs ${
                fornecedor.tipo === 'Pessoa Jurídica' 
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' 
                  : 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300'
              }`}>
                {fornecedor.tipo === 'Pessoa Jurídica' ? <Building2 className="w-6 h-6" /> : <User className="w-6 h-6" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <SheetTitle className="text-xl font-bold text-foreground">
                    {nomeOficial}
                  </SheetTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    {fornecedor.codigo || 'F-000'}
                  </Badge>
                  <Badge className={fornecedor.status === 'Ativo' ? 'bg-emerald-600' : 'bg-slate-500'}>
                    {fornecedor.status || 'Ativo'}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {fornecedor.razaoSocial} • <span className="font-mono">{fornecedor.documento}</span> • {fornecedor.categoria || 'Serviços'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onDelete && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => {
                    onDelete(fornecedor);
                  }}
                  className="gap-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/30 border-rose-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Excluir
                </Button>
              )}
              <Button 
                size="sm" 
                variant="default"
                onClick={() => {
                  onOpenChange(false);
                  onEdit(fornecedor);
                }}
                className="gap-1.5 text-xs font-semibold cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar Fornecedor
              </Button>
            </div>
          </div>
        </SheetHeader>

        {/* 4 Cards de Métricas Rápidas */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl border bg-card/60 shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Total Contratado</span>
            <div className="text-lg font-bold text-foreground">{formatCurrency(totalGasto)}</div>
            <p className="text-[10px] text-muted-foreground">{titulosDoFornecedor.length} despesas</p>
          </div>
          <div className="p-3.5 rounded-xl border bg-card/60 shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Total Pago</span>
            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalPago)}</div>
            <p className="text-[10px] text-muted-foreground">Liquidado</p>
          </div>
          <div className="p-3.5 rounded-xl border bg-card/60 shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Saldo a Pagar</span>
            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{formatCurrency(totalPendente)}</div>
            <p className="text-[10px] text-muted-foreground">Pendente / A Vencer</p>
          </div>
          <div className="p-3.5 rounded-xl border bg-card/60 shadow-xs space-y-1">
            <span className="text-[11px] font-medium text-muted-foreground">Condição Padrão</span>
            <div className="text-sm font-bold text-foreground truncate">{fornecedor.condicaoPagamentoPadrao || '30 dias'}</div>
            <p className="text-[10px] text-muted-foreground">{fornecedor.formaPagamentoPadrao || 'PIX'}</p>
          </div>
        </div>

        {/* Tabs de Detalhamento 360° */}
        <Tabs defaultValue="geral" className="w-full">
          <div className="overflow-x-auto scrollbar-hide border-b pb-1">
            <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
              <TabsTrigger value="geral" className="text-xs gap-1.5 shrink-0">
                <Building2 className="w-3.5 h-3.5" /> Visão Geral
              </TabsTrigger>
              <TabsTrigger value="bancario" className="text-xs gap-1.5 shrink-0">
                <CreditCard className="w-3.5 h-3.5" /> Dados Bancários & PIX
              </TabsTrigger>
              <TabsTrigger value="financeiro" className="text-xs gap-1.5 shrink-0">
                <DollarSign className="w-3.5 h-3.5" /> Despesas & Títulos ({titulosDoFornecedor.length})
              </TabsTrigger>
              <TabsTrigger value="documentos" className="text-xs gap-1.5 shrink-0">
                <FolderOpen className="w-3.5 h-3.5" /> Documentos ({documentosDoFornecedor.length})
              </TabsTrigger>
              <TabsTrigger value="auditoria" className="text-xs gap-1.5 shrink-0">
                <History className="w-3.5 h-3.5" /> Auditoria
              </TabsTrigger>
            </TabsList>
          </div>

          {/* 1. VISÃO GERAL */}
          <TabsContent value="geral" className="space-y-4 pt-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 border rounded-xl bg-card space-y-3">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-primary" /> Informações Cadastrais
                </h4>
                <div className="space-y-2 text-muted-foreground">
                  <div>Razão Social: <strong className="text-foreground">{fornecedor.razaoSocial}</strong></div>
                  <div>Nome Fantasia: <strong className="text-foreground">{fornecedor.nomeFantasia}</strong></div>
                  <div>{fornecedor.tipo === 'Pessoa Jurídica' ? 'CNPJ' : 'CPF'}: <strong className="text-foreground font-mono">{fornecedor.documento}</strong></div>
                  {fornecedor.inscricaoEstadual && <div>Inscrição Estadual: <strong className="text-foreground">{fornecedor.inscricaoEstadual}</strong></div>}
                  {fornecedor.inscricaoMunicipal && <div>Inscrição Municipal: <strong className="text-foreground">{fornecedor.inscricaoMunicipal}</strong></div>}
                  <div>Categoria: <strong className="text-foreground">{fornecedor.categoria}</strong></div>
                  {fornecedor.porte && <div>Porte: <strong className="text-foreground">{fornecedor.porte}</strong></div>}
                  {fornecedor.site && (
                    <div className="flex items-center gap-1">
                      Website: 
                      <a href={fornecedor.site.startsWith('http') ? fornecedor.site : `https://${fornecedor.site}`} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-0.5 font-medium">
                        {fornecedor.site} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border rounded-xl bg-card space-y-3">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" /> Endereço Completo
                </h4>
                <div className="space-y-2 text-muted-foreground">
                  <div>Logradouro: <strong className="text-foreground">{fornecedor.endereco?.logradouro ? `${fornecedor.endereco.logradouro}${fornecedor.endereco.numero ? `, ${fornecedor.endereco.numero}` : ''}` : 'Não informado'}</strong></div>
                  {fornecedor.endereco?.complemento && <div>Complemento: <strong className="text-foreground">{fornecedor.endereco.complemento}</strong></div>}
                  <div>Bairro: <strong className="text-foreground">{fornecedor.endereco?.bairro || 'Não informado'}</strong></div>
                  <div>Cidade / UF: <strong className="text-foreground">{fornecedor.endereco?.cidade ? `${fornecedor.endereco.cidade}${fornecedor.endereco.estado ? ` - ${fornecedor.endereco.estado}` : ''}` : 'Não informada'}</strong></div>
                  <div>CEP: <strong className="text-foreground font-mono">{fornecedor.endereco?.cep || 'Não informado'}</strong></div>
                  <div>País: <strong className="text-foreground">{fornecedor.endereco?.pais || 'Brasil'}</strong></div>
                </div>
              </div>
            </div>

            {/* Contato Comercial */}
            {contatoPrincipal && (
              <div className="p-4 border rounded-xl bg-card space-y-3">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-primary" /> Representante Comercial
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Nome & Cargo</span>
                    <strong className="text-foreground">{contatoPrincipal.nome}</strong>
                    <span className="block text-[11px] text-muted-foreground">{contatoPrincipal.cargo || 'Representante'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">E-mail</span>
                    {contatoPrincipal.email ? (
                      <a href={`mailto:${contatoPrincipal.email}`} className="text-primary hover:underline flex items-center gap-1 font-medium">
                        <Mail className="w-3 h-3" /> {contatoPrincipal.email}
                      </a>
                    ) : 'Não informado'}
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[11px]">Telefone & WhatsApp</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-foreground font-mono">{contatoPrincipal.celular || contatoPrincipal.telefone || 'Não informado'}</strong>
                      {contatoPrincipal.whatsapp && (
                        <a 
                          href={`https://wa.me/55${(contatoPrincipal.celular || '').replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-[10px] font-semibold inline-flex items-center gap-0.5"
                        >
                          <MessageSquare className="w-2.5 h-2.5" /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {fornecedor.observacoes && (
              <div className="p-4 border rounded-xl bg-muted/20 space-y-1">
                <span className="font-semibold text-foreground text-xs">Observações Internas:</span>
                <p className="text-muted-foreground leading-relaxed">{fornecedor.observacoes}</p>
              </div>
            )}
          </TabsContent>

          {/* 2. DADOS BANCÁRIOS & PIX */}
          <TabsContent value="bancario" className="space-y-4 pt-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Conta Bancária */}
              <div className="p-4 border rounded-xl bg-card space-y-3">
                <h4 className="font-semibold text-sm text-foreground flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-primary" /> Conta Bancária
                </h4>
                {dadosBanc?.banco ? (
                  <div className="space-y-2 text-muted-foreground">
                    <div>Banco: <strong className="text-foreground">{dadosBanc.banco}</strong></div>
                    <div>Tipo: <strong className="text-foreground">{dadosBanc.tipoConta || 'Corrente'}</strong></div>
                    <div>Agência: <strong className="text-foreground font-mono">{dadosBanc.agencia}</strong></div>
                    <div>Conta Corrente: <strong className="text-foreground font-mono">{dadosBanc.conta}</strong></div>
                    <div>Titular: <strong className="text-foreground">{dadosBanc.favorecido || fornecedor.razaoSocial}</strong></div>
                    <div>CPF/CNPJ do Titular: <strong className="text-foreground font-mono">{dadosBanc.documentoFavorecido || fornecedor.documento}</strong></div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma conta bancária detalhada cadastrada.</p>
                )}
              </div>

              {/* Chave PIX */}
              <div className="p-4 border rounded-xl bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40 space-y-3">
                <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-blue-600" /> Chave PIX
                </h4>
                {dadosBanc?.chavePix || fornecedor.chavePix ? (
                  <div className="space-y-3">
                    <div>
                      <span className="text-muted-foreground text-[11px] block">Tipo de Chave</span>
                      <strong className="text-foreground">{dadosBanc?.tipoChavePix || 'CNPJ'}</strong>
                    </div>
                    <div className="p-3 bg-card border rounded-lg flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-sm text-primary break-all">
                        {dadosBanc?.chavePix || fornecedor.chavePix}
                      </span>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 gap-1 text-xs shrink-0" 
                        onClick={() => handleCopyPix(dadosBanc?.chavePix || fornecedor.chavePix || '')}
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-muted-foreground">Nenhuma chave PIX cadastrada para este fornecedor.</p>
                )}

                <div className="pt-2 border-t text-muted-foreground space-y-1">
                  <div>Condição Padrão: <strong className="text-foreground">{fornecedor.condicaoPagamentoPadrao || '30 dias'}</strong></div>
                  <div>Forma Preferencial: <strong className="text-foreground">{fornecedor.formaPagamentoPadrao || 'PIX'}</strong></div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* 3. FINANCEIRO / CONTAS A PAGAR */}
          <TabsContent value="financeiro" className="space-y-4 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Títulos a Pagar Vinculados ({titulosDoFornecedor.length})
              </span>
              <Link to="/contas-a-pagar" className="text-xs text-primary hover:underline flex items-center gap-1 font-medium">
                Ver no Contas a Pagar <ExternalLink className="w-3 h-3" />
              </Link>
            </div>

            {titulosDoFornecedor.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground">
                <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                Nenhum título a pagar registrado para este fornecedor.
              </div>
            ) : (
              <div className="divide-y border rounded-xl bg-card max-h-72 overflow-y-auto">
                {titulosDoFornecedor.map(t => (
                  <div key={t.id} className="p-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                    <div>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span className="font-mono text-primary font-bold">{t.numero}</span>
                        <span>• {t.descricao}</span>
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        Emissão: {formatDateBrasilia(t.dataEmissao)} • Vencimento: <strong className="text-foreground">{formatDateBrasilia(t.dataVencimento)}</strong>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-sm text-foreground">
                        {formatCurrency(t.valorOriginal)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] mt-0.5 ${
                          t.status === 'Pago' 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300' 
                            : t.status === 'Atrasado'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 dark:bg-rose-950/40 dark:text-rose-300'
                            : 'bg-amber-50 text-amber-700 border-amber-300 dark:bg-amber-950/40 dark:text-amber-300'
                        }`}
                      >
                        {t.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* 4. DOCUMENTOS & CERTIDÕES */}
          <TabsContent value="documentos" className="space-y-4 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                Documentos & Certidões ({documentosDoFornecedor.length})
              </span>
              <span className="text-[11px] text-muted-foreground">
                Salvos na pasta <code className="text-primary font-mono">/Fornecedores/{nomeOficial}</code>
              </span>
            </div>

            {documentosDoFornecedor.length === 0 ? (
              <div className="p-8 text-center border border-dashed rounded-xl text-muted-foreground">
                <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-40 text-orange-500" />
                Nenhum documento ou certidão anexada para este fornecedor.
              </div>
            ) : (
              <div className="space-y-2">
                {documentosDoFornecedor.map(d => (
                  <div key={d.id} className="p-3 border rounded-lg bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <FolderOpen className="w-5 h-5 text-orange-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold truncate text-foreground">{d.nome}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {d.tamanho} • {formatDateBrasilia(d.dataUpload)} • {d.categoria || 'Geral'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={() => setSelectedDocPreview(d)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      {d.urlConteudo && (
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" asChild>
                          <a href={d.urlConteudo} download={d.nome}>
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

          {/* 5. AUDITORIA */}
          <TabsContent value="auditoria" className="space-y-4 pt-3 text-xs">
            <div className="p-4 border rounded-xl bg-muted/10 space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Trilha de Auditoria</h4>
              <p className="text-muted-foreground">Registro automático de homologação e atualizações do cadastro.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-muted-foreground">
                <div>Data de Cadastro: <strong className="text-foreground">{formatDateBrasilia(fornecedor.dataCadastro)}</strong></div>
                <div>Última Atualização: <strong className="text-foreground">{formatDateBrasilia(fornecedor.ultimaAtualizacao)}</strong></div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* Modal de Pré-Visualização de Documentos */}
      {selectedDocPreview && (
        <DmsPreviewModal 
          documento={selectedDocPreview} 
          open={Boolean(selectedDocPreview)} 
          onOpenChange={(op) => !op && setSelectedDocPreview(null)} 
        />
      )}
    </Sheet>
  );
}

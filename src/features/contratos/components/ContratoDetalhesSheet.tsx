import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Contrato } from '../types';
import { downloadDocumentFile } from './NovoContratoSheet';
import { 
  FileText, 
  Download, 
  Edit3, 
  Trash2, 
  Calendar, 
  Building2, 
  User, 
  CheckCircle2, 
  ShieldCheck, 
  Printer, 
  ExternalLink, 
  DollarSign, 
  Clock, 
  FileSignature, 
  Layers, 
  Scale, 
  Sparkles, 
  FileCheck2,
  X,
  Maximize2
} from 'lucide-react';
import focusLogoHq from '@/assets/focus-erp-logo-hq.png';
import { toast } from 'sonner';

interface ContratoDetalhesSheetProps {
  contrato: Contrato | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit?: (contrato: Contrato) => void;
  onDelete?: (contrato: Contrato) => void;
}

export function ContratoDetalhesSheet({
  contrato,
  open,
  onOpenChange,
  onEdit,
  onDelete,
}: ContratoDetalhesSheetProps) {
  const [activeTab, setActiveTab] = useState<'visualizador' | 'dossie'>('visualizador');

  if (!contrato) return null;

  const isFocus = contrato.titularidade === 'Focus Tecnologia' || contrato.entidadeVinculo === 'Focus Tecnologia';
  const nomeContraparte = isFocus
    ? (contrato.fornecedorNome || contrato.contraparteNome || 'Fornecedor / Parceiro Focus')
    : (contrato.clienteNome || 'Cliente Corporativo');

  const formatCurrency = (val?: number | null) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    const [y, m, d] = dateStr.split('T')[0].split('-');
    return `${d}/${m}/${y}`;
  };

  const handleDownload = () => {
    downloadDocumentFile(contrato.arquivoUrl, contrato.arquivoNome, contrato.nome);
    toast.success(`Download de "${contrato.arquivoNome || contrato.nome}" iniciado!`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleOpenExternal = () => {
    if (contrato.arquivoUrl) {
      if (contrato.arquivoUrl.startsWith('data:')) {
        const win = window.open();
        if (win) {
          win.document.write(
            `<iframe src="${contrato.arquivoUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
          );
        }
      } else {
        window.open(contrato.arquivoUrl, '_blank');
      }
    } else {
      toast.info('Visualizando minuta digital oficial na tela.');
    }
  };

  const isPdf = !!contrato.arquivoUrl && (
    contrato.arquivoUrl.includes('application/pdf') || 
    contrato.arquivoNome?.toLowerCase().endsWith('.pdf') || 
    contrato.arquivoUrl.startsWith('data:application/pdf')
  );

  const isImage = !!contrato.arquivoUrl && (
    contrato.arquivoUrl.startsWith('data:image/') ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(contrato.arquivoNome || '')
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-3xl lg:max-w-4xl p-0 flex flex-col h-full bg-background border-l shadow-2xl overflow-hidden"
      >
        {/* CABEÇALHO DA SHEET LATERAL */}
        <SheetHeader className="p-4 sm:p-5 border-b bg-muted/30 dark:bg-muted/10 space-y-3 shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20 px-2 py-0.5 rounded">
                  {contrato.codigo || `CTR-${contrato.id.slice(0, 4).toUpperCase()}`}
                </span>
                
                {isFocus ? (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20 font-semibold gap-1">
                    <Building2 className="w-3 h-3" /> Focus Tecnologia
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20 font-semibold gap-1">
                    <User className="w-3 h-3" /> Contrato com Cliente
                  </Badge>
                )}

                <Badge className="bg-emerald-600 text-white font-semibold text-[10px]">
                  {contrato.status || 'Vigente'}
                </Badge>
              </div>

              <SheetTitle className="text-base sm:text-lg font-bold text-foreground truncate block pt-0.5">
                {contrato.nome || contrato.objetoContrato || 'Contrato de Prestação de Serviços'}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground truncate">
                {contrato.numeroContrato || 'CTR-OFICIAL'} • {contrato.tipoServico || 'Tecnologia & Desenvolvimento'}
              </SheetDescription>
            </div>

            {/* Ações Rápidas no Cabeçalho */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-2.5 text-xs gap-1.5 text-blue-600 border-blue-200 dark:border-blue-800/40 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                  onClick={() => {
                    onOpenChange(false);
                    onEdit(contrato);
                  }}
                  title="Editar dados do contrato"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Editar</span>
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                className="h-8 px-2.5 text-xs gap-1.5 text-emerald-600 border-emerald-200 dark:border-emerald-800/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 font-semibold"
                onClick={handleDownload}
                title="Baixar arquivo original"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Baixar</span>
              </Button>
            </div>
          </div>

          {/* NAVEGAÇÃO ENTRE ABAS */}
          <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
            <TabsList className="grid grid-cols-2 h-9 p-1 bg-muted/60">
              <TabsTrigger value="visualizador" className="text-xs gap-1.5 font-semibold">
                <FileText className="w-3.5 h-3.5 text-orange-600" />
                Visualizar Contrato Upado
              </TabsTrigger>
              <TabsTrigger value="dossie" className="text-xs gap-1.5 font-semibold">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Dossiê & Descrições
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </SheetHeader>

        {/* CORPO DA SHEET */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
          {/* ========================================================================= */}
          {/* ABA 1: VISUALIZADOR DIRETO DO CONTRATO UPADO                              */}
          {/* ========================================================================= */}
          {activeTab === 'visualizador' && (
            <div className="space-y-4 flex flex-col h-full">
              {/* Barra de Ferramentas do Visualizador */}
              <div className="flex items-center justify-between bg-card p-2.5 px-4 rounded-xl border border-border/80 shadow-xs text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="truncate min-w-0">
                    <span className="font-semibold text-foreground truncate block">
                      {contrato.arquivoNome || `${contrato.numeroContrato || 'Contrato'}_Oficial.pdf`}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {contrato.arquivoUrl ? 'Arquivo anexado no cofre CLM' : 'Minuta Digital Homologada'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {contrato.arquivoUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                      onClick={handleOpenExternal}
                      title="Abrir em Nova Aba"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nova Aba</span>
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                    onClick={handlePrint}
                    title="Imprimir documento"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Imprimir</span>
                  </Button>
                  <Button
                    size="sm"
                    className="h-7 px-2.5 text-xs gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-xs"
                    onClick={handleDownload}
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar PDF
                  </Button>
                </div>
              </div>

              {/* RENDERIZADOR DO CONTRATO */}
              {isPdf ? (
                <div className="w-full flex-1 min-h-[600px] rounded-xl border border-border/80 shadow-md overflow-hidden bg-white">
                  <iframe
                    src={contrato.arquivoUrl}
                    title={contrato.nome}
                    className="w-full h-full min-h-[600px] border-0"
                  />
                </div>
              ) : isImage ? (
                <div className="w-full flex-1 min-h-[500px] flex items-center justify-center p-4 bg-white dark:bg-card rounded-xl border border-border/80 shadow-md overflow-auto">
                  <img
                    src={contrato.arquivoUrl}
                    alt={contrato.nome}
                    className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg shadow-lg"
                  />
                </div>
              ) : (
                /* FOLHA DE INSTRUMENTO JURÍDICO DIGITAL OFICIAL (MINUTA COMPLETA TIMBRADA) */
                <div className="w-full bg-white text-slate-900 rounded-2xl shadow-xl border border-slate-200 p-6 sm:p-10 space-y-6 text-left my-2 font-sans selection:bg-orange-100">
                  {/* Timbre Superior */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b-2 border-slate-900 pb-5">
                    <img src={focusLogoHq} alt="Focus ERP" className="h-9 w-auto object-contain" />
                    <div className="text-left sm:text-right text-xs text-slate-600 space-y-0.5">
                      <p className="font-bold text-slate-900 tracking-wider">
                        INSTRUMENTO CONTRATUAL REGISTRADO
                      </p>
                      <p className="font-mono text-slate-500">
                        Protocolo CLM: {contrato.codigo || `CTR-${contrato.id.slice(0, 6).toUpperCase()}`}
                      </p>
                      <p className="text-slate-500">
                        Registro: {formatDate(contrato.dataAssinatura || contrato.dataInicial)}
                      </p>
                    </div>
                  </div>

                  {/* Título Oficial do Contrato */}
                  <div className="text-center py-2 border-b border-slate-100 space-y-1">
                    <span className="text-[10px] font-bold tracking-widest text-orange-600 uppercase bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200">
                      {contrato.tipoServico || 'Contrato de Prestação de Serviços'}
                    </span>
                    <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 uppercase tracking-tight pt-1">
                      {contrato.nome || contrato.objetoContrato || 'Contrato de Prestação de Serviços & Licenciamento'}
                    </h2>
                  </div>

                  {/* Preâmbulo e Qualificação das Partes */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Cláusula Primeira — Das Partes Contratantes
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      De um lado, como <strong>CONTRATADA</strong>, <strong>FOCUS TECNOLOGIA E SISTEMAS LTDA</strong>, pessoa jurídica de direito privado inscrita no CNPJ sob o nº 12.345.678/0001-99, com sede corporativa.
                    </p>
                    <p className="text-slate-700 leading-relaxed">
                      De outro lado, como <strong>CONTRATANTE / TITULAR</strong>, <strong>{nomeContraparte.toUpperCase()}</strong>, doravante qualificada no sistema corporativo de gestão sob vínculo de <strong>{contrato.entidadeVinculo}</strong>.
                    </p>
                  </div>

                  {/* Objeto e Descrição */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Cláusula Segunda — Do Objeto e Escopo
                    </h4>
                    <div className="p-4 rounded-xl bg-slate-50/70 border border-slate-200 text-slate-800 leading-relaxed whitespace-pre-wrap">
                      {contrato.descricao || 
                        `O presente instrumento tem por objeto a prestação de serviços especializados em ${contrato.tipoServico}, incluindo fornecimento de tecnologia, governança corporativa, licenciamento e suporte conforme especificações técnicas acordadas entre as partes.`
                      }
                    </div>
                  </div>

                  {/* Condições Financeiras */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Cláusula Terceira — Dos Valores e Condições de Pagamento
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Valor Global</span>
                        <span className="font-bold text-base text-slate-900 block mt-0.5">
                          {formatCurrency(contrato.valorTotal)}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Mensalidade (MRR)</span>
                        <span className="font-bold text-base text-emerald-700 block mt-0.5">
                          {Number(contrato.valorMensalidade || 0) > 0 ? `${formatCurrency(contrato.valorMensalidade)}/mês` : 'Não aplicável'}
                        </span>
                      </div>

                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <span className="text-[10px] text-slate-500 uppercase font-semibold block">Forma de Pagamento</span>
                        <span className="font-semibold text-xs text-slate-900 block mt-0.5">
                          {contrato.formaPagamento || 'Boleto / Transferência'} {contrato.diaVencimento ? `(Venc. Dia ${contrato.diaVencimento})` : ''}
                        </span>
                      </div>
                    </div>

                    {Number(contrato.valorImplantacao || 0) > 0 && (
                      <p className="text-slate-600 text-xs mt-1">
                        * Taxa de Implantação / Setup acordada: <strong>{formatCurrency(contrato.valorImplantacao)}</strong> ({contrato.condicaoPagamento || 'À vista'}).
                      </p>
                    )}

                    {contrato.observacoesFinanceiras && (
                      <div className="mt-2 p-3 bg-slate-100/70 rounded-lg border border-slate-200 text-slate-700">
                        <span className="font-bold text-[10px] uppercase block mb-1">Observações Financeiras & Reajustes</span>
                        <p className="whitespace-pre-wrap">{contrato.observacoesFinanceiras}</p>
                      </div>
                    )}
                  </div>

                  {/* Vigência e Foro */}
                  <div className="space-y-2 text-xs">
                    <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">
                      Cláusula Quarta — Da Vigência e Disposições Finais
                    </h4>
                    <p className="text-slate-700 leading-relaxed">
                      O presente contrato entra em vigor a partir de <strong>{formatDate(contrato.dataInicial)}</strong>, com vigência estipulada até <strong>{formatDate(contrato.dataFinal)}</strong>, {contrato.renovacaoAutomatica ? 'renovando-se automaticamente por períodos iguais sucessivos' : 'encerrando-se no termo final estipulado'}.
                    </p>
                  </div>

                  {/* Selos de Validação e Assinatura Digital */}
                  <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] text-slate-700">
                        <p className="font-bold text-slate-900">Autenticação Digital ICP-Brasil</p>
                        <p className="text-slate-500 font-mono text-[9.5px]">Hash: SHA256-VALIDATED-FOCUS</p>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                        <FileSignature className="w-5 h-5" />
                      </div>
                      <div className="text-[11px] text-slate-700">
                        <p className="font-bold text-slate-900">Fiscal / Gestor Responsável</p>
                        <p className="text-slate-500 font-semibold">{contrato.responsavelInterno || 'Diretoria Focus'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================================= */}
          {/* ABA 2: DOSSIÊ E DESCRIÇÕES COMPLETAS                                     */}
          {/* ========================================================================= */}
          {activeTab === 'dossie' && (
            <div className="space-y-5 text-xs">
              {/* Partes Envolvidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-2">
                  <span className="text-[10.5px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Contratada / Emissora
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">FOCUS TECNOLOGIA E SISTEMAS LTDA</p>
                      <p className="text-muted-foreground text-[11px]">CNPJ: 12.345.678/0001-99</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-2">
                  <span className="text-[10.5px] text-muted-foreground uppercase font-bold tracking-wider block">
                    Parte Contratante / Titular
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-foreground truncate">{nomeContraparte}</p>
                      <p className="text-muted-foreground text-[11px]">Vínculo: {contrato.entidadeVinculo}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quadro Financeiro */}
              <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Demonstrativo Financeiro & Condições
                </span>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Valor Global</span>
                    <span className="font-bold text-base text-foreground mt-0.5 block">{formatCurrency(contrato.valorTotal)}</span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Implementação</span>
                    <span className="font-bold text-base text-blue-600 mt-0.5 block">
                      {Number(contrato.valorImplantacao || 0) > 0 ? formatCurrency(contrato.valorImplantacao) : 'Isento'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Mensalidade</span>
                    <span className="font-bold text-base text-emerald-600 mt-0.5 block">
                      {Number(contrato.valorMensalidade || 0) > 0 ? formatCurrency(contrato.valorMensalidade) : '-'}
                    </span>
                  </div>

                  <div className="p-3 rounded-lg bg-muted/40 border border-border/50">
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Vigência</span>
                    <span className="font-bold text-xs text-foreground mt-1 block">
                      {formatDate(contrato.dataFinal)}
                    </span>
                  </div>
                </div>

                {/* Detalhes de Pagamento */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Forma de Pagamento</span>
                    <span className="font-semibold text-foreground">{contrato.formaPagamento || 'Boleto / Pix'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Dia de Vencimento</span>
                    <span className="font-semibold text-foreground">{contrato.diaVencimento ? `Todo dia ${contrato.diaVencimento}` : 'Conforme medição'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Reajuste / Índice</span>
                    <span className="font-semibold text-foreground">{contrato.reajuste || 'Anual (IPCA)'}</span>
                  </div>
                </div>

                {contrato.observacoesFinanceiras && (
                  <div className="p-3 rounded-lg bg-muted/30 border text-muted-foreground text-xs space-y-1">
                    <span className="font-bold text-foreground text-[10.5px] uppercase block">Notas Financeiras & Cláusulas Especiais</span>
                    <p className="whitespace-pre-wrap">{contrato.observacoesFinanceiras}</p>
                  </div>
                )}
              </div>

              {/* Descrição e Escopo */}
              <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-2">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Descrição do Objeto & Escopo do Contrato
                </span>
                <div className="p-3.5 rounded-lg bg-muted/30 border text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap">
                  {contrato.descricao || 'Nenhuma descrição detalhada cadastrada para este contrato.'}
                </div>
              </div>

              {/* Vigência & Governança */}
              <div className="p-4 rounded-xl border bg-card shadow-2xs space-y-3">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
                  Prazos, Vigência & Governança
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Data de Início</span>
                    <span className="font-semibold text-foreground">{formatDate(contrato.dataInicial)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Término Previsto</span>
                    <span className="font-semibold text-foreground">{formatDate(contrato.dataFinal)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Fiscal Interno</span>
                    <span className="font-semibold text-foreground">{contrato.responsavelInterno || 'Gestor Focus'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RODAPÉ DA SHEET */}
        <div className="p-4 border-t bg-muted/20 dark:bg-muted/10 flex items-center justify-between gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar
          </Button>

          <div className="flex items-center gap-2">
            {onDelete && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                onClick={() => {
                  onOpenChange(false);
                  onDelete(contrato);
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir Contrato
              </Button>
            )}

            <Button
              size="sm"
              className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold gap-1.5 shadow-xs"
              onClick={handleDownload}
            >
              <Download className="w-3.5 h-3.5" /> Baixar Documento
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download, Printer, FileText, FileSpreadsheet, ShieldCheck, QrCode, Lock,
  X, Loader2, ArrowLeft, Eye, CheckCircle2, ChevronDown, Sparkles
} from 'lucide-react';
import { GeneratedReportData, ReportFormat } from '../types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import focusLogoHq from '@/assets/focus-erp-logo-hq.png';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

interface PreviewProps {
  data: GeneratedReportData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDocumentPreviewModal({ data, isOpen, onClose }: PreviewProps) {
  const { registerExecution } = useRelatoriosStore();
  const [isExporting, setIsExporting] = useState(false);

  if (!data) return null;

  const handleExport = async (fmt: ReportFormat) => {
    setIsExporting(true);

    if (fmt === 'PDF') {
      const element = document.getElementById('report-printable-area');
      if (element) {
        toast.loading('Gerando PDF homologado... Aguarde.', { id: 'pdf-toast' });
        
        try {
          // Renderiza o elemento garantindo resolução cristalina e fundo branco
          const imgData = await toJpeg(element, { 
            quality: 0.98, 
            backgroundColor: '#ffffff',
            pixelRatio: 2.5
          });
          
          const elWidth = element.offsetWidth;
          const elHeight = element.offsetHeight;
          
          const pdf = new jsPDF('p', 'mm', 'a4');
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const margin = 8;
          const finalWidth = pdfWidth - (margin * 2);
          const finalHeight = (elHeight * finalWidth) / elWidth;
          
          pdf.addImage(imgData, 'JPEG', margin, margin, finalWidth, finalHeight);
          pdf.save(`Relatorio-Focus-${data.reportNumber}.pdf`);
          
          // Registrar execução e salvar cópia no DMS com o snapshot visual
          registerExecution(data.definition.id, fmt, data.filters, data, imgData);
          toast.success(`Relatório exportado em PDF e arquivado no módulo Gestão de Documentos (DMS)!`, { id: 'pdf-toast' });
        } catch (err: any) {
          console.error('Erro na exportação PDF:', err);
          toast.error(`Erro ao gerar PDF: ${err.message || 'Falha de processamento'}`, { id: 'pdf-toast' });
        } finally {
          setIsExporting(false);
        }
      }
      return;
    }

    // Exportação em formatos tabulares (CSV/Excel/Word)
    try {
      const headers = data.definition.columns.map(c => c.label).join(';');
      const rows = data.rows.map(r => data.definition.columns.map(c => `"${(r[c.key] ?? '').toString().replace(/"/g, '""')}"`).join(';')).join('\n');
      const csvContent = `\uFEFF${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: fmt === 'DOCX' ? 'application/msword;charset=utf-8;' : 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      const ext = fmt === 'XLSX' ? 'csv' : fmt === 'DOCX' ? 'doc' : 'csv';
      link.download = `Relatorio-Focus-${data.reportNumber}.${ext}`;
      link.click();
      URL.revokeObjectURL(link.href);

      registerExecution(data.definition.id, fmt, data.filters, data);
      toast.success(`Relatório exportado em ${fmt} e salvo no Módulo de Documentos (DMS)!`);
    } catch (err: any) {
      console.error(`Erro na exportação ${fmt}:`, err);
      toast.error(`Erro ao exportar ${fmt}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent 
        hideCloseButton 
        className="fixed inset-0 sm:inset-auto sm:left-[50%] sm:top-[50%] sm:-translate-x-1/2 sm:-translate-y-1/2 w-full h-[100dvh] max-h-[100dvh] sm:w-[94vw] sm:max-w-5xl sm:h-[94vh] sm:max-h-[94vh] p-0 border-0 sm:border shadow-2xl bg-slate-950/98 backdrop-blur-md flex flex-col overflow-hidden rounded-none sm:rounded-2xl z-50 transition-all"
      >
        {/* Acessibilidade DialogHeader oculto */}
        <div className="sr-only">
          <DialogTitle>Visualização do Relatório {data.definition.title}</DialogTitle>
          <DialogDescription>Relatório Corporativo Homologado Focus Finance</DialogDescription>
        </div>

        {/* 1. BARRA DE FERRAMENTAS SUPERIOR (DESIGN MODERNO, TOUCH-FRIENDLY E ROBUSTO) */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 shadow-xs shrink-0 pt-[max(0.625rem,env(safe-area-inset-top))]">
          
          {/* LADO ESQUERDO: Botão Sair/Voltar Mobile + Identificação do Relatório */}
          <div className="flex items-center gap-2 min-w-0">
            {/* Botão Voltar / Sair Mobile (Destacado, Fácil de Tocar) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="sm:hidden h-9 px-3 gap-1.5 text-xs font-semibold rounded-xl border-slate-300 dark:border-slate-700 bg-background hover:bg-muted active:scale-95 transition-all text-slate-800 dark:text-slate-200 shrink-0 shadow-xs"
              aria-label="Voltar e Fechar Relatório"
            >
              <ArrowLeft className="w-4 h-4 text-orange-600" />
              <span>Sair</span>
            </Button>

            {/* Informações e Badges */}
            <div className="flex items-center gap-1.5 min-w-0">
              <Badge variant="outline" className="gap-1 border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-50/60 dark:bg-orange-950/40 text-[10px] sm:text-xs font-semibold shrink-0 py-0.5 px-2">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span className="hidden xs:inline">Homologado</span>
              </Badge>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-mono font-bold truncate">
                #{data.reportNumber}
              </span>
            </div>
          </div>

          {/* LADO DIREITO: Botões de Ação de Exportação & Fechar Desktop */}
          <div className="flex items-center gap-1.5 shrink-0">
            
            {/* Botão Primário de Exportação PDF */}
            <Button 
              size="sm" 
              onClick={() => handleExport('PDF')} 
              disabled={isExporting}
              className="gap-1.5 text-xs h-8 sm:h-9 bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 sm:px-4 rounded-xl shadow-xs shrink-0 active:scale-95 transition-all"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">Exportar</span> PDF
            </Button>

            {/* Menu Outros Formatos (Desktop & Mobile) */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="gap-1 text-xs h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl border-slate-300 dark:border-slate-700 font-medium shrink-0"
                >
                  <span className="hidden sm:inline">Mais</span> Formatos
                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-0.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 p-1.5 rounded-xl">
                <DropdownMenuItem 
                  onClick={() => handleExport('XLSX')} 
                  disabled={isExporting}
                  className="gap-2 text-xs py-2 cursor-pointer text-emerald-600 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Planilha Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExport('CSV')} 
                  disabled={isExporting}
                  className="gap-2 text-xs py-2 cursor-pointer font-medium"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  <span>Arquivo CSV (.csv)</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => handleExport('DOCX')} 
                  disabled={isExporting}
                  className="gap-2 text-xs py-2 cursor-pointer text-blue-600 font-medium"
                >
                  <FileText className="w-4 h-4" />
                  <span>Documento Word (.docx)</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={handlePrint}
                  className="gap-2 text-xs py-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-muted-foreground" />
                  <span>Imprimir / Salvar PDF</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Fechar Desktop (Botão X visível e elegante) */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:text-zinc-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all active:scale-95 cursor-pointer ml-1"
              aria-label="Fechar Janela de Relatório"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* 2. CANVAS DE VISUALIZAÇÃO DO DOCUMENTO (FOLHA COM PROPORÇÕES REFINADAS E SCROLL SUAVE) */}
        <div className="bg-slate-200/90 dark:bg-slate-950 p-2 sm:p-6 lg:p-8 flex justify-center items-start flex-1 overflow-y-auto min-h-0 w-full pb-20 sm:pb-8">
          
          {/* DOCUMENTO INSTITUCIONAL FOCUS (FOLHA RESPONSIVA DE PROPORÇÃO ELEGANTE) */}
          <div 
            className="w-full max-w-4xl bg-white text-slate-900 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 p-3.5 sm:p-8 md:p-10 flex flex-col justify-between transition-all duration-200 overflow-hidden my-auto sm:my-0" 
            id="report-printable-area"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
          >
            
            {/* CORPO DO DOCUMENTO */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* 1. CABEÇALHO INSTITUCIONAL */}
              <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 border-b-2 border-slate-900 pb-3.5 sm:pb-5">
                <div className="flex items-center">
                  <img 
                    src={focusLogoHq} 
                    alt="Focus ERP" 
                    className="h-7 sm:h-9 w-auto object-contain max-w-[160px] sm:max-w-[200px]" 
                  />
                </div>

                <div className="text-left xs:text-right text-[10px] sm:text-xs text-slate-600 space-y-0.5 w-full xs:w-auto border-t xs:border-t-0 pt-2 xs:pt-0 border-slate-100">
                  <p className="font-bold text-slate-900 text-[11px] sm:text-xs">Relatório nº {data.reportNumber}</p>
                  <p className="text-slate-500">Emissão: {new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
                  <p className="text-slate-500">Empresa: {data.filters?.empresa || 'Focus Tecnologia Ltda'}</p>
                </div>
              </div>

              {/* 2. TÍTULO DO RELATÓRIO & SUBTÍTULO */}
              <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col gap-1">
                  <div>
                    <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-orange-600 bg-orange-100 px-2 py-0.5 rounded inline-block mb-1">
                      Módulo {data.definition.category}
                    </span>
                    <h2 className="text-sm sm:text-lg font-bold text-slate-900 leading-tight">
                      {data.definition.title}
                    </h2>
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed mt-0.5">
                    {data.definition.description}
                  </p>
                </div>
              </div>

              {/* 3. CARDS DE RESUMO EXECUTIVO (COMPACTO E PROPORCIONAL EM MOBILE) */}
              {data.metricsSummary && data.metricsSummary.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                  {data.metricsSummary.map((m, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-2 sm:p-3 bg-slate-50">
                      <p className="text-[10px] sm:text-xs text-slate-500 font-medium truncate">{m.label}</p>
                      <p className={`text-xs sm:text-base font-bold mt-0.5 truncate ${m.color || 'text-slate-900'}`}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. TABELA DE DADOS CORPORATIVA (COM BADGE INFORMATIVO NO MOBILE) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden w-full max-w-full bg-white">
                <div className="bg-slate-50 px-3 py-1.5 border-b border-slate-200 flex justify-between items-center text-[10px] text-slate-500">
                  <span className="font-semibold text-slate-700">Registros Listados ({data.rows.length})</span>
                  <span className="text-[9px] sm:hidden text-orange-600 font-medium">↔ Deslize para ver colunas</span>
                </div>
                
                <div className="overflow-x-auto w-full max-w-full scrollbar-thin">
                  <table className="w-full text-xs text-left min-w-[320px] sm:min-w-full border-collapse">
                    <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[9px] sm:text-[11px]">
                      <tr>
                        {data.definition.columns.map(col => (
                          <th key={col.key} className="p-2 sm:p-3 whitespace-nowrap">
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {data.rows.length === 0 ? (
                        <tr>
                          <td colSpan={data.definition.columns.length} className="p-6 text-center text-slate-500">
                            Nenhum registro encontrado para os filtros selecionados.
                          </td>
                        </tr>
                      ) : (
                        data.rows.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/40">
                            {data.definition.columns.map(col => (
                              <td key={col.key} className="p-2 sm:p-3 font-medium text-slate-800 text-[10px] sm:text-xs whitespace-nowrap sm:whitespace-normal">
                                {row[col.key] || '-'}
                              </td>
                            ))}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. OBSERVAÇÕES CUSTOMIZADAS */}
              {Boolean(data?.filters?.observacoesPersonalizadas) && (
                <div className="p-3 sm:p-4 rounded-xl bg-orange-50/80 border border-orange-200/80 text-[11px] sm:text-xs text-orange-950 leading-relaxed">
                  <p className="font-bold mb-0.5 text-orange-900">Observações do Emissor:</p>
                  <p>{data.filters?.observacoesPersonalizadas}</p>
                </div>
              )}
            </div>

            {/* 6. RODAPÉ INSTITUCIONAL COM QR CODE E AUTENTICIDADE */}
            <div className="border-t-2 border-slate-900 pt-3 sm:pt-4 mt-5 sm:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 text-[9px] sm:text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <QrCode className="w-7 h-7 sm:w-8 sm:h-8 text-slate-800 p-0.5 border rounded bg-white shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 flex items-center gap-1 text-[10px] sm:text-xs">
                    <Lock className="w-3 h-3 text-orange-500" /> Autenticidade Digital Verificada
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-slate-400 font-mono">Hash: SHA256-FF-{data.reportNumber}-FOCUS</p>
                </div>
              </div>

              <div className="text-left sm:text-right text-[9px] sm:text-[10px] text-slate-500 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                <p className="font-semibold text-slate-700">CONFIDENCIAL • Uso Interno Autorizado</p>
                <p>Focus ERP — www.focustecnologia.com.br</p>
              </div>
            </div>

          </div>
        </div>

        {/* 3. BARRA INFERIOR FIXA NO MOBILE (GARANTE SAÍDA E EXPORTAÇÃO IMEDIATA SEM ROLAR) */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t px-3 py-2.5 flex items-center justify-between gap-2 shadow-lg pb-[max(0.625rem,env(safe-area-inset-bottom))]">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
            className="flex-1 h-10 gap-2 text-xs font-bold rounded-xl border-slate-300 dark:border-slate-700 active:scale-95"
          >
            <X className="w-4 h-4 text-slate-500" />
            <span>Fechar Relatório</span>
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => handleExport('PDF')}
            disabled={isExporting}
            className="flex-1 h-10 gap-1.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white rounded-xl shadow-xs active:scale-95"
          >
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>Baixar PDF</span>
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}


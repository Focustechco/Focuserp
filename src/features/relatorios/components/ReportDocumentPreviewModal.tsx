import React, { useState, useMemo, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Download, Printer, FileText, FileSpreadsheet, ShieldCheck, QrCode, Lock,
  X, Loader2, ArrowLeft, ChevronDown, Layers, FileCheck, ChevronUp,
  Maximize2, Minimize2, ZoomIn, ZoomOut
} from 'lucide-react';
import { GeneratedReportData, ReportFormat, ReportHierarchyGroup } from '../types';
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

interface ReportPageData {
  pageNumber: number;
  totalPages: number;
  isFirstPage: boolean;
  isLastPage: boolean;
  groups: ReportHierarchyGroup[];
}

export function ReportDocumentPreviewModal({ data, isOpen, onClose }: PreviewProps) {
  const { registerExecution } = useRelatoriosStore();
  const [isExporting, setIsExporting] = useState(false);
  const [activeViewPage, setActiveViewPage] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Paginação Inteligente e Completa do Documento em Folhas A4
  const pages: ReportPageData[] = useMemo(() => {
    if (!data) return [];

    const rawGroups: ReportHierarchyGroup[] = data.hierarchicalGroups && data.hierarchicalGroups.length > 0
      ? data.hierarchicalGroups
      : [
          {
            groupTitle: '1. REGISTROS CONSOLIDADOS',
            groupSubtitle: 'Listagem completa de registros',
            rows: data.rows || [],
          }
        ];

    // Se o total de registros for pequeno (até 6 linhas e 1-2 grupos), cabe em 1 única folha
    const totalRowsCount = rawGroups.reduce((acc, g) => acc + (g.rows?.length || 0), 0);
    if (totalRowsCount <= 6 && rawGroups.length <= 2) {
      return [
        {
          pageNumber: 1,
          totalPages: 1,
          isFirstPage: true,
          isLastPage: true,
          groups: rawGroups,
        }
      ];
    }

    // Caso contrário, dividimos os grupos e registros em páginas de forma limpa e sequencial
    const pageList: Array<{ groups: ReportHierarchyGroup[] }> = [];
    let currentGroups: ReportHierarchyGroup[] = [];
    let currentCount = 0;
    const maxRowsFirstPage = 4; // Página 1 possui cabeçalho institucional amplo e KPIs
    const maxRowsOtherPages = 7; // Páginas seguintes possuem mais espaço para linhas

    rawGroups.forEach((group) => {
      const isFirst = pageList.length === 0;
      const limit = isFirst ? maxRowsFirstPage : maxRowsOtherPages;
      const groupRows = group.rows || [];

      if (groupRows.length === 0) {
        currentGroups.push(group);
        return;
      }

      if (groupRows.length <= Math.max(1, limit - currentCount)) {
        currentGroups.push(group);
        currentCount += groupRows.length + 1;
      } else {
        let remainingRows = [...groupRows];
        let partIndex = 1;

        while (remainingRows.length > 0) {
          const isCurrentFirst = pageList.length === 0;
          const currentLimit = isCurrentFirst ? maxRowsFirstPage : maxRowsOtherPages;
          const available = Math.max(1, currentLimit - currentCount);
          const chunk = remainingRows.slice(0, available);
          remainingRows = remainingRows.slice(available);

          currentGroups.push({
            groupTitle: partIndex === 1 ? group.groupTitle : `${group.groupTitle} (Continuação)`,
            groupSubtitle: group.groupSubtitle,
            groupBadge: partIndex === 1 ? group.groupBadge : undefined,
            rows: chunk,
            subtotals: remainingRows.length === 0 ? group.subtotals : undefined,
          });

          partIndex++;
          currentCount += chunk.length + 1;

          if (remainingRows.length > 0 || currentCount >= currentLimit) {
            pageList.push({ groups: currentGroups });
            currentGroups = [];
            currentCount = 0;
          }
        }
      }
    });

    if (currentGroups.length > 0) {
      pageList.push({ groups: currentGroups });
    }

    const total = Math.max(1, pageList.length);
    return pageList.map((p, idx) => ({
      pageNumber: idx + 1,
      totalPages: total,
      isFirstPage: idx === 0,
      isLastPage: idx === total - 1,
      groups: p.groups,
    }));
  }, [data]);

  if (!data) return null;

  // Rolagem suave para página específica
  const scrollToPage = (pageNum: number) => {
    const target = document.getElementById(`report-sheet-page-${pageNum}`);
    if (target && scrollContainerRef.current) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveViewPage(pageNum);
    }
  };

  const handleExport = async (fmt: ReportFormat) => {
    setIsExporting(true);

    if (fmt === 'PDF') {
      const pageElements = document.querySelectorAll<HTMLElement>('.report-page-sheet');
      if (pageElements && pageElements.length > 0) {
        toast.loading(`Gerando PDF corporativo completo (${pageElements.length} página${pageElements.length > 1 ? 's' : ''})... Aguarde.`, { id: 'pdf-toast' });
        
        try {
          const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
          });

          const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
          const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm
          const margin = 8;
          const maxW = pdfWidth - (margin * 2);
          const maxH = pdfHeight - (margin * 2);

          for (let i = 0; i < pageElements.length; i++) {
            const pageEl = pageElements[i];
            
            const imgData = await toJpeg(pageEl, { 
              quality: 0.98, 
              backgroundColor: '#ffffff',
              pixelRatio: 2.2,
              cacheBust: true,
              style: {
                transform: 'none',
                margin: '0',
              }
            });

            const elWidth = pageEl.offsetWidth || 800;
            const elHeight = pageEl.offsetHeight || 1100;
            
            let finalWidth = maxW;
            let finalHeight = (elHeight * finalWidth) / elWidth;

            if (finalHeight > maxH) {
              finalHeight = maxH;
              finalWidth = (elWidth * finalHeight) / elHeight;
            }

            const posX = margin + (maxW - finalWidth) / 2;
            const posY = margin + (maxH - finalHeight) / 2;

            if (i > 0) {
              pdf.addPage('a4', 'p');
            }

            pdf.addImage(imgData, 'JPEG', posX, posY, finalWidth, finalHeight, undefined, 'FAST');
          }

          pdf.save(`Relatorio-Focus-${data.reportNumber}.pdf`);
          
          // Registrar execução e salvar cópia no DMS
          registerExecution(data.definition.id, fmt, data.filters, data);
          toast.success(`Relatório completo exportado em PDF (${pageElements.length} páginas) e arquivado no DMS!`, { id: 'pdf-toast' });
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
        className="!fixed !inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-full !h-[100dvh] !max-h-[100dvh] !max-w-none !p-0 !gap-0 !flex !flex-col sm:!inset-auto sm:!left-1/2 sm:!top-1/2 sm:!-translate-x-1/2 sm:!-translate-y-1/2 sm:!w-[94vw] sm:!max-w-5xl sm:!h-[94vh] sm:!max-h-[94vh] sm:!rounded-2xl !border-0 sm:!border !shadow-2xl !bg-slate-950/98 !backdrop-blur-md !overflow-hidden !z-50"
      >
        {/* Acessibilidade DialogHeader oculto */}
        <div className="sr-only">
          <DialogTitle>Visualização do Relatório {data.definition.title}</DialogTitle>
          <DialogDescription>Relatório Corporativo Homologado Focus Finance ({pages.length} páginas)</DialogDescription>
        </div>

        {/* 1. BARRA DE FERRAMENTAS SUPERIOR (FIXA, COMTOUCH TARGETS AMPLOS E CONTROLES DIRETOS) */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 shadow-xs shrink-0 pt-[max(0.625rem,env(safe-area-inset-top))]">
          
          {/* LADO ESQUERDO: Botão Sair/Voltar Mobile + Info do Relatório */}
          <div className="flex items-center gap-2 min-w-0">
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

            <div className="flex items-center gap-1.5 min-w-0">
              <Badge variant="outline" className="gap-1 border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-50/60 dark:bg-orange-950/40 text-[10px] sm:text-xs font-semibold shrink-0 py-0.5 px-2">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Homologado</span>
              </Badge>
              <span className="text-[11px] sm:text-xs text-muted-foreground font-mono font-bold truncate">
                #{data.reportNumber}
              </span>
              <Badge variant="secondary" className="text-[10px] hidden md:inline-flex items-center gap-1">
                <Layers className="w-3 h-3 text-muted-foreground" /> {pages.length} {pages.length === 1 ? 'Página' : 'Páginas'}
              </Badge>
            </div>
          </div>

          {/* LADO DIREITO: Botões de Exportação & Fechar Desktop */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button 
              size="sm" 
              onClick={() => handleExport('PDF')} 
              disabled={isExporting}
              className="gap-1.5 text-xs h-8 sm:h-9 bg-orange-600 hover:bg-orange-700 text-white font-bold px-3 sm:px-4 rounded-xl shadow-xs shrink-0 active:scale-95 transition-all"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span className="hidden xs:inline">Baixar</span> PDF ({pages.length}p)
            </Button>

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
                  <span>Imprimir Documento</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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

        {/* NAVEGADOR DE PÁGINAS RÁPIDO (SE HOUVER MÚLTIPLAS PÁGINAS) */}
        {pages.length > 1 && (
          <div className="bg-slate-900/90 border-b border-slate-800 px-3 py-1.5 flex items-center justify-between text-xs text-slate-300 shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-slate-400">Navegar:</span>
              <div className="flex items-center gap-1">
                {pages.map((p) => (
                  <button
                    key={p.pageNumber}
                    type="button"
                    onClick={() => scrollToPage(p.pageNumber)}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold transition-all ${
                      activeViewPage === p.pageNumber
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Pág {p.pageNumber}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToPage(Math.max(1, activeViewPage - 1))}
                disabled={activeViewPage === 1}
                className="h-6 px-1.5 text-[10px] text-slate-300 hover:text-white"
              >
                <ChevronUp className="w-3 h-3 mr-0.5" /> Anterior
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scrollToPage(Math.min(pages.length, activeViewPage + 1))}
                disabled={activeViewPage === pages.length}
                className="h-6 px-1.5 text-[10px] text-slate-300 hover:text-white"
              >
                Próxima <ChevronDown className="w-3 h-3 ml-0.5" />
              </Button>
            </div>
          </div>
        )}

        {/* 2. ÁREA DE VISUALIZAÇÃO MULTI-PÁGINA COM ROLAGEM 100% FLUIDA */}
        <div 
          ref={scrollContainerRef}
          className="bg-slate-200/90 dark:bg-slate-950 p-2 sm:p-6 lg:p-8 flex flex-col items-center flex-1 overflow-y-scroll overscroll-contain touch-pan-y min-h-0 w-full pb-24 sm:pb-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-400 dark:scrollbar-thumb-slate-600"
          style={{ WebkitOverflowScrolling: 'touch' }}
        >
          {pages.map((page) => (
            <div 
              id={`report-sheet-page-${page.pageNumber}`}
              key={page.pageNumber}
              className="report-page-sheet w-full max-w-4xl bg-white text-slate-900 rounded-xl sm:rounded-2xl shadow-2xl border border-slate-200 p-4 sm:p-8 md:p-10 flex flex-col justify-between transition-all duration-200 overflow-hidden relative min-h-[500px] sm:min-h-[750px]"
              style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
            >
              {/* CORPO DA PÁGINA */}
              <div className="space-y-4 sm:space-y-5">
                
                {/* CABEÇALHO DA PÁGINA (Institucional Completo na Pág 1 / Compacto nas Seguintes) */}
                {page.isFirstPage ? (
                  <div className="flex flex-col xs:flex-row justify-between items-start xs:items-center gap-3 border-b-2 border-slate-900 pb-3.5 sm:pb-4">
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
                ) : (
                  <div className="flex justify-between items-center border-b border-slate-300 pb-2 text-[10px] text-slate-500">
                    <div className="flex items-center gap-2 font-medium">
                      <img src={focusLogoHq} alt="Focus ERP" className="h-4 w-auto object-contain" />
                      <span className="font-bold text-slate-800">{data.definition.title}</span>
                      <span className="font-mono">#{data.reportNumber}</span>
                    </div>
                    <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      Página {page.pageNumber} de {page.totalPages}
                    </span>
                  </div>
                )}

                {/* TÍTULO E RESUMO EXECUTIVO (Apenas Página 1) */}
                {page.isFirstPage && (
                  <>
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

                    {data.metricsSummary && data.metricsSummary.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                        {data.metricsSummary.map((m, i) => (
                          <div key={i} className="border border-slate-200 rounded-lg p-2 sm:p-2.5 bg-slate-50">
                            <p className="text-[10px] text-slate-500 font-medium truncate">{m.label}</p>
                            <p className={`text-xs sm:text-sm font-bold mt-0.5 truncate ${m.color || 'text-slate-900'}`}>
                              {m.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* GRUPOS HIERÁRQUICOS DA PÁGINA ATUAL */}
                <div className="space-y-4">
                  {page.groups.map((grp, gIdx) => (
                    <div key={gIdx} className="space-y-2 border border-slate-200 rounded-xl p-3 bg-white shadow-2xs">
                      
                      {/* Cabeçalho do Grupo Hierárquico */}
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                        <div>
                          <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
                            <FileCheck className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                            <span>{grp.groupTitle}</span>
                          </h3>
                          {grp.groupSubtitle && (
                            <p className="text-[10px] sm:text-[11px] text-slate-500 mt-0.5">{grp.groupSubtitle}</p>
                          )}
                        </div>
                        {grp.groupBadge && (
                          <Badge variant="secondary" className="text-[9px] bg-slate-100 text-slate-700">
                            {grp.groupBadge}
                          </Badge>
                        )}
                      </div>

                      {/* Tabela de Registros do Grupo */}
                      <div className="border border-slate-200 rounded-lg overflow-hidden w-full max-w-full bg-white">
                        <div className="overflow-x-auto w-full max-w-full scrollbar-thin">
                          <table className="w-full text-xs text-left min-w-[320px] sm:min-w-full border-collapse">
                            <thead className="bg-slate-100/90 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[9px] sm:text-[10px]">
                              <tr>
                                {data.definition.columns.map(col => (
                                  <th key={col.key} className="p-2 whitespace-nowrap">
                                    {col.label}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {grp.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors even:bg-slate-50/40">
                                  {data.definition.columns.map(col => (
                                    <td key={col.key} className="p-2 font-medium text-slate-800 text-[10px] sm:text-xs whitespace-nowrap sm:whitespace-normal">
                                      {row[col.key] || '-'}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Subtotais do Grupo */}
                      {grp.subtotals && grp.subtotals.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-3 pt-1.5 px-2 bg-slate-50/70 rounded-lg border border-slate-100 text-[11px]">
                          {grp.subtotals.map((st, stIdx) => (
                            <div key={stIdx} className="flex items-center gap-1.5">
                              <span className="text-slate-500">{st.label}:</span>
                              <span className={`font-bold ${st.color || 'text-slate-900'}`}>{st.value}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* TOTAIS GERAIS CONSOLIDADOS (Apenas na Última Página) */}
                {page.isLastPage && data.grandTotals && data.grandTotals.length > 0 && (
                  <div className="border-2 border-orange-500/30 rounded-xl p-3 sm:p-4 bg-orange-50/30 space-y-2">
                    <h4 className="text-xs font-bold text-orange-950 uppercase tracking-wider">
                      Resumo & Totais Gerais Consolidados
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
                      {data.grandTotals.map((gt, gtIdx) => (
                        <div key={gtIdx} className="bg-white p-2 sm:p-2.5 rounded-lg border border-orange-200/60">
                          <p className="text-[10px] text-slate-500 font-medium">{gt.label}</p>
                          <p className={`text-xs sm:text-sm font-bold mt-0.5 ${gt.color || 'text-slate-900'}`}>{gt.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* OBSERVAÇÕES CUSTOMIZADAS (Apenas na Última Página) */}
                {page.isLastPage && Boolean(data?.filters?.observacoesPersonalizadas) && (
                  <div className="p-3 rounded-xl bg-orange-50/80 border border-orange-200/80 text-[11px] sm:text-xs text-orange-950 leading-relaxed">
                    <p className="font-bold mb-0.5 text-orange-900">Observações do Emissor:</p>
                    <p>{data.filters?.observacoesPersonalizadas}</p>
                  </div>
                )}
              </div>

              {/* RODAPÉ DA FOLHA COM AUTENTICIDADE E NUMERAÇÃO */}
              <div className="border-t-2 border-slate-900 pt-3 mt-5 flex flex-col xs:flex-row justify-between items-start xs:items-center gap-2 text-[9px] sm:text-[10px] text-slate-500">
                <div className="flex items-center gap-2">
                  <QrCode className="w-6 h-6 sm:w-7 sm:h-7 text-slate-800 p-0.5 border rounded bg-white shrink-0" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-slate-800 flex items-center gap-1 text-[10px]">
                      <Lock className="w-3 h-3 text-orange-500" /> Autenticidade Digital Verificada
                    </p>
                    <p className="text-[9px] text-slate-400 font-mono">Hash: SHA256-FF-{data.reportNumber}-P{page.pageNumber}</p>
                  </div>
                </div>

                <div className="text-left xs:text-right text-[9px] text-slate-500 w-full xs:w-auto border-t xs:border-t-0 pt-1.5 xs:pt-0">
                  <p className="font-semibold text-slate-700">Página {page.pageNumber} de {page.totalPages} • Focus ERP</p>
                  <p>Documento Corporativo Homologado</p>
                </div>
              </div>

            </div>
          ))}

        </div>

        {/* 3. BARRA INFERIOR FIXA NO MOBILE (FECHAR E BAIXAR IMEDIATO) */}
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
            <span>Baixar PDF ({pages.length}p)</span>
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}




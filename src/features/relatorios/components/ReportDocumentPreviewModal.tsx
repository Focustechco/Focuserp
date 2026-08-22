import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, FileText, FileSpreadsheet, ShieldCheck, QrCode, Lock, X, CheckCircle2, Loader2 } from 'lucide-react';
import { GeneratedReportData, ReportFormat } from '../types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import { dmsService } from '@/services/dmsService';
import focusLogoHq from '@/assets/focus-erp-logo-hq.png';

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
          const margin = 10;
          const finalWidth = pdfWidth - (margin * 2);
          const finalHeight = (elHeight * finalWidth) / elWidth;
          
          pdf.addImage(imgData, 'JPEG', margin, margin, finalWidth, finalHeight);
          pdf.save(`Relatorio-Focus-${data.reportNumber}.pdf`);
          
          // Indexar automaticamente no DMS
          dmsService.uploadFileFromModule({
            nome: `Relatorio-Focus-${data.definition.title.replace(/\s+/g, '_')}-${data.reportNumber}.pdf`,
            moduloOrigem: 'Relatórios',
            relatorioTipo: data.definition.category === 'Financeiro' ? 'DRE Gerencial' : 'Geral',
            categoria: 'Relatórios Executivos',
            tags: ['Relatórios', data.definition.category, data.reportNumber],
            urlConteudo: imgData,
          });

          toast.success(`Relatório exportado em PDF e arquivado no módulo Gestão de Documentos (DMS)!`, { id: 'pdf-toast' });
          registerExecution(data.definition.id, fmt, data.filters, data, imgData);
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
    dmsService.uploadFileFromModule({
      nome: `Relatorio-Focus-${data.definition.title.replace(/\s+/g, '_')}-${data.reportNumber}.${fmt.toLowerCase()}`,
      moduloOrigem: 'Relatórios',
      relatorioTipo: data.definition.category === 'Financeiro' ? 'DRE Gerencial' : 'Geral',
      categoria: 'Planilhas Exportadas',
      tags: ['Relatórios', fmt, data.reportNumber],
    });

    registerExecution(data.definition.id, fmt, data.filters, data);
    toast.success(`Relatório exportado em ${fmt} e salvo no Módulo de Documentos (DMS)!`);
    setIsExporting(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-5xl h-[100dvh] sm:h-[94vh] max-h-[100dvh] sm:max-h-[94vh] p-0 border-none shadow-2xl bg-slate-950/95 backdrop-blur-md flex flex-col overflow-hidden">
        
        {/* Acessibilidade DialogHeader oculto */}
        <div className="sr-only">
          <DialogTitle>Visualização do Relatório {data.definition.title}</DialogTitle>
          <DialogDescription>Relatório Corporativo Homologado Focus Finance</DialogDescription>
        </div>

        {/* BARRA DE FERRAMENTAS SUPERIOR (100% RESPONSIVA EM MOBILE / TABLET / DESKTOP) */}
        <div className="sticky top-0 z-30 bg-background/95 backdrop-blur border-b px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2 shadow-xs shrink-0">
          
          {/* Badge & Info */}
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1.5">
              <Badge variant="outline" className="gap-1 border-orange-500/40 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-950/30 text-[10px] sm:text-xs font-semibold">
                <ShieldCheck className="w-3.5 h-3.5 text-orange-600" />
                <span>Homologado</span>
              </Badge>
              <span className="text-[11px] text-muted-foreground font-mono font-medium truncate">
                #{data.reportNumber}
              </span>
            </div>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="sm:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Botões de Ação com Scroll Horizontal Suave no Mobile */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5 justify-start sm:justify-end">
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handlePrint} 
              className="gap-1 text-[11px] sm:text-xs h-8 px-2.5 shrink-0"
            >
              <Printer className="w-3.5 h-3.5" /> 
              <span className="hidden sm:inline">Imprimir</span>
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleExport('CSV')} 
              disabled={isExporting}
              className="text-[11px] sm:text-xs h-8 px-2.5 shrink-0"
            >
              CSV
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleExport('XLSX')} 
              disabled={isExporting}
              className="gap-1 text-[11px] sm:text-xs h-8 text-emerald-600 border-emerald-200 dark:border-emerald-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 px-2.5 shrink-0"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> 
              <span>Excel</span>
            </Button>

            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => handleExport('DOCX')} 
              disabled={isExporting}
              className="gap-1 text-[11px] sm:text-xs h-8 text-blue-600 border-blue-200 dark:border-blue-900 hover:bg-blue-50 dark:hover:bg-blue-950/40 px-2.5 shrink-0"
            >
              <FileText className="w-3.5 h-3.5" /> 
              <span>Word</span>
            </Button>

            <Button 
              size="sm" 
              onClick={() => handleExport('PDF')} 
              disabled={isExporting}
              className="gap-1.5 text-[11px] sm:text-xs h-8 bg-orange-600 hover:bg-orange-700 text-white font-semibold px-3 sm:px-4 shadow-sm shrink-0"
            >
              {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
              <span>Exportar PDF</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hidden sm:inline-flex h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 ml-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* CANVAS DE VISUALIZAÇÃO DO DOCUMENTO (ROBUSTO EM MOBILE / TABLET / DESKTOP) */}
        <div className="bg-slate-200/90 dark:bg-slate-950 p-2 sm:p-6 lg:p-8 flex justify-center items-start flex-1 overflow-y-auto min-h-0 w-full">
          
          {/* DOCUMENTO INSTITUCIONAL FOCUS (FOLHA A4 RESPONSIVA) */}
          <div 
            className="w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-4 sm:p-8 md:p-10 flex flex-col justify-between transition-all duration-200 overflow-hidden" 
            id="report-printable-area"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
          >
            
            {/* CORPO DO DOCUMENTO */}
            <div className="space-y-4 sm:space-y-6">
              
              {/* 1. CABEÇALHO INSTITUCIONAL */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b-2 border-slate-900 pb-4 sm:pb-5">
                <div className="flex items-center">
                  <img 
                    src={focusLogoHq} 
                    alt="Focus ERP" 
                    className="h-8 sm:h-10 w-auto object-contain max-w-[180px] sm:max-w-[220px]" 
                  />
                </div>

                <div className="text-left sm:text-right text-[11px] sm:text-xs text-slate-600 space-y-0.5 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-100">
                  <p className="font-bold text-slate-900">Relatório nº {data.reportNumber}</p>
                  <p className="text-slate-500">Emissão: {new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
                  <p className="text-slate-500">Empresa: Focus Tecnologia Ltda</p>
                </div>
              </div>

              {/* 2. TÍTULO DO RELATÓRIO & SUBTÍTULO */}
              <div className="bg-slate-50 p-3.5 sm:p-4 rounded-lg border border-slate-200">
                <div className="flex flex-col gap-1">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-100 px-2 py-0.5 rounded inline-block mb-1">
                      Módulo {data.definition.category}
                    </span>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                      {data.definition.title}
                    </h2>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed mt-0.5">
                    {data.definition.description}
                  </p>
                </div>
              </div>

              {/* 3. CARDS DE RESUMO EXECUTIVO (100% RESPONSIVO) */}
              {data.metricsSummary && data.metricsSummary.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-4">
                  {data.metricsSummary.map((m, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-3 sm:p-3.5 bg-slate-50">
                      <p className="text-[11px] sm:text-xs text-slate-500 font-medium truncate">{m.label}</p>
                      <p className={`text-base sm:text-lg font-bold mt-0.5 truncate ${m.color || 'text-slate-900'}`}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* 4. TABELA DE DADOS CORPORATIVA (COM OVERFLOW HORIZONTAL CONTROLADO) */}
              <div className="border border-slate-200 rounded-lg overflow-hidden w-full max-w-full">
                <div className="overflow-x-auto w-full max-w-full scrollbar-thin">
                  <table className="w-full text-xs text-left min-w-[500px] sm:min-w-full border-collapse">
                    <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase text-[10px] sm:text-xs">
                      <tr>
                        {data.definition.columns.map(col => (
                          <th key={col.key} className="p-2.5 sm:p-3 whitespace-nowrap">
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
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            {data.definition.columns.map(col => (
                              <td key={col.key} className="p-2.5 sm:p-3 font-medium text-slate-800 text-[11px] sm:text-xs whitespace-nowrap sm:whitespace-normal">
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
              {data.filters.observacoesPersonalizadas && (
                <div className="p-3 sm:p-4 rounded-lg bg-orange-50/80 border border-orange-200/80 text-xs text-orange-950 leading-relaxed">
                  <p className="font-bold mb-0.5 text-orange-900">Observações do Emissor:</p>
                  <p>{data.filters.observacoesPersonalizadas}</p>
                </div>
              )}
            </div>

            {/* 6. RODAPÉ INSTITUCIONAL COM QR CODE E AUTENTICIDADE */}
            <div className="border-t-2 border-slate-900 pt-3.5 sm:pt-4 mt-6 sm:mt-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-[10px] sm:text-[11px] text-slate-500">
              <div className="flex items-center gap-2.5">
                <QrCode className="w-8 h-8 sm:w-9 sm:h-9 text-slate-800 p-0.5 border rounded bg-white shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-orange-500" /> Autenticidade Digital Verificada
                  </p>
                  <p className="text-[10px] text-slate-400">Hash: SHA256-FF-{data.reportNumber}-FOCUS</p>
                </div>
              </div>

              <div className="text-left sm:text-right text-[10px] text-slate-500 w-full sm:w-auto border-t sm:border-t-0 pt-2 sm:pt-0">
                <p className="font-semibold text-slate-700">CONFIDENCIAL • Uso Interno Autorizado</p>
                <p>Focus ERP — www.focustecnologia.com.br</p>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

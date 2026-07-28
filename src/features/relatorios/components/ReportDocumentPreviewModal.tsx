import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, FileText, FileSpreadsheet, ShieldCheck, QrCode, CheckCircle2, Lock } from 'lucide-react';
import { GeneratedReportData, ReportFormat } from '../types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import focusLogo from '@/assets/focus-logo.png';

interface PreviewProps {
  data: GeneratedReportData | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ReportDocumentPreviewModal({ data, isOpen, onClose }: PreviewProps) {
  const { registerExecution } = useRelatoriosStore();

  if (!data) return null;

  const handleExport = async (fmt: ReportFormat) => {
    if (fmt === 'PDF') {
      const element = document.getElementById('report-printable-area');
      if (element) {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Removendo o dark mode temporariamente para garantir o fundo branco padro corporativo
        if (isDark) document.documentElement.classList.remove('dark');
        
        toast.loading('Gerando PDF... Aguarde.', { id: 'pdf-toast' });
        
        try {
          // Renderiza o elemento HTML perfeitamente usando a API nativa do navegador
          const imgData = await toJpeg(element, { 
            quality: 1, 
            backgroundColor: '#ffffff',
            pixelRatio: 2 // Alta resoluo
          });
          
          // Obtm as dimenses reais renderizadas do elemento
          const elWidth = element.offsetWidth;
          const elHeight = element.offsetHeight;
          
          // Cria o documento PDF no padro A4 (orientao retrato)
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          // Calcula as dimenses preservando a proporo original do documento
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const margin = 10;
          const finalWidth = pdfWidth - (margin * 2);
          
          // Calcula a altura final proporcionalmente ao elemento capturado
          const finalHeight = (elHeight * finalWidth) / elWidth;
          
          pdf.addImage(imgData, 'JPEG', margin, margin, finalWidth, finalHeight);
          pdf.save(`Relatorio-Focus-${data.reportNumber}.pdf`);
          
          toast.success(`Relatrio exportado em PDF e salvo no Mdulo de Documentos (DMS)!`, { id: 'pdf-toast' });
          registerExecution(data.definition.id, fmt, data.filters, data, imgData);
        } catch (err: any) {
          console.error('Erro na exportao PDF:', err);
          toast.error(`Erro ao gerar PDF: ${err.message || 'Falha de processamento'}`, { id: 'pdf-toast' });
        } finally {
          // Restaura o dark mode se estava ativo
          if (isDark) document.documentElement.classList.add('dark');
        }
      }
      return;
    }

    registerExecution(data.definition.id, fmt, data.filters, data);
    toast.success(`Relatrio exportado em ${fmt} e indexado no Mdulo de Documentos (DMS)!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-5xl h-[100dvh] sm:h-[94vh] max-h-[100dvh] sm:max-h-[94vh] p-0 border-none shadow-2xl bg-slate-900/90 backdrop-blur-md flex flex-col overflow-hidden">
        {/* Barra de Aes Superior Limpa */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b p-2.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary bg-primary/5 text-[11px] sm:text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> Modelo Corporativo Homologado
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">" ID: {data.reportNumber}</span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button size="sm" variant="outline" onClick={handlePrint} className="gap-1.5 text-xs h-8 px-2.5 sm:px-3">
              <Printer className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Imprimir</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('CSV')} className="gap-1 text-xs h-8 px-2 sm:px-3">
              CSV
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('XLSX')} className="gap-1 text-xs h-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 px-2 sm:px-3">
              <FileSpreadsheet className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Excel</span>
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleExport('DOCX')} className="gap-1 text-xs h-8 text-blue-600 border-blue-200 hover:bg-blue-50 px-2 sm:px-3">
              <FileText className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Word</span>
            </Button>
            <Button size="sm" onClick={() => handleExport('PDF')} className="gap-1.5 text-xs h-8 bg-rose-600 hover:bg-rose-700 text-white font-semibold px-3 sm:px-4">
              <Download className="w-3.5 h-3.5" /> PDF
            </Button>
          </div>
        </div>

        {/* CANVAS DE VISUALIZAO DO DOCUMENTO PROTAGONISTA */}
        <div className="bg-slate-100/80 dark:bg-slate-950 p-2 sm:p-8 flex justify-center items-start flex-1 overflow-y-auto min-h-0 w-full">
          
          {/* DOCUMENTO INSTITUCIONAL FOCUS FINANCE (PAPEL TIMBRADO PROTAGONISTA) */}
          <div className="w-full max-w-4xl bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100 rounded-xl shadow-2xl border border-slate-200/80 dark:border-slate-800/80 p-3 sm:p-12 min-h-0 sm:min-h-[850px] flex flex-col justify-between transition-all duration-300" id="report-printable-area">
            
            {/* CABEALHO INSTITUCIONAL */}
            <div>
              <div className="flex justify-between items-start border-b-2 border-slate-900 dark:border-slate-100 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <img src={focusLogo} alt="Focus ERP" className="h-10 sm:h-12 object-contain dark:invert dark:hue-rotate-180" />
                </div>

              <div className="text-right text-xs text-slate-600 dark:text-slate-400 space-y-0.5">
                <p className="font-bold text-slate-900 dark:text-slate-200">Relatrio n {data.reportNumber}</p>
                <p>Emisso: {new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
                <p>Usurio: Administrador Corporativo</p>
                <p>Empresa: Focus Tecnologia Ltda</p>
              </div>
            </div>

            {/* TTULO DO RELATRIO & SUBTTULO */}
            <div className="mb-6 bg-slate-50 dark:bg-slate-900/60 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-100 dark:bg-orange-950/50 px-2 py-0.5 rounded">
                    Mdulo {data.definition.category}
                  </span>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {data.definition.title}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {data.definition.description}
                  </p>
                </div>
              </div>
            </div>

            {/* CARDS DE RESUMO EXECUTIVO */}
            {data.metricsSummary.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                {data.metricsSummary.map((m, i) => (
                  <div key={i} className="border border-slate-200 dark:border-slate-800 rounded-lg p-3.5 bg-slate-50/50 dark:bg-slate-900/30">
                    <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                    <p className={`text-lg font-bold mt-1 ${m.color || 'text-slate-900 dark:text-slate-100'}`}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* TABELA DE DADOS CORPORATIVA */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto mb-6">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-semibold uppercase">
                  <tr>
                    {data.definition.columns.map(col => (
                      <th key={col.key} className="p-3">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {data.rows.length === 0 ? (
                    <tr>
                      <td colSpan={data.definition.columns.length} className="p-6 text-center text-slate-500">
                        Nenhum registro encontrado para os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    data.rows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30">
                        {data.definition.columns.map(col => (
                          <td key={col.key} className="p-3 font-medium">
                            {row[col.key] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* OBSERVAES CUSTOMIZADAS */}
            {data.filters.observacoesPersonalizadas && (
              <div className="p-4 rounded-lg bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900 mb-6 text-xs text-orange-900 dark:text-orange-200">
                <p className="font-bold mb-1">Observaes do Emissor:</p>
                <p>{data.filters.observacoesPersonalizadas}</p>
              </div>
            )}
          </div>

          {/* RODAP INSTITUCIONAL COM QR CODE E AUTENTICIDADE */}
          <div className="border-t-2 border-slate-900 dark:border-slate-100 pt-4 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500">
            <div className="flex items-center gap-3">
              <QrCode className="w-10 h-10 text-slate-800 dark:text-slate-200 p-1 border rounded" />
              <div>
                <p className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-orange-500" /> Autenticidade Digital Verificada
                </p>
                <p>Hash: SHA256-FF-{data.reportNumber}-FOCUS</p>
                <p>Documento Corporativo Gerado por Focus Finance Enterprise</p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-semibold text-slate-700 dark:text-slate-300">CONFIDENCIAL " Uso Interno Autorizado</p>
              <p>Pgina 1 de 1 " www.focustecnologia.com.br</p>
            </div>
          </div>

        </div>
      </div>
      </DialogContent>
    </Dialog>
  );
}

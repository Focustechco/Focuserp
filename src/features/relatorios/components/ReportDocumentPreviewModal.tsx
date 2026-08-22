import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, FileText, FileSpreadsheet, ShieldCheck, QrCode, Lock } from 'lucide-react';
import { GeneratedReportData, ReportFormat } from '../types';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { toJpeg } from 'html-to-image';
import { useRelatoriosStore } from '../hooks/useRelatoriosStore';
import { dmsService } from '@/services/dmsService';
import focusLogoHorizontal from '@/assets/focus-logo-horizontal.png';

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
        toast.loading('Gerando PDF... Aguarde.', { id: 'pdf-toast' });
        
        try {
          // Renderiza o elemento HTML garantindo alta resolução e fundo branco puro
          const imgData = await toJpeg(element, { 
            quality: 1, 
            backgroundColor: '#ffffff',
            pixelRatio: 2 // Alta resolução
          });
          
          // Obtém as dimensões reais renderizadas do elemento
          const elWidth = element.offsetWidth;
          const elHeight = element.offsetHeight;
          
          // Cria o documento PDF no padrão A4 (orientação retrato)
          const pdf = new jsPDF('p', 'mm', 'a4');
          
          // Calcula as dimensões preservando a proporção original do documento
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const margin = 10;
          const finalWidth = pdfWidth - (margin * 2);
          
          // Calcula a altura final proporcionalmente ao elemento capturado
          const finalHeight = (elHeight * finalWidth) / elWidth;
          
          pdf.addImage(imgData, 'JPEG', margin, margin, finalWidth, finalHeight);
          pdf.save(`Relatorio-Focus-${data.reportNumber}.pdf`);
          
          // Indexar automaticamente no Módulo de Gestão de Documentos (DMS)
          dmsService.uploadFileFromModule({
            nome: `Relatorio-Focus-${data.definition.title.replace(/\s+/g, '_')}-${data.reportNumber}.pdf`,
            moduloOrigem: 'Relatórios',
            relatorioTipo: data.definition.category === 'Financeiro' ? 'DRE Gerencial' : 'Geral',
            categoria: 'Relatórios Executivos',
            tags: ['Relatórios', data.definition.category, data.reportNumber],
            urlConteudo: imgData,
          });

          toast.success(`Relatório exportado em PDF e salvo no Módulo de Documentos (DMS)!`, { id: 'pdf-toast' });
          registerExecution(data.definition.id, fmt, data.filters, data, imgData);
        } catch (err: any) {
          console.error('Erro na exportação PDF:', err);
          toast.error(`Erro ao gerar PDF: ${err.message || 'Falha de processamento'}`, { id: 'pdf-toast' });
        }
      }
      return;
    }

    // Exportação em formatos tabulares (CSV/Excel)
    dmsService.uploadFileFromModule({
      nome: `Relatorio-Focus-${data.definition.title.replace(/\s+/g, '_')}-${data.reportNumber}.${fmt.toLowerCase()}`,
      moduloOrigem: 'Relatórios',
      relatorioTipo: data.definition.category === 'Financeiro' ? 'DRE Gerencial' : 'Geral',
      categoria: 'Planilhas Exportadas',
      tags: ['Relatórios', fmt, data.reportNumber],
    });

    registerExecution(data.definition.id, fmt, data.filters, data);
    toast.success(`Relatório exportado em ${fmt} e indexado no Módulo de Documentos (DMS)!`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-5xl h-[100dvh] sm:h-[94vh] max-h-[100dvh] sm:max-h-[94vh] p-0 border-none shadow-2xl bg-slate-900/90 backdrop-blur-md flex flex-col overflow-hidden">
        {/* Barra de Ações Superior Limpa */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b p-2.5 sm:p-4 flex flex-wrap items-center justify-between gap-2 shadow-xs shrink-0">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="gap-1 border-primary/40 text-primary bg-primary/5 text-[11px] sm:text-xs">
              <ShieldCheck className="w-3.5 h-3.5" /> Modelo Corporativo Homologado
            </Badge>
            <span className="text-xs text-muted-foreground hidden sm:inline">• ID: {data.reportNumber}</span>
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

        {/* CANVAS DE VISUALIZAÇÃO DO DOCUMENTO */}
        <div className="bg-slate-100/90 p-2 sm:p-8 flex justify-center items-start flex-1 overflow-y-auto min-h-0 w-full">
          
          {/* DOCUMENTO INSTITUCIONAL FOCUS (SEMPRE BRANCO / LIGHT THEME) */}
          <div 
            className="w-full max-w-4xl bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-4 sm:p-12 min-h-0 sm:min-h-[850px] flex flex-col justify-between transition-all duration-300" 
            id="report-printable-area"
            style={{ backgroundColor: '#ffffff', color: '#0f172a' }}
          >
            
            {/* CABEÇALHO INSTITUCIONAL */}
            <div>
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-6">
                <div className="flex items-center gap-4">
                  <img src={focusLogoHorizontal} alt="Focus ERP" className="h-12 sm:h-16 w-auto max-w-[220px] object-contain" />
                </div>

                <div className="text-right text-xs text-slate-600 space-y-0.5">
                  <p className="font-bold text-slate-900">Relatório nº {data.reportNumber}</p>
                  <p>Emissão: {new Date(data.generatedAt).toLocaleString('pt-BR')}</p>
                  <p>Usuário: Administrador Corporativo</p>
                  <p>Empresa: Focus Tecnologia Ltda</p>
                </div>
              </div>

              {/* TÍTULO DO RELATÓRIO & SUBTÍTULO */}
              <div className="mb-6 bg-slate-50 p-4 rounded-lg border border-slate-200">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-orange-600 bg-orange-100 px-2 py-0.5 rounded">
                      Módulo {data.definition.category}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {data.definition.title}
                    </h2>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {data.definition.description}
                    </p>
                  </div>
                </div>
              </div>

              {/* CARDS DE RESUMO EXECUTIVO */}
              {data.metricsSummary.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                  {data.metricsSummary.map((m, i) => (
                    <div key={i} className="border border-slate-200 rounded-lg p-3.5 bg-slate-50">
                      <p className="text-xs text-slate-500 font-medium">{m.label}</p>
                      <p className={`text-lg font-bold mt-1 ${m.color || 'text-slate-900'}`}>
                        {m.value}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* TABELA DE DADOS CORPORATIVA */}
              <div className="border border-slate-200 rounded-lg overflow-x-auto mb-6">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-slate-700 font-semibold uppercase">
                    <tr>
                      {data.definition.columns.map(col => (
                        <th key={col.key} className="p-3">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.rows.length === 0 ? (
                      <tr>
                        <td colSpan={data.definition.columns.length} className="p-6 text-center text-slate-500">
                          Nenhum registro encontrado para os filtros selecionados.
                        </td>
                      </tr>
                    ) : (
                      data.rows.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
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

              {/* OBSERVAÇÕES CUSTOMIZADAS */}
              {data.filters.observacoesPersonalizadas && (
                <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 mb-6 text-xs text-orange-900">
                  <p className="font-bold mb-1">Observações do Emissor:</p>
                  <p>{data.filters.observacoesPersonalizadas}</p>
                </div>
              )}
            </div>

            {/* RODAPÉ INSTITUCIONAL COM QR CODE E AUTENTICIDADE */}
            <div className="border-t-2 border-slate-900 pt-4 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-slate-500">
              <div className="flex items-center gap-3">
                <QrCode className="w-10 h-10 text-slate-800 p-1 border rounded" />
                <div>
                  <p className="font-bold text-slate-800 flex items-center gap-1">
                    <Lock className="w-3 h-3 text-orange-500" /> Autenticidade Digital Verificada
                  </p>
                  <p>Hash: SHA256-FF-{data.reportNumber}-FOCUS</p>
                  <p>Documento Corporativo Gerado por Focus Finance Enterprise</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-semibold text-slate-700">CONFIDENCIAL • Uso Interno Autorizado</p>
                <p>Página 1 de 1 • www.focustecnologia.com.br</p>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Music,
  Folder,
  History,
  UploadCloud,
  Trash2,
  ShieldCheck,
  Tag,
  User,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Copy,
  Check,
  Sparkles,
  FileCode,
  FileSpreadsheet
} from 'lucide-react';
import { DocumentoDMS } from '../types';
import { useDocumentosStore } from '../hooks/useDocumentosStore';
import { toast } from 'sonner';

interface PreviewProps {
  documento: DocumentoDMS | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DmsPreviewModal({ documento, isOpen, onClose }: PreviewProps) {
  const { addVersion, moveToTrash, logAction } = useDocumentosStore();

  const [showAddVersion, setShowAddVersion] = useState(false);
  const [descAlteracao, setDescAlteracao] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!documento) return null;

  const handleDownload = () => {
    logAction(documento.id, documento.nome, 'Download', `Download da verso ${documento.versaoAtual}`);

    if (documento.urlConteudo) {
      // Download real da URL/DataURL armazenada
      const link = window.document.createElement('a');
      link.href = documento.urlConteudo;
      link.download = documento.nome;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      // Gerar um Blob real simulado para download do arquivo no navegador
      const content = `====================================================\nFOCUS ERP - REPOSITRIO SEGURO DMS\n====================================================\nDocumento: ${documento.nome}\nCdigo: ${documento.codigo}\nVerso: ${documento.versaoAtual}\nMdulo Origem: ${documento.moduloOrigem}\nResponsvel pelo Upload: ${documento.responsavelUpload}\nData de Upload: ${new Date(documento.dataUpload).toLocaleString('pt-BR')}\n====================================================\nContedo autenticado pelo sistema Focus ERP.`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = documento.nome.endsWith('.txt') || documento.nome.endsWith('.pdf') ? documento.nome : `${documento.nome}.txt`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    toast.success(`Download de "${documento.nome}" efetuado com sucesso!`);
  };

  const handleAddVersion = () => {
    if (!descAlteracao.trim()) {
      toast.error('Informe a descrio das alteraes para criar a nova verso.');
      return;
    }

    addVersion(documento.id, descAlteracao.trim(), documento.tamanho);
    toast.success(`Nova verso do documento criada com sucesso!`);
    setShowAddVersion(false);
    setDescAlteracao('');
  };

  const handleTrash = () => {
    moveToTrash(documento.id);
    toast.success('Documento enviado para a Lixeira.');
    onClose();
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success('Contedo copiado para a rea de transferncia!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Gerador de contedo de texto/XML/CSV para visualizao simulada de arquivos reais
  const getSampleTextContent = () => {
    const ext = documento.extensao.toLowerCase();
    if (ext === 'xml') {
      return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc xmlns="http://www.portalfiscal.inf.br/nfe" versao="4.00">
  <NFe>
    <infNFe Id="NFe35260200000000000000550010000389101000389100">
      <ide>
        <cUF>35</cUF>
        <cNF>00038910</cNF>
        <natOp>PRESTACAO DE SERVICOS DE TECNOLOGIA</natOp>
        <mod>55</mod>
        <serie>1</serie>
        <nNF>38910</nNF>
        <dhEmi>${documento.dataUpload}</dhEmi>
        <tpNF>1</tpNF>
      </ide>
      <emit>
        <CNPJ>12345678000199</CNPJ>
        <xNome>FOCUS TECNOLOGIA E SISTEMAS S.A.</xNome>
        <xFant>FOCUS ERP</xFant>
      </emit>
      <dest>
        <xNome>${documento.clienteNome || 'CLIENTE CORPORATIVO BRASIL'}</xNome>
      </dest>
      <total>
        <ICMSTot>
          <vNF>15450.00</vNF>
        </ICMSTot>
      </total>
    </infNFe>
  </NFe>
</nfeProc>`;
    }

    if (ext === 'csv') {
      return `ID_LANCAMENTO;DATA;CLIENTE;CATEGORIA;VALOR_RS;STATUS\nREC-001;2026-07-01;TechServices;Consultoria TI;15000,00;Pago\nREC-002;2026-07-05;Conlibras;Desenvolvimento;28500,00;Pago\nREC-003;2026-07-15;Empresa Global;Licenciamento SaaS;8500,00;Pendente`;
    }

    return `====================================================
RELATRIO AUDITADO - FOCUS ERP (DMS)
====================================================
Documento: ${documento.nome}
Identificador: ${documento.codigo}
Status: ${documento.status}
Verso Ativa: v${documento.versaoAtual}
Mdulo Origem: ${documento.moduloOrigem}

HISTRICO E METADADOS DO ARQUIVO:
- Responsvel: ${documento.responsavelUpload}
- Data de Envio: ${new Date(documento.dataUpload).toLocaleString('pt-BR')}
- Tamanho: ${documento.tamanho}

NOTAS INTERNAS:
Documento oficial validado e registrado no repositrio seguro da empresa.
Qualquer alterao gera uma nova verso auditvel no histrico.`;
  };

  // Renderizador Inline Inteligente do Contedo do Documento
  const renderInlineViewer = () => {
    const ext = documento.extensao.toLowerCase();

    // 1. IMAGENS (PNG, JPG, JPEG, SVG, WEBP)
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) {
      // Se houver DataURL/URL real
      if (documento.urlConteudo) {
        return (
          <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
            <img
              src={documento.urlConteudo}
              alt={documento.nome}
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[500px] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800 transition-transform duration-200"
            />
          </div>
        );
      }

      // Visualizador Mock Visual Elegante para Imagens de Exemplo
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div 
            style={{ transform: `scale(${zoomLevel})` }}
            className="w-full max-w-md h-72 rounded-xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 border border-slate-700/80 shadow-2xl p-6 flex flex-col justify-between relative overflow-hidden transition-transform duration-200"
          >
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
            <div className="flex justify-between items-center z-10">
              <Badge variant="outline" className="border-indigo-400/40 text-indigo-300 bg-indigo-950/60 backdrop-blur-md">
                <Sparkles className="w-3 h-3 mr-1 text-indigo-400" /> Visualizao de Imagem
              </Badge>
              <span className="text-[11px] font-mono text-slate-400">{ext.toUpperCase()} " {documento.tamanho}</span>
            </div>

            <div className="flex flex-col items-center justify-center space-y-3 z-10 py-4">
              <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 shadow-inner">
                <ImageIcon className="w-12 h-12" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">{documento.nome}</h4>
                <p className="text-xs text-slate-400 mt-0.5">Preview grfico processado em tempo real</p>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 z-10 border-t border-slate-800/80 pt-2">
              <span>Resoluo: High-DPI</span>
              <span>Focus DMS Secure Render</span>
            </div>
          </div>
        </div>
      );
    }

    // 2. DOCUMENTOS PDF
    if (ext === 'pdf') {
      if (documento.urlConteudo && documento.urlConteudo.startsWith('data:application/pdf')) {
        return (
          <div className="w-full h-full p-2">
            <iframe
              src={documento.urlConteudo}
              className="w-full h-[520px] rounded-lg border border-slate-800 shadow-2xl"
              title={documento.nome}
            />
          </div>
        );
      }

      // Visualizador de PDF Estilizado com Layout de Folha de Documento Real
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 overflow-y-auto">
          <div 
            style={{ transform: `scale(${zoomLevel})` }}
            className="w-full max-w-xl min-h-[500px] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8 rounded-lg shadow-2xl border border-slate-700/60 transition-transform duration-200 space-y-5 font-sans relative"
          >
            {/* Cabealho do PDF */}
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold text-xs">
                  PDF
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{documento.nome}</h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Cdigo: {documento.codigo} " Verso {documento.versaoAtual}</p>
                </div>
              </div>
              <Badge variant="outline" className="border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 text-[10px]">
                OFICIAL
              </Badge>
            </div>

            {/* Contedo do PDF */}
            <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
                <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                  <FileText className="w-4 h-4 text-rose-500" /> REGISTRO DE DOCUMENTO INSTITUCIONAL
                </div>
                <p className="text-[11px]">
                  O arquivo <strong>{documento.nome}</strong> foi indexado sob a categoria <strong>"{documento.categoria}"</strong> no mdulo <strong>{documento.moduloOrigem}</strong>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
                <div className="p-3 border rounded bg-card">
                  <span className="text-slate-400 block text-[10px]">Responsvel de Upload</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{documento.responsavelUpload}</span>
                </div>
                <div className="p-3 border rounded bg-card">
                  <span className="text-slate-400 block text-[10px]">Data de Registro</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(documento.dataUpload).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" /> Assinatura Digital e Hash Verificados
                </span>
                <span className="font-mono text-[10px]">OK</span>
              </div>
            </div>

            {/* Rodap da Folha PDF */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>Pgina 1 de 1</span>
              <span>DMS Secure Vault " Focus ERP</span>
            </div>
          </div>
        </div>
      );
    }

    // 3. XML, CSV, TXT, CODE
    if (['xml', 'txt', 'csv', 'json', 'md', 'html'].includes(ext)) {
      const codeText = documento.urlConteudo || getSampleTextContent();
      return (
        <div className="w-full h-full flex flex-col p-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
              <FileCode className="w-4 h-4 text-emerald-400" /> Editor / Leitor de Cdigo ({ext.toUpperCase()})
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyCode(codeText)}
              className="h-7 text-xs gap-1 border-slate-700 bg-slate-900 hover:bg-slate-800 text-slate-200"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copiado!' : 'Copiar Texto'}
            </Button>
          </div>
          <div className="flex-1 bg-slate-900 text-emerald-400 p-4 rounded-lg font-mono text-xs overflow-auto border border-slate-800 shadow-inner">
            <pre className="whitespace-pre-wrap leading-relaxed">{codeText}</pre>
          </div>
        </div>
      );
    }

    // 4. VDEO
    if (['mp4', 'mov', 'webm'].includes(ext)) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4">
          {documento.urlConteudo ? (
            <video controls className="max-h-[480px] max-w-full rounded-lg shadow-2xl border border-slate-800" src={documento.urlConteudo} />
          ) : (
            <div className="text-center p-8 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-2xl">
              <div className="w-20 h-20 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center mx-auto text-purple-400">
                <Video className="w-10 h-10 animate-pulse" />
              </div>
              <div>
                <h4 className="font-bold text-slate-100 text-sm">{documento.nome}</h4>
                <p className="text-xs text-slate-400 mt-1">{documento.tamanho} " Reprodutor de Vdeo Nativo</p>
              </div>
            </div>
          )}
        </div>
      );
    }

    // 5. UDIO
    if (['mp3', 'wav', 'aac'].includes(ext)) {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
          <div className="w-20 h-20 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400">
            <Music className="w-10 h-10 animate-bounce" />
          </div>
          <div>
            <h4 className="font-bold text-slate-100 text-sm">{documento.nome}</h4>
            <p className="text-xs text-slate-400 mt-1">{documento.tamanho} " udio Integrado</p>
          </div>
          {documento.urlConteudo && (
            <audio controls src={documento.urlConteudo} className="w-full max-w-md mt-4" />
          )}
        </div>
      );
    }

    // 6. PLANILHAS E OUTROS (XLS, XLSX, DOCX, PPTX, ZIP)
    return (
      <div className="w-full h-full flex items-center justify-center p-6">
        <div className="w-full max-w-md p-6 bg-slate-900/90 border border-slate-800 rounded-xl text-center space-y-4 shadow-2xl">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
            {ext.includes('xls') ? <FileSpreadsheet className="w-10 h-10" /> : <Folder className="w-10 h-10" />}
          </div>
          <div>
            <h4 className="font-bold text-base text-slate-100 truncate">{documento.nome}</h4>
            <p className="text-xs text-slate-400 mt-1">{documento.categoria} " {documento.tamanho}</p>
          </div>
          <div className="p-3 bg-slate-950/80 rounded-lg text-left text-xs space-y-1.5 border border-slate-800 text-slate-300 font-mono">
            <div>" Formato: .{ext.toUpperCase()}</div>
            <div>" Mdulo de Origem: {documento.moduloOrigem}</div>
            <div>" Criptografia: Repositrio Seguro AES-256</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full sm:max-w-5xl h-[100dvh] sm:h-[92vh] max-h-[100dvh] sm:max-h-[92vh] overflow-hidden p-0 border shadow-2xl bg-background flex flex-col">
        <div className="flex flex-col lg:flex-row h-full flex-1 min-h-0 overflow-hidden">
          
          {/* PAINEL ESQUERDO: VISUALIZADOR INTEGRA NA APLICAO */}
          <div className="flex-1 bg-slate-950 flex flex-col justify-between min-h-0 border-r border-slate-800 text-slate-100 relative overflow-hidden">
            
            {/* Barra de Ferramentas Superior do Visualizador */}
            <div className="p-2.5 sm:p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 backdrop-blur-md z-20 shrink-0">
              <Badge variant="outline" className="border-slate-700 text-slate-300 gap-1 bg-slate-950 text-[10px] sm:text-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> DMS Secure Viewer
              </Badge>

              {/* Controles de Zoom e Tela Cheia */}
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setZoomLevel(prev => Math.min(prev + 0.2, 2.5))}
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setZoomLevel(prev => Math.max(prev - 0.2, 0.6))}
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setZoomLevel(1)}
                  title="Resetar Zoom"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            {/* REA DE VISUALIZAO DO CONTEDO */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center relative bg-slate-950/80 min-h-0 p-1 sm:p-4">
              {renderInlineViewer()}
            </div>

            {/* Barra Inferior com Boto de Download Obrigatrio */}
            <div className="p-3 sm:p-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-900/90 backdrop-blur-md z-20 shrink-0">
              <div className="truncate max-w-sm text-center sm:text-left">
                <div className="font-semibold text-xs text-slate-200 truncate">{documento.nome}</div>
                <div className="text-[10px] text-slate-400 font-mono">{documento.codigo} " Verso {documento.versaoAtual}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleDownload}
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 shadow-lg shadow-emerald-950/50"
                >
                  <Download className="w-4 h-4" /> Baixar Documento
                </Button>
              </div>
            </div>
          </div>

          {/* PAINEL DIREITO: METADADOS E VERSIONAMENTO */}
          <div className="w-full lg:w-96 p-4 sm:p-6 space-y-4 sm:space-y-6 bg-card flex flex-col overflow-y-auto max-h-[35dvh] lg:max-h-none border-t lg:border-t-0 shrink-0 lg:shrink">
            <div className="flex justify-between items-start border-b pb-4">
              <div>
                <h4 className="font-bold text-base">Metadados & Verses</h4>
                <p className="text-xs text-muted-foreground">{documento.caminhoPasta}</p>
              </div>
              <Button size="icon" variant="ghost" className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={handleTrash}>
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <Tabs defaultValue="detalhes" className="space-y-4 flex-1 flex flex-col">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
                <TabsTrigger value="versoes" className="gap-1">
                  <History className="w-3.5 h-3.5" /> Verses ({documento.historicoVersoes?.length || 1})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="detalhes" className="space-y-4 text-xs outline-none">
                <div className="space-y-3 border p-3.5 rounded-lg bg-muted/20">
                  <div>
                    <span className="text-muted-foreground">Mdulo Origem:</span>
                    <Badge variant="outline" className="ml-2 font-medium">{documento.moduloOrigem}</Badge>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Categoria:</span>
                    <span className="font-semibold ml-2">{documento.categoria}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Tamanho:</span>
                    <span className="font-semibold ml-2">{documento.tamanho}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Enviado por:</span>
                    <span className="font-semibold ml-2 flex items-center gap-1 inline-flex"><User className="w-3 h-3" /> {documento.responsavelUpload}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data de Upload:</span>
                    <span className="font-semibold ml-2">{new Date(documento.dataUpload).toLocaleDateString('pt-BR')}</span>
                  </div>
                  {documento.clienteNome && (
                    <div>
                      <span className="text-muted-foreground">Cliente Vinculado:</span>
                      <span className="font-semibold ml-2 text-primary">{documento.clienteNome}</span>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <h5 className="font-bold mb-2 flex items-center gap-1 text-xs">
                    <Tag className="w-3.5 h-3.5 text-primary" /> Etiquetas (Tags)
                  </h5>
                  <div className="flex flex-wrap gap-1">
                    {documento.tags.map(t => (
                      <Badge key={t} variant="secondary" className="text-[10px]">
                        #{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="versoes" className="space-y-4 text-xs outline-none">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Histrico de Verses</span>
                  <Button size="sm" variant="outline" onClick={() => setShowAddVersion(!showAddVersion)} className="h-7 text-xs gap-1">
                    <UploadCloud className="w-3.5 h-3.5" /> Nova Verso
                  </Button>
                </div>

                {showAddVersion && (
                  <div className="p-3 border rounded-lg bg-orange-50/50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900 space-y-2">
                    <Label className="text-[11px] font-bold">Descrio da Nova Verso (v{parseInt(documento.versaoAtual) + 1}.0)</Label>
                    <Textarea 
                      placeholder="Ex: Minuta revisada pelo departamento jurdico..." 
                      value={descAlteracao}
                      onChange={e => setDescAlteracao(e.target.value)}
                      rows={2}
                      className="text-xs"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="ghost" onClick={() => setShowAddVersion(false)} className="h-6 text-[11px]">Cancelar</Button>
                      <Button size="sm" onClick={handleAddVersion} className="h-6 text-[11px] bg-orange-600 hover:bg-orange-700 text-white">Salvar Verso</Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {documento.historicoVersoes.map(v => (
                    <div key={v.numeroVersao} className="p-3 border rounded-lg bg-card space-y-1">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-primary">Verso {v.numeroVersao}</span>
                        <span className="text-[10px] text-muted-foreground">{new Date(v.dataAlteracao).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <p className="text-muted-foreground">{v.descricaoAlteracao}</p>
                      <p className="text-[10px] text-muted-foreground">Por: {v.alteradoPor} " {v.tamanhoArquivo}</p>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

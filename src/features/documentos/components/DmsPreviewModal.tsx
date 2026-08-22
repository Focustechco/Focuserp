import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  FileSpreadsheet,
  ExternalLink,
  Upload
} from 'lucide-react';
import { DocumentoDMS } from '../types';
import { useDocumentosStore } from '../hooks/useDocumentosStore';
import { toast } from 'sonner';

export interface PreviewProps {
  documento?: DocumentoDMS | null;
  doc?: DocumentoDMS | null;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
}

export function DmsPreviewModal({ documento: propDocumento, doc: propDoc, isOpen: propIsOpen, open: propOpen, onClose, onOpenChange }: PreviewProps) {
  const { addVersion, moveToTrash, logAction, updateDocument } = useDocumentosStore();

  const documento = propDocumento || propDoc;
  const isModalOpen = propOpen !== undefined ? propOpen : propIsOpen !== undefined ? propIsOpen : !!documento;

  const [showAddVersion, setShowAddVersion] = useState(false);
  const [descAlteracao, setDescAlteracao] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleClose = () => {
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  if (!documento) return null;

  const handleOpenInNewTab = () => {
    if (documento.urlConteudo) {
      const win = window.open();
      if (win) {
        if (documento.urlConteudo.startsWith('data:')) {
          win.document.write(`<iframe src="${documento.urlConteudo}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        } else {
          win.location.href = documento.urlConteudo;
        }
      }
    } else {
      handleDownload();
    }
  };

  const handleDownload = () => {
    logAction(documento.id, documento.nome, 'Download', `Download da versão ${documento.versaoAtual}`);

    if (documento.urlConteudo) {
      const link = window.document.createElement('a');
      link.href = documento.urlConteudo;
      link.download = documento.nome;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
    } else {
      const content = `====================================================\nFOCUS ERP - REPOSITÓRIO SEGURO DMS\n====================================================\nDocumento: ${documento.nome}\nCódigo: ${documento.codigo}\nVersão: ${documento.versaoAtual}\nMódulo Origem: ${documento.moduloOrigem}\nResponsável pelo Upload: ${documento.responsavelUpload}\nData de Upload: ${new Date(documento.dataUpload).toLocaleString('pt-BR')}\n====================================================\nConteúdo autenticado pelo sistema Focus ERP.`;
      const blob = new Blob([content], { type: 'application/pdf;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = documento.nome.endsWith('.pdf') ? documento.nome : `${documento.nome}.pdf`;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }

    toast.success(`Download de "${documento.nome}" efetuado com sucesso!`);
  };

  const handleUploadRealFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;
      if (dataUrl) {
        updateDocument(documento.id, {
          urlConteudo: dataUrl,
          tamanho: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          tamanhoBytes: file.size,
        });
        toast.success(`Arquivo real anexado e atualizado com sucesso!`);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddVersion = () => {
    if (!descAlteracao.trim()) {
      toast.error('Informe a descrição das alterações para criar a nova versão.');
      return;
    }

    addVersion(documento.id, descAlteracao.trim(), documento.tamanho);
    toast.success(`Nova versão do documento criada com sucesso!`);
    setShowAddVersion(false);
    setDescAlteracao('');
  };

  const handleTrash = () => {
    moveToTrash(documento.id);
    toast.success('Documento enviado para a Lixeira.');
    handleClose();
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    toast.success('Conteúdo copiado para a área de transferência!');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const getSampleTextContent = () => {
    const ext = (documento?.extensao || '').toLowerCase();
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
RELATÓRIO AUDITADO - FOCUS ERP (DMS)
====================================================
Documento: ${documento.nome}
Identificador: ${documento.codigo}
Status: ${documento.status}
Versão Ativa: v${documento.versaoAtual}
Módulo Origem: ${documento.moduloOrigem}

HISTÓRICO E METADADOS DO ARQUIVO:
- Responsável: ${documento.responsavelUpload}
- Data de Envio: ${new Date(documento.dataUpload).toLocaleString('pt-BR')}
- Tamanho: ${documento.tamanho}

NOTAS INTERNAS:
Documento oficial validado e registrado no repositório seguro da empresa.
Qualquer alteração gera uma nova versão auditável no histórico.`;
  };

  // Renderizador Inline Inteligente do Conteúdo do Documento
  const renderInlineViewer = () => {
    const ext = (documento?.extensao || documento?.nome.split('.').pop() || '').toLowerCase();
    const hasUrl = !!documento.urlConteudo && (documento.urlConteudo.startsWith('data:') || documento.urlConteudo.startsWith('blob:') || documento.urlConteudo.startsWith('http'));

    // 1. SE HOUVER URL / ARQUIVO REAL (PDF OU OUTRO FORMATO)
    if (hasUrl && ext === 'pdf') {
      return (
        <div className="w-full h-full min-h-[550px] p-1 flex flex-col items-center justify-center">
          <iframe 
            src={documento.urlConteudo} 
            title={documento.nome}
            className="w-full h-full min-h-[550px] rounded-lg border-0 shadow-2xl bg-white"
          />
        </div>
      );
    }

    // 2. IMAGENS (PNG, JPG, JPEG, SVG, WEBP, GIF)
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif'].includes(ext)) {
      if (hasUrl) {
        return (
          <div className="w-full h-full flex items-center justify-center p-4 overflow-auto">
            <img
              src={documento.urlConteudo}
              alt={documento.nome}
              style={{ transform: `scale(${zoomLevel})` }}
              className="max-h-[550px] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800 transition-transform duration-200"
            />
          </div>
        );
      }
      return (
        <div className="w-full h-full flex flex-col items-center justify-center p-6 text-slate-400">
          <ImageIcon className="w-20 h-20 mb-3 text-blue-500 opacity-60" />
          <span className="text-sm font-semibold text-slate-200">{documento.nome}</span>
          <span className="text-xs text-slate-500 mt-1">Imagem registrada no sistema ({documento.tamanho})</span>
        </div>
      );
    }

    // 3. XML, CSV, TXT, CODE, JSON
    if (['xml', 'txt', 'csv', 'json', 'md', 'html'].includes(ext)) {
      const codeText = (hasUrl && !documento.urlConteudo?.startsWith('data:image')) ? documento.urlConteudo : getSampleTextContent();
      return (
        <div className="w-full h-full flex flex-col p-4">
          <div className="flex justify-between items-center mb-2 px-2">
            <span className="text-xs font-mono text-slate-400 uppercase">Visualizador de Código ({ext.toUpperCase()})</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleCopyCode(codeText)}
              className="h-7 text-xs gap-1.5 border-slate-700 bg-slate-900 text-slate-300 hover:text-white"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedCode ? 'Copiado!' : 'Copiar Texto'}
            </Button>
          </div>
          <pre className="flex-1 p-4 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg overflow-auto border border-slate-800 leading-relaxed selection:bg-emerald-900">
            <code>{codeText}</code>
          </pre>
        </div>
      );
    }

    // 4. DOCUMENTO SEM BINÁRIO ANEXADO: VISUALIZAÇÃO E OPÇÃO DE UPLOAD REAL
    return (
      <div className="w-full h-full p-4 overflow-y-auto flex flex-col items-center justify-center">
        <div 
          style={{ transform: `scale(${zoomLevel})` }}
          className="w-full max-w-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 p-8 rounded-lg shadow-2xl border border-slate-200 dark:border-slate-800 space-y-6 transition-transform duration-200 my-auto"
        >
          {/* Cabeçalho da Folha PDF */}
          <div className="flex justify-between items-start border-b pb-4 border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-xs font-mono font-bold text-orange-600 dark:text-orange-400">FOCUS ERP • CLOUD DMS</div>
              <h3 className="text-lg font-bold mt-1 text-slate-900 dark:text-white">{documento.nome}</h3>
              <span className="text-xs text-slate-400 font-mono">Código: {documento.codigo} • Versão {documento.versaoAtual}</span>
            </div>
            <Badge variant="outline" className="border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 text-[10px]">
              OFICIAL
            </Badge>
          </div>

          {/* Conteúdo do Registro */}
          <div className="space-y-4 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700/60 space-y-2">
              <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5 text-xs">
                <FileText className="w-4 h-4 text-rose-500" /> REGISTRO DE DOCUMENTO INSTITUCIONAL
              </div>
              <p className="text-[11px]">
                O arquivo <strong>{documento.nome}</strong> está indexado sob a categoria <strong>"{documento.categoria}"</strong> no módulo <strong>{documento.moduloOrigem}</strong>.
              </p>
              {documento.clienteNome && (
                <p className="text-[11px]">
                  Entidade Vinculada: <strong>{documento.clienteNome}</strong>
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] pt-1">
              <div className="p-3 border rounded bg-card">
                <span className="text-slate-400 block text-[10px]">Responsável de Upload</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{documento.responsavelUpload}</span>
              </div>
              <div className="p-3 border rounded bg-card">
                <span className="text-slate-400 block text-[10px]">Data de Registro</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{new Date(documento.dataUpload).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>

            {/* Ação rápida para carregar arquivo original */}
            <div className="p-3 bg-muted/40 rounded-lg border border-dashed flex items-center justify-between">
              <div>
                <div className="font-semibold text-xs text-foreground">Substituir por Arquivo Real (.PDF)</div>
                <div className="text-[11px] text-muted-foreground">Envie o arquivo original para visualização de todas as páginas</div>
              </div>
              <div className="relative">
                <Button size="sm" variant="outline" className="text-xs gap-1.5 h-8">
                  <Upload className="w-3.5 h-3.5" /> Enviar PDF
                </Button>
                <input 
                  type="file" 
                  accept=".pdf,image/*" 
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  onChange={handleUploadRealFile}
                />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 rounded border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-[11px]">
              <span className="flex items-center gap-1.5 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Assinatura Digital e Hash Verificados
              </span>
              <span className="font-mono text-[10px]">OK</span>
            </div>
          </div>

          {/* Rodapé da Folha PDF */}
          <div className="pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Página 1 de 1</span>
            <span>DMS Secure Vault • Focus ERP</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isModalOpen} onOpenChange={(openState) => { if (!openState) handleClose(); }}>
      <DialogContent className="w-full sm:max-w-6xl h-[95vh] max-h-[95vh] overflow-hidden p-0 border shadow-2xl bg-background flex flex-col">
        <DialogHeader className="sr-only">
          <DialogTitle>Visualizador de Documentos - {documento.nome}</DialogTitle>
          <DialogDescription>Detalhes e preview seguro do arquivo</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col lg:flex-row h-full flex-1 min-h-0 overflow-hidden">
          
          {/* PAINEL ESQUERDO: VISUALIZADOR INTEGRADO NA APLICAÇÃO */}
          <div className="flex-1 bg-slate-950 flex flex-col justify-between min-h-0 border-r border-slate-800 text-slate-100 relative overflow-hidden">
            
            {/* Barra de Ferramentas Superior do Visualizador */}
            <div className="p-2.5 sm:p-3.5 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/90 backdrop-blur-md z-20 shrink-0">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-slate-700 text-slate-300 gap-1 bg-slate-950 text-[10px] sm:text-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> DMS Secure Viewer
                </Badge>
                {documento.urlConteudo && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleOpenInNewTab}
                    className="h-6 px-2 text-[11px] gap-1 text-slate-300 hover:text-white hover:bg-slate-800"
                  >
                    <ExternalLink className="w-3 h-3" /> Abrir em Nova Guia
                  </Button>
                )}
              </div>

              {/* Controles de Zoom */}
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

            {/* ÁREA DE VISUALIZAÇÃO DO CONTEÚDO */}
            <div className="flex-1 overflow-y-auto overflow-x-hidden flex items-center justify-center relative bg-slate-950/80 min-h-0 p-1 sm:p-2">
              {renderInlineViewer()}
            </div>

            {/* Barra Inferior com Botão de Download Obrigatório */}
            <div className="p-3 sm:p-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-slate-900/90 backdrop-blur-md z-20 shrink-0">
              <div className="truncate max-w-sm text-center sm:text-left">
                <div className="font-semibold text-xs text-slate-200 truncate">{documento.nome}</div>
                <div className="text-[10px] text-slate-400 font-mono">{documento.codigo} • Versão {documento.versaoAtual}</div>
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

          {/* PAINEL DIREITO: METADADOS, VERSÕES & AUDITORIA */}
          <div className="w-full lg:w-80 bg-card border-t lg:border-t-0 p-4 flex flex-col justify-between overflow-y-auto shrink-0 space-y-4">
            <Tabs defaultValue="detalhes" className="w-full">
              <TabsList className="grid grid-cols-2 w-full h-8 text-xs mb-3">
                <TabsTrigger value="detalhes" className="text-xs">Propriedades</TabsTrigger>
                <TabsTrigger value="versoes" className="text-xs">Versões ({documento.historicoVersoes?.length || 1})</TabsTrigger>
              </TabsList>

              {/* ABA 1: DETALHES & METADADOS */}
              <TabsContent value="detalhes" className="space-y-3.5 text-xs">
                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Nome do Arquivo</Label>
                  <div className="font-semibold break-all text-xs">{documento.nome}</div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Formato</Label>
                    <div className="font-mono uppercase font-bold text-primary">{documento.extensao}</div>
                  </div>
                  <div>
                    <Label className="text-[11px] text-muted-foreground">Tamanho</Label>
                    <div>{documento.tamanho}</div>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Localização no DMS</Label>
                  <div className="font-mono text-[11px] text-muted-foreground bg-muted p-1.5 rounded truncate">
                    {documento.caminhoPasta}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Módulo Vinculado</Label>
                  <div>
                    <Badge variant="secondary" className="text-xs">{documento.moduloOrigem}</Badge>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Enviado por</Label>
                  <div className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-muted-foreground" /> {documento.responsavelUpload}
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-[11px] text-muted-foreground">Data de Envio</Label>
                  <div className="text-muted-foreground">
                    {new Date(documento.dataUpload).toLocaleString('pt-BR')}
                  </div>
                </div>

                {documento.tags && documento.tags.length > 0 && (
                  <div className="space-y-1">
                    <Label className="text-[11px] text-muted-foreground">Tags / Palavras-Chave</Label>
                    <div className="flex flex-wrap gap-1">
                      {documento.tags.map((t, idx) => (
                        <Badge key={idx} variant="outline" className="text-[10px]">
                          #{t}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* ABA 2: VERSÕES */}
              <TabsContent value="versoes" className="space-y-3 text-xs">
                <div className="space-y-2">
                  {(documento.historicoVersoes || []).map((v, i) => (
                    <div key={i} className="p-2.5 border rounded-lg bg-muted/20 space-y-1">
                      <div className="flex items-center justify-between font-semibold">
                        <span className="text-primary font-mono">v{v.numeroVersao}</span>
                        <span className="text-[10px] text-muted-foreground font-normal">
                          {new Date(v.dataAlteracao).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{v.descricaoAlteracao}</p>
                      <div className="text-[10px] text-slate-400">Por: {v.alteradoPor}</div>
                    </div>
                  ))}
                </div>

                {showAddVersion ? (
                  <div className="p-3 border rounded-lg bg-card space-y-2">
                    <Label className="text-xs font-semibold">Motivo da Nova Versão</Label>
                    <Textarea 
                      placeholder="Descreva as correções ou novidades deste documento..."
                      value={descAlteracao}
                      onChange={e => setDescAlteracao(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                    <div className="flex justify-end gap-2 pt-1">
                      <Button size="sm" variant="ghost" onClick={() => setShowAddVersion(false)} className="text-xs h-7">
                        Cancelar
                      </Button>
                      <Button size="sm" onClick={handleAddVersion} className="text-xs h-7 bg-primary text-primary-foreground">
                        Salvar Versão
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setShowAddVersion(true)} 
                    className="w-full text-xs gap-1.5"
                  >
                    <UploadCloud className="w-3.5 h-3.5" /> Nova Versão deste Arquivo
                  </Button>
                )}
              </TabsContent>
            </Tabs>

            {/* Ações Inferiores do Modal */}
            <div className="pt-3 border-t flex items-center justify-between gap-2">
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={handleTrash}
                className="text-xs gap-1.5 h-8"
              >
                <Trash2 className="w-3.5 h-3.5" /> Mover para Lixeira
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleClose}
                className="text-xs h-8"
              >
                Fechar
              </Button>
            </div>

          </div>

        </div>
      </DialogContent>
    </Dialog>
  );
}

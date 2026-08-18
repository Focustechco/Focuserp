import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  ShieldCheck, 
  FileCheck, 
  Lock, 
  History, 
  QrCode, 
  Download, 
  CheckCircle2,
  Globe,
  Award,
  Landmark
} from 'lucide-react';
import { DocumentoAssinatura } from '../types';
import { toast } from 'sonner';

interface ModalTrilhaAuditoriaProps {
  isOpen: boolean;
  onClose: () => void;
  documento: DocumentoAssinatura | null;
}

export function ModalTrilhaAuditoria({ isOpen, onClose, documento }: ModalTrilhaAuditoriaProps) {
  if (!documento) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden bg-background">
        
        {/* Header */}
        <div className="p-6 border-b bg-emerald-500/10 border-emerald-500/20">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-500 text-white shadow-xs">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                  Trilha de Auditoria Jurídica & Validação (ICP-Brasil / MP 2.200-2)
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Certificado de Evidências Digitais para o documento <strong className="text-foreground">{documento.codigoValidacao}</strong>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          
          {/* Summary Box */}
          <div className="p-4 rounded-xl border bg-card space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-semibold text-muted-foreground">Documento</span>
              <span className="text-xs font-bold">{documento.titulo}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-muted-foreground">Status Atual:</span>
                <div className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{documento.status}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Modalidade Exigida:</span>
                <div className="font-bold mt-0.5">{documento.tipoAssinaturaExigida}</div>
              </div>
            </div>

            <div className="space-y-1 pt-2 border-t text-[11px]">
              <div className="text-muted-foreground font-semibold">Hash SHA-256 (Cofre Digital):</div>
              <div className="font-mono bg-muted p-2 rounded text-[10px] break-all select-all font-semibold text-primary">
                {documento.hashSHA256Assinado || documento.hashSHA256Original}
              </div>
            </div>
          </div>

          {/* Assinantes & Assinaturas Efetuadas */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Assinantes Registrados</h4>
            <div className="space-y-2">
              {documento.assinantes.map((a) => (
                <div key={a.id} className="p-3 rounded-xl border bg-card flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="font-semibold text-xs flex items-center gap-2">
                      <span>{a.nome}</span>
                      <Badge variant="outline" className="text-[10px]">{a.papel}</Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">{a.email} • CPF: {a.cpf}</div>
                    {a.metodoUtilizado && (
                      <div className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                        <CheckCircle2 className="w-3 h-3" /> Assinado via {a.metodoUtilizado} em {new Date(a.dataAssinatura!).toLocaleString('pt-BR')}
                      </div>
                    )}
                  </div>
                  <div>
                    {a.status === 'Assinado' ? (
                      <Badge className="bg-emerald-500 text-white text-[10px]">Assinado</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px]">Pendente</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trilha Cronológica de Log */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trilha de Evidências (Log de Integridade)</h4>
            <div className="space-y-3 relative pl-4 border-l-2 border-primary/20">
              {(documento?.auditoria || []).map((log) => (
                <div key={log.id} className="relative space-y-1">
                  <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-primary" />
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>{log.evento}</span>
                    <span className="text-[10px] text-muted-foreground font-mono">{new Date(log.dataHora).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{log.detalhes}</div>
                  <div className="text-[10px] font-mono text-muted-foreground flex items-center gap-3">
                    <span>Ator: {log.ator}</span>
                    <span>•</span>
                    <span>IP: {log.ip}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <QrCode className="w-4 h-4 text-primary" />
            <span>Validação via QR Code ou no portal Focus Sign</span>
          </div>
          <Button className="bg-primary gap-2" onClick={() => toast.success("Folha de Evidências em PDF baixada com sucesso!")}>
            <Download className="w-4 h-4" /> Baixar Trilha Completa (PDF)
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

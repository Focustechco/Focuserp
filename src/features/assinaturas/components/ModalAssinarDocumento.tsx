import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  FileSignature, 
  PenTool, 
  Landmark, 
  Award, 
  CheckCircle2, 
  Lock, 
  Smartphone, 
  ShieldCheck,
  FileText
} from 'lucide-react';
import { DocumentoAssinatura, TipoAssinatura } from '../types';
import { toast } from 'sonner';

interface ModalAssinarDocumentoProps {
  isOpen: boolean;
  onClose: () => void;
  documento: DocumentoAssinatura | null;
  onAssinarSucesso: (
    docId: string, 
    assinanteId: string, 
    metodo: TipoAssinatura, 
    detalhes: any
  ) => void;
}

export function ModalAssinarDocumento({
  isOpen,
  onClose,
  documento,
  onAssinarSucesso
}: ModalAssinarDocumentoProps) {
  if (!documento) return null;

  const [nomeDigitado, setNomeDigitado] = useState('Adriano Leal');
  const [tokenSMS, setTokenSMS] = useState('884920');
  const [simularGovBr, setSimularGovBr] = useState(false);
  const [simularICP, setSimularICP] = useState(false);
  const [metodoSelecionado, setMetodoSelecionado] = useState<TipoAssinatura>(documento.tipoAssinaturaExigida);

  const assinanteAtual = documento.assinantes.find(a => a.status === 'Pendente') || documento.assinantes[0];

  const handleConfirmarAssinatura = () => {
    if (metodoSelecionado === 'Eletrônica Simples' && !nomeDigitado.trim()) {
      toast.error('Por favor, digite seu nome completo para assinar.');
      return;
    }

    let detalhes: any = {
      ip: '187.62.190.12',
      dispositivo: 'Navegador Web (Chrome 126)',
      rubricaOuDesenhoUrl: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="60"><text x="10" y="40" font-family="cursive" font-size="24" fill="%230f172a">${encodeURIComponent(nomeDigitado)}</text></svg>`
    };

    if (metodoSelecionado === 'Gov.br (Avançada)') {
      detalhes.nivelGovBr = 'Ouro';
    } else if (metodoSelecionado === 'ICP-Brasil (Qualificada A1/A3)') {
      detalhes.certificadoEmissor = 'AC SERPRO RFB v5 (ICP-Brasil)';
    }

    onAssinarSucesso(documento.id, assinanteAtual.id, metodoSelecionado, detalhes);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[650px] p-0 overflow-hidden bg-background">
        
        {/* Header */}
        <div className="p-6 border-b bg-muted/20">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10 border shadow-xs">
                <FileSignature className="w-5 h-5 text-primary" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Assinar Documento Eletrônico</DialogTitle>
                <DialogDescription className="text-xs">
                  {documento.titulo} • <span className="font-mono">{documento.codigoValidacao}</span>
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6">
          
          {/* PDF Preview Simulated Banner */}
          <div className="p-4 rounded-xl border bg-slate-950 text-white flex items-center justify-between shadow-inner">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-white/10 text-white">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-semibold">{documento.titulo}</div>
                <div className="text-[10px] text-slate-400 font-mono">Hash SHA-256: {documento.hashSHA256Original.substring(0, 24)}...</div>
              </div>
            </div>
            <Badge className="bg-emerald-500 text-white text-[10px]">Doc Válido</Badge>
          </div>

          {/* Abas por Modalidade */}
          <Tabs value={metodoSelecionado} onValueChange={(val: any) => setMetodoSelecionado(val)} className="space-y-4">
            <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
              <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
                <TabsTrigger value="Eletrônica Simples" className="text-xs gap-1.5 shrink-0 whitespace-nowrap">
                  <PenTool className="w-3.5 h-3.5" /> Simples
                </TabsTrigger>
                <TabsTrigger value="Gov.br (Avançada)" className="text-xs gap-1.5 shrink-0 whitespace-nowrap">
                  <Landmark className="w-3.5 h-3.5" /> Gov.br
                </TabsTrigger>
                <TabsTrigger value="ICP-Brasil (Qualificada A1/A3)" className="text-xs gap-1.5 shrink-0 whitespace-nowrap">
                  <Award className="w-3.5 h-3.5" /> ICP-Brasil
                </TabsTrigger>
              </TabsList>
            </div>

            {/* ABA 1: ELETRÔNICA SIMPLES */}
            <TabsContent value="Eletrônica Simples" className="space-y-4">
              <div className="space-y-2">
                <Label>Digite seu nome completo como assinatura *</Label>
                <Input 
                  value={nomeDigitado} 
                  onChange={e => setNomeDigitado(e.target.value)} 
                  className="font-serif text-lg tracking-wide"
                />
              </div>

              {/* Preview da Rubrica */}
              <div className="p-4 rounded-xl border bg-accent/20 text-center space-y-1">
                <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Pré-visualização da Rubrica Digital</span>
                <div className="text-2xl font-serif italic text-primary py-2">{nomeDigitado || 'Sua Assinatura'}</div>
                <div className="text-[10px] text-muted-foreground">IP Registrado: 187.62.190.12 • Carimbo Temporal: UTC-3</div>
              </div>
            </TabsContent>

            {/* ABA 2: GOV.BR */}
            <TabsContent value="Gov.br (Avançada)" className="space-y-4">
              <div className="p-4 rounded-xl border bg-emerald-500/10 border-emerald-500/20 space-y-3 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Assinatura Oficial Gov.br (Nível Ouro/Prata)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Ao clicar em confirmar, a sessão simulada efetuará o handshake seguro com o Provedor de Identidade do Governo Federal.
                  </p>
                </div>
                <Badge className="bg-emerald-600 text-white">Pronto para Conectar Gov.br</Badge>
              </div>
            </TabsContent>

            {/* ABA 3: ICP-BRASIL */}
            <TabsContent value="ICP-Brasil (Qualificada A1/A3)" className="space-y-4">
              <div className="p-4 rounded-xl border bg-cyan-500/10 border-cyan-500/20 space-y-3 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-cyan-700 dark:text-cyan-400">Certificado Digital Qualificado ICP-Brasil</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Detectado Certificado A1: <strong className="text-foreground">FOCUS TECNOLOGIA DA INFORMACAO LTDA</strong> (Serial: 7B:44:90:A1)
                  </p>
                </div>
                <Badge className="bg-cyan-600 text-white">Certificado A1 Válido até 2027</Badge>
              </div>
            </TabsContent>

          </Tabs>

        </div>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/10 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold" onClick={handleConfirmarAssinatura}>
            <CheckCircle2 className="w-4 h-4" /> Confirmar e Assinar Documento
          </Button>
        </div>

      </DialogContent>
    </Dialog>
  );
}

import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Send, CheckCircle2, MessageSquare, Mail, Smartphone, Copy, 
  ExternalLink, QrCode, Clock, User, ShieldCheck, DollarSign, Calendar
} from 'lucide-react';
import { Cobranca, CanalEnvio } from '../types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

interface CobrancaDetalhesModalProps {
  cobranca: Cobranca | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRegistrarResposta?: (cobranca: Cobranca) => void;
  onMarcarPaga?: (cobranca: Cobranca) => void;
}

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const getCanalBadge = (canal: CanalEnvio) => {
  switch (canal) {
    case 'WhatsApp':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 gap-1"><MessageSquare className="w-3 h-3" /> WhatsApp</Badge>;
    case 'E-mail':
      return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 gap-1"><Mail className="w-3 h-3" /> E-mail</Badge>;
    case 'SMS':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-300 gap-1"><Smartphone className="w-3 h-3" /> SMS</Badge>;
    default:
      return null;
  }
};

export function CobrancaDetalhesModal({
  cobranca,
  open,
  onOpenChange,
  onRegistrarResposta,
  onMarcarPaga
}: CobrancaDetalhesModalProps) {
  if (!cobranca) return null;

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copiado para a área de transferência!`);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[650px] overflow-y-auto p-6 space-y-6">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-primary text-sm">{cobranca.id}</span>
                <Badge variant="outline" className={`text-xs ${
                  cobranca.statusCobranca === 'Paga' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' :
                  cobranca.statusCobranca === 'Respondida' ? 'bg-indigo-50 text-indigo-700 border-indigo-300' :
                  cobranca.statusCobranca === 'Vencida' ? 'bg-rose-50 text-rose-700 border-rose-300' :
                  'bg-blue-50 text-blue-700 border-blue-300'
                }`}>
                  {cobranca.statusCobranca}
                </Badge>
              </div>
              <SheetTitle className="text-lg font-bold mt-1">
                {cobranca.cliente}
              </SheetTitle>
              <SheetDescription className="text-xs">
                Ref: {cobranca.tituloReferencia} • Vencimento: {formatDateBrasilia(cobranca.vencimento)}
              </SheetDescription>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">Valor Total</span>
              <div className="text-2xl font-black text-foreground">
                {formatCurrency(cobranca.valor)}
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Canais e Status de Entrega */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 border rounded-xl bg-card space-y-1.5 shadow-xs">
            <span className="text-[11px] text-muted-foreground block font-medium">Canais Utilizados</span>
            <div className="flex flex-wrap gap-1.5">
              {cobranca.canal.map(c => (
                <span key={c}>{getCanalBadge(c)}</span>
              ))}
            </div>
          </div>

          <div className="p-3.5 border rounded-xl bg-card space-y-1.5 shadow-xs">
            <span className="text-[11px] text-muted-foreground block font-medium">Status de Leitura / Entrega</span>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-normal">
                Entrega: <strong className="ml-1">{cobranca.statusEntrega}</strong>
              </Badge>
              <Badge variant="outline" className="text-xs font-normal">
                Leitura: <strong className="ml-1">{cobranca.statusLeitura}</strong>
              </Badge>
            </div>
          </div>
        </div>

        {/* Resposta do Cliente se houver */}
        {cobranca.respostaCliente && (
          <div className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600" /> Resposta Registrada do Cliente
              </h4>
              {cobranca.classificacaoResposta && (
                <Badge className="bg-indigo-200 text-indigo-900 dark:bg-indigo-900 dark:text-indigo-200 border-0 text-[10px]">
                  {cobranca.classificacaoResposta}
                </Badge>
              )}
            </div>
            <p className="text-xs text-indigo-950 dark:text-indigo-100 italic bg-background/60 p-2.5 rounded-lg border border-indigo-100 dark:border-indigo-900">
              "{cobranca.respostaCliente}"
            </p>
          </div>
        )}

        {/* Mensagem enviada */}
        {cobranca.mensagemPersonalizada && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Mensagem Enviada
            </span>
            <div className="p-3 bg-muted/40 border rounded-xl text-xs text-foreground leading-relaxed">
              {cobranca.mensagemPersonalizada}
            </div>
          </div>
        )}

        {/* Dados de Pagamento (PIX e Linha Digitável) */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Instrumentos de Liquidação
          </h4>

          {cobranca.pixCopiaECola && (
            <div className="p-3 border rounded-xl bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold flex items-center gap-1.5 text-emerald-600">
                  <QrCode className="w-4 h-4" /> PIX Copia e Cola
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs gap-1"
                  onClick={() => copyToClipboard(cobranca.pixCopiaECola!, 'Código PIX')}
                >
                  <Copy className="w-3 h-3" /> Copiar Código
                </Button>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground bg-muted/50 p-2 rounded truncate">
                {cobranca.pixCopiaECola}
              </div>
            </div>
          )}

          {cobranca.linhaDigitavel && (
            <div className="p-3 border rounded-xl bg-card space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">
                  Linha Digitável do Boleto
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-7 text-xs gap-1"
                  onClick={() => copyToClipboard(cobranca.linhaDigitavel!, 'Linha Digitável')}
                >
                  <Copy className="w-3 h-3" /> Copiar Linha
                </Button>
              </div>
              <div className="font-mono text-[11px] text-muted-foreground bg-muted/50 p-2 rounded truncate">
                {cobranca.linhaDigitavel}
              </div>
            </div>
          )}
        </div>

        {/* Timeline da Cobrança */}
        <div className="space-y-3">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-primary" /> Linha do Tempo & Interações
          </h4>

          <div className="relative border-l-2 border-primary/30 ml-3 space-y-4 pt-1">
            {(cobranca.timeline || []).map((ev) => (
              <div key={ev.id} className="relative pl-6">
                <div className="absolute -left-[9px] top-1 bg-background border-2 border-primary w-4 h-4 rounded-full" />
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{ev.acao}</span>
                  <span className="text-[10px] text-muted-foreground">{formatDateBrasilia(ev.dataHora)}</span>
                </div>
                <div className="text-[11px] text-muted-foreground mt-0.5">
                  Por <strong>{ev.usuario}</strong> {ev.canal ? `via ${ev.canal}` : ''}
                </div>
                {ev.detalhes && (
                  <p className="text-xs text-foreground bg-muted/30 p-2 rounded mt-1.5 border">
                    {ev.detalhes}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Botões de Ação */}
        <div className="pt-2 border-t flex flex-wrap items-center justify-end gap-2">
          {onRegistrarResposta && cobranca.statusCobranca !== 'Paga' && (
            <Button 
              variant="outline" 
              className="gap-1.5 text-xs"
              onClick={() => {
                onOpenChange(false);
                onRegistrarResposta(cobranca);
              }}
            >
              <MessageSquare className="w-3.5 h-3.5 text-indigo-500" /> Registrar Resposta do Cliente
            </Button>
          )}

          {onMarcarPaga && cobranca.statusCobranca !== 'Paga' && (
            <Button 
              className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => {
                onOpenChange(false);
                onMarcarPaga(cobranca);
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Confirmar Pagamento
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

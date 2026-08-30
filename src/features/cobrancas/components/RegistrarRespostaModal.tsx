import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MessageSquare, CheckCircle2 } from 'lucide-react';
import { Cobranca, TipoResposta } from '../types';
import { toast } from 'sonner';

interface RegistrarRespostaModalProps {
  cobranca: Cobranca | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (cobrancaId: string, resposta: string, classificacao: TipoResposta) => void;
}

export function RegistrarRespostaModal({
  cobranca,
  open,
  onOpenChange,
  onSave
}: RegistrarRespostaModalProps) {
  const [resposta, setResposta] = useState('');
  const [classificacao, setClassificacao] = useState<TipoResposta>('Promessa de pagamento');

  if (!cobranca) return null;

  const handleSave = () => {
    if (!resposta.trim()) {
      toast.error("Por favor, descreva a resposta ou solicitação do cliente.");
      return;
    }

    onSave(cobranca.id, resposta.trim(), classificacao);
    toast.success("Resposta do cliente registrada com sucesso!");
    onOpenChange(false);
    setResposta('');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto p-6 space-y-5">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <SheetTitle className="text-lg font-bold">Registrar Resposta do Cliente</SheetTitle>
              <SheetDescription className="text-xs">
                {cobranca.cliente} • {cobranca.id}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Classificação da Interação *</Label>
            <Select value={classificacao} onValueChange={(val) => setClassificacao(val as TipoResposta)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a classificação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Promessa de pagamento">Promessa de pagamento</SelectItem>
                <SelectItem value="Confirmação de pagamento">Confirmação de pagamento / Comprovante</SelectItem>
                <SelectItem value="Solicitação de boleto">Solicitação de 2ª via de boleto</SelectItem>
                <SelectItem value="Solicitação de PIX">Solicitação de chave PIX</SelectItem>
                <SelectItem value="Dúvida">Dúvida sobre os valores</SelectItem>
                <SelectItem value="Contestação">Contestação de cobrança</SelectItem>
                <SelectItem value="Outros">Outros assuntos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="respostaText">O que o cliente informou? *</Label>
            <Textarea 
              id="respostaText" 
              placeholder="Ex: Informou que fará a transferência hoje até as 17h, solicitou desconto de juros..." 
              className="h-28 text-xs resize-none"
              value={resposta}
              onChange={e => setResposta(e.target.value)}
            />
          </div>
        </div>

        <SheetFooter className="pt-4 border-t flex flex-row items-center justify-between sm:justify-between">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white">
            <CheckCircle2 className="w-4 h-4" /> Salvar Resposta
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

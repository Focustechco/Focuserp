import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Award } from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import { toast } from 'sonner';

interface ModalRegistrarNpsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: (Cliente & { cs: any })[];
  defaultClientId?: string | null;
  onAddNpsSurvey: (csCustomerId: string, survey: any) => void;
}

export function ModalRegistrarNps({
  open,
  onOpenChange,
  clients,
  defaultClientId,
  onAddNpsSurvey,
}: ModalRegistrarNpsProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || '');
  const [rating, setRating] = useState<number>(10);
  const [respondentName, setRespondentName] = useState('');
  const [respondentRole, setRespondentRole] = useState('');
  const [comment, setComment] = useState('');

  React.useEffect(() => {
    if (defaultClientId) setSelectedClientId(defaultClientId);
  }, [defaultClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Selecione um cliente para vincular a pesquisa NPS.');
      return;
    }
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    onAddNpsSurvey(client.cs.id, {
      rating,
      comment: comment || 'Sem comentários adicionais.',
      respondentName: respondentName || 'Contato Principal',
      respondentRole: respondentRole || 'Gestor',
      date: new Date().toISOString().split('T')[0],
    });

    toast.success(`Pesquisa NPS registrada com nota ${rating}!`);
    onOpenChange(false);
    setRating(10);
    setRespondentName('');
    setRespondentRole('');
    setComment('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Award className="w-5 h-5 text-purple-500" /> Registrar Pesquisa de Satisfação NPS
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Capture a pontuação Net Promoter Score (0 a 10) e feedback qualitativo do cliente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Cliente *</Label>
            <Select value={selectedClientId} onValueChange={setSelectedClientId}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione o cliente" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs">
                    {c.nomeFantasia || c.razaoSocial} ({c.segmento || 'Cliente'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Nota NPS (0 a 10) *</Label>
            <div className="flex items-center justify-between gap-1 p-2 bg-muted/40 rounded-lg border">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => {
                const isSelected = rating === score;
                const isPromoter = score >= 9;
                const isPassive = score >= 7 && score <= 8;

                return (
                  <button
                    key={score}
                    type="button"
                    onClick={() => setRating(score)}
                    className={`h-8 w-8 rounded text-xs font-bold transition-all ${
                      isSelected
                        ? isPromoter
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : isPassive
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-rose-600 text-white shadow-xs'
                        : 'bg-background hover:bg-muted text-muted-foreground border'
                    }`}
                  >
                    {score}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground px-1">
              <span className="text-rose-500 font-medium">0-6 Detrator</span>
              <span className="text-amber-500 font-medium">7-8 Neutro</span>
              <span className="text-emerald-500 font-medium">9-10 Promotor</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome do Respondente</Label>
              <Input
                placeholder="Ex: Carlos Mendes"
                value={respondentName}
                onChange={(e) => setRespondentName(e.target.value)}
                className="text-xs h-8"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Cargo / Função</Label>
              <Input
                placeholder="Ex: Diretor de Operações"
                value={respondentRole}
                onChange={(e) => setRespondentRole(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Comentário / Feedback Qualitativo</Label>
            <Textarea
              placeholder="O que o cliente destacou sobre a plataforma, suporte ou resultados obtidos?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-xs min-h-[80px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-purple-600 hover:bg-purple-700 text-white">
              Salvar Avaliação NPS
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { ShieldCheck } from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import { toast } from 'sonner';

interface ModalNovaAcaoCsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: (Cliente & { cs: any })[];
  defaultClientId?: string | null;
  onAddActionPlanItem: (item: any) => void;
}

export function ModalNovaAcaoCs({
  open,
  onOpenChange,
  clients,
  defaultClientId,
  onAddActionPlanItem,
}: ModalNovaAcaoCsProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'alta' | 'media' | 'baixa'>('alta');
  const [responsibleName, setResponsibleName] = useState('');
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
  );

  React.useEffect(() => {
    if (defaultClientId) setSelectedClientId(defaultClientId);
  }, [defaultClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Selecione um cliente para vincular ao plano de ação.');
      return;
    }
    if (!title.trim()) {
      toast.error('Informe o título da ação.');
      return;
    }
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    onAddActionPlanItem({
      cs_customer_id: client.cs.id,
      title: title.trim(),
      description: description.trim() || 'Ação preventiva para sucesso e retenção do cliente.',
      priority,
      status: 'a_fazer',
      dueDate,
      responsibleName: responsibleName.trim() || client.cs.csmResponsibleName || 'CSM Responsável',
    });

    toast.success('Plano de Ação registrado com sucesso!');
    onOpenChange(false);
    setTitle('');
    setDescription('');
    setPriority('alta');
    setResponsibleName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShieldCheck className="w-5 h-5 text-blue-500" /> Nova Ação CS & Prevenção de Churn
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Crie uma tarefa estratégica de acompanhamento, alinhamento ou intervenção para garantir a saúde da conta.
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
            <Label className="text-xs">Título da Ação *</Label>
            <Input
              placeholder="Ex: Reunião Executiva de QBR / Alinhamento de SLA"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-8"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Prioridade</Label>
              <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="alta" className="text-xs text-rose-600 font-semibold">Alta (Urgente)</SelectItem>
                  <SelectItem value="media" className="text-xs text-amber-600 font-semibold">Média</SelectItem>
                  <SelectItem value="baixa" className="text-xs text-blue-600 font-semibold">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Prazo Estimado</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Responsável (CSM / Líder)</Label>
            <Input
              placeholder="Ex: Ana Clara (CSM)"
              value={responsibleName}
              onChange={(e) => setResponsibleName(e.target.value)}
              className="text-xs h-8"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Descrição do Plano / Objetivo</Label>
            <Textarea
              placeholder="Descreva o contexto, riscos identificados e próximos passos acordados..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[75px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
              Criar Ação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

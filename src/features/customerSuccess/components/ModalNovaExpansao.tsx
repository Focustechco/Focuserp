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
import { TrendingUp } from 'lucide-react';
import { Cliente } from '@/features/clientes/types';
import { toast } from 'sonner';

interface ModalNovaExpansaoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: (Cliente & { cs: any })[];
  defaultClientId?: string | null;
  onAddExpansionOpportunity: (opp: any) => void;
}

export function ModalNovaExpansao({
  open,
  onOpenChange,
  clients,
  defaultClientId,
  onAddExpansionOpportunity,
}: ModalNovaExpansaoProps) {
  const [selectedClientId, setSelectedClientId] = useState<string>(defaultClientId || '');
  const [type, setType] = useState<'upsell' | 'cross_sell'>('upsell');
  const [title, setTitle] = useState('');
  const [productOffered, setProductOffered] = useState('');
  const [potentialValue, setPotentialValue] = useState<number>(1500);
  const [probability, setProbability] = useState<number>(75);
  const [stage, setStage] = useState<'identificada' | 'contato' | 'proposta' | 'fechada_ganha'>('identificada');
  const [description, setDescription] = useState('');

  React.useEffect(() => {
    if (defaultClientId) setSelectedClientId(defaultClientId);
  }, [defaultClientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClientId) {
      toast.error('Selecione um cliente para vincular a oportunidade.');
      return;
    }
    if (!title.trim() || !productOffered.trim()) {
      toast.error('Informe o título e o produto/serviço ofertado.');
      return;
    }
    const client = clients.find((c) => c.id === selectedClientId);
    if (!client) return;

    onAddExpansionOpportunity({
      cs_customer_id: client.cs.id,
      type,
      title: title.trim(),
      productOffered: productOffered.trim(),
      potentialValue: Number(potentialValue) || 0,
      probability: Number(probability) || 50,
      stage,
      description: description.trim() || 'Expansão de escopo/módulos para aumentar o valor gerado.',
    });

    toast.success('Oportunidade de expansão cadastrada no pipeline!');
    onOpenChange(false);
    setTitle('');
    setProductOffered('');
    setPotentialValue(1500);
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5 text-emerald-500" /> Nova Oportunidade de Expansão (Upsell / Cross-Sell)
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Registre novas demandas de licenças, integrações adicionais ou novos módulos para o cliente.
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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de Expansão</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upsell" className="text-xs font-medium text-emerald-600">Upsell (Upgrade / Mais Usuários)</SelectItem>
                  <SelectItem value="cross_sell" className="text-xs font-medium text-indigo-600">Cross-sell (Novo Produto / Módulo)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Estágio Atual</Label>
              <Select value={stage} onValueChange={(val: any) => setStage(val)}>
                <SelectTrigger className="text-xs h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="identificada" className="text-xs">Oportunidade Identificada</SelectItem>
                  <SelectItem value="contato" className="text-xs">Em Contato / Reunião</SelectItem>
                  <SelectItem value="proposta" className="text-xs">Proposta Enviada</SelectItem>
                  <SelectItem value="fechada_ganha" className="text-xs text-emerald-600 font-semibold">Fechada & Ganha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Título da Oportunidade *</Label>
            <Input
              placeholder="Ex: Upgrade para Plano Enterprise + Módulo Fiscal"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-xs h-8"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Produto / Serviço Ofertado *</Label>
              <Input
                placeholder="Ex: Módulo BI / +10 Licenças"
                value={productOffered}
                onChange={(e) => setProductOffered(e.target.value)}
                className="text-xs h-8"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">MRR Adicional Estimado (R$/mês)</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={potentialValue}
                onChange={(e) => setPotentialValue(Number(e.target.value))}
                className="text-xs h-8"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-xs">
              <Label className="text-xs">Probabilidade de Fechamento</Label>
              <span className="font-mono font-semibold text-primary">{probability}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              step={5}
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Detalhes / Justificativa de Valor</Label>
            <Textarea
              placeholder="Descreva a dor que o cliente possui e como esta expansão trará ROI..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs min-h-[70px]"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
              Salvar no Pipeline
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

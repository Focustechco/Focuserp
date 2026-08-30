import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, Building2, User, DollarSign, Calendar, ExternalLink, 
  Trash2, CheckCircle2, RefreshCw, Tag, Mail, Phone, Clock
} from 'lucide-react';
import { OportunidadeCrm, EtapaPipeline } from '../types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

interface OportunidadeDetalhesModalProps {
  oportunidade: OportunidadeCrm | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMoverEtapa: (id: string, novaEtapa: EtapaPipeline) => void;
  onDelete: (id: string) => void;
}

const ETAPAS: EtapaPipeline[] = [
  'Qualificação',
  'Diagnóstico & Reunião',
  'Proposta Apresentada',
  'Em Negociação',
  'Fechado Ganho',
  'Perdido'
];

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function OportunidadeDetalhesModal({
  oportunidade,
  open,
  onOpenChange,
  onMoverEtapa,
  onDelete
}: OportunidadeDetalhesModalProps) {
  if (!oportunidade) return null;

  const isGanho = oportunidade.etapa === 'Fechado Ganho';
  const clickUpUrl = oportunidade.clickUpUrl || `https://app.clickup.com/t/${oportunidade.clickUpTaskId.replace('CU-', '')}`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[620px] overflow-y-auto p-6 space-y-6">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs font-mono text-orange-600 border-orange-400 bg-orange-50 dark:bg-orange-950/30 gap-1">
                  <RefreshCw className="w-3 h-3" /> {oportunidade.clickUpTaskId}
                </Badge>
                <Badge className={
                  oportunidade.prioridade === 'Urgente' ? 'bg-rose-100 text-rose-800 border-rose-300' :
                  oportunidade.prioridade === 'Alta' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                  'bg-slate-100 text-slate-700 border-slate-300'
                }>
                  {oportunidade.prioridade}
                </Badge>
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                {oportunidade.titulo}
              </SheetTitle>
              <SheetDescription className="text-xs flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-muted-foreground" /> {oportunidade.empresaNome} • {oportunidade.pipeline}
              </SheetDescription>
            </div>

            <div className="text-right">
              <span className="text-[10px] text-muted-foreground block uppercase font-medium">Valor Estimado</span>
              <div className="text-2xl font-black text-emerald-600">
                {formatCurrency(oportunidade.valorR$)}
              </div>
              <span className="text-[11px] text-muted-foreground">{oportunidade.probabilidadePercent}% de probabilidade</span>
            </div>
          </div>
        </SheetHeader>

        {/* Etapa do Pipeline */}
        <div className="p-4 bg-muted/30 border rounded-xl space-y-2">
          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Etapa Atual no Pipeline (ClickUp)</span>
            <span className="font-normal text-[11px] lowercase text-primary">sincronização bidirecional</span>
          </label>
          
          <Select 
            value={oportunidade.etapa} 
            onValueChange={(novaEtapa) => onMoverEtapa(oportunidade.id, novaEtapa as EtapaPipeline)}
          >
            <SelectTrigger className="bg-background font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ETAPAS.map((et) => (
                <SelectItem key={et} value={et}>
                  {et} {et === 'Fechado Ganho' ? '🏆' : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Informações da Empresa & Contato */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 border rounded-xl bg-card space-y-1.5 shadow-xs">
            <span className="text-[11px] text-muted-foreground block font-medium">Decisor / Contato</span>
            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-primary" /> {oportunidade.contatoNome}
            </div>
            {oportunidade.contatoEmail && (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Mail className="w-3 h-3" /> {oportunidade.contatoEmail}
              </div>
            )}
          </div>

          <div className="p-3.5 border rounded-xl bg-card space-y-1.5 shadow-xs">
            <span className="text-[11px] text-muted-foreground block font-medium">Responsável Interno</span>
            <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
              {oportunidade.responsavelAvatar ? (
                <img src={oportunidade.responsavelAvatar} alt="" className="w-4 h-4 rounded-full" />
              ) : (
                <User className="w-3.5 h-3.5 text-orange-500" />
              )}
              {oportunidade.responsavel}
            </div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Calendar className="w-3 h-3" /> Prev. Fechamento: {formatDateBrasilia(oportunidade.dataPrevistaFechamento)}
            </div>
          </div>
        </div>

        {/* Próxima Ação / Descrição */}
        {oportunidade.proximaAcao && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Próxima Ação / Detalhes da Tarefa
            </span>
            <div className="p-3.5 bg-muted/40 border rounded-xl text-xs text-foreground leading-relaxed whitespace-pre-wrap">
              {oportunidade.proximaAcao}
            </div>
          </div>
        )}

        {/* Tags */}
        {oportunidade.tags && oportunidade.tags.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Tags no ClickUp
            </span>
            <div className="flex flex-wrap gap-1.5">
              {oportunidade.tags.map((t, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs gap-1">
                  <Tag className="w-2.5 h-2.5" /> {t}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Rodapé de Ações */}
        <SheetFooter className="pt-4 border-t flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs gap-1.5"
              onClick={() => window.open(clickUpUrl, '_blank')}
            >
              <ExternalLink className="w-3.5 h-3.5 text-orange-500" /> Abrir no ClickUp
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 gap-1"
              onClick={() => {
                onDelete(oportunidade.id);
                onOpenChange(false);
                toast.success('Oportunidade removida do CRM.');
              }}
            >
              <Trash2 className="w-3.5 h-3.5" /> Excluir
            </Button>
          </div>

          {!isGanho && (
            <Button 
              size="sm" 
              className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 text-xs"
              onClick={() => {
                onMoverEtapa(oportunidade.id, 'Fechado Ganho');
                onOpenChange(false);
              }}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Marcar como Ganho
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

import React, { useState } from 'react';
import { Bug, Plus, AlertTriangle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SelectResponsavel } from '@/components/SelectResponsavel';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { BugItem, SeveridadeBug, PrioridadeDev } from '../types';

interface NovoBugSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId: string;
  onReportBug: (bug: Omit<BugItem, 'id' | 'createdAt'>) => void;
}

export function NovoBugSheet({ open, onOpenChange, projetoId, onReportBug }: NovoBugSheetProps) {
  const { notificar } = useNotificacoesStore();
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    severidade: 'Médio' as SeveridadeBug,
    prioridade: 'Média' as PrioridadeDev,
    ambiente: 'Homologação' as 'Desenvolvimento' | 'Homologação' | 'Produção',
    responsavel: '',
    evidencias: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo) return;

    onReportBug({
      projetoId,
      titulo: form.titulo,
      descricao: form.descricao,
      severidade: form.severidade,
      prioridade: form.prioridade,
      ambiente: form.ambiente,
      responsavel: form.responsavel || 'QA Analyst',
      status: 'Aberto',
      evidencias: form.evidencias,
    });

    if (form.responsavel) {
      notificar({
        titulo: `Novo Bug/Defeito atribuído a você: "${form.titulo}"`,
        descricao: `Severidade: ${form.severidade}, Prioridade: ${form.prioridade}, Ambiente: ${form.ambiente}.`,
        origem: 'Projetos',
        tipo: 'Aviso',
        prioridade: (form.severidade === 'Crítico' || form.severidade === 'Alto') ? 'Alta' : 'Normal',
        targetUrl: '/desenvolvimento',
        usuarioDestino: form.responsavel
      });
    }

    onOpenChange(false);
    setForm({
      titulo: '',
      descricao: '',
      severidade: 'Médio',
      prioridade: 'Média',
      ambiente: 'Homologação',
      responsavel: '',
      evidencias: '',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold flex items-center gap-2 text-rose-600">
            <Bug className="h-5 w-5" /> Reportar Novo Bug / Defeito Técnico
          </SheetTitle>
          <SheetDescription className="text-xs">
            Registre falhas, comportamentos inesperados ou inconsistências com nível de severidade.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Título do Bug *</Label>
            <Input
              required
              placeholder="Ex: Erro 500 ao confirmar faturamento com token expirado"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Severidade *</Label>
              <Select value={form.severidade} onValueChange={(val: SeveridadeBug) => setForm({ ...form, severidade: val })}>
                <SelectTrigger className="text-xs font-bold text-rose-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Crítico">Crítico (Sistema Fora / Impeditivo)</SelectItem>
                  <SelectItem value="Alto">Alto (Impacta Operação Principal)</SelectItem>
                  <SelectItem value="Médio">Médio (Inconsistência Visual / Regra)</SelectItem>
                  <SelectItem value="Baixo">Baixo (Ajuste Menor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Ambiente Ocorrido *</Label>
              <Select value={form.ambiente} onValueChange={(val: any) => setForm({ ...form, ambiente: val })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Desenvolvimento">Desenvolvimento (Local/Dev)</SelectItem>
                  <SelectItem value="Homologação">Homologação (Staging)</SelectItem>
                  <SelectItem value="Produção">Produção (Live / Incidente)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Desenvolvedor / Responsável Atribuído</Label>
            <SelectResponsavel
              value={form.responsavel}
              onValueChange={(val) => setForm({ ...form, responsavel: val })}
              placeholder="Selecione o Desenvolvedor Responsável"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Passos para Reproduzir & Comportamento Esperado</Label>
            <Textarea
              rows={4}
              placeholder="1. Acessar tela X... 2. Clicar no botão Y... 3. Erro observado..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Evidências (Logs, StackTrace ou URLs de Imagem)</Label>
            <Textarea
              rows={2}
              placeholder="Copie aqui o log do erro ou link da captura de tela..."
              value={form.evidencias}
              onChange={(e) => setForm({ ...form, evidencias: e.target.value })}
              className="text-xs font-mono"
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" variant="destructive" size="sm" className="gap-1.5 font-semibold">
              <Plus className="h-4 w-4" /> Reportar Bug
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

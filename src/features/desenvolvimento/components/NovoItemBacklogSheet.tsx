import React, { useState } from 'react';
import { Layers, Plus, Code2, CheckSquare } from 'lucide-react';
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
import { ItemBacklog, TipoItemBacklog, StatusKanban, PrioridadeDev } from '../types';

interface NovoItemBacklogSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetoId: string;
  sprintId?: string;
  onAddItem: (item: Omit<ItemBacklog, 'id' | 'createdAt'>) => void;
}

export function NovoItemBacklogSheet({
  open,
  onOpenChange,
  projetoId,
  sprintId,
  onAddItem,
}: NovoItemBacklogSheetProps) {
  const { notificar } = useNotificacoesStore();
  const [form, setForm] = useState({
    titulo: '',
    descricao: '',
    tipoItem: 'História de Usuário' as TipoItemBacklog,
    prioridade: 'Média' as PrioridadeDev,
    status: 'Backlog' as StatusKanban,
    responsavel: '',
    storyPoints: 3,
    estimativaHoras: 8,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo) return;

    onAddItem({
      projetoId,
      sprintId,
      titulo: form.titulo,
      descricao: form.descricao,
      tipoItem: form.tipoItem,
      prioridade: form.prioridade,
      status: form.status,
      responsavel: form.responsavel || 'Desenvolvedor',
      storyPoints: Number(form.storyPoints) || 1,
      estimativaHoras: Number(form.estimativaHoras) || 4,
      horasApontadas: 0,
      tags: [form.tipoItem, form.prioridade],
      criteriosAceite: [
        { id: `crit-${Date.now()}-1`, descricao: 'Funcionalidade validada e aprovada em QA', concluido: false },
        { id: `crit-${Date.now()}-2`, descricao: 'Testes de integração automatizados passando', concluido: false }
      ],
      updatedAt: new Date().toISOString(),
    });

    notificar({
      titulo: `Novo Item no Backlog`,
      descricao: `"${form.titulo}" (${form.tipoItem}) adicionado com sucesso ao projeto.`,
      origem: 'Desenvolvimento',
      tipo: 'Info',
      prioridade: form.prioridade === 'Crítica' ? 'Urgente' : 'Normal',
      targetUrl: '/desenvolvimento',
    });

    setForm({
      titulo: '',
      descricao: '',
      tipoItem: 'História de Usuário',
      prioridade: 'Média',
      status: 'Backlog',
      responsavel: '',
      storyPoints: 3,
      estimativaHoras: 8,
    });

    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader className="pb-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-base font-bold">
            <Code2 className="w-5 h-5 text-primary" /> Novo Item de Backlog / Engenharia
          </SheetTitle>
          <SheetDescription className="text-xs">
            Crie épicos, histórias, tarefas de arquitetura ou bugs para o pipeline técnico.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 text-xs">
          <div className="space-y-1.5">
            <Label className="font-semibold text-foreground">Título do Item *</Label>
            <Input
              required
              placeholder="Ex: Desenvolver endpoint de conciliação bancária OFX"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-foreground">Descrição Técnica & Critérios</Label>
            <Textarea
              placeholder="Descreva a especificação, dependências e impacto na arquitetura..."
              value={form.descricao}
              onChange={e => setForm({ ...form, descricao: e.target.value })}
              className="min-h-[90px] text-xs resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Tipo de Item</Label>
              <Select value={form.tipoItem} onValueChange={(val: TipoItemBacklog) => setForm({ ...form, tipoItem: val })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Épico">Épico</SelectItem>
                  <SelectItem value="Funcionalidade">Funcionalidade</SelectItem>
                  <SelectItem value="História de Usuário">História de Usuário</SelectItem>
                  <SelectItem value="Tarefa Técnica">Tarefa Técnica</SelectItem>
                  <SelectItem value="Melhoria">Melhoria</SelectItem>
                  <SelectItem value="Correção / Bug">Correção / Bug</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Prioridade</Label>
              <Select value={form.prioridade} onValueChange={(val: PrioridadeDev) => setForm({ ...form, prioridade: val })}>
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Crítica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Story Points (Fibonacci)</Label>
              <Input
                type="number"
                min="1"
                max="100"
                value={form.storyPoints}
                onChange={e => setForm({ ...form, storyPoints: parseInt(e.target.value) || 1 })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold text-foreground">Estimativa em Horas (h)</Label>
              <Input
                type="number"
                min="1"
                max="500"
                value={form.estimativaHoras}
                onChange={e => setForm({ ...form, estimativaHoras: parseInt(e.target.value) || 1 })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-foreground">Responsável / Tech Owner</Label>
            <SelectResponsavel
              value={form.responsavel}
              onValueChange={val => setForm({ ...form, responsavel: val })}
              placeholder="Selecione o desenvolvedor..."
            />
          </div>

          <div className="space-y-1.5">
            <Label className="font-semibold text-foreground">Status Inicial do Kanban</Label>
            <Select value={form.status} onValueChange={(val: StatusKanban) => setForm({ ...form, status: val })}>
              <SelectTrigger className="text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Backlog">Backlog</SelectItem>
                <SelectItem value="A Fazer">A Fazer</SelectItem>
                <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                <SelectItem value="Code Review">Code Review</SelectItem>
                <SelectItem value="QA">QA</SelectItem>
                <SelectItem value="Pronto para Deploy">Pronto para Deploy</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2">
            <div className="p-3 bg-muted/40 rounded-xl border space-y-1">
              <span className="font-semibold text-foreground text-xs flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-primary" /> Critérios de Aceite Padrão
              </span>
              <p className="text-[11px] text-muted-foreground">
                Serão incluídos automaticamente checklists de validação funcional e cobertura de testes.
              </p>
            </div>
          </div>

          <SheetFooter className="pt-4 border-t flex flex-col sm:flex-row gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="text-xs w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="text-xs w-full sm:w-auto bg-primary text-primary-foreground font-semibold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Criar Item
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

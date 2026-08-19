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
    });

    if (form.responsavel) {
      notificar({
        titulo: `Nova tarefa atribuída a você: "${form.titulo}"`,
        descricao: `Você foi definido como responsável por um item no backlog (${form.tipoItem}, Prioridade: ${form.prioridade}).`,
        origem: 'Projetos',
        tipo: 'Informação',
        prioridade: (form.prioridade === 'Crítica' || form.prioridade === 'Alta') ? 'Alta' : 'Normal',
        targetUrl: '/desenvolvimento',
        usuarioDestino: form.responsavel
      });
    }

    onOpenChange(false);
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
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Criar Item no Backlog / Sprint
          </SheetTitle>
          <SheetDescription className="text-xs">
            Cadastre novas histórias de usuário, épicos, tarefas técnicas ou melhorias.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4 text-xs">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Título do Item *</Label>
            <Input
              required
              placeholder="Ex: Implementar Webhooks de Pagamento PIX"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Item *</Label>
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

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Prioridade *</Label>
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
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Story Points (Fibonacci)</Label>
              <Input
                type="number"
                min={1}
                max={13}
                value={form.storyPoints}
                onChange={(e) => setForm({ ...form, storyPoints: Number(e.target.value) })}
                className="text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Estimativa em Horas</Label>
              <Input
                type="number"
                min={1}
                value={form.estimativaHoras}
                onChange={(e) => setForm({ ...form, estimativaHoras: Number(e.target.value) })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Responsável pela Tarefa</Label>
            <SelectResponsavel
              value={form.responsavel}
              onValueChange={(val) => setForm({ ...form, responsavel: val })}
              placeholder="Selecione o Usuário Responsável"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Coluna Kanban Inicial</Label>
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

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Descrição & Critérios de Aceite</Label>
            <Textarea
              rows={4}
              placeholder="Descreva a estória, regras de negócio e critérios de aceite..."
              value={form.descricao}
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
              className="text-xs"
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="gap-1.5 font-semibold">
              <Plus className="h-4 w-4" /> Adicionar Tarefa
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

import React, { useState } from 'react';
import { Calendar, Plus, Flag, Clock, User, FileText } from 'lucide-react';
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
import { EventoProjeto, TipoEventoProjeto, PrioridadeEventoProjeto } from './types';
import { Projeto } from '../types';

interface NovoMarcoSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projetos: Projeto[];
  onAddEvent: (evt: Omit<EventoProjeto, 'id' | 'isAutomatico'>) => void;
}

export function NovoMarcoSheet({ open, onOpenChange, projetos, onAddEvent }: NovoMarcoSheetProps) {
  const { notificar } = useNotificacoesStore();
  const [form, setForm] = useState({
    titulo: '',
    tipo: 'Entrega de Projeto' as TipoEventoProjeto,
    data: new Date().toISOString().split('T')[0],
    hora: '14:00',
    projetoId: '',
    responsavel: '',
    prioridade: 'Média' as PrioridadeEventoProjeto,
    observacoes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titulo || !form.data) return;

    const projetoEncontrado = projetos.find((p) => p.id === form.projetoId);
    const respFinal = form.responsavel || (projetoEncontrado ? projetoEncontrado.responsavelPrincipal : undefined);

    onAddEvent({
      titulo: form.titulo,
      tipo: form.tipo,
      data: form.data,
      hora: form.hora,
      projetoId: form.projetoId && form.projetoId !== 'none' ? form.projetoId : undefined,
      projetoNome: projetoEncontrado ? projetoEncontrado.nome : undefined,
      responsavel: respFinal,
      status: 'Previsto',
      prioridade: form.prioridade,
      observacoes: form.observacoes,
    });

    if (respFinal) {
      notificar({
        titulo: `Novo Marco / Entrega Agendado: "${form.titulo}"`,
        descricao: `Data: ${form.data} às ${form.hora}, Tipo: ${form.tipo}, Prioridade: ${form.prioridade}.`,
        origem: 'Projetos',
        tipo: 'Informação',
        prioridade: (form.prioridade === 'Crítica' || form.prioridade === 'Alta') ? 'Alta' : 'Normal',
        targetUrl: '/projetos',
        usuarioDestino: respFinal
      });
    }

    onOpenChange(false);
    setForm({
      titulo: '',
      tipo: 'Entrega de Projeto',
      data: new Date().toISOString().split('T')[0],
      hora: '14:00',
      projetoId: '',
      responsavel: '',
      prioridade: 'Média',
      observacoes: '',
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-bold flex items-center gap-2">
            <Flag className="h-5 w-5 text-primary" /> Agendar Marco ou Entrega de Projeto
          </SheetTitle>
          <SheetDescription className="text-xs">
            Cadastre um novo prazo, homologação, entrega ou reunião vinculada ao projeto.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold">Título do Prazo / Entrega *</Label>
            <Input
              required
              placeholder="Ex: Homologação do Módulo de Pagamentos V2"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              className="text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Tipo de Evento *</Label>
              <Select
                value={form.tipo}
                onValueChange={(val: TipoEventoProjeto) => setForm({ ...form, tipo: val })}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Entrega de Projeto">Entrega de Projeto</SelectItem>
                  <SelectItem value="Kickoff">Kickoff / Reunião Inicial</SelectItem>
                  <SelectItem value="Homologação">Fase de Homologação</SelectItem>
                  <SelectItem value="Implantação">Implantação em Produção</SelectItem>
                  <SelectItem value="Marco / Milestone">Marco / Milestone</SelectItem>
                  <SelectItem value="Reunião de Alinhamento">Reunião de Alinhamento</SelectItem>
                  <SelectItem value="Outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Prioridade *</Label>
              <Select
                value={form.prioridade}
                onValueChange={(val: PrioridadeEventoProjeto) => setForm({ ...form, prioridade: val })}
              >
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
              <Label className="text-xs font-semibold">Data da Entrega / Prazo *</Label>
              <Input
                type="date"
                required
                value={form.data}
                onChange={(e) => setForm({ ...form, data: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Horário Estimado</Label>
              <Input
                type="time"
                value={form.hora}
                onChange={(e) => setForm({ ...form, hora: e.target.value })}
                className="text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Vincular a um Projeto Existente</Label>
            <Select value={form.projetoId} onValueChange={(val) => setForm({ ...form, projetoId: val })}>
              <SelectTrigger className="text-xs">
                <SelectValue placeholder="Selecione um Projeto (Opcional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum (Evento Geral)</SelectItem>
                {projetos.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.nome} ({p.codigo})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Responsável pela Entrega</Label>
            <SelectResponsavel
              value={form.responsavel}
              onValueChange={(val) => setForm({ ...form, responsavel: val })}
              placeholder="Selecione o Usuário Responsável"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs font-semibold">Observações / Detalhes do Escopo</Label>
            <Textarea
              rows={3}
              placeholder="Descreva critério de aceite ou observações importantes sobre este prazo..."
              value={form.observacoes}
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
              className="text-xs"
            />
          </div>

          <SheetFooter className="pt-4">
            <Button type="button" variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" className="gap-1.5">
              <Plus className="h-4 w-4" /> Cadastrar Prazo
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}

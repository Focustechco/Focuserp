import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calendar, Clock, CheckCircle2, AlertCircle, Plus, 
  Flame, Phone, MessageSquare, Video, FileText, ChevronRight, Check
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { AgendaComercialItem } from '../types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

export function MinhaAgendaComercial() {
  const { agenda, toggleAgendaItem, addAgendaItem } = useComercialStore();
  const [openNewModal, setOpenNewModal] = useState(false);

  // Form State Novo Item
  const [titulo, setTitulo] = useState('');
  const [cliente, setCliente] = useState('');
  const [contato, setContato] = useState('');
  const [tipo, setTipo] = useState<AgendaComercialItem['tipo']>('Reunião Hoje');
  const [horario, setHorario] = useState('14:00');
  const [data, setData] = useState(new Date().toISOString().split('T')[0]);
  const [responsavel, setResponsavel] = useState('');
  const [prioridade, setPrioridade] = useState<'Urgente' | 'Alta' | 'Média'>('Alta');

  const pendentes = agenda.filter(a => a.status === 'Pendente');
  const concluidos = agenda.filter(a => a.status === 'Concluído');

  const handleCreate = () => {
    if (!titulo.trim() || !cliente.trim()) {
      toast.error('Informe o título e o cliente.');
      return;
    }

    addAgendaItem({
      id: `ag-${Date.now()}`,
      tipo,
      titulo: titulo.trim(),
      cliente: cliente.trim(),
      contato: contato.trim() || undefined,
      horario,
      data,
      responsavel,
      status: 'Pendente',
      prioridade
    });

    toast.success('Compromisso adicionado à sua agenda comercial!');
    setOpenNewModal(false);
    setTitulo('');
    setCliente('');
    setContato('');
  };

  return (
    <Card className="rounded-2xl border-orange-500/30 bg-gradient-to-r from-orange-50/40 via-amber-50/20 to-background dark:from-orange-950/20 dark:via-background dark:to-background shadow-xs overflow-hidden">
      <CardContent className="p-4 space-y-3">
        {/* Header do Widget */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-xs">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
                <span>Minha Agenda Comercial de Hoje</span>
                <Badge variant="outline" className="text-[10px] font-bold border-orange-500/50 text-orange-700 dark:text-orange-300 bg-orange-100/50 dark:bg-orange-950/40">
                  {pendentes.length} pendentes
                </Badge>
              </h3>
              <p className="text-[11px] text-muted-foreground">
                Follow-ups prioritários, reuniões agendadas e propostas aguardando retorno comercial.
              </p>
            </div>
          </div>

          <Button 
            size="sm" 
            onClick={() => setOpenNewModal(true)} 
            className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1 font-bold shadow-xs self-end sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Novo Compromisso
          </Button>
        </div>

        {/* Lista Horizontal / Grid de Tarefas do Dia */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          {pendentes.length === 0 ? (
            <div className="col-span-3 p-4 text-center text-xs text-muted-foreground border border-dashed rounded-xl bg-background/50">
              🎉 Nenhum compromisso pendente na sua agenda comercial de hoje!
            </div>
          ) : (
            pendentes.slice(0, 6).map(item => {
              const isUrgente = item.prioridade === 'Urgente';

              return (
                <div 
                  key={item.id}
                  className={`p-3 rounded-xl border bg-card/90 shadow-2xs space-y-2 transition-all hover:border-orange-500/50 hover:shadow-xs flex flex-col justify-between ${
                    isUrgente ? 'border-rose-400/60 bg-rose-50/10' : 'border-border'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex justify-between items-center gap-1">
                      <Badge variant="outline" className={
                        item.tipo.includes('Atrasado') ? 'text-[9px] font-bold text-rose-600 border-rose-300 bg-rose-50' :
                        item.tipo.includes('Reunião') ? 'text-[9px] font-bold text-blue-600 border-blue-300 bg-blue-50' :
                        'text-[9px] font-bold text-amber-600 border-amber-300 bg-amber-50'
                      }>
                        {item.tipo}
                      </Badge>

                      {item.horario && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                          <Clock className="w-2.5 h-2.5" /> {item.horario}
                        </span>
                      )}
                    </div>

                    <h4 className="font-bold text-xs text-foreground leading-snug truncate">
                      {item.titulo}
                    </h4>

                    <div className="text-[11px] text-muted-foreground truncate">
                      <strong>{item.cliente}</strong> {item.contato ? `• ${item.contato}` : ''}
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-1.5 border-t border-border/40 text-[10px]">
                    <span className="text-muted-foreground truncate max-w-[110px]">{item.responsavel}</span>

                    <button 
                      onClick={() => toggleAgendaItem(item.id)}
                      className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-300 dark:border-emerald-800 font-semibold transition-colors"
                    >
                      <Check className="w-3 h-3" /> Concluir
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>

      {/* Modal Novo Compromisso */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Calendar className="w-5 h-5 text-orange-500" /> Adicionar à Agenda Comercial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título do Compromisso *</Label>
              <Input 
                placeholder="Ex: Apresentação de proposta ou follow-up"
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Cliente / Empresa *</Label>
                <Input 
                  placeholder="Nome do cliente"
                  value={cliente}
                  onChange={e => setCliente(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Contato Decisor</Label>
                <Input 
                  placeholder="Nome do decisor"
                  value={contato}
                  onChange={e => setContato(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Tipo</Label>
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reunião Hoje">📅 Reunião</SelectItem>
                    <SelectItem value="Follow-up Atrasado">🔥 Follow-up</SelectItem>
                    <SelectItem value="Lead para Contatar">📞 Lead Novo</SelectItem>
                    <SelectItem value="Proposta Aguardando">📄 Proposta</SelectItem>
                    <SelectItem value="Tarefa Prioritária">⚡ Prioritária</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Horário</Label>
                <Input 
                  type="time"
                  value={horario}
                  onChange={e => setHorario(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Prioridade</Label>
                <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              Salvar Compromisso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

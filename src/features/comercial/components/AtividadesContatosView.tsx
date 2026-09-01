import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Phone, MessageSquare, Video, Mail, Flame, Plus, Search, 
  Filter, Calendar, Clock, CheckCircle2, User, Building2, Trash2
} from 'lucide-react';
import { useComercialStore } from '../hooks/useComercialStore';
import { TipoAtividade, ResultadoAtividade } from '../types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

export function AtividadesContatosView() {
  const { atividades, equipe, oportunidades, registrarAtividade, deleteAtividadeItem } = useComercialStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [tipoFilter, setTipoFilter] = useState('todos');
  const [responsavelFilter, setResponsavelFilter] = useState('todos');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [empresa, setEmpresa] = useState('');
  const [contato, setContato] = useState('');
  const [responsavel, setResponsavel] = useState(equipe[0]?.nome || '');
  const [tipo, setTipo] = useState<TipoAtividade>('WhatsApp');
  const [resultado, setResultado] = useState<ResultadoAtividade>('Positivo / Avançou');
  const [observacoes, setObservacoes] = useState('');
  const [duracaoMinutos, setDuracaoMinutos] = useState('15');
  const [proximaAcao, setProximaAcao] = useState('');
  const [dataProximoFollowUp, setDataProximoFollowUp] = useState('');

  // Filtragem
  const filteredAtividades = useMemo(() => {
    return atividades.filter(a => {
      const matchSearch = 
        a.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.contato.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.observacoes.toLowerCase().includes(searchTerm.toLowerCase());

      const matchTipo = tipoFilter === 'todos' || a.tipo === tipoFilter;
      const matchResp = responsavelFilter === 'todos' || a.responsavel === responsavelFilter;

      return matchSearch && matchTipo && matchResp;
    });
  }, [atividades, searchTerm, tipoFilter, responsavelFilter]);

  const handleSave = () => {
    if (!empresa.trim() || !observacoes.trim()) {
      toast.error('Preencha a empresa e o resumo da atividade.');
      return;
    }

    registrarAtividade({
      responsavel,
      empresa: empresa.trim(),
      contato: contato.trim() || 'Contato Principal',
      tipo,
      data: new Date().toISOString().split('T')[0],
      horario: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duracaoMinutos: parseInt(duracaoMinutos) || 15,
      resultado,
      observacoes: observacoes.trim(),
      proximaAcao: proximaAcao.trim() || undefined,
      dataProximoFollowUp: dataProximoFollowUp || undefined
    });

    setOpenModal(false);
    setEmpresa('');
    setContato('');
    setObservacoes('');
    setProximaAcao('');
    setDataProximoFollowUp('');
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header & Filtros */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Phone className="w-5 h-5 text-orange-500" /> Registro Operacional de Atividades Comerciais
          </h3>
          <p className="text-xs text-muted-foreground">
            Central de registro de ligações, WhatsApp, reuniões e follow-ups realizados pela equipe.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5" /> Registrar Nova Atividade
        </Button>
      </div>

      {/* Barra de Filtros e Busca */}
      <div className="flex flex-wrap items-center gap-2.5 bg-muted/20 p-3.5 rounded-2xl border">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input 
            placeholder="Buscar por empresa, contato ou observação..." 
            className="pl-8 h-8 text-xs bg-background rounded-xl"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <Select value={tipoFilter} onValueChange={setTipoFilter}>
          <SelectTrigger className="w-[140px] h-8 text-xs bg-background rounded-xl">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os Tipos</SelectItem>
            <SelectItem value="WhatsApp">💬 WhatsApp</SelectItem>
            <SelectItem value="Ligação">📞 Ligação</SelectItem>
            <SelectItem value="Reunião">📅 Reunião</SelectItem>
            <SelectItem value="E-mail">✉️ E-mail</SelectItem>
            <SelectItem value="Follow-up">🔥 Follow-up</SelectItem>
            <SelectItem value="Demonstração">💻 Demonstração</SelectItem>
          </SelectContent>
        </Select>

        <Select value={responsavelFilter} onValueChange={setResponsavelFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs bg-background rounded-xl">
            <SelectValue placeholder="Responsável" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos Responsáveis</SelectItem>
            {equipe.map(m => (
              <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Feed de Atividades Registradas */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Histórico Cronológico de Atividades ({filteredAtividades.length})</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {filteredAtividades.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                Nenhuma atividade comercial registrada ainda. Clique em "Registrar Nova Atividade" para iniciar!
              </div>
            ) : (
              filteredAtividades.map(a => (
                <div key={a.id} className="p-4 rounded-xl border bg-card/90 space-y-2 shadow-2xs hover:border-primary/40 transition-colors">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1.5 border-b pb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={
                        a.tipo === 'WhatsApp' ? 'bg-emerald-50 text-emerald-700 border-emerald-300 text-[10px]' :
                        a.tipo === 'Ligação' ? 'bg-blue-50 text-blue-700 border-blue-300 text-[10px]' :
                        a.tipo === 'Reunião' ? 'bg-purple-50 text-purple-700 border-purple-300 text-[10px]' :
                        'bg-orange-50 text-orange-700 border-orange-300 text-[10px]'
                      }>
                        {a.tipo}
                      </Badge>
                      <span className="font-bold text-xs text-foreground">{a.empresa}</span>
                      <span className="text-[11px] text-muted-foreground">({a.contato})</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono">
                      <span>{formatDateBrasilia(a.data)} às {a.horario}</span>
                      {a.duracaoMinutos && <span>({a.duracaoMinutos} min)</span>}
                    </div>
                  </div>

                  <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                    {a.observacoes}
                  </p>

                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pt-2 border-t text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-3">
                      <span>Responsável: <strong>{a.responsavel}</strong></span>
                      <span>Resultado: <strong className="text-primary">{a.resultado}</strong></span>
                    </div>

                    {a.dataProximoFollowUp && (
                      <Badge variant="secondary" className="text-[10px] gap-1 font-mono">
                        <Calendar className="w-2.5 h-2.5" /> Próximo Follow-up: {formatDateBrasilia(a.dataProximoFollowUp)}
                      </Badge>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Modal Registrar Atividade */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Phone className="w-5 h-5 text-orange-500" /> Registrar Atividade Comercial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Cliente / Empresa *</Label>
                <Input 
                  placeholder="Nome da empresa"
                  value={empresa}
                  onChange={e => setEmpresa(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Contato Decisor</Label>
                <Input 
                  placeholder="Nome do contato"
                  value={contato}
                  onChange={e => setContato(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Tipo de Contato</Label>
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WhatsApp">💬 WhatsApp</SelectItem>
                    <SelectItem value="Ligação">📞 Ligação</SelectItem>
                    <SelectItem value="Reunião">📅 Reunião</SelectItem>
                    <SelectItem value="E-mail">✉️ E-mail</SelectItem>
                    <SelectItem value="Follow-up">🔥 Follow-up</SelectItem>
                    <SelectItem value="Demonstração">💻 Demonstração</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Responsável</Label>
                <Select value={responsavel} onValueChange={setResponsavel}>
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {equipe.map(m => (
                      <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Duração (min)</Label>
                <Input 
                  type="number"
                  value={duracaoMinutos}
                  onChange={e => setDuracaoMinutos(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Resultado da Atividade</Label>
              <Select value={resultado} onValueChange={(v: any) => setResultado(v)}>
                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Positivo / Avançou">✅ Positivo / Avançou Etapa</SelectItem>
                  <SelectItem value="Diagnóstico Agendado">🎯 Agendou Diagnóstico</SelectItem>
                  <SelectItem value="Proposta Solicitada">📄 Solicitou Proposta</SelectItem>
                  <SelectItem value="Aguardando Retorno">⏳ Aguardando Retorno</SelectItem>
                  <SelectItem value="Sem Contato / Caixa Postal">📵 Sem Contato / Caixa Postal</SelectItem>
                  <SelectItem value="Sem Interesse">❌ Sem Interesse</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Resumo / O que foi conversado *</Label>
              <Textarea 
                placeholder="Detalhe o feedback do cliente, dores apresentadas e encaminhamentos acordados..."
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                className="rounded-xl min-h-[75px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Próxima Ação</Label>
                <Input 
                  placeholder="Ex: Enviar minuta ou retornar ligação"
                  value={proximaAcao}
                  onChange={e => setProximaAcao(e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Data do Próximo Follow-up</Label>
                <Input 
                  type="date"
                  value={dataProximoFollowUp}
                  onChange={e => setDataProximoFollowUp(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl">Cancelar</Button>
            <Button onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold">
              Salvar Atividade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

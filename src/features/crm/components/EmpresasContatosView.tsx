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
  Building2, User, Phone, Mail, MessageSquare, ExternalLink, 
  Search, Plus, Calendar, Clock, CheckCircle2, RefreshCw, History,
  Send, PhoneCall, Video, Check
} from 'lucide-react';
import { useCrmStore } from '../hooks/useCrmStore';
import { OportunidadeCrm, InteracaoCrm } from '../types';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

// Avatar do Usuário ClickUp
function UserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl && avatarUrl.trim()) {
    return (
      <img 
        src={avatarUrl} 
        alt={name} 
        className="w-6 h-6 rounded-full object-cover ring-1 ring-border shadow-xs shrink-0" 
        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
      />
    );
  }

  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  return (
    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 text-white font-bold text-[10px] flex items-center justify-center shadow-xs shrink-0">
      {initials || 'U'}
    </div>
  );
}

export function EmpresasContatosView() {
  const { oportunidades, interacoes, addInteracao, config } = useCrmStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');

  // Modal Registrar Follow-up
  const [selectedOpForFollowUp, setSelectedOpForFollowUp] = useState<OportunidadeCrm | null>(null);
  const [tipoContato, setTipoContato] = useState<'WhatsApp' | 'Ligação' | 'Reunião' | 'E-mail' | 'Diagnóstico' | 'Follow-up'>('WhatsApp');
  const [descricaoContato, setDescricaoContato] = useState('');
  const [resultadoContato, setResultadoContato] = useState<'Positivo' | 'Neutro' | 'Negativo' | 'Agendou Diagnóstico' | 'Aguardando Resposta'>('Positivo');
  const [proximoContatoData, setProximoContatoData] = useState('');

  // Modal Ver Histórico de Follow-ups do Cliente
  const [selectedOpHistory, setSelectedOpHistory] = useState<OportunidadeCrm | null>(null);

  // Status únicos presentes nas tarefas reais
  const uniqueStatuses = useMemo(() => {
    const set = new Set<string>();
    oportunidades.forEach(op => {
      if (op.etapa) set.add(op.etapa);
    });
    return Array.from(set);
  }, [oportunidades]);

  // Filtragem dos cards de clientes
  const filteredOportunidades = useMemo(() => {
    return oportunidades.filter(op => {
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        (op.titulo || '').toLowerCase().includes(search) ||
        (op.empresaNome || '').toLowerCase().includes(search) ||
        (op.contatoNome || '').toLowerCase().includes(search) ||
        (op.responsavel || '').toLowerCase().includes(search) ||
        (op.clickUpTaskId || '').toLowerCase().includes(search);

      const matchStatus = statusFilter === 'todos' || op.etapa === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [oportunidades, searchTerm, statusFilter]);

  // Salvar novo follow-up
  const handleSaveFollowUp = () => {
    if (!selectedOpForFollowUp) return;
    if (!descricaoContato.trim()) {
      toast.error('Informe os detalhes do contato realizado.');
      return;
    }

    const novaInteracao: InteracaoCrm = {
      id: `it-${Date.now()}`,
      oportunidadeId: selectedOpForFollowUp.id,
      clickUpTaskId: selectedOpForFollowUp.clickUpTaskId,
      clienteNome: selectedOpForFollowUp.empresaNome || selectedOpForFollowUp.titulo,
      tipo: tipoContato,
      descricao: descricaoContato.trim(),
      dataHora: new Date().toISOString(),
      responsavel: selectedOpForFollowUp.responsavel || 'Equipe Comercial',
      responsavelAvatar: selectedOpForFollowUp.responsavelAvatar,
      proximoContatoData: proximoContatoData || undefined,
      resultado: resultadoContato
    };

    addInteracao(novaInteracao);
    toast.success(`Follow-up registrado para ${selectedOpForFollowUp.empresaNome}!`);

    setSelectedOpForFollowUp(null);
    setDescricaoContato('');
    setProximoContatoData('');
  };

  const clientInteractions = useMemo(() => {
    if (!selectedOpHistory) return [];
    return interacoes.filter(
      it => it.oportunidadeId === selectedOpHistory.id || it.clickUpTaskId === selectedOpHistory.clickUpTaskId
    );
  }, [interacoes, selectedOpHistory]);

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Cabeçalho da Seção de Clientes & Contatos */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Building2 className="w-5 h-5 text-primary" /> Clientes & Histórico de Contatos (Dados Reais)
          </h3>
          <p className="text-xs text-muted-foreground">
            Acompanhamento de clientes em carteira, canais de contato direto e histórico de follow-ups realizados.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Busca */}
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente ou contato..." 
              className="pl-8 h-8 text-xs bg-background rounded-xl"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro por Etapa */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background rounded-xl">
              <SelectValue placeholder="Etapa ClickUp" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              {uniqueStatuses.map(st => (
                <SelectItem key={st} value={st}>{st}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards de Resumo */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        <Card className="shadow-2xs bg-card border rounded-2xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Clientes em Carteira</span>
            <div className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-500" /> {oportunidades.length} contas
            </div>
            <p className="text-[10px] text-muted-foreground">Extraídos diretamente dos cards do ClickUp</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs bg-card border rounded-2xl">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Total de Follow-ups Realizados</span>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-500" /> {interacoes.length} contatos
            </div>
            <p className="text-[10px] text-muted-foreground">Ligações, WhatsApp e reuniões registradas</p>
          </CardContent>
        </Card>

        <Card className="shadow-2xs bg-card border rounded-2xl col-span-2 lg:col-span-1">
          <CardContent className="p-4 space-y-1">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">Volume Financeiro Total</span>
            <div className="text-2xl font-bold text-foreground">
              {formatCurrency(oportunidades.reduce((acc, o) => acc + (o.valorR$ || 0), 0))}
            </div>
            <p className="text-[10px] text-muted-foreground">Soma de valores reais informados</p>
          </CardContent>
        </Card>
      </div>

      {/* TABELA DE CLIENTES E CONTATOS (APENAS DADOS REAIS DOS CARDS) */}
      <Card className="rounded-2xl border shadow-xs">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-bold flex items-center justify-between">
            <span>Listagem de Clientes e Contatos Ativos</span>
            <span className="text-xs font-normal text-muted-foreground">{filteredOportunidades.length} registros</span>
          </CardTitle>
          <CardDescription className="text-xs">
            Visualize os canais de contato de cada cliente e registre novas interações comerciais.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-xl overflow-x-auto bg-card text-xs">
            <table className="w-full text-left border-collapse">
              <thead className="bg-muted/50 border-b text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                <tr>
                  <th className="p-3">Cliente / Tarefa ClickUp</th>
                  <th className="p-3">Contato & Canais</th>
                  <th className="p-3">Status ClickUp</th>
                  <th className="p-3">Valor (R$)</th>
                  <th className="p-3">Responsável</th>
                  <th className="p-3 text-center">Follow-ups Realizados</th>
                  <th className="p-3 text-right">Ações de Contato</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredOportunidades.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-muted-foreground text-xs">
                      Nenhum card ou cliente encontrado no ClickUp.
                    </td>
                  </tr>
                ) : (
                  filteredOportunidades.map(op => {
                    const opFollowUps = interacoes.filter(
                      it => it.oportunidadeId === op.id || it.clickUpTaskId === op.clickUpTaskId
                    );
                    const totalFollowUps = opFollowUps.length;
                    const ultimoContato = opFollowUps[opFollowUps.length - 1];

                    const whatsappNum = op.contatoTelefone ? op.contatoTelefone.replace(/\D/g, '') : '';

                    return (
                      <tr key={op.id} className="hover:bg-muted/30 transition-colors">
                        {/* Cliente / Tarefa */}
                        <td className="p-3">
                          <div className="space-y-0.5">
                            <Badge 
                              variant="outline" 
                              className="font-mono text-[9px] text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/40 gap-1 cursor-pointer hover:bg-orange-100"
                              onClick={() => {
                                if (op.clickUpUrl) window.open(op.clickUpUrl, '_blank');
                              }}
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> {op.clickUpTaskId}
                              {op.clickUpUrl && <ExternalLink className="w-2 h-2 opacity-60" />}
                            </Badge>
                            <div className="font-bold text-foreground text-xs leading-snug">{op.empresaNome || op.titulo}</div>
                            {op.empresaNome && op.empresaNome !== op.titulo && (
                              <div className="text-[10px] text-muted-foreground">{op.titulo}</div>
                            )}
                          </div>
                        </td>

                        {/* Contatos & Canais */}
                        <td className="p-3">
                          <div className="space-y-1">
                            <div className="font-semibold text-foreground text-xs flex items-center gap-1">
                              <User className="w-3 h-3 text-muted-foreground" />
                              <span>{op.contatoNome || 'Contato Comercial'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              {op.contatoEmail && (
                                <a href={`mailto:${op.contatoEmail}`} className="hover:text-primary flex items-center gap-1">
                                  <Mail className="w-3 h-3 text-muted-foreground" /> {op.contatoEmail}
                                </a>
                              )}
                              {op.contatoTelefone && (
                                <span className="flex items-center gap-1">
                                  <Phone className="w-3 h-3 text-muted-foreground" /> {op.contatoTelefone}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Status ClickUp */}
                        <td className="p-3">
                          <Badge 
                            className="text-[10px] font-semibold" 
                            style={{ backgroundColor: op.statusColor || '#94a3b8', color: '#fff' }}
                          >
                            {op.etapa}
                          </Badge>
                        </td>

                        {/* Valor Real */}
                        <td className="p-3 font-bold text-foreground">
                          {op.valorR$ > 0 ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                              {formatCurrency(op.valorR$)}
                            </span>
                          ) : (
                            <span className="text-muted-foreground font-normal">R$ 0,00</span>
                          )}
                        </td>

                        {/* Responsável */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <UserAvatar name={op.responsavel} avatarUrl={op.responsavelAvatar} />
                            <span className="font-medium text-foreground text-xs">{op.responsavel}</span>
                          </div>
                        </td>

                        {/* Follow-ups Realizados por Nós */}
                        <td className="p-3 text-center">
                          <div className="space-y-0.5">
                            {totalFollowUps > 0 ? (
                              <button 
                                onClick={() => setSelectedOpHistory(op)}
                                className="inline-flex items-center gap-1 bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 px-2 py-0.5 rounded-full text-xs font-bold hover:bg-purple-100 transition-colors"
                              >
                                <MessageSquare className="w-3 h-3 text-purple-500" />
                                <span>{totalFollowUps} contato{totalFollowUps > 1 ? 's' : ''}</span>
                              </button>
                            ) : (
                              <Badge variant="outline" className="text-[10px] text-muted-foreground border-dashed">
                                0 contatos
                              </Badge>
                            )}

                            {ultimoContato && (
                              <div className="text-[9px] text-muted-foreground">
                                Último: {formatDateBrasilia(ultimoContato.dataHora)} ({ultimoContato.tipo})
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Ações de Contato */}
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {whatsappNum && (
                              <a href={`https://wa.me/${whatsappNum}`} target="_blank" rel="noreferrer">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-7 px-2 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50 rounded-lg gap-1"
                                  title="Conversar no WhatsApp"
                                >
                                  <MessageSquare className="w-3 h-3" />
                                </Button>
                              </a>
                            )}

                            <Button 
                              size="sm" 
                              onClick={() => setSelectedOpForFollowUp(op)}
                              className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-lg gap-1 font-semibold"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Registrar Follow-up</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal Registrar Novo Follow-up */}
      <Dialog open={!!selectedOpForFollowUp} onOpenChange={(open) => !open && setSelectedOpForFollowUp(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <MessageSquare className="w-5 h-5 text-orange-500" /> Registrar Contato / Follow-up
            </DialogTitle>
          </DialogHeader>

          {selectedOpForFollowUp && (
            <div className="space-y-4 py-2 text-xs">
              <div className="p-3 rounded-xl bg-muted/40 border space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Cliente Selecionado</span>
                <div className="font-bold text-foreground text-sm">{selectedOpForFollowUp.empresaNome || selectedOpForFollowUp.titulo}</div>
                <div className="text-muted-foreground flex items-center gap-2 text-xs">
                  <span>Resp: <strong>{selectedOpForFollowUp.responsavel}</strong></span>
                  <span>•</span>
                  <span>Status: <strong>{selectedOpForFollowUp.etapa}</strong></span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Canal de Contato</Label>
                  <Select value={tipoContato} onValueChange={(v: any) => setTipoContato(v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WhatsApp">💬 WhatsApp</SelectItem>
                      <SelectItem value="Ligação">📞 Ligação Telefônica</SelectItem>
                      <SelectItem value="Diagnóstico">🎯 Reunião / Diagnóstico</SelectItem>
                      <SelectItem value="E-mail">✉️ E-mail</SelectItem>
                      <SelectItem value="Follow-up">🔄 Follow-up Geral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="font-semibold">Resultado do Contato</Label>
                  <Select value={resultadoContato} onValueChange={(v: any) => setResultadoContato(v)}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Positivo">✅ Positivo / Avançou</SelectItem>
                      <SelectItem value="Agendou Diagnóstico">🎯 Agendou Diagnóstico</SelectItem>
                      <SelectItem value="Aguardando Resposta">⏳ Aguardando Resposta</SelectItem>
                      <SelectItem value="Neutro">⚪ Neutro</SelectItem>
                      <SelectItem value="Negativo">❌ Sem Interesse</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Resumo do Contato / Próximos Passos *</Label>
                <Textarea 
                  placeholder="Ex: Conversei com o cliente via WhatsApp, apresentei a proposta de automação e ele pediu retorno na sexta-feira..." 
                  value={descricaoContato}
                  onChange={e => setDescricaoContato(e.target.value)}
                  className="rounded-xl min-h-[80px]"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Data do Próximo Contato Agendado (Opcional)</Label>
                <Input 
                  type="date"
                  value={proximoContatoData}
                  onChange={e => setProximoContatoData(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOpForFollowUp(null)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleSaveFollowUp} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold">
              <Check className="w-3.5 h-3.5" /> Salvar Follow-up
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Histórico de Follow-ups do Cliente */}
      <Dialog open={!!selectedOpHistory} onOpenChange={(open) => !open && setSelectedOpHistory(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <History className="w-5 h-5 text-purple-600" /> Histórico de Follow-ups: {selectedOpHistory?.empresaNome}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            {clientInteractions.length === 0 ? (
              <div className="p-6 text-center text-muted-foreground border border-dashed rounded-xl">
                Nenhum follow-up registrado ainda para este cliente.
              </div>
            ) : (
              clientInteractions.map(it => (
                <div key={it.id} className="p-3.5 rounded-xl border bg-card space-y-1.5 shadow-2xs">
                  <div className="flex justify-between items-center">
                    <Badge variant="outline" className="font-semibold text-[10px]">
                      {it.tipo}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {formatDateBrasilia(it.dataHora)}
                    </span>
                  </div>
                  <p className="text-foreground leading-relaxed text-xs">{it.descricao}</p>
                  <div className="flex justify-between items-center pt-1 border-t text-[10px] text-muted-foreground">
                    <span>Registrado por: <strong>{it.responsavel}</strong></span>
                    {it.resultado && <span className="font-semibold text-primary">{it.resultado}</span>}
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

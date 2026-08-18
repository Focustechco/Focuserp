import React, { useState } from 'react';
import { ChamadoSuporte, MensagemChamado, TimelineSuporte, ArtigoConhecimento } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  ArrowLeft,
  Headphones,
  Send,
  Code2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Paperclip,
  Activity,
  Heart,
  BookOpen,
  Calendar,
  MessageSquare,
  ShieldCheck,
  UserCheck,
  Building2,
  Plus,
} from 'lucide-react';
import { CsCustomer } from '../../customerSuccess/types';
import { Projeto } from '../../projetos/types';

interface WorkspaceChamadoProps {
  chamado: ChamadoSuporte;
  mensagens: MensagemChamado[];
  timelineEvents: TimelineSuporte[];
  csContext?: CsCustomer;
  projetos: Projeto[];
  artigosKB: ArtigoConhecimento[];
  onBack: () => void;
  onResponder: (
    chamadoId: string,
    conteudo: string,
    tipoMensagem: MensagemChamado['tipoMensagem'],
    autorNome?: string,
    novoStatus?: any
  ) => void;
  onConverterDev: (chamadoId: string, projetoId: string) => void;
}

export function WorkspaceChamado({
  chamado,
  mensagens,
  timelineEvents,
  csContext,
  projetos,
  artigosKB,
  onBack,
  onResponder,
  onConverterDev,
}: WorkspaceChamadoProps) {
  const [activeSubTab, setActiveSubTab] = useState('conversas');
  const [respostaTexto, setRespostaTexto] = useState('');
  const [tipoResposta, setTipoResposta] = useState<MensagemChamado['tipoMensagem']>('Publico');
  const [novoStatusSel, setNovoStatusSel] = useState<string>('all');
  const [projetoDevSel, setProjetoDevSel] = useState<string>(projetos[0]?.id || '');

  const ticketMensagens = mensagens.filter((m) => m.chamadoId === chamado.id);
  const ticketTimeline = timelineEvents.filter((t) => t.chamadoId === chamado.id);

  const handleEnviarResposta = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respostaTexto.trim()) return;

    const nextStatus = novoStatusSel !== 'all' ? novoStatusSel : undefined;

    onResponder(chamado.id, respostaTexto, tipoResposta, 'Atendente Suporte', nextStatus);
    setRespostaTexto('');
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DO WORKSPACE DE ATENDIMENTO */}
      <div className="p-6 rounded-2xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button onClick={onBack} variant="outline" size="sm" className="gap-1.5 text-xs font-semibold shrink-0">
              <ArrowLeft className="h-4 w-4" /> Voltar aos Chamados
            </Button>
            <div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs font-bold text-primary">
                  {chamado.numero}
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs font-bold">
                  {chamado.produtoNome}
                </Badge>
                <Badge variant="secondary" className="text-xs">
                  {chamado.tipo}
                </Badge>
                <h1 className="text-xl font-black tracking-tight text-foreground">{chamado.titulo}</h1>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Cliente: <strong className="text-foreground">{chamado.clienteNome}</strong> • Solicitante:{' '}
                <strong className="text-foreground">{chamado.contatoNome || 'Cliente'}</strong> ({chamado.contatoEmail})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge
              className={`text-xs font-bold px-3 py-1 ${
                chamado.status === 'Resolvido' || chamado.status === 'Fechado'
                  ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30'
                  : 'bg-blue-500/10 text-blue-600 border-blue-500/30'
              }`}
            >
              Status: {chamado.status}
            </Badge>
          </div>
        </div>
      </div>

      {/* SUB-TABS DO CHAMADO */}
      <Tabs defaultValue="conversas" value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/60 p-1 flex w-max min-w-full justify-start gap-1 border border-border">
            <TabsTrigger value="conversas" className="text-xs gap-1.5 shrink-0">
              <MessageSquare className="h-3.5 w-3.5" /> Conversas ({ticketMensagens.length})
            </TabsTrigger>
            <TabsTrigger value="visao_geral" className="text-xs gap-1.5 shrink-0">
              <Building2 className="h-3.5 w-3.5" /> Visão Geral & CS Context
            </TabsTrigger>
            <TabsTrigger value="desenvolvimento" className="text-xs gap-1.5 shrink-0">
              <Code2 className="h-3.5 w-3.5" /> Módulo Desenvolvimento
            </TabsTrigger>
            <TabsTrigger value="sla" className="text-xs gap-1.5 shrink-0">
              <Clock className="h-3.5 w-3.5" /> SLA & Prazos
            </TabsTrigger>
            <TabsTrigger value="timeline" className="text-xs gap-1.5 shrink-0">
              <Activity className="h-3.5 w-3.5" /> Timeline & Auditoria
            </TabsTrigger>
            <TabsTrigger value="kb" className="text-xs gap-1.5 shrink-0">
              <BookOpen className="h-3.5 w-3.5" /> Base de Conhecimento
            </TabsTrigger>
          </TabsList>
        </div>

        {/* SUB-TAB 1: CONVERSAS & INTERAÇÕES */}
        <TabsContent value="conversas" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* THREAD DE MENSAGENS */}
            <div className="lg:col-span-2 space-y-4">
              <Card className="border-border/80">
                <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between">
                  <CardTitle className="text-xs font-bold">Histórico de Comunicação</CardTitle>
                  <span className="text-[10px] text-muted-foreground">Suporte técnico criptografado</span>
                </CardHeader>
                <CardContent className="p-4 space-y-4 max-h-[450px] overflow-y-auto">
                  {ticketMensagens.length === 0 ? (
                    <div className="text-center py-8 text-xs text-muted-foreground">Nenhuma mensagem registrada.</div>
                  ) : (
                    ticketMensagens.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-3.5 rounded-xl text-xs space-y-1.5 border ${
                          msg.tipoMensagem === 'Nota Interna'
                            ? 'bg-amber-500/10 border-amber-500/30'
                            : msg.autorPapel === 'Cliente'
                            ? 'bg-muted/40 border-border'
                            : 'bg-primary/5 border-primary/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-foreground flex items-center gap-1.5">
                            {msg.autorNome}
                            {msg.tipoMensagem === 'Nota Interna' && (
                              <Badge className="bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[9px]">
                                Nota Interna
                              </Badge>
                            )}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {new Date(msg.dataHora).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-foreground leading-relaxed whitespace-pre-wrap">{msg.conteudo}</p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* COMPOSITOR DE RESPOSTA */}
              <Card className="border-border/80 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={tipoResposta === 'Publico' ? 'default' : 'outline'}
                      className="h-7 text-xs font-semibold"
                      onClick={() => setTipoResposta('Publico')}
                    >
                      Resposta ao Cliente
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={tipoResposta === 'Nota Interna' ? 'secondary' : 'outline'}
                      className="h-7 text-xs font-semibold text-amber-600"
                      onClick={() => setTipoResposta('Nota Interna')}
                    >
                      Nota Interna
                    </Button>
                  </div>

                  <Select value={novoStatusSel} onValueChange={setNovoStatusSel}>
                    <SelectTrigger className="w-[150px] h-7 text-xs">
                      <SelectValue placeholder="Alterar Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Manter Status</SelectItem>
                      <SelectItem value="Em Atendimento">Em Atendimento</SelectItem>
                      <SelectItem value="Aguardando Cliente">Aguardando Cliente</SelectItem>
                      <SelectItem value="Resolvido">Resolvido</SelectItem>
                      <SelectItem value="Fechado">Fechado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <form onSubmit={handleEnviarResposta} className="space-y-2">
                  <Textarea
                    rows={3}
                    placeholder={
                      tipoResposta === 'Nota Interna'
                        ? 'Escreva uma nota técnica interna visível apenas para a equipe...'
                        : 'Escreva a resposta que será enviada ao cliente...'
                    }
                    value={respostaTexto}
                    onChange={(e) => setRespostaTexto(e.target.value)}
                    className="text-xs"
                  />
                  <div className="flex justify-end">
                    <Button type="submit" size="sm" className="gap-1.5 font-semibold text-xs">
                      <Send className="h-3.5 w-3.5" /> Enviar Resposta
                    </Button>
                  </div>
                </form>
              </Card>
            </div>

            {/* SIDEBAR DE CONTEXTO DO CHAMADO */}
            <div className="space-y-4">
              <Card className="border-border/80 p-4 space-y-3">
                <h4 className="text-xs font-bold text-foreground border-b pb-2">Detalhes do Chamado</h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prioridade:</span>
                    <span className="font-bold">{chamado.prioridade}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Atendente:</span>
                    <span className="font-bold">{chamado.responsavelNome}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoria:</span>
                    <span>{chamado.categoria}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Abertura:</span>
                    <span>{new Date(chamado.dataAbertura).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
              </Card>

              {/* HEALTH SCORE DO CUSTOMER SUCCESS */}
              {csContext && (
                <Card className="border-border/80 p-4 space-y-2 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold flex items-center gap-1.5">
                      <Heart className="h-4 w-4 text-rose-500" /> Contexto CS do Cliente
                    </h4>
                    <Badge className="bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">
                      Health: {(csContext as any).health_score ?? (csContext as any).healthScore ?? 'N/A'}
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <p>Status CS: <strong className="text-foreground">{(csContext as any).status ?? (csContext as any).statusCs ?? 'Ativo'}</strong></p>
                    <p>NPS: <strong className="text-foreground">{(csContext as any).nps_score ?? (csContext as any).npsScore ?? '9/10 (Promotor)'}</strong></p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* SUB-TAB 2: INTEGRACAO COM MÓDULO DESENVOLVIMENTO */}
        <TabsContent value="desenvolvimento" className="space-y-6 outline-none">
          <Card className="border-border/80">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Code2 className="h-4 w-4 text-primary" /> Integração com Módulo Desenvolvimento
              </CardTitle>
              <CardDescription className="text-xs">
                Converta este chamado em uma tarefa de engenharia no backlog ou bug tracker do projeto.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {chamado.devTaskId ? (
                <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-500/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge className="bg-purple-600 text-white font-bold text-xs">
                      Vínculo Ativo com Desenvolvimento
                    </Badge>
                    <span className="text-xs font-bold text-purple-600">{chamado.devTaskStatus}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground">{chamado.devTaskTitulo}</h4>
                  <p className="text-xs text-muted-foreground">Task ID: {chamado.devTaskId}</p>
                  {chamado.githubRepoUrl && (
                    <a
                      href={chamado.githubRepoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-mono text-primary underline block pt-1"
                    >
                      {chamado.githubRepoUrl}
                    </a>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl border border-dashed text-center space-y-3">
                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    Este chamado ainda não foi convertido em tarefa técnica. Selecione o projeto e clique abaixo para gerar um item no Módulo Desenvolvimento.
                  </p>
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
                    <Select value={projetoDevSel} onValueChange={setProjetoDevSel}>
                      <SelectTrigger className="text-xs">
                        <SelectValue placeholder="Selecione o Projeto" />
                      </SelectTrigger>
                      <SelectContent>
                        {projetos.map((pj) => (
                          <SelectItem key={pj.id} value={pj.id}>
                            {pj.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Button
                      onClick={() => onConverterDev(chamado.id, projetoDevSel)}
                      disabled={!projetoDevSel}
                      size="sm"
                      className="gap-1.5 text-xs font-bold shrink-0"
                    >
                      <Code2 className="h-4 w-4" /> Criar Tarefa no Desenvolvimento
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUB-TAB 3: SLA & PRAZOS */}
        <TabsContent value="sla" className="space-y-6 outline-none">
          <Card className="border-border/80">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" /> Controle de SLA & Prazos Contratuais
              </CardTitle>
              <CardDescription className="text-xs">Monitoramento de metas de resposta e resolução</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                  <span className="text-xs font-bold text-muted-foreground block">Tempo de Primeira Resposta:</span>
                  <div className="text-lg font-black text-foreground">
                    {chamado.dataPrimeiraResposta
                      ? `Atendido em ${new Date(chamado.dataPrimeiraResposta).toLocaleTimeString('pt-BR')}`
                      : `${chamado.slaHorasPrimeiraResposta} Horas`}
                  </div>
                  <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-600">
                    SLA Cumprido
                  </Badge>
                </div>

                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-2">
                  <span className="text-xs font-bold text-muted-foreground block">Prazo Final de Resolução:</span>
                  <div className="text-lg font-black text-foreground">
                    {new Date(chamado.dataLimiteResolucao).toLocaleString('pt-BR')}
                  </div>
                  <Badge
                    className={`text-[10px] ${
                      chamado.slaStatus === 'Violado'
                        ? 'bg-rose-500 text-white'
                        : 'bg-emerald-500/10 text-emerald-600'
                    }`}
                  >
                    Status SLA: {chamado.slaStatus}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SUB-TAB 4: TIMELINE & AUDITORIA */}
        <TabsContent value="timeline" className="space-y-6 outline-none">
          <Card className="border-border/80">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Timeline de Eventos & Auditoria
              </CardTitle>
              <CardDescription className="text-xs">Registro histórico imutável de todas as ações no chamado</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketTimeline.map((ev) => (
                <div key={ev.id} className="p-3 rounded-xl border border-border bg-card flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-foreground block">{ev.descricao}</span>
                    <span className="text-[10px] text-muted-foreground">Por: {ev.usuario}</span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {new Date(ev.dataHora).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

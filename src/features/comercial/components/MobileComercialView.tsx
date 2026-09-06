import React, { useState, useMemo } from 'react';
import { useComercialStore } from '../hooks/useComercialStore';
import { PropostaComercial, StatusProposta, TipoAtividadeComercial } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Plus, DollarSign, TrendingUp, Users, Target,
  FileText, Phone, CheckCircle2, Clock, AlertCircle, Trash2,
  Send, Check, X, Calendar, User, Eye, Briefcase
} from 'lucide-react';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileComercialView() {
  const {
    propostas,
    oportunidades,
    atividades,
    equipe,
    metas,
    kpisExecutivos,
    addProposta,
    updatePropostaStatus,
    registrarAtividade,
    deletePropostaItem,
    deleteAtividadeItem
  } = useComercialStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'propostas' | 'pipeline' | 'atividades' | 'equipe' | 'metas'>('propostas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [novaPropostaOpen, setNovaPropostaOpen] = useState(false);
  const [novaAtividadeOpen, setNovaAtividadeOpen] = useState(false);
  const [selectedProposta, setSelectedProposta] = useState<PropostaComercial | null>(null);

  // Form Nova Proposta
  const [formProposta, setFormProposta] = useState({
    clienteNome: '',
    contatoNome: '',
    vendedorNome: '',
    valorTotal: '',
    validadeDias: '15',
    descricao: ''
  });

  // Form Nova Atividade
  const [formAtividade, setFormAtividade] = useState({
    empresa: '',
    contato: '',
    tipo: 'Reunião' as TipoAtividadeComercial,
    responsavel: '',
    descricao: '',
    proximaAcao: '',
    dataProximoFollowUp: ''
  });

  const handleCreateProposta = () => {
    if (!formProposta.clienteNome.trim()) { toast.error('Informe o nome do cliente'); return; }
    const val = parseFloat(formProposta.valorTotal.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;
    if (val <= 0) { toast.error('Informe um valor válido'); return; }

    addProposta({
      clienteId: `cli-${Date.now()}`,
      clienteNome: formProposta.clienteNome,
      contatoNome: formProposta.contatoNome || 'Responsável',
      vendedorNome: formProposta.vendedorNome || 'Time Comercial',
      valorTotal: val,
      status: 'Rascunho',
      validadeDias: parseInt(formProposta.validadeDias) || 15,
      itens: [{
        id: `item-1`,
        itemNome: formProposta.descricao || 'Serviços & Soluções ERP Focus',
        tipo: 'Servico',
        quantidade: 1,
        valorUnitario: val,
        subtotal: val
      }]
    });

    setNovaPropostaOpen(false);
    setFormProposta({ clienteNome: '', contatoNome: '', vendedorNome: '', valorTotal: '', validadeDias: '15', descricao: '' });
  };

  const handleCreateAtividade = () => {
    if (!formAtividade.empresa.trim()) { toast.error('Informe a empresa'); return; }
    if (!formAtividade.descricao.trim()) { toast.error('Informe a descrição'); return; }

    registrarAtividade({
      empresa: formAtividade.empresa,
      contato: formAtividade.contato || 'Contato',
      tipo: formAtividade.tipo,
      responsavel: formAtividade.responsavel || 'Time Comercial',
      dataHora: new Date().toLocaleString('pt-BR'),
      descricao: formAtividade.descricao,
      proximaAcao: formAtividade.proximaAcao,
      dataProximoFollowUp: formAtividade.dataProximoFollowUp
    });

    setNovaAtividadeOpen(false);
    setFormAtividade({ empresa: '', contato: '', tipo: 'Reunião', responsavel: '', descricao: '', proximaAcao: '', dataProximoFollowUp: '' });
  };

  // Filtragem de Propostas
  const filteredPropostas = useMemo(() => {
    return propostas.filter(p => {
      if (!p) return false;
      const s = searchTerm.toLowerCase();
      const matchSearch =
        (p.clienteNome || '').toLowerCase().includes(s) ||
        (p.numero || '').toLowerCase().includes(s) ||
        (p.vendedorNome || '').toLowerCase().includes(s);

      if (!matchSearch) return false;
      if (statusFilter !== 'todos' && p.status !== statusFilter) return false;
      return true;
    });
  }, [propostas, searchTerm, statusFilter]);

  // Filtragem de Pipeline/Oportunidades
  const filteredOportunidades = useMemo(() => {
    return oportunidades.filter(op => {
      if (!op) return false;
      const s = searchTerm.toLowerCase();
      return (
        (op.titulo || '').toLowerCase().includes(s) ||
        (op.empresaNome || '').toLowerCase().includes(s) ||
        (op.responsavel || '').toLowerCase().includes(s)
      );
    });
  }, [oportunidades, searchTerm]);

  // Filtragem de Atividades
  const filteredAtividades = useMemo(() => {
    return atividades.filter(atv => {
      if (!atv) return false;
      const s = searchTerm.toLowerCase();
      return (
        (atv.empresa || '').toLowerCase().includes(s) ||
        (atv.contato || '').toLowerCase().includes(s) ||
        (atv.descricao || '').toLowerCase().includes(s) ||
        (atv.responsavel || '').toLowerCase().includes(s)
      );
    });
  }, [atividades, searchTerm]);

  const getStatusPropostaBadge = (status: StatusProposta) => {
    switch (status) {
      case 'Aprovada':
        return <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Aprovada</Badge>;
      case 'Enviada':
        return <Badge className="bg-blue-600 text-white text-[10px] font-bold">Enviada</Badge>;
      case 'Recusada':
        return <Badge variant="destructive" className="text-[10px] font-bold">Recusada</Badge>;
      case 'Cancelada':
        return <Badge variant="secondary" className="text-[10px] font-bold">Cancelada</Badge>;
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/40 text-[10px] font-bold">Rascunho</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. STICKY SEARCH & FILTER BAR */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar cliente, proposta, atividade..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Botão de Filtros */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground relative"
                aria-label="Filtrar"
              >
                <Filter className="w-4 h-4" />
                {statusFilter !== 'todos' && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Filtros Comerciais</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Filtre por status da proposta ou atividade.
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Status da Proposta</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'todos', label: 'Todas as Propostas' },
                      { id: 'Rascunho', label: 'Rascunho' },
                      { id: 'Enviada', label: 'Enviada' },
                      { id: 'Aprovada', label: 'Aprovada' },
                      { id: 'Recusada', label: 'Recusada' },
                    ].map((st) => (
                      <Button
                        key={st.id}
                        type="button"
                        variant={statusFilter === st.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter(st.id)}
                        className={`text-xs h-8 ${statusFilter === st.id ? 'bg-primary text-white' : ''}`}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-10 rounded-xl font-bold"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão de Ação Rápida */}
          {activeTab === 'atividades' ? (
            <Button
              size="sm"
              onClick={() => setNovaAtividadeOpen(true)}
              className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Atividade
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={() => setNovaPropostaOpen(true)}
              className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              Proposta
            </Button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'propostas', label: `Propostas (${propostas.length})` },
            { id: 'pipeline', label: `Pipeline (${oportunidades.length})` },
            { id: 'atividades', label: `Atividades (${atividades.length})` },
            { id: 'equipe', label: `Equipe (${equipe.length})` },
            { id: 'metas', label: `Metas (${metas.length})` },
          ].map((pill) => {
            const isActive = activeTab === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setActiveTab(pill.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. TOP CARDS & RESUMO KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        {/* Card Principal: Receita Fechada */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              Receita Fechada
            </span>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {formatCurrency(kpisExecutivos.receitaFechada)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              Meta do Mês: <span className="font-semibold">{formatCurrency(kpisExecutivos.metaTotalMes)}</span> ({kpisExecutivos.percentualMeta}%)
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
              {kpisExecutivos.vendasFechadas} vendas
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {kpisExecutivos.taxaConversaoGeral}% conversão
            </span>
          </div>
        </div>

        {/* Mini Cards: Em Negociação & Ticket Médio */}
        <div className="grid grid-cols-2 gap-2.5">
          <div 
            onClick={() => setActiveTab('pipeline')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'pipeline' ? 'border-primary ring-1 ring-primary/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-blue-500" />
                Em Negociação
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="text-sm font-black text-blue-600 dark:text-blue-400 truncate">
              {formatCurrency(kpisExecutivos.receitaNegociacao)}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('propostas')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'propostas' ? 'border-primary ring-1 ring-primary/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-indigo-500" />
                Ticket Médio
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 truncate">
              {formatCurrency(kpisExecutivos.ticketMedio)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE CONTEÚDO CONFORME ABA (CARDS TOUCH) */}
      <div className="p-3.5 space-y-2.5">
        {/* ABA: PROPOSTAS */}
        {activeTab === 'propostas' && (
          filteredPropostas.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <FileText className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma proposta encontrada</div>
              <p className="text-xs text-muted-foreground">Crie uma nova proposta comercial para seus clientes.</p>
              <Button variant="outline" size="sm" onClick={() => setNovaPropostaOpen(true)} className="text-xs">
                Nova Proposta
              </Button>
            </div>
          ) : (
            filteredPropostas.map((p) => {
              const isAprovada = p.status === 'Aprovada';
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProposta(p)}
                  className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2.5 relative overflow-hidden"
                >
                  <div className={`h-1 w-full absolute top-0 left-0 ${
                    isAprovada ? 'bg-emerald-500' : p.status === 'Enviada' ? 'bg-blue-500' : p.status === 'Recusada' ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />

                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                          {p.numero}
                        </span>
                        {getStatusPropostaBadge(p.status)}
                      </div>
                      <h4 className="font-bold text-sm text-foreground truncate">
                        {p.clienteNome}
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        Vendedor: {p.vendedorNome || 'Comercial'} • {p.contatoNome || 'Contato'}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-sm font-extrabold text-foreground">
                        {formatCurrency(p.valorTotal)}
                      </div>
                      <span className="text-[10px] text-muted-foreground block mt-0.5">
                        {p.dataCriacao ? formatDateBrasilia(p.dataCriacao) : 'Hoje'}
                      </span>
                    </div>
                  </div>

                  {/* Ações Rápidas */}
                  <div className="flex items-center justify-between pt-2 border-t border-dashed gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      Validade: {p.validadeDias || 15} dias
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      {p.status === 'Rascunho' && (
                        <Button
                          size="sm"
                          onClick={() => updatePropostaStatus(p.id, 'Enviada')}
                          className="h-7 px-2 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1 rounded-lg"
                        >
                          <Send className="w-3 h-3" />
                          Enviar
                        </Button>
                      )}
                      {p.status === 'Enviada' && (
                        <Button
                          size="sm"
                          onClick={() => updatePropostaStatus(p.id, 'Aprovada')}
                          className="h-7 px-2 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1 rounded-lg"
                        >
                          <Check className="w-3 h-3" />
                          Aprovar
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          deletePropostaItem(p.id);
                          toast.success('Proposta removida');
                        }}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* ABA: PIPELINE */}
        {activeTab === 'pipeline' && (
          filteredOportunidades.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Briefcase className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma oportunidade no pipeline</div>
            </div>
          ) : (
            filteredOportunidades.map((op) => (
              <div
                key={op.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-2 relative overflow-hidden"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {op.etapa || 'Lead'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {op.responsavel}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground truncate">{op.titulo}</h4>
                    <p className="text-xs text-muted-foreground truncate">{op.empresaNome}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-foreground">
                      {formatCurrency(op.valorR$)}
                    </div>
                    <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                      {op.probabilidadePercent}% prob.
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* ABA: ATIVIDADES */}
        {activeTab === 'atividades' && (
          filteredAtividades.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Phone className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma atividade registrada</div>
              <Button variant="outline" size="sm" onClick={() => setNovaAtividadeOpen(true)} className="text-xs">
                Registrar Atividade
              </Button>
            </div>
          ) : (
            filteredAtividades.map((atv) => (
              <div
                key={atv.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge className="text-[10px] bg-primary text-white font-bold">{atv.tipo}</Badge>
                      <span className="text-[10px] text-muted-foreground">{atv.responsavel}</span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground truncate">{atv.empresa}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{atv.descricao}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      deleteAtividadeItem(atv.id);
                      toast.success('Atividade removida');
                    }}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 rounded-lg shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
                {atv.proximaAcao && (
                  <div className="bg-muted/40 p-2 rounded-xl text-[11px] text-muted-foreground flex items-center justify-between border">
                    <span>Próx: <strong className="text-foreground">{atv.proximaAcao}</strong></span>
                    {atv.dataProximoFollowUp && <span>{formatDateBrasilia(atv.dataProximoFollowUp)}</span>}
                  </div>
                )}
              </div>
            ))
          )
        )}

        {/* ABA: EQUIPE */}
        {activeTab === 'equipe' && (
          equipe.map((m) => {
            const perc = m.metaMensal > 0 ? Math.round((m.vendasRealizadas / m.metaMensal) * 100) : 0;
            return (
              <div key={m.id} className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                      {m.nome.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-sm text-foreground truncate">{m.nome}</h4>
                    <p className="text-xs text-muted-foreground">{m.cargo} • {m.status}</p>
                  </div>
                  <Badge variant="outline" className="text-[10px] font-bold">
                    {m.taxaConversao}% conv.
                  </Badge>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Meta: {formatCurrency(m.metaMensal)}</span>
                    <span className="font-bold text-foreground">{formatCurrency(m.vendasRealizadas)} ({perc}%)</span>
                  </div>
                  <Progress value={Math.min(100, perc)} className="h-1.5" />
                </div>
              </div>
            );
          })
        )}

        {/* ABA: METAS */}
        {activeTab === 'metas' && (
          metas.map((mt) => {
            const perc = mt.valorMeta > 0 ? Math.round((mt.valorAtual / mt.valorMeta) * 100) : 0;
            return (
              <div key={mt.id} className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <Badge variant="outline" className="text-[10px] font-bold mb-1">
                      {mt.periodo} • {mt.tipo}
                    </Badge>
                    <h4 className="font-bold text-sm text-foreground">{mt.titulo}</h4>
                    <p className="text-xs text-muted-foreground">{mt.responsavelNome}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm text-foreground">
                      {mt.categoriaTarget === 'Receita Total' ? formatCurrency(mt.valorMeta) : `${mt.valorMeta}`}
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-muted-foreground">Realizado: {mt.categoriaTarget === 'Receita Total' ? formatCurrency(mt.valorAtual) : `${mt.valorAtual}`}</span>
                    <span className="font-bold text-foreground">{perc}%</span>
                  </div>
                  <Progress value={Math.min(100, perc)} className="h-1.5" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal Nova Proposta */}
      <Dialog open={novaPropostaOpen} onOpenChange={setNovaPropostaOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Plus className="w-5 h-5 text-primary" /> Nova Proposta Comercial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Nome do Cliente / Empresa *</Label>
              <Input
                placeholder="Ex: ACME Corp"
                value={formProposta.clienteNome}
                onChange={e => setFormProposta(f => ({ ...f, clienteNome: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Contato</Label>
                <Input
                  placeholder="Nome do contato"
                  value={formProposta.contatoNome}
                  onChange={e => setFormProposta(f => ({ ...f, contatoNome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Vendedor</Label>
                <Input
                  placeholder="Seu nome"
                  value={formProposta.vendedorNome}
                  onChange={e => setFormProposta(f => ({ ...f, vendedorNome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor Total (R$) *</Label>
                <Input
                  placeholder="Ex: 15.000,00"
                  value={formProposta.valorTotal}
                  onChange={e => setFormProposta(f => ({ ...f, valorTotal: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Validade (dias)</Label>
                <Input
                  type="number"
                  placeholder="15"
                  value={formProposta.validadeDias}
                  onChange={e => setFormProposta(f => ({ ...f, validadeDias: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Descrição / Escopo</Label>
              <Textarea
                placeholder="Detalhes dos produtos ou serviços..."
                value={formProposta.descricao}
                onChange={e => setFormProposta(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
                className="text-xs"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setNovaPropostaOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateProposta} className="bg-primary text-white font-bold">
              Salvar Proposta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Nova Atividade */}
      <Dialog open={novaAtividadeOpen} onOpenChange={setNovaAtividadeOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Phone className="w-5 h-5 text-primary" /> Registrar Atividade Comercial
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Empresa / Cliente *</Label>
              <Input
                placeholder="Ex: Tech Solutions"
                value={formAtividade.empresa}
                onChange={e => setFormAtividade(f => ({ ...f, empresa: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Tipo de Atividade</Label>
                <Select value={formAtividade.tipo} onValueChange={v => setFormAtividade(f => ({ ...f, tipo: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Reunião">Reunião</SelectItem>
                    <SelectItem value="Ligação">Ligação</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="E-mail">E-mail</SelectItem>
                    <SelectItem value="Apresentação / Demo">Demo</SelectItem>
                    <SelectItem value="Visita Presencial">Visita Presencial</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Contato</Label>
                <Input
                  placeholder="Nome do contato"
                  value={formAtividade.contato}
                  onChange={e => setFormAtividade(f => ({ ...f, contato: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-semibold">Resumo do Contato / Pauta *</Label>
              <Textarea
                placeholder="O que foi conversado ou definido..."
                value={formAtividade.descricao}
                onChange={e => setFormAtividade(f => ({ ...f, descricao: e.target.value }))}
                rows={2}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Próxima Ação</Label>
                <Input
                  placeholder="Ex: Enviar proposta"
                  value={formAtividade.proximaAcao}
                  onChange={e => setFormAtividade(f => ({ ...f, proximaAcao: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data Follow-up</Label>
                <Input
                  type="date"
                  value={formAtividade.dataProximoFollowUp}
                  onChange={e => setFormAtividade(f => ({ ...f, dataProximoFollowUp: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setNovaAtividadeOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateAtividade} className="bg-primary text-white font-bold">
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

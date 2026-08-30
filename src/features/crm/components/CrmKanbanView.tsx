import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, Plus, RefreshCw, CheckCircle2, ArrowRight, Building2, User, 
  Key, Search, Filter, ExternalLink, Calendar, Tag, AlertCircle, Edit3, Check, DollarSign
} from 'lucide-react';
import { useCrmStore } from '../hooks/useCrmStore';
import { OportunidadeCrm, PrioridadeOportunidade, ClickUpStatusItem } from '../types';
import { OportunidadeDetalhesModal } from './OportunidadeDetalhesModal';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function CrmKanbanView() {
  const { 
    oportunidades, config, moverOportunidadeEtapa, updateOportunidadeValor, 
    addOportunidade, deleteOportunidade, importRealClickUpTasks, isLoadingClickUp 
  } = useCrmStore();

  const [selectedOp, setSelectedOp] = useState<OportunidadeCrm | null>(null);
  const [openNewModal, setOpenNewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todas');

  // Quick edit value state
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [quickValorInput, setQuickValorInput] = useState('');

  // Form State Nova Oportunidade
  const [titulo, setTitulo] = useState('');
  const [empresaNome, setEmpresaNome] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [valorR$, setValorR$] = useState('');
  const [responsavel, setResponsavel] = useState('Equipe Comercial');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [prioridade, setPrioridade] = useState<PrioridadeOportunidade>('Alta');
  const [proximaAcao, setProximaAcao] = useState('');

  const isConnected = config.statusConexao === 'Conectado ClickUp API';

  // 1. Extrair colunas / status dinâmicos reais do ClickUp
  const dynamicStatuses = useMemo<ClickUpStatusItem[]>(() => {
    const statusMap = new Map<string, ClickUpStatusItem>();

    // Adicionar status salvos na config do ClickUp
    if (Array.isArray(config.listStatuses)) {
      config.listStatuses.forEach((st, idx) => {
        if (st.status) {
          statusMap.set(st.status.toLowerCase(), {
            status: st.status,
            color: st.color || '#94a3b8',
            orderindex: st.orderindex ?? idx
          });
        }
      });
    }

    // Adicionar status presentes nas tarefas atuais
    oportunidades.forEach((op, idx) => {
      const s = (op.etapa || 'Open').trim();
      if (!statusMap.has(s.toLowerCase())) {
        statusMap.set(s.toLowerCase(), {
          status: s,
          color: op.statusColor || '#94a3b8',
          orderindex: op.statusOrder ?? idx
        });
      }
    });

    if (statusMap.size === 0) {
      return [
        { status: 'To Do', color: '#94a3b8', orderindex: 0 },
        { status: 'In Progress', color: '#3b82f6', orderindex: 1 },
        { status: 'Done', color: '#10b981', orderindex: 2 }
      ];
    }

    return Array.from(statusMap.values()).sort((a, b) => (a.orderindex ?? 0) - (b.orderindex ?? 0));
  }, [config.listStatuses, oportunidades]);

  // Filtragem de cards
  const filteredOportunidades = useMemo(() => {
    return oportunidades.filter(op => {
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        (op.titulo || '').toLowerCase().includes(search) ||
        (op.empresaNome || '').toLowerCase().includes(search) ||
        (op.contatoNome || '').toLowerCase().includes(search) ||
        (op.responsavel || '').toLowerCase().includes(search) ||
        (op.clickUpTaskId || '').toLowerCase().includes(search);

      const matchPrioridade = prioridadeFilter === 'todas' || op.prioridade === prioridadeFilter;

      return matchSearch && matchPrioridade;
    });
  }, [oportunidades, searchTerm, prioridadeFilter]);

  const handleCreateNew = async () => {
    if (!titulo.trim()) {
      toast.error('Preencha o título da oportunidade.');
      return;
    }

    const defaultEtapa = selectedStatus || (dynamicStatuses[0]?.status || 'Open');

    await addOportunidade({
      titulo: titulo.trim(),
      empresaNome: empresaNome.trim() || 'Cliente ClickUp',
      contatoNome: contatoNome.trim() || 'Contato Principal',
      valorR$: parseFloat(valorR$) || 0,
      probabilidadePercent: 50,
      responsavel: responsavel.trim(),
      pipeline: config.listName || 'Quadro Real ClickUp',
      etapa: defaultEtapa,
      prioridade,
      tags: ['ClickUp Synced'],
      dataPrevistaFechamento: new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      proximaAcao: proximaAcao.trim() || 'Acompanhar tarefa no ClickUp'
    });

    setOpenNewModal(false);
    setTitulo('');
    setEmpresaNome('');
    setContatoNome('');
    setValorR$('');
    setProximaAcao('');
  };

  const handleSaveQuickValor = (opId: string) => {
    const valNum = parseFloat(quickValorInput) || 0;
    updateOportunidadeValor(opId, valNum);
    setEditingCardId(null);
  };

  return (
    <div className="space-y-5 animate-fade-in pt-2">
      {/* Barra de Status e Ferramentas Superiores */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-muted/20 p-4 border rounded-xl shadow-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Badge ClickUp Status */}
          {isConnected ? (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 py-1 px-3 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Espelho ClickUp: <strong>{config.listName || config.listId}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 py-1 px-3 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>ClickUp Desconectado</span>
            </div>
          )}

          {/* Busca */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar tarefas / cards..." 
              className="pl-8 h-8 text-xs bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro de Prioridade */}
          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="w-[140px] h-8 text-xs bg-background">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Prioridades</SelectItem>
              <SelectItem value="Urgente">Urgente</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Média">Média</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          {isConnected && (
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isLoadingClickUp}
              onClick={() => importRealClickUpTasks()}
              className="gap-1.5 text-xs h-8 font-semibold"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isLoadingClickUp ? 'animate-spin' : ''}`} />
              {isLoadingClickUp ? 'Sincronizando...' : 'Sincronizar ClickUp'}
            </Button>
          )}

          <Button onClick={() => setOpenNewModal(true)} size="sm" className="gap-2 h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold">
            <Plus className="w-3.5 h-3.5" /> Nova Tarefa / Deal
          </Button>
        </div>
      </div>

      {/* Grid de Colunas do Kanban (Espelho Dinâmico dos Status Reais do ClickUp) */}
      <div className="flex gap-4 items-start overflow-x-auto pb-6 min-h-[550px] scrollbar-thin">
        {dynamicStatuses.map((stObj, colIdx) => {
          const statusName = stObj.status;
          const statusColor = stObj.color || '#94a3b8';

          const opsNaEtapa = filteredOportunidades.filter(
            o => (o.etapa || '').toLowerCase() === statusName.toLowerCase()
          );
          
          const totalValorEtapa = opsNaEtapa.reduce((acc, o) => acc + (o.valorR$ || 0), 0);

          return (
            <div 
              key={statusName} 
              className="bg-muted/30 p-3 rounded-xl border shadow-xs min-w-[270px] max-w-[290px] shrink-0 space-y-3"
              style={{ borderTop: `4px solid ${statusColor}` }}
            >
              {/* Header da Coluna Dinâmica */}
              <div className="flex justify-between items-center pb-2 border-b">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: statusColor }} />
                  <div>
                    <h4 className="font-bold text-xs text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <span>{statusName}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                        {opsNaEtapa.length}
                      </Badge>
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                      {totalValorEtapa > 0 ? formatCurrency(totalValorEtapa) : 'R$ 0,00'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="space-y-2.5 min-h-[350px]">
                {opsNaEtapa.length === 0 ? (
                  <div className="h-32 flex items-center justify-center p-4 border border-dashed rounded-lg text-[11px] text-muted-foreground text-center">
                    Nenhuma tarefa nesta etapa
                  </div>
                ) : (
                  opsNaEtapa.map(op => (
                    <Card 
                      key={op.id} 
                      className="hover:border-primary/50 transition-all shadow-xs bg-card cursor-pointer group hover:shadow-md"
                      onClick={() => setSelectedOp(op)}
                    >
                      <CardContent className="p-3 space-y-2.5 text-xs">
                        {/* Header do Card: ID ClickUp & Prioridade */}
                        <div className="flex justify-between items-center">
                          <Badge variant="outline" className="text-[9px] font-mono border-orange-500/40 text-orange-600 bg-orange-50 dark:bg-orange-950/40 gap-1 px-1.5 py-0">
                            <RefreshCw className="w-2.5 h-2.5" /> {op.clickUpTaskId}
                          </Badge>
                          <Badge className={
                            op.prioridade === 'Urgente' ? 'bg-rose-100 text-rose-800 border-rose-200 text-[9px]' :
                            op.prioridade === 'Alta' ? 'bg-amber-100 text-amber-800 border-amber-200 text-[9px]' : 'bg-slate-100 text-slate-700 text-[9px]'
                          }>
                            {op.prioridade}
                          </Badge>
                        </div>

                        {/* Título & Empresa */}
                        <div>
                          <h5 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-snug">
                            {op.titulo}
                          </h5>
                          {op.empresaNome && op.empresaNome !== op.titulo && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                              <Building2 className="w-3 h-3 text-muted-foreground shrink-0" /> 
                              <span className="truncate">{op.empresaNome}</span>
                            </p>
                          )}
                        </div>

                        {/* Valor Real com Edição Manual Rápida */}
                        <div 
                          className="flex justify-between items-center pt-1.5 border-t border-border/50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {editingCardId === op.id ? (
                            <div className="flex items-center gap-1 w-full">
                              <Input 
                                type="number" 
                                placeholder="R$ 0,00"
                                value={quickValorInput} 
                                onChange={e => setQuickValorInput(e.target.value)}
                                className="h-6 text-xs px-1.5 font-bold"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveQuickValor(op.id);
                                  if (e.key === 'Escape') setEditingCardId(null);
                                }}
                              />
                              <Button 
                                size="sm" 
                                className="h-6 w-6 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0"
                                onClick={() => handleSaveQuickValor(op.id)}
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {op.valorR$ > 0 ? (
                                <div className="flex items-center gap-1">
                                  <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(op.valorR$)}
                                  </span>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
                                    onClick={() => {
                                      setEditingCardId(op.id);
                                      setQuickValorInput(String(op.valorR$ || ''));
                                    }}
                                    title="Editar valor manualmente"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                  </Button>
                                </div>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="h-6 px-1.5 text-[10px] text-muted-foreground hover:text-emerald-600 border border-dashed hover:border-emerald-500 gap-1"
                                  onClick={() => {
                                    setEditingCardId(op.id);
                                    setQuickValorInput('');
                                  }}
                                >
                                  <DollarSign className="w-2.5 h-2.5" /> Definir Valor (R$)
                                </Button>
                              )}
                              <span className="text-[10px] text-muted-foreground">
                                {formatDateBrasilia(op.dataCriacao)}
                              </span>
                            </>
                          )}
                        </div>

                        {/* Responsável & Botão Avançar */}
                        <div className="flex justify-between items-center pt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 truncate max-w-[120px]">
                            {op.responsavelAvatar ? (
                              <img src={op.responsavelAvatar} alt="" className="w-3.5 h-3.5 rounded-full" />
                            ) : (
                              <User className="w-3 h-3 text-orange-500" />
                            )}
                            <span className="truncate">{op.responsavel.split(' ')[0]}</span>
                          </span>
                          
                          {colIdx < dynamicStatuses.length - 1 && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(ev) => {
                                ev.stopPropagation();
                                const nextStatus = dynamicStatuses[colIdx + 1];
                                if (nextStatus) {
                                  moverOportunidadeEtapa(op.id, nextStatus.status, nextStatus.color);
                                }
                              }}
                              className="h-6 text-[10px] px-2 gap-1 border-orange-500/60 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                              title={`Mover para ${dynamicStatuses[colIdx + 1].status}`}
                            >
                              Avançar <ArrowRight className="w-2.5 h-2.5" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal de Detalhes da Oportunidade Selecionada */}
      <OportunidadeDetalhesModal
        oportunidade={selectedOp}
        availableStatuses={dynamicStatuses}
        open={!!selectedOp}
        onOpenChange={(open) => !open && setSelectedOp(null)}
        onMoverEtapa={moverOportunidadeEtapa}
        onUpdateValor={updateOportunidadeValor}
        onDelete={deleteOportunidade}
      />

      {/* Modal Nova Oportunidade */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Target className="w-5 h-5 text-primary" /> Criar Tarefa no ClickUp & CRM
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título da Tarefa / Deal *</Label>
              <Input 
                placeholder="Ex: Contrato Focus ERP — Grupo Logística" 
                value={titulo} 
                onChange={e => setTitulo(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Empresa / Conta</Label>
                <Input 
                  placeholder="Nome da empresa" 
                  value={empresaNome} 
                  onChange={e => setEmpresaNome(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Contato Decisor</Label>
                <Input 
                  placeholder="Nome do contato" 
                  value={contatoNome} 
                  onChange={e => setContatoNome(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Valor Manual (R$)</Label>
                <Input 
                  type="number" 
                  placeholder="0,00"
                  value={valorR$} 
                  onChange={e => setValorR$(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Status Inicial (ClickUp)</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {dynamicStatuses.map(st => (
                      <SelectItem key={st.status} value={st.status}>{st.status}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Prioridade</Label>
                <Select value={prioridade} onValueChange={(v: any) => setPrioridade(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Média">Média</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição / Próxima Ação</Label>
              <Input 
                placeholder="Ex: Agendar demonstração técnica da plataforma" 
                value={proximaAcao} 
                onChange={e => setProximaAcao(e.target.value)} 
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewModal(false)}>Cancelar</Button>
            <Button onClick={handleCreateNew} className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5 font-bold">
              <RefreshCw className="w-3.5 h-3.5" /> Salvar & Criar no ClickUp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

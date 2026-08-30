import React, { useState, useMemo, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, Plus, RefreshCw, CheckCircle2, ArrowRight, Building2, User, 
  Search, ExternalLink, Calendar, Tag, AlertCircle, Edit3, Check, 
  DollarSign, Sparkles, ChevronRight, Layers, Flame, ArrowUp, ArrowDown, Minus, Copy
} from 'lucide-react';
import { useCrmStore } from '../hooks/useCrmStore';
import { OportunidadeCrm, PrioridadeOportunidade, ClickUpStatusItem } from '../types';
import { OportunidadeDetalhesModal } from './OportunidadeDetalhesModal';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

// Paleta de cores moderna e profissional para as tags
const TAG_COLOR_PALETTES = [
  { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800' },
  { bg: 'bg-violet-50 dark:bg-violet-950/50', text: 'text-violet-700 dark:text-violet-300', border: 'border-violet-200 dark:border-violet-800' },
  { bg: 'bg-sky-50 dark:bg-sky-950/50', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-200 dark:border-sky-800' },
  { bg: 'bg-amber-50 dark:bg-amber-950/50', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800' },
  { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800' },
  { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200 dark:border-indigo-800' },
  { bg: 'bg-fuchsia-50 dark:bg-fuchsia-950/50', text: 'text-fuchsia-700 dark:text-fuchsia-300', border: 'border-fuchsia-200 dark:border-fuchsia-800' },
  { bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800' },
  { bg: 'bg-teal-50 dark:bg-teal-950/50', text: 'text-teal-700 dark:text-teal-300', border: 'border-teal-200 dark:border-teal-800' },
  { bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-300', border: 'border-orange-200 dark:border-orange-800' },
];

function getTagStyle(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % TAG_COLOR_PALETTES.length;
  return TAG_COLOR_PALETTES[index];
}

// Avatar personalizado ClickUp
function ClickUpUserAvatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl && avatarUrl.trim()) {
    return (
      <div className="relative shrink-0">
        <img 
          src={avatarUrl} 
          alt={name} 
          className="w-6 h-6 rounded-full object-cover ring-1 ring-border shadow-2xs" 
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />
      </div>
    );
  }

  const initials = (name || 'U')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) {
    hash = (name || '').charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    'from-blue-500 to-indigo-600',
    'from-emerald-500 to-teal-600',
    'from-orange-500 to-amber-600',
    'from-purple-500 to-pink-600',
    'from-rose-500 to-red-600'
  ];
  const colorClass = colors[Math.abs(hash) % colors.length];

  return (
    <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${colorClass} text-white font-bold text-[10px] flex items-center justify-center shadow-2xs shrink-0 ring-1 ring-white/20`}>
      {initials || 'U'}
    </div>
  );
}

// Badge de prioridade com ícone
function PriorityBadge({ prioridade }: { prioridade?: string }) {
  const p = (prioridade || 'Normal').toLowerCase();
  
  if (p.includes('urgent') || p.includes('urgente')) {
    return (
      <Badge variant="outline" className="text-[10px] font-semibold bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 gap-1 px-1.5 py-0">
        <Flame className="w-2.5 h-2.5 text-rose-500 fill-rose-500" /> Urgente
      </Badge>
    );
  }
  if (p.includes('high') || p.includes('alta')) {
    return (
      <Badge variant="outline" className="text-[10px] font-semibold bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 gap-1 px-1.5 py-0">
        <ArrowUp className="w-2.5 h-2.5 text-amber-500" /> Alta
      </Badge>
    );
  }
  if (p.includes('low') || p.includes('baixa')) {
    return (
      <Badge variant="outline" className="text-[10px] font-medium bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/40 dark:text-slate-400 dark:border-slate-800 gap-1 px-1.5 py-0">
        <ArrowDown className="w-2.5 h-2.5 text-slate-400" /> Baixa
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="text-[10px] font-medium bg-blue-50/70 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 gap-1 px-1.5 py-0">
      <Minus className="w-2.5 h-2.5 text-blue-400" /> Normal
    </Badge>
  );
}

export function CrmKanbanView() {
  const { 
    oportunidades, config, moverOportunidadeEtapa, updateOportunidadeValor, 
    addOportunidade, deleteOportunidade, importRealClickUpTasks, isLoadingClickUp 
  } = useCrmStore();

  const [selectedOp, setSelectedOp] = useState<OportunidadeCrm | null>(null);
  const [openNewModal, setOpenNewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todas');
  const [activeMobileColumn, setActiveMobileColumn] = useState<string | null>(null);

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
  const kanbanScrollRef = useRef<HTMLDivElement>(null);

  // 1. Extrair colunas / status dinâmicos reais do ClickUp
  const dynamicStatuses = useMemo<ClickUpStatusItem[]>(() => {
    const statusMap = new Map<string, ClickUpStatusItem>();

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

      const matchPrioridade = prioridadeFilter === 'todas' || 
        (op.prioridade || '').toLowerCase() === prioridadeFilter.toLowerCase();

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

  // Navegação suave no Mobile para a coluna selecionada
  const scrollToColumn = (colId: string) => {
    setActiveMobileColumn(colId);
    const el = document.getElementById(`column-${colId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  };

  return (
    <div className="space-y-4 animate-fade-in pt-1">
      {/* Controles Minimalistas do Kanban (Sem container pesado para dar protagonismo ao quadro) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5 pb-1">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Badge ClickUp Minimalista */}
          {isConnected ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border/50">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <span className="truncate max-w-[180px] sm:max-w-none text-[11px] font-medium text-foreground">
                {config.listName || config.listId || 'ClickUp Conectado'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
              <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
              <span className="text-[11px] font-medium">ClickUp Desconectado</span>
            </div>
          )}

          {/* Busca Minimalista */}
          <div className="relative w-full sm:w-56">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar cards ou clientes..." 
              className="pl-8 h-8 text-xs bg-background/90 border-border/60"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro de Prioridade Minimalista */}
          <Select value={prioridadeFilter} onValueChange={setPrioridadeFilter}>
            <SelectTrigger className="w-[125px] h-8 text-xs bg-background/90 border-border/60">
              <SelectValue placeholder="Prioridade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas Prioridades</SelectItem>
              <SelectItem value="Urgente">Urgente</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Baixa">Baixa</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          {isConnected && (
            <Button 
              variant="outline" 
              size="sm" 
              disabled={isLoadingClickUp}
              onClick={() => importRealClickUpTasks()}
              className="gap-1.5 text-xs h-8 font-medium border-border/60 hover:bg-muted/40 cursor-pointer"
              title="Sincronizar tarefas do ClickUp"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isLoadingClickUp ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{isLoadingClickUp ? 'Sincronizando...' : 'Sincronizar'}</span>
            </Button>
          )}

          <Button 
            onClick={() => setOpenNewModal(true)} 
            size="sm" 
            className="gap-1.5 h-8 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white cursor-pointer shadow-none"
          >
            <Plus className="w-3.5 h-3.5" /> 
            <span>Novo Card</span>
          </Button>
        </div>
      </div>

      {/* SELETOR DE COLUNAS MOBILE (Scroll horizontal rápido para Android/iOS) */}
      <div className="flex sm:hidden overflow-x-auto gap-2 pb-2 scrollbar-none snap-x px-0.5">
        {dynamicStatuses.map((stObj) => {
          const opsCount = filteredOportunidades.filter(
            o => (o.etapa || '').toLowerCase() === stObj.status.toLowerCase()
          ).length;

          const isActive = activeMobileColumn === stObj.status;

          return (
            <button
              key={`mob-nav-${stObj.status}`}
              onClick={() => scrollToColumn(stObj.status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shrink-0 border transition-all ${
                isActive 
                  ? 'bg-foreground text-background border-foreground shadow-xs' 
                  : 'bg-card text-muted-foreground border-border'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stObj.color || '#94a3b8' }} />
              <span className="uppercase text-[11px] truncate max-w-[120px]">{stObj.status}</span>
              <span className="text-[10px] px-1 py-0.2 rounded-full bg-muted text-foreground font-mono">
                {opsCount}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid de Colunas do Kanban com Snap Scrolling Nativo para iOS/Android */}
      <div 
        ref={kanbanScrollRef}
        className="flex gap-3.5 sm:gap-4 items-start overflow-x-auto pb-6 min-h-[580px] snap-x snap-mandatory scrollbar-thin -mx-2 px-2 sm:mx-0 sm:px-0"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
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
              id={`column-${statusName}`}
              className="bg-card/70 dark:bg-card/40 backdrop-blur-xs p-3.5 rounded-2xl border shadow-xs w-[86vw] sm:w-[310px] md:w-[320px] shrink-0 snap-center space-y-3 transition-all hover:border-primary/30"
              style={{ borderTop: `4px solid ${statusColor}` }}
            >
              {/* Header da Coluna Dinâmica */}
              <div className="flex justify-between items-start pb-2.5 border-b">
                <div className="flex items-start gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0 mt-1 shadow-2xs" style={{ backgroundColor: statusColor }} />
                  <div>
                    <h4 className="font-bold text-xs text-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <span className="truncate max-w-[180px]">{statusName}</span>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 font-mono font-bold">
                        {opsNaEtapa.length}
                      </Badge>
                    </h4>
                    <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                      {totalValorEtapa > 0 ? (
                        <span className="text-foreground font-bold">{formatCurrency(totalValorEtapa)}</span>
                      ) : (
                        <span className="text-muted-foreground/80">R$ 0,00</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Lista de Cards da Coluna */}
              <div className="space-y-3 min-h-[380px]">
                {opsNaEtapa.length === 0 ? (
                  <div className="h-36 flex flex-col items-center justify-center p-4 border border-dashed rounded-xl text-[11px] text-muted-foreground/70 text-center gap-1">
                    <Layers className="w-4 h-4 text-muted-foreground/40" />
                    <span>Nenhum item nesta etapa</span>
                  </div>
                ) : (
                  opsNaEtapa.map(op => (
                    <Card 
                      key={op.id} 
                      className="hover:border-primary/60 transition-all shadow-2xs hover:shadow-md bg-card border-border/80 cursor-pointer group active:scale-[0.99] rounded-xl overflow-hidden"
                      onClick={() => setSelectedOp(op)}
                    >
                      <CardContent className="p-3.5 space-y-2.5 text-xs">
                        {/* Header do Card: ID ClickUp & Prioridade */}
                        <div className="flex justify-between items-center gap-2">
                          <div className="flex items-center gap-1.5">
                            <Badge 
                              variant="outline" 
                              className="text-[9px] font-mono font-bold border-orange-500/30 text-orange-600 bg-orange-50 dark:bg-orange-950/40 gap-1 px-1.5 py-0.5 rounded-md"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (op.clickUpUrl) window.open(op.clickUpUrl, '_blank');
                              }}
                            >
                              <RefreshCw className="w-2.5 h-2.5" /> 
                              <span>{op.clickUpTaskId}</span>
                              {op.clickUpUrl && <ExternalLink className="w-2 h-2 opacity-60" />}
                            </Badge>
                          </div>

                          <PriorityBadge prioridade={op.prioridade} />
                        </div>

                        {/* Título & Empresa */}
                        <div className="space-y-1">
                          <h5 className="font-bold text-xs text-foreground group-hover:text-primary transition-colors leading-snug">
                            {op.titulo}
                          </h5>
                          {op.empresaNome && op.empresaNome !== op.titulo && (
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 font-medium">
                              <Building2 className="w-3 h-3 text-muted-foreground/70 shrink-0" /> 
                              <span className="truncate">{op.empresaNome}</span>
                            </p>
                          )}
                        </div>

                        {/* TAGS COLORIDAS & VIBRANTES */}
                        {op.tags && op.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {op.tags.map((t, tIdx) => {
                              const style = getTagStyle(t);
                              return (
                                <span 
                                  key={tIdx} 
                                  className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border ${style.bg} ${style.text} ${style.border}`}
                                >
                                  <Tag className="w-2.5 h-2.5 opacity-70" />
                                  <span>{t}</span>
                                </span>
                              );
                            })}
                          </div>
                        )}

                        {/* Valor Real com Edição Manual Rápida */}
                        <div 
                          className="flex justify-between items-center pt-2 border-t border-border/50"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {editingCardId === op.id ? (
                            <div className="flex items-center gap-1 w-full animate-fade-in">
                              <Input 
                                type="number" 
                                placeholder="0,00"
                                value={quickValorInput} 
                                onChange={e => setQuickValorInput(e.target.value)}
                                className="h-7 text-xs px-2 font-bold bg-background rounded-lg"
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleSaveQuickValor(op.id);
                                  if (e.key === 'Escape') setEditingCardId(null);
                                }}
                              />
                              <Button 
                                size="sm" 
                                className="h-7 w-7 p-0 bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 rounded-lg"
                                onClick={() => handleSaveQuickValor(op.id)}
                              >
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              {op.valorR$ > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                                    {formatCurrency(op.valorR$)}
                                  </span>
                                  <button 
                                    className="p-1 rounded text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={() => {
                                      setEditingCardId(op.id);
                                      setQuickValorInput(String(op.valorR$ || ''));
                                    }}
                                    title="Editar valor"
                                  >
                                    <Edit3 className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button 
                                  className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-emerald-600 py-0.5 px-1.5 rounded border border-dashed border-border hover:border-emerald-500 transition-colors"
                                  onClick={() => {
                                    setEditingCardId(op.id);
                                    setQuickValorInput('');
                                  }}
                                >
                                  <DollarSign className="w-2.5 h-2.5 text-muted-foreground" /> 
                                  <span>Definir Valor</span>
                                </button>
                              )}

                              {op.dataPrevistaFechamento && (
                                <div className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                                  <Calendar className="w-2.5 h-2.5 text-muted-foreground/70" />
                                  <span>{formatDateBrasilia(op.dataPrevistaFechamento)}</span>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Rodapé do Card: Avatar do ClickUp + Responsável + Botão Avançar */}
                        <div className="flex justify-between items-center pt-2 text-[11px] text-muted-foreground">
                          <div className="flex items-center gap-1.5 min-w-0 max-w-[150px]">
                            <ClickUpUserAvatar 
                              name={op.responsavel} 
                              avatarUrl={op.responsavelAvatar} 
                            />
                            <span className="truncate font-medium text-foreground text-[11px]">
                              {op.responsavel}
                            </span>
                          </div>
                          
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
                              className="h-6 text-[10px] px-2 gap-1 rounded-lg border-orange-500/50 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40 transition-colors font-semibold"
                              title={`Mover para ${dynamicStatuses[colIdx + 1].status}`}
                            >
                              <span>Avançar</span>
                              <ArrowRight className="w-2.5 h-2.5" />
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
        <DialogContent className="sm:max-w-lg rounded-2xl">
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
                className="rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Empresa / Conta</Label>
                <Input 
                  placeholder="Nome da empresa" 
                  value={empresaNome} 
                  onChange={e => setEmpresaNome(e.target.value)} 
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Contato Decisor</Label>
                <Input 
                  placeholder="Nome do contato" 
                  value={contatoNome} 
                  onChange={e => setContatoNome(e.target.value)} 
                  className="rounded-xl"
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
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Status Inicial (ClickUp)</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger className="rounded-xl"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                  <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Urgente">Urgente</SelectItem>
                    <SelectItem value="Alta">Alta</SelectItem>
                    <SelectItem value="Normal">Normal</SelectItem>
                    <SelectItem value="Baixa">Baixa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrição / Detalhes</Label>
              <Input 
                placeholder="Ex: Agendar demonstração técnica da plataforma" 
                value={proximaAcao} 
                onChange={e => setProximaAcao(e.target.value)} 
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button onClick={handleCreateNew} className="bg-orange-600 hover:bg-orange-700 text-white gap-1.5 font-bold rounded-xl shadow-xs">
              <RefreshCw className="w-3.5 h-3.5" /> Salvar & Criar no ClickUp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

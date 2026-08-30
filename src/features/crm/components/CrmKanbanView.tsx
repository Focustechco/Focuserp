import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, Plus, RefreshCw, CheckCircle2, ArrowRight, Building2, User, 
  Key, Layers, Search, Filter, ExternalLink, Calendar, Tag, AlertCircle
} from 'lucide-react';
import { useCrmStore } from '../hooks/useCrmStore';
import { EtapaPipeline, OportunidadeCrm, PrioridadeOportunidade } from '../types';
import { OportunidadeDetalhesModal } from './OportunidadeDetalhesModal';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const ETAPAS: EtapaPipeline[] = [
  'Qualificação',
  'Diagnóstico & Reunião',
  'Proposta Apresentada',
  'Em Negociação',
  'Fechado Ganho',
  'Perdido'
];

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function CrmKanbanView() {
  const { 
    oportunidades, config, moverOportunidadeEtapa, addOportunidade, 
    deleteOportunidade, importRealClickUpTasks, isLoadingClickUp, carregarDadosDemo 
  } = useCrmStore();

  const [selectedOp, setSelectedOp] = useState<OportunidadeCrm | null>(null);
  const [openNewModal, setOpenNewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [prioridadeFilter, setPrioridadeFilter] = useState('todas');

  // Form State Nova Oportunidade
  const [titulo, setTitulo] = useState('');
  const [empresaNome, setEmpresaNome] = useState('');
  const [contatoNome, setContatoNome] = useState('');
  const [contatoEmail, setContatoEmail] = useState('');
  const [contatoTelefone, setContatoTelefone] = useState('');
  const [valorR$, setValorR$] = useState('85000');
  const [responsavel, setResponsavel] = useState('Equipe Comercial');
  const [etapa, setEtapa] = useState<EtapaPipeline>('Qualificação');
  const [prioridade, setPrioridade] = useState<PrioridadeOportunidade>('Alta');
  const [proximaAcao, setProximaAcao] = useState('');

  const isConnected = config.statusConexao === 'Conectado ClickUp API';

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
    if (!titulo.trim() || !empresaNome.trim()) {
      toast.error('Preencha o título e a empresa da oportunidade.');
      return;
    }

    await addOportunidade({
      titulo: titulo.trim(),
      empresaNome: empresaNome.trim(),
      contatoNome: contatoNome.trim() || 'Contato Principal',
      contatoEmail: contatoEmail.trim() || undefined,
      contatoTelefone: contatoTelefone.trim() || undefined,
      valorR$: parseFloat(valorR$) || 50000,
      probabilidadePercent: etapa === 'Fechado Ganho' ? 100 : 50,
      responsavel: responsavel.trim(),
      pipeline: config.listName || 'Pipeline Vendas Enterprise 2026',
      etapa,
      prioridade,
      tags: ['ClickUp Synced', 'Novo Lead'],
      dataPrevistaFechamento: new Date(Date.now() + 86400000 * 45).toISOString().split('T')[0],
      proximaAcao: proximaAcao.trim() || 'Agendar primeira reunião de diagnóstico'
    });

    setOpenNewModal(false);
    setTitulo('');
    setEmpresaNome('');
    setContatoNome('');
    setContatoEmail('');
    setContatoTelefone('');
    setProximaAcao('');
  };

  return (
    <div className="space-y-5 animate-fade-in pt-2">
      {/* Barra de Status e Ferramentas Superiores */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-muted/20 p-4 border rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          {/* Badge ClickUp Status */}
          {isConnected ? (
            <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 py-1 px-3 rounded-lg text-xs font-semibold text-emerald-800 dark:text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ClickUp Conectado: <strong>{config.listName || config.listId}</strong></span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 py-1 px-3 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-200">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>Modo Local (ClickUp Desconectado)</span>
            </div>
          )}

          {/* Busca */}
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar cards no Kanban..." 
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
              className="gap-1.5 text-xs h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-orange-500 ${isLoadingClickUp ? 'animate-spin' : ''}`} />
              {isLoadingClickUp ? 'Sincronizando...' : 'Sincronizar ClickUp'}
            </Button>
          )}

          {oportunidades.length === 0 && (
            <Button variant="outline" size="sm" onClick={carregarDadosDemo} className="text-xs h-8 gap-1.5 border-blue-400 text-blue-600">
              <Layers className="w-3.5 h-3.5" /> Exemplo Demo
            </Button>
          )}

          <Button onClick={() => setOpenNewModal(true)} size="sm" className="gap-2 h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white font-bold">
            <Plus className="w-3.5 h-3.5" /> Nova Oportunidade
          </Button>
        </div>
      </div>

      {/* Grid de Colunas do Kanban */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3.5 items-start overflow-x-auto pb-6 min-h-[500px]">
        {ETAPAS.map(e => {
          const opsNaEtapa = filteredOportunidades.filter(o => o.etapa === e);
          const totalValorEtapa = opsNaEtapa.reduce((acc, o) => acc + (o.valorR$ || 0), 0);

          const getHeaderColor = () => {
            switch(e) {
              case 'Fechado Ganho': return 'border-t-4 border-t-emerald-500';
              case 'Em Negociação': return 'border-t-4 border-t-indigo-500';
              case 'Proposta Apresentada': return 'border-t-4 border-t-blue-500';
              case 'Diagnóstico & Reunião': return 'border-t-4 border-t-amber-500';
              case 'Perdido': return 'border-t-4 border-t-rose-500';
              default: return 'border-t-4 border-t-slate-400';
            }
          };

          return (
            <div key={e} className={`bg-muted/30 p-3 rounded-xl border shadow-xs min-w-[230px] space-y-3 ${getHeaderColor()}`}>
              {/* Header da Coluna */}
              <div className="flex justify-between items-center pb-2 border-b">
                <div>
                  <h4 className="font-bold text-xs text-foreground flex items-center gap-1.5">
                    <span>{e}</span>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                      {opsNaEtapa.length}
                    </Badge>
                  </h4>
                  <p className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                    {formatCurrency(totalValorEtapa)}
                  </p>
                </div>
              </div>

              {/* Lista de Cards */}
              <div className="space-y-2.5 min-h-[350px]">
                {opsNaEtapa.length === 0 ? (
                  <div className="h-40 flex items-center justify-center p-4 border border-dashed rounded-lg text-[11px] text-muted-foreground text-center">
                    Nenhum negócio nesta etapa
                  </div>
                ) : (
                  opsNaEtapa.map(op => (
                    <Card 
                      key={op.id} 
                      className="hover:border-primary/50 transition-all shadow-xs bg-card cursor-pointer group hover:shadow-md"
                      onClick={() => setSelectedOp(op)}
                    >
                      <CardContent className="p-3 space-y-2.5 text-xs">
                        {/* Badge ClickUp & Prioridade */}
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
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1 font-medium">
                            <Building2 className="w-3 h-3 text-muted-foreground shrink-0" /> 
                            <span className="truncate">{op.empresaNome}</span>
                          </p>
                        </div>

                        {/* Valor R$ e Probabilidade */}
                        <div className="flex justify-between items-center pt-1.5 border-t border-border/50">
                          <span className="font-bold text-sm text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(op.valorR$)}
                          </span>
                          <span className="text-[10px] font-semibold text-muted-foreground">
                            {op.probabilidadePercent}% prob.
                          </span>
                        </div>

                        {/* Responsável e Ação Rápida de Mover */}
                        <div className="flex justify-between items-center pt-1 text-[10px] text-muted-foreground">
                          <span className="flex items-center gap-1 truncate max-w-[110px]">
                            {op.responsavelAvatar ? (
                              <img src={op.responsavelAvatar} alt="" className="w-3.5 h-3.5 rounded-full" />
                            ) : (
                              <User className="w-3 h-3 text-orange-500" />
                            )}
                            <span className="truncate">{op.responsavel.split(' ')[0]}</span>
                          </span>
                          
                          {e !== 'Fechado Ganho' ? (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={(ev) => {
                                ev.stopPropagation();
                                const nextIdx = ETAPAS.indexOf(e) + 1;
                                if (nextIdx < ETAPAS.length) {
                                  moverOportunidadeEtapa(op.id, ETAPAS[nextIdx]);
                                }
                              }}
                              className="h-6 text-[10px] px-2 gap-1 border-orange-500/60 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/40"
                            >
                              Avançar <ArrowRight className="w-2.5 h-2.5" />
                            </Button>
                          ) : (
                            <Badge className="bg-emerald-100 text-emerald-800 text-[9px] border-emerald-300">
                              ✓ Ganho
                            </Badge>
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
        open={!!selectedOp}
        onOpenChange={(open) => !open && setSelectedOp(null)}
        onMoverEtapa={moverOportunidadeEtapa}
        onDelete={deleteOportunidade}
      />

      {/* Modal Nova Oportunidade */}
      <Dialog open={openNewModal} onOpenChange={setOpenNewModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Target className="w-5 h-5 text-primary" /> Criar Oportunidade no ClickUp & CRM
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título da Oportunidade *</Label>
              <Input 
                placeholder="Ex: Contrato Focus ERP — Grupo Logística" 
                value={titulo} 
                onChange={e => setTitulo(e.target.value)} 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Empresa / Conta *</Label>
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

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>E-mail do Contato</Label>
                <Input 
                  placeholder="email@empresa.com.br" 
                  value={contatoEmail} 
                  onChange={e => setContatoEmail(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <Label>WhatsApp / Telefone</Label>
                <Input 
                  placeholder="(11) 98765-4321" 
                  value={contatoTelefone} 
                  onChange={e => setContatoTelefone(e.target.value)} 
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Valor Estimado (R$)</Label>
                <Input 
                  type="number" 
                  value={valorR$} 
                  onChange={e => setValorR$(e.target.value)} 
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Etapa Inicial</Label>
                <Select value={etapa} onValueChange={(v: any) => setEtapa(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ETAPAS.map(et => (
                      <SelectItem key={et} value={et}>{et}</SelectItem>
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
              <Label>Próxima Ação / Detalhes</Label>
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
              <RefreshCw className="w-3.5 h-3.5" /> Salvar & Sincronizar com ClickUp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

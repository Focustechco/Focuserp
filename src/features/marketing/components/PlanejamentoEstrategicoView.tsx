import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Target, TrendingUp, DollarSign, Users, Plus, Clock, AlertTriangle, Trash2 } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { useLocalStorageState } from "@/hooks/useDataStore";
import { toast } from "sonner";

export interface OKRKeyResult {
  descricao: string;
  atual: number;
  meta: number;
  unidade: string;
}

export interface OKRItem {
  id: string;
  objetivo: string;
  periodo: string;
  kr: OKRKeyResult[];
}

export interface IniciativaItem {
  id: string;
  titulo: string;
  status: string;
  prioridade: string;
}

const defaultOKRs: OKRItem[] = [
  {
    id: 'okr-1',
    objetivo: 'Tornar-se referência em ERP para PMEs no Brasil',
    periodo: 'Q3 2026',
    kr: [
      { descricao: 'Atingir 500 MQLs qualificados por mês', atual: 342, meta: 500, unidade: 'MQLs/mês' },
      { descricao: 'Alcançar NPS de marca acima de 70', atual: 62, meta: 70, unidade: 'NPS' },
      { descricao: 'Aumentar tráfego orgânico em 80%', atual: 48, meta: 80, unidade: '% crescimento' },
    ],
  },
  {
    id: 'okr-2',
    objetivo: 'Escalar receita via marketing digital para R$ 2M/mês',
    periodo: 'Q3 2026',
    kr: [
      { descricao: 'Reduzir CAC para abaixo de R$ 400', atual: 448, meta: 400, unidade: 'CAC (R$)' },
      { descricao: 'Manter ROAS acima de 4x em todas as plataformas', atual: 3.8, meta: 4, unidade: 'ROAS' },
      { descricao: 'Converter 5% dos MQLs em clientes', atual: 3.2, meta: 5, unidade: '% conversão' },
    ],
  },
];

const defaultIniciativas: IniciativaItem[] = [
  { id: 'ini-1', titulo: 'Implementar Account-Based Marketing (ABM) para empresas acima de 200 funcionários', status: 'Em Andamento', prioridade: 'Alta' },
  { id: 'ini-2', titulo: 'Lançar programa de parceiros e afiliados com comissão recorrente', status: 'Planejado', prioridade: 'Alta' },
  { id: 'ini-3', titulo: 'Publicar 8 artigos técnicos mensais para SEO de cauda longa', status: 'Em Andamento', prioridade: 'Média' },
  { id: 'ini-4', titulo: 'Automatizar nutrição de leads com sequências de e-mail segmentadas por persona', status: 'Em Andamento', prioridade: 'Alta' },
];

const budget = [
  { canal: 'Google Ads', valor: 'R$ 3.500', percentual: 29, cor: 'bg-blue-500' },
  { canal: 'Meta Ads', valor: 'R$ 4.200', percentual: 35, cor: 'bg-pink-500' },
  { canal: 'LinkedIn Ads', valor: 'R$ 2.800', percentual: 23, cor: 'bg-sky-500' },
  { canal: 'E-mail Marketing', valor: 'R$ 300', percentual: 2, cor: 'bg-emerald-500' },
  { canal: 'SEO / Conteúdo', valor: 'R$ 1.200', percentual: 10, cor: 'bg-amber-500' },
];

const radarData = [
  { area: 'SEO', valor: 60 },
  { area: 'Tráfego Pago', valor: 85 },
  { area: 'Redes Sociais', valor: 70 },
  { area: 'E-mail Mkt', valor: 55 },
  { area: 'Conteúdo', valor: 65 },
  { area: 'Eventos', valor: 40 },
];

// ─── Modal Novo OKR ────────────────────────────────────────────────────────────
function NovoOKRModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (okr: OKRItem) => void }) {
  const [objetivo, setObjetivo] = useState('');
  const [periodo, setPeriodo] = useState('Q3 2026');
  const [krs, setKrs] = useState<OKRKeyResult[]>([
    { descricao: '', atual: 0, meta: 100, unidade: '' },
  ]);

  const addKR = () => setKrs(prev => [...prev, { descricao: '', atual: 0, meta: 100, unidade: '' }]);
  const removeKR = (idx: number) => setKrs(prev => prev.filter((_, i) => i !== idx));
  const updateKR = (idx: number, field: keyof OKRKeyResult, value: string | number) => {
    setKrs(prev => prev.map((kr, i) => i === idx ? { ...kr, [field]: value } : kr));
  };

  const handleSave = () => {
    if (!objetivo.trim()) { toast.error('Informe o objetivo'); return; }
    if (krs.some(kr => !kr.descricao.trim())) { toast.error('Preencha todos os Key Results'); return; }
    const newOKR: OKRItem = {
      id: `okr-${Date.now()}`,
      objetivo,
      periodo,
      kr: krs.map(kr => ({ ...kr, atual: Number(kr.atual), meta: Number(kr.meta) })),
    };
    onSave(newOKR);
    toast.success('OKR criado com sucesso!');
    onClose();
    setObjetivo(''); setPeriodo('Q3 2026'); setKrs([{ descricao: '', atual: 0, meta: 100, unidade: '' }]);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> Novo OKR de Marketing
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-1.5">
              <Label>Objetivo *</Label>
              <Input placeholder="Ex: Tornar-se a maior plataforma de ERP para PMEs" value={objetivo} onChange={e => setObjetivo(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Período</Label>
              <Select value={periodo} onValueChange={setPeriodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Q1 2026">Q1 2026</SelectItem>
                  <SelectItem value="Q2 2026">Q2 2026</SelectItem>
                  <SelectItem value="Q3 2026">Q3 2026</SelectItem>
                  <SelectItem value="Q4 2026">Q4 2026</SelectItem>
                  <SelectItem value="Anual 2026">Anual 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Label>Key Results</Label>
              <Button variant="outline" size="sm" className="gap-1 h-7 text-xs" onClick={addKR}><Plus className="w-3 h-3"/> Adicionar KR</Button>
            </div>
            {krs.map((kr, idx) => (
              <div key={idx} className="border rounded-lg p-3 space-y-2 bg-muted/20">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-muted-foreground">KR {idx + 1}</span>
                  {krs.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeKR(idx)}>
                      <Trash2 className="w-3 h-3 text-rose-500" />
                    </Button>
                  )}
                </div>
                <Input placeholder="Descrição do Key Result *" value={kr.descricao} onChange={e => updateKR(idx, 'descricao', e.target.value)} />
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Valor Atual</Label>
                    <Input type="number" value={kr.atual} onChange={e => updateKR(idx, 'atual', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Meta</Label>
                    <Input type="number" value={kr.meta} onChange={e => updateKR(idx, 'meta', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Unidade</Label>
                    <Input placeholder="Ex: MQLs, %, R$" value={kr.unidade} onChange={e => updateKR(idx, 'unidade', e.target.value)} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} className="gap-2"><Target className="w-4 h-4"/> Criar OKR</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Modal Nova Iniciativa ─────────────────────────────────────────────────────
function NovaIniciativaModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (ini: IniciativaItem) => void }) {
  const [titulo, setTitulo] = useState('');
  const [status, setStatus] = useState('Planejado');
  const [prioridade, setPrioridade] = useState('Alta');

  const handleSave = () => {
    if (!titulo.trim()) { toast.error('Informe o título'); return; }
    onSave({ id: `ini-${Date.now()}`, titulo, status, prioridade });
    toast.success('Iniciativa adicionada!');
    onClose();
    setTitulo(''); setStatus('Planejado'); setPrioridade('Alta');
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Iniciativa Estratégica</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label>Título da Iniciativa *</Label>
            <Textarea placeholder="Descreva a iniciativa estratégica..." value={titulo} onChange={e => setTitulo(e.target.value)} rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Planejado">Planejado</SelectItem>
                  <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                  <SelectItem value="Concluído">Concluído</SelectItem>
                  <SelectItem value="Pausado">Pausado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Prioridade</Label>
              <Select value={prioridade} onValueChange={setPrioridade}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Alta">Alta</SelectItem>
                  <SelectItem value="Média">Média</SelectItem>
                  <SelectItem value="Baixa">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Adicionar Iniciativa</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Componente Principal ──────────────────────────────────────────────────────
export function PlanejamentoEstrategicoView() {
  const [okrModalOpen, setOkrModalOpen] = useState(false);
  const [iniciativaModalOpen, setIniciativaModalOpen] = useState(false);

  const { data: okrs, addItem: addOKR, removeItem: removeOKR } = useLocalStorageState<OKRItem>('focus_marketing_okrs', defaultOKRs);
  const { data: iniciativas, addItem: addIniciativa, removeItem: removeIniciativa } = useLocalStorageState<IniciativaItem>('focus_marketing_iniciativas', defaultIniciativas);

  return (
    <div className="flex flex-col space-y-6 animate-fade-in pb-8">
      <div className="order-1 pb-2 border-b">
        <h3 className="font-medium text-lg">Planejamento Estratégico de Marketing</h3>
        <p className="text-sm text-muted-foreground">OKRs, budget anual e maturidade dos canais de aquisição.</p>
      </div>

      {/* Charts / Radar & Budget */}
      <div className="order-2 md:order-3 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget por Canal */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" /> Budget Mensal por Canal
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Total: <strong>R$ 12.200/mês</strong></p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {budget.map((item, idx) => (
                <div key={idx} className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{item.canal}</span>
                    <span className="text-muted-foreground font-semibold">{item.valor} ({item.percentual}%)</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className={`h-full ${item.cor} rounded-full`} style={{ width: `${item.percentual}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Radar de Maturidade */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" /> Maturidade dos Canais
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Score de 0–100 por canal</p>
          </CardHeader>
          <CardContent>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis dataKey="area" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Radar name="Maturidade" dataKey="valor" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OKRs */}
      <div className="order-3 md:order-2 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-base flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" /> OKRs de Marketing
          </h4>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setOkrModalOpen(true)}>
            <Plus className="w-4 h-4" /> Novo OKR
          </Button>
        </div>

        {okrs.length === 0 ? (
          <div className="border border-dashed rounded-lg p-10 text-center text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-20" />
            <p className="font-medium">Nenhum OKR cadastrado.</p>
            <p className="text-xs mt-1">Clique em "Novo OKR" para definir seus objetivos.</p>
          </div>
        ) : (
          okrs.map((okr) => (
            <Card key={okr.id} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4 text-primary shrink-0" />
                    {okr.objetivo}
                  </CardTitle>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="secondary" className="text-xs">{okr.periodo}</Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { removeOKR(okr.id); toast.success('OKR removido'); }}>
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-rose-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {okr.kr.map((kr, j) => {
                  const pct = Math.min(100, Math.round((kr.atual / kr.meta) * 100));
                  const onTrack = pct >= 70;
                  return (
                    <div key={j} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="text-sm font-medium leading-snug">{kr.descricao}</p>
                        <Badge variant="outline" className={`text-[10px] shrink-0 ${onTrack ? 'text-emerald-600 border-emerald-200 bg-emerald-50' : 'text-amber-600 border-amber-200 bg-amber-50'}`}>
                          {onTrack ? 'No Prazo' : 'Atenção'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress value={pct} className="h-2 flex-1" />
                        <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">
                          {kr.atual} / {kr.meta} {kr.unidade}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Iniciativas */}
      <Card className="order-4 md:order-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Iniciativas Estratégicas — H2 2026
          </CardTitle>
          <Button size="sm" variant="outline" className="gap-2" onClick={() => setIniciativaModalOpen(true)}>
            <Plus className="w-4 h-4" /> Adicionar
          </Button>
        </CardHeader>
        <CardContent>
          {iniciativas.length === 0 ? (
            <div className="border border-dashed rounded-lg p-8 text-center text-muted-foreground">
              <p className="text-sm">Nenhuma iniciativa cadastrada.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {iniciativas.map((item) => (
                <div key={item.id} className="flex items-start gap-3 p-3 rounded-lg border hover:border-primary/40 transition-colors bg-muted/10 group">
                  {item.status === 'Em Andamento' ? (
                    <Clock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  )}
                  <p className="text-sm flex-1">{item.titulo}</p>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className={`text-[10px] ${item.prioridade === 'Alta' ? 'text-rose-600 border-rose-200 bg-rose-50' : 'text-slate-600 border-slate-200'}`}>
                      {item.prioridade}
                    </Badge>
                    <Badge variant="outline" className={`text-[10px] ${item.status === 'Em Andamento' ? 'text-blue-600 border-blue-200 bg-blue-50' : 'text-amber-600 border-amber-200 bg-amber-50'}`}>
                      {item.status}
                    </Badge>
                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => { removeIniciativa(item.id); toast.success('Removido'); }}>
                      <Trash2 className="w-3 h-3 text-muted-foreground hover:text-rose-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <NovoOKRModal open={okrModalOpen} onClose={() => setOkrModalOpen(false)} onSave={addOKR} />
      <NovaIniciativaModal open={iniciativaModalOpen} onClose={() => setIniciativaModalOpen(false)} onSave={addIniciativa} />
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Target, Award, Star, TrendingUp, Users, Plus, 
  CheckCircle2, Clock, MessageSquare 
} from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { toast } from 'sonner';

export interface CicloAvaliacao {
  id: string;
  titulo: string;
  tipo: 'Avaliação 360°' | 'Avaliação 90° (Gestor)' | 'Avaliação de Experiência' | 'Metas & OKRs Individuais';
  periodo: string;
  dataInicio: string;
  dataFim: string;
  totalParticipantes: number;
  concluidas: number;
  status: 'Em Andamento' | 'Planejado' | 'Encerrado';
  mediaGeralNota: number;
}

const INITIAL_CICLOS: CicloAvaliacao[] = [];

export function RhDesempenhoView() {
  const { colaboradores } = useColaboradoresQuery();
  const { data: ciclos = INITIAL_CICLOS, addItem, updateItem } = useLocalStorageState<CicloAvaliacao>('focus_rh_ciclos_avaliacao', INITIAL_CICLOS);

  const [activeTab, setActiveTab] = useState<'ciclos' | 'ninebox'>('ciclos');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<CicloAvaliacao['tipo']>('Avaliação 360°');
  const [periodo, setPeriodo] = useState('2º Semestre 2026');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dataFim, setDataFim] = useState('2026-12-15');

  // Mapeamento Nine Box para os colaboradores
  const nineBoxQuadrantes = useMemo(() => {
    return [
      { id: 'q1', nome: 'Risco / Questionável', potencia: 'Baixo', desempenho: 'Baixo', cor: 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20 text-rose-700', colabs: [] },
      { id: 'q2', nome: 'Eficaz / Especialista', potencia: 'Baixo', desempenho: 'Médio', cor: 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700', colabs: [] },
      { id: 'q3', nome: 'Profissional Chave', potencia: 'Baixo', desempenho: 'Alto', cor: 'border-blue-300 bg-blue-50/40 dark:bg-blue-950/20 text-blue-700', colabs: ['Mariana Souza'] },
      { id: 'q4', nome: 'Dilema / Enigma', potencia: 'Médio', desempenho: 'Baixo', cor: 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20 text-amber-700', colabs: [] },
      { id: 'q5', nome: 'Mantenedor / Bom Desempenho', potencia: 'Médio', desempenho: 'Médio', cor: 'border-slate-300 bg-slate-50/40 dark:bg-slate-950/20 text-slate-700', colabs: ['Lucas Rodrigues', 'Camila Dias'] },
      { id: 'q6', nome: 'Forte Desempenho', potencia: 'Médio', desempenho: 'Alto', cor: 'border-emerald-300 bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-700', colabs: ['Carlos Eduardo', 'Patrícia Rocha'] },
      { id: 'q7', nome: 'Potencial a Lapidar', potencia: 'Alto', desempenho: 'Baixo', cor: 'border-purple-300 bg-purple-50/40 dark:bg-purple-950/20 text-purple-700', colabs: [] },
      { id: 'q8', nome: 'Futuro Líder', potencia: 'Alto', desempenho: 'Médio', cor: 'border-indigo-300 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700', colabs: ['Felipe Santos'] },
      { id: 'q9', nome: 'Top Talent / Alto Potencial', potencia: 'Alto', desempenho: 'Alto', cor: 'border-orange-400 bg-orange-50/60 dark:bg-orange-950/30 text-orange-700 shadow-xs', colabs: ['Adriano Leal'] },
    ];
  }, []);

  const handleCreateCiclo = () => {
    if (!titulo.trim()) {
      toast.error('Informe o título do ciclo de avaliação.');
      return;
    }

    const novo: CicloAvaliacao = {
      id: `ciclo-${Date.now()}`,
      titulo: titulo.trim(),
      tipo,
      periodo,
      dataInicio,
      dataFim,
      totalParticipantes: colaboradores.length || 20,
      concluidas: 0,
      status: 'Planejado',
      mediaGeralNota: 0
    };

    addItem(novo);
    toast.success('Novo ciclo de avaliação de desempenho criado com sucesso!');
    setOpenModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Target className="w-5 h-5 text-orange-500" /> Avaliação de Desempenho & Matriz Nine Box
          </h3>
          <p className="text-xs text-muted-foreground">
            Gestão de ciclos de performance, competências corporativas, feedbacks 1-on-1 e mapeamento de talentos.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Novo Ciclo de Avaliação
        </Button>
      </div>

      {/* Sub Tabs */}
      <Tabs defaultValue="ciclos" value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <div className="border-b pb-1">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="ciclos" className="gap-2 text-xs font-medium">
              <Award className="w-3.5 h-3.5" /> Ciclos de Avaliação
            </TabsTrigger>
            <TabsTrigger value="ninebox" className="gap-2 text-xs font-medium">
              <TrendingUp className="w-3.5 h-3.5" /> Matriz Nine Box (9-Box)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="ciclos" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {ciclos.map(c => {
              const perc = c.totalParticipantes > 0 ? Math.round((c.concluidas / c.totalParticipantes) * 100) : 0;
              return (
                <Card key={c.id} className="rounded-2xl border shadow-xs bg-card hover:border-orange-500/40 transition-all flex flex-col justify-between overflow-hidden">
                  <CardHeader className="pb-3 border-b space-y-1.5 bg-muted/20">
                    <div className="flex justify-between items-start">
                      <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-400 bg-orange-50 dark:bg-orange-950/30">
                        {c.tipo}
                      </Badge>
                      <Badge className={`text-[10px] ${c.status === 'Em Andamento' ? 'bg-blue-600 text-white' : c.status === 'Encerrado' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                        {c.status}
                      </Badge>
                    </div>

                    <h4 className="font-bold text-sm text-foreground pt-1">{c.titulo}</h4>
                    <p className="text-xs text-muted-foreground font-medium">{c.periodo}</p>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-3 text-xs flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-muted-foreground">Aderência / Conclusão:</span>
                        <span className="font-bold text-foreground">{c.concluidas} de {c.totalParticipantes} ({perc}%)</span>
                      </div>

                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${perc}%` }} />
                      </div>

                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-muted-foreground">Vigência:</span>
                        <span className="font-medium text-foreground">{new Date(c.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')} até {new Date(c.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                      </div>

                      {c.mediaGeralNota > 0 && (
                        <div className="flex justify-between text-xs pt-1 border-t">
                          <span className="text-muted-foreground font-semibold">Nota Média Geral:</span>
                          <span className="font-extrabold text-orange-600 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-orange-500 text-orange-500" /> {c.mediaGeralNota.toFixed(1)} / 5.0
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-1.5 pt-3 border-t mt-2">
                      <Button size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1">
                        <MessageSquare className="w-3 h-3" /> Ver Resultados
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="ninebox" className="space-y-4 outline-none">
          <div className="p-4 bg-muted/20 border rounded-2xl">
            <div className="mb-4">
              <h4 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                <Target className="w-4 h-4 text-orange-500" /> Matriz Nine Box - Mapeamento de Potencial & Desempenho
              </h4>
              <p className="text-xs text-muted-foreground">
                Cruze a entrega de resultados no curto prazo com o potencial de crescimento e liderança de cada membro da organização.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 min-h-[420px]">
              {nineBoxQuadrantes.map(q => (
                <div key={q.id} className={`border rounded-2xl p-3 flex flex-col justify-between ${q.cor} transition-all`}>
                  <div>
                    <div className="flex justify-between items-start mb-1.5">
                      <span className="font-bold text-xs uppercase tracking-wider">{q.nome}</span>
                      <span className="text-[10px] opacity-75 font-mono">Pot: {q.potencia} | Des: {q.desempenho}</span>
                    </div>

                    <div className="space-y-1 mt-2">
                      {q.colabs.length === 0 ? (
                        <p className="text-[11px] opacity-50 italic">Nenhum colaborador alocado</p>
                      ) : (
                        q.colabs.map((c, i) => (
                          <Badge key={i} variant="secondary" className="text-[11px] mr-1 mb-1 font-semibold">
                            {c}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Criar Ciclo */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Target className="w-5 h-5 text-orange-500" /> Novo Ciclo de Avaliação
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título do Ciclo *</Label>
              <Input 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Avaliação 360° Semestral 2026.2"
                className="rounded-xl h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Metodologia</Label>
                <Select value={tipo} onValueChange={(v: any) => setTipo(v)}>
                  <SelectTrigger className="rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Avaliação 360°">Avaliação 360°</SelectItem>
                    <SelectItem value="Avaliação 90° (Gestor)">Avaliação 90° (Gestor)</SelectItem>
                    <SelectItem value="Avaliação de Experiência">Avaliação de Experiência</SelectItem>
                    <SelectItem value="Metas & OKRs Individuais">Metas & OKRs Individuais</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Período de Referência</Label>
                <Input 
                  value={periodo}
                  onChange={e => setPeriodo(e.target.value)}
                  placeholder="Ex: 2º Semestre 2026"
                  className="rounded-xl h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Data Início</Label>
                <Input 
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Data Limite de Resposta</Label>
                <Input 
                  type="date"
                  value={dataFim}
                  onChange={e => setDataFim(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreateCiclo} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
              Criar Ciclo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

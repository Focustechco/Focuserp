import React, { useState } from 'react';
import { Projeto, ProjetoEtapa } from '../types';
import { useProjetoDetalhesStore } from '../hooks/useProjetoDetalhesStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { 
  Calendar, 
  Plus, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Layers, 
  User, 
  Edit3, 
  TrendingUp 
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';

interface ProjetoCronogramaViewProps {
  projeto: Projeto;
}

export function ProjetoCronogramaView({ projeto }: ProjetoCronogramaViewProps) {
  const { etapas, addEtapa, updateEtapa, deleteEtapa } = useProjetoDetalhesStore(projeto.id);

  const [openModal, setOpenModal] = useState(false);
  const [nome, setNome] = useState('');
  const [fase, setFase] = useState<ProjetoEtapa['fase']>('Desenvolvimento Core');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [responsavel, setResponsavel] = useState(projeto.responsavelPrincipal || '');
  const [horasEstimadas, setHorasEstimadas] = useState('24');
  const [horasApontadas, setHorasApontadas] = useState('0');
  const [progresso, setProgresso] = useState(0);

  const totalHorasEstimadas = etapas.reduce((acc, e) => acc + (e.horasEstimadas || 0), 0);
  const totalHorasApontadas = etapas.reduce((acc, e) => acc + (e.horasApontadas || 0), 0);
  const progressoMedio = etapas.length > 0 ? Math.round(etapas.reduce((acc, e) => acc + e.progresso, 0) / etapas.length) : 0;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;

    addEtapa({
      nome,
      fase,
      dataInicio: dataInicio || new Date().toISOString().split('T')[0],
      dataFim: dataFim || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      responsavel: responsavel || projeto.responsavelPrincipal,
      horasEstimadas: parseInt(horasEstimadas) || 20,
      horasApontadas: parseInt(horasApontadas) || 0,
      progresso: progresso || 0,
      status: progresso === 100 ? 'Concluído' : progresso > 0 ? 'Em Andamento' : 'Não Iniciado',
    });

    setNome('');
    setDataInicio('');
    setDataFim('');
    setHorasEstimadas('24');
    setHorasApontadas('0');
    setProgresso(0);
    setOpenModal(false);
  };

  const getFaseColor = (fase: ProjetoEtapa['fase']) => {
    switch (fase) {
      case 'Planejamento': return 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20';
      case 'Design & UX': return 'bg-pink-500/10 text-pink-700 dark:text-pink-400 border-pink-500/20';
      case 'Desenvolvimento Core': return 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20';
      case 'Integrações & APIs': return 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border-indigo-500/20';
      case 'Testes & QA': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
      case 'Homologação': return 'bg-teal-500/10 text-teal-700 dark:text-teal-400 border-teal-500/20';
      case 'Go-Live': return 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner com Indicadores */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Progresso Médio</span>
              <div className="text-2xl font-bold text-foreground">{progressoMedio}%</div>
              <Progress value={progressoMedio} className="h-1.5 w-24" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center text-orange-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Total de Etapas</span>
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{etapas.length}</div>
              <p className="text-[11px] text-muted-foreground">{etapas.filter(e => e.status === 'Concluído').length} concluídas</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600">
              <Layers className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Horas Planejadas</span>
              <div className="text-2xl font-bold text-foreground">{totalHorasEstimadas}h</div>
              <p className="text-[11px] text-muted-foreground">Orçamento de esforço</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground font-medium">Horas Realizadas</span>
              <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{totalHorasApontadas}h</div>
              <p className="text-[11px] text-muted-foreground">Apontadas no time tracking</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Etapas do Cronograma */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" /> Cronograma & Fases do Projeto
            </CardTitle>
            <CardDescription className="text-xs">
              Mapeamento de sprints, etapas de desenvolvimento, prazos e horas dedicadas.
            </CardDescription>
          </div>

          <Dialog open={openModal} onOpenChange={setOpenModal}>
            <DialogTrigger asChild>
              <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer">
                <Plus className="w-3.5 h-3.5" /> Adicionar Etapa
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-orange-500" /> Nova Etapa do Cronograma
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
                <div className="space-y-1.5">
                  <Label className="font-semibold">Nome da Etapa / Tarefa *</Label>
                  <Input 
                    placeholder="Ex: Arquitetura de Banco & Modelagem de Dados" 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                    required 
                    className="rounded-xl h-9 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Fase do Projeto</Label>
                    <Select value={fase} onValueChange={(val: any) => setFase(val)}>
                      <SelectTrigger className="rounded-xl h-9 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Planejamento">Planejamento & Escopo</SelectItem>
                        <SelectItem value="Design & UX">Design & Protótipo UI/UX</SelectItem>
                        <SelectItem value="Desenvolvimento Core">Desenvolvimento Core</SelectItem>
                        <SelectItem value="Integrações & APIs">Integrações & APIs</SelectItem>
                        <SelectItem value="Testes & QA">Testes & Garantia de Qualidade</SelectItem>
                        <SelectItem value="Homologação">Homologação com Cliente</SelectItem>
                        <SelectItem value="Go-Live">Go-Live & Implantação</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="font-semibold">Responsável</Label>
                    <Input 
                      placeholder="Ex: Tech Lead / Dev" 
                      value={responsavel} 
                      onChange={e => setResponsavel(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Data de Início</Label>
                    <Input 
                      type="date" 
                      value={dataInicio} 
                      onChange={e => setDataInicio(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Data de Término</Label>
                    <Input 
                      type="date" 
                      value={dataFim} 
                      onChange={e => setDataFim(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Horas Estimadas</Label>
                    <Input 
                      type="number" 
                      value={horasEstimadas} 
                      onChange={e => setHorasEstimadas(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="font-semibold">Horas Apontadas</Label>
                    <Input 
                      type="number" 
                      value={horasApontadas} 
                      onChange={e => setHorasApontadas(e.target.value)} 
                      className="rounded-xl h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <Label className="font-semibold">Progresso Inicial</Label>
                    <span className="font-bold text-orange-600">{progresso}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={progresso} 
                    onChange={e => setProgresso(parseInt(e.target.value) || 0)} 
                    className="w-full accent-orange-600"
                  />
                </div>

                <DialogFooter className="pt-3">
                  <Button type="button" variant="outline" onClick={() => setOpenModal(false)} className="rounded-xl text-xs h-8">
                    Cancelar
                  </Button>
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-bold text-xs h-8">
                    Salvar Etapa
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="p-5">
          {etapas.length === 0 ? (
            <div className="text-center py-10 border-2 border-dashed rounded-2xl p-6">
              <Calendar className="w-10 h-10 text-muted-foreground/40 mx-auto mb-2" />
              <h4 className="font-bold text-sm text-foreground">Nenhuma etapa cadastrada no cronograma</h4>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Estruture as etapas do seu projeto para controlar prazos, horas e avanço das entregas.
              </p>
              <Button 
                onClick={() => setOpenModal(true)} 
                variant="outline" 
                size="sm" 
                className="mt-4 rounded-xl text-xs gap-1.5 font-semibold text-orange-600 border-orange-200 hover:bg-orange-50 dark:hover:bg-orange-950/20"
              >
                <Plus className="w-3.5 h-3.5" /> Adicionar Primeira Etapa
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {etapas.map((etapa) => (
                <div 
                  key={etapa.id} 
                  className="p-4 rounded-2xl border bg-card hover:border-orange-500/40 transition-all shadow-2xs space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <Badge className={getFaseColor(etapa.fase)}>
                        {etapa.fase}
                      </Badge>
                      <h4 className="text-sm font-bold text-foreground">{etapa.nome}</h4>
                    </div>

                    <div className="flex items-center gap-2">
                      <Select 
                        value={etapa.status} 
                        onValueChange={(status: any) => updateEtapa(etapa.id, { 
                          status, 
                          progresso: status === 'Concluído' ? 100 : status === 'Não Iniciado' ? 0 : etapa.progresso 
                        })}
                      >
                        <SelectTrigger className="h-7 text-[11px] rounded-lg w-[140px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Não Iniciado">Não Iniciado</SelectItem>
                          <SelectItem value="Em Andamento">Em Andamento</SelectItem>
                          <SelectItem value="Concluído">Concluído</SelectItem>
                          <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                        </SelectContent>
                      </Select>

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deleteEtapa(etapa.id)}
                        className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive rounded-lg cursor-pointer"
                        title="Excluir etapa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Barra de Progresso e Métricas */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center pt-1 text-xs">
                    <div className="space-y-1">
                      <div className="flex justify-between text-[11px] text-muted-foreground">
                        <span>Progresso da Etapa</span>
                        <span className="font-bold text-foreground">{etapa.progresso}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={etapa.progresso} 
                        onChange={e => {
                          const val = parseInt(e.target.value) || 0;
                          updateEtapa(etapa.id, { 
                            progresso: val,
                            status: val === 100 ? 'Concluído' : val > 0 ? 'Em Andamento' : 'Não Iniciado'
                          });
                        }} 
                        className="w-full accent-orange-600 h-1.5 cursor-pointer"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      <span>Horas: <strong>{etapa.horasApontadas}h</strong> apontadas de <strong>{etapa.horasEstimadas}h</strong></span>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 text-[11px] text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-orange-500" /> {etapa.responsavel}
                      </span>
                      <span>
                        {new Date(etapa.dataInicio).toLocaleDateString('pt-BR')} até {new Date(etapa.dataFim).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

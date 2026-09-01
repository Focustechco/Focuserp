import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, UserMinus, CheckCircle2, Clock, Plus, 
  ArrowRight, ShieldCheck, Laptop, FileText 
} from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { toast } from 'sonner';

export interface ProcessoAdmissao {
  id: string;
  candidatoNome: string;
  cargo: string;
  departamento: string;
  dataPrevistaInicio: string;
  etapa: 'Documentação' | 'Exame Admissional' | 'Assinatura de Contrato' | 'Setup & Equipamentos' | 'Concluído';
  mentorResponsavel: string;
  checklists: { item: string; concluido: boolean }[];
}

const INITIAL_PROCESSOS: ProcessoAdmissao[] = [];

export function RhOnboardingView() {
  const { colaboradores } = useColaboradoresQuery();
  const { data: processos = INITIAL_PROCESSOS, addItem, updateItem } = useLocalStorageState<ProcessoAdmissao>('focus_rh_onboarding', INITIAL_PROCESSOS);

  const [activeTab, setActiveTab] = useState<'onboarding' | 'offboarding'>('onboarding');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [candidatoNome, setCandidatoNome] = useState('');
  const [cargo, setCargo] = useState('');
  const [departamento, setDepartamento] = useState('Tecnologia');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [mentor, setMentor] = useState(colaboradores[0]?.nomeCompleto || '');

  const handleToggleCheck = (processoId: string, itemIdx: number) => {
    const proc = processos.find(p => p.id === processoId);
    if (!proc) return;

    const newChecks = [...proc.checklists];
    newChecks[itemIdx].concluido = !newChecks[itemIdx].concluido;

    const todosConcluidos = newChecks.every(c => c.concluido);
    const novaEtapa = todosConcluidos ? 'Concluído' : proc.etapa;

    updateItem(processoId, {
      checklists: newChecks,
      etapa: novaEtapa
    });
  };

  const handleAdvanceEtapa = (processoId: string) => {
    const proc = processos.find(p => p.id === processoId);
    if (!proc) return;

    const etapas: ProcessoAdmissao['etapa'][] = [
      'Documentação', 'Exame Admissional', 'Assinatura de Contrato', 'Setup & Equipamentos', 'Concluído'
    ];

    const idx = etapas.indexOf(proc.etapa);
    if (idx < etapas.length - 1) {
      const nextEtapa = etapas[idx + 1];
      updateItem(processoId, { etapa: nextEtapa });
      toast.success(`Etapa avançada para: ${nextEtapa}`);
    }
  };

  const handleCreate = () => {
    if (!candidatoNome.trim() || !cargo.trim()) {
      toast.error('Preencha o nome do novo colaborador e o cargo.');
      return;
    }

    const novo: ProcessoAdmissao = {
      id: `onb-${Date.now()}`,
      candidatoNome: candidatoNome.trim(),
      cargo: cargo.trim(),
      departamento,
      dataPrevistaInicio: dataInicio,
      etapa: 'Documentação',
      mentorResponsavel: mentor,
      checklists: [
        { item: 'Coleta de Documentos Pessoais (RG, CPF, Comprovante)', concluido: false },
        { item: 'Exame Médico Admissional (ASO)', concluido: false },
        { item: 'Emissão e Assinatura do Contrato de Trabalho', concluido: false },
        { item: 'Criação de Contas de Acesso e E-mail Corporativo', concluido: false },
        { item: 'Entrega de Computador e Periféricos', concluido: false },
        { item: 'Reunião de Boas-Vindas & Integração com o Time', concluido: false }
      ]
    };

    addItem(novo);
    toast.success(`Pipeline de onboarding criado para ${novo.candidatoNome}!`);
    setOpenModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <UserPlus className="w-5 h-5 text-orange-500" /> Admissão, Onboarding & Offboarding
          </h3>
          <p className="text-xs text-muted-foreground">
            Acompanhe a jornada de novos talentos, checklists de integração, entrega de patrimônio e desligamentos estruturados.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Iniciar Onboarding
        </Button>
      </div>

      {/* Sub-abas */}
      <Tabs defaultValue="onboarding" value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="space-y-4">
        <div className="border-b pb-1">
          <TabsList className="bg-muted/60 p-1">
            <TabsTrigger value="onboarding" className="gap-2 text-xs font-medium">
              <UserPlus className="w-3.5 h-3.5" /> Pipeline de Admissão & Integração
            </TabsTrigger>
            <TabsTrigger value="offboarding" className="gap-2 text-xs font-medium">
              <UserMinus className="w-3.5 h-3.5" /> Processos de Desligamento (Offboarding)
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="onboarding" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {processos.map(p => {
              const concluidos = p.checklists.filter(c => c.concluido).length;
              const total = p.checklists.length;
              const perc = total > 0 ? Math.round((concluidos / total) * 100) : 0;

              return (
                <Card key={p.id} className="rounded-2xl border shadow-xs bg-card hover:border-orange-500/40 transition-all flex flex-col justify-between overflow-hidden">
                  <CardHeader className="pb-3 border-b space-y-2 bg-muted/20">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-sm text-foreground">{p.candidatoNome}</h4>
                        <p className="text-xs text-muted-foreground">{p.cargo} • <strong>{p.departamento}</strong></p>
                      </div>
                      <Badge className={`text-[10px] ${p.etapa === 'Concluído' ? 'bg-emerald-600 text-white' : 'bg-orange-600 text-white'}`}>
                        {p.etapa}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
                      <span>Data de Início: <strong>{new Date(p.dataPrevistaInicio + 'T00:00:00').toLocaleDateString('pt-BR')}</strong></span>
                      <span>Mentor: <strong>{p.mentorResponsavel}</strong></span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-3 text-xs flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between text-xs mb-1.5 font-semibold">
                        <span className="text-muted-foreground">Progresso do Onboarding:</span>
                        <span className="text-orange-600">{concluidos} de {total} itens ({perc}%)</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-3 overflow-hidden">
                        <div className="bg-orange-500 h-2 rounded-full transition-all" style={{ width: `${perc}%` }} />
                      </div>

                      <div className="space-y-1.5 border rounded-xl p-2.5 bg-muted/20">
                        {p.checklists.map((c, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Checkbox 
                              checked={c.concluido} 
                              onCheckedChange={() => handleToggleCheck(p.id, i)} 
                              id={`chk-${p.id}-${i}`}
                            />
                            <label htmlFor={`chk-${p.id}-${i}`} className={`text-xs cursor-pointer ${c.concluido ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                              {c.item}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 pt-3 border-t mt-2">
                      {p.etapa !== 'Concluído' && (
                        <Button 
                          size="sm" 
                          onClick={() => handleAdvanceEtapa(p.id)}
                          className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1"
                        >
                          <ArrowRight className="w-3 h-3" /> Avançar Etapa
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="offboarding" className="space-y-4 outline-none">
          <div className="border rounded-2xl p-8 text-center bg-card text-muted-foreground text-xs space-y-2">
            <UserMinus className="w-8 h-8 mx-auto opacity-30 text-rose-500" />
            <p className="font-semibold text-foreground text-sm">Nenhum processo de desligamento ativo</p>
            <p className="text-muted-foreground max-w-md mx-auto">
              Quando houver um processo rescisório, o checklist de devolução de equipamentos, revogação de acessos e entrevista de desligamento aparecerá aqui.
            </p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Iniciar Onboarding */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <UserPlus className="w-5 h-5 text-orange-500" /> Iniciar Onboarding de Novo Colaborador
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Nome Completo do Contratado *</Label>
              <Input 
                value={candidatoNome}
                onChange={e => setCandidatoNome(e.target.value)}
                placeholder="Ex: Gabriel Tavares"
                className="rounded-xl h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Cargo *</Label>
                <Input 
                  value={cargo}
                  onChange={e => setCargo(e.target.value)}
                  placeholder="Ex: Engenheiro de Software"
                  className="rounded-xl h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Departamento</Label>
                <Select value={departamento} onValueChange={setDepartamento}>
                  <SelectTrigger className="rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Tecnologia">Tecnologia & Produto</SelectItem>
                    <SelectItem value="Comercial">Comercial & Vendas</SelectItem>
                    <SelectItem value="Customer Success">Customer Success</SelectItem>
                    <SelectItem value="Financeiro">Financeiro & Controladoria</SelectItem>
                    <SelectItem value="Marketing">Marketing</SelectItem>
                    <SelectItem value="Operações">Operações / RH</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Data Prevista de Início</Label>
                <Input 
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Mentor / Líder Responsável</Label>
                <Input 
                  value={mentor}
                  onChange={e => setMentor(e.target.value)}
                  placeholder="Ex: Adriano Leal"
                  className="rounded-xl h-9"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
              Criar Onboarding
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

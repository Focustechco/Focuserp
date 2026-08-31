import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Clock, Calendar, CheckCircle2, AlertCircle, Plus, 
  Search, Users, ArrowUpRight, ArrowDownRight, FileSpreadsheet 
} from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { toast } from 'sonner';

export interface RegistroPonto {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  departamento: string;
  data: string;
  entrada1: string;
  saida1: string;
  entrada2: string;
  saida2: string;
  totalHorasTrabalhadas: string;
  saldoBancoHorasMinutos: number; // positivo = crédito, negativo = débito
  ocorrencia: 'Normal' | 'Horas Extras' | 'Atraso' | 'Falta Justificada (Atestado)' | 'Folga Compensatória';
}

const INITIAL_REGISTROS_PONTO: RegistroPonto[] = [
  {
    id: 'pt-1',
    colaboradorId: 'colab-1',
    colaboradorNome: 'Adriano Leal',
    departamento: 'Diretoria / Tecnologia',
    data: new Date().toISOString().split('T')[0],
    entrada1: '09:00',
    saida1: '12:00',
    entrada2: '13:00',
    saida2: '18:00',
    totalHorasTrabalhadas: '08:00',
    saldoBancoHorasMinutos: 0,
    ocorrencia: 'Normal'
  },
  {
    id: 'pt-2',
    colaboradorId: 'colab-2',
    colaboradorNome: 'Mariana Souza',
    departamento: 'Comercial',
    data: new Date().toISOString().split('T')[0],
    entrada1: '08:45',
    saida1: '12:00',
    entrada2: '13:00',
    saida2: '18:45',
    totalHorasTrabalhadas: '09:00',
    saldoBancoHorasMinutos: 60,
    ocorrencia: 'Horas Extras'
  },
  {
    id: 'pt-3',
    colaboradorId: 'colab-3',
    colaboradorNome: 'Lucas Rodrigues',
    departamento: 'Engenharia',
    data: new Date().toISOString().split('T')[0],
    entrada1: '09:15',
    saida1: '12:00',
    entrada2: '13:00',
    saida2: '18:00',
    totalHorasTrabalhadas: '07:45',
    saldoBancoHorasMinutos: -15,
    ocorrencia: 'Atraso'
  }
];

export function RhPontoFrequenciaView() {
  const { colaboradores } = useColaboradoresQuery();
  const { data: registros = INITIAL_REGISTROS_PONTO, addItem } = useLocalStorageState<RegistroPonto>('focus_rh_pontos', INITIAL_REGISTROS_PONTO);

  const [searchTerm, setSearchTerm] = useState('');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [colaboradorId, setColaboradorId] = useState(colaboradores[0]?.id || '');
  const [dataPonto, setDataPonto] = useState(new Date().toISOString().split('T')[0]);
  const [entrada1, setEntrada1] = useState('09:00');
  const [saida1, setSaida1] = useState('12:00');
  const [entrada2, setEntrada2] = useState('13:00');
  const [saida2, setSaida2] = useState('18:00');
  const [ocorrencia, setOcorrencia] = useState<RegistroPonto['ocorrencia']>('Normal');

  const filteredRegistros = useMemo(() => {
    return registros.filter(r => 
      r.colaboradorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.departamento.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [registros, searchTerm]);

  const handleCreate = () => {
    const colab = colaboradores.find(c => c.id === colaboradorId) || colaboradores[0];
    if (!colab) {
      toast.error('Selecione um colaborador.');
      return;
    }

    const novo: RegistroPonto = {
      id: `pt-${Date.now()}`,
      colaboradorId: colab.id,
      colaboradorNome: colab.nomeCompleto || colab.nomeSocial || 'Colaborador',
      departamento: colab.departamento || 'Geral',
      data: dataPonto,
      entrada1,
      saida1,
      entrada2,
      saida2,
      totalHorasTrabalhadas: '08:00',
      saldoBancoHorasMinutos: 0,
      ocorrencia
    };

    addItem(novo);
    toast.success(`Registro de ponto lançado para ${novo.colaboradorNome}!`);
    setOpenModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Clock className="w-5 h-5 text-orange-500" /> Ponto Eletrônico, Frequência & Banco de Horas
          </h3>
          <p className="text-xs text-muted-foreground">
            Controle diário de jornadas, espelho de ponto digital, apuração de horas extras e compensações.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Ajustar / Lançar Ponto
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Assiduidade Hoje</CardTitle>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">100%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Nenhuma ausência injustificada</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Saldo Geral Banco de Horas</CardTitle>
            <ArrowUpRight className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">+45h 30min</div>
            <p className="text-[11px] text-muted-foreground mt-1">Crédito acumulado na equipe</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Horas Extras no Mês</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">18h 45min</div>
            <p className="text-[11px] text-muted-foreground mt-1">Aprovadas para compensação / folha</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Atestados Médicos</CardTitle>
            <FileSpreadsheet className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">1</div>
            <p className="text-[11px] text-muted-foreground mt-1">Atestado validado no período</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Busca */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/20 p-3 rounded-2xl border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar colaborador ou departamento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs rounded-xl"
          />
        </div>
      </div>

      {/* Tabela de Registros de Ponto */}
      <div className="border rounded-2xl overflow-hidden bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3.5">Colaborador / Depto</th>
                <th className="p-3.5">Data</th>
                <th className="p-3.5 text-center">Entrada 1</th>
                <th className="p-3.5 text-center">Saída Almoço</th>
                <th className="p-3.5 text-center">Retorno</th>
                <th className="p-3.5 text-center">Saída 2</th>
                <th className="p-3.5 text-center">Total Horas</th>
                <th className="p-3.5 text-center">Ocorrência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredRegistros.map(r => (
                <tr key={r.id} className="hover:bg-muted/30 transition-colors">
                  <td className="p-3.5 font-semibold text-foreground">
                    <p className="font-bold">{r.colaboradorNome}</p>
                    <p className="text-[10px] text-muted-foreground">{r.departamento}</p>
                  </td>
                  <td className="p-3.5 text-muted-foreground font-medium">{new Date(r.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                  <td className="p-3.5 text-center font-mono font-semibold">{r.entrada1}</td>
                  <td className="p-3.5 text-center font-mono text-muted-foreground">{r.saida1}</td>
                  <td className="p-3.5 text-center font-mono text-muted-foreground">{r.entrada2}</td>
                  <td className="p-3.5 text-center font-mono font-semibold">{r.saida2}</td>
                  <td className="p-3.5 text-center font-bold text-foreground">{r.totalHorasTrabalhadas}</td>
                  <td className="p-3.5 text-center">
                    <Badge className={`text-[10px] ${
                      r.ocorrencia === 'Normal' ? 'bg-emerald-600 text-white' :
                      r.ocorrencia === 'Horas Extras' ? 'bg-blue-600 text-white' :
                      'bg-amber-500 text-white'
                    }`}>
                      {r.ocorrencia}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Lançar Ponto */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Clock className="w-5 h-5 text-orange-500" /> Lançar / Ajustar Ponto Eletrônico
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Colaborador *</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nomeCompleto || c.nomeSocial} ({c.cargo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Data do Registro</Label>
              <Input 
                type="date"
                value={dataPonto}
                onChange={e => setDataPonto(e.target.value)}
                className="rounded-xl h-9"
              />
            </div>

            <div className="grid grid-cols-4 gap-2">
              <div className="space-y-1.5">
                <Label className="font-semibold text-[11px]">Entrada</Label>
                <Input value={entrada1} onChange={e => setEntrada1(e.target.value)} className="rounded-xl h-9 text-center font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-[11px]">Almoço</Label>
                <Input value={saida1} onChange={e => setSaida1(e.target.value)} className="rounded-xl h-9 text-center font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-[11px]">Retorno</Label>
                <Input value={entrada2} onChange={e => setEntrada2(e.target.value)} className="rounded-xl h-9 text-center font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold text-[11px]">Saída</Label>
                <Input value={saida2} onChange={e => setSaida2(e.target.value)} className="rounded-xl h-9 text-center font-mono" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Tipo de Ocorrência</Label>
              <Select value={ocorrencia} onValueChange={(v: any) => setOcorrencia(v)}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal (Jornada Padrão)</SelectItem>
                  <SelectItem value="Horas Extras">Horas Extras</SelectItem>
                  <SelectItem value="Atraso">Atraso / Saída Antecipada</SelectItem>
                  <SelectItem value="Falta Justificada (Atestado)">Falta Justificada (Atestado)</SelectItem>
                  <SelectItem value="Folga Compensatória">Folga Compensatória</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
              Salvar Registro
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Palmtree, Calendar, AlertTriangle, CheckCircle2, Clock, 
  Plus, Search, User, Check, X, ShieldAlert 
} from 'lucide-react';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { toast } from 'sonner';

export interface SolicitacaoFerias {
  id: string;
  colaboradorId: string;
  colaboradorNome: string;
  departamento: string;
  periodoAquisitivo: string;
  dataInicio: string;
  dataFim: string;
  dias: number;
  adiantamento13: boolean;
  venderDias: boolean; // Abono pecuniário (10 dias)
  status: 'Aprovada' | 'Pendente' | 'Em Gozo' | 'Concluída' | 'Cancelada';
  observacoes?: string;
  solicitadoEm: string;
}

const INITIAL_FERIAS: SolicitacaoFerias[] = [
  {
    id: 'fer-1',
    colaboradorId: 'colab-1',
    colaboradorNome: 'Adriano Leal',
    departamento: 'Diretoria / Tecnologia',
    periodoAquisitivo: '2025/2026',
    dataInicio: '2026-09-15',
    dataFim: '2026-09-30',
    dias: 15,
    adiantamento13: true,
    venderDias: false,
    status: 'Aprovada',
    observacoes: 'Férias regulares programadas.',
    solicitadoEm: '2026-08-01'
  },
  {
    id: 'fer-2',
    colaboradorId: 'colab-2',
    colaboradorNome: 'Mariana Souza',
    departamento: 'Comercial',
    periodoAquisitivo: '2024/2025',
    dataInicio: '2026-10-01',
    dataFim: '2026-10-20',
    dias: 20,
    adiantamento13: false,
    venderDias: true,
    status: 'Pendente',
    observacoes: 'Solicitação de 20 dias + 10 dias de abono pecuniário.',
    solicitadoEm: '2026-08-20'
  },
  {
    id: 'fer-3',
    colaboradorId: 'colab-3',
    colaboradorNome: 'Lucas Rodrigues',
    departamento: 'Engenharia',
    periodoAquisitivo: '2024/2025',
    dataInicio: '2026-08-10',
    dataFim: '2026-08-25',
    dias: 15,
    adiantamento13: false,
    venderDias: false,
    status: 'Concluída',
    observacoes: 'Gozo concluído sem pendências.',
    solicitadoEm: '2026-07-05'
  }
];

export function RhFeriasView() {
  const { colaboradores } = useColaboradoresQuery();
  const { data: solicitacoes = INITIAL_FERIAS, addItem, updateItem, removeItem } = useLocalStorageState<SolicitacaoFerias>('focus_rh_ferias', INITIAL_FERIAS);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Todos');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [colaboradorId, setColaboradorId] = useState(colaboradores[0]?.id || '');
  const [dataInicio, setDataInicio] = useState(new Date().toISOString().split('T')[0]);
  const [dias, setDias] = useState('30');
  const [periodoAquisitivo, setPeriodoAquisitivo] = useState('2025/2026');
  const [adiantamento13, setAdiantamento13] = useState(false);
  const [venderDias, setVenderDias] = useState(false);
  const [observacoes, setObservacoes] = useState('');

  // Resumo de Indicadores
  const emGozo = solicitacoes.filter(s => s.status === 'Em Gozo').length;
  const pendentes = solicitacoes.filter(s => s.status === 'Pendente').length;
  const programadas = solicitacoes.filter(s => s.status === 'Aprovada').length;

  const filteredSolicitacoes = useMemo(() => {
    return solicitacoes.filter(s => {
      const matchSearch = 
        (s.colaboradorNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.departamento || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'Todos' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [solicitacoes, searchTerm, statusFilter]);

  const handleCreate = () => {
    const colab = colaboradores.find(c => c.id === colaboradorId) || colaboradores[0];
    if (!colab) {
      toast.error('Selecione um colaborador.');
      return;
    }

    const numDias = parseInt(dias) || 30;
    const start = new Date(dataInicio);
    const end = new Date(start);
    end.setDate(end.getDate() + numDias - 1);

    const nova: SolicitacaoFerias = {
      id: `fer-${Date.now()}`,
      colaboradorId: colab.id,
      colaboradorNome: colab.nomeCompleto || colab.nomeSocial || 'Colaborador',
      departamento: colab.departamento || 'Geral',
      periodoAquisitivo,
      dataInicio,
      dataFim: end.toISOString().split('T')[0],
      dias: numDias,
      adiantamento13,
      venderDias,
      status: 'Aprovada',
      observacoes,
      solicitadoEm: new Date().toISOString().split('T')[0]
    };

    addItem(nova);
    toast.success(`Férias programadas para ${nova.colaboradorNome}!`);
    setOpenModal(false);
  };

  const handleUpdateStatus = (id: string, newStatus: SolicitacaoFerias['status']) => {
    updateItem(id, { status: newStatus });
    toast.success(`Status atualizado para: ${newStatus}`);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Palmtree className="w-5 h-5 text-orange-500" /> Gestão de Férias & Ausências
          </h3>
          <p className="text-xs text-muted-foreground">
            Controle de períodos aquisitivos, programação de descansos, abonos pecuniários e histórico de gozo.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Programar Férias
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Em Gozo de Férias</CardTitle>
            <Palmtree className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{emGozo}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Colaborador(es) ausentes hoje</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Férias Programadas</CardTitle>
            <Calendar className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{programadas}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Aprovadas para os próximos meses</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Solicitações Pendentes</CardTitle>
            <Clock className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendentes}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Aguardando aprovação de gestor</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Alerta de Vencimento</CardTitle>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">0</div>
            <p className="text-[11px] text-muted-foreground mt-1">Nenhum período no dobro (conforme CLT)</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/20 p-3 rounded-2xl border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por colaborador ou departamento..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs rounded-xl w-36">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todos os Status</SelectItem>
              <SelectItem value="Aprovada">Aprovada</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Em Gozo">Em Gozo</SelectItem>
              <SelectItem value="Concluída">Concluída</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tabela de Programações */}
      <div className="border rounded-2xl overflow-hidden bg-card shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase font-semibold text-[10px]">
              <tr>
                <th className="p-3.5">Colaborador / Depto</th>
                <th className="p-3.5">Período Aquisitivo</th>
                <th className="p-3.5">Data Início</th>
                <th className="p-3.5">Data Retorno</th>
                <th className="p-3.5 text-center">Dias</th>
                <th className="p-3.5 text-center">Abono (Venda)</th>
                <th className="p-3.5 text-center">Status</th>
                <th className="p-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSolicitacoes.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-muted-foreground">
                    Nenhum registro de férias encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSolicitacoes.map(item => (
                  <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="p-3.5 font-semibold text-foreground">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-orange-500/10 text-orange-600 font-bold flex items-center justify-center text-[10px]">
                          {(item.colaboradorNome || 'C').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{item.colaboradorNome}</p>
                          <p className="text-[10px] text-muted-foreground">{item.departamento}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-muted-foreground font-mono">{item.periodoAquisitivo}</td>
                    <td className="p-3.5 font-medium">{new Date(item.dataInicio + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-3.5 font-medium">{new Date(item.dataFim + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td className="p-3.5 text-center font-bold">{item.dias} dias</td>
                    <td className="p-3.5 text-center">
                      <Badge variant="outline" className={`text-[10px] ${item.venderDias ? 'bg-amber-50 text-amber-700 border-amber-300' : 'bg-muted text-muted-foreground'}`}>
                        {item.venderDias ? 'Sim (10d)' : 'Não'}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-center">
                      <Badge className={`text-[10px] ${
                        item.status === 'Em Gozo' ? 'bg-emerald-600 text-white' :
                        item.status === 'Aprovada' ? 'bg-blue-600 text-white' :
                        item.status === 'Pendente' ? 'bg-amber-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {item.status}
                      </Badge>
                    </td>
                    <td className="p-3.5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {item.status === 'Pendente' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs"
                            onClick={() => handleUpdateStatus(item.id, 'Aprovada')}
                          >
                            <Check className="w-3.5 h-3.5 mr-1" /> Aprovar
                          </Button>
                        )}
                        {item.status === 'Aprovada' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-xs"
                            onClick={() => handleUpdateStatus(item.id, 'Em Gozo')}
                          >
                            Iniciar Gozo
                          </Button>
                        )}
                        {item.status === 'Em Gozo' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 px-2 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-xs"
                            onClick={() => handleUpdateStatus(item.id, 'Concluída')}
                          >
                            Concluir
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Programar Férias */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Palmtree className="w-5 h-5 text-orange-500" /> Programar Férias
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Colaborador *</Label>
              <Select value={colaboradorId} onValueChange={setColaboradorId}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue placeholder="Selecione o colaborador" />
                </SelectTrigger>
                <SelectContent>
                  {colaboradores.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nomeCompleto || c.nomeSocial} ({c.cargo || c.departamento})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Data de Início *</Label>
                <Input 
                  type="date"
                  value={dataInicio}
                  onChange={e => setDataInicio(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Quantidade de Dias *</Label>
                <Select value={dias} onValueChange={setDias}>
                  <SelectTrigger className="rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="30">30 dias (Integral)</SelectItem>
                    <SelectItem value="20">20 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="10">10 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Período Aquisitivo</Label>
              <Input 
                value={periodoAquisitivo}
                onChange={e => setPeriodoAquisitivo(e.target.value)}
                placeholder="Ex: 2025/2026"
                className="rounded-xl h-9"
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Abono Pecuniário (Venda de 10 dias)</p>
                  <p className="text-[11px] text-muted-foreground">Converter 1/3 das férias em remuneração financeira.</p>
                </div>
                <Switch checked={venderDias} onCheckedChange={setVenderDias} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold text-foreground">Adiantamento de 13º Salário</p>
                  <p className="text-[11px] text-muted-foreground">Adiantar a 1ª parcela do décimo terceiro junto às férias.</p>
                </div>
                <Switch checked={adiantamento13} onCheckedChange={setAdiantamento13} />
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <Label className="font-semibold">Observações Internas</Label>
              <Input 
                value={observacoes}
                onChange={e => setObservacoes(e.target.value)}
                placeholder="Ex: Alinhado com a liderança da equipe."
                className="rounded-xl h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
              Salvar Programação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

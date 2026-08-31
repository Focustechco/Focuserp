import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  GraduationCap, BookOpen, Award, CheckCircle2, Clock, 
  Plus, Search, Users, Sparkles, ExternalLink, Play 
} from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { toast } from 'sonner';

export interface CursoTreinamento {
  id: string;
  titulo: string;
  categoria: 'Compliance & Segurança' | 'Liderança & Gestão' | 'Técnico & Engenharia' | 'Comercial & Vendas' | 'Atendimento & CS';
  cargaHorariaHoras: number;
  obrigatorio: boolean;
  totalMatriculados: number;
  concluidos: number;
  instrutorOuPlataforma: string;
  status: 'Disponível' | 'Em Andamento' | 'Concluído';
}

const INITIAL_TREINAMENTOS: CursoTreinamento[] = [
  {
    id: 'tr-1',
    titulo: 'Segurança da Informação & Diretrizes LGPD 2026',
    categoria: 'Compliance & Segurança',
    cargaHorariaHoras: 4,
    obrigatorio: true,
    totalMatriculados: 22,
    concluidos: 20,
    instrutorOuPlataforma: 'Focus Academy / Jurídico',
    status: 'Disponível'
  },
  {
    id: 'tr-2',
    titulo: 'Arquitetura de Microsserviços & Cloud Native',
    categoria: 'Técnico & Engenharia',
    cargaHorariaHoras: 16,
    obrigatorio: false,
    totalMatriculados: 8,
    concluidos: 6,
    instrutorOuPlataforma: 'Plataforma Alura Corporate',
    status: 'Em Andamento'
  },
  {
    id: 'tr-3',
    titulo: 'Metodologia de Vendas B2B & Negociação SPIN Selling',
    categoria: 'Comercial & Vendas',
    cargaHorariaHoras: 8,
    obrigatorio: true,
    totalMatriculados: 7,
    concluidos: 7,
    instrutorOuPlataforma: 'Focus Academy Comercial',
    status: 'Concluído'
  },
  {
    id: 'tr-4',
    titulo: 'Liderança Humanizada & Gestão de Pessoas 4.0',
    categoria: 'Liderança & Gestão',
    cargaHorariaHoras: 12,
    obrigatorio: false,
    totalMatriculados: 6,
    concluidos: 4,
    instrutorOuPlataforma: 'Consultoria Externa de Liderança',
    status: 'Disponível'
  }
];

export function RhTreinamentosView() {
  const { colaboradores } = useColaboradoresQuery();
  const { data: treinamentos = INITIAL_TREINAMENTOS, addItem, updateItem, removeItem } = useLocalStorageState<CursoTreinamento>('focus_rh_treinamentos', INITIAL_TREINAMENTOS);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');
  const [openModal, setOpenModal] = useState(false);

  // Form State
  const [titulo, setTitulo] = useState('');
  const [categoria, setCategoria] = useState<CursoTreinamento['categoria']>('Compliance & Segurança');
  const [cargaHoraria, setCargaHoraria] = useState('8');
  const [instrutor, setInstrutor] = useState('Focus Academy');
  const [obrigatorio, setObrigatorio] = useState(false);

  // Indicadores
  const totalHorasTreinamento = useMemo(() => {
    return treinamentos.reduce((acc, t) => acc + (t.cargaHorariaHoras * t.concluidos), 0);
  }, [treinamentos]);

  const totalCertificadosEmitidos = useMemo(() => {
    return treinamentos.reduce((acc, t) => acc + t.concluidos, 0);
  }, [treinamentos]);

  const filteredTreinamentos = useMemo(() => {
    return treinamentos.filter(t => {
      const matchSearch = 
        t.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.instrutorOuPlataforma.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = categoriaFilter === 'Todas' || t.categoria === categoriaFilter;
      return matchSearch && matchCat;
    });
  }, [treinamentos, searchTerm, categoriaFilter]);

  const handleCreate = () => {
    if (!titulo.trim()) {
      toast.error('Informe o título do treinamento.');
      return;
    }

    const novo: CursoTreinamento = {
      id: `tr-${Date.now()}`,
      titulo: titulo.trim(),
      categoria,
      cargaHorariaHoras: parseInt(cargaHoraria) || 8,
      obrigatorio,
      totalMatriculados: colaboradores.length || 10,
      concluidos: 0,
      instrutorOuPlataforma: instrutor.trim() || 'Focus Academy',
      status: 'Disponível'
    };

    addItem(novo);
    toast.success('Novo curso/treinamento adicionado à trilha corporativa!');
    setOpenModal(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <GraduationCap className="w-5 h-5 text-orange-500" /> Treinamento, Educação & Desenvolvimento (L&D)
          </h3>
          <p className="text-xs text-muted-foreground">
            Catálogo de cursos institucionais, capacitação contínua, horas de treinamento e certificações.
          </p>
        </div>

        <Button 
          onClick={() => setOpenModal(true)} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Treinamento
        </Button>
      </div>

      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Horas de Treinamento</CardTitle>
            <Clock className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{totalHorasTreinamento}h</div>
            <p className="text-[11px] text-muted-foreground mt-1">Horas dedicadas a capacitação</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Certificações Emitidas</CardTitle>
            <Award className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{totalCertificadosEmitidos}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Conclusões com aproveitamento</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Cursos no Catálogo</CardTitle>
            <BookOpen className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{treinamentos.length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Trilhas de aprendizagem disponíveis</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Média de Conclusão</CardTitle>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">89.4%</div>
            <p className="text-[11px] text-muted-foreground mt-1">Engajamento nos módulos obrigatórios</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/20 p-3 rounded-2xl border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por treinamento ou instrutor..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9 h-8 text-xs rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
            <SelectTrigger className="h-8 text-xs rounded-xl w-48">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas as Categorias</SelectItem>
              <SelectItem value="Compliance & Segurança">Compliance & Segurança</SelectItem>
              <SelectItem value="Liderança & Gestão">Liderança & Gestão</SelectItem>
              <SelectItem value="Técnico & Engenharia">Técnico & Engenharia</SelectItem>
              <SelectItem value="Comercial & Vendas">Comercial & Vendas</SelectItem>
              <SelectItem value="Atendimento & CS">Atendimento & CS</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de Treinamentos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTreinamentos.map(t => {
          const perc = t.totalMatriculados > 0 ? Math.round((t.concluidos / t.totalMatriculados) * 100) : 0;
          return (
            <Card key={t.id} className="rounded-2xl border shadow-xs bg-card hover:border-orange-500/40 transition-all flex flex-col justify-between overflow-hidden">
              <CardHeader className="pb-3 border-b space-y-1.5 bg-muted/20">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-400 bg-orange-50 dark:bg-orange-950/30">
                      {t.categoria}
                    </Badge>
                    {t.obrigatorio && (
                      <Badge className="bg-rose-600 text-white text-[10px]">Obrigatório</Badge>
                    )}
                  </div>
                  <Badge className={`text-[10px] ${t.status === 'Disponível' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}`}>
                    {t.status}
                  </Badge>
                </div>

                <h4 className="font-bold text-sm text-foreground pt-1">{t.titulo}</h4>
                <p className="text-xs text-muted-foreground">Plataforma: <strong>{t.instrutorOuPlataforma}</strong></p>
              </CardHeader>

              <CardContent className="space-y-3 pt-3 text-xs flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Carga Horária:</span>
                    <span className="font-bold text-foreground">{t.cargaHorariaHoras} horas</span>
                  </div>

                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Taxa de Conclusão:</span>
                    <span className="font-bold text-emerald-600">{t.concluidos} de {t.totalMatriculados} ({perc}%)</span>
                  </div>

                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${perc}%` }} />
                  </div>
                </div>

                <div className="flex justify-end gap-1.5 pt-3 border-t mt-2">
                  <Button size="sm" variant="outline" className="h-7 text-xs gap-1">
                    <Users className="w-3 h-3" /> Ver Matriculados
                  </Button>
                  <Button size="sm" className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1">
                    <Play className="w-3 h-3" /> Iniciar Módulo
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Adicionar Treinamento */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <GraduationCap className="w-5 h-5 text-orange-500" /> Cadastrar Treinamento
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Título do Curso / Treinamento *</Label>
              <Input 
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Treinamento de Onboarding & Cultura"
                className="rounded-xl h-9"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="font-semibold">Categoria</Label>
                <Select value={categoria} onValueChange={(v: any) => setCategoria(v)}>
                  <SelectTrigger className="rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Compliance & Segurança">Compliance & Segurança</SelectItem>
                    <SelectItem value="Liderança & Gestão">Liderança & Gestão</SelectItem>
                    <SelectItem value="Técnico & Engenharia">Técnico & Engenharia</SelectItem>
                    <SelectItem value="Comercial & Vendas">Comercial & Vendas</SelectItem>
                    <SelectItem value="Atendimento & CS">Atendimento & CS</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Carga Horária (Horas)</Label>
                <Input 
                  type="number"
                  value={cargaHoraria}
                  onChange={e => setCargaHoraria(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Instrutor ou Plataforma</Label>
              <Input 
                value={instrutor}
                onChange={e => setInstrutor(e.target.value)}
                placeholder="Ex: Alura, Focus Academy, Consultor Especialista"
                className="rounded-xl h-9"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
              Salvar Curso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

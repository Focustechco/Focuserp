import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Heart, Shield, Plus, Search, Edit3, Trash2, CheckCircle2, 
  DollarSign, Users, Gift, Building2, Coffee 
} from 'lucide-react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';
import { toast } from 'sonner';

export interface PlanoBeneficio {
  id: string;
  nome: string;
  categoria: 'Saúde & Odonto' | 'Alimentação & Refeição' | 'Mobilidade & Transporte' | 'Bem-Estar & Educação' | 'Segurança Financeira';
  operadora: string;
  valorMensalTotal: number;
  custoEmpresaR$: number;
  descontoColaboradorR$: number;
  totalVidas: number;
  obrigatorio: boolean;
  status: 'Ativo' | 'Em Negociação' | 'Inativo';
}

const INITIAL_BENEFICIOS: PlanoBeneficio[] = [];

const formatCurrency = (val?: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
};

export function RhBeneficiosView() {
  const { colaboradores } = useColaboradoresQuery();
  const { data: beneficios = INITIAL_BENEFICIOS, addItem, updateItem, removeItem } = useLocalStorageState<PlanoBeneficio>('focus_rh_beneficios', INITIAL_BENEFICIOS);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('Todas');
  const [openModal, setOpenModal] = useState(false);
  const [editingBen, setEditingBen] = useState<PlanoBeneficio | null>(null);

  // Form State
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState<PlanoBeneficio['categoria']>('Alimentação & Refeição');
  const [operadora, setOperadora] = useState('');
  const [valorMensalTotal, setValorMensalTotal] = useState('800');
  const [custoEmpresa, setCustoEmpresa] = useState('750');
  const [descontoColaborador, setDescontoColaborador] = useState('50');
  const [totalVidas, setTotalVidas] = useState('15');
  const [status, setStatus] = useState<PlanoBeneficio['status']>('Ativo');

  // Cálculos consolidados
  const totalCustoMensalEmpresa = useMemo(() => {
    return beneficios.reduce((acc, b) => acc + (b.custoEmpresaR$ * b.totalVidas), 0);
  }, [beneficios]);

  const totalVidasCobertas = useMemo(() => {
    return Math.max(...beneficios.map(b => b.totalVidas), colaboradores.length || 20);
  }, [beneficios, colaboradores]);

  const filteredBeneficios = useMemo(() => {
    return beneficios.filter(b => {
      const matchSearch = 
        b.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.operadora.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategoria = categoriaFilter === 'Todas' || b.categoria === categoriaFilter;
      return matchSearch && matchCategoria;
    });
  }, [beneficios, searchTerm, categoriaFilter]);

  const handleOpenCreate = () => {
    setEditingBen(null);
    setNome('');
    setCategoria('Alimentação & Refeição');
    setOperadora('');
    setValorMensalTotal('800');
    setCustoEmpresa('750');
    setDescontoColaborador('50');
    setTotalVidas(String(colaboradores.length || 15));
    setStatus('Ativo');
    setOpenModal(true);
  };

  const handleOpenEdit = (b: PlanoBeneficio) => {
    setEditingBen(b);
    setNome(b.nome);
    setCategoria(b.categoria);
    setOperadora(b.operadora);
    setValorMensalTotal(String(b.valorMensalTotal));
    setCustoEmpresa(String(b.custoEmpresaR$));
    setDescontoColaborador(String(b.descontoColaboradorR$));
    setTotalVidas(String(b.totalVidas));
    setStatus(b.status);
    setOpenModal(true);
  };

  const handleSave = () => {
    if (!nome.trim() || !operadora.trim()) {
      toast.error('Preencha o nome do benefício e a operadora.');
      return;
    }

    const payload: PlanoBeneficio = {
      id: editingBen ? editingBen.id : `ben-${Date.now()}`,
      nome: nome.trim(),
      categoria,
      operadora: operadora.trim(),
      valorMensalTotal: parseFloat(valorMensalTotal) || 0,
      custoEmpresaR$: parseFloat(custoEmpresa) || 0,
      descontoColaboradorR$: parseFloat(descontoColaborador) || 0,
      totalVidas: parseInt(totalVidas) || 1,
      obrigatorio: false,
      status
    };

    if (editingBen) {
      updateItem(editingBen.id, payload);
      toast.success('Benefício atualizado com sucesso!');
    } else {
      addItem(payload);
      toast.success('Novo benefício corporativo cadastrado!');
    }

    setOpenModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja remover este benefício?')) {
      removeItem(id);
      toast.success('Benefício removido.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Heart className="w-5 h-5 text-orange-500" /> Benefícios Corporativos & Qualidade de Vida
          </h3>
          <p className="text-xs text-muted-foreground">
            Gestão de planos de saúde, odontológicos, auxílios flexíveis, seguros e apuração de custos em folha.
          </p>
        </div>

        <Button 
          onClick={handleOpenCreate} 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> Adicionar Benefício
        </Button>
      </div>

      {/* Cards de Indicadores de Custos */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Investimento Mensal (Empresa)</CardTitle>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCustoMensalEmpresa)}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Custo consolidado pago pela organização</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Planos Ativos</CardTitle>
            <Shield className="w-4 h-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{beneficios.filter(b => b.status === 'Ativo').length}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Programas vigentes contratados</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Vidas Cobertas</CardTitle>
            <Users className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalVidasCobertas}</div>
            <p className="text-[11px] text-muted-foreground mt-1">Colaboradores ativos beneficiados</p>
          </CardContent>
        </Card>

        <Card className="border shadow-xs bg-card">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-xs font-semibold text-muted-foreground">Média por Colaborador</CardTitle>
            <Gift className="w-4 h-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatCurrency(totalVidasCobertas > 0 ? totalCustoMensalEmpresa / totalVidasCobertas : 0)}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">Pacote médio de benefícios / vida</p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-muted/20 p-3 rounded-2xl border">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Buscar por benefício ou operadora..."
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
              <SelectItem value="Saúde & Odonto">Saúde & Odonto</SelectItem>
              <SelectItem value="Alimentação & Refeição">Alimentação & Refeição</SelectItem>
              <SelectItem value="Mobilidade & Transporte">Mobilidade & Transporte</SelectItem>
              <SelectItem value="Bem-Estar & Educação">Bem-Estar & Educação</SelectItem>
              <SelectItem value="Segurança Financeira">Segurança Financeira</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid de Benefícios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {filteredBeneficios.map(b => (
          <Card key={b.id} className="rounded-2xl border shadow-xs bg-card hover:border-orange-500/40 transition-all flex flex-col justify-between overflow-hidden">
            <CardHeader className="pb-3 border-b space-y-1.5 bg-muted/20">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-[10px] text-orange-600 border-orange-400 bg-orange-50 dark:bg-orange-950/30">
                  {b.categoria}
                </Badge>
                <Badge className={`text-[10px] ${b.status === 'Ativo' ? 'bg-emerald-600 text-white' : 'bg-muted text-muted-foreground'}`}>
                  {b.status}
                </Badge>
              </div>

              <h4 className="font-bold text-sm text-foreground leading-tight pt-1">{b.nome}</h4>
              <p className="text-xs text-muted-foreground">{b.operadora}</p>
            </CardHeader>

            <CardContent className="space-y-3 pt-3 text-xs flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2 text-center p-2 rounded-xl bg-muted/40">
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">Custo Empresa</span>
                    <span className="font-bold text-emerald-600">{formatCurrency(b.custoEmpresaR$)} /mês</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block font-semibold">Desconto Colab</span>
                    <span className="font-bold text-foreground">{formatCurrency(b.descontoColaboradorR$)} /mês</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs pt-1">
                  <span className="text-muted-foreground">Beneficiários Ativos:</span>
                  <span className="font-bold text-blue-600">{b.totalVidas} colaboradores</span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Custo Total Mensal:</span>
                  <span className="font-bold text-foreground">{formatCurrency(b.custoEmpresaR$ * b.totalVidas)}</span>
                </div>
              </div>

              <div className="flex justify-end gap-1.5 pt-3 border-t mt-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleOpenEdit(b)}
                  className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Edit3 className="w-3 h-3" /> Editar
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => handleDelete(b.id)}
                  className="h-7 px-2 text-xs gap-1 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                >
                  <Trash2 className="w-3 h-3" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Modal Criar / Editar Benefício */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Heart className="w-5 h-5 text-orange-500" /> {editingBen ? 'Editar Benefício' : 'Novo Benefício Corporativo'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-semibold">Nome do Benefício *</Label>
              <Input 
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Ex: Flash Benefícios Refeição/Alimentação"
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
                    <SelectItem value="Saúde & Odonto">Saúde & Odonto</SelectItem>
                    <SelectItem value="Alimentação & Refeição">Alimentação & Refeição</SelectItem>
                    <SelectItem value="Mobilidade & Transporte">Mobilidade & Transporte</SelectItem>
                    <SelectItem value="Bem-Estar & Educação">Bem-Estar & Educação</SelectItem>
                    <SelectItem value="Segurança Financeira">Segurança Financeira</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="font-semibold">Operadora / Fornecedor *</Label>
                <Input 
                  value={operadora}
                  onChange={e => setOperadora(e.target.value)}
                  placeholder="Ex: Bradesco, Flash, Caju"
                  className="rounded-xl h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <Label className="font-semibold">Custo Empresa (R$)</Label>
                <Input 
                  type="number"
                  value={custoEmpresa}
                  onChange={e => setCustoEmpresa(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Desconto Colab (R$)</Label>
                <Input 
                  type="number"
                  value={descontoColaborador}
                  onChange={e => setDescontoColaborador(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="font-semibold">Total Vidas</Label>
                <Input 
                  type="number"
                  value={totalVidas}
                  onChange={e => setTotalVidas(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="font-semibold">Status do Contrato</Label>
              <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                <SelectTrigger className="rounded-xl h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Em Negociação">Em Negociação</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setOpenModal(false)} className="rounded-xl">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSave} className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl">
              Salvar Benefício
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Package,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Search,
  AlertCircle,
  MapPin,
  Tag,
  User,
  SlidersHorizontal,
  Trash2,
  ClipboardList,
  Boxes,
  LayoutList,
  LayoutGrid,
  DollarSign,
  Building2,
  Calendar,
  CheckCircle2,
  Receipt,
  FileText,
  Tv,
  BookOpen,
  Coffee,
  Sparkles,
  Layers,
  Edit,
  ShieldCheck,
  Radio,
  Armchair,
  Eye,
  Info
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { CentroCusto } from '@/features/centro-de-custos/types';
import { INITIAL_CENTROS } from '@/features/centro-de-custos/data/initialData';
import { CategoriaFinanceira } from '@/features/plano-contas/types';
import { INITIAL_CATEGORIAS } from '@/features/plano-contas/mockData';
import { EstoqueItem, EstadoConservacaoItem } from '../types';
import { InventarioView } from './InventarioView';
import { toast } from 'sonner';

export const CATEGORIAS_ESCRITORIO = [
  'Smart Devices & Alexa',
  'Audiovisual & TV',
  'Livros & Treinamento',
  'Cozinha & Convivência',
  'Mobiliário & Escritório',
  'Decoração & Conforto',
  'Acessórios & Papelaria',
  'Outros',
];

export const ESTADOS_CONSERVACAO: EstadoConservacaoItem[] = [
  'Novo',
  'Excelente',
  'Bom',
  'Desgastado',
  'Danificado',
  'Em Manutenção',
];

export const SALAS_LOCAIS_SUGERIDOS = [
  'Sala de Reunião Principal',
  'Sala de Apresentações',
  'Recepção',
  'Copa / Cozinha',
  'Biblioteca Focus',
  'Sala da Diretoria',
  'Espaço Convivência',
  'Sala de Brainstorming',
  'Armário Multiuso',
  'Estação de Trabalho Geral',
];

export function EstoqueView() {
  const { 
    estoqueItens, 
    addEstoqueItem, 
    updateEstoqueItem,
    ajustarEstoqueItemComFinanceiro, 
    deleteEstoqueItem 
  } = useEstoquePatrimonio();

  const { data: clientes = [] } = useLocalStorageState<any>('focus_clientes', []);
  const { data: fornecedores = [] } = useLocalStorageState<any>('focus_fornecedores', []);
  const { data: centrosCusto = [] } = useLocalStorageState<CentroCusto>('focus_centro_custos', INITIAL_CENTROS);
  const { data: planoContas = [] } = useLocalStorageState<CategoriaFinanceira>('focus_plano_contas', INITIAL_CATEGORIAS);

  const [subTab, setSubTab] = useState<'itens' | 'inventario'>('itens');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');
  const [estadoFilter, setEstadoFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isNovoItemOpen, setIsNovoItemOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isMovimentarOpen, setIsMovimentarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);

  // Form: Novo / Editar Item
  const [itemForm, setItemForm] = useState<{
    id?: string;
    codigo: string;
    nome: string;
    descricao: string;
    categoria: string;
    quantidade: number;
    quantidadeMinima: number;
    estadoConservacao: EstadoConservacaoItem;
    localizacao: string;
    status: 'Disponível' | 'Reservado' | 'Em Uso' | 'Emprestado' | 'Manutenção' | 'Baixado';
    valorUnitario: number;
    responsavelNome: string;
    observacoes: string;
  }>({
    codigo: '',
    nome: '',
    descricao: '',
    categoria: 'Smart Devices & Alexa',
    quantidade: 1,
    quantidadeMinima: 1,
    estadoConservacao: 'Excelente',
    localizacao: 'Sala de Reunião Principal',
    status: 'Em Uso',
    valorUnitario: 0,
    responsavelNome: '',
    observacoes: '',
  });

  // Form: Movimentar (Entrada / Saída / Ajuste) com Financeiro
  const [movForm, setMovForm] = useState({
    tipo: 'Entrada' as 'Entrada' | 'Saída' | 'Ajuste',
    quantidade: 1,
    motivo: 'Compra / Reposição de Itens do Escritório',
    gerarFinanceiro: false,
    valorUnitario: 0,
    valorTotal: 0,
    entidadeNome: '',
    vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    formaPagamento: 'PIX',
    finalidadeSaida: 'interno' as 'venda' | 'interno',
    centroCustoId: '',
    centroCustoNome: 'Administrativo & Escritório',
    categoriaFinanceira: 'Material de Escritório & Bens',
  });

  const filteredItens = estoqueItens.filter((item) => {
    if (!item || (!item.nome && !item.codigo)) return false;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (item.nome || '').toLowerCase().includes(search) ||
      (item.codigo || '').toLowerCase().includes(search) ||
      (item.descricao || '').toLowerCase().includes(search) ||
      (item.localizacao || '').toLowerCase().includes(search) ||
      (item.responsavelNome || '').toLowerCase().includes(search);
    
    const matchesCat = categoriaFilter === 'todos' || item.categoria === categoriaFilter;
    const matchesEstado = estadoFilter === 'todos' || item.estadoConservacao === estadoFilter;
    
    return matchesSearch && matchesCat && matchesEstado;
  });

  const categoriasUnicas = Array.from(new Set([
    ...CATEGORIAS_ESCRITORIO,
    ...estoqueItens.map((i) => i.categoria).filter(Boolean)
  ]));

  const totalUnidades = estoqueItens.reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0);
  const totalValorEstimado = estoqueItens.reduce((acc, i) => acc + ((Number(i.quantidade) || 0) * (Number(i.valorUnitario) || 0)), 0);

  const handleOpenNovo = () => {
    const nextCode = `ESC-${String(estoqueItens.length + 1).padStart(3, '0')}`;
    setItemForm({
      codigo: nextCode,
      nome: '',
      descricao: '',
      categoria: 'Smart Devices & Alexa',
      quantidade: 1,
      quantidadeMinima: 1,
      estadoConservacao: 'Excelente',
      localizacao: 'Sala de Reunião Principal',
      status: 'Em Uso',
      valorUnitario: 0,
      responsavelNome: 'Equipe Operações',
      observacoes: '',
    });
    setIsNovoItemOpen(true);
  };

  const handleOpenEdit = (item: EstoqueItem) => {
    setSelectedItem(item);
    setItemForm({
      id: item.id,
      codigo: item.codigo,
      nome: item.nome,
      descricao: item.descricao || '',
      categoria: item.categoria,
      quantidade: Number(item.quantidade) || 0,
      quantidadeMinima: Number(item.quantidadeMinima) || 1,
      estadoConservacao: item.estadoConservacao || 'Bom',
      localizacao: item.localizacao || 'Sala de Reunião Principal',
      status: item.status || 'Disponível',
      valorUnitario: Number(item.valorUnitario) || 0,
      responsavelNome: item.responsavelNome || '',
      observacoes: item.observacoes || '',
    });
    setIsEditOpen(true);
  };

  const handleSaveNovo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemForm.nome) {
      toast.error('Informe o título do item');
      return;
    }

    const newItem: EstoqueItem = {
      id: 'esc-' + Date.now(),
      codigo: itemForm.codigo || `ESC-${Math.floor(100 + Math.random() * 900)}`,
      nome: itemForm.nome,
      descricao: itemForm.descricao,
      categoria: itemForm.categoria,
      quantidade: Number(itemForm.quantidade) || 1,
      quantidadeMinima: Number(itemForm.quantidadeMinima) || 1,
      estadoConservacao: itemForm.estadoConservacao,
      localizacao: itemForm.localizacao,
      status: itemForm.status,
      valorUnitario: Number(itemForm.valorUnitario) || 0,
      responsavelNome: itemForm.responsavelNome,
      observacoes: itemForm.observacoes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addEstoqueItem(newItem);
    setIsNovoItemOpen(false);
    toast.success(`Item "${newItem.nome}" cadastrado com sucesso!`);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !itemForm.nome) return;

    const updated: EstoqueItem = {
      ...selectedItem,
      codigo: itemForm.codigo,
      nome: itemForm.nome,
      descricao: itemForm.descricao,
      categoria: itemForm.categoria,
      quantidade: Number(itemForm.quantidade) || 0,
      quantidadeMinima: Number(itemForm.quantidadeMinima) || 1,
      estadoConservacao: itemForm.estadoConservacao,
      localizacao: itemForm.localizacao,
      status: itemForm.status,
      valorUnitario: Number(itemForm.valorUnitario) || 0,
      responsavelNome: itemForm.responsavelNome,
      observacoes: itemForm.observacoes,
      updatedAt: new Date().toISOString(),
    };

    updateEstoqueItem(updated);
    setIsEditOpen(false);
    setSelectedItem(null);
    toast.success(`Item "${updated.nome}" atualizado com sucesso!`);
  };

  const handleOpenAjuste = (item: EstoqueItem, tipo: 'Entrada' | 'Saída') => {
    setSelectedItem(item);
    const vlrUnit = Number(item.valorUnitario) || 0;
    setMovForm({
      tipo,
      quantidade: 1,
      motivo: tipo === 'Entrada' ? 'Compra / Reposição de unidades' : 'Baixa de uso / Realocação interna',
      gerarFinanceiro: false,
      valorUnitario: vlrUnit,
      valorTotal: vlrUnit * 1,
      entidadeNome: fornecedores.length > 0 ? (fornecedores[0].nomeFantasia || fornecedores[0].razaoSocial) : 'Fornecedor de Escritório',
      vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      formaPagamento: 'PIX',
      finalidadeSaida: 'interno',
      centroCustoId: '',
      centroCustoNome: 'Administrativo & Escritório',
      categoriaFinanceira: 'Material de Escritório & Bens',
    });
    setIsMovimentarOpen(true);
  };

  const handleMovimentar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qtd = Number(movForm.quantidade) || 1;
    const vlrTot = Number(movForm.valorTotal) || (qtd * (Number(movForm.valorUnitario) || 0));
    const shouldGenFinancial = movForm.gerarFinanceiro;

    const selectedCc = centrosCusto.find(c => c.id === movForm.centroCustoId || c.nome === movForm.centroCustoNome);
    const ccNomeFinal = selectedCc ? selectedCc.nome : (movForm.centroCustoNome || 'Administrativo & Escritório');
    const ccIdFinal = selectedCc ? selectedCc.id : movForm.centroCustoId;

    ajustarEstoqueItemComFinanceiro({
      itemId: selectedItem.id,
      quantidadeMudanca: qtd,
      tipoOperacao: movForm.tipo,
      motivo: movForm.motivo,
      gerarFinanceiro: shouldGenFinancial,
      valorTotal: vlrTot,
      entidadeNome: movForm.entidadeNome,
      vencimento: movForm.vencimento,
      formaPagamento: movForm.formaPagamento,
      centroCustoId: ccIdFinal,
      centroCustoNome: ccNomeFinal,
      categoria: movForm.categoriaFinanceira,
    });

    if (shouldGenFinancial) {
      if (movForm.tipo === 'Entrada') {
        toast.success(`Entrada de ${qtd} un registrada! Despesa de R$ ${vlrTot.toFixed(2)} em Contas a Pagar.`);
      } else {
        toast.success(`Saída de ${qtd} un registrada! Recebimento de R$ ${vlrTot.toFixed(2)} em Contas a Receber.`);
      }
    } else {
      toast.success(`Unidades ajustadas com sucesso (${movForm.tipo}: ${qtd} un)!`);
    }

    setIsMovimentarOpen(false);
    setSelectedItem(null);
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Smart Devices & Alexa':
        return <Radio className="h-3.5 w-3.5 text-sky-600 dark:text-sky-400" />;
      case 'Audiovisual & TV':
        return <Tv className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />;
      case 'Livros & Treinamento':
        return <BookOpen className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />;
      case 'Cozinha & Convivência':
        return <Coffee className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />;
      case 'Mobiliário & Escritório':
        return <Armchair className="h-3.5 w-3.5 text-indigo-600 dark:text-indigo-400" />;
      default:
        return <Package className="h-3.5 w-3.5 text-slate-600 dark:text-slate-400" />;
    }
  };

  const getEstadoBadge = (estado?: EstadoConservacaoItem) => {
    switch (estado) {
      case 'Novo':
        return <Badge className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30">Novo</Badge>;
      case 'Excelente':
        return <Badge className="text-[10px] bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30">Excelente</Badge>;
      case 'Bom':
        return <Badge className="text-[10px] bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30">Bom</Badge>;
      case 'Desgastado':
        return <Badge className="text-[10px] bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30">Desgastado</Badge>;
      case 'Danificado':
      case 'Em Manutenção':
        return <Badge variant="destructive" className="text-[10px] gap-1"><AlertCircle className="w-3 h-3" /> {estado}</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Bom</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Package className="h-6 w-6 text-orange-600" />
            <h2 className="text-xl font-bold tracking-tight text-foreground">Itens e Bens do Escritório</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Organização, controle de unidades, estado de conservação e localização dos itens do escritório (livros, Alexa, TVs, cafeteira, etc. — computadores estão no módulo Equipamentos).
          </p>
        </div>

        {/* KPIs RESUMIDOS */}
        <div className="flex items-center gap-3">
          <div className="bg-muted/50 border rounded-lg px-3 py-1.5 text-right">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Total de Itens</span>
            <span className="text-sm font-bold text-foreground">{estoqueItens.length} cadastrados ({totalUnidades} un)</span>
          </div>
          <div className="bg-muted/50 border rounded-lg px-3 py-1.5 text-right hidden md:block">
            <span className="text-[10px] uppercase font-semibold text-muted-foreground block">Valor Estimado</span>
            <span className="text-sm font-bold text-orange-600">R$ {totalValorEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* SUB-NAVEGAÇÃO */}
      <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={subTab === 'itens' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('itens')}
            className={`text-xs gap-1.5 ${subTab === 'itens' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
          >
            <Package className="h-4 w-4" /> Itens do Escritório ({filteredItens.length})
          </Button>
          <Button
            variant={subTab === 'inventario' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('inventario')}
            className={`text-xs gap-1.5 ${subTab === 'inventario' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
          >
            <ClipboardList className="h-4 w-4" /> Conferência & Auditoria Física
          </Button>
        </div>

        {subTab === 'itens' && (
          <Button
            size="sm"
            onClick={handleOpenNovo}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white gap-1.5 font-semibold shadow-xs"
          >
            <Plus className="h-4 w-4" /> Novo Item do Escritório
          </Button>
        )}
      </div>

      {subTab === 'inventario' ? (
        <InventarioView />
      ) : (
        <>
          {/* BARRA DE FILTROS E BUSCA */}
          <Card className="p-3 bg-card border shadow-2xs">
            <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por título, descrição, categoria, sala..."
                    className="pl-8 text-xs h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

                {/* Filtro por Categoria */}
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="w-[180px] text-xs h-9">
                    <SelectValue placeholder="Todas Categorias" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="todos">Todas Categorias</SelectItem>
                    {categoriasUnicas.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtro por Estado de Conservação */}
                <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                  <SelectTrigger className="w-[160px] text-xs h-9">
                    <SelectValue placeholder="Todos os Estados" />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="todos">Todos os Estados</SelectItem>
                    {ESTADOS_CONSERVACAO.map((est) => (
                      <SelectItem key={est} value={est}>
                        Estado: {est}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Botões de Visualização */}
              <div className="flex items-center border rounded-md p-0.5 bg-muted/40 shrink-0">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-2 text-xs gap-1"
                  onClick={() => setViewMode('table')}
                  title="Visualização em Tabela"
                >
                  <LayoutList className="h-3.5 w-3.5" /> Tabela
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-2 text-xs gap-1"
                  onClick={() => setViewMode('cards')}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="h-3.5 w-3.5 text-orange-600" /> Cards
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* VISUALIZAÇÃO: CARDS OU TABELA */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItens.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground text-xs border rounded-xl bg-card">
                  <Package className="w-8 h-8 opacity-30 mx-auto mb-2" />
                  <p className="font-semibold text-foreground text-sm">Nenhum item do escritório encontrado</p>
                  <p className="text-xs text-muted-foreground mt-1">Experimente ajustar os filtros ou cadastrar um novo item.</p>
                </div>
              ) : (
                filteredItens.map((item) => {
                  return (
                    <Card key={item.id} className="rounded-xl border shadow-xs hover:border-orange-500/40 hover:shadow-md transition-all bg-card flex flex-col justify-between">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="text-[10px] font-mono text-orange-600 font-bold tracking-wide uppercase block">
                              {item.codigo}
                            </span>
                            <h4 className="font-bold text-sm text-foreground leading-snug mt-0.5 line-clamp-2">
                              {item.nome}
                            </h4>
                          </div>
                          {getEstadoBadge(item.estadoConservacao)}
                        </div>

                        {item.descricao && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                            {item.descricao}
                          </p>
                        )}
                      </CardHeader>

                      <CardContent className="p-4 pt-2 space-y-2.5 text-xs flex-1">
                        <div className="space-y-1.5 bg-muted/30 p-2.5 rounded-lg border text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Categoria:</span>
                            <span className="font-medium text-foreground flex items-center gap-1">
                              {getCategoryIcon(item.categoria)} {item.categoria}
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Unidades:</span>
                            <span className="font-bold text-xs text-foreground bg-background px-1.5 py-0.5 rounded border">
                              {item.quantidade} unidade(s)
                            </span>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Localização / Sala:</span>
                            <span className="font-medium text-foreground flex items-center gap-1 truncate max-w-[150px]">
                              <MapPin className="h-3 w-3 text-orange-600 shrink-0" /> {item.localizacao}
                            </span>
                          </div>

                          {item.responsavelNome && (
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Responsável:</span>
                              <span className="font-medium text-foreground flex items-center gap-1 truncate max-w-[140px]">
                                <User className="h-3 w-3 text-slate-500 shrink-0" /> {item.responsavelNome}
                              </span>
                            </div>
                          )}

                          {item.valorUnitario ? (
                            <div className="flex justify-between items-center pt-0.5 border-t border-border/50">
                              <span className="text-muted-foreground">Valor Estimado:</span>
                              <span className="font-semibold text-foreground">
                                R$ {item.valorUnitario.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ) : null}
                        </div>

                        <div className="flex items-center justify-between pt-0.5">
                          <span className="text-muted-foreground text-[11px]">Status:</span>
                          <Badge variant="outline" className="text-[10px] border-border text-foreground font-medium">
                            {item.status || 'Disponível'}
                          </Badge>
                        </div>
                      </CardContent>

                      <div className="p-3 border-t bg-muted/20 flex items-center justify-between rounded-b-xl gap-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAjuste(item, 'Entrada')}
                            className="h-7 text-[11px] px-2 gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20"
                            title="Adicionar Unidades"
                          >
                            <ArrowDownLeft className="h-3 w-3" /> +Qtd
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenAjuste(item, 'Saída')}
                            className="h-7 text-[11px] px-2 gap-1 text-amber-600 hover:text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20"
                            title="Baixa de Unidades"
                          >
                            <ArrowUpRight className="h-3 w-3" /> -Qtd
                          </Button>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(item)}
                            className="h-7 w-7 text-muted-foreground hover:text-primary"
                            title="Editar item"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              deleteEstoqueItem(item.id);
                              toast.success(`Item "${item.nome}" excluído!`);
                            }}
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            title="Excluir item"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <Card>
              <CardHeader className="py-4 border-b">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <CardTitle className="text-sm font-semibold">Itens e Bens do Escritório ({filteredItens.length})</CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Catálogo centralizado de bens, livros, eletrônicos e móveis de escritório
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    Total: {totalUnidades} unidades físicas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Código / Título do Item</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs text-center">Unidades</TableHead>
                      <TableHead className="text-xs">Estado de Conservação</TableHead>
                      <TableHead className="text-xs">Localização / Sala</TableHead>
                      <TableHead className="text-xs">Responsável</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-10 text-xs text-muted-foreground">
                          Nenhum item do escritório encontrado com os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItens.map((item) => {
                        return (
                          <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                            {/* TÍTULO / CÓDIGO / DESCRIÇÃO */}
                            <TableCell className="max-w-[280px]">
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-foreground leading-snug">{item.nome}</span>
                                <span className="text-[10px] font-mono text-orange-600 font-bold">{item.codigo}</span>
                                {item.descricao && (
                                  <span className="text-[11px] text-muted-foreground truncate mt-0.5" title={item.descricao}>
                                    {item.descricao}
                                  </span>
                                )}
                              </div>
                            </TableCell>

                            {/* CATEGORIA */}
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className="text-[10px] gap-1 font-normal">
                                {getCategoryIcon(item.categoria)} {item.categoria}
                              </Badge>
                            </TableCell>

                            {/* UNIDADES */}
                            <TableCell className="text-center font-bold text-xs">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-muted border">
                                {item.quantidade} un
                              </span>
                            </TableCell>

                            {/* ESTADO DE CONSERVAÇÃO */}
                            <TableCell className="text-xs">
                              {getEstadoBadge(item.estadoConservacao)}
                            </TableCell>

                            {/* LOCALIZAÇÃO */}
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 text-orange-600 shrink-0" />
                                <span className="font-medium text-foreground truncate">{item.localizacao}</span>
                              </div>
                            </TableCell>

                            {/* RESPONSÁVEL */}
                            <TableCell className="text-xs">
                              <span className="text-muted-foreground text-[11px]">
                                {item.responsavelNome || '—'}
                              </span>
                            </TableCell>

                            {/* STATUS */}
                            <TableCell className="text-xs">
                              <Badge variant="outline" className="text-[10px]">
                                {item.status || 'Disponível'}
                              </Badge>
                            </TableCell>

                            {/* AÇÕES */}
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenAjuste(item, 'Entrada')}
                                  className="h-7 text-[11px] px-2 gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20"
                                  title="Adicionar Unidades"
                                >
                                  <ArrowDownLeft className="h-3 w-3" /> +Qtd
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleOpenEdit(item)}
                                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                                  title="Editar item"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    deleteEstoqueItem(item.id);
                                    toast.success(`Item "${item.nome}" excluído!`);
                                  }}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  title="Excluir item"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* MODAL: NOVO ITEM DO ESCRITÓRIO */}
      <Dialog open={isNovoItemOpen} onOpenChange={setIsNovoItemOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveNovo}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-orange-600" />
                <DialogTitle className="text-base">Novo Item do Escritório</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Cadastre livros, Alexa, televisores, cafeteiras, mobiliário ou outros bens do escritório.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3 text-xs">
              {/* CÓDIGO E TÍTULO */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Código *</Label>
                  <Input
                    required
                    placeholder="ESC-001"
                    value={itemForm.codigo}
                    onChange={(e) => setItemForm({ ...itemForm, codigo: e.target.value })}
                    className="text-xs h-8 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs font-semibold">Título / Nome do Item *</Label>
                  <Input
                    required
                    placeholder="Ex: Amazon Echo Dot (Alexa), Smart TV 55', Livro Clean Code"
                    value={itemForm.nome}
                    onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* DESCRIÇÃO DETALHADA */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Descrição / Detalhes</Label>
                <Textarea
                  placeholder="Ex: Dispositivo de som inteligente para reuniões e avisos; modelo, edição ou finalidade..."
                  value={itemForm.descricao}
                  onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
                  className="text-xs min-h-[60px] resize-none"
                />
              </div>

              {/* CATEGORIA E ESTADO DE CONSERVAÇÃO */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Categoria *</Label>
                  <Select
                    value={itemForm.categoria}
                    onValueChange={(val) => setItemForm({ ...itemForm, categoria: val })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {CATEGORIAS_ESCRITORIO.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estado de Conservação *</Label>
                  <Select
                    value={itemForm.estadoConservacao}
                    onValueChange={(val: EstadoConservacaoItem) => setItemForm({ ...itemForm, estadoConservacao: val })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {ESTADOS_CONSERVACAO.map((est) => (
                        <SelectItem key={est} value={est}>
                          {est}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* UNIDADES E VALOR ESTIMADO */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Unidades (Quantidade) *</Label>
                  <Input
                    type="number"
                    min="1"
                    required
                    value={itemForm.quantidade}
                    onChange={(e) => setItemForm({ ...itemForm, quantidade: Number(e.target.value) || 1 })}
                    className="text-xs h-8 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Valor Estimado / Unitário (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={itemForm.valorUnitario}
                    onChange={(e) => setItemForm({ ...itemForm, valorUnitario: Number(e.target.value) })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* LOCALIZAÇÃO / SALA */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Localização / Sala *</Label>
                <div className="flex gap-2">
                  <Input
                    required
                    placeholder="Ex: Sala de Reunião Principal, Copa / Cozinha, Biblioteca..."
                    value={itemForm.localizacao}
                    onChange={(e) => setItemForm({ ...itemForm, localizacao: e.target.value })}
                    className="text-xs h-8 flex-1"
                  />
                  <Select
                    value=""
                    onValueChange={(val) => {
                      if (val) setItemForm({ ...itemForm, localizacao: val });
                    }}
                  >
                    <SelectTrigger className="w-[140px] text-xs h-8">
                      <SelectValue placeholder="Sugeridas..." />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {SALAS_LOCAIS_SUGERIDOS.map((sala) => (
                        <SelectItem key={sala} value={sala}>
                          {sala}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* RESPONSÁVEL E STATUS */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Responsável / Guardião</Label>
                  <Input
                    placeholder="Ex: Equipe de Operações, Líder Técnico"
                    value={itemForm.responsavelNome}
                    onChange={(e) => setItemForm({ ...itemForm, responsavelNome: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status de Uso</Label>
                  <Select
                    value={itemForm.status}
                    onValueChange={(val: any) => setItemForm({ ...itemForm, status: val })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Em Uso">Em Uso</SelectItem>
                      <SelectItem value="Disponível">Disponível</SelectItem>
                      <SelectItem value="Emprestado">Emprestado</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                      <SelectItem value="Baixado">Baixado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoItemOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                Salvar Item do Escritório
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR ITEM DO ESCRITÓRIO */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleSaveEdit}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-orange-600" />
                <DialogTitle className="text-base">Editar Item do Escritório</DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Atualize o título, descrição, estado de conservação, unidades ou localização.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3 text-xs">
              {/* CÓDIGO E TÍTULO */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Código *</Label>
                  <Input
                    required
                    value={itemForm.codigo}
                    onChange={(e) => setItemForm({ ...itemForm, codigo: e.target.value })}
                    className="text-xs h-8 font-mono font-bold"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs font-semibold">Título / Nome do Item *</Label>
                  <Input
                    required
                    value={itemForm.nome}
                    onChange={(e) => setItemForm({ ...itemForm, nome: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* DESCRIÇÃO DETALHADA */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Descrição / Detalhes</Label>
                <Textarea
                  value={itemForm.descricao}
                  onChange={(e) => setItemForm({ ...itemForm, descricao: e.target.value })}
                  className="text-xs min-h-[60px] resize-none"
                />
              </div>

              {/* CATEGORIA E ESTADO DE CONSERVAÇÃO */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Categoria *</Label>
                  <Select
                    value={itemForm.categoria}
                    onValueChange={(val) => setItemForm({ ...itemForm, categoria: val })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {CATEGORIAS_ESCRITORIO.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Estado de Conservação *</Label>
                  <Select
                    value={itemForm.estadoConservacao}
                    onValueChange={(val: EstadoConservacaoItem) => setItemForm({ ...itemForm, estadoConservacao: val })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {ESTADOS_CONSERVACAO.map((est) => (
                        <SelectItem key={est} value={est}>
                          {est}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* UNIDADES E VALOR */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Unidades (Quantidade) *</Label>
                  <Input
                    type="number"
                    min="0"
                    required
                    value={itemForm.quantidade}
                    onChange={(e) => setItemForm({ ...itemForm, quantidade: Number(e.target.value) || 0 })}
                    className="text-xs h-8 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Valor Estimado / Unitário (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={itemForm.valorUnitario}
                    onChange={(e) => setItemForm({ ...itemForm, valorUnitario: Number(e.target.value) })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* LOCALIZAÇÃO / SALA */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Localização / Sala *</Label>
                <div className="flex gap-2">
                  <Input
                    required
                    value={itemForm.localizacao}
                    onChange={(e) => setItemForm({ ...itemForm, localizacao: e.target.value })}
                    className="text-xs h-8 flex-1"
                  />
                  <Select
                    value=""
                    onValueChange={(val) => {
                      if (val) setItemForm({ ...itemForm, localizacao: val });
                    }}
                  >
                    <SelectTrigger className="w-[140px] text-xs h-8">
                      <SelectValue placeholder="Sugeridas..." />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      {SALAS_LOCAIS_SUGERIDOS.map((sala) => (
                        <SelectItem key={sala} value={sala}>
                          {sala}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* RESPONSÁVEL E STATUS */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Responsável / Guardião</Label>
                  <Input
                    value={itemForm.responsavelNome}
                    onChange={(e) => setItemForm({ ...itemForm, responsavelNome: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status de Uso</Label>
                  <Select
                    value={itemForm.status}
                    onValueChange={(val: any) => setItemForm({ ...itemForm, status: val })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Em Uso">Em Uso</SelectItem>
                      <SelectItem value="Disponível">Disponível</SelectItem>
                      <SelectItem value="Emprestado">Emprestado</SelectItem>
                      <SelectItem value="Manutenção">Manutenção</SelectItem>
                      <SelectItem value="Baixado">Baixado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                Salvar Alterações
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: AJUSTAR UNIDADES / MOVIMENTAÇÃO */}
      <Dialog open={isMovimentarOpen} onOpenChange={setIsMovimentarOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleMovimentar}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {movForm.tipo === 'Entrada' ? (
                  <Badge className="bg-emerald-600 text-white text-xs">+ Entrada de Unidades</Badge>
                ) : (
                  <Badge className="bg-amber-600 text-white text-xs">- Baixa de Unidades</Badge>
                )}
                <DialogTitle className="text-base">
                  {selectedItem?.nome}
                </DialogTitle>
              </div>
              <DialogDescription className="text-xs">
                Código: <strong className="font-mono text-primary">{selectedItem?.codigo}</strong> • Saldo Atual: <strong>{selectedItem?.quantidade} unidades</strong>
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3 text-xs">
              {/* Quantidade e Motivo */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Qtd a Ajustar *</Label>
                  <Input
                    type="number"
                    min="1"
                    max={movForm.tipo === 'Saída' ? selectedItem?.quantidade : undefined}
                    required
                    value={movForm.quantidade}
                    onChange={(e) => {
                      const q = Number(e.target.value) || 1;
                      setMovForm({
                        ...movForm,
                        quantidade: q,
                        valorTotal: q * (Number(movForm.valorUnitario) || 0)
                      });
                    }}
                    className="text-xs h-8 font-bold"
                  />
                </div>

                <div className="col-span-2 space-y-1">
                  <Label className="text-xs font-semibold">Motivo do Ajuste *</Label>
                  <Input
                    required
                    placeholder={movForm.tipo === 'Entrada' ? "Ex: Compra de novas unidades / Doação" : "Ex: Baixa por desgaste / Realocação"}
                    value={movForm.motivo}
                    onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* OPÇÃO DE GERAR FINANCEIRO */}
              {movForm.tipo === 'Entrada' && (
                <div className="space-y-3 p-3 rounded-lg border bg-orange-500/5 dark:bg-orange-950/20 border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-300">
                      <Receipt className="w-4 h-4" />
                      Lançar Despesa em Contas a Pagar
                    </div>
                    <Switch
                      checked={movForm.gerarFinanceiro}
                      onCheckedChange={(checked) => setMovForm({ ...movForm, gerarFinanceiro: checked })}
                    />
                  </div>

                  {movForm.gerarFinanceiro && (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">Fornecedor / Loja *</Label>
                        <Input
                          required={movForm.gerarFinanceiro}
                          placeholder="Ex: Amazon Brasil, Kalunga, Magazine Luiza"
                          value={movForm.entidadeNome}
                          onChange={(e) => setMovForm({ ...movForm, entidadeNome: e.target.value })}
                          className="text-xs h-8 bg-card"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-bold text-foreground">Valor Total (R$) *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0.01"
                            required
                            value={movForm.valorTotal}
                            onChange={(e) => setMovForm({ ...movForm, valorTotal: Number(e.target.value) || 0 })}
                            className="text-xs h-8 bg-card font-bold text-orange-600"
                          />
                        </div>

                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Vencimento</Label>
                          <Input
                            type="date"
                            required
                            value={movForm.vencimento}
                            onChange={(e) => setMovForm({ ...movForm, vencimento: e.target.value })}
                            className="text-xs h-8 bg-card"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsMovimentarOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                className={`text-xs text-white font-semibold ${
                  movForm.tipo === 'Entrada' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                Confirmar Ajuste
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

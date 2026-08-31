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
  FileText
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { EstoqueItem } from '../types';
import { InventarioView } from './InventarioView';
import { toast } from 'sonner';

export function EstoqueView() {
  const { estoqueItens, addEstoqueItem, ajustarEstoqueItemComFinanceiro, deleteEstoqueItem } = useEstoquePatrimonio();
  const { data: clientes = [] } = useLocalStorageState<any>('focus_clientes', []);
  const { data: fornecedores = [] } = useLocalStorageState<any>('focus_fornecedores', []);

  const [subTab, setSubTab] = useState<'itens' | 'inventario'>('itens');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isNovoItemOpen, setIsNovoItemOpen] = useState(false);
  const [isMovimentarOpen, setIsMovimentarOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<EstoqueItem | null>(null);

  // Form: Novo Item
  const [novoItem, setNovoItem] = useState({
    codigo: '',
    nome: '',
    categoria: 'Periféricos e Cabos',
    quantidade: 10,
    quantidadeMinima: 3,
    localizacao: 'Almoxarifado TI - Prateleira A1',
    valorUnitario: 100,
    responsavelNome: 'Equipe TI',
    observacoes: '',
  });

  // Form: Movimentar (Entrada / Saída / Ajuste) com Financeiro
  const [movForm, setMovForm] = useState({
    tipo: 'Entrada' as 'Entrada' | 'Saída' | 'Ajuste',
    quantidade: 1,
    motivo: 'Abastecimento de Estoque',
    gerarFinanceiro: true,
    valorUnitario: 0,
    valorTotal: 0,
    entidadeNome: '',
    vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
    formaPagamento: 'Boleto',
    finalidadeSaida: 'venda' as 'venda' | 'interno',
  });

  const filteredItens = estoqueItens.filter((item) => {
    if (!item || (!item.nome && !item.codigo)) return false;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (item.nome || '').toLowerCase().includes(search) ||
      (item.codigo || '').toLowerCase().includes(search) ||
      (item.localizacao || '').toLowerCase().includes(search);
    const matchesCat = categoriaFilter === 'todos' || item.categoria === categoriaFilter;
    return matchesSearch && matchesCat;
  });

  const categoriasUnicas = Array.from(new Set(estoqueItens.map((i) => i.categoria).filter(Boolean)));
  const totalUnidadesEstoque = estoqueItens.reduce((acc, i) => acc + (Number(i.quantidade) || 0), 0);

  const handleOpenEntrada = (item: EstoqueItem) => {
    setSelectedItem(item);
    const vlrUnit = Number(item.valorUnitario) || 0;
    setMovForm({
      tipo: 'Entrada',
      quantidade: 1,
      motivo: 'Compra / Reposição de Estoque',
      gerarFinanceiro: true,
      valorUnitario: vlrUnit,
      valorTotal: vlrUnit * 1,
      entidadeNome: fornecedores.length > 0 ? (fornecedores[0].nomeFantasia || fornecedores[0].razaoSocial) : 'Fornecedor de Almoxarifado',
      vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      formaPagamento: 'Boleto',
      finalidadeSaida: 'venda',
    });
    setIsMovimentarOpen(true);
  };

  const handleOpenSaida = (item: EstoqueItem) => {
    setSelectedItem(item);
    const vlrUnit = Number(item.valorUnitario) || 0;
    setMovForm({
      tipo: 'Saída',
      quantidade: 1,
      motivo: 'Venda / Faturamento para Cliente',
      gerarFinanceiro: true,
      valorUnitario: vlrUnit,
      valorTotal: vlrUnit * 1,
      entidadeNome: clientes.length > 0 ? (clientes[0].nomeFantasia || clientes[0].razaoSocial) : 'Cliente Corporativo',
      vencimento: new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0],
      formaPagamento: 'PIX',
      finalidadeSaida: 'venda',
    });
    setIsMovimentarOpen(true);
  };

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItem.nome || !novoItem.codigo) return;

    addEstoqueItem({
      id: 'est-' + Date.now(),
      codigo: novoItem.codigo,
      nome: novoItem.nome,
      categoria: novoItem.categoria,
      quantidade: Number(novoItem.quantidade) || 0,
      quantidadeMinima: Number(novoItem.quantidadeMinima) || 0,
      localizacao: novoItem.localizacao,
      status: Number(novoItem.quantidade) > 0 ? 'Disponível' : 'Reservado',
      valorUnitario: Number(novoItem.valorUnitario) || 0,
      responsavelNome: novoItem.responsavelNome,
      observacoes: novoItem.observacoes,
      createdAt: new Date().toISOString(),
    });

    setIsNovoItemOpen(false);
    toast.success(`Item "${novoItem.nome}" cadastrado com sucesso!`);
    setNovoItem({
      codigo: '',
      nome: '',
      categoria: 'Periféricos e Cabos',
      quantidade: 10,
      quantidadeMinima: 3,
      localizacao: 'Almoxarifado TI - Prateleira A1',
      valorUnitario: 100,
      responsavelNome: 'Equipe TI',
      observacoes: '',
    });
  };

  const handleMovimentar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const qtd = Number(movForm.quantidade) || 1;
    const vlrTot = Number(movForm.valorTotal) || (qtd * (Number(movForm.valorUnitario) || 0));
    const shouldGenFinancial = movForm.tipo !== 'Ajuste' && movForm.gerarFinanceiro && (movForm.tipo === 'Entrada' || movForm.finalidadeSaida === 'venda');

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
    });

    if (shouldGenFinancial) {
      if (movForm.tipo === 'Entrada') {
        toast.success(`Entrada de ${qtd} un realizada! Conta a Pagar de R$ ${vlrTot.toFixed(2)} gerada com sucesso.`);
      } else {
        toast.success(`Saída de ${qtd} un realizada! Conta a Receber de R$ ${vlrTot.toFixed(2)} gerada para ${movForm.entidadeNome}.`);
      }
    } else {
      toast.success(`Movimentação de ${movForm.tipo} (${qtd} un) registrada no estoque!`);
    }

    setIsMovimentarOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Itens e Almoxarifado</h2>
          <p className="text-xs text-muted-foreground">
            Controle de saldos físicos de almoxarifado integrado automaticamente a Contas a Pagar e Contas a Receber
          </p>
        </div>
      </div>

      {/* SUB-NAVEGAÇÃO: ESTOQUE FÍSICO / INVENTÁRIO */}
      <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant={subTab === 'itens' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('itens')}
            className={`text-xs gap-1.5 ${subTab === 'itens' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
          >
            <Boxes className="h-4 w-4" /> Almoxarifado ({filteredItens.length})
          </Button>
          <Button
            variant={subTab === 'inventario' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('inventario')}
            className={`text-xs gap-1.5 ${subTab === 'inventario' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
          >
            <ClipboardList className="h-4 w-4" /> Inventários & Auditorias
          </Button>
        </div>

        {subTab === 'itens' && (
          <Button
            size="sm"
            onClick={() => setIsNovoItemOpen(true)}
            className="text-xs bg-orange-600 hover:bg-orange-700 text-white gap-1 font-semibold"
          >
            <Plus className="h-4 w-4" /> Novo Item de Estoque
          </Button>
        )}
      </div>

      {subTab === 'inventario' ? (
        <InventarioView />
      ) : (
        <>
          {/* BARRA DE FILTROS */}
          <Card className="p-3 bg-card border shadow-2xs">
            <CardContent className="p-0 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto flex-1">
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar código, item ou localização..."
                    className="pl-8 text-xs h-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>

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
              </div>

              <div className="flex items-center border rounded-md p-0.5 bg-muted/40 shrink-0">
                <Button
                  variant={viewMode === 'table' ? 'secondary' : 'ghost'}
                  size="sm"
                  className="h-8 px-2 text-xs gap-1"
                  onClick={() => setViewMode('table')}
                  title="Visualização em Lista"
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
                  <p className="font-semibold text-foreground text-sm">Nenhum item de estoque encontrado</p>
                </div>
              ) : (
                filteredItens.map((item) => {
                  const isAbaixoMinimo = item.quantidade <= item.quantidadeMinima;
                  return (
                    <Card key={item.id} className="rounded-xl border shadow-xs hover:border-orange-500/50 transition-all bg-card flex flex-col justify-between">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-sm text-foreground truncate">{item.nome}</h4>
                            <span className="text-[11px] font-mono text-orange-600 font-semibold block">{item.codigo}</span>
                          </div>
                          <Badge variant="secondary" className="text-[10px] shrink-0">
                            {item.categoria}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-2 space-y-2.5 text-xs flex-1">
                        <div className="space-y-1 bg-muted/30 p-2.5 rounded-lg border text-[11px]">
                          <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">Saldo em Estoque:</span>
                            <span className={`font-bold text-xs ${isAbaixoMinimo ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                              {item.quantidade} un
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>Qtd Mínima:</span>
                            <span className="font-mono">{item.quantidadeMinima} un</span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>Localização:</span>
                            <span className="truncate max-w-[130px] flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> {item.localizacao}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-muted-foreground">
                            <span>Valor Unitário:</span>
                            <span className="font-semibold text-foreground">
                              R$ {(item.valorUnitario || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <span className="text-muted-foreground text-[11px]">Status:</span>
                          {isAbaixoMinimo ? (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <AlertCircle className="h-3 w-3" /> Reposição Urgente
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                              Normal
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                      <div className="p-3 border-t bg-muted/20 flex items-center justify-between rounded-b-xl">
                        <div className="flex items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenEntrada(item)}
                            className="h-7 text-[11px] px-2.5 gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20"
                          >
                            <ArrowDownLeft className="h-3 w-3" /> Entrada
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenSaida(item)}
                            className="h-7 text-[11px] px-2.5 gap-1 text-amber-600 hover:text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20"
                          >
                            <ArrowUpRight className="h-3 w-3" /> Saída
                          </Button>
                        </div>
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
                    </Card>
                  );
                })
              )}
            </div>
          ) : (
            <Card>
              <CardHeader className="py-4 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Itens em Almoxarifado ({filteredItens.length})</CardTitle>
                  <Badge variant="outline" className="text-[11px] font-mono">
                    Total Itens: {totalUnidadesEstoque} unidades
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs">Código / Item</TableHead>
                      <TableHead className="text-xs">Categoria</TableHead>
                      <TableHead className="text-xs text-center">Qtd Atual</TableHead>
                      <TableHead className="text-xs text-center">Qtd Mínima</TableHead>
                      <TableHead className="text-xs">Localização</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItens.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10 text-xs text-muted-foreground">
                          Nenhum item de estoque encontrado com os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItens.map((item) => {
                        const isAbaixoMinimo = item.quantidade <= item.quantidadeMinima;
                        return (
                          <TableRow key={item.id} className="hover:bg-muted/50 transition-colors">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-foreground">{item.nome}</span>
                                <span className="text-[10px] font-mono text-orange-600 font-bold">{item.codigo}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className="text-[10px]">
                                {item.categoria}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold text-xs">
                              <span className={isAbaixoMinimo ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-foreground'}>
                                {item.quantidade} un
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground font-mono">
                              {item.quantidadeMinima} un
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">{item.localizacao}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              {isAbaixoMinimo ? (
                                <Badge variant="destructive" className="text-[10px] gap-1">
                                  <AlertCircle className="h-3 w-3" /> Reposição Urgente
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px] text-emerald-600 bg-emerald-500/10 border-emerald-500/20">
                                  Normal
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenEntrada(item)}
                                  className="h-7 text-[11px] px-2.5 gap-1 text-emerald-600 hover:text-emerald-700 bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 font-semibold"
                                >
                                  <ArrowDownLeft className="h-3 w-3" /> Entrada
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleOpenSaida(item)}
                                  className="h-7 text-[11px] px-2.5 gap-1 text-amber-600 hover:text-amber-700 bg-amber-500/5 hover:bg-amber-500/10 border-amber-500/20 font-semibold"
                                >
                                  <ArrowUpRight className="h-3 w-3" /> Saída
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    deleteEstoqueItem(item.id);
                                    toast.success(`Item "${item.nome}" excluído!`);
                                  }}
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
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

      {/* MODAL: NOVO ITEM */}
      <Dialog open={isNovoItemOpen} onOpenChange={setIsNovoItemOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleCreateItem}>
            <DialogHeader>
              <DialogTitle className="text-base">Cadastrar Novo Item de Almoxarifado</DialogTitle>
              <DialogDescription className="text-xs">
                Insira as especificações do insumo ou peça para controle de saldo em estoque.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3 text-xs">
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Código *</Label>
                  <Input
                    required
                    placeholder="Ex: CAB-001"
                    value={novoItem.codigo}
                    onChange={(e) => setNovoItem({ ...novoItem, codigo: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Nome do Item *</Label>
                  <Input
                    required
                    placeholder="Ex: Cabo HDMI 2.0 2 Metros Blindado"
                    value={novoItem.nome}
                    onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Categoria</Label>
                  <Select
                    value={novoItem.categoria}
                    onValueChange={(val) => setNovoItem({ ...novoItem, categoria: val })}
                  >
                    <SelectTrigger className="text-xs h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="Periféricos e Cabos">Periféricos e Cabos</SelectItem>
                      <SelectItem value="Componentes e Peças">Componentes e Peças</SelectItem>
                      <SelectItem value="Adaptadores e Fontes">Adaptadores e Fontes</SelectItem>
                      <SelectItem value="Rede e Conectividade">Rede e Conectividade</SelectItem>
                      <SelectItem value="Suprimentos Gerais">Suprimentos Gerais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Localização no Almoxarifado</Label>
                  <Input
                    placeholder="Ex: Armário TI - Gaveta 3"
                    value={novoItem.localizacao}
                    onChange={(e) => setNovoItem({ ...novoItem, localizacao: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Qtd Inicial</Label>
                  <Input
                    type="number"
                    min="0"
                    value={novoItem.quantidade}
                    onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Qtd Mínima (Alerta)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={novoItem.quantidadeMinima}
                    onChange={(e) => setNovoItem({ ...novoItem, quantidadeMinima: Number(e.target.value) })}
                    className="text-xs h-8"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Valor Unitário (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={novoItem.valorUnitario}
                    onChange={(e) => setNovoItem({ ...novoItem, valorUnitario: Number(e.target.value) })}
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoItemOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                Salvar Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: MOVIMENTAÇÃO (ENTRADA / SAÍDA COM GERAÇÃO FINANCEIRA) */}
      <Dialog open={isMovimentarOpen} onOpenChange={setIsMovimentarOpen}>
        <DialogContent className="sm:max-w-lg">
          <form onSubmit={handleMovimentar}>
            <DialogHeader>
              <div className="flex items-center gap-2">
                {movForm.tipo === 'Entrada' ? (
                  <Badge className="bg-emerald-600 text-white text-xs">Entrada no Estoque</Badge>
                ) : (
                  <Badge className="bg-amber-600 text-white text-xs">Saída do Estoque</Badge>
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
                  <Label className="text-xs font-semibold">Quantidade *</Label>
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
                  <Label className="text-xs font-semibold">Motivo / Justificativa *</Label>
                  <Input
                    required
                    placeholder={movForm.tipo === 'Entrada' ? "Ex: Compra NF 123 / Reposição" : "Ex: Venda para cliente / Baixa de uso"}
                    value={movForm.motivo}
                    onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                    className="text-xs h-8"
                  />
                </div>
              </div>

              {/* Se for Saída, perguntar se é Venda (receita) ou Uso Interno */}
              {movForm.tipo === 'Saída' && (
                <div className="space-y-1 bg-muted/40 p-2.5 rounded-lg border">
                  <Label className="text-xs font-semibold">Destinação da Saída</Label>
                  <Select
                    value={movForm.finalidadeSaida}
                    onValueChange={(val: 'venda' | 'interno') => setMovForm({ ...movForm, finalidadeSaida: val })}
                  >
                    <SelectTrigger className="text-xs h-8 bg-card">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="text-xs">
                      <SelectItem value="venda">Venda / Faturamento Comercial (Gera Conta a Receber)</SelectItem>
                      <SelectItem value="interno">Consumo Interno / Baixa Operacional (Sem Cobrança)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* PAINEL DE INTEGRAÇÃO FINANCEIRA */}
              {(movForm.tipo === 'Entrada' || (movForm.tipo === 'Saída' && movForm.finalidadeSaida === 'venda')) && (
                <div className="space-y-3 p-3 rounded-lg border bg-orange-500/5 dark:bg-orange-950/20 border-orange-500/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-orange-700 dark:text-orange-300">
                      <Receipt className="w-4 h-4" />
                      {movForm.tipo === 'Entrada' ? 'Gerar Despesa em Contas a Pagar' : 'Gerar Título em Contas a Receber'}
                    </div>
                    <Switch
                      checked={movForm.gerarFinanceiro}
                      onCheckedChange={(checked) => setMovForm({ ...movForm, gerarFinanceiro: checked })}
                    />
                  </div>

                  {movForm.gerarFinanceiro && (
                    <div className="space-y-2.5 pt-1">
                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">
                          {movForm.tipo === 'Entrada' ? 'Fornecedor / Emitente *' : 'Cliente / Pagador *'}
                        </Label>
                        <Input
                          required={movForm.gerarFinanceiro}
                          placeholder={movForm.tipo === 'Entrada' ? "Nome do Fornecedor ou Razão Social" : "Nome do Cliente"}
                          value={movForm.entidadeNome}
                          onChange={(e) => setMovForm({ ...movForm, entidadeNome: e.target.value })}
                          className="text-xs h-8 bg-card"
                        />
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-[11px] font-medium">Valor Unitário (R$)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={movForm.valorUnitario}
                            onChange={(e) => {
                              const vu = Number(e.target.value) || 0;
                              setMovForm({
                                ...movForm,
                                valorUnitario: vu,
                                valorTotal: vu * (Number(movForm.quantidade) || 1)
                              });
                            }}
                            className="text-xs h-8 bg-card"
                          />
                        </div>

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

                        <div className="space-y-1 col-span-2 sm:col-span-1">
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

                      <div className="space-y-1">
                        <Label className="text-[11px] font-medium">Forma de Pagamento Prevista</Label>
                        <Select
                          value={movForm.formaPagamento}
                          onValueChange={(val) => setMovForm({ ...movForm, formaPagamento: val })}
                        >
                          <SelectTrigger className="text-xs h-8 bg-card">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="text-xs">
                            <SelectItem value="PIX">PIX</SelectItem>
                            <SelectItem value="Boleto">Boleto Bancário</SelectItem>
                            <SelectItem value="Transferência">Transferência / TED</SelectItem>
                            <SelectItem value="Cartão">Cartão Corporativo</SelectItem>
                          </SelectContent>
                        </Select>
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
                {movForm.tipo === 'Entrada' ? 'Confirmar Entrada & Gerar Pagamento' : 'Confirmar Saída & Faturar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

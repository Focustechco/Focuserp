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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';
import { EstoqueItem } from '../types';
import { InventarioView } from './InventarioView';

export function EstoqueView() {
  const { estoqueItens, addEstoqueItem, ajustarEstoqueItem, deleteEstoqueItem } = useEstoquePatrimonio();

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

  // Form: Movimentar (Entrada / Saída / Ajuste)
  const [movForm, setMovForm] = useState({
    tipo: 'Entrada' as 'Entrada' | 'Saída' | 'Ajuste',
    quantidade: 1,
    motivo: 'Abastecimento de Estoque',
  });

  const filteredItens = estoqueItens.filter((item) => {
    if (!item) return false;
    const search = searchTerm.toLowerCase();
    const matchesSearch =
      (item.nome || '').toLowerCase().includes(search) ||
      (item.codigo || '').toLowerCase().includes(search) ||
      (item.localizacao || '').toLowerCase().includes(search);
    const matchesCat = categoriaFilter === 'todos' || item.categoria === categoriaFilter;
    return matchesSearch && matchesCat;
  });

  const categoriasUnicas = Array.from(new Set(estoqueItens.map((i) => i.categoria)));

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoItem.nome || !novoItem.codigo) return;

    addEstoqueItem({
      id: 'est-' + Date.now(),
      codigo: novoItem.codigo,
      nome: novoItem.nome,
      categoria: novoItem.categoria,
      quantidade: Number(novoItem.quantidade),
      quantidadeMinima: Number(novoItem.quantidadeMinima),
      localizacao: novoItem.localizacao,
      status: Number(novoItem.quantidade) > 0 ? 'Disponível' : 'Reservado',
      valorUnitario: Number(novoItem.valorUnitario),
      responsavelNome: novoItem.responsavelNome,
      observacoes: novoItem.observacoes,
      createdAt: new Date().toISOString(),
    });

    setIsNovoItemOpen(false);
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

    ajustarEstoqueItem(selectedItem.id, Number(movForm.quantidade), movForm.tipo, movForm.motivo);
    setIsMovimentarOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      {/* HEADER DA SEÇÃO */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Itens e Estoque</h2>
          <p className="text-xs text-muted-foreground">
            Controle de saldos físicos de almoxarifado, níveis de reposição e auditorias
          </p>
        </div>
      </div>

      {/* SUB-NAVEGAÇÃO: ESTOQUE FÍSICO / INVENTÁRIO */}
      <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-3">
        <div className="flex items-center gap-1.5 bg-muted/40 p-1 rounded-lg border">
          <Button
            variant={subTab === 'itens' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('itens')}
            className={`text-xs gap-1.5 h-8 ${subTab === 'itens' ? 'bg-background text-foreground shadow-sm' : ''}`}
          >
            <Package className="h-3.5 w-3.5" /> Saldos e Itens de Almoxarifado
          </Button>
          <Button
            variant={subTab === 'inventario' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setSubTab('inventario')}
            className={`text-xs gap-1.5 h-8 ${subTab === 'inventario' ? 'bg-background text-foreground shadow-sm' : ''}`}
          >
            <ClipboardList className="h-3.5 w-3.5" /> Auditorias de Inventário
          </Button>
        </div>

        {subTab === 'itens' && (
          <Button onClick={() => setIsNovoItemOpen(true)} className="gap-2 text-xs h-8">
            <Plus className="h-3.5 w-3.5" /> Novo Item de Estoque
          </Button>
        )}
      </div>

      {subTab === 'inventario' ? (
        <InventarioView />
      ) : (
        <>
          {/* BARRA DE FILTROS E MODO DE VISUALIZAÇÃO */}
          <Card>
            <CardContent className="p-4 flex flex-col sm:flex-row gap-3 items-center">
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por código, nome do item ou localização..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 text-xs"
                />
              </div>
              <div className="w-full sm:w-56">
                <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Todas as Categorias" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas as Categorias</SelectItem>
                    {categoriasUnicas.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-1 bg-muted/50 p-1 rounded-lg border shrink-0">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setViewMode('table')}
                  title="Visualização em Lista"
                >
                  <LayoutList className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant={viewMode === 'cards' ? 'default' : 'ghost'}
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onClick={() => setViewMode('cards')}
                  title="Visualização em Cards"
                >
                  <LayoutGrid className="h-3.5 w-3.5" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* VISUALIZAÇÃO: CARDS OU TABELA */}
          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItens.length === 0 ? (
                <div className="col-span-full text-center py-12 text-muted-foreground text-xs border rounded-xl bg-card">
                  Nenhum item de estoque encontrado.
                </div>
              ) : (
                filteredItens.map((item) => {
                  const isAbaixoMinimo = item.quantidade <= item.quantidadeMinima;
                  return (
                    <Card key={item.id} className="rounded-xl border shadow-xs hover:border-primary/40 transition-all bg-card flex flex-col justify-between">
                      <CardHeader className="p-4 pb-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs text-foreground truncate">{item.nome}</h4>
                            <span className="text-[10px] font-mono text-primary font-semibold block">{item.codigo}</span>
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
                            onClick={() => {
                              setSelectedItem(item);
                              setMovForm({ tipo: 'Entrada', quantidade: 1, motivo: 'Abastecimento de Estoque' });
                              setIsMovimentarOpen(true);
                            }}
                            className="h-7 text-[11px] px-2.5 gap-1 text-emerald-600 hover:text-emerald-700"
                          >
                            <ArrowDownLeft className="h-3 w-3" /> Entrada
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedItem(item);
                              setMovForm({ tipo: 'Saída', quantidade: 1, motivo: 'Entrega para Colaborador' });
                              setIsMovimentarOpen(true);
                            }}
                            className="h-7 text-[11px] px-2.5 gap-1 text-amber-600 hover:text-amber-700"
                          >
                            <ArrowUpRight className="h-3 w-3" /> Saída
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteEstoqueItem(item.id)}
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
              <CardHeader className="py-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">Itens em Almoxarifado ({filteredItens.length})</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-mono">
                    Total Itens: {estoqueItens.reduce((acc, i) => acc + i.quantidade, 0)} unidades
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
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
                        <TableCell colSpan={7} className="text-center py-8 text-xs text-muted-foreground">
                          Nenhum item de estoque encontrado com os filtros aplicados.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredItens.map((item) => {
                        const isAbaixoMinimo = item.quantidade <= item.quantidadeMinima;
                        return (
                          <TableRow key={item.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-xs text-foreground">{item.nome}</span>
                                <span className="text-[10px] font-mono text-muted-foreground">{item.codigo}</span>
                              </div>
                            </TableCell>
                            <TableCell className="text-xs">
                              <Badge variant="secondary" className="text-[10px]">
                                {item.categoria}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-center font-bold text-xs">
                              <span className={isAbaixoMinimo ? 'text-rose-600 dark:text-rose-400 font-extrabold' : ''}>
                                {item.quantidade} un
                              </span>
                            </TableCell>
                            <TableCell className="text-center text-xs text-muted-foreground font-mono">
                              {item.quantidadeMinima} un
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-1.5 text-muted-foreground">
                                <MapPin className="h-3.5 w-3.5" />
                                <span>{item.localizacao}</span>
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
                              <div className="flex items-center justify-end gap-1">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setMovForm({ tipo: 'Entrada', quantidade: 1, motivo: 'Abastecimento de Estoque' });
                                    setIsMovimentarOpen(true);
                                  }}
                                  className="h-7 text-[11px] px-2 gap-1 text-emerald-600 hover:text-emerald-700"
                                >
                                  <ArrowDownLeft className="h-3 w-3" /> Entrada
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedItem(item);
                                    setMovForm({ tipo: 'Saída', quantidade: 1, motivo: 'Entrega para Colaborador' });
                                    setIsMovimentarOpen(true);
                                  }}
                                  className="h-7 text-[11px] px-2 gap-1 text-amber-600 hover:text-amber-700"
                                >
                                  <ArrowUpRight className="h-3 w-3" /> Saída
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => deleteEstoqueItem(item.id)}
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
                    <SelectContent>
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

      {/* MODAL: MOVIMENTAÇÃO (ENTRADA / SAÍDA / AJUSTE) */}
      <Dialog open={isMovimentarOpen} onOpenChange={setIsMovimentarOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={handleMovimentar}>
            <DialogHeader>
              <DialogTitle className="text-base">
                Registrar Movimentação: {selectedItem?.nome}
              </DialogTitle>
              <DialogDescription className="text-xs">
                Saldo Atual: <strong>{selectedItem?.quantidade} unidades</strong> ({selectedItem?.codigo})
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 py-3 text-xs">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Movimentação</Label>
                <Select
                  value={movForm.tipo}
                  onValueChange={(val: 'Entrada' | 'Saída' | 'Ajuste') => setMovForm({ ...movForm, tipo: val })}
                >
                  <SelectTrigger className="text-xs h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada (Adicionar ao Saldo)</SelectItem>
                    <SelectItem value="Saída">Saída (Retirar do Saldo)</SelectItem>
                    <SelectItem value="Ajuste">Ajuste de Balanço / Inventário</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Quantidade</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={movForm.quantidade}
                  onChange={(e) => setMovForm({ ...movForm, quantidade: Number(e.target.value) })}
                  className="text-xs h-8"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Motivo / Justificativa</Label>
                <Input
                  required
                  placeholder="Ex: Entrega de boas-vindas colaborador / Compra NF 123"
                  value={movForm.motivo}
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsMovimentarOpen(false)} className="text-xs">
                Cancelar
              </Button>
              <Button type="submit" size="sm" className="text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                Confirmar Movimentação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

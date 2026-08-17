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

export function EstoqueView() {
  const { estoqueItens, addEstoqueItem, ajustarEstoqueItem, deleteEstoqueItem } = useEstoquePatrimonio();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');

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
      {/* HEADER DAS AÇÕES DE ESTOQUE */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Controle de Estoque Físico</h2>
          <p className="text-xs text-muted-foreground">
            Gerenciamento de periféricos, cabos, peças de reposição e suprimentos corporativos
          </p>
        </div>
        <Button onClick={() => setIsNovoItemOpen(true)} className="gap-2 text-xs">
          <Plus className="h-4 w-4" /> Novo Item de Estoque
        </Button>
      </div>

      {/* BARRA DE FILTROS */}
      <Card>
        <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
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
        </CardContent>
      </Card>

      {/* TABELA DE ITENS DE ESTOQUE */}
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
                          <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate max-w-[180px]">{item.localizacao}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isAbaixoMinimo ? (
                          <Badge variant="destructive" className="text-[10px] gap-1">
                            <AlertCircle className="h-3 w-3" /> Abaixo do Mínimo
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                            Estoque Normal
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setSelectedItem(item);
                              setMovForm({ tipo: 'Entrada', quantidade: 1, motivo: 'Reabastecimento' });
                              setIsMovimentarOpen(true);
                            }}
                          >
                            <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" /> Entrada
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1"
                            onClick={() => {
                              setSelectedItem(item);
                              setMovForm({ tipo: 'Saída', quantidade: 1, motivo: 'Atendimento de Chamado / Baixa' });
                              setIsMovimentarOpen(true);
                            }}
                          >
                            <ArrowDownLeft className="h-3.5 w-3.5 text-amber-600" /> Saída
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                            onClick={() => deleteEstoqueItem(item.id)}
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

      {/* MODAL: NOVO ITEM DE ESTOQUE */}
      <Dialog open={isNovoItemOpen} onOpenChange={setIsNovoItemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">Cadastrar Novo Item no Estoque</DialogTitle>
            <DialogDescription className="text-xs">
              Preencha os dados do item físico de almoxarifado ou suprimento de TI.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateItem} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Código Interno *</Label>
                <Input
                  required
                  placeholder="MAT-CAB-009"
                  value={novoItem.codigo}
                  onChange={(e) => setNovoItem({ ...novoItem, codigo: e.target.value })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Categoria *</Label>
                <Select
                  value={novoItem.categoria}
                  onValueChange={(val) => setNovoItem({ ...novoItem, categoria: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Periféricos e Cabos">Periféricos e Cabos</SelectItem>
                    <SelectItem value="Componentes">Componentes</SelectItem>
                    <SelectItem value="Armazenamento">Armazenamento</SelectItem>
                    <SelectItem value="Acessórios">Acessórios</SelectItem>
                    <SelectItem value="Material de Consumo">Material de Consumo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Nome do Item *</Label>
              <Input
                required
                placeholder="Ex: Cabo HDMI 2.1 2 Metros"
                value={novoItem.nome}
                onChange={(e) => setNovoItem({ ...novoItem, nome: e.target.value })}
                className="text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Qtd Inicial *</Label>
                <Input
                  type="number"
                  min="0"
                  required
                  value={novoItem.quantidade}
                  onChange={(e) => setNovoItem({ ...novoItem, quantidade: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Qtd Mínima *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={novoItem.quantidadeMinima}
                  onChange={(e) => setNovoItem({ ...novoItem, quantidadeMinima: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Valor Un. (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={novoItem.valorUnitario}
                  onChange={(e) => setNovoItem({ ...novoItem, valorUnitario: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Localização Física *</Label>
              <Input
                required
                placeholder="Ex: Almoxarifado TI - Prateleira B2"
                value={novoItem.localizacao}
                onChange={(e) => setNovoItem({ ...novoItem, localizacao: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsNovoItemOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Cadastrar Item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: MOVIMENTAR ESTOQUE (ENTRADA / SAÍDA) */}
      <Dialog open={isMovimentarOpen} onOpenChange={setIsMovimentarOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold">
              Movimentar Estoque: {selectedItem?.nome}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Registre a entrada, saída ou ajuste físico deste item de estoque.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMovimentar} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo de Operação *</Label>
                <Select
                  value={movForm.tipo}
                  onValueChange={(val: any) => setMovForm({ ...movForm, tipo: val })}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Entrada">Entrada (Adicionar)</SelectItem>
                    <SelectItem value="Saída">Saída (Remover)</SelectItem>
                    <SelectItem value="Ajuste">Ajuste Direto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Quantidade *</Label>
                <Input
                  type="number"
                  min="1"
                  required
                  value={movForm.quantidade}
                  onChange={(e) => setMovForm({ ...movForm, quantidade: Number(e.target.value) })}
                  className="text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Motivo / Destino da Movimentação *</Label>
              <Input
                required
                placeholder="Ex: Entrega ao colaborador João / Compra lote NF 442"
                value={movForm.motivo}
                onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                className="text-xs"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsMovimentarOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm">
                Confirmar Movimentação
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

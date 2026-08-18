import React, { useState } from 'react';
import { ProdutoFocus } from '../types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Plus,
  LayoutGrid,
  List as ListIcon,
  Grid3X3,
  Users,
  Rocket,
  Boxes,
  ArrowRight,
  Pencil,
  Trash2,
} from 'lucide-react';
import { NovoProdutoModal } from './NovoProdutoModal';
import { EditarProdutoModal } from './EditarProdutoModal';
import { toast } from 'sonner';

interface CatalogoProdutosProps {
  produtos: ProdutoFocus[];
  onSelectProduto: (produto: ProdutoFocus) => void;
  onAddProduto: (p: Omit<ProdutoFocus, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdateProduto: (id: string, changes: Partial<ProdutoFocus>) => void;
  onDeleteProduto?: (id: string) => void;
}

export function CatalogoProdutos({ produtos, onSelectProduto, onAddProduto, onUpdateProduto, onDeleteProduto }: CatalogoProdutosProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoriaFilter, setCategoriaFilter] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [viewMode, setViewMode] = useState<'cards' | 'grade' | 'lista'>('cards');
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<ProdutoFocus | null>(null);

  const filteredProdutos = produtos.filter((p) => {
    const matchSearch =
      (p.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.descricaoBreve || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = categoriaFilter === 'todos' || p.categoria === categoriaFilter;
    const matchStatus = statusFilter === 'todos' || p.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const getStatusBadge = (status: ProdutoFocus['status']) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 font-bold text-[10px]">Ativo</Badge>;
      case 'Em Desenvolvimento':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/30 font-bold text-[10px]">Em Desenvolvimento</Badge>;
      case 'Em Implantao':
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 font-bold text-[10px]">Em Implantao</Badge>;
      case 'Manuteno':
        return <Badge className="bg-purple-500/10 text-purple-600 border-purple-500/30 font-bold text-[10px]">Manuteno</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px]">Descontinuado</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* BARRA SUPERIOR DE PESQUISA E FILTROS */}
      <Card className="border-border/80">
        <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por produto, cdigo ou tecnologia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 text-xs"
              />
            </div>

            <div className="w-full sm:w-48">
              <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todas Categorias</SelectItem>
                  <SelectItem value="ERP & Gesto">ERP & Gesto</SelectItem>
                  <SelectItem value="CRM & Vendas">CRM & Vendas</SelectItem>
                  <SelectItem value="Business Intelligence">Business Intelligence</SelectItem>
                  <SelectItem value="Fintech & Pay">Fintech & Pay</SelectItem>
                  <SelectItem value="Logstica">Logstica</SelectItem>
                  <SelectItem value="Educao / EAD">Educao / EAD</SelectItem>
                  <SelectItem value="Inovao & IA">Inovao & IA</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="w-full sm:w-40">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Em Desenvolvimento">Em Desenvolvimento</SelectItem>
                  <SelectItem value="Em Implantao">Em Implantao</SelectItem>
                  <SelectItem value="Descontinuado">Descontinuado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* CONTROLE DE MODO DE VISUALIZAO */}
            <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
              <Button
                variant={viewMode === 'cards' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('cards')}
                title="Modo Cards com Capa"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'grade' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('grade')}
                title="Modo Grade Compacta"
              >
                <Grid3X3 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={viewMode === 'lista' ? 'default' : 'ghost'}
                size="icon"
                className="h-7 w-7"
                onClick={() => setViewMode('lista')}
                title="Modo Lista"
              >
                <ListIcon className="h-3.5 w-3.5" />
              </Button>
            </div>

            <Button onClick={() => setIsNovoModalOpen(true)} className="gap-2 text-xs font-semibold">
              <Plus className="h-4 w-4" /> Novo Produto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* EXIBIO DE PRODUTOS */}
      {filteredProdutos.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <CardContent className="flex flex-col items-center justify-center gap-2">
            <Boxes className="h-10 w-10 text-muted-foreground/60" />
            <h3 className="text-base font-bold text-foreground">Nenhum produto encontrado</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Tente alterar os termos de pesquisa ou crie um novo produto no portflio.
            </p>
            <Button onClick={() => setIsNovoModalOpen(true)} size="sm" className="mt-2 gap-1.5 text-xs">
              <Plus className="h-4 w-4" /> Cadastrar Produto
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProdutos.map((produto) => (
            <Card
              key={produto.id}
              onClick={() => onSelectProduto(produto)}
              className="group overflow-hidden hover:shadow-xl transition-all cursor-pointer border-border/80 flex flex-col justify-between"
            >
              <div>
                {/* CAPA DE BANNER */}
                <div className="h-32 w-full bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 relative overflow-hidden flex items-center justify-center">
                  {produto.capaUrl ? (
                    <img src={produto.capaUrl} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/5 to-transparent flex items-center justify-center">
                      <Boxes className="h-12 w-12 text-primary/40 group-hover:scale-110 transition-transform duration-300" />
                    </div>
                  )}
                  {/* Status Badge overlay */}
                  <div className="absolute top-3 right-3">{getStatusBadge(produto.status)}</div>
                  {/* Botoes de Acao (Editar e Excluir) */}
                  <div className="absolute top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setProdutoEditando(produto); }}
                      className="bg-black/60 hover:bg-primary text-white rounded-lg p-1.5 shadow-lg"
                      title="Editar produto"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {onDeleteProduto && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
                            onDeleteProduto(produto.id);
                            toast.success(`Produto "${produto.nome}" excluído com sucesso!`);
                          }
                        }}
                        className="bg-black/60 hover:bg-rose-600 text-white rounded-lg p-1.5 shadow-lg"
                        title="Excluir produto"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-300 hover:text-white" />
                      </button>
                    )}
                  </div>
                </div>

                {/* HEADER COM LOGO E NOME */}
                <CardHeader className="p-5 pb-2 relative">
                  {/* Logo avatar floating */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border shadow-md flex items-center justify-center p-1.5 shrink-0">
                        {produto.logoUrl ? (
                          <img src={produto.logoUrl} alt={produto.nome} className="w-full h-full object-contain" />
                        ) : (
                          <Boxes className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div>
                        <CardTitle className="text-base font-extrabold text-foreground group-hover:text-primary transition-colors">
                          {produto.nome}
                        </CardTitle>
                        <p className="text-[11px] font-semibold text-muted-foreground">{produto.categoria}</p>
                      </div>
                    </div>

                    <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                      {produto.versaoAtual}
                    </Badge>
                  </div>

                  <CardDescription className="text-xs line-clamp-2 mt-3 text-muted-foreground/90">
                    {produto.descricaoBreve}
                  </CardDescription>
                </CardHeader>
              </div>

              {/* FOOTER DO CARD COM METRICAS E BOTAO */}
              <div>
                <CardContent className="p-5 pt-2 space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-xs pt-3 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      <span className="font-semibold text-foreground">{(produto.implementacoes || []).length + 3}</span> Clientes
                    </div>
                    <div className="flex items-center gap-1.5 text-muted-foreground">
                      <Rocket className="h-3.5 w-3.5 text-blue-500" />
                      <span className="font-semibold text-foreground">{(produto.funcionalidades || []).length}</span> Módulos
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4 bg-muted/20 border-t border-border/40 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground truncate max-w-[150px]">
                    Resp: <span className="font-semibold text-foreground">{produto.responsavelPrincipal || 'PO'}</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-xs gap-1 text-muted-foreground hover:text-foreground h-8 px-2"
                      onClick={(e) => { e.stopPropagation(); setProdutoEditando(produto); }}
                      title="Editar produto"
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    {onDeleteProduto && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-xs gap-1 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 h-8 px-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
                            onDeleteProduto(produto.id);
                            toast.success(`Produto "${produto.nome}" excluído com sucesso!`);
                          }
                        }}
                        title="Excluir produto"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" className="text-xs font-bold gap-1 text-primary hover:text-primary">
                      Workspace <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardFooter>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        /* MODO LISTA / GRADE COMPACTA */
        <div className="space-y-3">
          {filteredProdutos.map((produto) => (
            <Card
              key={produto.id}
              onClick={() => onSelectProduto(produto)}
              className="p-4 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-border/80 group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-muted/40 border border-border flex items-center justify-center p-2 shrink-0 overflow-hidden">
                  {produto.logoUrl ? (
                    <img src={produto.logoUrl} alt={produto.nome} className="w-full h-full object-contain" />
                  ) : (
                    <Boxes className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-foreground">{produto.nome}</h3>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {produto.versaoAtual}
                    </Badge>
                    {getStatusBadge(produto.status)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{produto.descricaoBreve}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right hidden sm:block mr-2">
                  <span className="text-xs font-semibold text-foreground block">{produto.categoria}</span>
                  <span className="text-[10px] text-muted-foreground">{produto.responsavelPrincipal}</span>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-xs gap-1 h-8 px-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); setProdutoEditando(produto); }}
                  title="Editar produto"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                {onDeleteProduto && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs gap-1 h-8 px-2 text-rose-500 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Tem certeza que deseja excluir o produto "${produto.nome}"?`)) {
                        onDeleteProduto(produto.id);
                        toast.success(`Produto "${produto.nome}" excluído com sucesso!`);
                      }
                    }}
                    title="Excluir produto"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                )}
                <Button size="sm" variant="outline" className="text-xs font-semibold gap-1">
                  Workspace <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* MODAL DE NOVO PRODUTO */}
      <NovoProdutoModal
        open={isNovoModalOpen}
        onOpenChange={setIsNovoModalOpen}
        onAddProduto={onAddProduto}
      />

      {/* MODAL DE EDICAO DE PRODUTO */}
      <EditarProdutoModal
        open={!!produtoEditando}
        onOpenChange={(open) => { if (!open) setProdutoEditando(null); }}
        produto={produtoEditando}
        onSave={onUpdateProduto}
        onDelete={onDeleteProduto}
      />
    </div>
  );
}

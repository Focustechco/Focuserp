import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Fornecedor, StatusFornecedor } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, Phone, MessageCircle, MoreVertical,
  Building2, User, ChevronRight, Mail, DollarSign, Edit3, Trash2,
  CheckCircle2, XCircle, ShieldCheck, MapPin, ExternalLink, BarChart3,
  Users, AlertCircle, Ban, Eye
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { NovoFornecedorSheet } from './NovoFornecedorSheet';
import { FornecedorPerfilSheet } from './FornecedorPerfilSheet';
import { Dashboard } from './Dashboard';
import { fornecedorService } from '@/services/fornecedorService';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileFornecedoresView() {
  const { data: fornecedoresData = [], updateItem, deleteItem } = useLocalStorageState<Fornecedor>('focus_fornecedores');
  const fornecedores = Array.isArray(fornecedoresData) ? fornecedoresData : [];

  const [activeSection, setActiveSection] = useState<'lista' | 'dashboard'>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'ativos' | 'todos' | 'homologados' | 'em_analise' | 'inativos' | 'bloqueados'>('ativos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Sheets e Modais
  const [novoFornecedorOpen, setNovoFornecedorOpen] = useState(false);
  const [fornecedorPerfil, setFornecedorPerfil] = useState<Fornecedor | null>(null);
  const [perfilOpen, setPerfilOpen] = useState(false);
  const [fornecedorParaEditar, setFornecedorParaEditar] = useState<Fornecedor | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [fornecedorParaExcluir, setFornecedorParaExcluir] = useState<Fornecedor | null>(null);

  // Categorias disponíveis
  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set<string>();
    fornecedores.forEach((f) => {
      if (f?.categoria) cats.add(f.categoria);
    });
    return Array.from(cats).sort();
  }, [fornecedores]);

  // Lista filtrada e ordenada
  const filteredFornecedores = useMemo(() => {
    return fornecedores.filter((f) => {
      if (!f) return false;
      const term = searchTerm.toLowerCase();
      const matchSearch =
        (f.razaoSocial || '').toLowerCase().includes(term) ||
        (f.nomeFantasia || '').toLowerCase().includes(term) ||
        (f.documento || '').includes(term) ||
        (f.codigo || '').toLowerCase().includes(term) ||
        (f.categoria || '').toLowerCase().includes(term);

      if (!matchSearch) return false;

      // Filtro por Aba Rápida
      if (activeTab === 'ativos' && f.status !== 'Ativo') return false;
      if (activeTab === 'homologados' && f.status !== 'Homologado') return false;
      if (activeTab === 'em_analise' && f.status !== 'Em Análise') return false;
      if (activeTab === 'inativos' && f.status !== 'Inativo') return false;
      if (activeTab === 'bloqueados' && f.status !== 'Bloqueado') return false;

      // Filtros detalhados do Sheet
      if (statusFilter !== 'todos' && f.status !== statusFilter) return false;
      if (categoriaFilter !== 'todas' && f.categoria !== categoriaFilter) return false;
      if (tipoFilter !== 'todos' && f.tipo !== tipoFilter) return false;

      return true;
    }).sort((a, b) => {
      const aAtivo = a.status === 'Ativo' || a.status === 'Homologado';
      const bAtivo = b.status === 'Ativo' || b.status === 'Homologado';
      if (aAtivo && !bAtivo) return -1;
      if (!aAtivo && bAtivo) return 1;
      return (a.nomeFantasia || a.razaoSocial || '').localeCompare(b.nomeFantasia || b.razaoSocial || '');
    });
  }, [fornecedores, searchTerm, activeTab, statusFilter, categoriaFilter, tipoFilter]);

  // KPIs
  const stats = useMemo(() => {
    const total = fornecedores.length;
    const ativos = fornecedores.filter((f) => f?.status === 'Ativo' || f?.status === 'Homologado').length;
    const emAnalise = fornecedores.filter((f) => f?.status === 'Em Análise').length;
    const inativos = fornecedores.filter((f) => f?.status === 'Inativo' || f?.status === 'Bloqueado').length;
    const totalPago = fornecedores.reduce((acc, f) => acc + Number(f?.totalPago || 0), 0);
    const totalAberto = fornecedores.reduce((acc, f) => acc + Number(f?.saldoAberto || 0), 0);

    return { total, ativos, emAnalise, inativos, totalPago, totalAberto };
  }, [fornecedores]);

  // Status Badge
  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Ativo':
        return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30 text-[10px] font-bold">Ativo</Badge>;
      case 'Homologado':
        return <Badge className="bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30 text-[10px] font-bold">Homologado</Badge>;
      case 'Em Análise':
        return <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 text-[10px] font-bold">Em Análise</Badge>;
      case 'Bloqueado':
        return <Badge variant="destructive" className="text-[10px] font-bold">Bloqueado</Badge>;
      case 'Inativo':
      default:
        return <Badge variant="secondary" className="text-[10px] font-semibold">Inativo</Badge>;
    }
  };

  // Alternar Status rápido
  const handleToggleStatus = async (fornecedor: Fornecedor, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const novoStatus: StatusFornecedor = fornecedor.status === 'Ativo' ? 'Inativo' : 'Ativo';
    try {
      updateItem(fornecedor.id, { status: novoStatus });
      await fornecedorService.saveFornecedor({ ...fornecedor, status: novoStatus }).catch(() => {});
      if (novoStatus === 'Ativo') {
        toast.success(`Fornecedor "${fornecedor.nomeFantasia || fornecedor.razaoSocial}" reativado!`);
      } else {
        toast.info(`Fornecedor "${fornecedor.nomeFantasia || fornecedor.razaoSocial}" inativado.`);
      }
    } catch (err: any) {
      toast.error('Erro ao alterar status do fornecedor.');
    }
  };

  // Exclusão
  const handleConfirmDelete = async () => {
    if (!fornecedorParaExcluir) return;
    const target = fornecedorParaExcluir;
    const nome = target.nomeFantasia || target.razaoSocial || 'Fornecedor';
    try {
      deleteItem(target.id);
      await fornecedorService.deleteFornecedor(target.id).catch(() => {});
      toast.success(`Fornecedor "${nome}" removido com sucesso.`);
    } catch {
      deleteItem(target.id);
      toast.success(`Fornecedor "${nome}" removido.`);
    } finally {
      setFornecedorParaExcluir(null);
    }
  };

  const handleOpenPerfil = (forn: Fornecedor) => {
    setFornecedorPerfil(forn);
    setPerfilOpen(true);
  };

  const handleOpenEdit = (forn: Fornecedor, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFornecedorParaEditar(forn);
    setEditOpen(true);
  };

  const getCleanPhone = (phone?: string) => {
    if (!phone) return '';
    return phone.replace(/\D/g, '');
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. STICKY TOP CONTROLS */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        {/* Barra de Busca + Filtros + Botão Novo */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar razão, fantasia, CNPJ, categoria..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Botão de Filtros */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground relative"
                aria-label="Filtrar"
              >
                <Filter className="w-4 h-4" />
                {(categoriaFilter !== 'todas' || statusFilter !== 'todos' || tipoFilter !== 'todos') && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Filtros de Fornecedores</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Filtre por categoria, status ou tipo de parceiro.
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4 text-xs">
                {/* Status */}
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Status</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'Ativo', label: 'Ativos' },
                      { id: 'Homologado', label: 'Homologados' },
                      { id: 'Em Análise', label: 'Em Análise' },
                      { id: 'Inativo', label: 'Inativos' },
                      { id: 'Bloqueado', label: 'Bloqueados' },
                    ].map((st) => (
                      <Button
                        key={st.id}
                        type="button"
                        variant={statusFilter === st.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter(st.id)}
                        className={`text-xs h-8 ${statusFilter === st.id ? 'bg-primary text-white' : ''}`}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tipo de Pessoa */}
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Tipo de Cadastro</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'Pessoa Jurídica', label: 'Pessoa Jurídica (PJ)' },
                      { id: 'Pessoa Física', label: 'Pessoa Física (PF)' },
                    ].map((tp) => (
                      <Button
                        key={tp.id}
                        type="button"
                        variant={tipoFilter === tp.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTipoFilter(tp.id)}
                        className={`text-xs h-8 ${tipoFilter === tp.id ? 'bg-primary text-white' : ''}`}
                      >
                        {tp.label}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Categorias */}
                {categoriasDisponiveis.length > 0 && (
                  <div>
                    <label className="font-semibold text-muted-foreground block mb-2">Categoria</label>
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                      <Button
                        type="button"
                        variant={categoriaFilter === 'todas' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setCategoriaFilter('todas')}
                        className={`text-[11px] h-7 ${categoriaFilter === 'todas' ? 'bg-primary text-white' : ''}`}
                      >
                        Todas
                      </Button>
                      {categoriasDisponiveis.map((cat) => (
                        <Button
                          key={cat}
                          type="button"
                          variant={categoriaFilter === cat ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setCategoriaFilter(cat)}
                          className={`text-[11px] h-7 ${categoriaFilter === cat ? 'bg-primary text-white' : ''}`}
                        >
                          {cat}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-10 rounded-xl font-bold"
                >
                  Aplicar Filtros ({filteredFornecedores.length} resultados)
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Novo Fornecedor */}
          <Button
            size="sm"
            onClick={() => {
              setFornecedorParaEditar(null);
              setNovoFornecedorOpen(true);
            }}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </Button>
        </div>

        {/* Horizontal Section Switcher (Fornecedores / Dashboard) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'lista', label: 'Fornecedores', icon: Building2 },
            { id: 'dashboard', label: 'Visão Geral & Métricas', icon: BarChart3 },
          ].map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Status Horizontal Scroll Pills */}
        {activeSection === 'lista' && (
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
            {[
              { id: 'ativos', label: `Ativos (${stats.ativos})` },
              { id: 'todos', label: `Todos (${stats.total})` },
              { id: 'homologados', label: 'Homologados' },
              { id: 'em_analise', label: `Em Análise (${stats.emAnalise})` },
              { id: 'inativos', label: `Inativos (${stats.inativos})` },
            ].map((pill) => {
              const isActive = activeTab === pill.id;
              return (
                <button
                  key={pill.id}
                  onClick={() => setActiveTab(pill.id as any)}
                  className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 ${
                    isActive
                      ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                      : 'bg-background text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  {pill.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. KPI SUMMARY BANNER */}
      {activeSection === 'lista' && (
        <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
          {/* Card Principal: Total de Fornecedores */}
          <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
            <div className="space-y-1 min-w-0">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Base de Fornecedores
              </span>
              <div className="text-2xl font-black tracking-tight text-foreground">
                {stats.total} parceiros
              </div>
              <p className="text-[10px] text-muted-foreground">
                {stats.ativos} ativos e homologados na operação
              </p>
            </div>

            <div className="flex flex-col items-end gap-1.5 shrink-0">
              <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-emerald-500/10 text-emerald-600 border-emerald-500/30">
                {stats.ativos} Ativos
              </Badge>
              {stats.emAnalise > 0 && (
                <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-blue-500/10 text-blue-600 border-blue-500/30">
                  {stats.emAnalise} Em Análise
                </Badge>
              )}
            </div>
          </div>

          {/* Mini Cards Financeiros */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-3 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <DollarSign className="w-3 h-3 text-emerald-500" />
                  Total Pago
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div className="text-sm font-black text-emerald-600 dark:text-emerald-400 truncate">
                {formatCurrency(stats.totalPago)}
              </div>
            </div>

            <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-3 shadow-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3 text-amber-500" />
                  Saldo em Aberto
                </span>
                <span className="w-2 h-2 rounded-full bg-amber-500" />
              </div>
              <div className="text-sm font-black text-amber-600 dark:text-amber-400 truncate">
                {formatCurrency(stats.totalAberto)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. CONTEÚDO PRINCIPAL */}
      {activeSection === 'dashboard' && (
        <div className="p-3.5">
          <Dashboard />
        </div>
      )}

      {activeSection === 'lista' && (
        <div className="p-3.5 space-y-2.5">
          {filteredFornecedores.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Building2 className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum fornecedor encontrado</div>
              <p className="text-xs text-muted-foreground">
                Não encontramos fornecedores com os filtros e busca aplicados.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setActiveTab('todos');
                  setStatusFilter('todos');
                  setCategoriaFilter('todas');
                  setTipoFilter('todos');
                }}
                className="text-xs"
              >
                Limpar Filtros
              </Button>
            </div>
          ) : (
            filteredFornecedores.map((fornecedor) => {
              const primaryContact = fornecedor.contatos?.find((c) => c.principal) || fornecedor.contatos?.[0];
              const phone = primaryContact?.celular || primaryContact?.telefone;
              const cleanPhone = getCleanPhone(phone);
              const email = primaryContact?.email;
              const isInactive = fornecedor.status === 'Inativo' || fornecedor.status === 'Bloqueado';

              return (
                <div
                  key={fornecedor.id}
                  onClick={() => handleOpenPerfil(fornecedor)}
                  className={`bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2 relative overflow-hidden ${
                    isInactive ? 'opacity-70 bg-muted/20' : ''
                  }`}
                >
                  {/* Barra lateral colorida de status */}
                  <div
                    className={`h-1 w-full absolute top-0 left-0 ${
                      fornecedor.status === 'Ativo'
                        ? 'bg-emerald-500'
                        : fornecedor.status === 'Homologado'
                        ? 'bg-purple-500'
                        : fornecedor.status === 'Em Análise'
                        ? 'bg-blue-500'
                        : fornecedor.status === 'Bloqueado'
                        ? 'bg-rose-500'
                        : 'bg-muted-foreground/40'
                    }`}
                  />

                  {/* Header do Card */}
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                          {fornecedor.codigo || `FOR-${fornecedor.id.slice(0, 4).toUpperCase()}`}
                        </span>
                        {getStatusBadge(fornecedor.status)}
                        {fornecedor.categoria && (
                          <Badge variant="outline" className="text-[10px] font-medium border-muted-foreground/30 text-muted-foreground">
                            {fornecedor.categoria}
                          </Badge>
                        )}
                      </div>

                      <h4 className="font-bold text-sm text-foreground truncate">
                        {fornecedor.nomeFantasia || fornecedor.razaoSocial || 'Fornecedor Sem Nome'}
                      </h4>
                      {fornecedor.razaoSocial && fornecedor.nomeFantasia && fornecedor.razaoSocial !== fornecedor.nomeFantasia && (
                        <p className="text-[11px] text-muted-foreground truncate">
                          {fornecedor.razaoSocial}
                        </p>
                      )}
                    </div>

                    {/* Menu de Ações Rápidas */}
                    <div onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44 text-xs z-[9999]">
                          <DropdownMenuItem onClick={() => handleOpenPerfil(fornecedor)} className="gap-2">
                            <Eye className="w-3.5 h-3.5 text-blue-500" /> Ver Perfil 360°
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleOpenEdit(fornecedor, e as any)} className="gap-2">
                            <Edit3 className="w-3.5 h-3.5 text-primary" /> Editar Cadastro
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleToggleStatus(fornecedor, e as any)} className="gap-2">
                            {fornecedor.status === 'Ativo' ? (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-amber-500" /> Inativar
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Reativar
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setFornecedorParaExcluir(fornecedor)}
                            className="gap-2 text-rose-600 focus:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="grid grid-cols-2 gap-2 text-xs py-1 border-t border-dashed">
                    <div>
                      <span className="text-[10px] text-muted-foreground block">CNPJ / CPF</span>
                      <span className="font-mono text-[11px] text-foreground font-medium">
                        {fornecedor.documento || 'Não informado'}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-muted-foreground block">Localização</span>
                      <span className="text-[11px] text-foreground truncate flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                        {fornecedor.endereco?.cidade ? `${fornecedor.endereco.cidade}/${fornecedor.endereco.estado}` : 'Não informada'}
                      </span>
                    </div>
                  </div>

                  {/* Financeiro Consolidado */}
                  <div className="flex items-center justify-between pt-1 border-t border-dashed text-[11px]">
                    <div className="flex items-center gap-3">
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase block font-bold">Total Pago</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(fornecedor.totalPago)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-muted-foreground uppercase block font-bold">Em Aberto</span>
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          {formatCurrency(fornecedor.saldoAberto)}
                        </span>
                      </div>
                    </div>

                    {/* Botões de Contato Rápido */}
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      {cleanPhone && (
                        <>
                          <a
                            href={`https://wa.me/55${cleanPhone}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-7 w-7 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center hover:bg-green-500/20 transition-colors"
                            title="WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                          <a
                            href={`tel:${cleanPhone}`}
                            className="h-7 w-7 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                            title="Ligar"
                          >
                            <Phone className="w-3.5 h-3.5" />
                          </a>
                        </>
                      )}

                      {email && (
                        <a
                          href={`mailto:${email}`}
                          className="h-7 w-7 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center hover:bg-purple-500/20 transition-colors"
                          title="Enviar E-mail"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Sheet de Perfil 360° */}
      <FornecedorPerfilSheet
        fornecedor={fornecedorPerfil}
        open={perfilOpen}
        onOpenChange={setPerfilOpen}
        onEdit={(forn) => {
          setPerfilOpen(false);
          setFornecedorParaEditar(forn);
          setEditOpen(true);
        }}
        onDelete={(forn) => {
          setPerfilOpen(false);
          setFornecedorParaExcluir(forn);
        }}
      />

      {/* Sheet de Cadastro / Edição Completa */}
      <NovoFornecedorSheet
        fornecedorToEdit={fornecedorParaEditar}
        open={editOpen || novoFornecedorOpen}
        onOpenChange={(op) => {
          setEditOpen(op);
          setNovoFornecedorOpen(op);
          if (!op) setFornecedorParaEditar(null);
        }}
      />

      {/* Confirmação de Exclusão */}
      <AlertDialog open={Boolean(fornecedorParaExcluir)} onOpenChange={(op) => !op && setFornecedorParaExcluir(null)}>
        <AlertDialogContent className="max-w-md rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Excluir Fornecedor
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Tem certeza que deseja remover o fornecedor <strong className="text-foreground">{fornecedorParaExcluir?.nomeFantasia || fornecedorParaExcluir?.razaoSocial}</strong>? Esta ação removerá o cadastro do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="text-xs h-9 rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs h-9 rounded-xl font-bold"
            >
              Sim, Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useEstoquePatrimonio } from '../hooks/useEstoquePatrimonio';
import { Equipamento, EstoqueItem, Licenca, Patrimonio, Movimentacao, Manutencao } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Filter, Plus, Laptop, Package, KeyRound, DollarSign,
  History, Wrench, Trash2, ArrowRightLeft, Check, AlertTriangle,
  FileText, Building2, User, Calendar, ShieldAlert, Layers
} from 'lucide-react';
import { RelatoriosModal } from './RelatoriosModal';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileEstoquePatrimonioView() {
  const {
    equipamentos,
    estoqueItens,
    licencas,
    patrimonios,
    movimentacoes,
    manutencoes,
    registrarNovoEquipamento,
    transferirEquipamento,
    ajustarEstoqueItemComFinanceiro,
    criarLicencaComFinanceiro,
    abrirManutencaoComFinanceiro,
    deleteEquipamento,
    deleteEstoqueItem,
    deleteLicenca
  } = useEstoquePatrimonio();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'equipamentos' | 'estoque' | 'licencas' | 'patrimonio' | 'movimentacoes' | 'manutencoes'>('equipamentos');
  const [situacaoFilter, setSituacaoFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [relatoriosModalOpen, setRelatoriosModalOpen] = useState(false);

  // Modais de Criação / Ação
  const [novoEquipamentoOpen, setNovoEquipamentoOpen] = useState(false);
  const [novoItemEstoqueOpen, setNovoItemEstoqueOpen] = useState(false);
  const [novaLicencaOpen, setNovaLicencaOpen] = useState(false);
  const [transferirModalOpen, setTransferirModalOpen] = useState(false);
  const [manutencaoModalOpen, setManutencaoModalOpen] = useState(false);
  const [ajusteEstoqueModalOpen, setAjusteEstoqueModalOpen] = useState(false);

  const [selectedEquipamento, setSelectedEquipamento] = useState<Equipamento | null>(null);
  const [selectedEstoqueItem, setSelectedEstoqueItem] = useState<EstoqueItem | null>(null);

  // Forms
  const [formEq, setFormEq] = useState({
    codigoPatrimonial: '',
    tipo: 'Notebook' as any,
    marca: '',
    modelo: '',
    numeroSerie: '',
    valorCompra: '',
    colaboradorNome: '',
    departamento: 'Tecnologia',
    localFisica: 'São Paulo - Sede',
    categoria: 'Notebook' as any
  });

  const [formTransfer, setFormTransfer] = useState({
    novoResponsavel: '',
    novoDepartamento: 'Operações',
    novaLocalizacao: 'São Paulo - Sede',
    observacao: ''
  });

  const [formManut, setFormManut] = useState({
    tipo: 'Corretiva' as const,
    descricao: '',
    valor: '',
    responsavel: 'Assistência Técnica Autorizada'
  });

  const [formAjusteEstoque, setFormAjusteEstoque] = useState({
    tipoOperacao: 'Entrada' as 'Entrada' | 'Saída',
    quantidade: '1',
    motivo: 'Reposição de estoque',
    valorTotal: ''
  });

  // KPIs
  const stats = useMemo(() => {
    const totalEquipamentos = equipamentos.length;
    const equipamentosEmUso = equipamentos.filter(e => e.situacao === 'Em Uso').length;
    const totalPatrimonioValor = patrimonios.reduce((acc, p) => acc + (p.valorAtual || p.valorCompra || 0), 0);
    const totalLicencasCusto = licencas.reduce((acc, l) => acc + (l.valor || 0), 0);
    const itensAbaixoMinimo = estoqueItens.filter(i => i.quantidade < i.quantidadeMinima).length;

    return {
      totalEquipamentos,
      equipamentosEmUso,
      totalPatrimonioValor,
      totalLicencasCusto,
      totalEstoqueItens: estoqueItens.length,
      itensAbaixoMinimo,
      totalLicencas: licencas.length
    };
  }, [equipamentos, patrimonios, licencas, estoqueItens]);

  // Filtragem Equipamentos
  const filteredEquipamentos = useMemo(() => {
    return equipamentos.filter(e => {
      if (!e) return false;
      const s = searchTerm.toLowerCase();
      const matchSearch =
        (e.codigoPatrimonial || '').toLowerCase().includes(s) ||
        (e.marca || '').toLowerCase().includes(s) ||
        (e.modelo || '').toLowerCase().includes(s) ||
        (e.colaboradorNome || '').toLowerCase().includes(s) ||
        (e.departamento || '').toLowerCase().includes(s);

      if (!matchSearch) return false;
      if (situacaoFilter !== 'todos' && e.situacao !== situacaoFilter) return false;
      return true;
    });
  }, [equipamentos, searchTerm, situacaoFilter]);

  // Filtragem Estoque
  const filteredEstoque = useMemo(() => {
    return estoqueItens.filter(i => {
      if (!i) return false;
      const s = searchTerm.toLowerCase();
      return (
        (i.nome || '').toLowerCase().includes(s) ||
        (i.codigo || '').toLowerCase().includes(s) ||
        (i.categoria || '').toLowerCase().includes(s)
      );
    });
  }, [estoqueItens, searchTerm]);

  // Filtragem Licenças
  const filteredLicencas = useMemo(() => {
    return licencas.filter(l => {
      if (!l) return false;
      const s = searchTerm.toLowerCase();
      return (
        (l.nome || '').toLowerCase().includes(s) ||
        (l.fabricante || '').toLowerCase().includes(s) ||
        (l.plano || '').toLowerCase().includes(s)
      );
    });
  }, [licencas, searchTerm]);

  // Filtragem Patrimônio
  const filteredPatrimonio = useMemo(() => {
    return patrimonios.filter(p => {
      if (!p) return false;
      const s = searchTerm.toLowerCase();
      return (
        (p.numeroPatrimonial || '').toLowerCase().includes(s) ||
        (p.categoria || '').toLowerCase().includes(s) ||
        (p.codigoInterno || '').toLowerCase().includes(s)
      );
    });
  }, [patrimonios, searchTerm]);

  // Filtragem Movimentações
  const filteredMovimentacoes = useMemo(() => {
    return movimentacoes.filter(m => {
      if (!m) return false;
      const s = searchTerm.toLowerCase();
      return (
        (m.equipamentoNome || '').toLowerCase().includes(s) ||
        (m.estoqueItemNome || '').toLowerCase().includes(s) ||
        (m.tipo || '').toLowerCase().includes(s) ||
        (m.responsavelNome || '').toLowerCase().includes(s)
      );
    });
  }, [movimentacoes, searchTerm]);

  // Filtragem Manutenções
  const filteredManutencoes = useMemo(() => {
    return manutencoes.filter(m => {
      if (!m) return false;
      const s = searchTerm.toLowerCase();
      return (
        (m.equipamentoNome || '').toLowerCase().includes(s) ||
        (m.tipo || '').toLowerCase().includes(s) ||
        (m.responsavelNome || '').toLowerCase().includes(s)
      );
    });
  }, [manutencoes, searchTerm]);

  const handleCreateEquipamento = () => {
    if (!formEq.codigoPatrimonial.trim()) { toast.error('Informe o código patrimonial'); return; }
    if (!formEq.modelo.trim()) { toast.error('Informe o modelo'); return; }

    const val = parseFloat(formEq.valorCompra.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    registrarNovoEquipamento({
      codigoPatrimonial: formEq.codigoPatrimonial,
      tipo: formEq.tipo,
      marca: formEq.marca || 'Genérica',
      modelo: formEq.modelo,
      numeroSerie: formEq.numeroSerie || `SN-${Date.now().toString().slice(-6)}`,
      valorCompra: val,
      dataCompra: new Date().toISOString().split('T')[0],
      colaboradorNome: formEq.colaboradorNome,
      departamento: formEq.departamento,
      localFisica: formEq.localFisica,
      situacao: formEq.colaboradorNome ? 'Em Uso' : 'Disponível',
      categoria: formEq.categoria,
    });

    toast.success(`Equipamento ${formEq.codigoPatrimonial} cadastrado!`);
    setNovoEquipamentoOpen(false);
    setFormEq({
      codigoPatrimonial: '',
      tipo: 'Notebook',
      marca: '',
      modelo: '',
      numeroSerie: '',
      valorCompra: '',
      colaboradorNome: '',
      departamento: 'Tecnologia',
      localFisica: 'São Paulo - Sede',
      categoria: 'Notebook'
    });
  };

  const handleExecuteTransfer = () => {
    if (!selectedEquipamento) return;
    if (!formTransfer.novoResponsavel.trim()) { toast.error('Informe o novo responsável'); return; }

    transferirEquipamento(
      selectedEquipamento.id,
      formTransfer.novoResponsavel,
      formTransfer.novoDepartamento,
      formTransfer.novaLocalizacao,
      formTransfer.observacao || 'Transferência realizada via app mobile'
    );

    toast.success(`Equipamento transferido para ${formTransfer.novoResponsavel}!`);
    setTransferirModalOpen(false);
    setSelectedEquipamento(null);
    setFormTransfer({ novoResponsavel: '', novoDepartamento: 'Operações', novaLocalizacao: 'São Paulo - Sede', observacao: '' });
  };

  const handleExecuteManutencao = () => {
    if (!selectedEquipamento) return;
    if (!formManut.descricao.trim()) { toast.error('Informe a descrição da manutenção'); return; }

    const val = parseFloat(formManut.valor.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    abrirManutencaoComFinanceiro({
      equipamentoId: selectedEquipamento.id,
      tipo: formManut.tipo,
      descricao: formManut.descricao,
      valor: val,
      responsavel: formManut.responsavel,
    });

    toast.success(`Ordem de manutenção aberta para ${selectedEquipamento.modelo}!`);
    setManutencaoModalOpen(false);
    setSelectedEquipamento(null);
    setFormManut({ tipo: 'Corretiva', descricao: '', valor: '', responsavel: 'Assistência Técnica Autorizada' });
  };

  const handleExecuteAjusteEstoque = () => {
    if (!selectedEstoqueItem) return;
    const qtd = parseInt(formAjusteEstoque.quantidade) || 1;
    const val = parseFloat(formAjusteEstoque.valorTotal.replace(/[^\d,.-]/g, '').replace(',', '.')) || 0;

    ajustarEstoqueItemComFinanceiro({
      itemId: selectedEstoqueItem.id,
      quantidadeMudanca: qtd,
      tipoOperacao: formAjusteEstoque.tipoOperacao,
      motivo: formAjusteEstoque.motivo,
      gerarFinanceiro: val > 0,
      valorTotal: val
    });

    toast.success(`${formAjusteEstoque.tipoOperacao} de ${qtd} un. realizada com sucesso!`);
    setAjusteEstoqueModalOpen(false);
    setSelectedEstoqueItem(null);
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao) {
      case 'Em Uso':
        return <Badge className="bg-blue-600 text-white text-[10px] font-bold">Em Uso</Badge>;
      case 'Disponível':
        return <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Disponível</Badge>;
      case 'Manutenção':
        return <Badge variant="destructive" className="text-[10px] font-bold">Manutenção</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] font-bold">{situacao || 'Pendente'}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. TOP CARDS & RESUMO KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        {/* Card Principal: Total Ativos */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-primary" />
              Equipamentos & Ativos
            </span>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {stats.totalEquipamentos} ativos
            </div>
            <p className="text-[10px] text-muted-foreground">
              {stats.equipamentosEmUso} em uso ({stats.totalEquipamentos > 0 ? Math.round((stats.equipamentosEmUso / stats.totalEquipamentos) * 100) : 0}%)
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
              {formatCurrency(stats.totalPatrimonioValor)}
            </Badge>
            <span className="text-[10px] text-muted-foreground">
              {stats.totalLicencas} licenças SaaS
            </span>
          </div>
        </div>

        {/* Mini Cards: Estoque & Licenças */}
        <div className="grid grid-cols-2 gap-2.5">
          <div
            onClick={() => setActiveTab('estoque')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'estoque' ? 'border-primary ring-1 ring-primary/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Package className="w-3 h-3 text-amber-500" />
                Almoxarifado
              </span>
              {stats.itensAbaixoMinimo > 0 ? (
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </div>
            <div className="text-base font-black text-foreground">
              {stats.totalEstoqueItens} itens
            </div>
            {stats.itensAbaixoMinimo > 0 && (
              <p className="text-[10px] text-rose-600 font-bold">
                {stats.itensAbaixoMinimo} abaixo do mín.
              </p>
            )}
          </div>

          <div
            onClick={() => setActiveTab('licencas')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'licencas' ? 'border-primary ring-1 ring-primary/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <KeyRound className="w-3 h-3 text-indigo-500" />
                SaaS & Licenças
              </span>
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
            </div>
            <div className="text-sm font-black text-indigo-600 dark:text-indigo-400 truncate">
              {formatCurrency(stats.totalLicencasCusto)}/mês
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY SEARCH & FILTER BAR */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar patrimônio, modelo, responsável..."
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
                {situacaoFilter !== 'todos' && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Filtros de Estoque e Patrimônio</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Filtre por situação dos equipamentos.
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Situação</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'todos', label: 'Todas' },
                      { id: 'Em Uso', label: 'Em Uso' },
                      { id: 'Disponível', label: 'Disponível' },
                      { id: 'Manutenção', label: 'Manutenção' },
                    ].map((st) => (
                      <Button
                        key={st.id}
                        type="button"
                        variant={situacaoFilter === st.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSituacaoFilter(st.id)}
                        className={`text-xs h-8 ${situacaoFilter === st.id ? 'bg-primary text-white' : ''}`}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-10 rounded-xl font-bold"
                >
                  Aplicar Filtros
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Novo Equipamento */}
          <Button
            size="sm"
            onClick={() => setNovoEquipamentoOpen(true)}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo
          </Button>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'equipamentos', label: `Equipamentos (${equipamentos.length})` },
            { id: 'estoque', label: `Estoque (${estoqueItens.length})` },
            { id: 'licencas', label: `Licenças (${licencas.length})` },
            { id: 'patrimonio', label: `Patrimônio (${patrimonios.length})` },
            { id: 'movimentacoes', label: `Movimentações (${movimentacoes.length})` },
            { id: 'manutencoes', label: `Manutenções (${manutencoes.length})` },
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
      </div>

      {/* 3. LISTA DE CONTEÚDO CONFORME ABA (CARDS TOUCH) */}
      <div className="p-3.5 space-y-2.5">
        {/* ABA: EQUIPAMENTOS */}
        {activeTab === 'equipamentos' && (
          filteredEquipamentos.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Laptop className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum equipamento encontrado</div>
              <Button variant="outline" size="sm" onClick={() => setNovoEquipamentoOpen(true)} className="text-xs">
                Novo Equipamento
              </Button>
            </div>
          ) : (
            filteredEquipamentos.map((eq) => (
              <div
                key={eq.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] flex flex-col gap-2.5 relative overflow-hidden"
              >
                <div className={`h-1 w-full absolute top-0 left-0 ${
                  eq.situacao === 'Em Uso' ? 'bg-blue-500' : eq.situacao === 'Disponível' ? 'bg-emerald-500' : 'bg-rose-500'
                }`} />

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                        {eq.codigoPatrimonial}
                      </span>
                      {getSituacaoBadge(eq.situacao)}
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {eq.categoria}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {eq.marca} {eq.modelo}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate flex items-center gap-1 mt-0.5">
                      <User className="w-3 h-3" /> {eq.colaboradorNome || 'Disponível em Estoque'} • {eq.departamento}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-foreground">
                      {formatCurrency(eq.valorCompra)}
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {eq.localFisica}
                    </span>
                  </div>
                </div>

                {/* Ações Rápidas */}
                <div className="flex items-center justify-between pt-2 border-t border-dashed gap-2">
                  <span className="text-[10px] text-muted-foreground font-mono">
                    SN: {eq.numeroSerie}
                  </span>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEquipamento(eq);
                        setTransferirModalOpen(true);
                      }}
                      className="h-7 px-2 text-[10px] font-bold gap-1 rounded-lg"
                    >
                      <ArrowRightLeft className="w-3 h-3 text-primary" />
                      Transferir
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedEquipamento(eq);
                        setManutencaoModalOpen(true);
                      }}
                      className="h-7 px-2 text-[10px] font-bold gap-1 rounded-lg"
                    >
                      <Wrench className="w-3 h-3 text-amber-500" />
                      Manutenção
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        deleteEquipamento(eq.id);
                        toast.success('Equipamento removido');
                      }}
                      className="h-7 w-7 p-0 text-muted-foreground hover:text-rose-600 rounded-lg"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* ABA: ESTOQUE (ITENS ALMOXARIFADO) */}
        {activeTab === 'estoque' && (
          filteredEstoque.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Package className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum item em estoque</div>
            </div>
          ) : (
            filteredEstoque.map((it) => {
              const isAbaixo = it.quantidade < it.quantidadeMinima;
              return (
                <div
                  key={it.id}
                  className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-2 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                          {it.codigo}
                        </span>
                        {isAbaixo && (
                          <Badge variant="destructive" className="text-[10px] font-bold gap-1">
                            <AlertTriangle className="w-3 h-3" /> Abaixo do Mínimo
                          </Badge>
                        )}
                        <Badge variant="secondary" className="text-[10px]">{it.categoria}</Badge>
                      </div>
                      <h4 className="font-bold text-sm text-foreground truncate">{it.nome}</h4>
                      <p className="text-xs text-muted-foreground">{it.localizacao}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono text-base font-black text-foreground">
                        {it.quantidade} un.
                      </div>
                      <span className="text-[10px] text-muted-foreground block">
                        Mínimo: {it.quantidadeMinima} un.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-dashed gap-2">
                    <span className="text-[10px] text-muted-foreground">
                      Unitário: {formatCurrency(it.valorUnitario)}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedEstoqueItem(it);
                          setAjusteEstoqueModalOpen(true);
                        }}
                        className="h-7 px-2.5 text-[10px] font-bold bg-primary text-white rounded-lg gap-1"
                      >
                        <ArrowRightLeft className="w-3 h-3" /> Movimentar
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )
        )}

        {/* ABA: LICENÇAS */}
        {activeTab === 'licencas' && (
          filteredLicencas.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <KeyRound className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma licença SaaS cadastrada</div>
            </div>
          ) : (
            filteredLicencas.map((lic) => (
              <div
                key={lic.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Badge className="bg-indigo-600 text-white text-[10px] font-bold">{lic.fabricante}</Badge>
                      <Badge variant="outline" className="text-[10px]">{lic.status || 'Ativa'}</Badge>
                    </div>
                    <h4 className="font-bold text-sm text-foreground truncate">{lic.nome}</h4>
                    <p className="text-xs text-muted-foreground">Plano: {lic.plano} • {lic.quantidadeTotal} assentos</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                      {formatCurrency(lic.valor)}
                    </div>
                    <span className="text-[10px] text-muted-foreground block">
                      Venc: {lic.vencimento ? formatDateBrasilia(lic.vencimento) : 'Mensal'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* ABA: PATRIMÔNIO */}
        {activeTab === 'patrimonio' && (
          filteredPatrimonio.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <DollarSign className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhum registro patrimonial</div>
            </div>
          ) : (
            filteredPatrimonio.map((pat) => (
              <div
                key={pat.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                        {pat.numeroPatrimonial}
                      </span>
                      <Badge variant="outline" className="text-[10px]">{pat.categoria}</Badge>
                    </div>
                    <h4 className="font-bold text-sm text-foreground">{pat.centroCustoNome || 'TI & Infra'}</h4>
                    <p className="text-xs text-muted-foreground">Estado: {pat.estadoConservacao} • Vida útil: {pat.vidaUtilAnos} anos</p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-foreground">
                      {formatCurrency(pat.valorAtual || pat.valorCompra)}
                    </div>
                    <span className="text-[10px] text-rose-600 block">
                      Deprec: {formatCurrency(pat.depreciacaoAcumulada)}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )
        )}

        {/* ABA: MOVIMENTAÇÕES */}
        {activeTab === 'movimentacoes' && (
          filteredMovimentacoes.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <History className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma movimentação registrada</div>
            </div>
          ) : (
            filteredMovimentacoes.map((m) => (
              <div
                key={m.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-1.5 text-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge className="text-[10px] font-bold bg-primary text-white">{m.tipo}</Badge>
                  <span className="text-[10px] text-muted-foreground">{m.dataHora}</span>
                </div>
                <h4 className="font-bold text-foreground">{m.equipamentoNome || m.estoqueItemNome}</h4>
                <p className="text-muted-foreground text-[11px]">{m.origem} ➔ {m.destino}</p>
                {m.observacoes && (
                  <p className="text-muted-foreground bg-muted/40 p-2 rounded-lg text-[10px] mt-1 border">
                    {m.observacoes}
                  </p>
                )}
              </div>
            ))
          )
        )}

        {/* ABA: MANUTENÇÕES */}
        {activeTab === 'manutencoes' && (
          filteredManutencoes.length === 0 ? (
            <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
              <Wrench className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
              <div className="font-semibold text-sm text-foreground">Nenhuma ordem de manutenção</div>
            </div>
          ) : (
            filteredManutencoes.map((mn) => (
              <div
                key={mn.id}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs flex flex-col gap-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="text-[10px] font-bold text-amber-600 border-amber-300 bg-amber-50">
                    {mn.tipo}
                  </Badge>
                  <Badge className="text-[10px] bg-blue-600 text-white">{mn.status}</Badge>
                </div>
                <h4 className="font-bold text-sm text-foreground">{mn.equipamentoNome}</h4>
                <p className="text-xs text-muted-foreground">{mn.descricao}</p>
                <div className="flex items-center justify-between pt-2 border-t border-dashed text-[11px]">
                  <span className="text-muted-foreground">{mn.responsavelNome}</span>
                  <span className="font-mono font-bold text-rose-600">{formatCurrency(mn.valor)}</span>
                </div>
              </div>
            ))
          )
        )}
      </div>

      {/* Modal Novo Equipamento */}
      <Dialog open={novoEquipamentoOpen} onOpenChange={setNovoEquipamentoOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Laptop className="w-5 h-5 text-primary" /> Novo Equipamento / Ativo
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Código Patrimonial *</Label>
                <Input
                  placeholder="Ex: PAT-010"
                  value={formEq.codigoPatrimonial}
                  onChange={e => setFormEq(f => ({ ...f, codigoPatrimonial: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Categoria</Label>
                <Select value={formEq.categoria} onValueChange={v => setFormEq(f => ({ ...f, categoria: v as any }))}>
                  <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Notebook">Notebook</SelectItem>
                    <SelectItem value="Desktop">Desktop</SelectItem>
                    <SelectItem value="Monitor">Monitor</SelectItem>
                    <SelectItem value="Celular / Smartphone">Celular</SelectItem>
                    <SelectItem value="Periférico">Periférico</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Marca</Label>
                <Input
                  placeholder="Ex: Dell, Apple"
                  value={formEq.marca}
                  onChange={e => setFormEq(f => ({ ...f, marca: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Modelo *</Label>
                <Input
                  placeholder="Ex: XPS 15 32GB"
                  value={formEq.modelo}
                  onChange={e => setFormEq(f => ({ ...f, modelo: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Valor de Compra (R$)</Label>
                <Input
                  placeholder="Ex: 8.500,00"
                  value={formEq.valorCompra}
                  onChange={e => setFormEq(f => ({ ...f, valorCompra: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Número de Série</Label>
                <Input
                  placeholder="Ex: SN-883921"
                  value={formEq.numeroSerie}
                  onChange={e => setFormEq(f => ({ ...f, numeroSerie: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Responsável</Label>
                <Input
                  placeholder="Ex: Carlos Silva"
                  value={formEq.colaboradorNome}
                  onChange={e => setFormEq(f => ({ ...f, colaboradorNome: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Departamento</Label>
                <Input
                  placeholder="Ex: Tecnologia"
                  value={formEq.departamento}
                  onChange={e => setFormEq(f => ({ ...f, departamento: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setNovoEquipamentoOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateEquipamento} className="bg-primary text-white font-bold">
              Cadastrar Equipamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Transferência */}
      <Dialog open={transferirModalOpen} onOpenChange={setTransferirModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowRightLeft className="w-5 h-5 text-primary" /> Transferir Equipamento
            </DialogTitle>
          </DialogHeader>

          {selectedEquipamento && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 bg-muted/40 rounded-xl border">
                <span className="font-bold text-foreground">{selectedEquipamento.marca} {selectedEquipamento.modelo}</span>
                <p className="text-muted-foreground text-[11px]">Patrimônio: {selectedEquipamento.codigoPatrimonial}</p>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Novo Responsável *</Label>
                <Input
                  placeholder="Ex: Beatriz Santos"
                  value={formTransfer.novoResponsavel}
                  onChange={e => setFormTransfer(f => ({ ...f, novoResponsavel: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Novo Departamento</Label>
                  <Input
                    placeholder="Ex: Marketing"
                    value={formTransfer.novoDepartamento}
                    onChange={e => setFormTransfer(f => ({ ...f, novoDepartamento: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Nova Localização</Label>
                  <Input
                    placeholder="Ex: Rio de Janeiro"
                    value={formTransfer.novaLocalizacao}
                    onChange={e => setFormTransfer(f => ({ ...f, novaLocalizacao: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Observações</Label>
                <Textarea
                  placeholder="Motivo da transferência..."
                  value={formTransfer.observacao}
                  onChange={e => setFormTransfer(f => ({ ...f, observacao: e.target.value }))}
                  rows={2}
                  className="text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setTransferirModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleExecuteTransfer} className="bg-primary text-white font-bold">
              Confirmar Transferência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Manutenção */}
      <Dialog open={manutencaoModalOpen} onOpenChange={setManutencaoModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Wrench className="w-5 h-5 text-amber-500" /> Abrir Ordem de Manutenção
            </DialogTitle>
          </DialogHeader>

          {selectedEquipamento && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 bg-muted/40 rounded-xl border">
                <span className="font-bold text-foreground">{selectedEquipamento.marca} {selectedEquipamento.modelo}</span>
                <p className="text-muted-foreground text-[11px]">Patrimônio: {selectedEquipamento.codigoPatrimonial}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Tipo</Label>
                  <Select value={formManut.tipo} onValueChange={v => setFormManut(f => ({ ...f, tipo: v as any }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Preventiva">Preventiva</SelectItem>
                      <SelectItem value="Corretiva">Corretiva</SelectItem>
                      <SelectItem value="Upgrade">Upgrade</SelectItem>
                      <SelectItem value="Troca">Troca</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Custo Estimado (R$)</Label>
                  <Input
                    placeholder="Ex: 450,00"
                    value={formManut.valor}
                    onChange={e => setFormManut(f => ({ ...f, valor: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Descrição do Problema / Serviço *</Label>
                <Textarea
                  placeholder="Ex: Troca de teclado e limpeza preventiva..."
                  value={formManut.descricao}
                  onChange={e => setFormManut(f => ({ ...f, descricao: e.target.value }))}
                  rows={2}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Assistência / Prestador</Label>
                <Input
                  placeholder="Ex: Dell Care / Tech Support"
                  value={formManut.responsavel}
                  onChange={e => setFormManut(f => ({ ...f, responsavel: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setManutencaoModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleExecuteManutencao} className="bg-amber-600 hover:bg-amber-700 text-white font-bold">
              Abrir Manutenção
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Ajuste de Estoque */}
      <Dialog open={ajusteEstoqueModalOpen} onOpenChange={setAjusteEstoqueModalOpen}>
        <DialogContent className="max-w-md rounded-2xl p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <ArrowRightLeft className="w-5 h-5 text-primary" /> Movimentar Estoque
            </DialogTitle>
          </DialogHeader>

          {selectedEstoqueItem && (
            <div className="space-y-3 py-2 text-xs">
              <div className="p-2.5 bg-muted/40 rounded-xl border">
                <span className="font-bold text-foreground">{selectedEstoqueItem.nome}</span>
                <p className="text-muted-foreground text-[11px]">Estoque Atual: {selectedEstoqueItem.quantidade} un.</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Operação</Label>
                  <Select value={formAjusteEstoque.tipoOperacao} onValueChange={v => setFormAjusteEstoque(f => ({ ...f, tipoOperacao: v as any }))}>
                    <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entrada">Entrada (Compra/Reposição)</SelectItem>
                      <SelectItem value="Saída">Saída (Consumo/Uso)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Quantidade</Label>
                  <Input
                    type="number"
                    placeholder="1"
                    value={formAjusteEstoque.quantidade}
                    onChange={e => setFormAjusteEstoque(f => ({ ...f, quantidade: e.target.value }))}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Motivo</Label>
                <Input
                  placeholder="Ex: Entrega para novos colaboradores"
                  value={formAjusteEstoque.motivo}
                  onChange={e => setFormAjusteEstoque(f => ({ ...f, motivo: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-2">
            <Button variant="outline" size="sm" onClick={() => setAjusteEstoqueModalOpen(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleExecuteAjusteEstoque} className="bg-primary text-white font-bold">
              Confirmar Movimentação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Relatórios Modal */}
      <RelatoriosModal open={relatoriosModalOpen} onOpenChange={setRelatoriosModalOpen} />
    </div>
  );
}

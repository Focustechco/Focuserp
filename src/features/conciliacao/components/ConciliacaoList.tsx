import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Check, ArrowRightLeft, Link as LinkIcon, Download, 
  RotateCcw, Building2, Trash2, MoreHorizontal, AlertTriangle, 
  CheckCircle2, X, RefreshCw, Layers, ShieldCheck, Unlink
} from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaBancaria, MovimentacaoBancaria } from '../types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { TituloReceber } from '@/features/contas-receber/types';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  const val = typeof value === 'number' && !isNaN(value) ? value : 0;
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
};

const formatDateSafe = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return format(d, 'dd/MM/yyyy');
  } catch {
    return dateStr;
  }
};

export const renderHistoricoSafe = (val: any): string => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (Array.isArray(val)) {
    return val.map(item => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.acao || item.descricao || item.historico || JSON.stringify(item);
      }
      return String(item || '');
    }).filter(Boolean).join('; ');
  }
  if (typeof val === 'object') {
    return val.acao || val.descricao || val.historico || JSON.stringify(val);
  }
  return String(val);
};

export const isValidExtrato = (e: MovimentacaoBancaria) => {
  if (!e || typeof e !== 'object') return false;
  if (!e.id || !e.contaBancariaId) return false;
  if (typeof e.valor !== 'number' || isNaN(e.valor) || e.valor === 0) return false;
  if (!e.data || e.data === '-' || e.data === 'undefined') return false;
  return true;
};

export function ConciliacaoList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedContaFilter, setSelectedContaFilter] = useState<string>('todas');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');

  // Estados de Modais Título por Título
  const [extratoParaExcluir, setExtratoParaExcluir] = useState<MovimentacaoBancaria | null>(null);
  const [extratoParaBuscar, setExtratoParaBuscar] = useState<MovimentacaoBancaria | null>(null);
  const [searchTituloModal, setSearchTituloModal] = useState('');
  const [isResetAllModalOpen, setIsResetAllModalOpen] = useState(false);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  const { data: contasBancarias = [] } = useLocalStorageState<ContaBancaria>('focus_contas_bancarias', []);
  const { 
    data: rawExtratos, 
    updateItem: updateExtrato, 
    removeItem: removeExtrato,
    setData: setExtratos
  } = useLocalStorageState<MovimentacaoBancaria>('focus_extratos', []);
  const { data: contasPagar = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar', []);
  const { data: contasReceber = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber', []);

  // Limpeza automática de itens corrompidos/sem conta ou valor NaN
  useEffect(() => {
    if (Array.isArray(rawExtratos)) {
      const validOnly = rawExtratos.filter(isValidExtrato);
      if (validOnly.length !== rawExtratos.length) {
        try {
          localStorage.setItem('focus_extratos', JSON.stringify(validOnly));
        } catch (err) {
          console.error("Erro ao limpar extratos inválidos:", err);
        }
      }
    }
  }, [rawExtratos]);

  const validExtratos = useMemo(() => {
    return (rawExtratos || []).filter(isValidExtrato);
  }, [rawExtratos]);

  // Estrutura unificada de lançamentos ERP reais para Match
  const erpLancamentos = useMemo(() => {
    const list: { 
      id: string; 
      origem: 'Pagar' | 'Receber';
      numero?: string;
      tipo: string; 
      valor: number; 
      dataVencimento?: string;
      historico: string; 
      entidadeVinculo: string; 
      statusFinanceiro: string;
      centroCustoId?: string;
    }[] = [];
    
    (contasPagar || []).forEach(cp => {
      list.push({
        id: cp.id,
        origem: 'Pagar',
        numero: cp.numero,
        tipo: 'Despesa',
        valor: Number(cp.valorFinal || cp.valorOriginal || 0),
        dataVencimento: cp.dataVencimento,
        historico: cp.descricao || cp.fornecedor || 'Despesa ERP',
        entidadeVinculo: cp.fornecedor || 'Fornecedor',
        statusFinanceiro: cp.status === 'Pago' ? 'Baixado' : 'Aberto',
        centroCustoId: cp.centroCusto
      });
    });

    (contasReceber || []).forEach(cr => {
      list.push({
        id: cr.id,
        origem: 'Receber',
        numero: cr.numero,
        tipo: 'Receita',
        valor: Number(cr.valorLiquido || cr.valorOriginal || 0),
        dataVencimento: cr.dataVencimento,
        historico: cr.descricao || cr.cliente || 'Receita ERP',
        entidadeVinculo: cr.cliente || 'Cliente',
        statusFinanceiro: cr.status === 'Recebido' ? 'Baixado' : 'Aberto',
        centroCustoId: cr.centroCustoId
      });
    });

    return list;
  }, [contasPagar, contasReceber]);

  // Ações de conciliação título por título
  const handleConciliar = (extId: string, lanId: string) => {
    updateExtrato(extId, { status: 'Conciliado', lancamentoFinanceiroId: lanId });
    toast.success('Movimentação conciliada com o lançamento ERP com sucesso!');
    if (extratoParaBuscar?.id === extId) {
      setExtratoParaBuscar(null);
    }
  };

  const handleResetarConciliacao = (extId: string, historico?: string) => {
    updateExtrato(extId, { status: 'Não Conciliado', lancamentoFinanceiroId: undefined });
    toast.info(`Conciliação de "${renderHistoricoSafe(historico) || 'título'}" resetada para Pendente.`);
  };

  const handleConfirmarExclusaoExtrato = () => {
    if (!extratoParaExcluir) return;
    const desc = renderHistoricoSafe(extratoParaExcluir.historico);
    removeExtrato(extratoParaExcluir.id);
    toast.success(`Movimentação "${desc || 'selecionada'}" apagada do extrato.`);
    setExtratoParaExcluir(null);
  };

  const handleMarcarDivergente = (extId: string) => {
    updateExtrato(extId, { status: 'Divergente', lancamentoFinanceiroId: undefined });
    toast.warning('Movimentação marcada como Divergente para auditoria.');
  };

  // Conciliação em Lote Automática
  const handleConciliarEmLote = () => {
    let concilCount = 0;
    validExtratos.forEach(ext => {
      if (ext.status !== 'Conciliado' && ext.status !== 'Divergente') {
        const suggestion = findMatchSuggestion(ext);
        if (suggestion) {
          updateExtrato(ext.id, { status: 'Conciliado', lancamentoFinanceiroId: suggestion.id });
          concilCount++;
        }
      }
    });

    if (concilCount > 0) {
      toast.success(`${concilCount} movimentação(ões) conciliada(s) automaticamente!`);
    } else {
      toast.info('Nenhuma nova correspondência exata encontrada para conciliação em lote.');
    }
  };

  // Resetar Todas as Conciliações
  const handleConfirmarResetarTodas = () => {
    const updated = validExtratos.map(ext => ({
      ...ext,
      status: 'Não Conciliado' as const,
      lancamentoFinanceiroId: undefined
    }));
    setExtratos(updated);
    toast.success('Todas as conciliações foram resetadas para o estado Pendente.');
    setIsResetAllModalOpen(false);
  };

  // Limpar Todas as Movimentações do Extrato
  const handleConfirmarLimparExtrato = () => {
    setExtratos([]);
    toast.success('Extrato bancário limpo com sucesso.');
    setIsClearAllModalOpen(false);
  };

  // Motor de Match Real com dados do ERP
  const findMatchSuggestion = (extrato: MovimentacaoBancaria) => {
    if (!extrato) return null;
    if (extrato.lancamentoFinanceiroId) {
      return erpLancamentos.find(l => l.id === extrato.lancamentoFinanceiroId) || null;
    }
    if (extrato.status === 'Divergente') return null;
    
    // Match por valor igual e tipo compatível
    const tipoDesejado = extrato.tipo === 'Crédito' ? 'Receita' : 'Despesa';
    return erpLancamentos.find(l => 
      Math.abs(l.valor - Math.abs(extrato.valor || 0)) < 0.01 && 
      l.statusFinanceiro === 'Aberto' &&
      l.tipo === tipoDesejado
    ) || erpLancamentos.find(l => Math.abs(l.valor - Math.abs(extrato.valor || 0)) < 0.01 && l.statusFinanceiro === 'Aberto') || null;
  };

  // Filtragem dos Extratos na Tela
  const filteredExtratos = useMemo(() => {
    return validExtratos.filter(e => {
      const safeHistorico = renderHistoricoSafe(e?.historico);
      const safeDoc = String(e?.documento || '');
      const matchesSearch = safeHistorico.toLowerCase().includes((searchTerm || '').toLowerCase()) ||
                            safeDoc.toLowerCase().includes((searchTerm || '').toLowerCase());
      
      const matchesConta = selectedContaFilter === 'todas' || e.contaBancariaId === selectedContaFilter;
      
      const matchesStatus = 
        selectedStatusFilter === 'todos' ||
        (selectedStatusFilter === 'conciliado' && e.status === 'Conciliado') ||
        (selectedStatusFilter === 'pendente' && (e.status === 'Não Conciliado' || !e.status || e.status === 'Pendente')) ||
        (selectedStatusFilter === 'divergente' && e.status === 'Divergente');

      return matchesSearch && matchesConta && matchesStatus;
    });
  }, [validExtratos, searchTerm, selectedContaFilter, selectedStatusFilter]);

  const getStatusBadge = (status: string) => {
    if (status === 'Conciliado') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          Conciliado
        </span>
      );
    }
    if (status === 'Divergente') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
          Divergente
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
        Pendente
      </span>
    );
  };

  // Títulos candidatos para vincular no modal "Buscar Título"
  const titulosCandidatosModal = useMemo(() => {
    if (!extratoParaBuscar) return [];
    const tipoDesejado = extratoParaBuscar.tipo === 'Crédito' ? 'Receita' : 'Despesa';

    return erpLancamentos.filter(l => {
      const matchSearch = 
        !searchTituloModal.trim() ||
        l.historico.toLowerCase().includes(searchTituloModal.toLowerCase()) ||
        l.entidadeVinculo.toLowerCase().includes(searchTituloModal.toLowerCase()) ||
        (l.numero && l.numero.toLowerCase().includes(searchTituloModal.toLowerCase())) ||
        String(l.valor).includes(searchTituloModal);

      return matchSearch;
    });
  }, [extratoParaBuscar, erpLancamentos, searchTituloModal]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* BARRA SUPERIOR DE FILTROS E AÇÕES GLOBAIS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3 bg-card border p-3 rounded-lg shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto flex-1">
          {/* Busca por Histórico / NSU */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar no histórico ou documento..." 
              className="pl-8 text-xs h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Filtro de Contas Bancárias */}
          <Select value={selectedContaFilter} onValueChange={setSelectedContaFilter}>
            <SelectTrigger className="w-full sm:w-[190px] h-9 text-xs">
              <SelectValue placeholder="Todas as Contas" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Contas</SelectItem>
              {contasBancarias.map(c => (
                <SelectItem key={c.id} value={c.id}>
                  {c.banco} ({c.conta})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filtro de Status */}
          <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="conciliado">Conciliados</SelectItem>
              <SelectItem value="divergente">Divergentes</SelectItem>
            </SelectContent>
          </Select>

          {(searchTerm || selectedContaFilter !== 'todas' || selectedStatusFilter !== 'todos') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setSelectedContaFilter('todas');
                setSelectedStatusFilter('todos');
              }}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Limpar
            </Button>
          )}
        </div>
        
        {/* Ações Globais */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-end">
          <Button 
            size="sm"
            onClick={handleConciliarEmLote}
            className="h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold gap-1.5 shadow-xs"
            title="Conciliar automaticamente todas as movimentações com valores correspondentes no ERP"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Conciliar em Lote
          </Button>

          {/* Menu de Ações Globais Adicionais */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 text-xs gap-1">
                <MoreHorizontal className="w-4 h-4" /> Opções
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 text-xs">
              <DropdownMenuItem 
                onClick={() => setIsResetAllModalOpen(true)}
                className="gap-2 cursor-pointer text-amber-600 focus:text-amber-600"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Resetar Todas as Conciliações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsClearAllModalOpen(true)}
                className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Limpar Extrato Bancário
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* TABELA LADO A LADO: EXTRATO (REALIDADE) vs ERP (PLANEJADO) */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-xs">
        {/* CABEÇALHO DA TABELA */}
        <div className="grid grid-cols-12 border-b bg-muted/40 p-3.5 font-semibold text-xs text-muted-foreground">
          <div className="col-span-12 md:col-span-5 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-orange-600" /> Extrato Bancário (Realidade)
          </div>
          <div className="hidden md:flex md:col-span-2 items-center justify-center">
            <ArrowRightLeft className="w-4 h-4 text-muted-foreground/60" />
          </div>
          <div className="col-span-12 md:col-span-5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-primary" /> Lançamento ERP (Planejado)
            </div>
            <span className="text-[11px] text-muted-foreground font-normal">
              {filteredExtratos.length} registro(s)
            </span>
          </div>
        </div>

        {/* LISTA DE MOVIMENTAÇÕES */}
        <div className="divide-y divide-border/60">
          {filteredExtratos.map(extrato => {
            const suggestion = findMatchSuggestion(extrato);
            const isConciliado = extrato.status === 'Conciliado';
            const isDivergente = extrato.status === 'Divergente';
            const contaNome = contasBancarias.find(c => c.id === extrato.contaBancariaId)?.banco || 'Conta Bancária';

            return (
              <div 
                key={extrato.id} 
                className={`grid grid-cols-12 p-3.5 sm:p-4 items-center gap-3 transition-colors hover:bg-muted/25 ${
                  isConciliado ? 'bg-emerald-50/20 dark:bg-emerald-950/10' : ''
                }`}
              >
                {/* LADO ESQUERDO: EXTRATO BANCÁRIO */}
                <div className="col-span-12 md:col-span-5 space-y-1.5">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-foreground leading-tight line-clamp-2">
                        {renderHistoricoSafe(extrato?.historico) || 'Movimentação Bancária'}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground mt-1">
                        <span className="font-mono">{formatDateSafe(extrato?.data)}</span>
                        <span>•</span>
                        <span>Doc: {extrato.documento || 'S/N'}</span>
                        <span>•</span>
                        <span className="truncate">{contaNome}</span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`font-bold text-xs sm:text-sm ${
                        extrato.tipo === 'Crédito' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {extrato.tipo === 'Crédito' ? '+' : '-'}{formatCurrency(extrato.valor)}
                      </span>
                      <div className="text-[10px] text-muted-foreground uppercase font-semibold mt-0.5">
                        {extrato.tipo}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CENTRO: STATUS E AÇÕES DISCRETAS TÍTULO POR TÍTULO */}
                <div className="col-span-12 md:col-span-2 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2 px-1 py-1 md:py-0 border-y md:border-y-0 border-border/40">
                  <div className="flex items-center gap-2">
                    {getStatusBadge(extrato.status)}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {/* Botão Principal de Ação Rápida */}
                    {isConciliado ? (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/30 gap-1"
                        onClick={() => handleResetarConciliacao(extrato.id, extrato.historico)}
                        title="Desfazer e resetar conciliação para Pendente"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span className="hidden sm:inline">Desfazer</span>
                      </Button>
                    ) : suggestion && !isDivergente ? (
                      <Button 
                        size="sm" 
                        className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold gap-1 shadow-2xs" 
                        onClick={() => handleConciliar(extrato.id, suggestion.id)}
                        title="Conciliar com a sugestão automática encontrada"
                      >
                        <Check className="w-3 h-3" /> Dar Match
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-7 px-2 text-xs gap-1 text-muted-foreground hover:text-foreground"
                        onClick={() => setExtratoParaBuscar(extrato)}
                        title="Buscar lançamento no financeiro manualmente"
                      >
                        <Search className="w-3 h-3" /> Buscar Título
                      </Button>
                    )}

                    {/* BOTÕES DISCRETOS TÍTULO POR TÍTULO (RESETAR & APAGAR) */}
                    <div className="flex items-center gap-0.5">
                      {/* Botão Discreto: Resetar Conciliação */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResetarConciliacao(extrato.id, extrato.historico)}
                        className="h-7 w-7 text-muted-foreground/70 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-md transition-colors"
                        title="Resetar status desta conciliação"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>

                      {/* Botão Discreto: Apagar Movimentação */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExtratoParaExcluir(extrato)}
                        className="h-7 w-7 text-muted-foreground/70 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors"
                        title="Apagar movimentação do extrato"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>

                      {/* Menu de Mais Opções Discreto */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground/70 hover:text-foreground rounded-md"
                            title="Mais opções para este título"
                          >
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs">
                          <DropdownMenuItem 
                            onClick={() => setExtratoParaBuscar(extrato)} 
                            className="gap-2 cursor-pointer"
                          >
                            <Search className="w-3.5 h-3.5 text-primary" />
                            Buscar e Vincular Título
                          </DropdownMenuItem>
                          
                          <DropdownMenuItem 
                            onClick={() => handleResetarConciliacao(extrato.id, extrato.historico)}
                            className="gap-2 cursor-pointer text-amber-600"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            Resetar Conciliação
                          </DropdownMenuItem>

                          <DropdownMenuItem 
                            onClick={() => handleMarcarDivergente(extrato.id)}
                            className="gap-2 cursor-pointer text-muted-foreground"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                            Marcar como Divergente
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem 
                            onClick={() => setExtratoParaExcluir(extrato)}
                            className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Apagar Movimentação
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>

                {/* LADO DIREITO: LANÇAMENTO ERP CORRESPONDENTE */}
                <div className="col-span-12 md:col-span-5 md:pl-3 md:border-l space-y-1">
                  {suggestion ? (
                    <div className="p-2.5 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors">
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-xs text-foreground truncate">
                            {renderHistoricoSafe(suggestion.historico) || 'Lançamento ERP'}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground mt-0.5">
                            <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                              {suggestion.origem === 'Pagar' ? 'Contas a Pagar' : 'Contas a Receber'}
                            </Badge>
                            {suggestion.numero && <span className="font-mono">{suggestion.numero}</span>}
                            <span>•</span>
                            <span className="truncate">{suggestion.entidadeVinculo}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-xs text-foreground">
                            {formatCurrency(suggestion.valor)}
                          </span>
                          <div className="text-[10px] text-muted-foreground">
                            {suggestion.dataVencimento ? `Venc: ${formatDateSafe(suggestion.dataVencimento)}` : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 text-xs text-muted-foreground/70 italic border border-dashed rounded-lg bg-muted/10">
                      <span>Nenhum lançamento no financeiro (Aberto) encontrado.</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExtratoParaBuscar(extrato)}
                        className="h-6 text-[11px] text-primary hover:text-primary underline px-1.5"
                      >
                        Vincular Manualmente
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredExtratos.length === 0 && (
            <div className="p-12 text-center text-muted-foreground text-xs space-y-2">
              <Building2 className="w-8 h-8 opacity-30 mx-auto" />
              <p className="font-semibold text-sm text-foreground">Nenhuma movimentação bancária encontrada</p>
              <p className="max-w-md mx-auto">
                {searchTerm || selectedContaFilter !== 'todas' || selectedStatusFilter !== 'todos' 
                  ? 'Nenhum resultado corresponde aos filtros selecionados. Tente limpar os filtros acima.' 
                  : 'Realize a importação de um extrato bancário (OFX/CSV) na aba "Importar Extrato" para iniciar as conciliações.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: BUSCAR E VINCULAR TÍTULO MANUALMENTE */}
      <Dialog open={!!extratoParaBuscar} onOpenChange={(open) => !open && setExtratoParaBuscar(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2">
              <Search className="w-4 h-4 text-orange-600" />
              Buscar e Vincular Lançamento Financeiro
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Vincule a movimentação bancária a um título a pagar ou a receber em aberto no sistema.
            </DialogDescription>
          </DialogHeader>

          {extratoParaBuscar && (
            <div className="p-3 bg-muted/40 rounded-lg border text-xs space-y-1 shrink-0">
              <div className="flex justify-between items-center">
                <span className="font-bold text-foreground">Movimentação Selecionada:</span>
                <span className={`font-bold ${extratoParaBuscar.tipo === 'Crédito' ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {extratoParaBuscar.tipo === 'Crédito' ? '+' : '-'}{formatCurrency(extratoParaBuscar.valor)}
                </span>
              </div>
              <p className="text-muted-foreground">{renderHistoricoSafe(extratoParaBuscar.historico)}</p>
              <div className="text-[10px] text-muted-foreground flex gap-2 font-mono">
                <span>Data: {formatDateSafe(extratoParaBuscar.data)}</span>
                <span>• Doc: {extratoParaBuscar.documento}</span>
              </div>
            </div>
          )}

          <div className="relative py-2 shrink-0">
            <Search className="absolute left-2.5 top-4 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar por cliente, fornecedor, descrição, número ou valor..."
              value={searchTituloModal}
              onChange={e => setSearchTituloModal(e.target.value)}
              className="pl-8 text-xs h-9"
              autoFocus
            />
          </div>

          <div className="flex-1 overflow-y-auto divide-y border rounded-lg max-h-72 text-xs">
            {titulosCandidatosModal.map(lan => (
              <div key={lan.id} className="p-3 flex items-center justify-between gap-3 hover:bg-muted/40 transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-[9px] uppercase">
                      {lan.origem === 'Pagar' ? 'Contas a Pagar' : 'Contas a Receber'}
                    </Badge>
                    <span className="font-semibold text-foreground truncate">{lan.historico}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground mt-1">
                    {lan.numero && <span className="font-mono">{lan.numero}</span>}
                    <span>• {lan.entidadeVinculo}</span>
                    {lan.dataVencimento && <span>• Venc: {formatDateSafe(lan.dataVencimento)}</span>}
                  </div>
                </div>

                <div className="text-right flex items-center gap-3 shrink-0">
                  <span className="font-bold text-xs text-foreground">
                    {formatCurrency(lan.valor)}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => extratoParaBuscar && handleConciliar(extratoParaBuscar.id, lan.id)}
                    className="h-7 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold gap-1"
                  >
                    <Check className="w-3 h-3" /> Vincular
                  </Button>
                </div>
              </div>
            ))}

            {titulosCandidatosModal.length === 0 && (
              <div className="p-8 text-center text-muted-foreground text-xs">
                Nenhum título compatível encontrado para os termos da busca.
              </div>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setExtratoParaBuscar(null)} className="text-xs">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: CONFIRMAR EXCLUSÃO INDIVIDUAL DE MOVIMENTAÇÃO */}
      <Dialog open={!!extratoParaExcluir} onOpenChange={(open) => !open && setExtratoParaExcluir(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
              <Trash2 className="w-4 h-4" /> Apagar Movimentação do Extrato
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Tem certeza de que deseja apagar esta movimentação bancária do extrato?
            </DialogDescription>
          </DialogHeader>

          {extratoParaExcluir && (
            <div className="p-3 bg-muted/30 rounded-lg border text-xs space-y-1">
              <p className="font-bold text-foreground">{renderHistoricoSafe(extratoParaExcluir.historico)}</p>
              <div className="flex justify-between text-muted-foreground">
                <span>Valor: {extratoParaExcluir.tipo === 'Crédito' ? '+' : '-'}{formatCurrency(extratoParaExcluir.valor)}</span>
                <span>Data: {formatDateSafe(extratoParaExcluir.data)}</span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setExtratoParaExcluir(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmarExclusaoExtrato}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: RESETAR TODAS AS CONCILIAÇÕES */}
      <Dialog open={isResetAllModalOpen} onOpenChange={setIsResetAllModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-4 h-4" /> Resetar Todas as Conciliações
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Esta ação desconciliará todos os lançamentos do extrato atual, retornando-os para o status <strong>Pendente</strong>. Nenhum dado do extrato será excluído.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setIsResetAllModalOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white" onClick={handleConfirmarResetarTodas}>
              Resetar Todas
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL: LIMPAR EXTRATO BANCÁRIO COMPLETO */}
      <Dialog open={isClearAllModalOpen} onOpenChange={setIsClearAllModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
              <Trash2 className="w-4 h-4" /> Limpar Extrato Bancário
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Tem certeza de que deseja remover todas as movimentações do extrato bancário? Esta ação liberará a tela para uma nova importação de arquivo OFX/CSV.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setIsClearAllModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmarLimparExtrato}>
              Limpar Todo o Extrato
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useContasPagarQuery } from '../hooks/useContasPagarQuery';
import { financeiroService } from '@/services/financeiroService';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaPagar } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Filter, MoreHorizontal, Download, Plus, Calendar, 
  CheckCircle2, X, ArrowDownRight, Clock, AlertTriangle, Trash2
} from 'lucide-react';
import { NovaContaSheet } from './NovaContaSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDateBrasilia, parseDateSafe, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, addMonths, subDays, isWithinInterval 
} from 'date-fns';
import { toast } from 'sonner';

type DatePreset = 'todos' | 'hoje' | 'esta_semana' | 'este_mes' | 'proximo_mes' | 'ultimos_30_dias' | 'personalizado';
type DateField = 'vencimento' | 'emissao' | 'pagamento';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const renderStatusTag = (status: string) => {
  const norm = (status || '').trim().toLowerCase();
  if (norm === 'pago' || norm === 'liquidado') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Pago
      </span>
    );
  }
  if (norm === 'vencido' || norm === 'atrasado') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        Vencido
      </span>
    );
  }
  if (norm === 'pago parcialmente') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
        Parcial
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0" />
      Em Aberto
    </span>
  );
};

export function ContasList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [dateField, setDateField] = useState<DateField>('vencimento');
  const [datePreset, setDatePreset] = useState<DatePreset>('todos');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  const [contaParaExcluir, setContaParaExcluir] = useState<ContaPagar | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const queryClient = useQueryClient();
  const { data: localContas = [], saveItem: saveLocalConta, removeItem: deleteLocalConta } = useLocalStorageState<ContaPagar>('focus_contas_pagar');
  const { contas: queryContas = [], saveConta: saveQueryConta, deleteConta: deleteQueryConta } = useContasPagarQuery();

  // Fusão consistente para garantir que todas as contas apareçam imediatamente
  const contas = useMemo(() => {
    const map = new Map<string, ContaPagar>();
    localContas.forEach(c => map.set(c.id, c));
    queryContas.forEach(c => {
      if (!map.has(c.id)) map.set(c.id, c);
    });
    return Array.from(map.values());
  }, [localContas, queryContas]);

  const saveConta = async (conta: ContaPagar) => {
    saveLocalConta(conta);
    try { await saveQueryConta(conta); } catch {}
  };

  const handleConfirmarExclusao = async () => {
    if (!contaParaExcluir) return;
    const id = contaParaExcluir.id;
    setIsDeleting(true);
    try {
      // 1. Remove do estado local imediato
      deleteLocalConta(id);
      
      // 2. Atualiza cache do React Query imediatamente
      queryClient.setQueryData(['contas_pagar'], (old: any) => {
        if (!Array.isArray(old)) return [];
        return old.filter((item: any) => item.id !== id);
      });

      // 3. Remove no banco/service
      await financeiroService.deleteContaPagar(id);
      
      // 4. Invalida cache para sincronizar
      queryClient.invalidateQueries({ queryKey: ['contas_pagar'] });

      toast.success('Conta a pagar excluída com sucesso!');
    } catch (err: any) {
      console.error('Erro ao excluir conta:', err);
      toast.error('Erro ao excluir conta: ' + (err?.message || 'Tente novamente.'));
    } finally {
      setIsDeleting(false);
      setContaParaExcluir(null);
    }
  };

  // Calcular limites de data baseados no preset selecionado
  const { filterStart, filterEnd } = useMemo(() => {
    const today = new Date();
    if (datePreset === 'hoje') {
      return { filterStart: startOfDay(today), filterEnd: endOfDay(today) };
    }
    if (datePreset === 'esta_semana') {
      return { filterStart: startOfWeek(today, { weekStartsOn: 1 }), filterEnd: endOfWeek(today, { weekStartsOn: 1 }) };
    }
    if (datePreset === 'este_mes') {
      return { filterStart: startOfMonth(today), filterEnd: endOfMonth(today) };
    }
    if (datePreset === 'proximo_mes') {
      const nextM = addMonths(today, 1);
      return { filterStart: startOfMonth(nextM), filterEnd: endOfMonth(nextM) };
    }
    if (datePreset === 'ultimos_30_dias') {
      return { filterStart: startOfDay(subDays(today, 30)), filterEnd: endOfDay(today) };
    }
    if (datePreset === 'personalizado') {
      const start = dataInicio ? parseDateSafe(dataInicio) : null;
      const end = dataFim ? parseDateSafe(dataFim) : null;
      return { 
        filterStart: start ? startOfDay(start) : null, 
        filterEnd: end ? endOfDay(end) : null 
      };
    }
    return { filterStart: null, filterEnd: null };
  }, [datePreset, dataInicio, dataFim]);

  // Aplicar filtros compostos
  const filteredData = useMemo(() => {
    return contas.filter(t => {
      // 1. Busca textual
      const matchesSearch = 
        (t.fornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filtro de Status
      if (statusFilter === 'aberto' && t.status !== 'Pendente' && t.status !== 'Em Aberto') return false;
      if (statusFilter === 'pago' && t.status !== 'Pago') return false;
      if (statusFilter === 'vencido' && t.status !== 'Vencido') return false;

      // 3. Filtro de Categoria
      if (categoriaFilter !== 'todas') {
        if ((t.categoria || '').toLowerCase() !== categoriaFilter.toLowerCase()) return false;
      }

      // 4. Filtro de Datas
      if (filterStart || filterEnd) {
        let dateVal = t.dataVencimento;
        if (dateField === 'emissao') dateVal = t.dataEmissao;
        if (dateField === 'pagamento') dateVal = t.dataPagamento;

        if (!dateVal) return false;
        const itemDate = parseDateSafe(dateVal);
        if (isNaN(itemDate.getTime())) return false;

        if (filterStart && filterEnd) {
          if (!isWithinInterval(itemDate, { start: filterStart, end: filterEnd })) return false;
        } else if (filterStart && itemDate < filterStart) {
          return false;
        } else if (filterEnd && itemDate > filterEnd) {
          return false;
        }
      }

      return true;
    });
  }, [contas, searchTerm, statusFilter, categoriaFilter, dateField, filterStart, filterEnd]);

  // Métricas do período filtrado
  const totalFiltrado = filteredData.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
  const totalPago = filteredData
    .filter(t => t.status === 'Pago' || t.status === 'Pago Parcialmente')
    .reduce((acc, t) => acc + (t.valorPago || t.valorOriginal || 0), 0);
  const totalPendente = filteredData
    .filter(t => t.status === 'Pendente' || t.status === 'Em Aberto' || t.status === 'Vencido')
    .reduce((acc, t) => acc + (t.saldo || t.valorOriginal || 0), 0);

  const limparFiltros = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setCategoriaFilter('todas');
    setDatePreset('todos');
    setDataInicio('');
    setDataFim('');
  };

  const handleAprovarPagamento = (conta: ContaPagar) => {
    const hoje = getBrasiliaTodayIso();
    saveConta({
      ...conta,
      status: 'Pago',
      valorPago: conta.valorOriginal,
      saldo: 0,
      dataPagamento: hoje,
    });
    toast.success(`Pagamento da conta ${conta.numero} registrado e integrado ao Fluxo de Caixa!`);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Cards de Resumo das Contas Filtradas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border bg-card flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total em Contas a Pagar</p>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(totalFiltrado)}</h3>
            <span className="text-[11px] text-muted-foreground">{filteredData.length} contas listadas</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-card flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Total Pago / Liquidado (Saídas)</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(totalPago)}</h3>
            <span className="text-[11px] text-muted-foreground">Contabilizado no Fluxo de Caixa Real</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-card flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-rose-600 dark:text-rose-400 uppercase tracking-wider">Total a Pagar (Pendente)</p>
            <h3 className="text-xl font-bold text-rose-600 dark:text-rose-400 mt-0.5">{formatCurrency(totalPendente)}</h3>
            <span className="text-[11px] text-muted-foreground">Aguardando quitação para sair do caixa</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-rose-500/10 flex items-center justify-center text-rose-600">
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Painel Avançado de Filtros e Datas */}
      <div className="p-4 rounded-lg border bg-card space-y-3 shadow-sm">
        {/* Linha 1: Busca e Ações Principais */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-3">
          <div className="relative w-full lg:w-96">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por fornecedor, nº do documento ou descrição..." 
              className="pl-8 text-xs h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {(datePreset !== 'todos' || statusFilter !== 'todos' || categoriaFilter !== 'todas' || searchTerm) && (
              <Button variant="ghost" size="sm" onClick={limparFiltros} className="text-xs h-9 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5 mr-1" /> Limpar Filtros
              </Button>
            )}

            <Button variant="outline" size="sm" className="text-xs h-9">
              <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar
            </Button>

            <NovaContaSheet>
              <Button size="sm" className="text-xs h-9 bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Nova Conta
              </Button>
            </NovaContaSheet>
          </div>
        </div>

        {/* Linha 2: Filtros de Datas e Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-2 border-t text-xs">
          {/* Seletor do Campo de Data */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Filtrar por Data de</label>
            <Select value={dateField} onValueChange={(val) => setDateField(val as DateField)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vencimento">Data de Vencimento</SelectItem>
                <SelectItem value="emissao">Data de Emissão</SelectItem>
                <SelectItem value="pagamento">Data de Pagamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Período Pré-definido */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Período</label>
            <Select value={datePreset} onValueChange={(val) => setDatePreset(val as DatePreset)}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Períodos</SelectItem>
                <SelectItem value="hoje">Hoje</SelectItem>
                <SelectItem value="esta_semana">Esta Semana</SelectItem>
                <SelectItem value="este_mes">Este Mês</SelectItem>
                <SelectItem value="proximo_mes">Próximo Mês</SelectItem>
                <SelectItem value="ultimos_30_dias">Últimos 30 Dias</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Status */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="aberto">Em Aberto / Pendente</SelectItem>
                <SelectItem value="pago">Pago / Liquidado</SelectItem>
                <SelectItem value="vencido">Vencido</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Categoria */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Categoria</label>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                <SelectItem value="operacional">Operacional</SelectItem>
                <SelectItem value="infraestrutura">Infraestrutura</SelectItem>
                <SelectItem value="fornecedores">Fornecedores</SelectItem>
                <SelectItem value="impostos">Impostos</SelectItem>
                <SelectItem value="folha">Folha de Pagamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Datas Customizadas caso Personalizado */}
          {datePreset === 'personalizado' && (
            <div className="sm:col-span-2 md:col-span-4 lg:col-span-5 grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Data Inicial (De)</label>
                <Input 
                  type="date" 
                  value={dataInicio} 
                  onChange={(e) => setDataInicio(e.target.value)} 
                  className="h-8 text-xs" 
                />
              </div>
              <div>
                <label className="text-[11px] font-medium text-muted-foreground block mb-1">Data Final (Até)</label>
                <Input 
                  type="date" 
                  value={dataFim} 
                  onChange={(e) => setDataFim(e.target.value)} 
                  className="h-8 text-xs" 
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela de Contas a Pagar */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Número</TableHead>
              <TableHead>Fornecedor / Descrição</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Emissão</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor Original</TableHead>
              <TableHead className="text-right">Saldo Aberto</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-xs">
                  Nenhuma conta encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((conta) => (
                <TableRow key={conta.id} className="hover:bg-muted/40 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {conta.numero}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col min-w-0">
                      <span className="font-semibold text-xs text-foreground truncate">{conta.fornecedor}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{conta.descricao}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-muted-foreground">{conta.categoria || 'Operacional'}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {formatDateBrasilia(conta.dataEmissao)}
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {formatDateBrasilia(conta.dataVencimento)}
                  </TableCell>
                  <TableCell className="text-right font-semibold text-xs text-foreground">
                    {formatCurrency(conta.valorOriginal)}
                  </TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">
                    {formatCurrency(conta.saldo)}
                  </TableCell>
                  <TableCell>
                    {renderStatusTag(conta.status)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {conta.status !== 'Pago' && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-7 text-xs px-2.5 font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-800 rounded-md transition-all gap-1.5 shadow-none"
                          onClick={() => handleAprovarPagamento(conta)}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Pagar
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-md transition-all"
                        onClick={() => setContaParaExcluir(conta)}
                        title="Excluir conta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {conta.status !== 'Pago' && (
                            <DropdownMenuItem onClick={() => handleAprovarPagamento(conta)}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                              Registrar pagamento
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-rose-600 cursor-pointer focus:bg-rose-500/10 focus:text-rose-600"
                            onClick={() => setContaParaExcluir(conta)}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir conta
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Diálogo de Confirmação de Exclusão */}
      <Dialog open={!!contaParaExcluir} onOpenChange={(open) => !open && setContaParaExcluir(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600">
              <Trash2 className="w-5 h-5" /> Excluir Conta a Pagar
            </DialogTitle>
            <DialogDescription className="text-xs pt-2 text-muted-foreground">
              Tem certeza que deseja excluir a conta <strong>"{contaParaExcluir?.descricao || contaParaExcluir?.numero}"</strong> no valor de <strong>{formatCurrency(contaParaExcluir?.valorOriginal)}</strong>?
              <br /><br />
              Esta ação removerá este registro do sistema financeiro.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" size="sm" onClick={() => setContaParaExcluir(null)} disabled={isDeleting}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmarExclusao} disabled={isDeleting}>
              {isDeleting ? 'Excluindo...' : 'Confirmar Exclusão'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useContasReceberQuery } from '../hooks/useContasReceberQuery';
import { recurringBillingService } from '@/features/recorrencias/services/recurringBillingService';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Filter, MoreHorizontal, Download, Plus, Calendar, 
  CheckCircle2, RefreshCw, X, ArrowUpRight, Clock, AlertTriangle
} from 'lucide-react';
import { NovoRecebimentoSheet } from './NovoRecebimentoSheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDateBrasilia, parseDateSafe, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { 
  startOfDay, endOfDay, startOfWeek, endOfWeek, 
  startOfMonth, endOfMonth, addMonths, subDays, isWithinInterval 
} from 'date-fns';
import { toast } from 'sonner';

type DatePreset = 'todos' | 'hoje' | 'esta_semana' | 'este_mes' | 'proximo_mes' | 'ultimos_30_dias' | 'personalizado';
type DateField = 'vencimento' | 'emissao' | 'recebimento';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const renderStatusTag = (status: string) => {
  const norm = (status || '').trim().toLowerCase();
  if (norm === 'recebido' || norm === 'liquidado' || norm === 'pago') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
        Recebido
      </span>
    );
  }
  if (norm === 'atrasado' || norm === 'vencido') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/60 dark:border-rose-800/40">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
        Atrasado
      </span>
    );
  }
  if (norm === 'recebido parcialmente') {
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

export function RecebimentosList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [categoriaFilter, setCategoriaFilter] = useState<string>('todas');
  const [dateField, setDateField] = useState<DateField>('vencimento');
  const [datePreset, setDatePreset] = useState<DatePreset>('todos');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');

  const { data: localTitulos = [], saveItem: saveLocalTitulo, removeItem: deleteLocalTitulo } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { titulos: queryTitulos = [], saveTitulo: saveQueryTitulo, deleteTitulo: deleteQueryTitulo } = useContasReceberQuery();

  // Fusão consistente para garantir que apenas títulos válidos (com cliente, número ou descrição) apareçam
  const titulos = useMemo(() => {
    const map = new Map<string, TituloReceber>();
    localTitulos.forEach(t => {
      if (t && t.id && (t.cliente || t.descricao || (t.numero && !t.numero.startsWith('REC-0000')) || Number(t.valorOriginal || 0) > 0)) {
        map.set(t.id, t);
      }
    });
    queryTitulos.forEach(t => {
      if (t && t.id && (t.cliente || t.descricao || (t.numero && !t.numero.startsWith('REC-0000')) || Number(t.valorOriginal || 0) > 0)) {
        if (!map.has(t.id)) map.set(t.id, t);
      }
    });
    return Array.from(map.values());
  }, [localTitulos, queryTitulos]);

  const saveTitulo = async (titulo: TituloReceber) => {
    saveLocalTitulo(titulo);
    try { await saveQueryTitulo(titulo); } catch {}
  };

  const deleteTitulo = async (id: string) => {
    deleteLocalTitulo(id);
    try { await deleteQueryTitulo(id); } catch {}
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
    return titulos.filter(t => {
      // 1. Busca textual
      const matchesSearch = 
        (t.cliente || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.numero || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.descricao || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      // 2. Filtro de Status
      if (statusFilter === 'aberto' && t.status !== 'Pendente' && t.status !== 'Em Aberto') return false;
      if (statusFilter === 'recebido' && t.status !== 'Recebido') return false;
      if (statusFilter === 'atrasado' && t.status !== 'Atrasado') return false;

      // 3. Filtro de Categoria / Origem
      if (categoriaFilter === 'recorrencia') {
        const isRec = (t.descricao || '').toLowerCase().includes('recorrência') || 
                      (t.descricao || '').toLowerCase().includes('mensalidade') ||
                      (t.categoria || '').toLowerCase().includes('recorrência');
        if (!isRec) return false;
      } else if (categoriaFilter !== 'todas') {
        if ((t.categoria || '').toLowerCase() !== categoriaFilter.toLowerCase()) return false;
      }

      // 4. Filtro de Datas
      if (filterStart || filterEnd) {
        let dateVal = t.dataVencimento;
        if (dateField === 'emissao') dateVal = t.dataEmissao;
        if (dateField === 'recebimento') dateVal = t.dataRecebimento;

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
  }, [titulos, searchTerm, statusFilter, categoriaFilter, dateField, filterStart, filterEnd]);

  // Métricas do período filtrado
  const totalFiltrado = filteredData.reduce((acc, t) => acc + (t.valorOriginal || 0), 0);
  const totalRecebido = filteredData
    .filter(t => t.status === 'Recebido' || t.status === 'Recebido Parcialmente')
    .reduce((acc, t) => acc + (t.valorRecebido || t.valorOriginal || 0), 0);
  const totalPendente = filteredData
    .filter(t => t.status === 'Pendente' || t.status === 'Em Aberto' || t.status === 'Atrasado')
    .reduce((acc, t) => acc + (t.saldo || t.valorOriginal || 0), 0);

  const limparFiltros = () => {
    setSearchTerm('');
    setStatusFilter('todos');
    setCategoriaFilter('todas');
    setDatePreset('todos');
    setDataInicio('');
    setDataFim('');
  };

  const handleAprovarRecebimento = async (titulo: TituloReceber) => {
    const hoje = getBrasiliaTodayIso();
    try {
      const tituloBaixado = await recurringBillingService.baixarTituloTransacional(titulo, {
        valorRecebido: titulo.valorOriginal,
        dataRecebimento: hoje,
        formaPagamento: titulo.formaPagamento || 'PIX',
        usuario: 'Financeiro'
      });
      await saveTitulo(tituloBaixado);
      toast.success(`Recebimento do título ${titulo.numero} registrado e integrado ao Fluxo de Caixa Realizado!`);
    } catch (err: any) {
      toast.error('Erro ao registrar recebimento do título.');
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Cards de Resumo dos Títulos Filtrados */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-lg border bg-card flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total em Títulos</p>
            <h3 className="text-xl font-bold text-foreground mt-0.5">{formatCurrency(totalFiltrado)}</h3>
            <span className="text-[11px] text-muted-foreground">{filteredData.length} registros listados</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-card flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Recebido / Liquidado (Caixa)</p>
            <h3 className="text-xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{formatCurrency(totalRecebido)}</h3>
            <span className="text-[11px] text-muted-foreground">Contabilizado no Fluxo de Caixa Real</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-lg border bg-card flex items-center justify-between shadow-sm">
          <div>
            <p className="text-xs font-medium text-amber-600 dark:text-amber-400 uppercase tracking-wider">Pendente de Aprovação / Baixa</p>
            <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mt-0.5">{formatCurrency(totalPendente)}</h3>
            <span className="text-[11px] text-muted-foreground">Aguardando quitação para entrar no caixa</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
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
              placeholder="Buscar por cliente, nº do título ou descrição..." 
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

            <NovoRecebimentoSheet>
              <Button size="sm" className="text-xs h-9 bg-orange-600 hover:bg-orange-700 text-white">
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Novo Recebimento
              </Button>
            </NovoRecebimentoSheet>
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
                <SelectItem value="recebimento">Data de Recebimento</SelectItem>
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
                <SelectItem value="recebido">Recebido / Liquidado</SelectItem>
                <SelectItem value="atrasado">Atrasado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Seletor de Categoria / Origem */}
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">Origem / Categoria</label>
            <Select value={categoriaFilter} onValueChange={setCategoriaFilter}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Categorias</SelectItem>
                <SelectItem value="recorrencia">Recorrência / Mensalidade</SelectItem>
                <SelectItem value="serviços">Serviços</SelectItem>
                <SelectItem value="licenciamento">Licenciamento</SelectItem>
                <SelectItem value="consultoria">Consultoria</SelectItem>
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

      {/* Tabela de Títulos a Receber */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Número</TableHead>
              <TableHead>Cliente / Descrição</TableHead>
              <TableHead>Origem / Categoria</TableHead>
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
                  Nenhum título encontrado com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((titulo) => {
                const isRecorrencia = (titulo.descricao || '').toLowerCase().includes('recorrência') || 
                                     (titulo.descricao || '').toLowerCase().includes('mensalidade') ||
                                     (titulo.categoria || '').toLowerCase().includes('recorrência');

                return (
                  <TableRow key={titulo.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-mono text-xs font-semibold text-primary">
                      {titulo.numero}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-xs text-foreground truncate">{titulo.cliente}</span>
                        <span className="text-[11px] text-muted-foreground truncate">{titulo.descricao}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {isRecorrencia ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 border border-orange-200/60 dark:border-orange-800/30">
                          <RefreshCw className="w-2.5 h-2.5 shrink-0" /> Recorrência
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">{titulo.categoria || 'Geral'}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDateBrasilia(titulo.dataEmissao)}
                    </TableCell>
                    <TableCell className="text-xs font-medium text-foreground">
                      {formatDateBrasilia(titulo.dataVencimento)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-xs text-foreground">
                      {formatCurrency(titulo.valorOriginal)}
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">
                      {formatCurrency(titulo.saldo)}
                    </TableCell>
                    <TableCell>
                      {renderStatusTag(titulo.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {titulo.status !== 'Recebido' && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-7 text-xs px-2.5 font-medium text-slate-700 dark:text-slate-200 hover:text-emerald-700 dark:hover:text-emerald-300 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/50 border border-slate-200 dark:border-slate-800 rounded-md transition-all gap-1.5 shadow-none"
                            onClick={() => handleAprovarRecebimento(titulo)}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            Baixar
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {titulo.status !== 'Recebido' && (
                              <DropdownMenuItem onClick={() => handleAprovarRecebimento(titulo)}>
                                <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" />
                                Registrar recebimento
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-red-600 cursor-pointer focus:bg-red-500/10 focus:text-red-600"
                              onSelect={async (e) => {
                                e.preventDefault();
                                if (window.confirm(`Tem certeza que deseja excluir o título "${titulo.descricao || titulo.numero}"?`)) {
                                  try {
                                    await deleteTitulo(titulo.id);
                                    toast.success('Título excluído com sucesso!');
                                  } catch (err) {
                                    console.error('Erro ao excluir título a receber:', err);
                                  }
                                }
                              }}
                            >
                              Excluir título
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

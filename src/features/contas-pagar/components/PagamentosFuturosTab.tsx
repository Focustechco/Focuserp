import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaPagar } from '../types';
import { RecorrenciaFinanceira } from '@/features/recorrencias/types';
import { generateRecorrenciaDates } from '@/features/recorrencias/services/recorrenciaEngine';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Filter, Calendar, RefreshCw, ArrowUpRight, 
  DollarSign, Clock, FileText, CheckCircle2, 
  TrendingDown, Layers, Building2, Trash2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { formatDateBrasilia, parseDateSafe, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { addMonths } from 'date-fns';
import { toast } from 'sonner';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { useContasPagarQuery } from '../hooks/useContasPagarQuery';

export interface PagamentoFuturoItem {
  id: string;
  origemId: string;
  origemTipo: 'Recorrência' | 'Parcelamento' | 'Contrato Fornecedor';
  fornecedorId?: string;
  fornecedorNome: string;
  descricao: string;
  categoria: string;
  dataVencimentoPrevista: string;
  valorPrevisto: number;
  cicloIndex: number;
  totalCiclos?: number;
  cicloLabel: string;
  status: 'Programado' | 'Previsto';
}

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function PagamentosFuturosTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState<'30dias' | '3meses' | '6meses' | '12meses' | 'todos'>('30dias');
  const [origemFilter, setOrigemFilter] = useState<'todas' | 'Recorrência' | 'Parcelamento'>('todas');
  const [isEmitindo, setIsEmitindo] = useState<string | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<PagamentoFuturoItem | null>(null);

  const { data: recorrencias = [], setAllItems: setAllRecorrencias } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { data: localContas = [], setAllItems: setAllContas, saveItem: saveLocalConta } = useLocalStorageState<ContaPagar>('focus_contas_pagar');
  const { data: dispensados = [], setAllItems: setAllDispensados } = useLocalStorageState<string>('focus_pagamentos_futuros_dispensados', []);
  const { saveConta: saveQueryConta } = useContasPagarQuery();
  const { notificar } = useNotificacoesStore();

  const hojeStr = getBrasiliaTodayIso();
  const hoje = new Date();

  // 1. Mapeia todos os pagamentos já emitidos para não duplicar no cronograma futuro
  const contasExistentesMap = useMemo(() => {
    const set = new Set<string>();
    localContas.forEach(c => {
      if (c && c.dataVencimento) {
        const mesAno = c.dataVencimento.substring(0, 7); // 'YYYY-MM'
        const safeForn = (c.fornecedor || '').trim().toLowerCase();
        set.add(`${safeForn}|${mesAno}`);
        if ((c as any).fornecedorId) set.add(`${(c as any).fornecedorId}|${mesAno}`);
      }
    });
    return set;
  }, [localContas]);

  // 2. Projeta os meses futuros a partir das Recorrências de Despesas ativas
  const todosFuturos = useMemo(() => {
    const lista: PagamentoFuturoItem[] = [];

    // Recorrências Ativas de Despesas / Fornecedores
    const recsDespesas = recorrencias.filter(
      r => r.status === 'Ativa' && (r.tipo === 'Despesa' || r.origem === 'despesa' || r.origem === 'fornecedor' || Boolean(r.fornecedorNome))
    );

    recsDespesas.forEach(rec => {
      if (dispensados.includes(rec.id)) return;

      const datas = generateRecorrenciaDates(rec, 60);
      const totalCiclos = rec.quantidade && rec.quantidade > 0 ? rec.quantidade : (rec.dataFim || rec.dataFinal ? datas.length : undefined);
      const safeForn = (rec.fornecedorNome || rec.clienteNome || 'Fornecedor').trim().toLowerCase();

      datas.forEach((dataVenc, idx) => {
        const itemId = `pag-fut-${rec.id}-${dataVenc}`;
        if (dispensados.includes(itemId)) return;

        const mesAno = dataVenc.substring(0, 7);
        const jaExiste = contasExistentesMap.has(`${safeForn}|${mesAno}`) || 
                         (rec.fornecedorId && contasExistentesMap.has(`${rec.fornecedorId}|${mesAno}`));

        // Apenas despesas com vencimento futuro que ainda não viraram título emitido
        if (!jaExiste && dataVenc >= hojeStr) {
          lista.push({
            id: itemId,
            origemId: rec.id,
            origemTipo: 'Recorrência',
            fornecedorId: rec.fornecedorId,
            fornecedorNome: rec.fornecedorNome || rec.clienteNome || 'Fornecedor',
            descricao: rec.descricao || 'Despesa Recorrente',
            categoria: rec.categoria || 'Infraestrutura',
            dataVencimentoPrevista: dataVenc,
            valorPrevisto: Number(rec.valor) || 0,
            cicloIndex: idx + 1,
            totalCiclos: totalCiclos,
            cicloLabel: `Parcela ${idx + 1}${totalCiclos ? `/${totalCiclos}` : ''}`,
            status: 'Programado', // NUNCA Pago ou Liquidado
          });
        }
      });
    });

    // Despesas com flag recorrente cadastradas diretamente em contas_pagar sem rec isolada
    const contasRecorrentes = localContas.filter(c => c && c.recorrente);
    const recIdsJaProcessados = new Set(recsDespesas.map(r => (r.fornecedorNome || '').toLowerCase()));

    contasRecorrentes.forEach(c => {
      if (dispensados.includes(c.id) || dispensados.includes(`rec-fake-${c.id}`)) return;

      const safeForn = (c.fornecedor || '').trim().toLowerCase();
      if (recIdsJaProcessados.has(safeForn)) return;

      const recFake: RecorrenciaFinanceira = {
        id: `rec-fake-${c.id}`,
        fornecedorNome: c.fornecedor,
        descricao: c.descricao,
        valor: c.valorOriginal,
        frequencia: (c.recorrenciaFrequencia as any) || 'Mensal',
        dataInicio: c.dataVencimento,
        dataFim: c.recorrenciaFim,
        diaVencimento: parseInt((c.dataVencimento || '').split('-')[2], 10) || 10,
        quantidade: (c as any).recorrenciaQuantidade || (c as any).quantidade || null,
        status: 'Ativa',
        origem: 'despesa',
        categoria: c.categoria,
        formaPagamento: c.formaPagamento,
        createdAt: c.dataEmissao || new Date().toISOString(),
        updatedAt: c.ultimaAtualizacao || new Date().toISOString(),
      };

      const datas = generateRecorrenciaDates(recFake, 60);
      const totalCiclos = recFake.quantidade && recFake.quantidade > 0 ? recFake.quantidade : (recFake.dataFim ? datas.length : undefined);

      datas.forEach((dataVenc, idx) => {
        const itemId = `pag-c-fut-${c.id}-${dataVenc}`;
        if (dispensados.includes(itemId)) return;

        const mesAno = dataVenc.substring(0, 7);
        const jaExiste = contasExistentesMap.has(`${safeForn}|${mesAno}`);

        if (!jaExiste && dataVenc >= hojeStr) {
          lista.push({
            id: itemId,
            origemId: c.id,
            origemTipo: 'Recorrência',
            fornecedorNome: c.fornecedor || 'Fornecedor',
            descricao: c.descricao || 'Despesa Recorrente',
            categoria: c.categoria || 'Operacional',
            dataVencimentoPrevista: dataVenc,
            valorPrevisto: Number(c.valorOriginal) || 0,
            cicloIndex: idx + 1,
            totalCiclos: totalCiclos,
            cicloLabel: `Parcela ${idx + 1}${totalCiclos ? `/${totalCiclos}` : ''}`,
            status: 'Programado',
          });
        }
      });
    });

    // Ordenação cronológica por vencimento previsto
    lista.sort((a, b) => a.dataVencimentoPrevista.localeCompare(b.dataVencimentoPrevista));
    return lista;
  }, [recorrencias, localContas, contasExistentesMap, hojeStr, dispensados]);

  // 3. Filtragem de Período e Busca
  const dataLimitePeriodo = useMemo(() => {
    if (periodoFilter === '30dias') return addMonths(hoje, 1);
    if (periodoFilter === '3meses') return addMonths(hoje, 3);
    if (periodoFilter === '6meses') return addMonths(hoje, 6);
    if (periodoFilter === '12meses') return addMonths(hoje, 12);
    return null;
  }, [periodoFilter, hoje]);

  const filtrados = useMemo(() => {
    return todosFuturos.filter(item => {
      // Busca
      const matchesSearch = 
        item.fornecedorNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.cicloLabel.toLowerCase().includes(searchTerm.toLowerCase());
      if (!matchesSearch) return false;

      // Origem
      if (origemFilter !== 'todas' && item.origemTipo !== origemFilter) return false;

      // Período
      if (dataLimitePeriodo) {
        const itemDate = parseDateSafe(item.dataVencimentoPrevista);
        if (itemDate > dataLimitePeriodo) return false;
      }

      return true;
    });
  }, [todosFuturos, searchTerm, origemFilter, dataLimitePeriodo]);

  // 4. Métricas de Resumo
  const totalPrevisto = useMemo(() => {
    return filtrados.reduce((acc, item) => acc + item.valorPrevisto, 0);
  }, [filtrados]);

  const totalProximos30Dias = useMemo(() => {
    const limite30 = addMonths(hoje, 1);
    return todosFuturos
      .filter(item => parseDateSafe(item.dataVencimentoPrevista) <= limite30)
      .reduce((acc, item) => acc + item.valorPrevisto, 0);
  }, [todosFuturos, hoje]);

  const totalCustoRecorrenteMensal = useMemo(() => {
    return recorrencias
      .filter(r => r.status === 'Ativa' && (r.tipo === 'Despesa' || r.origem === 'despesa' || Boolean(r.fornecedorNome)))
      .reduce((acc, r) => acc + Number(r.valor || 0), 0);
  }, [recorrencias]);

  // 5. Ação: Emitir / Antecipar Despesa Oficial no Contas a Pagar
  const handleEmitirContaAgora = async (item: PagamentoFuturoItem) => {
    setIsEmitindo(item.id);
    try {
      const numeroOficial = `PAG-${Math.floor(1000 + Math.random() * 9000)}`;
      const novaConta: ContaPagar = {
        id: `pag-ant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        numero: numeroOficial,
        fornecedor: item.fornecedorNome,
        descricao: `${item.descricao} (${item.cicloLabel})`,
        categoria: item.categoria || 'Infraestrutura',
        valorOriginal: item.valorPrevisto,
        valorPago: 0,
        saldo: item.valorPrevisto,
        dataEmissao: hojeStr,
        dataVencimento: item.dataVencimentoPrevista,
        formaPagamento: 'Boleto',
        status: 'Pendente', // REGRA: Sempre nasce Pendente para quitação futura
        responsavel: 'Financeiro Focus ERP',
        ultimaAtualizacao: new Date().toISOString(),
        historico: [
          { id: `h-${Date.now()}`, data: new Date().toISOString(), usuario: 'Sistema', acao: 'Lançamento antecipado de despesa recorrente' }
        ]
      };

      saveLocalConta(novaConta);
      try { await saveQueryConta(novaConta as any); } catch {}

      notificar({
        titulo: `Despesa Antecipada: ${novaConta.numero}`,
        descricao: `Lançamento ${novaConta.descricao} de ${formatCurrency(novaConta.valorOriginal)} para ${novaConta.fornecedor} gerado no Contas a Pagar.`,
        origem: 'Financeiro',
        tipo: 'Aviso',
        prioridade: 'Alta',
        targetUrl: '/contas-a-pagar'
      });

      toast.success(`Despesa ${novaConta.numero} lançada com sucesso no Contas a Pagar com status Pendente!`);
    } catch {
      toast.error('Erro ao emitir a despesa.');
    } finally {
      setIsEmitindo(null);
    }
  };

  // 6. Ação: Excluir / Cancelar Recorrência Completa
  const handleExcluirRecorrenciaCompleta = (item: PagamentoFuturoItem) => {
    // Remover de recorrencias
    const novasRecs = recorrencias.filter(r => r.id !== item.origemId && r.id !== `rec-${item.origemId}`);
    setAllRecorrencias(novasRecs);

    // Se veio de conta local recorrente, desmarcar a flag ou remover
    const novasContas = localContas.map(c => {
      if (c.id === item.origemId || `rec-fake-${c.id}` === item.origemId) {
        return { ...c, recorrente: false };
      }
      return c;
    });
    setAllContas(novasContas);

    // Adicionar aos dispensados
    setAllDispensados([...dispensados, item.origemId, `rec-fake-${item.origemId}`]);

    toast.success(`Recorrência "${item.descricao}" excluída com sucesso!`);
    setItemParaExcluir(null);
  };

  // 7. Ação: Dispensar apenas este ciclo específico
  const handleDispensarApenasEsteCiclo = (item: PagamentoFuturoItem) => {
    setAllDispensados([...dispensados, item.id]);
    toast.success(`Ciclo "${item.cicloLabel}" (${formatDateBrasilia(item.dataVencimentoPrevista)}) dispensado da projeção.`);
    setItemParaExcluir(null);
  };

  return (
    <div className="space-y-6">
      {/* 4 Cards de Métricas em Tempo Real */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-medium">Total Previsto a Pagar</span>
            <TrendingDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(totalPrevisto)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {filtrados.length} pagamentos programados no período
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-medium">Próximos 30 Dias</span>
            <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
            {formatCurrency(totalProximos30Dias)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Compromissos do próximo ciclo
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-medium">Custo Fixo Recorrente</span>
            <TrendingDown className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(totalCustoRecorrenteMensal)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Burn rate mensal em despesas contínuas
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-medium">Planos Recorrentes</span>
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {recorrencias.filter(r => r.status === 'Ativa' && (r.tipo === 'Despesa' || r.origem === 'despesa' || Boolean(r.fornecedorNome))).length}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Contratos de fornecedores ativos
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-xl border bg-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por fornecedor, serviço, categoria..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Filtro Período */}
            <Select value={periodoFilter} onValueChange={(v: any) => setPeriodoFilter(v)}>
              <SelectTrigger className="w-full sm:w-44 text-xs h-9">
                <Calendar className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30dias">Próximos 30 dias</SelectItem>
                <SelectItem value="3meses">Próximos 3 meses</SelectItem>
                <SelectItem value="6meses">Próximos 6 meses</SelectItem>
                <SelectItem value="12meses">Próximos 12 meses</SelectItem>
                <SelectItem value="todos">Todas as Previsões</SelectItem>
              </SelectContent>
            </Select>

            {/* Filtro Origem */}
            <Select value={origemFilter} onValueChange={(v: any) => setOrigemFilter(v)}>
              <SelectTrigger className="w-full sm:w-40 text-xs h-9">
                <Filter className="w-3.5 h-3.5 mr-1.5 text-muted-foreground" />
                <SelectValue placeholder="Origem" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Origens</SelectItem>
                <SelectItem value="Recorrência">Recorrências</SelectItem>
                <SelectItem value="Parcelamento">Parcelamentos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabela de Pagamentos Futuros */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs font-semibold">Parcela</TableHead>
              <TableHead className="text-xs font-semibold">Fornecedor / Favorecido</TableHead>
              <TableHead className="text-xs font-semibold">Descrição da Obrigação</TableHead>
              <TableHead className="text-xs font-semibold">Categoria</TableHead>
              <TableHead className="text-xs font-semibold">Vencimento Previsto</TableHead>
              <TableHead className="text-xs font-semibold text-right">Valor Previsto</TableHead>
              <TableHead className="text-xs font-semibold text-center">Status</TableHead>
              <TableHead className="text-xs font-semibold text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-xs">
                  <DollarSign className="w-8 h-8 mx-auto mb-2 opacity-30 text-primary" />
                  Nenhum pagamento futuro programado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-orange-600 dark:text-orange-400">
                    <Badge variant="outline" className="font-mono text-[10px] bg-orange-50/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800">
                      {item.cicloLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-xs text-foreground block truncate">
                      {item.fornecedorNome}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[240px] truncate">
                    {item.descricao}
                  </TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border">
                      {item.origemTipo === 'Recorrência' ? (
                        <RefreshCw className="w-2.5 h-2.5 text-orange-500 shrink-0" />
                      ) : (
                        <Layers className="w-2.5 h-2.5 text-blue-500 shrink-0" />
                      )}
                      {item.categoria || item.origemTipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {formatDateBrasilia(item.dataVencimentoPrevista)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs text-rose-600 dark:text-rose-400">
                    {formatCurrency(item.valorPrevisto)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className="text-[10px] bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 font-medium"
                    >
                      • Programado
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isEmitindo === item.id}
                        onClick={() => handleEmitirContaAgora(item)}
                        className="h-7 text-[11px] px-2.5 gap-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/30 cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {isEmitindo === item.id ? 'Emitindo...' : 'Emitir Despesa'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setItemParaExcluir(item)}
                        title="Excluir ou Dispensar Opção"
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Exclusão / Cancelamento de Recorrência */}
      <Dialog open={!!itemParaExcluir} onOpenChange={(open) => !open && setItemParaExcluir(null)}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" /> Excluir Opção Futura
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground">
              Você selecionou <span className="font-semibold text-foreground">{itemParaExcluir?.descricao}</span> ({itemParaExcluir?.fornecedorNome}) com previsão para <span className="font-semibold text-foreground">{itemParaExcluir && formatDateBrasilia(itemParaExcluir.dataVencimentoPrevista)}</span> no valor de <span className="font-semibold text-rose-600">{itemParaExcluir && formatCurrency(itemParaExcluir.valorPrevisto)}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-2 border">
            <p className="font-medium text-foreground">Escolha a ação desejada:</p>
            <ul className="list-disc pl-4 space-y-1 text-muted-foreground">
              <li><strong className="text-foreground">Excluir Toda a Recorrência:</strong> Remove permanentemente todas as parcelas/ciclos futuros desta recorrência.</li>
              <li><strong className="text-foreground">Dispensar Apenas Este Ciclo:</strong> Oculta somente este mês ({itemParaExcluir?.cicloLabel}), mantendo os demais.</li>
            </ul>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemParaExcluir(null)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => itemParaExcluir && handleDispensarApenasEsteCiclo(itemParaExcluir)}
              className="w-full sm:w-auto text-xs"
            >
              Dispensar Apenas Este Ciclo
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => itemParaExcluir && handleExcluirRecorrenciaCompleta(itemParaExcluir)}
              className="w-full sm:w-auto text-xs"
            >
              Excluir Toda a Recorrência
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

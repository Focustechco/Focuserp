import React, { useState, useMemo } from 'react';
import { consolidateFluxoFromStores } from '../utils/consolidateData';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Filter, Download, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateBrasilia, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { Link } from '@tanstack/react-router';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Confirmada': 
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300">Liquidado / No Caixa</Badge>;
    case 'Prevista': 
      return <Badge variant="outline" className="bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-300 flex items-center gap-1">
        <Clock className="w-3 h-3 text-amber-600" /> Previsto (Aguardando Recebimento)
      </Badge>;
    case 'Parcial': 
      return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border-blue-300">Parcialmente Liquidado</Badge>;
    case 'Cancelada': 
      return <Badge variant="secondary" className="line-through opacity-70">Cancelada</Badge>;
    default: 
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function FluxoTimeline() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [viewMode, setViewMode] = useState<'todos' | 'realizado' | 'previsto'>('todos');

  const { data: titulos = [], saveItem: saveTitulo } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contas = [], saveItem: saveConta } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const fluxoConsolidado = useMemo(() => {
    return consolidateFluxoFromStores(titulos, contas);
  }, [titulos, contas]);

  const filteredData = useMemo(() => {
    return fluxoConsolidado.filter(mov => {
      // 1. Busca
      const matchSearch = 
        (mov.clienteFornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (mov.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // 2. Tipo (Entradas / Saídas)
      const matchType = 
        filterType === 'todos' || 
        (filterType === 'entradas' && mov.tipo === 'Entrada') ||
        (filterType === 'saidas' && mov.tipo === 'Saída');

      if (!matchType) return false;

      // 3. Modo de Visão (Realizado vs Previsto)
      if (viewMode === 'realizado') {
        if (mov.status !== 'Confirmada' && mov.status !== 'Parcial') return false;
      } else if (viewMode === 'previsto') {
        if (mov.status !== 'Prevista') return false;
      }

      return true;
    });
  }, [fluxoConsolidado, searchTerm, filterType, viewMode]);

  // Ação rápida de aprovar/liquidar diretamente a partir do Contas a Receber
  const handleAprovarRecebimentoDireto = (idOrigem: string) => {
    const titulo = titulos.find(t => t.id === idOrigem);
    if (titulo) {
      saveTitulo({
        ...titulo,
        status: 'Recebido',
        valorRecebido: titulo.valorOriginal,
        saldo: 0,
        dataRecebimento: getBrasiliaTodayIso(),
      });
      toast.success(`Recebimento do título "${titulo.descricao || titulo.numero}" aprovado! Contabilizado no Caixa Real.`);
    }
  };

  const handleAprovarPagamentoDireto = (idOrigem: string) => {
    const conta = contas.find(c => c.id === idOrigem);
    if (conta) {
      saveConta({
        ...conta,
        status: 'Pago',
        valorPago: conta.valorOriginal,
        saldo: 0,
        dataPagamento: getBrasiliaTodayIso(),
      });
      toast.success(`Pagamento da conta "${conta.descricao || conta.numero}" registrado! Contabilizado no Caixa Real.`);
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barra de Filtros e Controles de Visualização */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Seletor de Visão Contábil */}
          <div className="inline-flex rounded-lg border bg-card p-1 shadow-sm">
            <button
              onClick={() => setViewMode('todos')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'todos' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Todos os Lançamentos
            </button>
            <button
              onClick={() => setViewMode('realizado')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'realizado' ? 'bg-emerald-600 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Extrato Realizado (Caixa Real)
            </button>
            <button
              onClick={() => setViewMode('previsto')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                viewMode === 'previsto' ? 'bg-amber-600 text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Previsões (Pendente no Contas a Receber)
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar no fluxo..." 
              className="pl-8 h-8 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Entradas e Saídas</SelectItem>
              <SelectItem value="entradas">Apenas Entradas</SelectItem>
              <SelectItem value="saidas">Apenas Saídas</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar
          </Button>
        </div>
      </div>

      {/* Tabela do Fluxo de Caixa */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Data</TableHead>
              <TableHead>Descrição / Cliente ou Fornecedor</TableHead>
              <TableHead>Categoria / Origem</TableHead>
              <TableHead>Status Contábil</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right bg-muted/30">Saldo Real de Caixa</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                  Nenhuma movimentação encontrada para o filtro selecionado.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((mov) => {
                const isConfirmada = mov.status === 'Confirmada' || mov.status === 'Parcial';
                const isRecorrencia = (mov.descricao || '').toLowerCase().includes('recorrência') || 
                                     (mov.descricao || '').toLowerCase().includes('mensalidade') ||
                                     (mov.categoria || '').toLowerCase().includes('recorrência') ||
                                     (mov.descricao || '').includes('/');

                return (
                  <TableRow key={mov.id} className="hover:bg-muted/40 transition-colors">
                    {/* Data formatada rigorosamente no fuso de Brasília (sem voltar 1 dia) */}
                    <TableCell className="whitespace-nowrap font-medium text-xs text-foreground">
                      {formatDateBrasilia(mov.dataCompetencia)}
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col min-w-0">
                        <div className="font-semibold text-xs flex items-center gap-1.5 text-foreground">
                          {mov.tipo === 'Entrada' ? (
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          )}
                          <span className="truncate">{mov.descricao}</span>
                          {isRecorrencia && (
                            <Badge variant="outline" className="text-[9px] py-0 px-1 border-orange-300 text-orange-600 bg-orange-50/50">
                              Recorrência
                            </Badge>
                          )}
                        </div>
                        <span className="text-[11px] text-muted-foreground truncate ml-5">
                          {mov.clienteFornecedor}
                        </span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="text-xs font-medium text-foreground">{mov.categoria}</div>
                      <div className="text-[10px] text-muted-foreground">Via {mov.moduloOrigem}</div>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(mov.status)}
                    </TableCell>

                    <TableCell className={`text-right font-semibold text-xs ${
                      mov.tipo === 'Entrada' 
                        ? isConfirmada ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                        : isConfirmada ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground'
                    }`}>
                      {mov.tipo === 'Entrada' ? '+' : '-'} {formatCurrency(isConfirmada ? mov.valorRealizado : mov.valorOriginal)}
                      {!isConfirmada && (
                        <span className="block text-[9px] font-normal text-amber-600">Aguardando Baixa</span>
                      )}
                    </TableCell>

                    {/* Saldo Acumulado REAL: Reflete apenas dinheiro efetivamente no caixa */}
                    <TableCell className="text-right font-bold text-xs bg-muted/10 text-foreground">
                      {formatCurrency(mov.saldoAcumuladoDia)}
                    </TableCell>

                    <TableCell className="text-right">
                      {mov.status === 'Prevista' && mov.moduloOrigem === 'Contas a Receber' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-[11px] px-2 gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={() => handleAprovarRecebimentoDireto(mov.idOrigem)}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Receber
                        </Button>
                      )}
                      {mov.status === 'Prevista' && mov.moduloOrigem === 'Contas a Pagar' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-[11px] px-2 gap-1 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => handleAprovarPagamentoDireto(mov.idOrigem)}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Pagar
                        </Button>
                      )}
                      {isConfirmada && (
                        <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 border-emerald-200">
                          Confirmado
                        </Badge>
                      )}
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

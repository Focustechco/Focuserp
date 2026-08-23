import React, { useState, useMemo } from 'react';
import { consolidateFluxoFromStores } from '../utils/consolidateData';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, ArrowUpRight, ArrowDownRight, CheckCircle2, Clock, DollarSign, Wallet } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateBrasilia, getBrasiliaTodayIso } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Confirmada': 
      return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300">Confirmada (Liquidado)</Badge>;
    case 'Prevista': 
      return <Badge variant="outline" className="bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-300 flex items-center gap-1">
        <Clock className="w-3 h-3 text-blue-600" /> Prevista (Em Aberto)
      </Badge>;
    case 'Parcial': 
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-300 border-yellow-300">Parcial</Badge>;
    case 'Cancelada': 
      return <Badge variant="secondary" className="line-through opacity-70">Cancelada</Badge>;
    default: 
      return <Badge variant="outline">{status}</Badge>;
  }
};

export function FluxoTimeline() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');
  const [statusFilter, setStatusFilter] = useState('todos');

  const { data: titulos = [], saveItem: saveTitulo } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contas = [], saveItem: saveConta } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  const fluxoConsolidado = useMemo(() => {
    return consolidateFluxoFromStores(titulos, contas);
  }, [titulos, contas]);

  const filteredData = useMemo(() => {
    return fluxoConsolidado.filter(mov => {
      // 1. Busca por texto
      const matchSearch = 
        (mov.clienteFornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (mov.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // 2. Filtro de Tipo
      const matchType = 
        filterType === 'todos' || 
        (filterType === 'entradas' && mov.tipo === 'Entrada') ||
        (filterType === 'saidas' && mov.tipo === 'Saída');

      if (!matchType) return false;

      // 3. Filtro de Status
      if (statusFilter === 'confirmadas' && mov.status !== 'Confirmada') return false;
      if (statusFilter === 'previstas' && mov.status !== 'Prevista') return false;

      return true;
    });
  }, [fluxoConsolidado, searchTerm, filterType, statusFilter]);

  // Ação rápida: Dar baixa no título em Contas a Receber direto do Fluxo de Caixa
  const handleReceberTitulo = (idOrigem: string) => {
    const titulo = titulos.find(t => t.id === idOrigem);
    if (titulo) {
      saveTitulo({
        ...titulo,
        status: 'Recebido',
        valorRecebido: titulo.valorOriginal,
        saldo: 0,
        dataRecebimento: getBrasiliaTodayIso(),
      });
      toast.success(`Recebimento do título "${titulo.descricao || titulo.numero}" confirmado no Contas a Receber e integrado ao Fluxo de Caixa!`);
    }
  };

  // Ação rápida: Dar baixa na conta em Contas a Pagar direto do Fluxo de Caixa
  const handlePagarConta = (idOrigem: string) => {
    const conta = contas.find(c => c.id === idOrigem);
    if (conta) {
      saveConta({
        ...conta,
        status: 'Pago',
        valorPago: conta.valorOriginal,
        saldo: 0,
        dataPagamento: getBrasiliaTodayIso(),
      });
      toast.success(`Pagamento da conta "${conta.descricao || conta.numero}" confirmado no Contas a Pagar e integrado ao Fluxo de Caixa!`);
    }
  };

  // Totais do período
  const totalEntradas = filteredData.filter(m => m.tipo === 'Entrada').reduce((acc, m) => acc + (m.status === 'Confirmada' ? m.valorRealizado : m.valorOriginal), 0);
  const totalSaidas = filteredData.filter(m => m.tipo === 'Saída').reduce((acc, m) => acc + (m.status === 'Confirmada' ? m.valorRealizado : m.valorOriginal), 0);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barra de Filtros e Controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar por descrição, cliente ou categoria..." 
              className="pl-8 h-8 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[140px] h-8 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas (Entradas e Saídas)</SelectItem>
              <SelectItem value="entradas">Apenas Recebimentos</SelectItem>
              <SelectItem value="saidas">Apenas Pagamentos</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="confirmadas">Apenas Confirmados</SelectItem>
              <SelectItem value="previstas">Apenas Previstos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-8 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar Extrato
          </Button>
        </div>
      </div>

      {/* Tabela do Fluxo de Caixa Consolidado */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Data</TableHead>
              <TableHead>Descrição / Cliente ou Fornecedor</TableHead>
              <TableHead>Origem / Módulo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right bg-muted/30">Saldo Acumulado</TableHead>
              <TableHead className="text-right">Ação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs">
                  Nenhuma movimentação financeira encontrada.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((mov) => {
                const isConfirmada = mov.status === 'Confirmada' || mov.status === 'Parcial';
                const valorExibido = isConfirmada ? mov.valorRealizado : mov.valorOriginal;

                return (
                  <TableRow key={mov.id} className="hover:bg-muted/40 transition-colors">
                    {/* Data formatada exatamente no Fuso de Brasília */}
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
                        ? 'text-emerald-600 dark:text-emerald-400' 
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {mov.tipo === 'Entrada' ? '+' : '-'} {formatCurrency(valorExibido)}
                    </TableCell>

                    <TableCell className="text-right font-bold text-xs bg-muted/10 text-foreground">
                      {formatCurrency(mov.saldoAcumuladoDia)}
                    </TableCell>

                    <TableCell className="text-right">
                      {mov.status === 'Prevista' && mov.moduloOrigem === 'Contas a Receber' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-[11px] px-2 gap-1 text-emerald-600 border-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                          onClick={() => handleReceberTitulo(mov.idOrigem)}
                        >
                          <CheckCircle2 className="w-3 h-3" /> Receber
                        </Button>
                      )}
                      {mov.status === 'Prevista' && mov.moduloOrigem === 'Contas a Pagar' && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 text-[11px] px-2 gap-1 text-rose-600 border-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          onClick={() => handlePagarConta(mov.idOrigem)}
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

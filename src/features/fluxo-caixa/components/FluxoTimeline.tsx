import React, { useState, useMemo } from 'react';
import { consolidateFluxoFromStores } from '../utils/consolidateData';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '@/features/contas-receber/types';
import { ContaPagar } from '@/features/contas-pagar/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, ArrowUpRight, ArrowDownRight, CheckCircle2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDateBrasilia } from '@/lib/dateUtils';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

export function FluxoTimeline() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('todos');

  const { data: titulos = [] } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: contas = [] } = useLocalStorageState<ContaPagar>('focus_contas_pagar');

  // Apenas recebimentos e pagamentos confirmados entram no Fluxo de Caixa
  const fluxoConsolidado = useMemo(() => {
    return consolidateFluxoFromStores(titulos, contas);
  }, [titulos, contas]);

  const filteredData = useMemo(() => {
    return fluxoConsolidado.filter(mov => {
      // 1. Busca textual
      const matchSearch = 
        (mov.clienteFornecedor || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
        (mov.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.categoria || '').toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      // 2. Filtro de Tipo (Entradas / Saídas)
      const matchType = 
        filterType === 'todos' || 
        (filterType === 'entradas' && mov.tipo === 'Entrada') ||
        (filterType === 'saidas' && mov.tipo === 'Saída');

      return matchType;
    });
  }, [fluxoConsolidado, searchTerm, filterType]);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barra de Filtros e Busca */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input 
              placeholder="Buscar no extrato por cliente, descrição..." 
              className="pl-8 h-9 text-xs"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas (Entradas e Saídas)</SelectItem>
              <SelectItem value="entradas">Apenas Recebimentos</SelectItem>
              <SelectItem value="saidas">Apenas Pagamentos</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="h-9 text-xs">
            <Download className="mr-1.5 h-3.5 w-3.5" /> Exportar Extrato
          </Button>
        </div>
      </div>

      {/* Tabela do Extrato do Fluxo de Caixa (Apenas Confirmados) */}
      <div className="rounded-lg border bg-card overflow-hidden shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[110px]">Data</TableHead>
              <TableHead>Descrição / Cliente ou Fornecedor</TableHead>
              <TableHead>Origem / Módulo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Valor Realizado</TableHead>
              <TableHead className="text-right bg-muted/30">Saldo em Caixa</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-12 text-muted-foreground text-xs">
                  Nenhum recebimento ou pagamento liquidado encontrado no caixa.
                  <br />
                  <span className="text-[11px] opacity-70">
                    (Os títulos e parcelas em aberto residem no módulo Contas a Receber até que o recebimento seja confirmado).
                  </span>
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((mov) => (
                <TableRow key={mov.id} className="hover:bg-muted/40 transition-colors">
                  {/* Data formatada no fuso de Brasília */}
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                      Liquidado
                    </span>
                  </TableCell>

                  <TableCell className={`text-right font-semibold text-xs ${
                    mov.tipo === 'Entrada' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {mov.tipo === 'Entrada' ? '+' : '-'} {formatCurrency(mov.valorRealizado)}
                  </TableCell>

                  <TableCell className="text-right font-bold text-xs bg-muted/10 text-foreground">
                    {formatCurrency(mov.saldoAcumuladoDia)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

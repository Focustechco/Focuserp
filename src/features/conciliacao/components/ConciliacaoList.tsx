import React, { useState } from 'react';
import { mockLancamentosSimulados } from '../mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Check, ArrowRightLeft, Link as LinkIcon, Download, RotateCcw, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { ContaBancaria, MovimentacaoBancaria } from '../types';

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
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

export function ConciliacaoList() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const { data: contasBancarias } = useLocalStorageState<ContaBancaria>('focus_contas_bancarias', []);
  const { data: extratos, updateItem: updateExtrato } = useLocalStorageState<MovimentacaoBancaria>('focus_extratos', []);

  const handleConciliar = (extId: string, lanId: string) => {
    updateExtrato(extId, { status: 'Conciliado', lancamentoFinanceiroId: lanId });
  };

  const handleDesfazer = (extId: string) => {
    updateExtrato(extId, { status: 'Não Conciliado', lancamentoFinanceiroId: undefined });
  };

  const filteredExtratos = (extratos || []).filter(e => {
    const safeHistorico = renderHistoricoSafe(e?.historico);
    return safeHistorico.toLowerCase().includes((searchTerm || '').toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Conciliado') return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-200">Conciliado</Badge>;
    if (status === 'Divergente') return <Badge className="bg-rose-100 text-rose-800 hover:bg-rose-200 border-rose-200">Divergente</Badge>;
    return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-slate-200 dark:bg-slate-800 dark:text-slate-300">Pendente</Badge>;
  };

  // Motor de "Sugestão" Simplificado
  const findMatchSuggestion = (extrato: MovimentacaoBancaria) => {
    if (!extrato) return null;
    if (extrato.lancamentoFinanceiroId) {
      // Já está conciliado, retorna o lançamento amarrado
      return mockLancamentosSimulados.find(l => l.id === extrato.lancamentoFinanceiroId);
    }
    if (extrato.status === 'Divergente') return null; // Simulando que a inteligência não achou nada parecido
    
    // Sugestão Baseada em Valor Exato
    return mockLancamentosSimulados.find(l => l.valor === extrato.valor && l.statusFinanceiro === 'Aberto');
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar no histórico do extrato..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select defaultValue="todas">
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Conta Bancária" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as Contas</SelectItem>
              {contasBancarias.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.banco} ({c.conta})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button>
            Conciliar em Lote
          </Button>
        </div>
      </div>

      <div className="rounded-md border bg-card">
        {/* CABEÇALHO DA TABELA LADO A LADO */}
        <div className="grid grid-cols-12 border-b bg-muted/50 p-4 font-medium text-sm text-muted-foreground rounded-t-md">
           <div className="col-span-5 flex items-center gap-2">
             <Building2 className="w-4 h-4" /> Extrato Bancário (Realidade)
           </div>
           <div className="col-span-2 flex items-center justify-center">
             <ArrowRightLeft className="w-4 h-4 text-primary/50" />
           </div>
           <div className="col-span-5 flex items-center gap-2">
             <LinkIcon className="w-4 h-4" /> Lançamento ERP (Planejado)
           </div>
        </div>

        {/* CORPO DA TABELA */}
        <div className="divide-y">
          {filteredExtratos.map(extrato => {
            const suggestion = findMatchSuggestion(extrato);
            const isConciliado = extrato.status === 'Conciliado';
            const isDivergente = extrato.status === 'Divergente';

            return (
              <div key={extrato.id} className={`grid grid-cols-12 p-4 items-center transition-colors hover:bg-muted/30 ${isConciliado ? 'bg-emerald-50/30 dark:bg-emerald-950/10' : ''}`}>
                {/* LADO ESQUERDO: BANCO */}
                <div className="col-span-5 space-y-1">
                  <div className="flex justify-between items-start">
                    <span className="font-semibold text-sm">{formatDateSafe(extrato?.data)} - {renderHistoricoSafe(extrato?.historico) || 'Sem histórico'}</span>
                    <span className={`font-bold ${extrato.tipo === 'Crédito' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {extrato.tipo === 'Crédito' ? '+' : '-'}{formatCurrency(extrato.valor)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Doc: {extrato.documento}</span>
                    <span>•</span>
                    <span>{contasBancarias.find(c => c.id === extrato.contaBancariaId)?.banco || 'Conta não encontrada'}</span>
                  </div>
                </div>

                {/* CENTRO: STATUS E AÇÕES */}
                <div className="col-span-2 flex flex-col items-center justify-center gap-2 px-2">
                  {getStatusBadge(extrato.status)}
                  
                  {isConciliado ? (
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-100" onClick={() => handleDesfazer(extrato.id)}>
                      <RotateCcw className="w-3 h-3 mr-1" /> Desfazer
                    </Button>
                  ) : suggestion && !isDivergente ? (
                    <Button size="sm" className="h-7 text-xs bg-primary/90 hover:bg-primary" onClick={() => handleConciliar(extrato.id, suggestion.id)}>
                      <Check className="w-3 h-3 mr-1" /> Dar Match
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" className="h-7 text-xs">
                      <Search className="w-3 h-3 mr-1" /> Buscar Título
                    </Button>
                  )}
                </div>

                {/* LADO DIREITO: ERP */}
                <div className="col-span-5 pl-4 border-l">
                  {suggestion ? (
                     <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <span className="font-medium text-sm text-primary/90">{renderHistoricoSafe(suggestion.historico) || 'Lançamento ERP'}</span>
                        <span className="font-bold text-muted-foreground">
                          {formatCurrency(suggestion.valor)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{suggestion.entidadeVinculo}</span>
                        {suggestion.centroCustoId && (
                          <>
                            <span>•</span>
                            <span>CC: {suggestion.centroCustoId}</span>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full text-sm text-muted-foreground/60 italic border border-dashed rounded-md p-3">
                      Nenhum lançamento no financeiro (Aberto) encontado.
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          
          {filteredExtratos.length === 0 && (
            <div className="p-8 text-center text-muted-foreground">
              Nenhuma movimentação bancária encontrada. Realize a importação de um extrato para começar.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { TituloReceber } from '../types';
import { RecorrenciaFinanceira } from '@/features/recorrencias/types';
import { Contrato } from '@/features/contratos/types';
import { generateRecorrenciaDates } from '@/features/recorrencias/services/recorrenciaEngine';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Filter, Calendar, RefreshCw, ArrowUpRight, 
  DollarSign, Clock, FileText, CheckCircle2, 
  TrendingUp, Layers, ChevronRight, Trash2, UserX
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
import { addMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { toast } from 'sonner';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { useContasReceberQuery } from '../hooks/useContasReceberQuery';
import { useClientesQuery } from '@/features/clientes/hooks/useClientesQuery';

export interface RecebimentoFuturoItem {
  id: string;
  origemId: string;
  origemTipo: 'Recorrência' | 'Contrato' | 'Parcelamento';
  clienteId?: string;
  clienteNome: string;
  descricao: string;
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

export function RecebimentosFuturosTab() {
  const [searchTerm, setSearchTerm] = useState('');
  const [periodoFilter, setPeriodoFilter] = useState<'30dias' | '3meses' | '6meses' | '12meses' | 'todos'>('30dias');
  const [origemFilter, setOrigemFilter] = useState<'todas' | 'Recorrência' | 'Contrato'>('todas');
  const [isEmitindo, setIsEmitindo] = useState<string | null>(null);
  const [itemParaExcluir, setItemParaExcluir] = useState<RecebimentoFuturoItem | null>(null);

  const { clientes = [] } = useClientesQuery();
  const { data: recorrencias = [], setAllItems: setAllRecorrencias } = useLocalStorageState<RecorrenciaFinanceira>('focus_recorrencias');
  const { data: contratos = [], setAllItems: setAllContratos } = useLocalStorageState<Contrato>('focus_contratos');
  const { data: localTitulos = [], setAllItems: setAllTitulos, saveItem: saveLocalTitulo } = useLocalStorageState<TituloReceber>('focus_contas_receber');
  const { data: dispensados = [], setAllItems: setAllDispensados } = useLocalStorageState<string>('focus_recebimentos_futuros_dispensados', []);
  const { saveTitulo: saveQueryTitulo } = useContasReceberQuery();
  const { notificar } = useNotificacoesStore();

  const hojeStr = getBrasiliaTodayIso();
  const hoje = new Date();

  // Mapeamento de clientes válidos e ativos
  const validClientsMap = useMemo(() => {
    const map = new Map<string, string>();
    clientes.forEach(c => {
      if (c && c.id) {
        map.set(String(c.id), c.nomeFantasia || c.razaoSocial || 'Cliente');
      }
    });
    return map;
  }, [clientes]);

  const validClientNamesSet = useMemo(() => {
    const set = new Set<string>();
    clientes.forEach(c => {
      if (c) {
        if (c.nomeFantasia) set.add(c.nomeFantasia.trim().toLowerCase());
        if (c.razaoSocial) set.add(c.razaoSocial.trim().toLowerCase());
      }
    });
    return set;
  }, [clientes]);

  // 1. Mapeia todos os títulos já emitidos para não duplicar no cronograma futuro
  const titulosExistentesMap = useMemo(() => {
    const set = new Set<string>();
    localTitulos.forEach(t => {
      if (t && t.dataVencimento) {
        const mesAno = t.dataVencimento.substring(0, 7); // 'YYYY-MM'
        const safeCli = (t.cliente || '').trim().toLowerCase();
        set.add(`${safeCli}|${mesAno}`);
        if (t.clienteId) set.add(`${t.clienteId}|${mesAno}`);
      }
    });
    return set;
  }, [localTitulos]);

  // 2. Projeta os meses futuros a partir das Recorrências ativas e Contratos vigentes de clientes EXISTENTES
  const todosFuturos = useMemo(() => {
    const lista: RecebimentoFuturoItem[] = [];

    // Recorrências Ativas
    const recsAtivas = recorrencias.filter(r => r && r.status === 'Ativa');
    recsAtivas.forEach(rec => {
      if (dispensados.includes(rec.id)) return;

      // Se clientes já foram carregados e o cliente da recorrência não existe mais, IGNORAR (excluído em cascata)
      if (clientes.length > 0) {
        const hasValidId = rec.clientId && validClientsMap.has(rec.clientId);
        const hasValidName = rec.clienteNome && validClientNamesSet.has(rec.clienteNome.trim().toLowerCase());
        if (!hasValidId && !hasValidName) return;
      }

      const datas = generateRecorrenciaDates(rec, 60);
      const totalCiclos = rec.quantidade && rec.quantidade > 0 ? rec.quantidade : (rec.dataFim || rec.dataFinal ? datas.length : undefined);
      const safeCli = (rec.clienteNome || '').trim().toLowerCase();

      datas.forEach((dataVenc, idx) => {
        const itemId = `rec-fut-${rec.id}-${dataVenc}`;
        if (dispensados.includes(itemId)) return;

        const mesAno = dataVenc.substring(0, 7);
        const jaExiste = titulosExistentesMap.has(`${safeCli}|${mesAno}`) || 
                         (rec.clientId && titulosExistentesMap.has(`${rec.clientId}|${mesAno}`));

        // Apenas lançamentos com data de vencimento futura e que ainda não viraram título emitido
        if (!jaExiste && dataVenc >= hojeStr) {
          lista.push({
            id: itemId,
            origemId: rec.id,
            origemTipo: 'Recorrência',
            clienteId: rec.clientId,
            clienteNome: rec.clienteNome || 'Cliente',
            descricao: rec.descricao || 'Mensalidade Recorrente',
            dataVencimentoPrevista: dataVenc,
            valorPrevisto: Number(rec.valor) || 0,
            cicloIndex: idx + 1,
            totalCiclos: totalCiclos,
            cicloLabel: `Parcela ${idx + 1}${totalCiclos ? `/${totalCiclos}` : ''}`,
            status: 'Programado', // NUNCA Recebido ou Pago
          });
        }
      });
    });

    // Contratos Vigentes sem recorrência cadastrada
    const clientIdsComRec = new Set(recsAtivas.map(r => r.clientId).filter(Boolean));
    contratos.forEach(c => {
      if (!c) return;
      if (dispensados.includes(c.id) || dispensados.includes(`rec-contrato-${c.id}`)) return;
      if (c.clienteId && clientIdsComRec.has(c.clienteId)) return;

      // Se clientes foram carregados e o cliente não existe mais, IGNORAR
      if (clientes.length > 0) {
        const hasValidId = c.clienteId && validClientsMap.has(c.clienteId);
        const hasValidName = c.clienteNome && validClientNamesSet.has(c.clienteNome.trim().toLowerCase());
        if (!hasValidId && !hasValidName) return;
      }

      if (c.status === 'Ativo' || c.status === 'Vigente') {
        const valorMensal = Number(c.valorMensal || (c as any).valorMensalidade || 0);
        if (valorMensal > 0 && c.dataInicio) {
          const recFake: RecorrenciaFinanceira = {
            id: `rec-contrato-${c.id}`,
            clientId: c.clienteId || '',
            clienteNome: c.clienteNome || c.nome || 'Cliente',
            descricao: `Contrato ${c.numeroContrato || c.nome}`,
            valor: valorMensal,
            frequencia: 'Mensal',
            dataInicio: c.dataInicio,
            dataFim: c.dataFim,
            diaVencimento: 10,
            status: 'Ativa',
            origem: 'contrato',
            contratoId: c.id,
            createdAt: c.criadoEm || new Date().toISOString(),
            updatedAt: c.atualizadoEm || new Date().toISOString(),
          };

          const datas = generateRecorrenciaDates(recFake, 60);
          const totalCiclos = recFake.quantidade && recFake.quantidade > 0 ? recFake.quantidade : (recFake.dataFim ? datas.length : undefined);
          const safeCli = (c.clienteNome || c.nome || '').trim().toLowerCase();

          datas.forEach((dataVenc, idx) => {
            const itemId = `ctr-fut-${c.id}-${dataVenc}`;
            if (dispensados.includes(itemId)) return;

            const mesAno = dataVenc.substring(0, 7);
            const jaExiste = titulosExistentesMap.has(`${safeCli}|${mesAno}`) || 
                             (c.clienteId && titulosExistentesMap.has(`${c.clienteId}|${mesAno}`));

            if (!jaExiste && dataVenc >= hojeStr) {
              lista.push({
                id: itemId,
                origemId: c.id,
                origemTipo: 'Contrato',
                clienteId: c.clienteId,
                clienteNome: c.clienteNome || c.nome || 'Cliente',
                descricao: `Mensalidade ${c.numeroContrato || c.nome}`,
                dataVencimentoPrevista: dataVenc,
                valorPrevisto: valorMensal,
                cicloIndex: idx + 1,
                totalCiclos: totalCiclos,
                cicloLabel: `Parcela ${idx + 1}${totalCiclos ? `/${totalCiclos}` : ''}`,
                status: 'Programado',
              });
            }
          });
        }
      }
    });

    // Ordenação estritamente cronológica por vencimento previsto
    lista.sort((a, b) => a.dataVencimentoPrevista.localeCompare(b.dataVencimentoPrevista));
    return lista;
  }, [recorrencias, contratos, titulosExistentesMap, hojeStr, dispensados, clientes, validClientsMap, validClientNamesSet]);

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
        item.clienteNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const totalMRRRecorrente = useMemo(() => {
    return recorrencias
      .filter(r => {
        if (!r || r.status !== 'Ativa') return false;
        if (clientes.length > 0) {
          const hasValidId = r.clientId && validClientsMap.has(r.clientId);
          const hasValidName = r.clienteNome && validClientNamesSet.has(r.clienteNome.trim().toLowerCase());
          if (!hasValidId && !hasValidName) return false;
        }
        return true;
      })
      .reduce((acc, r) => acc + Number(r.valor || 0), 0);
  }, [recorrencias, clientes, validClientsMap, validClientNamesSet]);

  // 5. Ação: Emitir / Antecipar Título Oficial no Contas a Receber
  const handleEmitirTituloAgora = async (item: RecebimentoFuturoItem) => {
    setIsEmitindo(item.id);
    try {
      const numeroOficial = `REC-${Math.floor(1000 + Math.random() * 9000)}`;
      const novoTitulo: TituloReceber = {
        id: `rec-ant-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        numero: numeroOficial,
        cliente: item.clienteNome,
        clienteId: item.clienteId,
        descricao: `${item.descricao} (${item.cicloLabel})`,
        categoria: 'Receita Recorrente',
        valorOriginal: item.valorPrevisto,
        valorRecebido: 0,
        saldo: item.valorPrevisto,
        dataEmissao: hojeStr,
        dataVencimento: item.dataVencimentoPrevista,
        formaPagamento: 'Boleto',
        status: 'Pendente',
        responsavel: 'Financeiro Focus ERP',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      saveLocalTitulo(novoTitulo);
      try { await saveQueryTitulo(novoTitulo); } catch {}

      notificar({
        titulo: `Título Antecipado: ${novoTitulo.numero}`,
        descricao: `Lançamento ${novoTitulo.descricao} de ${formatCurrency(novoTitulo.valorOriginal)} gerado no Contas a Receber.`,
        origem: 'Financeiro',
        tipo: 'Sucesso',
        prioridade: 'Normal',
        targetUrl: '/contas-a-receber'
      });

      toast.success(`Título ${novoTitulo.numero} emitido com sucesso com status Pendente!`);
    } catch {
      toast.error('Erro ao emitir o título.');
    } finally {
      setIsEmitindo(null);
    }
  };

  // 6. Ação: Excluir Toda a Recorrência Deste Item
  const handleExcluirRecorrenciaCompleta = (item: RecebimentoFuturoItem) => {
    const itemCliNome = (item.clienteNome || '').trim().toLowerCase();

    // Remover de recorrencias
    const novasRecs = recorrencias.filter(r => {
      if (!r) return false;
      if (r.id === item.origemId || r.id === `rec-${item.origemId}`) return false;
      if (item.clienteId && r.clientId === item.clienteId && r.descricao === item.descricao) return false;
      if (itemCliNome && (r.clienteNome || '').trim().toLowerCase() === itemCliNome && r.descricao === item.descricao) return false;
      return true;
    });
    setAllRecorrencias(novasRecs);

    // Se for contrato, desativar
    const novosContratos = contratos.map(c => {
      if (c.id === item.origemId || (item.clienteId && c.clienteId === item.clienteId)) {
        return { ...c, status: 'Encerrado' as const };
      }
      return c;
    });
    setAllContratos(novosContratos);

    // Adicionar aos dispensados
    setAllDispensados([...dispensados, item.origemId, item.id, `rec-contrato-${item.origemId}`]);

    toast.success(`Recorrência "${item.descricao}" excluída com sucesso!`);
    setItemParaExcluir(null);
  };

  // 7. Ação: Excluir TODAS as recorrências do cliente selecionado
  const handleExcluirTodasDoCliente = (item: RecebimentoFuturoItem) => {
    const itemCliNome = (item.clienteNome || '').trim().toLowerCase();

    const novasRecs = recorrencias.filter(r => {
      if (!r) return false;
      if (item.clienteId && r.clientId === item.clienteId) return false;
      if (itemCliNome && (r.clienteNome || '').trim().toLowerCase() === itemCliNome) return false;
      return true;
    });
    setAllRecorrencias(novasRecs);

    const novosContratos = contratos.map(c => {
      if (item.clienteId && c.clienteId === item.clienteId) return { ...c, status: 'Encerrado' as const };
      if (itemCliNome && (c.clienteNome || '').trim().toLowerCase() === itemCliNome) return { ...c, status: 'Encerrado' as const };
      return c;
    });
    setAllContratos(novosContratos);

    toast.success(`Todas as recorrências e previsões do cliente "${item.clienteNome}" foram excluídas!`);
    setItemParaExcluir(null);
  };

  // 8. Ação: Dispensar apenas este ciclo específico
  const handleDispensarApenasEsteCiclo = (item: RecebimentoFuturoItem) => {
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
            <span className="font-medium">Total Previsto Futuro</span>
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {formatCurrency(totalPrevisto)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {filtrados.length} lançamentos programados no período
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-medium">Próximos 30 Dias</span>
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            {formatCurrency(totalProximos30Dias)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Previsão do próximo ciclo a vencer
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-medium">MRR Mensal Ativo</span>
            <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalMRRRecorrente)}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Base de receita recorrente mensal
          </p>
        </div>

        <div className="p-4 rounded-xl border bg-card/60 backdrop-blur shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span className="font-medium">Origens Monitoradas</span>
            <RefreshCw className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold text-foreground">
            {recorrencias.filter(r => r.status === 'Ativa').length + contratos.filter(c => c.status === 'Ativo' || c.status === 'Vigente').length}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Contratos e assinaturas ativas
          </p>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-xl border bg-card space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente, serviço, contrato..." 
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
                <SelectItem value="Contrato">Contratos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Tabela de Recebimentos Futuros */}
      <div className="border rounded-xl bg-card overflow-hidden shadow-xs">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="text-xs font-semibold">Parcela</TableHead>
              <TableHead className="text-xs font-semibold">Cliente</TableHead>
              <TableHead className="text-xs font-semibold">Descrição / Referência</TableHead>
              <TableHead className="text-xs font-semibold">Origem</TableHead>
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
                  Nenhum recebimento futuro programado para os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/30 transition-colors">
                  <TableCell className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                    <Badge variant="outline" className="font-mono text-[10px] bg-blue-50/50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800">
                      {item.cicloLabel}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="font-semibold text-xs text-foreground block truncate">
                      {item.clienteNome}
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
                        <FileText className="w-2.5 h-2.5 text-emerald-500 shrink-0" />
                      )}
                      {item.origemTipo}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs font-medium text-foreground">
                    {formatDateBrasilia(item.dataVencimentoPrevista)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-xs text-foreground">
                    {formatCurrency(item.valorPrevisto)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="outline"
                      className="text-[10px] bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-medium"
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
                        onClick={() => handleEmitirTituloAgora(item)}
                        className="h-7 text-[11px] px-2.5 gap-1 text-primary hover:text-primary hover:bg-primary/10 border-primary/30 cursor-pointer"
                      >
                        <ArrowUpRight className="w-3.5 h-3.5" />
                        {isEmitindo === item.id ? 'Emitindo...' : 'Emitir Título'}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => setItemParaExcluir(item)}
                        title="Excluir ou Dispensar Recorrência"
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
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
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <Trash2 className="w-5 h-5" /> Excluir Recorrência / Previsão Futura
            </DialogTitle>
            <DialogDescription className="pt-2 text-sm text-foreground">
              Você selecionou <span className="font-semibold text-foreground">{itemParaExcluir?.descricao}</span> do cliente <span className="font-bold text-orange-600">{itemParaExcluir?.clienteNome}</span> no valor de <span className="font-semibold text-emerald-600">{itemParaExcluir && formatCurrency(itemParaExcluir.valorPrevisto)}</span>.
            </DialogDescription>
          </DialogHeader>

          <div className="p-3 bg-muted/50 rounded-xl text-xs space-y-2 border">
            <p className="font-medium text-foreground">Escolha a ação de exclusão:</p>
            <ul className="list-disc pl-4 space-y-1.5 text-muted-foreground">
              <li><strong className="text-foreground">Excluir Esta Recorrência:</strong> Remove todas as parcelas e projeções futuras deste serviço/contrato.</li>
              <li><strong className="text-foreground">Excluir Todas do Cliente:</strong> Remove todas as recorrências e vínculos financeiros deste cliente.</li>
              <li><strong className="text-foreground">Dispensar Apenas Este Mês:</strong> Oculta apenas o vencimento ({itemParaExcluir?.cicloLabel}).</li>
            </ul>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setItemParaExcluir(null)}
              className="w-full sm:w-auto text-xs"
            >
              Cancelar
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => itemParaExcluir && handleDispensarApenasEsteCiclo(itemParaExcluir)}
              className="w-full sm:w-auto text-xs"
            >
              Dispensar Apenas Este Mês
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => itemParaExcluir && handleExcluirRecorrenciaCompleta(itemParaExcluir)}
              className="w-full sm:w-auto text-xs font-semibold"
            >
              Excluir Esta Recorrência
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => itemParaExcluir && handleExcluirTodasDoCliente(itemParaExcluir)}
              className="w-full sm:w-auto text-xs font-bold bg-rose-700 hover:bg-rose-800"
            >
              <UserX className="w-3 h-3 mr-1" /> Excluir Todas do Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

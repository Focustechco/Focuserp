import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Cobranca, TipoResposta } from '../types';
import { INITIAL_COBRANCAS } from '../mockData';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, Filter, MoreHorizontal, Download, Plus, Mail, MessageSquare, 
  Smartphone, Eye, CheckCircle2, RotateCcw, Trash2, XCircle, Send
} from 'lucide-react';
import { NovaCobrancaSheet } from './NovaCobrancaSheet';
import { CobrancaDetalhesModal } from './CobrancaDetalhesModal';
import { RegistrarRespostaModal } from './RegistrarRespostaModal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const getStatusCobrancaColor = (status: string) => {
  switch (status) {
    case 'Paga': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300';
    case 'Respondida': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300 border-indigo-300';
    case 'Vencida': return 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300';
    case 'Lida': return 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border-blue-300';
    case 'Enviada': return 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300 border-sky-300';
    case 'Agendada': return 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border-purple-300';
    case 'Cancelada': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400 border-gray-300';
    default: return 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border-amber-300';
  }
};

const getStatusEntregaColor = (status: string) => {
  switch (status) {
    case 'Entregue': return 'bg-emerald-50 text-emerald-700 border-emerald-300';
    case 'Enviado': return 'bg-blue-50 text-blue-700 border-blue-300';
    case 'Pendente': return 'bg-amber-50 text-amber-700 border-amber-300';
    case 'Falhou': return 'bg-rose-50 text-rose-700 border-rose-300';
    default: return 'bg-gray-50 text-gray-700 border-gray-300';
  }
};

const getCanalIcon = (canal: string) => {
  switch (canal) {
    case 'WhatsApp': return <MessageSquare className="w-3.5 h-3.5 text-green-600" />;
    case 'E-mail': return <Mail className="w-3.5 h-3.5 text-blue-600" />;
    case 'SMS': return <Smartphone className="w-3.5 h-3.5 text-amber-600" />;
    default: return null;
  }
};

export function CobrancasList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [canalFilter, setCanalFilter] = useState('todos');

  // Modals state
  const [selectedCobranca, setSelectedCobranca] = useState<Cobranca | null>(null);
  const [respostaModalCobranca, setRespostaModalCobranca] = useState<Cobranca | null>(null);

  const { data: cobrancasData, updateItem, deleteItem } = useLocalStorageState<Cobranca>('focus_cobrancas', INITIAL_COBRANCAS);
  const cobrancas = Array.isArray(cobrancasData) ? cobrancasData : [];

  const filteredData = useMemo(() => {
    return cobrancas.filter(c => {
      if (!c) return false;
      const search = searchTerm.toLowerCase();
      const matchSearch = 
        (c.cliente || '').toLowerCase().includes(search) ||
        (c.id || '').toLowerCase().includes(search) ||
        (c.tituloReferencia || '').toLowerCase().includes(search);

      const matchStatus = statusFilter === 'todos' || c.statusCobranca === statusFilter;
      const matchCanal = canalFilter === 'todos' || (c.canal || []).includes(canalFilter as any);

      return matchSearch && matchStatus && matchCanal;
    });
  }, [cobrancas, searchTerm, statusFilter, canalFilter]);

  // Reenviar Cobrança
  const handleReenviar = (cob: Cobranca) => {
    const nowIso = new Date().toISOString();
    const newTimeline = [
      ...(cob.timeline || []),
      {
        id: `t-${Date.now()}`,
        dataHora: nowIso,
        usuario: 'Usuário Focus',
        canal: cob.canal[0],
        acao: 'Reenvio Manual Realizado',
        detalhes: `Notificação reenviada para ${cob.cliente} via ${cob.canal.join(', ')}.`
      }
    ];

    updateItem(cob.id, {
      statusCobranca: 'Enviada',
      statusEntrega: 'Entregue',
      dataHoraEnvio: nowIso,
      timeline: newTimeline
    });

    toast.success(`Cobrança ${cob.id} reenviada para ${cob.cliente} com sucesso!`);
  };

  // Marcar como Paga
  const handleMarcarPaga = (cob: Cobranca) => {
    const nowIso = new Date().toISOString();
    const newTimeline = [
      ...(cob.timeline || []),
      {
        id: `t-${Date.now()}`,
        dataHora: nowIso,
        usuario: 'Operador Financeiro',
        acao: 'Pagamento Confirmado',
        detalhes: `Liquidação de ${formatCurrency(cob.valor)} registrada manualmente no sistema.`
      }
    ];

    updateItem(cob.id, {
      statusCobranca: 'Paga',
      dataHoraPagamento: nowIso,
      timeline: newTimeline
    });

    toast.success(`Cobrança ${cob.id} marcada como Paga!`);
  };

  // Registrar Resposta do Cliente
  const handleSaveResposta = (cobrancaId: string, resposta: string, classificacao: TipoResposta) => {
    const cob = cobrancas.find(c => c.id === cobrancaId);
    if (!cob) return;

    const nowIso = new Date().toISOString();
    const newTimeline = [
      ...(cob.timeline || []),
      {
        id: `t-${Date.now()}`,
        dataHora: nowIso,
        usuario: `Cliente (${cob.cliente})`,
        canal: cob.canal[0],
        acao: `Resposta do Cliente: ${classificacao}`,
        detalhes: resposta
      }
    ];

    updateItem(cobrancaId, {
      respostaCliente: resposta,
      classificacaoResposta: classificacao,
      statusCobranca: classificacao === 'Confirmação de pagamento' ? 'Paga' : 'Respondida',
      timeline: newTimeline
    });
  };

  // Cancelar cobrança
  const handleCancelar = (cob: Cobranca) => {
    const nowIso = new Date().toISOString();
    const newTimeline = [
      ...(cob.timeline || []),
      {
        id: `t-${Date.now()}`,
        dataHora: nowIso,
        usuario: 'Usuário Focus',
        acao: 'Cobrança Cancelada',
        detalhes: 'Disparos cancelados pelo operador.'
      }
    ];

    updateItem(cob.id, {
      statusCobranca: 'Cancelada',
      timeline: newTimeline
    });

    toast.info(`Cobrança ${cob.id} cancelada.`);
  };

  // Exportar CSV
  const exportarCSV = () => {
    if (filteredData.length === 0) {
      toast.error("Nenhuma cobrança para exportar.");
      return;
    }

    const headers = ["ID", "Referência", "Cliente", "Vencimento", "Valor", "Canais", "Status Entrega", "Status Cobrança"];
    const rows = filteredData.map(c => [
      c.id,
      c.tituloReferencia,
      `"${c.cliente}"`,
      c.vencimento,
      c.valor,
      `"${(c.canal || []).join(';')}"`,
      c.statusEntrega,
      c.statusCobranca
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `cobrancas_focus_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Relatório CSV de cobranças baixado!");
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barra de Filtros e Ferramentas */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por cliente, ID ou título..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status Cobrança" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Status</SelectItem>
              <SelectItem value="Pendente">Pendente</SelectItem>
              <SelectItem value="Enviada">Enviada</SelectItem>
              <SelectItem value="Lida">Lida</SelectItem>
              <SelectItem value="Respondida">Respondida</SelectItem>
              <SelectItem value="Paga">Paga</SelectItem>
              <SelectItem value="Agendada">Agendada</SelectItem>
              <SelectItem value="Vencida">Vencida</SelectItem>
              <SelectItem value="Cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>

          <Select value={canalFilter} onValueChange={setCanalFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Canal" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos Canais</SelectItem>
              <SelectItem value="WhatsApp">WhatsApp</SelectItem>
              <SelectItem value="E-mail">E-mail</SelectItem>
              <SelectItem value="SMS">SMS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <Button variant="outline" onClick={exportarCSV} className="gap-1.5">
            <Download className="h-4 w-4" />
            Exportar CSV
          </Button>
          
          <NovaCobrancaSheet>
            <Button className="gap-1.5">
              <Plus className="h-4 w-4" />
              Nova Cobrança
            </Button>
          </NovaCobrancaSheet>
        </div>
      </div>

      {/* Tabela de Cobranças */}
      <div className="rounded-xl border bg-card overflow-x-auto shadow-xs">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="w-36">ID / Referência</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimento</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead>Canais</TableHead>
              <TableHead>Status Entrega</TableHead>
              <TableHead>Status Cobrança</TableHead>
              <TableHead className="text-right w-20">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12 text-muted-foreground text-sm">
                  Nenhuma cobrança encontrada com os filtros selecionados.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((cobranca) => (
                <TableRow 
                  key={cobranca.id}
                  className="group cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setSelectedCobranca(cobranca)}
                >
                  <TableCell>
                    <div className="font-bold text-xs font-mono text-primary">{cobranca.id}</div>
                    <div className="text-[11px] text-muted-foreground">Ref: {cobranca.tituloReferencia}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-semibold text-sm text-foreground">{cobranca.cliente}</div>
                    {cobranca.respostaCliente && (
                      <div className="text-[11px] text-indigo-600 dark:text-indigo-400 truncate max-w-[200px] flex items-center gap-1">
                        <MessageSquare className="w-2.5 h-2.5 shrink-0" />
                        <span>"{cobranca.respostaCliente}"</span>
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{formatDateBrasilia(cobranca.vencimento)}</TableCell>
                  <TableCell className="text-right font-bold text-sm text-foreground">
                    {formatCurrency(cobranca.valor)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1.5 items-center">
                      {(cobranca.canal || []).map(c => (
                        <div key={c} title={c} className="p-1 rounded bg-muted/60">
                          {getCanalIcon(c)}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusEntregaColor(cobranca.statusEntrega)} text-[11px]`}>
                      {cobranca.statusEntrega}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`${getStatusCobrancaColor(cobranca.statusCobranca)} text-[11px]`}>
                      {cobranca.statusCobranca}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setSelectedCobranca(cobranca)}>
                          <Eye className="w-4 h-4 mr-2" /> Ver Detalhes e Timeline
                        </DropdownMenuItem>
                        
                        {cobranca.statusCobranca !== 'Paga' && (
                          <>
                            <DropdownMenuItem onClick={() => setRespostaModalCobranca(cobranca)}>
                              <MessageSquare className="w-4 h-4 mr-2 text-indigo-500" /> Registrar Resposta
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReenviar(cobranca)}>
                              <Send className="w-4 h-4 mr-2 text-blue-500" /> Reenviar Notificação
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleMarcarPaga(cobranca)}>
                              <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Confirmar Pagamento
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleCancelar(cobranca)} className="text-amber-600">
                              <XCircle className="w-4 h-4 mr-2" /> Cancelar Cobrança
                            </DropdownMenuItem>
                          </>
                        )}

                        <DropdownMenuItem 
                          className="text-red-600" 
                          onClick={() => {
                            deleteItem(cobranca.id);
                            toast.success(`Cobrança ${cobranca.id} excluída!`);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir Registro
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Modal de Detalhes da Cobrança */}
      <CobrancaDetalhesModal
        cobranca={selectedCobranca}
        open={!!selectedCobranca}
        onOpenChange={(open) => !open && setSelectedCobranca(null)}
        onRegistrarResposta={(cob) => setRespostaModalCobranca(cob)}
        onMarcarPaga={(cob) => handleMarcarPaga(cob)}
      />

      {/* Modal de Registro de Resposta */}
      <RegistrarRespostaModal
        cobranca={respostaModalCobranca}
        open={!!respostaModalCobranca}
        onOpenChange={(open) => !open && setRespostaModalCobranca(null)}
        onSave={handleSaveResposta}
      />
    </div>
  );
}

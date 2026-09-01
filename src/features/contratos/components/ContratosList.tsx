import React, { useState, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Contrato } from '../types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  MoreHorizontal, 
  CalendarClock, 
  Building2, 
  User, 
  Trash2, 
  FileText, 
  Eye,
  ShieldCheck,
  Calendar,
  DollarSign,
  Edit3,
  Landmark,
  ExternalLink,
  CheckCircle2,
  Lock,
  Layers,
  LayoutGrid,
  List as ListIcon,
  ArrowRight,
  X
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { differenceInDays } from 'date-fns';
import { NovoContratoSheet, downloadDocumentFile } from './NovoContratoSheet';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

const formatDateSafe = (dateStr?: string) => {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('pt-BR');
  } catch {
    return dateStr;
  }
};

interface ContratosListProps {
  filterTitularidade?: 'Cliente' | 'Focus Tecnologia' | 'Todos';
  filterEntidade?: string[];
}

export function ContratosList({ filterTitularidade = 'Todos', filterEntidade }: ContratosListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [viewMode, setViewMode] = useState<'tabela' | 'cards'>('cards');
  
  const { data: contratos = [], deleteItem } = useLocalStorageState<Contrato>('focus_contratos', []);
  const { data: clientes = [] } = useLocalStorageState<any>('focus_clientes', []);
  const { data: fornecedores = [] } = useLocalStorageState<any>('focus_fornecedores', []);

  // Details & Edit Modal States
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [contratoToEdit, setContratoToEdit] = useState<Contrato | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  const [contratoToDelete, setContratoToDelete] = useState<Contrato | null>(null);

  // Deduplica e higieniza a lista de contratos automaticamente
  const uniqueContratos = useMemo(() => {
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    
    return (contratos || []).filter((c: any) => {
      if (!c || !c.id) return false;
      // Excluir pastas do DMS que possam ter sido injetadas por colisão
      if (c.caminhoCompleto || c.parentId !== undefined || c.moduloVinculado) return false;
      // Validar campos mínimos de contrato legítimo
      const hasContractData = Boolean(c.numeroContrato || c.objetoContrato || c.objeto || c.valorTotal || c.valorMensalidade || c.tipoContrato);
      if (!hasContractData && !c.nome) return false;
      if (['Clientes', 'Projetos', 'RH', 'Colaboradores', 'Folha de Pagamento', 'Contratos de Trabalho', 'Atestados e Licenças', 'Produtos Focus', 'Manuais e Guias'].includes(c.nome)) {
        return false;
      }
      
      if (seenIds.has(c.id)) return false;
      
      const key = `${c.numeroContrato || ''}_${c.clienteNome || ''}_${c.nome || ''}`;
      if (seenKeys.has(key)) return false;
      
      seenIds.add(c.id);
      seenKeys.add(key);
      return true;
    });
  }, [contratos]);

  // Identificador da titularidade de um contrato
  const isContratoFocus = (c: Contrato) => {
    if (c.titularidade === 'Focus Tecnologia') return true;
    if (c.titularidade === 'Cliente') return false;
    if (c.entidadeVinculo === 'Focus Tecnologia' || c.entidadeVinculo === 'Fornecedor' || c.entidadeVinculo === 'Parceiro' || c.entidadeVinculo === 'Interno') return true;
    if (c.categoria === 'Despesa' || c.categoria === 'Interno') return true;
    return false;
  };

  const filteredData = useMemo(() => {
    return uniqueContratos.filter(c => {
      const matchSearch = 
        (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.numeroContrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.clienteNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.contraparteNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.fornecedorNome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.responsavelInterno || '').toLowerCase().includes(searchTerm.toLowerCase());
             
      const isFocus = isContratoFocus(c);
      
      // Filtro de Titularidade (Abas: Todos | Clientes | Focus Tecnologia Ltda)
      let matchTitularidade = true;
      if (filterTitularidade === 'Cliente') {
        matchTitularidade = !isFocus;
      } else if (filterTitularidade === 'Focus Tecnologia') {
        matchTitularidade = isFocus;
      }

      // Filtro de Status
      const matchStatus = statusFilter === 'todos' || c.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchSearch && matchTitularidade && matchStatus;
    });
  }, [uniqueContratos, searchTerm, filterTitularidade, statusFilter]);

  const handleOpenDetails = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setDetailsOpen(true);
  };

  const handleOpenEdit = (contrato: Contrato, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setContratoToEdit(contrato);
    setEditSheetOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!contratoToDelete) return;
    deleteItem(contratoToDelete.id);
    toast.success(`Contrato "${contratoToDelete.numeroContrato} - ${contratoToDelete.nome}" excluído com sucesso!`);
    setContratoToDelete(null);
  };

  const handleDownload = (contrato: Contrato, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadDocumentFile(contrato.arquivoUrl, contrato.arquivoNome, contrato.nome);
    toast.success(`Download de "${contrato.arquivoNome || contrato.nome}" iniciado!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Vigente':
        return <Badge className="bg-emerald-600 text-white font-semibold text-[11px]">Vigente</Badge>;
      case 'Encerrado':
        return <Badge variant="secondary" className="text-[11px]">Encerrado</Badge>;
      case 'Cancelado':
        return <Badge variant="destructive" className="text-[11px]">Cancelado</Badge>;
      case 'Aguardando Assinatura':
        return <Badge variant="outline" className="text-orange-700 bg-orange-50 border-orange-300 dark:bg-orange-950/40 dark:text-orange-400 text-[11px] font-semibold">Aguardando Assinatura</Badge>;
      default:
        return <Badge variant="outline" className="text-[11px]">{status}</Badge>;
    }
  };

  const hoje = new Date();

  return (
    <div className="space-y-4 animate-fade-in">
      {/* BARRA SUPERIOR DE BUSCA E AÇÕES */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-3 rounded-lg border shadow-2xs">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por nome, número, cliente ou código..." 
              className="pl-8 text-xs h-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="h-9 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5 mr-1" /> Limpar
            </Button>
          )}
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          {/* Seletor de Modo de Visualização: Cards Detalhados vs Tabela */}
          <div className="flex items-center border rounded-md p-0.5 bg-muted/40">
            <Button 
              variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-1 text-xs"
              onClick={() => setViewMode('cards')}
              title="Visualização em Cards Detalhados"
            >
              <LayoutGrid className="w-3.5 h-3.5 text-orange-600" /> Cards
            </Button>
            <Button 
              variant={viewMode === 'tabela' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 gap-1 text-xs"
              onClick={() => setViewMode('tabela')}
              title="Visualização em Tabela"
            >
              <ListIcon className="w-3.5 h-3.5" /> Tabela
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm"
            onClick={() => toast.info("Exportação da lista de contratos gerada.")}
            className="h-9 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar
          </Button>

          {/* Botão Novo Contrato contextualizado com a aba ativa */}
          <NovoContratoSheet 
            defaultTitularidade={filterTitularidade === 'Focus Tecnologia' ? 'Focus Tecnologia' : 'Cliente'}
          >
            <Button size="sm" className="h-9 text-xs bg-orange-600 hover:bg-orange-700 text-white font-semibold gap-1.5 shadow-xs">
              <Plus className="h-3.5 w-3.5" />
              {filterTitularidade === 'Focus Tecnologia' ? 'Novo Contrato Focus' : 'Novo Contrato'}
            </Button>
          </NovoContratoSheet>
        </div>
      </div>

      {/* MODO CARDS DETALHADOS */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted-foreground text-xs bg-card rounded-lg border">
              <Landmark className="w-8 h-8 opacity-30 mx-auto mb-2" />
              <p className="font-semibold text-foreground text-sm">Nenhum contrato encontrado</p>
              <p className="mt-1">
                {filterTitularidade === 'Focus Tecnologia' 
                  ? 'Nenhum contrato corporativo da Focus Tecnologia Ltda registrado nesta categoria.'
                  : filterTitularidade === 'Cliente'
                  ? 'Nenhum contrato com clientes cadastrado.'
                  : 'Clique em "Novo Contrato" para adicionar seu primeiro contrato.'}
              </p>
            </div>
          ) : (
            filteredData.map((contrato) => {
              let isVencendo = false;
              let dias = 0;
              if (contrato.dataFinal && contrato.status === 'Vigente') {
                 dias = differenceInDays(new Date(contrato.dataFinal), hoje);
                 isVencendo = dias > 0 && dias <= 90;
              }

              const isFocus = isContratoFocus(contrato);
              const clienteRelacionado = clientes.find((c: any) => c.id === contrato.clienteId);
              const fornecedorRelacionado = fornecedores.find((f: any) => f.id === contrato.fornecedorId);

              const nomeContraparte = isFocus 
                ? (contrato.fornecedorNome || contrato.contraparteNome || fornecedorRelacionado?.nomeFantasia || fornecedorRelacionado?.razaoSocial || 'Fornecedor / Parceiro Focus')
                : (contrato.clienteNome || clienteRelacionado?.nomeFantasia || clienteRelacionado?.razaoSocial || 'Cliente Corporativo');

              return (
                <div 
                  key={contrato.id} 
                  className="bg-card border rounded-xl p-5 hover:border-orange-500/50 hover:shadow-md transition-all flex flex-col justify-between group cursor-pointer"
                  onClick={() => handleOpenDetails(contrato)}
                >
                  {/* Topo do Card */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          <span className="font-mono text-[10px] font-bold text-foreground bg-muted px-1.5 py-0.5 rounded">
                            {contrato.codigo}
                          </span>
                          
                          {/* Badge de Titularidade */}
                          {isFocus ? (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 font-semibold gap-1">
                              <Building2 className="w-3 h-3" /> Focus Tecnologia
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-semibold gap-1">
                              <User className="w-3 h-3" /> Cliente
                            </Badge>
                          )}
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-foreground group-hover:text-orange-600 transition-colors line-clamp-1">
                          {contrato.numeroContrato} - {contrato.nome}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {getStatusBadge(contrato.status)}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem onClick={() => handleOpenDetails(contrato)} className="gap-2 cursor-pointer">
                              <Eye className="w-3.5 h-3.5 text-primary" /> Visualizar Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleOpenEdit(contrato, e)} className="gap-2 cursor-pointer text-blue-600">
                              <Edit3 className="w-3.5 h-3.5" /> Editar Contrato
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => handleDownload(contrato, e)} className="gap-2 cursor-pointer text-emerald-600">
                              <Download className="w-3.5 h-3.5" /> Baixar Documento
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => setContratoToDelete(contrato)} className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Contrato
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>

                    {/* Vínculo de Contraparte */}
                    <div className="space-y-1 bg-muted/30 p-2.5 rounded-lg border text-xs">
                      <div className="flex items-center gap-1.5 text-foreground font-semibold truncate">
                        {isFocus ? <Building2 className="w-3.5 h-3.5 text-purple-600 shrink-0" /> : <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                        <span className="truncate">{nomeContraparte}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-0.5">
                        <span className="truncate">{contrato.tipoServico}</span>
                        <span>Resp: <strong>{contrato.responsavelInterno || 'Gestor'}</strong></span>
                      </div>
                    </div>

                    {/* Dados Financeiros */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Valor Global</span>
                        <span className="font-bold text-xs sm:text-sm text-foreground">
                          {formatCurrency(contrato.valorTotal)}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold block">Mensalidade</span>
                        <span className="font-semibold text-xs sm:text-sm text-emerald-600">
                          {contrato.valorMensalidade > 0 ? `${formatCurrency(contrato.valorMensalidade)}/mês` : '-'}
                        </span>
                      </div>
                    </div>

                    {/* Arquivo Anexo se houver */}
                    {contrato.arquivoUrl && (
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1.5 rounded-md text-[11px]">
                        <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 truncate">
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate">{contrato.arquivoNome || 'Documento Anexado'}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-1.5 text-[10px] text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 gap-1 font-semibold"
                          onClick={(e) => handleDownload(contrato, e)}
                        >
                          <Download className="w-3 h-3" /> Baixar
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Card com Ação */}
                  <div className="pt-4 mt-3 border-t flex items-center justify-between gap-2">
                    <div className="text-[11px] text-muted-foreground flex flex-col">
                      <span>Vigência: Até {formatDateSafe(contrato.dataFinal)}</span>
                      {isVencendo && (
                        <span className="text-[10px] text-orange-600 font-semibold flex items-center gap-0.5">
                          <CalendarClock className="w-3 h-3" /> Vence em {dias} dias
                        </span>
                      )}
                    </div>

                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-7 px-2.5 text-xs text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:hover:bg-orange-950/30 gap-1 font-semibold"
                      onClick={() => handleOpenDetails(contrato)}
                    >
                      Ver Detalhes <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MODO TABELA */}
      {viewMode === 'tabela' && (
        <div className="rounded-lg border bg-card overflow-x-auto shadow-xs">
          <Table>
            <TableHeader className="bg-muted/40 text-xs">
              <TableRow>
                <TableHead className="w-[320px]">Contrato & Titularidade</TableHead>
                <TableHead>Vínculo / Contraparte</TableHead>
                <TableHead>Responsável Interno</TableHead>
                <TableHead>Vigência</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground text-xs space-y-2">
                    <Landmark className="w-8 h-8 opacity-30 mx-auto" />
                    <p className="font-semibold text-foreground text-sm">Nenhum contrato encontrado</p>
                    <p>
                      {filterTitularidade === 'Focus Tecnologia' 
                        ? 'Nenhum contrato corporativo da Focus Tecnologia Ltda registrado nesta categoria.'
                        : filterTitularidade === 'Cliente'
                        ? 'Nenhum contrato de cliente registrado.'
                        : 'Clique em "Novo Contrato" para cadastrar seu primeiro contrato.'}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredData.map((contrato) => {
                  let isVencendo = false;
                  let dias = 0;
                  if (contrato.dataFinal && contrato.status === 'Vigente') {
                     dias = differenceInDays(new Date(contrato.dataFinal), hoje);
                     isVencendo = dias > 0 && dias <= 90;
                  }

                  const isFocus = isContratoFocus(contrato);
                  const clienteRelacionado = clientes.find((c: any) => c.id === contrato.clienteId);
                  const fornecedorRelacionado = fornecedores.find((f: any) => f.id === contrato.fornecedorId);

                  const nomeContraparte = isFocus 
                    ? (contrato.fornecedorNome || contrato.contraparteNome || fornecedorRelacionado?.nomeFantasia || fornecedorRelacionado?.razaoSocial || 'Fornecedor / Parceiro Focus')
                    : (contrato.clienteNome || clienteRelacionado?.nomeFantasia || clienteRelacionado?.razaoSocial || 'Cliente Corporativo');

                  return (
                    <TableRow 
                      key={contrato.id} 
                      className="group cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => handleOpenDetails(contrato)}
                    >
                      {/* Contrato & Titularidade */}
                      <TableCell>
                        <div className="flex flex-col space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs sm:text-sm text-foreground hover:text-orange-600 transition-colors">
                              {contrato.numeroContrato} - {contrato.nome}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                            {/* Badge de Titularidade */}
                            {isFocus ? (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 font-semibold gap-1">
                                <Building2 className="w-3 h-3" /> Focus Tecnologia Ltda
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 font-semibold gap-1">
                                <User className="w-3 h-3" /> Cliente
                              </Badge>
                            )}
                            
                            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.2 rounded font-bold">{contrato.codigo}</span>
                            <span>•</span>
                            <span className="truncate">{contrato.tipoServico}</span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Vínculo / Contraparte */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-md shrink-0 ${isFocus ? 'bg-purple-500/10 text-purple-600' : 'bg-blue-500/10 text-blue-600'}`}>
                            {isFocus ? <Building2 className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-foreground truncate">{nomeContraparte}</p>
                            <p className="text-[10px] text-muted-foreground">{isFocus ? 'Contraparte Focus' : 'Cliente'}</p>
                          </div>
                        </div>
                      </TableCell>

                      {/* Responsável Interno */}
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{contrato.responsavelInterno || 'Gestor Interno'}</span>
                      </TableCell>

                      {/* Vigência */}
                      <TableCell>
                        <div className="flex flex-col text-xs">
                          <span className="font-medium text-foreground">
                            Até {formatDateSafe(contrato.dataFinal)}
                          </span>
                          {isVencendo && (
                            <span className="text-[10px] text-orange-600 font-semibold flex items-center gap-1 mt-0.5">
                              <CalendarClock className="w-3 h-3" /> Vence em {dias} dias
                            </span>
                          )}
                          {!isVencendo && dias > 90 && (
                            <span className="text-[10px] text-muted-foreground mt-0.5">
                              {dias} dias restantes
                            </span>
                          )}
                        </div>
                      </TableCell>

                      {/* Valor Total */}
                      <TableCell className="text-right">
                        <span className="font-bold text-xs sm:text-sm text-foreground">
                          {formatCurrency(contrato.valorTotal || 0)}
                        </span>
                        {contrato.valorMensalidade > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            {formatCurrency(contrato.valorMensalidade)}/mês
                          </div>
                        )}
                      </TableCell>

                      {/* Status */}
                      <TableCell className="text-center">
                        {getStatusBadge(contrato.status)}
                      </TableCell>

                      {/* Ações */}
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 text-xs">
                            <DropdownMenuItem onClick={() => handleOpenDetails(contrato)} className="gap-2 cursor-pointer">
                              <Eye className="w-3.5 h-3.5 text-primary" /> Visualizar Detalhes
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={(e) => handleOpenEdit(contrato, e)} className="gap-2 cursor-pointer text-blue-600">
                              <Edit3 className="w-3.5 h-3.5" /> Editar Contrato
                            </DropdownMenuItem>

                            <DropdownMenuItem onClick={(e) => handleDownload(contrato, e)} className="gap-2 cursor-pointer text-emerald-600">
                              <Download className="w-3.5 h-3.5" /> Baixar Documento
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem onClick={() => setContratoToDelete(contrato)} className="gap-2 cursor-pointer text-rose-600 focus:text-rose-600">
                              <Trash2 className="w-3.5 h-3.5" /> Excluir Contrato
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* MODAL DE DETALHES COMPLETOS DO CONTRATO */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b bg-muted/20">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {selectedContrato && isContratoFocus(selectedContrato) ? (
                    <Badge className="bg-purple-600 text-white text-[10px]">Contrato Focus Tecnologia Ltda</Badge>
                  ) : (
                    <Badge className="bg-blue-600 text-white text-[10px]">Contrato com Cliente</Badge>
                  )}
                  {selectedContrato && getStatusBadge(selectedContrato.status)}
                </div>
                <DialogTitle className="text-lg font-bold text-foreground">
                  {selectedContrato?.numeroContrato} - {selectedContrato?.nome}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground font-mono">
                  Identificador: {selectedContrato?.codigo} • Responsável: {selectedContrato?.responsavelInterno}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedContrato && (
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              {/* Partes Envolvidas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Contratada</span>
                  <p className="font-bold text-sm text-foreground">FOCUS TECNOLOGIA E SISTEMAS LTDA</p>
                  <p className="text-muted-foreground">CNPJ: 12.345.678/0001-99</p>
                </div>

                <div className="p-3 rounded-lg border bg-muted/30 space-y-1">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold block">Contratante / Contraparte</span>
                  <p className="font-bold text-sm text-foreground">
                    {isContratoFocus(selectedContrato) 
                      ? (selectedContrato.fornecedorNome || selectedContrato.contraparteNome || 'Contraparte Corporativa')
                      : (selectedContrato.clienteNome || 'Cliente Corporativo')}
                  </p>
                  <p className="text-muted-foreground">Vínculo: {selectedContrato.entidadeVinculo}</p>
                </div>
              </div>

              {/* Valores & Condições */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Valor Global</span>
                  <span className="font-bold text-base text-foreground">{formatCurrency(selectedContrato.valorTotal)}</span>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Implementação</span>
                  <span className="font-bold text-base text-blue-600">
                    {selectedContrato.valorImplantacao ? formatCurrency(selectedContrato.valorImplantacao) : 'Isento'}
                  </span>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Mensalidade</span>
                  <span className="font-bold text-base text-emerald-600">{formatCurrency(selectedContrato.valorMensalidade)}</span>
                </div>
                <div className="p-3 rounded-lg border bg-card">
                  <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Vigência</span>
                  <span className="font-bold text-xs text-foreground">
                    {selectedContrato.dataFinal ? new Date(selectedContrato.dataFinal).toLocaleDateString('pt-BR') : 'Indeterminada'}
                  </span>
                </div>
              </div>

              {/* Informações de Pagamento */}
              {(selectedContrato.formaPagamento || selectedContrato.diaVencimento || selectedContrato.condicaoPagamento) && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-lg border bg-muted/20 text-xs">
                  {selectedContrato.formaPagamento && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Forma de Pagamento</span>
                      <span className="font-medium text-foreground">{selectedContrato.formaPagamento}</span>
                    </div>
                  )}
                  {selectedContrato.diaVencimento && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Dia de Vencimento</span>
                      <span className="font-medium text-foreground">Todo dia {selectedContrato.diaVencimento}</span>
                    </div>
                  )}
                  {selectedContrato.condicaoPagamento && (
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold block">Condição Setup</span>
                      <span className="font-medium text-foreground">{selectedContrato.condicaoPagamento}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Observações Financeiras */}
              {selectedContrato.observacoesFinanceiras && (
                <div className="space-y-1 border rounded-lg p-3 bg-muted/20">
                  <span className="font-bold text-foreground text-[11px] uppercase block">Condições Financeiras & Reajuste</span>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {selectedContrato.observacoesFinanceiras}
                  </p>
                </div>
              )}

              {/* Descrição / Objeto */}
              <div className="space-y-1.5 border rounded-lg p-3.5 bg-muted/20">
                <span className="font-bold text-foreground text-xs uppercase block">Objeto e Escopo do Contrato</span>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {selectedContrato.descricao || 'Nenhuma descrição informada.'}
                </p>
              </div>

              {/* Arquivo Anexo */}
              {selectedContrato.arquivoUrl && (
                <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-50/40 dark:bg-emerald-950/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <div>
                      <p className="font-semibold text-xs text-foreground">{selectedContrato.arquivoNome || 'Documento do Contrato'}</p>
                      <p className="text-[10px] text-muted-foreground">Documento oficial anexado e sincronizado no DMS</p>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    className="h-7 text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                    onClick={() => downloadDocumentFile(selectedContrato.arquivoUrl, selectedContrato.arquivoNome, selectedContrato.nome)}
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Arquivo
                  </Button>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="p-4 border-t bg-muted/10">
            <Button variant="outline" size="sm" onClick={() => setDetailsOpen(false)} className="text-xs">
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL EDITAR CONTRATO */}
      {contratoToEdit && (
        <NovoContratoSheet 
          contratoToEdit={contratoToEdit}
          open={editSheetOpen}
          onOpenChange={(openState) => {
            setEditSheetOpen(openState);
            if (!openState) setContratoToEdit(null);
          }}
        />
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO */}
      <Dialog open={!!contratoToDelete} onOpenChange={(open) => !open && setContratoToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
              <Trash2 className="w-4 h-4" /> Confirmar Exclusão de Contrato
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Tem certeza de que deseja excluir o contrato <strong>{contratoToDelete?.numeroContrato} - {contratoToDelete?.nome}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setContratoToDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleConfirmDelete}>
              Confirmar Exclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

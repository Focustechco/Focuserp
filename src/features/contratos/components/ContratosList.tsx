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
import { ContratoDetalhesSheet } from './ContratoDetalhesSheet';
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

      {/* MODO CARDS COM ESTÉTICA DE DOCUMENTO / ARQUIVO / DOSSIÊ */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredData.length === 0 ? (
            <div className="col-span-full py-14 text-center text-muted-foreground text-xs bg-card rounded-xl border border-dashed p-8 shadow-xs">
              <div className="w-12 h-12 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center mx-auto mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <p className="font-bold text-foreground text-base">Nenhum contrato encontrado</p>
              <p className="mt-1 max-w-md mx-auto text-xs text-muted-foreground">
                {filterTitularidade === 'Focus Tecnologia' 
                  ? 'Nenhum contrato corporativo da Focus Tecnologia Ltda registrado nesta categoria.'
                  : filterTitularidade === 'Cliente'
                  ? 'Nenhum contrato com clientes cadastrado no diretório de CLM.'
                  : 'Clique em "Novo Contrato" para registrar e anexar um novo instrumento jurídico.'}
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
                  className="relative group bg-card dark:bg-[#12141a] border border-border/80 hover:border-orange-500/50 rounded-2xl transition-all duration-300 shadow-sm hover:shadow-2xl overflow-hidden flex flex-col justify-between cursor-pointer"
                  onClick={() => handleOpenDetails(contrato)}
                >
                  {/* Linha Fina Superior de Lacre / Timbre */}
                  <div className="h-1 w-full bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />

                  {/* Cabeçalho Oficial do Documento / Timbre Notarial */}
                  <div className="px-4 py-3 border-b border-border/60 bg-muted/20 dark:bg-muted/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-6 h-6 rounded-md bg-orange-500/10 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="font-mono text-[11px] font-bold text-foreground truncate">
                          {contrato.codigo || `CTR-${contrato.id.slice(0, 4).toUpperCase()}`}
                        </span>
                        {isFocus ? (
                          <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20 font-semibold gap-1 shrink-0">
                            <Building2 className="w-2.5 h-2.5" /> Focus Tecnologia
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[9.5px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20 font-semibold gap-1 shrink-0">
                            <User className="w-2.5 h-2.5" /> Cliente
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                      {getStatusBadge(contrato.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 text-xs">
                          <DropdownMenuItem onClick={() => handleOpenDetails(contrato)} className="gap-2 cursor-pointer">
                            <Eye className="w-3.5 h-3.5 text-primary" /> Visualizar Dossiê
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

                  {/* Corpo do Documento Jurídico */}
                  <div className="p-4 space-y-3.5 flex-1">
                    {/* Título do Instrumento e Objeto */}
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                        <span>Instrumento Jurídico</span>
                        <span>•</span>
                        <span className="text-orange-600 dark:text-orange-400 font-mono">{contrato.numeroContrato || 'REGISTRO OFICIAL'}</span>
                      </div>
                      <h3 className="font-bold text-base text-foreground group-hover:text-orange-600 transition-colors line-clamp-2 leading-snug">
                        {contrato.nome || contrato.objetoContrato || 'Contrato de Prestação de Serviços'}
                      </h3>
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {contrato.tipoServico || 'Tecnologia & Desenvolvimento'}
                      </p>
                    </div>

                    {/* Quadro das Partes (Preâmbulo de Qualificação) */}
                    <div className="bg-muted/40 dark:bg-muted/20 p-3 rounded-xl border border-border/60 text-xs space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>Parte Contratante / Titular</span>
                        <span>Fiscal / Gestor</span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 text-foreground font-semibold truncate min-w-0">
                          <div className="w-5 h-5 rounded-md bg-background flex items-center justify-center shrink-0 border shadow-2xs">
                            {isFocus ? (
                              <Building2 className="w-3 h-3 text-purple-600" />
                            ) : (
                              <User className="w-3 h-3 text-blue-600" />
                            )}
                          </div>
                          <span className="truncate text-xs font-bold">{nomeContraparte}</span>
                        </div>
                        <div className="text-[11px] text-muted-foreground font-medium shrink-0 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shadow-2xs"></span>
                          <span className="truncate max-w-[110px] font-semibold text-foreground">{contrato.responsavelInterno || 'Gestor Focus'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Demonstrativo Financeiro Formal */}
                    <div className="p-3 rounded-xl border border-border/70 bg-gradient-to-br from-background via-muted/20 to-muted/40 grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                          Valor Global
                        </span>
                        <span className="font-extrabold text-base text-foreground tracking-tight block mt-0.5">
                          {formatCurrency(contrato.valorTotal)}
                        </span>
                        {Number(contrato.valorImplantacao || 0) > 0 && (
                          <span className="text-[10.5px] text-muted-foreground block mt-0.5">
                            Taxa de Setup: {formatCurrency(contrato.valorImplantacao)}
                          </span>
                        )}
                      </div>

                      <div className="text-right border-l pl-3 border-border/40">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">
                          Mensalidade (MRR)
                        </span>
                        <span className="font-extrabold text-base text-emerald-600 dark:text-emerald-400 tracking-tight block mt-0.5">
                          {Number(contrato.valorMensalidade || 0) > 0 ? `${formatCurrency(contrato.valorMensalidade)}` : 'Não aplicável'}
                        </span>
                        {contrato.formaPagamento && (
                          <span className="text-[10.5px] text-muted-foreground truncate block mt-0.5">
                            {contrato.formaPagamento} {contrato.diaVencimento ? `• Dia ${contrato.diaVencimento}` : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Certificação Digital / Anexo */}
                    {contrato.arquivoUrl ? (
                      <div className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl text-xs">
                        <div className="flex items-center gap-2 text-emerald-900 dark:text-emerald-300 truncate min-w-0">
                          <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span className="truncate font-semibold">{contrato.arquivoNome || 'Instrumento_Contratual_Oficial.pdf'}</span>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-6 px-2 text-[10.5px] border-emerald-500/30 text-emerald-700 hover:text-emerald-800 dark:text-emerald-300 gap-1 font-bold hover:bg-emerald-500/20 rounded-md"
                          onClick={(e) => handleDownload(contrato, e)}
                          title="Baixar arquivo original"
                        >
                          <Download className="w-3 h-3" /> Baixar
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg border border-border/40">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span className="font-medium">Minuta digital registrada no CLM Focus</span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Instrumento: Vigência e Ação */}
                  <div className="px-4 py-3 border-t border-border/60 bg-muted/20 dark:bg-muted/10 flex items-center justify-between gap-2">
                    <div className="text-xs text-muted-foreground flex flex-col min-w-0">
                      <span className="font-semibold text-foreground flex items-center gap-1.5 truncate">
                        <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        {contrato.dataInicial ? formatDateSafe(contrato.dataInicial) : 'Início'} — {contrato.dataFinal ? formatDateSafe(contrato.dataFinal) : 'Indeterminado'}
                      </span>
                      {isVencendo && (
                        <span className="text-[10px] text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1 mt-0.5">
                          <CalendarClock className="w-3 h-3" /> Vence em {dias} dias
                        </span>
                      )}
                    </div>

                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="h-8 px-3 text-xs text-orange-600 dark:text-orange-400 hover:text-orange-700 hover:bg-orange-500/10 gap-1 font-bold rounded-lg shrink-0"
                      onClick={() => handleOpenDetails(contrato)}
                    >
                      Abrir Dossiê <ArrowRight className="w-3.5 h-3.5" />
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

      {/* GAVETA LATERAL DE DETALHES COMPLETOS E VISUALIZADOR DIRETO DO CONTRATO */}
      <ContratoDetalhesSheet
        contrato={selectedContrato}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        onEdit={(c) => {
          setContratoToEdit(c);
          setEditSheetOpen(true);
        }}
        onDelete={(c) => {
          setContratoToDelete(c);
        }}
      />

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

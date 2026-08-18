import React, { useState } from 'react';
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
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  Edit3
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { differenceInDays } from 'date-fns';
import { NovoContratoSheet, downloadDocumentFile } from './NovoContratoSheet';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function ContratosList({ filterEntidade }: { filterEntidade?: string[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: contratos, deleteItem } = useLocalStorageState<Contrato>('focus_contratos', []);
  const { data: clientes } = useLocalStorageState<any>('focus_clientes', []);

  // Details & Edit Modal States
  const [selectedContrato, setSelectedContrato] = useState<Contrato | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const [contratoToEdit, setContratoToEdit] = useState<Contrato | null>(null);
  const [editSheetOpen, setEditSheetOpen] = useState(false);

  // Deduplica e higieniza a lista de contratos automaticamente
  const uniqueContratos = React.useMemo(() => {
    const seenIds = new Set<string>();
    const seenKeys = new Set<string>();
    
    return (contratos || []).filter((c) => {
      if (!c || (!c.id && !c.numeroContrato && !c.nome)) return false;
      if (seenIds.has(c.id)) return false;
      
      const key = `${c.numeroContrato || ''}_${c.clienteNome || ''}_${c.nome || ''}`;
      if (seenKeys.has(key)) return false;
      
      seenIds.add(c.id);
      seenKeys.add(key);
      return true;
    });
  }, [contratos]);

  const handlePurgeDuplicates = () => {
    const seenKeys = new Set<string>();
    const duplicates: string[] = [];

    (contratos || []).forEach((c) => {
      if (!c) return;
      const key = `${c.numeroContrato || ''}_${c.clienteNome || ''}_${c.nome || ''}`;
      if (seenKeys.has(key) || (!c.numeroContrato && !c.nome && !c.codigo)) {
        duplicates.push(c.id);
      } else {
        seenKeys.add(key);
      }
    });

    if (duplicates.length === 0) {
      toast.info("Nenhum contrato duplicado ou corrompido encontrado!");
      return;
    }

    if (window.confirm(`Foram encontrados ${duplicates.length} contrato(s) duplicados ou inválidos. Deseja limpá-los agora?`)) {
      duplicates.forEach((id) => deleteItem(id));
      toast.success(`${duplicates.length} contrato(s) duplicados removidos com sucesso!`);
    }
  };

  const filteredData = uniqueContratos.filter(c => {
    const matchSearch = (c.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.numeroContrato || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.codigo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
           (c.responsavelInterno || '').toLowerCase().includes(searchTerm.toLowerCase());
           
    const matchEntidade = filterEntidade ? filterEntidade.includes(c.entidadeVinculo) : true;
    
    return matchSearch && matchEntidade;
  });

  const handleOpenDetails = (contrato: Contrato) => {
    setSelectedContrato(contrato);
    setDetailsOpen(true);
  };

  const handleOpenEdit = (contrato: Contrato, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setContratoToEdit(contrato);
    setEditSheetOpen(true);
  };

  const handleDownload = (contrato: Contrato, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    downloadDocumentFile(contrato.arquivoUrl, contrato.arquivoNome, contrato.nome);
    toast.success(`Download de "${contrato.arquivoNome || contrato.nome}" concluído!`);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Vigente':
        return <Badge className="bg-emerald-500 hover:bg-emerald-600">Vigente</Badge>;
      case 'Encerrado':
        return <Badge variant="secondary">Encerrado</Badge>;
      case 'Cancelado':
        return <Badge variant="destructive">Cancelado</Badge>;
      case 'Aguardando Assinatura':
        return <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50 dark:bg-orange-950/30">Aguardando Assinatura</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const hoje = new Date();

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar contrato, número ou código..." 
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {contratos && contratos.length > uniqueContratos.length && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950"
              onClick={handlePurgeDuplicates}
              title="Limpar contratos duplicados"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5 text-rose-500" />
              Limpar Duplicados ({contratos.length - uniqueContratos.length})
            </Button>
          )}
          <Button variant="outline" onClick={() => toast.info("Exportação da lista de contratos iniciada.")}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <NovoContratoSheet>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Contrato
            </Button>
          </NovoContratoSheet>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border bg-card overflow-x-auto shadow-xs">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Contrato & Detalhes</TableHead>
              <TableHead>Vínculo / Responsável</TableHead>
              <TableHead>Vigência</TableHead>
              <TableHead>Valor Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                  Nenhum contrato encontrado. Clique em "Novo Contrato" para adicionar.
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

                const clienteRelacionado = clientes.find((c: any) => c.id === contrato.clienteId);
                const nomeEntidade = clienteRelacionado ? (clienteRelacionado.nomeFantasia || clienteRelacionado.razaoSocial) : contrato.entidadeVinculo;

                return (
                  <TableRow 
                    key={contrato.id} 
                    className="group cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => handleOpenDetails(contrato)}
                  >
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{contrato.numeroContrato} - {contrato.nome}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded font-bold">{contrato.codigo}</span>
                          <span>•</span>
                          <span>{contrato.tipoServico}</span>
                          <span>•</span>
                          <span className={contrato.categoria === 'Receita' ? 'text-emerald-600 font-semibold' : 'text-fuchsia-600 font-semibold'}>
                            {contrato.categoria}
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                       <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-primary" />
                          <span className="text-sm font-medium">{nomeEntidade}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">Resp: {contrato.responsavelInterno}</span>
                       </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">Até {contrato.dataFinal ? new Date(contrato.dataFinal).toLocaleDateString('pt-BR') : 'Indeterminado'}</span>
                        {isVencendo && (
                          <span className="text-xs text-orange-600 font-medium flex items-center gap-1 mt-0.5">
                            <CalendarClock className="w-3 h-3" /> Vence em {dias} dias
                          </span>
                        )}
                        {!isVencendo && dias > 90 && (
                          <span className="text-xs text-muted-foreground mt-0.5">
                            {dias} dias restantes
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <span className="font-medium">{formatCurrency(contrato.valorTotal || 0)}</span>
                    </TableCell>

                    <TableCell>
                      {getStatusBadge(contrato.status)}
                    </TableCell>

                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleOpenDetails(contrato)}>
                            <Eye className="w-4 h-4 mr-2" /> Expandir e Visualizar Contrato
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={(e) => handleOpenEdit(contrato, e)}>
                            <Edit3 className="w-4 h-4 mr-2 text-blue-600" /> Editar Contrato
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={(e) => handleDownload(contrato, e)}>
                            <Download className="w-4 h-4 mr-2 text-emerald-600" /> Baixar Documento (Real)
                          </DropdownMenuItem>

                          <DropdownMenuItem className="text-red-600" onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
                              deleteItem(contrato.id);
                              toast.success("Contrato removido com sucesso!");
                            }
                          }}>
                            <Trash2 className="w-4 h-4 mr-2" /> Excluir Contrato
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Sheet de Edição de Contrato Existente */}
      <NovoContratoSheet
        contratoToEdit={contratoToEdit}
        open={editSheetOpen}
        onOpenChange={setEditSheetOpen}
      />

      {/* Modal de Detalhamento e Visualização do Contrato */}
      {selectedContrato && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="w-full sm:max-w-[850px] h-[100dvh] sm:h-[90vh] max-h-[100dvh] sm:max-h-[90vh] p-0 overflow-hidden bg-background flex flex-col border shadow-2xl">
            
            {/* Header */}
            <div className="p-3.5 sm:p-6 border-b bg-muted/20 shrink-0">
              <DialogHeader>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 border shadow-xs text-primary shrink-0">
                      <FileText className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div>
                      <DialogTitle className="text-base sm:text-xl font-bold flex items-center gap-2">
                        {selectedContrato.numeroContrato} - {selectedContrato.nome}
                      </DialogTitle>
                      <DialogDescription className="text-xs flex items-center gap-2 mt-0.5">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded font-bold text-[10px] sm:text-xs">{selectedContrato.codigo}</span>
                        <span>•</span>
                        <span>{selectedContrato.tipoServico}</span>
                      </DialogDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <Button size="sm" variant="outline" className="gap-1 text-xs h-8" onClick={() => {
                      setDetailsOpen(false);
                      handleOpenEdit(selectedContrato);
                    }}>
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" /> Editar
                    </Button>
                    {getStatusBadge(selectedContrato.status)}
                  </div>
                </div>
              </DialogHeader>
            </div>

            {/* Modal Body Tabs */}
            <Tabs defaultValue="detalhes" className="flex-1 flex flex-col overflow-hidden min-h-0">
              <div className="px-4 sm:px-6 border-b bg-card shrink-0">
                <TabsList className="w-full justify-start h-auto p-0 bg-transparent flex-nowrap min-w-max pb-1">
                  <TabsTrigger value="detalhes" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-4 py-2.5 text-xs">Ficha do Contrato</TabsTrigger>
                  <TabsTrigger value="visualizador" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none px-3 sm:px-4 py-2.5 text-xs">Visualizar Contrato Anexo</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6 bg-muted/10 min-h-0">
                
                <TabsContent value="detalhes" className="space-y-4 sm:space-y-6 mt-0 outline-none">
                  
                  {/* Grid de Informações Chave */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4">
                    <div className="p-3 sm:p-3.5 rounded-xl border bg-card space-y-1">
                      <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-primary" /> Cliente / Entidade
                      </span>
                      <div className="font-semibold text-xs sm:text-sm truncate">
                        {clientes.find((c: any) => c.id === selectedContrato.clienteId)?.nomeFantasia || selectedContrato.entidadeVinculo}
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border bg-card space-y-1">
                      <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-primary" /> Responsável Interno
                      </span>
                      <div className="font-semibold text-xs sm:text-sm truncate">{selectedContrato.responsavelInterno}</div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border bg-card space-y-1">
                      <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-emerald-600" /> Valor Total Global
                      </span>
                      <div className="font-semibold text-xs sm:text-sm text-emerald-600">{formatCurrency(selectedContrato.valorTotal || 0)}</div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border bg-card space-y-1">
                      <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-primary" /> Início da Vigência
                      </span>
                      <div className="font-semibold text-xs sm:text-sm">
                        {selectedContrato.dataInicial ? new Date(selectedContrato.dataInicial).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border bg-card space-y-1">
                      <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                        <CalendarClock className="w-3.5 h-3.5 text-primary" /> Vencimento
                      </span>
                      <div className="font-semibold text-xs sm:text-sm">
                        {selectedContrato.dataFinal ? new Date(selectedContrato.dataFinal).toLocaleDateString('pt-BR') : 'Indeterminado'}
                      </div>
                    </div>

                    <div className="p-3 sm:p-3.5 rounded-xl border bg-card space-y-1">
                      <span className="text-[11px] sm:text-xs text-muted-foreground flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-primary" /> Categoria
                      </span>
                      <div className="font-semibold text-xs sm:text-sm">{selectedContrato.categoria}</div>
                    </div>
                  </div>

                  {/* Objeto do Contrato */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição / Objeto do Contrato</h4>
                    <div className="p-3 sm:p-4 rounded-xl border bg-card text-xs leading-relaxed font-normal whitespace-pre-wrap">
                      {selectedContrato.descricao || 'Sem descrição cadastrada.'}
                    </div>
                  </div>

                  {/* Documento Anexo Status */}
                  <div className="space-y-2">
                    <h4 className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground">Documento do Contrato</h4>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 sm:p-3.5 rounded-xl border bg-card">
                      <div className="flex items-center gap-3">
                        <FileText className="w-5 h-5 text-primary shrink-0" />
                        <div>
                          <div className="font-semibold text-xs truncate max-w-xs">{selectedContrato.arquivoNome || `${selectedContrato.numeroContrato}.pdf`}</div>
                          <div className="text-[10px] text-muted-foreground">Documento autenticado no cofre digital de contratos</div>
                        </div>
                      </div>
                      <Button size="sm" variant="default" className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto" onClick={() => handleDownload(selectedContrato)}>
                        <Download className="w-3.5 h-3.5" /> Baixar Documento
                      </Button>
                    </div>
                  </div>

                </TabsContent>

                {/* Visualizador Integrado Limpo e Protagonista do PDF */}
                <TabsContent value="visualizador" className="mt-0 outline-none space-y-4">
                  {selectedContrato.arquivoUrl ? (
                    <div className="border rounded-xl h-[60dvh] sm:h-[480px] overflow-hidden bg-slate-950 flex flex-col items-center justify-center p-1 sm:p-2">
                      <iframe 
                        src={`${selectedContrato.arquivoUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`} 
                        className="w-full h-full rounded-lg border-none"
                        title="Visualização do Contrato"
                      />
                    </div>
                  ) : (
                    <div className="border rounded-xl h-[280px] sm:h-[320px] flex flex-col items-center justify-center bg-card text-center p-4 sm:p-6 space-y-3 shadow-xs">
                      <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-primary opacity-60" />
                      <div>
                        <div className="font-bold text-sm text-foreground">{selectedContrato.nome}</div>
                        <p className="text-xs text-muted-foreground mt-1">O documento do contrato está validado e armazenado com segurança no sistema.</p>
                      </div>
                      <Button className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 font-semibold text-xs" onClick={() => handleDownload(selectedContrato)}>
                        <Download className="w-4 h-4" /> Baixar Documento
                      </Button>
                    </div>
                  )}
                </TabsContent>

              </div>

              {/* Footer */}
              <div className="p-3 sm:p-4 border-t bg-muted/10 flex justify-between items-center shrink-0">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50" onClick={() => handleDownload(selectedContrato)}>
                  <Download className="w-3.5 h-3.5" /> Baixar PDF
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDetailsOpen(false)}>Fechar</Button>
              </div>

            </Tabs>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

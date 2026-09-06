import React, { useState, useMemo } from 'react';
import { useFiscalStore } from '../hooks/useFiscalStore';
import { DocumentoFiscal, TipoDocumentoFiscal, StatusDocumentoFiscal } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, FileText, Upload, Download, Eye,
  CheckCircle2, Clock, ChevronRight, Receipt, ExternalLink,
  DollarSign, ShieldCheck, Trash2, Edit2
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DocumentoFiscalSheet } from './DocumentoFiscalSheet';
import { ImportacaoDocumentosModal } from './ImportacaoDocumentosModal';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

const formatCurrency = (value?: number | null) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
};

export function MobileFiscalView() {
  const { documentos, deleteDocumento } = useFiscalStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'emitidos' | 'recebidos' | 'nfse' | 'nfe'>('todos');
  const [tipoFilter, setTipoFilter] = useState<string>('todos');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [importOpen, setImportOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentoFiscal | null>(null);

  const stats = useMemo(() => {
    let totalValor = 0;
    let totalImpostos = 0;
    let countEmitidos = 0;
    let countRecebidos = 0;

    documentos.forEach((doc) => {
      totalValor += Number(doc.valorTotal || 0);
      totalImpostos += Number(doc.impostos?.valorTotalImpostos || 0);

      if (doc.status === 'Emitido') countEmitidos++;
      else if (doc.status === 'Recebido') countRecebidos++;
    });

    return { totalValor, totalImpostos, countEmitidos, countRecebidos, totalDocs: documentos.length };
  }, [documentos]);

  const filteredDocs = useMemo(() => {
    return documentos.filter((doc) => {
      const term = searchTerm.toLowerCase();
      const matchSearch =
        doc.numero.toLowerCase().includes(term) ||
        doc.tipo.toLowerCase().includes(term) ||
        doc.entidade.nome.toLowerCase().includes(term) ||
        doc.entidade.cnpjCpf.toLowerCase().includes(term) ||
        (doc.vinculos?.projetoNome && doc.vinculos.projetoNome.toLowerCase().includes(term));

      if (!matchSearch) return false;

      // Filtro de Aba
      if (activeTab === 'emitidos' && doc.status !== 'Emitido') return false;
      if (activeTab === 'recebidos' && doc.status !== 'Recebido') return false;
      if (activeTab === 'nfse' && doc.tipo !== 'NFS-e') return false;
      if (activeTab === 'nfe' && doc.tipo !== 'NF-e') return false;

      // Filtros detalhados
      if (tipoFilter !== 'todos' && doc.tipo !== tipoFilter) return false;
      if (statusFilter !== 'todos' && doc.status !== statusFilter) return false;

      return true;
    });
  }, [documentos, searchTerm, activeTab, tipoFilter, statusFilter]);

  const handleEditClick = (doc: DocumentoFiscal, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingDoc(doc);
    setSheetOpen(true);
  };

  const handleNewClick = () => {
    setEditingDoc(null);
    setSheetOpen(true);
  };

  const handleDeleteClick = (doc: DocumentoFiscal, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Deseja remover o documento fiscal nº ${doc.numero}?`)) {
      deleteDocumento(doc.id);
      toast.success(`Documento fiscal nº ${doc.numero} removido.`);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Emitido':
        return <Badge className="bg-emerald-600 text-white text-[10px] font-bold">Emitido</Badge>;
      case 'Recebido':
        return <Badge className="bg-blue-600 text-white text-[10px] font-bold">Recebido</Badge>;
      case 'Conferido':
        return <Badge className="bg-purple-600 text-white text-[10px] font-bold">Conferido</Badge>;
      case 'Cancelado':
        return <Badge variant="destructive" className="text-[10px] font-bold">Cancelado</Badge>;
      default:
        return <Badge variant="secondary" className="text-[10px] font-bold">{status}</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-zinc-950 pb-24">
      {/* 1. TOP CARDS & RESUMO KPI */}
      <div className="bg-gradient-to-b from-background to-muted/20 border-b p-3.5 space-y-3">
        {/* Card Principal: Total Faturado */}
        <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between">
          <div className="space-y-1 min-w-0">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5 text-primary" />
              Volume Fiscal Emitido
            </span>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {formatCurrency(stats.totalValor)}
            </div>
            <p className="text-[10px] text-muted-foreground">
              {stats.totalDocs} documentos fiscais registrados
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5 shrink-0">
            <Badge variant="outline" className="text-[10px] font-bold px-2 py-0.5 bg-primary/10 text-primary border-primary/30">
              {stats.countEmitidos} Notas Emitidas
            </Badge>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setImportOpen(true)}
              className="h-7 text-[10px] gap-1 px-2 text-muted-foreground hover:text-foreground"
            >
              <Upload className="w-3 h-3" /> Importar XML
            </Button>
          </div>
        </div>

        {/* Mini Cards: Impostos & Notas Recebidas */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-3 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-purple-500" />
                Impostos
              </span>
              <span className="w-2 h-2 rounded-full bg-purple-500" />
            </div>
            <div className="text-base font-black text-purple-600 dark:text-purple-400 truncate">
              {formatCurrency(stats.totalImpostos)}
            </div>
          </div>

          <div 
            onClick={() => setActiveTab(activeTab === 'recebidos' ? 'todos' : 'recebidos')}
            className={`bg-white dark:bg-card border rounded-2xl p-3 shadow-xs space-y-1 cursor-pointer transition-all active:scale-[0.99] ${
              activeTab === 'recebidos' ? 'border-blue-500 ring-1 ring-blue-500/20' : 'border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                <FileText className="w-3 h-3 text-blue-500" />
                Recebidas
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <div className="text-base font-black text-blue-600 dark:text-blue-400">
              {stats.countRecebidos} notas
            </div>
          </div>
        </div>
      </div>

      {/* 2. STICKY SEARCH & FILTER BAR */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nº, cliente, CNPJ ou tipo..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
            />
          </div>

          {/* Botão de Filtros */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground relative"
                aria-label="Filtrar"
              >
                <Filter className="w-4 h-4" />
                {(tipoFilter !== 'todos' || statusFilter !== 'todos') && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Filtros Fiscais</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Filtre por tipo de documento e situação fiscal.
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4 text-xs">
                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Tipo de Documento</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'NFS-e', label: 'NFS-e' },
                      { id: 'NF-e', label: 'NF-e' },
                      { id: 'NFC-e', label: 'NFC-e' },
                      { id: 'CT-e', label: 'CT-e' },
                    ].map((tp) => (
                      <Button
                        key={tp.id}
                        type="button"
                        variant={tipoFilter === tp.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setTipoFilter(tp.id)}
                        className={`text-xs h-8 ${tipoFilter === tp.id ? 'bg-primary text-white' : ''}`}
                      >
                        {tp.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-muted-foreground block mb-2">Status Fiscal</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { id: 'todos', label: 'Todos' },
                      { id: 'Emitido', label: 'Emitido' },
                      { id: 'Recebido', label: 'Recebido' },
                      { id: 'Conferido', label: 'Conferido' },
                    ].map((st) => (
                      <Button
                        key={st.id}
                        type="button"
                        variant={statusFilter === st.id ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setStatusFilter(st.id)}
                        className={`text-xs h-8 ${statusFilter === st.id ? 'bg-primary text-white' : ''}`}
                      >
                        {st.label}
                      </Button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={() => setFilterSheetOpen(false)}
                  className="w-full bg-primary hover:bg-primary/90 text-white mt-4 h-10 rounded-xl font-bold"
                >
                  Aplicar Filtros ({filteredDocs.length} resultados)
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Nova Nota */}
          <Button
            size="sm"
            onClick={handleNewClick}
            className="h-9 px-3 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs shadow-xs gap-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Emitir
          </Button>
        </div>

        {/* Category Pills (Horizontal Scroll) */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {[
            { id: 'todos', label: `Todos (${documentos.length})` },
            { id: 'emitidos', label: `Emitidos (${stats.countEmitidos})` },
            { id: 'recebidos', label: `Recebidos (${stats.countRecebidos})` },
            { id: 'nfse', label: 'NFS-e' },
            { id: 'nfe', label: 'NF-e' },
          ].map((pill) => {
            const isActive = activeTab === pill.id;
            return (
              <button
                key={pill.id}
                onClick={() => setActiveTab(pill.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. LISTA DE DOCUMENTOS FISCAIS (CARDS TOUCH) */}
      <div className="p-3.5 space-y-2.5">
        {filteredDocs.length === 0 ? (
          <div className="bg-card rounded-2xl border p-8 text-center space-y-3 mt-4">
            <Receipt className="w-10 h-10 text-muted-foreground mx-auto opacity-40" />
            <div className="font-semibold text-sm text-foreground">Nenhum documento fiscal encontrado</div>
            <p className="text-xs text-muted-foreground">
              Não encontramos notas fiscais com os filtros aplicados.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setActiveTab('todos');
                setTipoFilter('todos');
                setStatusFilter('todos');
              }}
              className="text-xs"
            >
              Limpar Filtros
            </Button>
          </div>
        ) : (
          filteredDocs.map((doc) => {
            return (
              <div
                key={doc.id}
                onClick={() => handleEditClick(doc)}
                className="bg-card rounded-2xl border border-border/80 p-3.5 shadow-xs transition-all active:scale-[0.99] cursor-pointer flex flex-col gap-2 relative overflow-hidden"
              >
                {/* Linha superior */}
                <div className="h-1 w-full bg-primary absolute top-0 left-0" />

                <div className="flex items-start justify-between gap-2 pt-0.5">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap mb-1">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-muted text-foreground border border-border/80">
                        {doc.tipo} {doc.numero}
                      </span>
                      {getStatusBadge(doc.status)}
                    </div>
                    <h4 className="font-bold text-sm text-foreground truncate">
                      {doc.entidade.nome}
                    </h4>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.entidade.cnpjCpf} {doc.vinculos?.projetoNome ? `• ${doc.vinculos.projetoNome}` : ''}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono text-sm font-extrabold text-foreground">
                      {formatCurrency(doc.valorTotal)}
                    </div>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {doc.dataEmissao ? formatDateBrasilia(doc.dataEmissao) : 'Data N/A'}
                    </span>
                  </div>
                </div>

                {/* Ações e Detalhes */}
                <div className="flex items-center justify-between pt-1 border-t border-dashed text-[10px] text-muted-foreground">
                  <span>Série: {doc.serie || '1'} • {doc.naturezaOperacao || 'Prestação de Serviços'}</span>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleEditClick(doc, e)}
                      className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => handleDeleteClick(doc, e)}
                      className="h-6 w-6 p-0 text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modais Integrados */}
      <ImportacaoDocumentosModal open={importOpen} onOpenChange={setImportOpen} />
      <DocumentoFiscalSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        documentoParaEditar={editingDoc}
      />
    </div>
  );
}

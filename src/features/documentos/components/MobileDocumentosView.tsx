import React, { useState, useMemo } from 'react';
import { useDocumentosStore } from '../hooks/useDocumentosStore';
import { DocumentoDMS, FormatoArquivo, ModuloOrigemDMS, PastaDMS } from '../types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Search, Filter, Plus, FileText, Image as ImageIcon, Video, Music,
  FileSpreadsheet, FileCode, Folder, HardDrive, Download, Eye,
  Trash2, ShieldCheck, Tag, Building2, Calendar, User, MoreVertical,
  UploadCloud, ExternalLink, Layers, CheckCircle2, ChevronRight
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { DmsUploadSheet } from './DmsUploadSheet';
import { DmsPreviewModal } from './DmsPreviewModal';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

export function MobileDocumentosView() {
  const { pastas, documentos, moveToTrash, downloadDocument } = useDocumentosStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'todos' | 'pdf' | 'planilhas' | 'imagens' | 'financeiro' | 'contratos' | 'clientes'>('todos');
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [moduloFilter, setModuloFilter] = useState<string>('todos');
  const [extensaoFilter, setExtensaoFilter] = useState<string>('todos');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modais
  const [previewDoc, setPreviewDoc] = useState<DocumentoDMS | null>(null);

  // Estatísticas de topo
  const stats = useMemo(() => {
    const totalDocs = documentos.length;
    const totalBytes = documentos.reduce((acc, d) => acc + (d.tamanhoBytes || 0), 0);
    const totalMb = (totalBytes / (1024 * 1024)).toFixed(1);
    const totalPastas = pastas.length;

    const countPdf = documentos.filter(d => d.extensao === 'pdf').length;
    const countPlanilhas = documentos.filter(d => ['xls', 'xlsx', 'csv'].includes(d.extensao)).length;
    const countImagens = documentos.filter(d => ['jpg', 'png', 'svg'].includes(d.extensao)).length;

    return { totalDocs, totalMb, totalPastas, countPdf, countPlanilhas, countImagens };
  }, [documentos, pastas]);

  // Lista de pastas raízes para carrossel
  const pastasPrincipais = useMemo(() => {
    return pastas.filter(p => !p.parentId).slice(0, 10);
  }, [pastas]);

  // Filtragem dos documentos
  const filteredDocs = useMemo(() => {
    return documentos.filter((doc) => {
      const search = searchTerm.toLowerCase();
      const matchSearch =
        (doc.nome || '').toLowerCase().includes(search) ||
        (doc.codigo || '').toLowerCase().includes(search) ||
        (doc.moduloOrigem || '').toLowerCase().includes(search) ||
        (doc.clienteNome || '').toLowerCase().includes(search) ||
        (doc.tags || []).some(t => t.toLowerCase().includes(search));

      if (!matchSearch) return false;

      // Filtro por pasta selecionada
      if (selectedFolderId && doc.pastaId !== selectedFolderId) return false;

      // Abas rápidas
      if (activeTab === 'pdf' && doc.extensao !== 'pdf') return false;
      if (activeTab === 'planilhas' && !['xls', 'xlsx', 'csv'].includes(doc.extensao)) return false;
      if (activeTab === 'imagens' && !['jpg', 'png', 'svg'].includes(doc.extensao)) return false;
      if (activeTab === 'financeiro' && doc.moduloOrigem !== 'Financeiro') return false;
      if (activeTab === 'contratos' && doc.moduloOrigem !== 'Contratos') return false;
      if (activeTab === 'clientes' && doc.moduloOrigem !== 'Clientes') return false;

      // Filtros do Sheet
      if (moduloFilter !== 'todos' && doc.moduloOrigem !== moduloFilter) return false;
      if (extensaoFilter !== 'todos' && doc.extensao !== extensaoFilter) return false;

      return true;
    });
  }, [documentos, searchTerm, selectedFolderId, activeTab, moduloFilter, extensaoFilter]);

  const getFileIcon = (ext: FormatoArquivo) => {
    switch (ext) {
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'xls':
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'jpg':
      case 'png':
      case 'svg':
        return <ImageIcon className="w-5 h-5 text-purple-500" />;
      case 'mp4':
      case 'mov':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'mp3':
        return <Music className="w-5 h-5 text-amber-500" />;
      default:
        return <FileCode className="w-5 h-5 text-primary" />;
    }
  };

  const getFileBadgeColor = (ext: FormatoArquivo) => {
    switch (ext) {
      case 'pdf':
        return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200';
      case 'xls':
      case 'xlsx':
      case 'csv':
        return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200';
      case 'jpg':
      case 'png':
      case 'svg':
        return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200';
      default:
        return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header Sticky */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-4 py-3 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground">Documentos (DMS)</h1>
            <p className="text-[11px] text-muted-foreground">Repositório corporativo e arquivos</p>
          </div>
          <DmsUploadSheet>
            <Button
              size="sm"
              className="h-9 px-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-xl gap-1.5 shadow-xs"
            >
              <UploadCloud className="w-4 h-4" /> Upload
            </Button>
          </DmsUploadSheet>
        </div>

        {/* Barra de Busca + Filtro Sheet */}
        <div className="flex items-center gap-2 pt-1">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por código, nome ou tag..."
              className="pl-9 h-9 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus:bg-background"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
              >
                ✕
              </button>
            )}
          </div>

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className={`h-9 w-9 rounded-xl shrink-0 ${
                  moduloFilter !== 'todos' || extensaoFilter !== 'todos'
                    ? 'border-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-950/40'
                    : 'border-muted-foreground/20'
                }`}
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto px-5 py-6">
              <SheetHeader className="text-left pb-4 border-b">
                <SheetTitle className="text-base font-bold">Filtrar Documentos</SheetTitle>
                <SheetDescription className="text-xs">
                  Refine por módulo de origem e formato de arquivo
                </SheetDescription>
              </SheetHeader>

              <div className="space-y-4 py-4 text-xs">
                <div>
                  <label className="font-semibold text-foreground block mb-2">Módulo de Origem</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['todos', 'Clientes', 'Projetos', 'RH', 'Financeiro', 'Fiscal', 'Contratos', 'Fornecedores'].map((mod) => (
                      <Button
                        key={mod}
                        type="button"
                        variant={moduloFilter === mod ? 'default' : 'outline'}
                        size="sm"
                        className="justify-start text-xs h-9 rounded-lg"
                        onClick={() => setModuloFilter(mod)}
                      >
                        {mod === 'todos' ? 'Todos os Módulos' : mod}
                      </Button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-2">Formato do Arquivo</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['todos', 'pdf', 'xlsx', 'docx', 'png', 'zip'].map((ext) => (
                      <Button
                        key={ext}
                        type="button"
                        variant={extensaoFilter === ext ? 'default' : 'outline'}
                        size="sm"
                        className="text-xs h-9 rounded-lg uppercase"
                        onClick={() => setExtensaoFilter(ext)}
                      >
                        {ext === 'todos' ? 'Todos' : ext}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button
                  variant="outline"
                  className="flex-1 text-xs h-10 rounded-xl"
                  onClick={() => {
                    setModuloFilter('todos');
                    setExtensaoFilter('todos');
                    setFilterSheetOpen(false);
                  }}
                >
                  Limpar Filtros
                </Button>
                <Button
                  className="flex-1 text-xs h-10 rounded-xl font-semibold bg-orange-600 hover:bg-orange-700 text-white"
                  onClick={() => setFilterSheetOpen(false)}
                >
                  Aplicar
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Pílulas de Abas Rápidas */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1 -mx-4 px-4">
          <button
            onClick={() => { setActiveTab('todos'); setSelectedFolderId(null); }}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'todos' && !selectedFolderId
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Todos ({stats.totalDocs})
          </button>
          <button
            onClick={() => setActiveTab('pdf')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'pdf'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <FileText className="w-3 h-3" /> PDFs ({stats.countPdf})
          </button>
          <button
            onClick={() => setActiveTab('planilhas')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              activeTab === 'planilhas'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            <FileSpreadsheet className="w-3 h-3" /> Planilhas ({stats.countPlanilhas})
          </button>
          <button
            onClick={() => setActiveTab('financeiro')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'financeiro'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Financeiro
          </button>
          <button
            onClick={() => setActiveTab('contratos')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'contratos'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Contratos
          </button>
          <button
            onClick={() => setActiveTab('clientes')}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
              activeTab === 'clientes'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-muted/70 text-muted-foreground hover:bg-muted'
            }`}
          >
            Clientes
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Cards de Métricas em Carrossel Horizontal */}
        <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-orange-50 to-amber-100/40 dark:from-orange-950/40 dark:to-amber-900/20 border border-orange-200/60 dark:border-orange-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-orange-700 dark:text-orange-300 mb-1">
              <span className="text-[11px] font-semibold">Total Documentos</span>
              <HardDrive className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-orange-700 dark:text-orange-300">
              {stats.totalDocs}
            </p>
            <span className="text-[10px] text-muted-foreground block mt-0.5 font-medium">
              Em {stats.totalPastas} pastas
            </span>
          </div>

          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-blue-50 to-indigo-100/40 dark:from-blue-950/40 dark:to-indigo-900/20 border border-blue-200/60 dark:border-blue-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-300 mb-1">
              <span className="text-[11px] font-semibold">Espaço em Uso</span>
              <Layers className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-blue-700 dark:text-blue-300">
              {stats.totalMb} MB
            </p>
            <span className="text-[10px] text-blue-600/80 dark:text-blue-400/80 block mt-0.5 font-medium">
              Armazenamento Seguro
            </span>
          </div>

          <div className="min-w-[135px] flex-1 bg-gradient-to-br from-emerald-50 to-teal-100/40 dark:from-emerald-950/40 dark:to-teal-900/20 border border-emerald-200/60 dark:border-emerald-800/40 rounded-2xl p-3 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300 mb-1">
              <span className="text-[11px] font-semibold">Integridade</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
              100% OK
            </p>
            <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 block mt-0.5 font-medium">
              Auditoria ativa
            </span>
          </div>
        </div>

        {/* Carrossel de Pastas Rápidas */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            Navegar por Pastas
          </span>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4">
            {pastasPrincipais.map((pasta) => {
              const isSelected = selectedFolderId === pasta.id;
              const docCount = documentos.filter(d => d.pastaId === pasta.id || d.caminhoPasta?.startsWith(pasta.caminhoCompleto)).length;

              return (
                <button
                  key={pasta.id}
                  onClick={() => setSelectedFolderId(isSelected ? null : pasta.id)}
                  className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all shrink-0 text-left ${
                    isSelected
                      ? 'bg-orange-50 dark:bg-orange-950/40 border-orange-500 text-orange-700 dark:text-orange-300 shadow-2xs'
                      : 'bg-card border-border/70 hover:bg-muted/50 text-foreground'
                  }`}
                >
                  <Folder className={`w-4 h-4 ${isSelected ? 'text-orange-600 fill-orange-500/20' : 'text-orange-500'}`} />
                  <div>
                    <p className="text-xs font-semibold leading-tight truncate max-w-[110px]">{pasta.nome}</p>
                    <span className="text-[10px] text-muted-foreground">{docCount} docs</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Lista de Cards de Documentos */}
        <div className="space-y-3 pt-1">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              {filteredDocs.length} {filteredDocs.length === 1 ? 'Documento' : 'Documentos'}
            </span>
            {selectedFolderId && (
              <button
                onClick={() => setSelectedFolderId(null)}
                className="text-[11px] text-orange-600 font-semibold"
              >
                Limpar pasta
              </button>
            )}
          </div>

          {filteredDocs.length === 0 ? (
            <div className="text-center py-12 px-4 bg-card rounded-2xl border border-dashed border-border/70 my-4 shadow-2xs">
              <FileText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
              <p className="font-semibold text-sm text-foreground">Nenhum documento encontrado</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px] mx-auto">
                Tente alterar os termos da busca ou faça o upload de um novo arquivo.
              </p>
              <DmsUploadSheet>
                <Button size="sm" className="mt-4 bg-orange-600 hover:bg-orange-700 text-white font-semibold">
                  <UploadCloud className="w-4 h-4 mr-1.5" /> Fazer Upload
                </Button>
              </DmsUploadSheet>
            </div>
          ) : (
            filteredDocs.map((doc) => {
              return (
                <div
                  key={doc.id}
                  onClick={() => setPreviewDoc(doc)}
                  className="relative overflow-hidden bg-card border border-border/70 rounded-xl p-3.5 transition-all active:scale-[0.99] shadow-2xs hover:border-orange-500/40"
                >
                  <div className="flex items-start justify-between gap-2.5">
                    <div className="p-2 rounded-xl bg-muted/60 shrink-0 mt-0.5">
                      {getFileIcon(doc.extensao)}
                    </div>

                    <div className="flex-1 min-w-0">
                      {/* Código e Módulo */}
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className="font-mono text-xs font-bold text-muted-foreground bg-muted/70 px-1.5 py-0.5 rounded">
                          {doc.codigo}
                        </span>

                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 ${getFileBadgeColor(doc.extensao)}`}
                        >
                          {doc.extensao}
                        </Badge>

                        <Badge variant="outline" className="text-[10px] text-muted-foreground border-border/70 py-0.5">
                          {doc.moduloOrigem}
                        </Badge>
                      </div>

                      {/* Nome do Documento */}
                      <h4 className="font-semibold text-xs text-foreground truncate leading-snug">
                        {doc.nome}
                      </h4>

                      {/* Metadados: Cliente ou Subpasta */}
                      <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-1 truncate">
                        {doc.clienteNome ? (
                          <span className="flex items-center gap-1 truncate text-primary font-medium">
                            <Building2 className="w-3 h-3 shrink-0" />
                            {doc.clienteNome}
                          </span>
                        ) : (
                          <span className="truncate">{doc.caminhoPasta || '/Raiz'}</span>
                        )}
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={() => downloadDocument(doc)}
                        title="Baixar"
                      >
                        <Download className="w-4 h-4" />
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="text-xs">
                          <DropdownMenuItem onClick={() => setPreviewDoc(doc)} className="gap-2 cursor-pointer">
                            <Eye className="w-3.5 h-3.5 text-orange-600" /> Pré-visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => downloadDocument(doc)} className="gap-2 cursor-pointer">
                            <Download className="w-3.5 h-3.5 text-blue-600" /> Download Arquivo
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-rose-600 focus:text-rose-600 gap-2 cursor-pointer"
                            onClick={() => {
                              moveToTrash(doc.id);
                              toast.success("Documento movido para a lixeira");
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Mover para Lixeira
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Rodapé do Card: Tamanho, Versão e Data */}
                  <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{doc.tamanho}</span>
                      <span>•</span>
                      <span>v{doc.versaoAtual || '1.0'}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-muted-foreground/70" />
                      <span>{doc.dataCriacao ? formatDateBrasilia(doc.dataCriacao) : 'Hoje'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <DmsPreviewModal
        documento={previewDoc}
        open={!!previewDoc}
        onOpenChange={(open) => !open && setPreviewDoc(null)}
      />
    </div>
  );
}

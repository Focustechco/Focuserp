import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { 
  Folder, FileText, Image as ImageIcon, Video, FolderPlus, 
  UploadCloud, Search, Star, LayoutGrid, List, ChevronRight, 
  MoreVertical, Trash2, Eye, Download, Tag, HardDrive, ArrowLeft
} from 'lucide-react';
import { useDocumentosStore } from '../hooks/useDocumentosStore';
import { PastaDMS, DocumentoDMS } from '../types';
import { DmsUploadSheet } from './DmsUploadSheet';
import { DmsPreviewModal } from './DmsPreviewModal';
import { toast } from 'sonner';

export function DmsExplorerView() {
  const { pastas, documentos, createFolder, toggleFavorite, moveToTrash, logAction } = useDocumentosStore();

  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [selectedDoc, setSelectedDoc] = useState<DocumentoDMS | null>(null);

  // Modal Criar Pasta
  const [openNewFolderModal, setOpenNewFolderModal] = useState(false);
  const [folderName, setFolderName] = useState('');

  const currentFolder = pastas.find(p => p.id === currentFolderId);
  const currentPath = currentFolder ? currentFolder.caminhoCompleto : '/ (Raiz DMS)';

  // Pastas filhas da pasta atual
  const visibleFolders = pastas.filter(p => p.parentId === currentFolderId && (p?.nome || '').toLowerCase().includes((search || '').toLowerCase()));

  // Função resiliente para verificar se o documento pertence à pasta atual
  const isDocInFolder = (doc: DocumentoDMS, folder: PastaDMS | undefined, folderId: string | null) => {
    if (!doc) return false;

    // Raiz do DMS
    if (folderId === null) {
      return !doc.pastaId || doc.pastaId === 'root' || doc.caminhoPasta === '/' || doc.caminhoPasta === '/Geral';
    }

    if (!folder) return false;

    // 1. Match exato por pastaId
    if (doc.pastaId === folderId) return true;

    // 2. Match por caminho completo
    if (doc.caminhoPasta && folder.caminhoCompleto) {
      const normDocPath = doc.caminhoPasta.toLowerCase().trim().replace(/\/+/g, '/');
      const normFolderPath = folder.caminhoCompleto.toLowerCase().trim().replace(/\/+/g, '/');
      if (normDocPath === normFolderPath) return true;
    }

    // 3. Match por ID da Entidade (Cliente, Projeto, Colaborador, Produto)
    if (folder.entidadeId) {
      if (
        doc.clienteId === folder.entidadeId || 
        doc.projetoId === folder.entidadeId || 
        doc.colaboradorId === folder.entidadeId || 
        doc.produtoId === folder.entidadeId
      ) {
        return true;
      }
    }

    // 4. Match por Nome da Pasta / Entidade
    if (folder.nome) {
      const normFolderName = folder.nome.toLowerCase().trim();
      if (doc.clienteNome && doc.clienteNome.toLowerCase().trim() === normFolderName) return true;
      if (doc.projetoNome && doc.projetoNome.toLowerCase().trim() === normFolderName) return true;
      if (doc.colaboradorNome && doc.colaboradorNome.toLowerCase().trim() === normFolderName) return true;
      if (doc.produtoNome && doc.produtoNome.toLowerCase().trim() === normFolderName) return true;
      if (doc.caminhoPasta && doc.caminhoPasta.toLowerCase().includes(normFolderName)) return true;
    }

    return false;
  };

  // Documentos da pasta atual (ou pesquisa global se search estiver preenchido)
  const visibleDocs = documentos.filter(doc => {
    const matchesSearch = (doc?.nome || '').toLowerCase().includes((search || '').toLowerCase()) || 
      (doc?.codigo || '').toLowerCase().includes((search || '').toLowerCase()) ||
      (doc?.caminhoPasta || '').toLowerCase().includes((search || '').toLowerCase()) ||
      (doc?.tags || []).some(t => (t || '').toLowerCase().includes((search || '').toLowerCase()));

    if (search.trim()) return matchesSearch;
    return isDocInFolder(doc, currentFolder, currentFolderId);
  });

  const handleCreateFolder = () => {
    if (!folderName.trim()) {
      toast.error('Informe o nome da nova pasta.');
      return;
    }

    createFolder(folderName.trim(), currentFolderId);
    toast.success(`Pasta "${folderName.trim()}" criada!`);
    setFolderName('');
    setOpenNewFolderModal(false);
  };

  const renderFileIcon = (ext: string) => {
    switch (ext) {
      case 'png': case 'jpg': case 'jpeg': case 'svg':
        return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'pdf':
        return <FileText className="w-8 h-8 text-rose-500" />;
      case 'mp4': case 'mov':
        return <Video className="w-8 h-8 text-purple-500" />;
      default:
        return <FileText className="w-8 h-8 text-slate-500" />;
    }
  };

  // Contagem de documentos de uma pasta
  const countDocsInFolder = (folder: PastaDMS) => {
    return documentos.filter(d => {
      if ((d?.caminhoPasta || '').toLowerCase().startsWith(folder.caminhoCompleto.toLowerCase())) return true;
      if (d.pastaId === folder.id) return true;
      if (folder.entidadeId && (d.clienteId === folder.entidadeId || d.projetoId === folder.entidadeId || d.colaboradorId === folder.entidadeId)) return true;
      return false;
    }).length;
  };

  return (
    <div className="space-y-4 animate-fade-in pt-2">
      {/* Barra de Ferramentas Superior */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border p-3 rounded-lg">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-80">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Pesquisa Full-Text em todo o DMS..." 
              className="pl-8 text-xs"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="bg-muted p-1 rounded-md flex">
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('grid')} 
              className="h-8 px-2"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')} 
              className="h-8 px-2"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setOpenNewFolderModal(true)} 
            className="gap-1.5 h-8 text-xs"
          >
            <FolderPlus className="w-4 h-4" /> Nova Pasta
          </Button>

          <DmsUploadSheet>
            <Button size="sm" className="gap-1.5 h-8 text-xs bg-orange-600 hover:bg-orange-700 text-white">
              <UploadCloud className="w-4 h-4" /> Upload de Arquivo
            </Button>
          </DmsUploadSheet>
        </div>
      </div>

      {/* Estrutura Principal: Navegador & Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Painel Esquerdo: Árvore de Pastas Raiz */}
        <Card className="p-3 space-y-2 h-fit bg-card">
          <div className="text-xs font-bold text-muted-foreground uppercase px-2 py-1 flex items-center justify-between">
            <span>Estrutura de Pastas</span>
            <HardDrive className="w-3.5 h-3.5 text-primary" />
          </div>

          <div className="space-y-1 text-xs">
            <div 
              onClick={() => setCurrentFolderId(null)}
              className={`p-2 rounded-md cursor-pointer flex items-center justify-between font-medium ${currentFolderId === null ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50'}`}
            >
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-500" /> Raiz do DMS
              </div>
              <Badge variant="outline" className="text-[9px] px-1">
                {documentos.length}
              </Badge>
            </div>

            {pastas.filter(p => p.parentId === null).map(p => {
              const docCount = countDocsInFolder(p);
              return (
                <div 
                  key={p.id}
                  onClick={() => setCurrentFolderId(p.id)}
                  className={`p-2 rounded-md cursor-pointer flex items-center justify-between text-xs transition-colors ${currentFolderId === p.id ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50 text-muted-foreground'}`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Folder className="w-4 h-4 text-amber-500" />
                    <span className="truncate">{p.nome}</span>
                  </div>
                  <Badge variant="outline" className="text-[9px] px-1">
                    {docCount}
                  </Badge>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Painel Direito: Conteúdo da Pasta Selecionada */}
        <Card className="md:col-span-3 p-4">
          {/* Breadcrumbs do Caminho */}
          <div className="flex items-center justify-between pb-3 mb-4 border-b">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {currentFolder && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setCurrentFolderId(currentFolder.parentId || null)} 
                  className="h-6 px-1.5 text-[11px] gap-1 mr-1 text-primary"
                >
                  <ArrowLeft className="w-3 h-3" /> Voltar
                </Button>
              )}
              <span className="cursor-pointer hover:text-primary font-medium" onClick={() => setCurrentFolderId(null)}>DMS</span>
              {currentFolder && (
                <>
                  <ChevronRight className="w-3.5 h-3.5" />
                  <span className="font-bold text-foreground">{currentFolder.caminhoCompleto}</span>
                </>
              )}
            </div>

            {currentFolder && (
              <Badge variant="secondary" className="text-xs">
                {visibleDocs.length} arquivo(s)
              </Badge>
            )}
          </div>

          {/* VISUALIZAÇÃO EM GRADE (GRID) */}
          {viewMode === 'grid' ? (
            <div className="space-y-6">
              {/* Seção de Pastas */}
              {visibleFolders.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Pastas ({visibleFolders.length})</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {visibleFolders.map(p => {
                      const docCount = countDocsInFolder(p);
                      return (
                        <div 
                          key={p.id}
                          onClick={() => setCurrentFolderId(p.id)}
                          className="p-3 border rounded-lg hover:border-primary/50 cursor-pointer flex items-center justify-between bg-card transition-all group hover:shadow-sm"
                        >
                          <div className="flex items-center gap-2.5 truncate">
                            <Folder className="w-6 h-6 text-amber-500 shrink-0 group-hover:scale-105 transition-transform" />
                            <div className="truncate text-xs">
                              <p className="font-semibold truncate">{p.nome}</p>
                              <p className="text-[10px] text-muted-foreground">{docCount} arquivo(s)</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Seção de Arquivos */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Arquivos ({visibleDocs.length})</h4>
                {visibleDocs.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground text-xs border border-dashed rounded-lg">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    Nenhum documento encontrado nesta pasta.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {visibleDocs.map(doc => (
                      <div 
                        key={doc.id}
                        className="p-3 border rounded-lg hover:border-primary/50 bg-card transition-all flex flex-col justify-between space-y-3 group hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {renderFileIcon(doc.extensao)}
                            <div className="min-w-0">
                              <p className="font-semibold text-xs truncate" title={doc.nome}>{doc.nome}</p>
                              <p className="text-[10px] text-muted-foreground">{doc.tamanho} • {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6 shrink-0" 
                            onClick={() => toggleFavorite(doc.id)}
                          >
                            <Star className={`w-3.5 h-3.5 ${doc.favorito ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
                          </Button>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t text-xs">
                          <Badge variant="outline" className="text-[10px] bg-secondary/50 font-normal">
                            {doc.moduloOrigem}
                          </Badge>
                          <div className="flex items-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-7 text-xs px-2 gap-1"
                              onClick={() => {
                                setSelectedDoc(doc);
                                logAction(doc.id, doc.nome, 'Visualizacao', 'Preview aberto pelo usuário');
                              }}
                            >
                              <Eye className="w-3.5 h-3.5" /> Abrir
                            </Button>
                            {doc.urlConteudo && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-7 w-7 text-primary" 
                                asChild
                              >
                                <a href={doc.urlConteudo} download={doc.nome} title="Baixar">
                                  <Download className="w-3.5 h-3.5" />
                                </a>
                              </Button>
                            )}
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                              onClick={() => {
                                moveToTrash(doc.id);
                                toast.info(`"${doc.nome}" movido para a Lixeira do DMS.`);
                              }}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VISUALIZAÇÃO EM LISTA */
            <div className="space-y-4">
              {visibleFolders.map(p => (
                <div 
                  key={p.id}
                  onClick={() => setCurrentFolderId(p.id)}
                  className="flex items-center justify-between p-2.5 border rounded-md hover:bg-muted/40 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4 text-amber-500" />
                    <span className="font-semibold">{p.nome}</span>
                  </div>
                  <span className="text-[11px] text-muted-foreground">Pasta</span>
                </div>
              ))}

              {visibleDocs.map(doc => (
                <div 
                  key={doc.id}
                  className="flex items-center justify-between p-2.5 border rounded-md hover:bg-muted/40 text-xs transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {renderFileIcon(doc.extensao)}
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{doc.nome}</p>
                      <p className="text-[10px] text-muted-foreground flex items-center gap-2">
                        <span>{doc.codigo}</span>
                        <span>• {doc.tamanho}</span>
                        <span>• {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</span>
                        <span className="bg-secondary px-1 py-0.5 rounded text-[9px]">{doc.moduloOrigem}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-xs px-2 gap-1"
                      onClick={() => {
                        setSelectedDoc(doc);
                        logAction(doc.id, doc.nome, 'Visualizacao');
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" /> Abrir
                    </Button>
                    {doc.urlConteudo && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-primary" 
                        asChild
                      >
                        <a href={doc.urlConteudo} download={doc.nome} title="Baixar">
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-rose-500"
                      onClick={() => moveToTrash(doc.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}

              {visibleFolders.length === 0 && visibleDocs.length === 0 && (
                <div className="p-8 text-center text-muted-foreground text-xs">
                  Nenhum arquivo ou pasta encontrado.
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Modal Nova Pasta */}
      <Dialog open={openNewFolderModal} onOpenChange={setOpenNewFolderModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Criar Nova Subpasta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <div className="space-y-1.5">
              <Label className="text-xs">Caminho Pai</Label>
              <Input disabled value={currentPath} className="text-xs h-8 bg-muted" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Nome da Pasta</Label>
              <Input 
                placeholder="Ex: Contratos 2026 / Comprovantes" 
                value={folderName} 
                onChange={e => setFolderName(e.target.value)} 
                className="text-xs h-8"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenNewFolderModal(false)} className="text-xs">
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreateFolder} className="text-xs bg-orange-600 hover:bg-orange-700 text-white">
              Criar Pasta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Preview de Documento */}
      {selectedDoc && (
        <DmsPreviewModal 
          doc={selectedDoc} 
          open={!!selectedDoc} 
          onOpenChange={(open) => !open && setSelectedDoc(null)} 
        />
      )}
    </div>
  );
}

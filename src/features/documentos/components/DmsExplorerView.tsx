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
  MoreVertical, Trash2, Eye, Download, Tag, HardDrive
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
  const visibleFolders = pastas.filter(p => p.parentId === currentFolderId && p.nome.toLowerCase().includes(search.toLowerCase()));

  // Documentos da pasta atual (ou pesquisa global se search estiver preenchido)
  const visibleDocs = documentos.filter(doc => {
    const matchesSearch = doc.nome.toLowerCase().includes(search.toLowerCase()) || 
      doc.codigo.toLowerCase().includes(search.toLowerCase()) ||
      doc.tags.some(t => t.toLowerCase().includes(search.toLowerCase()));

    if (search.trim()) return matchesSearch;
    return doc.pastaId === currentFolderId;
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

      {/* RVORE E NAVEGAO DMS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Painel Esquerdo: Estrutura de Pastas Raiz */}
        <Card className="md:col-span-1 p-3 space-y-2">
          <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider px-2 pb-2 border-b flex justify-between items-center">
            <span>Estrutura de Pastas</span>
            <HardDrive className="w-3.5 h-3.5 text-primary" />
          </div>

          <div className="space-y-1 text-xs">
            <div 
              onClick={() => setCurrentFolderId(null)}
              className={`p-2 rounded-md cursor-pointer flex items-center gap-2 font-medium ${currentFolderId === null ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-muted/50'}`}
            >
              <Folder className="w-4 h-4 text-amber-500" /> Raiz do DMS
            </div>

            {pastas.filter(p => p.parentId === null).map(p => (
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
                  {documentos.filter(d => d.caminhoPasta.startsWith(p.caminhoCompleto)).length}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Painel Direito: Contedo da Pasta Selecionada */}
        <Card className="md:col-span-3 p-4">
          {/* Breadcrumbs do Caminho */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground pb-3 mb-4 border-b">
            <span className="cursor-pointer hover:text-primary font-medium" onClick={() => setCurrentFolderId(null)}>DMS</span>
            {currentFolder && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="font-bold text-foreground">{currentFolder.caminhoCompleto}</span>
              </>
            )}
          </div>

          {/* VISUALIZAO EM GRADE (GRID) */}
          {viewMode === 'grid' ? (
            <div className="space-y-6">
              {/* Seo de Pastas */}
              {visibleFolders.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Pastas</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {visibleFolders.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => setCurrentFolderId(p.id)}
                        className="p-3 border rounded-lg hover:border-primary/50 cursor-pointer flex items-center gap-3 bg-card transition-all group"
                      >
                        <Folder className="w-7 h-7 text-amber-500 group-hover:scale-105 transition-transform" />
                        <div className="truncate text-xs">
                          <p className="font-semibold truncate">{p.nome}</p>
                          <p className="text-[10px] text-muted-foreground">Pasta corporativa</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Seo de Arquivos */}
              <div>
                <h4 className="text-xs font-bold text-muted-foreground uppercase mb-2">Arquivos ({visibleDocs.length})</h4>
                {visibleDocs.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p className="font-medium text-xs">Nenhum arquivo nesta pasta.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {visibleDocs.map(doc => (
                      <div 
                        key={doc.id}
                        className="p-3 border rounded-lg hover:border-primary/50 bg-card transition-all flex flex-col justify-between group cursor-pointer"
                        onClick={() => setSelectedDoc(doc)}
                      >
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <Badge variant="outline" className="text-[9px] uppercase font-bold">{doc.extensao}</Badge>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-6 w-6 text-muted-foreground hover:text-amber-400"
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(doc.id); }}
                            >
                              <Star className={`w-3.5 h-3.5 ${doc.favorito ? 'fill-amber-400 text-amber-400' : ''}`} />
                            </Button>
                          </div>

                          <div className="flex flex-col items-center text-center my-2">
                            {renderFileIcon(doc.extensao)}
                            <p className="font-semibold text-xs truncate w-full mt-2" title={doc.nome}>{doc.nome}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">{doc.tamanho} " v{doc.versaoAtual}</p>
                          </div>
                        </div>

                        <div className="pt-2 border-t flex justify-between items-center text-[10px] text-muted-foreground">
                          <span className="truncate">{doc.moduloOrigem}</span>
                          <Eye className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* VISUALIZAO EM LISTA (TABELA) */
            <div className="border rounded-lg overflow-hidden bg-card text-xs">
              <table className="w-full">
                <thead className="bg-muted/50 border-b text-left">
                  <tr>
                    <th className="p-3">Nome do Arquivo</th>
                    <th className="p-3">Mdulo</th>
                    <th className="p-3">Verso</th>
                    <th className="p-3">Tamanho</th>
                    <th className="p-3">Upload</th>
                    <th className="p-3 text-right">Aes</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleDocs.map(doc => (
                    <tr key={doc.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setSelectedDoc(doc)}>
                      <td className="p-3 font-semibold text-primary flex items-center gap-2">
                        {renderFileIcon(doc.extensao)}
                        <span>{doc.nome}</span>
                      </td>
                      <td className="p-3"><Badge variant="outline" className="text-[10px]">{doc.moduloOrigem}</Badge></td>
                      <td className="p-3 font-bold">v{doc.versaoAtual}</td>
                      <td className="p-3 text-muted-foreground">{doc.tamanho}</td>
                      <td className="p-3 text-muted-foreground">{new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</td>
                      <td className="p-3 text-right">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); setSelectedDoc(doc); }}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modal Criar Nova Pasta */}
      <Dialog open={openNewFolderModal} onOpenChange={setOpenNewFolderModal}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-sm">
              <FolderPlus className="w-4 h-4 text-primary" /> Criar Nova Pasta
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs">Nome da Pasta</Label>
            <Input 
              placeholder="Ex: Minutas_2026" 
              value={folderName} 
              onChange={e => setFolderName(e.target.value)} 
              className="text-xs"
            />
          </div>

          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setOpenNewFolderModal(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleCreateFolder}>Criar Pasta</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Pr-Visualizao Interna */}
      <DmsPreviewModal 
        documento={selectedDoc} 
        isOpen={!!selectedDoc} 
        onClose={() => setSelectedDoc(null)} 
      />
    </div>
  );
}

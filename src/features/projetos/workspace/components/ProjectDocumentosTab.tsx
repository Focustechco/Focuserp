import React, { useState } from 'react';
import { Projeto } from '../../types';
import { useDocumentosStore } from '@/features/documentos/hooks/useDocumentosStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FolderOpen, 
  UploadCloud, 
  FileText, 
  Download, 
  ExternalLink, 
  Trash2,
  Folder,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import { Link } from '@tanstack/react-router';
import { CategoriaDocProjeto } from '../types';

interface ProjectDocumentosTabProps {
  projeto: Projeto;
  onNavigateTab: (tabId: string) => void;
}

const CATEGORIAS_DOCS: CategoriaDocProjeto[] = [
  'Comercial',
  'Planejamento',
  'Requisitos',
  'Design',
  'Desenvolvimento',
  'Testes',
  'Entrega'
];

export function ProjectDocumentosTab({ projeto }: ProjectDocumentosTabProps) {
  const { documentos, uploadFileFromModule } = useDocumentosStore();
  const [selectedCategoria, setSelectedCategoria] = useState<string>('Todas');
  const [isUploading, setIsUploading] = useState(false);

  const projetoDocs = documentos.filter(
    (d) =>
      d.projetoId === projeto.id ||
      d.caminhoPasta.toLowerCase().includes(projeto.nome.toLowerCase()) ||
      d.pastaId === `p-prj-${projeto.id}`
  );

  const filteredDocs = projetoDocs.filter(d => 
    selectedCategoria === 'Todas' || d.categoria === selectedCategoria
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    setIsUploading(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;

      uploadFileFromModule({
        nome: file.name,
        tamanho: `${sizeInMb} MB`,
        tamanhoBytes: file.size,
        moduloOrigem: 'Projetos',
        projetoId: projeto.id,
        projetoNome: projeto.nome,
        categoria: selectedCategoria !== 'Todas' ? selectedCategoria : 'Desenvolvimento',
        tags: ['Projetos', projeto.codigo || 'PRJ', selectedCategoria !== 'Todas' ? selectedCategoria : 'Doc'],
        urlConteudo: dataUrl,
      });

      setIsUploading(false);
      toast.success(`Documento "${file.name}" anexado e sincronizado com o DMS!`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header com Categorias de Pastas */}
      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-orange-500" /> Repositório de Documentação do Projeto
            </CardTitle>
            <CardDescription className="text-xs">
              Briefings, atas, diagramas de arquitetura e entregáveis sincronizados com o módulo <strong>Gestão de Documentos (DMS)</strong>.
            </CardDescription>
          </div>

          <Link to="/documentos">
            <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1.5 font-semibold">
              <ExternalLink className="w-3.5 h-3.5" /> Explorador Completo DMS
            </Button>
          </Link>
        </CardHeader>

        <CardContent className="p-5 space-y-6">
          {/* Navegação por Pastas / Categorias */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={selectedCategoria === 'Todas' ? 'default' : 'outline'}
              onClick={() => setSelectedCategoria('Todas')}
              className={`rounded-xl text-xs h-8 ${selectedCategoria === 'Todas' ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
            >
              Todas as Pastas ({projetoDocs.length})
            </Button>
            {CATEGORIAS_DOCS.map(cat => {
              const count = projetoDocs.filter(d => d.categoria === cat).length;
              return (
                <Button
                  key={cat}
                  size="sm"
                  variant={selectedCategoria === cat ? 'default' : 'outline'}
                  onClick={() => setSelectedCategoria(cat)}
                  className={`rounded-xl text-xs h-8 gap-1.5 ${selectedCategoria === cat ? 'bg-orange-600 hover:bg-orange-700 text-white' : ''}`}
                >
                  <Folder className="w-3 h-3 text-orange-500" /> {cat} ({count})
                </Button>
              );
            })}
          </div>

          {/* Dropzone de Upload */}
          <div className="border-2 border-dashed border-orange-500/30 hover:border-orange-500/60 rounded-2xl p-6 flex flex-col items-center justify-center bg-orange-50/10 hover:bg-orange-50/20 dark:bg-orange-950/10 transition-colors cursor-pointer relative group text-center">
            <input 
              type="file" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              onChange={handleFileUpload}
              disabled={isUploading}
            />
            <div className="bg-orange-100 dark:bg-orange-950/40 p-3 rounded-full mb-2 group-hover:scale-110 transition-transform">
              <UploadCloud className="w-6 h-6 text-orange-600" />
            </div>
            <p className="text-xs font-bold text-foreground">
              {isUploading ? 'Enviando e indexando arquivo no DMS...' : `Clique ou arraste arquivos para a pasta ${selectedCategoria}`}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              PDF, DOCX, XLSX, PNG, JPG, ZIP, JSON (até 50MB)
            </p>
          </div>

          {/* Lista de Documentos */}
          {filteredDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-xs border rounded-2xl p-6">
              Nenhum documento encontrado na pasta <strong>{selectedCategoria}</strong>.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredDocs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between p-3.5 rounded-xl border bg-card hover:border-orange-500/40 transition-all shadow-2xs">
                  <div className="flex items-center gap-3 truncate">
                    <FileText className="w-6 h-6 text-orange-500 shrink-0" />
                    <div className="truncate text-xs">
                      <h4 className="font-bold text-foreground truncate">{doc.nome}</h4>
                      <p className="text-[11px] text-muted-foreground">{doc.tamanho} • {doc.categoria || 'Geral'}</p>
                    </div>
                  </div>

                  {doc.urlConteudo && (
                    <a href={doc.urlConteudo} download={doc.nome} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 rounded-lg">
                        <Download className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                      </Button>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

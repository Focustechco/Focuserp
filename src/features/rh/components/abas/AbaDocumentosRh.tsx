import React from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UploadCloud, FileText, Download, Trash2, FolderOpen } from 'lucide-react';
import { DocumentoAnexoRh } from '../../types';
import { dmsService } from '@/services/dmsService';
import { toast } from 'sonner';

interface AbaDocumentosRhProps {
  documentos: DocumentoAnexoRh[];
  setDocumentos: React.Dispatch<React.SetStateAction<DocumentoAnexoRh[]>>;
  nomeColaborador: string;
}

export function AbaDocumentosRh({ documentos, setDocumentos, nomeColaborador }: AbaDocumentosRhProps) {

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(2);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      const dataUrl = evt.target?.result as string;

      const newDoc: DocumentoAnexoRh = {
        id: `doc-rh-${Date.now()}`,
        nome: file.name,
        categoria: file.name.toLowerCase().includes('contrato') ? 'Contrato de Trabalho' : 'Documentos Pessoais',
        tamanho: `${sizeInMb} MB`,
        dataUpload: new Date().toISOString(),
        urlConteudo: dataUrl
      };

      setDocumentos(prev => [...prev, newDoc]);

      // Sincronizar automaticamente com o módulo Gestão de Documentos (DMS)
      dmsService.uploadFileFromModule({
        nome: file.name,
        tamanho: `${sizeInMb} MB`,
        tamanhoBytes: file.size,
        moduloOrigem: 'RH',
        colaboradorNome: nomeColaborador || 'Colaborador',
        categoria: newDoc.categoria,
        tags: ['RH', 'Colaborador', nomeColaborador || 'Geral'],
        urlConteudo: dataUrl,
      });

      toast.success(`Documento "${file.name}" anexado e salvo na pasta /RH/Colaboradores/${nomeColaborador || 'Colaborador'} do DMS!`);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveDoc = (id: string) => {
    setDocumentos(prev => prev.filter(d => d.id !== id));
    toast.info("Documento removido da lista.");
  };

  return (
    <div className="space-y-6 pt-4 animate-fade-in pb-8">
      {/* Dropzone de Upload Real */}
      <div className="border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center bg-muted/10 hover:bg-muted/20 transition-colors cursor-pointer relative group">
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          onChange={handleFileUpload}
        />
        <div className="bg-primary/10 p-3 rounded-full mb-3 group-hover:scale-110 transition-transform">
          <UploadCloud className="w-8 h-8 text-primary" />
        </div>
        <h3 className="text-base font-bold">Anexar Documentos do Colaborador</h3>
        <p className="text-xs text-muted-foreground mt-1 mb-3 text-center">
          Os arquivos serão salvos automaticamente na pasta <strong className="text-primary">/RH/Colaboradores/{nomeColaborador || 'Colaborador'}</strong> do módulo DMS.
        </p>
        <Button variant="outline" size="sm" className="pointer-events-none">Selecionar Arquivos</Button>
      </div>

      <div className="space-y-4">
        <h4 className="font-bold text-xs flex items-center justify-between border-b pb-2">
          <span className="flex items-center gap-1.5">
            <FolderOpen className="w-4 h-4 text-primary" />
            Documentos Anexados ao Perfil & DMS
          </span>
          <Badge variant="secondary">{documentos.length} arquivo(s)</Badge>
        </h4>
        
        <div className="space-y-2 text-xs">
          {documentos.length === 0 ? (
            <p className="text-center py-6 text-muted-foreground">
              Nenhum documento anexado ainda. Escolha um arquivo acima.
            </p>
          ) : (
            documentos.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:border-primary/50 transition-colors bg-card">
                <div className="flex items-center gap-3 truncate">
                  <div className="bg-blue-500/10 p-2 rounded-md text-blue-600 dark:text-blue-400">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-xs truncate">{doc.nome}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                      <span className="bg-secondary px-1.5 py-0.5 rounded">{doc.categoria}</span>
                      <span>{doc.tamanho}</span>
                      <span>• {new Date(doc.dataUpload).toLocaleDateString('pt-BR')}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  {doc.urlConteudo && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-primary hover:bg-primary/10"
                      asChild
                    >
                      <a href={doc.urlConteudo} download={doc.nome}>
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                    onClick={() => handleRemoveDoc(doc.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

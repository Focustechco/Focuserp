import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Trash2, RotateCcw, ShieldAlert, FileText, AlertTriangle } from 'lucide-react';
import { useDocumentosStore } from '../hooks/useDocumentosStore';
import { toast } from 'sonner';

export function DmsTrashView() {
  const { lixeira, restoreFromTrash, deletePermanently, deletePermanentlyBatch } = useDocumentosStore();
  const [isClearTrashModalOpen, setIsClearTrashModalOpen] = useState(false);

  const handleRestore = (docId: string, nome: string) => {
    restoreFromTrash(docId);
    toast.success(`Documento "${nome}" restaurado com sucesso!`);
  };

  const handleDelete = (docId: string, nome: string) => {
    deletePermanently(docId);
    toast.success(`Documento "${nome}" excluído permanentemente do banco de dados.`);
  };

  const handleClearAllTrash = () => {
    const allIds = lixeira.map(d => d.id);
    deletePermanentlyBatch(allIds);
    toast.success(`Todos os ${allIds.length} documento(s) da lixeira foram excluídos permanentemente.`);
    setIsClearTrashModalOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            Lixeira Corporativa de Documentos
          </CardTitle>
          {lixeira.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsClearTrashModalOpen(true)}
              className="text-xs h-8 gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" /> Esvaziar Lixeira ({lixeira.length})
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {lixeira.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground border border-dashed rounded-lg">
              <Trash2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Lixeira vazia.</p>
              <p className="text-xs mt-1">Nenhum documento aguardando restauração ou exclusão.</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden bg-card text-xs">
              <table className="w-full">
                <thead className="bg-muted/50 border-b text-left">
                  <tr>
                    <th className="p-3">Nome do Documento</th>
                    <th className="p-3">Módulo</th>
                    <th className="p-3">Caminho Original</th>
                    <th className="p-3">Tamanho</th>
                    <th className="p-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lixeira.map(item => (
                    <tr key={item.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-semibold text-rose-600 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> {item.nome}
                      </td>
                      <td className="p-3"><Badge variant="outline">{item.moduloOrigem}</Badge></td>
                      <td className="p-3 text-muted-foreground">{item.caminhoPasta}</td>
                      <td className="p-3 text-muted-foreground">{item.tamanho}</td>
                      <td className="p-3 text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleRestore(item.id, item.nome)}
                          className="h-7 text-xs gap-1 border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Restaurar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive" 
                          onClick={() => handleDelete(item.id, item.nome)}
                          className="h-7 text-xs gap-1"
                        >
                          Excluir Definitivamente
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Esvaziar Lixeira */}
      <Dialog open={isClearTrashModalOpen} onOpenChange={setIsClearTrashModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" /> Esvaziar Toda a Lixeira
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Esta ação excluirá permanentemente todos os <strong>{lixeira.length} documento(s)</strong> da lixeira e do banco de dados. Esta operação é irreversível.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-3">
            <Button variant="outline" size="sm" onClick={() => setIsClearTrashModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" size="sm" onClick={handleClearAllTrash}>
              Sim, Esvaziar Lixeira
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

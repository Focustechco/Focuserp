import { createFileRoute } from "@tanstack/react-router";
import { FiscalDashboard } from "@/features/fiscal/components/FiscalDashboard";
import { DocumentosFiscaisTable } from "@/features/fiscal/components/DocumentosFiscaisTable";
import { ImportacaoDocumentosModal } from "@/features/fiscal/components/ImportacaoDocumentosModal";
import { DocumentoFiscalSheet } from "@/features/fiscal/components/DocumentoFiscalSheet";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, List, FileCheck2, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DocumentoFiscal } from "@/features/fiscal/types";

export const Route = createFileRoute("/fiscal")({
  component: RouteComponent,
});

function RouteComponent() {
  const [importOpen, setImportOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingDoc, setEditingDoc] = useState<DocumentoFiscal | null>(null);

  const handleNewClick = () => {
    setEditingDoc(null);
    setSheetOpen(true);
  };

  const handleEditClick = (doc: DocumentoFiscal) => {
    setEditingDoc(doc);
    setSheetOpen(true);
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Central Fiscal & Tributária</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Emissão de notas fiscais (NFe, NFSe, NFCe), gestão de certificados A1/A3, MDF-e, obrigações acessórias e SPED.
          </p>
        </div>
      </div>
      
      <Tabs defaultValue="listagem" className="space-y-4">
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="listagem" className="gap-2 shrink-0"><List className="w-4 h-4" /> Diretório de Documentos Fiscais</TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0"><PieChart className="w-4 h-4" /> Monitor Tributário (Dashboard)</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="listagem" className="space-y-4 outline-none">
          <DocumentosFiscaisTable 
            onImportClick={() => setImportOpen(true)}
            onNewClick={handleNewClick}
            onEditClick={handleEditClick}
          />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <FiscalDashboard />
        </TabsContent>
      </Tabs>

      <ImportacaoDocumentosModal open={importOpen} onOpenChange={setImportOpen} />
      <DocumentoFiscalSheet 
        open={sheetOpen} 
        onOpenChange={setSheetOpen} 
        documentoParaEditar={editingDoc}
      />
    </div>
  );
}

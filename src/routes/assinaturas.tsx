import { createFileRoute } from "@tanstack/react-router";
import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { 
  FileSignature, 
  LayoutDashboard, 
  FileText, 
  Copy, 
  Award, 
  PlusCircle, 
  ShieldCheck 
} from "lucide-react";
import { useAssinaturasStore } from "@/features/assinaturas/hooks/useAssinaturasStore";
import { AssinaturasDashboard } from "@/features/assinaturas/components/AssinaturasDashboard";
import { DocumentosLista } from "@/features/assinaturas/components/DocumentosLista";
import { NovoDocumentoSheet } from "@/features/assinaturas/components/NovoDocumentoSheet";
import { ModalAssinarDocumento } from "@/features/assinaturas/components/ModalAssinarDocumento";
import { ModalTrilhaAuditoria } from "@/features/assinaturas/components/ModalTrilhaAuditoria";
import { ModelosDocumentos } from "@/features/assinaturas/components/ModelosDocumentos";
import { CertificadosManager } from "@/features/assinaturas/components/CertificadosManager";
import { DocumentoAssinatura, ModeloDocumento } from "@/features/assinaturas/types";
import { toast } from "sonner";

export const Route = createFileRoute("/assinaturas")({
  component: AssinaturasPage,
});

function AssinaturasPage() {
  const [activeTab, setActiveTab] = useState("dashboard");

  const {
    documentos,
    modelos,
    certificados,
    addDocumento,
    assinarDocumento,
    cancelarDocumento
  } = useAssinaturasStore();

  const [novoDocSheetOpen, setNovoDocSheetOpen] = useState(false);
  const [modalAssinarOpen, setModalAssinarOpen] = useState(false);
  const [modalAuditoriaOpen, setModalAuditoriaOpen] = useState(false);
  const [docSelecionado, setDocSelecionado] = useState<DocumentoAssinatura | null>(null);

  const handleAbrirAssinatura = (doc: DocumentoAssinatura) => {
    setDocSelecionado(doc);
    setModalAssinarOpen(true);
  };

  const handleAbrirAuditoria = (doc: DocumentoAssinatura) => {
    setDocSelecionado(doc);
    setModalAuditoriaOpen(true);
  };

  const handleUsarModelo = (modelo: ModeloDocumento) => {
    setNovoDocSheetOpen(true);
    toast.info(`Minuta "${modelo.titulo}" carregada no formulário de envio.`);
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      
      {/* Header da Página */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
              Focus Sign
            </span>
            <span className="text-xs text-muted-foreground">⬢ Módulo de Assinaturas Eletrônicas</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight mt-1 text-foreground">
            Gestão de Assinaturas & Contratos
          </h1>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <Button variant="outline" className="gap-2 text-xs" onClick={() => setActiveTab("modelos")}>
            <Copy className="w-3.5 h-3.5" /> Modelos
          </Button>
          <Button className="gap-2 bg-primary text-xs shadow-sm" onClick={() => setNovoDocSheetOpen(true)}>
            <PlusCircle className="w-4 h-4" /> Novo Documento
          </Button>
        </div>
      </div>

      {/* Tabs Principais do Módulo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="w-full h-auto flex flex-wrap bg-card border p-1 rounded-xl shadow-xs">
          <TabsTrigger value="dashboard" className="gap-2 flex-1 text-xs py-2">
            <LayoutDashboard className="w-3.5 h-3.5" /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2 flex-1 text-xs py-2">
            <FileText className="w-3.5 h-3.5" /> Documentos ({documentos.length})
          </TabsTrigger>
          <TabsTrigger value="modelos" className="gap-2 flex-1 text-xs py-2">
            <Copy className="w-3.5 h-3.5" /> Minutas e Modelos
          </TabsTrigger>
          <TabsTrigger value="certificados" className="gap-2 flex-1 text-xs py-2">
            <Award className="w-3.5 h-3.5" /> Gov.br & ICP-Brasil
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="outline-none m-0">
          <AssinaturasDashboard 
            documentos={documentos}
            onNovoDocumento={() => setNovoDocSheetOpen(true)}
            onVerDocumentos={() => setActiveTab("documentos")}
          />
        </TabsContent>

        <TabsContent value="documentos" className="outline-none m-0">
          <DocumentosLista 
            documentos={documentos}
            onNovoDocumento={() => setNovoDocSheetOpen(true)}
            onAssinar={handleAbrirAssinatura}
            onVerAuditoria={handleAbrirAuditoria}
            onCancelar={cancelarDocumento}
          />
        </TabsContent>

        <TabsContent value="modelos" className="outline-none m-0">
          <ModelosDocumentos 
            modelos={modelos}
            onUsarModelo={handleUsarModelo}
          />
        </TabsContent>

        <TabsContent value="certificados" className="outline-none m-0">
          <CertificadosManager 
            certificados={certificados}
          />
        </TabsContent>
      </Tabs>

      {/* Sheets e Modais Interativos */}
      <NovoDocumentoSheet 
        isOpen={novoDocSheetOpen}
        onClose={() => setNovoDocSheetOpen(false)}
        onSubmit={addDocumento}
      />

      <ModalAssinarDocumento 
        isOpen={modalAssinarOpen}
        onClose={() => setModalAssinarOpen(false)}
        documento={docSelecionado}
        onAssinarSucesso={assinarDocumento}
      />

      <ModalTrilhaAuditoria 
        isOpen={modalAuditoriaOpen}
        onClose={() => setModalAuditoriaOpen(false)}
        documento={docSelecionado}
      />

    </div>
  );
}

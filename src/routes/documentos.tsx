import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DmsDashboard } from "@/features/documentos/components/DmsDashboard";
import { DmsExplorerView } from "@/features/documentos/components/DmsExplorerView";
import { DmsTrashView } from "@/features/documentos/components/DmsTrashView";
import { DmsAuditView } from "@/features/documentos/components/DmsAuditView";
import { DmsUploadSheet } from "@/features/documentos/components/DmsUploadSheet";
import { FolderGit2, LayoutGrid, HardDrive, Trash2, ShieldCheck, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/documentos")({
  component: CentralDocumentacaoPage,
});

function CentralDocumentacaoPage() {
  const [activeTab, setActiveTab] = useState("explorador");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Cabeçalho da Central de Documentação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Central de Documentação</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Único repositório corporativo de armazenamento, versionamento, permissões e auditoria do Focus Finance.
          </p>
        </div>
      </div>

      {/* Navegação por Abas */}
      <Tabs defaultValue="explorador" className="space-y-6 mt-2" onValueChange={setActiveTab}>
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="explorador" className="gap-2 text-orange-600 font-semibold shrink-0">
              <HardDrive className="w-4 h-4" /> Explorador de Arquivos
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0">
              <LayoutGrid className="w-4 h-4" /> Dashboard DMS
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-2 shrink-0">
              <ShieldCheck className="w-4 h-4" /> Auditoria & Logs
            </TabsTrigger>
            <TabsTrigger value="lixeira" className="gap-2 shrink-0">
              <Trash2 className="w-4 h-4" /> Lixeira
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="explorador" className="space-y-4 outline-none">
          <DmsExplorerView />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <DmsDashboard />
        </TabsContent>

        <TabsContent value="auditoria" className="space-y-4 outline-none">
          <DmsAuditView />
        </TabsContent>

        <TabsContent value="lixeira" className="space-y-4 outline-none">
          <DmsTrashView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, Filter, Folder, Image as ImageIcon, FileText, Video, Palette, Download, UploadCloud, Copy } from 'lucide-react';
import { toast } from "sonner";
import { useLocalStorageState } from "@/hooks/useDataStore";

export interface AtivoMidia {
  id: string;
  nome: string;
  tipo: string;
  tamanho: string;
  data: string;
  cor?: string;
}

export function AtivosMidiaView() {
  const [activeTab, setActiveTab] = useState("midia");
  const [searchTerm, setSearchTerm] = useState("");

  const { data: arquivos } = useLocalStorageState<AtivoMidia>('focus_marketing_midias');

  const filteredArquivos = arquivos.filter(a => 
    a.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const brandColors = [
    { name: "Primary", hex: "#0f172a" },
    { name: "Secondary", hex: "#334155" },
    { name: "Accent", hex: "#3b82f6" },
    { name: "Success", hex: "#10b981" },
    { name: "Warning", hex: "#f59e0b" },
    { name: "Danger", hex: "#ef4444" },
  ];

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copiado: ${text}`);
  };

  const renderIcon = (tipo: string) => {
    switch (tipo) {
      case 'image': return <ImageIcon className="w-8 h-8 text-blue-500" />;
      case 'video': return <Video className="w-8 h-8 text-purple-500" />;
      case 'document': return <FileText className="w-8 h-8 text-orange-500" />;
      default: return <Folder className="w-8 h-8 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex justify-between items-center pb-2 border-b">
        <div>
          <h3 className="font-medium text-lg">Ativos e Brand Center</h3>
          <p className="text-sm text-muted-foreground">Repositório de mídias, documentos e diretrizes de marca.</p>
        </div>
        <Button className="gap-2"><UploadCloud className="w-4 h-4"/> Fazer Upload</Button>
      </div>

      <Tabs defaultValue="midia" className="space-y-4" onValueChange={setActiveTab}>
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="midia" className="gap-2 shrink-0 whitespace-nowrap"><ImageIcon className="w-4 h-4"/> Biblioteca de Mídia</TabsTrigger>
            <TabsTrigger value="brand" className="gap-2 shrink-0 whitespace-nowrap"><Palette className="w-4 h-4"/> Brand Center</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="midia" className="space-y-4 m-0 pt-4">
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar arquivos..." 
                className="pl-8" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="gap-2"><Filter className="w-4 h-4"/> Filtros</Button>
          </div>

          {filteredArquivos.length === 0 ? (
            <div className="border border-dashed rounded-lg p-12 text-center text-muted-foreground">
              <Folder className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="font-medium">Nenhum arquivo na biblioteca.</p>
              <p className="text-xs mt-1">Clique em "Fazer Upload" para adicionar mídias ou documentos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {filteredArquivos.map((arquivo) => (
                <Card key={arquivo.id} className="hover:border-primary/50 transition-colors group cursor-pointer">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                    <div className={`p-4 rounded-full mb-3 ${arquivo.cor || 'bg-muted'}`}>
                      {renderIcon(arquivo.tipo)}
                    </div>
                    <h4 className="text-sm font-medium truncate w-full" title={arquivo.nome}>{arquivo.nome}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{arquivo.tamanho} • {new Date(arquivo.data).toLocaleDateString('pt-BR')}</p>
                    
                    <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="secondary" className="h-7 w-7"><Download className="w-3 h-3"/></Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="brand" className="space-y-6 m-0 pt-4">
          <div>
            <h4 className="font-medium text-base mb-3">Cores Oficiais da Marca</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {brandColors.map((color) => (
                <div key={color.hex} className="border rounded-lg overflow-hidden group">
                  <div className="h-24 w-full relative" style={{ backgroundColor: color.hex }}>
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Button size="icon" variant="secondary" onClick={() => copyToClipboard(color.hex)}><Copy className="w-4 h-4"/></Button>
                    </div>
                  </div>
                  <div className="p-3 bg-card">
                    <p className="font-medium text-sm">{color.name}</p>
                    <p className="text-xs text-muted-foreground uppercase">{color.hex}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-6">
            <h4 className="font-medium text-base mb-3">Tipografia</h4>
            <div className="space-y-4">
               <div className="border rounded-lg p-4 bg-card">
                 <div className="flex justify-between items-center border-b pb-2 mb-2">
                   <span className="font-medium">Inter (Google Fonts)</span>
                   <Badge variant="outline">Fonte Principal</Badge>
                 </div>
                 <h1 className="text-4xl font-bold mb-2">Heading 1</h1>
                 <h2 className="text-2xl font-semibold mb-2">Heading 2</h2>
                 <p className="text-base text-muted-foreground">The quick brown fox jumps over the lazy dog. Texto de parágrafo regular com 16px.</p>
               </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

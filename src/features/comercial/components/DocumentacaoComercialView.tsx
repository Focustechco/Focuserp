import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PropostasComerciaisView } from './PropostasComerciaisView';
import { ScriptsVendaView } from './ScriptsVendaView';
import { EstrategiasVendaView } from './EstrategiasVendaView';
import { PlaybooksView } from './PlaybooksView';
import { 
  FileText, Zap, Layers, BookOpen, FolderOpen 
} from 'lucide-react';

export function DocumentacaoComercialView() {
  const [activeSubTab, setActiveSubTab] = useState('propostas');

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      {/* Header da Central de Documentação */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <FolderOpen className="w-5 h-5 text-orange-500" /> Central de Documentação Comercial
          </h3>
          <p className="text-xs text-muted-foreground">
            Repositório unificado de propostas corporativas, scripts de abordagem, estratégias de venda e playbooks operacionais.
          </p>
        </div>
      </div>

      {/* Sub-navegação interna por abas */}
      <Tabs defaultValue="propostas" value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4">
        <div className="border-b pb-1 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/60 p-1 flex w-max justify-start gap-1">
            <TabsTrigger value="propostas" className="gap-2 shrink-0 font-medium text-xs">
              <FileText className="w-3.5 h-3.5" /> Propostas Comerciais
            </TabsTrigger>
            <TabsTrigger value="scripts" className="gap-2 shrink-0 font-medium text-xs">
              <Zap className="w-3.5 h-3.5" /> Scripts de Venda
            </TabsTrigger>
            <TabsTrigger value="estrategias" className="gap-2 shrink-0 font-medium text-xs">
              <Layers className="w-3.5 h-3.5" /> Estratégias Comerciais
            </TabsTrigger>
            <TabsTrigger value="playbooks" className="gap-2 shrink-0 font-medium text-xs">
              <BookOpen className="w-3.5 h-3.5" /> Playbooks
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="propostas" className="space-y-4 outline-none">
          <PropostasComerciaisView />
        </TabsContent>

        <TabsContent value="scripts" className="space-y-4 outline-none">
          <ScriptsVendaView />
        </TabsContent>

        <TabsContent value="estrategias" className="space-y-4 outline-none">
          <EstrategiasVendaView />
        </TabsContent>

        <TabsContent value="playbooks" className="space-y-4 outline-none">
          <PlaybooksView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import React, { useState } from 'react';
import {
  Package,
  Laptop,
  KeyRound,
  DollarSign,
  History,
  ClipboardList,
  Wrench,
  LayoutDashboard,
  FileText,
  Boxes,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardView } from './DashboardView';
import { EstoqueView } from './EstoqueView';
import { EquipamentosView } from './EquipamentosView';
import { LicencasView } from './LicencasView';
import { PatrimonioView } from './PatrimonioView';
import { MovimentacoesView } from './MovimentacoesView';
import { InventarioView } from './InventarioView';
import { ManutencoesView } from './ManutencoesView';
import { RelatoriosModal } from './RelatoriosModal';

export function EstoquePatrimonioScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRelatoriosOpen, setIsRelatoriosOpen] = useState(false);

  return (
    <div className="flex-1 space-y-6 p-4 md:p-8 pt-6 max-w-7xl mx-auto">
      {/* HEADER DA PLATAFORMA ITAM */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Boxes className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-foreground">
                Estoque e Patrimônio (IT Asset Management)
              </h1>
              <p className="text-xs text-muted-foreground">
                Gestão completa de ciclo de vida de ativos físicos e digitais, licenças SaaS e depreciação patrimonial
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsRelatoriosOpen(true)}
            className="gap-2 text-xs font-semibold"
          >
            <FileText className="h-4 w-4 text-primary" /> Relatórios Executivos & CSV
          </Button>
        </div>
      </div>

      {/* TABS DE NAVEGAÇÃO E SUBMÓDULOS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted/60 p-1 flex flex-wrap h-auto gap-1 border border-border/60 rounded-xl">
          <TabsTrigger value="dashboard" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background">
            <LayoutDashboard className="h-3.5 w-3.5" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="estoque" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background">
            <Package className="h-3.5 w-3.5" /> Estoque Físico
          </TabsTrigger>
          <TabsTrigger value="equipamentos" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background">
            <Laptop className="h-3.5 w-3.5" /> Equipamentos
          </TabsTrigger>
          <TabsTrigger value="licencas" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background">
            <KeyRound className="h-3.5 w-3.5" /> Licenças SaaS
          </TabsTrigger>
          <TabsTrigger value="patrimonio" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background">
            <DollarSign className="h-3.5 w-3.5" /> Patrimônio
          </TabsTrigger>
          <TabsTrigger value="movimentacoes" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background">
            <History className="h-3.5 w-3.5" /> Movimentações
          </TabsTrigger>
          <TabsTrigger value="inventario" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background">
            <ClipboardList className="h-3.5 w-3.5" /> Inventários
          </TabsTrigger>
          <TabsTrigger value="manutencoes" className="text-xs gap-1.5 py-2 px-3 data-[state=active]:bg-background">
            <Wrench className="h-3.5 w-3.5" /> Manutenções
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="m-0 focus-visible:outline-none">
          <DashboardView onNavigateTab={setActiveTab} />
        </TabsContent>

        <TabsContent value="estoque" className="m-0 focus-visible:outline-none">
          <EstoqueView />
        </TabsContent>

        <TabsContent value="equipamentos" className="m-0 focus-visible:outline-none">
          <EquipamentosView />
        </TabsContent>

        <TabsContent value="licencas" className="m-0 focus-visible:outline-none">
          <LicencasView />
        </TabsContent>

        <TabsContent value="patrimonio" className="m-0 focus-visible:outline-none">
          <PatrimonioView />
        </TabsContent>

        <TabsContent value="movimentacoes" className="m-0 focus-visible:outline-none">
          <MovimentacoesView />
        </TabsContent>

        <TabsContent value="inventario" className="m-0 focus-visible:outline-none">
          <InventarioView />
        </TabsContent>

        <TabsContent value="manutencoes" className="m-0 focus-visible:outline-none">
          <ManutencoesView />
        </TabsContent>
      </Tabs>

      {/* MODAL DE RELATÓRIOS */}
      <RelatoriosModal open={isRelatoriosOpen} onOpenChange={setIsRelatoriosOpen} />
    </div>
  );
}

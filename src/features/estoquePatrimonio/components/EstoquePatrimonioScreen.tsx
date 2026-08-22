import React, { useState } from 'react';
import {
  Package,
  Laptop,
  KeyRound,
  DollarSign,
  History,
  Wrench,
  LayoutDashboard,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DashboardView } from './DashboardView';
import { EstoqueView } from './EstoqueView';
import { EquipamentosView } from './EquipamentosView';
import { LicencasView } from './LicencasView';
import { PatrimonioView } from './PatrimonioView';
import { MovimentacoesView } from './MovimentacoesView';
import { ManutencoesView } from './ManutencoesView';
import { RelatoriosModal } from './RelatoriosModal';

export function EstoquePatrimonioScreen() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isRelatoriosOpen, setIsRelatoriosOpen] = useState(false);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      {/* HEADER PADRONIZADO DO ERP */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Estoque e Patrimônio</h1>
          <p className="text-muted-foreground mt-1">
            Gestão de ciclo de vida de ativos físicos e digitais, licenças SaaS e controle patrimonial.
          </p>
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
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="dashboard" className="gap-2 shrink-0 text-xs">
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="estoque" className="gap-2 shrink-0 text-xs">
              <Package className="h-4 w-4" /> Estoque Físico
            </TabsTrigger>
            <TabsTrigger value="equipamentos" className="gap-2 shrink-0 text-xs">
              <Laptop className="h-4 w-4" /> Equipamentos
            </TabsTrigger>
            <TabsTrigger value="licencas" className="gap-2 shrink-0 text-xs">
              <KeyRound className="h-4 w-4" /> Licenças SaaS
            </TabsTrigger>
            <TabsTrigger value="patrimonio" className="gap-2 shrink-0 text-xs">
              <DollarSign className="h-4 w-4" /> Patrimônio
            </TabsTrigger>
            <TabsTrigger value="movimentacoes" className="gap-2 shrink-0 text-xs">
              <History className="h-4 w-4" /> Movimentações
            </TabsTrigger>
            <TabsTrigger value="manutencoes" className="gap-2 shrink-0 text-xs">
              <Wrench className="h-4 w-4" /> Manutenções
            </TabsTrigger>
          </TabsList>
        </div>

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

        <TabsContent value="manutencoes" className="m-0 focus-visible:outline-none">
          <ManutencoesView />
        </TabsContent>
      </Tabs>

      {/* MODAL DE RELATÓRIOS */}
      <RelatoriosModal open={isRelatoriosOpen} onOpenChange={setIsRelatoriosOpen} />
    </div>
  );
}

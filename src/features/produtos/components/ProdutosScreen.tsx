import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProdutos } from '../useProdutos';
import { DashboardExecutivo } from './DashboardExecutivo';
import { CatalogoProdutos } from './CatalogoProdutos';
import { WorkspaceProduto } from './WorkspaceProduto';
import { ProdutoFocus } from '../types';
import { Boxes, LayoutDashboard, Sparkles, Layers } from 'lucide-react';

export function ProdutosScreen() {
  const {
    produtos,
    clientes,
    criarNovoProduto,
    updateProduto,
    addRoadmapItem,
    updateRoadmapItemStatus,
    addFuncionalidade,
    addRelease,
    getMetricasProduto,
  } = useProdutos();

  const [mainTab, setMainTab] = useState<'catalogo' | 'dashboard' | 'workspace'>('catalogo');
  const [selectedProduto, setSelectedProduto] = useState<ProdutoFocus | null>(null);

  const handleSelectProduto = (p: ProdutoFocus) => {
    setSelectedProduto(p);
    setMainTab('workspace');
  };

  const handleBackToCatalogo = () => {
    setSelectedProduto(null);
    setMainTab('catalogo');
  };

  const handleUpdateProduto = (id: string, changes: Partial<ProdutoFocus>) => {
    updateProduto(id, changes);
    // Se o produto editado é o selecionado no workspace, atualiza o estado local
    if (selectedProduto && selectedProduto.id === id) {
      setSelectedProduto((prev) => prev ? { ...prev, ...changes } : prev);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* HEADER PRINCIPAL DO MÓDULO PRODUTOS FOCUS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Boxes className="h-8 w-8 text-primary" /> Produtos Focus
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Central de gestão do ecossistema de softwares da Focus Tecnologia: ciclo de vida, roadmap, releases, clientes e métricas
          </p>
        </div>
      </div>

      {/* SEPARADOR DE ABAS PRINCIPAIS */}
      <Tabs value={mainTab} onValueChange={(val: any) => setMainTab(val)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-[450px]">
          <TabsTrigger value="catalogo" className="text-xs font-semibold gap-1.5">
            <Boxes className="h-4 w-4" /> Catálogo
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="text-xs font-semibold gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Dashboard Executivo
          </TabsTrigger>
          <TabsTrigger value="workspace" disabled={!selectedProduto} className="text-xs font-semibold gap-1.5">
            <Sparkles className="h-4 w-4" /> Workspace {selectedProduto ? `(${selectedProduto.nome})` : ''}
          </TabsTrigger>
        </TabsList>

        {/* CONTEÚDO DA ABA 1: CATÁLOGO */}
        <TabsContent value="catalogo" className="space-y-4 outline-none">
          <CatalogoProdutos
            produtos={produtos}
            onSelectProduto={handleSelectProduto}
            onAddProduto={criarNovoProduto}
            onUpdateProduto={handleUpdateProduto}
          />
        </TabsContent>

        {/* CONTEÚDO DA ABA 2: DASHBOARD EXECUTIVO */}
        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <DashboardExecutivo produtos={produtos} clientesCount={clientes.length} />
        </TabsContent>

        {/* CONTEÚDO DA ABA 3: WORKSPACE EXCLUSIVO DO PRODUTO */}
        <TabsContent value="workspace" className="space-y-4 outline-none">
          {selectedProduto ? (
            <WorkspaceProduto
              produto={selectedProduto}
              metricas={getMetricasProduto(selectedProduto)}
              onBack={handleBackToCatalogo}
              onAddRoadmap={addRoadmapItem}
              onUpdateRoadmapStatus={updateRoadmapItemStatus}
              onAddFuncionalidade={addFuncionalidade}
              onAddRelease={addRelease}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              Selecione um produto no catálogo para abrir seu Workspace exclusivo.
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

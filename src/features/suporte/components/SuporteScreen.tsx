import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSuporte } from '../useSuporte';
import { DashboardExecutivoSuporte } from './DashboardExecutivoSuporte';
import { ChamadosList } from './ChamadosList';
import { WorkspaceChamado } from './WorkspaceChamado';
import { BaseConhecimentoView } from './BaseConhecimentoView';
import { NovoChamadoModal } from './NovoChamadoModal';
import { ChamadoSuporte } from '../types';
import { Headphones, LayoutDashboard, BookOpen, MessageSquare, Plus } from 'lucide-react';

export function SuporteScreen() {
  const {
    chamados,
    clientes,
    produtos,
    projetos,
    csCustomers,
    artigosKB,
    mensagens,
    timelineEvents,
    abrirNovoChamado,
    responderChamado,
    converterEmTarefaDev,
    getCsContextDoCliente,
  } = useSuporte();

  const [mainTab, setMainTab] = useState<'chamados' | 'dashboard' | 'kb' | 'workspace_individual'>('chamados');
  const [selectedChamado, setSelectedChamado] = useState<ChamadoSuporte | null>(null);
  const [isNovoModalOpen, setIsNovoModalOpen] = useState(false);

  const handleSelectChamado = (chamado: ChamadoSuporte) => {
    setSelectedChamado(chamado);
    setMainTab('workspace_individual');
  };

  const handleBackToChamados = () => {
    setSelectedChamado(null);
    setMainTab('chamados');
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-3">
            <Headphones className="h-8 w-8 text-primary" /> Suporte (Central)
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Central de suporte tcnico, solicitaes, incidentes, SLAs, base de conhecimento e integrao com Desenvolvimento
          </p>
        </div>
      </div>

      {/* TABS PRINCIPAIS */}
      <Tabs value={mainTab} onValueChange={(val: any) => setMainTab(val)} className="space-y-6">
        <div className="w-full overflow-x-auto scrollbar-hide border-b pb-1">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="chamados" className="text-xs font-semibold gap-1.5 shrink-0">
              <Headphones className="h-4 w-4" /> Fila de Chamados
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="text-xs font-semibold gap-1.5 shrink-0">
              <LayoutDashboard className="h-4 w-4" /> Dashboard ITSM
            </TabsTrigger>
            <TabsTrigger value="kb" className="text-xs font-semibold gap-1.5 shrink-0">
              <BookOpen className="h-4 w-4" /> Base de Conhecimento
            </TabsTrigger>
            <TabsTrigger value="workspace_individual" disabled={!selectedChamado} className="text-xs font-semibold gap-1.5 shrink-0">
              <MessageSquare className="h-4 w-4" /> Workspace {selectedChamado ? `(${selectedChamado.numero})` : ''}
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ABA 1: FILA DE CHAMADOS */}
        <TabsContent value="chamados" className="space-y-4 outline-none">
          <ChamadosList
            chamados={chamados}
            onSelectChamado={handleSelectChamado}
            onOpenNovoModal={() => setIsNovoModalOpen(true)}
          />
        </TabsContent>

        {/* ABA 2: DASHBOARD EXECUTIVO ITSM */}
        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <DashboardExecutivoSuporte chamados={chamados} />
        </TabsContent>

        {/* ABA 3: BASE DE CONHECIMENTO */}
        <TabsContent value="kb" className="space-y-4 outline-none">
          <BaseConhecimentoView artigos={artigosKB} />
        </TabsContent>

        {/* ABA 4: WORKSPACE DO CHAMADO SELECIONADO */}
        <TabsContent value="workspace_individual" className="space-y-4 outline-none">
          {selectedChamado ? (
            <WorkspaceChamado
              chamado={selectedChamado}
              mensagens={mensagens}
              timelineEvents={timelineEvents}
              csContext={getCsContextDoCliente(selectedChamado.clienteId)}
              projetos={projetos}
              artigosKB={artigosKB}
              onBack={handleBackToChamados}
              onResponder={responderChamado}
              onConverterDev={converterEmTarefaDev}
            />
          ) : (
            <div className="p-8 text-center text-muted-foreground text-xs">
              Selecione um chamado na fila para abrir o Workspace de Atendimento.
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL DE CRIAO */}
      <NovoChamadoModal
        open={isNovoModalOpen}
        onOpenChange={setIsNovoModalOpen}
        clientes={clientes}
        produtos={produtos}
        projetos={projetos}
        onAbrirChamado={abrirNovoChamado}
      />
    </div>
  );
}

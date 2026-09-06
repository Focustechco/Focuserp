import React, { useState } from 'react';
import {
  Users, PieChart, Palmtree, Heart, Target,
  GraduationCap, UserPlus, Network, Search, Filter, Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ColaboradoresTable } from './ColaboradoresTable';
import { OrganogramaView } from './OrganogramaView';
import { RhDashboard } from './RhDashboard';
import { RhFeriasView } from './RhFeriasView';
import { RhBeneficiosView } from './RhBeneficiosView';
import { RhDesempenhoView } from './RhDesempenhoView';
import { RhTreinamentosView } from './RhTreinamentosView';
import { RhOnboardingView } from './RhOnboardingView';
import { ColaboradorSheet } from './ColaboradorSheet';
import { Colaborador } from '../types';
import { useColaboradoresQuery } from '../hooks/useColaboradoresQuery';

export function MobileRhView() {
  const { colaboradores } = useColaboradoresQuery();

  const [activeTab, setActiveTab] = useState<
    'diretorio' | 'dashboard' | 'ferias' | 'beneficios' | 'desempenho' | 'treinamentos' | 'onboarding'
  >('diretorio');
  const [diretorioSubTab, setDiretorioSubTab] = useState<'lista' | 'organograma'>('lista');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modal / Sheet State
  const [sheetOpen, setSheetOpen] = useState(false);
  const [colabParaEditar, setColabParaEditar] = useState<Colaborador | null>(null);

  const handleNewClick = () => {
    setColabParaEditar(null);
    setSheetOpen(true);
  };

  const handleEditClick = (colab: Colaborador) => {
    setColabParaEditar(colab);
    setSheetOpen(true);
  };

  const sections = [
    { id: 'diretorio', label: `Diretório (${colaboradores.length})`, icon: Users },
    { id: 'dashboard', label: 'Painel Executivo', icon: PieChart },
    { id: 'ferias', label: 'Férias & Ausências', icon: Palmtree },
    { id: 'beneficios', label: 'Benefícios', icon: Heart },
    { id: 'desempenho', label: 'Feedbacks', icon: Target },
    { id: 'treinamentos', label: 'Treinamentos', icon: GraduationCap },
    { id: 'onboarding', label: 'Onboarding', icon: UserPlus },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. STICKY TOP BAR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          {/* Seletor Rápido de Seção Drawer */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-muted-foreground/20 text-xs font-medium flex items-center gap-1.5 flex-1 justify-start"
              >
                <Filter className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="truncate">
                  {sections.find((s) => s.id === activeTab)?.label}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b text-left">
                <SheetTitle className="text-base font-bold">Módulos de Recursos Humanos</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Gestão de pessoas, folha, férias, benefícios, treinamentos e desempenho
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-2 gap-2 py-4 text-xs">
                {sections.map((sec) => {
                  const Icon = sec.icon;
                  const isCurrent = activeTab === sec.id;
                  return (
                    <Button
                      key={sec.id}
                      type="button"
                      variant={isCurrent ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setActiveTab(sec.id as any);
                        setFilterSheetOpen(false);
                      }}
                      className={`h-11 justify-start gap-2 text-xs rounded-xl ${
                        isCurrent ? 'bg-primary text-white font-bold' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="truncate">{sec.label}</span>
                    </Button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Novo Colaborador */}
          <Button
            onClick={handleNewClick}
            size="sm"
            className="h-9 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl gap-1 shadow-xs shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Colaborador
          </Button>
        </div>

        {/* Horizontal Section Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveTab(sec.id as any)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border shrink-0 flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-primary text-white border-primary font-semibold shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTEÚDO DA SEÇÃO ATIVA */}
      <div className="p-3.5 space-y-4">
        {/* ABA: DIRETÓRIO */}
        {activeTab === 'diretorio' && (
          <div className="space-y-3">
            {/* Barra de Busca + Toggle Lista / Organograma */}
            <div className="flex flex-col gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar colaborador, cargo, depto, PIX..."
                  className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs p-1"
                  >
                    ✕
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl">
                <button
                  onClick={() => setDiretorioSubTab('lista')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    diretorioSubTab === 'lista'
                      ? 'bg-background shadow-xs text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" /> Lista
                </button>
                <button
                  onClick={() => setDiretorioSubTab('organograma')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                    diretorioSubTab === 'organograma'
                      ? 'bg-background shadow-xs text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Network className="w-3.5 h-3.5" /> Organograma
                </button>
              </div>
            </div>

            {diretorioSubTab === 'lista' ? (
              <ColaboradoresTable
                searchTerm={searchTerm}
                onNewClick={handleNewClick}
                onEditClick={handleEditClick}
                hideToolbar
              />
            ) : (
              <OrganogramaView />
            )}
          </div>
        )}

        {/* ABA: PAINEL EXECUTIVO */}
        {activeTab === 'dashboard' && (
          <RhDashboard />
        )}

        {/* ABA: FÉRIAS & AUSÊNCIAS */}
        {activeTab === 'ferias' && (
          <RhFeriasView />
        )}

        {/* ABA: BENEFÍCIOS CORPORATIVOS */}
        {activeTab === 'beneficios' && (
          <RhBeneficiosView />
        )}

        {/* ABA: FEEDBACKS & DESEMPENHO */}
        {activeTab === 'desempenho' && (
          <RhDesempenhoView />
        )}

        {/* ABA: TREINAMENTOS (L&D) */}
        {activeTab === 'treinamentos' && (
          <RhTreinamentosView />
        )}

        {/* ABA: ADMISSÃO & ONBOARDING */}
        {activeTab === 'onboarding' && (
          <RhOnboardingView />
        )}
      </div>

      {/* Sheet de Criação / Edição de Colaborador */}
      <ColaboradorSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        colaboradorParaEditar={colabParaEditar}
      />
    </div>
  );
}

import React, { useState } from 'react';
import { FolderKanban, CalendarDays, LayoutGrid, Plus, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';
import { ProjetosList } from './ProjetosList';
import { Dashboard } from './Dashboard';
import { MobileAgendaEntregasView } from '../agenda/MobileAgendaEntregasView';
import { NovoProjetoSheet } from './NovoProjetoSheet';

export function MobileProjetosView() {
  const [activeTab, setActiveTab] = useState<'lista' | 'agenda' | 'dashboard'>('lista');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const sections = [
    { id: 'lista', label: 'Lista de Projetos', icon: FolderKanban },
    { id: 'agenda', label: 'Agenda de Entregas', icon: CalendarDays },
    { id: 'dashboard', label: 'Dashboard PMO', icon: LayoutGrid },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. STICKY TOP BAR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          {/* Seletor Rápido de Seção */}
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
                <SheetTitle className="text-base font-bold">Seções de Projetos (PMO)</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Alterne entre listagem de projetos, agenda de entregas e indicadores do portfólio.
                </SheetDescription>
              </SheetHeader>

              <div className="grid grid-cols-1 gap-2 py-4">
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
                      className={`h-11 justify-start gap-2.5 text-xs rounded-xl ${
                        isCurrent ? 'bg-primary text-white font-bold' : ''
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {sec.label}
                    </Button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* Botão Novo Projeto */}
          <NovoProjetoSheet>
            <Button
              size="sm"
              className="h-9 px-3 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl gap-1 shadow-xs shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Projeto
            </Button>
          </NovoProjetoSheet>
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
        {activeTab === 'lista' && (
          <ProjetosList />
        )}

        {activeTab === 'agenda' && (
          <MobileAgendaEntregasView />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard />
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Activity, Wallet, Target, Users, Building2, UserCheck,
  Settings, Briefcase, Search, Filter
} from 'lucide-react';
import { VisaoGeralTab } from './VisaoGeralTab';
import { FinanceiroTab } from './FinanceiroTab';
import { ComercialTab } from './ComercialTab';
import { RhTab } from './RhTab';
import { FornecedoresTab } from './FornecedoresTab';
import { ClientesTab } from './ClientesTab';
import { MetricasSaaSTab } from './MetricasSaaSTab';
import { ProjetosTab } from './ProjetosTab';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';

export function MobileIndicadoresView() {
  const [activeTab, setActiveTab] = useState<
    'global' | 'financeiro' | 'comercial' | 'rh' | 'fornecedores' | 'clientes' | 'softwares' | 'projetos'
  >('global');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const sections = [
    { id: 'global', label: 'Visão Global', icon: Activity },
    { id: 'financeiro', label: 'Financeiro', icon: Wallet },
    { id: 'comercial', label: 'Comercial', icon: Target },
    { id: 'rh', label: 'Recursos Humanos', icon: Users },
    { id: 'fornecedores', label: 'Fornecedores', icon: Building2 },
    { id: 'clientes', label: 'Clientes', icon: UserCheck },
    { id: 'softwares', label: 'Softwares & SaaS', icon: Settings },
    { id: 'projetos', label: 'Projetos', icon: Briefcase },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* 1. STICKY SEARCH & SECTION SELECTOR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar seção de indicadores..."
              className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20 focus-visible:ring-1 focus-visible:ring-primary"
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

          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-xl shrink-0 border-muted-foreground/20 text-muted-foreground hover:text-foreground relative"
                aria-label="Selecionar Seção"
              >
                <Filter className="w-4 h-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] p-4">
              <SheetHeader className="pb-3 border-b">
                <SheetTitle className="text-base font-bold text-left">Seções de Indicadores</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground text-left">
                  Escolha o painel estratégico de indicadores que deseja analisar.
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
                      className={`text-xs h-10 justify-start gap-2 ${isCurrent ? 'bg-primary text-white font-bold' : ''}`}
                    >
                      <Icon className="w-4 h-4" />
                      {sec.label}
                    </Button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Horizontal Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {sections
            .filter((sec) => !searchTerm || sec.label.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((sec) => {
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

      {/* 2. RENDERIZAÇÃO DA SEÇÃO ATIVA COM TODOS OS GRÁFICOS */}
      <div className="p-3.5 space-y-4">
        {activeTab === 'global' && <VisaoGeralTab />}
        {activeTab === 'financeiro' && <FinanceiroTab />}
        {activeTab === 'comercial' && <ComercialTab />}
        {activeTab === 'rh' && <RhTab />}
        {activeTab === 'fornecedores' && <FornecedoresTab />}
        {activeTab === 'clientes' && <ClientesTab />}
        {activeTab === 'softwares' && <MetricasSaaSTab />}
        {activeTab === 'projetos' && <ProjetosTab />}
      </div>
    </div>
  );
}

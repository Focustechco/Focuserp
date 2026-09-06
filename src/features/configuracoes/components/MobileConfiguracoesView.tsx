import React, { useState } from 'react';
import {
  Building2,
  Palette,
  SlidersHorizontal,
  Bell,
  ShieldCheck,
  Key,
  HardDrive,
  History,
  LayoutDashboard,
  Search,
  Filter,
  Hash,
  Webhook,
  ScrollText,
  Server
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetDescription } from '@/components/ui/sheet';

import { ConfigEmpresa } from './ConfigEmpresa';
import { ConfigIdentidadeVisual } from './ConfigIdentidadeVisual';
import { ConfigPreferenciasGlobais } from './ConfigPreferenciasGlobais';
import { ConfigNumeracao } from './ConfigNumeracao';
import { ConfigCentralComunicacao } from './ConfigCentralComunicacao';
import { ConfigSeguranca } from './ConfigSeguranca';
import { ConfigApis } from './ConfigApis';
import { ConfigWebhooks } from './ConfigWebhooks';
import { ConfigBackup } from './ConfigBackup';
import { ConfigLogsAuditoria } from './ConfigLogsAuditoria';
import { ConfigDashboard } from './ConfigDashboard';

export function MobileConfiguracoesView() {
  const [activeTab, setActiveTab] = useState<
    'empresa' | 'identidade' | 'preferencias' | 'comunicacao' | 'seguranca' | 'integracoes' | 'backup' | 'auditoria' | 'dashboard'
  >('empresa');

  // Sub-tabs para seções compostas
  const [preferenciasSubTab, setPreferenciasSubTab] = useState<'gerais' | 'numeracao'>('gerais');
  const [integracoesSubTab, setIntegracoesSubTab] = useState<'apis' | 'webhooks'>('apis');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  const sections = [
    { id: 'empresa', label: 'Empresa & Institucional', icon: Building2, desc: 'Dados fiscais, CNPJ, logo e endereço' },
    { id: 'identidade', label: 'Identidade Visual', icon: Palette, desc: 'Cores da marca, modo escuro e tema' },
    { id: 'preferencias', label: 'Preferências & Numeração', icon: SlidersHorizontal, desc: 'Moedas, timezone e numeração' },
    { id: 'comunicacao', label: 'Central de Comunicação', icon: Bell, desc: 'SMTP, e-mails e WhatsApp' },
    { id: 'seguranca', label: 'Segurança & Acessos', icon: ShieldCheck, desc: '2FA, senhas e sessões ativas' },
    { id: 'integracoes', label: 'APIs & Webhooks', icon: Key, desc: 'Tokens REST e disparo de webhooks' },
    { id: 'backup', label: 'Backup & Recuperação', icon: HardDrive, desc: 'Snapshots e exportação JSON/SQL' },
    { id: 'auditoria', label: 'Logs de Auditoria', icon: History, desc: 'Trilha de ações e logs técnicos' },
    { id: 'dashboard', label: 'Status do Sistema', icon: LayoutDashboard, desc: 'Saúde da infraestrutura e cloud' },
  ];

  const filteredSections = sections.filter(
    (s) =>
      s.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.desc.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* 1. STICKY TOP SEARCH & DRAWER SELECTOR */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b px-3.5 py-2.5 space-y-2">
        <div className="flex items-center gap-2">
          {/* Seletor de Seção Drawer */}
          <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 rounded-xl border-muted-foreground/20 text-xs font-semibold flex items-center gap-2 flex-1 justify-start bg-muted/30"
              >
                <Filter className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                <span className="truncate">
                  {sections.find((s) => s.id === activeTab)?.label}
                </span>
              </Button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh] p-4 bg-background">
              <SheetHeader className="pb-3 border-b text-left">
                <SheetTitle className="text-base font-bold">Configurações da Plataforma</SheetTitle>
                <SheetDescription className="text-xs text-muted-foreground">
                  Escolha o painel administrativo que deseja configurar.
                </SheetDescription>
              </SheetHeader>

              {/* Busca interna do Drawer */}
              <div className="pt-3 pb-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filtrar seção..."
                    className="h-9 pl-9 pr-3 text-xs rounded-xl bg-muted/40 border-muted-foreground/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2 py-3 max-h-[50vh] overflow-y-auto">
                {filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  const isCurrent = activeTab === sec.id;
                  return (
                    <button
                      key={sec.id}
                      type="button"
                      onClick={() => {
                        setActiveTab(sec.id as any);
                        setFilterSheetOpen(false);
                      }}
                      className={`flex items-center gap-3 p-3 rounded-2xl border text-left transition-all active:scale-[0.99] ${
                        isCurrent
                          ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                          : 'bg-card border-border hover:bg-muted/40 text-foreground'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isCurrent ? 'bg-white/20' : 'bg-muted'}`}>
                        <Icon className={`w-4 h-4 ${isCurrent ? 'text-white' : 'text-orange-500'}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate">{sec.label}</div>
                        <div className={`text-[11px] truncate ${isCurrent ? 'text-white/80' : 'text-muted-foreground'}`}>
                          {sec.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        {/* Horizontal Pills Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide py-0.5">
          {sections.map((sec) => {
            const Icon = sec.icon;
            const isCurrent = activeTab === sec.id;
            return (
              <button
                key={sec.id}
                type="button"
                onClick={() => setActiveTab(sec.id as any)}
                className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all border shrink-0 flex items-center gap-1.5 ${
                  isCurrent
                    ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {sec.label.split('&')[0].trim()}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. CONTEÚDO PRINCIPAL ADAPTADO */}
      <div className="p-3.5 space-y-4">
        {/* 1. Empresa & Institucional */}
        {activeTab === 'empresa' && <ConfigEmpresa />}

        {/* 2. Identidade Visual */}
        {activeTab === 'identidade' && <ConfigIdentidadeVisual />}

        {/* 3. Preferências & Numeração */}
        {activeTab === 'preferencias' && (
          <div className="space-y-4">
            <div className="flex items-center p-1 bg-muted/50 rounded-xl border">
              <button
                type="button"
                onClick={() => setPreferenciasSubTab('gerais')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  preferenciasSubTab === 'gerais'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" /> Preferências Gerais
              </button>
              <button
                type="button"
                onClick={() => setPreferenciasSubTab('numeracao')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  preferenciasSubTab === 'numeracao'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Hash className="w-3.5 h-3.5" /> Numeração (IDs)
              </button>
            </div>

            {preferenciasSubTab === 'gerais' && <ConfigPreferenciasGlobais />}
            {preferenciasSubTab === 'numeracao' && <ConfigNumeracao />}
          </div>
        )}

        {/* 4. Central de Comunicação */}
        {activeTab === 'comunicacao' && <ConfigCentralComunicacao />}

        {/* 5. Segurança & Acessos */}
        {activeTab === 'seguranca' && <ConfigSeguranca />}

        {/* 6. APIs & Webhooks */}
        {activeTab === 'integracoes' && (
          <div className="space-y-4">
            <div className="flex items-center p-1 bg-muted/50 rounded-xl border">
              <button
                type="button"
                onClick={() => setIntegracoesSubTab('apis')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  integracoesSubTab === 'apis'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Key className="w-3.5 h-3.5" /> Chaves de API
              </button>
              <button
                type="button"
                onClick={() => setIntegracoesSubTab('webhooks')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
                  integracoesSubTab === 'webhooks'
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Webhook className="w-3.5 h-3.5" /> Webhooks
              </button>
            </div>

            {integracoesSubTab === 'apis' && <ConfigApis />}
            {integracoesSubTab === 'webhooks' && <ConfigWebhooks />}
          </div>
        )}

        {/* 7. Backup & Recuperação */}
        {activeTab === 'backup' && <ConfigBackup />}

        {/* 8. Logs de Auditoria */}
        {activeTab === 'auditoria' && <ConfigLogsAuditoria />}

        {/* 9. Status do Sistema */}
        {activeTab === 'dashboard' && <ConfigDashboard />}
      </div>
    </div>
  );
}

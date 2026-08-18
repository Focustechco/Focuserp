import React from 'react';
import { Building2, Palette, SlidersHorizontal, Hash, Bell, BellRing, ShieldCheck, Key, Webhook, HardDrive, ScrollText, History, LayoutDashboard } from 'lucide-react';

interface ConfiguracoesLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function ConfiguracoesLayout({ children, activeTab, onTabChange }: ConfiguracoesLayoutProps) {
  const menuItems = [
    { id: 'empresa', label: 'Empresa', icon: <Building2 className="w-4 h-4" /> },
    { id: 'identidade', label: 'Identidade Visual', icon: <Palette className="w-4 h-4" /> },
    { id: 'preferencias', label: 'Preferências Gerais', icon: <SlidersHorizontal className="w-4 h-4" /> },
    { id: 'comunicacao', label: 'Central de Comunicação', icon: <Bell className="w-4 h-4" /> },
    { id: 'numeracao', label: 'Numeração Automática', icon: <Hash className="w-4 h-4" /> },
    { id: 'notificacoes', label: 'Notificações Globais', icon: <BellRing className="w-4 h-4" /> },
    { id: 'seguranca', label: 'Segurança da Plataforma', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'apis', label: 'APIs e Chaves', icon: <Key className="w-4 h-4" /> },
    { id: 'webhooks', label: 'Webhooks', icon: <Webhook className="w-4 h-4" /> },
    { id: 'backup', label: 'Backup e Recuperação', icon: <HardDrive className="w-4 h-4" /> },
    { id: 'auditoria', label: 'Auditoria Geral', icon: <History className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Status do Sistema', icon: <LayoutDashboard className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col md:flex-row gap-6 w-full max-w-[1400px] mx-auto min-h-[calc(100vh-120px)] animate-fade-in pt-4">
      {/* Sidebar de Navegação */}
      <aside className="w-full md:w-64 lg:w-72 shrink-0">
        <nav className="flex flex-row md:flex-col gap-1.5 overflow-x-auto scrollbar-hide pb-2 md:pb-0 md:sticky md:top-6 shrink-0 w-full border-b md:border-b-0">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors text-left shrink-0 whitespace-nowrap ${
                  isActive 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Área de Conteúdo */}
      <main className="flex-1 bg-card border rounded-lg shadow-sm p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}

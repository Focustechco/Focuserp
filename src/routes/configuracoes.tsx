import React, { useState } from 'react';
import { createFileRoute } from "@tanstack/react-router";
import { ConfiguracoesLayout } from "@/features/configuracoes/components/ConfiguracoesLayout";
import { ConfigDashboard } from "@/features/configuracoes/components/ConfigDashboard";
import { ConfigEmpresa } from "@/features/configuracoes/components/ConfigEmpresa";
import { ConfigIdentidadeVisual } from "@/features/configuracoes/components/ConfigIdentidadeVisual";
import { ConfigPreferenciasGlobais } from "@/features/configuracoes/components/ConfigPreferenciasGlobais";
import { ConfigCentralComunicacao } from "@/features/configuracoes/components/ConfigCentralComunicacao";
import { ConfigNumeracao } from "@/features/configuracoes/components/ConfigNumeracao";
import { ConfigNotificacoes } from "@/features/configuracoes/components/ConfigNotificacoes";
import { ConfigSeguranca } from "@/features/configuracoes/components/ConfigSeguranca";
import { ConfigApis } from "@/features/configuracoes/components/ConfigApis";
import { ConfigWebhooks } from "@/features/configuracoes/components/ConfigWebhooks";
import { ConfigBackup } from "@/features/configuracoes/components/ConfigBackup";
import { ConfigLogsAuditoria } from "@/features/configuracoes/components/ConfigLogsAuditoria";
import { Settings } from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  const [activeTab, setActiveTab] = useState('empresa');

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <Settings className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Configurações da Plataforma</h1>
          <p className="text-muted-foreground mt-1">
            Parametrização global, segurança, central de comunicação e integrações.
          </p>
        </div>
      </div>

      <ConfiguracoesLayout activeTab={activeTab} onTabChange={setActiveTab}>
        {activeTab === 'empresa' && <ConfigEmpresa />}
        {activeTab === 'identidade' && <ConfigIdentidadeVisual />}
        {activeTab === 'preferencias' && <ConfigPreferenciasGlobais />}

        {activeTab === 'comunicacao' && <ConfigCentralComunicacao />}
        {activeTab === 'numeracao' && <ConfigNumeracao />}
        {activeTab === 'notificacoes' && <ConfigNotificacoes />}
        {activeTab === 'seguranca' && <ConfigSeguranca />}

        {activeTab === 'apis' && <ConfigApis />}
        {activeTab === 'webhooks' && <ConfigWebhooks />}
        {activeTab === 'backup' && <ConfigBackup />}
        {activeTab === 'logs' && <ConfigLogsAuditoria />}
        {activeTab === 'auditoria' && <ConfigLogsAuditoria />}

        {activeTab === 'dashboard' && (
          <ConfigDashboard />
        )}
      </ConfiguracoesLayout>
    </div>
  );
}

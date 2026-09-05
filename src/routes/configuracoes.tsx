import React, { useState } from 'react';
import { createFileRoute } from "@tanstack/react-router";
import { ConfigDashboard } from "@/features/configuracoes/components/ConfigDashboard";
import { ConfigEmpresa } from "@/features/configuracoes/components/ConfigEmpresa";
import { ConfigIdentidadeVisual } from "@/features/configuracoes/components/ConfigIdentidadeVisual";
import { ConfigPreferenciasGlobais } from "@/features/configuracoes/components/ConfigPreferenciasGlobais";
import { ConfigCentralComunicacao } from "@/features/configuracoes/components/ConfigCentralComunicacao";
import { ConfigNumeracao } from "@/features/configuracoes/components/ConfigNumeracao";
import { ConfigSeguranca } from "@/features/configuracoes/components/ConfigSeguranca";
import { ConfigApis } from "@/features/configuracoes/components/ConfigApis";
import { ConfigWebhooks } from "@/features/configuracoes/components/ConfigWebhooks";
import { ConfigBackup } from "@/features/configuracoes/components/ConfigBackup";
import { ConfigLogsAuditoria } from "@/features/configuracoes/components/ConfigLogsAuditoria";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Hash,
  Webhook
} from "lucide-react";

export const Route = createFileRoute("/configuracoes")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  return (
    <div className="flex-1 space-y-4 p-4 sm:p-6 lg:p-8 pt-6 max-w-full overflow-x-hidden animate-fade-in">
      {/* Cabeçalho Padrão do Módulo */}
      <div className="hidden md:flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-foreground">
            Configurações da Plataforma
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Parametrização institucional, identidade visual, segurança, comunicação, integrações e infraestrutura.
          </p>
        </div>
      </div>

      {/* Navegação por Abas Horizontais Padrão do ERP */}
      <Tabs defaultValue="empresa" className="space-y-4">
        <div className="border-b pb-2 w-full overflow-x-auto scrollbar-hide">
          <TabsList className="bg-muted/50 p-1 flex w-max min-w-full justify-start gap-1">
            <TabsTrigger value="empresa" className="gap-2 shrink-0 font-medium">
              <Building2 className="w-4 h-4" /> Empresa & Institucional
            </TabsTrigger>
            <TabsTrigger value="identidade" className="gap-2 shrink-0 font-medium">
              <Palette className="w-4 h-4" /> Identidade Visual
            </TabsTrigger>
            <TabsTrigger value="preferencias" className="gap-2 shrink-0 font-medium">
              <SlidersHorizontal className="w-4 h-4" /> Preferências & Numeração
            </TabsTrigger>
            <TabsTrigger value="comunicacao" className="gap-2 shrink-0 font-medium">
              <Bell className="w-4 h-4" /> Central de Comunicação
            </TabsTrigger>
            <TabsTrigger value="seguranca" className="gap-2 shrink-0 font-medium">
              <ShieldCheck className="w-4 h-4" /> Segurança & Acessos
            </TabsTrigger>
            <TabsTrigger value="integracoes" className="gap-2 shrink-0 font-medium">
              <Key className="w-4 h-4" /> APIs & Webhooks
            </TabsTrigger>
            <TabsTrigger value="backup" className="gap-2 shrink-0 font-medium">
              <HardDrive className="w-4 h-4" /> Backup & Recuperação
            </TabsTrigger>
            <TabsTrigger value="auditoria" className="gap-2 shrink-0 font-medium">
              <History className="w-4 h-4" /> Logs de Auditoria
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2 shrink-0 font-medium">
              <LayoutDashboard className="w-4 h-4" /> Status do Sistema
            </TabsTrigger>
          </TabsList>
        </div>

        {/* 1. Empresa & Institucional */}
        <TabsContent value="empresa" className="space-y-4 focus-visible:outline-none">
          <ConfigEmpresa />
        </TabsContent>

        {/* 2. Identidade Visual */}
        <TabsContent value="identidade" className="space-y-4 focus-visible:outline-none">
          <ConfigIdentidadeVisual />
        </TabsContent>

        {/* 3. Preferências & Numeração */}
        <TabsContent value="preferencias" className="space-y-4 focus-visible:outline-none">
          <Tabs defaultValue="gerais" className="space-y-4">
            <TabsList className="bg-muted/40 p-1 w-auto inline-flex">
              <TabsTrigger value="gerais" className="gap-2 text-xs font-semibold">
                <SlidersHorizontal className="w-3.5 h-3.5" /> Preferências Gerais & Moeda
              </TabsTrigger>
              <TabsTrigger value="numeracao" className="gap-2 text-xs font-semibold">
                <Hash className="w-3.5 h-3.5" /> Numeração Automática (Human IDs)
              </TabsTrigger>
            </TabsList>
            <TabsContent value="gerais" className="focus-visible:outline-none">
              <ConfigPreferenciasGlobais />
            </TabsContent>
            <TabsContent value="numeracao" className="focus-visible:outline-none">
              <ConfigNumeracao />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* 4. Central de Comunicação */}
        <TabsContent value="comunicacao" className="space-y-4 focus-visible:outline-none">
          <ConfigCentralComunicacao />
        </TabsContent>

        {/* 5. Segurança & Acessos */}
        <TabsContent value="seguranca" className="space-y-4 focus-visible:outline-none">
          <ConfigSeguranca />
        </TabsContent>

        {/* 6. APIs & Webhooks */}
        <TabsContent value="integracoes" className="space-y-4 focus-visible:outline-none">
          <Tabs defaultValue="apis" className="space-y-4">
            <TabsList className="bg-muted/40 p-1 w-auto inline-flex">
              <TabsTrigger value="apis" className="gap-2 text-xs font-semibold">
                <Key className="w-3.5 h-3.5" /> Chaves de API (Tokens)
              </TabsTrigger>
              <TabsTrigger value="webhooks" className="gap-2 text-xs font-semibold">
                <Webhook className="w-3.5 h-3.5" /> Webhooks & Eventos
              </TabsTrigger>
            </TabsList>
            <TabsContent value="apis" className="focus-visible:outline-none">
              <ConfigApis />
            </TabsContent>
            <TabsContent value="webhooks" className="focus-visible:outline-none">
              <ConfigWebhooks />
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* 7. Backup & Recuperação */}
        <TabsContent value="backup" className="space-y-4 focus-visible:outline-none">
          <ConfigBackup />
        </TabsContent>

        {/* 8. Logs de Auditoria */}
        <TabsContent value="auditoria" className="space-y-4 focus-visible:outline-none">
          <ConfigLogsAuditoria />
        </TabsContent>

        {/* 9. Status do Sistema */}
        <TabsContent value="dashboard" className="space-y-4 focus-visible:outline-none">
          <ConfigDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

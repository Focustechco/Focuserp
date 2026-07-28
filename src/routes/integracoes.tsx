import React, { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HubDashboard } from "@/features/integracoes/components/HubDashboard";
import { HubMarketplaceView } from "@/features/integracoes/components/HubMarketplaceView";
import { HubWebhooksView } from "@/features/integracoes/components/HubWebhooksView";
import { HubApiKeysView } from "@/features/integracoes/components/HubApiKeysView";
import { HubLogsView } from "@/features/integracoes/components/HubLogsView";
import { Network, LayoutGrid, Webhook, Key, Activity, ShieldCheck, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/integracoes")({
  component: IntegrationHubPage,
});

function IntegrationHubPage() {
  const [activeTab, setActiveTab] = useState("marketplace");

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto w-full animate-fade-in">
      {/* Cabeçalho do Hub de Integrações */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center shadow-sm">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-3xl font-bold tracking-tight">Hub de Integrações</h1>
              <Badge variant="outline" className="border-orange-500/40 text-orange-600 font-semibold gap-1 bg-orange-50 dark:bg-orange-950/40">
                <ShieldCheck className="w-3.5 h-3.5" /> Zapier / Power Automate Grade
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 text-sm">
              Barramento corporativo desacoplado para conexão com bancos, gateways, Google, Microsoft e serviços externos.
            </p>
          </div>
        </div>
      </div>

      {/* Navegação por Abas */}
      <Tabs defaultValue="marketplace" className="space-y-6 mt-2" onValueChange={setActiveTab}>
        <div className="border-b pb-2">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="marketplace" className="gap-2 text-orange-600 font-semibold">
              <Zap className="w-4 h-4" /> Marketplace de Conectores
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <LayoutGrid className="w-4 h-4" /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="webhooks" className="gap-2">
              <Webhook className="w-4 h-4" /> Webhooks Engine
            </TabsTrigger>
            <TabsTrigger value="keys" className="gap-2">
              <Key className="w-4 h-4" /> API Keys & Tokens
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-2">
              <Activity className="w-4 h-4" /> Monitor & Logs
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="marketplace" className="space-y-4 outline-none">
          <HubMarketplaceView />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4 outline-none">
          <HubDashboard />
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4 outline-none">
          <HubWebhooksView />
        </TabsContent>

        <TabsContent value="keys" className="space-y-4 outline-none">
          <HubApiKeysView />
        </TabsContent>

        <TabsContent value="logs" className="space-y-4 outline-none">
          <HubLogsView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

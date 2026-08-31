import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { mockConfigDashboard } from '../mockData';
import { Settings, Server, AlertTriangle, HardDrive } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function ConfigDashboard() {
  return (
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="border-b pb-4">
        <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
          <Server className="w-5 h-5 text-orange-500" /> Saúde do Sistema & Infraestrutura Cloud
        </h3>
        <p className="text-xs text-muted-foreground">
          Monitoramento em tempo real de latência, integridade do banco de dados, backups e conectividade de APIs.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        
        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground">Versão da Plataforma</CardTitle>
            <Settings className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {mockConfigDashboard.versao}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Atualizado em {new Date(mockConfigDashboard.ultimaAtualizacao).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground">Backups Retidos</CardTitle>
            <HardDrive className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {mockConfigDashboard.backupsRetidos} Snapshots
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Último: {new Date(mockConfigDashboard.ultimoBackup).toLocaleDateString('pt-BR')}
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground">APIs & Webhooks</CardTitle>
            <Server className="h-4 w-4 text-violet-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">
              {mockConfigDashboard.apisAtivas + mockConfigDashboard.webhooksAtivos} Ativos
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {mockConfigDashboard.apisAtivas} APIs e {mockConfigDashboard.webhooksAtivos} Webhooks
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border shadow-xs bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-bold text-muted-foreground">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {mockConfigDashboard.alertas.length}
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              Requer atenção administrativa
            </p>
          </CardContent>
        </Card>

      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-bold text-foreground">Alertas Operacionais do Sistema</h4>
        {mockConfigDashboard.alertas.map((alerta, idx) => (
          <Alert variant="default" key={idx} className="rounded-2xl border-amber-200 bg-amber-50/50 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
            <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <AlertTitle className="font-bold text-xs">Atenção do Sistema</AlertTitle>
            <AlertDescription className="text-xs">{alerta}</AlertDescription>
          </Alert>
        ))}
      </div>
    </div>
  );
}

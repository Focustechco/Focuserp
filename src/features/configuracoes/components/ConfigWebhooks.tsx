import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Webhook, Plus, Play, Trash2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';

export function ConfigWebhooks() {
  const [webhooks, setWebhooks] = useState([
    { id: 1, evento: 'fatura.paga', endpoint: 'https://api.empresa.com/hooks/focus', metodo: 'POST', status: 'Ativo', ultimoStatus: '200 OK', ultimaExec: '2026-07-20T10:15:00' },
    { id: 2, evento: 'cliente.criado', endpoint: 'https://crm.empresa.com/sync', metodo: 'POST', status: 'Ativo', ultimoStatus: '201 Created', ultimaExec: '2026-07-19T14:22:00' },
    { id: 3, evento: 'contrato.vencido', endpoint: 'https://zap.webhook.com/x992', metodo: 'POST', status: 'Falha', ultimoStatus: '500 Server Error', ultimaExec: '2026-07-20T08:00:00' }
  ]);

  const handleCreateWebhook = () => {
    const endpoint = prompt('URL de Destino do Webhook (Ex: https://api.exemplo.com/webhook):');
    if (!endpoint) return;
    const evento = prompt('Nome do Evento (Ex: conta.paga, contrato.assinado):') || 'evento.customizado';
    const newHook = {
      id: Date.now(),
      evento,
      endpoint,
      metodo: 'POST',
      status: 'Ativo',
      ultimoStatus: '200 OK',
      ultimaExec: new Date().toISOString()
    };
    setWebhooks((prev) => [newHook, ...prev]);
    toast.success(`Webhook para "${evento}" cadastrado com sucesso!`);
  };

  const handleTestWebhook = (hook: typeof webhooks[0]) => {
    toast.info(`Disparando evento de teste para ${hook.endpoint}...`);
    setTimeout(() => {
      toast.success(`Webhook "${hook.evento}" testado com sucesso! Servidor respondeu 200 OK.`);
    }, 600);
  };

  const handleDeleteWebhook = (id: number, evento: string) => {
    setWebhooks((prev) => prev.filter((h) => h.id !== id));
    toast.success(`Webhook "${evento}" removido com sucesso.`);
  };

  return (
    <div className="space-y-6 animate-fade-in pt-1">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b pb-4">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 text-foreground">
            <Webhook className="w-5 h-5 text-orange-500" /> Webhooks & Disparadores de Eventos
          </h3>
          <p className="text-xs text-muted-foreground">
            Notifique servidores externos, microserviços e ferramentas no-code (Make, n8n, Zapier) em tempo real.
          </p>
        </div>
        <Button 
          className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl gap-1.5 font-bold text-xs h-8 shadow-xs cursor-pointer" 
          onClick={handleCreateWebhook}
        >
          <Plus className="w-3.5 h-3.5" /> Novo Webhook
        </Button>
      </div>

      <Card className="rounded-2xl border shadow-xs bg-card">
        <CardHeader className="pb-3 border-b bg-muted/20">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <Webhook className="w-4 h-4 text-orange-500" /> Endpoints de Webhook Cadastrados
          </CardTitle>
          <CardDescription className="text-xs">Requisições HTTP POST automáticas disparadas mediante ações do sistema.</CardDescription>
        </CardHeader>
        <CardContent className="pt-4 text-xs">
          <div className="border rounded-lg overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Evento</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>URL de Destino</TableHead>
                  <TableHead>Última Execução</TableHead>
                  <TableHead>Status HTTP</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {webhooks.map((hook) => (
                  <TableRow key={hook.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">
                      <Badge variant="secondary" className="font-mono text-xs">{hook.evento}</Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{hook.metodo}</span>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs font-mono text-muted-foreground truncate block max-w-[200px] xl:max-w-[300px]">{hook.endpoint}</code>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(hook.ultimaExec).toLocaleString('pt-BR')}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={hook.ultimoStatus.includes('20') ? 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-400' : 'border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-400'}>
                        {hook.ultimoStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={hook.status === 'Ativo' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20' : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'}>
                        {hook.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-500" title="Testar Webhook" onClick={() => handleTestWebhook(hook)}>
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-rose-500" title="Excluir Webhook" onClick={() => handleDeleteWebhook(hook.id, hook.evento)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

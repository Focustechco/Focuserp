import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RefreshCw, CheckCircle2, ShieldCheck, Key, Database, AlertCircle, Trash2, Layers, ExternalLink } from 'lucide-react';
import { useCrmStore } from '../hooks/useCrmStore';
import { toast } from 'sonner';

export function ClickUpConfigView() {
  const { 
    config, syncLogs, isLoadingClickUp, saveAndConnectClickUp, 
    importRealClickUpTasks, carregarDadosDemo, limparDadosCrm 
  } = useCrmStore();

  const [apiToken, setApiToken] = useState(config.apiToken || '');
  const [workspaceId, setWorkspaceId] = useState(config.workspaceId || '');
  const [spaceId, setSpaceId] = useState(config.spaceId || '');
  const [listId, setListId] = useState(config.listId || '');

  const handleConnectRealClickUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim()) {
      toast.error('Insira o seu ClickUp Personal API Token para integrar.');
      return;
    }
    await saveAndConnectClickUp(apiToken, workspaceId, spaceId, listId);
  };

  const handleSyncNow = async () => {
    if (!config.apiToken || !config.listId) {
      toast.error('Configure e conecte seu Token e List ID do ClickUp primeiro.');
      return;
    }
    await importRealClickUpTasks();
  };

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      {/* SEO CONEXO API REAL CLICKUP */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-500" /> Conexo Oficial da Conta ClickUp (REST API v2)
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Conecte a API real da sua empresa para importar e sincronizar tarefas, leads e oportunidades bidirecionalmente em tempo real.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {config.statusConexao === 'Conectado ClickUp API' ? (
                <Badge className="bg-emerald-500 text-white gap-1 text-xs py-1 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado ClickUp API Real
                </Badge>
              ) : (
                <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs py-1 px-3 gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Nenhuma Conta Conectada
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-5 text-xs">
          <form onSubmit={handleConnectRealClickUp} className="space-y-4">
            <div className="p-3 border rounded-lg bg-muted/40 space-y-2">
              <Label className="font-bold text-foreground flex items-center gap-1.5">
                <Key className="w-4 h-4 text-orange-500" /> ClickUp Personal API Token (Obrigatrio) *
              </Label>
              <Input 
                type="password" 
                placeholder="Ex: pk_948271049_ABCDEFGHIJKLMNOPQRSTUVWXYZ..." 
                value={apiToken} 
                onChange={e => setApiToken(e.target.value)}
                className="font-mono text-xs bg-background"
              />
              <p className="text-[11px] text-muted-foreground">
                Para obter seu token: Acesse <strong>ClickUp  Settings  Apps  Personal API Token</strong> e clique em <em>Generate</em>.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>List ID (ID do Quadro/Lista no ClickUp) *</Label>
                <Input 
                  placeholder="Ex: 901802934823" 
                  value={listId} 
                  onChange={e => setListId(e.target.value)} 
                  className="font-mono text-xs"
                />
                <p className="text-[10px] text-muted-foreground">Copie os nmeros finais da URL da sua lista no ClickUp.</p>
              </div>

              <div className="space-y-2">
                <Label>Workspace Name / ID (Opcional)</Label>
                <Input 
                  placeholder="Ex: Focus Tecnologia" 
                  value={workspaceId} 
                  onChange={e => setWorkspaceId(e.target.value)} 
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <Label>Space Name / ID (Opcional)</Label>
                <Input 
                  placeholder="Ex: Vendas Enterprise" 
                  value={spaceId} 
                  onChange={e => setSpaceId(e.target.value)} 
                  className="text-xs"
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2 border-t">
              <div className="flex items-center gap-3">
                <Switch defaultChecked={config.autoSync} />
                <span className="font-semibold text-xs">Sincronizao Bidirecional Automtica Ativada</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button 
                  type="submit" 
                  disabled={isLoadingClickUp} 
                  className="gap-2 bg-orange-600 hover:bg-orange-700 text-white text-xs w-full sm:w-auto"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClickUp ? 'animate-spin' : ''}`} />
                  {isLoadingClickUp ? 'Testando Conexo...' : 'Testar & Salvar Conexo ClickUp'}
                </Button>

                {config.statusConexao === 'Conectado ClickUp API' && (
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={handleSyncNow} 
                    disabled={isLoadingClickUp}
                    className="gap-1.5 text-xs border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Puxar Tarefas Reais
                  </Button>
                )}
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* FERRAMENTAS DE DADOS & ZERAR */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" /> Gerenciamento de Dados do CRM
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={carregarDadosDemo} className="gap-2 text-xs">
            <Layers className="w-3.5 h-3.5 text-blue-500" /> Carregar Dados de Demonstrao (Mock Opcional)
          </Button>

          <Button variant="outline" onClick={limparDadosCrm} className="gap-2 text-xs border-rose-500 text-rose-600 hover:bg-rose-50">
            <Trash2 className="w-3.5 h-3.5" /> Zerar / Limpar Todos os Dados do CRM
          </Button>
        </CardContent>
      </Card>

      {/* SEO LOGS DE AUDITORIA DO CLICKUP */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-500" /> Log de Auditoria & Conexo ClickUp API
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden bg-card text-xs">
            <table className="w-full">
              <thead className="bg-muted/50 border-b text-left">
                <tr>
                  <th className="p-3">Horrio</th>
                  <th className="p-3">ClickUp Task / API</th>
                  <th className="p-3">Entidade</th>
                  <th className="p-3">Ao Executada</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Mensagem de Retorno</th>
                </tr>
              </thead>
              <tbody>
                {syncLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">Nenhum evento registrado no log at o momento.</td>
                  </tr>
                ) : (
                  syncLogs.map(log => (
                    <tr key={log.id} className="border-b hover:bg-muted/30">
                      <td className="p-3 font-mono text-muted-foreground">{log.timestamp}</td>
                      <td className="p-3 font-mono font-bold text-orange-600">{log.clickUpTaskId}</td>
                      <td className="p-3"><Badge variant="outline">{log.entidade}</Badge></td>
                      <td className="p-3 font-semibold">{log.acao}</td>
                      <td className="p-3">
                        <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 text-[10px]">{log.status}</Badge>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{log.mensagem}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

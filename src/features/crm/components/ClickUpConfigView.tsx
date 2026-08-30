import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, CheckCircle2, ShieldCheck, Key, Database, AlertCircle, 
  Trash2, Layers, ExternalLink, User, FolderTree, Sparkles, Clock, Globe
} from 'lucide-react';
import { useCrmStore } from '../hooks/useCrmStore';
import { 
  testClickUpConnection, fetchClickUpTeams, fetchClickUpSpaces, fetchClickUpListsInSpace,
  ClickUpTeam, ClickUpSpace, ClickUpList 
} from '../services/clickupApi';
import { formatDateBrasilia } from '@/lib/dateUtils';
import { toast } from 'sonner';

export function ClickUpConfigView() {
  const { 
    config, syncLogs, isLoadingClickUp, saveAndConnectClickUp, 
    importRealClickUpTasks, carregarDadosDemo, limparDadosCrm 
  } = useCrmStore();

  const [apiToken, setApiToken] = useState(config.apiToken || '');
  const [selectedTeamId, setSelectedTeamId] = useState(config.teamId || config.workspaceId || '');
  const [selectedSpaceId, setSelectedSpaceId] = useState(config.spaceId || '');
  const [selectedListId, setSelectedListId] = useState(config.listId || '');

  // Dynamic discovery states
  const [teams, setTeams] = useState<ClickUpTeam[]>([]);
  const [spaces, setSpaces] = useState<ClickUpSpace[]>([]);
  const [lists, setLists] = useState<ClickUpList[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [connectedUser, setConnectedUser] = useState<any>(null);

  const isConnected = config.statusConexao === 'Conectado ClickUp API';

  // 1. Testar Token e Descobrir Workspaces / Teams
  const handleTestAndDiscover = async () => {
    if (!apiToken.trim()) {
      toast.error('Insira o seu ClickUp Personal API Token (pk_...).');
      return;
    }

    setIsDiscovering(true);
    try {
      // Testar conexão
      const userData = await testClickUpConnection(apiToken.trim());
      setConnectedUser(userData.user);

      // Buscar Workspaces
      const teamsData = await fetchClickUpTeams(apiToken.trim());
      setTeams(teamsData);

      if (teamsData.length > 0) {
        const firstTeam = teamsData[0];
        setSelectedTeamId(firstTeam.id);

        // Buscar Spaces do primeiro Workspace
        const spacesData = await fetchClickUpSpaces(firstTeam.id, apiToken.trim());
        setSpaces(spacesData);

        if (spacesData.length > 0) {
          const firstSpace = spacesData[0];
          setSelectedSpaceId(firstSpace.id);

          // Buscar Listas do primeiro Space
          const listsData = await fetchClickUpListsInSpace(firstSpace.id, apiToken.trim());
          setLists(listsData);

          if (listsData.length > 0) {
            setSelectedListId(listsData[0].id);
          }
        }
      }

      toast.success(`Token validado! Conectado à conta de ${userData.user.username} (${userData.user.email}).`);
    } catch (err: any) {
      toast.error(`Erro de autenticação no ClickUp: ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Ao alterar Workspace selecionado
  const handleTeamChange = async (teamId: string) => {
    setSelectedTeamId(teamId);
    if (!apiToken.trim()) return;

    try {
      const spacesData = await fetchClickUpSpaces(teamId, apiToken.trim());
      setSpaces(spacesData);
      if (spacesData.length > 0) {
        setSelectedSpaceId(spacesData[0].id);
        const listsData = await fetchClickUpListsInSpace(spacesData[0].id, apiToken.trim());
        setLists(listsData);
        if (listsData.length > 0) {
          setSelectedListId(listsData[0].id);
        }
      } else {
        setLists([]);
        setSelectedListId('');
      }
    } catch (e: any) {
      console.warn('Erro ao atualizar spaces:', e.message);
    }
  };

  // Ao alterar Space selecionado
  const handleSpaceChange = async (spaceId: string) => {
    setSelectedSpaceId(spaceId);
    if (!apiToken.trim()) return;

    try {
      const listsData = await fetchClickUpListsInSpace(spaceId, apiToken.trim());
      setLists(listsData);
      if (listsData.length > 0) {
        setSelectedListId(listsData[0].id);
      } else {
        setSelectedListId('');
      }
    } catch (e: any) {
      console.warn('Erro ao atualizar listas:', e.message);
    }
  };

  // 2. Salvar Conexão e Sincronizar
  const handleSaveAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiToken.trim()) {
      toast.error('Insira o seu ClickUp Personal API Token para integrar.');
      return;
    }
    if (!selectedListId.trim()) {
      toast.error('Selecione ou informe o List ID (Quadro CRM) do ClickUp.');
      return;
    }

    const teamObj = teams.find(t => t.id === selectedTeamId);
    const spaceObj = spaces.find(s => s.id === selectedSpaceId);
    const listObj = lists.find(l => l.id === selectedListId);

    await saveAndConnectClickUp(
      apiToken.trim(), 
      selectedTeamId, 
      selectedSpaceId, 
      selectedListId.trim(),
      {
        teamName: teamObj?.name,
        spaceName: spaceObj?.name,
        listName: listObj?.name
      }
    );
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
      {/* SEÇÃO CONEXÃO API REAL CLICKUP */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-500" /> Conexão Oficial da Conta ClickUp (REST API v2)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Conecte a API real da sua empresa para importar e sincronizar tarefas, leads e oportunidades bidirecionalmente em tempo real.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
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

        <CardContent className="pt-6 space-y-6 text-xs">
          {/* Card de Status da Conta Conectada se houver */}
          {isConnected && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 flex items-center justify-center font-bold text-emerald-800 dark:text-emerald-200 text-sm overflow-hidden">
                  {config.userAvatar ? (
                    <img src={config.userAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span>{config.userName || 'Usuário ClickUp'}</span>
                    <span className="text-xs font-normal text-muted-foreground">({config.userEmail || 'email@clickup.com'})</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Quadro Vinculado: <strong className="text-foreground">{config.listName || config.listId}</strong> • Workspace: {config.teamName || config.workspaceId || 'Principal'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button 
                  onClick={handleSyncNow} 
                  disabled={isLoadingClickUp}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClickUp ? 'animate-spin' : ''}`} />
                  {isLoadingClickUp ? 'Sincronizando...' : 'Sincronizar Tarefas Agora'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs gap-1.5 h-9"
                  onClick={() => window.open(`https://app.clickup.com/${config.teamId || ''}/v/l/li/${config.listId}`, '_blank')}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-orange-500" /> Abrir no ClickUp
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={handleSaveAndSync} className="space-y-5">
            {/* ETAPA 1: API TOKEN */}
            <div className="p-4 border rounded-xl bg-muted/30 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <Label className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-orange-500" /> 1. ClickUp Personal API Token (Obrigatório) *
                </Label>
                
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  disabled={isDiscovering || !apiToken.trim()}
                  onClick={handleTestAndDiscover}
                  className="h-7 text-xs gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-orange-500" />
                  {isDiscovering ? 'Validando Token...' : 'Testar & Carregar Listas'}
                </Button>
              </div>

              <Input 
                type="password" 
                placeholder="Ex: pk_948271049_ABCDEFGHIJKLMNOPQRSTUVWXYZ..." 
                value={apiToken} 
                onChange={e => setApiToken(e.target.value)}
                className="font-mono text-xs bg-background"
              />
              <p className="text-[11px] text-muted-foreground">
                Para obter seu token: Acesse seu perfil no <strong>ClickUp &gt; Settings &gt; Apps &gt; Personal API Token</strong> e clique em <em>Generate</em>.
              </p>
            </div>

            {/* ETAPA 2: SELEÇÃO DE WORKSPACE, SPACE E LISTA */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Workspace / Team */}
              <div className="space-y-2">
                <Label className="font-semibold">Workspace (Team)</Label>
                {teams.length > 0 ? (
                  <Select value={selectedTeamId} onValueChange={handleTeamChange}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o Workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    placeholder="Workspace ID ou Nome" 
                    value={selectedTeamId} 
                    onChange={e => setSelectedTeamId(e.target.value)} 
                    className="text-xs"
                  />
                )}
              </div>

              {/* Space */}
              <div className="space-y-2">
                <Label className="font-semibold">Space de Vendas</Label>
                {spaces.length > 0 ? (
                  <Select value={selectedSpaceId} onValueChange={handleSpaceChange}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Selecione o Space" />
                    </SelectTrigger>
                    <SelectContent>
                      {spaces.map(s => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    placeholder="Space ID ou Nome" 
                    value={selectedSpaceId} 
                    onChange={e => setSelectedSpaceId(e.target.value)} 
                    className="text-xs"
                  />
                )}
              </div>

              {/* List / Quadro CRM */}
              <div className="space-y-2">
                <Label className="font-semibold">Lista / Quadro CRM (List ID) *</Label>
                {lists.length > 0 ? (
                  <Select value={selectedListId} onValueChange={setSelectedListId}>
                    <SelectTrigger className="bg-background font-bold text-primary">
                      <SelectValue placeholder="Selecione a Lista" />
                    </SelectTrigger>
                    <SelectContent>
                      {lists.map(l => (
                        <SelectItem key={l.id} value={l.id}>
                          <span className="font-mono text-muted-foreground mr-1">[{l.id}]</span> {l.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input 
                    placeholder="Ex: 901802934823" 
                    value={selectedListId} 
                    onChange={e => setSelectedListId(e.target.value)} 
                    className="font-mono text-xs"
                  />
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-muted-foreground text-[11px]">
                  Criptografia segura. Configuração disponível para todos os usuários do módulo CRM.
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Button 
                  type="submit" 
                  disabled={isLoadingClickUp} 
                  className="bg-orange-600 hover:bg-orange-700 text-white gap-2 font-bold"
                >
                  <RefreshCw className={`w-4 h-4 ${isLoadingClickUp ? 'animate-spin' : ''}`} />
                  {isLoadingClickUp ? 'Conectando...' : 'Salvar & Sincronizar com ClickUp'}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* HISTÓRICO DE LOGS DE SINCRONIZAÇÃO */}
      <Card className="shadow-xs">
        <CardHeader className="border-b pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Database className="w-4 h-4 text-primary" /> Live Stream de Sincronização & Logs de Auditoria
              </CardTitle>
              <CardDescription className="text-xs">
                Registro de eventos em tempo real das chamadas REST API e webhooks do ClickUp.
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={limparDadosCrm} className="text-xs text-muted-foreground hover:text-red-600">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpar Dados
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-medium">
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Task ID</th>
                  <th className="py-2.5 px-4">Entidade</th>
                  <th className="py-2.5 px-4">Ação</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Detalhes</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {syncLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground">
                      Nenhum evento registrado até o momento.
                    </td>
                  </tr>
                ) : (
                  syncLogs.slice(0, 20).map((log) => (
                    <tr key={log.id} className="hover:bg-muted/20 transition-colors">
                      <td className="py-2.5 px-4 font-mono text-[11px] text-muted-foreground">{log.timestamp}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-orange-600">{log.clickUpTaskId}</td>
                      <td className="py-2.5 px-4 font-medium">{log.entidade}</td>
                      <td className="py-2.5 px-4">{log.acao}</td>
                      <td className="py-2.5 px-4">
                        <Badge variant="outline" className={`text-[10px] ${
                          log.status === 'Sucesso' ? 'bg-emerald-50 text-emerald-700 border-emerald-300' : 'bg-rose-50 text-rose-700 border-rose-300'
                        }`}>
                          {log.status}
                        </Badge>
                      </td>
                      <td className="py-2.5 px-4 text-muted-foreground truncate max-w-[280px]">{log.mensagem}</td>
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

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  RefreshCw, CheckCircle2, ShieldCheck, Key, Database, AlertCircle, 
  Trash2, Layers, ExternalLink, User, FolderTree, Zap, Clock, Globe,
  Check, ArrowRight
} from 'lucide-react';
import { useCrmStore } from '../hooks/useCrmStore';
import { 
  testClickUpConnection, fetchClickUpTeams, fetchAllClickUpBoardsAndLists,
  ClickUpTeam, ClickUpBoardOption 
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
  const [selectedBoardId, setSelectedBoardId] = useState(config.listId || '');

  // Dynamic discovery states
  const [teams, setTeams] = useState<ClickUpTeam[]>([]);
  const [boards, setBoards] = useState<ClickUpBoardOption[]>([]);
  const [isDiscovering, setIsDiscovering] = useState(false);
  const [connectedUser, setConnectedUser] = useState<any>(null);

  const isConnected = config.statusConexao === 'Conectado ClickUp API';

  // 1. Validar Token e Descobrir Workspaces e Todos os Quadros / Listas Automaticamente
  const discoverAndLoadEverything = async (tokenToUse = apiToken) => {
    const cleanToken = tokenToUse.trim();
    if (!cleanToken) {
      toast.error('Insira o seu ClickUp Personal API Token (pk_...).');
      return;
    }

    setIsDiscovering(true);
    try {
      // 1. Validar usuário
      const userData = await testClickUpConnection(cleanToken);
      setConnectedUser(userData.user);

      // 2. Buscar Workspaces
      const teamsData = await fetchClickUpTeams(cleanToken);
      setTeams(teamsData);

      if (teamsData.length > 0) {
        const team = teamsData.find(t => t.id === selectedTeamId) || teamsData[0];
        setSelectedTeamId(team.id);

        // 3. Buscar TODOS os Quadros (Views) e Listas desse Workspace
        const boardsData = await fetchAllClickUpBoardsAndLists(team.id, cleanToken);
        setBoards(boardsData);

        // Se tiver quadros e nenhum selecionado ainda, seleciona o primeiro
        if (boardsData.length > 0) {
          const currentBoard = boardsData.find(b => b.id === selectedBoardId) || boardsData[0];
          setSelectedBoardId(currentBoard.id);

          // Salvar e conectar automaticamente
          await saveAndConnectClickUp(
            cleanToken,
            team.id,
            '',
            currentBoard.id,
            {
              teamName: team.name,
              listName: currentBoard.name
            }
          );
        } else {
          // Se não encontrou listas listadas, salvar com a lista atual
          await saveAndConnectClickUp(
            cleanToken,
            team.id,
            '',
            selectedBoardId || team.id,
            { teamName: team.name }
          );
        }
      }

      toast.success(`Conexão autenticada! Bem-vindo(a), ${userData.user.username}.`);
    } catch (err: any) {
      toast.error(`Erro ao conectar com o ClickUp: ${err.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Carregar listas ao abrir se já houver token salvo
  useEffect(() => {
    if (config.apiToken && teams.length === 0) {
      discoverAndLoadEverything(config.apiToken);
    }
  }, [config.apiToken]);

  // Ao trocar de Workspace
  const handleTeamChange = async (teamId: string) => {
    setSelectedTeamId(teamId);
    if (!apiToken.trim()) return;

    setIsDiscovering(true);
    try {
      const team = teams.find(t => t.id === teamId);
      const boardsData = await fetchAllClickUpBoardsAndLists(teamId, apiToken.trim());
      setBoards(boardsData);
      
      if (boardsData.length > 0) {
        setSelectedBoardId(boardsData[0].id);
        await saveAndConnectClickUp(
          apiToken.trim(),
          teamId,
          '',
          boardsData[0].id,
          {
            teamName: team?.name,
            listName: boardsData[0].name
          }
        );
      }
    } catch (e: any) {
      toast.error(`Erro ao carregar quadros do workspace: ${e.message}`);
    } finally {
      setIsDiscovering(false);
    }
  };

  // Ao selecionar um Quadro / Lista
  const handleBoardChange = async (boardId: string) => {
    setSelectedBoardId(boardId);
    if (!apiToken.trim()) return;

    const board = boards.find(b => b.id === boardId);
    const team = teams.find(t => t.id === selectedTeamId);

    await saveAndConnectClickUp(
      apiToken.trim(),
      selectedTeamId,
      '',
      boardId,
      {
        teamName: team?.name,
        listName: board?.name
      }
    );
  };

  const handleSyncNow = async () => {
    if (!config.apiToken || !config.listId) {
      toast.error('Informe o API Token do ClickUp primeiro.');
      return;
    }
    await importRealClickUpTasks();
  };

  return (
    <div className="space-y-6 animate-fade-in pt-2">
      {/* SEÇÃO PRINCIPAL DE CONEXÃO CLICKUP */}
      <Card className="border-2 border-primary/20 shadow-md">
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <Key className="w-5 h-5 text-orange-500" /> Conexão do ClickUp via API Oficial (REST v2)
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Basta inserir seu token para conectar e selecionar seus quadros e listas em 1 clique.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              {isConnected ? (
                <Badge className="bg-emerald-500 text-white gap-1 text-xs py-1 px-3">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Conectado & Ativo
                </Badge>
              ) : (
                <Badge variant="outline" className="text-rose-600 border-rose-300 bg-rose-50 dark:bg-rose-950/40 text-xs py-1 px-3 gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Desconectado
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-6 text-xs">
          {/* PAINEL DA CONTA CONECTADA */}
          {isConnected && (
            <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900 border border-emerald-300 flex items-center justify-center font-bold text-emerald-800 dark:text-emerald-200 text-sm overflow-hidden shrink-0">
                  {config.userAvatar ? (
                    <img src={config.userAvatar} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="font-bold text-sm text-foreground flex items-center gap-2">
                    <span>{config.userName || 'Usuário ClickUp'}</span>
                    <span className="text-xs font-normal text-muted-foreground">({config.userEmail || 'conectado via API'})</span>
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
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-9 font-bold"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingClickUp ? 'animate-spin' : ''}`} />
                  {isLoadingClickUp ? 'Sincronizando...' : 'Sincronizar Dados Reais Agora'}
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs gap-1.5 h-9"
                  onClick={() => window.open(`https://app.clickup.com/${config.teamId || ''}`, '_blank')}
                >
                  <ExternalLink className="w-3.5 h-3.5 text-orange-500" /> Abrir ClickUp
                </Button>
              </div>
            </div>
          )}

          {/* FORMULÁRIO RÁPIDO: TOKEN + SELEÇÃO DIRETA */}
          <div className="space-y-4">
            {/* 1. INPUT DE TOKEN COM VALIDAÇÃO RÁPIDA */}
            <div className="p-4 border rounded-xl bg-muted/30 space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <Label className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Key className="w-4 h-4 text-orange-500" /> 1. ClickUp Personal API Token (pk_...) *
                </Label>
                
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm" 
                  disabled={isDiscovering || !apiToken.trim()}
                  onClick={() => discoverAndLoadEverything(apiToken)}
                  className="h-7 text-xs gap-1.5 bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 hover:bg-orange-200"
                >
                  <Zap className="w-3.5 h-3.5 text-orange-500" />
                  {isDiscovering ? 'Conectando & Carregando...' : 'Conectar & Listar Quadros'}
                </Button>
              </div>

              <Input 
                type="password" 
                placeholder="Ex: pk_948271049_ABCDEFGHIJKLMNOPQRSTUVWXYZ..." 
                value={apiToken} 
                onChange={e => setApiToken(e.target.value)}
                onBlur={() => {
                  if (apiToken.trim() && teams.length === 0) {
                    discoverAndLoadEverything(apiToken);
                  }
                }}
                className="font-mono text-xs bg-background"
              />
              <p className="text-[11px] text-muted-foreground">
                No ClickUp, vá em: <strong>Settings &gt; Apps &gt; Personal API Token</strong> e clique em <em>Generate</em>.
              </p>
            </div>

            {/* 2. SELEÇÃO DE WORKSPACE E QUADRO/LISTA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Workspace */}
              <div className="space-y-2">
                <Label className="font-semibold">2. Selecione o Workspace (Empresa)</Label>
                {teams.length > 0 ? (
                  <Select value={selectedTeamId} onValueChange={handleTeamChange}>
                    <SelectTrigger className="bg-background font-semibold">
                      <SelectValue placeholder="Selecione o Workspace" />
                    </SelectTrigger>
                    <SelectContent>
                      {teams.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="p-2.5 border rounded-lg bg-muted/40 text-muted-foreground text-xs">
                    Insira o token acima para listar seus Workspaces.
                  </div>
                )}
              </div>

              {/* Quadro / Lista CRM */}
              <div className="space-y-2">
                <Label className="font-semibold">3. Selecione o Quadro / Lista do CRM *</Label>
                {boards.length > 0 ? (
                  <Select value={selectedBoardId} onValueChange={handleBoardChange}>
                    <SelectTrigger className="bg-background font-bold text-primary">
                      <SelectValue placeholder="Selecione o Quadro CRM" />
                    </SelectTrigger>
                    <SelectContent className="max-h-72">
                      {boards.map(b => (
                        <SelectItem key={b.id} value={b.id}>
                          <span className="font-medium">{b.name}</span>
                          <span className="text-[10px] font-mono text-muted-foreground ml-1.5">[{b.id}]</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="space-y-1.5">
                    <Input 
                      placeholder="Ou cole o ID / URL do Quadro (ex: 6-901323318822-2)" 
                      value={selectedBoardId} 
                      onChange={e => setSelectedBoardId(e.target.value)} 
                      className="font-mono text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">Cole a URL ou o ID do seu quadro/lista no ClickUp.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 border-t">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-muted-foreground text-[11px]">
                  Configuração ativa e compartilhada com todos os usuários do módulo CRM.
                </span>
              </div>

              <Button 
                onClick={() => {
                  if (apiToken.trim()) {
                    discoverAndLoadEverything(apiToken);
                  } else {
                    toast.error('Informe o token do ClickUp.');
                  }
                }}
                disabled={isDiscovering || isLoadingClickUp} 
                className="bg-orange-600 hover:bg-orange-700 text-white gap-2 font-bold"
              >
                <RefreshCw className={`w-4 h-4 ${isDiscovering || isLoadingClickUp ? 'animate-spin' : ''}`} />
                {isDiscovering || isLoadingClickUp ? 'Sincronizando...' : 'Conectar & Sincronizar'}
              </Button>
            </div>
          </div>
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
                  <th className="py-2.5 px-4">Task / View ID</th>
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

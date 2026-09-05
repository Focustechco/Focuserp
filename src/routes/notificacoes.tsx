import React, { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { 
  Bell, Search, Filter, CheckCheck, Archive, Trash2, Settings, ExternalLink, 
  Clock, ShieldAlert, Briefcase, Wallet, Target, ShoppingBag, FileText, 
  Users, Calendar, Layers, CheckSquare, Square, BellRing, Smartphone,
  BellOff, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { useNotificacoesStore } from '@/features/notificacoes/useNotificacoesStore';
import { Notificacao, NotificationCategory, NotificationPriority } from '@/features/notificacoes/types';
import { toast } from 'sonner';

export const Route = createFileRoute('/notificacoes')({
  component: NotificacoesPage,
});


function formatTimeAgo(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'agora';
    if (diff < 3600) return `há ${Math.floor(diff / 60)} minutos`;
    if (diff < 86400) return `há ${Math.floor(diff / 3600)} horas`;
    return `há ${Math.floor(diff / 86400)} dias`;
  } catch {
    return 'recentemente';
  }
}

function getCategoryIcon(categoria: NotificationCategory) {
  switch (categoria) {
    case 'Projetos': return <Briefcase className="w-4 h-4 text-blue-500" />;
    case 'Financeiro': return <Wallet className="w-4 h-4 text-emerald-500" />;
    case 'CRM': return <Target className="w-4 h-4 text-orange-500" />;
    case 'Comercial': return <ShoppingBag className="w-4 h-4 text-amber-500" />;
    case 'Contratos': return <FileText className="w-4 h-4 text-purple-500" />;
    case 'RH': return <Users className="w-4 h-4 text-indigo-500" />;
    case 'Agenda': return <Calendar className="w-4 h-4 text-cyan-500" />;
    case 'Sistema': return <ShieldAlert className="w-4 h-4 text-slate-500" />;
    default: return <Layers className="w-4 h-4 text-primary" />;
  }
}

function getPriorityBadge(prioridade: NotificationPriority) {
  switch (prioridade) {
    case 'Urgente':
      return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-xs">Urgente</Badge>;
    case 'Alta':
      return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-xs">Alta</Badge>;
    case 'Normal':
      return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-xs">Normal</Badge>;
    default:
      return <Badge variant="outline" className="text-xs">Baixa</Badge>;
  }
}

function NotificacoesPage() {
  const navigate = useNavigate();
  const { 
    notificacoes, 
    naoLidasCount, 
    marcarComoLida, 
    marcarTodasComoLidas, 
    arquivar, 
    excluir,
    notificar,
    solicitarPermissaoPush,
    desativarPush,
    pushAtivo,
    pushSuportado,
  } = useNotificacoesStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todas');
  const [isSelectionMode, setIsSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [loadingPush, setLoadingPush] = useState(false);

  const handleAtivarPush = async () => {
    setLoadingPush(true);
    await solicitarPermissaoPush();
    setLoadingPush(false);
  };

  const handleDesativarPush = async () => {
    setLoadingPush(true);
    await desativarPush();
    setLoadingPush(false);
  };

  // Filtragem de Notificações
  const filteredNotificacoes = notificacoes.filter((n) => {
    const matchesSearch = 
      (n.titulo || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.descricao || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (n.responsavel && n.responsavel.toLowerCase().includes(searchTerm.toLowerCase()));

    if (selectedCategory === 'todas') return matchesSearch;
    if (selectedCategory === 'naoLidas') return matchesSearch && !n.lida;
    return matchesSearch && (n.origem || '').toLowerCase() === selectedCategory.toLowerCase();
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredNotificacoes.map(n => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleBulkMarkRead = () => {
    selectedIds.forEach(id => marcarComoLida(id));
    setSelectedIds([]);
    toast.success(`${selectedIds.length} notificações marcadas como lidas.`);
  };

  const handleBulkArchive = () => {
    selectedIds.forEach(id => arquivar(id));
    setSelectedIds([]);
    toast.info(`${selectedIds.length} notificações arquivadas.`);
  };

  const handleSimularNotificacao = () => {
    notificar({
      titulo: 'Nova Tarefa Atribuída no Projeto Focus ERP',
      descricao: 'Você foi designado para revisar o fluxo de conciliação bancária.',
      origem: 'Projetos',
      tipo: 'Informação',
      prioridade: 'Alta',
      responsavel: 'Carlos Andrade',
      targetUrl: '/projetos'
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-7xl mx-auto w-full animate-fade-in">
      {/* HEADER DA PÁGINA */}
      <div className="hidden md:flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">Central de Notificações</h1>
            {naoLidasCount > 0 && (
              <Badge className="bg-red-600 text-white font-semibold">
                {naoLidasCount} nova{naoLidasCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">
            Histórico consolidado, alertas do sistema e notificações em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleSimularNotificacao}
            className="text-xs"
          >
            <BellRing className="w-3.5 h-3.5 mr-1.5 text-amber-500" /> Simular Notificação
          </Button>
          {naoLidasCount > 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={marcarTodasComoLidas}
              className="text-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> Marcar todas como lidas
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate({ to: '/configuracoes' })}
            className="text-xs"
          >
            <Settings className="w-3.5 h-3.5 mr-1.5" /> Configurações
          </Button>
        </div>
      </div>

      {/* PUSH NOTIFICATION SETUP CARD */}
      {pushSuportado && (
        <Card className={`border-2 transition-all ${pushAtivo ? 'border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20' : 'border-orange-500/40 bg-orange-50/50 dark:bg-orange-950/20'}`}>
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl border shadow-xs ${pushAtivo ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : 'bg-orange-500/10 border-orange-500/30 text-orange-600'}`}>
                {pushAtivo ? <BellRing className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
              </div>
              <div>
                <div className="font-semibold text-sm flex items-center gap-2">
                  {pushAtivo ? (
                    <><span className="text-emerald-700 dark:text-emerald-400">Notificações Push Ativas</span> <Badge className="bg-emerald-500 text-white text-[10px] px-1.5">ON</Badge></>
                  ) : (
                    <><span className="text-orange-700 dark:text-orange-400">Notificações Push Desativadas</span> <Badge variant="outline" className="text-[10px] px-1.5 border-orange-400 text-orange-600">OFF</Badge></>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {pushAtivo 
                    ? 'Você receberá alertas mesmo com a tela bloqueada. Funciona em iOS 16.4+ e Android.'
                    : 'Ative para receber alertas no celular mesmo com a tela bloqueada (iOS e Android).'
                  }
                </p>
              </div>
            </div>
            <div className="shrink-0 flex gap-2">
              {pushAtivo ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDesativarPush}
                  disabled={loadingPush}
                  className="text-xs gap-1.5 border-red-200 text-red-600 hover:bg-red-50"
                >
                  {loadingPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellOff className="w-3.5 h-3.5" />}
                  Desativar Push
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={handleAtivarPush}
                  disabled={loadingPush}
                  className="text-xs gap-1.5 bg-orange-500 hover:bg-orange-600 text-white font-semibold shadow-lg shadow-orange-500/30"
                >
                  {loadingPush ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BellRing className="w-3.5 h-3.5" />}
                  Ativar Notificações Push
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* BARRA DE PESQUISA E AÇÕES EM LOTE */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar em notificações (título, descrição, responsável)..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9 text-xs h-9"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto justify-end">
              <Button
                variant={isSelectionMode ? "secondary" : "outline"}
                size="sm"
                onClick={() => {
                  const next = !isSelectionMode;
                  setIsSelectionMode(next);
                  if (!next) setSelectedIds([]);
                }}
                className={`text-xs h-9 gap-1.5 ${isSelectionMode ? 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800 font-semibold' : ''}`}
                title="Ativar/Desativar seleção múltipla"
              >
                <CheckSquare className="w-3.5 h-3.5 text-orange-600" />
                {isSelectionMode ? 'Cancelar Seleção' : 'Selecionar'}
              </Button>

              {isSelectionMode && selectedIds.length > 0 && (
                <div className="flex items-center gap-2 bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/20 animate-fade-in">
                  <span className="text-xs font-semibold text-primary">{selectedIds.length} selecionada(s)</span>
                  <Button variant="ghost" size="sm" onClick={handleBulkMarkRead} className="h-7 text-xs">
                    <CheckCheck className="w-3 h-3 mr-1 text-emerald-600" /> Marcar Lidas
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleBulkArchive} className="h-7 text-xs">
                    <Archive className="w-3 h-3 mr-1 text-muted-foreground" /> Arquivar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* FILTROS POR CATEGORIA */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide text-xs">
            {[
              { id: 'todas', label: 'Todas', count: notificacoes.length },
              { id: 'naoLidas', label: 'Não Lidas', count: naoLidasCount },
              { id: 'projetos', label: 'Projetos' },
              { id: 'financeiro', label: 'Financeiro' },
              { id: 'crm', label: 'CRM' },
              { id: 'comercial', label: 'Comercial' },
              { id: 'contratos', label: 'Contratos' },
              { id: 'rh', label: 'RH' },
              { id: 'sistema', label: 'Sistema' }
            ].map(tab => (
              <Button
                key={tab.id}
                variant={selectedCategory === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(tab.id)}
                className="h-7 px-3 text-xs rounded-full shrink-0"
              >
                {tab.label} {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* LISTA DE NOTIFICAÇÕES */}
      <Card>
        <CardHeader className="py-3 px-4 border-b flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            {isSelectionMode && (
              <div className="flex items-center gap-2 animate-fade-in">
                <Checkbox 
                  checked={selectedIds.length > 0 && selectedIds.length === filteredNotificacoes.length}
                  onCheckedChange={(checked) => handleSelectAll(!!checked)}
                />
                <span className="text-xs font-semibold text-muted-foreground">Selecionar Todas</span>
              </div>
            )}
            {!isSelectionMode && (
              <span className="text-xs font-semibold text-muted-foreground">Lista de Notificações</span>
            )}
          </div>
          <span className="text-xs text-muted-foreground">Exibindo {filteredNotificacoes.length} resultado(s)</span>
        </CardHeader>
        <CardContent className="p-0 divide-y">
          {filteredNotificacoes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground space-y-3">
              <Bell className="w-12 h-12 opacity-20 mx-auto" />
              <h3 className="text-sm font-semibold">Nenhuma notificação encontrada</h3>
              <p className="text-xs max-w-sm mx-auto">Tente alterar os termos da busca ou ajustar os filtros de categoria acima.</p>
            </div>
          ) : (
            filteredNotificacoes.map((notif) => {
              const isSelected = selectedIds.includes(notif.id);
              return (
                <div 
                  key={notif.id}
                  className={`p-4 transition-colors flex items-start gap-4 ${!notif.lida ? 'bg-primary/5 font-medium' : 'hover:bg-muted/40'} ${isSelected ? 'bg-primary/10' : ''}`}
                >
                  {isSelectionMode && (
                    <Checkbox 
                      checked={isSelected}
                      onCheckedChange={() => handleToggleSelect(notif.id)}
                      className="mt-1 animate-fade-in"
                    />
                  )}

                  <div className="p-2.5 rounded-xl bg-background border shadow-2xs shrink-0">
                    {getCategoryIcon(notif.origem)}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-foreground">{notif.titulo}</h3>
                        {!notif.lida && (
                          <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0">Nova</Badge>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 opacity-60" /> {formatTimeAgo(notif.dataCriacao)}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {notif.descricao}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                      <span className="font-semibold text-foreground/80">{notif.origem}</span>
                      <span className="text-muted-foreground/30">•</span>
                      {getPriorityBadge(notif.prioridade)}
                      <span className="text-muted-foreground/30">•</span>
                      <span className="text-muted-foreground">Por: {notif.responsavel || 'Sistema'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-center">
                    {notif.targetUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          marcarComoLida(notif.id);
                          navigate({ to: notif.targetUrl });
                        }}
                        className="text-xs h-8"
                      >
                        Abrir Módulo <ExternalLink className="w-3 h-3 ml-1.5" />
                      </Button>
                    )}
                    {!notif.lida && (
                      <Button 
                        variant="ghost" 
                        size="icon"
                        title="Marcar como Lida"
                        onClick={() => marcarComoLida(notif.id)}
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-700"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon"
                      title="Arquivar"
                      onClick={() => arquivar(notif.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Archive className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
}

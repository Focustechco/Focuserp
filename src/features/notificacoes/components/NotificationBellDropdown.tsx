import React, { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { 
  Bell, CheckCheck, Settings, ExternalLink, Archive, Check, 
  Briefcase, Wallet, Target, FileText, ShoppingBag, Users, Calendar, 
  ShieldAlert, Layers, Clock, AlertTriangle, CheckCircle2, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNotificacoesStore } from '../useNotificacoesStore';
import { Notificacao, NotificationCategory, NotificationPriority, NotificationType } from '../types';

// Utilitrio para formatar tempo decorrido
function formatTimeAgo(isoString: string): string {
  try {
    const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
    if (diff < 60) return 'agora';
    if (diff < 3600) return `h ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `h ${Math.floor(diff / 3600)}h`;
    return `h ${Math.floor(diff / 86400)}d`;
  } catch {
    return 'recentemente';
  }
}

// Retorna o cone apropriado por categoria
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

// Retorna a cor do badge por prioridade
function getPriorityBadge(prioridade: NotificationPriority) {
  switch (prioridade) {
    case 'Urgente':
      return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 text-[10px] px-1.5 py-0">Urgente</Badge>;
    case 'Alta':
      return <Badge className="bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800 text-[10px] px-1.5 py-0">Alta</Badge>;
    case 'Normal':
      return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 text-[10px] px-1.5 py-0">Normal</Badge>;
    default:
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0">Baixa</Badge>;
  }
}

export function NotificationBellDropdown() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { 
    notificacoes, 
    naoLidasCount, 
    hasNewArrival, 
    marcarComoLida, 
    marcarTodasComoLidas, 
    arquivar 
  } = useNotificacoesStore();

  const handleOpenItem = (notif: Notificacao) => {
    marcarComoLida(notif.id);
    if (notif.targetUrl) {
      navigate({ to: notif.targetUrl });
      setOpen(false);
    }
  };

  const notificacoesNaoLidas = notificacoes.filter(n => !n.lida);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className={`relative transition-all duration-300 ${hasNewArrival ? 'animate-bounce text-primary' : ''}`}
          title="Notificaes do Focus ERP"
        >
          <Bell className="h-4 w-4" />
          {naoLidasCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
              {naoLidasCount > 9 ? '9+' : naoLidasCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[380px] sm:w-[420px] p-0 shadow-2xl border">
        <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">Notificaes</h3>
            {naoLidasCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                {naoLidasCount} nova{naoLidasCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {naoLidasCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => marcarTodasComoLidas()} 
                title="Marcar todas como lidas"
                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="w-3.5 h-3.5 mr-1" /> Lidas
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7" 
              onClick={() => { navigate({ to: '/configuracoes' }); setOpen(false); }}
              title="Preferncias de Notificaes"
            >
              <Settings className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="todas" className="w-full">
          <div className="border-b px-4 pt-1 bg-background">
            <TabsList className="h-8 p-0 bg-transparent gap-4">
              <TabsTrigger value="todas" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-8 text-xs px-1">
                Todas ({notificacoes.length})
              </TabsTrigger>
              <TabsTrigger value="naoLidas" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-8 text-xs px-1">
                No Lidas ({notificacoesNaoLidas.length})
              </TabsTrigger>
            </TabsList>
          </div>

          {/* ABA TODAS */}
          <TabsContent value="todas" className="m-0">
            <ScrollArea className="h-[360px]">
              {notificacoes.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <Bell className="w-8 h-8 opacity-20 mx-auto" />
                  <p className="text-xs font-medium">Nenhuma notificao no momento.</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notificacoes.slice(0, 20).map((notif) => (
                    <div 
                      key={notif.id}
                      className={`p-3.5 transition-colors group hover:bg-muted/60 flex items-start gap-3 cursor-pointer ${!notif.lida ? 'bg-primary/5 font-medium' : ''}`}
                      onClick={() => handleOpenItem(notif)}
                    >
                      <div className="p-2 rounded-lg bg-background border shadow-2xs shrink-0 mt-0.5">
                        {getCategoryIcon(notif.origem)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold leading-snug text-foreground line-clamp-2">
                            {notif.titulo}
                          </h4>
                          <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 opacity-60" /> {formatTimeAgo(notif.dataCriacao)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">
                          {notif.descricao}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-medium text-muted-foreground/80">{notif.origem}</span>
                          <span className="text-muted-foreground/30">"</span>
                          {getPriorityBadge(notif.prioridade)}
                          {!notif.lida && (
                            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 ml-auto" />
                          )}
                        </div>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 shrink-0 ml-1">
                        {!notif.lida && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-6 w-6" 
                            title="Marcar como lida"
                            onClick={(e) => { e.stopPropagation(); marcarComoLida(notif.id); }}
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6" 
                          title="Arquivar"
                          onClick={(e) => { e.stopPropagation(); arquivar(notif.id); }}
                        >
                          <Archive className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          {/* ABA NO LIDAS */}
          <TabsContent value="naoLidas" className="m-0">
            <ScrollArea className="h-[360px]">
              {notificacoesNaoLidas.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground space-y-2">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500/30 mx-auto" />
                  <p className="text-xs font-medium">Todas as notificaes foram lidas!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {notificacoesNaoLidas.map((notif) => (
                    <div 
                      key={notif.id}
                      className="p-3.5 bg-primary/5 hover:bg-muted/80 transition-colors group flex items-start gap-3 cursor-pointer"
                      onClick={() => handleOpenItem(notif)}
                    >
                      <div className="p-2 rounded-lg bg-background border shadow-2xs shrink-0 mt-0.5">
                        {getCategoryIcon(notif.origem)}
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold leading-snug text-foreground line-clamp-2">
                            {notif.titulo}
                          </h4>
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            {formatTimeAgo(notif.dataCriacao)}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {notif.descricao}
                        </p>
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] font-medium">{notif.origem}</span>
                          <span className="text-muted-foreground/30">"</span>
                          {getPriorityBadge(notif.prioridade)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <div className="border-t p-2 text-center bg-muted/20">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs font-semibold text-primary hover:text-primary/90 h-8"
            onClick={() => { navigate({ to: '/notificacoes' }); setOpen(false); }}
          >
            Ver Todas as Notificaes <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

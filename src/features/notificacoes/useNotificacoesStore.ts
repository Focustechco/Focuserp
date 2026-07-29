import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalStorageState } from '@/hooks/useDataStore';
import { Notificacao, UserNotificationPreferences, NotificationCategory, NotificationPriority, NotificationType } from './types';
import { INITIAL_NOTIFICACOES, DEFAULT_PREFERENCES } from './data/initialData';
import { toast } from 'sonner';
import {
  isPushSupported,
  getNotificationPermission,
  setupPushNotifications,
  sendPushNotification,
  showLocalNotification,
  unsubscribeFromPush,
} from '@/lib/push-notifications';

function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sine';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    osc2.frequency.setValueAtTime(1320, ctx.currentTime);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.35);
    osc2.stop(ctx.currentTime + 0.35);
  } catch {
    // Audio context may be blocked by browser policy until user gesture
  }
}

export function useNotificacoesStore() {
  const { data: rawNotificacoes, save: saveNotificacoes } = useLocalStorageState<Notificacao>('focus_notificacoes', INITIAL_NOTIFICACOES);
  const { data: clientes } = useLocalStorageState<any>('focus_clientes');

  // Track read notification IDs in localStorage
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem('focus_read_notif_ids');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const saveReadNotifIds = useCallback((ids: string[]) => {
    setReadNotifIds(ids);
    try {
      window.localStorage.setItem('focus_read_notif_ids', JSON.stringify(ids));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [preferences, setPreferences] = useState<UserNotificationPreferences>(() => {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    try {
      const item = window.localStorage.getItem('focus_notificacoes_prefs');
      return item ? JSON.parse(item) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const savePreferences = useCallback((newPrefs: UserNotificationPreferences) => {
    setPreferences(newPrefs);
    try {
      window.localStorage.setItem('focus_notificacoes_prefs', JSON.stringify(newPrefs));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [hasNewArrival, setHasNewArrival] = useState(false);

  useEffect(() => {
    const handleNewNotif = () => {
      setHasNewArrival(true);
      const timer = setTimeout(() => setHasNewArrival(false), 2000);
      return () => clearTimeout(timer);
    };

    window.addEventListener('focus_new_notification_event', handleNewNotif);
    return () => window.removeEventListener('focus_new_notification_event', handleNewNotif);
  }, []);

  // Dynamically derive client creation notifications from synced Supabase clients
  const clientNotifications = useMemo<Notificacao[]>(() => {
    if (!clientes || !Array.isArray(clientes)) return [];
    return clientes.map((c: any) => {
      const notifId = `notif-client-${c.id}`;
      const isRead = readNotifIds.includes(notifId);
      const name = c.nomeFantasia || c.razaoSocial || c.name || 'Novo Cliente';
      const doc = c.documento ? ` com documento ${c.documento}` : '';

      return {
        id: notifId,
        titulo: `Novo Cliente Cadastrado: ${name}`,
        descricao: `Cliente ${c.tipo || 'Pessoa Jurídica'}${doc} registrado com sucesso no sistema.`,
        origem: 'CRM' as NotificationCategory,
        tipo: 'Sucesso' as NotificationType,
        prioridade: 'Normal' as NotificationPriority,
        lida: isRead,
        arquivada: false,
        dataCriacao: c.dataCadastro || c.created_at || c.ultimaAtualizacao || new Date().toISOString(),
        responsavel: 'Sistema CRM',
        usuarioDestino: 'Você',
        targetUrl: '/clientes',
        entidadeId: c.id
      };
    });
  }, [clientes, readNotifIds]);

  // Combine derived client notifications with manual/custom notifications
  const notificacoes = useMemo<Notificacao[]>(() => {
    const map = new Map<string, Notificacao>();

    // Add client notifications
    clientNotifications.forEach((n) => map.set(n.id, n));

    // Add manual notifications (rawNotificacoes take precedence if ID matches)
    (rawNotificacoes || []).forEach((n) => {
      const isRead = n.lida || readNotifIds.includes(n.id);
      map.set(n.id, { ...n, lida: isRead });
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()
    );
  }, [clientNotifications, rawNotificacoes, readNotifIds]);

  // Dispatcher Global de Notificações
  const notificar = useCallback(
    (payload: {
      titulo: string;
      descricao: string;
      origem: NotificationCategory;
      tipo?: NotificationType;
      prioridade?: NotificationPriority;
      responsavel?: string;
      targetUrl?: string;
      entidadeId?: string;
    }) => {
      const novaNotificacao: Notificacao = {
        id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        titulo: payload.titulo,
        descricao: payload.descricao,
        origem: payload.origem,
        tipo: payload.tipo || 'Informação',
        prioridade: payload.prioridade || 'Normal',
        lida: false,
        arquivada: false,
        dataCriacao: new Date().toISOString(),
        responsavel: payload.responsavel || 'Sistema',
        usuarioDestino: 'Você',
        targetUrl: payload.targetUrl || '/',
        entidadeId: payload.entidadeId
      };

      const updated = [novaNotificacao, ...(rawNotificacoes || [])];
      saveNotificacoes(updated);

      if (preferences.somHabilitado) {
        playNotificationChime();
      }

      window.dispatchEvent(new Event('focus_new_notification_event'));

      if (payload.tipo === 'Sucesso') {
        toast.success(payload.titulo, { description: payload.descricao });
      } else if (payload.tipo === 'Erro' || payload.tipo === 'Crítico') {
        toast.error(payload.titulo, { description: payload.descricao });
      } else if (payload.tipo === 'Aviso') {
        toast.warning(payload.titulo, { description: payload.descricao });
      } else {
        toast.info(payload.titulo, { description: payload.descricao });
      }

      if (preferences.canais.pushNavegador && typeof window !== 'undefined') {
        const permission = getNotificationPermission();
        if (permission === 'granted') {
          const pushPayload = {
            title: payload.titulo,
            body: payload.descricao,
            url: payload.targetUrl || '/',
            tag: `focus-${payload.origem}-${Date.now()}`,
          };

          sendPushNotification(pushPayload)
            .then((sent) => {
              if (!sent) showLocalNotification(pushPayload);
            })
            .catch(() => {
              showLocalNotification(pushPayload);
            });
        }
      }

      return novaNotificacao;
    },
    [rawNotificacoes, saveNotificacoes, preferences]
  );

  const marcarComoLida = useCallback(
    (id: string) => {
      if (!readNotifIds.includes(id)) {
        saveReadNotifIds([...readNotifIds, id]);
      }
      const updated = (rawNotificacoes || []).map((n) => (n.id === id ? { ...n, lida: true } : n));
      saveNotificacoes(updated);
    },
    [readNotifIds, saveReadNotifIds, rawNotificacoes, saveNotificacoes]
  );

  const marcarTodasComoLidas = useCallback(() => {
    const allIds = notificacoes.map((n) => n.id);
    saveReadNotifIds(Array.from(new Set([...readNotifIds, ...allIds])));

    const updated = (rawNotificacoes || []).map((n) => ({ ...n, lida: true }));
    saveNotificacoes(updated);
    toast.success('Todas as notificações foram marcadas como lidas.');
  }, [notificacoes, readNotifIds, saveReadNotifIds, rawNotificacoes, saveNotificacoes]);

  const arquivar = useCallback(
    (id: string) => {
      const updated = (rawNotificacoes || []).map((n) => (n.id === id ? { ...n, arquivada: true } : n));
      saveNotificacoes(updated);
      toast.info('Notificação arquivada.');
    },
    [rawNotificacoes, saveNotificacoes]
  );

  const excluir = useCallback(
    (id: string) => {
      const updated = (rawNotificacoes || []).filter((n) => n.id !== id);
      saveNotificacoes(updated);
      toast.info('Notificação removida.');
    },
    [rawNotificacoes, saveNotificacoes]
  );

  const solicitarPermissaoPush = useCallback(async () => {
    if (!isPushSupported()) {
      toast.error('Este dispositivo/navegador não suporta notificações Push.');
      return false;
    }

    toast.loading('Configurando notificações push...', { id: 'push-setup' });

    const result = await setupPushNotifications('focus-user-default');

    if (result.permission === 'granted' && result.subscribed) {
      savePreferences({
        ...preferences,
        canais: { ...preferences.canais, pushNavegador: true }
      });
      toast.success(
        '🔔 Notificações Push ativadas! Você receberá alertas mesmo com a tela bloqueada.',
        { id: 'push-setup', duration: 5000 }
      );
      return true;
    } else if (result.permission === 'denied') {
      toast.error(
        'Permissão negada. Habilite as notificações nas configurações do seu dispositivo.',
        { id: 'push-setup', duration: 6000 }
      );
      return false;
    } else {
      toast.warning(
        result.error || 'Não foi possível configurar as notificações push.',
        { id: 'push-setup' }
      );
      return false;
    }
  }, [preferences, savePreferences]);

  const desativarPush = useCallback(async () => {
    await unsubscribeFromPush();
    savePreferences({
      ...preferences,
      canais: { ...preferences.canais, pushNavegador: false }
    });
    toast.info('Notificações push desativadas.');
  }, [preferences, savePreferences]);

  const pushAtivo = preferences.canais.pushNavegador && getNotificationPermission() === 'granted';
  const pushSuportado = isPushSupported();

  const naoLidasCount = notificacoes.filter((n) => !n.lida && !n.arquivada).length;
  const notificacoesAtivas = notificacoes.filter((n) => !n.arquivada);

  return {
    notificacoes: notificacoesAtivas,
    todasNotificacoes: notificacoes,
    naoLidasCount,
    hasNewArrival,
    preferences,
    savePreferences,
    notificar,
    marcarComoLida,
    marcarTodasComoLidas,
    arquivar,
    excluir,
    solicitarPermissaoPush,
    desativarPush,
    pushAtivo,
    pushSuportado,
  };
}

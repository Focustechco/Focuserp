/**
 * Focus ERP - Push Notification Client Utilities v2
 * Handles Service Worker registration, VAPID subscription (iOS 16.4+ & Android)
 * and sending push notifications via API backed by Supabase persistence.
 */

const VAPID_PUBLIC_KEY = 'BEweG7jjNfn6TCYk3V68sAjeXapH31Qlcy1DUhmzvB_TV5cUebOrWHlR7QI81BpNb6ivphx-z8pjb906bq1f8tA';

/**
 * Gets or creates a persistent user ID stored in localStorage.
 * This ensures the same device always uses the same subscription slot.
 */
export function getPushUserId(): string {
  if (typeof window === 'undefined') return 'server';
  try {
    let uid = window.localStorage.getItem('focus_push_user_id');
    if (!uid) {
      uid = `user-${crypto.randomUUID()}`;
      window.localStorage.setItem('focus_push_user_id', uid);
    }
    return uid;
  } catch {
    return 'user-default';
  }
}

/**
 * Converts a VAPID base64 string to Uint8Array (required for applicationServerKey)
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Registers the Service Worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[SW] Service Workers not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none', // Always check for SW updates
    });

    // Wait for SW to be active
    await navigator.serviceWorker.ready;

    console.log('[SW] Service Worker registered and ready:', registration.scope);
    return registration;
  } catch (error) {
    console.error('[SW] Service Worker registration failed:', error);
    return null;
  }
}

/**
 * Checks if push notifications are supported on this device/browser.
 * Note: iOS requires the app to be installed as PWA (Add to Home Screen).
 */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Gets the current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Requests notification permission from the user.
 * Must be called in response to a user gesture (tap/click) on iOS.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
  return await Notification.requestPermission();
}

/**
 * Subscribes this device to Web Push (VAPID) and saves subscription to Supabase via API.
 */
export async function subscribeToPush(userId?: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('[Push] Push notifications not supported on this device');
    return null;
  }

  const uid = userId || getPushUserId();

  try {
    // Ensure SW is registered and ready
    let registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    }
    await navigator.serviceWorker.ready;
    registration = await navigator.serviceWorker.getRegistration('/');

    if (!registration) {
      throw new Error('Service Worker registration not found after ready');
    }

    // Get existing subscription or create new one
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    // Save subscription to our API (which persists to Supabase)
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscription, userId: uid }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Unknown' }));
      throw new Error(`API returned ${response.status}: ${err.error}`);
    }

    console.log('[Push] ✅ Successfully subscribed and saved to Supabase for user:', uid);
    return subscription;
  } catch (error) {
    console.error('[Push] Error subscribing:', error);
    return null;
  }
}

/**
 * Unsubscribes this device from push notifications
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  if (!isPushSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return false;

    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return true;

    return await subscription.unsubscribe();
  } catch (error) {
    console.error('[Push] Error unsubscribing:', error);
    return false;
  }
}

/**
 * Sends a push notification via the Focus ERP API to ALL subscribed devices.
 * When Desktop creates a client, this fires to notify ALL mobile devices.
 */
export async function sendPushNotification(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
  userId?: string;
}): Promise<boolean> {
  try {
    const response = await fetch('/api/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: payload.title,
        body: payload.body,
        url: payload.url || '/',
        tag: payload.tag || `focus-${Date.now()}`,
        // Don't filter by userId — send to ALL devices
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.warn('[Push] API send failed:', data.error);
      return false;
    }

    console.log(`[Push] Sent to ${data.sent}/${data.total} device(s)`);
    return data.sent > 0;
  } catch (error) {
    console.error('[Push] Error calling send API:', error);
    return false;
  }
}

/**
 * Shows a local notification immediately via the Service Worker.
 * Works when app is in background (foreground already shows toast).
 */
export async function showLocalNotification(payload: {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration('/');
    if (!registration) return false;

    await registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: payload.tag || `focus-local-${Date.now()}`,
      vibrate: [200, 100, 200],
      data: { url: payload.url || '/' },
    });

    return true;
  } catch (error) {
    console.error('[Push] Error showing local notification:', error);
    return false;
  }
}

/**
 * Full setup: register SW + request permission + subscribe to VAPID push.
 * Call this when user clicks "Ativar Notificações Push" button.
 */
export async function setupPushNotifications(userId?: string): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  error?: string;
}> {
  if (!isPushSupported()) {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
    const isStandalone = ('standalone' in navigator) && (navigator as any).standalone;

    if (isIOS && !isStandalone) {
      return {
        supported: false,
        permission: 'denied',
        subscribed: false,
        error: 'No iPhone/iPad, adicione o app à Tela Inicial primeiro (Share → Adicionar à Tela Inicial) e então abra pelo ícone.',
      };
    }

    return {
      supported: false,
      permission: 'denied',
      subscribed: false,
      error: 'Este navegador não suporta notificações Push.',
    };
  }

  // Register SW first
  await registerServiceWorker();

  // Request permission (must happen from user gesture)
  const permission = await requestNotificationPermission();

  if (permission !== 'granted') {
    return {
      supported: true,
      permission,
      subscribed: false,
      error: permission === 'denied'
        ? 'Permissão negada. Vá em Configurações > Notificações para habilitar.'
        : 'Permissão não concedida.',
    };
  }

  // Subscribe and save to Supabase
  const uid = userId || getPushUserId();
  const subscription = await subscribeToPush(uid);

  return {
    supported: true,
    permission,
    subscribed: !!subscription,
    error: !subscription ? 'Falha ao criar subscrição push. Tente novamente.' : undefined,
  };
}

/**
 * Auto-setup: registers SW silently on app load without requesting permission.
 * Call this in the root layout. Permission is only requested when user clicks the button.
 */
export async function autoRegisterServiceWorker(): Promise<void> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    });
    await navigator.serviceWorker.ready;
    console.log('[SW] Auto-registered on app load');
  } catch (error) {
    console.warn('[SW] Auto-registration failed:', error);
  }
}

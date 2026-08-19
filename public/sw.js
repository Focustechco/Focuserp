// Focus ERP - Service Worker v2
// Handles Web Push Notifications on iOS 16.4+ and Android (locked screen)

const CACHE_NAME = 'focus-erp-v2';
const ICON_URL = '/icon-192.png';
const BADGE_URL = '/icon-192.png';

// ── Install: force immediate activation ───────────────────────────────────────
self.addEventListener('install', function (event) {
  self.skipWaiting();
});

// ── Activate: claim all clients + clean old caches ────────────────────────────
self.addEventListener('activate', function (event) {
  event.waitUntil(
    Promise.all([
      self.clients.claim(),
      caches.keys().then(function (cacheNames) {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        );
      }),
    ])
  );
});

// ── Push Event: fired by server (works on locked screen iOS & Android) ─────────
self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = {
      title: 'Focus ERP',
      body: event.data ? event.data.text() : 'Nova notificação',
    };
  }

  const title = data.title || 'Focus ERP';
  const body = data.body || data.descricao || 'Você tem uma nova notificação.';
  const url = data.url || data.targetUrl || '/';
  const tag = data.tag || 'focus-notif-' + Date.now();

  const options = {
    body: body,
    icon: ICON_URL,
    badge: BADGE_URL,
    tag: tag,
    renotify: true,
    // requireInteraction keeps notification visible until user interacts (Android)
    requireInteraction: data.requireInteraction !== false,
    // vibrate pattern supported on Android
    vibrate: [200, 100, 200],
    // silent: false to play default sound
    silent: false,
    data: {
      url: url,
      notifId: data.notifId || null,
      timestamp: Date.now(),
    },
    actions: [
      { action: 'open', title: '📂 Abrir Focus ERP' },
      { action: 'dismiss', title: '✕ Fechar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification Click ─────────────────────────────────────────────────────────
self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = (event.notification.data && event.notification.data.url) || '/';
  const absoluteUrl = new URL(targetUrl, self.location.origin).href;

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        // Focus existing window if already open
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus();
            if (client.url !== absoluteUrl) {
              client.navigate(absoluteUrl);
            }
            return;
          }
        }
        // Open new window if app is closed
        if (clients.openWindow) {
          return clients.openWindow(absoluteUrl);
        }
      })
  );
});


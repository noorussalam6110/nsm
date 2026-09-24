/* ============================================================ */
/* 🔧 NOORUSSALAM MADRASA — Service Worker v22                  */
/* ============================================================ */

const CACHE_NAME = 'noorussalam-v22';
const RUNTIME_CACHE = 'noorussalam-runtime-v22';

const CORE_FILES = [
  './',
  './login.html',
  './manifest.json'
];

const OPTIONAL_PAGES = [
  './index.html',
  './gallery.html',
  './contact.html',
  './student-zone.html',
  './fees.html',
  './calendar.html'
];

const CDN_RESOURCES = [
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/cropperjs/1.5.12/cropper.min.js',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.6.0/dist/confetti.browser.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.25/jspdf.plugin.autotable.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Anek+Malayalam:wght@300;400;500;600;700;800&display=swap'
];

/* ──────────────────────────────────────────────────────────── */
/* ─── Install ─── */
/* ──────────────────────────────────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('[SW v22] Installing...');
      for (const url of CORE_FILES) {
        try { await cache.add(url); console.log('[SW] ✅ Core:', url); }
        catch (e) { console.log('[SW] ⚠️ Skip:', url); }
      }
      for (const url of OPTIONAL_PAGES) {
        try { await cache.add(url); console.log('[SW] ✅ Optional:', url); }
        catch (e) { console.log('[SW] ⚠️ Skip:', url); }
      }
      for (const url of CDN_RESOURCES) {
        try { await cache.add(url); console.log('[SW] ✅ CDN:', url); }
        catch (e) { console.log('[SW] ⚠️ Skip CDN:', url); }
      }
      console.log('[SW] ✅ Install complete');
    })()
  );
  self.skipWaiting();
});

/* ──────────────────────────────────────────────────────────── */
/* ─── Activate ─── */
/* ──────────────────────────────────────────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.map(name => {
          if (name !== CACHE_NAME && name !== RUNTIME_CACHE) {
            console.log('[SW] 🗑️ Deleting old:', name);
            return caches.delete(name);
          }
        })
      );
      await self.clients.claim();
      console.log('[SW] ✅ Activated v22');
    })()
  );
});

/* ──────────────────────────────────────────────────────────── */
/* ─── Fetch ─── */
/* ──────────────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.hostname.includes('supabase.co')) return;
  if (!url.protocol.startsWith('http')) return;

  // HTML — network first
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith(
      fetch(req).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        return response;
      }).catch(async () => {
        const cached = await caches.match(req);
        if (cached) return cached;
        const path = url.pathname;
        if (path.includes('login')) return (await caches.match('./login.html')) || (await caches.match('./index.html'));
        if (path.includes('gallery')) return (await caches.match('./gallery.html')) || (await caches.match('./login.html'));
        if (path.includes('contact')) return (await caches.match('./contact.html')) || (await caches.match('./login.html'));
        if (path.includes('student-zone')) return (await caches.match('./student-zone.html')) || (await caches.match('./login.html'));
        if (path.includes('fees')) return (await caches.match('./fees.html')) || (await caches.match('./login.html'));
        if (path.includes('calendar')) return (await caches.match('./calendar.html')) || (await caches.match('./login.html'));
        return (await caches.match('./login.html')) || (await caches.match('./index.html'));
      })
    );
    return;
  }

  // CDN — cache first
  if (url.hostname.includes('cdn.jsdelivr.net') ||
      url.hostname.includes('cdnjs.cloudflare.com') ||
      url.hostname.includes('fonts.googleapis.com') ||
      url.hostname.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
          return response;
        }).catch(() => cached || new Response('', { status: 408 }));
      })
    );
    return;
  }

  // Images — cache first
  if (req.destination === 'image') {
    event.respondWith(
      caches.match(req).then(cached => {
        if (cached) return cached;
        return fetch(req).then(response => {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then(cache => cache.put(req, clone));
          return response;
        }).catch(() => cached || new Response('', { status: 408 }));
      })
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).catch(() => cached))
  );
});

/* ──────────────────────────────────────────────────────────── */
/* ─── Message (from app) ─── */
/* ──────────────────────────────────────────────────────────── */
self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data.type === 'CLEAR_BADGE') {
    try { self.navigator.clearAppBadge?.(); } catch (e) {}
  }
});

/* ============================================================ */
/* 🔔 PUSH NOTIFICATION HANDLER — v22 Enhanced                  */
/* ============================================================ */
self.addEventListener('push', function(event) {
  /* Default payload */
  let data = {
    title: 'Noorussalam Madrasa',
    body: 'പുതിയ അറിയിപ്പ്',
    type: 'general',
    url: './login.html',
    tag: 'nsm-default',
    requireInteraction: false,
    timestamp: Date.now()
  };

  /* Parse incoming payload */
  try {
    if (event.data) {
      data = Object.assign({}, data, event.data.json());
    }
  } catch (e) {
    console.log('[SW] Push data parse error:', e);
    if (event.data) {
      try { data.body = event.data.text(); } catch (_) {}
    }
  }

  console.log('[SW] 📩 Push received:', data.title, '| type:', data.type, '| url:', data.url);

  /* Build notification options */
  const isUrgent = data.type === 'urgent';
  const isFee = data.type === 'fee';
  const isGreeting = data.type === 'greeting';

  /* Vibrate patterns by type */
  let vibrate = [100];
  if (isUrgent) vibrate = [200, 100, 200, 100, 200];
  else if (isFee) vibrate = [180, 100, 180];
  else if (isGreeting) vibrate = [80, 60, 80];

  /* Icon per type */
  let icon = 'https://i.postimg.cc/DznFT7L9/IMG-3167.png';
  let badge = 'https://i.postimg.cc/DznFT7L9/IMG-3167.png';

  /* Tag — same tag = replace പഴയത് (spam ഒഴിവാക്കാൻ) */
  const tag = data.tag || ('nsm-' + Date.now());

  /* Actions (buttons on the notification) */
  const actions = isUrgent
    ? [
        { action: 'open', title: '📖 കാണുക' },
        { action: 'close', title: 'Dismiss' }
      ]
    : isFee
      ? [
          { action: 'pay', title: '💰 Pay' },
          { action: 'close', title: 'Dismiss' }
        ]
      : [];

  event.waitUntil(
    (async () => {
      /* Badge count increment */
      try {
        if ('setAppBadge' in self.navigator) {
          await self.navigator.setAppBadge(data.count || 1);
        }
      } catch (e) {}

      /* Show the notification */
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: icon,
        badge: badge,
        tag: tag,
        renotify: true,          // same tag → ഉപഭോക്താവിനെ alert ചെയ്യും
        vibrate: vibrate,
        requireInteraction: isUrgent || !!data.requireInteraction,
        silent: false,
        data: {
          url: data.url || './login.html',
          type: data.type || 'general',
          timestamp: data.timestamp || Date.now()
        },
        actions: actions
      });

      console.log('[SW] ✅ Notification shown | tag:', tag);
    })()
  );
});

/* ============================================================ */
/* 🎯 NOTIFICATION CLICK — Handle all URL types                 */
/* ============================================================ */
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] 🔔 Notification clicked | action:', event.action);
  event.notification.close();

  /* Dismiss action — just close */
  if (event.action === 'close') {
    return;
  }

  /* Get target URL from notification */
  let targetUrl = './login.html';
  if (event.notification.data && event.notification.data.url) {
    targetUrl = event.notification.data.url;
  }

  /* Fee reminder — force open passbook */
  if (event.action === 'pay') {
    targetUrl = './login.html#palathulli';
  }

  console.log('[SW] 🎯 Target URL:', targetUrl);

  /* Clear badge */
  try {
    if ('clearAppBadge' in self.navigator) {
      self.navigator.clearAppBadge();
    }
  } catch (e) {}

  event.waitUntil(
    (async () => {
      const clientList = await clients.matchAll({
        type: 'window',
        includeUncontrolled: true
      });

      /* Absolute URL (external link) */
      if (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) {
        const isSameOrigin = targetUrl.startsWith(self.location.origin);

        /* Same origin — try to focus existing window */
        if (isSameOrigin) {
          for (const client of clientList) {
            if (client.url.startsWith(self.location.origin) && 'focus' in client) {
              try {
                if ('navigate' in client && client.url !== targetUrl) {
                  await client.navigate(targetUrl);
                }
                return client.focus();
              } catch (e) {
                console.warn('[SW] Navigate failed:', e);
              }
            }
          }
        }

        /* External or no window — open new */
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
        return;
      }

      /* Relative URL — normalize to absolute using SW origin */
      let absoluteUrl = targetUrl;
      if (targetUrl.startsWith('./')) {
        absoluteUrl = new URL(targetUrl, self.location.origin).href;
      } else if (targetUrl.startsWith('/')) {
        absoluteUrl = self.location.origin + targetUrl;
      } else {
        absoluteUrl = new URL(targetUrl, self.location.origin).href;
      }

      console.log('[SW] 🎯 Absolute URL:', absoluteUrl);

      /* Try to find existing window */
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && 'focus' in client) {
          try {
            /* Only navigate if different URL */
            if ('navigate' in client) {
              const clientHash = new URL(client.url).hash;
              const targetHash = new URL(absoluteUrl).hash;
              if (clientHash !== targetHash) {
                await client.navigate(absoluteUrl);
              }
            }
            return client.focus();
          } catch (e) {
            console.warn('[SW] Focus/navigate failed:', e);
          }
        }
      }

      /* No existing window — open new */
      if (clients.openWindow) {
        return clients.openWindow(absoluteUrl);
      }
    })()
  );
});

/* ──────────────────────────────────────────────────────────── */
/* ─── Notification Close — clear badge ─── */
/* ──────────────────────────────────────────────────────────── */
self.addEventListener('notificationclose', function(event) {
  console.log('[SW] 🔕 Notification closed');
  try {
    if ('clearAppBadge' in self.navigator) {
      self.navigator.clearAppBadge();
    }
  } catch (e) {}
});

/* ──────────────────────────────────────────────────────────── */
/* ─── Background Sync (future-ready) ─── */
/* ──────────────────────────────────────────────────────────── */
self.addEventListener('sync', function(event) {
  if (event.tag === 'nsm-sync') {
    console.log('[SW] 🔄 Background sync triggered');
  }
});

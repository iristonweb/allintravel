// Custom notification sound: supported mainly on installed mobile PWAs; desktop Chrome may ignore.
const CACHE_NAME = "ait-v3";
const DEFAULT_NOTIFICATION_SOUND = "/sounds/notify-short.wav";
const OFFLINE_URLS = ["/", "/places", "/api/places?limit=20"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS).catch(() => undefined)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && request.url.startsWith(self.location.origin)) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
  );
});

self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? { title: "All In Travel", body: "Новое уведомление", url: "/" };
  const soundKind = data.soundKind === "ait" ? "ait" : "default";
  event.waitUntil(
    (async () => {
      await self.registration.showNotification(data.title, {
        body: data.body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        tag: data.tag || "ait-notification",
        sound: data.sound || DEFAULT_NOTIFICATION_SOUND,
        data: {
          url: data.url || "/",
          sound: data.sound || DEFAULT_NOTIFICATION_SOUND,
          soundKind,
        },
      });
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        client.postMessage({ type: "PLAY_NOTIFICATION_SOUND", soundKind });
        if (data.notificationId) {
          client.postMessage({
            type: "PUSH_NOTIFICATION_SHOWN",
            notificationId: data.notificationId,
          });
        }
      }
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});

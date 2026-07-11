/* ValiSys - Service Worker PWA + Web Push */
const VALISYS_CACHE = "valisys-pwa-v3";

const APP_SHELL = [
  "./",
  "./index.html",
  "./dashboard.html",
  "./css/styles.css",
  "./js/pwa-register.js",
  "./js/push-notifications-v2.js",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/logo/valisys-mark.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(VALISYS_CACHE)
      .then(cache => cache.addAll(APP_SHELL))
      .catch(() => null)
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys
        .filter(key => key !== VALISYS_CACHE)
        .map(key => caches.delete(key))
    ))
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(request)
      .then(response => {
        const copy = response.clone();
        caches.open(VALISYS_CACHE).then(cache => cache.put(request, copy)).catch(() => null);
        return response;
      })
      .catch(() => caches.match(request))
  );
});

self.addEventListener("push", event => {
  let dados = {};

  try {
    dados = event.data ? event.data.json() : {};
  } catch (erro) {
    dados = {
      title: "ValiSys",
      body: event.data ? event.data.text() : "Você tem uma nova notificação."
    };
  }

  const title = dados.title || "ValiSys";
  const options = {
    body: dados.body || "Você tem uma nova notificação.",
    icon: "./assets/icons/icon-192.png",
    badge: "./assets/icons/icon-192.png",
    tag: dados.tag || "valisys-notificacao",
    renotify: true,
    data: {
      url: dados.url || "./dashboard.html",
      lojaId: dados.lojaId || "",
      lancamentoId: dados.lancamentoId || "",
      tipo: dados.tipo || ""
    },
    actions: [
      {
        action: "abrir",
        title: "Abrir ValiSys"
      }
    ]
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", event => {
  event.notification.close();

  const destino = event.notification.data?.url || "./dashboard.html";
  const url = new URL(destino, self.registration.scope).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(janelas => {
      for (const janela of janelas) {
        if (janela.url.includes("dashboard.html") && "focus" in janela) {
          return janela.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

      return null;
    })
  );
});

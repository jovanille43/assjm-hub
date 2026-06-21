// Service worker ASSJM HUB — network-first, repli cache intelligent.
// v2 : ne sert plus la home à la place d'un 404, ne met pas en cache les
// réponses en erreur, et propose une page hors-ligne dédiée.
const CACHE = "assjm-hub-v3";
const OFFLINE_URL = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.add(OFFLINE_URL)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // On ne gère que les GET de même origine ; le reset passe au réseau direct.
  if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
    return;
  }

  // Ne jamais mettre en cache les routes dynamiques (API, auth).
  const url = new URL(request.url);
  if (url.pathname.startsWith("/api") || url.pathname.startsWith("/_next/data")) {
    return;
  }

  const isNavigation =
    request.mode === "navigate" ||
    (request.headers.get("accept") || "").includes("text/html");

  event.respondWith(
    fetch(request)
      .then((response) => {
        // Ne mettre en cache que les réponses valides (pas les 404/500).
        if (response.ok && response.type === "basic") {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(async () => {
        // Hors-ligne : on tente le cache exact, sinon page hors-ligne dédiée
        // pour une navigation (jamais la home déguisée en 404).
        const cached = await caches.match(request);
        if (cached) return cached;
        if (isNavigation) return caches.match(OFFLINE_URL);
        return Response.error();
      }),
  );
});

// ── Push notifications ──
self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "ASSJM HUB", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "ASSJM HUB";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      data: { url: data.url || "/dashboard" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ("focus" in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return self.clients.openWindow(url);
    }),
  );
});

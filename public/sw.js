const CACHE_VERSION = "v4";
const CACHE_NAME = `lumni-static-${CACHE_VERSION}`;
const RUNTIME_CACHE = `lumni-runtime-${CACHE_VERSION}`;
const HTML_CACHE = `lumni-html-${CACHE_VERSION}`;

const STATIC_ASSETS = [
  "/manifest.json",
  "/web-app-manifest-192x192.png",
  "/web-app-manifest-512x512.png",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        STATIC_ASSETS.map((url) =>
          cache.add(url).catch((err) => {
            console.warn("[sw] failed to precache", url, err);
          }),
        ),
      ),
    ),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Self-unregister in dev mode so the SW never interferes with HMR.
  if (self.location.hostname === "localhost" || self.location.hostname === "127.0.0.1") {
    event.waitUntil(
      self.registration
        .unregister()
        .then(() => caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n))))),
    );
    return;
  }

  const keep = new Set([CACHE_NAME, RUNTIME_CACHE, HTML_CACHE]);
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(cacheNames.flatMap((name) => (keep.has(name) ? [] : [caches.delete(name)]))),
      ),
  );
  self.clients.claim();
});

function isBuildArtifact(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/_next/data/") ||
    url.pathname.startsWith("/_next/image") ||
    url.pathname === "/sw.js"
  );
}

function isHtmlNavigation(request, url) {
  if (request.mode === "navigate") return true;
  const accept = request.headers.get("accept") || "";
  if (accept.includes("text/html")) return true;
  return /\.(html)$/i.test(url.pathname);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") return;
  if (request.mode === "websocket") return;
  if (request.destination === "") return;

  const url = new URL(request.url);

  if (url.origin !== location.origin) return;

  // Skip internal Next.js dev server / Vite HMR traffic.
  if (
    url.pathname.startsWith("/__next") ||
    url.pathname.startsWith("/@vite") ||
    url.pathname.startsWith("/node_modules/.vite")
  )
    return;

  // Build artifacts (JS/CSS chunks, RSC payloads, optimized images): pass through.
  // Browser HTTP cache + Vercel's immutable headers handle these correctly and
  // we must NEVER serve stale hashed chunks across deployments.
  if (isBuildArtifact(url)) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request, RUNTIME_CACHE));
    return;
  }

  if (isHtmlNavigation(request, url)) {
    event.respondWith(networkFirstHtml(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, CACHE_NAME));
});

async function networkFirstHtml(request) {
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      const cache = await caches.open(HTML_CACHE);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request, { ignoreSearch: true });
    if (cached) return cached;
    const offline = await caches.match("/offline", { ignoreSearch: true });
    return (
      offline || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } })
    );
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    if (cached) return cached;
    return new Response(null, { status: 503, statusText: "Offline" });
  }
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return new Response(JSON.stringify({ error: "Offline", cached: false }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
}

self.addEventListener("push", (event) => {
  if (!event.data) return;

  const data = event.data.json();
  const options = {
    body: data.body || "Time to study!",
    icon: "/web-app-manifest-192x192.png",
    badge: "/web-app-manifest-192x192.png",
    vibrate: [100, 50, 100],
    data: {
      url: data.url || "/dashboard",
      timestamp: Date.now(),
    },
    actions: [
      { action: "study", title: "Start Studying" },
      { action: "snooze", title: "Snooze 1hr" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title || "Lumni", options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "snooze") {
    setTimeout(
      () => {
        self.registration.showNotification("⏰ Reminder", {
          body: "Time to continue your study session!",
          icon: "/web-app-manifest-192x192.png",
        });
      },
      60 * 60 * 1000,
    );
    return;
  }

  const url = event.notification.data?.url || "/dashboard";
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === url && "focus" in client) {
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data?.type === "CACHE_QUESTIONS") {
    const { subject, questions } = event.data;
    caches.open(RUNTIME_CACHE).then((cache) => {
      const response = new Response(JSON.stringify(questions), {
        headers: { "Content-Type": "application/json" },
      });
      cache.put(`/api/questions?subject=${subject}`, response);
    });
  }

  if (event.data?.type === "CLEAR_ALL_CACHES") {
    event.waitUntil(caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))));
  }
});

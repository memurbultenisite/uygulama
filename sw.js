/* Memur Bülteni – çevrimdışı önbellek. Yeni sürümde SURUM değişir. */
const SURUM = "mb-2026-11-27b";
const CEKIRDEK = ["./", "./index.html", "./manifest.webmanifest", "./icons/icon-192.png", "./icons/logo-96.png", "./data/ilanlar.js", "./data/haberler.js"];
self.addEventListener("install", e => { e.waitUntil(caches.open(SURUM).then(c => c.addAll(CEKIRDEK)).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x !== SURUM).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if (e.request.method !== "GET" || u.origin !== location.origin) return;
  // Sayfa, haberler ve ilanlar: önce ağ (hep güncel), internet yoksa önbellek. Simgeler: önce önbellek.
  const agOnce = e.request.mode === "navigate" || /\.js$|\.json$|\.html$|\/$|\.webmanifest$/.test(u.pathname);
  e.respondWith(agOnce
    ? fetch(e.request, { cache: "no-cache" }).then(r => { const k = r.clone(); caches.open(SURUM).then(c => c.put(e.request, k)); return r; }).catch(() => caches.match(e.request))
    : caches.match(e.request).then(m => m || fetch(e.request).then(r => { const k = r.clone(); caches.open(SURUM).then(c => c.put(e.request, k)); return r; })));
});

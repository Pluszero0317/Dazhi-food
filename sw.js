/* 離線快取。頁面（index.html）一律「先連網取最新版、連不上才用快取」，所以不會卡在舊版。 */
const CACHE = "dazhi-static-v2";
const INDEX = new URL("index.html", self.registration.scope).href;
const PRECACHE = ["index.html", "manifest.webmanifest", "favicon-48.png", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => Promise.all(PRECACHE.map(u => fetch(u, { cache: "reload" }).then(r => r.ok && c.put(new URL(u, self.registration.scope).href, r)).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function pageFromNetwork(req) {
  const cache = await caches.open(CACHE);
  try {
    const bust = new URL(INDEX);
    bust.searchParams.set("_", Date.now());
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    const res = await fetch(bust.href, { cache: "no-store", signal: ctrl.signal });
    clearTimeout(timer);
    if (res.ok) {
      cache.put(INDEX, res.clone());
      return res;
    }
  } catch (err) { /* 離線或太慢：改用快取 */ }
  return (await cache.match(INDEX)) || fetch(req);
}

async function staleWhileRevalidate(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const net = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => hit);
  return hit || net;
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const r = await fetch(req);
    if (r.ok || r.type === "opaque") cache.put(req, r.clone());
    return r;
  } catch (err) { return hit || Response.error(); }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (req.mode === "navigate") { e.respondWith(pageFromNetwork(req)); return; }
  if (url.origin === self.location.origin) {
    if (url.pathname.endsWith("version.json") || url.pathname.endsWith("sw.js")) return;
    e.respondWith(staleWhileRevalidate(req));
    return;
  }
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") e.respondWith(cacheFirst(req));
});

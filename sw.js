// Service worker: tiene una copia dell'app sul computer, così l'app installata
// parte anche senza connessione (o, in locale, a server spento).
// In cache vanno solo i file dell'app: mai dati dei clienti.
//
// Quando cambiano i file dell'app, aumentare VERSIONE: al primo avvio con il
// server acceso la nuova versione viene scaricata e usata dall'avvio successivo.
const VERSIONE = 'vp-2026-10-09-4';

const APP = [
  './', 'index.html', 'style.css', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png',
  'app.js', 'archivio.js', 'bolla.js', 'defs.js', 'impostazioni.js', 'level.js', 'movimenti.js', 'photo.js', 'pose.js',
  'privacy.js', 'report.js', 'suggerimenti.js', 'test-foto.js', 'tests-catalogo.js', 'tests-logic.js', 'tests-ui.js',
  'util.js', 'video.js',
];
const MOTORE = [
  'vendor/mediapipe/vision_bundle.mjs',
  'vendor/mediapipe/wasm/vision_wasm_internal.js', 'vendor/mediapipe/wasm/vision_wasm_internal.wasm',
  'vendor/mediapipe/wasm/vision_wasm_nosimd_internal.js', 'vendor/mediapipe/wasm/vision_wasm_nosimd_internal.wasm',
  'vendor/models/pose_landmarker_heavy.task', 'vendor/models/pose_landmarker_full.task', 'vendor/models/hand_landmarker.task',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSIONE).then((c) => c.addAll([...APP, ...MOTORE])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSIONE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  // Motore e modelli (~60 MB): prima la cache, non cambiano quasi mai
  if (url.pathname.includes('/vendor/')) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
    return;
  }
  // File dell'app: prima la rete (= versione più recente), altrimenti la copia.
  // Con una rete lenta dopo 3 s si usa la copia, così l'app non resta bloccata.
  const dallaCopia = () => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./'));
  const rete = fetch(req).then((r) => {
    if (r.ok) { const copia = r.clone(); caches.open(VERSIONE).then((c) => c.put(req, copia)); }
    return r;
  });
  e.respondWith(new Promise((resolve) => {
    let fatto = false;
    const usa = (p) => p.then((r) => { if (r && !fatto) { fatto = true; resolve(r); } return r; });
    const timer = setTimeout(() => usa(dallaCopia()), 3000);
    usa(rete).catch(() => { clearTimeout(timer); usa(dallaCopia()).then((r) => { if (!r && !fatto) resolve(Response.error()); }); });
  }));
});

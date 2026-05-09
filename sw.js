// sw.js — Service Worker — Depósito Aprov
// Versão: incrementar aqui ao fazer mudanças nos arquivos
const CACHE = 'deposito-v1';

// Arquivos que ficam em cache para uso offline
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/config.js',
  '/js/state.js',
  '/js/utils.js',
  '/js/tema.js',
  '/js/auth.js',
  '/js/cache.js',
  '/js/nav.js',
  '/js/dashboard.js',
  '/js/qr.js',
  '/js/autocomplete.js',
  '/js/entrada.js',
  '/js/saida.js',
  '/js/estoque.js',
  '/js/modal_produto.js',
  '/js/diario.js',
  '/js/export.js',
  '/js/relatorio.js',
  '/js/usuarios.js',
  '/js/events.js',
  '/assets/intendencia.png',
  '/assets/intendencia.png',
  '/assets/intendencia2.png',
  '/manifest.json',
  // Fontes e libs externas
  'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=DM+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap',
];

// Instala e faz cache dos assets principais
self.addEventListener('install', evt => {
  evt.waitUntil(
    caches.open(CACHE).then(cache => {
      // Cache individual para não travar se algum arquivo falhar
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(err => {
          console.warn('[SW] Falha ao cachear:', url, err.message);
        }))
      );
    }).then(() => self.skipWaiting())
  );
});

// Ativa e remove caches antigos
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network First para Firebase, Cache First para assets locais
self.addEventListener('fetch', evt => {
  const url = new URL(evt.request.url);

  // Firebase, reCAPTCHA e APIs externas — sempre rede (nunca cache)
  if (
    url.hostname.includes('firebase') ||
    url.hostname.includes('google') ||
    url.hostname.includes('gstatic') ||
    url.hostname.includes('unpkg') ||
    url.hostname.includes('cdnjs') ||
    url.hostname.includes('googleapis')
  ) {
    // Para Firebase: tenta rede, não faz fallback para cache
    evt.respondWith(fetch(evt.request).catch(() => {
      // Se Firebase falhar e for navegação, retorna o index cacheado
      if (evt.request.mode === 'navigate') {
        return caches.match('/index.html');
      }
    }));
    return;
  }

  // Assets locais (CSS, JS, imagens) — Cache First com fallback para rede
  evt.respondWith(
    caches.match(evt.request).then(cached => {
      if (cached) return cached;
      return fetch(evt.request).then(response => {
        // Atualiza o cache com a versão mais recente
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(evt.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback final para navegação
        if (evt.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Recebe mensagem para forçar atualização do cache
self.addEventListener('message', evt => {
  if (evt.data === 'skipWaiting') self.skipWaiting();
});

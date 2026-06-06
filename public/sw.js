const CACHE = 'phonics-v3';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // 仅缓存静态资源，HTML 页面始终走网络
  const url = new URL(e.request.url);
  if (url.pathname.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff2|json|mp3|mp4)$/)) {
    e.respondWith(
      caches.match(e.request).then(cached =>
        cached || fetch(e.request).then(resp => {
          if (resp.ok) { const clone = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
          return resp;
        })
      )
    );
  }
  // HTML pages: always network first, fallback to cache
  else {
    e.respondWith(
      fetch(e.request).then(resp => {
        if (resp.ok) { const clone = resp.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
        return resp;
      }).catch(() => caches.match(e.request))
    );
  }
});

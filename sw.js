const CACHE_NAME = 'psychosuite-cache-v1';
// Файлы, составляющие "оболочку" приложения.
const APP_SHELL_URLS = [
  './',
  './index.html',
  './index.js',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap'
];

// При установке кэшируем оболочку приложения
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Кэширование оболочки приложения');
        // Используем no-cache, чтобы всегда получать свежие версии из сети при установке
        const requests = APP_SHELL_URLS.map(url => new Request(url, {cache: 'no-cache'}));
        return cache.addAll(requests);
      })
      .catch(error => {
        console.error("Не удалось закэшировать оболочку:", error);
      })
  );
});

// При запросе используем стратегию "сначала кэш, потом сеть"
self.addEventListener('fetch', (event) => {
  // Мы кэшируем только GET запросы
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Для CDN-ресурсов используем стратегию "кэш, затем сеть с обновлением"
  if (event.request.url.startsWith('https://esm.sh') || event.request.url.startsWith('https://fonts.googleapis.com')) {
      event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
          const cachedResponse = await cache.match(event.request);
          const fetchedResponse = fetch(event.request).then(networkResponse => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
          return cachedResponse || fetchedResponse;
        })
      );
      return;
  }

  // Для локальных ресурсов используем "сначала кэш, потом сеть"
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        // Если есть ответ в кэше, возвращаем его
        if (cachedResponse) {
          return cachedResponse;
        }
        
        // Если нет, идем в сеть
        return fetch(event.request);
      })
  );
});


// При активации удаляем старые кэши
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Удаление старого кэша', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
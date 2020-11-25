const FILES_TO_CACHE = [
    "/",
    "/index.html",
    "/styles.css",
    "/index.js",
    "/webpack.config.js",
    "/icons/icon-192x192.png",
    "/icons/icon-512x512.png",
    "/db.js",
  ];
  
  const CACHE_NAME = "static-cache-v2";
  const DATA_CACHE_NAME = "data-cache-v1";
  
  // Install and add service worker
  self.addEventListener("install", function(evt) {
    evt.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        console.log("Your files were pre-cached successfully!");
        return cache.addAll(FILES_TO_CACHE);
      })
    );
  
    self.skipWaiting();
  });
  
  // Activate service worker and remove old data from the cache
  self.addEventListener("activate", function(evt) {
    evt.waitUntil(
      caches.keys().then(keyList =>
        Promise.all(
          keyList.map(key => {
            if (key !== CACHE_NAME && key !== DATA_CACHE_NAME) {
              console.log("Removing old cache data", key);
              return caches.delete(key);
            }
          })
        )
      )
    );
  
    self.clients.claim();
  });
  
  // Enable the service worker to catch network requests
  self.addEventListener("fetch", function(evt) {
    if (evt.request.url.includes("/api/")) {
      evt.respondWith(
        caches
          .open(DATA_CACHE_NAME)
          .then(cache =>
            fetch(evt.request)
              .then(response => {
                // If the response was good, cache it.
                if (response.status === 200) {
                  cache.put(evt.request.url, response.clone());
                }
  
                return response;
              })
              .catch(err =>
                // if network request failed, try to get it from the cache.
                cache.match(evt.request)
              )
          )
          .catch(err => console.log(err))
      );
  
      return;
    }
    
    // Offline accessibility, shows files from the cache
    evt.respondWith(
      caches
        .open(CACHE_NAME)
        .then(cache =>
          cache
            .match(evt.request)
            .then(response => response || fetch(evt.request))
        )
    );
  });
  
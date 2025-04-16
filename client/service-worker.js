// This is the service worker for the TSK Platform PWA
// Temporarily disabled for debugging - will be reenabled after fixing issues

const CACHE_NAME = 'tsk-platform-v3';
// Updated cache list to match actual files in the Vite build
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/offline.html',
  '/icons/app-icon-192.svg',
  '/icons/app-icon-512.svg'
];

// Install a service worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

// Cache and return requests with better error handling
self.addEventListener('fetch', (event) => {
  // Only handle GET requests - ignore other methods like POST/PUT etc.
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip API calls and WebSocket connections - only cache static assets
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('/ws') || 
      event.request.url.startsWith('ws:') || 
      event.request.url.startsWith('wss:')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        
        // Clone the request in case we need to retry it
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then((response) => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response before using it to respond and cache
            const responseToCache = response.clone();

            // Cache the successful response asynchronously
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              })
              .catch(err => {
                console.warn('Failed to cache response:', err);
              });

            return response;
          })
          .catch(error => {
            console.error('Fetch failed in service worker:', error);
            
            // Return a custom offline page if we have one
            // or fall back to whatever is in the cache
            return caches.match('/offline.html')
              .then(offlineResponse => {
                return offlineResponse || new Response('You are offline and the content could not be loaded.');
              });
          });
      })
  );
});

// Update a service worker
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // Claim control immediately, instead of waiting for a navigation
  self.clients.claim();
});

// Handle messages from the client
self.addEventListener('message', (event) => {
  console.log('Service worker received message:', event.data);
  
  if (event.data && event.data.type === 'SYNC_MINING_DATA') {
    // Mining data sync handling
    console.log('Handling mining data sync request');
    
    // Get the client that sent the message
    const client = event.source;
    
    // Sending a simple acknowledgment
    client.postMessage({
      type: 'SYNC_RESPONSE',
      success: true,
      timestamp: new Date().toISOString()
    });
    
    // Here we would typically:
    // 1. Look up stored mining data in IndexedDB
    // 2. Try to sync it to the server
    // 3. Report back success/failure
  }
});
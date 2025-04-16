// This is a simplified service worker implementation to handle push notifications
// And offline content caching for the TSK Platform

/// <reference lib="webworker" />

// Tell TypeScript this is a ServiceWorker script
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'tsk-cache-v1';

// Basic service worker lifecycle events
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing Service Worker');
  
  // Skip waiting so the new service worker activates immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating Service Worker');
  
  // Claim all clients so the page is immediately under SW control
  event.waitUntil(self.clients.claim());
  
  // Clean up old caches
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          return cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
  );
});

// Handle fetch requests - network first with cache fallback
self.addEventListener('fetch', (event) => {
  // For API calls, we'll use a network-first strategy
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          // Clone the response for caching
          const responseToCache = response.clone();
          
          // Cache important API responses for offline use
          if (
            event.request.url.includes('/api/user') ||
            event.request.url.includes('/api/mining/') ||
            event.request.url.includes('/api/notifications')
          ) {
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseToCache);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if available
          return caches.match(event.request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // If no cache is available, return an offline response
            return new Response(
              JSON.stringify({
                error: 'You are currently offline. Please check your connection.'
              }),
              {
                headers: { 'Content-Type': 'application/json' },
                status: 503
              }
            );
          });
        })
    );
    return;
  }
  
  // For regular page assets, use a cache-first strategy
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // Not in cache, fetch from network
      return fetch(event.request).then(response => {
        // Don't cache non-successful responses or non-GET requests
        if (!response || response.status !== 200 || event.request.method !== 'GET') {
          return response;
        }
        
        // Clone the response for caching
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      });
    })
  );
});

// Handle push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  try {
    // Try to parse the notification data
    const data = event.data.json();
    const title = data.title || 'TSK Platform Notification';
    const options = {
      body: data.body || 'You have a new notification',
      icon: data.icon || '/app-icon-192.svg',
      badge: data.badge || '/icons/notification-badge.png',
      tag: data.tag || 'default',
      data: data.data || { url: '/' },
      requireInteraction: !!data.requireInteraction,
      actions: data.actions || []
    };
    
    console.log('[Service Worker] Push notification received:', data);
    
    // Show the notification
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error processing push notification:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  // Close the notification
  event.notification.close();
  
  // Get any custom data
  const data = event.notification.data || {};
  let url = data.url || '/';
  
  // Handle different action clicks
  if (event.action) {
    // Custom actions can specify their own URLs
    switch (event.action) {
      case 'view':
        url = data.viewUrl || url;
        break;
      case 'dismiss':
        // Just close the notification
        return;
      default:
        // Try to get a URL for the action
        url = data[`${event.action}Url`] || url;
    }
  }
  
  // Focus existing window or open a new one
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clientsList => {
      // Try to find an existing window to focus
      for (const client of clientsList) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If no matching client found, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })
  );
});

// Handle notification close events
self.addEventListener('notificationclose', (event) => {
  // Could be used for analytics
  console.log('[Service Worker] Notification dismissed', event.notification.data);
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URLS') {
    // Cache URLs sent from the main application
    event.waitUntil(
      caches.open(CACHE_NAME).then(cache => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    // Clear the cache on request
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        if (event.ports && event.ports[0]) {
          event.ports[0].postMessage({ success: true });
        }
      })
    );
  }
});

// Register a sync event for background syncing when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-actions') {
    // You could implement a background sync for pending operations
    console.log('[Service Worker] Background sync triggered');
  }
});

console.log('[Service Worker] Service Worker registered');
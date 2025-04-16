// TSK Platform Service Worker
// This service worker enables offline functionality and PWA features

const CACHE_NAME = 'tsk-platform-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
];

// Install event - cache key app assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching app shell assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.error('Service Worker: Cache install failed', err))
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch event - serve from cache if available, otherwise fetch from network
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  // Skip third-party requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // If resource is in cache, return it
        if (response) {
          return response;
        }
        
        // Otherwise fetch from network
        return fetch(event.request).then((fetchResponse) => {
          // Check if valid response
          if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
            return fetchResponse;
          }
          
          // Clone the response - one to return, one to cache
          const responseToCache = fetchResponse.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
            
          return fetchResponse;
        });
      })
      .catch(() => {
        // If offline and resource not cached, try to serve the offline page
        if (event.request.headers.get('accept').includes('text/html')) {
          return caches.match('/');
        }
      })
  );
});

// Handle offline mining actions
const storedMiningActions = [];

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Received message', event.data);
  
  // Handle SYNC_MINING_DATA messages
  if (event.data && event.data.type === 'SYNC_MINING_DATA') {
    const port = event.ports[0];
    
    // Attempt to sync all stored mining actions
    syncStoredMiningActions()
      .then((result) => {
        port.postMessage({
          success: true,
          synced: result.synced,
          total: result.total
        });
      })
      .catch((error) => {
        port.postMessage({
          success: false,
          error: error.message
        });
      });
  }
  
  // Handle STORE_MINING_ACTION messages
  if (event.data && event.data.type === 'STORE_MINING_ACTION') {
    const miningAction = event.data.action;
    storeOfflineMiningAction(miningAction);
    
    // If port is available, confirm storage
    if (event.ports && event.ports[0]) {
      event.ports[0].postMessage({
        success: true,
        stored: true
      });
    }
  }
});

// Store an offline mining action
function storeOfflineMiningAction(action) {
  // Add timestamp if not already present
  if (!action.timestamp) {
    action.timestamp = Date.now();
  }
  
  // Add unique ID for tracking
  action.id = `mining_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store in the array
  storedMiningActions.push(action);
  
  // Also save to IndexedDB for persistence
  saveToIndexedDB(action);
  
  console.log('Service Worker: Stored offline mining action', action);
}

// Sync stored mining actions with the server
async function syncStoredMiningActions() {
  // First, load any actions from IndexedDB
  await loadFromIndexedDB();
  
  let synced = 0;
  const total = storedMiningActions.length;
  
  if (total === 0) {
    return { synced, total };
  }
  
  // Try to sync each action
  const syncPromises = storedMiningActions.map(async (action) => {
    try {
      const response = await fetch('/api/mining/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(action),
      });
      
      if (response.ok) {
        synced++;
        return action.id; // Return ID of successfully synced action
      }
      return null;
    } catch (error) {
      console.error('Service Worker: Failed to sync action', action, error);
      return null;
    }
  });
  
  // Wait for all sync attempts to complete
  const syncResults = await Promise.all(syncPromises);
  
  // Remove successfully synced actions
  const syncedIds = syncResults.filter(id => id !== null);
  
  // Filter out synced actions from our array
  storedMiningActions = storedMiningActions.filter(
    action => !syncedIds.includes(action.id)
  );
  
  // Update IndexedDB
  await clearSyncedActionsFromIndexedDB(syncedIds);
  
  return { synced, total };
}

// IndexedDB functions for persistence across browser sessions
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('TskOfflineStore', 1);
    
    request.onerror = (event) => {
      reject('Error opening IndexedDB');
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('miningActions')) {
        db.createObjectStore('miningActions', { keyPath: 'id' });
      }
    };
  });
}

function saveToIndexedDB(action) {
  openDB().then(db => {
    const transaction = db.transaction(['miningActions'], 'readwrite');
    const store = transaction.objectStore('miningActions');
    store.put(action);
  }).catch(err => {
    console.error('Service Worker: Error saving to IndexedDB', err);
  });
}

async function loadFromIndexedDB() {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(['miningActions'], 'readonly');
      const store = transaction.objectStore('miningActions');
      const request = store.getAll();
      
      request.onsuccess = (event) => {
        const storedActions = event.target.result;
        // Merge with in-memory actions, avoiding duplicates
        storedActions.forEach(action => {
          if (!storedMiningActions.some(a => a.id === action.id)) {
            storedMiningActions.push(action);
          }
        });
        resolve();
      };
      
      request.onerror = (event) => {
        reject('Error loading from IndexedDB');
      };
    });
  } catch (error) {
    console.error('Service Worker: Failed to load from IndexedDB', error);
  }
}

async function clearSyncedActionsFromIndexedDB(syncedIds) {
  if (syncedIds.length === 0) return;
  
  try {
    const db = await openDB();
    const transaction = db.transaction(['miningActions'], 'readwrite');
    const store = transaction.objectStore('miningActions');
    
    syncedIds.forEach(id => {
      if (id) store.delete(id);
    });
  } catch (error) {
    console.error('Service Worker: Error clearing synced actions from IndexedDB', error);
  }
}
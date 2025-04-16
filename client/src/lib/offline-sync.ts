import { apiRequest, queryClient } from './queryClient';

interface PendingAction {
  url: string;
  data: any;
  timestamp: number;
}

/**
 * Check if there are pending offline actions to be synced
 */
export function hasPendingOfflineActions(): boolean {
  const pendingActions = localStorage.getItem('offlinePendingActions');
  return pendingActions !== null && JSON.parse(pendingActions).length > 0;
}

/**
 * Get the count of pending offline actions
 */
export function getPendingOfflineActionsCount(): number {
  const pendingActions = localStorage.getItem('offlinePendingActions');
  if (!pendingActions) return 0;
  return JSON.parse(pendingActions).length;
}

/**
 * Clear all pending offline actions
 */
export function clearPendingOfflineActions(): void {
  localStorage.removeItem('offlinePendingActions');
}

/**
 * Process a single pending action
 */
async function processPendingAction(action: PendingAction): Promise<boolean> {
  try {
    const res = await apiRequest('POST', action.url, action.data);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ message: 'Failed to process offline action' }));
      console.error(`Failed to process offline action to ${action.url}:`, errorData);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`Error processing offline action to ${action.url}:`, error);
    return false;
  }
}

/**
 * Sync all pending offline actions with the server
 */
export async function syncOfflineActions(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  // Get pending actions
  const pendingActionsStr = localStorage.getItem('offlinePendingActions');
  if (!pendingActionsStr) {
    return { success: 0, failed: 0, total: 0 };
  }

  const pendingActions: PendingAction[] = JSON.parse(pendingActionsStr);
  if (!pendingActions.length) {
    return { success: 0, failed: 0, total: 0 };
  }

  // Process each action
  let success = 0;
  let failed = 0;
  const total = pendingActions.length;

  // Sort by timestamp (oldest first)
  pendingActions.sort((a, b) => a.timestamp - b.timestamp);

  for (const action of pendingActions) {
    const result = await processPendingAction(action);
    if (result) {
      success++;
    } else {
      failed++;
    }
  }

  // Clear pending actions if all were successful
  if (failed === 0) {
    localStorage.removeItem('offlinePendingActions');
  } else {
    // Keep only the failed actions
    const updatedPendingActions = pendingActions.slice(success);
    localStorage.setItem('offlinePendingActions', JSON.stringify(updatedPendingActions));
  }

  // Refresh user data and mining history
  queryClient.invalidateQueries({ queryKey: ['/api/user'] });
  queryClient.invalidateQueries({ queryKey: ['/api/mining/history'] });
  
  // If service worker is available, request it to sync data too
  // This creates a backup sync process
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    try {
      const sw = navigator.serviceWorker.controller;
      const messageChannel = new MessageChannel();
      
      // Create a promise that resolves when the service worker responds
      const swSyncPromise = new Promise((resolve) => {
        messageChannel.port1.onmessage = (event) => {
          resolve(event.data);
        };
      });
      
      // Send message to service worker to sync mining data
      sw.postMessage({ type: 'SYNC_MINING_DATA' }, [messageChannel.port2]);
      
      // Wait for service worker to respond (or timeout after 3 seconds)
      const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve({ success: false, timeout: true }), 3000));
      await Promise.race([swSyncPromise, timeoutPromise]);
    } catch (error) {
      console.error('Error communicating with service worker:', error);
    }
  }

  return { success, failed, total };
}

/**
 * Set up automatic sync when the browser comes back online
 * @param toastFn Optional toast function for notifications
 */
export function setupOfflineSyncListeners(toastFn?: Function): () => void {
  const handleOnline = async () => {
    if (hasPendingOfflineActions()) {
      const pendingCount = getPendingOfflineActionsCount();
      
      // Show notification that sync is starting
      if (toastFn) {
        toastFn({
          title: 'Connection Restored',
          description: `Syncing ${pendingCount} pending mining ${pendingCount === 1 ? 'operation' : 'operations'}...`,
        });
      }
      
      // Perform the sync
      const result = await syncOfflineActions();
      
      // Show results notification
      if (toastFn) {
        if (result.failed === 0) {
          toastFn({
            title: 'Sync Complete',
            description: `Successfully synced ${result.success} mining ${result.success === 1 ? 'operation' : 'operations'}.`,
          });
        } else {
          toastFn({
            title: 'Sync Partially Complete',
            description: `Synced ${result.success} of ${result.total} operations. ${result.failed} ${result.failed === 1 ? 'operation' : 'operations'} failed.`,
            variant: 'destructive',
          });
        }
      }
    }
  };

  window.addEventListener('online', handleOnline);

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline);
  };
}
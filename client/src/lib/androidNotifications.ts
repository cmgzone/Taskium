/**
 * Helper for interacting with Android native notification functionality
 * This provides a bridge between the web app and the Android app's native functionality
 */

// Define interfaces to match the Java method signatures
interface AndroidNotificationInterface {
  requestNotificationPermission: (callback: (granted: boolean) => void) => void;
  areNotificationsEnabled: () => boolean;
  showMiningRewardNotification: (amount: number, streakDay: number, deepLink: string) => void;
  showChatMessageNotification: (sender: string, message: string, deepLink: string) => void;
  showSystemNotification: (title: string, message: string, deepLink: string) => void;
}

interface FirebaseNotificationInterface {
  getFirebaseToken: () => string;
  registerForPushNotifications: (token: string, userId: number, callback: (success: boolean, error: string) => void) => void;
  unregisterFromPushNotifications: (callback: (success: boolean, error: string) => void) => void;
}

// Global declaration to make TypeScript aware of these interfaces
declare global {
  interface Window {
    AndroidNotification?: AndroidNotificationInterface;
    FirebaseNotification?: FirebaseNotificationInterface;
    handlePushNotification?: (type: string, title: string, message: string, deepLink: string) => void;
  }
}

/**
 * Check if native Android notification functionality is available
 */
export function hasNativeNotifications(): boolean {
  return typeof window.AndroidNotification !== 'undefined';
}

/**
 * Check if Firebase notifications are available
 */
export function hasFirebaseNotifications(): boolean {
  return typeof window.FirebaseNotification !== 'undefined';
}

/**
 * Request permission to show notifications
 * Works for both browser and Android
 */
export async function requestNotificationPermission(): Promise<boolean> {
  // Check for Android native notifications
  if (hasNativeNotifications()) {
    // Use a promise to wrap the callback-based Android API
    return new Promise((resolve) => {
      window.AndroidNotification!.requestNotificationPermission((granted) => {
        resolve(granted);
      });
    });
  }
  
  // Fall back to browser notifications
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }
  
  return false;
}

/**
 * Check if notifications are enabled
 */
export function areNotificationsEnabled(): boolean {
  // Check Android native notifications first
  if (hasNativeNotifications()) {
    return window.AndroidNotification!.areNotificationsEnabled();
  }
  
  // Fall back to browser notifications
  if ('Notification' in window) {
    return Notification.permission === 'granted';
  }
  
  return false;
}

/**
 * Show a mining reward notification
 */
export function showMiningRewardNotification(amount: number, streakDay: number, deepLink: string = '/mining'): void {
  if (hasNativeNotifications()) {
    window.AndroidNotification!.showMiningRewardNotification(amount, streakDay, deepLink);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    const title = 'Mining Reward';
    const message = streakDay > 0
      ? `You've earned ${amount.toFixed(2)} TSK (Day ${streakDay} streak bonus)`
      : `You've earned ${amount.toFixed(2)} TSK`;
      
    const notification = new Notification(title, {
      body: message,
      icon: '/icons/mining-icon.svg',
      tag: 'mining-reward'
    });
    
    notification.onclick = () => {
      window.focus();
      window.location.href = deepLink;
    };
  }
}

/**
 * Show a chat message notification
 */
export function showChatMessageNotification(sender: string, message: string, deepLink: string = '/chat'): void {
  if (hasNativeNotifications()) {
    window.AndroidNotification!.showChatMessageNotification(sender, message, deepLink);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    const title = `Message from ${sender}`;
      
    const notification = new Notification(title, {
      body: message,
      icon: '/icons/app-icon-192.svg',
      tag: 'chat-message'
    });
    
    notification.onclick = () => {
      window.focus();
      window.location.href = deepLink;
    };
  }
}

/**
 * Show a system notification
 */
export function showSystemNotification(title: string, message: string, deepLink: string = '/'): void {
  if (hasNativeNotifications()) {
    window.AndroidNotification!.showSystemNotification(title, message, deepLink);
  } else if ('Notification' in window && Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: message,
      icon: '/icons/app-icon-192.svg',
      tag: 'system-notification'
    });
    
    notification.onclick = () => {
      window.focus();
      window.location.href = deepLink;
    };
  }
}

/**
 * Get Firebase messaging token
 * Returns null if Firebase is not available
 */
export function getFirebaseToken(): string | null {
  if (hasFirebaseNotifications()) {
    return window.FirebaseNotification!.getFirebaseToken();
  }
  return null;
}

/**
 * Register for push notifications with the server
 */
export async function registerForPushNotifications(userId: number): Promise<boolean> {
  if (hasFirebaseNotifications()) {
    const token = window.FirebaseNotification!.getFirebaseToken();
    
    if (!token) {
      console.error('No Firebase token available');
      return false;
    }
    
    // Use a promise to wrap the callback-based Android API
    return new Promise((resolve) => {
      window.FirebaseNotification!.registerForPushNotifications(token, userId, (success, error) => {
        if (!success) {
          console.error('Error registering for push notifications:', error);
        }
        resolve(success);
      });
    });
  }
  
  return false;
}

/**
 * Unregister from push notifications
 */
export async function unregisterFromPushNotifications(): Promise<boolean> {
  if (hasFirebaseNotifications()) {
    // Use a promise to wrap the callback-based Android API
    return new Promise((resolve) => {
      window.FirebaseNotification!.unregisterFromPushNotifications((success, error) => {
        if (!success) {
          console.error('Error unregistering from push notifications:', error);
        }
        resolve(success);
      });
    });
  }
  
  return false;
}

/**
 * Handle incoming push notification data
 * This function is called from the Android app when a push notification is received
 */
export function setupPushNotificationHandler(): void {
  window.handlePushNotification = (type: string, title: string, message: string, deepLink: string) => {
    console.log(`Received push notification: ${type}`, { title, message, deepLink });
    
    // Emit an event that components can listen for
    const event = new CustomEvent('pushnotification', {
      detail: { type, title, message, deepLink }
    });
    
    window.dispatchEvent(event);
    
    // Handle specific notification types if needed
    switch (type) {
      case 'mining':
        // Handle mining notifications
        break;
      case 'chat':
        // Handle chat notifications
        break;
      default:
        // Handle other notification types
        break;
    }
  };
}
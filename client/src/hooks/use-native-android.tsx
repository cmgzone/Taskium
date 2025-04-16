import { useState, useEffect, useCallback } from 'react';

// Extend Window interface to include our Android bridge
declare global {
  interface Window {
    Android?: {
      showToast: (message: string) => void;
      getDeviceInfo: () => string;
      vibrate: (milliseconds: number) => void;
      openExternalUrl: (url: string) => void;
      getAuthToken: () => string | null;
      setAuthToken: (token: string) => void;
      clearAppData: () => void;
      isDarkModeEnabled: () => boolean;
      setDarkMode: (enabled: boolean) => void;
      shareContent: (title: string, text: string, url: string) => void;
      getConnectionType: () => 'WIFI' | 'CELLULAR' | 'ETHERNET' | 'NONE' | 'UNKNOWN';
    };
  }
}

interface NativeAndroidHook {
  isNativeAndroid: boolean;
  deviceInfo: string | null;
  showToast: (message: string) => void;
  vibrate: (milliseconds: number) => void;
  openExternalUrl: (url: string) => void;
  getAuthToken: () => string | null;
  setAuthToken: (token: string) => void;
  clearAppData: () => void;
  isDarkModeEnabled: () => boolean;
  setDarkMode: (enabled: boolean) => void;
  shareContent: (title: string, text: string, url?: string) => void;
  connectionType: 'WIFI' | 'CELLULAR' | 'ETHERNET' | 'NONE' | 'UNKNOWN';
}

/**
 * Hook to interact with the native Android app wrapper
 * Provides a consistent interface that works whether running in the native app or browser
 */
export function useNativeAndroid(): NativeAndroidHook {
  const [isNativeAndroid, setIsNativeAndroid] = useState<boolean>(false);
  const [deviceInfo, setDeviceInfo] = useState<string | null>(null);
  const [connectionType, setConnectionType] = useState<'WIFI' | 'CELLULAR' | 'ETHERNET' | 'NONE' | 'UNKNOWN'>('UNKNOWN');
  
  // Check if running in Android native app on mount
  useEffect(() => {
    const isAndroidApp = !!window.Android;
    setIsNativeAndroid(isAndroidApp);
    
    if (isAndroidApp && window.Android) {
      try {
        // Get initial device info
        setDeviceInfo(window.Android.getDeviceInfo());
        
        // Get initial connection type
        setConnectionType(window.Android.getConnectionType());
        
        // Set up an interval to check connection type periodically
        const connectionInterval = setInterval(() => {
          if (window.Android && typeof window.Android.getConnectionType === 'function') {
            setConnectionType(window.Android.getConnectionType());
          }
        }, 10000);
        
        return () => clearInterval(connectionInterval);
      } catch (error) {
        console.error('Error initializing Android bridge:', error);
      }
    }
  }, []);
  
  // Show a toast message
  const showToast = useCallback((message: string) => {
    if (window.Android) {
      window.Android.showToast(message);
    } else {
      // Fallback for browser environment
      alert(message);
    }
  }, []);
  
  // Vibrate the device
  const vibrate = useCallback((milliseconds: number) => {
    if (window.Android) {
      window.Android.vibrate(milliseconds);
    } else if (navigator.vibrate) {
      // Use Web Vibration API as fallback
      navigator.vibrate(milliseconds);
    }
  }, []);
  
  // Open external URL
  const openExternalUrl = useCallback((url: string) => {
    if (window.Android) {
      window.Android.openExternalUrl(url);
    } else {
      // Fallback for browser environment
      window.open(url, '_blank');
    }
  }, []);
  
  // Get auth token
  const getAuthToken = useCallback((): string | null => {
    if (window.Android) {
      return window.Android.getAuthToken();
    }
    // Fallback to browser localStorage
    return localStorage.getItem('auth_token');
  }, []);
  
  // Set auth token
  const setAuthToken = useCallback((token: string) => {
    if (window.Android) {
      window.Android.setAuthToken(token);
    } else {
      // Fallback to browser localStorage
      localStorage.setItem('auth_token', token);
    }
  }, []);
  
  // Clear app data
  const clearAppData = useCallback(() => {
    if (window.Android) {
      window.Android.clearAppData();
    } else {
      // Fallback for browser - clear localStorage
      localStorage.clear();
    }
  }, []);
  
  // Check if dark mode is enabled
  const isDarkModeEnabled = useCallback((): boolean => {
    if (window.Android) {
      return window.Android.isDarkModeEnabled();
    } else {
      // Fallback to browser preference
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
  }, []);
  
  // Set dark mode
  const setDarkMode = useCallback((enabled: boolean) => {
    if (window.Android) {
      window.Android.setDarkMode(enabled);
    }
    // No fallback needed as theme is managed by ThemeProvider
  }, []);
  
  // Share content
  const shareContent = useCallback((title: string, text: string, url?: string) => {
    if (window.Android) {
      window.Android.shareContent(title, text, url || '');
    } else if (navigator.share) {
      // Use Web Share API as fallback
      navigator.share({
        title,
        text,
        url: url || window.location.href,
      }).catch(err => console.error('Error sharing:', err));
    } else {
      // Fallback if Web Share API is not available
      const shareText = `${title}\n${text}\n${url || window.location.href}`;
      alert(`Share:\n${shareText}`);
    }
  }, []);
  
  return {
    isNativeAndroid,
    deviceInfo,
    showToast,
    vibrate,
    openExternalUrl,
    getAuthToken,
    setAuthToken,
    clearAppData,
    isDarkModeEnabled,
    setDarkMode,
    shareContent,
    connectionType,
  };
}
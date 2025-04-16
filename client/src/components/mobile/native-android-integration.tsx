import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useNativeAndroid } from '@/hooks/use-native-android';
import { useTheme } from '@/lib/theme-provider';

/**
 * Component that handles integration between the web app and native Android wrapper
 * This component doesn't render anything visible but provides the integration logic
 */
export default function NativeAndroidIntegration() {
  const { 
    isNativeAndroid, 
    connectionType, 
    showToast,
    setAuthToken,
    clearAppData,
    setDarkMode
  } = useNativeAndroid();
  
  const { user, loginMutation, logoutMutation } = useAuth();
  const { toast } = useToast();
  const { mode, isDark } = useTheme();

  // Sync authentication state with native app
  useEffect(() => {
    if (!isNativeAndroid) return;
    
    // When user logs in, store the auth token in the native app
    if (user) {
      try {
        // For security purposes, we're not storing the actual token
        // but just a flag that the user is logged in
        setAuthToken(JSON.stringify({ 
          userId: user.id,
          username: user.username,
          loggedInAt: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error syncing auth state with native app:', error);
      }
    }
  }, [isNativeAndroid, user, setAuthToken]);

  // Sync logout with native app
  useEffect(() => {
    if (!isNativeAndroid) return;
    
    const originalLogout = logoutMutation.mutate;
    
    // Override the logout function to also clear native app data
    logoutMutation.mutate = () => {
      // Call the original logout function
      originalLogout();
      
      // Clear native app data
      clearAppData();
    };
    
    return () => {
      // Restore original function when component unmounts
      logoutMutation.mutate = originalLogout;
    };
  }, [isNativeAndroid, logoutMutation, clearAppData]);

  // Sync theme mode with native app
  useEffect(() => {
    if (!isNativeAndroid) return;
    
    setDarkMode(isDark);
  }, [isNativeAndroid, isDark, setDarkMode]);

  // Handle connection status changes
  useEffect(() => {
    if (!isNativeAndroid) return;
    
    // Display a toast when connection status changes to inform the user
    if (connectionType === 'NONE') {
      toast({
        title: "You're offline",
        description: "Please check your internet connection",
        variant: "destructive"
      });
    } else if (connectionType !== 'UNKNOWN') {
      // Only show online toast if we were previously showing offline
      const offlineToast = document.querySelector('[data-toast-title="You\'re offline"]');
      if (offlineToast) {
        toast({
          title: "You're back online",
          description: `Connected via ${connectionType.toLowerCase()}`,
          variant: "default"
        });
      }
    }
  }, [isNativeAndroid, connectionType, toast]);

  // Add device information to API requests when using the native app
  useEffect(() => {
    if (!isNativeAndroid) return;
    
    // Add an interceptor to all fetch requests to add device info
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const modifiedInit = init || {};
      
      // Add headers with device information
      modifiedInit.headers = {
        ...modifiedInit.headers,
        'X-Native-Android': 'true',
        'X-Connection-Type': connectionType,
      };
      
      return originalFetch(input, modifiedInit);
    };
    
    return () => {
      // Restore original fetch when component unmounts
      window.fetch = originalFetch;
    };
  }, [isNativeAndroid, connectionType]);

  // This component doesn't render anything
  return null;
}
import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  areNotificationsEnabled,
  requestNotificationPermission,
  getFirebaseToken,
  registerForPushNotifications,
  hasNativeNotifications,
  hasFirebaseNotifications,
  unregisterFromPushNotifications,
  setupPushNotificationHandler
} from '@/lib/androidNotifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface NotificationPermissionButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  showLabel?: boolean;
  userId?: number;
}

/**
 * A button that shows the current notification permission status
 * and allows the user to request permission for notifications
 * Supports both browser notifications and Android native notifications
 */
export default function NotificationPermissionButton({
  variant = 'outline',
  size = 'default',
  className = '',
  showLabel = true,
  userId
}: NotificationPermissionButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [permissionEnabled, setPermissionEnabled] = useState<boolean>(false);
  const [isAndroid, setIsAndroid] = useState<boolean>(false);
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [isCheckingPermission, setIsCheckingPermission] = useState<boolean>(true);
  
  // Register device token mutation
  const registerDeviceTokenMutation = useMutation({
    mutationFn: (data: { token: string, platform: string, deviceId?: string }) => {
      return apiRequest('/api/notifications/register-device', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/devices'] });
      toast({
        title: 'Notifications Enabled',
        description: 'Your device has been registered for push notifications.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error?.message || 'Failed to register device for notifications.',
        variant: 'destructive',
      });
    }
  });

  // Function to generate a unique device ID for web browsers
  const generateDeviceId = () => {
    // Get or create a device ID for this browser
    let deviceId = localStorage.getItem('browser_device_id');
    if (!deviceId) {
      deviceId = 'web_' + Math.random().toString(36).substring(2, 15) + 
                Math.random().toString(36).substring(2, 15);
      localStorage.setItem('browser_device_id', deviceId);
    }
    return deviceId;
  };
  
  // Check permission status on component mount
  useEffect(() => {
    const checkPermissions = async () => {
      setIsCheckingPermission(true);
      
      try {
        // Check if we're running in the Android app
        const androidSupported = hasNativeNotifications();
        const firebaseSupported = hasFirebaseNotifications();
        setIsAndroid(androidSupported);
        
        // Set up push notification handler for Android
        if (androidSupported) {
          setupPushNotificationHandler();
        }
        
        // If Firebase is supported and we have a userId, check if we already have a token
        if (firebaseSupported && userId) {
          const token = getFirebaseToken();
          
          if (token) {
            // We have a Firebase token, check if notifications are enabled
            setPermissionEnabled(areNotificationsEnabled());
            
            // Make sure it's registered with the server
            registerDeviceTokenMutation.mutate({
              token,
              platform: 'android-firebase',
              deviceId: token.substring(0, 32) // Use part of the token as the device ID
            });
          } else {
            // No token yet, but Firebase is supported
            setPermissionEnabled(false);
          }
        } else if (androidSupported) {
          // Standard Android notifications (without Firebase)
          setPermissionEnabled(areNotificationsEnabled());
        } else if ('Notification' in window) {
          // Check browser notifications
          const permission = Notification.permission;
          setPermissionEnabled(permission === 'granted');
          
          // If already granted and we have service worker support,
          // make sure we're registered for push notifications
          if (permission === 'granted' && userId && 'serviceWorker' in navigator && 'PushManager' in window) {
            try {
              const registration = await navigator.serviceWorker.getRegistration();
              if (registration?.pushManager) {
                const subscription = await registration.pushManager.getSubscription();
                if (subscription) {
                  // Already have a subscription, make sure it's registered with our server
                  const token = JSON.stringify(subscription.toJSON());
                  registerDeviceTokenMutation.mutate({
                    token,
                    platform: 'web',
                    deviceId: generateDeviceId()
                  });
                }
              }
            } catch (error) {
              console.error('Error checking subscription:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error checking notification permissions:', error);
      } finally {
        setIsCheckingPermission(false);
      }
    };
    
    checkPermissions();
  }, [userId]);
  
  // Register the device with Firebase for push notifications (Android)
  const registerAndroidPushNotifications = () => {
    if (!userId) {
      console.error('User ID not available, cannot register for push notifications');
      return;
    }
    
    setIsRegistering(true);
    
    // Get the Firebase token
    const token = getFirebaseToken();
    
    if (!token) {
      toast({
        title: 'Push Notification Setup',
        description: 'Could not get push notification token. Please try again later.',
        variant: 'destructive',
      });
      setIsRegistering(false);
      return;
    }
    
    // Register with Firebase
    registerForPushNotifications(userId)
      .then(success => {
        if (success) {
          // Now register with our server
          registerDeviceTokenMutation.mutate({
            token,
            platform: 'android',
            deviceId: token.substring(0, 32) // Use part of the token as the device ID
          });
        } else {
          toast({
            title: 'Push Notification Setup Failed',
            description: 'Could not register for push notifications. Please try again later.',
            variant: 'destructive',
          });
        }
      })
      .catch(error => {
        toast({
          title: 'Push Notification Setup Failed',
          description: error instanceof Error ? error.message : 'Could not register for push notifications',
          variant: 'destructive',
        });
      })
      .finally(() => {
        setIsRegistering(false);
      });
  };
  
  // Register the device for web push notifications
  const registerWebPushNotifications = async () => {
    if (!userId) {
      console.error('User ID not available, cannot register for push notifications');
      return;
    }
    
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      toast({
        title: 'Push Notifications Not Supported',
        description: 'Your browser does not support push notifications.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsRegistering(true);
    
    try {
      // Make sure service worker is registered
      const registration = await navigator.serviceWorker.register('/service-worker.js');
      
      // Request subscription to push service
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: await urlBase64ToUint8Array(
          // Public VAPID key would normally be here - using placeholder
          'BOFV5EohiiC3LtyLbZv9ai2LSRwkpE8YrWSXvzsv6r1v_qo22ZjvEbWPthjyQ4e-9kZWF7-L7Y98TehPbHXJQ8A'
        )
      });
      
      // Register the subscription with our server
      const token = JSON.stringify(subscription.toJSON());
      registerDeviceTokenMutation.mutate({
        token,
        platform: 'web',
        deviceId: generateDeviceId()
      });
    } catch (error) {
      console.error('Error registering for web push:', error);
      toast({
        title: 'Push Registration Failed',
        description: error instanceof Error ? error.message : 'Failed to register for push notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsRegistering(false);
    }
  };
  
  // Handle user request for notification permission
  const handlePermissionRequest = async () => {
    if (permissionEnabled) {
      toast({
        title: 'Notifications are already enabled',
        description: 'You are already registered to receive notifications.',
      });
      return;
    }
    
    // Check if Firebase notifications are supported
    const firebaseSupported = hasFirebaseNotifications();
    
    if (firebaseSupported && userId) {
      // Firebase notifications flow
      requestNotificationPermission().then(granted => {
        if (granted) {
          setPermissionEnabled(true);
          toast({
            title: 'Notifications enabled',
            description: 'You will now receive Firebase push notifications on your device.',
          });
          
          // Get the Firebase token and register it
          const token = getFirebaseToken();
          if (token) {
            registerDeviceTokenMutation.mutate({
              token,
              platform: 'android-firebase',
              deviceId: token.substring(0, 32) // Use part of the token as the device ID
            });
          } else {
            toast({
              title: 'Push Notification Setup',
              description: 'Notifications are enabled, but could not get Firebase token. Push notifications may not work properly.',
              variant: 'destructive',
            });
          }
        } else {
          toast({
            title: 'Notification permission denied',
            description: 'Please enable notifications in your device settings to receive alerts.',
            variant: 'destructive',
          });
        }
      });
    } else if (isAndroid) {
      // Standard Android native notifications flow (without Firebase)
      requestNotificationPermission().then(granted => {
        if (granted) {
          setPermissionEnabled(true);
          toast({
            title: 'Notifications enabled',
            description: 'You will now receive notifications on your device.',
          });
          
          // If permission granted and we have a user ID, register for push
          if (userId) {
            registerAndroidPushNotifications();
          }
        } else {
          toast({
            title: 'Notification permission denied',
            description: 'Please enable notifications in your device settings to receive alerts.',
            variant: 'destructive',
          });
        }
      });
    } else if ('Notification' in window) {
      // Web browser notifications flow
      try {
        const permission = await Notification.requestPermission();
        
        if (permission === 'granted') {
          setPermissionEnabled(true);
          toast({
            title: 'Notifications enabled',
            description: 'You will now receive browser notifications.',
          });
          
          // Register for web push notifications if we have service worker support
          if (userId && 'serviceWorker' in navigator && 'PushManager' in window) {
            registerWebPushNotifications();
          }
        } else {
          toast({
            title: 'Notification permission denied',
            description: 'Please enable notifications in your browser settings to receive alerts.',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast({
          title: 'Notification Error',
          description: 'There was a problem enabling notifications.',
          variant: 'destructive',
        });
      }
    } else {
      toast({
        title: 'Notifications Not Supported',
        description: 'Your browser does not support notifications.',
        variant: 'destructive',
      });
    }
  };
  
  // Helper function to convert base64 to Uint8Array for VAPID key
  async function urlBase64ToUint8Array(base64String: string): Promise<Uint8Array> {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');
    
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
  
  if (isCheckingPermission) {
    return (
      <Button variant="ghost" size="icon" disabled className={className}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </Button>
    );
  }
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handlePermissionRequest}
      className={className}
      disabled={isRegistering || registerDeviceTokenMutation.isPending}
    >
      {isRegistering || registerDeviceTokenMutation.isPending ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          {showLabel && <span className="ml-2">Setting up...</span>}
        </>
      ) : permissionEnabled ? (
        <>
          <Bell className="h-4 w-4" />
          {showLabel && <span className="ml-2">Notifications enabled</span>}
        </>
      ) : (
        <>
          <BellOff className="h-4 w-4" />
          {showLabel && <span className="ml-2">Enable notifications</span>}
        </>
      )}
    </Button>
  );
}
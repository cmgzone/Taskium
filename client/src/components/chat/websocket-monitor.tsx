import { useEffect, useState } from 'react';
import { useChatWebSocket } from '@/hooks/use-chat-ws';
import { useToast } from '@/hooks/use-toast';
import { showErrorDialog } from '@/components/ui/error-dialog';

/**
 * Component that monitors WebSocket connection health
 * Shows appropriate UI notifications when connection is lost/restored
 */
export function WebSocketMonitor() {
  const { connected, clientId } = useChatWebSocket();
  const { toast } = useToast();
  const [hasShownError, setHasShownError] = useState(false);
  const [connectionLostTime, setConnectionLostTime] = useState<Date | null>(null);
  
  // Handle connection status changes
  useEffect(() => {
    let errorTimer: number | null = null;
    
    // When connection is restored after a previous error
    if (connected && hasShownError) {
      setHasShownError(false);
      setConnectionLostTime(null);
      
      toast({
        title: "Connection Restored",
        description: "Real-time features are now available again.",
        variant: "default",
        duration: 3000,
      });
    } 
    // When connection is lost (but only if we had a connection before)
    else if (!connected && clientId) {
      // Record when the connection was lost
      if (!connectionLostTime) {
        setConnectionLostTime(new Date());
      }
      
      // Only show an error dialog if we've been disconnected for > 10 seconds
      // This prevents showing errors for brief network blips
      if (!hasShownError) {
        errorTimer = window.setTimeout(() => {
          if (!connected) {
            setHasShownError(true);
            showErrorDialog({
              title: "Connection Issue",
              message: "We're having trouble connecting to the server. Some real-time features may be unavailable, but the app will continue working in offline mode where possible.",
              type: "warning",
            });
          }
        }, 10000);
      }
    }
    
    return () => {
      if (errorTimer) window.clearTimeout(errorTimer);
    };
  }, [connected, clientId, hasShownError, connectionLostTime, toast]);
  
  // This is a background component with no UI
  return null;
}
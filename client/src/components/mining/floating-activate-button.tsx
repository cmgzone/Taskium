import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Play, Loader2, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { showSystemNotification } from "@/lib/androidNotifications";

interface FloatingActivateButtonProps {
  variant?: "compact" | "expanded";
  position?: "bottom" | "top" | "fixed";
  className?: string;
}

export default function FloatingActivateButton({ 
  variant = "expanded", 
  position = "bottom",
  className = ""
}: FloatingActivateButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  
  // Determine if mining is active from both user prop and local state
  const [localMiningActive, setLocalMiningActive] = useState(Boolean(user?.miningActive));
  
  // Use either local state or prop value to determine visibility
  const isMiningActive = localMiningActive || Boolean(user?.miningActive);
  
  // Track online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  // Fetch mining settings
  const { data: miningSettings } = useQuery({
    queryKey: ["/api/mining/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/settings");
      return await res.json();
    },
    // Still try to fetch even when offline (will be served from cache if available)
    networkMode: 'always'
  });
  
  // Mutation for activating mining
  const activateMiningMutation = useMutation({
    mutationFn: async () => {
      setIsActivating(true);
      try {
        const res = await apiRequest("POST", "/api/mine/activate");
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || "Failed to activate mining");
        }
        return await res.json();
      } catch (err) {
        console.error("API request error:", err);
        throw err;
      } finally {
        setIsActivating(false);
      }
    },
    onSuccess: (data) => {
      try {
        // Update local state to hide button immediately
        setLocalMiningActive(true);
        
        // Use the server timestamp for activation to ensure consistency
        const serverActivationTime = data.lastMiningActivation || new Date().toISOString();
        const activationHours = miningSettings?.activationExpirationHours || 24;
        const successMessage = `Automatic mining has been activated for ${activationHours} hours`;
        
        toast({
          title: "Mining Activated!",
          description: successMessage,
        });
        
        // Send native notification on Android
        showSystemNotification(
          "Mining Activated!", 
          successMessage,
          "/mining"
        );
        
        // Update user data in cache with the server timestamp
        const userData = queryClient.getQueryData<any>(["/api/user"]);
        if (userData) {
          // We preserve the server timestamp from the response to ensure consistency
          queryClient.setQueryData(["/api/user"], {
            ...userData,
            miningActive: data.miningActive || true,
            lastMiningActivation: serverActivationTime
          });
        }
        
        // Refresh user data after a short delay to ensure server changes have propagated
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }, 500);
      } catch (err) {
        console.error("Error in onSuccess handler:", err);
      }
    },
    onError: (error: Error) => {
      console.error("Mining activation error:", error);
      toast({
        title: "Activation Failed",
        description: error.message || "Could not activate mining. Please try again.",
        variant: "destructive",
      });
    },
  });
  
  // Get position class
  let positionClass = "";
  if (position === "bottom") {
    positionClass = "fixed bottom-4 left-1/2 transform -translate-x-1/2 z-30";
  } else if (position === "top") {
    positionClass = "fixed top-4 left-1/2 transform -translate-x-1/2 z-30";
  } else if (position === "fixed") {
    positionClass = "fixed bottom-20 right-4 z-30";
  }
  
  // Handle offline mining activation
  const activateMiningOffline = () => {
    // When offline, we'll store the activation locally and sync later
    try {
      // Update local state first to hide button immediately
      setLocalMiningActive(true);
      
      // Create an ISO timestamp for consistency with the server
      const activationTimestamp = new Date().toISOString();
      
      // Update user data in cache
      const userData = queryClient.getQueryData<any>(["/api/user"]);
      if (userData) {
        queryClient.setQueryData(["/api/user"], {
          ...userData,
          miningActive: true,
          lastMiningActivation: activationTimestamp
        });
      }
      
      // Store the intent to activate mining in localStorage for service worker to sync later
      const pendingActions = JSON.parse(localStorage.getItem('offlinePendingActions') || '[]');
      pendingActions.push({
        url: '/api/mine/activate',
        data: {
          // Include the timestamp in the data so it can be used when syncing
          timestamp: activationTimestamp
        },
        timestamp: Date.now()
      });
      localStorage.setItem('offlinePendingActions', JSON.stringify(pendingActions));
      
      const offlineMessage = "Mining has been activated. It will sync when you're back online.";
      
      // Show success toast
      toast({
        title: "Mining Activated (Offline)",
        description: offlineMessage,
      });
      
      // Send native notification on Android
      showSystemNotification(
        "Mining Activated (Offline)", 
        offlineMessage,
        "/mining"
      );
    } catch (error) {
      console.error('Failed to activate mining offline:', error);
      toast({
        title: "Offline Activation Failed",
        description: "Could not activate mining in offline mode. Please try again later.",
        variant: "destructive",
      });
    }
  };
  
  // Handle click event
  const handleActivateClick = () => {
    if (isOffline) {
      activateMiningOffline();
    } else {
      activateMiningMutation.mutate();
    }
  };
  
  // Get button content based on variant and online/offline status
  const buttonContent = variant === "compact" ? (
    <>{isActivating ? <Loader2 className="h-5 w-5 animate-spin" /> : 
       isOffline ? <WifiOff className="h-5 w-5" /> : 
       <Play className="h-5 w-5" />}</>
  ) : (
    <>
      {isActivating ? (
        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Activating...</>
      ) : isOffline ? (
        <><WifiOff className="mr-2 h-5 w-5" /> {isMiningActive ? 'Reactivate (Offline)' : 'ACTIVATE OFFLINE'}</>
      ) : (
        <><Play className="mr-2 h-5 w-5" /> {isMiningActive ? 'Reactivate Mining' : 'ACTIVATE MINING'}</>
      )}
    </>
  );
  
  // Main button style
  const btnStyle = variant === "compact" 
    ? "rounded-full p-3" 
    : "py-6 px-8 rounded-full font-bold";
  
  // Button color based on mining state and online/offline status
  const btnColor = isOffline 
    ? "bg-orange-500 hover:bg-orange-600"
    : isMiningActive
      ? "bg-green-500 hover:bg-green-600" 
      : "bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600";
  
  // If mining is active or user is not authenticated, don't show the button
  if (isMiningActive || !user) {
    return null;
  }
  
  return (
    <div className={`${positionClass} ${className}`}>
      <Button 
        size="lg"
        variant="default" 
        onClick={handleActivateClick}
        disabled={isActivating}
        className={`${btnStyle} text-white ${btnColor} shadow-lg ${!isMiningActive && !isOffline ? 'animate-bounce-slow' : ''} ${isOffline ? 'mining-offline' : ''} relative overflow-hidden`}
      >
        {/* Animated background glow effect */}
        <div className="absolute inset-0 opacity-50">
          <div className={`absolute inset-0 bg-white opacity-20 ${!isActivating ? 'pulse-animation' : ''}`}></div>
          {isActivating && (
            <div className="absolute inset-0 mining-spin-animation">
              <div className="h-full w-1/2 bg-white opacity-10 transform -skew-x-12"></div>
            </div>
          )}
        </div>
        
        {/* Sparkle effects */}
        {!isActivating && !isOffline && !isMiningActive && (
          <>
            <div className="absolute top-1 right-2 w-1 h-1 bg-white rounded-full animate-ping"></div>
            <div className="absolute bottom-2 left-3 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-3 left-4 w-1 h-1 bg-white rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
          </>
        )}
        
        {/* Main content with relative positioning */}
        <div className="relative z-10">
          {buttonContent}
        </div>
      </Button>
    </div>
  );
}
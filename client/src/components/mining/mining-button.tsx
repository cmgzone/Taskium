import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Check, Hammer, Star, Award, Gift, Clock, AlertTriangle, Play, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Card,
  CardContent
} from "@/components/ui/card";
import ErrorDialog, { showMiningSessionError } from "@/components/ui/error-dialog";

interface MiningButtonProps {
  miningRate: number;
  onMiningSuccess: (amount: number, nextMiningTime: string) => void;
}

interface MiningResult {
  amount: number;
  bonusAmount: number;
  bonusType: string | null;
  totalAmount: number;
  streakDay: number;
  newBalance: number;
  nextMiningTime: string;
  miningActive?: boolean;
  activationExpiresAt?: string;
}

interface MiningSettings {
  enableAutomaticMining: boolean;
  hourlyRewardAmount: number;
  dailyActivationRequired: boolean;
  activationExpirationHours: number;
  enableDailyBonus: boolean;
  enableStreakBonus: boolean;
}

export default function MiningButton({ miningRate, onMiningSuccess }: MiningButtonProps) {
  const [miningState, setMiningState] = useState<"ready" | "mining" | "success">("ready");
  const [miningResult, setMiningResult] = useState<MiningResult | null>(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const { toast } = useToast();
  
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
  
  // Get user data to check mining active status
  const { data: userData } = useQuery({
    queryKey: ["/api/user"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user");
      return await res.json();
    },
    // Still try to fetch even when offline (will be served from cache if available)
    networkMode: 'always'
  });

  const mineMutation = useMutation({
    mutationFn: async () => {
      try {
        const res = await apiRequest("POST", "/api/mine");
        const data = await res.json();
        
        // Log the response data to see what we're getting
        console.log("Mining response:", data);
        
        // Handle the case where mining requires activation
        if (!res.ok && data.requiresActivation) {
          return { requiresActivation: true, message: data.message };
        }
        
        // Check for session mining error specifically - display with dialog
        if (!res.ok && data.message && data.message.includes('already mined during this session')) {
          // Show the professional mining session error dialog with full data
          console.log("Session mining error detected:", data);
          
          // IMMEDIATE FEEDBACK: Show a browser alert to guarantee user sees the error
          alert("Mining Session Active: You've already mined during this session. Please wait for the cooldown period to end.");
          
          // DIRECT DIALOG APPROACH: Show error dialog directly with a DOM-based approach
          const now = new Date();
          const nextMiningTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
          const timeUntilNext = "in 1 hour";
          
          // Show a hard-coded modal directly in the DOM for a guaranteed display
          const modalOverlay = document.createElement('div');
          modalOverlay.className = 'fixed inset-0 bg-black/50 flex items-center justify-center z-50';
          
          const modalContent = document.createElement('div');
          modalContent.className = 'bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full shadow-xl';
          modalContent.innerHTML = `
            <div class="flex items-center gap-2 mb-4">
              <div class="bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="12"></line>
                  <line x1="12" y1="16" x2="12.01" y2="16"></line>
                </svg>
              </div>
              <h3 class="text-lg font-semibold flex-1">Mining Session Active</h3>
              <button id="closeErrorModal" class="h-7 w-7 rounded-md flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            <p class="text-center text-gray-700 dark:text-gray-300">
              You have an active mining session. You can mine again in 1 hour.
            </p>
            <div class="mt-4 bg-gray-50 dark:bg-gray-800 p-3 rounded-md flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-5 w-5 mr-2 text-gray-500">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span class="font-medium">
                Next mining available in: <span class="text-blue-600 dark:text-blue-400">1 hour</span>
              </span>
            </div>
            <div class="mt-6 flex justify-center">
              <button id="confirmErrorModal" class="px-8 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                Got it
              </button>
            </div>
          `;
          
          modalOverlay.appendChild(modalContent);
          document.body.appendChild(modalOverlay);
          
          // Add event listeners to close the modal
          const closeButton = document.getElementById('closeErrorModal');
          const confirmButton = document.getElementById('confirmErrorModal');
          
          const closeModal = () => {
            document.body.removeChild(modalOverlay);
          };
          
          if (closeButton) closeButton.addEventListener('click', closeModal);
          if (confirmButton) confirmButton.addEventListener('click', closeModal);
          
          // Also try the standard approach as backup
          window.dispatchEvent(new CustomEvent('error-dialog-update', { 
            detail: {
              isOpen: true,
              message: `You have an active mining session. You can mine again ${timeUntilNext}.`,
              title: 'Mining Session Active',
              type: 'info',
              data: {
                nextMiningTime: nextMiningTime,
                lastMiningTime: new Date()
              },
              onClose: () => {}
            }
          }));
          
          throw new Error(data.message || "Mining session already active");
        }
        
        // Handle other errors
        if (!res.ok) {
          throw new Error(data.message || "Failed to mine");
        }
        
        return data;
      } catch (error) {
        console.error("Mining error:", error);
        throw error;
      }
    },
    onMutate: () => {
      setMiningState("mining");
    },
    onSuccess: (data: MiningResult | { requiresActivation: boolean, message: string }) => {
      // Check if mining requires activation
      if ('requiresActivation' in data && data.requiresActivation) {
        setMiningState("ready");
        
        toast({
          title: "Mining Needs Activation",
          description: "Please activate mining to receive hourly rewards",
          variant: "destructive",
        });
        
        return;
      }
      
      // Regular mining success
      const miningData = data as MiningResult;
      setMiningState("success");
      setMiningResult(miningData);
      
      // Show success message with bonus information
      const bonusText = miningData.bonusAmount > 0 
        ? ` + ${miningData.bonusAmount} bonus (${miningData.bonusType === 'streak' ? 'streak' : miningData.bonusType === 'daily' ? 'lucky' : 'multiple'})` 
        : '';
      
      toast({
        title: "Mining Success!",
        description: `You earned ${miningData.amount}${bonusText} = ${miningData.totalAmount} $TSK tokens`,
      });
      
      // Update user data in cache
      const user = queryClient.getQueryData<any>(["/api/user"]);
      if (user) {
        queryClient.setQueryData(["/api/user"], {
          ...user,
          tokenBalance: miningData.newBalance,
          lastMiningTime: new Date().toISOString(),
          miningActive: miningData.miningActive ?? user.miningActive,
          // If mining activation has changed, preserve the exact server timestamp from the response
          lastMiningActivation: miningData.activationExpiresAt ? miningData.activationExpiresAt : user.lastMiningActivation
        });
      }
      
      // Also invalidate the user query to ensure fresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      
      // Invalidate mining history cache
      queryClient.invalidateQueries({ queryKey: ["/api/mining/history"] });
      
      // Notify parent component
      onMiningSuccess(miningData.totalAmount, miningData.nextMiningTime);
      
      // Reset to ready state after 2 seconds (faster for immediate mining)
      setTimeout(() => {
        setMiningState("ready");
        setMiningResult(null);
      }, 2000);
    },
    onError: (error: Error) => {
      setMiningState("ready");
      console.error("Mining error:", error);
      
      // We're already handling the session error with the dialog in mutationFn
      // Only show toast for other errors
      if (!error.message.includes("already mined during this session")) {
        toast({
          title: "Mining Failed",
          description: error.message || "Could not mine tokens. Please try again.",
          variant: "destructive",
        });
      }
    },
  });
  
  // Activate mining mutation
  const activateMiningMutation = useMutation({
    mutationFn: async () => {
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
      }
    },
    onMutate: () => {
      setMiningState("mining");
    },
    onSuccess: (data) => {
      setMiningState("ready");
      
      toast({
        title: "Mining Activated!",
        description: `Automatic mining has been activated for ${miningSettings?.activationExpirationHours || 24} hours`,
      });
      
      // Update user data in cache and refresh user data
      try {
        // Get server timestamp from the response
        const serverActivationTime = data.lastMiningActivation || new Date().toISOString();
        
        const user = queryClient.getQueryData<any>(["/api/user"]);
        if (user) {
          queryClient.setQueryData(["/api/user"], {
            ...user,
            miningActive: true,
            lastMiningActivation: serverActivationTime
          });
        }
        
        // Invalidate the user query after a short delay to ensure data is refreshed
        setTimeout(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/user"] });
        }, 500);
        
        console.log("Mining activation successful:", data);
      } catch (err) {
        console.error("Error updating cache:", err);
      }
    },
    onError: (error: Error) => {
      setMiningState("ready");
      console.error("Mining activation error:", error);
      
      toast({
        title: "Activation Failed",
        description: error.message || "Could not activate mining. Try again later.",
        variant: "default",
        className: "mining-error-toast",
      });
    },
  });

  // Get streak badge
  const renderStreakBadge = () => {
    if (!miningResult || miningResult.streakDay <= 1) return null;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className="absolute -top-2 -right-2 bg-yellow-500 hover:bg-yellow-600">
              <Award className="w-3 h-3 mr-1" /> {miningResult.streakDay} day streak
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>Mining {miningResult.streakDay} days in a row!</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Get bonus badge
  const renderBonusBadge = () => {
    if (!miningResult || !miningResult.bonusAmount) return null;
    
    const bonusType = miningResult.bonusType;
    let bonusText = "";
    let bonusColor = "";
    let BonusIcon = Gift;
    
    if (bonusType === "streak") {
      bonusText = "Streak Bonus";
      bonusColor = "bg-yellow-500 hover:bg-yellow-600";
      BonusIcon = Star;
    } else if (bonusType === "daily") {
      bonusText = "Lucky Bonus";
      bonusColor = "bg-green-500 hover:bg-green-600";
      BonusIcon = Gift;
    } else if (bonusType === "multiple") {
      bonusText = "Multiple Bonuses";
      bonusColor = "bg-purple-500 hover:bg-purple-600";
      BonusIcon = Award;
    }
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge className={`absolute -top-2 -left-2 ${bonusColor}`}>
              <BonusIcon className="w-3 h-3 mr-1" /> +{miningResult.bonusAmount}
            </Badge>
          </TooltipTrigger>
          <TooltipContent>
            <p>{bonusText}: +{miningResult.bonusAmount} $TSK</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  // Handle offline mining
  const handleOfflineMining = () => {
    setMiningState("mining");
    
    // Generate a simulated mining result based on user data
    setTimeout(() => {
      const baseAmount = miningRate || 1.0;
      const offlineMiningResult: MiningResult = {
        amount: baseAmount,
        bonusAmount: 0,
        bonusType: null,
        totalAmount: baseAmount,
        streakDay: userData?.streakDay || 1,
        newBalance: (userData?.tokenBalance || 0) + baseAmount,
        nextMiningTime: new Date(Date.now() + 1000 * 60).toISOString(),
        miningActive: userData?.miningActive || false
      };
      
      setMiningState("success");
      setMiningResult(offlineMiningResult);
      
      // Store the pending mining operation for later sync
      const pendingActions = JSON.parse(localStorage.getItem('offlinePendingActions') || '[]');
      pendingActions.push({
        url: '/api/mine',
        data: {},
        timestamp: Date.now()
      });
      localStorage.setItem('offlinePendingActions', JSON.stringify(pendingActions));
      
      // Update user data in cache
      const user = queryClient.getQueryData<any>(["/api/user"]);
      if (user) {
        queryClient.setQueryData(["/api/user"], {
          ...user,
          tokenBalance: offlineMiningResult.newBalance,
          lastMiningTime: new Date().toISOString()
        });
      }
      
      // Show success toast
      toast({
        title: "Mining Success (Offline)!",
        description: `You earned ${baseAmount} $TSK tokens (will sync when online)`,
      });
      
      // Notify parent component
      onMiningSuccess(baseAmount, offlineMiningResult.nextMiningTime);
      
      // Reset after delay
      setTimeout(() => {
        setMiningState("ready");
        setMiningResult(null);
      }, 2000);
    }, 1500);
  };
  
  // Handle offline activation
  const handleOfflineActivation = () => {
    setMiningState("mining");
    
    setTimeout(() => {
      setMiningState("ready");
      
      // Create an ISO timestamp for consistent format with the server
      const activationTimestamp = new Date().toISOString();
      
      // Store the pending activation for later sync
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
      
      // Update user data in cache with the same timestamp
      const user = queryClient.getQueryData<any>(["/api/user"]);
      if (user) {
        queryClient.setQueryData(["/api/user"], {
          ...user,
          miningActive: true,
          lastMiningActivation: activationTimestamp
        });
      }
      
      // Show success toast
      toast({
        title: "Mining Activated (Offline)!",
        description: `Automatic mining has been activated for ${miningSettings?.activationExpirationHours || 24} hours. Will sync when online.`,
      });
    }, 1000);
  };
  
  // Check if mining is active and get automation settings
  const isMiningActive = userData?.miningActive || false;
  const isAutomaticMiningEnabled = Boolean(miningSettings?.enableAutomaticMining);
  const requiresDailyActivation = Boolean(miningSettings?.dailyActivationRequired);
  
  // Determine if we should show the activation interface
  const showActivationInterface = isAutomaticMiningEnabled && requiresDailyActivation;
  
  // Handle manual mining click with offline support
  const handleMiningClick = () => {
    if (isOffline) {
      handleOfflineMining();
    } else {
      mineMutation.mutate();
    }
  };
  
  // Handle activation click with offline support
  const handleActivationClick = () => {
    if (isOffline) {
      handleOfflineActivation();
    } else {
      activateMiningMutation.mutate();
    }
  };
  
  return (
    <div className="flex flex-col items-center justify-center">
      {/* Mining animation container */}
      <div className="relative">
        {renderStreakBadge()}
        {renderBonusBadge()}
        
        <div 
          className={`relative w-48 h-48 rounded-full flex items-center justify-center mb-8 transition-all duration-300 ${
            miningState === "mining" 
              ? "mining-button-mining pulse-animation text-white"
              : miningState === "success"
              ? "mining-button-success mining-success-animation"
              : isMiningActive
              ? "mining-button-active mining-active-animation" 
              : "mining-button-ready"
          }`}
        >
          {/* Mining Progress Ring - only shown during mining state */}
          {miningState === "mining" && (
            <svg className="absolute top-0 left-0 w-full h-full mining-progress-ring">
              <circle 
                className="mining-progress-ring-bg" 
                cx="96" 
                cy="96" 
                r="90" 
                fill="none" 
                strokeWidth="4"
              />
              <circle 
                className="mining-progress-ring-fg mining-spin-animation" 
                cx="96" 
                cy="96" 
                r="90" 
                fill="none" 
                strokeWidth="4" 
                strokeDasharray="565.48" 
                strokeDashoffset="141.37" // 25% progress
              />
            </svg>
          )}
          
          {/* Active Mining Progress Ring - only shown when mining is active */}
          {isMiningActive && miningState === "ready" && (
            <svg className="absolute top-0 left-0 w-full h-full mining-progress-ring">
              <circle 
                className="mining-active-ring-bg" 
                cx="96" 
                cy="96" 
                r="90" 
                fill="none" 
                strokeWidth="4"
              />
              <circle 
                className="mining-active-ring-fg" 
                cx="96" 
                cy="96" 
                r="90" 
                fill="none" 
                strokeWidth="4" 
                strokeDasharray="565.48" 
                strokeDashoffset="0" // 100% progress
              />
            </svg>
          )}
          
          {/* Coin and sparkle animation container - only shown during success state */}
          {miningState === "success" && (
            <div className="coin-pop-container">
              {Array.from({ length: 5 }).map((_, i) => (
                <div 
                  key={i} 
                  className="coin-pop" 
                  style={{ 
                    left: `${20 + (i * 15)}%`,
                    animationDelay: `${i * 0.1}s`,
                    transform: `scale(${0.8 + (i * 0.1)})`
                  }}
                >
                  $
                </div>
              ))}
              
              {Array.from({ length: 8 }).map((_, i) => (
                <div 
                  key={i} 
                  className="sparkle" 
                  style={{ 
                    left: `${10 + (i * 10)}%`,
                    top: `${10 + ((i % 4) * 20)}%`, 
                    animationDelay: `${i * 0.05}s`,
                  }}
                />
              ))}
            </div>
          )}
          
          {/* Main content */}
          <div className="text-center z-10">
            {miningState === "mining" ? (
              <>
                <Loader2 className="h-12 w-12 mining-spin-animation mx-auto mb-2" />
                <p className="font-medium">Mining...</p>
              </>
            ) : miningState === "success" && miningResult ? (
              <>
                <Check className="h-12 w-12 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="font-medium text-gray-800 dark:text-gray-200">+{miningResult.totalAmount} $TSK</p>
                <p className="text-xs text-gray-500">
                  {miningResult.amount} base
                  {miningResult.bonusAmount > 0 && ` + ${miningResult.bonusAmount} bonus`}
                </p>
              </>
            ) : isAutomaticMiningEnabled && isMiningActive ? (
              <>
                <Clock className="h-12 w-12 mx-auto mb-2 text-green-600 dark:text-green-400" />
                <p className="font-medium text-gray-800 dark:text-gray-200">Mining Active</p>
                <p className="text-xs text-gray-500">
                  Earning {miningSettings?.hourlyRewardAmount || 0.5} TSK hourly
                </p>
              </>
            ) : isAutomaticMiningEnabled && !isMiningActive ? (
              <>
                <AlertTriangle className="h-12 w-12 mx-auto mb-2 text-yellow-600 dark:text-yellow-400" />
                <p className="font-medium text-gray-800 dark:text-gray-200">Mining Inactive</p>
                <p className="text-xs text-gray-500">
                  Activation required
                </p>
              </>
            ) : (
              <>
                <Hammer className="h-12 w-12 mx-auto mb-2 text-primary dark:text-blue-400" />
                <p className="font-medium text-gray-800 dark:text-gray-200">Click to Mine</p>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Mining Controls */}
      <div className="w-full max-w-md text-center">
        {/* Force mining system UI to show for testing */}
        {true ? (
          <>
            <Card className="mb-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-950 dark:to-green-950">
              <CardContent className="p-0">
                <h3 className="text-lg font-bold mb-2">Automatic Mining System</h3>
                <p className="text-sm mb-2">
                  {isMiningActive 
                    ? <span className="text-green-600 dark:text-green-400">✓ Mining is active and earning hourly rewards</span>
                    : <span className="text-yellow-600 dark:text-yellow-400">⚠ Mining needs activation</span>
                  }
                </p>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Hourly Reward:</span>
                  <span className="font-medium">{miningSettings?.hourlyRewardAmount || 0.5} TSK</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <span>Duration:</span>
                  <span className="font-medium">{miningSettings?.activationExpirationHours || 24} hours</span>
                </div>
                {isMiningActive ? (
                  <div className="w-full py-4 text-center text-md font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-md">
                    Mining rewards are being earned automatically
                  </div>
                ) : (
                  <Button 
                    className="w-full py-3 text-md font-medium"
                    onClick={handleActivationClick}
                    disabled={activateMiningMutation.isPending || miningState !== "ready"}
                  >
                    {activateMiningMutation.isPending ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Activating...</>
                    ) : (
                      <><Play className="mr-2 h-4 w-4" /> Activate Mining{isOffline && " (Offline)"}</>
                    )}
                  </Button>
                )}
              </CardContent>
            </Card>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
              Daily activation ensures maximum rewards!
            </p>
          </>
        ) : (
          <>
            <p className="text-lg mb-4">
              Mine <span className="font-bold text-primary dark:text-blue-400">{miningRate}</span> $TSK token per mining session
            </p>
            <p className="text-sm text-gray-500 mb-2">
              No waiting - mine as often as you want!
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400 mb-4">
              Daily streaks give bonus rewards!
            </p>
          </>
        )}
        
        {/* Always show the manual mining button, but make it secondary if automatic mining is active */}
        <Button 
          size="lg" 
          className={`py-3 px-8 text-lg font-medium ${isAutomaticMiningEnabled && isMiningActive ? "bg-slate-200 text-slate-800 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700" : ""}`}
          onClick={handleMiningClick}
          disabled={mineMutation.isPending || miningState !== "ready"}
          variant={isAutomaticMiningEnabled && isMiningActive ? "outline" : "default"}
        >
          {mineMutation.isPending ? (
            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Mining...</>
          ) : (
            <>Mine Now{isOffline && " (Offline)"}</>
          )}
        </Button>
        
        {/* Offline indicator */}
        {isOffline && (
          <div className="mt-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded-md flex items-center justify-center text-yellow-800 dark:text-yellow-200">
            <WifiOff className="w-4 h-4 mr-2" />
            <span className="text-sm">Offline Mode - Changes will sync when connection is restored</span>
          </div>
        )}
      </div>
      
      {/* Include the error dialog component */}
      <ErrorDialog />
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import MiningButton from "@/components/mining/mining-button";
import ActivationButton from "@/components/mining/activation-button";
import FloatingActivateButton from "@/components/mining/floating-activate-button";
import RealTimeEarnings from "@/components/mining/real-time-earnings";
import MiningRateCalculator from "@/components/mining/mining-rate-calculator";
import AdDisplay from "@/components/ads/ad-display";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";
import { useToast } from "@/hooks/use-toast";
import { WifiOff, RotateCw } from "lucide-react";
import { 
  setupOfflineSyncListeners, 
  hasPendingOfflineActions, 
  getPendingOfflineActionsCount,
  syncOfflineActions 
} from "@/lib/offline-sync";

export default function MiningPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [canMine, setCanMine] = useState(false);
  const [nextMiningTime, setNextMiningTime] = useState<string | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [hasPendingActions, setHasPendingActions] = useState(hasPendingOfflineActions());
  const [pendingActionsCount, setPendingActionsCount] = useState(getPendingOfflineActionsCount());
  const [isSyncing, setIsSyncing] = useState(false);
  
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
      } finally {
        setIsActivating(false);
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Mining Activated!",
        description: `Automatic mining has been activated for ${miningSettings?.activationExpirationHours || 24} hours`,
      });
      
      // Get the server timestamp from the response
      const serverActivationTime = data.lastMiningActivation || new Date().toISOString();
      
      // Update user data in cache with the server timestamp
      const userData = queryClient.getQueryData<any>(["/api/user"]);
      if (userData) {
        queryClient.setQueryData(["/api/user"], {
          ...userData,
          miningActive: true,
          lastMiningActivation: serverActivationTime
        });
      }
      
      // Refresh user data to ensure it's up to date with the server
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      }, 500);
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

  // Fetch mining history
  const { data: miningHistory } = useQuery({
    queryKey: ["/api/mining/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/history?limit=3");
      return await res.json();
    }
  });
  
  // Fetch mining settings
  const { data: miningSettings } = useQuery({
    queryKey: ["/api/mining/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/settings");
      return await res.json();
    }
  });

  // Users can always mine - no hourly cooldown
  useEffect(() => {
    // Always allow mining - removed hourly cooldown
    setCanMine(true);
    setNextMiningTime(null);
  }, [user]);
  
  // Setup offline sync listeners
  useEffect(() => {
    // Update online/offline status
    const handleOnline = () => {
      setIsOffline(false);
      // Check for pending actions after coming online
      setHasPendingActions(hasPendingOfflineActions());
      setPendingActionsCount(getPendingOfflineActionsCount());
    };
    
    const handleOffline = () => {
      setIsOffline(true);
    };
    
    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Setup automatic sync when coming back online
    const cleanup = setupOfflineSyncListeners(toast);
    
    // Periodically check for pending actions (every 5 seconds)
    const interval = setInterval(() => {
      const hasPending = hasPendingOfflineActions();
      const pendingCount = getPendingOfflineActionsCount();
      setHasPendingActions(hasPending);
      setPendingActionsCount(pendingCount);
    }, 5000);
    
    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      cleanup();
      clearInterval(interval);
    };
  }, [toast]);
  
  // Handle manual sync
  const handleManualSync = async () => {
    if (!navigator.onLine) {
      toast({
        title: "Offline",
        description: "Cannot sync while offline. Please connect to the internet first.",
        variant: "destructive",
      });
      return;
    }
    
    if (!hasPendingActions) {
      toast({
        title: "No Pending Actions",
        description: "There are no offline mining operations to sync.",
      });
      return;
    }
    
    setIsSyncing(true);
    
    try {
      const result = await syncOfflineActions();
      
      if (result.failed === 0) {
        toast({
          title: "Sync Complete",
          description: `Successfully synced ${result.success} mining ${result.success === 1 ? 'operation' : 'operations'}.`,
        });
      } else {
        toast({
          title: "Sync Partially Complete",
          description: `Synced ${result.success} of ${result.total} operations. ${result.failed} failed.`,
          variant: "destructive",
        });
      }
      
      // Update pending actions status
      setHasPendingActions(hasPendingOfflineActions());
      setPendingActionsCount(getPendingOfflineActionsCount());
      
    } catch (error) {
      console.error("Sync error:", error);
      toast({
        title: "Sync Failed",
        description: "There was an error syncing your offline mining operations.",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMiningSuccess = (_amount: number, _nextTime: string) => {
    // Keep mining enabled - no cooldown anymore
    setCanMine(true);
    setNextMiningTime(null);
  };

  // Calculate mining stats components
  const baseMiningRate = 1.0;
  const referralBonus = user ? (user.miningRate - baseMiningRate) * 0.5 : 0; // Estimated
  const premiumBonus = user ? (user.miningRate - baseMiningRate) * 0.5 : 0; // Estimated

  // Handle mobile mining activation
  const handleMobileActivation = () => {
    if (!user) return;
    
    activateMiningMutation.mutate();
  };
  
  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <MobileMenu />
      
      {/* Fixed Mobile Mining Activation Button */}
      <FloatingActivateButton position="bottom" />

      <main className="flex-grow">
        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm p-4 mt-4">
          <h2 className="text-xl font-semibold">Mining</h2>
          
          {/* Token Balance Display */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full py-1 px-4">
            <span className="mr-2 text-yellow-500">
              <i className="fas fa-coin"></i>
            </span>
            <span className="font-medium">{formatTokenAmount(user?.tokenBalance || 0)}</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">$TSK</span>
          </div>
        </header>
        
        {/* Content Area */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              
              {/* Mining Center */}
              <Card>
                <CardHeader>
                  <CardTitle>Daily Mining</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col items-center justify-center py-10">
                    <MiningButton 
                      miningRate={user?.miningRate || 1.0}
                      onMiningSuccess={handleMiningSuccess}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Offline Status Bar (always shows when offline) */}
              {isOffline && (
                <div className="my-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900 rounded-lg p-4">
                  <div className="flex items-center text-yellow-800 dark:text-yellow-500">
                    <WifiOff className="h-5 w-5 mr-2" />
                    <div className="flex-1">
                      <h3 className="font-medium">Offline Mode</h3>
                      <p className="text-sm text-yellow-700 dark:text-yellow-400">
                        You're currently mining offline. Your rewards will be synced when you reconnect.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Pending Actions Sync Bar (only shows when online with pending actions) */}
              {!isOffline && hasPendingActions && (
                <div className="my-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <div className="flex items-center text-blue-800 dark:text-blue-500">
                    <div className="flex-1">
                      <h3 className="font-medium">Pending Rewards</h3>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        You have {pendingActionsCount} mining {pendingActionsCount === 1 ? 'reward' : 'rewards'} waiting to be synced.
                      </p>
                    </div>
                    <Button 
                      onClick={handleManualSync} 
                      disabled={isSyncing}
                      size="sm"
                      className="ml-4"
                    >
                      {isSyncing ? (
                        <>
                          <RotateCw className="h-4 w-4 mr-2 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        <>
                          <RotateCw className="h-4 w-4 mr-2" />
                          Sync Now
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Real-time Earnings */}
              <div className="my-6">
                <RealTimeEarnings refreshInterval={5000} />
              </div>
              
              {/* Ad Display with Animation */}
              <div className="my-6">
                <AdDisplay 
                  placement="mining" 
                  animation="slideInBottom" 
                  className="shadow-soft hover:shadow-md transition-shadow duration-300"
                />
              </div>
            </div>
            
            <div>
              {/* Mining Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Mining Statistics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Base Mining Rate</p>
                      <p className="text-xl font-medium">1.0 $TSK/session</p>
                    </div>
                    
                    <div className="border-t dark:border-gray-700 pt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Referral Boost</p>
                      <p className="text-xl font-medium text-accent dark:text-green-400">+{referralBonus.toFixed(1)} $TSK</p>
                      {user?.referredBy && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">From your active referrals</p>
                      )}
                    </div>
                    
                    <div className="border-t dark:border-gray-700 pt-4">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Premium Multiplier</p>
                      <p className="text-xl font-medium text-yellow-500">+{premiumBonus.toFixed(1)} $TSK</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {user?.premiumTier} package (x{user?.premiumMultiplier.toFixed(1)})
                      </p>
                    </div>
                    
                    <div className="border-t dark:border-gray-700 pt-4">
                      <div className="flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 12.8 6.5 10.866a1 1 0 010-1.732l3.354-1.935 1.18-4.455A1 1 0 0112 2z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">Streak Bonuses</p>
                      </div>
                      
                      <div className="relative py-2">
                        {/* Progress Tracker Line */}
                        <div className="absolute top-7 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                        
                        {/* Day Markers */}
                        <div className="grid grid-cols-5 gap-1 relative">
                          {[1, 2, 3, 5, 10].map((day, index) => {
                            // Calculate color based on day value - gradient from blue to green to gold
                            let bgColor = 'bg-blue-100 dark:bg-blue-900/30';
                            let textColor = 'text-blue-600 dark:text-blue-400';
                            let borderColor = 'border-blue-200 dark:border-blue-800';
                            let dotColor = 'bg-blue-400 dark:bg-blue-600';
                            
                            if (day >= 3 && day < 5) {
                              bgColor = 'bg-green-100 dark:bg-green-900/30';
                              textColor = 'text-green-600 dark:text-green-400';
                              borderColor = 'border-green-200 dark:border-green-800';
                              dotColor = 'bg-green-400 dark:bg-green-600';
                            } else if (day >= 5) {
                              bgColor = 'bg-yellow-100 dark:bg-yellow-900/30';
                              textColor = 'text-yellow-600 dark:text-yellow-400';
                              borderColor = 'border-yellow-200 dark:border-yellow-800';
                              dotColor = 'bg-yellow-400 dark:bg-yellow-600';
                            }
                            
                            return (
                              <div key={day} className="flex flex-col items-center">
                                {/* Bonus Indicator */}
                                <div className={`flex flex-col items-center justify-center ${bgColor} border ${borderColor} rounded-lg p-2 w-full relative z-10`}>
                                  <span className={`text-sm font-bold ${textColor}`}>
                                    {day > 1 ? `+${(day * 5)}%` : '0%'}
                                  </span>
                                </div>
                                
                                {/* Day Dot */}
                                <div className={`w-3 h-3 ${dotColor} rounded-full my-1 z-20`}></div>
                                
                                {/* Day Label */}
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  Day {day}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      <div className="mt-3 p-2 bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/30 dark:to-amber-950/30 rounded-lg border border-yellow-100 dark:border-yellow-900/50">
                        <p className="text-xs flex items-center text-yellow-700 dark:text-yellow-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          Mine daily to maintain your streak and earn up to <span className="font-bold">+50%</span> bonus rewards!
                        </p>
                      </div>
                    </div>
                    
                    <div className="border-t dark:border-gray-700 pt-4">
                      <div className="flex items-center mb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500 mr-2" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        <p className="text-sm font-medium text-green-700 dark:text-green-400">Daily Lucky Bonus</p>
                      </div>
                      
                      <div className="flex items-center mb-2">
                        <div className="relative w-full bg-gray-200 dark:bg-gray-700 h-8 rounded-full overflow-hidden">
                          <div className="absolute inset-0 opacity-30 bg-gradient-to-r from-green-200 via-green-300 to-green-200 animate-pulse"></div>
                          <div className="absolute left-0 top-0 bottom-0 bg-green-500 w-[10%]"></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <p className="text-sm font-bold text-gray-800 dark:text-white z-10">
                              10% Lucky Chance
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-2 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-100 dark:border-green-900/50">
                        <p className="text-xs flex items-center text-green-700 dark:text-green-400">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Every mining session has a <span className="font-bold">10% chance</span> to <span className="font-bold text-green-600 dark:text-green-300">double your rewards!</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="mt-6 mb-2">
                      <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-lg shadow-lg">
                        <div className="flex items-center mb-3">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white mr-2" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <p className="font-medium text-white">Total Mining Power</p>
                        </div>
                        
                        <div className="flex flex-col">
                          <div className="flex justify-between items-end mb-1">
                            <p className="text-3xl font-bold text-white">
                              {formatTokenAmount(user?.miningRate || 1.0)} 
                              <span className="ml-1">$TSK</span>
                            </p>
                            <div className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded">
                              <p className="text-xs font-medium text-white">PER SESSION</p>
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2 mt-3">
                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-yellow-300 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                              <span className="text-xs text-white">Streak Bonus</span>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-green-300 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-white">Lucky Bonus</span>
                            </div>
                            
                            <div className="bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-blue-300 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13a1 1 0 102 0V9.414l1.293 1.293a1 1 0 001.414-1.414z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-white">Premium Rate</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Mining History */}
              {/* Mining Tools - Tabs for History and Calculator */}
              <Card className="mt-6">
                <Tabs defaultValue="history" className="w-full">
                  <CardHeader className="pb-0">
                    <div className="flex justify-between items-center">
                      <CardTitle>Mining Tools</CardTitle>
                      <TabsList>
                        <TabsTrigger value="history">History</TabsTrigger>
                        <TabsTrigger value="calculator">Calculator</TabsTrigger>
                      </TabsList>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TabsContent value="history" className="space-y-3 mt-2">
                      {miningHistory && miningHistory.length > 0 ? (
                        miningHistory.map((history: any) => {
                          const totalAmount = (history.amount || 0) + (history.bonusAmount || 0);
                          const hasBonus = history.bonusAmount > 0;
                          const hasStreak = history.streakDay > 1;
                          const isAutomatic = history.source === 'automatic';
                          
                          return (
                            <div key={history.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                              <div>
                                <div className="flex items-center">
                                  <p className="font-medium">+{totalAmount} $TSK</p>
                                  {hasStreak && (
                                    <span className="ml-2 text-xs bg-yellow-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                                      Day {history.streakDay}
                                    </span>
                                  )}
                                  {hasBonus && history.bonusType === 'daily' && (
                                    <span className="ml-2 text-xs bg-green-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                                      Lucky
                                    </span>
                                  )}
                                  {isAutomatic && (
                                    <span className="ml-2 text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-medium">
                                      Auto
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {new Date(history.timestamp).toLocaleString()}
                                  {hasBonus && (
                                    <span className="ml-2 text-green-500 dark:text-green-400">
                                      (Base: {history.amount} + Bonus: {history.bonusAmount})
                                    </span>
                                  )}
                                </p>
                              </div>
                              <span className="text-green-500">
                                <i className="fas fa-check-circle"></i>
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-center text-gray-500 dark:text-gray-400 py-2">
                          No mining history yet. Start mining to see your results!
                        </p>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="calculator" className="mt-2">
                      <MiningRateCalculator />
                    </TabsContent>
                  </CardContent>
                </Tabs>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

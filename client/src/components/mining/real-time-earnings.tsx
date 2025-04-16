import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";
import { Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface RealTimeEarningsProps {
  refreshInterval?: number; // in milliseconds, default 10 seconds
}

// Define a type for the persistent earnings state
interface PersistentEarningsState {
  lastEarning: number;
  earnedSinceLastUpdate: number;
  secondsElapsed: number;
  hourlyProgress: number;
  lastUpdateTime: number;
}

// Create a default state
const defaultEarningsState: PersistentEarningsState = {
  lastEarning: 0,
  earnedSinceLastUpdate: 0,
  secondsElapsed: 0,
  hourlyProgress: 0,
  lastUpdateTime: Date.now()
};

export default function RealTimeEarnings({ refreshInterval = 10000 }: RealTimeEarningsProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Use the persistent state from cache, localStorage as fallback, or default if not available
  const getPersistedState = (): PersistentEarningsState => {
    // First try to get from React Query cache
    const cachedState = queryClient.getQueryData<PersistentEarningsState>(['miningEarningsState']);
    if (cachedState) return cachedState;
    
    // If not in cache, try to get from localStorage
    try {
      const savedState = localStorage.getItem('miningEarningsState');
      if (savedState) {
        const parsedState = JSON.parse(savedState) as PersistentEarningsState;
        
        // Check if the saved state is relatively recent (within last 24 hours)
        // This prevents using very old state data
        const lastUpdateTime = parsedState.lastUpdateTime;
        const currentTime = Date.now();
        const hoursSinceLastUpdate = (currentTime - lastUpdateTime) / (1000 * 60 * 60);
        
        if (hoursSinceLastUpdate <= 24) {
          console.log('Restored mining state from localStorage, last updated', 
            new Date(lastUpdateTime).toLocaleTimeString());
          return parsedState;
        } else {
          console.log('Saved mining state is too old, using default state');
        }
      }
    } catch (e) {
      console.error('Error retrieving mining state from localStorage:', e);
    }
    
    // Default state if nothing is available
    return defaultEarningsState;
  };
  
  const persistentState = getPersistedState();
  
  // Initialize state with persistent values or defaults
  const [lastEarning, setLastEarning] = useState<number>(persistentState.lastEarning);
  const [earnedSinceLastUpdate, setEarnedSinceLastUpdate] = useState<number>(persistentState.earnedSinceLastUpdate);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(persistentState.secondsElapsed);
  const [hourlyProgress, setHourlyProgress] = useState<number>(persistentState.hourlyProgress);
  
  // Fetch the user's mining settings
  const { data: miningSettings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ["/api/mining/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/settings");
      return await res.json();
    }
  });
  
  // Fetch the user's latest automatic mining stats
  const { data: automaticMiningStats, isLoading: isLoadingStats, refetch } = useQuery({
    queryKey: ["/api/mine/automatic-stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mine/automatic-stats");
      return await res.json();
    },
    refetchInterval: refreshInterval,
  });
  
  // Helper function to update the persistent state in React Query cache and localStorage
  const updatePersistentState = (updates: Partial<PersistentEarningsState>) => {
    const currentState = queryClient.getQueryData<PersistentEarningsState>(['miningEarningsState']) || 
                         defaultEarningsState;
    
    const newState = {
      ...currentState,
      ...updates,
      lastUpdateTime: Date.now()
    };
    
    // Update in React Query cache
    queryClient.setQueryData(['miningEarningsState'], newState);
    
    // Also save to localStorage for persistence across page refreshes
    try {
      localStorage.setItem('miningEarningsState', JSON.stringify(newState));
    } catch (e) {
      console.error('Error saving mining state to localStorage:', e);
    }
  };
  
  // Update the timer every second
  useEffect(() => {
    if (!user?.miningActive || !automaticMiningStats) return;
    
    const timer = setInterval(() => {
      setSecondsElapsed(prev => {
        const newValue = prev + 1;
        // If we've reached the full hour, reset back to 0
        if (newValue >= 3600) {
          return 0;
        }
        
        // Update the persistent state with the new seconds value
        updatePersistentState({
          secondsElapsed: newValue
        });
        
        return newValue;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [user?.miningActive, automaticMiningStats]);
  
  // Handle time elapsed when component is hidden/inactive or application is closed and reopened
  useEffect(() => {
    if (!user?.miningActive) return;
    
    // Function to handle visibility changes (tab switching, window minimizing)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncMiningProgress();
      }
    };
    
    // Function to handle application focus (when switching back to app)
    const handleFocus = () => {
      syncMiningProgress();
    };
    
    // Function to handle page beforeunload event - save current state right before closing
    const handleBeforeUnload = () => {
      // Immediately save current state to localStorage
      try {
        const currentState = {
          lastEarning,
          earnedSinceLastUpdate,
          secondsElapsed,
          hourlyProgress,
          lastUpdateTime: Date.now()
        };
        localStorage.setItem('miningEarningsState', JSON.stringify(currentState));
        console.log('Mining state saved before page unload', secondsElapsed);
      } catch (e) {
        console.error('Error saving mining state on unload:', e);
      }
    };
    
    // Function to sync mining progress with elapsed time
    const syncMiningProgress = () => {
      if (!user?.miningActive || !miningSettings) return;
      
      // Get the most up-to-date state from localStorage
      let currentState;
      try {
        const savedState = localStorage.getItem('miningEarningsState');
        currentState = savedState ? JSON.parse(savedState) : persistentState;
        
        console.log('Syncing mining progress. Saved state:', 
          currentState.secondsElapsed, 
          'seconds. Last updated:',
          new Date(currentState.lastUpdateTime).toLocaleTimeString());
      } catch (e) {
        console.error('Error retrieving mining state for sync:', e);
        currentState = persistentState;
      }
      
      // Check if we need to account for time that passed while away
      const currentTime = Date.now();
      const lastUpdateTime = currentState.lastUpdateTime;
      const timeDiffSeconds = Math.floor((currentTime - lastUpdateTime) / 1000);
      
      console.log('Time since last update:', timeDiffSeconds, 'seconds');
      
      // If more than 2 seconds have passed since last update,
      // we need to account for the time elapsed (but cap at 1 hour)
      if (timeDiffSeconds > 2) {
        // If more than an hour has passed, we should calculate offline earnings
        // and then restart the timer for the current hour
        if (timeDiffSeconds >= 3600) {
          // Calculate how many complete hours have passed
          const hoursElapsed = Math.floor(timeDiffSeconds / 3600);
          // Calculate the remaining seconds in the current hour
          const remainingSeconds = timeDiffSeconds % 3600;
          
          console.log(`User was away for ${hoursElapsed} hours and ${remainingSeconds} seconds`);
          
          // Update the state to reflect the current progress within the hour
          const updatedState = {
            ...currentState,
            secondsElapsed: remainingSeconds,
            // Earned since last update will be calculated in the next useEffect
            earnedSinceLastUpdate: 0,
            hourlyProgress: (remainingSeconds / 3600) * 100,
            lastUpdateTime: currentTime
          };
          
          setSecondsElapsed(remainingSeconds);
          setEarnedSinceLastUpdate(0);
          setHourlyProgress((remainingSeconds / 3600) * 100);
          
          updatePersistentState(updatedState);
          console.log('Mining continued with progress:', remainingSeconds, 'seconds into the hour');
          
          // If user was away for more than one hour, we should trigger a server-side update
          // to credit them for the hours they were away
          if (hoursElapsed > 0 && user?.id) {
            console.log(`Crediting user for ${hoursElapsed} missed mining hours...`);
            
            // Call API to trigger offline reward calculation
            apiRequest("POST", "/api/mine/offline-credit", {
              hours: hoursElapsed,
              userId: user.id
            }).then(() => {
              // After crediting offline earnings, refresh the stats to show updated values
              refetch();
            }).catch(error => {
              console.error("Error crediting offline mining:", error);
            });
          }
          
        } else {
          // Calculate how many seconds to add, but don't exceed 3600 (1 hour)
          const newSecondsElapsed = Math.min(currentState.secondsElapsed + timeDiffSeconds, 3599);
          setSecondsElapsed(newSecondsElapsed);
          
          // Update the persistent state
          updatePersistentState({
            secondsElapsed: newSecondsElapsed
          });
          
          console.log('Mining progress updated to account for elapsed time:', newSecondsElapsed);
        }
      }
    };
    
    // Call once on component mount to handle initial load
    syncMiningProgress();
    
    // Add event listeners for visibility and focus changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    // Clean up event listeners on unmount
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [
    user?.miningActive, 
    automaticMiningStats, 
    miningSettings, 
    lastEarning, 
    earnedSinceLastUpdate, 
    secondsElapsed, 
    hourlyProgress
  ]);
  
  // Calculate progress and earnings
  useEffect(() => {
    if (!user?.miningActive || !automaticMiningStats || !miningSettings) return;
    
    // Calculate hourly progress as a percentage
    const progress = (secondsElapsed / 3600) * 100;
    setHourlyProgress(progress);
    
    // Calculate earnings since last update
    // We're estimating the accrued earnings based on time since last update
    const hourlyRate = user.miningRate * (miningSettings.hourlyRewardAmount || 1);
    const earningPerSecond = hourlyRate / 3600;
    const earned = earningPerSecond * secondsElapsed;
    
    setEarnedSinceLastUpdate(earned);
    
    // Update the persistent state
    updatePersistentState({
      hourlyProgress: progress,
      earnedSinceLastUpdate: earned
    });
    
    // When the data is refetched, update the last earning amount
    if (automaticMiningStats.lastHourlyEarning !== undefined && 
        automaticMiningStats.lastHourlyEarning !== lastEarning) {
      setLastEarning(automaticMiningStats.lastHourlyEarning);
      setSecondsElapsed(0); // Reset the timer when we get a new earning
      
      // Update the persistent state
      updatePersistentState({
        lastEarning: automaticMiningStats.lastHourlyEarning,
        secondsElapsed: 0,
        earnedSinceLastUpdate: 0
      });
    }
  }, [
    secondsElapsed, 
    user?.miningActive, 
    user?.miningRate, 
    automaticMiningStats, 
    miningSettings, 
    lastEarning
  ]);
  
  // If mining is not active, show a message
  if (!user?.miningActive) {
    return (
      <Card className="border-gray-200 dark:border-gray-700 shadow-md">
        <CardHeader className="pb-2 border-b dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Mining Earnings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">Mining Inactive</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-xs">
              To start earning automatic rewards, please activate mining from the control panel.
            </p>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2">
              <div className="bg-gray-400 dark:bg-gray-600 h-2.5 rounded-full w-0"></div>
            </div>
            <p className="text-sm text-gray-400">No active mining session</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Loading state
  if (isLoadingSettings || isLoadingStats) {
    return (
      <Card className="border-blue-100 dark:border-blue-900 shadow-md">
        <CardHeader className="pb-2 border-b dark:border-gray-700">
          <CardTitle className="flex items-center space-x-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
            <span>Mining Earnings</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="h-16 w-16 rounded-full border-4 border-blue-200 dark:border-blue-800 border-t-blue-500 dark:border-t-blue-400 animate-spin"></div>
              <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mt-6 mb-2">Loading Mining Data</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please wait while we fetch your mining information...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate time remaining
  const secondsRemaining = 3600 - secondsElapsed;
  const hours = Math.floor(secondsRemaining / 3600);
  const minutes = Math.floor((secondsRemaining % 3600) / 60);
  const seconds = secondsRemaining % 60;
  const timeDisplay = `${hours.toString().padStart(1, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  
  // Total earned this session (last hourly reward + current accruing amount)
  const totalEarned = automaticMiningStats?.todayEarnings || 0;
  const accruedSoFar = earnedSinceLastUpdate;
  
  return (
    <Card className="border-blue-100 dark:border-blue-900 shadow-md">
      <CardHeader className="pb-2 border-b dark:border-gray-700">
        <CardTitle className="flex items-center space-x-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
          </svg>
          <span>Real-time Mining Earnings</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex flex-col p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Current Mining Session</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Accumulating rewards</p>
              </div>
              <p className="text-lg font-bold text-green-600 dark:text-green-400">
                +{formatTokenAmount(accruedSoFar)} $TSK
              </p>
            </div>
            <Progress value={hourlyProgress} className="h-3 w-full bg-blue-200 dark:bg-blue-800" />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-600 dark:text-gray-400">Next reward in</p>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">{timeDisplay}</p>
            </div>
          </div>
          
          <div className="pt-4 border-t dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Last Hourly Reward</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Most recent completed reward</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {lastEarning > 0 
                    ? `+${formatTokenAmount(lastEarning)} $TSK` 
                    : 'None yet'}
                </p>
                {lastEarning > 0 && (
                  <p className="text-xs text-gray-500">Auto-deposited to your balance</p>
                )}
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t dark:border-gray-700">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Today's Earnings</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Total for today</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                  {totalEarned > 0 
                    ? `+${formatTokenAmount(totalEarned)} $TSK` 
                    : '0 $TSK'}
                </p>
                <p className="text-xs text-gray-500">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg border border-blue-100 dark:border-blue-800">
            <div className="flex flex-col">
              <div className="flex items-center space-x-2 mb-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-semibold text-blue-700 dark:text-blue-300">Your Mining Power</p>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {formatTokenAmount(user?.miningRate * (miningSettings?.hourlyrewardamount || 1))} $TSK/hour
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    Activation expires in {miningSettings?.activationexpirationhours || 24} hours
                  </p>
                </div>
                <div className="bg-blue-600 dark:bg-blue-700 px-3 py-1 rounded-full">
                  <p className="text-xs font-medium text-white">ACTIVE</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
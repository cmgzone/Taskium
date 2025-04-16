import { useEffect, useState } from "react";
import { calculateTimeRemaining, formatTime } from "@/lib/contract-utils";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Clock, Trophy, AlertTriangle } from "lucide-react";

interface MiningCountdownProps {
  nextMiningTime: string;
}

export default function MiningCountdown({ nextMiningTime }: MiningCountdownProps) {
  const [countdown, setCountdown] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [streakEndTime, setStreakEndTime] = useState<Date | null>(null);
  
  // Fetch mining history to determine streak
  const { data: miningHistory } = useQuery({
    queryKey: ["/api/mining/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/history?limit=1");
      return await res.json();
    }
  });
  
  // Calculate streak expiration time (48 hours after last mining)
  useEffect(() => {
    if (miningHistory && miningHistory.length > 0) {
      const lastMining = miningHistory[0];
      if (lastMining.streakDay > 1) {
        const lastMiningDate = new Date(lastMining.timestamp);
        // Streak ends if not mined within 48 hours of last mining
        const endTime = new Date(lastMiningDate.getTime() + (48 * 60 * 60 * 1000));
        setStreakEndTime(endTime);
      }
    }
  }, [miningHistory]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      const nextTime = new Date(nextMiningTime).getTime();
      const { hours, minutes, seconds, totalSeconds } = calculateTimeRemaining(nextTime);
      
      setCountdown({ hours, minutes, seconds });
      
      // Clear interval if time is up
      if (totalSeconds <= 0) {
        clearInterval(timer);
        window.location.reload(); // Refresh to update mining availability
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [nextMiningTime]);

  // Calculate streak expiration hours
  const getStreakTimeRemaining = () => {
    if (!streakEndTime) return null;
    
    const now = new Date();
    const diff = streakEndTime.getTime() - now.getTime();
    
    if (diff <= 0) return "Expired";
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const streakInfo = getStreakTimeRemaining();
  const currentStreak = miningHistory && miningHistory.length > 0 ? miningHistory[0].streakDay : 0;

  return (
    <div className="text-center">
      <p className="text-lg mb-2">Mining Cooldown</p>
      <p className="text-gray-600 dark:text-gray-400 mb-4">Your next mining opportunity will be available in:</p>
      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <span className="block text-3xl font-bold text-primary dark:text-blue-400">
              {String(countdown.hours).padStart(2, '0')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Hours</span>
          </div>
          <div>
            <span className="block text-3xl font-bold text-primary dark:text-blue-400">
              {String(countdown.minutes).padStart(2, '0')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Minutes</span>
          </div>
          <div>
            <span className="block text-3xl font-bold text-primary dark:text-blue-400">
              {String(countdown.seconds).padStart(2, '0')}
            </span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Seconds</span>
          </div>
        </div>
      </div>

      {/* Streak Information */}
      {currentStreak > 1 && streakInfo && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-left">
          <div className="flex items-start">
            <div className="shrink-0 mr-2 mt-0.5">
              {streakInfo === "Expired" ? (
                <AlertTriangle className="h-5 w-5 text-red-500" />
              ) : (
                <Trophy className="h-5 w-5 text-yellow-500" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                Current Streak: Day {currentStreak}
              </p>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="text-xs flex items-center mt-1">
                      <Clock className="h-3 w-3 inline mr-1 text-gray-500" />
                      {streakInfo === "Expired" ? (
                        <span className="text-red-500">Streak expired</span>
                      ) : (
                        <span className="text-gray-500">
                          Streak expires in: <span className="font-medium">{streakInfo}</span>
                        </span>
                      )}
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      You must mine at least once every 48 hours to maintain your streak. 
                      Don't lose your {currentStreak * 5}% mining bonus!
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

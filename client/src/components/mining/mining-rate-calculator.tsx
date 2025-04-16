import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatTokenAmount } from "@/lib/contract-utils";
import { Calculator } from "lucide-react";

export default function MiningRateCalculator() {
  const { user } = useAuth();
  const [streakDays, setStreakDays] = useState(1);
  const [luckyBonus, setLuckyBonus] = useState(false);
  const [calculatedRate, setCalculatedRate] = useState(0);
  
  // Fetch mining settings
  const { data: miningSettings } = useQuery({
    queryKey: ["/api/mining/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/settings");
      return await res.json();
    }
  });
  
  // Calculate mining rate based on inputs
  useEffect(() => {
    if (!user || !miningSettings) return;
    
    // Base rate is user's mining rate
    let rate = user.miningRate;
    
    // Apply streak bonus if enabled
    if (miningSettings.enableStreakBonus && streakDays > 1) {
      // Each day adds 5% bonus, up to 50% (10 days)
      const streakBonusPercent = Math.min((streakDays - 1) * 0.05, 0.5);
      rate = rate * (1 + streakBonusPercent);
    }
    
    // Apply lucky bonus if toggled
    if (luckyBonus && miningSettings.enableDailyBonus) {
      // Lucky bonus doubles the reward
      rate = rate * 2;
    }
    
    // Update calculated rate
    setCalculatedRate(rate);
  }, [user, miningSettings, streakDays, luckyBonus]);
  
  // Generate streak day labels
  const streakLabels = () => {
    const labels = [];
    for (let i = 1; i <= 10; i++) {
      const bonusText = i > 1 ? `+${(i-1) * 5}%` : "0%";
      labels.push(
        <div key={i} className="flex flex-col items-center text-xs">
          <span className="font-medium">{i}</span>
          <span className="text-gray-500">{bonusText}</span>
        </div>
      );
    }
    return labels;
  };
  
  if (!user || !miningSettings) {
    return null; // Don't render if data is not available
  }
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Mining Rate Calculator</h3>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Calculate your potential mining rewards with streak bonuses and lucky strikes
      </p>
      
      <div className="space-y-6">
        {/* Streak Day Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium">Mining Streak</h4>
            <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              Day {streakDays}
            </span>
          </div>
          <Slider
            value={[streakDays]}
            min={1}
            max={10}
            step={1}
            onValueChange={(values) => setStreakDays(values[0])}
            className="my-4"
          />
          <div className="flex justify-between mt-1 mb-2 px-1">
            {streakLabels()}
          </div>
        </div>
        
        {/* Lucky Bonus Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium">Lucky Bonus (2x Rewards)</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">10% chance on each mining session</p>
          </div>
          <button
            onClick={() => setLuckyBonus(!luckyBonus)}
            className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
              luckyBonus 
                ? "bg-green-500 text-white" 
                : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            }`}
          >
            {luckyBonus ? "Applied" : "Not Applied"}
          </button>
        </div>
        
        {/* Results Section */}
        <div className="mt-6 pt-4 border-t dark:border-gray-700">
          <div className="flex justify-between items-end">
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Calculated Rate</h4>
              <p className="text-xs text-gray-500">Base: {formatTokenAmount(user?.miningRate || 1)} $TSK</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary dark:text-blue-400">
                {formatTokenAmount(calculatedRate)} $TSK
              </p>
              <p className="text-xs text-gray-500">per session</p>
            </div>
          </div>
          
          {/* Hourly estimation */}
          <div className="mt-4 pt-4 border-t dark:border-gray-700">
            <div className="flex justify-between items-end">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Automatic Mining</h4>
                <p className="text-xs text-gray-500">Base hourly rate</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-primary dark:text-blue-400">
                  {formatTokenAmount(user?.miningRate * (miningSettings?.hourlyRewardAmount || 1))} $TSK
                </p>
                <p className="text-xs text-gray-500">per hour</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
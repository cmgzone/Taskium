import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Flame } from "lucide-react";
import { formatTokenAmount } from "@/lib/contract-utils";

interface BurnerDisplayProps {
  tokensToBurn: number;
  tokensBurned: number;
  nextBurnDate: string | null;
  burnRateMultiplier: number;
}

export default function BurnerDisplay({
  tokensToBurn,
  tokensBurned,
  nextBurnDate,
  burnRateMultiplier = 1.0
}: BurnerDisplayProps) {
  const getFormattedNextBurnDate = () => {
    if (!nextBurnDate) return "No scheduled burn";
    
    const burnDate = new Date(nextBurnDate);
    return burnDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getPercentComplete = () => {
    // Calculate percentage of tokens burned compared to tokens to burn
    if (tokensToBurn <= 0) return 0;
    const percent = (tokensBurned / tokensToBurn) * 100;
    return Math.min(100, Math.max(0, percent));
  };
  
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold">TSK Token Burner</h3>
            <Flame className="h-8 w-8 text-yellow-300" />
          </div>
          
          <div className="mb-4">
            <p className="text-sm opacity-80 mb-1">Next Scheduled Burn:</p>
            <p className="font-medium">{getFormattedNextBurnDate()}</p>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Burn Progress</span>
                <span>{formatTokenAmount(tokensBurned)} / {formatTokenAmount(tokensToBurn)}</span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div 
                  className="bg-yellow-300 h-2 rounded-full transition-all duration-1000 ease-in-out" 
                  style={{ width: `${getPercentComplete()}%` }}
                />
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Current Burn Rate</span>
                <span>x{burnRateMultiplier.toFixed(1)}</span>
              </div>
              <p className="text-xs opacity-70">
                Burns help increase token value by reducing total supply
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, Play } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ActivationButtonProps {
  // Takes basic props to keep it simple
  isActive?: boolean;
  hourlyRewardAmount?: number;
  activationHours?: number;
}

export default function ActivationButton({ 
  isActive = false, 
  hourlyRewardAmount = 0.5, 
  activationHours = 24 
}: ActivationButtonProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isActivating, setIsActivating] = useState(false);
  // Track local state for UI transitions
  const [localIsActive, setLocalIsActive] = useState(isActive);
  
  // Use the local state first, falling back to the prop for initial render
  const miningActive = localIsActive || isActive;
  
  const activateMutation = useMutation({
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
      // Update local state immediately
      setLocalIsActive(true);
      
      toast({
        title: "Mining Activated!",
        description: `Automatic mining has been activated for ${activationHours} hours`,
      });
      
      // Get the server timestamp from the response
      const serverActivationTime = data.lastMiningActivation || new Date().toISOString();
      
      // Update user data in cache with the server timestamp
      const user = queryClient.getQueryData<any>(["/api/user"]);
      if (user) {
        queryClient.setQueryData(["/api/user"], {
          ...user,
          miningActive: true,
          lastMiningActivation: serverActivationTime
        });
      }
      
      // Refresh user data after a short delay
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

  // If mining is active, show the active state card
  if (miningActive) {
    return (
      <Card className="mb-6 p-4 bg-gradient-to-r from-green-100 to-blue-100 dark:from-green-900 dark:to-blue-900 border-4 border-green-500 shadow-lg">
        <CardContent className="p-0">
          <h3 className="text-2xl font-extrabold mb-3 text-center">✅ MINING IS ACTIVE ✅</h3>
          <p className="text-md mb-3 font-bold text-center">
            <span className="text-green-600 dark:text-green-400">Mining is earning hourly rewards automatically</span>
          </p>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Hourly Reward:</span>
            <span className="font-medium">{hourlyRewardAmount} TSK</span>
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
            <span>Duration:</span>
            <span className="font-medium">{activationHours} hours</span>
          </div>
          <div className="w-full py-4 text-center text-lg font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded-md">
            Mining rewards are being earned automatically
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Otherwise show the activation button
  return (
    <Card className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 border-4 border-primary shadow-lg">
      <CardContent className="p-0">
        <h3 className="text-2xl font-extrabold mb-3 text-center">⚠️ DAILY MINING ACTIVATION ⚠️</h3>
        <p className="text-md mb-3 font-bold text-center">
          <span className="text-yellow-600 dark:text-yellow-400 text-lg">Mining needs activation to earn rewards!</span>
        </p>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Hourly Reward:</span>
          <span className="font-medium">{hourlyRewardAmount} TSK</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <span>Duration:</span>
          <span className="font-medium">{activationHours} hours</span>
        </div>
        <Button 
          className="w-full py-6 text-xl font-extrabold bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white"
          onClick={() => activateMutation.mutate()}
          disabled={isActivating}
          size="lg"
        >
          {isActivating ? (
            <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> Activating Mining...</>
          ) : (
            <><Play className="mr-2 h-6 w-6" /> ACTIVATE MINING NOW</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
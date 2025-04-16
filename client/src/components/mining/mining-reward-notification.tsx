import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { showMiningRewardNotification } from '@/lib/androidNotifications';

interface MiningReward {
  id: number;
  userId: number;
  amount: number;
  timestamp: string;
  source: string;
  status: string;
  streakDay: number | null;
  bonusAmount: number | null;
}

/**
 * Component that listens for mining rewards and shows notifications
 * This should be mounted somewhere in the app that's always present
 */
export default function MiningRewardNotification() {
  const { user } = useAuth();
  const lastRewardIdRef = useRef<number | null>(null);
  
  // Poll for new mining rewards
  const { data: recentRewards } = useQuery({
    queryKey: ['/api/mining/rewards/recent'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/mining/rewards/recent');
      return await res.json() as MiningReward[];
    },
    // Only run this query if user is logged in
    enabled: !!user,
    // Poll every 30 seconds
    refetchInterval: 30 * 1000,
    // Don't refetch on window focus to avoid double notifications
    refetchOnWindowFocus: false
  });

  // Show notification for new rewards
  useEffect(() => {
    try {
      if (!recentRewards || recentRewards.length === 0) return;
      
      // Sort rewards by timestamp (newest first)
      const sortedRewards = [...recentRewards].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const latestReward = sortedRewards[0];
      
      // If we've already shown a notification for this reward, don't show it again
      if (lastRewardIdRef.current === latestReward.id) return;
      
      // Update ref with latest reward ID
      lastRewardIdRef.current = latestReward.id;
      
      // Show notification
      showMiningRewardNotification(
        latestReward.amount, 
        latestReward.streakDay, 
        '/mining'
      );
    } catch (error) {
      console.error('Error processing mining rewards for notification:', error);
    }
  }, [recentRewards]);

  // This is a background component with no UI
  return null;
}
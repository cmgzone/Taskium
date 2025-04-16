import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import SimpleOnboarding from "@/components/onboarding/simple-onboarding";
import AdaptiveLearningWizard from "@/components/onboarding/adaptive-learning-wizard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";
import BurnerDisplay from "@/components/mining/burner-display";
import EventCountdown from "@/components/dashboard/event-countdown";
import AdDisplay from "@/components/ads/ad-display";

interface ActivityItem {
  id: number;
  type: "mining" | "referral" | "purchase" | "sale";
  date: string;
  amount: number;
  status: "completed" | "pending" | "failed";
}

export default function DashboardPage() {
  const { user } = useAuth();
  // Removed countdown timer for immediate mining
  const [onboardingComplete, setOnboardingComplete] = useState<boolean>(false);

  // Fetch recent activity
  const { data: miningHistory } = useQuery({
    queryKey: ["/api/mining/history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/history?limit=5");
      return await res.json();
    }
  });

  // Fetch referral stats
  const { data: referralData } = useQuery({
    queryKey: ["/api/referrals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/referrals");
      return await res.json();
    }
  });
  
  // Fetch onboarding preferences
  const { data: onboardingPrefs } = useQuery({
    queryKey: ["/api/user/onboarding-preferences"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/onboarding-preferences");
      return await res.json();
    },
    enabled: !!user
  });
  
  // No banner and ad content queries
  
  // Fetch token burn data
  const { data: burnData } = useQuery({
    queryKey: ["/api/token/burn-stats"],
    queryFn: async () => {
      try {
        const res = await apiRequest("GET", "/api/token/burn-stats");
        return await res.json();
      } catch (error) {
        console.error("Error fetching burn stats:", error);
        // Return default values if API isn't available yet
        return {
          tokensToBurn: 1000000,
          tokensBurned: 250000,
          nextBurnDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
          burnRateMultiplier: 1.5
        };
      }
    }
  });

  // No longer need to calculate next mining time - immediate mining is available
  // Removed countdown timer logic for immediate mining
  
  // Check if onboarding is complete
  useEffect(() => {
    if (onboardingPrefs) {
      console.log("Onboarding preferences:", onboardingPrefs);
      
      // The field is named disableOnboarding in the database but might be returned as disableonboarding
      // We need to check both in case of inconsistencies
      const isDisabled = 
        (onboardingPrefs.disableonboarding === true) || 
        (onboardingPrefs.disableOnboarding === true);
      
      console.log("Setting onboardingComplete to:", isDisabled);
      setOnboardingComplete(isDisabled);
    } else {
      // If we have a user but no onboarding preferences, set to false to show onboarding
      if (user) {
        console.log("User exists but no onboarding preferences found, showing onboarding");
        setOnboardingComplete(false);
      }
    }
  }, [onboardingPrefs, user]);
  
  // Ad and banner content removed

  // Get referral stats
  const referralStats = {
    total: referralData?.stats?.total || 0,
    active: referralData?.stats?.active || 0,
    boost: (referralData?.stats?.active || 0) * 10, // 10% per active referral
  };

  // Combine mining history and other activities
  const recentActivity = miningHistory?.map((item: any) => ({
    id: item.id,
    type: "mining",
    date: new Date(item.timestamp).toLocaleString(),
    amount: item.amount,
    status: "completed"
  })) || [];
  
  // If onboarding is not complete, show the simple onboarding
  if (!onboardingComplete && user) {
    // Define a callback handler to ensure we set state immediately when onboarding completes
    const handleOnboardingComplete = () => {
      console.log("Onboarding completed, setting onboardingComplete to true");
      setOnboardingComplete(true);
    };

    return (
      <div className="flex flex-col lg:flex-row min-h-screen bg-background">
        <Sidebar />
        <MobileMenu />
        <div className="flex-grow">
          <AdaptiveLearningWizard onComplete={handleOnboardingComplete} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Sidebar />
      <MobileMenu />

      <main className="flex-grow lg:pl-64 pt-4">
        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm p-4">
          <h2 className="text-xl font-semibold">Dashboard</h2>
          
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Mining Stats Card */}
            <Card>
              <CardHeader className="flex justify-between items-start pb-2">
                <CardTitle className="text-lg">Mining Stats</CardTitle>
                <span className="text-primary dark:text-blue-400 text-xl">
                  <i className="fas fa-hammer"></i>
                </span>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Mining Rate</p>
                    <p className="text-2xl font-bold">{formatTokenAmount(user?.miningRate || 0)} $TSK/session</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mining Status</p>
                    <div className="bg-green-100 dark:bg-green-900 rounded-lg p-3 mt-1">
                      <div className="flex items-center">
                        <span className="text-green-500 mr-2">✓</span>
                        <span className="text-sm font-medium text-green-700 dark:text-green-300">
                          Available Now
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        No waiting required - mine as often as you want!
                      </p>
                    </div>
                  </div>
                  
                  <Link href="/mining">
                    <Button className="w-full">
                      Go to Mining
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Referral Stats Card */}
            <Card>
              <CardHeader className="flex justify-between items-start pb-2">
                <CardTitle className="text-lg">Referral Program</CardTitle>
                <span className="text-accent dark:text-green-400 text-xl">
                  <i className="fas fa-user-plus"></i>
                </span>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Referrals</p>
                    <p className="text-2xl font-bold">{referralStats.active}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mining Boost</p>
                    <p className="text-2xl font-bold text-accent dark:text-green-400">+{referralStats.boost}%</p>
                  </div>
                  
                  <Link href="/referrals">
                    <Button className="w-full" variant="secondary">
                      Refer Friends
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
            
            {/* Premium Status Card */}
            <Card>
              <CardHeader className="flex justify-between items-start pb-2">
                <CardTitle className="text-lg">Premium Status</CardTitle>
                <span className="text-yellow-500 text-xl">
                  <i className="fas fa-crown"></i>
                </span>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-4">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Current Package</p>
                    <p className="text-2xl font-bold">{user?.premiumTier}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Mining Multiplier</p>
                    <p className="text-2xl font-bold text-yellow-500">x{user?.premiumMultiplier.toFixed(1)}</p>
                  </div>
                  
                  <Link href="/premium">
                    <Button className="w-full" variant="outline">
                      Upgrade Now
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
            <Card>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tokens</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {recentActivity.length > 0 ? (
                      recentActivity.map((activity: ActivityItem) => (
                        <tr key={activity.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="text-primary dark:text-blue-400 mr-2">
                                <i className="fas fa-hammer"></i>
                              </span>
                              <span>Mining Reward</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {activity.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-500">
                            +{activity.amount} $TSK
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                              Completed
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                          No recent activity. Start mining to see your history!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
          
          {/* Upcoming Events Section */}
          <div className="mt-8">
            <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
            <EventCountdown />
          </div>

          {/* Token Burner Section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Token Burner</h3>
            </div>
            {burnData && (
              <BurnerDisplay
                tokensToBurn={burnData.tokensToBurn}
                tokensBurned={burnData.tokensBurned}
                nextBurnDate={burnData.nextBurnDate}
                burnRateMultiplier={burnData.burnRateMultiplier}
              />
            )}
          </div>
          
          {/* Promotional Content */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Featured Offer</h3>
            </div>
            <div className="mb-6">
              <AdDisplay 
                placement="dashboard" 
                animation="fadeIn" 
                className="shadow-soft hover:shadow-md transition-shadow duration-300"
              />
            </div>
          </div>
          
          {/* Learning Resources */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Learning Resources</h3>
            </div>
            <Card>
              <CardContent className="p-4">
                <p className="mb-4">
                  Continue your learning journey or explore new features of the platform.
                </p>
                <div className="space-y-2">
                  <Button 
                    onClick={() => {
                      console.log("Opening learning center, setting onboardingComplete to false");
                      // Force the value to false and update the state directly
                      setOnboardingComplete(false);
                    }} 
                    variant="outline"
                    className="w-full"
                  >
                    Open Learning Center
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
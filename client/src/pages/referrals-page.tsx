import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import ReferralLink from "@/components/referrals/referral-link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";

interface ReferredUser {
  referralId: number;
  userId: number;
  username: string;
  active: boolean;
  joinDate: string;
}

export default function ReferralsPage() {
  const { user } = useAuth();

  // Fetch referral data
  const { data: referralData, isLoading } = useQuery({
    queryKey: ["/api/referrals"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/referrals");
      return await res.json();
    }
  });

  // Calculate referral boost based on active referrals
  const referralBoost = referralData?.stats?.active ? referralData.stats.active * 10 : 0; // 10% per active referral
  const referredUsers = referralData?.referrals || [];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <MobileMenu />

      <main className="flex-grow">
        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm p-4">
          <h2 className="text-xl font-semibold">Referrals</h2>
          
          {/* Token Balance Display */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full py-1 px-4">
            <span className="mr-2 text-yellow-500">
              <i className="fas fa-coin"></i>
            </span>
            <span className="font-medium">{formatTokenAmount(user?.tokenBalance || 0)}</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">TSK</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              {/* Referral Link */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold mb-3">Your Referral Link</h3>
                <ReferralLink referralCode={user?.referralCode || ''} />
              </div>
              
              {/* Referral Rewards */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Referral Rewards</h3>
                <Card>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                          <tr>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">User</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Join Date</th>
                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {isLoading ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-center">
                                <p className="text-gray-500 dark:text-gray-400">Loading referrals...</p>
                              </td>
                            </tr>
                          ) : referredUsers.length > 0 ? (
                            referredUsers.map((referral: ReferredUser) => (
                              <tr key={referral.referralId}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
                                      <span>{referral.username.slice(0, 2).toUpperCase()}</span>
                                    </div>
                                    <div className="ml-3">
                                      <p className="font-medium">{referral.username}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                  {new Date(referral.joinDate).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                    referral.active 
                                      ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" 
                                      : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                  }`}>
                                    {referral.active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-4 text-center">
                                <p className="text-gray-500 dark:text-gray-400">You haven't referred anyone yet. Share your referral link to start earning rewards!</p>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <div>
              {/* Referral Stats */}
              <Card>
                <CardHeader>
                  <CardTitle>Referral Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Total Referrals</p>
                      <p className="text-2xl font-bold">{referralData?.stats?.total || 0}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Active Referrals</p>
                      <p className="text-2xl font-bold text-accent dark:text-green-400">{referralData?.stats?.active || 0}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Mining Rate Boost</p>
                      <p className="text-2xl font-bold text-primary dark:text-blue-400">+{referralBoost}%</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">10% per active referral</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Referral Program */}
              <Card className="mt-6">
                <CardHeader>
                  <CardTitle>Referral Program</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-accent mt-1 mr-2"></i>
                      <span>Earn <strong>10%</strong> of your referrals' mining rewards</span>
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-accent mt-1 mr-2"></i>
                      <span>Get a <strong>+10%</strong> boost to your mining rate for each active referral</span>
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-accent mt-1 mr-2"></i>
                      <span>Maximum of <strong>10 active referrals</strong> for a total boost of 100%</span>
                    </p>
                    <p className="flex items-start">
                      <i className="fas fa-check-circle text-accent mt-1 mr-2"></i>
                      <span>Referrals must mine at least once every 7 days to stay active</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

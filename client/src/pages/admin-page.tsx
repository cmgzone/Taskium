import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import AdminTabs from "@/components/admin/admin-tabs";
import { Card } from "@/components/ui/card";
import { ShieldAlert, Crown, Activity, Settings } from "lucide-react";

export default function AdminPage() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();

  // Redirect non-admin users
  useEffect(() => {
    if (user && user.role !== "admin") {
      navigate("/");
    }
  }, [user, navigate]);

  if (user?.role !== "admin") {
    return null; // Prevent rendering of admin content for non-admins
  }

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <MobileMenu />

      <main className="flex-grow relative">
        {/* Admin badge (fixed position) */}
        <div className="fixed top-4 right-4 z-20 flex items-center gap-2 bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 text-white rounded-full py-1.5 px-4 shadow-md">
          <ShieldAlert className="h-4 w-4" />
          <span className="font-medium text-sm">Admin</span>
        </div>

        {/* Content Area */}
        <div className="pt-16 pb-8 px-4 md:px-8">
          <div className="flex flex-col md:flex-row items-start gap-6 mb-8">
            {/* Admin header with gradient border */}
            <div className="relative rounded-xl bg-gradient-to-r p-[2px] from-blue-600 via-purple-600 to-amber-600 max-w-3xl">
              <div className="bg-background rounded-xl p-5 md:p-6">
                <div className="flex items-center space-x-4 mb-4">
                  <img 
                    src="/icons/taskium-logo-original.png" 
                    alt="Taskium Logo" 
                    className="h-14 w-auto"
                  />
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-amber-600 text-transparent bg-clip-text">
                      Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground max-w-xl">
                      Manage all aspects of the TSK platform. Changes made here will affect the entire system and all users.
                    </p>
                  </div>
                </div>

                {/* Quick stats */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 flex items-center gap-3">
                    <div className="bg-blue-600 text-white p-2 rounded-md">
                      <Crown className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Admin Role</p>
                      <p className="text-sm font-semibold">Full Access</p>
                    </div>
                  </div>
                  
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 flex items-center gap-3">
                    <div className="bg-purple-600 text-white p-2 rounded-md">
                      <Activity className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-purple-600 dark:text-purple-400 font-medium">System Status</p>
                      <p className="text-sm font-semibold">Online</p>
                    </div>
                  </div>
                  
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 flex items-center gap-3">
                    <div className="bg-amber-600 text-white p-2 rounded-md">
                      <Settings className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Settings</p>
                      <p className="text-sm font-semibold">9 Categories</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden border shadow-sm">
            <AdminTabs />
          </div>
        </div>
      </main>
    </div>
  );
}

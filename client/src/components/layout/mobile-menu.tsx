import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { X, Menu, LogOut, Settings, Clock, Play, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/contract-utils";
import { ThemeToggle } from "@/components/theme/theme-switcher";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import NotificationBell from "@/components/notifications/notification-bell";
import { PWAStatus } from "@/components/app/pwa-status";

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();
  const [isActivating, setIsActivating] = useState(false);
  
  // Fetch mining settings
  const { data: miningSettings } = useQuery({
    queryKey: ["/api/mining/settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/settings");
      return await res.json();
    }
  });
  
  // Activate mining mutation
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
      
      // Update user data in cache
      const userData = queryClient.getQueryData<any>(["/api/user"]);
      if (userData) {
        queryClient.setQueryData(["/api/user"], {
          ...userData,
          miningActive: true,
          lastMiningActivation: new Date().toISOString()
        });
      }
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      closeMenu();
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

  const navigation = [
    { name: "Dashboard", href: "/", icon: "fa-tachometer-alt" },
    { name: "Mining", href: "/mining", icon: "fa-hammer" },
    { name: "Referrals", href: "/referrals", icon: "fa-user-plus" },
    { name: "Marketplace", href: "/marketplace", icon: "fa-store" },
    { name: "Premium", href: "/premium", icon: "fa-crown" },
    { name: "Wallet", href: "/wallet", icon: "fa-wallet" },
    { name: "Buy Tokens", href: "/tokens", icon: "fa-coins" },
    { name: "Advertising", href: "/advertising", icon: "fa-ad" },
    { name: "Chat", href: "/chat", icon: "fa-comments" },
    { name: "Notifications", href: "/notifications", icon: "fa-bell" },
    { name: "Whitepapers", href: "/whitepapers", icon: "fa-file-pdf" },
  ];

  // Add admin link for admin users
  if (user && user.role === "admin") {
    navigation.push({ name: "Admin", href: "/admin", icon: "fa-cog" });
  }

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  const handleLogout = () => {
    logoutMutation.mutate();
    closeMenu();
  };

  return (
    <>
      {/* Floating Action Buttons */}
      <div className="lg:hidden fixed bottom-20 right-4 z-40 flex flex-col space-y-2">
        {/* Notifications Button */}
        <Link 
          href="/notifications"
          className="p-3 rounded-full bg-purple-500 shadow-lg hover:bg-purple-600 text-white"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
        </Link>
        
        {/* Settings Button */}
        <Link 
          href="/settings"
          className="p-3 rounded-full bg-blue-500 shadow-lg hover:bg-blue-600 text-white"
          aria-label="Settings"
        >
          <Settings className="h-5 w-5" />
        </Link>
        
        {/* Theme Toggle Button */}
        <div className="p-1 rounded-full bg-white dark:bg-gray-800 shadow-lg">
          <ThemeToggle />
        </div>
        
        {/* Logout Button */}
        <button 
          onClick={handleLogout}
          className="p-3 rounded-full bg-red-500 shadow-lg hover:bg-red-600 text-white"
          aria-label="Logout"
          disabled={logoutMutation.isPending}
        >
          {logoutMutation.isPending ? <Clock className="h-5 w-5 animate-spin" /> : <LogOut className="h-5 w-5" />}
        </button>
        
        {/* Main Menu Button */}
        <button 
          onClick={toggleMenu}
          className="p-3 rounded-full bg-primary shadow-lg hover:bg-primary/90 text-white"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile Navigation Drawer */}
      <div 
        className={`lg:hidden fixed inset-0 bg-black bg-opacity-50 z-50 ${isOpen ? 'block' : 'hidden'}`}
        onClick={closeMenu}
      >
        <div 
          className={`bg-white dark:bg-gray-800 w-64 h-full transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-4 border-b dark:border-gray-700 flex justify-end items-center">
            <button 
              onClick={closeMenu}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User profile in mobile menu */}
          <div className="p-4 border-b dark:border-gray-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center">
                <span>{user?.username.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="ml-3">
                <p className="font-medium">{user?.username}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user?.walletAddress 
                    ? formatAddress(user.walletAddress) 
                    : "No wallet connected"}
                </p>
              </div>
            </div>
          </div>
          
          {/* Mining Status Section */}
          <div className="p-5 bg-gradient-to-r from-blue-100 to-green-100 dark:from-blue-900 dark:to-green-900 border-b dark:border-gray-700 shadow-inner">
            <h3 className="text-xl font-semibold mb-2 text-center">
              {user?.miningActive 
                ? <span className="text-green-600 dark:text-green-400">✓ Mining Active</span>
                : <span className="text-gray-600 dark:text-gray-400">Mining Status</span>
              }
            </h3>
            
            <p className="text-sm text-center font-medium">
              {user?.miningActive 
                ? `Earning ${miningSettings?.hourlyRewardAmount || 1} TSK hourly rewards`
                : "Check the mining page for details"
              }
            </p>
          </div>

          {/* Mobile Navigation Links */}
          <nav className="py-4">
            <ul className="space-y-2 px-4">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <li key={item.name}>
                    <Link 
                      href={item.href}
                      onClick={closeMenu}
                      className={`block p-3 rounded-lg ${
                        isActive 
                          ? "bg-blue-50 dark:bg-blue-900 text-primary dark:text-blue-400" 
                          : "hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                    >
                      <i className={`fas ${item.icon} mr-3`}></i> {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="border-t dark:border-gray-700 mt-4 pt-4 px-4">
              <div className="flex space-x-2 mb-4">
                <Button 
                  variant="outline" 
                  className="flex-1 p-3 rounded-lg flex items-center justify-center bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900"
                  asChild
                >
                  <Link href="/settings" onClick={closeMenu}>
                    <Settings className="mr-2 h-5 w-5" /> Settings
                  </Link>
                </Button>
                
                <ThemeToggle />
              </div>
              
              {/* PWA Installation Status */}
              <div className="flex justify-center my-2 p-2">
                <PWAStatus />
              </div>

              <Button 
                variant="destructive" 
                className="w-full p-3 rounded-lg flex items-center justify-center text-lg font-bold bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
              >
                {logoutMutation.isPending ? (
                  <>
                    <Clock className="mr-2 h-5 w-5 animate-spin" /> Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-5 w-5" /> LOGOUT
                  </>
                )}
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </>
  );
}
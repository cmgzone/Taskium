import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/lib/theme-provider";
import { useMobileEnvironment } from "@/hooks/use-mobile";
import { LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatAddress } from "@/lib/contract-utils";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Logo } from "@/components/ui/logo";
import NotificationBell from "@/components/notifications/notification-bell";
import AdDisplay from "@/components/ads/ad-display";
import { PWAStatus } from "@/components/app/pwa-status";

interface SidebarProps {
  onLinkClick?: () => void;
}

export default function Sidebar({ onLinkClick }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const { isMobileDevice } = useMobileEnvironment();

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
    { name: "Android App", href: "/android-app", icon: "fa-mobile-alt" },
    { name: "Whitepapers", href: "/whitepapers", icon: "fa-file-pdf" },
    { name: "Settings", href: "/settings", icon: "fa-cog" },
  ];

  // Add admin link for admin users
  if (user && user.role === "admin") {
    navigation.push({ name: "Admin", href: "/admin", icon: "fa-cog" });
  }

  const handleLogout = () => {
    logoutMutation.mutate();
    if (onLinkClick) onLinkClick();
  };

  // On mobile, the sidebar is handled by the MobileMenu component
  if (isMobileDevice) {
    return null;
  }

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-gray-800 border-r dark:border-gray-700 h-screen fixed left-0 top-0 z-30">
      {/* User profile summary */}
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

      {/* Navigation Links */}
      <nav className="flex-grow py-4">
        <ul className="space-y-2 px-4">
          {navigation.map((item) => {
            const isActive = location === item.href;
            return (
              <li key={item.name}>
                <Link 
                  href={item.href}
                  onClick={onLinkClick}
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
      </nav>

      {/* Sidebar Ad */}
      <div className="px-4 py-2">
        <AdDisplay 
          placement="sidebar" 
          animation="fadeIn"
          className="w-full" 
        />
      </div>
      
      {/* Bottom controls */}
      <div className="p-4 border-t dark:border-gray-700 space-y-3">
        <div className="flex items-center justify-between mb-3">
          <Link 
            href="/notifications" 
            onClick={onLinkClick}
            className="flex-1 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-md"
          >
            <div className="flex items-center">
              <i className="fas fa-bell mr-2"></i>
              <span>Notifications</span>
            </div>
          </Link>
          
          {user && <NotificationBell userId={user.id} />}
        </div>
        
        {/* PWA Installation Status */}
        <div className="flex justify-center my-2">
          <PWAStatus />
        </div>
        
        <Button 
          variant="destructive" 
          onClick={handleLogout} 
          disabled={logoutMutation.isPending}
          className="w-full p-3 rounded-lg flex items-center justify-center"
        >
          <LogOut className="mr-2 h-4 w-4" /> Logout
        </Button>
        
        <div className="flex justify-center items-center mt-3">
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}
import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Home, Pickaxe, Share2, ShoppingCart, Wallet, User, Sparkles, Menu, X, DollarSign, Smartphone } from 'lucide-react';
import { useMobileEnvironment } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/ui/logo';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import MobileSidebar from '@/components/layout/mobile-sidebar';

export default function MobileNavBar() {
  const [location] = useLocation();
  const { isMobileDevice } = useMobileEnvironment();
  
  // Don't show the mobile nav on desktop or on auth pages
  if (!isMobileDevice || location === '/auth') {
    return null;
  }

  const [isOpen, setIsOpen] = useState(false);
  
  const closeSidebar = () => {
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <button className="p-3 rounded-full bg-primary shadow-lg hover:bg-primary/90 text-white mobile-menu-button">
              <Menu size={24} />
            </button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-full max-w-[280px] sm:max-w-[320px]">
            <div className="h-full">
              <MobileSidebar onLinkClick={closeSidebar} />
            </div>
          </SheetContent>
        </Sheet>
      </div>
      
      <nav className="mobile-nav-bar">
        <NavLink href="/" icon={<Home size={20} />} label="Home" active={location === '/'} />
        <NavLink href="/mining" icon={<Pickaxe size={20} />} label="Mining" active={location === '/mining'} />
        <NavLink href="/marketplace" icon={<ShoppingCart size={20} />} label="Market" active={location === '/marketplace'} />
        <NavLink href="/android-app" icon={<Smartphone size={20} />} label="Android" active={location === '/android-app'} />
        <NavLink href="/premium" icon={<Sparkles size={20} />} label="Premium" active={location === '/premium'} />
        <NavLink href="/advertising" icon={<DollarSign size={20} />} label="Ads" active={location === '/advertising'} />
      </nav>
    </>
  );
}

interface NavLinkProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active: boolean;
}

function NavLink({ href, icon, label, active }: NavLinkProps) {
  return (
    <Link href={href}>
      <a className={cn(
        "flex flex-col items-center justify-center px-1 py-1 rounded-md", 
        active 
          ? "text-primary font-medium" 
          : "text-muted-foreground hover:text-foreground"
      )}>
        <div className={cn(
          "w-10 h-10 flex items-center justify-center rounded-full",
          active ? "bg-primary/10" : "hover:bg-muted/50"
        )}>
          {icon}
        </div>
        <span className="text-xs mt-1">{label}</span>
      </a>
    </Link>
  );
}
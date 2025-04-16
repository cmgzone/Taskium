import { useState, useEffect, useRef } from 'react';
import { X, Download, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';

// Add the BeforeInstallPromptEvent interface
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function AppInstallPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [hasClosedPopup, setHasClosedPopup] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      
      // Store the event so it can be triggered later
      deferredPromptRef.current = e as BeforeInstallPromptEvent;
      
      // Update UI to indicate app can be installed
      setIsInstallable(true);
      
      console.log('App is installable! "beforeinstallprompt" event was fired.');
    };
    
    // Listen for app installed event
    const handleAppInstalled = () => {
      // Log app was installed
      console.log('App was installed');
      
      // Save to localStorage that app is installed
      localStorage.setItem('has_installed_app', 'true');
      
      // Hide the popup
      setIsVisible(false);
    };
    
    // Add event listeners
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    
    // Check if user is on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    // Check if user has already seen and closed the popup
    const hasUserClosedPopup = localStorage.getItem('app_install_popup_closed');
    
    // Check if user has already installed the app
    const hasInstalledApp = localStorage.getItem('has_installed_app');
    
    // Only show popup if on mobile, not installed, and not dismissed before
    if (isMobile && !hasUserClosedPopup && !hasInstalledApp) {
      // Delay showing popup by 3 seconds to not interrupt initial page load
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.removeEventListener('appinstalled', handleAppInstalled);
      };
    }
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setHasClosedPopup(true);
    localStorage.setItem('app_install_popup_closed', 'true');
    
    // Reset after 7 days so user will see popup again
    setTimeout(() => {
      localStorage.removeItem('app_install_popup_closed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  const handleInstallClick = async () => {
    // If we have the beforeinstallprompt event, use it to show the install prompt
    if (deferredPromptRef.current) {
      // Show the install prompt
      deferredPromptRef.current.prompt();
      
      // Wait for the user to respond to the prompt
      const choiceResult = await deferredPromptRef.current.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        localStorage.setItem('has_installed_app', 'true');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      // Clear the saved prompt since it can only be used once
      deferredPromptRef.current = null;
      setIsInstallable(false);
    } else {
      // If no install prompt is available (e.g., iOS), redirect to the download page
      console.log('No installation prompt available, redirecting to download page');
      localStorage.setItem('has_clicked_install', 'true');
    }
    
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-in slide-in-from-bottom duration-300">
      <Card className="border border-primary/20 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/60"></div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 h-8 w-8" 
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>
        
        <CardContent className="pt-6 pb-4">
          <div className="flex items-start gap-3">
            <div className="bg-primary/10 p-2 rounded-full flex-shrink-0">
              <Smartphone className="h-6 w-6 text-primary" />
            </div>
            
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-1">Get the TSK Platform App</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Enjoy a better experience with faster loading times, offline access, and enhanced mining features.
              </p>
              
              <div className="flex gap-2 mt-2">
                {isInstallable ? (
                  <Button 
                    className="gap-2" 
                    onClick={handleInstallClick}
                  >
                    <Download className="h-4 w-4" />
                    Install App
                  </Button>
                ) : (
                  <Link href="/android-app">
                    <Button 
                      className="gap-2" 
                      onClick={handleInstallClick}
                    >
                      <Download className="h-4 w-4" />
                      Download App
                    </Button>
                  </Link>
                )}
                
                <Button 
                  variant="outline" 
                  onClick={handleClose}
                >
                  Continue to Website
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
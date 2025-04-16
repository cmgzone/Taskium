import React, { useEffect, useState } from 'react';
import { DownloadCloud, CheckCircle } from 'lucide-react';

/**
 * PWA Status Component - Displays when the app is running as a PWA
 * and provides installation instructions when it's not
 */
export function PWAStatus() {
  const [isPWA, setIsPWA] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Check if app is running as a PWA (in standalone mode)
    const isInStandaloneMode = () => 
      (window.matchMedia('(display-mode: standalone)').matches) || 
      (window.navigator as any).standalone || 
      document.referrer.includes('android-app://');
    
    setIsPWA(isInStandaloneMode());

    // Listen for display mode changes (e.g. when installed)
    const displayModeMediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      setIsPWA(e.matches);
    };
    
    displayModeMediaQuery.addEventListener('change', handleDisplayModeChange);

    // Capture install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent Chrome 76+ from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e);
      // Show the install banner
      setShowBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);

    // Hide banner if already installed (appinstalled event)
    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setDeferredPrompt(null);
      setIsPWA(true);
      
      // Log success to analytics or console
      console.log('PWA was installed');
    });

    return () => {
      displayModeMediaQuery.removeEventListener('change', handleDisplayModeChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as any);
      window.removeEventListener('appinstalled', () => {});
    };
  }, []);

  // Handle install button click
  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    
    // Show the install prompt
    deferredPrompt.prompt();
    
    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.userChoice;
    
    // Clear the saved prompt
    setDeferredPrompt(null);
    
    // Hide banner regardless of user choice
    setShowBanner(false);
    
    // Log outcome to analytics or console
    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }
  };

  // Don't show anything if the app is already a PWA
  if (isPWA) {
    return (
      <div className="pwa-status">
        <div className="flex items-center gap-1 text-xs text-green-600 py-1 px-2 bg-green-50 rounded-full">
          <CheckCircle size={12} />
          <span>App Installed</span>
        </div>
      </div>
    );
  }

  // Show install banner if available
  if (showBanner && deferredPrompt) {
    return (
      <div className="pwa-install-banner bg-blue-50 p-3 rounded-lg shadow-sm mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DownloadCloud className="text-blue-600" size={20} />
          <span className="text-sm">Install Taskium for a better experience</span>
        </div>
        <button 
          onClick={handleInstallClick}
          className="bg-blue-600 text-white px-3 py-1 text-sm rounded hover:bg-blue-700"
        >
          Install
        </button>
      </div>
    );
  }

  // Return null if we can't offer installation
  return null;
}

export default PWAStatus;
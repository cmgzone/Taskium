import { useState, useEffect } from 'react';
import { XCircle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useMobileEnvironment } from '@/hooks/use-mobile';

// This type is defined based on the BeforeInstallPromptEvent which is not in standard TypeScript types
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { isMobileDevice, isPWA } = useMobileEnvironment();
  
  useEffect(() => {
    // Don't show the prompt if not on a mobile device or already installed
    if (!isMobileDevice || isPWA) return;
    
    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if the user has previously dismissed the prompt
    const hasPromptBeenDismissed = localStorage.getItem('pwaPromptDismissed');
    if (hasPromptBeenDismissed) {
      setShowPrompt(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [isMobileDevice, isPWA]);

  // Install the PWA
  const handleInstall = async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setShowPrompt(false);
    }
  };

  // Dismiss the prompt
  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('pwaPromptDismissed', 'true');
    // Reset after 7 days
    setTimeout(() => {
      localStorage.removeItem('pwaPromptDismissed');
    }, 7 * 24 * 60 * 60 * 1000);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50">
      <Card className="p-4 bg-primary/10 backdrop-blur border-primary/20">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold mb-1">Get the $TSK App</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Install the $TSK Platform on your device for a better experience and faster mining!
            </p>
            <Button 
              onClick={handleInstall} 
              className="w-full bg-primary hover:bg-primary/90"
              size="lg"
            >
              <Download className="mr-2 h-4 w-4" /> Install App
            </Button>
          </div>
          <button onClick={dismissPrompt} className="ml-2">
            <XCircle className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>
      </Card>
    </div>
  );
}
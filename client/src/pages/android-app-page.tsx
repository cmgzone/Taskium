import { ArrowDown, Download, Smartphone, Check, ChevronRight, Sparkles, Globe, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

export default function AndroidAppPage() {
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [isPwaMode, setIsPwaMode] = useState<boolean>(false);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);

  // Check if user is already using the PWA in standalone mode
  useEffect(() => {
    // Check if app is in standalone mode (PWA installed)
    const standalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
    
    setIsStandalone(standalone);
    
    // Detect if this is a mobile browser that supports PWA
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );
    
    const isPwaSupported = 'serviceWorker' in navigator;
    
    setIsPwaMode(isMobile && isPwaSupported);
    
    // Handle display mode change
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  const handleDownload = () => {
    setDownloading(true);
    
    // Simulating download delay
    setTimeout(() => {
      window.location.href = "/api/download/android-app";
      
      // Show toast after starting download
      toast({
        title: "Download started",
        description: "Your TSK Platform Android app download has started.",
        duration: 5000,
      });
      
      setDownloading(false);
    }, 1000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {isStandalone && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
          <div className="flex items-start gap-3">
            <div className="bg-green-100 dark:bg-green-800/30 p-2 rounded-full flex-shrink-0 mt-1">
              <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-green-800 dark:text-green-300">You're using the installed app!</h3>
              <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                You've successfully installed the TSK Platform as a Progressive Web App. Enjoy the enhanced experience with better performance and offline capabilities.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
          TSK Platform Android App
        </h1>
        <p className="mt-4 text-xl text-muted-foreground max-w-3xl mx-auto">
          Access your TSK account, mine tokens, manage your wallet, and participate in the marketplace directly from your Android device.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mb-16">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Smartphone className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Native Android Experience</h3>
            </div>
            <p className="text-muted-foreground pl-10">
              Optimized for Android with native features and a responsive interface designed specifically for mobile use.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Enhanced Mining</h3>
            </div>
            <p className="text-muted-foreground pl-10">
              Mine TSK tokens even when offline with background processes that synchronize when connectivity is restored.
            </p>
          </div>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Check className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Security Features</h3>
            </div>
            <p className="text-muted-foreground pl-10">
              Enhanced security with biometric authentication and secure local storage for your wallet credentials.
            </p>
          </div>
          
          <div className="mt-8">
            <Button 
              size="lg" 
              className="gap-2 text-lg h-14 px-8"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading ? (
                <>
                  <ArrowDown className="w-5 h-5 animate-bounce" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download Android App
                </>
              )}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              APK file size: 4.8 MB
            </p>
          </div>
        </div>
        
        <div className="flex justify-center">
          <div className="relative w-full max-w-sm">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-purple-500/20 rounded-3xl blur-xl"></div>
            <div className="bg-card border border-border rounded-3xl p-6 relative">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <span className="font-semibold">TSK Platform</span>
                </div>
                <span className="text-xs text-muted-foreground">v1.0.0</span>
              </div>
              
              <div className="space-y-4">
                <div className="h-32 bg-background/50 rounded-lg flex flex-col items-center justify-center">
                  <Download className="w-10 h-10 text-primary mb-2" />
                  <span className="text-sm font-medium">TSK Platform.apk</span>
                </div>
                
                <div className="space-y-2">
                  <div className="bg-background/50 h-3 rounded-full w-full"></div>
                  <div className="bg-background/50 h-3 rounded-full w-3/4"></div>
                  <div className="bg-background/50 h-3 rounded-full w-1/2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="space-y-6 mb-16">
        <h2 className="text-2xl font-bold">Installation Instructions</h2>
        
        <Tabs defaultValue={isPwaMode ? "pwa" : "native"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="native" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Native App
            </TabsTrigger>
            <TabsTrigger value="pwa" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              Web App (PWA)
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="native" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Download the APK</CardTitle>
                <CardDescription>
                  Click the download button above to get the latest version of the TSK Platform app.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Enable installation from unknown sources</CardTitle>
                <CardDescription>
                  Go to Settings, then Security, then Unknown Sources and enable installation from unknown sources.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Install the app</CardTitle>
                <CardDescription>
                  Open the downloaded APK file and follow the installation prompts.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Launch and login</CardTitle>
                <CardDescription>
                  Open the app and login with your existing TSK Platform credentials.
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
          
          <TabsContent value="pwa" className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full flex-shrink-0 mt-1">
                  <Bookmark className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">What is a PWA?</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Progressive Web Apps (PWAs) allow you to install the TSK Platform directly from your browser.
                    They provide an app-like experience with offline capabilities, notifications, and faster loading times.
                  </p>
                </div>
              </div>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Step 1: Visit the TSK Platform website</CardTitle>
                <CardDescription>
                  Using Chrome, Safari, or Edge, visit the TSK Platform website at the URL: tskplatform.com
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Step 2: Open the browser menu</CardTitle>
                <CardDescription>
                  On Chrome: Tap the three dots menu in the top-right corner.
                  On Safari: Tap the share icon at the bottom of the screen.
                  On Edge: Tap the three dots menu in the bottom-center of the screen.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Choose "Add to Home Screen" or "Install App"</CardTitle>
                <CardDescription>
                  Look for the "Add to Home Screen" option (Safari) or "Install App" (Chrome/Edge).
                  If you don't see this option, it means your browser doesn't support PWA installation.
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Step 4: Launch from your home screen</CardTitle>
                <CardDescription>
                  After installation, you'll find the TSK Platform icon on your home screen. 
                  Open it just like any other app, and it will work even when offline!
                </CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Is the Android app official?</h3>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Yes, this is the official TSK Platform Android app developed by our team.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Why isn't the app on Google Play?</h3>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              We're in the process of getting listed on Google Play. For now, you can download directly from our website.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Is my data safe?</h3>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              We use industry-standard encryption to protect your data. Your private keys never leave your device.
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Can I mine while my phone is locked?</h3>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              Yes, the app supports background mining even when your phone is locked or the app is minimized.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">What's the difference between the PWA and native app?</h3>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">
              The PWA works directly from your browser with no download required and automatic updates. The native app offers deeper system integration, potentially better performance, and more advanced features for power users.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
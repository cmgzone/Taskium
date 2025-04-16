import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

// Branding settings interface
interface BrandingSettings {
  siteName: string;
  siteTagline: string | null;
  faviconUrl: string | null;
  logoUrl: string;
  logoType: 'default' | 'custom';
  primaryColor: string;
  secondaryColor: string | null;
  loginBackgroundImage: string | null;
  enableCustomBranding: boolean;
  logoText?: string;
  accentColor?: string;
  useLogoText?: boolean;
  mobileLogoUrl?: string;
}

export default function LoginTest() {
  const [logoSrc, setLogoSrc] = useState<string | null>(null);
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  // Add log message function
  const addLog = (message: string) => {
    setLogMessages(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };
  
  // Fetch branding settings
  const { data: brandingSettings, error: brandingError, isLoading, refetch } = useQuery<BrandingSettings>({
    queryKey: ['/api/direct-branding-settings', loadAttempt],
    refetchOnWindowFocus: false,
    retry: 3,
    staleTime: 0,
    onSuccess: (data) => {
      addLog(`Successfully fetched branding settings. Logo URL: ${data.logoUrl}`);
      setLogoSrc(data.logoUrl);
    },
    onError: (error) => {
      addLog(`Error fetching branding settings: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  });
  
  // Handle image loading events
  const handleImageLoaded = () => {
    addLog("✅ Logo image loaded successfully");
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    addLog(`❌ Error loading logo from ${e.currentTarget.src}`);
    // Fallback to default
    e.currentTarget.src = "/taskium-logo.svg";
  };
  
  // Manually test logo direct access
  const testLogoAccess = async () => {
    if (!brandingSettings?.logoUrl) {
      addLog("No logo URL to test");
      return;
    }
    
    try {
      addLog(`Testing direct access to: ${brandingSettings.logoUrl}`);
      const response = await fetch(brandingSettings.logoUrl, { method: 'HEAD' });
      if (response.ok) {
        addLog(`✅ Direct logo access successful (Status: ${response.status})`);
      } else {
        addLog(`❌ Direct logo access failed (Status: ${response.status})`);
      }
    } catch (error) {
      addLog(`❌ Network error testing logo: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };
  
  // Reload settings
  const reloadSettings = () => {
    addLog("Manual reload requested");
    setLoadAttempt(prev => prev + 1);
    refetch();
  };
  
  // Scan DOM for logo
  const scanForLogo = () => {
    const logos = document.querySelectorAll('img');
    addLog(`Found ${logos.length} image elements on page`);
    
    logos.forEach((img, index) => {
      addLog(`Image #${index + 1}: src="${img.src}", loading=${img.complete ? 'complete' : 'incomplete'}, error=${!img.complete || img.naturalHeight === 0}`);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-start p-8 text-white">
      <h1 className="text-3xl font-bold mb-8">Logo Display Test</h1>
      
      <div className="w-full max-w-3xl bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
          Logo Preview ({isLoading ? "Loading..." : "Loaded"})
        </h2>
        
        {/* Logo display area */}
        <div className="flex items-center justify-center bg-gradient-to-br from-primary/90 to-primary/70 h-40 rounded-lg mb-4">
          {isLoading ? (
            <div className="animate-pulse h-16 w-40 bg-white/20 rounded"></div>
          ) : brandingError ? (
            <div className="bg-red-900/50 p-4 rounded text-center">
              Error loading logo: {brandingError instanceof Error ? brandingError.message : 'Unknown error'}
            </div>
          ) : (
            <img
              src={logoSrc || "/taskium-logo.svg"}
              alt="Platform Logo"
              className="h-16 object-contain"
              onLoad={handleImageLoaded}
              onError={handleImageError}
            />
          )}
        </div>
        
        {/* Logo info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-700/50 p-3 rounded">
            <h3 className="font-medium mb-1 text-gray-300">Logo URL</h3>
            <p className="font-mono text-sm break-all">
              {brandingSettings?.logoUrl || "Not available"}
            </p>
          </div>
          
          <div className="bg-gray-700/50 p-3 rounded">
            <h3 className="font-medium mb-1 text-gray-300">Logo Type</h3>
            <p>{brandingSettings?.logoType || "Not available"}</p>
          </div>
        </div>
        
        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={reloadSettings}
            className="bg-primary hover:bg-primary/80 text-white px-4 py-2 rounded"
          >
            Reload Settings
          </button>
          
          <button 
            onClick={testLogoAccess}
            className="bg-cyan-700 hover:bg-cyan-600 text-white px-4 py-2 rounded"
          >
            Test Logo Access
          </button>
          
          <button 
            onClick={scanForLogo}
            className="bg-amber-700 hover:bg-amber-600 text-white px-4 py-2 rounded"
          >
            Scan Page for Images
          </button>
        </div>
      </div>
      
      {/* Logs */}
      <div className="w-full max-w-3xl bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 border-b border-gray-700 pb-2">
          Debug Logs
        </h2>
        
        <div className="bg-black/30 p-4 rounded h-80 overflow-y-auto font-mono text-sm">
          {logMessages.length === 0 ? (
            <p className="text-gray-500">No logs yet...</p>
          ) : (
            logMessages.map((log, i) => (
              <div key={i} className="pb-1 border-b border-gray-800 mb-1">
                {log}
              </div>
            ))
          )}
        </div>
        
        <button 
          onClick={() => setLogMessages([])}
          className="mt-3 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
        >
          Clear Logs
        </button>
      </div>
    </div>
  );
}
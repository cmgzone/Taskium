import React, { useState, useEffect } from 'react';
import { useWeb3 } from '../../lib/web3-provider';
import { Button } from '@/components/ui/button';
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";

/**
 * Component that displays diagnostic information about wallet connections
 * and provides troubleshooting tips.
 */
export function WalletDiagnostic() {
  const { 
    connected, 
    address, 
    network, 
    chainId, 
    isCorrectNetwork,
    walletType
  } = useWeb3();

  const [diagnosticInfo, setDiagnosticInfo] = useState({
    browserInfo: '',
  });

  useEffect(() => {
    // Get browser info
    const userAgent = navigator.userAgent;
    const browserInfo = {
      browser: 'Unknown',
      version: 'Unknown',
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      device: /Android/i.test(userAgent) ? 'Android' : 
              /iPhone|iPad|iPod/i.test(userAgent) ? 'iOS' : 'Desktop'
    };

    if (userAgent.includes('Chrome')) {
      browserInfo.browser = 'Chrome';
    } else if (userAgent.includes('Firefox')) {
      browserInfo.browser = 'Firefox';
    } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
      browserInfo.browser = 'Safari';
    } else if (userAgent.includes('Edge')) {
      browserInfo.browser = 'Edge';
    }

    // Check for browser environment
    setDiagnosticInfo({
      browserInfo: `${browserInfo.browser} on ${browserInfo.device}`,
    });
  }, []);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="bg-slate-50 dark:bg-slate-800">
        <CardTitle>Wallet Connection Diagnostic</CardTitle>
        <CardDescription>
          Troubleshooting information for wallet connections
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-medium mb-2">Connection Status</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Wallet Connected:</div>
              <div className={connected ? "text-green-600" : "text-red-600"}>
                {connected ? "Yes" : "No"}
              </div>
              
              {connected && (
                <>
                  <div className="font-medium">Wallet Type:</div>
                  <div>{walletType}</div>
                  
                  <div className="font-medium">Address:</div>
                  <div className="truncate">{address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "None"}</div>
                  
                  <div className="font-medium">Network:</div>
                  <div className={isCorrectNetwork ? "text-green-600" : "text-amber-600"}>
                    {network} {isCorrectNetwork ? "✓" : "⚠️"}
                  </div>
                  
                  <div className="font-medium">Chain ID:</div>
                  <div>{chainId || "Unknown"}</div>
                </>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Browser Environment</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="font-medium">Browser:</div>
              <div>{diagnosticInfo.browserInfo}</div>
            </div>
          </div>

          {!connected && (
            <div className="mt-4">
              <p className="text-sm text-slate-600">
                To connect your wallet, enter a valid BNB Smart Chain wallet address in the format 0x... followed by 40 hex characters.
              </p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="flex justify-between border-t p-4 bg-slate-50 dark:bg-slate-800">
        <Button 
          variant="outline" 
          onClick={() => window.location.reload()}
        >
          Refresh Page
        </Button>
        <Button 
          variant="secondary"
          onClick={() => {
            // Clear browser localStorage and sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            
            // Then reload the page
            window.location.reload();
          }}
        >
          Clear Cache & Reload
        </Button>
      </CardFooter>
    </Card>
  );
}
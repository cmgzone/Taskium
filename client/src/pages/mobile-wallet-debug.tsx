import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  connectMetaMask, 
  connectWalletConnect, 
  disconnectWalletConnect,
  checkPendingMobileConnection,
  isMobile
} from '@/lib/mobile-wallet-connect';

// Type definitions for wallet connection results
interface WalletConnectResult {
  success: boolean;
  error: string | null;
  address?: string;
  provider?: any;
  signer?: any;
  chainId?: string;
  wcProvider?: any;
}

interface MetaMaskResult extends WalletConnectResult {
  redirecting?: boolean;
}

// Simple mobile-friendly wallet debug page
export default function MobileWalletDebug() {
  const [logs, setLogs] = useState<string[]>([]);
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [envInfo, setEnvInfo] = useState({
    hasBuffer: false,
    hasEthereum: false,
    isMobile: false
  });
  const [wcProvider, setWcProvider] = useState<any>(null);

  const addLog = (message: string) => {
    console.log(message); // Also log to console for debugging
    setLogs(prev => [...prev, message]);
  };

  useEffect(() => {
    // Basic environment check
    const buffer = typeof window.Buffer !== 'undefined';
    const ethereum = typeof (window as any).ethereum !== 'undefined';
    const mobile = isMobile();
    
    setEnvInfo({
      hasBuffer: buffer,
      hasEthereum: ethereum,
      isMobile: mobile
    });
    
    addLog('Mobile wallet debug page loaded');
    addLog(`Mobile device: ${mobile ? 'Yes' : 'No'}`);
    addLog(`Buffer available: ${buffer ? 'Yes' : 'No'}`);
    addLog(`Ethereum available: ${ethereum ? 'Yes' : 'No'}`);
    
    // Check for pending connections from mobile wallet redirects
    const hasPendingConnection = checkPendingMobileConnection();
    if (hasPendingConnection) {
      addLog('Detected pending connection from mobile wallet');
      // Attempt connection after a short delay
      setTimeout(() => {
        handleMetaMaskConnect();
      }, 1000);
    }
  }, []);

  // Handle MetaMask connection with optimized library
  const handleMetaMaskConnect = async () => {
    setError(null);
    setLoading(true);
    
    try {
      addLog('Attempting MetaMask connection...');
      
      const result = await connectMetaMask();
      
      if (result.redirecting) {
        addLog('Redirecting to MetaMask mobile app...');
        return; // The connection will be redirected to the MetaMask app
      }
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown connection error');
      }
      
      addLog(`Connected to address: ${result.address}`);
      addLog(`Chain ID: ${result.chainId}`);
      
      setAddress(result.address);
      setConnected(true);
      
      // Set up event listener for account changes
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            handleDisconnect();
          } else {
            setAddress(accounts[0]);
            addLog(`Account changed to: ${accounts[0]}`);
          }
        });
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`MetaMask Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle WalletConnect with optimized library
  const handleWalletConnectConnect = async () => {
    setError(null);
    setLoading(true);
    
    try {
      addLog('Initializing WalletConnect...');
      
      const result = await connectWalletConnect();
      
      if (!result.success) {
        throw new Error(result.error || 'Unknown connection error');
      }
      
      // Store provider for later use
      if (result.wcProvider) {
        setWcProvider(result.wcProvider);
        
        // Set up WalletConnect event listeners
        result.wcProvider.on('accountsChanged', (accounts: string[]) => {
          if (accounts.length === 0) {
            handleDisconnect();
          } else {
            setAddress(accounts[0]);
            addLog(`Account changed to: ${accounts[0]}`);
          }
        });
        
        result.wcProvider.on('disconnect', () => {
          addLog('WalletConnect disconnected');
          handleDisconnect();
        });
      }
      
      // Update state with address
      if (result.address) {
        setAddress(result.address);
        addLog(`Connected to address: ${result.address}`);
      }
      
      // Set connected status
      setConnected(true);
      
      // Log chain ID if available
      if (result.chainId) {
        addLog(`Chain ID: ${result.chainId}`);
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`WalletConnect Error: ${errorMessage}`);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    // Disconnect WalletConnect if active
    if (wcProvider) {
      await disconnectWalletConnect(wcProvider);
      setWcProvider(null);
    }
    
    setConnected(false);
    setAddress(null);
    addLog('Disconnected from wallet');
  };

  return (
    <div className="container py-4 px-2">
      <h1 className="text-xl font-bold mb-4">Mobile Wallet Debug</h1>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>Connection Status</CardTitle>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="flex flex-col space-y-4">
            <div>
              <div className="text-sm mb-1 font-medium">Environment:</div>
              <div className="text-xs flex justify-between">
                <span>Buffer Available:</span>
                <span className={envInfo.hasBuffer ? 'text-green-600' : 'text-red-600'}>
                  {envInfo.hasBuffer ? 'Yes' : 'No'}
                </span>
              </div>
              <div className="text-xs flex justify-between">
                <span>Ethereum Object:</span>
                <span className={envInfo.hasEthereum ? 'text-green-600' : 'text-red-600'}>
                  {envInfo.hasEthereum ? 'Yes' : 'No'}
                </span>
              </div>
            </div>
            
            <div>
              <div className="text-sm mb-1 font-medium">Status:</div>
              <div className="text-xs flex justify-between">
                <span>Connected:</span>
                <span className={connected ? 'text-green-600' : 'text-amber-600'}>
                  {connected ? 'Yes' : 'No'}
                </span>
              </div>
              {address && (
                <div className="text-xs flex justify-between">
                  <span>Address:</span>
                  <span className="font-mono">{address.slice(0,6)}...{address.slice(-4)}</span>
                </div>
              )}
            </div>
            
            <div className="pt-2">
              <Button
                onClick={handleMetaMaskConnect}
                disabled={connected || loading}
                className="w-full mb-2"
              >
                {loading ? 'Connecting...' : 'Connect MetaMask'}
              </Button>
              
              <Button
                onClick={handleWalletConnectConnect}
                disabled={connected || loading}
                variant="outline"
                className="w-full mb-2"
              >
                {loading ? 'Connecting...' : 'Connect WalletConnect'}
              </Button>
              
              {connected && (
                <Button
                  onClick={handleDisconnect}
                  variant="destructive"
                  className="w-full"
                >
                  Disconnect
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Connection Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-slate-950 text-slate-50 p-2 rounded-md text-xs h-[200px] overflow-y-auto">
            {logs.map((log, i) => (
              <div key={i} className="pb-1">
                {log}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
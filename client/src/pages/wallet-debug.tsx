import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Buffer } from 'buffer';
import { ethers } from 'ethers';

// Define Ethereum window extension type
declare global {
  interface Window {
    ethereum?: {
      request: (args: {method: string, params?: any[]}) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
      chainId?: string;
    }
  }
}

export default function WalletDebugPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [envInfo, setEnvInfo] = useState({
    hasBuffer: false,
    hasProcess: false,
    hasGlobal: false,
    hasEthereum: false,
    isMetaMask: false,
    userAgent: ''
  });
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    // Get environment info
    const buffer = typeof window.Buffer !== 'undefined';
    const process = typeof (window as any).process !== 'undefined';
    const global = typeof (window as any).global !== 'undefined';
    const ethereum = typeof window.ethereum !== 'undefined';
    const isMetaMask = !!window.ethereum?.isMetaMask;
    const userAgent = navigator.userAgent;

    setEnvInfo({
      hasBuffer: buffer,
      hasProcess: process,
      hasGlobal: global,
      hasEthereum: ethereum,
      isMetaMask: isMetaMask,
      userAgent: userAgent
    });

    addLog('Page loaded, environment checked');
    addLog(`Buffer available: ${buffer}`);
    addLog(`Process available: ${process}`);
    addLog(`Global available: ${global}`);
    addLog(`Ethereum available: ${ethereum}`);
    addLog(`MetaMask detected: ${isMetaMask}`);
    addLog(`User agent: ${userAgent}`);
  }, []);

  // Direct MetaMask Connection (Bypass Web3Provider)
  const connectMetaMaskDirect = async () => {
    setError(null);
    
    try {
      addLog('Attempting direct MetaMask connection...');
      
      if (!window.ethereum) {
        throw new Error('No Ethereum provider detected. Please install MetaMask.');
      }
      
      addLog('Requesting accounts...');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from MetaMask');
      }
      
      addLog(`Accounts received: ${accounts.join(', ')}`);
      setAddress(accounts[0]);
      
      // Get chain ID
      addLog('Getting chain ID...');
      const chainId = await window.ethereum.request({ method: 'eth_chainId' });
      addLog(`Chain ID: ${chainId}`);
      setChainId(chainId);
      
      // Try creating ethers provider and signer
      addLog('Creating ethers provider...');
      const provider = new ethers.BrowserProvider(window.ethereum);
      
      addLog('Getting signer...');
      const signer = await provider.getSigner();
      
      addLog('Getting address from signer...');
      const signerAddress = await signer.getAddress();
      addLog(`Signer address: ${signerAddress}`);
      
      setConnected(true);
      addLog('Direct MetaMask connection successful!');
      
      // Set up event listeners
      window.ethereum.on('accountsChanged', (newAccounts: string[]) => {
        addLog(`Accounts changed: ${newAccounts.join(', ')}`);
        if (newAccounts.length === 0) {
          setConnected(false);
          setAddress(null);
          addLog('Disconnected due to account change');
        } else {
          setAddress(newAccounts[0]);
        }
      });
      
      window.ethereum.on('chainChanged', (newChainId: string) => {
        addLog(`Chain changed: ${newChainId}`);
        setChainId(newChainId);
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`Error: ${errorMessage}`);
      setError(errorMessage);
      console.error('Direct MetaMask connection error:', err);
    }
  };

  // Direct WalletConnect Connection (simulating a minimal version)
  const connectWalletConnectDirect = async () => {
    setError(null);
    
    try {
      addLog('Attempting direct WalletConnect initialization...');
      
      // Import WalletConnect dynamically to avoid SSR issues
      addLog('Dynamically importing WalletConnect...');
      const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
      
      addLog('Initializing WalletConnect provider...');
      const wcProvider = await EthereumProvider.init({
        projectId: '11d13ebd56cd87463b3b41b4b378e1bb', // Project ID
        chains: [56, 97], // BSC Mainnet and Testnet
        showQrModal: true,
        metadata: {
          name: 'TSK Platform Debug',
          description: 'TSK Wallet Connection Debugger',
          url: window.location.origin,
          icons: [`${window.location.origin}/tsk-logo.svg`]
        }
      });
      
      addLog('Enabling WalletConnect provider...');
      const accounts = await wcProvider.enable();
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts returned from WalletConnect');
      }
      
      addLog(`WalletConnect accounts: ${accounts.join(', ')}`);
      setAddress(accounts[0]);
      
      // Get chain ID
      const chainId = await wcProvider.request({ method: 'eth_chainId' });
      addLog(`WalletConnect chain ID: ${chainId}`);
      setChainId(chainId as string);
      
      // Create ethers provider
      addLog('Creating ethers provider from WalletConnect...');
      const provider = new ethers.BrowserProvider(wcProvider);
      
      addLog('Getting signer...');
      const signer = await provider.getSigner();
      
      addLog('Getting address from signer...');
      const signerAddress = await signer.getAddress();
      addLog(`Signer address: ${signerAddress}`);
      
      setConnected(true);
      addLog('Direct WalletConnect connection successful!');
      
      // Set up WalletConnect event listeners
      wcProvider.on('accountsChanged', (accounts: string[]) => {
        addLog(`WalletConnect accounts changed: ${accounts.join(', ')}`);
        if (accounts.length === 0) {
          setConnected(false);
          setAddress(null);
        } else {
          setAddress(accounts[0]);
        }
      });
      
      wcProvider.on('chainChanged', (chainId: string) => {
        addLog(`WalletConnect chain changed: ${chainId}`);
        setChainId(chainId as string);
      });
      
      wcProvider.on('disconnect', () => {
        addLog('WalletConnect disconnected');
        setConnected(false);
        setAddress(null);
        setChainId(null);
      });
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      addLog(`WalletConnect Error: ${errorMessage}`);
      setError(errorMessage);
      console.error('Direct WalletConnect error:', err);
    }
  };

  const disconnectWallet = async () => {
    setConnected(false);
    setAddress(null);
    setChainId(null);
    addLog('Manually disconnected');
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="container max-w-5xl mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Wallet Connection Debugger</h1>
        <p className="text-muted-foreground">Directly test wallet connections without the main application logic</p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Connection Status</CardTitle>
              <CardDescription>
                Direct connection testing for debugging purposes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertTitle>Connection Error</AlertTitle>
                  <AlertDescription>
                    {error}
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Environment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Buffer Available:</span>
                        <span className={envInfo.hasBuffer ? 'text-green-600' : 'text-red-600'}>
                          {envInfo.hasBuffer ? 'Yes ✓' : 'No ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Process Available:</span>
                        <span className={envInfo.hasProcess ? 'text-green-600' : 'text-red-600'}>
                          {envInfo.hasProcess ? 'Yes ✓' : 'No ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Global Available:</span>
                        <span className={envInfo.hasGlobal ? 'text-green-600' : 'text-red-600'}>
                          {envInfo.hasGlobal ? 'Yes ✓' : 'No ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ethereum Object:</span>
                        <span className={envInfo.hasEthereum ? 'text-green-600' : 'text-red-600'}>
                          {envInfo.hasEthereum ? 'Yes ✓' : 'No ✗'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>MetaMask Detected:</span>
                        <span className={envInfo.isMetaMask ? 'text-green-600' : 'text-amber-600'}>
                          {envInfo.isMetaMask ? 'Yes ✓' : 'No'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm">Connection Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Connected:</span>
                        <span className={connected ? 'text-green-600' : 'text-amber-600'}>
                          {connected ? 'Yes ✓' : 'No'}
                        </span>
                      </div>
                      {address && (
                        <div className="flex justify-between">
                          <span>Address:</span>
                          <span className="font-mono">{address.slice(0,6)}...{address.slice(-4)}</span>
                        </div>
                      )}
                      {chainId && (
                        <div className="flex justify-between">
                          <span>Chain ID:</span>
                          <span>{chainId}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex flex-col space-y-2">
                <Button
                  onClick={connectMetaMaskDirect}
                  disabled={connected}
                  className="w-full"
                >
                  Connect MetaMask Directly
                </Button>
                
                <Button
                  onClick={connectWalletConnectDirect}
                  disabled={connected}
                  variant="outline"
                  className="w-full"
                >
                  Connect WalletConnect Directly
                </Button>
                
                {connected && (
                  <Button
                    onClick={disconnectWallet}
                    variant="destructive"
                    className="w-full"
                  >
                    Disconnect
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card className="h-full flex flex-col">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Debug Logs</CardTitle>
                <Button variant="ghost" size="sm" onClick={clearLogs}>Clear</Button>
              </div>
            </CardHeader>
            <CardContent className="flex-grow overflow-auto">
              <div className="h-[500px] overflow-y-auto bg-slate-950 text-slate-50 p-4 rounded-md text-xs font-mono">
                {logs.length > 0 ? (
                  logs.map((log, i) => (
                    <div key={i} className="pb-1">
                      {log}
                    </div>
                  ))
                ) : (
                  <div className="text-slate-400">No logs yet. Try connecting a wallet.</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
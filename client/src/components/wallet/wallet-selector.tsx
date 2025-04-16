import React, { useState } from 'react';
import { useWeb3 } from '../../lib/web3-provider';
import { Button } from '@/components/ui/button';
import { WalletDiagnostic } from './wallet-diagnostic';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { isValidAddress } from '@/lib/contract-utils';
import { useToast } from '@/hooks/use-toast';
import { Check, X } from 'lucide-react';

interface WalletSelectorProps {
  onWalletConnected?: () => Promise<void>;
  size?: string;
  variant?: string;
  className?: string;
}

export function WalletSelector({
  onWalletConnected,
  size,
  variant,
  className
}: WalletSelectorProps = {}) {
  const { connected, address, disconnect, connect, walletType } = useWeb3();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showDiagnostic, setShowDiagnostic] = useState(false);
  const [customWalletAddress, setCustomWalletAddress] = useState('');
  const [customAddressValid, setCustomAddressValid] = useState<boolean | null>(null);
  const { toast } = useToast();
  
  const handleConnectCustom = async () => {
    try {
      setIsConnecting(true);
      
      if (!isValidAddress(customWalletAddress)) {
        toast({
          title: 'Invalid wallet address',
          description: 'Please enter a valid BNB Smart Chain wallet address (0x...)',
          variant: 'destructive'
        });
        return;
      }
      
      console.log(`Attempting to connect with custom address: ${customWalletAddress}...`);
      
      const success = await connect(customWalletAddress);
      
      if (success) {
        // Call the onWalletConnected callback if provided
        if (onWalletConnected) {
          await onWalletConnected();
        }
      }
    } catch (error) {
      console.error(`Error connecting with custom address:`, error);
      toast({
        title: 'Connection error',
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  const handleDisconnect = async () => {
    try {
      await disconnect();
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };
  
  if (connected) {
    return (
      <div className="flex items-center space-x-2">
        <Card className="border border-slate-200">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium flex items-center">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                  Custom Wallet
                </div>
                <div className="text-xs text-slate-500">
                  {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Unknown Address'}
                </div>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleDisconnect}
                className="ml-4 h-8 px-2 text-xs"
              >
                Disconnect
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Dialog>
          <DialogTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-9 px-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Wallet Diagnostics</DialogTitle>
              <DialogDescription>
                Troubleshoot your wallet connection issues
              </DialogDescription>
            </DialogHeader>
            <WalletDiagnostic />
          </DialogContent>
        </Dialog>
      </div>
    );
  }
  
  return (
    <div>
      <Tabs defaultValue="connect">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="connect">Connect Wallet</TabsTrigger>
          <TabsTrigger value="diagnostic">Diagnostic</TabsTrigger>
        </TabsList>
        
        <TabsContent value="connect">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Connect Your Wallet</CardTitle>
              <CardDescription>
                Enter your BNB Smart Chain wallet address to connect
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Custom Wallet Address</div>
                <div className="relative">
                  <Input
                    placeholder="Enter BNB Smart Chain wallet address (0x...)"
                    value={customWalletAddress}
                    onChange={(e) => {
                      const value = e.target.value;
                      setCustomWalletAddress(value);
                      // Only validate if there's some input
                      setCustomAddressValid(value.length > 0 ? isValidAddress(value) : null);
                    }}
                    className={customAddressValid === false ? "border-red-500 pr-10" : ""}
                  />
                  {customAddressValid !== null && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {customAddressValid ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <X className="w-4 h-4 text-red-500" />
                      )}
                    </div>
                  )}
                </div>
                {customAddressValid === false && (
                  <p className="text-xs text-red-500">
                    Invalid wallet address format. Must be a valid BNB Smart Chain address.
                  </p>
                )}
                <Button
                  className="w-full mt-4"
                  disabled={isConnecting || !customAddressValid}
                  onClick={handleConnectCustom}
                >
                  {isConnecting ? 'Connecting...' : 'Connect Wallet'}
                </Button>
              </div>
            </CardContent>
            <CardFooter className="border-t pt-3 flex justify-between">
              <div className="text-xs text-slate-500">
                {isConnecting ? 'Connecting...' : 'Connect to continue'}
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
        
        <TabsContent value="diagnostic">
          <WalletDiagnostic />
        </TabsContent>
      </Tabs>
    </div>
  );
}
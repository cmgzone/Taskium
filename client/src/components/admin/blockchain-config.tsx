import React from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Shield, AlertTriangle, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

export default function BlockchainConfig() {
  const { toast } = useToast();
  
  // Query for blockchain status
  const { 
    data: blockchainStatus,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/blockchain-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/blockchain-status');
      if (!response.ok) {
        throw new Error('Failed to fetch blockchain status');
      }
      return await response.json();
    }
  });
  
  // Handle refresh
  const handleRefresh = () => {
    refetch();
    toast({
      title: "Refreshing configuration",
      description: "Checking blockchain configuration status..."
    });
  };
  
  // Helper function to render status indicators
  const StatusIndicator = ({ isOk, text }: { isOk: boolean, text: string }) => (
    <div className={`flex items-center ${isOk ? 'text-green-500' : 'text-red-500'}`}>
      {isOk ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
      <span>{text}</span>
    </div>
  );
  
  // Verify if addresses match
  const addressesMatch = blockchainStatus && 
    blockchainStatus.mainnetContractAddress && 
    blockchainStatus.databaseMainnetAddress && 
    blockchainStatus.mainnetContractAddress.toLowerCase() === blockchainStatus.databaseMainnetAddress.toLowerCase();
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Blockchain Configuration Status</CardTitle>
          <CardDescription>
            Verify blockchain integration and configuration
          </CardDescription>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="ml-auto"
          onClick={handleRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="sr-only">Refresh</span>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : isError ? (
          <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md flex items-center text-red-600 dark:text-red-400">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {(error instanceof Error) ? error.message : "Failed to load blockchain configuration"}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Status */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="font-medium mb-3 flex items-center">
                <Shield className="w-4 h-4 mr-2 text-primary" />
                Overall Configuration Status
              </h3>
              
              <div className="space-y-2">
                {/* System Wallet Address */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">System Wallet Configured</span>
                  <StatusIndicator 
                    isOk={!!blockchainStatus?.systemWalletAddress} 
                    text={blockchainStatus?.systemWalletAddress ? "Configured" : "Missing"} 
                  />
                </div>
                
                {/* Mainnet Contract Address */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Mainnet Contract Address</span>
                  <StatusIndicator 
                    isOk={!!blockchainStatus?.mainnetContractAddress} 
                    text={blockchainStatus?.mainnetContractAddress ? "Configured" : "Missing"} 
                  />
                </div>
                
                {/* Testnet Contract Address */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Testnet Contract Address</span>
                  <StatusIndicator 
                    isOk={!!blockchainStatus?.testnetContractAddress} 
                    text={blockchainStatus?.testnetContractAddress ? "Configured" : "Missing"} 
                  />
                </div>
                
                {/* Database Configuration */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Database Contract Address</span>
                  <StatusIndicator 
                    isOk={!!blockchainStatus?.databaseMainnetAddress} 
                    text={blockchainStatus?.databaseMainnetAddress ? "Configured" : "Missing"} 
                  />
                </div>
                
                {/* Address Match */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Address Configuration Match</span>
                  <StatusIndicator 
                    isOk={!!addressesMatch} 
                    text={addressesMatch ? "Addresses Match" : "Mismatch"} 
                  />
                </div>
                
                {/* Deployer Private Key */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Deployer Private Key</span>
                  <StatusIndicator 
                    isOk={!!blockchainStatus?.deployerPrivateKeyConfigured} 
                    text={blockchainStatus?.deployerPrivateKeyConfigured ? "Configured" : "Missing"} 
                  />
                </div>
                
                {/* Wallet Key */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Wallet Private Key</span>
                  <StatusIndicator 
                    isOk={!!blockchainStatus?.lukeWalletKeyConfigured} 
                    text={blockchainStatus?.lukeWalletKeyConfigured ? "Configured" : "Missing"} 
                  />
                </div>
                
                {/* Token Owner Address */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Token Owner Address</span>
                  <StatusIndicator 
                    isOk={!!blockchainStatus?.tokenOwnerAddressConfigured} 
                    text={blockchainStatus?.tokenOwnerAddressConfigured ? "Configured" : "Missing"} 
                  />
                </div>
                
                {/* Contract Address */}
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Contract Address</span>
                  <StatusIndicator 
                    isOk={!!blockchainStatus?.tokenContractAddressConfigured} 
                    text={blockchainStatus?.tokenContractAddressConfigured ? "Configured" : "Missing"} 
                  />
                </div>
                
                {/* Network Configuration */}
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Active Network</span>
                  <span className="font-medium capitalize">{blockchainStatus?.currentNetwork || "Not Set"}</span>
                </div>
              </div>
            </div>
            
            {/* Configuration Details */}
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="font-medium mb-3">Configuration Details</h3>
              
              <div className="space-y-4 text-sm">
                {/* System Wallet */}
                <div>
                  <div className="font-medium mb-1">System Wallet Address</div>
                  <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded block overflow-x-auto">
                    {blockchainStatus?.systemWalletAddress || "Not configured"}
                  </code>
                </div>
                
                {/* Mainnet Contract */}
                <div>
                  <div className="font-medium mb-1">Mainnet Contract Address (Environment)</div>
                  <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded block overflow-x-auto">
                    {blockchainStatus?.mainnetContractAddress || "Not configured"}
                  </code>
                </div>
                
                {/* Database Mainnet Contract */}
                <div>
                  <div className="font-medium mb-1">Mainnet Contract Address (Database)</div>
                  <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded block overflow-x-auto">
                    {blockchainStatus?.databaseMainnetAddress || "Not configured"}
                  </code>
                  
                  {/* Show a warning if addresses don't match */}
                  {blockchainStatus?.mainnetContractAddress && 
                   blockchainStatus?.databaseMainnetAddress && 
                   !addressesMatch && (
                    <div className="mt-2 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 p-2 rounded flex items-start">
                      <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                      <span>
                        The contract address in the environment configuration does not match the address in the database. 
                        This may cause issues with blockchain interactions.
                      </span>
                    </div>
                  )}
                </div>
                
                {/* Testnet Contract */}
                <div>
                  <div className="font-medium mb-1">Testnet Contract Address</div>
                  <code className="bg-gray-100 dark:bg-gray-800 p-2 rounded block overflow-x-auto">
                    {blockchainStatus?.testnetContractAddress || "Not configured"}
                  </code>
                </div>
              </div>
            </div>
            
            {/* Essential Blockchain Configuration */}
            <div className="space-y-4">
              {/* Wallet Key Configuration */}
              <div className="rounded-lg border bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800 p-4">
                <h3 className="font-medium mb-3 text-blue-700 dark:text-blue-400 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Wallet Key Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 mb-3">
                      The wallet private key controls the system wallet used for blockchain operations, including token withdrawals and contract funding.
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <StatusIndicator 
                        isOk={!!blockchainStatus?.lukeWalletKeyConfigured} 
                        text={blockchainStatus?.lukeWalletKeyConfigured ? "Configured" : "Not Configured"} 
                      />
                    </div>
                    
                    {!blockchainStatus?.lukeWalletKeyConfigured && (
                      <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-md text-sm">
                        <p className="font-medium mb-2">Setup Required:</p>
                        <ol className="list-decimal list-inside space-y-1 text-blue-800 dark:text-blue-300">
                          <li>Go to the System Secrets page</li>
                          <li>Add a new secret with key name "WALLET_PRIVATE_KEY"</li>
                          <li>Set the value to the private key of the wallet</li>
                          <li>Make sure to set the category to "blockchain"</li>
                          <li>Enable encryption for this sensitive value</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Token Owner Address Configuration */}
              <div className="rounded-lg border bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800 p-4">
                <h3 className="font-medium mb-3 text-green-700 dark:text-green-400 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Token Owner Address Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-green-700 dark:text-green-400 mb-3">
                      The Token Owner Address is the public wallet address that owns the tokens and is authorized to perform operations like transfers and withdrawals.
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <StatusIndicator 
                        isOk={!!blockchainStatus?.tokenOwnerAddressConfigured} 
                        text={blockchainStatus?.tokenOwnerAddressConfigured ? "Configured" : "Not Configured"} 
                      />
                    </div>
                    
                    {!blockchainStatus?.tokenOwnerAddressConfigured && (
                      <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-md text-sm">
                        <p className="font-medium mb-2">Setup Required:</p>
                        <ol className="list-decimal list-inside space-y-1 text-green-800 dark:text-green-300">
                          <li>Go to the System Secrets page</li>
                          <li>Add a new secret with key name "TOKEN_OWNER_ADDRESS"</li>
                          <li>Set the value to the public address of the wallet (0x...)</li>
                          <li>Make sure to set the category to "blockchain"</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Contract Address Configuration */}
              <div className="rounded-lg border bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800 p-4">
                <h3 className="font-medium mb-3 text-purple-700 dark:text-purple-400 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Contract Address Configuration
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-purple-700 dark:text-purple-400 mb-3">
                      The Contract Address is the address of the deployed token smart contract on the blockchain.
                    </p>
                    
                    <div className="flex items-center gap-2 mb-4">
                      <StatusIndicator 
                        isOk={!!blockchainStatus?.tokenContractAddressConfigured} 
                        text={blockchainStatus?.tokenContractAddressConfigured ? "Configured" : "Not Configured"} 
                      />
                    </div>
                    
                    {!blockchainStatus?.tokenContractAddressConfigured && (
                      <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-md text-sm">
                        <p className="font-medium mb-2">Setup Required:</p>
                        <ol className="list-decimal list-inside space-y-1 text-purple-800 dark:text-purple-300">
                          <li>Go to the System Secrets page</li>
                          <li>Add a new secret with key name "TOKEN_CONTRACT_ADDRESS"</li>
                          <li>Set the value to the address of the token contract (0x...)</li>
                          <li>Make sure to set the category to "blockchain"</li>
                        </ol>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            {(!blockchainStatus?.mainnetContractAddress || !blockchainStatus?.databaseMainnetAddress || !addressesMatch) && (
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    toast({
                      title: "Configuration Required",
                      description: "Please update the contract address in both the environment variables and database settings.",
                    });
                  }}
                >
                  Fix Configuration
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
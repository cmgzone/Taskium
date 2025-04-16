import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Networks } from "./contract-utils";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatAddress } from "./contract-utils";

// Network types
export type NetworkType = 'testnet' | 'mainnet';
export type WalletType = 'custom' | null;

interface Web3ContextProps {
  connected: boolean;
  address: string | null;
  connect: (walletAddress: string) => Promise<boolean>;
  disconnect: () => Promise<void>;
  network: NetworkType;
  chainId: string | null;
  switchNetwork: (networkType: NetworkType) => Promise<void>;
  isCorrectNetwork: boolean;
  walletType: WalletType;
  updateWalletAddress: (walletAddress: string) => Promise<boolean>;
}

export const Web3Context = createContext<Web3ContextProps | undefined>(undefined);

export function Web3Provider({ children }: { children: ReactNode }) {
  // Determine default network from environment variable (with fallback to testnet)
  const defaultNetwork: NetworkType = 
    (import.meta.env.VITE_CURRENT_NETWORK === 'mainnet') ? 'mainnet' : 'testnet';
  
  const [connected, setConnected] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<string | null>(null);
  const [network, setNetwork] = useState<NetworkType>(defaultNetwork);
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(true); // Always true for custom wallet
  const [walletType, setWalletType] = useState<WalletType>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  // Check if user wallet address exists and set it on mount
  useEffect(() => {
    if (user?.walletAddress) {
      setAddress(user.walletAddress);
      setConnected(true);
      setWalletType('custom');
      
      // Set chainId based on network
      const networkConfig = network === 'testnet' ? Networks.BSCTestnet : Networks.BSCMainnet;
      setChainId(networkConfig.chainId);
    }
  }, [user, network]);

  // Network switching function
  async function switchNetwork(networkType: NetworkType) {
    // Get the target network configuration
    const targetNetwork = networkType === 'testnet' 
      ? Networks.BSCTestnet 
      : Networks.BSCMainnet;
      
    // Always update the app state
    setNetwork(networkType);
    setChainId(targetNetwork.chainId);
    
    toast({
      title: "Network preference updated",
      description: `App will use ${networkType === 'testnet' ? 'BSC Testnet' : 'BSC Mainnet'} for data`,
    });
  }

  // Connect a custom wallet address
  async function connect(walletAddress: string): Promise<boolean> {
    try {
      // Validate the wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        toast({
          title: "Invalid wallet address",
          description: "Please enter a valid BNB Smart Chain wallet address (0x...)",
          variant: "destructive",
        });
        return false;
      }

      try {
        // Save the wallet address to the user's profile
        await apiRequest('POST', '/api/user/settings', { walletAddress });

        setAddress(walletAddress);
        setConnected(true);
        setWalletType('custom');
        
        // Update chainId based on network
        const networkConfig = network === 'testnet' ? Networks.BSCTestnet : Networks.BSCMainnet;
        setChainId(networkConfig.chainId);

        // Invalidate the user query to refresh user data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });

        toast({
          title: "Wallet connected",
          description: `Connected to ${formatAddress(walletAddress)}`,
        });

        return true;
      } catch (apiError) {
        console.error("API error connecting wallet:", apiError);
        toast({
          title: "Connection failed",
          description: apiError instanceof Error ? apiError.message : "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error connecting custom wallet:", error);
      toast({
        title: "Connection error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  }

  // Update an existing wallet address
  async function updateWalletAddress(walletAddress: string): Promise<boolean> {
    try {
      // Validate the wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        toast({
          title: "Invalid wallet address",
          description: "Please enter a valid BNB Smart Chain wallet address (0x...)",
          variant: "destructive",
        });
        return false;
      }

      try {
        // Save the wallet address to the user's profile
        await apiRequest('POST', '/api/user/settings', { walletAddress });
        
        setAddress(walletAddress);
        
        // Invalidate the user query to refresh user data
        queryClient.invalidateQueries({ queryKey: ['/api/user'] });

        toast({
          title: "Wallet updated",
          description: `Updated to ${formatAddress(walletAddress)}`,
        });

        return true;
      } catch (apiError) {
        console.error("API error updating wallet:", apiError);
        toast({
          title: "Update failed",
          description: apiError instanceof Error ? apiError.message : "Failed to update wallet. Please try again.",
          variant: "destructive",
        });
        return false;
      }
    } catch (error) {
      console.error("Error updating wallet address:", error);
      toast({
        title: "Update error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
      return false;
    }
  }

  // Disconnect the wallet
  async function disconnect(): Promise<void> {
    try {
      // Only clear the connection state locally
      // We don't remove the wallet address from the user profile
      setAddress(null);
      setConnected(false);
      setWalletType(null);

      toast({
        title: "Wallet disconnected",
        description: "Your wallet has been disconnected from the app interface.",
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast({
        title: "Disconnect error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }

  return (
    <Web3Context.Provider
      value={{
        connected,
        address,
        connect,
        disconnect,
        network,
        chainId,
        switchNetwork,
        isCorrectNetwork,
        walletType,
        updateWalletAddress,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}

export function useWeb3() {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error("useWeb3 must be used within a Web3Provider");
  }
  return context;
}
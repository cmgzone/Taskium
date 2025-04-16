import { EthereumProvider } from '@walletconnect/ethereum-provider';

// Chain IDs
export const getBscMainnetChainId = () => 56;
export const getBscTestnetChainId = () => 97;

// Default chains to offer in the wallet connection
export const DEFAULT_MAIN_CHAINS = [getBscMainnetChainId(), getBscTestnetChainId()]; // BSC Mainnet and Testnet

// Initialize WalletConnect Provider
export const initWalletConnect = async () => {
  try {
    console.log("Initializing WalletConnect...");
    
    // For debugging - extensive environment check
    const environmentCheck = {
      Buffer: {
        exists: typeof window.Buffer !== 'undefined',
        isBuffer: typeof window.Buffer?.isBuffer === 'function',
        from: typeof window.Buffer?.from === 'function',
        alloc: typeof window.Buffer?.alloc === 'function'
      },
      global: {
        exists: typeof (window as any).global !== 'undefined',
        hasBuffer: typeof (window as any).global?.Buffer !== 'undefined',
        hasProcess: typeof (window as any).global?.process !== 'undefined'
      },
      process: {
        exists: typeof (window as any).process !== 'undefined',
        env: typeof (window as any).process?.env !== 'undefined',
        nextTick: typeof (window as any).process?.nextTick === 'function'
      },
      ethereum: {
        exists: typeof window.ethereum !== 'undefined',
        isMetaMask: !!window.ethereum?.isMetaMask
      },
      userAgent: navigator.userAgent
    };
    
    console.log("Environment check:", JSON.stringify(environmentCheck, null, 2));
    
    // Logo URL for WalletConnect
    const logoUrl = `${window.location.origin}/tsk-logo.svg`;
    console.log("Using logo URL:", logoUrl);
    
    // Try fetching the logo to ensure it's available
    try {
      const logoCheck = await fetch(logoUrl, { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      console.log("Logo fetch status:", logoCheck.status);
      if (!logoCheck.ok) {
        console.warn("Logo may not be available at", logoUrl);
      }
    } catch (e) {
      console.warn("Could not verify logo availability:", e);
    }
    
    // Initialize the EthereumProvider with more detailed logging
    console.log("Creating WalletConnect EthereumProvider...");
    
    const mainnetChainId = getBscMainnetChainId();
    const testnetChainId = getBscTestnetChainId();
    
    console.log(`Using chain IDs: Mainnet=${mainnetChainId}, Testnet=${testnetChainId}`);
    
    const provider = await EthereumProvider.init({
      projectId: '11d13ebd56cd87463b3b41b4b378e1bb', // Project ID for WalletConnect
      chains: [mainnetChainId, testnetChainId], // Support both chains
      showQrModal: true,
      qrModalOptions: {
        themeMode: 'dark',
        themeVariables: {
          '--wcm-z-index': '9999',
          '--wcm-background-color': '#1a1b1f',
          '--wcm-accent-color': '#19466B' // Match app primary color
        },
        explorerRecommendedWalletIds: [
          'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
          '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
          '225affb176778569276e484e1b92637ad061b01e13a048b35a9d280c3b58970f', // TokenPocket
          'ecc4036f814562b41a5268adc86270fba1365471402006302e70169465b7ac18', // Coin98
        ],
        enableExplorer: true
      },
      methods: [
        'eth_sendTransaction',
        'eth_sign',
        'eth_signTransaction',
        'eth_signTypedData',
        'personal_sign',
        'eth_requestAccounts'
      ],
      events: [
        'chainChanged', 
        'accountsChanged',
        'connect',
        'disconnect'
      ],
      metadata: {
        name: 'TSK Platform',
        description: 'TSK - Decentralized Mining and Token Management Platform',
        url: window.location.origin,
        icons: [logoUrl]
      },
      rpcMap: {
        [mainnetChainId]: 'https://bsc-dataseed.binance.org',
        [testnetChainId]: 'https://data-seed-prebsc-1-s1.binance.org:8545'
      }
    }).catch(error => {
      console.error("WalletConnect initialization failed:", error);
      
      // Attempt to provide more specific error information
      if (error instanceof Error) {
        if (error.message.includes("No matching key")) {
          console.error("Project ID issue: The WalletConnect Project ID may be invalid");
          throw new Error("WalletConnect configuration error. Please contact support.");
        }
        
        if (error.message.includes("TypeError") && error.message.includes("is not a function")) {
          console.error("Possible polyfill issue:", error.message);
          throw new Error("Browser compatibility issue with WalletConnect. Try using MetaMask instead.");
        }
      }
      
      // Re-throw the original error if we couldn't provide more specific information
      throw error;
    });
    
    console.log("WalletConnect provider initialized successfully:", provider);
    
    // Subscribe to accounts change with improved logging
    provider.on('accountsChanged', (accounts: string[]) => {
      console.log('WalletConnect accounts changed:', accounts);
      if (accounts.length === 0) {
        console.log('User disconnected their wallet');
      } else {
        console.log(`Active account changed to: ${accounts[0]}`);
      }
    });
    
    // Subscribe to chainId change with improved logging
    provider.on('chainChanged', (chainIdStr: string) => {
      let networkName = "Unknown";
      const chainIdNum = typeof chainIdStr === 'string' && chainIdStr.startsWith('0x') 
        ? parseInt(chainIdStr, 16) 
        : Number(chainIdStr);
        
      if (chainIdNum === mainnetChainId) {
        networkName = "BSC Mainnet";
      } else if (chainIdNum === testnetChainId) {
        networkName = "BSC Testnet";
      }
      
      console.log(`WalletConnect chain changed to ${networkName} (${chainIdStr})`);
    });
    
    // Subscribe to session connection
    provider.on('connect', (info: any) => {
      console.log('WalletConnect session established:', info);
    });
    
    // Subscribe to session disconnection
    provider.on('disconnect', (error: { code: number; message: string }) => {
      console.log(`WalletConnect session disconnected: ${error.code} - ${error.message}`);
    });
    
    // Monitor provider for errors manually
    try {
      // @ts-ignore - Error event may not be in the type definitions but is handled by some providers
      provider.on('error', (error: any) => {
        console.error('WalletConnect error event:', error);
      });
    } catch (e) {
      console.log('This provider does not support the error event');
    }
    
    return provider;
  } catch (error) {
    console.error('Error initializing WalletConnect:', error);
    
    // Enhanced error diagnostics
    if (error instanceof Error) {
      // Check for common error patterns and provide more helpful messages
      if (error.message.includes("Buffer") || error.message.includes("buffer")) {
        console.error("Buffer polyfill issue detected:", error.message);
        throw new Error("Browser compatibility issue: Buffer not properly available");
      }
      
      if (error.message.includes("process") || error.message.includes("global")) {
        console.error("Node.js polyfill issue detected:", error.message);
        throw new Error("Browser compatibility issue: Node.js environment not properly polyfilled");
      }
      
      if (error.message.includes("network") || error.message.includes("connect")) {
        console.error("Network issue detected:", error.message);
        throw new Error("Network connectivity issue. Please check your internet connection.");
      }
    }
    
    throw error;
  }
};

// Disconnect from WalletConnect Provider
export const disconnectWalletConnect = async (provider: any) => {
  if (provider && typeof provider.disconnect === 'function') {
    try {
      await provider.disconnect();
      console.log('WalletConnect session terminated');
      return true;
    } catch (error) {
      console.error('Error disconnecting WalletConnect:', error);
      return false;
    }
  }
  return false;
};

// Switch networks in WalletConnect provider
export const switchWalletConnectNetwork = async (provider: any, networkType: 'testnet' | 'mainnet') => {
  if (!provider) {
    throw new Error('WalletConnect provider not initialized');
  }
  
  try {
    // Get the chain ID for the requested network
    const chainId = networkType === 'mainnet' ? getBscMainnetChainId() : getBscTestnetChainId();
    
    // Check if the provider is already connected to the requested network
    if (provider.chainId === chainId) {
      console.log(`Already connected to ${networkType} (Chain ID: ${chainId})`);
      return true;
    }
    
    // Switch to the requested network
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${chainId.toString(16)}` }]
    });
    
    console.log(`Switched to ${networkType} (Chain ID: ${chainId})`);
    return true;
  } catch (error) {
    console.error(`Error switching to ${networkType}:`, error);
    
    // If the chain hasn't been added to the wallet, add it
    if ((error as any)?.code === 4902) {
      try {
        const chainId = networkType === 'mainnet' ? getBscMainnetChainId() : getBscTestnetChainId();
        const chainConfig = networkType === 'mainnet' ? {
          chainId: `0x${chainId.toString(16)}`,
          chainName: 'BNB Smart Chain Mainnet',
          nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
          },
          rpcUrls: ['https://bsc-dataseed.binance.org/'],
          blockExplorerUrls: ['https://bscscan.com/']
        } : {
          chainId: `0x${chainId.toString(16)}`,
          chainName: 'BNB Smart Chain Testnet',
          nativeCurrency: {
            name: 'tBNB',
            symbol: 'tBNB',
            decimals: 18
          },
          rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
          blockExplorerUrls: ['https://testnet.bscscan.com/']
        };
        
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [chainConfig]
        });
        
        console.log(`Added and switched to ${networkType} (Chain ID: ${chainId})`);
        return true;
      } catch (addError) {
        console.error(`Error adding ${networkType} chain:`, addError);
        throw addError;
      }
    }
    
    throw error;
  }
};
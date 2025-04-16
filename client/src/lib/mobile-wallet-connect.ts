/**
 * Mobile-optimized wallet connection library
 * This is a simplified version of the wallet connection logic
 * specifically designed for better mobile compatibility.
 */

import { ethers } from 'ethers';
import { toast } from '@/hooks/use-toast';

// Chain IDs for BSC
export const BSC_MAINNET_CHAIN_ID = 56;
export const BSC_TESTNET_CHAIN_ID = 97;

// WalletConnect Project ID
export const WALLET_CONNECT_PROJECT_ID = '11d13ebd56cd87463b3b41b4b378e1bb';

// Test if we're in a mobile environment
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

// MetaMask Mobile Deep Link (used for mobile browser wallet connections)
export const getMetaMaskDeepLink = () => {
  const currentUrl = encodeURIComponent(window.location.href);
  return `https://metamask.app.link/dapp/${window.location.host}?connect=true`;
};

// Connect to MetaMask (mobile-optimized)
export const connectMetaMask = async () => {
  try {
    console.log("Mobile MetaMask connection attempt started");
    
    // If no ethereum object and we're on mobile, direct to app
    if (typeof window.ethereum === 'undefined' && isMobile()) {
      console.log("No ethereum object found on mobile, redirecting to MetaMask app");
      
      // Store connection attempt in localStorage to restore after redirect
      localStorage.setItem('mm_connect_attempt', 'true');
      localStorage.setItem('mm_connect_timestamp', Date.now().toString());
      
      // Direct to MetaMask mobile app
      window.location.href = getMetaMaskDeepLink();
      return {
        success: false,
        redirecting: true,
        error: null
      };
    }
    
    // If no ethereum object on desktop, show error
    if (typeof window.ethereum === 'undefined') {
      console.log("No ethereum object found");
      return {
        success: false,
        redirecting: false,
        error: "MetaMask not installed. Please install MetaMask to continue."
      };
    }
    
    // Request accounts
    console.log("Requesting accounts...");
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts available or user rejected request");
    }
    
    // Get user address
    const address = accounts[0];
    console.log("Connected to address:", address);
    
    // Get chain ID
    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
    console.log("Connected to chain ID:", chainId);
    
    // Create provider with better error handling
    const provider = new ethers.BrowserProvider(window.ethereum);
    
    // Get signer
    const signer = await provider.getSigner();
    
    return {
      success: true,
      redirecting: false,
      error: null,
      address,
      provider,
      signer,
      chainId
    };
    
  } catch (error) {
    console.error("Mobile MetaMask connection error:", error);
    
    // Format error message for better user experience
    let errorMessage = "Connection failed";
    if (error instanceof Error) {
      // Common MetaMask errors on mobile
      if (error.message.includes("user rejected")) {
        errorMessage = "Connection request rejected";
      } else if (error.message.includes("already processing")) {
        errorMessage = "Connection already in progress, check your wallet app";
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      redirecting: false,
      error: errorMessage
    };
  }
};

// Connect to WalletConnect (mobile-optimized)
export const connectWalletConnect = async () => {
  try {
    console.log("Mobile WalletConnect connection attempt started");
    
    // Import WalletConnect dynamically
    const { EthereumProvider } = await import('@walletconnect/ethereum-provider');
    
    // Create provider with mobile-optimized settings
    const wcProvider = await EthereumProvider.init({
      projectId: WALLET_CONNECT_PROJECT_ID,
      chains: [BSC_MAINNET_CHAIN_ID, BSC_TESTNET_CHAIN_ID],
      showQrModal: true,
      // Simplified options for mobile
      metadata: {
        name: 'TSK Platform',
        description: 'TSK Platform',
        url: window.location.origin,
        icons: [`${window.location.origin}/tsk-logo.svg`]
      }
    });
    
    // Enable provider and get accounts
    const accounts = await wcProvider.enable();
    
    if (!accounts || accounts.length === 0) {
      throw new Error("No accounts returned");
    }
    
    // Get address
    const address = accounts[0];
    console.log("WalletConnect connected to address:", address);
    
    // Get chain ID
    const chainId = await wcProvider.request({ method: 'eth_chainId' });
    console.log("WalletConnect connected to chain ID:", chainId);
    
    // Create ethers provider
    const provider = new ethers.BrowserProvider(wcProvider);
    
    // Get signer
    const signer = await provider.getSigner();
    
    return {
      success: true,
      error: null,
      address,
      provider,
      signer,
      chainId,
      wcProvider
    };
    
  } catch (error) {
    console.error("Mobile WalletConnect connection error:", error);
    
    // Format error message for better user experience
    let errorMessage = "WalletConnect connection failed";
    if (error instanceof Error) {
      if (error.message.includes("User closed")) {
        errorMessage = "Connection cancelled by user";
      } else if (error.message.includes("Modal closed")) {
        errorMessage = "QR code modal was closed";
      } else {
        errorMessage = error.message;
      }
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
};

// Disconnect WalletConnect
export const disconnectWalletConnect = async (wcProvider: any) => {
  if (wcProvider && typeof wcProvider.disconnect === 'function') {
    try {
      await wcProvider.disconnect();
      console.log("WalletConnect disconnected");
      return true;
    } catch (error) {
      console.error("WalletConnect disconnect error:", error);
      return false;
    }
  }
  return false;
};

// Check for pending connections from mobile wallet redirects
export const checkPendingMobileConnection = () => {
  // Check for connection parameter in URL 
  const urlParams = new URLSearchParams(window.location.search);
  const connectParam = urlParams.get('connect');
  
  // Check localStorage for connection attempt
  const connectAttempt = localStorage.getItem('mm_connect_attempt');
  const timestamp = localStorage.getItem('mm_connect_timestamp');
  
  if (connectParam === 'true') {
    console.log("Found connect=true in URL, attempting connection");
    
    // Remove parameter from URL
    const url = new URL(window.location.href);
    url.searchParams.delete('connect');
    window.history.replaceState({}, document.title, url.toString());
    
    // Clear connection flags
    localStorage.removeItem('mm_connect_attempt');
    localStorage.removeItem('mm_connect_timestamp');
    
    return true;
  } else if (connectAttempt === 'true' && timestamp) {
    const connectTime = parseInt(timestamp, 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    
    if (now - connectTime < fiveMinutes) {
      console.log("Detected return from MetaMask app, attempting connection");
      
      // Clear connection flags
      localStorage.removeItem('mm_connect_attempt');
      localStorage.removeItem('mm_connect_timestamp');
      
      return true;
    } else {
      // Connection attempt too old, clear it
      localStorage.removeItem('mm_connect_attempt');
      localStorage.removeItem('mm_connect_timestamp');
    }
  }
  
  return false;
};
import { ethers } from "ethers";

// Full Token ABI including all standard ERC20 functions and extensions
export const TokenABI = [
  // Basic ERC20 functions
  "function balanceOf(address account) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function name() external view returns (string memory)",
  "function symbol() external view returns (string memory)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  
  // Token custom functions
  "function mint(address to, uint256 amount) external",
  "function burn(uint256 amount) external",
  "function burnFrom(address account, uint256 amount) external",
  "function processWithdrawal(address user, uint256 amount) external",
  "function batchProcessWithdrawals(address[] calldata users, uint256[] calldata amounts) external",
  
  // Events
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event TokensMinted(address indexed to, uint256 amount)",
  "event WithdrawalProcessed(address indexed user, uint256 amount)"
];

// Network configurations
export const Networks = {
  BSCTestnet: {
    chainId: "0x61", // 97 in hex
    chainName: "BNB Smart Chain Testnet",
    nativeCurrency: {
      name: "Testnet BNB",
      symbol: "tBNB",
      decimals: 18
    },
    rpcUrls: ["https://data-seed-prebsc-1-s1.binance.org:8545"],
    blockExplorerUrls: ["https://testnet.bscscan.com"]
  },
  BSCMainnet: {
    chainId: "0x38", // 56 in hex
    chainName: "BNB Smart Chain",
    nativeCurrency: {
      name: "BNB",
      symbol: "BNB",
      decimals: 18
    },
    rpcUrls: ["https://bsc-dataseed.binance.org"],
    blockExplorerUrls: ["https://bscscan.com"]
  }
};

// Contract addresses for each network
// Initialize with default values that will be populated by fetchContractAddresses
export const ContractAddresses = {
  Testnet: {
    // The testnet token address - will be loaded from API
    TokenAddress: import.meta.env.VITE_TOKEN_ADDRESS_TESTNET || "0x0000000000000000000000000000000000000000",
  },
  Mainnet: {
    // The mainnet token address - will be loaded from API
    TokenAddress: import.meta.env.VITE_TOKEN_ADDRESS_MAINNET || "0x0000000000000000000000000000000000000000",
  }
};

/**
 * Fetches contract addresses from the API
 * This should be called when the application initializes
 */
export async function fetchContractAddresses() {
  try {
    // Fetch all contract addresses
    const response = await fetch('/api/contract-addresses');
    
    if (!response.ok) {
      console.error('Error fetching contract addresses:', response.statusText);
      return;
    }
    
    const addresses = await response.json();
    
    // Transform the API response to our ContractAddresses format
    const updatedAddresses = {
      Testnet: {
        TokenAddress: ContractAddresses.Testnet.TokenAddress,
      },
      Mainnet: {
        TokenAddress: ContractAddresses.Mainnet.TokenAddress,
      }
    };
    
    // Update with values from the API
    addresses.forEach((contractAddress: any) => {
      if (contractAddress.network === 'testnet') {
        updatedAddresses.Testnet.TokenAddress = contractAddress.address;
      } else if (contractAddress.network === 'mainnet') {
        updatedAddresses.Mainnet.TokenAddress = contractAddress.address;
      }
    });
    
    // Replace the entire ContractAddresses object
    Object.assign(ContractAddresses, updatedAddresses);
    
    console.log('Contract addresses updated from API:', ContractAddresses);
  } catch (error) {
    console.error('Failed to fetch contract addresses:', error);
    // Default to environment variables if API call fails
  }
};

/**
 * Gets a contract instance with the given ABI and address
 */
export function getContract(address: string, abi: any, signer: any) {
  return new ethers.Contract(address, abi, signer);
}

/**
 * Validates if a string is a valid Ethereum/BSC address
 */
export function isValidAddress(address: string | null): boolean {
  if (!address) return false;
  
  // Check if the address matches the format: 0x followed by 40 hex characters
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

/**
 * Formats an address for display (0x1234...5678)
 */
export function formatAddress(address: string | null) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Utility function for formatting token amounts
 */
export function formatTokenAmount(amount: number) {
  return amount.toFixed(2);
}

/**
 * Calculate time remaining from a timestamp in milliseconds
 */
export function calculateTimeRemaining(timestamp: number | null) {
  if (!timestamp) return { hours: 0, minutes: 0, seconds: 0, totalSeconds: 0 };
  
  const now = Date.now();
  const timeRemaining = Math.max(0, timestamp - now);
  
  const totalSeconds = Math.floor(timeRemaining / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return { hours, minutes, seconds, totalSeconds };
}

/**
 * Format time components into a readable string (hh:mm:ss)
 */
export function formatTime(hours: number, minutes: number, seconds: number) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

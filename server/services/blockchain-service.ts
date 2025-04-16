import { log } from '../vite';
import axios from 'axios';
import { ethers } from 'ethers';
import { storage } from '../storage-new';

// BSCScan API has rate limits, so we'll cache results
interface CacheEntry {
  timestamp: number;
  data: any;
}

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

// Token ABI - Functions we need for withdrawals and funding
// The ABI doesn't need modifiers like 'onlyOwner' - those are internal to the contract
const TSK_TOKEN_ABI = [
  // Simplified function signatures without modifiers
  "function processWithdrawal(address user, uint256 amount)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function owner() view returns (address)",
  "event WithdrawalProcessed(address indexed user, uint256 amount)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Network configurations
const NETWORKS = {
  // For contract_addresses table: 'mainnet' and 'testnet'
  // For wallet_configuration table: 'bscMainnet' and 'bscTestnet'
  mainnet: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56
  },
  testnet: {
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    chainId: 97
  },
  bscMainnet: {
    rpcUrl: 'https://bsc-dataseed.binance.org/',
    chainId: 56
  },
  bscTestnet: {
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
    chainId: 97
  }
};

const cache: Record<string, CacheEntry> = {};
const CACHE_LIFETIME = 60 * 1000; // 1 minute in milliseconds

/**
 * Get the BSCScan API URL based on network (mainnet or testnet)
 */
function getBscscanApiUrl(network: string): string {
  return network === 'mainnet' 
    ? 'https://api.bscscan.com/api'
    : 'https://api-testnet.bscscan.com/api';
}

/**
 * Get the BSCScan API key from environment variables
 */
function getBscscanApiKey(): string {
  return process.env.BSCSCAN_API_KEY || '';
}

/**
 * Fetch token transactions for a contract from BSCScan
 */
export async function fetchTokenTransactions(
  contractAddress: string, 
  network: string = 'testnet',
  page: number = 1,
  offset: number = 100
): Promise<Transaction[]> {
  const cacheKey = `transactions:${network}:${contractAddress}:${page}:${offset}`;
  
  // Check if we have a valid cache entry
  const cacheEntry = cache[cacheKey];
  if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_LIFETIME) {
    log(`Using cached blockchain data for ${contractAddress}`, 'blockchain');
    return cacheEntry.data;
  }

  try {
    const apiKey = getBscscanApiKey();
    if (!apiKey) {
      log('BSCScan API key is not configured', 'blockchain');
      throw new Error('BSCScan API key is not configured');
    }

    const apiUrl = getBscscanApiUrl(network);
    
    // For a real token, you would use 'tokentx' endpoint
    // For testing, we can use 'txlist' to get regular transactions
    const params = {
      module: 'account',
      action: 'tokentx', // token transactions
      contractaddress: contractAddress,
      page: page.toString(),
      offset: offset.toString(),
      sort: 'desc',
      apikey: apiKey
    };
    
    log(`Fetching transactions for ${contractAddress} on ${network}`, 'blockchain');
    const response = await axios.get(apiUrl, { params });
    
    if (response.data.status !== '1') {
      log(`BSCScan API error: ${response.data.message}`, 'blockchain');
      
      // If no transactions found, return empty array instead of error
      if (response.data.message === 'No transactions found') {
        const emptyResult: Transaction[] = [];
        cache[cacheKey] = { timestamp: Date.now(), data: emptyResult };
        return emptyResult;
      }
      
      throw new Error(`BSCScan API error: ${response.data.message}`);
    }
    
    // Transform the response to our preferred format
    const transactions: Transaction[] = response.data.result.map((tx: any) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timestamp: parseInt(tx.timeStamp),
      blockNumber: parseInt(tx.blockNumber)
    }));
    
    // Cache the result
    cache[cacheKey] = { timestamp: Date.now(), data: transactions };
    
    return transactions;
  } catch (error) {
    log(`Error fetching blockchain data: ${error instanceof Error ? error.message : 'Unknown error'}`, 'blockchain');
    throw error;
  }
}

/**
 * Get a summary of token transactions, including distribution data
 */
export async function getTokenTransactionsSummary(
  contractAddress: string,
  network: string = 'testnet'
): Promise<{
  transactions: Transaction[];
  totalTransactions: number;
  totalVolume: number;
  uniqueAddresses: number;
  largestTransaction: Transaction | null;
  recentTransactions: Transaction[];
  distributionData: {
    address: string;
    value: number;
    percentage: number;
    count: number;
  }[];
  timeSeriesData: {
    date: string;
    value: number;
    count: number;
  }[];
}> {
  try {
    const transactions = await fetchTokenTransactions(contractAddress, network);
    
    // Calculate total volume
    let totalVolume = 0;
    let largestTransaction: Transaction | null = null;
    const addressValues: Record<string, number> = {};
    const addressCounts: Record<string, number> = {};
    const dateValues: Record<string, number> = {};
    const dateCounts: Record<string, number> = {};
    
    // Process transactions data
    transactions.forEach(tx => {
      // Calculate total volume and track largest transaction
      const value = parseFloat(tx.value) / 1e18; // Convert from wei-equivalent to token units
      totalVolume += value;
      
      if (!largestTransaction || value > parseFloat(largestTransaction.value) / 1e18) {
        largestTransaction = tx;
      }
      
      // Track distribution by address
      if (!addressValues[tx.to]) {
        addressValues[tx.to] = 0;
        addressCounts[tx.to] = 0;
      }
      addressValues[tx.to] += value;
      addressCounts[tx.to]++;
      
      // Track time series data
      const date = new Date(tx.timestamp * 1000).toISOString().split('T')[0]; // YYYY-MM-DD
      if (!dateValues[date]) {
        dateValues[date] = 0;
        dateCounts[date] = 0;
      }
      dateValues[date] += value;
      dateCounts[date]++;
    });
    
    // Create distribution data
    const distributionData = Object.keys(addressValues).map(address => {
      const value = addressValues[address];
      return {
        address,
        value,
        percentage: totalVolume > 0 ? value / totalVolume : 0,
        count: addressCounts[address]
      };
    })
    // Sort by value descending
    .sort((a, b) => b.value - a.value);
    
    // Create time series data
    const timeSeriesData = Object.keys(dateValues).map(date => ({
      date,
      value: dateValues[date],
      count: dateCounts[date]
    }))
    // Sort by date ascending
    .sort((a, b) => a.date.localeCompare(b.date));
    
    // Count unique addresses
    const uniqueAddresses = new Set<string>();
    transactions.forEach(tx => {
      uniqueAddresses.add(tx.from);
      uniqueAddresses.add(tx.to);
    });
    
    return {
      transactions,
      totalTransactions: transactions.length,
      totalVolume,
      uniqueAddresses: uniqueAddresses.size,
      largestTransaction,
      recentTransactions: transactions.slice(0, 10),  // Get 10 most recent
      distributionData,
      timeSeriesData
    };
  } catch (error) {
    // If there's an error with the API, return mock data
    log(`Error in getTokenTransactionsSummary: ${error instanceof Error ? error.message : 'Unknown error'}`, 'blockchain');
    
    // Return mock data with the same structure
    return generateMockTransactionSummary();
  }
}

/**
 * For demo/testing purposes when BSCScan API is not available
 */
/**
 * Generate a mock transaction summary for testing
 */
export function generateMockTransactionSummary(): any {
  // Generate mock transactions
  const mockTransactions = generateMockTransactions(20);
  
  // Mock addresses for distribution
  const addresses = [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
    '0x4567890123456789012345678901234567890123',
    '0x5678901234567890123456789012345678901234',
  ];
  
  // Create mock distribution data
  const totalVolume = 10000;
  const distributionData = addresses.map(address => {
    const value = Math.random() * 2000 + 500;
    return {
      address,
      value,
      percentage: value / totalVolume,
      count: Math.floor(Math.random() * 10) + 1
    };
  });
  
  // Create mock time series data
  const today = new Date();
  const timeSeriesData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(today.getDate() - 13 + i);
    return {
      date: date.toISOString().split('T')[0],
      value: Math.random() * 1000 + 100,
      count: Math.floor(Math.random() * 10) + 1
    };
  });
  
  // Find "largest" transaction
  let largestTransaction = mockTransactions[0];
  mockTransactions.forEach(tx => {
    if (parseFloat(tx.value) > parseFloat(largestTransaction.value)) {
      largestTransaction = tx;
    }
  });
  
  return {
    transactions: mockTransactions,
    totalTransactions: mockTransactions.length,
    totalVolume,
    uniqueAddresses: addresses.length,
    largestTransaction,
    recentTransactions: mockTransactions.slice(0, 10),
    distributionData,
    timeSeriesData,
    warning: "Using mock data - BSCScan API key not configured"
  };
}

export function generateMockTransactions(count: number = 10): Transaction[] {
  const addresses = [
    '0x1234567890123456789012345678901234567890',
    '0x2345678901234567890123456789012345678901',
    '0x3456789012345678901234567890123456789012',
    '0x4567890123456789012345678901234567890123',
    '0x5678901234567890123456789012345678901234',
  ];
  
  const contractAddress = '0x9876543210987654321098765432109876543210';
  
  const now = Math.floor(Date.now() / 1000);
  
  return Array.from({ length: count }, (_, i) => {
    const value = (Math.random() * 1000).toFixed(2);
    const timestamp = now - i * 3600; // 1 hour apart
    
    return {
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      from: addresses[Math.floor(Math.random() * addresses.length)],
      to: contractAddress,
      value: (parseFloat(value) * 1e18).toString(), // Convert to wei-equivalent
      timestamp,
      blockNumber: 1000000 + i
    };
  });
}

/**
 * Get a blockchain provider based on network
 */
function getProvider(network: string = 'mainnet') {
  // Map network names to ensure consistency with wallet_configuration table
  // For testnet: 'testnet' -> 'bscTestnet' 
  // For mainnet: 'mainnet' -> 'bscMainnet'
  let mappedNetwork = network;
  
  if (network === 'testnet') {
    mappedNetwork = 'bscTestnet';
  } else if (network === 'mainnet') {
    mappedNetwork = 'bscMainnet';
  }
  
  const networkConfig = NETWORKS[mappedNetwork as keyof typeof NETWORKS] || NETWORKS.mainnet;
  log(`Creating provider for ${network} (mapped to ${mappedNetwork}): ${networkConfig.rpcUrl}`, 'blockchain');
  return new ethers.JsonRpcProvider(networkConfig.rpcUrl);
}

/**
 * Get the contract address, prioritizing system secrets over database storage
 * This ensures the most current contract address is always used
 */
async function getContractAddress(network: string): Promise<string> {
  try {
    // Map network names to ensure consistency with database entries
    // From UI/API: 'mainnet' or 'testnet'
    // In contract_addresses table: 'mainnet' or 'testnet'
    const mappedNetworkForContract = network;
    
    // First try to get from system secrets (highest priority)
    if (network === 'mainnet') {
      try {
        const contractAddressSecret = await storage.getSystemSecretByKeyName('TSK_CONTRACT_ADDRESS');
        if (contractAddressSecret && contractAddressSecret.value) {
          log('Using TSK contract address from system secrets', 'blockchain');
          return contractAddressSecret.value;
        }
      } catch (secretError) {
        log(`Error retrieving TSK contract address from system secrets: ${secretError instanceof Error ? secretError.message : 'Unknown error'}`, 'blockchain');
      }
    }
    
    // Fall back to database storage (contract_addresses table)
    const contractData = await storage.getContractAddress(mappedNetworkForContract);
    log(`Retrieved contract data for ${mappedNetworkForContract} from database:`, 'blockchain');
    log(JSON.stringify(contractData), 'blockchain');
    
    if (!contractData || !contractData.address || contractData.address === '0x0000000000000000000000000000000000000000') {
      throw new Error(`TSK token address not configured for ${network}`);
    }
    
    return contractData.address;
  } catch (error) {
    log(`Error getting contract address: ${error instanceof Error ? error.message : 'Unknown error'}`, 'blockchain');
    throw new Error(`Failed to retrieve contract address for network ${network}`);
  }
}

/**
 * Process a token withdrawal from the contract to a user wallet
 * @param amount The amount of tokens to withdraw
 * @param userAddress The address to withdraw tokens to
 * @param network The network to use (defaulted to mainnet)
 * @returns Success status and transaction details
 */
/**
 * Fund the contract by sending tokens from owner wallet to contract address
 * This allows the contract to have a balance for withdrawals
 */
export async function fundContract(
  amount: number,
  network: string = 'mainnet'
): Promise<{ 
  success: boolean; 
  transactionHash?: string;
  error?: string;
}> {
  try {
    // Try to get Luke's wallet key from system secrets first
    let deployerPrivateKey = null;
    try {
      const lukeWalletSecret = await storage.getSystemSecretByKeyName('LUKE_WALLET_KEY');
      if (lukeWalletSecret) {
        log('Using Luke wallet key from system secrets', 'blockchain');
        deployerPrivateKey = lukeWalletSecret.value;
      }
    } catch (secretError) {
      log(`Error retrieving Luke wallet key from system secrets: ${secretError instanceof Error ? secretError.message : 'Unknown error'}`, 'blockchain');
    }
    
    // Fall back to environment variable if system secret is not available
    if (!deployerPrivateKey) {
      log('Luke wallet key not found in system secrets, falling back to DEPLOYER_PRIVATE_KEY', 'blockchain');
      if (!process.env.DEPLOYER_PRIVATE_KEY) {
        throw new Error('Deployer private key not configured in environment or system secrets');
      }
      deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    }

    // Always use mainnet for funding regardless of passed parameter
    const mainnetNetwork = 'mainnet'; // For contract_addresses table
    const bscMainnetNetwork = 'bscMainnet'; // For wallet_configuration table
    
    log(`Funding contract with ${amount} TSK tokens on ${mainnetNetwork}`, 'blockchain');
    
    // Get contract address using our helper function, which prioritizes system secrets
    const contractAddress = await getContractAddress(mainnetNetwork);
    log(`Using contract address: ${contractAddress}`, 'blockchain');
    
    // Set up provider and wallet - always use mainnet provider
    // The getProvider function will correctly map the network name
    const provider = getProvider(bscMainnetNetwork);
    log(`Using provider for network ${bscMainnetNetwork}`, 'blockchain');
    
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);
    log(`Wallet initialized. Address: ${wallet.address}`, 'blockchain');
    
    // Get contract instance
    const tokenContract = new ethers.Contract(contractAddress, TSK_TOKEN_ABI, wallet);
    log(`Contract instance created for ${contractAddress}`, 'blockchain');
    
    // Convert amount to wei (1e18)
    const amountInWei = ethers.parseEther(amount.toString());
    
    // Check owner balance before funding
    const ownerBalance = await tokenContract.balanceOf(wallet.address);
    
    log(`Owner balance: ${ethers.formatEther(ownerBalance)} tokens`, 'blockchain');
    log(`Funding amount: ${amount} tokens (${ethers.formatEther(amountInWei)})`, 'blockchain');
    
    if (ownerBalance < amountInWei) {
      throw new Error('Insufficient balance in owner wallet for funding. Mint tokens to the owner first.');
    }
    
    // Send tokens to contract using transfer function
    log(`Executing transfer to fund contract...`, 'blockchain');
    
    // Variable to store receipt
    let transactionReceipt: any = null;
    
    try {
      // Get the wallet's BNB balance
      const bnbBalance = await provider.getBalance(wallet.address);
      log(`Wallet BNB balance: ${ethers.formatEther(bnbBalance)} BNB`, 'blockchain');
      
      // Estimate gas for the transaction
      const gasEstimate = await tokenContract.transfer.estimateGas(contractAddress, amountInWei);
      log(`Estimated gas needed: ${gasEstimate.toString()}`, 'blockchain');
      
      // Get current gas price
      const gasPrice = await provider.getFeeData();
      const gasPriceFormatted = ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
      log(`Current gas price: ${gasPriceFormatted} gwei`, 'blockchain');
      
      // Calculate total gas cost - convert to BigInt safely for older ES versions
      const gasCostBigInt = (gasPrice.gasPrice || BigInt(0)) * BigInt(gasEstimate.toString());
      log(`Total gas cost: ${ethers.formatEther(gasCostBigInt)} BNB`, 'blockchain');
      
      // Check if wallet has enough BNB for gas
      if (bnbBalance < gasCostBigInt) {
        throw new Error(`Insufficient BNB for transaction fees. Wallet has ${ethers.formatEther(bnbBalance)} BNB, but needs approximately ${ethers.formatEther(gasCostBigInt)} BNB.`);
      }
      
      // Add custom gas settings to help with transaction processing
      const bufferGasEstimate = BigInt(Math.floor(Number(gasEstimate.toString()) * 1.2)); // Add 20% buffer to the estimated gas
      const gasOptions = {
        gasLimit: bufferGasEstimate
      };
      
      const tx = await tokenContract.transfer(contractAddress, amountInWei, gasOptions);
      log(`Transaction sent, hash: ${tx.hash}`, 'blockchain');
      
      // Wait for the transaction to be mined
      log(`Waiting for transaction confirmation...`, 'blockchain');
      transactionReceipt = await tx.wait();
      log(`Transaction confirmed in block ${transactionReceipt.blockNumber}`, 'blockchain');
      
      log(`Contract funded successfully. Transaction hash: ${transactionReceipt.hash}`, 'blockchain');
      
      return {
        success: true,
        transactionHash: transactionReceipt.hash
      };
    } catch (error) {
      log(`Transaction error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'blockchain');
      
      // Check for specific errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient BNB in wallet to pay for gas fees. Please fund your wallet with BNB to cover transaction costs.');
      }
      throw error;
    }
  } catch (error) {
    log(`Error funding contract: ${error instanceof Error ? error.message : 'Unknown error'}`, 'blockchain');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error funding contract'
    };
  }
}

/**
 * Get blockchain configuration status to verify system settings
 */
export async function getBlockchainStatus(): Promise<{ 
  systemWalletAddress: string | null, 
  mainnetContractAddress: string | null, 
  testnetContractAddress: string | null,
  currentNetwork: string | null,
  deployerPrivateKeyConfigured: boolean,
  lukeWalletKeyConfigured: boolean,
  tokenOwnerAddressConfigured: boolean,
  tskContractAddressConfigured: boolean
}> {
  // Check if essential system secrets are configured
  let lukeWalletKeyConfigured = false;
  let tokenOwnerAddressConfigured = false;
  let tskContractAddressConfigured = false;
  let tokenOwnerAddress = null;
  let mainnetContractAddress = null;
  
  try {
    // Check LUKE_WALLET_KEY
    const lukeWalletSecret = await storage.getSystemSecretByKeyName('LUKE_WALLET_KEY');
    lukeWalletKeyConfigured = !!lukeWalletSecret;
    
    // Check TOKEN_OWNER_ADDRESS
    const tokenOwnerSecret = await storage.getSystemSecretByKeyName('TOKEN_OWNER_ADDRESS');
    tokenOwnerAddressConfigured = !!tokenOwnerSecret;
    if (tokenOwnerSecret) {
      tokenOwnerAddress = tokenOwnerSecret.value;
    }
    
    // Check TSK_CONTRACT_ADDRESS
    const contractAddressSecret = await storage.getSystemSecretByKeyName('TSK_CONTRACT_ADDRESS');
    tskContractAddressConfigured = !!contractAddressSecret;
    if (contractAddressSecret) {
      mainnetContractAddress = contractAddressSecret.value;
    }
  } catch (error) {
    log(`Error checking system secrets: ${error instanceof Error ? error.message : 'Unknown error'}`, 'blockchain');
  }
  
  // Fall back to environment variables if system secrets are not available
  if (!mainnetContractAddress) {
    mainnetContractAddress = process.env.TSK_TOKEN_ADDRESS_MAINNET || null;
  }
  
  if (!tokenOwnerAddress) {
    tokenOwnerAddress = process.env.SYSTEM_WALLET_ADDRESS || null;
  }

  return {
    systemWalletAddress: tokenOwnerAddress,
    mainnetContractAddress: mainnetContractAddress,
    testnetContractAddress: process.env.TSK_TOKEN_ADDRESS_TESTNET || null,
    currentNetwork: process.env.CURRENT_NETWORK || null,
    deployerPrivateKeyConfigured: !!process.env.DEPLOYER_PRIVATE_KEY,
    lukeWalletKeyConfigured,
    tokenOwnerAddressConfigured,
    tskContractAddressConfigured
  };
}

export async function processTokenWithdrawal(
  userAddress: string,
  amount: number,
  network: string = 'mainnet' // network parameter is kept for compatibility but will be overridden
): Promise<{ 
  success: boolean; 
  transactionHash?: string; 
  error?: string;
}> {
  try {
    // Try to get Luke's wallet key from system secrets first
    let deployerPrivateKey = null;
    try {
      const lukeWalletSecret = await storage.getSystemSecretByKeyName('LUKE_WALLET_KEY');
      if (lukeWalletSecret) {
        log('Using Luke wallet key from system secrets', 'blockchain');
        deployerPrivateKey = lukeWalletSecret.value;
      }
    } catch (secretError) {
      log(`Error retrieving Luke wallet key from system secrets: ${secretError instanceof Error ? secretError.message : 'Unknown error'}`, 'blockchain');
    }
    
    // Fall back to environment variable if system secret is not available
    if (!deployerPrivateKey) {
      log('Luke wallet key not found in system secrets, falling back to DEPLOYER_PRIVATE_KEY', 'blockchain');
      if (!process.env.DEPLOYER_PRIVATE_KEY) {
        throw new Error('Deployer private key not configured in environment or system secrets');
      }
      deployerPrivateKey = process.env.DEPLOYER_PRIVATE_KEY;
    }
    
    // Validate wallet address format - must be 0x followed by 40 hex characters
    if (!userAddress || !/^0x[a-fA-F0-9]{40}$/.test(userAddress)) {
      throw new Error('Invalid wallet address format. Must be a valid BNB Smart Chain address (0x followed by 40 hex characters)');
    }

    // Always use mainnet for withdrawals regardless of passed parameter
    const mainnetNetwork = 'mainnet'; // For contract_addresses table
    const bscMainnetNetwork = 'bscMainnet'; // For wallet_configuration table
    
    log(`Processing withdrawal of ${amount} TSK tokens to ${userAddress} on ${mainnetNetwork}`, 'blockchain');
    
    // Get contract address using our helper function, which prioritizes system secrets
    const contractAddress = await getContractAddress(mainnetNetwork);
    log(`Using contract address: ${contractAddress}`, 'blockchain');
    
    // Set up provider and wallet - always use mainnet provider
    // The getProvider function will correctly map the network name
    const provider = getProvider(bscMainnetNetwork);
    log(`Using provider for network ${bscMainnetNetwork}`, 'blockchain');
    
    const wallet = new ethers.Wallet(deployerPrivateKey, provider);
    log(`Wallet initialized. Address: ${wallet.address}`, 'blockchain');
    
    // Get contract instance
    const tokenContract = new ethers.Contract(contractAddress, TSK_TOKEN_ABI, wallet);
    log(`Contract instance created for ${contractAddress}`, 'blockchain');
    
    // Convert amount to wei (1e18)
    const amountInWei = ethers.parseEther(amount.toString());
    
    // First, check if the owner wallet has enough tokens
    const ownerBalance = await tokenContract.balanceOf(wallet.address);
    log(`Owner wallet balance: ${ethers.formatEther(ownerBalance)} tokens`, 'blockchain');
    
    // Check contract balance before withdrawal
    // According to our contract implementation, tokens are sent from the contract itself, not the deployer
    const contractBalance = await tokenContract.balanceOf(contractAddress);
    log(`Contract balance: ${ethers.formatEther(contractBalance)} tokens`, 'blockchain');
    log(`Requested withdrawal amount: ${amount} tokens (${ethers.formatEther(amountInWei)})`, 'blockchain');
    
    // If contract doesn't have enough tokens but owner wallet does, transfer tokens to contract first
    if (contractBalance < amountInWei && ownerBalance >= amountInWei) {
      log(`Contract has insufficient balance. Attempting to fund contract from owner wallet...`, 'blockchain');
      
      try {
        // Transfer tokens from owner wallet to contract
        const fundTx = await tokenContract.transfer(contractAddress, amountInWei);
        log(`Funding transaction sent, hash: ${fundTx.hash}`, 'blockchain');
        
        // Wait for funding transaction to be mined
        const fundReceipt = await fundTx.wait();
        log(`Contract funded successfully in block ${fundReceipt.blockNumber}`, 'blockchain');
        
        // Check updated contract balance
        const updatedContractBalance = await tokenContract.balanceOf(contractAddress);
        log(`Updated contract balance: ${ethers.formatEther(updatedContractBalance)} tokens`, 'blockchain');
        
        if (updatedContractBalance < amountInWei) {
          throw new Error('Failed to fund contract with sufficient tokens for withdrawal');
        }
      } catch (fundError) {
        log(`Error funding contract: ${fundError instanceof Error ? fundError.message : 'Unknown error'}`, 'blockchain');
        throw new Error(`Failed to fund contract: ${fundError instanceof Error ? fundError.message : 'Unknown error'}`);
      }
    } else if (contractBalance < amountInWei) {
      throw new Error('Insufficient token balance for withdrawal. Neither the contract nor the owner wallet has enough tokens. Please contact the administrator.');
    }
    
    // Process the withdrawal using direct transfer from the owner wallet
    log(`Executing direct transfer instead of processWithdrawal...`, 'blockchain');
    
    // Get the wallet's BNB balance
    const bnbBalance = await provider.getBalance(wallet.address);
    log(`Wallet BNB balance: ${ethers.formatEther(bnbBalance)} BNB`, 'blockchain');
    
    try {
      // Print contract information for debugging
      log(`Contract info - address: ${contractAddress}`, 'blockchain');
      log(`ABI used: ${JSON.stringify(TSK_TOKEN_ABI)}`, 'blockchain');
      
      // Verify the contract exists
      try {
        const code = await provider.getCode(contractAddress);
        log(`Contract bytecode exists: ${code.length > 2}`, 'blockchain');
        if (code.length <= 2) {
          throw new Error(`No contract deployed at ${contractAddress}`);
        }
      } catch (codeError) {
        log(`Error checking contract code: ${codeError instanceof Error ? codeError.message : 'Unknown error'}`, 'blockchain');
      }

      // Try to get the current owner balance to verify we can connect to the contract
      try {
        log(`Attempting to call contract functions to verify it's working...`, 'blockchain');
        const ownerBalance = await tokenContract.balanceOf(wallet.address);
        log(`Contract successfully returned owner balance: ${ethers.formatEther(ownerBalance)}`, 'blockchain');
      } catch (callError) {
        log(`Error calling contract function: ${callError instanceof Error ? callError.message : 'Unknown error'}`, 'blockchain');
      }
      
      // Add debug info to the transaction parameters
      log(`Transaction parameters:`, 'blockchain');
      log(`  userAddress: ${userAddress}`, 'blockchain');
      log(`  amount (wei): ${amountInWei.toString()}`, 'blockchain');
      log(`  caller: ${wallet.address}`, 'blockchain');
    
      // Estimate gas for a direct transfer transaction
      log(`Attempting to estimate gas for direct transfer...`, 'blockchain');
      const gasEstimate = await tokenContract.transfer.estimateGas(userAddress, amountInWei);
      log(`Estimated gas needed: ${gasEstimate.toString()}`, 'blockchain');
      
      // Get current gas price
      const gasPrice = await provider.getFeeData();
      const gasPriceFormatted = ethers.formatUnits(gasPrice.gasPrice || 0, 'gwei');
      log(`Current gas price: ${gasPriceFormatted} gwei`, 'blockchain');
      
      // Calculate total gas cost - convert to BigInt safely for older ES versions
      const gasCostBigInt = (gasPrice.gasPrice || BigInt(0)) * BigInt(gasEstimate.toString());
      log(`Total gas cost: ${ethers.formatEther(gasCostBigInt)} BNB`, 'blockchain');
      
      // Check if wallet has enough BNB for gas
      if (bnbBalance < gasCostBigInt) {
        throw new Error(`Insufficient BNB for transaction fees. Wallet has ${ethers.formatEther(bnbBalance)} BNB, but needs approximately ${ethers.formatEther(gasCostBigInt)} BNB.`);
      }
      
      // Add custom gas settings to help with transaction processing
      const bufferGasEstimate = BigInt(Math.floor(Number(gasEstimate.toString()) * 1.2)); // Add 20% buffer to the estimated gas
      const gasOptions = {
        gasLimit: bufferGasEstimate
      };
      
      // Use direct transfer instead of processWithdrawal
      const tx = await tokenContract.transfer(userAddress, amountInWei, gasOptions);
      log(`Transaction sent, hash: ${tx.hash}`, 'blockchain');
      
      // Wait for the transaction to be mined
      log(`Waiting for transaction confirmation...`, 'blockchain');
      const receipt = await tx.wait();
      log(`Transaction confirmed in block ${receipt.blockNumber}`, 'blockchain');
      
      log(`Withdrawal (via direct transfer) processed successfully. Transaction hash: ${receipt.hash}`, 'blockchain');
      
      return {
        success: true,
        transactionHash: receipt.hash
      };
    } catch (error) {
      log(`Transaction error: ${error instanceof Error ? error.message : 'Unknown error'}`, 'blockchain');
      
      // Check for specific errors
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('insufficient funds')) {
        throw new Error('Insufficient BNB in wallet to pay for gas fees. Please fund your wallet with BNB to cover transaction costs.');
      }
      throw error;
    }
  } catch (error) {
    log(`Error processing withdrawal: ${error instanceof Error ? error.message : 'Unknown error'}`, 'blockchain');
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error processing withdrawal'
    };
  }
}
// Firebase Configuration

// API Base URL - Production vs Development
export const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://us-central1-tsk-platform.cloudfunctions.net/api'
  : 'http://localhost:5001/tsk-platform/us-central1/api';

// Firebase Configuration
export const firebaseConfig = {
  // This will be automatically populated by Firebase Hosting
  // when using the Firebase init script
  // You don't need to manually set these values
  // For local development, they'll be loaded from the Firebase emulator
};

// Authentication Configuration
export const authConfig = {
  // TokenKey is used to store the JWT token in localStorage
  tokenKey: 'tsk_auth_token',
  // UserKey is used to store the user object in localStorage
  userKey: 'tsk_user',
  // Expiry time in milliseconds (default: 24 hours)
  tokenExpiry: 24 * 60 * 60 * 1000,
};

// App Configuration
export const appConfig = {
  // Default theme
  defaultTheme: 'light',
  // App name
  appName: 'TSK Platform',
  // Default language
  defaultLanguage: 'en',
  // Support email
  supportEmail: 'support@tskplatform.com',
  // Social media links
  socialMedia: {
    twitter: 'https://twitter.com/tskplatform',
    telegram: 'https://t.me/tskplatform',
    discord: 'https://discord.gg/tskplatform',
  },
  // Features configuration
  features: {
    enableMining: true,
    enableMarketplace: true,
    enableReferrals: true,
    enableChat: true,
    enableTokenBurning: true,
  },
};

// Contract Configuration
export const contractConfig = {
  // Chain IDs
  chainIds: {
    mainnet: 56, // BNB Smart Chain
    testnet: 97, // BNB Smart Chain Testnet
  },
  // Default RPC URLs
  rpcUrls: {
    mainnet: 'https://bsc-dataseed.binance.org/',
    testnet: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
  },
  // Block explorers
  blockExplorers: {
    mainnet: 'https://bscscan.com',
    testnet: 'https://testnet.bscscan.com',
  },
};
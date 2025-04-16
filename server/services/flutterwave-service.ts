/**
 * Flutterwave Payment Service
 * 
 * Service for managing Flutterwave integration.
 * Handles configuration, testing, and payment operations.
 */
import axios from 'axios';
import Flutterwave from 'flutterwave-node-v3';
import { db } from '../db';
import * as settingsService from './settings-service';

// Define types
export interface FlutterwaveConfig {
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  testMode: boolean;
  enabled: boolean;
}

// Cache for configuration to avoid frequent database lookups
let configCache: FlutterwaveConfig | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

/**
 * Get Flutterwave configuration from database
 * @returns Flutterwave configuration object
 */
export async function getConfig(): Promise<FlutterwaveConfig> {
  // Use cache if available and not expired
  const now = Date.now();
  if (configCache && cacheExpiry > now) {
    return configCache;
  }
  
  // Default configuration
  const defaultConfig: FlutterwaveConfig = {
    publicKey: '',
    secretKey: '',
    encryptionKey: '',
    testMode: true,
    enabled: false
  };
  
  try {
    // Get API keys from settings
    let publicKey = '';
    let secretKey = '';
    let encryptionKey = '';
    
    // First priority: Check if we have keys stored in the database
    const publicKeySetting = await settingsService.getSettingByKey('FLUTTERWAVE_PUBLIC_KEY');
    const secretKeySetting = await settingsService.getSettingByKey('FLUTTERWAVE_SECRET_KEY');
    const encryptionKeySetting = await settingsService.getSettingByKey('FLUTTERWAVE_ENCRYPTION_KEY');
    
    if (publicKeySetting?.value) {
      publicKey = publicKeySetting.value;
    }
    
    if (secretKeySetting?.value) {
      secretKey = secretKeySetting.value;
    }

    if (encryptionKeySetting?.value) {
      encryptionKey = encryptionKeySetting.value;
    }
    
    // Second priority: Check environment variables if database values are missing
    if (!publicKey) {
      publicKey = process.env.FLUTTERWAVE_PUBLIC_KEY || '';
    }
    
    if (!secretKey) {
      secretKey = process.env.FLUTTERWAVE_SECRET_KEY || '';
    }

    if (!encryptionKey) {
      encryptionKey = process.env.FLUTTERWAVE_ENCRYPTION_KEY || '';
    }
    
    const testModeSetting = await settingsService.getSettingByKey('FLUTTERWAVE_TEST_MODE');
    const enabledSetting = await settingsService.getSettingByKey('FLUTTERWAVE_ENABLED');
    
    // Create configuration
    const config: FlutterwaveConfig = {
      publicKey,
      secretKey,
      encryptionKey,
      testMode: testModeSetting?.value === 'false' ? false : true, // Default to test mode
      enabled: publicKey && secretKey ? (enabledSetting?.value === 'true' ? true : false) : false // Only enable if we have credentials
    };
    
    // Update cache
    configCache = config;
    cacheExpiry = now + CACHE_TTL;
    
    return config;
  } catch (error) {
    console.error('Error fetching Flutterwave configuration:', error);
    return defaultConfig;
  }
}

/**
 * Save Flutterwave configuration to database
 * @param config Flutterwave configuration object
 */
export async function saveConfig(config: FlutterwaveConfig): Promise<void> {
  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Store the API keys in the database as regular settings
      // This allows them to persist between server restarts
      
      if (config.publicKey) {
        await settingsService.saveSetting({
          key: 'FLUTTERWAVE_PUBLIC_KEY',
          value: config.publicKey,
          description: 'Flutterwave API Public Key',
          category: 'payment',
          isActive: true
        });
      }
      
      if (config.secretKey) {
        await settingsService.saveSetting({
          key: 'FLUTTERWAVE_SECRET_KEY',
          value: config.secretKey,
          description: 'Flutterwave API Secret Key',
          category: 'payment',
          isActive: true
        });
      }

      if (config.encryptionKey) {
        await settingsService.saveSetting({
          key: 'FLUTTERWAVE_ENCRYPTION_KEY',
          value: config.encryptionKey,
          description: 'Flutterwave API Encryption Key',
          category: 'payment',
          isActive: true
        });
      }
      
      // Save other settings
      await settingsService.saveSetting({
        key: 'FLUTTERWAVE_TEST_MODE',
        value: config.testMode ? 'true' : 'false',
        description: 'Whether Flutterwave is in test mode',
        category: 'payment',
        isActive: true
      });
      
      await settingsService.saveSetting({
        key: 'FLUTTERWAVE_ENABLED',
        value: config.enabled ? 'true' : 'false',
        description: 'Whether Flutterwave payment is enabled',
        category: 'payment',
        isActive: true
      });
    });
    
    // Clear cache to ensure new settings are used
    configCache = null;
    
    console.log('Flutterwave configuration saved to database');
    
  } catch (error) {
    console.error('Error saving Flutterwave configuration:', error);
    throw error;
  }
}

/**
 * Set and save Flutterwave configuration
 * @param config Flutterwave configuration object
 */
export async function setConfig(config: FlutterwaveConfig): Promise<void> {
  // Save configuration to database
  await saveConfig(config);
  
  // Update cache immediately for subsequent calls
  configCache = config;
  cacheExpiry = Date.now() + CACHE_TTL;
}

/**
 * Create Flutterwave SDK instance
 * @param config Flutterwave configuration
 * @returns Flutterwave SDK instance
 */
function createFlutterwaveInstance(config: FlutterwaveConfig): Flutterwave {
  return new Flutterwave(config.publicKey, config.secretKey);
}

/**
 * Test Flutterwave API connection
 * @param tempConfig Optional temporary configuration for testing without saving
 * @returns Test result with success flag and message
 */
export async function testConnection(tempConfig?: FlutterwaveConfig): Promise<{ success: boolean; message: string }> {
  try {
    // Use provided temporary config or get from storage
    const config = tempConfig || await getConfig();
    
    // Check if configuration is set
    if (!config.publicKey || !config.secretKey) {
      return {
        success: false,
        message: 'Flutterwave credentials are not configured.'
      };
    }
    
    // Create Flutterwave instance
    const flw = createFlutterwaveInstance(config);
    
    // Try to make a simple API call to test the connection
    // We'll use the banks endpoint for this test
    try {
      const response = await flw.Banks.country('NG');
      
      if (response.status === 'success') {
        return {
          success: true,
          message: `Successfully connected to Flutterwave API in ${config.testMode ? 'test' : 'live'} mode.`
        };
      } else {
        return {
          success: false,
          message: `Failed to connect to Flutterwave API: ${response.message || 'Unknown error'}`
        };
      }
    } catch (apiError) {
      console.error('Flutterwave API error:', apiError);
      return {
        success: false,
        message: `Failed to connect to Flutterwave API: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`
      };
    }
  } catch (error) {
    console.error('Error testing Flutterwave connection:', error instanceof Error ? error.message : 'Unknown error');
    
    return {
      success: false,
      message: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
}

/**
 * Generate a unique transaction reference
 * @returns Unique transaction reference string
 */
function generateTransactionReference(): string {
  return `TSK-FLW-${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
}

/**
 * Prepare a payment link for Flutterwave
 * @param amount Amount to charge
 * @param userId User making the purchase
 * @param packageId Token package being purchased
 * @param userEmail User's email address
 * @param userName User's name
 * @returns Payment link details
 */
export async function createPaymentLink(
  amount: number,
  userId: number,
  packageId: number,
  userEmail: string,
  userName: string
): Promise<{ paymentLink: string; txRef: string }> {
  try {
    const config = await getConfig();
    
    if (!config.enabled) {
      throw new Error('Flutterwave payments are currently disabled.');
    }
    
    if (!config.publicKey || !config.secretKey) {
      throw new Error('Flutterwave API keys are not configured.');
    }
    
    // Generate a unique transaction reference
    const txRef = generateTransactionReference();
    
    // Base URL for redirect
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    
    // Create payment link data
    const payload = {
      tx_ref: txRef,
      amount: amount.toFixed(2),
      currency: 'USD',
      payment_options: 'card,banktransfer',
      redirect_url: `${baseUrl}/payment/flutterwave/callback`,
      customer: {
        email: userEmail,
        name: userName
      },
      meta: {
        userId: userId,
        packageId: packageId
      },
      customizations: {
        title: 'TSK Platform',
        description: `Purchase of Token Package #${packageId}`,
        logo: `${baseUrl}/logo.png`
      }
    };
    
    // Make API request to create payment link
    const response = await axios.post(
      'https://api.flutterwave.com/v3/payments',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.secretKey}`
        }
      }
    );
    
    if (response.data.status === 'success') {
      return {
        paymentLink: response.data.data.link,
        txRef
      };
    } else {
      throw new Error(response.data.message || 'Failed to create payment link');
    }
  } catch (error) {
    console.error('Error creating Flutterwave payment link:', error);
    throw error;
  }
}

/**
 * Verify a Flutterwave transaction
 * @param transactionId Transaction ID to verify
 * @returns Verification result
 */
export async function verifyTransaction(transactionId: string): Promise<{
  success: boolean;
  amount: number;
  currency: string;
  status: string;
  txRef: string;
  meta: any;
  fullDetails: any;
}> {
  try {
    const config = await getConfig();
    
    if (!config.secretKey) {
      throw new Error('Flutterwave secret key is not configured.');
    }
    
    // Create Flutterwave instance
    const flw = createFlutterwaveInstance(config);
    
    // Verify the transaction
    const response = await flw.Transaction.verify({ id: transactionId });
    
    if (response.status === 'success' && response.data.status === 'successful') {
      return {
        success: true,
        amount: parseFloat(response.data.amount),
        currency: response.data.currency,
        status: response.data.status,
        txRef: response.data.tx_ref,
        meta: response.data.meta || {},
        fullDetails: response.data
      };
    } else {
      return {
        success: false,
        amount: 0,
        currency: '',
        status: response.data?.status || 'failed',
        txRef: response.data?.tx_ref || '',
        meta: response.data?.meta || {},
        fullDetails: response.data || {}
      };
    }
  } catch (error) {
    console.error('Error verifying Flutterwave transaction:', error);
    throw error;
  }
}

/**
 * Clear configuration cache
 */
export function clearCache(): void {
  configCache = null;
  cacheExpiry = 0;
}

/**
 * Get full Flutterwave configuration with additional UI settings
 * @returns Full configuration object for admin UI
 */
export async function getFullConfig(): Promise<{
  publicKey: string;
  secretKey: string;
  encryptionKey: string;
  testMode: boolean;
  enabled: boolean;
  uiLabel: string;
  description: string;
  processingFee: number;
  position: number;
}> {
  // Get base configuration
  const baseConfig = await getConfig();
  
  try {
    // Get additional settings
    const label = await settingsService.getSettingByKey('FLUTTERWAVE_UI_LABEL');
    const description = await settingsService.getSettingByKey('FLUTTERWAVE_DESCRIPTION');
    const feeStr = await settingsService.getSettingByKey('FLUTTERWAVE_PROCESSING_FEE');
    const positionStr = await settingsService.getSettingByKey('FLUTTERWAVE_POSITION');
    
    // Return extended configuration
    return {
      ...baseConfig,
      uiLabel: label?.value || 'Flutterwave',
      description: description?.value || 'Pay with card, bank transfer or mobile money',
      processingFee: feeStr?.value ? parseFloat(feeStr.value) : 0,
      position: positionStr?.value ? parseInt(positionStr.value) : 2
    };
  } catch (error) {
    console.error('Error fetching full Flutterwave configuration:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return default extended config
    return {
      ...baseConfig,
      uiLabel: 'Flutterwave',
      description: 'Pay with card, bank transfer or mobile money',
      processingFee: 0,
      position: 2
    };
  }
}

export default {
  getConfig,
  saveConfig,
  setConfig,
  testConnection,
  createPaymentLink,
  verifyTransaction,
  clearCache,
  getFullConfig
};
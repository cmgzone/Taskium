/**
 * PayPal Service
 * 
 * Service for managing PayPal integration.
 * This service handles configuration, testing, and payment operations for PayPal.
 */

import axios from 'axios';
import { db } from '../db';
import settingsService from './settings-service';

// PayPal configuration
export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  sandboxMode: boolean;
  enabled: boolean;
}

// Cache configuration to reduce database reads
let configCache: PayPalConfig | null = null;
let cacheExpiry: number = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// In-memory storage for temporary test credentials
// Only used when someone is testing credentials through the admin panel
let temporaryTestCredentials: { clientId: string; clientSecret: string } | null = null;

/**
 * Get PayPal configuration from database
 * @returns PayPal configuration object
 */
export async function getConfig(): Promise<PayPalConfig> {
  // Use cache if available and not expired
  const now = Date.now();
  if (configCache && cacheExpiry > now) {
    return configCache;
  }
  
  // Default configuration
  const defaultConfig: PayPalConfig = {
    clientId: '',
    clientSecret: '',
    sandboxMode: true,
    enabled: false
  };
  
  try {
    // Try to get API keys from settings
    let clientId = '';
    let clientSecret = '';
    
    // First priority: Check if we have keys stored in the database
    const clientIdSetting = await settingsService.getSettingByKey('PAYPAL_CLIENT_ID');
    const clientSecretSetting = await settingsService.getSettingByKey('PAYPAL_CLIENT_SECRET');
    
    if (clientIdSetting?.value) {
      clientId = clientIdSetting.value;
    }
    
    if (clientSecretSetting?.value) {
      clientSecret = clientSecretSetting.value;
    }
    
    // Second priority: Check environment variables if database values are missing
    if (!clientId) {
      clientId = process.env.PAYPAL_CLIENT_ID || '';
    }
    
    if (!clientSecret) {
      clientSecret = process.env.PAYPAL_CLIENT_SECRET || '';
    }
    
    const sandboxModeStr = await settingsService.getSettingByKey('PAYPAL_SANDBOX_MODE');
    const enabledStr = await settingsService.getSettingByKey('PAYPAL_ENABLED');
    
    // Create configuration
    const config: PayPalConfig = {
      clientId,
      clientSecret,
      sandboxMode: sandboxModeStr?.value === 'false' ? false : true, // Default to sandbox mode
      enabled: clientId && clientSecret ? (enabledStr?.value === 'true' ? true : false) : false // Only enable if we have credentials
    };
    
    // Update cache
    configCache = config;
    cacheExpiry = now + CACHE_TTL;
    
    return config;
  } catch (error) {
    console.error('Error fetching PayPal configuration:', error);
    return defaultConfig;
  }
}

/**
 * Save PayPal configuration to database
 * @param config PayPal configuration object
 */
/**
 * Store temporary test credentials in memory
 * These will be used until the server restarts
 * @param clientId PayPal Client ID
 * @param clientSecret PayPal Client Secret
 */
export function setTemporaryTestCredentials(clientId: string, clientSecret: string): void {
  temporaryTestCredentials = { clientId, clientSecret };
  // Clear config cache to ensure the new credentials are used
  clearCache();
  console.log('Temporary PayPal test credentials have been set');
}

/**
 * Clear temporary test credentials from memory
 */
export function clearTemporaryTestCredentials(): void {
  temporaryTestCredentials = null;
  // Clear config cache to ensure the credentials are no longer used
  clearCache();
  console.log('Temporary PayPal test credentials have been cleared');
}

export async function saveConfig(config: PayPalConfig): Promise<void> {
  try {
    // Start a transaction
    await db.transaction(async (tx) => {
      // Store the API keys in the database as regular settings
      // This allows them to persist between server restarts
      
      if (config.clientId) {
        await settingsService.saveSetting({
          key: 'PAYPAL_CLIENT_ID',
          value: config.clientId,
          description: 'PayPal API Client ID',
          category: 'payment',
          isActive: true
        });
      }
      
      if (config.clientSecret) {
        await settingsService.saveSetting({
          key: 'PAYPAL_CLIENT_SECRET',
          value: config.clientSecret,
          description: 'PayPal API Client Secret',
          category: 'payment',
          isActive: true
        });
      }
      
      // Save other settings
      await settingsService.saveSetting({
        key: 'PAYPAL_SANDBOX_MODE',
        value: config.sandboxMode ? 'true' : 'false',
        description: 'Whether PayPal is in sandbox (test) mode',
        category: 'payment',
        isActive: true
      });
      
      await settingsService.saveSetting({
        key: 'PAYPAL_ENABLED',
        value: config.enabled ? 'true' : 'false',
        description: 'Whether PayPal payment is enabled',
        category: 'payment',
        isActive: true
      });
    });
    
    // Clear cache to ensure new settings are used
    configCache = null;
    
    console.log('PayPal configuration saved to database');
    
  } catch (error) {
    console.error('Error saving PayPal configuration:', error);
    throw error;
  }
}

/**
 * Set and save PayPal configuration
 * @param config PayPal configuration object
 */
export async function setConfig(config: PayPalConfig): Promise<void> {
  // Save configuration to database
  await saveConfig(config);
  
  // Update cache immediately for subsequent calls
  configCache = config;
  cacheExpiry = Date.now() + CACHE_TTL;
}

/**
 * Get PayPal API base URL based on mode
 * @param sandboxMode Whether to use sandbox or production
 * @returns API base URL
 */
function getApiBaseUrl(sandboxMode: boolean): string {
  return sandboxMode
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';
}

/**
 * Get PayPal API access token
 * @param config PayPal configuration object
 * @returns Access token or null if failed
 */
async function getAccessToken(config: PayPalConfig): Promise<string | null> {
  try {
    const auth = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64');
    const url = `${getApiBaseUrl(config.sandboxMode)}/v1/oauth2/token`;
    
    const response = await axios.post(
      url,
      'grant_type=client_credentials',
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${auth}`
        }
      }
    );
    
    return response.data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    return null;
  }
}

/**
 * Test PayPal API connection
 * @param tempConfig Optional temporary configuration for testing without saving
 * @returns Test result with success flag and message
 */
export async function testConnection(tempConfig?: PayPalConfig): Promise<{ success: boolean; message: string }> {
  try {
    // Use provided temporary config or get from storage
    const config = tempConfig || await getConfig();
    
    // Check if configuration is set
    if (!config.clientId || !config.clientSecret) {
      return {
        success: false,
        message: 'PayPal credentials are not configured.'
      };
    }
    
    // Try to get an access token to test the connection
    const accessToken = await getAccessToken(config);
    
    if (!accessToken) {
      return {
        success: false,
        message: 'Failed to authenticate with PayPal API. Check your credentials.'
      };
    }
    
    return {
      success: true,
      message: `Successfully connected to PayPal API in ${config.sandboxMode ? 'sandbox' : 'production'} mode.`
    };
  } catch (error) {
    console.error('Error testing PayPal connection:', error instanceof Error ? error.message : 'Unknown error');
    let errorMessage = 'Unknown error';
    
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'response' in error) {
      const axiosError = error as any;
      errorMessage = axiosError.response?.data?.error_description || errorMessage;
    }
    
    return {
      success: false,
      message: `Connection failed: ${errorMessage}`
    };
  }
}

/**
 * Create a PayPal order
 * @param amount Amount to charge in USD
 * @param userId User making the purchase
 * @param packageId Token package being purchased
 * @returns Created order ID and approval URL
 */
export async function createOrder(
  amount: number,
  userId: number,
  packageId: number
): Promise<{ orderId: string; approvalUrl: string }> {
  try {
    const config = await getConfig();
    
    if (!config.enabled) {
      throw new Error('PayPal payments are currently disabled.');
    }
    
    const accessToken = await getAccessToken(config);
    if (!accessToken) {
      throw new Error('Failed to authenticate with PayPal API.');
    }
    
    // Format amount correctly
    const formattedAmount = amount.toFixed(2);
    
    // Create the order
    const url = `${getApiBaseUrl(config.sandboxMode)}/v2/checkout/orders`;
    const response = await axios.post(
      url,
      {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'USD',
              value: formattedAmount
            },
            description: `Token Package #${packageId}`,
            custom_id: `user_${userId}_package_${packageId}`
          }
        ],
        application_context: {
          return_url: `${process.env.APP_URL || 'http://localhost:3000'}/payment/success`,
          cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/payment/cancel`
        }
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    // Extract order ID and approval URL
    const orderId = response.data.id;
    const approvalLink = response.data.links.find((link: { rel: string; href: string }) => link.rel === 'approve');
    const approvalUrl = approvalLink ? approvalLink.href : '';
    
    if (!approvalUrl) {
      throw new Error('No approval URL found in PayPal response.');
    }
    
    return { orderId, approvalUrl };
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    throw error;
  }
}

/**
 * Capture a PayPal order (complete the payment)
 * @param orderId PayPal order ID to capture
 * @returns Capture result details
 */
export async function captureOrder(orderId: string): Promise<{
  success: boolean;
  transactionId: string;
  amount: string;
  currency: string;
  status: string;
  tokenPackageId: number;
  paymentDetails: any;
}> {
  try {
    const config = await getConfig();
    const accessToken = await getAccessToken(config);
    
    if (!accessToken) {
      throw new Error('Failed to authenticate with PayPal API.');
    }
    
    // First get order details to extract custom ID (contains token package ID)
    const orderUrl = `${getApiBaseUrl(config.sandboxMode)}/v2/checkout/orders/${orderId}`;
    const orderResponse = await axios.get(
      orderUrl,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    // Extract token package ID from custom_id field
    const orderData = orderResponse.data;
    const customId = orderData.purchase_units[0]?.custom_id || '';
    // Format should be "user_X_package_Y" - extract package ID
    const packageIdMatch = customId.match(/package_(\d+)$/);
    const tokenPackageId = packageIdMatch ? parseInt(packageIdMatch[1]) : 0;
    
    if (!tokenPackageId) {
      console.warn('Could not extract token package ID from PayPal order:', customId);
    }
    
    // Capture the order
    const captureUrl = `${getApiBaseUrl(config.sandboxMode)}/v2/checkout/orders/${orderId}/capture`;
    const response = await axios.post(
      captureUrl,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    // Extract transaction details
    const captureData = response.data;
    const captureId = captureData.purchase_units[0].payments.captures[0].id;
    const amount = captureData.purchase_units[0].payments.captures[0].amount.value;
    const currency = captureData.purchase_units[0].payments.captures[0].amount.currency_code;
    const status = captureData.status;
    
    return {
      success: status === 'COMPLETED',
      transactionId: captureId,
      amount,
      currency,
      status,
      tokenPackageId,
      paymentDetails: captureData // Return full PayPal payment details for storage
    };
  } catch (error) {
    console.error('Error capturing PayPal order:', error);
    throw error;
  }
}

/**
 * Check the status of a PayPal order
 * @param orderId PayPal order ID to check
 * @returns Status of the order
 */
export async function checkOrderStatus(orderId: string): Promise<{
  status: string;
  approved: boolean;
  cancelled: boolean;
  completed: boolean;
  orderId: string;
}> {
  try {
    const orderDetails = await getOrderDetails(orderId);
    const status = orderDetails.status || 'UNKNOWN';
    
    return {
      status,
      approved: status === 'APPROVED' || status === 'COMPLETED',
      cancelled: status === 'VOIDED' || status === 'CANCELLED',
      completed: status === 'COMPLETED',
      orderId
    };
  } catch (error) {
    console.error('Error checking PayPal order status:', error);
    return {
      status: 'ERROR',
      approved: false,
      cancelled: false,
      completed: false,
      orderId
    };
  }
}

/**
 * Get details of a PayPal order
 * @param orderId PayPal order ID
 * @returns Order details
 */
export async function getOrderDetails(orderId: string): Promise<any> {
  try {
    const config = await getConfig();
    const accessToken = await getAccessToken(config);
    
    if (!accessToken) {
      throw new Error('Failed to authenticate with PayPal API.');
    }
    
    // Get order details
    const url = `${getApiBaseUrl(config.sandboxMode)}/v2/checkout/orders/${orderId}`;
    const response = await axios.get(
      url,
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Error getting PayPal order details:', error);
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
 * Get full PayPal configuration with additional UI settings
 * @returns Full configuration object for admin UI
 */
export async function getFullConfig(): Promise<{
  clientId: string;
  clientSecret: string;
  sandboxMode: boolean;
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
    const label = await settingsService.getSettingByKey('PAYPAL_UI_LABEL');
    const description = await settingsService.getSettingByKey('PAYPAL_DESCRIPTION');
    const feeStr = await settingsService.getSettingByKey('PAYPAL_PROCESSING_FEE');
    const positionStr = await settingsService.getSettingByKey('PAYPAL_POSITION');
    
    // Return extended configuration
    return {
      ...baseConfig,
      uiLabel: label?.value || 'PayPal',
      description: description?.value || 'Pay securely with PayPal',
      processingFee: feeStr?.value ? parseFloat(feeStr.value) : 0,
      position: positionStr?.value ? parseInt(positionStr.value) : 1
    };
  } catch (error) {
    console.error('Error fetching full PayPal configuration:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return default extended config
    return {
      ...baseConfig,
      uiLabel: 'PayPal',
      description: 'Pay securely with PayPal',
      processingFee: 0,
      position: 1
    };
  }
}

export default {
  getConfig,
  saveConfig,
  setConfig,
  testConnection,
  createOrder,
  captureOrder,
  getOrderDetails,
  checkOrderStatus,
  clearCache,
  getFullConfig,
  setTemporaryTestCredentials,
  clearTemporaryTestCredentials
};
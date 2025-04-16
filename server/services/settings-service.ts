/**
 * Settings Service
 * 
 * Service for managing system settings and secrets.
 * This service handles all operations related to system configuration.
 */

import { db } from '../db';
import { 
  systemSettings, 
  systemSecrets,
  SystemSecret,
  SystemSetting
} from '../../shared/schema';
import { eq, and, desc, asc } from 'drizzle-orm';
import { decryptData, encryptData } from './encryption-service';

/**
 * Get all system settings
 * @returns Array of all system settings
 */
export async function getAllSettings(): Promise<SystemSetting[]> {
  try {
    return await db.query.systemSettings.findMany({
      orderBy: [
        asc(systemSettings.category),
        asc(systemSettings.key)
      ]
    });
  } catch (error) {
    console.error('Error fetching all settings:', error);
    return [];
  }
}

/**
 * Get system settings by category
 * @param category The category to filter by
 * @returns Array of settings in the specified category
 */
export async function getSettingsByCategory(category: string): Promise<SystemSetting[]> {
  try {
    return await db.query.systemSettings.findMany({
      where: eq(systemSettings.category, category),
      orderBy: asc(systemSettings.key)
    });
  } catch (error) {
    console.error(`Error fetching settings for category ${category}:`, error);
    return [];
  }
}

/**
 * Get setting by key
 * @param key The unique key identifier
 * @returns The setting or null if not found
 */
export async function getSettingByKey(key: string): Promise<SystemSetting | null> {
  try {
    const settings = await db.query.systemSettings.findMany({
      where: eq(systemSettings.key, key),
      limit: 1
    });
    
    return settings.length > 0 ? settings[0] : null;
  } catch (error) {
    console.error(`Error fetching setting with key ${key}:`, error);
    return null;
  }
}

/**
 * Save a system setting (create or update)
 * @param setting The setting to save
 * @returns The saved setting
 */
export async function saveSetting(setting: Partial<SystemSetting>): Promise<SystemSetting> {
  try {
    // Check if setting already exists
    const existingSetting = await getSettingByKey(setting.key!);
    
    if (existingSetting) {
      // Update existing setting
      await db.update(systemSettings)
        .set({
          ...setting,
          updatedAt: new Date()
        })
        .where(eq(systemSettings.key, setting.key!));
      
      return { ...existingSetting, ...setting } as SystemSetting;
    } else {
      // Create new setting
      const newSetting = {
        ...setting,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const results = await db.insert(systemSettings).values(newSetting);
      return newSetting as SystemSetting;
    }
  } catch (error) {
    console.error(`Error saving setting ${setting.key}:`, error);
    throw error;
  }
}

/**
 * Delete a system setting
 * @param key The key of the setting to delete
 * @returns True if deleted, false otherwise
 */
export async function deleteSetting(key: string): Promise<boolean> {
  try {
    await db.delete(systemSettings)
      .where(eq(systemSettings.key, key));
    return true;
  } catch (error) {
    console.error(`Error deleting setting ${key}:`, error);
    return false;
  }
}

// SECRETS MANAGEMENT
// =================

/**
 * Get all system secrets
 * @returns Array of all secrets (without decrypted values)
 */
export async function getAllSecrets(): Promise<SystemSecret[]> {
  try {
    return await db.query.systemSecrets.findMany({
      orderBy: [
        asc(systemSecrets.category),
        asc(systemSecrets.key)
      ]
    });
  } catch (error) {
    console.error('Error fetching all secrets:', error);
    return [];
  }
}

/**
 * Get all secret categories
 * @returns Array of unique category names
 */
export async function getSecretCategories(): Promise<string[]> {
  try {
    const results = await db.query.systemSecrets.findMany({
      columns: {
        category: true
      },
      orderBy: asc(systemSecrets.category)
    });
    
    // Extract unique categories
    const categories = new Set<string>();
    results.forEach(result => {
      if (result.category) {
        categories.add(result.category);
      }
    });
    
    return Array.from(categories);
  } catch (error) {
    console.error('Error fetching secret categories:', error);
    return [];
  }
}

/**
 * Get system secrets by category
 * @param category The category to filter by
 * @returns Array of secrets in the specified category
 */
export async function getSecretsByCategory(category: string): Promise<SystemSecret[]> {
  try {
    return await db.query.systemSecrets.findMany({
      where: eq(systemSecrets.category, category),
      orderBy: asc(systemSecrets.key)
    });
  } catch (error) {
    console.error(`Error fetching secrets for category ${category}:`, error);
    return [];
  }
}

/**
 * Get secret by key
 * @param key The unique key identifier
 * @returns The secret or null if not found
 */
export async function getSecretByKey(key: string): Promise<SystemSecret | null> {
  try {
    const secrets = await db.query.systemSecrets.findMany({
      where: eq(systemSecrets.key, key),
      limit: 1
    });
    
    return secrets.length > 0 ? secrets[0] : null;
  } catch (error) {
    console.error(`Error fetching secret with key ${key}:`, error);
    return null;
  }
}

/**
 * Get secret value with decryption if needed
 * @param key The unique key identifier
 * @returns The decrypted value or null if not found
 */
export async function getSecretValue(key: string): Promise<string | null> {
  try {
    const secret = await getSecretByKey(key);
    
    if (!secret || !secret.value) {
      return null;
    }
    
    // If the secret is encrypted, decrypt it
    if (secret.isEncrypted) {
      return await decryptData(secret.value);
    }
    
    // Return the plain value
    return secret.value;
  } catch (error) {
    console.error(`Error getting secret value for ${key}:`, error);
    return null;
  }
}

/**
 * Save a system secret (create or update)
 * @param secret The secret to save
 * @returns The saved secret
 */
export async function saveSecret(secret: Partial<SystemSecret>): Promise<SystemSecret> {
  try {
    // Check if secret already exists
    const existingSecret = await getSecretByKey(secret.key!);
    
    if (existingSecret) {
      // If no new value is provided, keep the existing one
      if (secret.value === null || secret.value === undefined) {
        secret.value = existingSecret.value;
        secret.isEncrypted = existingSecret.isEncrypted;
      }
      
      // Update existing secret
      await db.update(systemSecrets)
        .set({
          ...secret,
          updatedAt: new Date()
        })
        .where(eq(systemSecrets.key, secret.key!));
      
      return { ...existingSecret, ...secret } as SystemSecret;
    } else {
      // Create new secret
      const newSecret = {
        ...secret,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const results = await db.insert(systemSecrets).values(newSecret);
      return newSecret as SystemSecret;
    }
  } catch (error) {
    console.error(`Error saving secret ${secret.key}:`, error);
    throw error;
  }
}

/**
 * Delete a system secret
 * @param key The key of the secret to delete
 * @returns True if deleted, false otherwise
 */
export async function deleteSecret(key: string): Promise<boolean> {
  try {
    await db.delete(systemSecrets)
      .where(eq(systemSecrets.key, key));
    return true;
  } catch (error) {
    console.error(`Error deleting secret ${key}:`, error);
    return false;
  }
}

export default {
  // Settings
  getAllSettings,
  getSettingsByCategory,
  getSettingByKey,
  saveSetting,
  deleteSetting,
  
  // Secrets
  getAllSecrets,
  getSecretCategories,
  getSecretsByCategory,
  getSecretByKey,
  getSecretValue,
  saveSecret,
  deleteSecret
};
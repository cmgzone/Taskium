/**
 * Encryption Service
 * 
 * Provides utilities for encrypting and decrypting sensitive data.
 * Uses Node.js built-in crypto module for secure cryptographic operations.
 */

import {
  scrypt,
  randomBytes,
  createCipheriv,
  createDecipheriv,
  createHash,
  timingSafeEqual
} from 'crypto';
import { promisify } from 'util';

// Use promisify for better async handling
const scryptAsync = promisify(scrypt);

// Encryption constants - ideally, move these to environment variables
const ENCRYPTION_KEY_SIZE = 32; // 256 bits key size
const ENCRYPTION_ALGO = 'aes-256-gcm'; // AES-GCM is authenticated encryption
const ENCRYPTION_IV_SIZE = 16;
const ENCRYPTION_AUTH_TAG_SIZE = 16;
const SALT_SIZE = 16;

// Use an environment variable for the encryption key seed or a fallback seed
// This should be a secure, high-entropy value in production
const ENCRYPTION_SEED = process.env.ENCRYPTION_KEY_SEED || 'TSK_platform_encryption_seed_CHANGE_ME';

/**
 * Derive an encryption key from a seed value
 * 
 * @returns The derived encryption key
 */
async function getEncryptionKey(): Promise<Buffer> {
  // Generate a fixed salt from the app name to ensure consistent key derivation
  const salt = createHash('sha256').update('TSK_fixed_salt').digest().subarray(0, SALT_SIZE);
  
  try {
    // Derive encryption key using scrypt
    return await scryptAsync(ENCRYPTION_SEED, salt, ENCRYPTION_KEY_SIZE) as Buffer;
  } catch (error) {
    console.error('Error deriving encryption key:', error);
    throw new Error('Failed to initialize encryption system');
  }
}

/**
 * Encrypt sensitive data
 * 
 * @param data The plaintext data to encrypt
 * @returns The encrypted data in format: iv.authTag.encryptedData (base64)
 */
export async function encryptData(data: string): Promise<string> {
  try {
    // Get the encryption key
    const key = await getEncryptionKey();
    
    // Generate a random initialization vector
    const iv = randomBytes(ENCRYPTION_IV_SIZE);
    
    // Create cipher
    const cipher = createCipheriv(ENCRYPTION_ALGO, key, iv);
    
    // Encrypt the data
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    
    // Get authentication tag
    const authTag = cipher.getAuthTag();
    
    // Combine IV, authentication tag, and encrypted data
    const result = Buffer.concat([
      iv,
      authTag,
      encrypted
    ]).toString('base64');
    
    return result;
  } catch (error) {
    console.error('Error encrypting data:', error);
    throw new Error('Encryption failed');
  }
}

/**
 * Decrypt encrypted data
 * 
 * @param encryptedData The encrypted data in format: iv.authTag.encryptedData (base64)
 * @returns The decrypted plaintext data
 */
export async function decryptData(encryptedData: string): Promise<string> {
  try {
    // Get the encryption key
    const key = await getEncryptionKey();
    
    // Convert from base64 to buffer
    const buffer = Buffer.from(encryptedData, 'base64');
    
    // Extract IV, auth tag, and encrypted data
    const iv = buffer.subarray(0, ENCRYPTION_IV_SIZE);
    const authTag = buffer.subarray(ENCRYPTION_IV_SIZE, ENCRYPTION_IV_SIZE + ENCRYPTION_AUTH_TAG_SIZE);
    const encrypted = buffer.subarray(ENCRYPTION_IV_SIZE + ENCRYPTION_AUTH_TAG_SIZE);
    
    // Create decipher
    const decipher = createDecipheriv(ENCRYPTION_ALGO, key, iv);
    
    // Set auth tag
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ]);
    
    return decrypted.toString('utf8');
  } catch (error) {
    console.error('Error decrypting data:', error);
    throw new Error('Decryption failed');
  }
}

/**
 * Encrypt a password using a proper password hashing algorithm
 * 
 * @param password The plaintext password
 * @returns The hashed password with salt
 */
export async function hashPassword(password: string): Promise<string> {
  // Generate a random salt
  const salt = randomBytes(SALT_SIZE).toString('hex');
  
  // Hash the password with the salt
  const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
  
  // Combine the derived key and salt
  return `${derivedKey.toString('hex')}.${salt}`;
}

/**
 * Verify a password against a stored hash
 * 
 * @param password The plaintext password to check
 * @param storedHash The stored password hash
 * @returns True if the password matches, false otherwise
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    // Extract the salt from the stored hash
    const parts = storedHash.split('.');
    const salt = parts[1];
    const storedHashBuffer = Buffer.from(parts[0], 'hex');
    
    // Hash the provided password with the same salt
    const derivedKey = await scryptAsync(password, salt, 64) as Buffer;
    
    // Compare the hashes using constant-time comparison to prevent timing attacks
    return timingSafeEqual(storedHashBuffer, derivedKey);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
}

export default {
  encryptData,
  decryptData,
  hashPassword,
  verifyPassword
};
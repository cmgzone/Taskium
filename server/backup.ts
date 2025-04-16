import { db } from './db';
import { Express, Request, Response } from 'express';
import { users, referrals, miningHistory, notifications } from '../shared/schema';
import { sql } from 'drizzle-orm';
import { eq } from 'drizzle-orm';

/**
 * Creates a full system backup including all database tables and configuration
 */
export async function createSystemBackup(req: Request, res: Response) {
  try {
    const usersData = await db.select().from(users);
    // Get user settings using raw SQL since the table might not be in the schema
    const userSettingsData = await db.execute(sql`SELECT * FROM user_settings`);
    // Get mining data using raw SQL
    const miningData = await db.execute(sql`SELECT * FROM user_mining`);
    const miningHistoryData = await db.select().from(miningHistory);
    const notificationsData = await db.select().from(notifications);
    const referralsData = await db.select().from(referrals);
    
    // Get all mining settings
    const miningSettings = await db.execute(sql`SELECT * FROM mining_settings`);

    // Get all platform settings
    const platformSettings = await db.execute(sql`SELECT * FROM platform_settings`);

    // Get all blockchain settings
    const blockchainSettings = await db.execute(sql`SELECT * FROM blockchain_settings`);

    // Get all premium packages
    const premiumPackages = await db.execute(sql`SELECT * FROM premium_packages`);

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      database: {
        users: usersData,
        userSettings: userSettingsData,
        userMining: miningData,
        miningHistory: miningHistoryData,
        notifications: notificationsData,
        referrals: referralsData,
      },
      settings: {
        mining: miningSettings,
        platform: platformSettings,
        blockchain: blockchainSettings,
        premium: premiumPackages,
      }
    };

    return res.status(200).json(backup);
  } catch (error) {
    console.error("Error creating system backup:", error);
    return res.status(500).json({ message: "Failed to create system backup" });
  }
}

/**
 * Creates a backup of only the database
 */
export async function createDatabaseBackup(req: Request, res: Response) {
  try {
    // Get all tables
    const usersData = await db.select().from(users);
    // Get user settings using raw SQL since the table might not be in the schema
    const userSettingsData = await db.execute(sql`SELECT * FROM user_settings`);
    // Get mining data using raw SQL
    const miningData = await db.execute(sql`SELECT * FROM user_mining`);
    const miningHistoryData = await db.select().from(miningHistory);
    const notificationsData = await db.select().from(notifications);
    const referralsData = await db.select().from(referrals);
    
    // Execute raw SQL for tables not defined in the schema
    const advertisingData = await db.execute(sql`SELECT * FROM advertisements`);
    const marketplaceData = await db.execute(sql`SELECT * FROM marketplace_listings`);
    const eventsData = await db.execute(sql`SELECT * FROM events`);
    const tasksData = await db.execute(sql`SELECT * FROM tasks`);
    const kycData = await db.execute(sql`SELECT * FROM kyc_verifications`);

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      tables: {
        users: usersData,
        userSettings: userSettingsData,
        userMining: miningData,
        miningHistory: miningHistoryData,
        notifications: notificationsData,
        referrals: referralsData,
        advertisements: advertisingData,
        marketplace: marketplaceData,
        events: eventsData,
        tasks: tasksData,
        kyc: kycData,
      }
    };

    return res.status(200).json(backup);
  } catch (error) {
    console.error("Error creating database backup:", error);
    return res.status(500).json({ message: "Failed to create database backup" });
  }
}

/**
 * Creates a backup of only the configuration settings
 */
export async function createConfigBackup(req: Request, res: Response) {
  try {
    // Get all settings tables
    const miningSettings = await db.execute(sql`SELECT * FROM mining_settings`);
    const platformSettings = await db.execute(sql`SELECT * FROM platform_settings`);
    const blockchainSettings = await db.execute(sql`SELECT * FROM blockchain_settings`);
    const featureFlags = await db.execute(sql`SELECT * FROM feature_flags`);
    const adSettings = await db.execute(sql`SELECT * FROM ad_settings`);
    const systemConfig = await db.execute(sql`SELECT * FROM system_config`);

    // Create backup object
    const backup = {
      timestamp: new Date().toISOString(),
      version: "1.0",
      config: {
        mining: miningSettings,
        platform: platformSettings,
        blockchain: blockchainSettings,
        features: featureFlags,
        advertising: adSettings,
        system: systemConfig,
      }
    };

    return res.status(200).json(backup);
  } catch (error) {
    console.error("Error creating configuration backup:", error);
    return res.status(500).json({ message: "Failed to create configuration backup" });
  }
}

/**
 * Manually regenerates the project ZIP file
 * Note: This functionality is currently disabled to optimize space
 */
export async function regenerateProjectZip(req: Request, res: Response) {
  return res.status(200).json({ 
    success: false, 
    message: 'Project ZIP generation is currently disabled to optimize space',
  });
}

/**
 * Registers all backup-related routes
 */
export function registerBackupRoutes(app: Express) {
  // Only admin users can access these routes - ensure middleware is applied
  app.get('/api/admin/backup/system', createSystemBackup);
  app.get('/api/admin/backup/database', createDatabaseBackup);  
  app.get('/api/admin/backup/config', createConfigBackup);
  app.post('/api/admin/backup/regenerate-project-zip', regenerateProjectZip);
}
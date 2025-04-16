import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema';

async function initDatabase() {
  console.log('Starting database initialization...');
  
  // Connect to the database using environment variable
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL environment variable is not set');
    process.exit(1);
  }
  
  // Create connection pool
  const pool = new Pool({ connectionString });
  
  try {
    // Initialize Drizzle ORM
    const db = drizzle(pool, { schema });
    
    // Test connection
    const client = await pool.connect();
    try {
      console.log('Successfully connected to the database');
      
      // Check if users table exists
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);
      
      if (rows[0].exists) {
        console.log('Users table already exists');
      } else {
        console.log('Creating database tables...');
        
        // Create tables using raw SQL (since we don't have migrations set up yet)
        // In a production environment, you would use proper migrations
        
        // Users table
        await client.query(`
          CREATE TABLE "users" (
            "id" SERIAL PRIMARY KEY,
            "username" TEXT NOT NULL UNIQUE,
            "password_hash" TEXT NOT NULL,
            "email" TEXT UNIQUE,
            "full_name" TEXT,
            "wallet_address" TEXT,
            "wallet_type" TEXT,
            "token_balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
            "mining_rate" DOUBLE PRECISION NOT NULL DEFAULT 1,
            "last_mining_date" TIMESTAMP,
            "mining_streak" INTEGER DEFAULT 0,
            "referral_code" TEXT NOT NULL UNIQUE,
            "registered_with_referral" TEXT,
            "role" TEXT NOT NULL DEFAULT 'user',
            "profile_picture_url" TEXT,
            "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        
        // Onboarding preferences table
        await client.query(`
          CREATE TABLE "onboarding_preferences" (
            "id" SERIAL PRIMARY KEY,
            "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
            "interests" JSONB DEFAULT '[]',
            "experience_level" TEXT DEFAULT 'beginner',
            "learning_style" TEXT,
            "disable_onboarding" BOOLEAN DEFAULT FALSE,
            "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
            "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        
        // Mining history table
        await client.query(`
          CREATE TABLE "mining_history" (
            "id" SERIAL PRIMARY KEY,
            "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
            "amount" DOUBLE PRECISION NOT NULL,
            "timestamp" TIMESTAMP NOT NULL DEFAULT NOW(),
            "bonus_type" TEXT,
            "bonus_amount" DOUBLE PRECISION DEFAULT 0,
            "streak_day" INTEGER DEFAULT 1,
            "source" TEXT DEFAULT 'manual'
          )
        `);
        
        // Mining settings table
        await client.query(`
          CREATE TABLE "mining_settings" (
            "id" SERIAL PRIMARY KEY,
            "enablestreakbonus" BOOLEAN NOT NULL DEFAULT TRUE,
            "streakbonuspercentperday" INTEGER NOT NULL DEFAULT 5,
            "maxstreakdays" INTEGER NOT NULL DEFAULT 10,
            "streakexpirationhours" INTEGER NOT NULL DEFAULT 48,
            "enabledailybonus" BOOLEAN NOT NULL DEFAULT TRUE,
            "dailybonuschance" INTEGER NOT NULL DEFAULT 10,
            "enableautomaticmining" BOOLEAN NOT NULL DEFAULT TRUE,
            "hourlyrewardamount" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
            "dailyactivationrequired" BOOLEAN NOT NULL DEFAULT TRUE,
            "activationexpirationhours" INTEGER NOT NULL DEFAULT 24,
            "updatedat" TIMESTAMP NOT NULL DEFAULT NOW()
          )
        `);
        
        console.log('Database tables created successfully');
        
        // Create initial admin user
        const adminUsername = 'admin';
        const adminEmail = 'admin@tskplatform.com';
        const adminPassword = '$2b$10$gL1c0S4kH/8SKoBlqsQU3uH3HNK1qQu/N.LO6g8PVJ.f5N4oITGLu'; // bcrypt hash for 'admin123'
        const adminReferralCode = 'ADMIN2025';
        
        await client.query(`
          INSERT INTO "users" (
            "username", "password_hash", "email", "role", "token_balance", "referral_code", "created_at", "updated_at"
          ) VALUES (
            $1, $2, $3, 'admin', 1000, $4, NOW(), NOW()
          ) ON CONFLICT (username) DO NOTHING
        `, [adminUsername, adminPassword, adminEmail, adminReferralCode]);
        
        // Create initial mining settings
        await client.query(`
          INSERT INTO "mining_settings" (
            "enablestreakbonus", "streakbonuspercentperday", "maxstreakdays", "streakexpirationhours",
            "enabledailybonus", "dailybonuschance", "enableautomaticmining", "hourlyrewardamount",
            "dailyactivationrequired", "activationexpirationhours", "updatedat"
          ) VALUES (
            TRUE, 5, 10, 48, TRUE, 10, TRUE, 0.5, TRUE, 24, NOW()
          ) ON CONFLICT (id) DO NOTHING
        `);
        
        console.log('Initial data seeded successfully');
      }
    } finally {
      client.release();
    }
    
    console.log('Database initialization completed successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the initialization function
initDatabase();
// Script to manually apply database migrations

import 'dotenv/config';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import path from 'path';

const { Pool } = pg;

async function applyMigration() {
  console.log('Starting migration...');
  
  try {
    // Connect to the database
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });

    const db = drizzle(pool);

    // Create the user_kyc table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "user_kyc" (
        "id" SERIAL PRIMARY KEY,
        "user_id" INTEGER NOT NULL REFERENCES "users"("id"),
        "status" TEXT NOT NULL DEFAULT 'unverified',
        "full_name" TEXT,
        "country" TEXT,
        "document_type" TEXT,
        "document_id" TEXT,
        "submission_date" TIMESTAMP,
        "verification_date" TIMESTAMP,
        "rejection_reason" TEXT
      );
    `);

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

applyMigration();
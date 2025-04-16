/**
 * Script to create an admin user or promote an existing user to admin
 * Usage:
 * node scripts/create-admin.js <username> <password>
 * 
 * If the user doesn't exist, it creates a new admin user
 * If the user exists, it promotes them to the admin role
 */

import 'dotenv/config';
import pg from 'pg';
import crypto from 'crypto';
import { promisify } from 'util';
import { nanoid } from 'nanoid';

// Connect to the database
const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Utility functions
const scryptAsync = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

function generateReferralCode() {
  return nanoid(10);
}

async function main() {
  try {
    // Get username and password from command line args
    const username = process.argv[2];
    const password = process.argv[3];

    if (!username || !password) {
      console.error('Error: Username and password are required');
      console.log('Usage: node scripts/create-admin.js <username> <password>');
      process.exit(1);
    }

    // Check if the user already exists
    const checkUserQuery = 'SELECT * FROM users WHERE username = $1';
    const existingUser = await pool.query(checkUserQuery, [username]);

    if (existingUser.rows.length > 0) {
      // Update existing user to admin role
      const userId = existingUser.rows[0].id;
      const updateQuery = 'UPDATE users SET role = $1 WHERE id = $2 RETURNING *';
      const result = await pool.query(updateQuery, ['admin', userId]);

      console.log(`User ${username} (ID: ${userId}) promoted to admin role successfully`);
      console.log(result.rows[0]);
    } else {
      // Create a new admin user
      const hashedPassword = await hashPassword(password);
      const insertQuery = `
        INSERT INTO users (
          username, password, token_balance, mining_rate, 
          referral_code, premium_tier, premium_multiplier, role
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      `;
      
      const newUser = await pool.query(insertQuery, [
        username, 
        hashedPassword, 
        0, // token_balance
        1, // mining_rate
        generateReferralCode(), 
        'Basic', // premium_tier
        1, // premium_multiplier
        'admin' // role
      ]);

      console.log(`New admin user created: ${username} (ID: ${newUser.rows[0].id})`);
      
      // Create an initial KYC record with "unverified" status
      const kycQuery = 'INSERT INTO user_kyc (user_id, status) VALUES ($1, $2)';
      await pool.query(kycQuery, [newUser.rows[0].id, 'unverified']);
      
      console.log('Initial unverified KYC record created');
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    // Close the database connection
    await pool.end();
  }
}

main();
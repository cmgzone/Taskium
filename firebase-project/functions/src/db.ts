import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './shared/schema';
import * as functions from 'firebase-functions';

// Get database URL from Firebase Functions config
// (You will need to set this using firebase functions:config:set database.url="postgres://...")
const databaseUrl = process.env.DATABASE_URL || functions.config().database?.url;

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: databaseUrl,
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Time a client can be idle before being closed
  connectionTimeoutMillis: 10000, // Maximum time to wait for a connection
});

// Initialize Drizzle ORM with the schema
export const db = drizzle(pool, { schema });

/**
 * Initialize database and run any necessary migrations or setup
 */
export async function initializeDatabase(): Promise<void> {
  try {
    // Test database connection
    const client = await pool.connect();
    try {
      console.log('Database connection successful');
      
      // In a production environment, you would use an actual migration tool
      // Here we're just making sure the connection works
      
      // Check if tables exist (simple test query)
      const { rows } = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'users'
        )
      `);
      
      if (!rows[0].exists) {
        console.warn('Users table does not exist. Database may need migration.');
      } else {
        console.log('Database schema verified successfully');
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw new Error('Database connection failed');
  }
}

// Add shutdown hook to close pool gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing database connections');
  await pool.end();
});
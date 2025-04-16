import express, { Request, Response } from 'express';
import { db } from '../db';
import { sql } from 'drizzle-orm';

const router = express.Router();

// Public health check endpoint
router.get('/', async (req: Request, res: Response) => {
  try {
    // Basic system info
    const healthData = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.APP_VERSION || '1.0.0',
    };
    
    res.status(200).json(healthData);
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Health check failed'
    });
  }
});

// Database check endpoint
router.get('/db', async (req: Request, res: Response) => {
  try {
    // Simple query to check database connection
    const result = await db.execute(sql`SELECT 1 as connected`);
    
    res.status(200).json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database health check error:', error);
    res.status(500).json({ 
      status: 'error',
      database: 'disconnected',
      message: 'Database connection failed'
    });
  }
});

export default router;
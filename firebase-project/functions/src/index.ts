import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { setupAuth } from './auth';
import { setupStorage } from './storage';
import { setupRoutes } from './routes';
import { initializeDatabase } from './db';

// Initialize Firebase Admin
admin.initializeApp();

// Initialize Express app
const app = express();

// Configure middleware
app.use(cors({ origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize components
setupStorage(app, admin);
setupAuth(app);
setupRoutes(app);

// Error handling middleware
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`Error encountered: ${message}`, err);
  res.status(status).json({ message });
});

// Initialize database when the function starts
const runtimeOpts: functions.RuntimeOptions = {
  timeoutSeconds: 300,
  memory: '1GB'
};

// Create the API function with extended timeout for initial database setup
export const api = functions.runWith(runtimeOpts).https.onRequest(async (request, response) => {
  try {
    // Initialize database on cold start if needed
    await initializeDatabase();
    return app(request, response);
  } catch (error) {
    console.error('Error during initialization:', error);
    response.status(500).json({ message: 'Server initialization error' });
  }
});

// Scheduled function for mining rewards
export const processMiningRewards = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async () => {
    try {
      const { processDailyMiningRewards } = await import('./services/mining-service');
      await processDailyMiningRewards();
      console.log('Daily mining rewards processed successfully');
    } catch (error) {
      console.error('Error processing mining rewards:', error);
    }
    return null;
  });

// Scheduled function for token burning
export const processTokenBurning = functions.pubsub
  .schedule('every 168 hours') // Weekly
  .onRun(async () => {
    try {
      const { processTokenBurning } = await import('./services/token-service');
      await processTokenBurning();
      console.log('Token burning processed successfully');
    } catch (error) {
      console.error('Error processing token burning:', error);
    }
    return null;
  });
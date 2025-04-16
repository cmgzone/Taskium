import { Express } from 'express';

// Import route modules
import { setupUserRoutes } from './routes/user-routes';
import { setupMiningRoutes } from './routes/mining-routes';
import { setupMarketplaceRoutes } from './routes/marketplace-routes';
import { setupAdminRoutes } from './routes/admin-routes';
import { setupTokenRoutes } from './routes/token-routes';
import { setupKycRoutes } from './routes/kyc-routes';
import { setupAdRoutes } from './routes/ad-routes';
import { setupChatRoutes } from './routes/chat-routes';
import { setupAiRoutes } from './routes/ai-routes';
import { setupNotificationRoutes } from './routes/notification-routes';
import { setupReferralRoutes } from './routes/referral-routes';
import { setupEventRoutes } from './routes/event-routes';
import { setupBrandingRoutes } from './routes/branding-routes';
import { setupWalletRoutes } from './routes/wallet-routes';
import { setupDownloadRoutes } from './routes/download-routes';

/**
 * Setup all API routes
 */
export function setupRoutes(app: Express): void {
  // Register all routes
  setupUserRoutes(app);
  setupMiningRoutes(app);
  setupMarketplaceRoutes(app);
  setupAdminRoutes(app);
  setupTokenRoutes(app);
  setupKycRoutes(app);
  setupAdRoutes(app);
  setupChatRoutes(app);
  setupAiRoutes(app);
  setupNotificationRoutes(app);
  setupReferralRoutes(app);
  setupEventRoutes(app);
  setupBrandingRoutes(app);
  setupWalletRoutes(app);
  setupDownloadRoutes(app);
  
  // Add a test endpoint
  app.get('/api/test', (req, res) => {
    res.json({ message: 'API is working!' });
  });
}
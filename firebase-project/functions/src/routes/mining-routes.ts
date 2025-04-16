import { Express, Request, Response } from 'express';
import { db } from '../db';
import { miningHistory, miningSettings, users, eq } from '../shared/schema';

export function setupMiningRoutes(app: Express): void {
  const isAuthenticated = app.get('isAuthenticated');
  const isAdmin = app.get('isAdmin');
  
  // Get mining settings
  app.get('/api/mining/settings', async (req: Request, res: Response) => {
    try {
      const settings = await db.query.miningSettings.findFirst();
      
      if (!settings) {
        // Create default settings if none exist
        const [newSettings] = await db.insert(miningSettings).values({
          enableStreakBonus: true,
          streakBonusPercentPerDay: 5,
          maxStreakDays: 10,
          streakExpirationHours: 48,
          enableDailyBonus: true,
          dailyBonusChance: 10,
          enableAutomaticMining: true,
          hourlyRewardAmount: 0.5,
          dailyActivationRequired: true,
          activationExpirationHours: 24,
          updatedAt: new Date()
        }).returning();
        
        return res.json(newSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error('Error fetching mining settings:', error);
      res.status(500).json({ message: 'Failed to fetch mining settings' });
    }
  });
  
  // Update mining settings (admin only)
  app.patch('/api/admin/mining/settings', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const {
        enableStreakBonus,
        streakBonusPercentPerDay,
        maxStreakDays,
        streakExpirationHours,
        enableDailyBonus,
        dailyBonusChance,
        enableAutomaticMining,
        hourlyRewardAmount,
        dailyActivationRequired,
        activationExpirationHours
      } = req.body;
      
      // Get settings
      const settings = await db.query.miningSettings.findFirst();
      
      if (!settings) {
        return res.status(404).json({ message: 'Mining settings not found' });
      }
      
      // Update settings
      await db.update(miningSettings)
        .set({
          enableStreakBonus: enableStreakBonus !== undefined ? enableStreakBonus : settings.enableStreakBonus,
          streakBonusPercentPerDay: streakBonusPercentPerDay !== undefined ? streakBonusPercentPerDay : settings.streakBonusPercentPerDay,
          maxStreakDays: maxStreakDays !== undefined ? maxStreakDays : settings.maxStreakDays,
          streakExpirationHours: streakExpirationHours !== undefined ? streakExpirationHours : settings.streakExpirationHours,
          enableDailyBonus: enableDailyBonus !== undefined ? enableDailyBonus : settings.enableDailyBonus,
          dailyBonusChance: dailyBonusChance !== undefined ? dailyBonusChance : settings.dailyBonusChance,
          enableAutomaticMining: enableAutomaticMining !== undefined ? enableAutomaticMining : settings.enableAutomaticMining,
          hourlyRewardAmount: hourlyRewardAmount !== undefined ? hourlyRewardAmount : settings.hourlyRewardAmount,
          dailyActivationRequired: dailyActivationRequired !== undefined ? dailyActivationRequired : settings.dailyActivationRequired,
          activationExpirationHours: activationExpirationHours !== undefined ? activationExpirationHours : settings.activationExpirationHours,
          updatedAt: new Date()
        })
        .where(eq(miningSettings.id, settings.id));
      
      // Get updated settings
      const updatedSettings = await db.query.miningSettings.findFirst();
      
      res.json(updatedSettings);
    } catch (error) {
      console.error('Error updating mining settings:', error);
      res.status(500).json({ message: 'Failed to update mining settings' });
    }
  });
  
  // Get mining history for current user
  app.get('/api/mining/history', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 10;
      
      const history = await db.query.miningHistory.findMany({
        where: eq(miningHistory.userId, userId),
        orderBy: (miningHistory) => [miningHistory.timestamp.desc()],
        limit
      });
      
      res.json(history);
    } catch (error) {
      console.error('Error fetching mining history:', error);
      res.status(500).json({ message: 'Failed to fetch mining history' });
    }
  });
  
  // Perform manual mining
  app.post('/api/mining/mine', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      // Get user
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Get mining settings
      const settings = await db.query.miningSettings.findFirst();
      
      if (!settings) {
        return res.status(500).json({ message: 'Mining settings not found' });
      }
      
      // Check if user can mine (implement time restriction logic here)
      // For example, can only mine once per day
      
      // For demonstration, let's assume user can mine
      
      // Calculate mining amount with streak bonus
      let miningAmount = 1.0; // Base amount
      let bonusAmount = 0;
      let bonusType = null;
      let streakDay = 1;
      
      // Check if user has a streak
      const now = new Date();
      const lastMiningDate = user.lastMiningDate;
      let streak = user.miningStreak || 0;
      
      if (lastMiningDate) {
        const hoursSinceLastMining = (now.getTime() - lastMiningDate.getTime()) / (1000 * 60 * 60);
        
        // If within streak expiration period, increment streak
        if (hoursSinceLastMining < settings.streakExpirationHours) {
          streak += 1;
          streakDay = streak;
          
          // Apply streak bonus if enabled
          if (settings.enableStreakBonus) {
            const streakBonus = Math.min(streak * settings.streakBonusPercentPerDay / 100, settings.maxStreakDays * settings.streakBonusPercentPerDay / 100);
            bonusAmount = miningAmount * streakBonus;
            bonusType = 'streak';
          }
        } else {
          // Streak expired, reset to 1
          streak = 1;
          streakDay = 1;
        }
      }
      
      // Apply daily bonus if enabled (random chance)
      if (settings.enableDailyBonus && Math.random() * 100 < settings.dailyBonusChance) {
        const dailyBonus = Math.random() * 0.5; // Random bonus up to 50%
        bonusAmount += miningAmount * dailyBonus;
        bonusType = bonusType ? 'streak_and_daily' : 'daily';
      }
      
      // Calculate total amount
      const totalAmount = miningAmount + bonusAmount;
      
      // Create mining history entry
      await db.insert(miningHistory).values({
        userId,
        amount: totalAmount,
        timestamp: now,
        bonusType,
        bonusAmount,
        streakDay,
        source: 'manual'
      });
      
      // Update user's token balance and streak
      await db.update(users)
        .set({
          tokenBalance: user.tokenBalance + totalAmount,
          miningStreak: streak,
          lastMiningDate: now,
          updatedAt: now
        })
        .where(eq(users.id, userId));
      
      // Get updated user
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          tokenBalance: true,
          miningStreak: true,
          lastMiningDate: true
        }
      });
      
      res.json({
        message: 'Mining successful',
        amount: totalAmount,
        bonusAmount,
        bonusType,
        streakDay,
        updatedBalance: updatedUser?.tokenBalance
      });
    } catch (error) {
      console.error('Error during mining:', error);
      res.status(500).json({ message: 'Mining failed' });
    }
  });
  
  // Get recent mining rewards
  app.get('/api/mining/rewards/recent', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit as string) || 5;
      
      const recentRewards = await db.query.miningHistory.findMany({
        where: eq(miningHistory.userId, userId),
        orderBy: (miningHistory) => [miningHistory.timestamp.desc()],
        limit
      });
      
      res.json(recentRewards);
    } catch (error) {
      console.error('Error fetching recent mining rewards:', error);
      res.status(500).json({ message: 'Failed to fetch recent mining rewards' });
    }
  });
}
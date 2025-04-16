import { db } from '../db';
import { users, miningHistory, miningSettings, eq } from '../shared/schema';

/**
 * Process daily mining rewards for all eligible users
 */
export async function processDailyMiningRewards(): Promise<void> {
  try {
    console.log('Starting automatic mining rewards processing...');
    
    // Get mining settings
    const settings = await db.query.miningSettings.findFirst();
    
    if (!settings) {
      console.log('Mining settings not found, cannot process rewards');
      return;
    }
    
    // Check if automatic mining is enabled
    if (!settings.enableAutomaticMining) {
      console.log('Automatic mining is disabled. Skipping reward processing.');
      return;
    }
    
    console.log('Automatic mining is enabled. Proceeding with processing rewards.');
    
    // Get all active miners
    // In a real implementation, we would filter by users who have activated mining
    // and have not received rewards recently
    const activeMiners = await db.query.users.findMany({
      where: (users) => eq(users.role, 'user')
    });
    
    console.log(`Processing automatic mining rewards for ${activeMiners.length} active miners`);
    
    const rewardAmount = settings.hourlyRewardAmount || 0.5; // Default to 0.5 if not set
    const now = new Date();
    
    // Process rewards for each miner
    for (const user of activeMiners) {
      try {
        // Calculate user-specific reward with multiplier
        // In a real implementation, this would consider premium status, streak, etc.
        const userMultiplier = 1.0; // Default multiplier
        const finalReward = rewardAmount * userMultiplier;
        
        console.log(`Crediting ${finalReward} TSK to user ${user.id} (base: ${rewardAmount}, multiplier: ${userMultiplier})`);
        
        // Create mining history entry
        await db.insert(miningHistory).values({
          userId: user.id,
          amount: finalReward,
          timestamp: now,
          source: 'automatic'
        });
        
        // Update user's token balance
        const newBalance = user.tokenBalance + finalReward;
        console.log(`Updated user ${user.id} token balance: ${user.tokenBalance} + ${finalReward} = ${newBalance}`);
        
        await db.update(users)
          .set({
            tokenBalance: newBalance,
            updatedAt: now
          })
          .where(eq(users.id, user.id));
      } catch (userError) {
        console.error(`Error processing rewards for user ${user.id}:`, userError);
        // Continue with next user
      }
    }
    
    console.log(`Automatic mining rewards processed at ${now.toISOString()}`);
  } catch (error) {
    console.error('Error processing automatic mining rewards:', error);
    throw error;
  }
}

/**
 * Check if a user is eligible for mining rewards
 */
export async function isUserEligibleForMining(userId: number): Promise<boolean> {
  try {
    // Get user
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId)
    });
    
    if (!user) {
      return false;
    }
    
    // Get mining settings
    const settings = await db.query.miningSettings.findFirst();
    
    if (!settings) {
      return false;
    }
    
    // If daily activation is required, check if user has activated mining today
    if (settings.dailyActivationRequired) {
      if (!user.lastMiningDate) {
        return false;
      }
      
      const now = new Date();
      const hoursSinceLastMining = (now.getTime() - user.lastMiningDate.getTime()) / (1000 * 60 * 60);
      
      // If more than activation expiration hours, user needs to reactivate
      if (hoursSinceLastMining > settings.activationExpirationHours) {
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error checking mining eligibility:', error);
    return false;
  }
}

/**
 * Activate mining for a user
 */
export async function activateMining(userId: number): Promise<boolean> {
  try {
    const now = new Date();
    
    // Update user's mining activation status
    await db.update(users)
      .set({
        lastMiningDate: now,
        updatedAt: now
      })
      .where(eq(users.id, userId));
    
    return true;
  } catch (error) {
    console.error('Error activating mining:', error);
    return false;
  }
}
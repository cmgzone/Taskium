import { storage } from "../storage";

/**
 * Service that processes automatic mining rewards
 * This is run at regular intervals to credit active miners with hourly rewards
 */

// Keep track of the last time rewards were processed
let lastProcessedTime = Date.now();
const PROCESSING_INTERVAL = 60 * 60 * 1000; // 1 hour in milliseconds

// Statistics tracking
export interface MiningStatistics {
  totalRewardsDistributed: number;
  totalAutomaticMiningSessions: number;
  lastProcessedTime: Date | null;
  activeMinersCount: number;
  totalUsersCount: number;
  activationRate: number; // percentage of users who have activated mining
  averageRewardPerUser: number;
  processedBatches: number;
}

// Initialize statistics
export const miningStats: MiningStatistics = {
  totalRewardsDistributed: 0,
  totalAutomaticMiningSessions: 0,
  lastProcessedTime: null,
  activeMinersCount: 0,
  totalUsersCount: 0,
  activationRate: 0,
  averageRewardPerUser: 0,
  processedBatches: 0
};

/**
 * Process automatic mining rewards for all active users
 */
export async function processAutomaticMiningRewards() {
  const now = Date.now();
  
  // FOR TESTING: Comment out the time check to allow immediate processing
  // Only process if enough time has passed
  // if (now - lastProcessedTime < PROCESSING_INTERVAL) {
  //   return;
  // }
  console.log("Processing automatic mining rewards now (test mode)");
  
  try {
    // Get mining settings
    const settings = await storage.getMiningSettings();
    
    // If automatic mining is not enabled, do nothing
    if (!settings.enableautomaticmining) {
      console.log("Automatic mining is disabled in settings. Skipping processing.");
      return;
    }
    
    console.log("Automatic mining is enabled. Proceeding with processing rewards.");
    
    // Get all users with active mining status
    const activeMiners = await storage.getUsersByMiningStatus(true);
    
    // Get total users for stats
    const allUsers = await storage.getAllUsers();
    
    if (activeMiners.length === 0) {
      console.log("No active miners found. Skipping processing.");
      return;
    }
    
    console.log(`Processing automatic mining rewards for ${activeMiners.length} active miners`);
    
    // Update stats before processing
    miningStats.activeMinersCount = activeMiners.length;
    miningStats.totalUsersCount = allUsers.length;
    miningStats.activationRate = allUsers.length > 0 ? 
      (activeMiners.length / allUsers.length) * 100 : 0;
    
    // Track batch stats for this processing session
    let batchRewardsTotal = 0;
    let successfulMinerCount = 0;
    
    // Process each active miner
    for (const user of activeMiners) {
      // Skip users whose activation has expired
      if (user.lastMiningActivation) {
        const activationTime = new Date(user.lastMiningActivation).getTime();
        const hoursElapsed = (now - activationTime) / (1000 * 60 * 60);
        
        if (hoursElapsed > settings.activationexpirationhours) {
          console.log(`Mining activation expired for user ${user.id}. Deactivating.`);
          await storage.updateUser(user.id, { miningActive: false });
          continue;
        }
      } else {
        // If user has no activation timestamp but is marked active, this is an error state
        console.log(`User ${user.id} has no activation timestamp but is marked active. Deactivating.`);
        await storage.updateUser(user.id, { miningActive: false });
        continue;
      }
      
      // Calculate hourly reward
      const baseAmount = settings.hourlyrewardamount;
      const multiplier = user.premiumMultiplier || 1;
      const adjustedAmount = baseAmount * multiplier;
      
      console.log(`Crediting ${adjustedAmount} TSK to user ${user.id} (base: ${baseAmount}, multiplier: ${multiplier})`);
      
      // Record mining activity with automatic source
      await storage.recordMining({
        userId: user.id,
        amount: adjustedAmount,
        bonusAmount: 0,
        bonusType: null,
        streakDay: 1, // No streak for automatic mining
        source: 'automatic' as any // Type cast to avoid type error
      });
      
      // Update statistics
      miningStats.totalRewardsDistributed += adjustedAmount;
      miningStats.totalAutomaticMiningSessions++;
      batchRewardsTotal += adjustedAmount;
      successfulMinerCount++;
    }
    
    // Update batch statistics
    miningStats.processedBatches++;
    miningStats.lastProcessedTime = new Date(now);
    
    // Calculate average reward per user (for this batch)
    if (successfulMinerCount > 0) {
      miningStats.averageRewardPerUser = batchRewardsTotal / successfulMinerCount;
    }
    
    // Update last processed time
    lastProcessedTime = now;
    console.log(`Automatic mining rewards processed at ${new Date(now).toISOString()}`);
    
  } catch (error) {
    console.error("Error processing automatic mining rewards:", error);
  }
}

/**
 * Initialize the automatic mining service
 * This sets up a recurring job to process rewards
 */
export function initAutomaticMiningService() {
  // Process rewards every 10 minutes
  // This doesn't mean rewards are given every 10 minutes
  // The actual crediting happens hourly based on lastProcessedTime
  const checkInterval = 10 * 60 * 1000; // 10 minutes
  
  console.log("Starting automatic mining service...");
  
  // Initial processing
  processAutomaticMiningRewards();
  
  // Set up recurring processing
  setInterval(processAutomaticMiningRewards, checkInterval);
}
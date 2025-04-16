// server/storage.ts
import {
  users, referrals, miningHistory, premiumPackages, marketplaceItems, transactions, userKyc,
  bannerImages, embeddedAds, miningSettings, adminTasks, learningPaths, learningSteps,
  userProgress, userInteractions, onboardingPreferences, contractAddresses, whitepapers, events,
  tokenPackages, tokenTransactions, chatGroups, chatGroupMembers, chatMessages, directMessages, chatMessageReactions,
  notifications, platformSettings, systemSecrets, walletConfiguration, deviceTokens,
  aiKnowledgeBase, aiReasoning, aiConversationMemory, aiSystemTasks, aiFeedback, 
  platformScanResults, aiLearningMetrics,
  type User, type InsertUser, type Referral, type InsertReferral,
  type MiningHistory, type InsertMiningHistory, type PremiumPackage, type InsertPremiumPackage,
  type MarketplaceItem, type InsertMarketplaceItem, type Transaction, type InsertTransaction,
  type BannerImage, type InsertBannerImage, type EmbeddedAd, type InsertEmbeddedAd,
  type KycSubmission, type KycVerification, type UserKyc, type MiningSetting, type MiningSettings,
  type AdminTask, type AdminTaskBase, type InsertAdminTask,
  type LearningPath, type InsertLearningPath, type LearningStep, type InsertLearningStep,
  type UserProgress, type InsertUserProgress, type UserInteraction, type InsertUserInteraction,
  type OnboardingPreference, type InsertOnboardingPreferences, type ContractAddress, type InsertContractAddress,
  type Whitepaper, type InsertWhitepaper, type Event, type InsertEvent,
  type TokenPackage, type InsertTokenPackage, type TokenTransaction, type InsertTokenTransaction,
  type ChatGroup, type InsertChatGroup, type ChatGroupMember, type InsertChatGroupMember,
  type ChatMessage, type InsertChatMessage, type DirectMessage, type InsertDirectMessage,
  type ChatMessageReaction, type InsertChatMessageReaction, type Notification, type InsertNotification,
  type PlatformSetting, type InsertPlatformSetting, type SystemSecret, type InsertSystemSecret,
  type WalletConfiguration, type InsertWalletConfiguration, type DeviceToken, type InsertDeviceToken,
  type AIKnowledgeBase, type InsertAIKnowledgeBase, type AIReasoning, type InsertAIReasoning, 
  type AIConversationMemory, type InsertAIConversationMemory, type AISystemTask, type InsertAISystemTask,
  type AIFeedback, type InsertAIFeedback, type InsertPlatformScanResult, type InsertAILearningMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, or, sql, asc, inArray, gt, ilike } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Database storage implementation
export class DatabaseStorage {
  sessionStore: session.Store;

  constructor() {
    // Initialize session store
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // 24 hours
    });

    try {
      this.sessionStore = new PostgresSessionStore({
        pool,
        tableName: 'session'
      });
      console.log("Using PostgreSQL session store");
    } catch (error) {
      console.warn("Failed to initialize PostgreSQL session store, falling back to memory store", error);
      this.sessionStore = new MemoryStore({
        checkPeriod: 86400000 // 24 hours
      });
    }
  }

  // Optional initialization function that can be called after database setup
  async initialize(): Promise<void> {
    console.log("Database storage initialized");
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.id, id)
    });
  }

  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.username, username)
    });
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    return db.query.users.findFirst({
      where: eq(users.referralCode, referralCode)
    });
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      await db.delete(users).where(eq(users.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return false;
    }
  }

  async getAllUsers(): Promise<User[]> {
    return db.query.users.findMany();
  }

  // AI Knowledge Base operations
  async getAIKnowledgeBaseById(id: number): Promise<AIKnowledgeBase | undefined> {
    return db.query.aiKnowledgeBase.findFirst({
      where: eq(aiKnowledgeBase.id, id)
    });
  }

  async createAIKnowledge(data: InsertAIKnowledgeBase): Promise<AIKnowledgeBase> {
    const [entry] = await db.insert(aiKnowledgeBase).values(data).returning();
    return entry;
  }

  async updateAIKnowledge(id: number, data: Partial<AIKnowledgeBase>): Promise<AIKnowledgeBase | undefined> {
    const [updated] = await db.update(aiKnowledgeBase)
      .set(data)
      .where(eq(aiKnowledgeBase.id, id))
      .returning();
    return updated;
  }

  async deleteAIKnowledge(id: number): Promise<boolean> {
    try {
      await db.delete(aiKnowledgeBase).where(eq(aiKnowledgeBase.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting AI knowledge ${id}:`, error);
      return false;
    }
  }

  async getAllAIKnowledge(): Promise<AIKnowledgeBase[]> {
    return db.query.aiKnowledgeBase.findMany();
  }

  async getAIKnowledgeByCategory(category: string): Promise<AIKnowledgeBase[]> {
    return db.query.aiKnowledgeBase.findMany({
      where: eq(aiKnowledgeBase.category, category)
    });
  }
  
  // Method to get AI knowledge base for scanning
  async getAIKnowledgeBase(): Promise<AIKnowledgeBase[]> {
    return this.getAllAIKnowledge();
  }

  async findAIKnowledgeByCategory(category: string, topic: string): Promise<AIKnowledgeBase[]> {
    return db.query.aiKnowledgeBase.findMany({
      where: and(
        eq(aiKnowledgeBase.category, category),
        ilike(aiKnowledgeBase.topic, `%${topic}%`)
      )
    });
  }

  async searchAIKnowledge(query: string): Promise<AIKnowledgeBase[]> {
    return db.query.aiKnowledgeBase.findMany({
      where: or(
        ilike(aiKnowledgeBase.topic, `%${query}%`),
        ilike(aiKnowledgeBase.information, `%${query}%`),
        ilike(aiKnowledgeBase.subtopic, `%${query}%`)
      )
    });
  }
  
  async createAIKnowledgeEntry(data: InsertAIKnowledgeBase): Promise<AIKnowledgeBase> {
    return this.createAIKnowledge(data);
  }
  
  async updateAIKnowledgeEntry(id: number, data: Partial<AIKnowledgeBase>): Promise<AIKnowledgeBase | undefined> {
    return this.updateAIKnowledge(id, data);
  }
  
  async createAIReasoningPattern(data: InsertAIReasoning): Promise<AIReasoning> {
    return this.createAIReasoning(data);
  }

  // AI Reasoning operations
  async getAIReasoning(id: number): Promise<AIReasoning | undefined> {
    return db.query.aiReasoning.findFirst({
      where: eq(aiReasoning.id, id)
    });
  }

  async createAIReasoning(data: InsertAIReasoning): Promise<AIReasoning> {
    const [entry] = await db.insert(aiReasoning).values(data).returning();
    return entry;
  }

  async getAllAIReasoning(): Promise<AIReasoning[]> {
    return db.query.aiReasoning.findMany();
  }
  
  // Method for getting AI reasoning patterns with categorization
  async getAIReasoningPatterns(): Promise<AIReasoning[]> {
    return this.getAllAIReasoning();
  }
  
  // Method for updating AI reasoning patterns
  async updateAIReasoningPattern(id: number, data: Partial<AIReasoning>): Promise<AIReasoning | undefined> {
    const [updated] = await db.update(aiReasoning)
      .set(data)
      .where(eq(aiReasoning.id, id))
      .returning();
    return updated;
  }

  // AI Conversation Memory operations
  async getAIConversationMemory(id: number): Promise<AIConversationMemory | undefined> {
    return db.query.aiConversationMemory.findFirst({
      where: eq(aiConversationMemory.id, id)
    });
  }

  async createAIConversationMemory(data: InsertAIConversationMemory): Promise<AIConversationMemory> {
    const [entry] = await db.insert(aiConversationMemory).values(data).returning();
    return entry;
  }

  async getConversationMemoryByUserId(userId: number): Promise<AIConversationMemory[]> {
    return db.query.aiConversationMemory.findMany({
      where: eq(aiConversationMemory.userId, userId)
    });
  }

  // AI System Task operations
  async getAISystemTask(id: number): Promise<AISystemTask | undefined> {
    return db.query.aiSystemTasks.findFirst({
      where: eq(aiSystemTasks.id, id)
    });
  }

  async createAISystemTask(data: InsertAISystemTask): Promise<AISystemTask> {
    const [entry] = await db.insert(aiSystemTasks).values(data).returning();
    return entry;
  }

  async updateAISystemTask(id: number, data: Partial<AISystemTask>): Promise<AISystemTask | undefined> {
    const [updated] = await db.update(aiSystemTasks)
      .set(data)
      .where(eq(aiSystemTasks.id, id))
      .returning();
    return updated;
  }

  async getPendingAISystemTasks(): Promise<AISystemTask[]> {
    return db.query.aiSystemTasks.findMany({
      where: eq(aiSystemTasks.status, "pending")
    });
  }

  // AI Feedback operations
  async getAIFeedback(id: number): Promise<AIFeedback | undefined> {
    return db.query.aiFeedback.findFirst({
      where: eq(aiFeedback.id, id)
    });
  }

  async createAIFeedback(data: InsertAIFeedback): Promise<AIFeedback> {
    const [entry] = await db.insert(aiFeedback).values(data).returning();
    return entry;
  }

  async getAllAIFeedback(): Promise<AIFeedback[]> {
    return db.query.aiFeedback.findMany();
  }

  // Platform scan results operations
  async createPlatformScanResult(data: InsertPlatformScanResult): Promise<any> {
    const [entry] = await db.insert(platformScanResults).values(data).returning();
    return entry;
  }

  async getRecentPlatformScans(limit: number = 10): Promise<any[]> {
    return db.query.platformScanResults.findMany({
      orderBy: [desc(platformScanResults.scanTime)],
      limit
    });
  }

  // AI Learning Metrics operations
  async createAILearningMetrics(data: InsertAILearningMetrics): Promise<any> {
    const [entry] = await db.insert(aiLearningMetrics).values(data).returning();
    return entry;
  }

  async getLatestAILearningMetrics(): Promise<any | undefined> {
    return db.query.aiLearningMetrics.findFirst({
      orderBy: [desc(aiLearningMetrics.date)]
    });
  }
  
  async getAILearningMetrics(limit: number = 30): Promise<any[]> {
    return db.select().from(aiLearningMetrics)
      .orderBy(desc(aiLearningMetrics.date))
      .limit(limit);
  }
  
  // AI Question Logging & Analytics operations
  async createAIQuestionLog(data: any): Promise<any> {
    try {
      // In a real implementation, we would save to a database table
      console.log("Creating AI question log:", data);
      return { id: 1, ...data, createdAt: new Date() };
    } catch (error) {
      console.error("Error creating AI question log:", error);
      return null;
    }
  }
  
  async getAIQuestionLogs(limit: number = 50): Promise<any[]> {
    try {
      // In a real implementation, we would fetch from the database
      return [];
    } catch (error) {
      console.error("Error getting AI question logs:", error);
      return [];
    }
  }
  
  async updateAIAssistantAnalytics(data: any): Promise<any> {
    try {
      // In a real implementation, we would update a database record
      console.log("Updating AI assistant analytics:", data);
      return { ...data, updatedAt: new Date() };
    } catch (error) {
      console.error("Error updating AI assistant analytics:", error);
      return null;
    }
  }
  
  // Onboarding preferences operations
  async createOnboardingPreferences(data: InsertOnboardingPreferences): Promise<OnboardingPreference> {
    const [entry] = await db.insert(onboardingPreferences).values(data).returning();
    return entry;
  }
  
  async getOnboardingPreferences(userId: number): Promise<OnboardingPreference | undefined> {
    return db.query.onboardingPreferences.findFirst({
      where: eq(onboardingPreferences.userId, userId)
    });
  }
  
  async getUserOnboardingPreferences(userId: number): Promise<OnboardingPreference | undefined> {
    return this.getOnboardingPreferences(userId);
  }
  
  async updateOnboardingPreferences(userId: number, data: Partial<OnboardingPreference>): Promise<OnboardingPreference | undefined> {
    const [updated] = await db.update(onboardingPreferences)
      .set(data)
      .where(eq(onboardingPreferences.userId, userId))
      .returning();
    return updated;
  }
  
  async disableOnboarding(userId: number): Promise<boolean> {
    try {
      await db.update(onboardingPreferences)
        .set({ disableOnboarding: true })
        .where(eq(onboardingPreferences.userId, userId));
      return true;
    } catch (error) {
      console.error(`Error disabling onboarding for user ${userId}:`, error);
      return false;
    }
  }

  // Mining operations
  async recordMining(miningData: InsertMiningHistory): Promise<MiningHistory> {
    // Add timestamp if not provided
    if (!miningData.timestamp) {
      miningData.timestamp = new Date();
    }
    
    // Insert mining history record
    const [entry] = await db.insert(miningHistory).values(miningData).returning();
    
    // Calculate total amount (base + bonus)
    const baseAmount = miningData.amount || 0;
    const bonusAmount = miningData.bonusAmount || 0;
    const totalAmount = baseAmount + bonusAmount;
    
    // Get user and update token balance
    const user = await this.getUser(miningData.userId);
    if (user) {
      // Update user's token balance and last mining time
      await this.updateUser(user.id, { 
        tokenBalance: (user.tokenBalance || 0) + totalAmount,
        lastMiningTime: new Date()
      });
      console.log(`Updated user ${user.id} token balance: ${user.tokenBalance} + ${totalAmount} = ${user.tokenBalance + totalAmount}`);
    }
    
    return entry;
  }

  async getMiningHistory(userId: number, limit?: number): Promise<MiningHistory[]> {
    return db.query.miningHistory.findMany({
      where: eq(miningHistory.userId, userId),
      orderBy: [desc(miningHistory.timestamp)],
      limit: limit || 100
    });
  }

  async getAllMiningHistory(limit?: number): Promise<MiningHistory[]> {
    return db.query.miningHistory.findMany({
      orderBy: [desc(miningHistory.timestamp)],
      limit: limit || 100
    });
  }
  
  async getRecentMiningRewards(userId: number, timeWindow?: number): Promise<MiningHistory[]> {
    // Default time window is 24 hours
    const windowMs = timeWindow || 24 * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - windowMs);
    
    return db.query.miningHistory.findMany({
      where: and(
        eq(miningHistory.userId, userId),
        gt(miningHistory.timestamp, cutoffTime)
      ),
      orderBy: [desc(miningHistory.timestamp)]
    });
  }

  async deleteMiningHistoryEntry(id: number): Promise<boolean> {
    try {
      await db.delete(miningHistory).where(eq(miningHistory.id, id));
      return true;
    } catch (error) {
      console.error(`Error deleting mining history entry ${id}:`, error);
      return false;
    }
  }

  async updateUserStreak(userId: number, streakDay: number): Promise<User> {
    // This would update a streak field, but since there's no such field in the User model,
    // we'll update lastMiningTime and/or other fields
    const [updated] = await db.update(users)
      .set({ 
        lastMiningTime: new Date(), 
        // Additional updates would go here
      })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getUsersByMiningStatus(active: boolean): Promise<User[]> {
    return db.query.users.findMany({
      where: eq(users.miningActive, active)
    });
  }
  
  // Method for getting users by KYC status
  async getUsersByKycStatus(status: string): Promise<any[]> {
    const usersWithKyc = await db.query.userKyc.findMany({
      where: eq(userKyc.status, status),
      with: {
        user: true
      }
    });
    
    // Return the combined KYC and user data
    return usersWithKyc.map(entry => ({
      id: entry.id,
      userId: entry.userId,
      status: entry.status,
      fullName: entry.fullName,
      country: entry.country,
      documentType: entry.documentType,
      documentId: entry.documentId,
      submissionDate: entry.submissionDate,
      verificationDate: entry.verificationDate,
      rejectionReason: entry.rejectionReason,
      frontImageUrl: entry.frontImageUrl,
      backImageUrl: entry.backImageUrl,
      selfieImageUrl: entry.selfieImageUrl,
      user: entry.user
    }));
  }
  
  // Get count of active referrals for a user
  async getActiveReferralsCount(userId: number): Promise<number> {
    const referralsList = await db.query.referrals.findMany({
      where: and(
        eq(referrals.referrerId, userId),
        eq(referrals.active, true)
      )
    });
    
    return referralsList.length;
  }

  // Mining settings operations
  async getMiningSettings(): Promise<MiningSetting> {
    // Get the first/only mining setting record, or create one if none exists
    const settings = await db.query.miningSettings.findFirst();
    if (settings) return settings;
    
    // If no settings found, create default settings
    const [defaultSettings] = await db.insert(miningSettings).values({}).returning();
    return defaultSettings;
  }

  async updateMiningSettings(settings: MiningSettings): Promise<MiningSetting> {
    // Update existing settings or create new ones
    const existing = await db.query.miningSettings.findFirst();
    
    if (existing) {
      const [updated] = await db.update(miningSettings)
        .set(settings)
        .where(eq(miningSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(miningSettings).values(settings).returning();
      return created;
    }
  }
  
  // Admin tasks operations
  async createAdminTask(data: InsertAdminTask): Promise<AdminTaskBase> {
    const [entry] = await db.insert(adminTasks).values(data).returning();
    return entry;
  }
  
  async getAdminTask(id: number): Promise<AdminTaskBase | undefined> {
    return db.query.adminTasks.findFirst({
      where: eq(adminTasks.id, id)
    });
  }
  
  async updateAdminTask(id: number, data: Partial<AdminTaskBase>): Promise<AdminTaskBase | undefined> {
    const [updated] = await db.update(adminTasks)
      .set(data)
      .where(eq(adminTasks.id, id))
      .returning();
    return updated;
  }
  
  async getAllAdminTasks(): Promise<AdminTaskBase[]> {
    return db.query.adminTasks.findMany();
  }
  
  async getAdminTasksByStatus(status: string): Promise<AdminTaskBase[]> {
    return db.query.adminTasks.findMany({
      where: eq(adminTasks.status, status)
    });
  }
  
  async updateAIFeedback(id: number, data: Partial<AIFeedback>): Promise<AIFeedback | undefined> {
    const [updated] = await db.update(aiFeedback)
      .set(data)
      .where(eq(aiFeedback.id, id))
      .returning();
    return updated;
  }
  
  // System settings operations
  async getSystemSettings(): Promise<any> {
    // Retrieve system settings from the database or return default values
    try {
      // If using a specific system_settings table
      // const settings = await db.query.systemSettings.findFirst();
      // return settings;
      
      // Since we don't have a specific settings table yet, return empty object
      return {
        openaiApiKey: process.env.OPENAI_API_KEY || null,
        // Add other system settings as needed
      };
    } catch (error) {
      console.error('Error retrieving system settings:', error);
      return null;
    }
  }
  
  async updateSystemSettings(settings: any): Promise<any> {
    // For now, this is a stub since we're using environment variables
    // When the system_settings table is implemented, this would update it
    console.log('System settings update requested:', settings);
    return settings;
  }
  
  // Marketplace operations
  async getMarketplaceItems(): Promise<MarketplaceItem[]> {
    return db.query.marketplaceItems.findMany();
  }
  
  // Embedded ads operations
  async getActiveAds(): Promise<EmbeddedAd[]> {
    return db.query.embeddedAds.findMany({
      where: eq(embeddedAds.active, true)
    });
  }
  
  async createEmbeddedAd(data: InsertEmbeddedAd): Promise<EmbeddedAd> {
    // Create a sanitized copy of the data without any date fields
    const { startDate, endDate, ...sanitizedData } = { ...data };
    
    // Prepare the final data object
    let finalData: any = { ...sanitizedData };
    
    // Process startDate if provided
    if (startDate) {
      try {
        // If it's already a Date object, leave it as is
        if (startDate instanceof Date) {
          finalData.startDate = startDate;
        } else {
          // Try to parse the date string
          finalData.startDate = new Date(startDate);
          
          // Validate the date is valid
          if (isNaN(finalData.startDate.getTime())) {
            console.error("Invalid startDate format:", startDate);
            delete finalData.startDate;
          }
        }
      } catch (error) {
        console.error("Error processing startDate:", error);
        // Let PostgreSQL use the default value
        delete finalData.startDate;
      }
    }
    
    // Process endDate if provided
    if (endDate) {
      try {
        // If it's already a Date object, leave it as is
        if (endDate instanceof Date) {
          finalData.endDate = endDate;
        } else {
          // Try to parse the date string
          finalData.endDate = new Date(endDate);
          
          // Validate the date is valid
          if (isNaN(finalData.endDate.getTime())) {
            console.error("Invalid endDate format:", endDate);
            delete finalData.endDate;
          }
        }
      } catch (error) {
        console.error("Error processing endDate:", error);
        delete finalData.endDate;
      }
    }
    
    console.log("Final ad data for database insertion:", {
      ...finalData,
      startDate: finalData.startDate ? finalData.startDate.toISOString() : 'using default',
      endDate: finalData.endDate ? finalData.endDate.toISOString() : 'null'
    });
    
    try {
      const [entry] = await db.insert(embeddedAds).values(finalData).returning();
      return entry;
    } catch (error) {
      console.error("Database error during ad creation:", error);
      throw error;
    }
  }
  
  // Events/Announcements operations
  async getAnnouncements(): Promise<Event[]> {
    return db.query.events.findMany({
      where: eq(events.active, true),
      orderBy: [desc(events.createdAt)]
    });
  }
}

// Create and export storage instance
export const storage = new DatabaseStorage();
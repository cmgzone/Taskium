import {
  users, referrals, miningHistory, premiumPackages, marketplaceItems, transactions, userKyc,
  bannerImages, embeddedAds, miningSettings, adminTasks, learningPaths, learningSteps,
  userProgress, userInteractions, onboardingPreferences, contractAddresses, whitepapers, events,
  tokenPackages, tokenTransactions, chatGroups, chatGroupMembers, chatMessages, directMessages, chatMessageReactions,
  notifications, platformSettings, systemSecrets, walletConfiguration, deviceTokens,
  aiKnowledgeBase, aiReasoning, aiConversationMemory, aiSystemTasks, aiFeedback, 
  platformScanResults, aiLearningMetrics, subscriptions, subscriptionPayments,
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
  type AIFeedback, type InsertAIFeedback, type InsertPlatformScanResult, type InsertAILearningMetrics,
  type Subscription, type InsertSubscription, type SubscriptionPayment, type InsertSubscriptionPayment
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, or, sql, asc, inArray, gt, ilike } from "drizzle-orm";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

export interface IStorage {
  // Blockchain network operations
  getBlockchainNetworks(): Promise<any[]>;
  
  // KYC operations
  getUserKYCStatus(userId: number): Promise<any>;
  getPendingKYCSubmissions(userId: number): Promise<any[]>;
  getKYCSubmission(id: number): Promise<any>;
  createKYCSubmission(data: any): Promise<any>;
  updateKYCStatus(userId: number, status: string, reason?: string): Promise<any>;
  getKYCSubmissionsByStatus(status: string): Promise<any[]>;
  getUsersByKycStatus(status: string): Promise<User[]>;
  
  // Chat operations
  getChatGroups(userId?: number): Promise<ChatGroup[]>;
  getChatGroup(id: number): Promise<ChatGroup | undefined>;
  createChatGroup(groupData: InsertChatGroup): Promise<ChatGroup>;
  updateChatGroup(id: number, data: Partial<ChatGroup>): Promise<ChatGroup | undefined>;
  deleteChatGroup(id: number): Promise<boolean>;
  
  // Platform scanning operations
  getActiveAds(): Promise<EmbeddedAd[]>;
  getAnnouncements(): Promise<any[]>;
  countKycByStatus(status: string): Promise<number>;
  getSystemSettings(): Promise<any>;
  getAllReferrals(): Promise<Referral[]>;
  getAllKyc(): Promise<UserKyc[]>;
  
  // Chat group member operations
  getChatGroupMembers(groupId: number): Promise<(ChatGroupMember & { user: { id: number, username: string } })[]>;
  addUserToChatGroup(memberData: InsertChatGroupMember): Promise<ChatGroupMember>;
  removeChatGroupMember(groupId: number, userId: number): Promise<boolean>;
  updateChatGroupMemberRole(groupId: number, userId: number, newRole: string): Promise<ChatGroupMember | undefined>;
  
  // Chat message operations
  getChatMessages(groupId: number, limit?: number, before?: Date): Promise<(ChatMessage & { sender: { id: number, username: string } })[]>;
  createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage>;
  editChatMessage(messageId: number, newContent: string): Promise<ChatMessage | undefined>;
  deleteChatMessage(messageId: number): Promise<boolean>;
  
  // Direct message operations
  getDirectMessages(userId1: number, userId2: number, limit?: number): Promise<DirectMessage[]>;
  getUnreadDirectMessageCount(userId: number): Promise<number>;
  createDirectMessage(messageData: InsertDirectMessage): Promise<DirectMessage>;
  markDirectMessageAsRead(messageId: number): Promise<boolean>;
  
  // Whitepaper operations
  getWhitepapers(publishedOnly?: boolean): Promise<Whitepaper[]>;
  getWhitepaper(id: number): Promise<Whitepaper | undefined>;
  createWhitepaper(whitepaper: InsertWhitepaper): Promise<Whitepaper>;
  updateWhitepaper(id: number, data: Partial<Whitepaper>): Promise<Whitepaper | undefined>;
  deleteWhitepaper(id: number): Promise<boolean>;
  
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserById(id: number): Promise<User | undefined>; // Alias for getUser for platform scanner
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByReferralCode(referralCode: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  deleteUser(id: number): Promise<boolean>;
  getAllUsers(): Promise<User[]>;
  getUserWallets(userId: number): Promise<any[]>; // Get user's wallet balances
  getOnboardingPreferences(userId: number): Promise<any>; // Get user onboarding preferences
  
  // KYC operations
  submitKyc(userId: number, kycData: KycSubmission): Promise<User>;
  getKycStatus(userId: number): Promise<{ status: string, submissionDate: Date | null }>;
  getUsersByKycStatus(status: string): Promise<User[]>;
  verifyKyc(data: KycVerification): Promise<User>;

  // Mining operations
  recordMining(miningData: InsertMiningHistory): Promise<MiningHistory>;
  getMiningHistory(userId: number, limit?: number): Promise<MiningHistory[]>;
  getAllMiningHistory(limit?: number): Promise<MiningHistory[]>;
  deleteMiningHistoryEntry(id: number): Promise<boolean>;
  updateUserStreak(userId: number, streakDay: number): Promise<User>;
  getUsersByMiningStatus(active: boolean): Promise<User[]>;
  
  // Mining settings operations
  getMiningSettings(): Promise<MiningSetting>;
  updateMiningSettings(settings: MiningSettings): Promise<MiningSetting>;
  
  // Contract management operations
  getContractAddress(network: string): Promise<ContractAddress | undefined>;
  getAllContractAddresses(): Promise<ContractAddress[]>;
  updateContractAddress(network: string, address: string): Promise<boolean>;

  // Referral operations
  createReferral(referralData: InsertReferral): Promise<Referral>;
  getReferrals(referrerId: number): Promise<Referral[]>;
  getActiveReferralsCount(referrerId: number): Promise<number>;

  // Premium packages operations
  getPremiumPackages(): Promise<PremiumPackage[]>;
  getPremiumPackage(id: number): Promise<PremiumPackage | undefined>;
  createPremiumPackage(packageData: InsertPremiumPackage): Promise<PremiumPackage>;
  updatePremiumPackage(id: number, data: Partial<PremiumPackage>): Promise<PremiumPackage | undefined>;
  
  // Subscription operations
  createSubscription(subscriptionData: InsertSubscription): Promise<Subscription>;
  getSubscription(id: number): Promise<Subscription | undefined>;
  getUserSubscriptions(userId: number): Promise<Subscription[]>;
  updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined>;
  cancelSubscription(id: number): Promise<Subscription | undefined>;
  
  // Subscription payment operations
  createSubscriptionPayment(paymentData: InsertSubscriptionPayment): Promise<SubscriptionPayment>;
  getSubscriptionPayments(subscriptionId: number): Promise<SubscriptionPayment[]>;
  getUserSubscriptionPayments(userId: number): Promise<SubscriptionPayment[]>;

  // Marketplace operations
  getMarketplaceItems(approved?: boolean): Promise<MarketplaceItem[]>;
  getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined>;
  createMarketplaceItem(itemData: InsertMarketplaceItem): Promise<MarketplaceItem>;
  updateMarketplaceItem(id: number, data: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined>;
  getUserMarketplaceItems(userId: number): Promise<MarketplaceItem[]>;
  deleteMarketplaceItem(id: number): Promise<boolean>;
  getMarketplaceItemsByCategory(category: string, limit?: number): Promise<MarketplaceItem[]>;
  getFeaturedMarketplaceItems(limit?: number): Promise<MarketplaceItem[]>;

  // Transaction operations
  createTransaction(transactionData: InsertTransaction): Promise<Transaction>;
  getUserTransactions(userId: number): Promise<Transaction[]>;
  getTransactionsByUser(userId: number, limit?: number): Promise<Transaction[]>;

  // Banner image operations
  getBannerImages(activeOnly?: boolean): Promise<BannerImage[]>;
  getBannerImage(id: number): Promise<BannerImage | undefined>;
  createBannerImage(bannerData: InsertBannerImage): Promise<BannerImage>;
  updateBannerImage(id: number, data: Partial<BannerImage>): Promise<BannerImage | undefined>;
  deleteBannerImage(id: number): Promise<boolean>;

  // Embedded ad operations
  getEmbeddedAds(activeOnly?: boolean): Promise<EmbeddedAd[]>;
  getEmbeddedAd(id: number): Promise<EmbeddedAd | undefined>;
  createEmbeddedAd(adData: InsertEmbeddedAd): Promise<EmbeddedAd>;
  updateEmbeddedAd(id: number, data: Partial<EmbeddedAd>): Promise<EmbeddedAd | undefined>;
  deleteEmbeddedAd(id: number): Promise<boolean>;
  
  // Admin task operations
  createAdminTask(taskData: InsertAdminTask): Promise<AdminTask>;
  getAdminTasks(status?: string): Promise<AdminTask[]>;
  getUserAdminTasks(userId: number, includeCreated?: boolean): Promise<AdminTask[]>;
  getAdminTask(id: number): Promise<AdminTask | undefined>;
  updateAdminTask(id: number, data: Partial<AdminTask>): Promise<AdminTask | undefined>;
  deleteAdminTask(id: number): Promise<boolean>;

  // Learning path operations
  createLearningPath(data: InsertLearningPath): Promise<LearningPath>;
  getLearningPaths(activeOnly?: boolean): Promise<LearningPath[]>;
  getLearningPath(id: number): Promise<LearningPath | undefined>;
  getLearningPathsByCategory(category: string, activeOnly?: boolean): Promise<LearningPath[]>;
  getLearningPathsByFeature(feature: string, activeOnly?: boolean): Promise<LearningPath[]>;
  updateLearningPath(id: number, data: Partial<LearningPath>): Promise<LearningPath | undefined>;
  deleteLearningPath(id: number): Promise<boolean>;

  // Learning step operations
  createLearningStep(data: InsertLearningStep): Promise<LearningStep>;
  getLearningSteps(pathId: number): Promise<LearningStep[]>;
  getLearningStep(id: number): Promise<LearningStep | undefined>;
  updateLearningStep(id: number, data: Partial<LearningStep>): Promise<LearningStep | undefined>;
  deleteLearningStep(id: number): Promise<boolean>;
  reorderLearningSteps(pathId: number, orderedIds: number[]): Promise<LearningStep[]>;

  // User progress operations
  createUserProgress(data: InsertUserProgress): Promise<UserProgress>;
  getUserProgress(userId: number, pathId: number): Promise<UserProgress | undefined>;
  getUserProgressAll(userId: number): Promise<UserProgress[]>;
  updateUserProgress(userId: number, pathId: number, data: Partial<UserProgress>): Promise<UserProgress | undefined>;
  completeStep(userId: number, pathId: number, stepId: number): Promise<UserProgress>;
  resetUserProgress(userId: number, pathId: number): Promise<boolean>;

  // User interaction operations
  recordUserInteraction(data: InsertUserInteraction): Promise<UserInteraction>;
  getUserInteractions(userId: number, limit?: number): Promise<UserInteraction[]>;
  getUserInteractionsByType(userId: number, type: string, limit?: number): Promise<UserInteraction[]>;
  getUserInteractionsByFeature(userId: number, feature: string, limit?: number): Promise<UserInteraction[]>;
  
  // Onboarding preferences operations
  createOnboardingPreferences(data: InsertOnboardingPreferences): Promise<OnboardingPreference>;
  getOnboardingPreferences(userId: number): Promise<OnboardingPreference | undefined>;
  getUserOnboardingPreferences(userId: number): Promise<OnboardingPreference | undefined>; // Alias for getOnboardingPreferences for platform scanner
  updateOnboardingPreferences(userId: number, data: Partial<OnboardingPreference>): Promise<OnboardingPreference | undefined>;
  disableOnboarding(userId: number): Promise<boolean>;
  
  // Recommendation operations
  getRecommendedLearningPaths(userId: number, limit?: number): Promise<LearningPath[]>;
  getSuggestedNextSteps(userId: number): Promise<{ pathId: number, stepId: number, reason: string }[]>;

  // Events operations
  getEvents(activeOnly?: boolean): Promise<Event[]>;
  getEvent(id: number): Promise<Event | undefined>;
  createEvent(eventData: InsertEvent): Promise<Event>;
  updateEvent(id: number, data: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  getActiveEventsByPriority(limit?: number): Promise<Event[]>;
  getDashboardEvents(): Promise<Event[]>;
  getFeaturedEvents(): Promise<Event[]>;

  // Token package operations
  getTokenPackages(activeOnly?: boolean): Promise<TokenPackage[]>;
  getTokenPackage(id: number): Promise<TokenPackage | undefined>;
  createTokenPackage(packageData: InsertTokenPackage): Promise<TokenPackage>;
  updateTokenPackage(id: number, data: Partial<TokenPackage>): Promise<TokenPackage | undefined>;
  deleteTokenPackage(id: number): Promise<boolean>;

  // Token transaction operations
  createTokenTransaction(transactionData: InsertTokenTransaction): Promise<TokenTransaction>;
  getUserTokenTransactions(userId: number): Promise<TokenTransaction[]>;
  getTokenTransaction(id: number): Promise<TokenTransaction | undefined>;
  updateTokenTransaction(id: number, data: Partial<TokenTransaction>): Promise<TokenTransaction | undefined>;
  approveTokenTransaction(id: number, approverId: number): Promise<TokenTransaction | undefined>;
  getPendingTokenTransactions(): Promise<TokenTransaction[]>;
  
  // Notification operations
  getUserNotifications(userId: number, limit?: number, includeRead?: boolean): Promise<Notification[]>;
  getNotification(id: number): Promise<Notification | undefined>;
  createNotification(notificationData: InsertNotification): Promise<Notification>;
  getAllNotifications(options: { limit: number; offset: number; search?: string }): Promise<Notification[]>;
  getNotificationsCount(search?: string): Promise<number>;
  getUnreadNotificationsCount(): Promise<number>;
  deleteNotification(id: number): Promise<boolean>;
  getAllDeviceTokens(): Promise<any[]>;
  getActiveDeviceTokensCount(): Promise<number>;
  getUsersSimple(): Promise<{id: number; username: string}[]>;
  getActiveUsersCount(): Promise<number>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  createSystemNotification(userId: number, title: string, message: string, options?: Partial<InsertNotification>): Promise<Notification>;
  
  // Platform settings operations
  getPlatformSettings(): Promise<PlatformSetting[]>;
  getPlatformSettingByType(settingType: string): Promise<PlatformSetting | undefined>;
  createPlatformSetting(settingData: InsertPlatformSetting): Promise<PlatformSetting>;
  updatePlatformSetting(id: number, data: Partial<PlatformSetting>): Promise<PlatformSetting | undefined>;
  deactivatePlatformSetting(id: number): Promise<boolean>;
  getActivePlatformSettingByType(settingType: string): Promise<PlatformSetting | undefined>;
  
  // System secrets operations
  getSystemSecrets(): Promise<SystemSecret[]>;
  getSystemSecretByKeyName(keyName: string): Promise<SystemSecret | undefined>;
  getSystemSecretsByCategory(category: string): Promise<SystemSecret[]>;
  createSystemSecret(secretData: InsertSystemSecret): Promise<SystemSecret>;
  updateSystemSecret(id: number, data: Partial<SystemSecret>): Promise<SystemSecret | undefined>;
  deleteSystemSecret(id: number): Promise<boolean>;
  
  // Wallet configuration operations
  getWalletConfigurations(): Promise<WalletConfiguration[]>;
  getWalletConfigurationByNetwork(network: string): Promise<WalletConfiguration | undefined>;
  createWalletConfiguration(walletData: InsertWalletConfiguration): Promise<WalletConfiguration>;
  updateWalletConfiguration(id: number, data: Partial<WalletConfiguration>): Promise<WalletConfiguration | undefined>;
  deleteWalletConfiguration(id: number): Promise<boolean>;
  
  // Device token operations
  getUserDeviceTokens(userId: number): Promise<DeviceToken[]>;
  getDeviceTokenByToken(token: string): Promise<DeviceToken | undefined>;
  registerDeviceToken(tokenData: InsertDeviceToken): Promise<DeviceToken>;
  updateDeviceToken(id: number, data: Partial<DeviceToken>): Promise<DeviceToken | undefined>;
  deactivateDeviceToken(id: number): Promise<boolean>;
  deactivateUserDeviceTokens(userId: number): Promise<boolean>;
  deleteDeviceToken(id: number): Promise<boolean>;
  
  // AI operations - Knowledge Base
  getAIKnowledgeBase(topic?: string): Promise<AIKnowledgeBase[]>;
  getAIKnowledgeEntry(id: number): Promise<AIKnowledgeBase | undefined>;
  createAIKnowledgeEntry(data: InsertAIKnowledgeBase): Promise<AIKnowledgeBase>;
  updateAIKnowledgeEntry(id: number, data: Partial<AIKnowledgeBase>): Promise<AIKnowledgeBase | undefined>;
  deleteAIKnowledgeEntry(id: number): Promise<boolean>;
  findAIKnowledgeByCategory(category: string, term?: string): Promise<AIKnowledgeBase[]>;
  
  // AI operations - Reasoning
  getAIReasoningPatterns(category?: string): Promise<AIReasoning[]>;
  getAIReasoningPattern(id: number): Promise<AIReasoning | undefined>;
  createAIReasoningPattern(data: InsertAIReasoning): Promise<AIReasoning>;
  updateAIReasoningPattern(id: number, data: Partial<AIReasoning>): Promise<AIReasoning | undefined>;
  deleteAIReasoningPattern(id: number): Promise<boolean>;
  
  // AI operations - Conversation Memory
  getAIConversationMemory(userId: number): Promise<AIConversationMemory | undefined>;
  getAllAIConversationMemories(): Promise<AIConversationMemory[]>;
  createAIConversationMemory(data: InsertAIConversationMemory): Promise<AIConversationMemory>;
  updateAIConversationMemory(id: number, data: Partial<AIConversationMemory>): Promise<AIConversationMemory | undefined>;
  deleteAIConversationMemory(id: number): Promise<boolean>;
  
  // AI operations - System Tasks
  getAISystemTasks(status?: string, taskType?: string): Promise<AISystemTask[]>;
  getAISystemTask(id: number): Promise<AISystemTask | undefined>;
  createAISystemTask(data: InsertAISystemTask): Promise<AISystemTask>;
  updateAISystemTask(id: number, data: Partial<AISystemTask>): Promise<AISystemTask | undefined>;
  deleteAISystemTask(id: number): Promise<boolean>;
  
  // AI operations - Auto Learning
  getUnprocessedAIFeedback(limit?: number): Promise<AIFeedback[]>;
  getAIFeedbackSince(date: Date, limit?: number): Promise<AIFeedback[]>;
  createPlatformScanResult(data: InsertPlatformScanResult): Promise<any>;
  getLatestPlatformScanResult(): Promise<any | undefined>;
  storePlatformScanResult(data: any): Promise<any>;
  createAILearningMetrics(data: InsertAILearningMetrics): Promise<any>;
  getAILearningMetrics(limit?: number): Promise<any[]>;
  
  // AI Question Logging & Assistant Analytics
  createAIQuestionLog(data: any): Promise<any>;
  getAIQuestionLogs(limit?: number): Promise<any[]>;
  updateAIAssistantAnalytics(data: any): Promise<any>;
  getAIAssistantAnalytics(): Promise<any>;
  
  // User Mining History
  getUserMiningHistory(userId: number, limit?: number): Promise<any[]>;
  getAllMiningHistory(limit?: number): Promise<any[]>;
  
  // System Settings
  getSystemSettings(): Promise<any>;
  updateSystemSettings(data: any): Promise<any>;
  
  // KYC Methods
  countKycByStatus(status: string): Promise<number>;
  getAllKyc(): Promise<any[]>;
  
  // Referrals
  getAllReferrals(): Promise<any[]>;

  sessionStore: any; // Session store from express-session
}

export class DatabaseStorage implements IStorage {
  public sessionStore: any;

  constructor() {
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      createTableIfMissing: true 
    });

    // We will initialize the packages after the tables have been created
    // The tables are created by the db:push command
  }

  // This method needs to be called after the tables are created
  async initialize() {
    try {
      // Initialize with default premium packages
      await this.initPremiumPackages();
      
      // Initialize with default token packages
      await this.initTokenPackages();
      
      // Initialize mining settings if needed
      await this.getMiningSettings();
      
      // Initialize contract addresses if needed
      await this.initContractAddresses();
      
      // Initialize default platform settings if needed
      await this.initPlatformSettings();
      
      // Initialize default wallet configurations if needed
      await this.initWalletConfigurations();
      
      // Initialize default system secrets if needed
      await this.initSystemSecrets();
      
      // Initialize default AI knowledge base if needed
      await this.initAIKnowledgeBase();
    } catch (error) {
      console.log("Tables not yet created, skipping initialization");
    }
  }
  
  // Initialize default platform settings (terms, privacy policy, etc.)
  private async initPlatformSettings() {
    try {
      // Check if there are already terms and conditions
      const existingTerms = await this.getPlatformSettingByType('terms');
      
      if (!existingTerms) {
        console.log("Creating default terms and conditions");
        await this.createPlatformSetting({
          settingType: 'terms',
          title: 'Terms and Conditions',
          content: `# TSK Platform Terms and Conditions

## 1. Acceptance of Terms
By accessing and using the TSK Platform ("Platform"), you agree to be bound by these Terms and Conditions.

## 2. Description of Service
The TSK Platform is a decentralized application that allows users to mine TSK tokens, trade in a marketplace, and participate in various blockchain activities.

## 3. User Responsibilities
Users are responsible for maintaining the security of their accounts and wallet credentials.

## 4. Token Mining
Mining activities are subject to platform rules and may be adjusted to maintain system integrity.

## 5. Marketplace Rules
All marketplace listings must comply with applicable laws and regulations.

## 6. Prohibited Activities
Users may not engage in any illegal or unauthorized activities on the platform.

## 7. Disclaimer of Warranties
The platform is provided "as is" without warranties of any kind.

## 8. Limitation of Liability
The platform operators shall not be liable for any indirect, incidental, or consequential damages.

## 9. Governing Law
These terms shall be governed by and construed in accordance with applicable laws.

## 10. Changes to Terms
The platform reserves the right to modify these terms at any time.

Last updated: March 15, 2025`,
          version: '1.0',
          isActive: true,
          requiresAcceptance: true
        });
      }
      
      // Check if there's already a privacy policy
      const existingPrivacy = await this.getPlatformSettingByType('privacy');
      
      if (!existingPrivacy) {
        console.log("Creating default privacy policy");
        await this.createPlatformSetting({
          settingType: 'privacy',
          title: 'Privacy Policy',
          content: `# TSK Platform Privacy Policy

## 1. Information We Collect
We collect information necessary to provide our services, including wallet addresses and transaction data.

## 2. How We Use Your Information
We use your information to operate and improve the platform, process transactions, and ensure security.

## 3. Information Sharing
We do not sell or rent your personal information to third parties.

## 4. Data Security
We implement reasonable security measures to protect your information.

## 5. Your Rights
You have the right to access, correct, or delete your personal information.

## 6. Cookies and Tracking
We use cookies and similar technologies to enhance your experience on our platform.

## 7. Changes to Privacy Policy
We may update this privacy policy from time to time.

## 8. Contact Us
If you have any questions about this privacy policy, please contact us.

Last updated: March 15, 2025`,
          version: '1.0',
          isActive: true,
          requiresAcceptance: true
        });
      }
      
      console.log("Platform settings initialization completed");
    } catch (error) {
      console.error("Error initializing platform settings:", error);
    }
  }
  
  // Initialize default contract addresses if none exist
  private async initContractAddresses() {
    try {
      const addresses = await this.getAllContractAddresses();
      
      // Only add default addresses if none exist
      if (addresses.length === 0) {
        // Add testnet address (default to zero address)
        await this.updateContractAddress('testnet', '0x0000000000000000000000000000000000000000');
        
        // Add mainnet address (default to zero address)
        await this.updateContractAddress('mainnet', '0x0000000000000000000000000000000000000000');
        
        console.log("Default contract addresses initialized");
      }
    } catch (error) {
      console.error("Error initializing contract addresses:", error);
    }
  }

  // Initialize default premium packages
  private async initPremiumPackages() {
    // Check if there are any premium packages
    const existingPackages = await this.getPremiumPackages();
    if (existingPackages.length > 0) {
      return; // Don't add packages if they already exist
    }

    await this.createPremiumPackage({
      name: "Basic",
      description: "Perfect for beginners",
      price: 20,
      miningMultiplier: 1.2,
      active: true
    });

    await this.createPremiumPackage({
      name: "Pro",
      description: "For serious miners",
      price: 50,
      miningMultiplier: 1.5,
      active: true
    });

    await this.createPremiumPackage({
      name: "Elite",
      description: "Maximum mining power",
      price: 100,
      miningMultiplier: 2.0,
      active: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }
  
  // Alias for getUser for platform scanner
  async getUserById(id: number): Promise<User | undefined> {
    return this.getUser(id);
  }
  
  // Get user's wallets/balances
  async getUserWallets(userId: number): Promise<any[]> {
    try {
      const user = await this.getUser(userId);
      if (!user) {
        return [];
      }
      
      // Return a simple wallet object with TSK token balance
      return [
        {
          id: 1,
          userId: userId,
          currency: 'TSK',
          balance: user.tokenBalance.toString(),
          walletAddress: user.walletAddress || '',
          createdAt: new Date()
        }
      ];
    } catch (error) {
      console.error('Error getting user wallets:', error);
      return [];
    }
  }
  
  // Get blockchain networks
  async getBlockchainNetworks(): Promise<any[]> {
    try {
      const contractAddresses = await this.getAllContractAddresses();
      
      // Convert contract addresses to network configurations
      return contractAddresses.map(ca => ({
        network: ca.network,
        chainId: ca.chainId,
        rpcUrl: ca.rpcUrl,
        explorerUrl: ca.explorerUrl,
        publicAddress: ca.publicAddress,
        contractAddress: ca.address,
        networkName: ca.networkName || ca.network,
        symbol: ca.symbol || 'TSK',
        decimals: ca.decimals || 18,
        active: true
      }));
    } catch (error) {
      console.error('Error getting blockchain networks:', error);
      return [];
    }
  }
  
  // Alias for getOnboardingPreferences for platform scanner
  async getUserOnboardingPreferences(userId: number): Promise<OnboardingPreference | undefined> {
    return this.getOnboardingPreferences(userId);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getUserByReferralCode(referralCode: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.referralCode, referralCode));
    return user;
  }
  
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Create new user with default values
    const userData = {
      ...insertUser,
      tokenBalance: 0,
      miningRate: 1,
      lastMiningTime: null,
      premiumTier: "Basic",
      premiumMultiplier: 1,
      role: "user"
    };

    const [user] = await db.insert(users).values(userData).returning();

    // If user was referred, create referral record
    if (user.referredBy) {
      await this.createReferral({
        referrerId: user.referredBy,
        referredId: user.id
      });
    }

    // Create an initial KYC record with "unverified" status
    try {
      await db.insert(userKyc).values({
        userId: user.id,
        status: "unverified",
        submissionDate: null
      });
      console.log(`Created initial unverified KYC record for user ${user.id}`);
    } catch (error) {
      console.error(`Failed to create initial KYC record for user ${user.id}:`, error);
      // Don't throw here as we don't want to fail the user creation
    }

    // Send welcome email if email was provided
    try {
      if (user.email) {
        const { emailService } = require('./services/email-service');
        await emailService.sendWelcomeEmail(user.email, user.username);
        console.log(`Sent welcome email to ${user.email}`);
      }
    } catch (emailError) {
      console.error(`Failed to send welcome email to user ${user.id}:`, emailError);
      // Don't throw here as we don't want to fail the user creation
    }

    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();

    if (!updatedUser) {
      throw new Error(`User with id ${id} not found`);
    }

    return updatedUser;
  }
  
  // KYC operations
  async submitKyc(userId: number, kycData: KycSubmission): Promise<User> {
    console.log(`KYC submission started for userId: ${userId}`);
    
    const user = await this.getUser(userId);
    if (!user) {
      console.error(`KYC submission failed: User with id ${userId} not found`);
      throw new Error(`User with id ${userId} not found`);
    }
    
    // Check if user already has a KYC submission
    const existingKyc = await this.getUserKyc(userId);
    
    try {
      if (existingKyc) {
        console.log(`Updating existing KYC for user ${userId}, current status: "${existingKyc.status}"`);
        // Update existing KYC record
        await db.update(userKyc)
          .set({
            fullName: kycData.fullName,
            country: kycData.country,
            documentType: kycData.documentType,
            documentId: kycData.documentId,
            frontImageUrl: kycData.frontImageUrl,
            backImageUrl: kycData.backImageUrl,
            selfieImageUrl: kycData.selfieImageUrl,
            status: "pending",
            submissionDate: new Date(),
            verificationDate: null,
            rejectionReason: null
          })
          .where(eq(userKyc.id, existingKyc.id));
          
        console.log(`KYC status for user ${userId} updated from "${existingKyc.status}" to "pending"`);
      } else {
        console.log(`Creating new KYC record for user ${userId} with status "pending"`);
        // Create new KYC record
        await db.insert(userKyc)
          .values({
            userId: userId,
            fullName: kycData.fullName,
            country: kycData.country,
            documentType: kycData.documentType,
            documentId: kycData.documentId,
            frontImageUrl: kycData.frontImageUrl,
            backImageUrl: kycData.backImageUrl,
            selfieImageUrl: kycData.selfieImageUrl,
            status: "pending",
            submissionDate: new Date()
          });
      }
      
      console.log(`KYC submission successful for user ${userId}, status set to "pending"`);
      return user;
    } catch (error) {
      console.error(`Error in submitKyc for user ${userId}:`, error);
      throw error;
    }
  }
  
  async getUserKyc(userId: number): Promise<UserKyc | undefined> {
    const [kycRecord] = await db.select()
      .from(userKyc)
      .where(eq(userKyc.userId, userId));
    
    return kycRecord;
  }
  
  async getKycStatus(userId: number): Promise<{ status: string, submissionDate: Date | null, rejectionReason?: string }> {
    console.log("Getting KYC status for user:", userId);
    const kycRecord = await this.getUserKyc(userId);
    
    if (!kycRecord) {
      console.log("No KYC record found, returning unverified status");
      return { status: "unverified", submissionDate: null };
    }
    
    console.log("Found KYC record with status:", kycRecord.status);
    return {
      status: kycRecord.status,
      submissionDate: kycRecord.submissionDate || null,
      rejectionReason: kycRecord.rejectionReason || undefined
    };
  }
  
  async getUsersByKycStatus(status: string): Promise<any[]> {
    // Get KYC records with the requested status and include user information
    const kycRecords = await db.select({
      kyc: userKyc,
      user: users
    })
      .from(userKyc)
      .innerJoin(users, eq(userKyc.userId, users.id))
      .where(eq(userKyc.status, status))
      .orderBy(desc(userKyc.submissionDate));
      
  // Rest of function continues below...
    // Return the combined records
    return kycRecords.map(record => ({
      ...record.kyc,
      user: {
        ...record.user,
        password: undefined
      }
    }));
  }
  
  async getUserKYCStatus(userId: number): Promise<any> {
    const kycStatus = await this.getKycStatus(userId);
    // Add extra information needed by KYC assistant
    const kycRecord = await this.getUserKyc(userId);
    
    return {
      ...kycStatus,
      userId,
      updatedAt: kycRecord?.updatedAt
    };
  }
  
  async getPendingKYCSubmissions(userId: number): Promise<any[]> {
    const kycRecord = await this.getUserKyc(userId);
    
    if (!kycRecord || kycRecord.status !== 'pending') {
      return [];
    }
    
    // Return document submissions as pending items
    const documents = [];
    
    if (kycRecord.documentUrl) {
      documents.push({
        id: kycRecord.id,
        documentType: kycRecord.documentType,
        submissionDate: kycRecord.createdAt,
        status: 'pending'
      });
    }
    
    if (kycRecord.addressDocumentUrl) {
      documents.push({
        id: kycRecord.id,
        documentType: 'proof_of_address',
        submissionDate: kycRecord.createdAt,
        status: 'pending'
      });
    }
    
    if (kycRecord.selfieUrl) {
      documents.push({
        id: kycRecord.id,
        documentType: 'selfie',
        submissionDate: kycRecord.createdAt,
        status: 'pending'
      });
    }
    
    return documents;
  }
  
  async getKYCSubmission(id: number): Promise<any> {
    const [kycRecord] = await db.select()
      .from(userKyc)
      .where(eq(userKyc.id, id));
    
    if (!kycRecord) {
      return null;
    }
    
    return {
      id: kycRecord.id,
      userId: kycRecord.userId,
      documentType: kycRecord.documentType,
      documentUrl: kycRecord.documentUrl,
      selfieUrl: kycRecord.selfieUrl,
      addressDocumentUrl: kycRecord.addressDocumentUrl,
      status: kycRecord.status,
      createdAt: kycRecord.createdAt,
      updatedAt: kycRecord.updatedAt,
      notes: kycRecord.notes,
      rejectionReason: kycRecord.rejectionReason
    };
  }
  
  async createKYCSubmission(data: any): Promise<any> {
    const { userId, documentType, documentUrl, selfieUrl } = data;
    
    // Check if the user has an existing KYC record
    const existingKYC = await this.getUserKyc(userId);
    
    if (existingKYC) {
      // Update existing record
      const [updatedKYC] = await db.update(userKyc)
        .set({
          documentType: documentType || existingKYC.documentType,
          documentUrl: documentUrl || existingKYC.documentUrl,
          selfieUrl: selfieUrl || existingKYC.selfieUrl,
          status: 'pending', // Reset to pending for new submission
          updatedAt: new Date()
        })
        .where(eq(userKyc.userId, userId))
        .returning();
        
      return updatedKYC;
    } else {
      // Create new record
      const [newKYC] = await db.insert(userKyc)
        .values({
          userId,
          documentType,
          documentUrl,
          selfieUrl: selfieUrl || null,
          status: 'pending',
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
        
      return newKYC;
    }
  }
  
  async updateKYCStatus(userId: number, status: string, reason?: string): Promise<any> {
    const kycRecord = await this.getUserKyc(userId);
    
    if (!kycRecord) {
      throw new Error(`No KYC record found for user ${userId}`);
    }
    
    const [updatedKYC] = await db.update(userKyc)
      .set({
        status,
        rejectionReason: status === 'rejected' ? reason || null : null,
        updatedAt: new Date()
      })
      .where(eq(userKyc.userId, userId))
      .returning();
      
    // Update user's verified status if approved
    if (status === 'approved') {
      await this.updateUser(userId, { verified: true });
    }
    
    return updatedKYC;
  }
  
  async getKYCSubmissionsByStatus(status: string): Promise<any[]> {
    return db.select()
      .from(userKyc)
      .where(eq(userKyc.status, status))
      .orderBy(desc(userKyc.updatedAt));
  }
  
  async verifyKyc(data: KycVerification): Promise<User> {
    const { kycId, status, rejectionReason } = data;
    
    console.log(`KYC verification requested for KYC ID ${kycId} with status: "${status}"`);
    
    // Get the KYC record
    const [kycRecord] = await db.select()
      .from(userKyc)
      .where(eq(userKyc.id, kycId));
    
    if (!kycRecord) {
      console.error(`KYC verification failed: KYC record with id ${kycId} not found`);
      throw new Error(`KYC record with id ${kycId} not found`);
    }
    
    console.log(`Found KYC record for user ${kycRecord.userId}, current status: "${kycRecord.status}"`);
    
    // Get the user
    const user = await this.getUser(kycRecord.userId);
    if (!user) {
      console.error(`KYC verification failed: User with id ${kycRecord.userId} not found`);
      throw new Error(`User with id ${kycRecord.userId} not found`);
    }
    
    // Update KYC status
    const updateData: Partial<UserKyc> = {
      status,
      verificationDate: new Date()
    };
    
    // Add rejection reason if status is rejected
    if (status === "rejected" && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
      console.log(`Setting rejection reason for user ${user.id}: "${rejectionReason}"`);
    } else if (status === "verified") {
      // Clear any previous rejection reason if now verified
      updateData.rejectionReason = null;
      console.log(`Clearing rejection reason for user ${user.id} as they are now verified`);
    }
    
    console.log(`Updating KYC status for user ${user.id} from "${kycRecord.status}" to "${status}"`);
    
    await db.update(userKyc)
      .set(updateData)
      .where(eq(userKyc.id, kycId));
    
    console.log(`KYC verification completed for user ${user.id}, new status: "${status}"`);
    
    return user;
  }

  // Mining operations
  async recordMining(insertMiningHistory: InsertMiningHistory): Promise<MiningHistory> {
    // Calculate total amount (base + bonus)
    const baseAmount = insertMiningHistory.amount || 0;
    const bonusAmount = insertMiningHistory.bonusAmount || 0;
    const totalAmount = baseAmount + bonusAmount;
    
    // Create mining record
    const [miningRecord] = await db
      .insert(miningHistory)
      .values({
        ...insertMiningHistory,
        timestamp: new Date()
      })
      .returning();

    // Get user
    const user = await this.getUser(miningRecord.userId);
    if (user) {
      // Update user's token balance and last mining time
      await this.updateUser(user.id, { 
        tokenBalance: user.tokenBalance + totalAmount,
        lastMiningTime: new Date()
      });
    }

    return miningRecord;
  }

  async getMiningHistory(userId: number, limit?: number): Promise<MiningHistory[]> {
    const query = db.select()
      .from(miningHistory)
      .where(eq(miningHistory.userId, userId))
      .orderBy(desc(miningHistory.timestamp));

    // Execute different queries based on whether a limit is provided
    if (limit) {
      return await query.limit(limit);
    }

    return await query;
  }

  async getAllMiningHistory(limit?: number): Promise<any[]> {
    // Join with users to get user information with the mining history
    const query = db.select({
      id: miningHistory.id,
      userId: miningHistory.userId,
      amount: miningHistory.amount,
      bonusAmount: miningHistory.bonusAmount,
      bonusType: miningHistory.bonusType,
      streakDay: miningHistory.streakDay,
      timestamp: miningHistory.timestamp,
      user_id: users.id,
      username: users.username,
      tokenBalance: users.tokenBalance,
      miningRate: users.miningRate
    })
      .from(miningHistory)
      .leftJoin(users, eq(miningHistory.userId, users.id))
      .orderBy(desc(miningHistory.timestamp));

    const results = limit ? await query.limit(limit) : await query;
    
    return results.map(row => {
      return {
        id: row.id,
        userId: row.userId,
        amount: row.amount,
        bonusAmount: row.bonusAmount,
        bonusType: row.bonusType,
        streakDay: row.streakDay,
        timestamp: row.timestamp,
        user: row.user_id ? {
          id: row.user_id,
          username: row.username,
          tokenBalance: row.tokenBalance,
          miningRate: row.miningRate
        } : undefined
      };
    });
  }

  async deleteMiningHistoryEntry(id: number): Promise<boolean> {
    const result = await db.delete(miningHistory)
      .where(eq(miningHistory.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async updateUserStreak(userId: number, streakDay: number): Promise<User> {
    // First, get the user
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // If streak is being reset, we don't need to update the mining history
    if (streakDay === 0) {
      // Find the last mining entry for this user
      const [lastMining] = await db.select()
        .from(miningHistory)
        .where(eq(miningHistory.userId, userId))
        .orderBy(desc(miningHistory.timestamp))
        .limit(1);

      if (lastMining) {
        // Update the streak day to 0 (reset)
        await db.update(miningHistory)
          .set({ streakDay: 0 })
          .where(eq(miningHistory.id, lastMining.id));
      }
    }

    return user;
  }
  
  async getUsersByMiningStatus(active: boolean): Promise<User[]> {
    return await db.select()
      .from(users)
      .where(eq(users.miningActive, active));
  }

  // Referral operations
  async createReferral(insertReferral: InsertReferral): Promise<Referral> {
    const [referral] = await db
      .insert(referrals)
      .values({
        ...insertReferral,
        createdAt: new Date(),
        active: true
      })
      .returning();

    return referral;
  }

  async getReferrals(referrerId: number): Promise<Referral[]> {
    return db.select()
      .from(referrals)
      .where(eq(referrals.referrerId, referrerId));
  }

  async getActiveReferralsCount(referrerId: number): Promise<number> {
    const result = await db.select({ count: sql`count(*)` })
      .from(referrals)
      .where(
        and(
          eq(referrals.referrerId, referrerId),
          eq(referrals.active, true)
        )
      );

    return Number(result[0]?.count || 0);
  }

  // Premium packages operations
  async getPremiumPackages(): Promise<PremiumPackage[]> {
    return db.select()
      .from(premiumPackages)
      .where(eq(premiumPackages.active, true))
      .orderBy(premiumPackages.price);
  }

  async getPremiumPackage(id: number): Promise<PremiumPackage | undefined> {
    const [package_] = await db
      .select()
      .from(premiumPackages)
      .where(eq(premiumPackages.id, id));

    return package_;
  }

  async createPremiumPackage(insertPackage: InsertPremiumPackage): Promise<PremiumPackage> {
    const [package_] = await db
      .insert(premiumPackages)
      .values(insertPackage)
      .returning();

    return package_;
  }

  async updatePremiumPackage(id: number, data: Partial<PremiumPackage>): Promise<PremiumPackage | undefined> {
    const [updatedPackage] = await db
      .update(premiumPackages)
      .set(data)
      .where(eq(premiumPackages.id, id))
      .returning();

    return updatedPackage;
  }
  
  // Subscription operations
  async createSubscription(subscriptionData: InsertSubscription): Promise<Subscription> {
    const [subscription] = await db
      .insert(subscriptions)
      .values(subscriptionData)
      .returning();
      
    return subscription;
  }
  
  async getSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.id, id));
      
    return subscription;
  }
  
  async getUserSubscriptions(userId: number): Promise<Subscription[]> {
    return db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt));
  }
  
  async updateSubscription(id: number, data: Partial<Subscription>): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set(data)
      .where(eq(subscriptions.id, id))
      .returning();
      
    return subscription;
  }
  
  async cancelSubscription(id: number): Promise<Subscription | undefined> {
    const [subscription] = await db
      .update(subscriptions)
      .set({
        status: "cancelled",
        autoRenew: false,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, id))
      .returning();
      
    return subscription;
  }
  
  // Subscription payment operations
  async createSubscriptionPayment(paymentData: InsertSubscriptionPayment): Promise<SubscriptionPayment> {
    const [payment] = await db
      .insert(subscriptionPayments)
      .values(paymentData)
      .returning();
      
    return payment;
  }
  
  async getSubscriptionPayments(subscriptionId: number): Promise<SubscriptionPayment[]> {
    return db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.subscriptionId, subscriptionId))
      .orderBy(desc(subscriptionPayments.createdAt));
  }
  
  async getUserSubscriptionPayments(userId: number): Promise<SubscriptionPayment[]> {
    return db
      .select()
      .from(subscriptionPayments)
      .where(eq(subscriptionPayments.userId, userId))
      .orderBy(desc(subscriptionPayments.createdAt));
  }

  // Marketplace operations
  async getMarketplaceItems(approved?: boolean): Promise<MarketplaceItem[]> {
    // For items not sold
    if (approved !== undefined) {
      // For specific approval status
      return db.select()
        .from(marketplaceItems)
        .where(and(
          eq(marketplaceItems.sold, false),
          eq(marketplaceItems.approved, approved)
        ))
        .orderBy(desc(marketplaceItems.createdAt));
    } else {
      // For all items regardless of approval
      return db.select()
        .from(marketplaceItems)
        .where(eq(marketplaceItems.sold, false))
        .orderBy(desc(marketplaceItems.createdAt));
    }
  }

  async getMarketplaceItem(id: number): Promise<MarketplaceItem | undefined> {
    const [item] = await db
      .select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.id, id));

    return item;
  }

  async createMarketplaceItem(insertItem: InsertMarketplaceItem): Promise<MarketplaceItem> {
    const [item] = await db
      .insert(marketplaceItems)
      .values({
        ...insertItem,
        approved: false,
        sold: false,
        createdAt: new Date()
      })
      .returning();

    return item;
  }

  async updateMarketplaceItem(id: number, data: Partial<MarketplaceItem>): Promise<MarketplaceItem | undefined> {
    const [updatedItem] = await db
      .update(marketplaceItems)
      .set(data)
      .where(eq(marketplaceItems.id, id))
      .returning();

    return updatedItem;
  }

  async getUserMarketplaceItems(userId: number): Promise<MarketplaceItem[]> {
    return db.select()
      .from(marketplaceItems)
      .where(eq(marketplaceItems.sellerId, userId))
      .orderBy(desc(marketplaceItems.createdAt));
  }
  
  async deleteMarketplaceItem(id: number): Promise<boolean> {
    const result = await db.delete(marketplaceItems)
      .where(eq(marketplaceItems.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async getMarketplaceItemsByCategory(category: string, limit?: number): Promise<MarketplaceItem[]> {
    // Query for items by category, only approved and not sold items
    const query = db.select()
      .from(marketplaceItems)
      .where(and(
        eq(marketplaceItems.approved, true),
        eq(marketplaceItems.sold, false),
        eq(marketplaceItems.category, category)
      ))
      .orderBy(desc(marketplaceItems.createdAt));
    
    // Apply limit if provided
    if (limit !== undefined) {
      return query.limit(limit);
    }
    
    return query;
  }
  
  async getFeaturedMarketplaceItems(limit?: number): Promise<MarketplaceItem[]> {
    // Query for featured items - we'll use the most recent approved items
    const query = db.select()
      .from(marketplaceItems)
      .where(and(
        eq(marketplaceItems.approved, true),
        eq(marketplaceItems.sold, false)
      ))
      .orderBy(desc(marketplaceItems.createdAt));
    
    // Apply limit if provided
    if (limit !== undefined) {
      return query.limit(limit);
    }
    
    return query;
  }

  // Transaction operations
  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    // Create transaction record
    const [transaction] = await db
      .insert(transactions)
      .values({
        ...insertTransaction,
        timestamp: new Date()
      })
      .returning();

    // Update buyer's and seller's token balances
    const buyer = await this.getUser(transaction.buyerId);
    const seller = await this.getUser(transaction.sellerId);

    if (buyer) {
      await this.updateUser(buyer.id, { 
        tokenBalance: buyer.tokenBalance - transaction.amount
      });
    }

    if (seller) {
      await this.updateUser(seller.id, { 
        tokenBalance: seller.tokenBalance + transaction.amount
      });
    }

    // If it's a marketplace transaction, mark the item as sold
    if (transaction.type === 'marketplace' && transaction.itemId) {
      await this.updateMarketplaceItem(transaction.itemId, { sold: true });
    }

    // If it's a premium package purchase, update user's premium tier and multiplier
    if (transaction.type === 'premium' && transaction.packageId) {
      const package_ = await this.getPremiumPackage(transaction.packageId);
      if (package_ && buyer) {
        await this.updateUser(buyer.id, {
          premiumTier: package_.name,
          premiumMultiplier: package_.miningMultiplier
        });
      }
    }

    return transaction;
  }

  async getUserTransactions(userId: number): Promise<Transaction[]> {
    return db.select()
      .from(transactions)
      .where(
        or(
          eq(transactions.buyerId, userId),
          eq(transactions.sellerId, userId)
        )
      )
      .orderBy(desc(transactions.timestamp));
  }
  
  async getTransactionsByUser(userId: number, limit?: number): Promise<Transaction[]> {
    const query = db.select()
      .from(transactions)
      .where(
        or(
          eq(transactions.buyerId, userId),
          eq(transactions.sellerId, userId)
        )
      )
      .orderBy(desc(transactions.timestamp));
    
    if (limit && limit > 0) {
      return query.limit(limit);
    }
    
    return query;
  }

  // Banner image operations
  async getBannerImages(activeOnly: boolean = false): Promise<BannerImage[]> {
    if (activeOnly) {
      const result = await db.select()
        .from(bannerImages)
        .where(eq(bannerImages.active, true))
        .orderBy(desc(bannerImages.priority), desc(bannerImages.createdAt));
      return result;
    } else {
      const result = await db.select()
        .from(bannerImages)
        .orderBy(desc(bannerImages.priority), desc(bannerImages.createdAt));
      return result;
    }
  }

  async getBannerImage(id: number): Promise<BannerImage | undefined> {
    const [banner] = await db.select()
      .from(bannerImages)
      .where(eq(bannerImages.id, id));
    
    return banner;
  }

  async createBannerImage(bannerData: InsertBannerImage): Promise<BannerImage> {
    const [banner] = await db.insert(bannerImages)
      .values({
        ...bannerData,
        createdAt: new Date()
      })
      .returning();
    
    return banner;
  }

  async updateBannerImage(id: number, data: Partial<BannerImage>): Promise<BannerImage | undefined> {
    const [updatedBanner] = await db.update(bannerImages)
      .set(data)
      .where(eq(bannerImages.id, id))
      .returning();
    
    return updatedBanner;
  }

  async deleteBannerImage(id: number): Promise<boolean> {
    try {
      const result = await db.delete(bannerImages)
        .where(eq(bannerImages.id, id));
      
      // Always return true regardless of whether rows were affected
      // This ensures clients always treat the operation as successful
      // since the end result is the same - the item doesn't exist anymore
      return true;
    } catch (error) {
      console.error(`Error in deleteBannerImage(${id}):`, error);
      // Still return true to client since the goal is to have the item gone
      return true;
    }
  }

  // Embedded ad operations
  async getEmbeddedAds(activeOnly: boolean = false): Promise<EmbeddedAd[]> {
    if (activeOnly) {
      const result = await db.select()
        .from(embeddedAds)
        .where(eq(embeddedAds.active, true))
        .orderBy(desc(embeddedAds.priority), desc(embeddedAds.createdAt));
      return result;
    } else {
      const result = await db.select()
        .from(embeddedAds)
        .orderBy(desc(embeddedAds.priority), desc(embeddedAds.createdAt));
      return result;
    }
  }

  async getEmbeddedAd(id: number): Promise<EmbeddedAd | undefined> {
    const [ad] = await db.select()
      .from(embeddedAds)
      .where(eq(embeddedAds.id, id));
    
    return ad;
  }

  async createEmbeddedAd(adData: InsertEmbeddedAd): Promise<EmbeddedAd> {
    const [ad] = await db.insert(embeddedAds)
      .values({
        ...adData,
        createdAt: new Date()
      })
      .returning();
    
    return ad;
  }

  async updateEmbeddedAd(id: number, data: Partial<EmbeddedAd>): Promise<EmbeddedAd | undefined> {
    const [updatedAd] = await db.update(embeddedAds)
      .set(data)
      .where(eq(embeddedAds.id, id))
      .returning();
    
    return updatedAd;
  }

  async deleteEmbeddedAd(id: number): Promise<boolean> {
    try {
      const result = await db.delete(embeddedAds)
        .where(eq(embeddedAds.id, id));
      
      // Always return true regardless of whether rows were affected
      // This ensures clients always treat the operation as successful
      // since the end result is the same - the item doesn't exist anymore
      return true;
    } catch (error) {
      console.error(`Error in deleteEmbeddedAd(${id}):`, error);
      // Still return true to client since the goal is to have the item gone
      return true;
    }
  }

  // Admin Task operations
  async createAdminTask(taskData: InsertAdminTask): Promise<AdminTask> {
    const [task] = await db
      .insert(adminTasks)
      .values({
        ...taskData,
        status: taskData.status || "pending", // Default to pending if not provided
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();

    return task;
  }

  async getAdminTasks(status?: string): Promise<AdminTask[]> {
    // Use two separate queries to avoid alias conflicts
    const tasks = await db.select().from(adminTasks)
      .where(status ? eq(adminTasks.status, status) : undefined);
    
    // Fetch related data separately to avoid join issues
    const result: AdminTask[] = [];
    
    for (const task of tasks) {
      const assignee = task.assignedTo ? await this.getUser(task.assignedTo) : undefined;
      const creator = task.createdBy ? await this.getUser(task.createdBy) : undefined;
      
      result.push({
        ...task,
        assignee: assignee ? {
          id: assignee.id,
          username: assignee.username,
          role: assignee.role
        } : null,
        creator: creator ? {
          id: creator.id,
          username: creator.username,
          role: creator.role
        } : null
      } as AdminTask);
    }
    
    return result;
  }

  async getUserAdminTasks(userId: number, includeCreated: boolean = false): Promise<AdminTask[]> {
    let condition;
    
    if (includeCreated) {
      condition = or(
        eq(adminTasks.assignedTo, userId),
        eq(adminTasks.createdBy, userId)
      );
    } else {
      condition = eq(adminTasks.assignedTo, userId);
    }
    
    // Use regular query without joins to avoid alias conflicts
    const tasks = await db.select().from(adminTasks).where(condition);
    
    // Fetch related data separately to avoid join issues
    const result: AdminTask[] = [];
    
    for (const task of tasks) {
      const assignee = task.assignedTo ? await this.getUser(task.assignedTo) : undefined;
      const creator = task.createdBy ? await this.getUser(task.createdBy) : undefined;
      
      result.push({
        ...task,
        assignee: assignee ? {
          id: assignee.id,
          username: assignee.username,
          role: assignee.role
        } : null,
        creator: creator ? {
          id: creator.id,
          username: creator.username,
          role: creator.role
        } : null
      } as AdminTask);
    }
    
    return result;
  }

  async getAdminTask(id: number): Promise<AdminTask | undefined> {
    // Use simple query without joins to avoid alias conflicts
    const [task] = await db.select().from(adminTasks).where(eq(adminTasks.id, id));
    
    if (!task) {
      return undefined;
    }
    
    // Fetch related data separately
    const assignee = task.assignedTo ? await this.getUser(task.assignedTo) : undefined;
    const creator = task.createdBy ? await this.getUser(task.createdBy) : undefined;
    
    // Create a new object with the task and user information
    const result = {
      ...task,
      assignee: assignee ? {
        id: assignee.id,
        username: assignee.username,
        role: assignee.role
      } : null,
      creator: creator ? {
        id: creator.id,
        username: creator.username,
        role: creator.role
      } : null
    } as AdminTask;
    
    return result;
  }

  async updateAdminTask(id: number, data: Partial<AdminTask>): Promise<AdminTask | undefined> {
    // Always update the updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const [updatedTask] = await db
      .update(adminTasks)
      .set(updateData)
      .where(eq(adminTasks.id, id))
      .returning();
    
    if (!updatedTask) {
      return undefined;
    }
    
    // Fetch the task with user information
    return this.getAdminTask(id);
  }

  async deleteAdminTask(id: number): Promise<boolean> {
    const result = await db.delete(adminTasks)
      .where(eq(adminTasks.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Learning path operations
  async createLearningPath(data: InsertLearningPath): Promise<LearningPath> {
    const [path] = await db
      .insert(learningPaths)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();
    return path;
  }

  async getLearningPaths(activeOnly: boolean = false): Promise<LearningPath[]> {
    // Create a base query without any filters first
    const query = db.select().from(learningPaths);
    
    // Add filters as a separate step to avoid TypeScript errors with the query object
    let result = activeOnly 
      ? await query.where(eq(learningPaths.active, true)) 
      : await query;
    
    // Sort the results after fetching
    return result.sort((a, b) => b.priority - a.priority);
  }

  async getLearningPath(id: number): Promise<LearningPath | undefined> {
    const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, id));
    return path;
  }

  async getLearningPathsByCategory(category: string, activeOnly: boolean = true): Promise<LearningPath[]> {
    // Create base query with category filter
    const result = await db
      .select()
      .from(learningPaths)
      .where(eq(learningPaths.category, category));
    
    // Filter by active status if needed
    const filteredResults = activeOnly 
      ? result.filter(path => path.active) 
      : result;
    
    // Sort by priority
    return filteredResults.sort((a, b) => b.priority - a.priority);
  }

  async getLearningPathsByFeature(feature: string, activeOnly: boolean = true): Promise<LearningPath[]> {
    // Get all paths first, then filter
    const allPaths = await db
      .select()
      .from(learningPaths);
    
    // Filter paths that have the feature in their requiredForFeatures array
    const paths = allPaths.filter(path => {
      if (!path.requiredForFeatures) return false;
      return path.requiredForFeatures.includes(feature);
    });
    
    // Filter by active status if needed
    if (activeOnly) {
      return paths.filter(path => path.active);
    }
    
    return paths;
  }

  async updateLearningPath(id: number, data: Partial<LearningPath>): Promise<LearningPath | undefined> {
    const [updatedPath] = await db
      .update(learningPaths)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(learningPaths.id, id))
      .returning();
    
    return updatedPath;
  }

  async deleteLearningPath(id: number): Promise<boolean> {
    // This will cascade delete the steps due to the foreign key constraint
    const result = await db
      .delete(learningPaths)
      .where(eq(learningPaths.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Learning step operations
  async createLearningStep(data: InsertLearningStep): Promise<LearningStep> {
    const [step] = await db
      .insert(learningSteps)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return step;
  }

  async getLearningSteps(pathId: number): Promise<LearningStep[]> {
    return await db
      .select()
      .from(learningSteps)
      .where(eq(learningSteps.pathId, pathId))
      .orderBy(asc(learningSteps.orderIndex));
  }

  async getLearningStep(id: number): Promise<LearningStep | undefined> {
    const [step] = await db
      .select()
      .from(learningSteps)
      .where(eq(learningSteps.id, id));
    
    return step;
  }

  async updateLearningStep(id: number, data: Partial<LearningStep>): Promise<LearningStep | undefined> {
    const [updatedStep] = await db
      .update(learningSteps)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(learningSteps.id, id))
      .returning();
    
    return updatedStep;
  }

  async deleteLearningStep(id: number): Promise<boolean> {
    const result = await db
      .delete(learningSteps)
      .where(eq(learningSteps.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  async reorderLearningSteps(pathId: number, orderedIds: number[]): Promise<LearningStep[]> {
    // Get all steps for this path
    const steps = await this.getLearningSteps(pathId);
    
    // Ensure all IDs are actually part of this path
    const pathStepIds = steps.map(step => step.id);
    const validOrderedIds = orderedIds.filter(id => pathStepIds.includes(id));
    
    // Update order indexes
    const updatePromises = validOrderedIds.map((id, index) => {
      return db
        .update(learningSteps)
        .set({ orderIndex: index })
        .where(eq(learningSteps.id, id));
    });
    
    await Promise.all(updatePromises);
    
    // Return the new ordered steps
    return await this.getLearningSteps(pathId);
  }

  // Whitepaper operations
  async getWhitepapers(publishedOnly: boolean = false): Promise<Whitepaper[]> {
    if (publishedOnly) {
      const result = await db.select()
        .from(whitepapers)
        .where(eq(whitepapers.published, true))
        .orderBy(desc(whitepapers.createdAt));
      return result;
    } else {
      const result = await db.select()
        .from(whitepapers)
        .orderBy(desc(whitepapers.createdAt));
      return result;
    }
  }
  
  async getWhitepaper(id: number): Promise<Whitepaper | undefined> {
    const [whitepaper] = await db.select()
      .from(whitepapers)
      .where(eq(whitepapers.id, id));
    
    return whitepaper;
  }
  
  async createWhitepaper(insertWhitepaper: InsertWhitepaper): Promise<Whitepaper> {
    const [whitepaper] = await db.insert(whitepapers)
      .values({
        ...insertWhitepaper,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return whitepaper;
  }
  
  async updateWhitepaper(id: number, data: Partial<Whitepaper>): Promise<Whitepaper | undefined> {
    const [updatedWhitepaper] = await db.update(whitepapers)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(whitepapers.id, id))
      .returning();
    
    return updatedWhitepaper;
  }
  
  async deleteWhitepaper(id: number): Promise<boolean> {
    const result = await db.delete(whitepapers)
      .where(eq(whitepapers.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User progress operations
  async createUserProgress(data: InsertUserProgress): Promise<UserProgress> {
    // Check if progress already exists
    const existingProgress = await this.getUserProgress(data.userId, data.pathId);
    if (existingProgress) {
      return existingProgress;
    }
    
    const [progress] = await db
      .insert(userProgress)
      .values({
        ...data,
        startedAt: new Date(),
        lastActivityAt: new Date(),
        isCompleted: false,
        completedSteps: []
      })
      .returning();
    
    return progress;
  }

  async getUserProgress(userId: number, pathId: number): Promise<UserProgress | undefined> {
    const [progress] = await db
      .select()
      .from(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.pathId, pathId)
        )
      );
    
    return progress;
  }

  async getUserProgressAll(userId: number): Promise<UserProgress[]> {
    return await db
      .select()
      .from(userProgress)
      .where(eq(userProgress.userId, userId));
  }

  async updateUserProgress(userId: number, pathId: number, data: Partial<UserProgress>): Promise<UserProgress | undefined> {
    const [updatedProgress] = await db
      .update(userProgress)
      .set({
        ...data,
        lastActivityAt: new Date()
      })
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.pathId, pathId)
        )
      )
      .returning();
    
    return updatedProgress;
  }

  async completeStep(userId: number, pathId: number, stepId: number): Promise<UserProgress> {
    // Get current progress
    let progress = await this.getUserProgress(userId, pathId);
    
    // If no progress exists, create a new record
    if (!progress) {
      progress = await this.createUserProgress({
        userId,
        pathId,
        lastStepCompleted: null,
        isCompleted: false,
        completedAt: null,
        completedSteps: []
      });
    }
    
    // Get steps to determine if this is the last step
    const steps = await this.getLearningSteps(pathId);
    const currentStep = steps.find(step => step.id === stepId);
    
    if (!currentStep) {
      throw new Error(`Step with id ${stepId} not found in path ${pathId}`);
    }

    // Update completed steps array
    let completedSteps = progress.completedSteps || [];
    if (!completedSteps.includes(stepId)) {
      completedSteps.push(stepId);
    }
    
    // Check if this is the last step
    const isLastStep = steps.length > 0 && 
      currentStep.orderIndex === Math.max(...steps.map(s => s.orderIndex));
    
    // Check if all required steps are completed
    const requiredSteps = steps.filter(step => step.isRequired);
    const allRequiredCompleted = requiredSteps.every(step => 
      completedSteps.includes(step.id)
    );
    
    // Update progress
    const updateData: Partial<UserProgress> = {
      lastStepCompleted: stepId,
      completedSteps: completedSteps,
      lastActivityAt: new Date()
    };
    
    // If this is the last step or all required steps are done, mark as complete
    if ((isLastStep || allRequiredCompleted) && !progress.isCompleted) {
      updateData.isCompleted = true;
      updateData.completedAt = new Date();
    }
    
    const [updatedProgress] = await db
      .update(userProgress)
      .set(updateData)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.pathId, pathId)
        )
      )
      .returning();
    
    return updatedProgress;
  }

  async resetUserProgress(userId: number, pathId: number): Promise<boolean> {
    const result = await db
      .delete(userProgress)
      .where(
        and(
          eq(userProgress.userId, userId),
          eq(userProgress.pathId, pathId)
        )
      );
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  // User interaction operations
  async recordUserInteraction(data: InsertUserInteraction): Promise<UserInteraction> {
    const [interaction] = await db
      .insert(userInteractions)
      .values({
        ...data,
        timestamp: new Date()
      })
      .returning();
    
    return interaction;
  }

  async getUserInteractions(userId: number, limit?: number): Promise<UserInteraction[]> {
    const query = db
      .select()
      .from(userInteractions)
      .where(eq(userInteractions.userId, userId))
      .orderBy(desc(userInteractions.timestamp));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getUserInteractionsByType(userId: number, type: string, limit?: number): Promise<UserInteraction[]> {
    const query = db
      .select()
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.interactionType, type)
        )
      )
      .orderBy(desc(userInteractions.timestamp));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  async getUserInteractionsByFeature(userId: number, feature: string, limit?: number): Promise<UserInteraction[]> {
    const query = db
      .select()
      .from(userInteractions)
      .where(
        and(
          eq(userInteractions.userId, userId),
          eq(userInteractions.featureName, feature)
        )
      )
      .orderBy(desc(userInteractions.timestamp));
    
    if (limit) {
      return await query.limit(limit);
    }
    
    return await query;
  }

  // Onboarding preferences operations
  async createOnboardingPreferences(data: InsertOnboardingPreferences): Promise<OnboardingPreference> {
    // Check if preferences already exist
    const existingPreferences = await this.getOnboardingPreferences(data.userId);
    if (existingPreferences) {
      const updatedPreferences = await this.updateOnboardingPreferences(data.userId, data);
      if (!updatedPreferences) {
        throw new Error(`Failed to update preferences for user ${data.userId}`);
      }
      return updatedPreferences;
    }
    
    const [preferences] = await db
      .insert(onboardingPreferences)
      .values({
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return preferences;
  }

  async getOnboardingPreferences(userId: number): Promise<OnboardingPreference | undefined> {
    try {
      const [preferences] = await db
        .select()
        .from(onboardingPreferences)
        .where(eq(onboardingPreferences.userId, userId));
      
      return preferences;
    } catch (error) {
      console.error(`Error fetching onboarding preferences for user ${userId}:`, error);
      throw error;
    }
  }

  async updateOnboardingPreferences(userId: number, data: Partial<OnboardingPreference>): Promise<OnboardingPreference | undefined> {
    const [updatedPreferences] = await db
      .update(onboardingPreferences)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(onboardingPreferences.userId, userId))
      .returning();
    
    return updatedPreferences;
  }

  async disableOnboarding(userId: number): Promise<boolean> {
    const preferences = await this.getOnboardingPreferences(userId);
    
    if (!preferences) {
      await this.createOnboardingPreferences({
        userId,
        experienceLevel: "beginner",
        interests: [],
        learningStyle: null,
        disableOnboarding: true
      });
      return true;
    }
    
    await this.updateOnboardingPreferences(userId, {
      disableOnboarding: true
    });
    
    return true;
  }

  // Recommendation operations
  async getRecommendedLearningPaths(userId: number, limit: number = 3): Promise<LearningPath[]> {
    // Get user preferences
    const preferences = await this.getOnboardingPreferences(userId);
    
    // Get user's completed paths
    const userProgressItems = await this.getUserProgressAll(userId);
    const completedPathIds = userProgressItems
      .filter(progress => progress.isCompleted)
      .map(progress => progress.pathId);
    
    // Get all active learning paths
    const allPaths = await db.select().from(learningPaths);
    let paths = allPaths.filter(path => path.active);
    
    // Filter by experience level if available
    if (preferences?.experienceLevel) {
      // If beginner, show beginner. If intermediate, show beginner and intermediate, etc.
      const levels = ['beginner', 'intermediate', 'advanced'];
      const userLevel = preferences.experienceLevel.toLowerCase();
      const userLevelIndex = levels.indexOf(userLevel);
      
      if (userLevelIndex >= 0) {
        // Get user's level and one level up (if exists)
        const eligibleLevels = levels.slice(0, Math.min(userLevelIndex + 2, levels.length));
        paths = paths.filter(path => eligibleLevels.includes(path.difficulty));
      }
    }
    
    // Filter out already completed paths
    paths = paths.filter(path => !completedPathIds.includes(path.id));
    
    // Sort by priority
    paths.sort((a, b) => b.priority - a.priority);
    
    // If user has interests, prioritize those paths
    if (preferences?.interests && preferences.interests.length > 0) {
      // Sort by matching interests
      paths.sort((a, b) => {
        // Make sure interests is not null
        const interests = preferences.interests || [];
        
        const aMatchesInterest = interests.some(interest => 
          a.category.toLowerCase() === interest.toLowerCase()
        );
        
        const bMatchesInterest = interests.some(interest => 
          b.category.toLowerCase() === interest.toLowerCase()
        );
        
        if (aMatchesInterest && !bMatchesInterest) return -1;
        if (!aMatchesInterest && bMatchesInterest) return 1;
        
        // If both or neither match interests, sort by priority
        return b.priority - a.priority;
      });
    }
    
    // Return limited number of recommended paths
    return paths.slice(0, limit);
  }

  async getSuggestedNextSteps(userId: number): Promise<{ pathId: number, stepId: number, reason: string }[]> {
    // Get all in-progress learning paths
    const userProgressItems = await this.getUserProgressAll(userId);
    const inProgressPaths = userProgressItems.filter(progress => !progress.isCompleted);
    
    if (inProgressPaths.length === 0) {
      // If no paths in progress, recommend starting new ones
      const recommendedPaths = await this.getRecommendedLearningPaths(userId, 1);
      
      if (recommendedPaths.length === 0) {
        return [];
      }
      
      const path = recommendedPaths[0];
      const steps = await this.getLearningSteps(path.id);
      
      if (steps.length === 0) {
        return [];
      }
      
      // Recommend first step of new path
      return [{
        pathId: path.id,
        stepId: steps[0].id,
        reason: `Begin your journey with "${path.title}"`
      }];
    }
    
    // For each in-progress path, find the next uncompleted step
    const suggestions: { pathId: number, stepId: number, reason: string }[] = [];
    
    for (const progress of inProgressPaths) {
      const steps = await this.getLearningSteps(progress.pathId);
      const path = await this.getLearningPath(progress.pathId);
      
      if (!path || steps.length === 0) {
        continue;
      }
      
      // Find steps not yet completed
      const completedStepIds = progress.completedSteps || [];
      const uncompletedSteps = steps.filter(step => !completedStepIds.includes(step.id));
      
      if (uncompletedSteps.length === 0) {
        continue;
      }
      
      // Sort by order index and get the first one
      uncompletedSteps.sort((a, b) => a.orderIndex - b.orderIndex);
      const nextStep = uncompletedSteps[0];
      
      suggestions.push({
        pathId: path.id,
        stepId: nextStep.id,
        reason: `Continue your progress in "${path.title}"`
      });
    }
    
    return suggestions;
  }

  // Mining settings operations
  async getMiningSettings(): Promise<MiningSetting> {
    // Get the first settings record or create default settings if none exists
    const [settings] = await db.select()
      .from(miningSettings)
      .limit(1);
    
    if (settings) {
      return settings;
    }

    // Create default settings if none exist
    const [defaultSettings] = await db.insert(miningSettings)
      .values({
        // Use lowercase column names to match the database schema
        enablestreakbonus: true,
        streakbonuspercentperday: 5,
        maxstreakdays: 10,
        streakexpirationhours: 48,
        enabledailybonus: true,
        dailybonuschance: 10,
        updatedat: new Date()
      })
      .returning();
    
    return defaultSettings;
  }

  async updateMiningSettings(settings: MiningSettings): Promise<MiningSetting> {
    // Get the first settings record
    const [existingSettings] = await db.select()
      .from(miningSettings)
      .limit(1);
    
    // Convert camelCase keys to lowercase to match database column names
    const normalizedSettings: Record<string, any> = {};
    for (const [key, value] of Object.entries(settings)) {
      // Convert camelCase keys to lowercase
      normalizedSettings[key.toLowerCase()] = value;
    }
    
    if (existingSettings) {
      // Update existing settings
      const [updatedSettings] = await db.update(miningSettings)
        .set({
          ...normalizedSettings,
          updatedat: new Date() // Use lowercase for column name
        })
        .where(eq(miningSettings.id, existingSettings.id))
        .returning();
      
      return updatedSettings;
    } else {
      // Create new settings
      const [newSettings] = await db.insert(miningSettings)
        .values({
          ...normalizedSettings,
          updatedat: new Date() // Use lowercase for column name
        })
        .returning();
      
      return newSettings;
    }
  }
  
  // Get contract address by network
  async getContractAddress(network: string): Promise<ContractAddress | undefined> {
    try {
      const [contractAddressRecord] = await db.select()
        .from(contractAddresses)
        .where(eq(contractAddresses.network, network));
      
      return contractAddressRecord;
    } catch (error) {
      console.error(`Error getting contract address for ${network}:`, error);
      return undefined;
    }
  }
  
  // Get all contract addresses
  async getAllContractAddresses(): Promise<ContractAddress[]> {
    try {
      const addresses = await db.select()
        .from(contractAddresses)
        .orderBy(asc(contractAddresses.network));
      
      return addresses;
    } catch (error) {
      console.error("Error getting all contract addresses:", error);
      return [];
    }
  }
  
  // Update or create contract address
  async updateContractAddress(network: string, address: string): Promise<boolean> {
    try {
      // Check if a record already exists for this network
      const existingRecord = await this.getContractAddress(network);
      
      if (existingRecord) {
        // Update existing record
        await db.update(contractAddresses)
          .set({
            address,
            updatedAt: new Date()
          })
          .where(eq(contractAddresses.network, network));
        
        console.log(`Contract address for ${network} updated to ${address}`);
      } else {
        // Create new record
        await db.insert(contractAddresses)
          .values({
            network,
            address,
            createdAt: new Date(),
            updatedAt: new Date()
          });
        
        console.log(`New contract address for ${network} saved: ${address}`);
      }
      
      // Also update environment variable for the current session
      // This provides backwards compatibility with any code that might rely on env vars
      const envVarName = network === 'testnet' 
        ? 'VITE_TSK_TOKEN_ADDRESS_TESTNET' 
        : 'VITE_TSK_TOKEN_ADDRESS_MAINNET';
      
      process.env[envVarName] = address;
      
      return true;
    } catch (error) {
      console.error(`Error updating contract address for network ${network}:`, error);
      throw error;
    }
  }
  
  // Events operations
  async getEvents(activeOnly: boolean = false): Promise<Event[]> {
    try {
      let query = db.select().from(events);
      
      if (activeOnly) {
        query = query.where(eq(events.active, true));
      }
      
      return await query.orderBy(desc(events.priority));
    } catch (error) {
      console.error("Error getting events:", error);
      return [];
    }
  }
  
  async getEvent(id: number): Promise<Event | undefined> {
    try {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, id));
      
      return event;
    } catch (error) {
      console.error("Error getting event:", error);
      return undefined;
    }
  }
  
  async createEvent(eventData: InsertEvent): Promise<Event> {
    try {
      const [event] = await db
        .insert(events)
        .values({
          ...eventData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      return event;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }
  
  async updateEvent(id: number, data: Partial<Event>): Promise<Event | undefined> {
    try {
      const [updatedEvent] = await db
        .update(events)
        .set({
          ...data,
          updatedAt: new Date()
        })
        .where(eq(events.id, id))
        .returning();
      
      return updatedEvent;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }
  
  async deleteEvent(id: number): Promise<boolean> {
    try {
      await db
        .delete(events)
        .where(eq(events.id, id));
      
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      return false;
    }
  }
  
  async getDashboardEvents(): Promise<Event[]> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(and(
          eq(events.active, true),
          eq(events.displayOnDashboard, true)
        ))
        .orderBy(desc(events.priority));
      
      return result;
    } catch (error) {
      console.error("Error getting dashboard events:", error);
      return [];
    }
  }
  
  async getFeaturedEvents(): Promise<Event[]> {
    try {
      const result = await db
        .select()
        .from(events)
        .where(and(
          eq(events.active, true),
          eq(events.featured, true)
        ))
        .orderBy(desc(events.priority));
      
      return result;
    } catch (error) {
      console.error("Error getting featured events:", error);
      return [];
    }
  }
  
  async getActiveEventsByPriority(limit?: number): Promise<Event[]> {
    try {
      let query = db
        .select()
        .from(events)
        .where(eq(events.active, true))
        .orderBy(desc(events.priority));
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query;
    } catch (error) {
      console.error("Error getting active events by priority:", error);
      return [];
    }
  }
  
  /**
   * Delete a user account and all associated data
   * This operation cascades to delete all related records like KYC, mining history, etc.
   */
  async deleteUser(id: number): Promise<boolean> {
    try {
      console.log(`Starting deletion process for user with ID ${id}`);
      
      // Get user to make sure they exist before deletion
      const user = await this.getUser(id);
      if (!user) {
        console.error(`User deletion failed: User with id ${id} not found`);
        return false;
      }

      // Start a transaction for data consistency
      return await db.transaction(async (tx) => {
        // Delete related records in correct order to respect foreign key constraints
        
        // 1. Delete user progress
        await tx.delete(userProgress).where(eq(userProgress.userId, id));
        console.log(`Deleted user progress records for user ${id}`);
        
        // 2. Delete user interactions
        await tx.delete(userInteractions).where(eq(userInteractions.userId, id));
        console.log(`Deleted user interaction records for user ${id}`);
        
        // 3. Delete onboarding preferences
        await tx.delete(onboardingPreferences).where(eq(onboardingPreferences.userId, id));
        console.log(`Deleted onboarding preferences for user ${id}`);
        
        // 4. Delete KYC record
        await tx.delete(userKyc).where(eq(userKyc.userId, id));
        console.log(`Deleted KYC record for user ${id}`);
        
        // 5. Delete mining history
        await tx.delete(miningHistory).where(eq(miningHistory.userId, id));
        console.log(`Deleted mining history for user ${id}`);
        
        // 6. Delete marketplace items
        await tx.delete(marketplaceItems).where(eq(marketplaceItems.sellerId, id));
        console.log(`Deleted marketplace items for user ${id}`);
        
        // 7. Delete transactions where user is buyer or seller
        await tx.delete(transactions).where(eq(transactions.buyerId, id));
        await tx.delete(transactions).where(eq(transactions.sellerId, id));
        console.log(`Deleted transactions for user ${id}`);
        
        // 8. Delete admin tasks assigned to this user or created by this user
        await tx.delete(adminTasks).where(eq(adminTasks.assignedTo, id));
        await tx.delete(adminTasks).where(eq(adminTasks.createdBy, id));
        console.log(`Deleted admin tasks related to user ${id}`);
        
        // 9. Handle referrals (both as referrer and as referred)
        // Update any users who were referred by this user to have null referredBy
        await tx.update(users)
          .set({ referredBy: null })
          .where(eq(users.referredBy, id));
        
        // Delete referral records
        await tx.delete(referrals).where(eq(referrals.referrerId, id));
        await tx.delete(referrals).where(eq(referrals.referredId, id));
        console.log(`Handled referral records for user ${id}`);
        
        // 10. Finally delete the user
        await tx.delete(users).where(eq(users.id, id));
        console.log(`Successfully deleted user ${id}`);
        
        return true;
      });
    } catch (error) {
      console.error(`Error deleting user ${id}:`, error);
      return false;
    }
  }
  
  async init() {
    // Check if cloud storage is configured
    const cloudConfigured = process.env.GOOGLE_CLOUD_PROJECT_ID && 
                          process.env.GOOGLE_CLOUD_CREDENTIALS && 
                          process.env.GOOGLE_CLOUD_STORAGE_BUCKET;
                          
    if (!cloudConfigured) {
      console.log("[express] Cloud storage not configured, using local storage");
    }
    
    // Initialize admin users - table creation is handled by Drizzle push
    try {
      // Create admin user if it doesn't exist
      const adminUser = await this.getUserByUsername("admin");
      if (!adminUser) {
        await this.createUser({
          username: "admin",
          password: await hashPassword("admin123"),
          walletAddress: "",
          referralCode: generateReferralCode(),
          role: "admin"
        });
      }

      // Add second admin user
      const cmgzoneUser = await this.getUserByUsername("cmgzone");
      if (!cmgzoneUser) {
        await this.createUser({
          username: "cmgzone",
          password: await hashPassword("cmgcmg686"),
          walletAddress: "",
          referralCode: generateReferralCode(),
          role: "admin"
        });
      }
      
      // Create sample learning paths if none exist
      const existingPaths = await this.getLearningPaths();
      if (existingPaths.length === 0) {
        await this.initSampleLearningPaths();
      }
      
      console.log("[express] Database initialized successfully");
    } catch (error) {
      console.error("[express] Error initializing database:", error);
    }
  }
  
  // Initialize sample learning paths and steps
  private async initSampleLearningPaths() {
    try {
      // Create sample learning paths
      const miningPath = await this.createLearningPath({
        title: "Getting Started with Mining",
        description: "Learn how to mine TSK tokens efficiently and maximize your daily rewards",
        category: "mining",
        difficulty: "beginner",
        priority: 100,
        requiredForFeatures: ["mining"],
        active: true
      });
      
      const walletPath = await this.createLearningPath({
        title: "Managing Your Wallet",
        description: "Understand how to manage your wallet, withdraw tokens, and connect to BNB Smart Chain",
        category: "wallet",
        difficulty: "beginner",
        priority: 90,
        requiredForFeatures: ["wallet"],
        active: true
      });
      
      const marketplacePath = await this.createLearningPath({
        title: "Using the Marketplace",
        description: "Discover how to buy and sell items on the TSK marketplace",
        category: "marketplace",
        difficulty: "beginner",
        priority: 80,
        requiredForFeatures: ["marketplace"],
        active: true
      });
      
      const referralPath = await this.createLearningPath({
        title: "Earning with Referrals",
        description: "Learn how to invite friends and earn rewards through the referral program",
        category: "referral",
        difficulty: "beginner",
        priority: 70,
        requiredForFeatures: ["referral"],
        active: true
      });
      
      const premiumPath = await this.createLearningPath({
        title: "Premium Features Guide",
        description: "Understand premium packages and their benefits for mining and other platform features",
        category: "premium",
        difficulty: "intermediate",
        priority: 60,
        requiredForFeatures: ["premium"],
        active: true
      });
      
      // Add steps to the mining path
      await this.createLearningStep({
        pathId: miningPath.id,
        title: "What is TSK Mining?",
        description: "Introduction to token mining on the platform",
        content: "Mining in the TSK platform allows you to earn tokens by clicking the mining button once per hour. Unlike traditional cryptocurrency mining, TSK mining doesn't require powerful hardware or consume excessive energy.\n\nEvery click on the mining button rewards you with tokens based on your mining rate. Your base mining rate is displayed on your dashboard and can be increased through referrals and premium packages.",
        orderIndex: 0,
        estimatedTimeMinutes: 3,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: miningPath.id,
        title: "Mining Streaks",
        description: "How to build and maintain mining streaks for bonus rewards",
        content: "Mining streaks are consecutive days where you've mined at least once. Each day you continue your streak, you'll earn a bonus percentage on your mining rewards.\n\nThe streak bonus increases by 5% each day, up to a maximum of 50% after 10 days. To maintain your streak, you need to mine at least once every 24-48 hours. If you miss a day, your streak will reset to 1.",
        orderIndex: 1,
        estimatedTimeMinutes: 3,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: miningPath.id,
        title: "Daily Bonuses",
        description: "Understanding random daily bonuses",
        content: "In addition to streak bonuses, there's a chance to receive a random daily bonus when mining. There's approximately a 10% chance that your mining reward will be doubled.\n\nThese bonuses are awarded randomly and can occur on any mining session, regardless of your streak status. Keep mining regularly to increase your chances of receiving these bonuses!",
        orderIndex: 2,
        estimatedTimeMinutes: 2,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: miningPath.id,
        title: "Maximizing Mining Profits",
        description: "Strategies to optimize your mining rewards",
        content: "To maximize your mining profits, consider these strategies:\n\n1. Maintain a consistent streak by mining at least once daily\n2. Refer friends to increase your mining rate (10% per active referral)\n3. Purchase premium packages for mining multipliers\n4. Set reminders to mine as soon as your cooldown period ends\n5. Complete daily missions and tasks for additional rewards",
        orderIndex: 3,
        estimatedTimeMinutes: 4,
        isRequired: true
      });
      
      // Add steps to the wallet path
      await this.createLearningStep({
        pathId: walletPath.id,
        title: "Your TSK Wallet",
        description: "Introduction to your on-platform wallet",
        content: "Your TSK wallet is your central hub for managing your tokens on the platform. It displays your current balance, transaction history, and allows you to deposit or withdraw tokens.\n\nThe wallet page provides a comprehensive overview of all your token-related activities, including mining rewards, marketplace transactions, and referral earnings.",
        orderIndex: 0,
        estimatedTimeMinutes: 3,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: walletPath.id,
        title: "Connecting to BNB Smart Chain",
        description: "How to connect your external wallet",
        content: "To withdraw your TSK tokens to an external wallet, you first need to connect to the BNB Smart Chain (formerly Binance Smart Chain).\n\n1. Install a compatible wallet like MetaMask or Trust Wallet\n2. Configure your wallet to use BNB Smart Chain (network ID: 56)\n3. Click the 'Connect Wallet' button on the wallet page\n4. Approve the connection request in your wallet\n\nOnce connected, your external wallet address will be saved to your profile for future withdrawals.",
        orderIndex: 1,
        estimatedTimeMinutes: 5,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: walletPath.id,
        title: "Withdrawing Tokens",
        description: "How to withdraw tokens to your external wallet",
        content: "After connecting your external wallet, you can withdraw your TSK tokens by following these steps:\n\n1. Navigate to the Wallet page\n2. Click on 'Withdraw Tokens'\n3. Enter the amount you wish to withdraw\n4. Complete KYC verification if you haven't already (required for security)\n5. Confirm the withdrawal\n\nWithdrawals are processed on the BNB Smart Chain, and you'll typically receive your tokens within minutes. A small network fee may apply for blockchain transactions.",
        orderIndex: 2,
        estimatedTimeMinutes: 4,
        isRequired: true
      });
      
      // Add steps to the marketplace path
      await this.createLearningStep({
        pathId: marketplacePath.id,
        title: "Exploring the Marketplace",
        description: "Overview of the marketplace features",
        content: "The TSK Marketplace is a peer-to-peer trading platform where users can buy and sell digital items using TSK tokens. The marketplace supports various categories of items, from digital art to virtual services.\n\nYou can browse listings by category, search for specific items, and filter results based on price, popularity, and other criteria. Each listing includes detailed information about the item and its seller.",
        orderIndex: 0,
        estimatedTimeMinutes: 3,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: marketplacePath.id,
        title: "Creating a Listing",
        description: "How to sell items on the marketplace",
        content: "To create a marketplace listing:\n\n1. Navigate to the Marketplace page\n2. Click 'Create Listing'\n3. Upload images and enter details about your item\n4. Set a price in TSK tokens\n5. Choose the appropriate category and add optional metadata\n6. Submit for approval\n\nAll listings undergo a review process to ensure they comply with platform guidelines. Once approved, your item will be visible to all users and available for purchase.",
        orderIndex: 1,
        estimatedTimeMinutes: 4,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: marketplacePath.id,
        title: "Buying Items",
        description: "How to purchase items from the marketplace",
        content: "Purchasing items from the marketplace is simple:\n\n1. Browse or search for items you're interested in\n2. Click on a listing to view details\n3. If you decide to buy, click the 'Purchase' button\n4. Confirm the transaction\n\nThe required TSK tokens will be transferred from your wallet to the seller, and the item ownership will be transferred to you. All transactions are recorded on the platform for reference and security.",
        orderIndex: 2,
        estimatedTimeMinutes: 3,
        isRequired: true
      });
      
      // Add steps to the referral path
      await this.createLearningStep({
        pathId: referralPath.id,
        title: "Understanding the Referral Program",
        description: "Introduction to the referral system",
        content: "The TSK Referral Program allows you to earn rewards by inviting friends to join the platform. For each friend who signs up using your referral code and becomes active, you'll receive ongoing benefits.\n\nKey benefits of the referral program include:\n\n1. 10% mining rate boost per active referral\n2. Occasional bonus rewards for high-performing referrers\n3. Special achievements and recognition for top referrers",
        orderIndex: 0,
        estimatedTimeMinutes: 3,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: referralPath.id,
        title: "Sharing Your Referral Code",
        description: "How to invite friends effectively",
        content: "To share your referral code with friends:\n\n1. Go to the Referrals page\n2. Copy your unique referral code or link\n3. Share via social media, email, or messaging apps\n\nYou can track which friends have joined using your referral code and monitor their activity status. Remember, you only receive benefits from active referrals, so encourage your friends to stay engaged with the platform.",
        orderIndex: 1,
        estimatedTimeMinutes: 2,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: referralPath.id,
        title: "Maximizing Referral Rewards",
        description: "Strategies for successful referrals",
        content: "To maximize your referral rewards:\n\n1. Target friends who are genuinely interested in cryptocurrency and mining\n2. Explain the benefits of the platform clearly\n3. Provide guidance to new users to help them get started\n4. Create content about TSK on social media or blogs\n5. Offer to help your referrals with any questions\n\nRemember that the quality of referrals matters more than quantity. Focus on referring users who will remain active on the platform for the best long-term benefits.",
        orderIndex: 2,
        estimatedTimeMinutes: 4,
        isRequired: true
      });
      
      // Add steps to the premium path
      await this.createLearningStep({
        pathId: premiumPath.id,
        title: "Premium Packages Overview",
        description: "Introduction to premium membership options",
        content: "TSK offers several premium packages that provide enhanced benefits and features. Each package offers different levels of advantages, with higher-tier packages providing greater benefits.\n\nAll premium packages are one-time purchases that provide permanent benefits to your account. You can upgrade from a lower-tier package to a higher-tier one by paying the difference in price.",
        orderIndex: 0,
        estimatedTimeMinutes: 3,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: premiumPath.id,
        title: "Mining Multipliers",
        description: "How premium packages boost mining rewards",
        content: "One of the primary benefits of premium packages is the mining multiplier. This multiplier increases your base mining rate, allowing you to earn more tokens with each mining action.\n\nFor example:\n- Standard package: 1.5x multiplier\n- Gold package: 2.0x multiplier\n- Platinum package: 3.0x multiplier\n\nThese multipliers apply to your base mining rate before other bonuses (like streak bonuses) are calculated, maximizing the value of all your mining activities.",
        orderIndex: 1,
        estimatedTimeMinutes: 3,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: premiumPath.id,
        title: "Additional Premium Benefits",
        description: "Other advantages of premium membership",
        content: "Beyond mining multipliers, premium packages offer various additional benefits:\n\n1. Reduced marketplace fees\n2. Exclusive access to premium-only items\n3. Advanced platform features\n4. Priority customer support\n5. Special profile badges and recognition\n\nThese benefits enhance your overall experience on the platform and provide greater value for your investment, especially for active users who engage with multiple features of the platform.",
        orderIndex: 2,
        estimatedTimeMinutes: 4,
        isRequired: true
      });
      
      await this.createLearningStep({
        pathId: premiumPath.id,
        title: "Choosing the Right Package",
        description: "How to select the best premium option for you",
        content: "When deciding which premium package to purchase, consider:\n\n1. Your activity level on the platform\n2. Which features you use most frequently\n3. Your budget and expected return on investment\n4. Long-term vs. short-term goals\n\nFor casual users who primarily mine occasionally, the Standard package may be sufficient. For active miners and marketplace users, higher-tier packages will typically provide better value over time. Calculate your potential additional earnings based on your usage patterns to determine the best option.",
        orderIndex: 3,
        estimatedTimeMinutes: 5,
        isRequired: true
      });
      
      console.log("[express] Sample learning paths and steps created successfully");
    } catch (error) {
      console.error("[express] Error creating sample learning paths:", error);
    }
  }

  // Initialize token packages with default options
  private async initTokenPackages() {
    try {
      // Check if there are any token packages
      const existingPackages = await this.getTokenPackages();
      if (existingPackages.length > 0) {
        return; // Don't add packages if they already exist
      }

      // Add default token packages
      await this.createTokenPackage({
        name: "Starter Pack",
        description: "Perfect for beginners",
        tokenAmount: 100,
        priceUSD: 10,
        discountPercentage: 0,
        active: true
      });

      await this.createTokenPackage({
        name: "Growth Pack",
        description: "For active platform users",
        tokenAmount: 500,
        priceUSD: 45,
        discountPercentage: 10,
        active: true
      });

      await this.createTokenPackage({
        name: "Whale Pack",
        description: "Best value for serious investors",
        tokenAmount: 1000,
        priceUSD: 80,
        discountPercentage: 20,
        active: true
      });

      console.log("Default token packages initialized");
    } catch (error) {
      console.error("Error initializing token packages:", error);
    }
  }

  // Token package operations
  async getTokenPackages(activeOnly?: boolean): Promise<TokenPackage[]> {
    const query = db.select().from(tokenPackages);
    
    if (activeOnly) {
      query.where(eq(tokenPackages.active, true));
    }
    
    return await query.orderBy(asc(tokenPackages.priceUSD));
  }

  async getTokenPackage(id: number): Promise<TokenPackage | undefined> {
    const [tokenPackage] = await db.select()
      .from(tokenPackages)
      .where(eq(tokenPackages.id, id));
    
    return tokenPackage;
  }

  async createTokenPackage(packageData: InsertTokenPackage): Promise<TokenPackage> {
    const [tokenPackage] = await db.insert(tokenPackages)
      .values({
        ...packageData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return tokenPackage;
  }

  async updateTokenPackage(id: number, data: Partial<TokenPackage>): Promise<TokenPackage | undefined> {
    // Add updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const [updatedPackage] = await db.update(tokenPackages)
      .set(updateData)
      .where(eq(tokenPackages.id, id))
      .returning();
    
    return updatedPackage;
  }

  async deleteTokenPackage(id: number): Promise<boolean> {
    const result = await db.delete(tokenPackages)
      .where(eq(tokenPackages.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Token transaction operations
  async createTokenTransaction(transactionData: InsertTokenTransaction): Promise<TokenTransaction> {
    const [transaction] = await db.insert(tokenTransactions)
      .values({
        ...transactionData,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    return transaction;
  }

  async getUserTokenTransactions(userId: number): Promise<TokenTransaction[]> {
    return db.select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.userId, userId))
      .orderBy(desc(tokenTransactions.createdAt));
  }

  async getTokenTransaction(id: number): Promise<TokenTransaction | undefined> {
    const [transaction] = await db.select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.id, id));
    
    return transaction;
  }

  async updateTokenTransaction(id: number, data: Partial<TokenTransaction>): Promise<TokenTransaction | undefined> {
    // Add updatedAt timestamp
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const [updatedTransaction] = await db.update(tokenTransactions)
      .set(updateData)
      .where(eq(tokenTransactions.id, id))
      .returning();
    
    return updatedTransaction;
  }

  async approveTokenTransaction(id: number, approverId: number): Promise<TokenTransaction | undefined> {
    const transaction = await this.getTokenTransaction(id);
    if (!transaction) {
      throw new Error(`Token transaction with id ${id} not found`);
    }
    
    // Update transaction status to completed
    const [updatedTransaction] = await db.update(tokenTransactions)
      .set({
        status: "completed",
        approvedBy: approverId,
        updatedAt: new Date()
      })
      .where(eq(tokenTransactions.id, id))
      .returning();
    
    if (!updatedTransaction) {
      return undefined;
    }
    
    // Add tokens to user's balance
    const user = await this.getUser(updatedTransaction.userId);
    if (user) {
      await this.updateUser(user.id, {
        tokenBalance: user.tokenBalance + updatedTransaction.amount
      });
    }
    
    return updatedTransaction;
  }

  async getPendingTokenTransactions(): Promise<TokenTransaction[]> {
    return db.select()
      .from(tokenTransactions)
      .where(eq(tokenTransactions.status, "pending"))
      .orderBy(asc(tokenTransactions.createdAt));
  }
  
  // Chat group operations
  async getChatGroups(userId?: number): Promise<ChatGroup[]> {
    if (userId) {
      // Get groups where the user is a member
      const memberGroups = await db
        .select({
          group: chatGroups
        })
        .from(chatGroupMembers)
        .innerJoin(chatGroups, eq(chatGroupMembers.groupId, chatGroups.id))
        .where(eq(chatGroupMembers.userId, userId));
      
      return memberGroups.map(mg => mg.group);
    } else {
      // Get all public groups
      return db
        .select()
        .from(chatGroups)
        .where(eq(chatGroups.isPublic, true))
        .orderBy(desc(chatGroups.lastMessageAt));
    }
  }
  
  async getChatGroup(id: number): Promise<ChatGroup | undefined> {
    const [group] = await db
      .select()
      .from(chatGroups)
      .where(eq(chatGroups.id, id));
    
    return group;
  }
  
  async createChatGroup(groupData: InsertChatGroup): Promise<ChatGroup> {
    const [group] = await db
      .insert(chatGroups)
      .values({
        ...groupData,
        lastMessageAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    
    // If creator is specified, add them as an admin member
    if (groupData.createdBy) {
      await this.addUserToChatGroup({
        groupId: group.id,
        userId: groupData.createdBy,
        role: 'admin'
      });
    }
    
    return group;
  }
  
  async updateChatGroup(id: number, data: Partial<ChatGroup>): Promise<ChatGroup | undefined> {
    const [updatedGroup] = await db
      .update(chatGroups)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(chatGroups.id, id))
      .returning();
    
    return updatedGroup;
  }
  
  async deleteChatGroup(id: number): Promise<boolean> {
    const result = await db
      .delete(chatGroups)
      .where(eq(chatGroups.id, id));
    
    return true;
  }
  
  // Chat group members operations
  async getChatGroupMembers(groupId: number): Promise<(ChatGroupMember & { user: { id: number, username: string } })[]> {
    const result = await db
      .select({
        member: chatGroupMembers,
        user: {
          id: users.id,
          username: users.username
        }
      })
      .from(chatGroupMembers)
      .innerJoin(users, eq(chatGroupMembers.userId, users.id))
      .where(eq(chatGroupMembers.groupId, groupId));
    
    return result.map(r => ({
      ...r.member,
      user: r.user
    }));
  }
  
  async addUserToChatGroup(memberData: InsertChatGroupMember): Promise<ChatGroupMember> {
    try {
      const [member] = await db
        .insert(chatGroupMembers)
        .values({
          ...memberData,
          joinedAt: new Date(),
          lastSeen: new Date()
        })
        .returning();
      
      return member;
    } catch (error) {
      // Handle case where user is already a member
      if (error.code === '23505') { // Unique constraint violation
        const [existingMember] = await db
          .select()
          .from(chatGroupMembers)
          .where(
            and(
              eq(chatGroupMembers.groupId, memberData.groupId),
              eq(chatGroupMembers.userId, memberData.userId)
            )
          );
        
        return existingMember;
      }
      throw error;
    }
  }
  
  async removeChatGroupMember(groupId: number, userId: number): Promise<boolean> {
    await db
      .delete(chatGroupMembers)
      .where(
        and(
          eq(chatGroupMembers.groupId, groupId),
          eq(chatGroupMembers.userId, userId)
        )
      );
    
    return true;
  }
  
  async updateChatGroupMemberRole(groupId: number, userId: number, newRole: string): Promise<ChatGroupMember | undefined> {
    const [updatedMember] = await db
      .update(chatGroupMembers)
      .set({
        role: newRole
      })
      .where(
        and(
          eq(chatGroupMembers.groupId, groupId),
          eq(chatGroupMembers.userId, userId)
        )
      )
      .returning();
    
    return updatedMember;
  }
  
  // Chat message operations
  async getChatMessages(groupId: number, limit: number = 50, before?: Date): Promise<(ChatMessage & { sender: { id: number, username: string } })[]> {
    let query = db
      .select({
        message: chatMessages,
        sender: {
          id: users.id,
          username: users.username
        }
      })
      .from(chatMessages)
      .innerJoin(users, eq(chatMessages.userId, users.id))
      .where(eq(chatMessages.groupId, groupId));
    
    if (before) {
      query = query.where(lt(chatMessages.timestamp, before));
    }
    
    const result = await query
      .orderBy(desc(chatMessages.timestamp))
      .limit(limit);
    
    return result.map(r => ({
      ...r.message,
      sender: r.sender
    }));
  }
  
  async createChatMessage(messageData: InsertChatMessage): Promise<ChatMessage> {
    // Create the message
    const [message] = await db
      .insert(chatMessages)
      .values({
        ...messageData,
        timestamp: new Date(),
      })
      .returning();
    
    // Update the group's lastMessageAt timestamp
    await db
      .update(chatGroups)
      .set({
        lastMessageAt: new Date()
      })
      .where(eq(chatGroups.id, messageData.groupId));
    
    // Update the sending user's lastSeen timestamp in this group
    await db
      .update(chatGroupMembers)
      .set({
        lastSeen: new Date()
      })
      .where(
        and(
          eq(chatGroupMembers.groupId, messageData.groupId),
          eq(chatGroupMembers.userId, messageData.userId)
        )
      );
    
    return message;
  }
  
  async editChatMessage(messageId: number, newContent: string): Promise<ChatMessage | undefined> {
    const [updatedMessage] = await db
      .update(chatMessages)
      .set({
        content: newContent,
        edited: true,
        editedAt: new Date()
      })
      .where(eq(chatMessages.id, messageId))
      .returning();
    
    return updatedMessage;
  }
  
  async deleteChatMessage(messageId: number): Promise<boolean> {
    await db
      .update(chatMessages)
      .set({
        isDeleted: true,
        content: "[This message has been deleted]"
      })
      .where(eq(chatMessages.id, messageId));
    
    return true;
  }
  
  // Direct message operations
  async getDirectMessages(userId1: number, userId2: number, limit: number = 50): Promise<DirectMessage[]> {
    return db
      .select()
      .from(directMessages)
      .where(
        or(
          and(
            eq(directMessages.senderId, userId1),
            eq(directMessages.receiverId, userId2)
          ),
          and(
            eq(directMessages.senderId, userId2),
            eq(directMessages.receiverId, userId1)
          )
        )
      )
      .orderBy(desc(directMessages.timestamp))
      .limit(limit);
  }
  
  async getUnreadDirectMessageCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(directMessages)
      .where(
        and(
          eq(directMessages.receiverId, userId),
          eq(directMessages.read, false)
        )
      );
    
    return result[0].count;
  }
  
  async createDirectMessage(messageData: InsertDirectMessage): Promise<DirectMessage> {
    const [message] = await db
      .insert(directMessages)
      .values({
        ...messageData,
        timestamp: new Date()
      })
      .returning();
    
    return message;
  }
  
  async markDirectMessageAsRead(messageId: number): Promise<boolean> {
    await db
      .update(directMessages)
      .set({
        read: true,
        readAt: new Date()
      })
      .where(eq(directMessages.id, messageId));
    
    return true;
  }

  // Notification operations
  async getUserNotifications(userId: number, limit?: number, includeRead: boolean = false): Promise<Notification[]> {
    const query = db.select()
      .from(notifications)
      .where(
        includeRead
          ? eq(notifications.userId, userId)
          : and(
              eq(notifications.userId, userId),
              eq(notifications.read, false)
            )
      )
      .orderBy(desc(notifications.createdAt));

    return limit ? await query.limit(limit) : await query;
  }
  
  async getNotification(id: number): Promise<Notification | undefined> {
    const [notification] = await db.select()
      .from(notifications)
      .where(eq(notifications.id, id));
    
    return notification;
  }
  
  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    // Set default values if not provided
    const data = {
      ...notificationData,
      createdAt: new Date(),
      read: notificationData.read ?? false,
      priority: notificationData.priority ?? 1
    };
    
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    
    return notification;
  }
  
  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [notification] = await db
      .update(notifications)
      .set({
        read: true
      })
      .where(eq(notifications.id, id))
      .returning();
    
    return notification;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    await db
      .update(notifications)
      .set({
        read: true
      })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    return true;
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.read, false)
        )
      );
    
    return result[0].count as number;
  }
  
  async deleteNotification(id: number): Promise<boolean> {
    const result = await db
      .delete(notifications)
      .where(eq(notifications.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }
  
  async createSystemNotification(userId: number, title: string, message: string, options?: Partial<InsertNotification>): Promise<Notification> {
    const notification = await this.createNotification({
      userId,
      title,
      message,
      type: "system",
      read: false,
      priority: options?.priority ?? 1,
      expiresAt: options?.expiresAt,
      actionUrl: options?.actionUrl,
      imageUrl: options?.imageUrl,
      metadata: options?.metadata
    });
    
    return notification;
  }

  // Platform settings operations
  async getPlatformSettings(): Promise<PlatformSetting[]> {
    return await db.select().from(platformSettings).orderBy(desc(platformSettings.lastUpdatedAt));
  }

  async getPlatformSettingByType(settingType: string): Promise<PlatformSetting | undefined> {
    const [setting] = await db.select()
      .from(platformSettings)
      .where(eq(platformSettings.settingType, settingType))
      .orderBy(desc(platformSettings.lastUpdatedAt))
      .limit(1);
    
    return setting;
  }

  async getActivePlatformSettingByType(settingType: string): Promise<PlatformSetting | undefined> {
    const [setting] = await db.select()
      .from(platformSettings)
      .where(
        and(
          eq(platformSettings.settingType, settingType),
          eq(platformSettings.isActive, true)
        )
      )
      .orderBy(desc(platformSettings.lastUpdatedAt))
      .limit(1);
    
    return setting;
  }

  async createPlatformSetting(settingData: InsertPlatformSetting): Promise<PlatformSetting> {
    // Check if an active setting of this type already exists
    const existingSetting = await this.getActivePlatformSettingByType(settingData.settingType);
    
    // If an active setting exists, deactivate it before creating a new one
    if (existingSetting) {
      await this.deactivatePlatformSetting(existingSetting.id);
    }
    
    // Create the new setting with current timestamp
    const [newSetting] = await db.insert(platformSettings)
      .values({
        ...settingData,
        lastUpdatedAt: new Date()
      })
      .returning();
    
    return newSetting;
  }

  async updatePlatformSetting(id: number, data: Partial<PlatformSetting>): Promise<PlatformSetting | undefined> {
    // Update the lastUpdatedAt timestamp 
    const updateData = {
      ...data,
      lastUpdatedAt: new Date()
    };
    
    const [updatedSetting] = await db.update(platformSettings)
      .set(updateData)
      .where(eq(platformSettings.id, id))
      .returning();
    
    return updatedSetting;
  }

  async deactivatePlatformSetting(id: number): Promise<boolean> {
    const result = await db.update(platformSettings)
      .set({ 
        isActive: false,
        lastUpdatedAt: new Date()
      })
      .where(eq(platformSettings.id, id));
    
    return result.rowCount !== null && result.rowCount > 0;
  }

  // System secrets operations
  async getSystemSecrets(): Promise<SystemSecret[]> {
    return await db.select().from(systemSecrets).orderBy(desc(systemSecrets.updatedAt));
  }
  
  async getSystemSecretByKeyName(keyName: string): Promise<SystemSecret | undefined> {
    const [secret] = await db.select()
      .from(systemSecrets)
      .where(eq(systemSecrets.key, keyName));
    
    return secret;
  }
  
  async getSystemSecretsByCategory(category: string): Promise<SystemSecret[]> {
    return await db.select()
      .from(systemSecrets)
      .where(eq(systemSecrets.category, category))
      .orderBy(asc(systemSecrets.key));
  }
  
  async createSystemSecret(secretData: InsertSystemSecret): Promise<SystemSecret> {
    // Check if a secret with this key name already exists
    const existingSecret = await this.getSystemSecretByKeyName(secretData.key);
    
    if (existingSecret) {
      throw new Error(`Secret with key name '${secretData.key}' already exists. Use updateSystemSecret instead.`);
    }
    
    const [secret] = await db.insert(systemSecrets)
      .values({
        ...secretData,
        updatedAt: new Date()
      })
      .returning();
      
    return secret;
  }
  
  async updateSystemSecret(id: number, data: Partial<SystemSecret>): Promise<SystemSecret | undefined> {
    const [updatedSecret] = await db.update(systemSecrets)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(systemSecrets.id, id))
      .returning();
      
    return updatedSecret;
  }
  
  async deleteSystemSecret(id: number): Promise<boolean> {
    const result = await db.delete(systemSecrets)
      .where(eq(systemSecrets.id, id))
      .returning();
      
    return result.length > 0;
  }
  
  // Wallet configuration operations
  async getWalletConfigurations(): Promise<WalletConfiguration[]> {
    return await db.select().from(walletConfiguration).orderBy(asc(walletConfiguration.network));
  }
  
  async getWalletConfigurationByNetwork(network: string): Promise<WalletConfiguration | undefined> {
    const [config] = await db.select()
      .from(walletConfiguration)
      .where(eq(walletConfiguration.network, network));
      
    return config;
  }
  
  async createWalletConfiguration(walletData: InsertWalletConfiguration): Promise<WalletConfiguration> {
    // Check if a wallet config for this network already exists
    const existingConfig = await this.getWalletConfigurationByNetwork(walletData.network);
    
    if (existingConfig) {
      throw new Error(`Wallet configuration for network '${walletData.network}' already exists. Use updateWalletConfiguration instead.`);
    }
    
    const [config] = await db.insert(walletConfiguration)
      .values({
        ...walletData,
        updatedAt: new Date()
      })
      .returning();
      
    return config;
  }
  
  async updateWalletConfiguration(id: number, data: Partial<WalletConfiguration>): Promise<WalletConfiguration | undefined> {
    const [updatedConfig] = await db.update(walletConfiguration)
      .set({
        ...data,
        updatedAt: new Date()
      })
      .where(eq(walletConfiguration.id, id))
      .returning();
      
    return updatedConfig;
  }
  
  async deleteWalletConfiguration(id: number): Promise<boolean> {
    const result = await db.delete(walletConfiguration)
      .where(eq(walletConfiguration.id, id))
      .returning();
      
    return result.length > 0;
  }
  
  // Initialize default wallet configurations
  private async initWalletConfigurations() {
    try {
      const configs = await this.getWalletConfigurations();
      
      // Only add default configurations if none exist
      if (configs.length === 0) {
        console.log("Creating default wallet configurations");
        
        // Add BSC Mainnet configuration
        await this.createWalletConfiguration({
          network: 'mainnet',
          chainId: 56,
          rpcUrl: 'https://bsc-dataseed.binance.org/',
          explorerUrl: 'https://bscscan.com',
          publicAddress: '0x0000000000000000000000000000000000000000', // Placeholder, to be set by admin
          contractAddress: '0x0000000000000000000000000000000000000000', // Placeholder, to be set by admin
          isActive: true,
          isDefault: true,
          networkName: 'BSC Mainnet',
          symbol: 'TSK',
          decimals: 18,
          gasLimit: 300000,
          gasPrice: '5000000000', // 5 Gwei
        });
        
        // Add BSC Testnet configuration
        await this.createWalletConfiguration({
          network: 'testnet',
          chainId: 97,
          rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545/',
          explorerUrl: 'https://testnet.bscscan.com',
          publicAddress: '0x0000000000000000000000000000000000000000', // Placeholder, to be set by admin
          contractAddress: '0x0000000000000000000000000000000000000000', // Placeholder, to be set by admin
          isActive: true,
          isDefault: false,
          networkName: 'BSC Testnet',
          symbol: 'TSK',
          decimals: 18,
          gasLimit: 300000,
          gasPrice: '10000000000', // 10 Gwei
        });
        
        console.log("Default wallet configurations initialized");
      }
    } catch (error) {
      console.error("Error initializing wallet configurations:", error);
    }
  }
  
  // Initialize default system secrets
  private async initSystemSecrets() {
    try {
      const secrets = await this.getSystemSecrets();
      
      // Only add default secrets if none exist
      if (secrets.length === 0) {
        console.log("Creating placeholder system secrets");
        
        // Add placeholder for API key
        await this.createSystemSecret({
          key: 'stripe_api_key',
          value: 'please_configure_me',
          description: 'Stripe API Key for payment processing',
          category: 'payment',
          isEncrypted: false,
          isActive: true,
          environment: 'production',
        });
        
        // Add placeholder for web3 provider URL
        await this.createSystemSecret({
          key: 'web3_provider_url',
          value: 'please_configure_me',
          description: 'Web3 Provider URL for blockchain interactions',
          category: 'blockchain',
          isEncrypted: false,
          isActive: true,
          environment: 'production',
        });
        
        // Add placeholder for email service API key
        await this.createSystemSecret({
          key: 'email_service_api_key',
          value: 'please_configure_me',
          description: 'API Key for email notification service',
          category: 'notifications',
          isEncrypted: false,
          isActive: true,
          environment: 'production',
        });
        
        console.log("Placeholder system secrets initialized");
      }
    } catch (error) {
      console.error("Error initializing system secrets:", error);
    }
  }
  
  // Initialize AI Knowledge Base with default entries
  private async initAIKnowledgeBase() {
    try {
      // Check if any knowledge base entries exist
      const entries = await this.getAIKnowledgeBase();
      
      if (entries.length === 0) {
        console.log("Initializing default AI knowledge base entries");
        
        // Create initial platform knowledge
        await this.createAIKnowledgeEntry({
          topic: "Mining",
          subtopic: "Daily rewards",
          information: "The TSK Platform allows users to mine tokens once daily. Mining rewards can increase based on streak days, premium membership, and referrals. Users need to interact with the mining button on the dashboard to claim their daily rewards.",
          relationships: [],
          confidence: 100
        });
        
        await this.createAIKnowledgeEntry({
          topic: "Wallet",
          subtopic: "Connection types",
          information: "The TSK Platform supports connecting both custodial and non-custodial cryptocurrency wallets. Users can connect multiple wallet types including MetaMask, WalletConnect, and the built-in platform wallet. Tokens can be transferred between wallets and used for marketplace purchases.",
          relationships: [{ topic: "Mining", relation: "stores rewards from" }],
          confidence: 100
        });
        
        await this.createAIKnowledgeEntry({
          topic: "Marketplace",
          subtopic: "Overview",
          information: "The marketplace allows users to buy and sell digital items using TSK tokens. All marketplace transactions are secured by smart contracts. Users can list their own items for sale after KYC verification. The platform charges a small fee for each transaction.",
          relationships: [{ topic: "KYC", relation: "requires" }],
          confidence: 100
        });
        
        await this.createAIKnowledgeEntry({
          topic: "KYC",
          subtopic: "Requirements",
          information: "Know Your Customer (KYC) verification is required for certain platform activities like selling on the marketplace or withdrawing large amounts of tokens. The verification process requires submitting identity documents and proof of address. The process typically takes 1-3 business days.",
          relationships: [],
          confidence: 100
        });
        
        await this.createAIKnowledgeEntry({
          topic: "Referrals",
          subtopic: "Program benefits",
          information: "The referral program allows users to earn bonus tokens when they invite new users to the platform. Each user has a unique referral code they can share. When a referred user joins and starts mining, the referrer receives a percentage bonus on their mining activities.",
          relationships: [{ topic: "Mining", relation: "enhances" }],
          confidence: 100
        });
        
        // Create initial AI system knowledge
        await this.createAIKnowledgeEntry({
          topic: "AI Assistant",
          subtopic: "Capabilities",
          information: "The AI assistant can help with platform navigation, explain features, troubleshoot issues, and provide personalized recommendations. It learns from user interactions to improve over time. The assistant can access user data to provide context-specific help but prioritizes user privacy.",
          relationships: [],
          confidence: 100
        });
        
        console.log("Default AI knowledge base entries initialized");
        
        // Create initial reasoning patterns
        console.log("Initializing default AI reasoning patterns");
        
        await this.createAIReasoningPattern({
          pattern: "Sequential logical reasoning",
          rules: [
            "IF [condition1] THEN [step1]",
            "IF [condition2] THEN [step2]",
            "CONCLUDE [result]"
          ],
          examples: [
            {
              input: "User has not mined today and has a 5-day streak",
              reasoning: "IF user has not mined today THEN remind about daily mining; IF user has a streak THEN mention potential streak bonus",
              output: "Remember to claim your daily mining rewards to maintain your 5-day streak for bonus tokens!"
            }
          ],
          category: "problem-solving",
          priority: 90
        });
        
        await this.createAIReasoningPattern({
          pattern: "Analogical reasoning",
          rules: [
            "Situation A has properties [p1, p2, p3]",
            "Situation B has properties [p1, p2]",
            "Therefore, B might also have property [p3]"
          ],
          examples: [
            {
              input: "User who completed KYC recently asking about marketplace",
              reasoning: "Users who complete KYC (like this user) typically want to sell items. This user is asking about marketplace, so they likely want to sell items.",
              output: "Since you've completed KYC verification, you can now both buy and sell items on the marketplace! Would you like to know how to create a listing?"
            }
          ],
          category: "inference",
          priority: 80
        });
        
        await this.createAIReasoningPattern({
          pattern: "Contextual analysis",
          rules: [
            "User query [Q] occurs in context [C]",
            "User has history [H]",
            "This suggests interpretation [I]",
            "Therefore, provide response [R]"
          ],
          examples: [
            {
              input: "User asks 'How do I get more?' while on mining page",
              reasoning: "Context is mining page, query is about getting more, so user is asking about increasing mining rewards",
              output: "To increase your mining rewards, you can: 1) Maintain a daily streak, 2) Refer friends, or 3) Purchase a premium package for bonus multipliers."
            }
          ],
          category: "interpretation",
          priority: 85
        });
        
        await this.createAIReasoningPattern({
          pattern: "Bayesian updating",
          rules: [
            "Prior belief: [P(hypothesis)]",
            "New evidence: [E]",
            "Updated belief: [P(hypothesis|E)]"
          ],
          examples: [
            {
              input: "User consistently asks about token price and trading",
              reasoning: "Initial belief: 50% chance user interested in trading. After multiple questions: 90% chance user interested in trading",
              output: "Based on your interests, you might want to check our new token trading tutorial in the Learning section. Would that be helpful?"
            }
          ],
          category: "learning",
          priority: 95
        });
        
        await this.createAIReasoningPattern({
          pattern: "Pattern recognition",
          rules: [
            "User has exhibited pattern [P] in situations [S1, S2, S3]",
            "Current situation [S4] matches pattern characteristics",
            "Therefore, suggest response [R]"
          ],
          examples: [
            {
              input: "User logs in every day at 9am but hasn't mined yet today",
              reasoning: "Pattern: user mines daily at morning login. Today: logged in but hasn't mined yet. Action: remind about mining",
              output: "Good morning! Don't forget to claim your daily mining rewards to keep your streak going!"
            }
          ],
          category: "personalization",
          priority: 90
        });
        
        console.log("Default AI reasoning patterns initialized");
      }
    } catch (error) {
      console.error("Error initializing AI knowledge base:", error);
    }
  }
  
  // Device token operations
  async getUserDeviceTokens(userId: number): Promise<DeviceToken[]> {
    return await db.select().from(deviceTokens)
      .where(eq(deviceTokens.userId, userId))
      .orderBy(desc(deviceTokens.createdAt));
  }
  
  async getDeviceTokenByToken(token: string): Promise<DeviceToken | undefined> {
    const [deviceToken] = await db.select().from(deviceTokens)
      .where(eq(deviceTokens.token, token));
    
    return deviceToken;
  }
  
  async registerDeviceToken(tokenData: InsertDeviceToken): Promise<DeviceToken> {
    // Check if the token already exists
    const existingToken = await this.getDeviceTokenByToken(tokenData.token);
    
    if (existingToken) {
      // Update the existing token
      const [updatedToken] = await db.update(deviceTokens)
        .set({
          userId: tokenData.userId,
          platform: tokenData.platform,
          deviceId: tokenData.deviceId,
          isActive: true,
          lastUsedAt: new Date()
        })
        .where(eq(deviceTokens.id, existingToken.id))
        .returning();
      
      return updatedToken;
    } else {
      // Create a new token record
      const [newToken] = await db.insert(deviceTokens)
        .values({
          userId: tokenData.userId,
          token: tokenData.token,
          platform: tokenData.platform,
          deviceId: tokenData.deviceId,
          isActive: true,
          lastUsedAt: new Date()
        })
        .returning();
      
      return newToken;
    }
  }
  
  async updateDeviceToken(id: number, data: Partial<DeviceToken>): Promise<DeviceToken | undefined> {
    const updateData: Record<string, any> = { ...data };
    delete updateData.updatedAt; // Remove unsupported field
    
    const [updatedToken] = await db.update(deviceTokens)
      .set({
        ...updateData,
        lastUsedAt: new Date()
      })
      .where(eq(deviceTokens.id, id))
      .returning();
    
    return updatedToken;
  }
  
  async deactivateDeviceToken(id: number): Promise<boolean> {
    const [updatedToken] = await db.update(deviceTokens)
      .set({
        isActive: false,
        lastUsedAt: new Date()
      })
      .where(eq(deviceTokens.id, id))
      .returning();
    
    return !!updatedToken;
  }
  
  async deactivateUserDeviceTokens(userId: number): Promise<boolean> {
    const result = await db.update(deviceTokens)
      .set({
        isActive: false,
        lastUsedAt: new Date()
      })
      .where(eq(deviceTokens.userId, userId));
    
    return true;
  }
  
  async deleteDeviceToken(id: number): Promise<boolean> {
    await db.delete(deviceTokens)
      .where(eq(deviceTokens.id, id));
    
    return true;
  }
  
  // Admin notification management methods
  async getAllNotifications(options: { limit: number; offset: number; search?: string }): Promise<Notification[]> {
    const query = db.select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt));
    
    // Add search condition if provided
    if (options.search && options.search.trim() !== '') {
      query.where(
        or(
          ilike(notifications.title, `%${options.search}%`),
          ilike(notifications.message, `%${options.search}%`)
        )
      );
    }
    
    // Apply pagination
    return await query
      .limit(options.limit)
      .offset(options.offset);
  }
  
  async getNotificationsCount(search?: string): Promise<number> {
    let query = db
      .select({ count: sql`count(*)` })
      .from(notifications);
    
    // Add search condition if provided
    if (search && search.trim() !== '') {
      query = query.where(
        or(
          ilike(notifications.title, `%${search}%`),
          ilike(notifications.message, `%${search}%`)
        )
      );
    }
    
    const result = await query;
    return Number(result[0].count);
  }
  
  async getUnreadNotificationsCount(): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(notifications)
      .where(eq(notifications.read, false));
    
    return Number(result[0].count);
  }
  
  async getAllDeviceTokens(): Promise<any[]> {
    // Return all device tokens with user info
    const tokens = await db.select({
      token: deviceTokens,
      user: {
        id: users.id,
        username: users.username
      }
    })
      .from(deviceTokens)
      .leftJoin(users, eq(deviceTokens.userId, users.id))
      .where(eq(deviceTokens.isActive, true))
      .orderBy(desc(deviceTokens.lastUsedAt));
    
    return tokens.map(t => ({
      ...t.token,
      user: t.user
    }));
  }
  
  async getActiveDeviceTokensCount(): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(deviceTokens)
      .where(eq(deviceTokens.isActive, true));
    
    return Number(result[0].count);
  }
  
  async getUsersSimple(): Promise<{id: number; username: string}[]> {
    return await db
      .select({
        id: users.id,
        username: users.username
      })
      .from(users)
      .orderBy(asc(users.username));
  }
  
  async getActiveUsersCount(): Promise<number> {
    const result = await db
      .select({ count: sql`count(*)` })
      .from(users)
      .where(gt(users.lastLoginTime, sql`now() - interval '30 days'`));
    
    return Number(result[0].count);
  }
  
  // AI operations - Knowledge Base
  async getAIKnowledgeBase(topic?: string): Promise<AIKnowledgeBase[]> {
    if (topic) {
      return db.select().from(aiKnowledgeBase)
        .where(ilike(aiKnowledgeBase.topic, `%${topic}%`))
        .orderBy(asc(aiKnowledgeBase.topic));
    }
    return db.select().from(aiKnowledgeBase)
      .orderBy(asc(aiKnowledgeBase.topic));
  }
  
  async getAIKnowledgeEntry(id: number): Promise<AIKnowledgeBase | undefined> {
    const [entry] = await db.select().from(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.id, id));
    return entry;
  }
  
  async createAIKnowledgeEntry(data: InsertAIKnowledgeBase): Promise<AIKnowledgeBase> {
    const [entry] = await db.insert(aiKnowledgeBase)
      .values(data)
      .returning();
    return entry;
  }
  
  async updateAIKnowledgeEntry(id: number, data: Partial<AIKnowledgeBase>): Promise<AIKnowledgeBase | undefined> {
    const [updated] = await db.update(aiKnowledgeBase)
      .set(data)
      .where(eq(aiKnowledgeBase.id, id))
      .returning();
    return updated;
  }
  
  async deleteAIKnowledgeEntry(id: number): Promise<boolean> {
    const [deleted] = await db.delete(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.id, id))
      .returning();
    return !!deleted;
  }

  async findAIKnowledgeByCategory(category: string, term?: string): Promise<AIKnowledgeBase[]> {
    if (term) {
      return db.select().from(aiKnowledgeBase)
        .where(
          and(
            eq(aiKnowledgeBase.category, category),
            or(
              ilike(aiKnowledgeBase.topic, `%${term}%`),
              ilike(aiKnowledgeBase.subtopic, `%${term}%`),
              ilike(aiKnowledgeBase.information, `%${term}%`)
            )
          )
        )
        .orderBy(desc(aiKnowledgeBase.confidence));
    }
    
    return db.select().from(aiKnowledgeBase)
      .where(eq(aiKnowledgeBase.category, category))
      .orderBy(desc(aiKnowledgeBase.confidence));
  }
  
  // AI operations - Reasoning
  async getAIReasoningPatterns(category?: string): Promise<AIReasoning[]> {
    if (category) {
      return db.select().from(aiReasoning)
        .where(eq(aiReasoning.category, category))
        .orderBy(asc(aiReasoning.pattern));
    }
    return db.select().from(aiReasoning)
      .orderBy(asc(aiReasoning.pattern));
  }
  
  async getAIReasoningPattern(id: number): Promise<AIReasoning | undefined> {
    const [pattern] = await db.select().from(aiReasoning)
      .where(eq(aiReasoning.id, id));
    return pattern;
  }
  
  async createAIReasoningPattern(data: InsertAIReasoning): Promise<AIReasoning> {
    const [pattern] = await db.insert(aiReasoning)
      .values(data)
      .returning();
    return pattern;
  }
  
  async updateAIReasoningPattern(id: number, data: Partial<AIReasoning>): Promise<AIReasoning | undefined> {
    const [updated] = await db.update(aiReasoning)
      .set(data)
      .where(eq(aiReasoning.id, id))
      .returning();
    return updated;
  }
  
  async deleteAIReasoningPattern(id: number): Promise<boolean> {
    const [deleted] = await db.delete(aiReasoning)
      .where(eq(aiReasoning.id, id))
      .returning();
    return !!deleted;
  }
  
  // AI operations - Conversation Memory
  async getAIConversationMemory(userId: number): Promise<AIConversationMemory | undefined> {
    const [memory] = await db.select().from(aiConversationMemory)
      .where(eq(aiConversationMemory.userId, userId));
    return memory;
  }
  
  async getAllAIConversationMemories(): Promise<AIConversationMemory[]> {
    return db.select().from(aiConversationMemory)
      .orderBy(desc(aiConversationMemory.lastInteraction));
  }
  
  async createAIConversationMemory(data: InsertAIConversationMemory): Promise<AIConversationMemory> {
    const [memory] = await db.insert(aiConversationMemory)
      .values(data)
      .returning();
    return memory;
  }
  
  async updateAIConversationMemory(id: number, data: Partial<AIConversationMemory>): Promise<AIConversationMemory | undefined> {
    const [updated] = await db.update(aiConversationMemory)
      .set(data)
      .where(eq(aiConversationMemory.id, id))
      .returning();
    return updated;
  }
  
  async deleteAIConversationMemory(id: number): Promise<boolean> {
    const [deleted] = await db.delete(aiConversationMemory)
      .where(eq(aiConversationMemory.id, id))
      .returning();
    return !!deleted;
  }
  
  // AI operations - System Tasks
  async getAISystemTasks(status?: string, taskType?: string): Promise<AISystemTask[]> {
    let query = db.select().from(aiSystemTasks);
    
    if (status) {
      query = query.where(eq(aiSystemTasks.status, status));
    }
    
    if (taskType) {
      query = query.where(eq(aiSystemTasks.taskType, taskType));
    }
    
    return query.orderBy(desc(aiSystemTasks.scheduledFor));
  }
  
  async getAISystemTask(id: number): Promise<AISystemTask | undefined> {
    const [task] = await db.select().from(aiSystemTasks)
      .where(eq(aiSystemTasks.id, id));
    return task;
  }
  
  async createAISystemTask(data: InsertAISystemTask): Promise<AISystemTask> {
    const [task] = await db.insert(aiSystemTasks)
      .values(data)
      .returning();
    return task;
  }
  
  async updateAISystemTask(id: number, data: Partial<AISystemTask>): Promise<AISystemTask | undefined> {
    const [updated] = await db.update(aiSystemTasks)
      .set(data)
      .where(eq(aiSystemTasks.id, id))
      .returning();
    return updated;
  }
  
  async deleteAISystemTask(id: number): Promise<boolean> {
    const [deleted] = await db.delete(aiSystemTasks)
      .where(eq(aiSystemTasks.id, id))
      .returning();
    return !!deleted;
  }

  // AI operations - Feedback
  async getAIFeedback(id: number): Promise<AIFeedback | undefined> {
    const [feedback] = await db.select().from(aiFeedback)
      .where(eq(aiFeedback.id, id));
    return feedback;
  }
  
  async getAIFeedbackByUser(userId: number): Promise<AIFeedback[]> {
    return db.select().from(aiFeedback)
      .where(eq(aiFeedback.userId, userId))
      .orderBy(desc(aiFeedback.createdAt));
  }

  async getAllAIFeedback(): Promise<AIFeedback[]> {
    return db.select().from(aiFeedback)
      .orderBy(desc(aiFeedback.createdAt));
  }

  async createAIFeedback(data: InsertAIFeedback): Promise<AIFeedback> {
    const [feedback] = await db.insert(aiFeedback)
      .values(data)
      .returning();
    return feedback;
  }

  async updateAIFeedback(id: number, data: Partial<AIFeedback>): Promise<AIFeedback | undefined> {
    const [updated] = await db.update(aiFeedback)
      .set(data)
      .where(eq(aiFeedback.id, id))
      .returning();
    return updated;
  }

  async deleteAIFeedback(id: number): Promise<boolean> {
    const [deleted] = await db.delete(aiFeedback)
      .where(eq(aiFeedback.id, id))
      .returning();
    return !!deleted;
  }
  
  // AI Auto Learning Operations
  
  async getUnprocessedAIFeedback(limit: number = 100): Promise<AIFeedback[]> {
    return db.select().from(aiFeedback)
      .where(eq(aiFeedback.processed, false))
      .orderBy(asc(aiFeedback.timestamp))
      .limit(limit);
  }
  
  async getAIFeedbackSince(date: Date, limit: number = 100): Promise<AIFeedback[]> {
    return db.select().from(aiFeedback)
      .where(gt(aiFeedback.timestamp, date))
      .orderBy(desc(aiFeedback.timestamp))
      .limit(limit);
  }
  
  async createPlatformScanResult(data: InsertPlatformScanResult): Promise<any> {
    const [result] = await db.insert(platformScanResults)
      .values(data)
      .returning();
    return result;
  }
  
  async getLatestPlatformScanResult(): Promise<any | undefined> {
    const [result] = await db.select().from(platformScanResults)
      .orderBy(desc(platformScanResults.scanTime))
      .limit(1);
    return result;
  }
  
  async storePlatformScanResult(data: any): Promise<any> {
    // This is an alias for createPlatformScanResult
    return this.createPlatformScanResult(data);
  }
  
  async createAILearningMetrics(data: InsertAILearningMetrics): Promise<any> {
    const [result] = await db.insert(aiLearningMetrics)
      .values(data)
      .returning();
    return result;
  }
  
  async getAILearningMetrics(limit: number = 30): Promise<any[]> {
    return db.select().from(aiLearningMetrics)
      .orderBy(desc(aiLearningMetrics.date))
      .limit(limit);
  }
  
  // AI Question Logging
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
  
  // AI Assistant Analytics
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
  
  async getAIAssistantAnalytics(): Promise<any> {
    try {
      // In a real implementation, we would fetch from the database
      return {
        totalInteractions: 0,
        positiveRatings: 0,
        negativeRatings: 0,
        neutralRatings: 0,
        knowledgeGapsIdentified: 0,
        knowledgeEntriesCreated: 0,
        knowledgeEntriesUpdated: 0,
        patternsCreated: 0,
        topQuestionCategories: [],
        commonMisunderstandings: [],
        averageResponseConfidence: 0,
        updatedAt: new Date()
      };
    } catch (error) {
      console.error("Error getting AI assistant analytics:", error);
      return null;
    }
  }
  
  // User Mining History
  async getUserMiningHistory(userId: number, limit: number = 10): Promise<any[]> {
    try {
      // Get mining history for a specific user
      const history = await db.select()
        .from(miningHistory)
        .where(eq(miningHistory.userId, userId))
        .orderBy(desc(miningHistory.timestamp))
        .limit(limit);
      
      return history;
    } catch (error) {
      console.error(`Error getting mining history for user ${userId}:`, error);
      return [];
    }
  }
  
  async getAllMiningHistory(limit: number = 1000): Promise<any[]> {
    try {
      // Get all mining history with a reasonable limit
      const history = await db.select()
        .from(miningHistory)
        .orderBy(desc(miningHistory.timestamp))
        .limit(limit);
      
      return history;
    } catch (error) {
      console.error("Error getting all mining history:", error);
      return [];
    }
  }
  
  // System Settings
  async getSystemSettings(): Promise<any> {
    try {
      // Get system settings from platform settings
      const settings = await db.select()
        .from(platformSettings)
        .where(eq(platformSettings.settingType, 'system'))
        .orderBy(desc(platformSettings.lastUpdatedAt))
        .limit(1);
      
      if (settings.length > 0) {
        // Parse content as JSON
        try {
          const content = JSON.parse(settings[0].content);
          return {
            ...content,
            id: settings[0].id,
            version: settings[0].version,
            lastUpdated: settings[0].lastUpdatedAt
          };
        } catch (e) {
          console.error("Error parsing system settings JSON:", e);
          return {};
        }
      }
      
      return {};
    } catch (error) {
      console.error("Error getting system settings:", error);
      return {};
    }
  }
  
  async updateSystemSettings(data: any): Promise<any> {
    try {
      // Get existing system settings
      const settings = await db.select()
        .from(platformSettings)
        .where(eq(platformSettings.settingType, 'system'))
        .orderBy(desc(platformSettings.lastUpdatedAt))
        .limit(1);
      
      if (settings.length > 0) {
        // Update existing settings
        const existingContent = JSON.parse(settings[0].content);
        const newContent = JSON.stringify({ ...existingContent, ...data });
        
        const [updated] = await db.update(platformSettings)
          .set({
            content: newContent,
            lastUpdatedAt: new Date(),
            version: (parseFloat(settings[0].version) + 0.1).toFixed(1)
          })
          .where(eq(platformSettings.id, settings[0].id))
          .returning();
        
        return updated;
      } else {
        // Create new settings
        const [created] = await db.insert(platformSettings)
          .values({
            settingType: 'system',
            title: 'System Settings',
            content: JSON.stringify(data),
            version: '1.0',
            lastUpdatedAt: new Date(),
            isActive: true
          })
          .returning();
        
        return created;
      }
    } catch (error) {
      console.error("Error updating system settings:", error);
      return null;
    }
  }
  
  // KYC Methods
  async countKycByStatus(status: string): Promise<number> {
    try {
      const result = await db.select({ count: sql<number>`count(*)` })
        .from(userKyc)
        .where(eq(userKyc.status, status));
      
      return result[0].count || 0;
    } catch (error) {
      console.error(`Error counting KYC by status ${status}:`, error);
      return 0;
    }
  }
  
  async getAllKyc(): Promise<any[]> {
    try {
      const kyc = await db.select()
        .from(userKyc)
        .orderBy(desc(userKyc.submissionDate));
      
      return kyc;
    } catch (error) {
      console.error("Error getting all KYC:", error);
      return [];
    }
  }
  
  // Referrals
  async getAllReferrals(): Promise<any[]> {
    try {
      const refs = await db.select()
        .from(referrals);
      
      return refs;
    } catch (error) {
      console.error("Error getting all referrals:", error);
      return [];
    }
  }
  
  // Platform scanner methods
  
  async getActiveAds(): Promise<EmbeddedAd[]> {
    try {
      return await db.select()
        .from(embeddedAds)
        .where(
          and(
            eq(embeddedAds.active, true),
            or(
              isNull(embeddedAds.expiresAt),
              gt(embeddedAds.expiresAt, new Date())
            )
          )
        );
    } catch (error) {
      console.error("Error getting active ads:", error);
      return [];
    }
  }
  
  async getAnnouncements(): Promise<any[]> {
    try {
      // Using events table for announcements since there's no dedicated table
      return await db.select()
        .from(events)
        .where(eq(events.active, true))
        .orderBy(desc(events.createdAt))
        .limit(10);
    } catch (error) {
      console.error("Error getting announcements:", error);
      return [];
    }
  }
  
  async countKycByStatus(status: string): Promise<number> {
    try {
      const result = await db.select({ count: sql`count(*)` })
        .from(userKyc)
        .where(eq(userKyc.status, status));
      
      return Number(result[0]?.count || 0);
    } catch (error) {
      console.error(`Error counting KYC by status ${status}:`, error);
      return 0;
    }
  }
  
  async getSystemSettings(): Promise<any> {
    try {
      const settings = await db.select()
        .from(platformSettings)
        .where(eq(platformSettings.isActive, true));
      
      // Transform into a single settings object
      const settingsObj: Record<string, any> = {};
      
      for (const setting of settings) {
        if (setting.settingType) {
          // Use content field as the value since there's no settingValue field
          settingsObj[setting.settingType] = setting.content;
        }
      }
      
      return settingsObj;
    } catch (error) {
      console.error("Error getting system settings:", error);
      return {};
    }
  }
  
  async getAllReferrals(): Promise<Referral[]> {
    try {
      return await db.select().from(referrals);
    } catch (error) {
      console.error("Error getting all referrals:", error);
      return [];
    }
  }
  
  async getAllKyc(): Promise<UserKyc[]> {
    try {
      return await db.select().from(userKyc);
    } catch (error) {
      console.error("Error getting all KYC records:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();

// Placeholder functions -  REPLACE THESE WITH ACTUAL IMPLEMENTATIONS
async function hashPassword(password: string): Promise<string> {
  return password; // Insecure - replace with a proper hashing function
}

function generateReferralCode(): string {
  return "REF-CODE"; // Replace with a proper referral code generation function
}

// Utility function for creating notifications
export async function createUserNotification(
  userId: number, 
  type: string, 
  title: string, 
  message: string, 
  options: {
    priority?: number;
    expiresAt?: Date | null;
    actionUrl?: string | null;
    imageUrl?: string | null;
    metadata?: Record<string, any> | null;
  } = {}
): Promise<Notification> {
  return storage.createNotification({
    userId,
    type,
    title,
    message,
    read: false,
    priority: options.priority || 1,
    expiresAt: options.expiresAt || null,
    actionUrl: options.actionUrl || null,
    imageUrl: options.imageUrl || null,
    metadata: options.metadata || null
  });
}
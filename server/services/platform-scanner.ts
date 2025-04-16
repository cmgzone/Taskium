/**
 * Platform Scanner Service
 * 
 * This service scans the entire platform to collect metrics and detect changes
 * that can be used to update the AI knowledge base automatically.
 */

import { storage } from "../storage";

export class PlatformScanner {
  /**
   * Scan the entire platform to collect metrics and current state
   */
  async scanPlatform(): Promise<any> {
    console.log("Starting platform scan...");
    const startTime = Date.now();
    
    try {
      // Collect stats from different parts of the platform
      const userStats = await this.collectUserStats();
      const miningStats = await this.collectMiningStats();
      const marketplaceStats = await this.collectMarketplaceStats();
      const systemStats = await this.collectSystemStats();
      const aiStats = await this.collectAIStats();
      const contentStats = await this.collectContentData();
      const kycStats = await this.collectKYCData();
      const platformFeatures = await this.collectPlatformFeatures();
      
      // Create a snapshot of the current knowledge base
      const knowledgeSnapshot = await this.createKnowledgeSnapshot();
      
      const scanTime = Date.now() - startTime;
      console.log(`Enhanced platform scan completed in ${scanTime}ms`);
      
      // Return the complete scan result
      return {
        scanTime: new Date(),
        userStats,
        miningStats,
        marketplaceStats,
        systemStats,
        aiStats,
        contentStats,
        kycStats,
        platformFeatures,
        knowledgeSnapshot
      };
    } catch (error) {
      console.error("Error scanning platform:", error);
      throw error;
    }
  }
  
  /**
   * Collect statistics about users
   */
  private async collectUserStats(): Promise<any> {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Calculate basic stats
      const totalUsers = allUsers.length;
      const activeUsers = allUsers.filter(u => 
        // Use lastMiningTime as a proxy for user activity 
        u.lastMiningTime && (new Date().getTime() - new Date(u.lastMiningTime).getTime()) < 7 * 24 * 60 * 60 * 1000
      ).length;
      
      // Calculate premium users
      const premiumUsers = allUsers.filter(u => u.premiumTier !== "Basic").length;
      
      // Calculate KYC verification status
      const kycVerified = await this.countUsersByKycStatus("verified");
      const kycPending = await this.countUsersByKycStatus("pending");
      
      // Calculate referral stats
      const referrals = await this.calculateReferralStats();
      
      return {
        totalUsers,
        activeUsers,
        premiumUsers,
        kycVerified,
        kycPending,
        referrals,
        registrationsByDay: await this.calculateRegistrationsByDay(allUsers)
      };
    } catch (error) {
      console.error("Error collecting user stats:", error);
      return {
        totalUsers: 0,
        activeUsers: 0,
        premiumUsers: 0,
        kycVerified: 0,
        kycPending: 0,
        referrals: {
          totalReferrals: 0,
          activeReferrers: 0
        }
      };
    }
  }
  
  /**
   * Count users by KYC status
   */
  private async countUsersByKycStatus(status: string): Promise<number> {
    try {
      const users = await storage.getUsersByKycStatus(status);
      return users?.length || 0;
    } catch (error) {
      console.error(`Error counting users with KYC status "${status}":`, error);
      return 0;
    }
  }
  
  /**
   * Calculate referral statistics
   */
  private async calculateReferralStats(): Promise<any> {
    try {
      const allUsers = await storage.getAllUsers();
      
      // Calculate referrers (users who have referred at least one person)
      let activeReferrers = 0;
      let totalReferrals = 0;
      
      for (const user of allUsers) {
        const referralCount = await storage.getActiveReferralsCount(user.id);
        
        if (referralCount > 0) {
          activeReferrers++;
          totalReferrals += referralCount;
        }
      }
      
      return {
        totalReferrals,
        activeReferrers
      };
    } catch (error) {
      console.error("Error calculating referral stats:", error);
      return {
        totalReferrals: 0,
        activeReferrers: 0
      };
    }
  }
  
  /**
   * Calculate registrations by day
   */
  private async calculateRegistrationsByDay(users: any[]): Promise<any> {
    try {
      // Group users by registration date (counting from the last 30 days)
      const registrationsByDay: Record<string, number> = {};
      const now = new Date();
      
      // Initialize last 30 days with 0
      for (let i = 0; i < 30; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        registrationsByDay[dateStr] = 0;
      }
      
      // Count registrations by day
      for (const user of users) {
        if (!user.createdAt) continue;
        
        const registrationDate = new Date(user.createdAt);
        const daysDiff = Math.floor((now.getTime() - registrationDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysDiff < 30) {
          const dateStr = registrationDate.toISOString().split('T')[0];
          registrationsByDay[dateStr] = (registrationsByDay[dateStr] || 0) + 1;
        }
      }
      
      return registrationsByDay;
    } catch (error) {
      console.error("Error calculating registrations by day:", error);
      return {};
    }
  }
  
  /**
   * Collect statistics about mining activities
   */
  private async collectMiningStats(): Promise<any> {
    try {
      const recentMining = await storage.getAllMiningHistory(100);
      
      // Get mining settings
      const miningSettings = await storage.getMiningSettings();
      
      // Calculate mining rates
      let totalMined = 0;
      let maxMiningRate = 0;
      let averageMiningRate = 0;
      const userMiningCounts: Record<string, number> = {};
      
      for (const mining of recentMining) {
        totalMined += mining.amount;
        userMiningCounts[mining.userId] = (userMiningCounts[mining.userId] || 0) + 1;
        
        if (mining.amount > maxMiningRate) {
          maxMiningRate = mining.amount;
        }
      }
      
      // Calculate average mining rate (if we have mining data)
      if (recentMining.length > 0) {
        averageMiningRate = totalMined / recentMining.length;
      }
      
      // Count active miners (users who mined at least once in the last day)
      const activeMiners = Object.keys(userMiningCounts).length;
      
      return {
        totalMined,
        maxMiningRate,
        averageMiningRate,
        activeMiners,
        miningSettings: {
          hourlyReward: miningSettings.hourlyrewardamount,
          streakBonus: miningSettings.enablestreakbonus,
          maxStreakDays: miningSettings.maxstreakdays,
          streakBonusPercentPerDay: miningSettings.streakbonuspercentperday
        }
      };
    } catch (error) {
      console.error("Error collecting mining stats:", error);
      return {
        totalMined: 0,
        maxMiningRate: 0,
        averageMiningRate: 0,
        activeMiners: 0,
        miningSettings: {}
      };
    }
  }
  
  /**
   * Collect statistics about marketplace
   */
  private async collectMarketplaceStats(): Promise<any> {
    try {
      const marketplaceItems = await storage.getMarketplaceItems();
      
      // Calculate stats by category
      const categoryCounts: Record<string, number> = {};
      let totalValue = 0;
      
      for (const item of marketplaceItems) {
        categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
        totalValue += item.price;
      }
      
      // Get recent transactions
      const recentTransactions: Array<{id: number, amount: number, timestamp: Date}> = [];
      // This would require specific API to get recent transactions
      
      return {
        totalItems: marketplaceItems.length,
        totalValue,
        categoryCounts,
        recentTransactions
      };
    } catch (error) {
      console.error("Error collecting marketplace stats:", error);
      return {
        totalItems: 0,
        totalValue: 0,
        categoryCounts: {},
        recentTransactions: []
      };
    }
  }
  
  /**
   * Collect statistics about system health
   */
  private async collectSystemStats(): Promise<any> {
    try {
      // This would be extended with actual system metrics
      // For now, we'll return placeholder data
      
      return {
        apiUsage: {
          "/api/user": 100,
          "/api/mining": 80,
          "/api/marketplace": 50,
          "/api/ai/chat": 30
        },
        errorRates: {
          "/api/user": 0.01,
          "/api/mining": 0.02,
          "/api/marketplace": 0.01,
          "/api/ai/chat": 0.03
        },
        systemLoad: 0.4,
        memoryUsage: 0.3,
        databaseSize: 10000
      };
    } catch (error) {
      console.error("Error collecting system stats:", error);
      return {
        apiUsage: {},
        errorRates: {},
        systemLoad: 0,
        memoryUsage: 0,
        databaseSize: 0
      };
    }
  }
  
  /**
   * Collect statistics about the AI system
   */
  private async collectAIStats(): Promise<any> {
    try {
      // Get AI knowledge base size
      const knowledgeBase = await storage.getAIKnowledgeBase();
      const reasoningPatterns = await storage.getAIReasoningPatterns();
      
      // Group knowledge by category
      const knowledgeByCategory: Record<string, number> = {};
      
      for (const entry of knowledgeBase) {
        const category = entry.category || 'uncategorized';
        knowledgeByCategory[category] = (knowledgeByCategory[category] || 0) + 1;
      }
      
      // Get recent feedback stats
      const allFeedback = await storage.getAllAIFeedback();
      
      let averageRating = 0;
      let positiveRatings = 0;
      let negativeRatings = 0;
      
      for (const feedback of allFeedback) {
        averageRating += feedback.rating;
        
        if (feedback.rating >= 4) {
          positiveRatings++;
        } else if (feedback.rating <= 2) {
          negativeRatings++;
        }
      }
      
      if (allFeedback.length > 0) {
        averageRating /= allFeedback.length;
      }
      
      return {
        knowledgeBaseSize: knowledgeBase.length,
        knowledgeByCategory,
        reasoningPatternsCount: reasoningPatterns.length,
        feedbackCount: allFeedback.length,
        averageRating,
        positiveRatings,
        negativeRatings
      };
    } catch (error) {
      console.error("Error collecting AI stats:", error);
      return {
        knowledgeBaseSize: 0,
        knowledgeByCategory: {},
        reasoningPatternsCount: 0,
        feedbackCount: 0,
        averageRating: 0,
        positiveRatings: 0,
        negativeRatings: 0
      };
    }
  }
  
  /**
   * Create a snapshot of the current knowledge base
   */
  private async createKnowledgeSnapshot(): Promise<any> {
    try {
      // Get a summary of the knowledge base
      const knowledgeBase = await storage.getAIKnowledgeBase();
      
      // Group by topic and create a summary (not including full content)
      const topicSummary: Record<string, any> = {};
      
      for (const entry of knowledgeBase) {
        if (!topicSummary[entry.topic]) {
          topicSummary[entry.topic] = {
            subtopics: {},
            count: 0
          };
        }
        
        topicSummary[entry.topic].count++;
        
        if (!topicSummary[entry.topic].subtopics[entry.subtopic]) {
          topicSummary[entry.topic].subtopics[entry.subtopic] = 0;
        }
        
        topicSummary[entry.topic].subtopics[entry.subtopic]++;
      }
      
      return {
        totalEntries: knowledgeBase.length,
        topicSummary,
        timestamp: new Date()
      };
    } catch (error) {
      console.error("Error creating knowledge snapshot:", error);
      return {
        totalEntries: 0,
        topicSummary: {},
        timestamp: new Date()
      };
    }
  }
  
  /**
   * Collect content data including text content from ads, marketplace listings,
   * and other platform content sources
   */
  private async collectContentData(): Promise<any> {
    try {
      // Collect active ads and their content
      const activeAds = await storage.getActiveAds();
      
      // Extract text content from ads for AI processing
      const adContentSummaries = activeAds.map(ad => ({
        id: ad.id,
        title: ad.title,
        description: ad.description?.substring(0, 100), // Truncate description
        keywords: this.extractKeywords(ad.title + ' ' + (ad.description || '')),
        // Since we can't access category directly, we'll use a default value
        category: "advertisement"
      }));
      
      // Get marketplace listings with text content
      const marketplaceItems = await storage.getMarketplaceItems();
      const marketplaceContentSummaries = marketplaceItems.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description?.substring(0, 100), // Truncate description
        keywords: this.extractKeywords(item.title + ' ' + (item.description || '')),
        category: item.category,
        price: item.price
      }));
      
      // Get public news/announcements
      const announcements = await storage.getAnnouncements();
      const announcementSummaries = announcements.map(ann => ({
        id: ann.id,
        title: ann.title,
        summary: ann.content?.substring(0, 100), // Truncate content
        date: ann.createdAt,
        keywords: this.extractKeywords(ann.title + ' ' + (ann.content || ''))
      }));
      
      return {
        ads: {
          count: adContentSummaries.length,
          items: adContentSummaries
        },
        marketplace: {
          count: marketplaceContentSummaries.length,
          items: marketplaceContentSummaries
        },
        announcements: {
          count: announcementSummaries.length,
          items: announcementSummaries
        }
      };
    } catch (error) {
      console.error("Error collecting content data:", error);
      return {
        ads: { count: 0, items: [] },
        marketplace: { count: 0, items: [] },
        announcements: { count: 0, items: [] }
      };
    }
  }
  
  /**
   * Extract keywords from text for improved content analysis
   */
  private extractKeywords(text: string): string[] {
    if (!text) return [];
    
    // Simple keyword extraction (in a real system, we would use NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
      
    // Remove common stop words
    const stopWords = ['this', 'that', 'these', 'those', 'the', 'and', 'but', 'for', 'with', 'about'];
    const filteredWords = words.filter(word => !stopWords.includes(word));
    
    // Return unique keywords
    // Use a simple approach to get unique words instead of Set
    const uniqueWords: string[] = [];
    for (const word of filteredWords) {
      if (!uniqueWords.includes(word)) {
        uniqueWords.push(word);
      }
    }
    return uniqueWords.slice(0, 10); // Limit to 10 keywords
  }
  
  /**
   * Collect a comprehensive platform overview for the AI system
   * This provides real-time context about the platform state
   */
  async collectPlatformOverview(): Promise<any> {
    try {
      // Get basic user stats
      const userStats = await this.collectUserStats();
      
      // Get system health information
      const systemStats = await this.collectSystemStats();
      
      // Get mining information
      const miningStats = await this.collectMiningStats();
      
      // Get feature flags and configuration
      const featureConfig = await this.collectPlatformFeatures();
      
      // Get recent platform activity
      const recentTransactions = await this.getRecentTransactions(10);
      
      // Check for system errors
      const recentErrors = await this.getRecentErrors(5);
      
      return {
        totalUsers: userStats.totalUsers || 0,
        activeUsers: userStats.activeUsers || 0,
        systemHealth: {
          status: recentErrors.length > 0 ? "issues_detected" : "healthy",
          load: systemStats.systemLoad || 0,
          databaseStatus: "healthy", // We would check this dynamically in production
          memoryUsage: systemStats.memoryUsage || 0
        },
        features: featureConfig,
        mining: miningStats,
        recentTransactions,
        recentErrors,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error("Error collecting platform overview:", error);
      // Return a minimal response to avoid breaking the AI
      return {
        totalUsers: 0,
        activeUsers: 0,
        systemHealth: { status: "unknown", databaseStatus: "unknown" },
        features: {},
        lastUpdated: new Date()
      };
    }
  }
  
  /**
   * Get recent transactions for platform overview
   */
  private async getRecentTransactions(limit: number): Promise<any[]> {
    try {
      // In a real implementation, we would fetch from the database
      // For now, we'll return some sample data
      return [
        { id: 1, type: "token_transfer", amount: 100, timestamp: new Date() },
        { id: 2, type: "mining_reward", amount: 5, timestamp: new Date() },
        { id: 3, type: "marketplace_purchase", amount: 50, timestamp: new Date() }
      ].slice(0, limit);
    } catch (error) {
      console.error("Error getting recent transactions:", error);
      return [];
    }
  }
  
  /**
   * Get recent system errors for platform health monitoring
   */
  private async getRecentErrors(limit: number): Promise<any[]> {
    try {
      // In a real implementation, we would fetch from an error log
      // For demo purposes, we'll return an empty array to show all is well
      return [];
    } catch (error) {
      console.error("Error getting recent system errors:", error);
      return [];
    }
  }
  
  /**
   * Collect user-specific context for personalized AI responses
   */
  async collectUserContext(userId: number): Promise<any> {
    try {
      // Get basic user information
      const user = await storage.getUser(userId);
      if (!user) {
        return null;
      }
      
      // Get user token balances
      const balances = [
        { token: "TSK", amount: user.tokenBalance || 0 }
      ];
      
      // Get recent user activity
      const recentActivity = await this.getUserRecentActivity(userId, 5);
      
      // Get user preferences
      const preferences = user.preferences || { notifications: true };
      
      // Get mining status
      let accountStatus = "active";
      if (user.lastMiningTime) {
        const lastMining = new Date(user.lastMiningTime);
        const now = new Date();
        const hoursSinceLastMining = (now.getTime() - lastMining.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastMining < 24) {
          accountStatus = "mining";
        }
      }
      
      return {
        userId,
        username: user.username,
        accountStatus,
        balances,
        recentActivity,
        preferences,
        joinDate: user.createdAt,
        referralCode: user.referralCode,
        kycStatus: user.kycStatus || "not_started"
      };
    } catch (error) {
      console.error(`Error collecting user context for user ${userId}:`, error);
      return null;
    }
  }
  
  /**
   * Get recent activity for a specific user
   */
  private async getUserRecentActivity(userId: number, limit: number): Promise<any[]> {
    try {
      // Get mining history
      const miningHistory = await storage.getUserMiningHistory(userId, limit);
      
      // Format mining history
      const formattedMining = miningHistory.map(mining => ({
        type: "mining",
        amount: mining.amount,
        timestamp: mining.timestamp,
        details: `Mining reward: ${mining.amount} TSK`
      }));
      
      // We would also fetch other activity types here
      
      // Return combined recent activity
      return formattedMining.slice(0, limit);
    } catch (error) {
      console.error(`Error getting recent activity for user ${userId}:`, error);
      return [];
    }
  }
  
  /**
   * Collect KYC-related data to enhance AI KYC assistance capabilities
   */
  private async collectKYCData(): Promise<any> {
    try {
      // Get KYC verification requirements
      const requirements = {
        documentTypes: ["passport", "drivers_license", "national_id", "residence_permit"],
        requiredFields: ["fullName", "country", "documentType", "documentId"],
        imageRequirements: ["frontImageUrl", "selfieImageUrl"]
      };
      
      // Get KYC statistics
      const pendingCount = await storage.countKycByStatus("pending");
      const verifiedCount = await storage.countKycByStatus("verified");
      const rejectedCount = await storage.countKycByStatus("rejected");
      
      // Get most common KYC issues (for better assistance)
      // In a real system, this would be derived from actual rejection data
      const commonIssues = [
        { issue: "Blurry document images", frequency: "high" },
        { issue: "Document not matching user information", frequency: "medium" },
        { issue: "Expired documents", frequency: "medium" },
        { issue: "Selfie not clearly showing face with document", frequency: "high" },
        { issue: "Incomplete information", frequency: "low" }
      ];
      
      return {
        requirements,
        stats: {
          pending: pendingCount,
          verified: verifiedCount,
          rejected: rejectedCount,
          total: pendingCount + verifiedCount + rejectedCount
        },
        commonIssues,
        processingTime: "24-48 hours"
      };
    } catch (error) {
      console.error("Error collecting KYC data:", error);
      return {
        requirements: {},
        stats: { pending: 0, verified: 0, rejected: 0, total: 0 },
        commonIssues: [],
        processingTime: "unknown"
      };
    }
  }
  
  /**
   * Collect platform features and their availability 
   * to help AI answer questions about platform capabilities
   */
  private async collectPlatformFeatures(): Promise<any> {
    try {
      // Get system settings
      const systemSettings = await storage.getSystemSettings();
      
      // Define core platform features
      const features = [
        {
          name: "Mining",
          enabled: true,
          description: "Earn TSK tokens by completing mining activities",
          details: {
            hourlyRewards: true,
            streakBonus: systemSettings?.enableStreakBonus || true,
            weekendBoost: systemSettings?.enableWeekendBoost || false
          }
        },
        {
          name: "Marketplace",
          enabled: true,
          description: "Buy and sell digital items using TSK tokens",
          details: {
            categories: ["digital_goods", "services", "content"],
            listing_fee: systemSettings?.marketplaceListingFee || 0
          }
        },
        {
          name: "Wallet",
          enabled: true,
          description: "Connect and manage your blockchain wallet",
          details: {
            supported_networks: ["BNB Smart Chain", "Ethereum"],
            withdrawal_enabled: systemSettings?.enableWithdrawals || true
          }
        },
        {
          name: "Referrals",
          enabled: true,
          description: "Invite friends and earn rewards",
          details: {
            reward_per_referral: systemSettings?.referralReward || 25,
            levels: systemSettings?.referralLevels || 1
          }
        },
        {
          name: "KYC Verification",
          enabled: true,
          description: "Verify your identity to unlock all platform features",
          details: {
            required_for_withdrawal: true,
            process_time: "24-48 hours",
            document_types: ["passport", "drivers_license", "national_id"]
          }
        },
        {
          name: "AI Assistant",
          enabled: true,
          description: "Intelligent assistant to help with platform questions",
          details: {
            self_learning: true,
            personalized_help: true,
            available_24_7: true
          }
        }
      ];
      
      // Get feature usage statistics
      const featureUsage = {
        "Mining": await this.getFeatureUsageCount("mining"),
        "Marketplace": await this.getFeatureUsageCount("marketplace"),
        "Wallet": await this.getFeatureUsageCount("wallet"),
        "Referrals": await this.getFeatureUsageCount("referrals"),
        "KYC": await this.getFeatureUsageCount("kyc"),
        "AI Assistant": await this.getFeatureUsageCount("ai")
      };
      
      return {
        availableFeatures: features,
        featureUsage,
        systemVersion: systemSettings?.version || "1.0.0",
        lastUpdated: systemSettings?.lastUpdated || new Date()
      };
    } catch (error) {
      console.error("Error collecting platform features:", error);
      return {
        availableFeatures: [],
        featureUsage: {},
        systemVersion: "unknown",
        lastUpdated: new Date()
      };
    }
  }
  
  /**
   * Get usage count for specific platform features
   */
  private async getFeatureUsageCount(feature: string): Promise<number> {
    try {
      // In a real system, this would query actual usage metrics
      // This is a placeholder implementation
      switch (feature) {
        case "mining":
          return (await storage.getAllMiningHistory(1000)).length;
        case "marketplace":
          return (await storage.getMarketplaceItems()).length;
        case "wallet":
          // Count users with connected wallets
          const usersWithWallets = (await storage.getAllUsers()).filter(u => u.walletAddress).length;
          return usersWithWallets;
        case "referrals":
          // Count active referrals
          const allReferrals = await storage.getAllReferrals();
          return allReferrals?.length || 0;
        case "kyc":
          // Count all KYC submissions
          const allKyc = await storage.getAllKyc();
          return allKyc?.length || 0;
        case "ai":
          // Count AI interactions
          const aiInteractions = await storage.getAllAIFeedback();
          return aiInteractions?.length || 0;
        default:
          return 0;
      }
    } catch (error) {
      console.error(`Error getting feature usage for ${feature}:`, error);
      return 0;
    }
  }
}
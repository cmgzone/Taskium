import { storage } from '../../storage';
import { AIKnowledgeBase, AIReasoning, AIConversationMemory, AISystemTask, User } from '../../../shared/schema';
import { PlatformScanner } from '../platform-scanner';

// Initialize the platform scanner
const platformScanner = new PlatformScanner();
import { googleAPIService } from '../google-api';
import { openAIService } from './openai-service';
import { KYCAssistantService } from './kyc-assistant';
import { realWorldAssistant } from './realworld-assistant';

// Interface for context aware AI
interface AIContext {
  currentPage?: string;
  recentActions?: string[];
  preferences?: Record<string, any>;
}

/**
 * Intelligent AI Service
 * 
 * This service provides AI functionality for the platform including:
 * - Context-aware user assistance 
 * - Answer platform questions
 * - Provide personalized recommendations
 * - Analyze user behavior for insights
 * - Self-improvement through learning
 */
export class AIService {
  private kycAssistant: KYCAssistantService;
  
  constructor() {
    this.kycAssistant = new KYCAssistantService();
  }
  
  // Knowledge retrieval and application
  async getRelevantKnowledge(topic: string): Promise<AIKnowledgeBase[]> {
    return storage.getAIKnowledgeBase(topic);
  }

  async getReasoningPatterns(category?: string): Promise<AIReasoning[]> {
    return storage.getAIReasoningPatterns(category);
  }

  async getUserMemory(userId: number): Promise<AIConversationMemory | null> {
    const memory = await storage.getAIConversationMemory(userId);
    return memory || null;
  }

  // Create or update user memory
  async updateUserMemory(userId: number, conversation: any): Promise<void> {
    const memory = await storage.getAIConversationMemory(userId);
    
    if (memory) {
      // Update existing memory
      const conversations = [...memory.conversations, conversation];
      await storage.updateAIConversationMemory(memory.id, {
        conversations,
        lastInteraction: new Date()
      });
    } else {
      // Create new memory
      await storage.createAIConversationMemory({
        userId,
        conversations: [conversation],
        lastInteraction: new Date(),
        userPreferences: {},
        frequentTopics: []
      });
    }
  }

  // Answer a question using AI knowledge
  async answerQuestion(question: string, userId: number, context: AIContext = {}): Promise<{ answer: string; confidence: number; sources: string[]; action?: any }> {
    console.log(`Processing AI question: ${question}`);
    
    // Track question for analytics
    await this.trackUserQuestion(userId, question);
    
    // Get user memory for personalized responses
    const memory = await this.getUserMemory(userId);
    
    // Get user information
    const user = await storage.getUser(userId);
    if (!user) {
      return {
        answer: "I'm sorry, but I couldn't identify your user account.",
        confidence: 0.1,
        sources: []
      };
    }
    
    // Check if this is a KYC-related question
    const lowercaseQuestion = question.toLowerCase();
    
    // Enhanced check for KYC-related keywords and phrases
    const kycKeywords = [
      'kyc', 'verify', 'verification', 'identity', 'document', 'upload id', 
      'passport', 'driver', 'license', 'id card', 'national id', 'proof', 
      'selfie', 'photo', 'identification', 'residence', 'address',
      'submit', 'upload', 'validate', 'approve', 'reject', 'status'
    ];
    
    const kycPhrases = [
      'verify my account', 'verify my identity', 'identity verification', 
      'submit document', 'upload document', 'document status', 'verification status', 
      'account verification', 'kyc status', 'verify me', 'upload my id', 
      'check my verification', 'need to verify', 'how to verify'
    ];
    
    const isKycKeyword = kycKeywords.some(keyword => lowercaseQuestion.includes(keyword));
    const isKycPhrase = kycPhrases.some(phrase => lowercaseQuestion.includes(phrase));
    const isKycQuestion = isKycKeyword || isKycPhrase;
    
    // Route KYC-related questions to the KYC Assistant
    if (isKycQuestion) {
      try {
        console.log("Routing question to KYC Assistant:", question);
        const kycResponse = await this.kycAssistant.handleKYCMessage(question, userId);
        
        // Store the conversation for history
        await this.updateUserMemory(userId, {
          question: question,
          answer: kycResponse.response,
          timestamp: new Date(),
          topics: ['KYC', 'Verification']
        });
        
        // Return response with KYC action if any
        return {
          answer: kycResponse.response,
          confidence: 0.95, // High confidence for specialized KYC handling
          sources: ['KYC Assistant'],
          action: kycResponse.action
        };
      } catch (error) {
        console.error("Error processing KYC question:", error);
        // Fall back to regular processing if KYC handling fails
      }
    }
    
    // Check if this is a marketplace-related question for product recommendations
    const marketplaceKeywords = [
      'marketplace', 'product', 'buy', 'purchase', 'recommend', 'suggestion',
      'order', 'listing', 'item', 'sale', 'shopping', 'shop', 'best',
      'price', 'cheap', 'expensive', 'digital goods', 'services', 'physical'
    ];
    
    const marketplacePhrases = [
      'what should i buy', 'recommend me', 'show me products', 'looking for', 
      'want to buy', 'help me find', 'best product', 'popular items',
      'marketplace items', 'good deals', 'trending products', 'top sellers'
    ];
    
    const isMarketplaceKeyword = marketplaceKeywords.some(keyword => lowercaseQuestion.includes(keyword));
    const isMarketplacePhrase = marketplacePhrases.some(phrase => lowercaseQuestion.includes(phrase));
    const isMarketplaceQuestion = isMarketplaceKeyword || isMarketplacePhrase;
    
    if (isMarketplaceQuestion) {
      try {
        console.log("Processing marketplace product question:", question);
        
        // Get marketplace recommendations based on user's query
        const recommendations = await this.getMarketplaceRecommendations(question, userId);
        
        // Store the conversation for history
        await this.updateUserMemory(userId, {
          question: question,
          answer: recommendations.answer,
          timestamp: new Date(),
          topics: ['Marketplace', 'Shopping', 'Recommendations']
        });
        
        // Return response with marketplace action if available
        return {
          answer: recommendations.answer,
          confidence: 0.9, // High confidence for marketplace handling
          sources: ['Marketplace', 'Product Catalog'],
          action: recommendations.action
        };
      } catch (error) {
        console.error("Error processing marketplace question:", error);
        // Fall back to regular processing if marketplace handling fails
      }
    }
    
    // Analyze question to determine topics
    const topics = this.analyzeQuestionTopics(question);
    
    // Check if this might be a real-world question with enhanced classification
    try {
      // Get conversation memory for context-aware classification
      const conversationMemory = await storage.getAIConversationMemory(userId);
      
      // Use the enhanced classifier with conversation context
      if (realWorldAssistant.isRealWorldQuestion(question, conversationMemory || [])) {
        console.log("Routing question to Real-World Assistant:", question);
        
        // Process through real-world assistant
        const realWorldResponse = await realWorldAssistant.answerRealWorldQuestion(
          question,
          userId,
          conversationMemory || []
        );
        
        // Only use real-world response if it confirms this is a real-world question
        if (realWorldResponse.isRealWorldQuestion) {
          console.log("Answering as real-world question");
          
          // Extract topics from the question for better categorization
          const topicKeywords = this.extractTopicKeywords(question);
          
          // Store the conversation with more specific topics when possible
          await this.updateUserMemory(userId, {
            question: question,
            answer: realWorldResponse.answer,
            timestamp: new Date(),
            topics: ['RealWorld', ...topicKeywords]
          });
          
          // Collect sources more intelligently
          const sources = realWorldResponse.sources.length > 0
            ? realWorldResponse.sources.map(s => s.topic + (s.subtopic ? `/${s.subtopic}` : ''))
            : ['General Knowledge'];
          
          return {
            answer: realWorldResponse.answer,
            confidence: realWorldResponse.confidence,
            sources: sources
          };
        }
      }
    } catch (error) {
      console.error("Error processing real-world question:", error);
      // Fall back to regular processing if real-world handling fails
    }
    
    // Check if this is a platform context question (stats, system status, etc.)
    if (this.isPlatformContextQuestion(question)) {
      // Collect real-time platform data
      const platformContext = await platformScanner.collectPlatformOverview();
      
      // Get user-specific context if available
      const userContext = await platformScanner.collectUserContext(userId);
      
      // Generate response from real-time platform data
      const contextResponse = this.generatePlatformContextResponse(
        question, 
        platformContext, 
        userContext, 
        user
      );
      
      if (contextResponse) {
        return {
          answer: contextResponse,
          confidence: 0.9, // High confidence for real-time platform data
          sources: ['Platform Context', 'System Status']
        };
      }
    }
    
    // Get reasoning patterns for structuring the response
    const reasoningPatterns = await this.getReasoningPatterns();
    
    if (reasoningPatterns.length === 0) {
      return {
        answer: "I'm still learning how to answer questions. Please check back soon.",
        confidence: 0.1,
        sources: []
      };
    }
    
    // Select appropriate reasoning pattern
    const reasoningPattern = this.selectReasoningPattern(reasoningPatterns, question);
    
    // Try with exact topic matches first
    let allKnowledgeEntries: AIKnowledgeBase[] = [];
    
    for (const topic of topics) {
      const topicEntries = await this.getRelevantKnowledge(topic);
      if (topicEntries.length > 0) {
        allKnowledgeEntries = [...allKnowledgeEntries, ...topicEntries];
      }
    }
    
    // If no exact matches, try semantic search
    if (allKnowledgeEntries.length === 0) {
      try {
        const relatedEntries = await this.semanticSearch(question);
        allKnowledgeEntries = [...allKnowledgeEntries, ...relatedEntries];
      } catch (error) {
        console.error("Error in semantic search:", error);
      }
    }
    
    // Filter out low confidence entries unless we have nothing else
    const knowledgeEntries = allKnowledgeEntries.length > 3 
      ? allKnowledgeEntries.filter(entry => (entry.confidence || 0) > 50)
      : allKnowledgeEntries;
    
    // If no knowledge found or very low confidence, check if OpenAI can help
    if (knowledgeEntries.length === 0 || 
        (knowledgeEntries.length > 0 && knowledgeEntries[0].confidence && knowledgeEntries[0].confidence < 50)) {
      
      // Retrieve conversation history for context if available
      const conversationHistory = memory?.conversations.slice(-5) || [];
      
      // Try to use OpenAI for enhanced answers when knowledge base is insufficient
      try {
        if (openAIService.isReady()) {
          console.log("Using OpenAI for enhanced answer");
          
          const openAIResult = await openAIService.answerQuestion(
            question,
            allKnowledgeEntries,
            reasoningPatterns,
            userId,
            conversationHistory
          );
          
          // Save any new knowledge generated
          if (openAIResult.newKnowledge) {
            await storage.createAIKnowledgeEntry(openAIResult.newKnowledge);
            console.log("New knowledge entry created from OpenAI");
          }
          
          // Update analytics to track OpenAI usage
          await storage.updateAIAssistantAnalytics({
            aiAssistedAnswers: 1
          });
          
          return {
            answer: openAIResult.answer,
            confidence: openAIResult.confidence,
            sources: openAIResult.sources ? openAIResult.sources.map(s => s.topic) : ['AI Assistant']
          };
        }
      } catch (error) {
        console.error("Error using OpenAI for enhanced answer:", error);
      }
    }
    
    // Apply reasoning to generate a response
    const response = this.applyReasoning(knowledgeEntries, reasoningPattern, user, memory, context);
    
    // Schedule learning task if confidence is low
    if (response.confidence < 0.7) {
      this.scheduleAILearningTask(question, response.confidence);
    }
    
    return response;
  }
  
  /**
   * Extract topic keywords from a question for categorization
   * Used to better track question topics and improve future responses
   */
  private extractTopicKeywords(question: string): string[] {
    // Convert to lowercase for matching
    const lowerQuestion = question.toLowerCase();
    
    // Topic mapping to extract from questions
    const topicMapping: Record<string, string[]> = {
      'Science': ['physics', 'chemistry', 'biology', 'scientific', 'science', 'element', 'experiment', 'theory'],
      'Mathematics': ['math', 'mathematics', 'calculation', 'formula', 'equation', 'geometry', 'algebra'],
      'History': ['history', 'historical', 'ancient', 'century', 'war', 'revolution', 'civilization', 'empire'],
      'Geography': ['geography', 'country', 'continent', 'ocean', 'mountain', 'river', 'climate', 'map'],
      'Technology': ['technology', 'computer', 'internet', 'software', 'hardware', 'digital', 'device', 'tech'],
      'Programming': ['programming', 'code', 'software', 'developer', 'language', 'algorithm', 'coding'],
      'Health': ['health', 'medical', 'disease', 'symptom', 'treatment', 'doctor', 'medicine', 'wellness'],
      'Business': ['business', 'company', 'finance', 'economics', 'market', 'stock', 'investment', 'corporate'],
      'Arts': ['art', 'music', 'painting', 'literature', 'creative', 'artist', 'culture', 'film', 'movie'],
      'Sports': ['sports', 'game', 'team', 'athlete', 'competition', 'tournament', 'olympic', 'championship']
    };
    
    // Results array
    const extractedTopics: string[] = [];
    
    // Check each topic's keywords
    for (const [topic, keywords] of Object.entries(topicMapping)) {
      for (const keyword of keywords) {
        // Only detect whole words
        const pattern = new RegExp(`\\b${keyword}\\b`, 'i');
        if (pattern.test(lowerQuestion)) {
          extractedTopics.push(topic);
          break; // Once we've matched a topic, no need to check more keywords for it
        }
      }
    }
    
    // If no topics were found, use a default
    if (extractedTopics.length === 0) {
      extractedTopics.push('General Knowledge');
    }
    
    return extractedTopics;
  }
  
  // Apply reasoning patterns to generate a comprehensive response
  private applyReasoning(knowledgeEntries: AIKnowledgeBase[], reasoningPattern: AIReasoning, user: User, memory: AIConversationMemory | null, context: AIContext): { answer: string; confidence: number; sources: string[] } {
    // If no knowledge or reasoning pattern is available, return a fallback response
    if (knowledgeEntries.length === 0 || !reasoningPattern) {
      return {
        answer: "I don't have enough information to answer that question yet. The team is continuously improving my knowledge base.",
        confidence: 0.3,
        sources: []
      };
    }
    
    // Sort knowledge entries by confidence
    knowledgeEntries.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    
    // Check for dictionary/general knowledge entries to format them differently
    const hasDictionaryEntries = knowledgeEntries.some(entry => 
      entry.category === 'dictionary' || entry.topic === 'Dictionary');
    
    const hasGeneralKnowledgeEntries = knowledgeEntries.some(entry => 
      entry.category === 'general');
    
    let answer = '';
    
    if (hasDictionaryEntries) {
      // Format dictionary entries with definition-style response
      const dictionaryEntries = knowledgeEntries.filter(entry => 
        entry.category === 'dictionary' || entry.topic === 'Dictionary');
      
      // Use the highest confidence dictionary entry
      if (dictionaryEntries.length > 0) {
        const topEntry = dictionaryEntries[0];
        answer = `${topEntry.subtopic}: ${topEntry.information}`;
        
        // Add related terms if present in relationships
        if (topEntry.relationships && Array.isArray(topEntry.relationships) && topEntry.relationships.length > 0) {
          answer += "\n\nRelated terms: " + topEntry.relationships
            .map((rel: string) => rel.split(':')[1])
            .join(', ');
        }
      }
    } else if (hasGeneralKnowledgeEntries) {
      // Format general knowledge entries as informative response
      const generalEntries = knowledgeEntries.filter(entry => 
        entry.category === 'general');
      
      // Combine the information from general entries
      if (generalEntries.length > 0) {
        answer = generalEntries.map(entry => entry.information).join("\n\n");
      }
    } else {
      // Regular platform-specific response
      answer = knowledgeEntries.map(entry => entry.information).join(" ");
    }
    
    // Get sources for attribution
    const sources = knowledgeEntries.map(entry => entry.topic);
    const uniqueSources = Array.from(new Set(sources));
    
    // Apply basic personalization based on user data
    let personalizedAnswer = this.personalizeResponse(answer, user, memory);
    
    // Calculate confidence based on knowledge entry confidence and context relevance
    const baseConfidence = knowledgeEntries[0]?.confidence || 50;
    const contextRelevance = context.currentPage && 
      knowledgeEntries.some(entry => entry.topic.toLowerCase().includes(context.currentPage!.toLowerCase())) 
      ? 0.2 : 0;
    const memoryRelevance = memory ? 0.1 : 0;
    
    // Higher confidence for dictionary entries
    const categoryBonus = hasDictionaryEntries ? 0.1 : 0;
    
    const confidence = Math.min(((baseConfidence / 100) + contextRelevance + memoryRelevance + categoryBonus), 1.0);
    
    return {
      answer: personalizedAnswer,
      confidence,
      sources: uniqueSources
    };
  }
  
  // Generate a response based on platform context data
  private generatePlatformContextResponse(
    question: string,
    platformContext: any,
    userContext: any,
    user: User
  ): string | null {
    if (!platformContext) {
      return null;
    }
    
    const lowercaseQuestion = question.toLowerCase();
    let response = null;
    
    // Handle user-specific platform questions
    if (userContext && (lowercaseQuestion.includes("my") || lowercaseQuestion.includes("i "))) {
      if (lowercaseQuestion.includes("balance") || lowercaseQuestion.includes("tokens")) {
        response = `Your current balance is ${userContext.balances?.[0]?.amount || 0} tokens. `;
        
        if (userContext.recentActivity && userContext.recentActivity.length > 0) {
          const lastActivity = userContext.recentActivity[0];
          response += `Your most recent activity was ${lastActivity.type} on ${new Date(lastActivity.timestamp).toLocaleDateString()}.`;
        }
      } else if (lowercaseQuestion.includes("status") || lowercaseQuestion.includes("account")) {
        response = `Your account status is ${userContext.accountStatus}. `;
        if (userContext.preferences) {
          response += `You've set your notification preferences to ${userContext.preferences.notifications ? 'enabled' : 'disabled'}.`;
        }
      }
    }
    
    // Handle platform-wide questions
    if (!response) {
      // Handle mining-related questions
      if (lowercaseQuestion.includes("mine") || lowercaseQuestion.includes("mining")) {
        // Get mining feature details
        const miningFeatures = platformContext.features?.mining || { 
          enabled: true, 
          streakBonusEnabled: true,
          referralBonusEnabled: true
        };
        
        if (lowercaseQuestion.includes("how") || lowercaseQuestion.includes("what")) {
          response = `Mining on TSK Platform is simple! You can mine tokens once daily by clicking the mining button on your dashboard. `;
          
          if (miningFeatures.streakBonusEnabled) {
            response += `There's a streak bonus for consecutive days of mining. `;
          }
          
          if (miningFeatures.referralBonusEnabled) {
            response += `You can also earn additional tokens through referrals. `;
          }
          
          if (userContext && userContext.accountStatus === 'mining') {
            response += `Your mining is currently active! Make sure to return daily to maintain your streak.`;
          } else if (userContext) {
            response += `Your mining is currently inactive. Activate it on your dashboard to start earning tokens.`;
          }
          
          return response;
        }
      }
      
      if (lowercaseQuestion.includes("how many users")) {
        response = `The platform currently has ${platformContext.totalUsers} total users with ${platformContext.activeUsers} active in the last 24 hours.`;
      } else if (lowercaseQuestion.includes("system health") || lowercaseQuestion.includes("platform status")) {
        const statusMessage = platformContext.systemHealth?.databaseStatus === "healthy" ? 
          "all systems are operating normally" : 
          "we're experiencing some technical issues";
        
        response = `The platform status is: ${statusMessage}. `;
        
        if (platformContext.recentErrors && platformContext.recentErrors.length > 0) {
          response += `There have been ${platformContext.recentErrors.length} reported issues in the last 24 hours.`;
        } else {
          response += `No issues have been reported in the last 24 hours.`;
        }
      } else if (lowercaseQuestion.includes("transaction") || lowercaseQuestion.includes("activity")) {
        if (platformContext.recentTransactions && platformContext.recentTransactions.length > 0) {
          const txCount = platformContext.recentTransactions.length;
          response = `There have been ${txCount} transactions processed recently on the platform.`;
        }
      }
    }
    
    // Add personalization if response was generated
    if (response) {
      // Add username occasionally for a more personal touch
      if (Math.random() > 0.7) {
        response = `${user.username}, ${response.charAt(0).toLowerCase() + response.slice(1)}`;
      }
    }
    
    return response;
  }

  // Personalize response based on user data and memory
  private personalizeResponse(baseResponse: string, user: User, memory: AIConversationMemory | null): string {
    // Add basic user personalization
    let response = baseResponse;
    
    // Add username if appropriate
    if (Math.random() > 0.7) {
      response = `${user.username}, ${response.charAt(0).toLowerCase() + response.slice(1)}`;
    }
    
    // Add contextual information from memory if available
    if (memory && memory.conversations && memory.conversations.length > 0) {
      const recentConversations = memory.conversations.slice(-3);
      
      // Check if we've recently discussed this topic
      const relatedPriorConversation = recentConversations.find(conv => 
        baseResponse.toLowerCase().includes(conv.question.toLowerCase())
      );
      
      if (relatedPriorConversation) {
        response += ` As we discussed earlier, this is important for your platform experience.`;
      }
    }
    
    // Add user status-specific information
    if (user.role === 'admin' || user.role === 'moderator') {
      response += ` As a platform ${user.role}, you have additional capabilities in this area.`;
    }
    
    return response;
  }

  // Schedule a learning task for the AI system, potentially using OpenAI for enhancement
  private async scheduleAILearningTask(question: string, confidence: number): Promise<void> {
    // Create the system task to address the knowledge gap
    const task = await storage.createAISystemTask({
      taskType: 'knowledge_gap',
      priority: Math.round((1 - confidence) * 100),
      status: 'pending',
      data: {
        question,
        confidence,
        timestamp: new Date().toISOString()
      },
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000) // Schedule for 24 hours later
    });
    
    // If OpenAI is configured, immediately attempt to generate knowledge
    if (openAIService.isReady()) {
      try {
        console.log("Using OpenAI to proactively address knowledge gap");
        
        // Get existing knowledge that might be relevant
        const topics = this.analyzeQuestionTopics(question);
        const existingKnowledge: AIKnowledgeBase[] = [];
        
        for (const topic of topics) {
          const knowledge = await this.getRelevantKnowledge(topic);
          existingKnowledge.push(...knowledge);
        }
        
        // Generate new knowledge from OpenAI
        const newKnowledge = await openAIService.generateNewKnowledge(
          question, 
          existingKnowledge.length > 0 ? existingKnowledge.map(k => k.information).join(" ") : ""
        );
        
        if (newKnowledge) {
          console.log("OpenAI generated new knowledge to fill gap:", newKnowledge.topic);
          
          // Store the new knowledge
          await storage.createAIKnowledgeEntry(newKnowledge);
          
          // Update the task to reflect that we've addressed it
          await storage.updateAISystemTask(task.id, {
            status: 'completed',
            data: {
              ...task.data as any,
              resolution: {
                action: 'knowledge_added',
                knowledgeId: newKnowledge.topic,
                timestamp: new Date().toISOString()
              }
            }
          });
        }
      } catch (error) {
        console.error("Error using OpenAI to address knowledge gap:", error);
        // Task will remain pending for manual review
      }
    }
  }
  
  // Determine if a question requires platform-wide context
  private isPlatformContextQuestion(question: string): boolean {
    const lowercaseQuestion = question.toLowerCase();
    
    // Keywords that indicate platform-wide context is needed
    const platformContextKeywords = [
      "platform", "system", "overall", "everyone", "all users", 
      "statistics", "stats", "trends", "performance",
      "status", "health", "issues", "problems",
      "how many", "average", "total", "network",
      "most popular", "active", "down", "available",
      "mining", "mine", "rewards", "token", "tokens", "streak"
    ];
    
    // Check for platform context keywords in the question
    for (const keyword of platformContextKeywords) {
      if (lowercaseQuestion.includes(keyword)) {
        return true;
      }
    }
    
    // Check for specific platform question patterns
    if (
      lowercaseQuestion.startsWith("is the platform") ||
      lowercaseQuestion.startsWith("are there any") ||
      lowercaseQuestion.startsWith("what is the state") ||
      lowercaseQuestion.startsWith("how is the") ||
      lowercaseQuestion.includes("platform wide") ||
      lowercaseQuestion.includes("across the platform") ||
      lowercaseQuestion.includes("platform status") ||
      lowercaseQuestion.includes("all networks") ||
      lowercaseQuestion.includes("system overview")
    ) {
      return true;
    }
    
    // Check for mining-specific patterns
    if (
      lowercaseQuestion.startsWith("how do i mine") ||
      lowercaseQuestion.startsWith("how can i mine") ||
      lowercaseQuestion.includes("mine tsk") ||
      lowercaseQuestion.includes("mining tsk") ||
      lowercaseQuestion.includes("mining rewards") ||
      lowercaseQuestion.includes("mining streak") ||
      lowercaseQuestion.includes("daily mining") ||
      lowercaseQuestion.includes("mining rate") ||
      lowercaseQuestion.includes("how mining works")
    ) {
      return true;
    }
    
    return false;
  }

  // Track user question for analytics and learning
  private async trackUserQuestion(userId: number, question: string): Promise<void> {
    try {
      // Update AI assistant analytics
      await storage.updateAIAssistantAnalytics({ 
        totalInteractions: 1
      });
      
      // Add to question log for later analysis
      await storage.createAIQuestionLog({
        userId,
        question,
        timestamp: new Date(),
        topic: this.analyzeQuestionTopics(question)[0] || 'general',
        processed: false
      });
    } catch (error) {
      console.error("Error tracking user question:", error);
    }
  }
  
  // Advanced analysis of question topics
  /**
   * Determine if a user question is related to marketplace shopping or product recommendations
   */
  private isMarketplaceQuestion(question: string): boolean {
    const marketplaceKeywords = [
      'marketplace', 'product', 'buy', 'purchase', 'shopping', 
      'recommendation', 'recommend', 'item', 'items', 'listing',
      'sell', 'price', 'cost', 'shop', 'store', 'order', 'sale'
    ];
    
    const marketplacePatterns = [
      /looking for .+\?/i,
      /show me .+\?/i,
      /find .+\?/i,
      /recommend .+\?/i,
      /where (can|could) i (buy|find|get|purchase) .+\?/i,
      /what .+ (should|can|would) (i|you) (recommend|suggest)/i,
      /do you have .+\?/i,
      /is there .+ (available|for sale)/i,
      /how much .+ cost/i
    ];
    
    // Check for marketplace keywords
    const questionLower = question.toLowerCase();
    const hasMarketplaceKeyword = marketplaceKeywords.some(keyword => 
      questionLower.includes(keyword)
    );
    
    // Check for marketplace question patterns
    const matchesMarketplacePattern = marketplacePatterns.some(pattern => 
      pattern.test(question)
    );
    
    return hasMarketplaceKeyword || matchesMarketplacePattern;
  }
  
  private analyzeQuestionTopics(question: string): string[] {
    // Enhanced topic mapping with more comprehensive categories
    const keywordTopicMap: Record<string, string> = {
      // Token & Cryptocurrency related
      'token': 'Tokens',
      'tokens': 'Tokens',
      'tsk': 'Tokens',
      'coin': 'Tokens',
      'cryptocurrency': 'Tokens',
      'crypto': 'Tokens',
      'digital currency': 'Tokens',
      'tokenomics': 'Tokenomics',
      'circulation': 'Tokenomics',
      'supply': 'Tokenomics',
      'price': 'Token Value',
      'value': 'Token Value',
      
      // Wallet & Transfers
      'wallet': 'Wallet',
      'wallets': 'Wallet',
      'balance': 'Wallet',
      'address': 'Blockchain Address',
      'transfer': 'Transfers',
      'send': 'Transfers',
      'receive': 'Transfers',
      
      // Exchange & Trading
      'exchange': 'Exchange',
      'swap': 'Exchange',
      'buy': 'Purchase',
      'purchase': 'Purchase',
      'sell': 'Selling',
      'trade': 'Trading',
      
      // Identity & Security
      'kyc': 'KYC',
      'verify': 'Verification',
      'verification': 'Verification',
      'identity': 'Identity',
      'account': 'Account',
      'login': 'Authentication',
      'password': 'Security',
      'secure': 'Security',
      'security': 'Security',
      
      // Mining & Rewards
      'mining': 'Mining',
      'mine': 'Mining',
      'miner': 'Mining',
      'daily': 'Daily Activities',
      'reward': 'Rewards',
      'bonus': 'Rewards',
      'streak': 'Mining Streaks',
      'consecutive': 'Mining Streaks',
      
      // Community & Social
      'refer': 'Referrals',
      'referral': 'Referrals',
      'friend': 'Referrals',
      'community': 'Community',
      'social': 'Social',
      'forum': 'Community',
      
      // Marketplace
      'marketplace': 'Marketplace',
      'market': 'Marketplace',
      'product': 'Products',
      'item': 'Products',
      'listing': 'Marketplace Listings',
      'search': 'Search',
      'filter': 'Filtering',
      'sort': 'Sorting',
      'bid': 'Auction',
      'auction': 'Auction',
      
      // Payments & Fees
      'payment': 'Payments',
      'pay': 'Payments',
      'fee': 'Fees',
      'commission': 'Fees',
      'transaction': 'Transactions',
      'gas': 'Gas Fees',
      
      // User Experience
      'notification': 'Notifications',
      'alert': 'Alerts',
      'setting': 'Settings',
      'profile': 'Profile',
      'username': 'Profile',
      'avatar': 'Profile',
      'preferences': 'Settings',
      
      // Support & Information
      'help': 'Support',
      'support': 'Support',
      'contact': 'Contact',
      'tutorial': 'Tutorials',
      'guide': 'Guides',
      'learn': 'Learning',
      'education': 'Learning',
      'documentation': 'Documentation',
      'docs': 'Documentation',
      
      // KYC & Verification
      'kyc': 'KYC',
      'verification': 'KYC',
      'verify': 'KYC',
      'identify': 'Identity Verification',
      'identity': 'Identity Verification',
      'document': 'KYC Documents',
      'passport': 'Identification Documents',
      'driver': 'Identification Documents',
      'license': 'Identification Documents',
      'selfie': 'Identity Verification',
      
      // Platform Technology
      'blockchain': 'Blockchain',
      'smart contract': 'Smart Contracts',
      'contract': 'Smart Contracts',
      'web3': 'Web3',
      'network': 'Network',
      'decentralized': 'Decentralization',
      
      // AI Assistant
      'ai': 'AI Assistant',
      'assistant': 'AI Assistant',
      'artificial intelligence': 'AI Assistant',
      'knowledge': 'Knowledge Base'
    };
    
    // Default topics if no match found
    const defaultTopics = ['General', 'Platform'];
    
    // Preprocess the question 
    const questionLower = question.toLowerCase();
    
    // Multi-word phrases need special handling to prioritize them
    const phraseMatches: string[] = [];
    const multiWordKeywords = Object.keys(keywordTopicMap).filter(k => k.includes(' '));
    
    // Check for multi-word matches first (they have higher priority)
    for (const keyword of multiWordKeywords) {
      if (questionLower.includes(keyword)) {
        phraseMatches.push(keywordTopicMap[keyword]);
      }
    }
    
    // Then check for single word matches
    const singleWordMatches = Object.entries(keywordTopicMap)
      .filter(([keyword]) => !keyword.includes(' ') && questionLower.includes(keyword))
      .map(([_, topic]) => topic);
    
    // Combine matches, prioritizing phrase matches
    let allMatches = [...phraseMatches, ...singleWordMatches];
    
    // Deduplicate topics
    const uniqueTopics = Array.from(new Set(allMatches));
    
    // If we have too many topics, prioritize the most important ones
    let result = uniqueTopics;
    if (uniqueTopics.length > 3) {
      // Priority topics that should be kept if present
      const highPriorityTopics = ['Mining', 'Tokens', 'Wallet', 'Marketplace', 'AI Assistant'];
      const highPriorityMatches = uniqueTopics.filter(t => highPriorityTopics.includes(t));
      
      // Keep high priority topics and add others until we have 3
      result = [
        ...highPriorityMatches,
        ...uniqueTopics.filter(t => !highPriorityTopics.includes(t))
      ].slice(0, 3);
    }
    
    // Add default topics if no specific ones were found
    return result.length > 0 ? result : defaultTopics;
  }
  
  // Select the most appropriate reasoning pattern for a question
  private selectReasoningPattern(patterns: AIReasoning[], question: string): AIReasoning {
    // Default to first pattern if no good match
    if (patterns.length === 0) {
      return {
        id: 0,
        pattern: 'general',
        category: 'general',
        rules: ['Provide clear information', 'Be concise'],
        examples: [],
        priority: 1
      };
    }
    
    // Sort by priority (higher is better)
    const sortedPatterns = [...patterns].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    // Look for topic match in pattern category
    const topics = this.analyzeQuestionTopics(question);
    const topicPattern = sortedPatterns.find(p => 
      topics.some(t => p.category?.toLowerCase() === t.toLowerCase())
    );
    
    if (topicPattern) {
      return topicPattern;
    }
    
    // Look for keyword matches in pattern examples
    const withExamples = sortedPatterns.filter(p => p.examples && p.examples.length > 0);
    
    for (const pattern of withExamples) {
      for (const example of (pattern.examples || [])) {
        if (typeof example === 'string' && question.toLowerCase().includes(example.toLowerCase())) {
          return pattern;
        }
      }
    }
    
    // Default to highest priority pattern
    return sortedPatterns[0];
  }
  
  // Perform enhanced semantic search if exact match fails
  private async semanticSearch(query: string): Promise<AIKnowledgeBase[]> {
    try {
      console.log(`Performing semantic search for query: "${query}"`);
      
      // First try Google API if available
      if (googleAPIService && typeof googleAPIService.isConfigured === 'function' && googleAPIService.isConfigured()) {
        try {
          const googleResults = await googleAPIService.semanticSearch(query);
          if (googleResults && googleResults.length > 0) {
            console.log(`Google API returned ${googleResults.length} results`);
            return googleResults;
          }
        } catch (error) {
          console.error("Error using Google API for semantic search:", error);
          // Continue with local search
        }
      }
      
      console.log("Using enhanced local semantic search");
      
      // Fallback to enhanced local semantic search
      const allKnowledge = await storage.getAIKnowledgeBase();
      
      if (allKnowledge.length === 0) {
        console.log("No knowledge base entries found");
        return [];
      }
      
      console.log(`Loaded ${allKnowledge.length} knowledge base entries`);
      
      // Extract significant words and phrases from the query
      const queryWords = query.toLowerCase().split(/\s+/).filter(word => word.length > 2);
      const queryPhrases = this.extractPhrases(query.toLowerCase());
      const queryBigrams = this.createBigrams(query.toLowerCase());
      
      // Try to determine the question type for better matching
      const questionType = this.determineQuestionType(query);
      console.log(`Question type: ${questionType}, Phrases: ${queryPhrases.join(', ')}, Bigrams: ${queryBigrams.join(', ')}`);
      
      // Enhanced scoring algorithm with multiple techniques
      const scoredResults = allKnowledge.map(entry => {
        const topicText = entry.topic.toLowerCase();
        const subtopicText = entry.subtopic.toLowerCase();
        const infoText = entry.information.toLowerCase();
        const combinedText = `${topicText} ${subtopicText} ${infoText}`;
        
        // Initialize score components for better diagnostics
        let phraseMatchScore = 0;
        let wordMatchScore = 0;
        let bigramMatchScore = 0;
        let topicMatchScore = 0;
        let questionTypeMatchScore = 0;
        
        // 1. Exact phrase matches (highest weight)
        for (const phrase of queryPhrases) {
          if (combinedText.includes(phrase)) {
            // Longer phrases get higher scores
            const phraseScore = 3 * (1 + phrase.length / 10);
            phraseMatchScore += phraseScore;
            
            // Boost score if phrase appears in topic or subtopic (key fields)
            if (topicText.includes(phrase) || subtopicText.includes(phrase)) {
              topicMatchScore += 5;
            }
          }
        }
        
        // 2. Bigram matches (medium weight)
        for (const bigram of queryBigrams) {
          if (combinedText.includes(bigram)) {
            bigramMatchScore += 2;
            
            // Bonus for topic/subtopic matches
            if (topicText.includes(bigram) || subtopicText.includes(bigram)) {
              topicMatchScore += 1.5;
            }
          }
        }
        
        // 3. Word matches (lower weight)
        for (const word of queryWords) {
          if (combinedText.includes(word)) {
            // Add basic score for word match
            wordMatchScore += 1;
            
            // Boost for exact word match (not partial)
            const wordBoundaryRegex = new RegExp(`\\b${word}\\b`, 'i');
            if (wordBoundaryRegex.test(combinedText)) {
              wordMatchScore += 0.5;
              
              // Count occurrences for better scoring
              const regex = new RegExp(`\\b${word}\\b`, 'gi');
              const matches = combinedText.match(regex);
              const matchCount = matches ? matches.length : 0;
              
              if (matchCount > 1) {
                // Multiple matches indicate higher relevance
                wordMatchScore += matchCount * 0.2;
              }
            }
            
            // Higher boost for topic/subtopic matches
            if (topicText.includes(word)) topicMatchScore += 2;
            if (subtopicText.includes(word)) topicMatchScore += 1.5;
          }
        }
        
        // 4. Question type matching
        if (questionType) {
          // Check if entry seems to answer this type of question
          if (questionType === 'how' && 
              (infoText.includes('how to') || 
               infoText.includes('steps') || 
               infoText.includes('process') ||
               infoText.includes('method'))) {
            questionTypeMatchScore += 3;
          } else if (questionType === 'what' && 
                    (infoText.includes('is a') || 
                     infoText.includes('refers to') || 
                     infoText.includes('defined as'))) {
            questionTypeMatchScore += 3;
          } else if (questionType === 'why' && 
                    (infoText.includes('because') || 
                     infoText.includes('reason') || 
                     infoText.includes('explains'))) {
            questionTypeMatchScore += 3;
          } else if (questionType === 'difference' &&
                    (infoText.includes('difference') ||
                     infoText.includes('compared to') ||
                     infoText.includes('versus') ||
                     infoText.includes(' vs '))) {
            questionTypeMatchScore += 4;
          } else if (questionType === 'list' &&
                    (infoText.includes('include:') ||
                     /\d+\.\s/.test(infoText) ||
                     infoText.includes('following') ||
                     infoText.includes('several'))) {
            questionTypeMatchScore += 3;
          }
        }
        
        // 5. Confidence factor - we trust entries with higher confidence
        const confidenceFactor = ((entry.confidence || 80) / 100) + 0.5; // Min factor of 0.5 even for low confidence
        
        // Combine all scores with appropriate weights
        const totalScore = (
          (phraseMatchScore * 0.3) + 
          (bigramMatchScore * 0.2) +
          (wordMatchScore * 0.2) + 
          (topicMatchScore * 0.2) + 
          (questionTypeMatchScore * 0.1)
        ) * confidenceFactor;
        
        return { 
          entry, 
          score: totalScore,
          diagnostics: {
            phraseMatchScore,
            bigramMatchScore,
            wordMatchScore,
            topicMatchScore,
            questionTypeMatchScore,
            confidenceFactor,
            totalScore
          }
        };
      });
      
      // Sort by score and remove zero scores
      scoredResults.sort((a, b) => b.score - a.score);
      const filteredResults = scoredResults.filter(item => item.score > 0.5);
      
      // For debugging, log top scoring entries
      const topEntries = scoredResults.slice(0, 3);
      console.log(`Top scoring entries (${filteredResults.length} matched):`);
      topEntries.forEach(item => {
        console.log(`- Score ${item.score.toFixed(2)} for "${item.entry.topic}:${item.entry.subtopic}"`);
        console.log(`  Diagnostics: ${JSON.stringify(item.diagnostics)}`);
      });
      
      // Return top results with significant scores
      return filteredResults
        .slice(0, 10) // Return up to 10 results
        .map(item => item.entry);
    } catch (error) {
      console.error("Error in semantic search:", error);
      return [];
    }
  }
  
  /**
   * Determine question type to help with semantic search
   */
  private determineQuestionType(question: string): string | null {
    const lowerQuestion = question.toLowerCase().trim();
    
    if (lowerQuestion.startsWith('how')) return 'how';
    if (lowerQuestion.startsWith('what')) return 'what';
    if (lowerQuestion.startsWith('why')) return 'why';
    if (lowerQuestion.startsWith('when')) return 'when';
    if (lowerQuestion.startsWith('where')) return 'where';
    if (lowerQuestion.startsWith('who')) return 'who';
    if (lowerQuestion.startsWith('which')) return 'which';
    if (lowerQuestion.startsWith('can')) return 'can';
    if (lowerQuestion.startsWith('do')) return 'do';
    if (lowerQuestion.startsWith('is')) return 'is';
    
    // If no clear question word, try to determine intent
    if (lowerQuestion.includes('difference between')) return 'difference';
    if (lowerQuestion.includes('example')) return 'example';
    if (lowerQuestion.includes('list')) return 'list';
    if (lowerQuestion.includes('steps')) return 'how';
    
    return null;
  }
  
  /**
   * Create bigrams (two-word phrases) from input text
   */
  private createBigrams(text: string): string[] {
    const words = text.split(/\s+/).filter(word => word.length > 2);
    const bigrams: string[] = [];
    
    for (let i = 0; i < words.length - 1; i++) {
      bigrams.push(`${words[i]} ${words[i+1]}`);
    }
    
    return bigrams;
  }
  
  // Extract meaningful phrases from a query
  private extractPhrases(text: string): string[] {
    const phrases: string[] = [];
    
    // Split by common punctuation
    const segments = text.split(/[,.!?;]/);
    
    for (const segment of segments) {
      // Skip very short segments
      if (segment.trim().length < 4) continue;
      
      // Add complete segment as a potential phrase
      phrases.push(segment.trim());
      
      // Extract common n-grams (2 to 4 words)
      const words = segment.trim().split(/\s+/);
      
      // Add bigrams and trigrams as phrases
      if (words.length >= 2) {
        for (let i = 0; i < words.length - 1; i++) {
          if (words[i].length > 2 && words[i+1].length > 2) {
            phrases.push(`${words[i]} ${words[i+1]}`);
          }
          
          if (i < words.length - 2 && words[i+2].length > 2) {
            phrases.push(`${words[i]} ${words[i+1]} ${words[i+2]}`);
          }
        }
      }
    }
    
    return phrases;
  }
  
  /**
   * Get marketplace product recommendations based on user query
   * Returns personalized product suggestions with AI-powered explanations
   */
  async getMarketplaceRecommendations(query: string, userId: number): Promise<{ 
    answer: string; 
    action?: { 
      type: string; 
      data: any; 
    } 
  }> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          answer: "I couldn't find your user account to provide personalized recommendations."
        };
      }
      
      // Extract category and preferences from the query
      const categories = ['digital', 'services', 'physical', 'collectibles', 'crypto', 'other'];
      const priceRanges = {
        cheap: { min: 0, max: 50 },
        affordable: { min: 50, max: 200 },
        premium: { min: 200, max: 1000 },
        expensive: { min: 1000, max: Number.MAX_SAFE_INTEGER }
      };
      
      // Determine if query contains category preference
      const queryLower = query.toLowerCase();
      const categoryMatch = categories.find(category => queryLower.includes(category));
      
      // Determine if query contains price preference
      let priceRange = null;
      for (const [label, range] of Object.entries(priceRanges)) {
        if (queryLower.includes(label)) {
          priceRange = range;
          break;
        }
      }
      
      // Build query parameters
      const queryParams: any = {
        approved: true,
      };
      
      if (categoryMatch) {
        queryParams.category = categoryMatch;
      }
      
      // Get relevant marketplace items
      let items = await storage.getMarketplaceItems(true); // Get only approved items
      
      // Apply filters from the query
      if (categoryMatch) {
        items = items.filter(item => item.category === categoryMatch);
      }
      
      if (priceRange) {
        items = items.filter(item => item.price >= priceRange.min && item.price <= priceRange.max);
      }
      
      // If we still have too many items, get the most relevant ones
      if (items.length > 10) {
        // Use featured items or sort by newest
        const featuredItems = items.filter(item => item.featured);
        if (featuredItems.length > 0) {
          items = featuredItems;
        }
        
        // If still too many, limit to 10 newest
        if (items.length > 10) {
          items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          items = items.slice(0, 10);
        }
      }
      
      if (items.length === 0) {
        // No items found
        return {
          answer: `I couldn't find any marketplace products matching your request${categoryMatch ? ` in the '${categoryMatch}' category` : ''}${priceRange ? ` within your price range` : ''}. Please try a different search or browse the marketplace directly to see all available items.`,
          action: {
            type: 'navigate_marketplace',
            data: { category: categoryMatch || 'all' }
          }
        };
      }
      
      // Build the recommendation response
      let answer = `Here are some recommendations based on your request:\n\n`;
      items.forEach((item, index) => {
        const price = item.price.toFixed(2);
        answer += `${index + 1}. **${item.title}** - ${price} TSK\n`;
        answer += `   ${item.description.slice(0, 100)}${item.description.length > 100 ? '...' : ''}\n\n`;
      });
      
      // Add explanation about the recommendations
      answer += `\nThese recommendations are based on ${categoryMatch ? `your interest in '${categoryMatch}' products` : 'your general product request'}${priceRange ? ` and your price preferences` : ''}.`;
      
      // Add call to action
      answer += `\n\nWould you like more information about any specific product from this list? Or would you like to view all available products in the marketplace?`;
      
      return {
        answer,
        action: {
          type: 'show_marketplace_items',
          data: { 
            items: items.map(item => ({
              id: item.id,
              title: item.title,
              price: item.price,
              category: item.category,
              imageUrl: item.imageUrl || null
            }))
          }
        }
      };
    } catch (error) {
      console.error("Error generating marketplace recommendations:", error);
      return {
        answer: "I encountered an error while searching for product recommendations. Please try again or browse the marketplace directly."
      };
    }
  }
}

export const aiService = new AIService();
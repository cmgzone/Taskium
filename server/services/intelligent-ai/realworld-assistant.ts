import { storage } from '../../storage';
import { AIKnowledgeBase, AIReasoning, AIConversationMemory } from '../../../shared/schema';
import { OpenAIService } from './openai-service';

/**
 * Real-world Knowledge Assistant Service
 * 
 * This service extends the AI assistant to handle general real-world questions:
 * - Provides answers to questions beyond platform-specific knowledge
 * - Integrates with OpenAI for enhanced responses when available
 * - Falls back to local knowledge base when external API is unavailable
 * - Maintains conversation context for better follow-up responses
 * - Prioritizes accuracy and educational value in responses
 */
export class RealWorldAssistantService {
  private openAIService: OpenAIService;
  
  constructor() {
    this.openAIService = new OpenAIService();
  }
  
  /**
   * Determine if a question is related to real-world knowledge
   * rather than platform-specific information
   */
  isRealWorldQuestion(question: string, conversationHistory: AIConversationMemory[] = []): boolean {
    // Convert to lowercase for case-insensitive matching
    const lowerQuestion = question.toLowerCase();
    
    // List of platform-specific keywords (expanded)
    const platformKeywords = [
      'tsk', 'platform', 'token', 'mining', 'marketplace', 'kyc', 
      'verification', 'referral', 'wallet', 'balance', 'earn',
      'account', 'profile', 'settings', 'chat', 'message', 'subscription',
      'premium', 'tiers', 'upgrade', 'points', 'reward', 'claim',
      'withdraw', 'deposit', 'transaction', 'history', 'tutorial',
      'guide', 'dashboard', 'app', 'feature', 'notification'
    ];
    
    // Platform-specific phrases (more context-aware)
    const platformPhrases = [
      'on this platform', 'in my account', 'in the app', 'with my tokens',
      'mining rate', 'token balance', 'marketplace listing', 'verify my account',
      'my profile', 'my settings', 'premium features', 'referral bonus',
      'daily rewards', 'mining rewards', 'verification process'
    ];
    
    // Check for exact platform terms (stronger signal)
    const hasPlatformTerms = platformKeywords.some(keyword => {
      const wordBoundary = new RegExp(`\\b${keyword}\\b`, 'i');
      return wordBoundary.test(lowerQuestion);
    });
    
    // Check for platform phrases (very strong signal)
    const hasPlatformPhrases = platformPhrases.some(phrase => 
      lowerQuestion.includes(phrase)
    );
    
    // If strong platform signals exist, return false immediately
    if (hasPlatformPhrases || hasPlatformTerms) {
      return false;
    }
    
    // Expanded real-world knowledge categories
    const realWorldCategories = [
      // Sciences
      'science', 'physics', 'chemistry', 'biology', 'astronomy', 'geology',
      'mathematics', 'statistics', 'engineering', 'quantum', 'relativity',
      // Health & Medicine
      'medicine', 'health', 'disease', 'anatomy', 'nutrition', 'fitness',
      'psychology', 'mental health', 'medical', 'virus', 'vaccine', 'diet',
      // Humanities
      'history', 'geography', 'literature', 'philosophy', 'religion',
      'ethics', 'culture', 'sociology', 'anthropology', 'archaeology',
      // Arts & Entertainment
      'art', 'music', 'film', 'television', 'theater', 'dance', 'photography',
      'architecture', 'design', 'fashion', 'entertainment', 'celebrity',
      // Current Affairs
      'news', 'politics', 'government', 'election', 'war', 'conflict',
      'climate', 'environment', 'pollution', 'sustainability', 'renewable',
      // Business & Economics
      'economics', 'finance', 'business', 'stock market', 'investment',
      'trade', 'industry', 'company', 'startup', 'entrepreneur',
      // Technology & Computing
      'technology', 'computer', 'internet', 'programming', 'software',
      'hardware', 'algorithm', 'data', 'cybersecurity', 'encryption',
      // Sports & Recreation
      'sports', 'football', 'soccer', 'basketball', 'baseball', 'tennis',
      'olympics', 'athlete', 'tournament', 'championship', 'competition',
      // Other general knowledge
      'language', 'dictionary', 'definition', 'meaning', 'origin', 'fact',
      'universe', 'planet', 'country', 'city', 'ocean', 'mountain', 'animal'
    ];
    
    // More sophisticated detection of real-world topics
    const hasRealWorldKeywords = realWorldCategories.some(category => {
      // Check for whole words when possible
      if (category.includes(' ')) {
        return lowerQuestion.includes(category);
      } else {
        const wordBoundary = new RegExp(`\\b${category}\\b`, 'i');
        return wordBoundary.test(lowerQuestion);
      }
    });
    
    if (hasRealWorldKeywords) {
      return true;
    }
    
    // Expanded question starters that typically indicate real-world knowledge questions
    const realWorldStarters = [
      'what is', 'how does', 'why is', 'when did', 'where is',
      'who was', 'can you explain', 'tell me about', 'define',
      'what are', 'how do', 'what causes', 'how many', 'why do',
      'how can', 'what happened', 'when was', 'who invented',
      'how is', 'what makes', 'explain', 'describe', 'how does',
      'compare', 'contrast', 'difference between', 'is it true that'
    ];
    
    // More sophisticated pattern matching for question starters
    const startsWithRealWorldPattern = realWorldStarters.some(starter => {
      if (lowerQuestion.startsWith(starter)) {
        // If question starts with pattern but contains platform keywords, still might be platform-specific
        const remainingText = lowerQuestion.substring(starter.length);
        const containsPlatformKeyword = platformKeywords.some(keyword => 
          remainingText.includes(keyword)
        );
        
        // Only consider it a real-world question if it doesn't contain platform keywords
        return !containsPlatformKeyword;
      }
      return false;
    });
    
    // Consider conversation context if available
    if (conversationHistory && conversationHistory.length > 0) {
      try {
        // Get the last few conversations to establish context
        const memory = conversationHistory[0];
        if (memory && memory.conversations) {
          const recentConversations = Array.isArray(memory.conversations) ? memory.conversations : [];
          
          if (recentConversations.length > 0) {
            // Extract topics from recent conversations
            const recentTopics: string[] = [];
            for (let i = Math.max(0, recentConversations.length - 3); i < recentConversations.length; i++) {
              const conv = recentConversations[i];
              if (conv && conv.topics && Array.isArray(conv.topics)) {
                recentTopics.push(...conv.topics);
              }
            }
            
            // If recent conversation was clearly about platform topics, this likely is too
            const platformTopicCount = recentTopics.filter(topic => 
              ['Platform', 'Mining', 'Token', 'Marketplace', 'KYC', 'Wallet'].includes(topic)
            ).length;
            
            const realWorldTopicCount = recentTopics.filter(topic => 
              ['RealWorld', 'General Knowledge', 'Science', 'History'].includes(topic)
            ).length;
            
            // Use conversation context as a tiebreaker when other signals are ambiguous
            if (!startsWithRealWorldPattern && !hasRealWorldKeywords && !hasPlatformTerms) {
              if (platformTopicCount > realWorldTopicCount) {
                return false;
              } else if (realWorldTopicCount > platformTopicCount) {
                return true;
              }
            }
          }
        }
      } catch (error) {
        // If there's an error processing conversation history, ignore it
        console.error("Error analyzing conversation history:", error);
      }
    }
    
    // If question is very short (< 5 words), be conservative about classifying as real-world
    if (question.split(/\s+/).length < 5 && !hasRealWorldKeywords) {
      return false;
    }
    
    // Default behavior based on question structure
    return startsWithRealWorldPattern;
  }
  
  /**
   * Get relevant real-world knowledge from the database
   */
  async getRealWorldKnowledge(question: string): Promise<AIKnowledgeBase[]> {
    // Extract main topic from question for better matching
    const topics = this.extractTopicsFromQuestion(question);
    
    // Get knowledge from individual topics - ideally we'd have a search function but for now
    // we'll get knowledge for each topic individually and combine
    let knowledgeEntries: AIKnowledgeBase[] = [];
    
    // Get entries for standard categories
    for (const topic of ['RealWorld', 'Dictionary', 'Programming', 'AI', ...topics]) {
      const entries = await storage.getAIKnowledgeBase(topic);
      if (entries.length > 0) {
        knowledgeEntries = [...knowledgeEntries, ...entries];
      }
    }
    
    // Filter by categories if we have too many
    if (knowledgeEntries.length > 0) {
      knowledgeEntries = knowledgeEntries.filter(entry => 
        ['general', 'technical', 'dictionary'].includes(entry.category || '')
      );
    }
    
    // Sort by confidence and limit to 10
    knowledgeEntries.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
    return knowledgeEntries.slice(0, 10);
  }
  
  /**
   * Extract potential knowledge topics from a question
   */
  private extractTopicsFromQuestion(question: string): string[] {
    const words = question.split(/\s+/);
    const topics: string[] = [];
    
    // Dictionary of common subject mappings
    const subjectMappings: Record<string, string> = {
      'programming': 'Programming',
      'code': 'Programming',
      'software': 'Programming',
      'web': 'WebDevelopment',
      'website': 'WebDevelopment',
      'ai': 'AI',
      'artificial intelligence': 'AI',
      'machine learning': 'MachineLearning',
      'ml': 'MachineLearning',
      'science': 'Science',
      'scientific': 'Science',
      'physics': 'Science',
      'chemistry': 'Science',
      'biology': 'Science',
      'math': 'Mathematics',
      'mathematics': 'Mathematics',
      'historical': 'History',
      'history': 'History',
      'geographic': 'Geography',
      'geography': 'Geography',
      'country': 'Geography',
      'countries': 'Geography',
      'continent': 'Geography',
      'art': 'Arts',
      'music': 'Arts',
      'literature': 'Arts',
      'film': 'Arts',
      'movie': 'Arts',
      'business': 'Business',
      'economic': 'Business',
      'finance': 'Business',
      'philosophy': 'Philosophy',
      'philosophical': 'Philosophy',
      'ethics': 'Philosophy'
    };
    
    // Check for subject mappings
    for (const word of words) {
      const lowerWord = word.toLowerCase();
      if (subjectMappings[lowerWord]) {
        topics.push(subjectMappings[lowerWord]);
      }
    }
    
    // Check for compound subjects
    for (const key of Object.keys(subjectMappings)) {
      if (key.includes(' ') && question.toLowerCase().includes(key)) {
        topics.push(subjectMappings[key]);
      }
    }
    
    // Remove duplicates (avoiding Set spread which causes TypeScript issues)
    const uniqueTopics: string[] = [];
    topics.forEach(topic => {
      if (!uniqueTopics.includes(topic)) {
        uniqueTopics.push(topic);
      }
    });
    
    return uniqueTopics;
  }
  
  /**
   * Get relevant reasoning patterns for real-world knowledge questions
   */
  async getReasoningPatterns(): Promise<AIReasoning[]> {
    return storage.getAIReasoningPatterns('realworld');
  }
  
  /**
   * Answer a real-world question using available knowledge and OpenAI if available
   */
  async answerRealWorldQuestion(
    question: string,
    userId: number,
    conversationHistory: AIConversationMemory[] = []
  ): Promise<{
    answer: string;
    confidence: number;
    sources: AIKnowledgeBase[];
    isRealWorldQuestion: boolean;
  }> {
    // Check if this is actually a real-world question
    const isRealWorld = this.isRealWorldQuestion(question);
    
    if (!isRealWorld) {
      return {
        answer: "I notice your question may be about the TSK Platform. Would you like me to provide information about platform features instead of general knowledge?",
        confidence: 0.7,
        sources: [],
        isRealWorldQuestion: false
      };
    }
    
    // Get relevant knowledge and reasoning patterns
    const knowledgeEntries = await this.getRealWorldKnowledge(question);
    const reasoningPatterns = await this.getReasoningPatterns();
    
    // Format conversation history for context
    const formattedHistory = conversationHistory.map(memory => {
      // Safely access conversation data which might be structured differently
      const conversation = memory.conversations as any[];
      if (conversation && Array.isArray(conversation) && conversation.length > 0) {
        const lastConversation = conversation[conversation.length - 1];
        return {
          role: lastConversation.question ? 'user' : 'assistant',
          content: lastConversation.question || lastConversation.answer || ''
        };
      }
      return {
        role: 'user',
        content: question
      };
    });
    
    // Try to use OpenAI for enhanced response if available
    if (this.openAIService.isReady()) {
      try {
        const openAIResponse = await this.openAIService.answerQuestion(
          question,
          knowledgeEntries,
          reasoningPatterns,
          userId,
          formattedHistory
        );
        
        return {
          ...openAIResponse,
          isRealWorldQuestion: true
        };
      } catch (error) {
        console.error('Error using OpenAI for real-world question:', error);
        // Fall back to local knowledge base
      }
    }
    
    // Fallback: Use local knowledge base to generate a response
    if (knowledgeEntries.length > 0) {
      // Sort by confidence
      knowledgeEntries.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      
      // Generate a response based on the most relevant knowledge entries
      const topEntries = knowledgeEntries.slice(0, 3);
      
      // Generate fallback response
      return {
        answer: this.generateFallbackResponse(question, topEntries),
        confidence: 0.6, // Lower confidence for fallback responses
        sources: topEntries,
        isRealWorldQuestion: true
      };
    }
    
    // No relevant knowledge found
    return {
      answer: "I don't have specific information to answer that question accurately. When our OpenAI integration is active, I'll be able to provide more detailed responses to general knowledge questions like this one.",
      confidence: 0.3,
      sources: [],
      isRealWorldQuestion: true
    };
  }
  
  /**
   * Generate a fallback response when OpenAI is not available
   * This enhanced version combines multiple knowledge entries when appropriate
   * and provides more context-aware responses
   */
  private generateFallbackResponse(question: string, knowledgeEntries: AIKnowledgeBase[]): string {
    if (knowledgeEntries.length === 0) {
      return "I don't have enough information to answer that question accurately. When our OpenAI integration is active, I'll be able to provide more detailed responses to general knowledge questions.";
    }

    // Attempt to identify the intent of the question for better response formatting
    const questionIntent = this.identifyQuestionIntent(question);
    
    // If we have multiple entries, combine them intelligently based on the question type
    if (knowledgeEntries.length > 1) {
      // Group entries by topic for organization
      const entriesByTopic: Record<string, AIKnowledgeBase[]> = {};
      
      for (const entry of knowledgeEntries) {
        const topicKey = entry.topic;
        if (!entriesByTopic[topicKey]) {
          entriesByTopic[topicKey] = [];
        }
        entriesByTopic[topicKey].push(entry);
      }
      
      // For definition-style questions, use primarily dictionary format with additional context
      if (questionIntent === 'definition') {
        // Look for a dictionary entry first
        const dictionaryEntries = knowledgeEntries.filter(entry => 
          entry.category === 'dictionary' || entry.topic === 'Dictionary'
        );
        
        if (dictionaryEntries.length > 0) {
          const primaryEntry = dictionaryEntries[0];
          let response = `${primaryEntry.subtopic}: ${primaryEntry.information}\n\n`;
          
          // Add additional context from other entries if available
          const otherEntries = knowledgeEntries.filter(entry => 
            entry !== primaryEntry && entry.confidence && entry.confidence > 70
          ).slice(0, 2);
          
          if (otherEntries.length > 0) {
            response += "Additional context:\n";
            otherEntries.forEach(entry => {
              response += `• ${entry.information}\n`;
            });
          }
          
          return response;
        }
      }
      
      // For comparison questions, present information from different topics side by side
      if (questionIntent === 'comparison') {
        const topicKeys = Object.keys(entriesByTopic);
        if (topicKeys.length >= 2) {
          let response = "Comparing these concepts:\n\n";
          
          topicKeys.slice(0, 3).forEach(topic => {
            const entry = entriesByTopic[topic][0]; // Take the highest confidence entry for each topic
            response += `${entry.topic}${entry.subtopic ? ` (${entry.subtopic})` : ''}:\n${entry.information}\n\n`;
          });
          
          return response;
        }
      }
      
      // For "how" questions, try to construct a procedural explanation
      if (questionIntent === 'howto') {
        // Use entries with higher confidence for how-to
        const highConfidenceEntries = knowledgeEntries.filter(entry => 
          entry.confidence && entry.confidence > 75
        ).slice(0, 3);
        
        if (highConfidenceEntries.length > 0) {
          let response = "";
          
          // If all entries are from the same topic, present as steps
          if (highConfidenceEntries.every(entry => entry.topic === highConfidenceEntries[0].topic)) {
            response = `Here's information about ${highConfidenceEntries[0].topic}:\n\n`;
            highConfidenceEntries.forEach((entry, index) => {
              response += `${index + 1}. ${entry.information}\n`;
            });
          } else {
            // Otherwise, present as bullet points
            highConfidenceEntries.forEach(entry => {
              response += `• ${entry.topic}: ${entry.information}\n\n`;
            });
          }
          
          return response;
        }
      }
    }
    
    // Default response using just the primary entry when we couldn't combine intelligently
    const primaryEntry = knowledgeEntries[0];
    
    // For real-world general categories
    if (primaryEntry.topic === 'RealWorld') {
      let response = primaryEntry.information;
      
      // If we have other entries that might add context, include them
      if (knowledgeEntries.length > 1) {
        const additionalEntry = knowledgeEntries[1];
        if (additionalEntry.confidence && additionalEntry.confidence > 75) {
          response += `\n\nAdditionally: ${additionalEntry.information}`;
        }
      }
      
      return response;
    }
    
    // For technical or specialized topics
    return `Based on my knowledge about ${primaryEntry.topic}${primaryEntry.subtopic ? ` (${primaryEntry.subtopic})` : ''}:\n\n${primaryEntry.information}`;
  }
  
  /**
   * Identify the intent/type of a question to better format the response
   */
  private identifyQuestionIntent(question: string): 'definition' | 'factual' | 'howto' | 'comparison' | 'explanation' | 'other' {
    const lowerQuestion = question.toLowerCase().trim();
    
    // Definition questions
    if (
      lowerQuestion.startsWith("what is") || 
      lowerQuestion.startsWith("what are") ||
      lowerQuestion.startsWith("define") ||
      lowerQuestion.startsWith("describe") ||
      lowerQuestion.includes("meaning of") ||
      lowerQuestion.includes("definition of")
    ) {
      return 'definition';
    }
    
    // How-to questions
    if (
      lowerQuestion.startsWith("how do") ||
      lowerQuestion.startsWith("how can") ||
      lowerQuestion.startsWith("how to") ||
      lowerQuestion.startsWith("how does") ||
      lowerQuestion.includes("steps to") ||
      lowerQuestion.includes("process of") ||
      lowerQuestion.includes("way to")
    ) {
      return 'howto';
    }
    
    // Comparison questions
    if (
      lowerQuestion.includes("compare") ||
      lowerQuestion.includes("difference between") ||
      lowerQuestion.includes("similarities between") ||
      lowerQuestion.includes("versus") ||
      lowerQuestion.includes(" vs ") ||
      lowerQuestion.includes("better than")
    ) {
      return 'comparison';
    }
    
    // Explanation questions
    if (
      lowerQuestion.startsWith("why") ||
      lowerQuestion.startsWith("explain") ||
      lowerQuestion.includes("reason for") ||
      lowerQuestion.includes("causes of")
    ) {
      return 'explanation';
    }
    
    // Factual questions
    if (
      lowerQuestion.startsWith("when") ||
      lowerQuestion.startsWith("where") ||
      lowerQuestion.startsWith("who") ||
      lowerQuestion.startsWith("which") ||
      lowerQuestion.includes("list of") ||
      lowerQuestion.includes("examples of") ||
      lowerQuestion.includes("tell me about")
    ) {
      return 'factual';
    }
    
    // Default to 'other' for unclassified questions
    return 'other';
  }
}

// Export singleton instance
export const realWorldAssistant = new RealWorldAssistantService();
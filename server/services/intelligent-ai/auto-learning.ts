/**
 * AI Auto-Learning Service
 * 
 * This service enhances the AI's ability to learn automatically by:
 * - Continuously analyzing user interactions
 * - Identifying patterns in questions and responses
 * - Extracting new knowledge from feedback
 * - Organizing and optimizing existing knowledge
 * - Proactively scanning for platform changes
 * - Incorporating external sources for knowledge enrichment
 * - Leveraging OpenAI to enhance knowledge generation
 */

import { storage } from "../../storage";
import { AIFeedback, InsertAIKnowledgeBase, InsertAIReasoning, InsertAISystemTask, AIKnowledgeBase } from "@shared/schema";
import { jsonb } from "drizzle-orm/pg-core";

// Import platform scanner to detect changes in the system
import { PlatformScanner } from "../platform-scanner";

// Import OpenAI service for enhanced learning
import { openAIService } from "./openai-service";

export class AutoLearningService {
  private platformScanner: PlatformScanner;
  private knownTerms: Set<string> = new Set();
  private stopWords: Set<string> = new Set([
    "a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any", "are", "as", "at", 
    "be", "because", "been", "before", "being", "below", "between", "both", "but", "by", "can", "did", "do", 
    "does", "doing", "don", "down", "during", "each", "few", "for", "from", "further", "had", "has", "have", 
    "having", "he", "her", "here", "hers", "herself", "him", "himself", "his", "how", "i", "if", "in", "into", 
    "is", "it", "its", "itself", "just", "me", "more", "most", "my", "myself", "no", "nor", "not", "now", "of", 
    "off", "on", "once", "only", "or", "other", "our", "ours", "ourselves", "out", "over", "own", "s", "same", 
    "she", "should", "so", "some", "such", "t", "than", "that", "the", "their", "theirs", "them", "themselves", 
    "then", "there", "these", "they", "this", "those", "through", "to", "too", "under", "until", "up", "very", 
    "was", "we", "were", "what", "when", "where", "which", "while", "who", "whom", "why", "will", "with", 
    "you", "your", "yours", "yourself", "yourselves"
  ]);

  constructor() {
    this.platformScanner = new PlatformScanner();
    this.initialize();
  }

  private async initialize() {
    try {
      // Load all existing knowledge to build a set of known terms
      const allKnowledge = await storage.getAllAIKnowledge();
      
      for (const entry of allKnowledge) {
        // Extract significant words from the information
        const words = this.extractSignificantWords(entry.information);
        words.forEach(word => this.knownTerms.add(word.toLowerCase()));
      }
      
      console.log(`Auto-learning service initialized with ${this.knownTerms.size} known terms`);
    } catch (error) {
      console.error("Error initializing auto-learning service:", error);
    }
  }

  /**
   * Learn from user feedback to improve responses
   * This is triggered when users rate AI responses
   */
  async learnFromFeedback(feedback: AIFeedback): Promise<void> {
    console.log(`Processing feedback: ${feedback.rating}/5 for question "${feedback.question}"`);
    
    try {
      // For negative feedback (rating < 4), identify knowledge gaps
      if (feedback.rating < 4) {
        await this.handleNegativeFeedback(feedback);
      } 
      // For positive feedback (rating >= 4), reinforce the knowledge
      else {
        await this.handlePositiveFeedback(feedback);
      }
      
      // Mark the feedback as processed
      await storage.updateAIFeedback(feedback.id, { processed: true });
      
      // Create a system task to record this learning activity
      await storage.createAISystemTask({
        taskType: "feedback_learning",
        priority: 50,
        status: "completed",
        data: { 
          feedbackId: feedback.id,
          questionTopic: feedback.topics,
          rating: feedback.rating,
          createdAt: new Date()
        },
        scheduledFor: new Date()
      });
      
      // Create admin task for very negative feedback (rating <= 2)
      if (feedback.rating <= 2) {
        await storage.createAdminTask({
          title: `Review AI response with low rating (${feedback.rating}/5)`,
          createdBy: 1, // System user ID
          description: `Question: "${feedback.question}"\nAnswer: "${feedback.answer}"\nFeedback: "${feedback.feedback || 'No feedback provided'}"`,
          status: "pending",
          priority: "high",
          assignedTo: null,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
        });
      }
    } catch (error) {
      console.error(`Error learning from feedback:`, error);
    }
  }

  /**
   * Handle negative feedback by addressing knowledge gaps
   * Enhanced with OpenAI for better analysis and automatic knowledge generation
   * Includes advanced content analysis and targeted improvement suggestions
   */
  private async handleNegativeFeedback(feedback: AIFeedback): Promise<void> {
    // Extract topics from the question to identify the knowledge area
    const topics = feedback.topics as string[];
    
    // Get existing knowledge for these topics from both platform and real-world categories
    let relatedKnowledge = await Promise.all([
      ...topics.map(topic => storage.findAIKnowledgeByCategory('platform', topic)),
      ...topics.map(topic => storage.findAIKnowledgeByCategory('general', topic))
    ]);
    
    // Flatten the results
    relatedKnowledge = relatedKnowledge.flat();
    
    // Extract significant words from the question
    const questionWords = this.extractSignificantWords(feedback.question);
    
    // Enhanced knowledge gap detection - more sophisticated matching
    const detectionScore = this.calculateKnowledgeGapDetectionScore(questionWords, relatedKnowledge);
    const hasKnowledgeGap = detectionScore < 0.3; // Threshold for considering it a knowledge gap
    
    console.log(`Knowledge gap detection score: ${detectionScore.toFixed(2)} for question: "${feedback.question}"`);
    
    if (hasKnowledgeGap) {
      console.log(`Knowledge gap identified for question: "${feedback.question}"`);
      
      // Try to determine if this is a classification error (real-world vs platform)
      const potentialMisclassification = this.detectPotentialMisclassification(feedback.question, feedback.answer, topics);
      
      if (potentialMisclassification) {
        console.log(`Potential misclassification detected: ${potentialMisclassification}`);
        
        // Create a task to review the classification
        await storage.createAISystemTask({
          taskType: "review_classification",
          priority: 75,
          status: "pending",
          data: {
            question: feedback.question,
            answer: feedback.answer,
            topics: feedback.topics,
            feedback: feedback.feedback,
            feedbackId: feedback.id,
            misclassificationType: potentialMisclassification
          },
          scheduledFor: new Date()
        });
      }
      
      // Try to use OpenAI to analyze feedback and generate new knowledge
      try {
        // Check if OpenAI integration is available
        const feedbackData = {
          question: feedback.question,
          answer: feedback.answer,
          rating: feedback.rating,
          comment: feedback.feedback
        };
        
        // Enhanced analysis with more detailed feedback
        const analysis = await openAIService.analyzeFeedback(feedbackData);
        console.log(`OpenAI feedback analysis: ${analysis.analysisResult}`);
        
        // If OpenAI suggested new knowledge, save it with enriched metadata
        if (analysis.newKnowledge) {
          console.log('Adding new knowledge from OpenAI analysis');
          
          // Add additional metadata to help with future learning
          const enhancedKnowledge = {
            ...analysis.newKnowledge,
            source: 'openai_feedback_analysis',
            category: analysis.knowledgeCategory || 'platform',
            confidence: 75 // Start with reasonable confidence for AI-generated knowledge
          };
          
          const newKnowledgeEntry = await storage.createAIKnowledgeEntry(enhancedKnowledge);
          
          console.log(`Created new knowledge entry: ${newKnowledgeEntry.topic} - ${newKnowledgeEntry.subtopic}`);
          
          // Record enhanced learning metrics with more details
          await this.recordLearningActivity({
            knowledgeGapsIdentified: 1,
            knowledgeEntriesCreated: 1,
            negativeRatings: 1,
            aiAssistedLearning: 1,
            contentAnalysisCompleted: 1,
            newKnowledgeTopics: [newKnowledgeEntry.topic]
          });
          
          // Create a more detailed review task for the new knowledge
          await storage.createAdminTask({
            title: `Review AI-generated knowledge entry for "${enhancedKnowledge.subtopic}"`,
            createdBy: 1, // System user ID
            description: `The AI automatically generated a new knowledge entry based on user feedback.

Topic: ${newKnowledgeEntry.topic}
Subtopic: ${newKnowledgeEntry.subtopic}
Category: ${enhancedKnowledge.category}
Confidence: ${enhancedKnowledge.confidence}%

Original question: "${feedback.question}"
User feedback: "${feedback.feedback || 'No user comment provided'}"
AI analysis: ${analysis.analysisResult}

Please review the accuracy of this information and adjust if needed.`,
            status: "pending",
            priority: "medium",
            assignedTo: null,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Due in 3 days
          });
          
          return; // Knowledge was added, no need for further processing
        }
      } catch (error) {
        console.error("Error using OpenAI for feedback analysis:", error);
        // Continue with traditional processing if OpenAI fails
      }
      
      // Create a task to add this knowledge gap to the system (fallback if OpenAI fails)
      await storage.createAISystemTask({
        taskType: "knowledge_gap",
        priority: 70,
        status: "pending",
        data: {
          question: feedback.question,
          answer: feedback.answer,
          topics: feedback.topics,
          feedback: feedback.feedback,
          feedbackId: feedback.id,
          gapScore: detectionScore,
          questionWords: questionWords,
          timestamp: new Date().toISOString()
        },
        scheduledFor: new Date()
      });
      
      // Record learning metrics
      await this.recordLearningActivity({
        knowledgeGapsIdentified: 1,
        negativeRatings: 1
      });
    } else {
      // If we have knowledge but still got negative feedback, we might need to improve the reasoning pattern
      console.log(`Potential reasoning issue identified for question: "${feedback.question}"`);
      
      // Identify specific reasoning issues based on feedback and answer analysis
      const reasoningIssues = this.identifyReasoningIssues(feedback);
      console.log(`Identified reasoning issues: ${reasoningIssues.join(', ') || 'none'}`);
      
      try {
        // Use OpenAI to analyze how to improve the response with more context
        const feedbackData = {
          question: feedback.question,
          answer: feedback.answer,
          rating: feedback.rating,
          comment: feedback.feedback,
          detectedIssues: reasoningIssues
        };
        
        const analysis = await openAIService.analyzeFeedback(feedbackData);
        
        if (analysis.suggestedImprovement) {
          console.log(`AI suggested improvement: ${analysis.suggestedImprovement}`);
          
          // Try to generate an improved reasoning pattern directly
          if (analysis.improvedReasoning) {
            // Create a new reasoning pattern based on the improvement
            const newPattern: InsertAIReasoning = {
              category: topics[0] || 'general',
              pattern: `Improved pattern for ${topics.join(', ')}`,
              rules: analysis.improvedReasoning.rules || [],
              examples: analysis.improvedReasoning.examples || [],
              priority: 60,
              metadata: {
                source: 'ai_feedback_analysis',
                originalQuestion: feedback.question,
                feedbackId: feedback.id,
                created: new Date().toISOString()
              }
            };
            
            await storage.createAIReasoningPattern(newPattern);
            console.log(`Created new reasoning pattern for ${topics.join(', ')}`);
          } else {
            // Create a task for reviewing the suggested improvement
            await storage.createAISystemTask({
              taskType: "improve_reasoning",
              priority: 60,
              status: "pending",
              data: {
                question: feedback.question,
                answer: feedback.answer,
                suggestedImprovement: analysis.suggestedImprovement,
                detectedIssues: reasoningIssues,
                feedbackId: feedback.id,
                timestamp: new Date().toISOString()
              },
              scheduledFor: new Date()
            });
          }
        }
      } catch (error) {
        console.error("Error using OpenAI for response improvement:", error);
      }
      
      // More targeted knowledge adjustment based on feedback analysis
      for (const entry of relatedKnowledge) {
        // Calculate relevance to the question
        const relevance = this.calculateKnowledgeRelevance(entry, questionWords);
        
        // More relevant entries get more adjustment
        const adjustmentFactor = relevance > 0.7 ? 7 : relevance > 0.4 ? 5 : 3;
        
        // Adjust confidence based on relevance
        const newConfidence = Math.max(50, (entry.confidence || 90) - adjustmentFactor);
        
        await storage.updateAIKnowledgeEntry(entry.id, {
          confidence: newConfidence,
          lastUpdated: new Date()
        });
        
        console.log(`Adjusted confidence for entry ${entry.id} to ${newConfidence} (relevance: ${relevance.toFixed(2)})`);
      }
      
      // Record enhanced learning metrics
      await this.recordLearningActivity({
        negativeRatings: 1,
        aiAssistedLearning: 1,
        reasoningIssuesIdentified: reasoningIssues.length,
        knowledgeEntriesAdjusted: relatedKnowledge.length
      });
    }
  }
  
  /**
   * Calculate a more sophisticated score for knowledge gap detection
   * Higher score means better coverage (less likely to be a gap)
   */
  private calculateKnowledgeGapDetectionScore(questionWords: string[], knowledge: AIKnowledgeBase[]): number {
    if (knowledge.length === 0) return 0;
    
    // Initialize counters
    let totalMatches = 0;
    let wordMatchCount = 0;
    
    // Calculate word match percentage across all knowledge entries
    for (const word of questionWords) {
      const wordLower = word.toLowerCase();
      let hasMatch = false;
      
      for (const entry of knowledge) {
        if (entry.information.toLowerCase().includes(wordLower) ||
            entry.subtopic.toLowerCase().includes(wordLower) ||
            entry.topic.toLowerCase().includes(wordLower)) {
          hasMatch = true;
          totalMatches++;
          break;
        }
      }
      
      if (hasMatch) {
        wordMatchCount++;
      }
    }
    
    // Calculate base score from word matches
    const wordCoverageScore = questionWords.length > 0 ? wordMatchCount / questionWords.length : 0;
    
    // Calculate knowledge abundance score
    const knowledgeAbundanceScore = Math.min(1, knowledge.length / 5);
    
    // Calculate average confidence of knowledge entries
    const averageConfidence = knowledge.reduce((sum, entry) => sum + (entry.confidence || 90), 0) / knowledge.length / 100;
    
    // Combine scores with weights
    return (wordCoverageScore * 0.6) + (knowledgeAbundanceScore * 0.2) + (averageConfidence * 0.2);
  }
  
  /**
   * Calculate relevance of a knowledge entry to a set of question words
   */
  private calculateKnowledgeRelevance(entry: AIKnowledgeBase, questionWords: string[]): number {
    if (questionWords.length === 0) return 0.5; // Default medium relevance
    
    let matchCount = 0;
    const contentWords = this.extractSignificantWords(
      `${entry.topic} ${entry.subtopic} ${entry.information}`
    );
    
    // Count matches between question words and content words
    for (const qWord of questionWords) {
      for (const cWord of contentWords) {
        if (qWord.toLowerCase() === cWord.toLowerCase()) {
          matchCount++;
          break;
        }
      }
    }
    
    // Calculate and return relevance score
    return matchCount / questionWords.length;
  }
  
  /**
   * Detect potential misclassification between real-world and platform knowledge
   */
  private detectPotentialMisclassification(question: string, answer: string, topics: string[]): string | null {
    const lowerQuestion = question.toLowerCase();
    const lowerAnswer = answer.toLowerCase();
    
    // Check for real-world topics misclassified as platform
    const realWorldKeywords = [
      'history', 'science', 'math', 'geography', 'physics', 'biology',
      'chemistry', 'literature', 'art', 'culture', 'politics', 'economics',
      'psychology', 'sociology', 'technology', 'engineering', 'medicine'
    ];
    
    // Check for platform topics misclassified as real-world
    const platformKeywords = [
      'platform', 'tsk', 'token', 'mining', 'marketplace', 'wallet',
      'referral', 'account', 'subscription', 'dashboard', 'profile',
      'notification', 'settings', 'transaction', 'balance', 'reward'
    ];
    
    // Check if question has real-world keywords but was classified as platform
    if (topics.includes('Platform') || topics.includes('Token') || topics.includes('Mining')) {
      for (const keyword of realWorldKeywords) {
        if (lowerQuestion.includes(keyword) && !lowerQuestion.includes('platform') && !lowerQuestion.includes('tsk')) {
          return 'platform_as_realworld';
        }
      }
    }
    
    // Check if question has platform keywords but was classified as real-world
    if (topics.includes('RealWorld') || topics.includes('General Knowledge')) {
      for (const keyword of platformKeywords) {
        if (lowerQuestion.includes(keyword)) {
          return 'realworld_as_platform';
        }
      }
    }
    
    return null;
  }
  
  /**
   * Identify specific reasoning issues based on feedback analysis
   */
  private identifyReasoningIssues(feedback: AIFeedback): string[] {
    const issues: string[] = [];
    const answer = feedback.answer || '';
    const question = feedback.question || '';
    const comment = feedback.feedback || '';
    
    // Check for common issues in the answer
    if (answer.length < 100 && feedback.rating <= 2) {
      issues.push('too_brief');
    }
    
    if (answer.length > 800 && (comment.toLowerCase().includes('long') || comment.toLowerCase().includes('shorter'))) {
      issues.push('too_verbose');
    }
    
    // Check for structure issues
    if (!answer.includes('\n') && answer.length > 300) {
      issues.push('poor_formatting');
    }
    
    // Check for answer relevance
    if (question.toLowerCase().includes('how') && !answer.toLowerCase().includes('step')) {
      issues.push('missing_steps');
    }
    
    if (question.toLowerCase().includes('why') && !answer.toLowerCase().includes('because')) {
      issues.push('missing_explanation');
    }
    
    // Check for consistency issues in the answer
    if (answer.toLowerCase().includes('however') || answer.toLowerCase().includes('but') || answer.toLowerCase().includes('on the other hand')) {
      const sentences = answer.split(/[.!?]+/);
      let hasContradiction = false;
      
      for (let i = 0; i < sentences.length - 1; i++) {
        const current = sentences[i].toLowerCase();
        const next = sentences[i + 1].toLowerCase();
        
        if ((current.includes('can') && next.includes("can't")) ||
            (current.includes("can't") && next.includes('can')) ||
            (current.includes('is') && next.includes("isn't")) ||
            (current.includes("isn't") && next.includes('is'))) {
          hasContradiction = true;
          break;
        }
      }
      
      if (hasContradiction) {
        issues.push('internal_contradiction');
      }
    }
    
    // Check for feedback language hints
    if (comment) {
      const lowerComment = comment.toLowerCase();
      
      if (lowerComment.includes('wrong') || lowerComment.includes('incorrect')) {
        issues.push('factual_error');
      }
      
      if (lowerComment.includes('confusing') || lowerComment.includes('unclear')) {
        issues.push('unclear_explanation');
      }
      
      if (lowerComment.includes('example') || lowerComment.includes('specific')) {
        issues.push('missing_examples');
      }
    }
    
    return issues;
  }

  /**
   * Handle positive feedback by reinforcing good responses
   */
  private async handlePositiveFeedback(feedback: AIFeedback): Promise<void> {
    // Extract topics from the question
    const topics = feedback.topics as string[];
    
    // Get existing knowledge for these topics
    let relatedKnowledge = await Promise.all(
      topics.map(topic => storage.findAIKnowledgeByCategory('platform', topic))
    );
    
    // Flatten the results
    relatedKnowledge = relatedKnowledge.flat();
    
    if (relatedKnowledge.length > 0) {
      // Enhance existing knowledge with confidence boost
      for (const entry of relatedKnowledge) {
        // Increase confidence level for this knowledge (max 100)
        const newConfidence = Math.min(100, (entry.confidence || 90) + 2);
        
        await storage.updateAIKnowledgeEntry(entry.id, {
          confidence: newConfidence,
          lastUpdated: new Date()
        });
      }
    }
    
    // Record learning metrics
    await this.recordLearningActivity({
      positiveRatings: 1
    });
  }
  
  /**
   * Identify trends and patterns from multiple interactions
   * This is run periodically to analyze batches of user interactions
   */
  async analyzeInteractionPatterns(): Promise<void> {
    try {
      console.log("Analyzing interaction patterns...");
      
      // Get feedback from the last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentFeedback = await storage.getAIFeedbackSince(thirtyDaysAgo);
      
      if (recentFeedback.length === 0) {
        console.log("No recent feedback to analyze");
        return;
      }
      
      // Group feedback by topics
      const topicMap = new Map<string, AIFeedback[]>();
      
      for (const feedback of recentFeedback) {
        const topics = feedback.topics as string[];
        
        if (!topics || topics.length === 0) continue;
        
        for (const topic of topics) {
          if (!topicMap.has(topic)) {
            topicMap.set(topic, []);
          }
          
          topicMap.get(topic)?.push(feedback);
        }
      }
      
      // Analyze each topic
      for (const [topic, feedbacks] of topicMap.entries()) {
        await this.analyzeTopicFeedback(topic, feedbacks);
      }
      
      // Mark task as complete
      await storage.createAISystemTask({
        taskType: "interaction_analysis",
        priority: 40,
        status: "completed",
        data: {
          feedbackCount: recentFeedback.length,
          topicCount: topicMap.size
        },
        scheduledFor: new Date()
      });
      
      console.log(`Completed analysis of ${recentFeedback.length} interactions across ${topicMap.size} topics`);
    } catch (error) {
      console.error("Error analyzing interaction patterns:", error);
    }
  }
  
  /**
   * Analyze feedback for a specific topic to extract patterns
   */
  private async analyzeTopicFeedback(topic: string, feedbacks: AIFeedback[]): Promise<void> {
    // Calculate average rating for this topic
    const averageRating = feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
    
    console.log(`Topic "${topic}": ${feedbacks.length} interactions, avg rating: ${averageRating.toFixed(1)}`);
    
    // Check if this topic needs improvement (low average rating)
    if (averageRating < 3.5 && feedbacks.length >= 3) {
      // Topic needs improvement - identify common terms in questions
      const commonTerms = this.identifyCommonTerms(feedbacks.map(f => f.question));
      
      console.log(`Topic "${topic}" needs improvement. Common terms: ${commonTerms.join(', ')}`);
      
      // Create a task for human review
      await storage.createAISystemTask({
        taskType: "improve_topic_knowledge",
        priority: 60,
        status: "pending",
        data: {
          topic,
          averageRating,
          feedbackCount: feedbacks.length,
          commonTerms,
          feedbackIds: feedbacks.map(f => f.id)
        },
        scheduledFor: new Date()
      });
      
      // Create admin task for very low rating topics
      if (averageRating < 3.0) {
        await storage.createAdminTask({
          title: `Review AI knowledge for topic "${topic}"`,
          createdBy: 1, // System user ID
          description: `Average rating: ${averageRating.toFixed(1)}/5 across ${feedbacks.length} interactions\nCommon terms: ${commonTerms.join(', ')}\nThis topic needs knowledge improvement.`,
          status: "pending",
          priority: "medium",
          assignedTo: null,
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // Due in 14 days
        });
      }
    } 
    // For well-performing topics, enhance reasoning patterns
    else if (averageRating >= 4.5 && feedbacks.length >= 5) {
      console.log(`Topic "${topic}" performing well, enhancing reasoning patterns`);
      
      // Get existing reasoning patterns
      const patterns = await storage.getAIReasoningPatterns();
      
      // Check if we have a pattern for this topic
      const existingPattern = patterns.find(p => {
        const categories = Array.isArray(p.category) ? p.category : [p.category];
        return categories.includes(topic);
      });
      
      if (existingPattern) {
        // Enhance existing pattern by adding examples
        const examples = existingPattern.examples as any[];
        const highRatedFeedback = feedbacks.filter(f => f.rating >= 4);
        
        // Add up to 3 new examples from high-rated feedback
        const newExamples = highRatedFeedback
          .slice(0, 3)
          .map(f => ({ question: f.question, answer: f.answer }));
        
        // Update pattern with new examples (avoiding duplicates)
        const updatedExamples = [...examples];
        
        for (const newExample of newExamples) {
          // Check if this example is already included
          const isDuplicate = examples.some(e => 
            this.contentOverlap(e.question, newExample.question) > 0.7
          );
          
          if (!isDuplicate) {
            updatedExamples.push(newExample);
          }
        }
        
        // Update the pattern
        await storage.updateAIReasoningPattern(existingPattern.id, {
          examples: updatedExamples as any,
          priority: (existingPattern.priority || 0) + 1 // Increase priority
        });
        
        // Record learning activity
        await this.recordLearningActivity({
          patternsCreated: 0,
          knowledgeEntriesUpdated: 1
        });
      }
    }
  }
  
  /**
   * Scan platform for changes to update knowledge
   * This proactively keeps the AI up-to-date with platform changes
   */
  async scanPlatformForChanges(): Promise<void> {
    try {
      console.log("Scanning platform for changes...");
      
      // Get the previous scan result for comparison
      const previousScan = await storage.getLatestPlatformScanResult();
      
      // Perform a new platform scan
      const currentState = await this.platformScanner.scanPlatform();
      
      // Flag to track if we detected any changes
      let changeDetected = false;
      let changeDetails: any[] = [];
      
      if (previousScan) {
        // Compare the scan results
        const changes = this.detectPlatformChanges(previousScan, currentState);
        
        if (changes.length > 0) {
          changeDetected = true;
          changeDetails = changes;
          console.log(`Detected ${changes.length} changes in platform state`);
          
          // Create knowledge entries for each significant change
          for (const change of changes) {
            await this.createKnowledgeFromChange(change);
          }
          
          // Create an admin task to review the changes
          await storage.createAdminTask({
            title: `Review detected platform changes`,
            createdBy: 1, // System user ID
            description: `${changes.length} changes were detected in the platform:\n${changes.map(c => 
              `- ${c.type}: ${c.description}`
            ).join('\n')}`,
            status: "pending",
            priority: "medium",
            assignedTo: null,
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Due in 7 days
          });
        } else {
          console.log("No significant changes detected in platform state");
        }
      }
      
      // Store the scan result
      await storage.storePlatformScanResult({
        ...currentState,
        changeDetected,
        changeDetails
      });
      
      // Record a completed scan task
      await storage.createAISystemTask({
        taskType: "platform_scan",
        priority: 40,
        status: "completed",
        data: {
          changeDetected,
          changeCount: changeDetails.length
        },
        scheduledFor: new Date()
      });
      
      console.log("Platform scan completed");
    } catch (error) {
      console.error("Error scanning platform for changes:", error);
    }
  }
  
  /**
   * Create knowledge enhancements from external sources
   * This enhances the AI with external specialized knowledge
   */
  async enhanceFromExternalSources(): Promise<void> {
    try {
      // For future implementation - this would integrate with external APIs
      // to retrieve industry-specific knowledge or market updates
      
      // Currently just logging a placeholder message
      console.log("External source enhancement scheduled for future implementation");
      
      // Create a completed task record
      await storage.createAISystemTask({
        taskType: "external_enhancement",
        priority: 30,
        status: "completed",
        data: {
          status: "future_implementation",
          message: "This feature will be implemented in the future"
        },
        scheduledFor: new Date()
      });
    } catch (error) {
      console.error("Error enhancing from external sources:", error);
    }
  }
  
  /**
   * Create knowledge entry from detected platform change
   */
  private async createKnowledgeFromChange(change: any): Promise<void> {
    try {
      // Skip if this is not a significant change
      if (!change.significant) return;
      
      try {
        // Try to enhance the description using OpenAI for more comprehensive information
        const changeContent = `${change.area} - ${change.type}: ${change.description}`;
        
        // Use OpenAI to analyze the platform content if available
        const enhancedEntries = await openAIService.analyzePlatformContent(
          changeContent,
          'update',
          { changeType: change.type, changeArea: change.area, timestamp: new Date() }
        );
        
        if (enhancedEntries && enhancedEntries.length > 0) {
          console.log(`OpenAI generated ${enhancedEntries.length} enhanced knowledge entries for platform change`);
          
          // Save all the enhanced entries
          for (const entry of enhancedEntries) {
            await storage.createAIKnowledgeEntry(entry);
          }
          
          // Record the activity with AI enhancement
          await this.recordLearningActivity({
            knowledgeEntriesCreated: enhancedEntries.length,
            aiAssistedLearning: 1
          });
          
          // Create a review task for the enhanced entries
          await storage.createAdminTask({
            title: `Review AI-enhanced platform change entries`,
            createdBy: 1, // System user ID
            description: `The AI automatically enhanced platform change information:\n\nOriginal change: ${change.area} - ${change.type}: ${change.description}\n\nPlease review the generated knowledge entries for accuracy.`,
            status: "pending",
            priority: "medium",
            assignedTo: null,
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // Due in 3 days
          });
          
          return;
        }
      } catch (error) {
        console.error("Error using OpenAI to enhance platform change:", error);
        // Continue with traditional processing if OpenAI fails
      }
      
      // Fallback to basic knowledge entry if OpenAI enhancement fails
      const knowledgeData: InsertAIKnowledgeBase = {
        topic: change.area,
        subtopic: change.type,
        information: change.description,
        relationships: [change.area, change.type],
        confidence: 90,
        category: 'platform'
      };
      
      await storage.createAIKnowledgeEntry(knowledgeData);
      
      console.log(`Created new knowledge entry for change: ${change.type} in ${change.area}`);
      
      // Record learning activity
      await this.recordLearningActivity({
        knowledgeEntriesCreated: 1
      });
    } catch (error) {
      console.error("Error creating knowledge from change:", error);
    }
  }
  
  /**
   * Record metrics about learning activities
   */
  private async recordLearningActivity(metrics: {
    totalInteractions?: number;
    positiveRatings?: number;
    negativeRatings?: number;
    neutralRatings?: number;
    knowledgeGapsIdentified?: number;
    knowledgeEntriesCreated?: number;
    knowledgeEntriesUpdated?: number;
    patternsCreated?: number;
    averageResponseConfidence?: number;
    topQuestionCategories?: any[];
    commonMisunderstandings?: any[];
  }): Promise<void> {
    try {
      // Get existing metrics for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const recentMetrics = await storage.getAILearningMetrics(1);
      let todayMetrics = recentMetrics.find(m => {
        const metricDate = new Date(m.date);
        metricDate.setHours(0, 0, 0, 0);
        return metricDate.getTime() === today.getTime();
      });
      
      if (todayMetrics) {
        // Update existing metrics
        const updatedMetrics = {
          totalInteractions: (todayMetrics.totalInteractions || 0) + (metrics.totalInteractions || 0),
          positiveRatings: (todayMetrics.positiveRatings || 0) + (metrics.positiveRatings || 0),
          negativeRatings: (todayMetrics.negativeRatings || 0) + (metrics.negativeRatings || 0),
          neutralRatings: (todayMetrics.neutralRatings || 0) + (metrics.neutralRatings || 0),
          knowledgeGapsIdentified: (todayMetrics.knowledgeGapsIdentified || 0) + (metrics.knowledgeGapsIdentified || 0),
          knowledgeEntriesCreated: (todayMetrics.knowledgeEntriesCreated || 0) + (metrics.knowledgeEntriesCreated || 0),
          knowledgeEntriesUpdated: (todayMetrics.knowledgeEntriesUpdated || 0) + (metrics.knowledgeEntriesUpdated || 0),
          patternsCreated: (todayMetrics.patternsCreated || 0) + (metrics.patternsCreated || 0),
        };
        
        // For array fields, we need to merge rather than replace
        if (metrics.topQuestionCategories) {
          updatedMetrics['topQuestionCategories'] = [
            ...(todayMetrics.topQuestionCategories || []),
            ...metrics.topQuestionCategories
          ];
        }
        
        if (metrics.commonMisunderstandings) {
          updatedMetrics['commonMisunderstandings'] = [
            ...(todayMetrics.commonMisunderstandings || []),
            ...metrics.commonMisunderstandings
          ];
        }
        
        // Calculate average confidence if provided
        if (metrics.averageResponseConfidence) {
          const oldCount = todayMetrics.totalInteractions || 0;
          const oldAvg = todayMetrics.averageResponseConfidence || 0;
          const newValue = metrics.averageResponseConfidence;
          
          // Weighted average calculation
          updatedMetrics['averageResponseConfidence'] = 
            (oldAvg * oldCount + newValue) / (oldCount + 1);
        }
        
        // Update the metrics
        await storage.updatePlatformSetting(todayMetrics.id, updatedMetrics);
      } else {
        // Create new metrics for today
        await storage.createAILearningMetrics({
          totalInteractions: metrics.totalInteractions || 1,
          positiveRatings: metrics.positiveRatings || 0,
          negativeRatings: metrics.negativeRatings || 0,
          neutralRatings: metrics.neutralRatings || 0,
          knowledgeGapsIdentified: metrics.knowledgeGapsIdentified || 0,
          knowledgeEntriesCreated: metrics.knowledgeEntriesCreated || 0,
          knowledgeEntriesUpdated: metrics.knowledgeEntriesUpdated || 0,
          patternsCreated: metrics.patternsCreated || 0,
          averageResponseConfidence: metrics.averageResponseConfidence || 0,
          topQuestionCategories: metrics.topQuestionCategories || [],
          commonMisunderstandings: metrics.commonMisunderstandings || []
        });
      }
    } catch (error) {
      console.error("Error recording learning activity:", error);
    }
  }
  
  /**
   * Calculate overlap between two text strings
   * Used to determine similarity between content
   */
  private contentOverlap(text1: string, text2: string): number {
    // Normalize and tokenize the texts
    const words1 = this.extractSignificantWords(text1);
    const words2 = this.extractSignificantWords(text2);
    
    // If either text has no significant words, return 0
    if (words1.length === 0 || words2.length === 0) return 0;
    
    // Count words in common
    const commonWords = words1.filter(word => words2.includes(word));
    
    // Calculate Jaccard similarity: size of intersection / size of union
    const union = new Set([...words1, ...words2]);
    return commonWords.length / union.size;
  }
  
  /**
   * Extract significant words from text for comparison
   */
  private extractSignificantWords(text: string): string[] {
    if (!text) return [];
    
    // Convert to lowercase and remove non-alphanumeric characters
    const cleanText = text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ');
    
    // Split into words
    const words = cleanText.split(/\s+/).filter(word => 
      // Remove stop words and very short words
      word.length > 2 && !this.stopWords.has(word)
    );
    
    return words;
  }
  
  /**
   * Identify common terms in a list of texts
   */
  private identifyCommonTerms(texts: string[]): string[] {
    // Word frequency map
    const wordFreq = new Map<string, number>();
    
    // Process each text
    for (const text of texts) {
      // Get unique words from this text
      const words = [...new Set(this.extractSignificantWords(text))];
      
      // Increment frequency for each word
      for (const word of words) {
        wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
      }
    }
    
    // Filter for words that appear in at least 1/3 of the texts
    const minFrequency = Math.max(2, Math.ceil(texts.length / 3));
    
    // Sort by frequency (descending)
    return Array.from(wordFreq.entries())
      .filter(([_, freq]) => freq >= minFrequency)
      .sort((a, b) => b[1] - a[1])
      .map(([word]) => word)
      .slice(0, 10); // Return top 10 common terms
  }
  
  /**
   * Detect changes between platform states
   */
  private detectPlatformChanges(previousState: any, currentState: any): any[] {
    const changes: any[] = [];
    
    // New users count change
    const prevUserCount = previousState.userStats?.totalUsers || 0;
    const currUserCount = currentState.userStats?.totalUsers || 0;
    
    if (currUserCount - prevUserCount > 10) {
      changes.push({
        type: 'user_growth',
        area: 'users',
        description: `User count increased by ${currUserCount - prevUserCount} since last scan.`,
        significant: currUserCount - prevUserCount > 50
      });
    }
    
    // New marketplace items
    const prevMarketplaceCount = previousState.marketplaceStats?.totalItems || 0;
    const currMarketplaceCount = currentState.marketplaceStats?.totalItems || 0;
    
    if (currMarketplaceCount > prevMarketplaceCount) {
      changes.push({
        type: 'marketplace_growth',
        area: 'marketplace',
        description: `${currMarketplaceCount - prevMarketplaceCount} new items added to the marketplace.`,
        significant: currMarketplaceCount - prevMarketplaceCount > 5
      });
    }
    
    // Mining rate changes
    const prevMiningRate = previousState.miningStats?.averageRate || 0;
    const currMiningRate = currentState.miningStats?.averageRate || 0;
    
    if (Math.abs(currMiningRate - prevMiningRate) / prevMiningRate > 0.1) {
      changes.push({
        type: 'mining_rate_change',
        area: 'mining',
        description: `Mining rate has ${currMiningRate > prevMiningRate ? 'increased' : 'decreased'} by ${Math.abs(Math.round((currMiningRate - prevMiningRate) / prevMiningRate * 100))}%.`,
        significant: Math.abs(currMiningRate - prevMiningRate) / prevMiningRate > 0.2
      });
    }
    
    // API usage changes
    if (previousState.systemStats?.apiUsage && currentState.systemStats?.apiUsage) {
      const prevAPIUsage = previousState.systemStats.apiUsage;
      const currAPIUsage = currentState.systemStats.apiUsage;
      
      Object.keys(currAPIUsage).forEach(endpoint => {
        if (!prevAPIUsage[endpoint] || 
            Math.abs(currAPIUsage[endpoint] - prevAPIUsage[endpoint]) / prevAPIUsage[endpoint] > 0.2) {
          changes.push({
            type: 'api_usage_change',
            area: 'system',
            description: `Usage of API endpoint "${endpoint}" has ${currAPIUsage[endpoint] > (prevAPIUsage[endpoint] || 0) ? 'increased' : 'decreased'} significantly.`,
            significant: Math.abs(currAPIUsage[endpoint] - (prevAPIUsage[endpoint] || 0)) / (prevAPIUsage[endpoint] || 1) > 0.5
          });
        }
      });
    }
    
    return changes;
  }
  
  /**
   * Process unprocessed feedback in batches
   */
  async processUnprocessedFeedback(): Promise<void> {
    try {
      console.log("Processing unprocessed feedback...");
      
      // Get unprocessed feedback, limited to 50 at a time
      const unprocessedFeedback = await storage.getUnprocessedAIFeedback(50);
      
      if (unprocessedFeedback.length === 0) {
        console.log("No unprocessed feedback to handle");
        return;
      }
      
      console.log(`Processing ${unprocessedFeedback.length} unprocessed feedback items`);
      
      // Process each feedback
      for (const feedback of unprocessedFeedback) {
        await this.learnFromFeedback(feedback);
        
        // Small delay to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 50));
      }
      
      console.log(`Completed processing ${unprocessedFeedback.length} feedback items`);
    } catch (error) {
      console.error("Error processing unprocessed feedback:", error);
    }
  }
  
  /**
   * Run all automatic learning tasks
   * This would typically be called by a scheduled job
   */
  async runAllLearningTasks(): Promise<void> {
    console.log("Running all automatic learning tasks...");
    
    try {
      // Process any unprocessed feedback
      await this.processUnprocessedFeedback();
      
      // Analyze interaction patterns
      await this.analyzeInteractionPatterns();
      
      // Scan platform for changes
      await this.scanPlatformForChanges();
      
      // Enhance from external sources (future implementation)
      await this.enhanceFromExternalSources();
      
      console.log("Completed all automatic learning tasks");
    } catch (error) {
      console.error("Error running learning tasks:", error);
    }
  }
}

// Create singleton instance
export const autoLearningService = new AutoLearningService();
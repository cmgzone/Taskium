import { storage } from '../../storage';
import { AISystemTask, AIKnowledgeBase, AIReasoning } from '../../../shared/schema';

/**
 * AI Self-Improvement Service
 * 
 * This service handles the AI's ability to improve itself by:
 * - Identifying knowledge gaps
 * - Learning from interactions
 * - Creating and refining reasoning patterns
 * - Optimizing its knowledge structure
 * - Scheduling and executing learning tasks
 */
export class SelfImprovementService {
  /**
   * Process pending AI system tasks in order of priority
   */
  async processNextTasks(limit: number = 5): Promise<number> {
    // Get pending tasks sorted by priority
    // Pass status as a string parameter, not as an object
    const tasks = await storage.getAISystemTasks('pending');
    
    // Process each task based on type
    let processedCount = 0;
    
    for (const task of tasks) {
      try {
        // Mark task as in progress
        await storage.updateAISystemTask(task.id, { status: 'in_progress' });
        
        switch (task.taskType) {
          case 'knowledge_gap':
            await this.processKnowledgeGapTask(task);
            break;
          case 'pattern_creation':
            await this.processPatternCreationTask(task);
            break;
          case 'knowledge_organization':
            await this.processKnowledgeOrganizationTask(task);
            break;
          case 'reasoning_optimization':
            await this.processReasoningOptimizationTask(task);
            break;
          case 'example_generation':
            await this.processExampleGenerationTask(task);
            break;
          default:
            console.log(`Unknown task type: ${task.taskType}`);
        }
        
        // Mark task as completed
        await storage.updateAISystemTask(task.id, { 
          status: 'completed',
          completedAt: new Date()
        });
        
        processedCount++;
      } catch (error) {
        console.error(`Error processing task ${task.id}:`, error);
        // Mark task as failed
        await storage.updateAISystemTask(task.id, { 
          status: 'failed',
          data: {
            ...task.data,
            error: error.message
          }
        });
      }
    }
    
    return processedCount;
  }

  /**
   * Process a knowledge gap task
   * 
   * These tasks are created when the AI identifies that it lacks sufficient
   * knowledge to answer a user question with high confidence
   */
  private async processKnowledgeGapTask(task: AISystemTask): Promise<void> {
    const { question, confidence } = task.data || {};
    
    if (!question) {
      throw new Error('Knowledge gap task missing question data');
    }
    
    // 1. Analyze the question to determine relevant topic areas
    const topics = this.analyzeQuestionTopics(question);
    
    // 2. Check if we already have some knowledge in these areas
    const existingKnowledge: Record<string, AIKnowledgeBase[]> = {};
    
    for (const topic of topics) {
      const knowledge = await storage.getAIKnowledgeBase(topic);
      existingKnowledge[topic] = knowledge;
    }
    
    // 3. Create a placeholder for the missing knowledge
    for (const topic of topics) {
      // If we have no knowledge or very little knowledge on this topic
      if (!existingKnowledge[topic] || existingKnowledge[topic].length < 2) {
        // Create a placeholder knowledge entry for administrators to fill in
        await storage.createAIKnowledgeEntry({
          topic,
          subtopic: 'Auto-Generated',
          information: `This is a placeholder for missing knowledge about: ${question}`,
          confidence: 10, // Low confidence
          relationships: topics.filter(t => t !== topic),
          source: 'knowledge_gap_detection',
          needsReview: true,
          metadata: {
            originalQuestion: question,
            detectedConfidence: confidence,
            createdBySystem: true,
            detectionDate: new Date().toISOString()
          }
        });
        
        // Create a task for admins to review
        await storage.createAdminTask({
          title: `Review AI Knowledge Gap: ${topic}`,
          description: `The AI detected a knowledge gap when trying to answer: "${question}". Please review and fill in the appropriate information.`,
          type: 'ai_knowledge_review',
          priority: 'medium',
          status: 'pending',
          metadata: {
            originalQuestion: question,
            detectedConfidence: confidence,
            topic,
            detectionDate: new Date().toISOString()
          }
        });
      }
    }
  }

  /**
   * Process a pattern creation task
   * 
   * These tasks are created to develop new reasoning patterns
   * based on observed user interactions
   */
  private async processPatternCreationTask(task: AISystemTask): Promise<void> {
    const { interactions, category, name } = task.data || {};
    
    if (!interactions || !category) {
      throw new Error('Pattern creation task missing required data');
    }
    
    // 1. Extract common elements from interactions
    const commonElements = this.extractCommonElements(interactions);
    
    // 2. Create a new reasoning pattern
    await storage.createAIReasoningPattern({
      pattern: name || `Auto-generated ${category} pattern`,
      rules: commonElements.rules,
      examples: interactions.slice(0, 5), // Use first 5 interactions as examples
      priority: 50, // Medium priority for new patterns
      category,
      metadata: {
        createdBySystem: true,
        sourceInteractions: interactions.length,
        creationDate: new Date().toISOString()
      }
    });
    
    // 3. Create a task for admins to review the new pattern
    await storage.createAdminTask({
      title: `Review New AI Reasoning Pattern: ${category}`,
      description: `The AI created a new reasoning pattern based on ${interactions.length} observed interactions. Please review and refine the pattern rules and examples.`,
      type: 'ai_pattern_review',
      priority: 'medium',
      status: 'pending',
      metadata: {
        patternCategory: category,
        interactionCount: interactions.length,
        creationDate: new Date().toISOString()
      }
    });
  }

  /**
   * Process a knowledge organization task
   * 
   * These tasks optimize the AI's knowledge base structure for better retrieval
   */
  private async processKnowledgeOrganizationTask(task: AISystemTask): Promise<void> {
    const { topic } = task.data || {};
    
    if (!topic) {
      throw new Error('Knowledge organization task missing topic');
    }
    
    // 1. Get all knowledge items for the topic
    const knowledgeItems = await storage.getAIKnowledgeBase(topic);
    
    // 2. Analyze relationships between items
    const relationships = this.analyzeKnowledgeRelationships(knowledgeItems);
    
    // 3. Update each knowledge item with refined relationships
    for (const itemId in relationships) {
      const id = parseInt(itemId);
      await storage.updateAIKnowledgeEntry(id, {
        relationships: relationships[itemId]
      });
    }
    
    // 4. Create a task for admins to review the organization
    await storage.createAdminTask({
      title: `Review AI Knowledge Organization: ${topic}`,
      description: `The AI reorganized relationships for ${knowledgeItems.length} knowledge items in the "${topic}" topic. Please review the new relationships for accuracy.`,
      type: 'ai_knowledge_organization_review',
      priority: 'low',
      status: 'pending',
      metadata: {
        topic,
        itemCount: knowledgeItems.length,
        organizationDate: new Date().toISOString()
      }
    });
  }

  /**
   * Process a reasoning optimization task
   * 
   * These tasks refine existing reasoning patterns based on their effectiveness
   */
  private async processReasoningOptimizationTask(task: AISystemTask): Promise<void> {
    const { patternId, successRate, interactions } = task.data || {};
    
    if (!patternId) {
      throw new Error('Reasoning optimization task missing pattern ID');
    }
    
    // 1. Get the reasoning pattern
    const pattern = await storage.getAIReasoningPattern(patternId);
    if (!pattern) {
      throw new Error(`Reasoning pattern with ID ${patternId} not found`);
    }
    
    // 2. Extract successful examples
    const successfulExamples = interactions?.filter(i => i.success) || [];
    
    // 3. Update the pattern with new examples and adjusted priority
    const newPriority = this.calculateNewPriority(pattern.priority || 50, successRate);
    
    await storage.updateAIReasoningPattern(patternId, {
      examples: this.mergeExamples(pattern.examples || [], successfulExamples),
      priority: newPriority,
      metadata: {
        ...pattern.metadata,
        lastOptimized: new Date().toISOString(),
        successRate
      }
    });
  }

  /**
   * Process an example generation task
   * 
   * These tasks create new examples for reasoning patterns
   */
  private async processExampleGenerationTask(task: AISystemTask): Promise<void> {
    const { patternId, baseExamples } = task.data || {};
    
    if (!patternId || !baseExamples) {
      throw new Error('Example generation task missing required data');
    }
    
    // 1. Get the reasoning pattern
    const pattern = await storage.getAIReasoningPattern(patternId);
    if (!pattern) {
      throw new Error(`Reasoning pattern with ID ${patternId} not found`);
    }
    
    // 2. Generate variations of the base examples
    const newExamples = this.generateExampleVariations(baseExamples);
    
    // 3. Update the pattern with the new examples
    await storage.updateAIReasoningPattern(patternId, {
      examples: [...(pattern.examples || []), ...newExamples]
    });
    
    // 4. Create a task for admins to review the new examples
    await storage.createAdminTask({
      title: `Review AI Generated Examples: ${pattern.pattern}`,
      description: `The AI generated ${newExamples.length} new examples for the "${pattern.pattern}" reasoning pattern. Please review for accuracy.`,
      type: 'ai_example_review',
      priority: 'low',
      status: 'pending',
      metadata: {
        patternId,
        patternName: pattern.pattern,
        exampleCount: newExamples.length,
        generationDate: new Date().toISOString()
      }
    });
  }

  // Helper methods

  /**
   * Analyze a question to identify topic areas
   */
  private analyzeQuestionTopics(question: string): string[] {
    const topics: string[] = [];
    
    // Keywords mapping to topics
    const topicKeywords: Record<string, string[]> = {
      "Mining": ["mining", "mine", "token", "reward", "daily", "streak"],
      "Wallet": ["wallet", "connect", "metamask", "address", "transaction", "transfer"],
      "Marketplace": ["marketplace", "buy", "sell", "item", "listing", "purchase"],
      "KYC": ["kyc", "verify", "verification", "document", "identity"],
      "Referrals": ["referral", "invite", "friend", "bonus", "code"],
      "AI Assistant": ["assistant", "help", "ai", "question", "answer"]
    };
    
    // Check for topic keywords in the question
    const lowercaseQuestion = question.toLowerCase();
    
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      for (const keyword of keywords) {
        if (lowercaseQuestion.includes(keyword)) {
          topics.push(topic);
          break;
        }
      }
    }
    
    // If no specific topics identified, include general AI Assistant capabilities
    if (topics.length === 0) {
      topics.push("AI Assistant");
    }
    
    return topics;
  }

  /**
   * Extract common elements from a set of interactions
   */
  private extractCommonElements(interactions: any[]): {
    rules: string[];
    keywords: string[];
  } {
    // Simplified implementation
    const rules: string[] = [];
    const keywords = new Set<string>();
    
    // Extract common words
    const allTexts = interactions.map(i => 
      `${i.question || ''} ${i.answer || ''}`
    ).join(' ').toLowerCase();
    
    // Extract words that appear frequently
    const wordCount: Record<string, number> = {};
    const words = allTexts.split(/\W+/).filter(w => w.length > 3);
    
    for (const word of words) {
      wordCount[word] = (wordCount[word] || 0) + 1;
    }
    
    // Find words that appear in more than 50% of interactions
    const threshold = interactions.length * 0.5;
    for (const word in wordCount) {
      if (wordCount[word] > threshold) {
        keywords.add(word);
      }
    }
    
    // Create rules based on common patterns
    if (keywords.size > 0) {
      rules.push(`Consider keywords: [${Array.from(keywords).join(', ')}]`);
    }
    
    // Add generic rules
    rules.push("If question contains specifics, reference specific information");
    rules.push("If question is general, provide overview information");
    rules.push("Always consider user's context if available");
    
    return { rules, keywords: Array.from(keywords) };
  }

  /**
   * Analyze relationships between knowledge items
   */
  private analyzeKnowledgeRelationships(items: AIKnowledgeBase[]): Record<string, string[]> {
    const relationships: Record<string, string[]> = {};
    
    // Build map of terms to item IDs
    const termMap: Record<string, Set<number>> = {};
    
    // Extract significant terms from each item
    items.forEach(item => {
      const terms = this.extractSignificantTerms(item.information);
      terms.forEach(term => {
        if (!termMap[term]) {
          termMap[term] = new Set<number>();
        }
        termMap[term].add(item.id);
      });
      
      // Initialize relationships for this item
      relationships[item.id] = [];
    });
    
    // Find items that share terms
    items.forEach(item => {
      const itemTerms = this.extractSignificantTerms(item.information);
      const relatedItemIds = new Set<number>();
      
      // Find items that share terms with this item
      itemTerms.forEach(term => {
        const itemsWithTerm = termMap[term];
        if (itemsWithTerm) {
          itemsWithTerm.forEach(id => {
            if (id !== item.id) {
              relatedItemIds.add(id);
            }
          });
        }
      });
      
      // Add related topics to relationships
      const relatedItems = items.filter(i => relatedItemIds.has(i.id));
      relationships[item.id] = [...new Set(relatedItems.map(i => i.topic))];
    });
    
    return relationships;
  }

  /**
   * Extract significant terms from text
   */
  private extractSignificantTerms(text: string): string[] {
    if (!text) {
      return [];
    }
    
    // Simple extraction of significant terms
    // In a real system, this would use NLP techniques like TF-IDF
    const words = text.toLowerCase().split(/\W+/).filter(w => w.length > 4);
    const uniqueWords = [...new Set(words)];
    
    // Remove common stop words
    const stopWords = new Set([
      'about', 'above', 'after', 'again', 'against', 'based', 'before', 'being', 
      'between', 'both', 'cannot', 'could', 'during', 'each', 'further', 'have', 
      'having', 'should', 'their', 'there', 'these', 'those', 'through', 'under', 
      'while', 'would', 'yourself'
    ]);
    
    return uniqueWords.filter(word => !stopWords.has(word));
  }

  /**
   * Calculate new priority based on success rate
   */
  private calculateNewPriority(currentPriority: number, successRate: number): number {
    // Success rate is expected to be between 0 and 1
    // Adjust priority up or down based on success rate
    const adjustment = (successRate - 0.5) * 20; // Scale from -10 to +10
    
    let newPriority = currentPriority + adjustment;
    
    // Keep priority between 1 and 100
    newPriority = Math.max(1, Math.min(100, newPriority));
    
    return Math.round(newPriority);
  }

  /**
   * Merge existing examples with new ones, removing duplicates
   */
  private mergeExamples(existingExamples: any[], newExamples: any[]): any[] {
    // Convert examples to strings for comparison
    const existingStrings = new Set(existingExamples.map(e => JSON.stringify(e)));
    
    // Filter out duplicates
    const uniqueNewExamples = newExamples.filter(e => 
      !existingStrings.has(JSON.stringify(e))
    );
    
    // Combine lists, keeping a maximum of 10 examples
    return [...existingExamples, ...uniqueNewExamples].slice(0, 10);
  }

  /**
   * Generate variations of examples by slightly altering them
   */
  private generateExampleVariations(baseExamples: any[]): any[] {
    const variations: any[] = [];
    
    // Simple implementation - create 2 variations for each example
    baseExamples.forEach(example => {
      // Variation 1: Rephrase input slightly
      if (example.input && typeof example.input === 'string') {
        const variation1 = { ...example };
        variation1.input = this.rephraseText(example.input);
        variations.push(variation1);
      }
      
      // Variation 2: Rephrase output slightly
      if (example.output && typeof example.output === 'string') {
        const variation2 = { ...example };
        variation2.output = this.rephraseText(example.output);
        variations.push(variation2);
      }
    });
    
    return variations;
  }

  /**
   * Simple text rephrasing by adding/removing qualifiers
   */
  private rephraseText(text: string): string {
    const qualifiers = [
      "definitely", "possibly", "perhaps", "usually", 
      "often", "sometimes", "generally", "typically"
    ];
    
    // Half the time, add a qualifier
    if (Math.random() > 0.5 && !qualifiers.some(q => text.includes(q))) {
      const qualifier = qualifiers[Math.floor(Math.random() * qualifiers.length)];
      const firstSpace = text.indexOf(' ');
      
      if (firstSpace > 0) {
        return text.substring(0, firstSpace + 1) + qualifier + " " + text.substring(firstSpace + 1);
      }
    }
    
    // Otherwise, replace a word if possible
    const wordReplacements: Record<string, string[]> = {
      'important': ['crucial', 'essential', 'critical'],
      'good': ['beneficial', 'positive', 'valuable'],
      'bad': ['problematic', 'negative', 'concerning'],
      'big': ['large', 'substantial', 'significant'],
      'small': ['minor', 'modest', 'limited']
    };
    
    for (const [word, replacements] of Object.entries(wordReplacements)) {
      if (text.includes(word)) {
        const replacement = replacements[Math.floor(Math.random() * replacements.length)];
        return text.replace(word, replacement);
      }
    }
    
    // If no replacements were made, return the original
    return text;
  }
}

export const selfImprovementService = new SelfImprovementService();
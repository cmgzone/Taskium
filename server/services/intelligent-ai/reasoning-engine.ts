import { storage } from '../../storage';
import { AIReasoning, AIKnowledgeBase } from '../../../shared/schema';

/**
 * AI Reasoning Engine
 * 
 * This engine provides advanced reasoning capabilities for the platform's AI:
 * - Pattern recognition and application
 * - Context-aware processing
 * - Rule-based deduction
 * - Bayesian probability updating
 * - Logical reasoning chains
 */
export class ReasoningEngine {
  /**
   * Apply a specific reasoning pattern to a given situation
   * 
   * @param patternId The ID of the reasoning pattern to apply
   * @param situation The current situation/context data
   * @param knowledge Relevant knowledge to incorporate in reasoning
   * @returns Results of applying the reasoning pattern
   */
  async applyReasoningPattern(
    patternId: number, 
    situation: Record<string, any>, 
    knowledge: AIKnowledgeBase[]
  ): Promise<{ 
    conclusion: string; 
    confidence: number; 
    reasoning: string[];
  }> {
    // Load the reasoning pattern
    const pattern = await storage.getAIReasoningPattern(patternId);
    if (!pattern) {
      throw new Error(`Reasoning pattern with ID ${patternId} not found`);
    }
    
    // Update pattern usage count
    await storage.updateAIReasoningPattern(patternId, {
      usageCount: (pattern.usageCount || 0) + 1
    });
    
    // Extract pattern components
    const { rules = [], examples = [] } = pattern;
    
    // Apply the pattern based on its category
    switch (pattern.category) {
      case 'problem-solving':
        return this.applySequentialLogic(rules, situation, knowledge, examples);
      case 'inference':
        return this.applyAnalogicalReasoning(rules, situation, knowledge, examples);
      case 'interpretation':
        return this.applyContextualAnalysis(rules, situation, knowledge, examples);
      case 'learning':
        return this.applyBayesianUpdating(rules, situation, knowledge, examples);
      case 'personalization':
        return this.applyPatternRecognition(rules, situation, knowledge, examples);
      default:
        return this.applyDefaultReasoning(pattern.pattern, situation, knowledge);
    }
  }
  
  /**
   * Apply sequential logical reasoning
   * Step by step reasoning process
   */
  private applySequentialLogic(
    rules: any[],
    situation: Record<string, any>,
    knowledge: AIKnowledgeBase[],
    examples: any[]
  ): { conclusion: string; confidence: number; reasoning: string[] } {
    const reasoning: string[] = [];
    
    // Extract key facts from the situation
    const facts = Object.entries(situation).map(([key, value]) => `${key}: ${value}`);
    reasoning.push(`Given facts: ${facts.join(', ')}`);
    
    // Apply each rule in sequence
    let confidence = 0.5; // Starting confidence
    
    // Process each rule as a conditional (if-then) statement
    rules.forEach((rule, index) => {
      // Check if rule condition applies to current situation
      const conditionMet = this.checkRuleCondition(rule, situation);
      if (conditionMet) {
        reasoning.push(`Rule ${index + 1} applies: ${rule}`);
        confidence += 0.1; // Increase confidence with each applicable rule
      } else {
        reasoning.push(`Rule ${index + 1} does not apply: ${rule}`);
      }
    });
    
    // Incorporate relevant knowledge
    if (knowledge.length > 0) {
      reasoning.push(`Incorporating ${knowledge.length} knowledge entries for context`);
      confidence += 0.2; // Knowledge increases confidence
    }
    
    // Synthesize conclusion based on applied rules
    let conclusion = "Based on sequential analysis";
    if (examples.length > 0) {
      // Use the most similar example as a template for the conclusion
      const mostSimilarExample = examples[0]; // Simplified for now
      conclusion = mostSimilarExample.output;
    }
    
    // Cap confidence at 1.0
    confidence = Math.min(confidence, 1.0);
    
    return { conclusion, confidence, reasoning };
  }
  
  /**
   * Apply analogical reasoning
   * Finding similarities between situations
   */
  private applyAnalogicalReasoning(
    rules: any[],
    situation: Record<string, any>,
    knowledge: AIKnowledgeBase[],
    examples: any[]
  ): { conclusion: string; confidence: number; reasoning: string[] } {
    const reasoning: string[] = [];
    
    // Look for source analogs (similar previous situations)
    reasoning.push("Searching for analogous situations");
    
    const sourceAnalogs = examples.map(example => ({
      example,
      similarity: this.calculateSimilarity(situation, example.input)
    }));
    
    // Sort by similarity
    sourceAnalogs.sort((a, b) => b.similarity - a.similarity);
    
    let confidence = 0.4; // Base confidence
    let conclusion = "No strong analogies found";
    
    if (sourceAnalogs.length > 0) {
      const bestAnalog = sourceAnalogs[0];
      reasoning.push(`Found analog with ${(bestAnalog.similarity * 100).toFixed(1)}% similarity`);
      
      if (bestAnalog.similarity > 0.7) {
        // High similarity: use the analog's output directly
        conclusion = bestAnalog.example.output;
        confidence = 0.5 + bestAnalog.similarity * 0.4;
        reasoning.push("High similarity allows direct mapping of conclusion");
      } else if (bestAnalog.similarity > 0.4) {
        // Medium similarity: adapt the analog's output
        conclusion = bestAnalog.example.output;
        confidence = 0.4 + bestAnalog.similarity * 0.3;
        reasoning.push("Moderate similarity requires adaptation of conclusion");
      } else {
        // Low similarity: use only as weak guidance
        conclusion = "Based on partial analogies";
        confidence = 0.3 + bestAnalog.similarity * 0.2;
        reasoning.push("Low similarity provides only weak guidance");
      }
    }
    
    // Incorporate knowledge to adjust conclusion
    if (knowledge.length > 0) {
      reasoning.push(`Refining with ${knowledge.length} knowledge entries`);
      confidence += 0.1;
    }
    
    return { conclusion, confidence, reasoning };
  }
  
  /**
   * Apply contextual analysis
   * Interprets query within broader context
   */
  private applyContextualAnalysis(
    rules: any[],
    situation: Record<string, any>,
    knowledge: AIKnowledgeBase[],
    examples: any[]
  ): { conclusion: string; confidence: number; reasoning: string[] } {
    const reasoning: string[] = [];
    
    // Analyze context dimensions
    const query = situation.query || "";
    const context = situation.context || {};
    const history = situation.history || [];
    
    reasoning.push(`Analyzing query: "${query}" within context`);
    
    // Context dimensions impact interpretation
    const contextualFactors = [];
    if (context.location) contextualFactors.push(`Location: ${context.location}`);
    if (context.time) contextualFactors.push(`Time: ${context.time}`);
    if (context.device) contextualFactors.push(`Device: ${context.device}`);
    if (context.previousActions) contextualFactors.push(`Previous actions: ${context.previousActions.length}`);
    
    reasoning.push(`Contextual factors: ${contextualFactors.join(', ')}`);
    
    // Calculate context relevance
    const contextRelevance = contextualFactors.length / 4; // Normalize to 0-1
    reasoning.push(`Context relevance: ${(contextRelevance * 100).toFixed(0)}%`);
    
    // Calculate historical relevance
    const historyRelevance = Math.min(history.length / 5, 1.0);
    reasoning.push(`History relevance: ${(historyRelevance * 100).toFixed(0)}%`);
    
    // Find similar interpretation examples
    const similarExamples = examples.filter(ex => 
      query.toLowerCase().includes(ex.input.toLowerCase()) ||
      ex.input.toLowerCase().includes(query.toLowerCase())
    );
    
    let confidence = 0.3 + (contextRelevance * 0.3) + (historyRelevance * 0.2);
    let conclusion = "Based on contextual analysis";
    
    if (similarExamples.length > 0) {
      conclusion = similarExamples[0].output;
      confidence += 0.2;
      reasoning.push(`Using similar example: "${similarExamples[0].input}"`);
    }
    
    // Incorporate knowledge
    if (knowledge.length > 0) {
      reasoning.push(`Incorporating ${knowledge.length} knowledge entries`);
      // Enhance confidence based on knowledge relevance
      const knowledgeRelevance = Math.min(knowledge.length / 5, 1.0) * 0.2;
      confidence += knowledgeRelevance;
    }
    
    // Cap confidence
    confidence = Math.min(confidence, 1.0);
    
    return { conclusion, confidence, reasoning };
  }
  
  /**
   * Apply Bayesian updating
   * Updates belief based on new evidence
   */
  private applyBayesianUpdating(
    rules: any[],
    situation: Record<string, any>,
    knowledge: AIKnowledgeBase[],
    examples: any[]
  ): { conclusion: string; confidence: number; reasoning: string[] } {
    const reasoning: string[] = [];
    
    // Extract hypothesis and evidence
    const priorBelief = situation.priorBelief || 0.5; // Default 50% prior
    const evidence = situation.evidence || {};
    
    reasoning.push(`Starting with prior belief: ${(priorBelief * 100).toFixed(0)}%`);
    
    // Process each piece of evidence
    let posteriorBelief = priorBelief;
    const evidenceFactors: string[] = [];
    
    if (evidence.supportingPoints) {
      const supportStrength = Math.min((evidence.supportingPoints.length || 0) * 0.1, 0.5);
      posteriorBelief = this.updateBeliefStrength(posteriorBelief, supportStrength);
      evidenceFactors.push(`Supporting points: +${(supportStrength * 100).toFixed(0)}%`);
    }
    
    if (evidence.counterPoints) {
      const counterStrength = Math.min((evidence.counterPoints.length || 0) * 0.1, 0.5);
      posteriorBelief = this.updateBeliefStrength(posteriorBelief, -counterStrength);
      evidenceFactors.push(`Counter points: -${(counterStrength * 100).toFixed(0)}%`);
    }
    
    if (evidence.reliability) {
      const reliabilityImpact = (evidence.reliability - 0.5) * 0.2;
      posteriorBelief = this.updateBeliefStrength(posteriorBelief, reliabilityImpact);
      evidenceFactors.push(`Source reliability: ${reliabilityImpact > 0 ? '+' : ''}${(reliabilityImpact * 100).toFixed(0)}%`);
    }
    
    // Update based on knowledge
    if (knowledge.length > 0) {
      const knowledgeImpact = Math.min(knowledge.length * 0.05, 0.2);
      posteriorBelief = this.updateBeliefStrength(posteriorBelief, knowledgeImpact);
      evidenceFactors.push(`Knowledge base: +${(knowledgeImpact * 100).toFixed(0)}%`);
    }
    
    reasoning.push(`Evidence factors: ${evidenceFactors.join(', ')}`);
    reasoning.push(`Updated belief: ${(posteriorBelief * 100).toFixed(0)}%`);
    
    // Generate conclusion based on posterior belief
    let conclusion = "Based on Bayesian analysis";
    
    // Use example-based conclusion if available
    if (examples.length > 0) {
      const relevantExample = examples.find(ex => {
        const exampleBelief = ex.reasoning.match(/(\d+)%/);
        return exampleBelief && Math.abs(parseInt(exampleBelief[1]) / 100 - posteriorBelief) < 0.2;
      });
      
      if (relevantExample) {
        conclusion = relevantExample.output;
        reasoning.push(`Using similar example with belief level of ${relevantExample.reasoning}`);
      }
    }
    
    return { 
      conclusion, 
      confidence: posteriorBelief, 
      reasoning
    };
  }
  
  /**
   * Apply pattern recognition
   * Identifies recurring patterns in data
   */
  private applyPatternRecognition(
    rules: any[],
    situation: Record<string, any>,
    knowledge: AIKnowledgeBase[],
    examples: any[]
  ): { conclusion: string; confidence: number; reasoning: string[] } {
    const reasoning: string[] = [];
    
    // Extract patterns and current situation
    const patterns = situation.patterns || [];
    const currentSituation = situation.current || {};
    
    reasoning.push(`Analyzing ${patterns.length} historical patterns`);
    
    // Calculate pattern matches
    const patternMatches = patterns.map(pattern => ({
      pattern,
      matchScore: this.calculatePatternMatch(pattern, currentSituation)
    }));
    
    // Sort by match score
    patternMatches.sort((a, b) => b.matchScore - a.matchScore);
    
    let confidence = 0.3; // Base confidence
    let conclusion = "No strong patterns detected";
    
    if (patternMatches.length > 0) {
      const bestMatch = patternMatches[0];
      
      reasoning.push(`Best pattern match: ${(bestMatch.matchScore * 100).toFixed(0)}% similarity`);
      
      if (bestMatch.matchScore > 0.8) {
        // Strong pattern match
        conclusion = `Strong pattern match: ${bestMatch.pattern.name}`;
        confidence = 0.7 + (bestMatch.matchScore - 0.8) * 1.5; // Scale 0.8-1.0 to 0.7-1.0
        reasoning.push("High confidence due to strong pattern match");
      } else if (bestMatch.matchScore > 0.5) {
        // Moderate pattern match
        conclusion = `Moderate pattern match: ${bestMatch.pattern.name}`;
        confidence = 0.4 + (bestMatch.matchScore - 0.5) * 1.0; // Scale 0.5-0.8 to 0.4-0.7
        reasoning.push("Moderate confidence due to partial pattern match");
      } else if (bestMatch.matchScore > 0.3) {
        // Weak pattern match
        conclusion = `Weak pattern match: ${bestMatch.pattern.name}`;
        confidence = 0.3 + bestMatch.matchScore * 0.3; // Scale 0.3-0.5 to 0.3-0.45
        reasoning.push("Low confidence due to weak pattern match");
      }
    }
    
    // Use examples for refinement
    if (examples.length > 0) {
      const bestExample = examples[0]; // Simplified selection
      if (bestExample) {
        conclusion = bestExample.output;
        confidence += 0.1;
        reasoning.push("Refining based on example case");
      }
    }
    
    // Incorporate knowledge
    if (knowledge.length > 0) {
      reasoning.push(`Supplementing with ${knowledge.length} knowledge items`);
      confidence += Math.min(knowledge.length * 0.05, 0.2);
    }
    
    // Cap confidence
    confidence = Math.min(confidence, 1.0);
    
    return { conclusion, confidence, reasoning };
  }
  
  /**
   * Default reasoning when no specific pattern applies
   */
  private applyDefaultReasoning(
    patternText: string,
    situation: Record<string, any>,
    knowledge: AIKnowledgeBase[]
  ): { conclusion: string; confidence: number; reasoning: string[] } {
    const reasoning: string[] = [];
    
    reasoning.push("Using general reasoning approach");
    reasoning.push(`Pattern: ${patternText}`);
    
    // Extract key situation elements
    const situationKeys = Object.keys(situation);
    reasoning.push(`Situation contains: ${situationKeys.join(', ')}`);
    
    // Use knowledge as basis for conclusion
    let conclusion = "Based on available information";
    let confidence = 0.4; // Modest confidence for default reasoning
    
    if (knowledge.length > 0) {
      reasoning.push(`Incorporating ${knowledge.length} knowledge entries`);
      conclusion = `Based on ${knowledge.length} relevant knowledge entries`;
      confidence += Math.min(knowledge.length * 0.05, 0.3);
    }
    
    return { conclusion, confidence, reasoning };
  }
  
  // Helper methods
  
  /**
   * Check if a rule condition applies to current situation
   */
  private checkRuleCondition(rule: string, situation: Record<string, any>): boolean {
    // Simplified rule checking - check if key terms in the rule appear in the situation
    const ruleLower = rule.toLowerCase();
    const situationStr = JSON.stringify(situation).toLowerCase();
    
    // Extract key terms (words inside brackets)
    const keyTerms = (ruleLower.match(/\[([^\]]+)\]/g) || [])
      .map(term => term.replace(/[\[\]]/g, '').toLowerCase());
    
    // Check if all key terms are present in the situation
    return keyTerms.every(term => situationStr.includes(term));
  }
  
  /**
   * Calculate similarity between two objects
   */
  private calculateSimilarity(obj1: any, obj2: any): number {
    // Convert objects to string for simple comparison
    const str1 = typeof obj1 === 'string' ? obj1 : JSON.stringify(obj1);
    const str2 = typeof obj2 === 'string' ? obj2 : JSON.stringify(obj2);
    
    // Simple Jaccard similarity of words
    const words1 = new Set(str1.toLowerCase().split(/\W+/).filter(Boolean));
    const words2 = new Set(str2.toLowerCase().split(/\W+/).filter(Boolean));
    
    const intersection = new Set([...words1].filter(word => words2.has(word)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
  
  /**
   * Calculate how well a pattern matches a situation
   */
  private calculatePatternMatch(pattern: any, situation: any): number {
    // Extract key characteristics from pattern
    const patternCharacteristics = pattern.characteristics || [];
    const situationStr = JSON.stringify(situation).toLowerCase();
    
    // Count matching characteristics
    let matches = 0;
    for (const characteristic of patternCharacteristics) {
      if (typeof characteristic === 'string' && 
          situationStr.includes(characteristic.toLowerCase())) {
        matches++;
      }
    }
    
    return patternCharacteristics.length > 0 
      ? matches / patternCharacteristics.length 
      : 0;
  }
  
  /**
   * Update belief strength using simplified Bayesian formula
   */
  private updateBeliefStrength(currentBelief: number, evidenceStrength: number): number {
    // Simple bounded adjustment that maintains belief between 0 and 1
    let newBelief = currentBelief + evidenceStrength;
    
    // Apply bounds
    newBelief = Math.max(0.01, Math.min(0.99, newBelief));
    
    return newBelief;
  }
}

export const reasoningEngine = new ReasoningEngine();
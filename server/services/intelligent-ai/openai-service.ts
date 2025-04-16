import { storage } from '../../storage';
import { AIKnowledgeBase, AIReasoning, AISystemTask, User } from '../../../shared/schema';
import axios from 'axios';

// OpenAI API configuration
const DEFAULT_MODEL = 'gpt-4';
const DEFAULT_VISION_MODEL = 'gpt-4-vision-preview';
const MAX_TOKENS = 2000;
const TEMPERATURE = 0.7;

/**
 * OpenAI Service
 * 
 * This service provides integration with OpenAI APIs for:
 * - Enhanced AI responses based on knowledge base
 * - Document analysis using Vision API
 * - Face matching and verification
 * - Knowledge generation for gaps
 */
export class OpenAIService {
  private apiKey: string | null = null;
  private apiEndpoint = 'https://api.openai.com/v1/chat/completions';
  private lastConfigCheck: Date = new Date(0); // Initialize to epoch
  private configCheckInterval = 5 * 60 * 1000; // 5 minutes
  private apiAvailable: boolean = false; // Track if OpenAI API is available
  
  /**
   * Check if OpenAI integration is configured and ready
   */
  isReady(): boolean {
    // If apiKey is null, try to get it
    if (!this.apiKey) {
      this.refreshApiConfig();
    }
    
    return this.apiAvailable;
  }
  
  /**
   * Check if OpenAI API key is needed
   * Returns true if API key is not configured and would be useful
   */
  isApiKeyNeeded(): boolean {
    return !this.apiAvailable;
  }
  
  /**
   * Get a fallback response when OpenAI is not available
   * This allows the system to continue functioning with limited capabilities
   */
  async getFallbackResponse(prompt: string, context: string = ''): Promise<string> {
    console.log('Using fallback response mechanism (OpenAI unavailable)');
    
    // Simple keyword matching for basic responses
    const lowercasePrompt = prompt.toLowerCase();
    
    // Context-specific responses
    if (context === 'kyc') {
      // KYC-specific fallbacks when context is explicitly KYC
      if (lowercasePrompt.includes('upload') || 
          lowercasePrompt.includes('submit') || 
          lowercasePrompt.includes('how')) {
        return "To complete your KYC verification, you'll need to upload a valid government-issued ID (passport, driver's license, or national ID card) and a selfie for facial verification. I can help you submit these documents now.";
      }
      
      if (lowercasePrompt.includes('status') || 
          lowercasePrompt.includes('approved') || 
          lowercasePrompt.includes('rejected')) {
        return "I can check your KYC verification status for you. Let me look that up based on your account information.";
      }
      
      // Generic KYC response for other KYC-related questions
      return "KYC verification requires government-issued ID documents and a selfie. Would you like to start the verification process now, or check your current status?";
    }
    
    // General contextual fallbacks (when no specific context provided)
    
    // KYC related fallbacks
    if (lowercasePrompt.includes('kyc') || 
        lowercasePrompt.includes('verification') || 
        lowercasePrompt.includes('identity') || 
        lowercasePrompt.includes('document')) {
        
      if (lowercasePrompt.includes('upload') || 
          lowercasePrompt.includes('submit') || 
          lowercasePrompt.includes('how')) {
        return "To complete your KYC verification, you'll need to upload a valid government-issued ID (passport, driver's license, or national ID card) and a selfie for facial verification. Would you like me to guide you through uploading these documents now?";
      }
      
      if (lowercasePrompt.includes('status') || 
          lowercasePrompt.includes('approved') || 
          lowercasePrompt.includes('rejected')) {
        return "I can check your KYC verification status for you. Let me look that up based on your user information.";
      }
      
      // General KYC fallback
      return "KYC (Know Your Customer) verification is required to access certain platform features. This process involves verifying your identity using government-issued ID documents. Would you like information about the KYC process or help submitting your verification documents?";
    }
    
    // Blockchain and token related fallbacks
    if (lowercasePrompt.includes('token') || 
        lowercasePrompt.includes('blockchain') || 
        lowercasePrompt.includes('mining') || 
        lowercasePrompt.includes('crypto')) {
      return "The TSK platform utilizes blockchain technology and its native token for various platform features. While I have limited information available at the moment, I can help with basic questions about tokens, mining, and blockchain functionality on the platform.";
    }
    
    // Platform features fallbacks
    if (lowercasePrompt.includes('feature') || 
        lowercasePrompt.includes('function') || 
        lowercasePrompt.includes('capability') || 
        lowercasePrompt.includes('what can')) {
      return "The TSK platform offers features including AI-powered knowledge management, blockchain integration, secure KYC verification, and more. While I'm operating with limited capabilities at the moment, I can still provide basic information about platform features.";
    }
    
    // Generic greetings
    if (lowercasePrompt.includes('hello') || 
        lowercasePrompt.includes('hi ') || 
        lowercasePrompt.includes('hey')) {
      return "Hello! I'm the TSK platform assistant. While I'm operating with limited capabilities at the moment, I'm still here to help. What can I assist you with today?";
    }
    
    if (lowercasePrompt.includes('thank')) {
      return "You're welcome! Is there anything else I can help you with today?";
    }
    
    // Default response
    return "I'm currently operating with limited capabilities. For more detailed assistance, please try again later when our advanced AI services are available. In the meantime, I can help with basic platform information and KYC verification assistance.";
  }
  
  /**
   * Refresh the API configuration from the database or environment
   */
  private async refreshApiConfig(): Promise<void> {
    const now = new Date();
    
    // Only check if it's been more than the interval since last check
    if (now.getTime() - this.lastConfigCheck.getTime() < this.configCheckInterval) {
      return;
    }
    
    this.lastConfigCheck = now;
    
    try {
      // Try to get from system settings first
      const settings = await storage.getSystemSettings();
      
      if (settings && settings.openaiApiKey) {
        this.apiKey = settings.openaiApiKey;
        this.apiAvailable = true;
        console.log("OpenAI API key loaded from system settings");
        return;
      }
      
      // Fall back to environment variable
      if (process.env.OPENAI_API_KEY) {
        this.apiKey = process.env.OPENAI_API_KEY;
        this.apiAvailable = true;
        console.log("OpenAI API key loaded from environment variable");
        return;
      }
      
      // No API key found
      this.apiKey = null;
      this.apiAvailable = false;
      console.log("No OpenAI API key found. Some AI functions will be limited.");
    } catch (error) {
      console.error("Error refreshing OpenAI API config:", error);
      this.apiKey = null;
      this.apiAvailable = false;
    }
  }
  
  /**
   * Analyze feedback to identify knowledge gaps and improvement opportunities
   */
  async analyzeFeedback(feedbackData: {
    question: string;
    answer: string;
    rating: number;
    comment?: string;
    detectedIssues?: string[];
  }): Promise<{
    analysisResult: string;
    newKnowledge?: any;
    knowledgeCategory?: string;
    suggestedImprovement?: string;
    improvedReasoning?: {
      rules: string[];
      examples: string[];
    }
  }> {
    if (!this.apiKey) {
      await this.refreshApiConfig();
      if (!this.apiKey) {
        // Return simple analysis for fallback mode
        return {
          analysisResult: "Limited analysis available: The feedback indicates potential improvements needed.",
          knowledgeCategory: feedbackData.question.toLowerCase().includes('token') ? 'token' : 'platform'
        };
      }
    }
    
    try {
      // Build a detailed prompt for OpenAI to analyze the feedback
      const prompt = `Analyze this user feedback on an AI response:
      
Question: "${feedbackData.question}"
AI Response: "${feedbackData.answer}"
Rating: ${feedbackData.rating}/5
${feedbackData.comment ? `User Comment: "${feedbackData.comment}"` : 'No user comment provided'}
${feedbackData.detectedIssues && feedbackData.detectedIssues.length > 0 ? 
  `Detected potential issues: ${feedbackData.detectedIssues.join(', ')}` : ''}

Please analyze this feedback and provide:
1. A concise analysis of what might have gone wrong (or right) with the response
2. The category this knowledge belongs to (platform, token, mining, marketplace, general, etc.)
3. If the rating is below 4, suggest a new knowledge entry in this format:
   - topic: [main topic]
   - subtopic: [specific aspect]
   - information: [comprehensive answer or explanation]
   - category: [appropriate category]
   - confidence: [number between 70-90]
4. Suggestions for how to improve responses to similar questions
5. If reasoning issues were detected, provide improved reasoning rules and examples

FORMAT YOUR RESPONSE USING THIS JSON STRUCTURE:
{
  "analysisResult": "brief analysis of the feedback",
  "knowledgeCategory": "most appropriate category",
  "newKnowledge": {
    "topic": "main topic",
    "subtopic": "specific aspect",
    "information": "comprehensive information",
    "category": "appropriate category",
    "confidence": 80
  },
  "suggestedImprovement": "how to improve similar responses",
  "improvedReasoning": {
    "rules": ["rule 1", "rule 2"],
    "examples": ["example 1", "example 2"]
  }
}`;
      
      // Make request to OpenAI
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: 'You are an AI analysis assistant that helps improve knowledge systems.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: MAX_TOKENS,
          temperature: 0.3 // Lower temperature for more consistent analysis
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const responseText = response.data.choices[0].message.content.trim();
      
      // Parse the JSON response
      try {
        // Find JSON content (may be wrapped in ```json or just regular JSON)
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                          [null, responseText];
                          
        const jsonContent = jsonMatch ? jsonMatch[1] : responseText;
        const analysisData = JSON.parse(jsonContent);
        
        return {
          analysisResult: analysisData.analysisResult || "Analysis not provided",
          newKnowledge: analysisData.newKnowledge,
          knowledgeCategory: analysisData.knowledgeCategory,
          suggestedImprovement: analysisData.suggestedImprovement,
          improvedReasoning: analysisData.improvedReasoning
        };
      } catch (parseError) {
        console.error('Error parsing OpenAI analysis response:', parseError);
        // Fallback to returning the raw text if JSON parsing fails
        return {
          analysisResult: "Error parsing analysis. Raw response: " + responseText.substring(0, 200) + "...",
          knowledgeCategory: feedbackData.question.toLowerCase().includes('token') ? 'token' : 'platform'
        };
      }
    } catch (error) {
      console.error('Error analyzing feedback with OpenAI:', error);
      // Return minimal analysis as fallback
      return {
        analysisResult: "Error performing feedback analysis",
        knowledgeCategory: 'platform'
      };
    }
  }
  
  /**
   * Analyze platform content to generate knowledge entries
   */
  async analyzePlatformContent(content: {
    type: string;
    title: string;
    content: string;
    section?: string;
  }): Promise<{
    success: boolean;
    knowledgeEntries?: any[];
    error?: string;
  }> {
    if (!this.apiKey) {
      await this.refreshApiConfig();
      if (!this.apiKey) {
        return {
          success: false,
          error: "OpenAI API not available for content analysis"
        };
      }
    }
    
    try {
      // Build a specialized prompt for content analysis
      const prompt = `Analyze this ${content.type} content from the TSK platform and generate comprehensive knowledge entries:
      
Title: ${content.title}
${content.section ? `Section: ${content.section}` : ''}
Content:
${content.content.substring(0, 4000)} ${content.content.length > 4000 ? '... (content truncated)' : ''}

Extract 3-5 key pieces of knowledge from this content. For each piece:
1. Identify the main topic
2. Create a specific subtopic
3. Write comprehensive information that captures the essence
4. Assign a confidence score (70-95)

FORMAT YOUR RESPONSE AS JSON:
{
  "knowledgeEntries": [
    {
      "topic": "main topic",
      "subtopic": "specific aspect",
      "information": "comprehensive information",
      "category": "${content.type}",
      "confidence": 85
    },
    { ... }
  ]
}`;
      
      // Make request to OpenAI
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: DEFAULT_MODEL,
          messages: [
            { role: 'system', content: 'You are an AI knowledge extraction system that helps build knowledge bases from content.' },
            { role: 'user', content: prompt }
          ],
          max_tokens: MAX_TOKENS,
          temperature: 0.4
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const responseText = response.data.choices[0].message.content.trim();
      
      // Parse the JSON response
      try {
        // Find JSON content (may be wrapped in code blocks)
        const jsonMatch = responseText.match(/```json\s*([\s\S]*?)\s*```/) || 
                          responseText.match(/```\s*([\s\S]*?)\s*```/) ||
                          [null, responseText];
                          
        const jsonContent = jsonMatch ? jsonMatch[1] : responseText;
        const analysisData = JSON.parse(jsonContent);
        
        if (analysisData.knowledgeEntries && Array.isArray(analysisData.knowledgeEntries)) {
          // Add metadata and timestamps to each entry
          const enrichedEntries = analysisData.knowledgeEntries.map((entry: any) => ({
            ...entry,
            createdAt: new Date(),
            source: 'ai_content_analysis',
            metadata: {
              contentType: content.type,
              contentTitle: content.title,
              analysisDate: new Date().toISOString()
            }
          }));
          
          return {
            success: true,
            knowledgeEntries: enrichedEntries
          };
        } else {
          return {
            success: false,
            error: "No knowledge entries found in analysis"
          };
        }
      } catch (parseError) {
        console.error('Error parsing OpenAI content analysis response:', parseError);
        return {
          success: false,
          error: "Error parsing analysis response"
        };
      }
    } catch (error) {
      console.error('Error analyzing platform content with OpenAI:', error);
      return {
        success: false,
        error: "Error performing content analysis"
      };
    }
  }
  
  async answerQuestion(
    question: string,
    knowledgeEntries: AIKnowledgeBase[],
    reasoningPatterns: AIReasoning[],
    userId: number,
    conversationHistory: any[] = []
  ): Promise<{ 
    answer: string; 
    confidence: number; 
    sources: AIKnowledgeBase[];
    newKnowledge?: AIKnowledgeBase; 
  }> {
    if (!this.apiKey) {
      await this.refreshApiConfig();
      if (!this.apiKey) {
        // Use fallback response mechanism when OpenAI is not available
        const fallbackAnswer = await this.getFallbackResponse(question);
        return {
          answer: fallbackAnswer,
          confidence: 0.5, // Medium confidence for fallback responses
          sources: knowledgeEntries.slice(0, 2),
          newKnowledge: undefined
        };
      }
    }
    
    try {
      // Sort knowledge entries by confidence
      knowledgeEntries.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));
      
      // Select the most relevant knowledge entries (limit to avoid token overflows)
      const relevantKnowledge = knowledgeEntries.slice(0, 5);
      
      // Select a reasoning pattern
      const pattern = reasoningPatterns.length > 0 ? 
        reasoningPatterns.sort((a, b) => (b.priority || 0) - (a.priority || 0))[0] :
        null;
      
      // Format conversation history for context
      const formattedHistory = conversationHistory.map(msg => ({
        role: msg.role || (msg.question ? 'user' : 'assistant'),
        content: msg.question || msg.answer || msg.content
      }));
      
      // Get user information for personalization
      const user = await storage.getUser(userId);
      
      // Build system prompt
      let systemPrompt = `You are an AI assistant for the TSK platform. You provide accurate, helpful information based on available knowledge.
      
The current user is ${user?.username || 'Anonymous'} (User ID: ${userId}).

Answer the question based on the following knowledge entries:
${relevantKnowledge.map(k => `
TOPIC: ${k.topic}
SUBTOPIC: ${k.subtopic}
INFORMATION: ${k.information}
CONFIDENCE: ${k.confidence || 70}%
---`).join('\n')}

${pattern ? `REASONING PATTERN: ${pattern.pattern}
RULES: ${pattern.rules ? pattern.rules.join('\n- ') : 'Be concise and accurate.'}
` : ''}

If you don't have enough information to answer the question:
1. Acknowledge that you don't have complete information
2. Provide whatever relevant information you do have
3. Suggest what additional information might be needed

Only mention your knowledge sources if explicitly asked. Keep responses concise but thorough.`;

      // Check for knowledge gaps - should we create new knowledge?
      const shouldCreateKnowledge = knowledgeEntries.length < 2 || 
        knowledgeEntries.every(k => k.confidence && k.confidence < 70);
      
      if (shouldCreateKnowledge) {
        systemPrompt += `\n\nThe knowledge base seems to be missing information for this question. After answering, provide a new knowledge entry that would help answer similar questions in the future. Format the new knowledge entry like this:
TOPIC: [main subject]
SUBTOPIC: [specific aspect]
CATEGORY: [general category]
INFORMATION: [comprehensive, factual answer]
CONFIDENCE: [a number between 70-95 based on certainty]`;
      }
      
      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt }
      ];
      
      // Add conversation history for context (limit to recent history)
      if (formattedHistory && formattedHistory.length > 0) {
        messages.push(...formattedHistory.slice(-3));
      }
      
      // Add the current question
      messages.push({ role: 'user', content: question });
      
      // Make request to OpenAI
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: DEFAULT_MODEL,
          messages,
          max_tokens: MAX_TOKENS,
          temperature: TEMPERATURE
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const aiResponse = response.data.choices[0].message.content.trim();
      
      // Extract new knowledge entry if one was generated
      let newKnowledge: AIKnowledgeBase | undefined;
      
      if (shouldCreateKnowledge && aiResponse.includes('TOPIC:') && aiResponse.includes('INFORMATION:')) {
        try {
          const knowledgeSection = aiResponse.split('TOPIC:')[1];
          const topic = knowledgeSection.split('SUBTOPIC:')[0].trim();
          const subtopic = knowledgeSection.split('SUBTOPIC:')[1].split('CATEGORY:')[0].trim();
          const category = knowledgeSection.split('CATEGORY:')[1].split('INFORMATION:')[0].trim();
          const information = knowledgeSection.split('INFORMATION:')[1].split('CONFIDENCE:')[0].trim();
          const confidenceText = knowledgeSection.split('CONFIDENCE:')[1];
          const confidence = parseInt(confidenceText.match(/\d+/)?.[0] || '75');
          
          newKnowledge = {
            topic,
            subtopic,
            category,
            information,
            confidence,
            createdBy: null,
            createdAt: new Date(),
            metadata: { generatedBy: 'openai' }
          };
          
          console.log('Generated new knowledge entry:', newKnowledge);
        } catch (error) {
          console.error('Error parsing generated knowledge:', error);
        }
      }
      
      // Clean the response if it contains knowledge entry format
      const cleanedResponse = aiResponse.split('TOPIC:')[0].trim();
      
      // Calculate confidence based on the source knowledge
      const baseConfidence = newKnowledge ? 
        newKnowledge.confidence / 100 : 
        relevantKnowledge[0]?.confidence ? relevantKnowledge[0].confidence / 100 : 0.7;
      
      return {
        answer: cleanedResponse,
        confidence: baseConfidence,
        sources: relevantKnowledge,
        newKnowledge
      };
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw error;
    }
  }
  
  /**
   * Generate a KYC-specific response using OpenAI
   */
  async generateKYCResponse(
    message: string,
    knowledgeEntries: AIKnowledgeBase[],
    user: User,
    kycStatus: any
  ): Promise<{ response: string; action?: any }> {
    if (!this.apiKey) {
      await this.refreshApiConfig();
      if (!this.apiKey) {
        // Use fallback response mechanism when OpenAI is not available
        const lowercaseMessage = message.toLowerCase();
        let action = null;
        
        // Simple heuristic for KYC-related intents
        if (lowercaseMessage.includes('upload') || 
            lowercaseMessage.includes('submit') || 
            lowercaseMessage.includes('verify') || 
            lowercaseMessage.includes('document') ||
            lowercaseMessage.includes('id card') ||
            lowercaseMessage.includes('passport')) {
          action = {
            type: 'upload_document',
            data: {
              documentTypes: ['passport', 'drivers_license', 'national_id', 'residence_permit']
            }
          };
        } else if (lowercaseMessage.includes('status') || 
                 lowercaseMessage.includes('progress') || 
                 lowercaseMessage.includes('approved')) {
          action = {
            type: 'review_status',
            data: {}
          };
        }
        
        const fallbackResponse = await this.getFallbackResponse(message, 'kyc');
        return {
          response: fallbackResponse,
          action: action
        };
      }
    }
    
    try {
      // Analyze user intent first to determine if document upload is needed
      const lowercaseMessage = message.toLowerCase();
      const isUploadIntent = (
        lowercaseMessage.includes('upload') || 
        lowercaseMessage.includes('submit') || 
        lowercaseMessage.includes('verify') || 
        lowercaseMessage.includes('document') ||
        lowercaseMessage.includes('passport') || 
        lowercaseMessage.includes('id card') ||
        lowercaseMessage.includes('selfie') ||
        lowercaseMessage.includes('how do i')
      );
      
      // Build system prompt
      let systemPrompt = `You are an AI assistant specializing in KYC verification processes for the TSK platform. 
      
The current user is ${user.username} (User ID: ${user.id}).
Current KYC status: ${kycStatus ? kycStatus.status : 'not started'}
${kycStatus && kycStatus.rejectionReason ? `Rejection reason: ${kycStatus.rejectionReason}` : ''}

Use the following knowledge to help the user with KYC verification:
${knowledgeEntries.map(k => `
TOPIC: ${k.topic}
SUBTOPIC: ${k.subtopic}
INFORMATION: ${k.information}
---`).join('\n')}

Your goal is to help users understand the KYC verification process and guide them through document submission.

Important guidelines:
1. If the user is asking about their status, provide information about their current KYC status
2. If the user is asking about submitting documents, guide them to upload the required documents
3. If the user's verification was rejected, explain the reason and help them submit new documents
4. Be professional, helpful, and security-conscious

Document Types:
- Passport: An official international travel document
- Drivers License: Government-issued driving permit with photo identification
- National ID: Official government-issued identification card
- Residence Permit: Document proving legal residence in a country

Requirements for documents:
- Must be valid and not expired
- Photo/image must be clear and legible
- All text should be visible
- Document should show the complete ID without cutoffs

At the end of your response, include a JSON object with the following structure:
{
  "requiresAction": true/false,
  "actionType": "status_check" | "upload_document" | "none",
  "documentTypes": ["passport", "drivers_license", "national_id"] (only if actionType is upload_document)
}`;
      
      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ];
      
      // If user has pending/rejected status, add context about that
      if (kycStatus && (kycStatus.status === 'pending' || kycStatus.status === 'rejected')) {
        messages.push({
          role: 'system',
          content: `Important context: This user already has a ${kycStatus.status} KYC submission. ${
            kycStatus.status === 'rejected' ? 
            `It was rejected for the following reason: ${kycStatus.rejectionReason || 'Not specified'}` : 
            'It is currently under review.'
          }`
        });
      }
      
      // Make request to OpenAI
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: DEFAULT_MODEL,
          messages,
          max_tokens: MAX_TOKENS,
          temperature: 0.5 // Lower temperature for more factual responses
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const aiResponse = response.data.choices[0].message.content.trim();
      
      // Try to extract the JSON action from the response
      try {
        // Look for a JSON block in the response
        const jsonMatch = aiResponse.match(/\{[\s\S]*"requiresAction"[\s\S]*\}/);
        let action = null;
        
        if (jsonMatch) {
          // Extract and parse the JSON
          const jsonStr = jsonMatch[0];
          const actionData = JSON.parse(jsonStr);
          
          // Clean up the main response by removing the JSON block
          const cleanResponse = aiResponse.replace(jsonStr, '').trim();
          
          // Process the action based on the action type
          if (actionData.requiresAction && actionData.actionType === "upload_document") {
            // Handle document upload action
            let documentTypes = actionData.documentTypes || 
              ['passport', 'drivers_license', 'national_id', 'residence_permit'];
            
            return {
              response: cleanResponse,
              action: {
                type: 'upload_document',
                data: {
                  documentTypes: documentTypes
                }
              }
            };
          } else if (actionData.requiresAction && actionData.actionType === "status_check") {
            // Handle status check action
            return {
              response: cleanResponse,
              action: {
                type: 'review_status',
                data: {}
              }
            };
          }
          
          // Return clean response if JSON was found but no action needed
          return { response: cleanResponse };
        }
      } catch (jsonError) {
        console.log('Could not parse JSON from response, falling back to heuristic detection');
        // Continue with heuristic detection if JSON parsing fails
      }
      
      // Fallback: Check if we should trigger a document upload action based on keywords
      const lowercaseResponse = aiResponse.toLowerCase();
      const isSuggestingUpload = 
        lowercaseResponse.includes('upload') || 
        lowercaseResponse.includes('submit') || 
        lowercaseResponse.includes('provide your document') ||
        lowercaseResponse.includes('verify your identity') ||
        lowercaseResponse.includes('need to verify');
      
      // Determine which documents to suggest based on the response context
      let documentTypes = ['passport', 'drivers_license', 'national_id', 'residence_permit'];
      
      if (isSuggestingUpload) {
        if (lowercaseResponse.includes('passport')) {
          documentTypes = ['passport'];
        } else if (lowercaseResponse.includes('driver') || lowercaseResponse.includes('license')) {
          documentTypes = ['drivers_license'];
        } else if (lowercaseResponse.includes('national') || lowercaseResponse.includes('id card')) {
          documentTypes = ['national_id'];
        }
        
        return {
          response: aiResponse,
          action: {
            type: 'upload_document',
            data: {
              documentTypes: documentTypes
            }
          }
        };
      }
      
      // Check if it's a status check request
      const isStatusCheck = 
        lowercaseResponse.includes('status') && 
        (lowercaseResponse.includes('verification') || lowercaseResponse.includes('kyc'));
        
      if (isStatusCheck) {
        return {
          response: aiResponse,
          action: {
            type: 'review_status',
            data: {}
          }
        };
      }
      
      return { response: aiResponse };
    } catch (error) {
      console.error('Error calling OpenAI API for KYC response:', error);
      throw error;
    }
  }
  
  /**
   * Analyze a document using OpenAI's Vision API
   */
  async analyzeDocument(documentUrl: string, documentType: string): Promise<any> {
    if (!this.apiKey) {
      await this.refreshApiConfig();
      if (!this.apiKey) {
        // Return limited fallback document analysis
        console.log('Using fallback document analysis (OpenAI unavailable)');
        return {
          isValid: false,
          isExpired: false,
          documentType: documentType,
          extractedData: {},
          validationNotes: "Document verification requires the OpenAI API to be configured. Basic document validation will be performed by a human reviewer.",
          errorMessage: "Advanced AI document analysis is currently unavailable. Your document will be reviewed manually."
        };
      }
    }
    
    try {
      // Build system prompt based on document type
      let systemPrompt = `You are an expert document verification system analyzing a ${documentType.replace('_', ' ')}. 
      
Analyze this document with attention to:
1. Document authenticity - check for signs of tampering, inconsistencies, or forgery
2. Expiration status - check if the document is valid/not expired
3. Data extraction - extract relevant identity information (name, DOB, document number)
4. Document type confirmation - verify this is actually a ${documentType.replace('_', ' ')}

Return a structured analysis with these sections:
- isValid: true/false overall assessment
- isExpired: true/false expiration status
- documentType: confirmed document type
- extractedData: key identity information
- validationNotes: reasoning behind your assessment`;

      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: 'Analyze this identification document:' },
            { type: 'image_url', image_url: { url: documentUrl } }
          ]
        }
      ];
      
      // Make request to OpenAI Vision API
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: DEFAULT_VISION_MODEL,
          messages,
          max_tokens: MAX_TOKENS,
          temperature: 0.2 // Very low temperature for factual analysis
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const analysisText = response.data.choices[0].message.content.trim();
      
      // Parse the structured analysis
      // Note: In a production system, you would want more robust parsing
      try {
        // Simple regex-based parsing for demonstration
        const isValid = /isValid:\s*(true|false)/i.test(analysisText) ? 
          /isValid:\s*true/i.test(analysisText) : null;
          
        const isExpired = /isExpired:\s*(true|false)/i.test(analysisText) ? 
          /isExpired:\s*true/i.test(analysisText) : null;
          
        const extractedDocumentType = /documentType:\s*([^\n]+)/i.exec(analysisText)?.[1] || null;
        
        const extractedDataMatch = /extractedData:\s*([^\n]+)/.exec(analysisText);
        let extractedData = {};
        
        if (extractedDataMatch) {
          const dataText = analysisText.slice(extractedDataMatch.index + extractedDataMatch[0].length);
          const dataLines = dataText.split(/\n\s*-/);
          
          for (const line of dataLines) {
            const keyValue = line.split(/:\s*/);
            if (keyValue.length === 2) {
              const key = keyValue[0].trim().replace(/^-\s*/, '');
              extractedData[key] = keyValue[1].trim();
            }
          }
        }
        
        const validationNotes = /validationNotes:\s*([^\n]+)/i.exec(analysisText)?.[1] || '';
        
        return {
          isValid: isValid !== null ? isValid : false,
          isExpired: isExpired !== null ? isExpired : true,
          documentType: extractedDocumentType || documentType,
          extractedData,
          validationNotes,
          rawAnalysis: analysisText
        };
      } catch (parseError) {
        console.error('Error parsing document analysis:', parseError);
        return {
          isValid: false,
          validationNotes: 'Error processing document analysis',
          rawAnalysis: analysisText
        };
      }
    } catch (error) {
      console.error('Error calling OpenAI Vision API:', error);
      throw error;
    }
  }
  
  /**
   * Compare faces in a document and selfie
   */
  async compareFaces(documentUrl: string, selfieUrl: string): Promise<any> {
    if (!this.apiKey) {
      await this.refreshApiConfig();
      if (!this.apiKey) {
        // Return limited fallback face comparison result
        console.log('Using fallback face comparison (OpenAI unavailable)');
        return {
          isMatch: false, // Conservatively assume no match without AI verification
          confidenceScore: 0,
          reasoningNotes: "Face matching requires the OpenAI API to be configured. Manual verification will be performed by a human reviewer.",
          potentialIssues: "Automated facial verification is unavailable. Your submission will be reviewed manually by our team.",
          errorMessage: "Advanced AI facial comparison is currently unavailable. Your submission will be reviewed manually."
        };
      }
    }
    
    try {
      // Build system prompt
      const systemPrompt = `You are an expert facial recognition system comparing a face in an ID document with a selfie.
      
Your task is to determine if the same person appears in both images by analyzing facial features, structural similarities, and distinctive characteristics.

Focus on these key aspects:
1. Facial structure (bone structure, face shape)
2. Eye characteristics (shape, distance)
3. Nose and mouth structure
4. Overall appearance accounting for aging, lighting, and angle differences

Return a structured analysis with:
- isMatch: true/false overall assessment
- confidenceScore: a percentage (0-100) of your confidence
- reasoningNotes: detailed justification for your decision
- potentialIssues: any concerns that could affect verification`;

      // Build messages array
      const messages = [
        { role: 'system', content: systemPrompt },
        { 
          role: 'user', 
          content: [
            { type: 'text', text: 'Compare these two images:' },
            { type: 'image_url', image_url: { url: documentUrl } },
            { type: 'text', text: 'And this selfie:' },
            { type: 'image_url', image_url: { url: selfieUrl } }
          ]
        }
      ];
      
      // Make request to OpenAI Vision API
      const response = await axios.post(
        this.apiEndpoint,
        {
          model: DEFAULT_VISION_MODEL,
          messages,
          max_tokens: MAX_TOKENS,
          temperature: 0.2 // Very low temperature for factual analysis
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.apiKey}`
          }
        }
      );
      
      const analysisText = response.data.choices[0].message.content.trim();
      
      // Parse the structured analysis
      try {
        const isMatch = /isMatch:\s*(true|false)/i.test(analysisText) ? 
          /isMatch:\s*true/i.test(analysisText) : false;
          
        const confidenceMatch = /confidenceScore:\s*(\d+)/i.exec(analysisText);
        const confidenceScore = confidenceMatch ? parseInt(confidenceMatch[1]) : 0;
          
        const reasoningNotes = /reasoningNotes:\s*([^\n]+)/i.exec(analysisText)?.[1] || '';
        const potentialIssues = /potentialIssues:\s*([^\n]+)/i.exec(analysisText)?.[1] || '';
        
        return {
          isMatch,
          confidenceScore,
          reasoningNotes,
          potentialIssues,
          rawAnalysis: analysisText
        };
      } catch (parseError) {
        console.error('Error parsing face comparison analysis:', parseError);
        return {
          isMatch: false,
          confidenceScore: 0,
          reasoningNotes: 'Error processing facial comparison',
          rawAnalysis: analysisText
        };
      }
    } catch (error) {
      console.error('Error calling OpenAI Vision API for face comparison:', error);
      throw error;
    }
  }
}

// Export a singleton instance
export const openAIService = new OpenAIService();
import { storage } from '../../storage';
import { AIKnowledgeBase, User } from '../../../shared/schema';
import { openAIService } from './openai-service';

/**
 * KYC Assistant Service
 * 
 * This service provides AI-powered KYC verification functionality:
 * - Analyzes identification documents using AI vision
 * - Validates document authenticity and expiration
 * - Performs facial recognition and liveness detection
 * - Extracts and verifies document information
 * - Provides conversational KYC submission interface
 */
export class KYCAssistantService {
  /**
   * Handle a KYC-related message from a user
   * Determines the appropriate action based on the message
   */
  async handleKYCMessage(message: string, userId: number): Promise<{ response: string; action?: any }> {
    console.log(`Processing KYC message: ${message}`);
    
    const user = await storage.getUser(userId);
    if (!user) {
      return { 
        response: "I couldn't identify your user account. Please try logging out and back in." 
      };
    }
    
    // Check if user has pending KYC submissions
    const pendingSubmissions = await storage.getPendingKYCSubmissions(userId);
    
    // Get KYC status
    const kycStatus = await storage.getUserKYCStatus(userId);
    
    // Handle status check requests
    if (this.isStatusCheckRequest(message)) {
      return this.generateStatusResponse(user, kycStatus, pendingSubmissions);
    }
    
    // Handle document upload requests
    if (this.isDocumentUploadRequest(message)) {
      return this.handleDocumentUploadRequest(user, message, kycStatus);
    }
    
    // Handle verification questions
    return this.generateGeneralKYCResponse(user, message, kycStatus);
  }

  /**
   * Check if message is requesting status information
   */
  private isStatusCheckRequest(message: string): boolean {
    const lowercaseMsg = message.toLowerCase();
    
    // Individual keywords
    const statusKeywords = [
      'status', 'approved', 'rejected', 'pending', 'progress', 'verified', 
      'verification', 'kyc'
    ];
    
    // Status check phrases
    const statusPhrases = [
      'check status', 'verify status', 'verification status', 'kyc status',
      'my verification', 'my kyc', 'check verification', 'where is my',
      'is my account verified', 'have i been verified', 'status of my'
    ];
    
    // Check for matches
    const hasStatusKeyword = statusKeywords.some(keyword => lowercaseMsg.includes(keyword));
    const hasStatusPhrase = statusPhrases.some(phrase => lowercaseMsg.includes(phrase));
    
    // Status questions often include question words with status keywords
    const hasQuestionFormat = ['what', 'where', 'when', 'how', '?'].some(q => 
      lowercaseMsg.includes(q) && hasStatusKeyword
    );
    
    return hasStatusPhrase || hasQuestionFormat || 
          (lowercaseMsg.includes('check') && (lowercaseMsg.includes('verification') || lowercaseMsg.includes('kyc')));
  }

  /**
   * Check if message is requesting to upload a document
   */
  private isDocumentUploadRequest(message: string): boolean {
    const lowercaseMsg = message.toLowerCase();
    
    // Document keywords
    const documentKeywords = [
      'upload', 'submit', 'verify', 'document', 'id', 'card', 'passport', 
      'driver', 'license', 'national', 'proof', 'address', 'identity',
      'verification', 'photo', 'picture', 'selfie', 'face', 'scan'
    ];
    
    // Document upload phrases
    const uploadPhrases = [
      'upload document', 'submit document', 'start verification', 'verify my account',
      'verify my identity', 'submit id', 'upload id', 'upload my', 'send my',
      'provide document', 'how do i verify', 'need to verify', 'want to verify',
      'can i upload', 'begin verification', 'start kyc', 'take a selfie'
    ];
    
    // Document type specific phrases
    const documentTypes = [
      'id card', 'passport', 'driver license', 'driving license', 'national id',
      'identity card', 'government id', 'photo id', 'residency', 'proof of address'
    ];
    
    // Check for matches
    const hasDocumentKeyword = documentKeywords.some(keyword => lowercaseMsg.includes(keyword));
    const hasUploadPhrase = uploadPhrases.some(phrase => lowercaseMsg.includes(phrase));
    const hasDocumentType = documentTypes.some(docType => lowercaseMsg.includes(docType));
    
    // Action words often paired with documents
    const hasActionWord = lowercaseMsg.includes('how') || lowercaseMsg.includes('start') || 
                        lowercaseMsg.includes('begin') || lowercaseMsg.includes('need to');
    
    return hasUploadPhrase || hasDocumentType || 
           (hasActionWord && (hasDocumentKeyword || lowercaseMsg.includes('kyc'))) ||
           (lowercaseMsg.includes('verify') && lowercaseMsg.includes('account'));
  }

  /**
   * Generate a response for KYC status requests
   */
  private async generateStatusResponse(
    user: User, 
    kycStatus: any, 
    pendingSubmissions: any[]
  ): Promise<{ response: string; action?: any }> {
    if (!kycStatus) {
      return {
        response: `Hello ${user.username}, you haven't started the KYC verification process yet. Would you like to begin now? I can help you submit your identification documents for verification.`
      };
    }
    
    if (kycStatus.status === 'approved') {
      return {
        response: `Hello ${user.username}, your account has been fully verified! Your KYC verification was approved on ${new Date(kycStatus.updatedAt).toLocaleDateString()}.`
      };
    }
    
    if (kycStatus.status === 'rejected') {
      return {
        response: `Hello ${user.username}, unfortunately your verification was rejected. Reason: ${kycStatus.rejectionReason || 'Not specified'}. Would you like to submit new documents?`,
        action: {
          type: 'review_status',
          data: {
            status: kycStatus.status,
            rejectionReason: kycStatus.rejectionReason,
            updatedAt: kycStatus.updatedAt
          }
        }
      };
    }
    
    if (kycStatus.status === 'pending') {
      return {
        response: `Hello ${user.username}, your verification is currently under review. We typically complete verification within 1-2 business days. I'll notify you once it's complete.`,
        action: {
          type: 'review_status',
          data: {
            status: kycStatus.status,
            updatedAt: kycStatus.updatedAt
          }
        }
      };
    }
    
    if (pendingSubmissions && pendingSubmissions.length > 0) {
      const documentTypes = pendingSubmissions.map(sub => sub.documentType).join(', ');
      return {
        response: `Hello ${user.username}, you have ${pendingSubmissions.length} document(s) pending: ${documentTypes}. These have been submitted and are awaiting processing.`
      };
    }
    
    return {
      response: `Hello ${user.username}, your verification status is ${kycStatus.status || 'not started'}. Would you like to begin or continue the verification process?`
    };
  }

  /**
   * Handle a document upload request
   */
  private async handleDocumentUploadRequest(
    user: User, 
    message: string,
    kycStatus: any
  ): Promise<{ response: string; action?: any }> {
    // Check if user already verified
    if (kycStatus && kycStatus.status === 'approved') {
      return {
        response: `Hello ${user.username}, your account is already fully verified! You don't need to submit any additional documents.`
      };
    }
    
    // Determine which documents to request based on message and current status
    let documentTypes = ['passport', 'drivers_license', 'national_id', 'residence_permit'];
    
    // Check if message mentions specific document types
    if (message.toLowerCase().includes('passport')) {
      documentTypes = ['passport'];
    } else if (message.toLowerCase().includes('driver') || message.toLowerCase().includes('license')) {
      documentTypes = ['drivers_license'];
    } else if (message.toLowerCase().includes('national') || message.toLowerCase().includes('id card')) {
      documentTypes = ['national_id'];
    } else if (message.toLowerCase().includes('residence') || message.toLowerCase().includes('permit')) {
      documentTypes = ['residence_permit'];
    }
    
    return {
      response: `Please upload one of the following documents for verification: ${documentTypes.map(type => type.replace('_', ' ')).join(', ')}. Make sure the document is valid, not expired, and clearly visible.`,
      action: {
        type: 'upload_document',
        data: {
          documentTypes: documentTypes
        }
      }
    };
  }

  /**
   * Generate a general KYC-related response
   */
  private async generateGeneralKYCResponse(
    user: User, 
    message: string, 
    kycStatus: any
  ): Promise<{ response: string; action?: any }> {
    // Try to use OpenAI for enhanced context-aware answers if available
    if (openAIService.isReady()) {
      try {
        // Get KYC-related knowledge entries
        const kycKnowledge = await storage.getAIKnowledgeBase('KYC');
        const verificationKnowledge = await storage.getAIKnowledgeBase('Verification');
        
        const knowledgeEntries = [...kycKnowledge, ...verificationKnowledge];
        
        // Use OpenAI to generate a personalized response
        const openAIResult = await openAIService.generateKYCResponse(
          message,
          knowledgeEntries,
          user,
          kycStatus
        );
        
        if (openAIResult.action) {
          return {
            response: openAIResult.response,
            action: openAIResult.action
          };
        }
        
        return {
          response: openAIResult.response
        };
      } catch (error) {
        console.error("Error using OpenAI for KYC response:", error);
        // Fall back to template response if OpenAI fails
      }
    }
    
    // Fallback templated response if OpenAI is not available
    let response = `I can help you with KYC verification, ${user.username}. `;
    
    if (!kycStatus || kycStatus.status === 'not_started') {
      response += `To verify your account, you'll need to submit a government-issued ID (passport, driver's license, or national ID card) and complete the verification process. Would you like to start now?`;
    } else if (kycStatus.status === 'pending') {
      response += `Your verification is currently being reviewed. We'll notify you once the process is complete.`;
    } else if (kycStatus.status === 'rejected') {
      response += `Your previous verification was rejected. You can submit new documents to try again.`;
    } else if (kycStatus.status === 'approved') {
      response += `Your account is already verified. You don't need to submit any additional documents.`;
    }
    
    return { response };
  }

  /**
   * Analyze a KYC submission for admin review
   */
  async analyzeKYCSubmission(kycId: number): Promise<any> {
    try {
      // Get KYC submission details
      const submission = await storage.getKYCSubmission(kycId);
      
      if (!submission) {
        return {
          success: false,
          message: "KYC submission not found"
        };
      }
      
      // If OpenAI is available, use Vision API to analyze documents
      if (openAIService.isReady()) {
        try {
          // Analyze document using OpenAI Vision
          const documentAnalysis = await openAIService.analyzeDocument(submission.documentUrl, submission.documentType);
          
          // Check if there's a selfie to do face matching
          if (submission.selfieUrl) {
            const faceMatchResult = await openAIService.compareFaces(submission.documentUrl, submission.selfieUrl);
            
            return {
              success: true,
              documentAnalysis,
              faceMatchResult,
              recommendedAction: documentAnalysis.isValid && faceMatchResult.isMatch ? 'approve' : 'reject',
              recommendedReason: !documentAnalysis.isValid 
                ? documentAnalysis.validationNotes 
                : !faceMatchResult.isMatch 
                  ? "Face in selfie doesn't match document" 
                  : ""
            };
          }
          
          return {
            success: true,
            documentAnalysis,
            recommendedAction: documentAnalysis.isValid ? 'approve' : 'reject',
            recommendedReason: !documentAnalysis.isValid ? documentAnalysis.validationNotes : ""
          };
        } catch (error) {
          console.error("Error analyzing document with OpenAI:", error);
          // Fall back to basic analysis
        }
      }
      
      // Basic analysis if OpenAI is not available
      return {
        success: true,
        basicAnalysis: {
          documentType: submission.documentType,
          submissionTime: submission.createdAt,
          hasRequiredDocuments: true,
          notes: "Automated analysis not available, please review manually."
        },
        recommendedAction: 'manual_review'
      };
    } catch (error) {
      console.error("Error in KYC submission analysis:", error);
      return {
        success: false,
        message: "Error analyzing KYC submission"
      };
    }
  }

  /**
   * Get personalized KYC guidance for a user
   */
  async getKYCGuidance(userId: number): Promise<any> {
    try {
      const user = await storage.getUser(userId);
      if (!user) {
        return {
          success: false,
          message: "User not found"
        };
      }
      
      const kycStatus = await storage.getUserKYCStatus(userId);
      
      if (!kycStatus || kycStatus.status === 'not_started') {
        return {
          success: true,
          message: "KYC verification required",
          requiredDocuments: [
            {
              type: 'government_id',
              description: 'A valid government-issued photo ID (passport, driver\'s license, national ID)',
              examples: ['passport', 'drivers_license', 'national_id']
            },
            {
              type: 'selfie',
              description: 'A clear selfie of your face for verification',
              note: 'Make sure your face is clearly visible and well-lit'
            }
          ],
          nextStep: 'submit_documents'
        };
      }
      
      if (kycStatus.status === 'pending') {
        return {
          success: true,
          message: "KYC verification in progress",
          status: 'pending',
          submittedOn: kycStatus.updatedAt,
          estimatedCompletionTime: '1-2 business days',
          nextStep: 'wait_for_review'
        };
      }
      
      if (kycStatus.status === 'rejected') {
        return {
          success: true,
          message: "KYC verification rejected",
          status: 'rejected',
          rejectionReason: kycStatus.rejectionReason || 'Verification failed',
          nextStep: 'resubmit_documents',
          guidance: 'Please submit new documents addressing the issue mentioned in the rejection reason.'
        };
      }
      
      if (kycStatus.status === 'approved') {
        return {
          success: true,
          message: "KYC verification complete",
          status: 'approved',
          approvedOn: kycStatus.updatedAt,
          nextStep: null
        };
      }
      
      return {
        success: true,
        message: `KYC status: ${kycStatus.status || 'unknown'}`,
        nextStep: 'contact_support'
      };
    } catch (error) {
      console.error("Error getting KYC guidance:", error);
      return {
        success: false,
        message: "Error retrieving KYC guidance"
      };
    }
  }

  /**
   * Initialize the KYC knowledge base
   */
  async initializeKYCKnowledgeBase(): Promise<void> {
    try {
      // Create basic KYC knowledge entries
      const kycKnowledgeEntries: AIKnowledgeBase[] = [
        {
          topic: 'KYC',
          subtopic: 'Overview',
          category: 'verification',
          information: 'KYC (Know Your Customer) is a verification process to confirm user identity and prevent fraud. Users must submit government ID and may need to provide a selfie for face matching.',
          confidence: 95,
          relationships: ['related:Verification', 'related:Security'],
          metadata: { importance: 'high' }
        },
        {
          topic: 'KYC',
          subtopic: 'Documents',
          category: 'verification',
          information: 'Acceptable KYC documents include a valid passport, driver\'s license, national ID card, or residence permit. Documents must be valid, not expired, and clearly legible.',
          confidence: 90,
          relationships: ['related:Verification', 'related:Security'],
          metadata: { importance: 'high' }
        },
        {
          topic: 'KYC',
          subtopic: 'Process',
          category: 'verification',
          information: 'The KYC process involves submitting identification documents, automated AI verification, and potential human review. The process typically takes 1-2 business days to complete.',
          confidence: 85,
          relationships: ['related:Verification', 'related:Security'],
          metadata: { importance: 'high' }
        },
        {
          topic: 'KYC',
          subtopic: 'Requirements',
          category: 'verification',
          information: 'KYC verification requires a government-issued photo ID that is not expired. All text must be clearly visible. For enhanced verification, a matching selfie may be required.',
          confidence: 90,
          relationships: ['related:Verification', 'related:Security'],
          metadata: { importance: 'high' }
        },
        {
          topic: 'Verification',
          subtopic: 'Status',
          category: 'account',
          information: 'Verification status can be: not started, pending, approved, or rejected. Users can check their verification status in their profile or by asking the AI assistant.',
          confidence: 85,
          relationships: ['related:KYC', 'related:Account'],
          metadata: { importance: 'medium' }
        }
      ];
      
      // Add knowledge entries to the database
      for (const entry of kycKnowledgeEntries) {
        // Check if similar entry already exists
        const existingEntries = await storage.getAIKnowledgeBase(entry.topic);
        const alreadyExists = existingEntries.some(e => 
          e.subtopic === entry.subtopic && 
          e.category === entry.category
        );
        
        if (!alreadyExists) {
          await storage.createAIKnowledgeEntry(entry);
          console.log(`Created KYC knowledge entry: ${entry.topic} - ${entry.subtopic}`);
        } else {
          console.log(`Skipped existing KYC knowledge entry: ${entry.topic} - ${entry.subtopic}`);
        }
      }
      
      console.log('KYC knowledge base initialized successfully');
    } catch (error) {
      console.error("Error initializing KYC knowledge base:", error);
      throw error;
    }
  }
}

// Export a singleton instance
export const kycAssistant = new KYCAssistantService();
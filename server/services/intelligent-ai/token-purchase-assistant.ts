import { storage } from '../../storage';
import { AIService } from './ai-service';

/**
 * Token Purchase Assistant Service
 * 
 * This service provides AI-powered assistance for token purchases:
 * - Guides users through the token purchase process
 * - Explains different payment methods
 * - Helps troubleshoot purchase issues
 * - Provides information about token packages
 */
export class TokenPurchaseAssistantService {
  private aiService: AIService;
  
  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Handles token purchase-related chat messages and provides appropriate responses
   */
  async handleTokenPurchaseMessage(message: string, userId?: number): Promise<{
    response: string;
    confidence: number;
    action?: {
      type: 'view_packages' | 'purchase_tokens' | 'troubleshoot_payment';
      data?: any;
    };
  }> {
    // Determine user intent
    const lowerMessage = message.toLowerCase();
    
    // User wants to purchase tokens
    if (
      lowerMessage.includes('buy token') || 
      lowerMessage.includes('purchase token') || 
      lowerMessage.includes('get tsk') ||
      lowerMessage.includes('token package')
    ) {
      try {
        // Get token packages
        const packages = await storage.getTokenPackages();
        
        if (packages && packages.length > 0) {
          // Format package information
          const packageInfo = packages.map(pkg => 
            `- ${pkg.name}: ${pkg.tokenAmount} tokens for $${pkg.priceUSD}${pkg.discountPercentage > 0 ? ` (${pkg.discountPercentage}% discount)` : ''}`
          ).join('\n');
          
          return {
            response: `Here are our available token packages:\n\n${packageInfo}\n\nYou can purchase tokens using BNB cryptocurrency or PayPal. Would you like me to guide you through the purchasing process?`,
            confidence: 0.95,
            action: {
              type: 'view_packages',
              data: {
                packages: packages
              }
            }
          };
        } else {
          return {
            response: "We offer various token packages, but I couldn't retrieve the current pricing information. Please visit the Token Store page to see the available packages and make a purchase.",
            confidence: 0.8,
            action: {
              type: 'purchase_tokens'
            }
          };
        }
      } catch (error) {
        console.error("Error getting token packages:", error);
        return {
          response: "I'm having trouble retrieving token package information right now. Please visit the Token Store page to see the available packages and make a purchase.",
          confidence: 0.7,
          action: {
            type: 'purchase_tokens'
          }
        };
      }
    }
    
    // User asking about payment methods
    if (
      lowerMessage.includes('payment method') || 
      lowerMessage.includes('how to pay') || 
      lowerMessage.includes('bnb payment') ||
      lowerMessage.includes('paypal')
    ) {
      return {
        response: "We currently offer two payment methods for purchasing TSK tokens:\n\n1. BNB (Binance Coin) - Pay directly with cryptocurrency\n   - Requires a Web3 wallet like MetaMask\n   - Transactions are processed on the blockchain\n\n2. PayPal - Pay with your PayPal account\n   - Convenient for credit/debit card payments\n   - Processed immediately\n\nWhich payment method would you like to use?",
        confidence: 0.9,
        action: {
          type: 'purchase_tokens'
        }
      };
    }
    
    // User has payment issues
    if (
      lowerMessage.includes('payment issue') || 
      lowerMessage.includes('payment problem') || 
      lowerMessage.includes('payment failed') ||
      lowerMessage.includes('can\'t purchase') ||
      lowerMessage.includes('transaction failed')
    ) {
      return {
        response: "I'm sorry to hear you're having issues with your token purchase. Here are some troubleshooting steps:\n\n• For BNB payments:\n  - Ensure you have enough BNB for the purchase plus gas fees\n  - Check that you're connected to the correct network (BNB Smart Chain)\n  - Try refreshing your browser and wallet connection\n\n• For PayPal payments:\n  - Ensure your PayPal account is verified\n  - Check that your payment method in PayPal has sufficient funds\n  - Try a different browser or clear your browser cache\n\nIf you're still experiencing issues, please contact our support team with your transaction details.",
        confidence: 0.85,
        action: {
          type: 'troubleshoot_payment'
        }
      };
    }

    // General token information
    return {
      response: "TSK tokens are the primary currency of our platform. You can use them for marketplace purchases, advertising, premium features, and more. To buy tokens, visit the Token Store page where you can choose from various packages and payment methods including BNB and PayPal. Is there something specific you'd like to know about buying TSK tokens?",
      confidence: 0.8,
      action: {
        type: 'purchase_tokens'
      }
    };
  }

  /**
   * Creates a set of AI knowledge base entries about token purchases
   * to help the AI answer user questions
   */
  async initializeTokenPurchaseKnowledgeBase(): Promise<void> {
    // Add knowledge entries about token purchases
    const entries = [
      {
        topic: "Token Purchase",
        subtopic: "Overview",
        information: "TSK tokens are the primary currency on the platform used for various activities including marketplace purchases, advertising, and premium features. Tokens can be purchased in packages of different sizes, with larger packages often offering discounts.",
        confidence: 1.0,
        category: "tokens"
      },
      {
        topic: "Token Purchase",
        subtopic: "Payment Methods",
        information: "TSK tokens can be purchased using two primary payment methods: BNB (Binance Coin) cryptocurrency or PayPal. BNB payments require a Web3 wallet like MetaMask, while PayPal allows for credit/debit card payments.",
        confidence: 1.0,
        category: "tokens"
      },
      {
        topic: "Token Purchase",
        subtopic: "BNB Payments",
        information: "To purchase tokens with BNB, you need a Web3 wallet such as MetaMask connected to the BNB Smart Chain. Ensure you have enough BNB for the purchase plus gas fees. Payments are processed directly on the blockchain.",
        confidence: 1.0,
        category: "tokens"
      },
      {
        topic: "Token Purchase",
        subtopic: "PayPal Payments",
        information: "PayPal is a convenient payment option that allows you to use credit/debit cards or your PayPal balance. Transactions are processed immediately and tokens are credited to your account once the payment is confirmed.",
        confidence: 1.0,
        category: "tokens"
      },
      {
        topic: "Token Purchase",
        subtopic: "Troubleshooting",
        information: "Common purchase issues include: insufficient BNB balance, incorrect network configuration in your wallet, PayPal verification issues, or browser compatibility problems. Refreshing your browser, clearing cache, or trying a different payment method can often resolve these issues.",
        confidence: 1.0,
        category: "tokens"
      }
    ];
    
    // Add entries to knowledge base
    for (const entry of entries) {
      await storage.createAIKnowledgeEntry({
        topic: entry.topic,
        subtopic: entry.subtopic,
        information: entry.information,
        confidence: entry.confidence,
        category: entry.category
      });
    }
  }
}

// Export singleton instance
export const tokenPurchaseAssistant = new TokenPurchaseAssistantService();
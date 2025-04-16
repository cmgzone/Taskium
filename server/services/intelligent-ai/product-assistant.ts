import { storage } from '../../storage';
import { AIService } from './ai-service';

/**
 * Product Assistant Service
 * 
 * This service provides AI-powered assistance for marketplace products:
 * - Helps users find products
 * - Provides product recommendations
 * - Answers questions about products
 * - Assists with product listing process
 */
export class ProductAssistantService {
  private aiService: AIService;
  
  constructor() {
    this.aiService = new AIService();
  }

  /**
   * Handles product-related chat messages and provides appropriate responses
   */
  async handleProductMessage(message: string, userId?: number): Promise<{
    response: string;
    confidence: number;
    action?: {
      type: 'view_category' | 'view_product' | 'list_product';
      data?: any;
    };
  }> {
    // Determine user intent
    const lowerMessage = message.toLowerCase();
    
    // Searching for products
    if (
      lowerMessage.includes('search for') || 
      lowerMessage.includes('find product') || 
      lowerMessage.includes('looking for') ||
      lowerMessage.includes('products like')
    ) {
      const searchCategory = this.extractCategory(message);
      
      if (searchCategory) {
        try {
          // Search for products in the mentioned category
          const products = await storage.getMarketplaceItemsByCategory(searchCategory, 5);
          
          if (products && products.length > 0) {
            return {
              response: `I found these products in the ${searchCategory} category:\n\n${products.map((p: any) => `- ${p.title} (${p.price} TSK)`).join('\n')}`,
              confidence: 0.9,
              action: {
                type: 'view_category',
                data: {
                  category: searchCategory,
                  products: products
                }
              }
            };
          } else {
            return {
              response: `I couldn't find any products in the ${searchCategory} category. Would you like to explore some other categories instead?`,
              confidence: 0.8
            };
          }
        } catch (error) {
          console.error("Error searching products:", error);
          return {
            response: "I'm having trouble searching for products right now. Please try again later or browse the marketplace directly.",
            confidence: 0.7
          };
        }
      }
    }

    // Product listing help
    if (
      lowerMessage.includes('sell') || 
      lowerMessage.includes('list product') || 
      lowerMessage.includes('how to list') ||
      lowerMessage.includes('create listing')
    ) {
      return {
        response: "To list a product on our marketplace, follow these steps:\n\n1. Go to the Marketplace page\n2. Click on 'List an Item'\n3. Fill out the product details including title, description, and price\n4. Upload clear images of your product\n5. Choose the appropriate category\n6. Submit for approval\n\nYour listing will be reviewed by our team and published once approved.",
        confidence: 0.95,
        action: {
          type: 'list_product'
        }
      };
    }

    // Product recommendations
    if (
      lowerMessage.includes('recommend') || 
      lowerMessage.includes('suggestion') || 
      lowerMessage.includes('what product') ||
      lowerMessage.includes('popular products')
    ) {
      try {
        // Get popular or featured products
        const products = await storage.getFeaturedMarketplaceItems(5);
        
        if (products && products.length > 0) {
          return {
            response: `Here are some popular products I recommend:\n\n${products.map((p: any) => `- ${p.title} (${p.price} TSK) - ${p.description.substring(0, 50)}...`).join('\n')}`,
            confidence: 0.9,
            action: {
              type: 'view_product',
              data: {
                products: products
              }
            }
          };
        } else {
          return {
            response: "I don't have any specific product recommendations at the moment. Try browsing the marketplace to discover products that match your interests.",
            confidence: 0.7
          };
        }
      } catch (error) {
        console.error("Error getting product recommendations:", error);
        return {
          response: "I'm having trouble retrieving product recommendations right now. Please try again later or browse the marketplace directly.",
          confidence: 0.7
        };
      }
    }

    // General product questions
    return {
      response: "Our marketplace offers a wide range of products and services. You can browse by category, search for specific items, or list your own products for sale. Is there a specific type of product you're interested in?",
      confidence: 0.8
    };
  }

  /**
   * Creates a set of AI knowledge base entries about marketplace products
   * to help the AI answer user questions
   */
  async initializeProductKnowledgeBase(): Promise<void> {
    // Add knowledge entries about marketplace products
    const entries = [
      {
        topic: "Marketplace",
        subtopic: "Overview",
        information: "The TSK Marketplace is a platform where users can buy and sell digital and physical products using TSK tokens. It features various categories including digital goods, services, physical items, and more.",
        confidence: 1.0,
        category: "marketplace"
      },
      {
        topic: "Marketplace",
        subtopic: "Listing Process",
        information: "To list a product on the marketplace, go to the Marketplace page, click 'List an Item', fill out the product details, upload images, set a price in TSK tokens, and submit for review. Listings are approved by moderators before appearing publicly.",
        confidence: 1.0,
        category: "marketplace"
      },
      {
        topic: "Marketplace",
        subtopic: "Product Categories",
        information: "The marketplace offers various categories including Digital Goods (software, art, music), Services (design, writing, development), Physical Items (electronics, clothing, collectibles), and more.",
        confidence: 1.0,
        category: "marketplace"
      },
      {
        topic: "Marketplace",
        subtopic: "Payment & Fees",
        information: "All transactions on the marketplace use TSK tokens. The platform charges a small fee (typically 2-5%) on each sale. Payments are held in escrow until the buyer confirms receipt of the product or service.",
        confidence: 1.0,
        category: "marketplace"
      },
      {
        topic: "Marketplace",
        subtopic: "Buyer Protection",
        information: "The marketplace offers buyer protection through an escrow system. Payments are held in escrow until the buyer confirms receipt of the product or service. If issues arise, a dispute can be opened for resolution by the platform.",
        confidence: 1.0,
        category: "marketplace"
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

  /**
   * Extract product category from message
   * @param message User message
   * @returns Extracted category or null
   */
  private extractCategory(message: string): string | null {
    const categories = [
      'digital', 'software', 'art', 'music', 'ebook', 
      'service', 'design', 'writing', 'development', 'consultation',
      'physical', 'electronics', 'clothing', 'collectible', 'home',
      'game', 'token', 'crypto', 'nft'
    ];
    
    const words = message.toLowerCase().split(/\s+/);
    
    for (const category of categories) {
      if (words.includes(category)) {
        return category;
      }
    }
    
    return null;
  }
}

// Export singleton instance
export const productAssistant = new ProductAssistantService();
/**
 * Marketplace Knowledge Base Seeding Script
 * 
 * This script seeds detailed marketplace-specific knowledge entries
 * to enhance the AI's understanding of marketplace features.
 */

import { db } from "../server/db";
import { aiKnowledgeBase } from "../shared/schema";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

// Detailed marketplace knowledge entries
const MARKETPLACE_KNOWLEDGE = [
  {
    topic: "Marketplace",
    subtopic: "Buying Process",
    information: "To make a purchase on the TSK Marketplace: 1) Browse or search for products by category, keywords, or filters. 2) Click on an item to view details, reviews, and seller information. 3) Click 'Buy Now' or 'Add to Cart' for multiple items. 4) Review your cart and click 'Checkout'. 5) Confirm your wallet has sufficient TSK tokens. 6) Review and accept the purchase terms. 7) Confirm the transaction to execute the smart contract. 8) Access your purchased digital items in your 'Purchases' section. All marketplace transactions are secured by smart contracts that release payment to the seller only after successful delivery.",
    relationships: JSON.stringify([
      { topic: "TSK Token", relation: "used for payment in" },
      { topic: "Smart Contracts", relation: "secure transactions in" },
      { topic: "Checkout Process", relation: "finalizes purchases in" }
    ]),
    confidence: 100,
    category: "marketplace",
    source: "official"
  },
  {
    topic: "Marketplace",
    subtopic: "Selling Process",
    information: "To sell products on the TSK Marketplace: 1) Complete KYC verification (Basic level minimum) to become a verified seller. 2) Go to the Marketplace dashboard and click 'Create Listing'. 3) Select the appropriate category for your product. 4) Upload product images, title, description, and files/deliverables. 5) Set pricing in TSK tokens and any applicable usage terms or licenses. 6) Choose between instant delivery (automatic) or manual delivery (you'll be notified to deliver). 7) Submit your listing for review. After approval (typically within 24 hours), your product will be live on the marketplace. Marketplace fees are 5% of the sale price, with reduced fees available through staking TSK tokens.",
    relationships: JSON.stringify([
      { topic: "KYC Verification", relation: "required for" },
      { topic: "Listing Creation", relation: "first step in" },
      { topic: "Marketplace Fees", relation: "applied to sales in" }
    ]),
    confidence: 100,
    category: "marketplace",
    source: "official"
  },
  {
    topic: "Marketplace",
    subtopic: "Product Reviews",
    information: "The TSK Marketplace uses a comprehensive review system that allows buyers to rate products on a 5-star scale and leave detailed feedback. Reviews include ratings for product quality, description accuracy, and seller responsiveness. To leave a review: 1) Go to your 'Purchases' section. 2) Find the item and click 'Leave Review'. 3) Rate the product and provide detailed feedback. 4) Optionally upload images of the product in use. Reviews are verified and linked to confirmed purchases to prevent fake reviews. Sellers can respond to reviews but cannot remove them unless they violate platform policies. The review system helps maintain marketplace quality by identifying top sellers and products.",
    relationships: JSON.stringify([
      { topic: "Product Quality", relation: "measured through" },
      { topic: "Seller Reputation", relation: "built through" },
      { topic: "Purchase Verification", relation: "validates" }
    ]),
    confidence: 100,
    category: "marketplace",
    source: "official"
  },
  {
    topic: "Marketplace",
    subtopic: "Dispute Resolution",
    information: "The TSK Marketplace offers a fair and transparent dispute resolution process. If you encounter issues with a purchase: 1) First attempt to resolve directly with the seller through the order messaging system. 2) If unresolved after 48 hours, open a formal dispute from your order details page. 3) Provide evidence including screenshots, correspondence, and explanation of the issue. 4) The seller has 72 hours to respond. 5) If no resolution is reached, platform moderators will review all evidence and make a binding decision within 5 business days. The smart contract holds funds in escrow until disputes are resolved. Resolution outcomes may include full refund, partial refund, or release of payment to the seller depending on the circumstances.",
    relationships: JSON.stringify([
      { topic: "Smart Contracts", relation: "holds funds during" },
      { topic: "Platform Moderators", relation: "oversee" },
      { topic: "Buyer Protection", relation: "implemented through" }
    ]),
    confidence: 100,
    category: "marketplace",
    source: "official"
  },
  {
    topic: "Marketplace",
    subtopic: "Featured Products",
    information: "Featured Products on the TSK Marketplace are highlighted listings that appear prominently on the marketplace homepage and category pages. Featured status can be earned through high sales volume and exceptional reviews (4.8+ average), or by participating in the Featured Promotion program. To apply for featured promotion: 1) Have a seller account in good standing with at least 10 successful sales. 2) Select the 'Apply for Featured' option from your product listing. 3) Choose the promotion duration (7, 14, or 30 days). 4) Pay the promotion fee in TSK tokens (fees vary by category and promotion duration). Featured products typically see 3-5x higher visibility and 2-3x more sales compared to standard listings.",
    relationships: JSON.stringify([
      { topic: "Product Visibility", relation: "enhanced through" },
      { topic: "Promotion Fees", relation: "required for" },
      { topic: "Sales Performance", relation: "improved by" }
    ]),
    confidence: 100,
    category: "marketplace",
    source: "official"
  },
  {
    topic: "Marketplace",
    subtopic: "Search and Filters",
    information: "The TSK Marketplace search system allows users to quickly find products through: 1) Keyword Search - enter terms in the search bar for instant results. 2) Category Navigation - browse through hierarchical categories and subcategories. 3) Advanced Filters - refine results by price range, rating, seller verification level, delivery method, and more. 4) Sort Options - arrange results by newest, best-selling, highest rated, or price (ascending/descending). 5) Saved Searches - save search parameters for future use. The platform also supports intelligent search with auto-completion, spelling correction, and semantic understanding to help users find products even with imprecise search terms. For optimal results, use specific keywords and leverage filters to narrow down options.",
    relationships: JSON.stringify([
      { topic: "User Experience", relation: "enhanced by" },
      { topic: "Product Discovery", relation: "facilitated through" },
      { topic: "Semantic Search", relation: "powers" }
    ]),
    confidence: 100,
    category: "marketplace",
    source: "official"
  }
];

async function seedMarketplaceKnowledge() {
  console.log("Starting marketplace knowledge base seeding...");

  // Check if we already have entries
  const existingEntries = await db.select({ count: sql`count(*)` }).from(aiKnowledgeBase)
    .where(sql`${aiKnowledgeBase.category} = 'marketplace'`)
    .execute();
  
  const count = parseInt(existingEntries[0]?.count?.toString() || '0');
  console.log(`Found ${count} existing marketplace knowledge entries.`);
  
  // Process marketplace knowledge
  console.log(`Adding ${MARKETPLACE_KNOWLEDGE.length} marketplace knowledge entries...`);
  
  for (const entry of MARKETPLACE_KNOWLEDGE) {
    try {
      // Check if this specific entry already exists to avoid duplicates
      const existing = await db.select().from(aiKnowledgeBase)
        .where(sql`${aiKnowledgeBase.topic} = ${entry.topic} AND ${aiKnowledgeBase.subtopic} = ${entry.subtopic}`)
        .execute();
      
      if (existing.length > 0) {
        console.log(`Entry already exists: ${entry.topic} - ${entry.subtopic}, updating...`);
        
        // Update existing entry
        await db.update(aiKnowledgeBase)
          .set({
            information: entry.information,
            relationships: entry.relationships,
            confidence: entry.confidence,
            category: entry.category,
            source: entry.source
          })
          .where(sql`${aiKnowledgeBase.topic} = ${entry.topic} AND ${aiKnowledgeBase.subtopic} = ${entry.subtopic}`)
          .execute();
          
        console.log(`Updated: ${entry.topic} - ${entry.subtopic}`);
      } else {
        // Insert new entry
        await storage.createAIKnowledgeEntry(entry);
        console.log(`Added: ${entry.topic} - ${entry.subtopic}`);
      }
    } catch (error) {
      console.error(`Error processing ${entry.topic} - ${entry.subtopic}:`, error);
    }
  }
  
  console.log("Marketplace knowledge base seeding completed!");
}

// Run the function
seedMarketplaceKnowledge()
  .catch(error => {
    console.error("Error during marketplace knowledge seeding:", error);
  })
  .finally(() => {
    console.log("Script execution completed");
  });
/**
 * Token Knowledge Base Seeding Script
 * 
 * This script seeds detailed TSK token-specific knowledge entries
 * to enhance the AI's understanding of token features and usage.
 */

import { db } from "../server/db";
import { aiKnowledgeBase } from "../shared/schema";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

// Detailed token knowledge entries
const TOKEN_KNOWLEDGE = [
  {
    topic: "TSK Token",
    subtopic: "Purchasing",
    information: "TSK tokens can be purchased through several methods: 1) Platform Exchange - use the 'Buy Tokens' section in your wallet dashboard to purchase with BNB, ETH, BUSD, or USDT. 2) Token Sales - participate in scheduled token sales events with bonuses. 3) External Exchanges - TSK is listed on several DEXs including PancakeSwap (BSC) and Uniswap (ETH). 4) Direct Bank Transfer - for large purchases (>$5,000) contact the support team for a direct wire transfer option. The purchase process through the platform is: Select currency > Enter amount > Review exchange rate and fees > Confirm transaction > Receive tokens in platform wallet. Transaction fees vary by payment method but average 1-3%. All purchases are subject to daily and monthly limits based on your verification level.",
    relationships: JSON.stringify([
      { topic: "Platform Exchange", relation: "enables" },
      { topic: "External Exchanges", relation: "facilitate" },
      { topic: "Bank Transfer", relation: "alternative method for" }
    ]),
    confidence: 100,
    category: "token",
    source: "official"
  },
  {
    topic: "TSK Token",
    subtopic: "Utility",
    information: "TSK tokens provide multiple utility functions within the platform ecosystem: 1) Marketplace Currency - for buying and selling digital products and services. 2) Mining Rewards - earned through daily mining activities. 3) Staking Returns - earn passive income by staking tokens (5-20% APY). 4) Governance Rights - participate in platform decisions by voting with staked tokens. 5) Fee Discounts - receive reduced transaction fees across the platform. 6) Membership Tiers - unlock enhanced platform features through token holdings. 7) Referral Rewards - earn tokens by referring new users. 8) Content Access - pay for premium content and services. 9) NFT Creation - mint NFTs with TSK backing. 10) Participation in TSK-exclusive events and promotions. The multifunction utility design ensures constant token circulation and increasing adoption as the platform grows.",
    relationships: JSON.stringify([
      { topic: "Platform Ecosystem", relation: "powered by" },
      { topic: "Token Economics", relation: "balanced through" },
      { topic: "User Incentives", relation: "created with" }
    ]),
    confidence: 100,
    category: "token",
    source: "official"
  },
  {
    topic: "TSK Token",
    subtopic: "Tokenomics",
    information: "TSK tokenomics is designed for long-term sustainability and value appreciation with a fixed supply of 1 billion tokens distributed as follows: 1) Ecosystem Growth (30%) - platform rewards, mining, staking, and user incentives. 2) Development Fund (20%) - ongoing platform improvements and new features. 3) Team and Advisors (15%) - allocated with 2-year vesting to align incentives. 4) Marketing (10%) - promoting platform adoption and user acquisition. 5) Strategic Partnerships (10%) - collaborations and integrations. 6) Public Sale (10%) - community token distribution. 7) Reserve Fund (5%) - volatility management and emergency funding. Deflationary mechanisms include: 1% burn on marketplace fees, 0.5% burn on transfers, and quarterly manual burns based on platform growth. This balanced tokenomics creates a sustainable model that supports platform development while continuously removing tokens from circulation to increase scarcity.",
    relationships: JSON.stringify([
      { topic: "Token Supply", relation: "fixed at 1 billion" },
      { topic: "Deflationary Mechanics", relation: "reduce supply through" },
      { topic: "Token Distribution", relation: "balanced by" }
    ]),
    confidence: 100,
    category: "token",
    source: "official"
  },
  {
    topic: "TSK Token",
    subtopic: "Staking",
    information: "TSK Staking allows users to earn passive income by locking their tokens in staking contracts. The platform offers four staking options: 1) Flexible Staking - no lock period, withdraw anytime, 5-8% APY. 2) Fixed-Term Staking - lock periods of 30/90/180 days with 10/15/20% APY respectively. 3) Governance Staking - 7% APY plus voting rights in platform decisions. 4) Marketplace Boost - 10% APY plus reduced marketplace selling fees (50% reduction). To start staking: Access Wallet > Staking section > Select staking option > Enter amount > Confirm transaction. Rewards are distributed daily to your wallet and can be automatically restaked for compound growth. Staking not only provides returns but also helps stabilize the token price by removing tokens from circulation. Early unstaking from fixed-term contracts incurs a 10% penalty fee that is redistributed to other stakers.",
    relationships: JSON.stringify([
      { topic: "Passive Income", relation: "generated through" },
      { topic: "Token Locking", relation: "mechanism of" },
      { topic: "Price Stability", relation: "enhanced by" }
    ]),
    confidence: 100,
    category: "token",
    source: "official"
  },
  {
    topic: "TSK Token",
    subtopic: "Security",
    information: "TSK token security is ensured through multiple protective measures: 1) Audited Smart Contract - audited by Certik with no critical vulnerabilities found. 2) Multisignature Treasury - requiring multiple authorized signatures for any major token movements. 3) Anti-Whale Mechanisms - transaction limits preventing single entities from controlling large portions of the supply (maximum 1% of supply per wallet for non-verified accounts). 4) Rate Limiting - to prevent flash loan attacks and market manipulation. 5) Timelocked Functions - critical contract changes require 48-hour timelock. 6) Bug Bounty Program - rewards for identifying security issues. 7) Regular Security Updates - following best practices in blockchain security. Token holders are encouraged to use hardware wallets for large holdings, enable 2FA for platform accounts, and never share private keys or seed phrases with anyone, including platform support staff who will never ask for this information.",
    relationships: JSON.stringify([
      { topic: "Smart Contract", relation: "secured through" },
      { topic: "Market Manipulation", relation: "prevented by" },
      { topic: "User Security", relation: "enhanced with" }
    ]),
    confidence: 100,
    category: "token",
    source: "official"
  }
];

async function seedTokenKnowledge() {
  console.log("Starting token knowledge base seeding...");

  // Check if we already have entries
  const existingEntries = await db.select({ count: sql`count(*)` }).from(aiKnowledgeBase)
    .where(sql`${aiKnowledgeBase.category} = 'token'`)
    .execute();
  
  const count = parseInt(existingEntries[0]?.count?.toString() || '0');
  console.log(`Found ${count} existing token knowledge entries.`);
  
  // Process token knowledge
  console.log(`Adding ${TOKEN_KNOWLEDGE.length} token knowledge entries...`);
  
  for (const entry of TOKEN_KNOWLEDGE) {
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
  
  console.log("Token knowledge base seeding completed!");
}

// Run the function
seedTokenKnowledge()
  .catch(error => {
    console.error("Error during token knowledge seeding:", error);
  })
  .finally(() => {
    console.log("Script execution completed");
  });
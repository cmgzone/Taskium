/**
 * Essential Knowledge Base Seeding Script
 * 
 * This script seeds only the most essential platform knowledge entries
 * to provide core AI capabilities while avoiding timeouts.
 */

import { db } from "../server/db";
import { aiKnowledgeBase, aiReasoning } from "../shared/schema";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

// Essential platform knowledge entries
const ESSENTIAL_KNOWLEDGE = [
  {
    topic: "Platform",
    subtopic: "Overview",
    information: "The TSK Platform is a decentralized blockchain ecosystem that combines mining, marketplace, wallet, and knowledge sharing features. It uses TSK tokens as its primary currency, which can be earned through mining activities, referrals, and community engagement. The platform is designed to be user-friendly with an intuitive interface and AI-powered assistance.",
    relationships: JSON.stringify([
      { topic: "Mining", relation: "provides method to earn" },
      { topic: "Marketplace", relation: "provides method to spend" },
      { topic: "TSK Token", relation: "uses as currency" }
    ]),
    confidence: 100,
    category: "platform",
    source: "official"
  },
  {
    topic: "Marketplace",
    subtopic: "Overview",
    information: "The TSK Marketplace is a decentralized platform where users can buy and sell digital products, services, and content using TSK tokens. All transactions are secured through smart contracts, providing safety for both buyers and sellers. The marketplace features categories including digital goods, services, content licenses, and virtual assets. Items can be filtered by category, price, rating, and seller reputation.",
    relationships: JSON.stringify([
      { topic: "TSK Token", relation: "used for transactions in" },
      { topic: "Smart Contracts", relation: "secure" },
      { topic: "Digital Products", relation: "traded on" }
    ]),
    confidence: 100,
    category: "marketplace",
    source: "official"
  },
  {
    topic: "Marketplace",
    subtopic: "Product Categories",
    information: "The TSK Marketplace organizes products into several main categories: 1) Digital Goods - software, e-books, templates, graphics. 2) Services - design work, writing, development, consulting. 3) Digital Content - music, art, videos, educational materials. 4) Virtual Assets - domain names, online accounts, digital collectibles. 5) Tokenized Items - blockchain assets, NFTs, token packages. Each category has subcategories for more specific filtering, and custom categories can be requested for unique items.",
    relationships: JSON.stringify([
      { topic: "Digital Goods", relation: "major category in" },
      { topic: "Services", relation: "offered through" },
      { topic: "NFTs", relation: "specialized category in" }
    ]),
    confidence: 100,
    category: "marketplace",
    source: "official"
  },
  {
    topic: "Mining",
    subtopic: "Overview",
    information: "TSK Mining is a core platform feature that allows users to earn TSK tokens daily without specialized hardware. Unlike traditional cryptocurrency mining, TSK mining is a simplified process where you claim your daily rewards by clicking the 'Mine' button on the dashboard. The mining system uses a daily rewards schedule with streak bonuses, referral boosts, and membership multipliers to determine your earnings.",
    relationships: JSON.stringify([
      { topic: "TSK Token", relation: "earned through" },
      { topic: "Streak Bonus", relation: "enhances" },
      { topic: "Referrals", relation: "boost rewards from" }
    ]),
    confidence: 100,
    category: "platform",
    source: "official"
  },
  {
    topic: "KYC Verification",
    subtopic: "Overview",
    information: "KYC (Know Your Customer) verification on the TSK Platform is a security process that confirms user identity and prevents fraud, money laundering, and other illegal activities. The platform offers two KYC levels: Basic KYC (email, phone, and ID verification) and Full KYC (includes address verification and liveness check). KYC verification increases security, expands platform usage limits, and enables additional features like selling on the marketplace and higher withdrawal amounts.",
    relationships: JSON.stringify([
      { topic: "User Identity", relation: "confirms" },
      { topic: "Security", relation: "enhances" },
      { topic: "Platform Limits", relation: "expands" }
    ]),
    confidence: 100,
    category: "platform",
    source: "official"
  },
  {
    topic: "Wallet",
    subtopic: "Overview",
    information: "The TSK Platform Wallet is a multi-functional digital wallet system that allows users to store, transfer, and manage their TSK tokens. The platform offers both a custodial wallet (managed by the platform) and integration with non-custodial wallets (like MetaMask and WalletConnect). Your wallet dashboard shows your balance, recent transactions, and options for deposits and withdrawals. All wallet activities are secured with encryption and optional two-factor authentication.",
    relationships: JSON.stringify([
      { topic: "TSK Token", relation: "stored in" },
      { topic: "Custodial Wallet", relation: "type of" },
      { topic: "Non-custodial Wallet", relation: "integration with" }
    ]),
    confidence: 100,
    category: "wallet",
    source: "official"
  },
  {
    topic: "TSK Token",
    subtopic: "Overview",
    information: "TSK Token is the native cryptocurrency of the TSK Platform, built on the BSC (Binance Smart Chain) as a BEP-20 token. It serves as the primary medium of exchange within the ecosystem and provides utility across all platform features. TSK has a fixed maximum supply of 1 billion tokens, with a deflationary mechanism that burns 1% of marketplace transaction fees. The token contract has been audited by Certik and includes anti-whale measures to prevent market manipulation.",
    relationships: JSON.stringify([
      { topic: "Binance Smart Chain", relation: "built on" },
      { topic: "BEP-20", relation: "standard of" },
      { topic: "Platform Ecosystem", relation: "powers" }
    ]),
    confidence: 100,
    category: "token",
    source: "official"
  },
  {
    topic: "AI Assistant",
    subtopic: "Overview",
    information: "The TSK Platform AI Assistant is an intelligent digital helper designed to support users throughout their platform experience. It provides instant answers to questions, step-by-step guidance for platform features, personalized recommendations, and troubleshooting assistance. The AI is accessible via the chat icon in the navigation bar and can help with topics including token purchase, mining optimization, marketplace navigation, KYC verification, wallet management, and technical support.",
    relationships: JSON.stringify([
      { topic: "Platform Navigation", relation: "assists with" },
      { topic: "User Support", relation: "provides" },
      { topic: "Knowledge Base", relation: "accesses" }
    ]),
    confidence: 100,
    category: "platform",
    source: "official"
  }
];

// Essential reasoning patterns for the AI
const ESSENTIAL_REASONING = [
  {
    pattern: "step_by_step_process",
    rules: JSON.stringify({
      description: "When the user asks how to perform a specific task, break down the response into clear numbered steps that they can follow sequentially.",
      structureHints: "Always start with a brief intro explaining what the steps will achieve, then use numbered steps, and end with any important tips or warnings."
    }),
    examples: JSON.stringify({
      input: "How do I complete KYC verification?",
      output: "To complete KYC verification on the TSK Platform, follow these steps:\n\n1. Go to your Profile section from the sidebar menu\n2. Click on the 'KYC Verification' button\n3. Select the verification level you need (Basic or Full)\n4. Fill in your personal information accurately\n5. Upload clear photos of your required documents\n6. Complete the liveness check if applying for Full KYC\n7. Submit your application and wait for review (typically 1-3 business days)\n\nMake sure your documents are valid, clearly visible, and match the information in your profile."
    }),
    category: "instruction",
    priority: 3
  },
  {
    pattern: "feature_explanation",
    rules: JSON.stringify({
      description: "When explaining a platform feature, start with a concise overview followed by detailed information about functionality, benefits, and how to access it.",
      structureHints: "Begin with a one-sentence definition, then provide an overview section, followed by specific details organized into logical sections with clear headings."
    }),
    examples: JSON.stringify({
      input: "What is TSK staking?",
      output: "TSK Staking is a feature that allows you to earn passive income by locking your TSK tokens for a specified period.\n\n**Overview:**\nStaking works by temporarily removing tokens from circulation, which helps maintain token value while rewarding you with additional tokens and platform benefits.\n\n**Staking Options:**\n• Flexible Staking: No lock period, withdraw anytime, 5-8% APY\n• Locked Staking: Fixed periods with higher returns\n  - 30 days: 10% APY\n  - 90 days: 15% APY\n  - 180 days: 20% APY\n• Governance Staking: 7% APY plus voting rights\n• Marketplace Boost: 10% APY plus reduced seller fees\n\n**Benefits:**\n• Earn passive income through regular rewards\n• Gain additional platform privileges\n• Participate in governance decisions\n• Reduce marketplace selling fees\n\n**How to Access:**\nGo to Wallet > Staking in your dashboard, select your preferred staking option, enter the amount, and confirm the staking transaction.\n\nRewards are distributed daily and can be automatically compounded for maximum returns."
    }),
    category: "education",
    priority: 2
  }
];

async function seedEssentialKnowledge() {
  console.log("Starting essential knowledge base seeding...");

  // Check if we already have knowledge entries
  const existingEntries = await db.select().from(aiKnowledgeBase).execute();
  console.log(`Found ${existingEntries.length} existing knowledge entries.`);
  
  // Process essential knowledge
  console.log(`Adding ${ESSENTIAL_KNOWLEDGE.length} essential knowledge entries...`);
  
  for (const entry of ESSENTIAL_KNOWLEDGE) {
    try {
      await storage.createAIKnowledgeEntry(entry);
      console.log(`Added: ${entry.topic} - ${entry.subtopic}`);
    } catch (error) {
      console.error(`Error adding ${entry.topic} - ${entry.subtopic}:`, error);
    }
  }
  
  // Add reasoning patterns
  console.log("Adding essential reasoning patterns...");
  
  for (const pattern of ESSENTIAL_REASONING) {
    try {
      // Check if pattern already exists
      const existing = await db.select().from(aiReasoning)
        .where(sql`${aiReasoning.pattern} = ${pattern.pattern}`)
        .execute();
      
      if (existing.length > 0) {
        // Update existing pattern
        await db.update(aiReasoning)
          .set({
            rules: pattern.rules,
            examples: pattern.examples,
            category: pattern.category,
            priority: pattern.priority || 1
          })
          .where(sql`${aiReasoning.pattern} = ${pattern.pattern}`)
          .execute();
        console.log(`Updated reasoning pattern: ${pattern.pattern}`);
      } else {
        // Insert new pattern
        await db.insert(aiReasoning).values({
          pattern: pattern.pattern,
          rules: pattern.rules,
          examples: pattern.examples,
          category: pattern.category,
          priority: pattern.priority || 1
        }).execute();
        console.log(`Added reasoning pattern: ${pattern.pattern}`);
      }
    } catch (error) {
      console.error(`Error adding reasoning pattern:`, error);
    }
  }
  
  console.log("Essential knowledge base seeding completed!");
}

// Run the function
seedEssentialKnowledge()
  .catch(error => {
    console.error("Error during knowledge seeding:", error);
  })
  .finally(() => {
    console.log("Script execution completed");
  });
/**
 * Comprehensive Platform Knowledge Seeding Script
 * 
 * This script generates a complete knowledge base of the TSK Platform 
 * with detailed information about all features, processes, and components.
 * It is designed to provide the AI with an extensive understanding of the platform.
 */

import { db } from "../server/db";
import { aiKnowledgeBase, aiReasoning } from "../shared/schema";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

async function seedCompletePlatformKnowledge() {
  console.log("Starting comprehensive platform knowledge seeding...");

  // Check if we already have knowledge entries
  const existingEntries = await db.select().from(aiKnowledgeBase).execute();
  console.log(`Found ${existingEntries.length} existing knowledge entries.`);
  
  // Create a detailed knowledge structure with categories and relationships
  const knowledgeData = generateCompleteKnowledgeBase();
  
  console.log(`Generated ${knowledgeData.length} detailed knowledge entries to add.`);
  
  // Insert all knowledge entries
  for (const entry of knowledgeData) {
    await storage.createAIKnowledgeEntry(entry);
  }
  
  console.log(`Added ${knowledgeData.length} comprehensive knowledge base entries`);
  
  // Create reasoning patterns for different types of questions
  await seedReasoningPatterns();
  
  console.log("Comprehensive platform knowledge seeding completed!");
}

/**
 * Generate a complete knowledge base with detailed information about all platform aspects
 */
function generateCompleteKnowledgeBase() {
  return [
    // PLATFORM OVERVIEW =========================================================
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
      topic: "Platform",
      subtopic: "Navigation",
      information: "The TSK Platform interface consists of a main dashboard and several key sections accessible from the sidebar navigation: Dashboard (overview of your activity), Mining (daily token mining), Marketplace (buying and selling digital items), Wallet (managing your tokens and connecting external wallets), Profile (personal settings and KYC verification), and Knowledge Base (platform documentation). The top navigation bar provides access to notifications, account settings, and the AI assistant.",
      relationships: JSON.stringify([
        { topic: "Dashboard", relation: "provides overview of" },
        { topic: "Mining", relation: "accessible from" },
        { topic: "Marketplace", relation: "accessible from" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Platform",
      subtopic: "Getting Started",
      information: "To get started on the TSK Platform: 1) Create an account with email and password or social login. 2) Complete the onboarding process which guides you through platform features. 3) Connect a Web3 wallet (optional, but required for some features). 4) Start mining daily to earn TSK tokens. 5) Explore the marketplace to see available products and services. 6) Complete KYC verification to unlock full platform capabilities including selling items and larger withdrawals.",
      relationships: JSON.stringify([
        { topic: "Registration", relation: "first step of" },
        { topic: "KYC", relation: "required for full access to" },
        { topic: "Mining", relation: "basic earning method on" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    
    // USER ACCOUNTS & PROFILE ==================================================
    {
      topic: "User Account",
      subtopic: "Registration",
      information: "To register for a TSK Platform account, you need to provide a valid email address, create a secure password, and agree to the terms of service. You can also register using social login options including Google, Facebook, and Twitter. After registration, you'll receive a verification email to confirm your account. The registration process typically takes less than 2 minutes to complete.",
      relationships: JSON.stringify([
        { topic: "Email Verification", relation: "required after" },
        { topic: "Security", relation: "begins with" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "User Account",
      subtopic: "Profile Setup",
      information: "After registering, you should complete your profile by adding a username, profile picture, and basic information. Your profile is visible to other users on the marketplace and community sections. You can customize your privacy settings to control what information is visible to others. Complete profiles receive a trust score boost which can help with marketplace activities.",
      relationships: JSON.stringify([
        { topic: "Trust Score", relation: "affected by" },
        { topic: "Privacy", relation: "configured in" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "User Account",
      subtopic: "Security Settings",
      information: "TSK Platform offers multiple security features to protect your account: 1) Two-factor authentication (2FA) using authenticator apps or SMS. 2) Email notifications for login attempts and account changes. 3) Session management to view and terminate active sessions. 4) Password strength requirements and regular change reminders. 5) IP address monitoring to detect suspicious login attempts. We recommend enabling 2FA for maximum account security.",
      relationships: JSON.stringify([
        { topic: "Two-Factor Authentication", relation: "recommended for" },
        { topic: "Password", relation: "fundamental part of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    
    // MINING SYSTEM ============================================================
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
      topic: "Mining",
      subtopic: "Daily Process",
      information: "To mine TSK tokens daily: 1) Log in to your account. 2) Navigate to the Mining section from the sidebar. 3) Click the glowing 'Mine' button that becomes active once every 24 hours. 4) Receive your token rewards instantly added to your wallet. 5) Return the next day to continue your mining streak. If you miss a day, your streak will reset, so consistent daily mining is recommended for maximum returns.",
      relationships: JSON.stringify([
        { topic: "Mining Streak", relation: "maintained by" },
        { topic: "Wallet", relation: "receives rewards from" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Mining",
      subtopic: "Streaks",
      information: "The Mining Streak system rewards consistent daily mining activity. Each consecutive day you mine increases your streak count. For every streak day, you receive a 5% bonus to your base mining reward, up to a maximum of 100% bonus at 20 days. If you miss a day of mining, your streak resets to zero. Premium members have streak protection that prevents resets for 1-3 days of inactivity depending on membership tier.",
      relationships: JSON.stringify([
        { topic: "Mining Rewards", relation: "enhanced by" },
        { topic: "Premium Membership", relation: "protects" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Mining",
      subtopic: "Reward Calculation",
      information: "TSK mining rewards are calculated using the formula: Base Reward × (1 + Streak Bonus) × Membership Multiplier × (1 + Referral Bonus). The base reward is typically 10 TSK tokens. Streak bonus adds 5% per day (max 100%). Membership multipliers range from 1.0× (Basic) to 2.5× (Diamond). Referral bonuses add 5% per active referral (max 50%). Daily rewards can range from 10 TSK tokens for new users to 75+ TSK tokens for established users with maximum bonuses.",
      relationships: JSON.stringify([
        { topic: "Base Reward", relation: "foundation of" },
        { topic: "Membership Tiers", relation: "affect" },
        { topic: "Referral Program", relation: "increases" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Mining",
      subtopic: "Boosters",
      information: "Mining Boosters are special events or actions that temporarily increase your mining rewards. Types of boosters include: 1) Weekend Boost - 25% extra on Saturday and Sunday. 2) Special Event Boosts - during platform events or holidays (typically 50-100%). 3) Community Challenges - complete tasks for temporary boosts. 4) Referral Milestones - reaching certain referral numbers grants temporary high multipliers. Boosters stack with regular bonuses, creating opportunities for significantly higher mining rewards.",
      relationships: JSON.stringify([
        { topic: "Special Events", relation: "provide" },
        { topic: "Mining Rewards", relation: "increased by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },

    // MARKETPLACE ==============================================================
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
      subtopic: "Buying Process",
      information: "To purchase items on the TSK Marketplace: 1) Browse or search for products by category or keywords. 2) Review the product details, seller reputation, and buyer reviews. 3) Click 'Buy Now' on the product page. 4) Confirm the purchase and approve the transaction. 5) TSK tokens are held in escrow until you confirm receipt. 6) Download or access your purchased item. 7) Leave feedback for the seller. All purchases include buyer protection through the platform's escrow system.",
      relationships: JSON.stringify([
        { topic: "Escrow System", relation: "protects" },
        { topic: "Feedback System", relation: "follows" },
        { topic: "Product Search", relation: "initiates" }
      ]),
      confidence: 100,
      category: "marketplace",
      source: "official"
    },
    {
      topic: "Marketplace",
      subtopic: "Selling Process",
      information: "To sell items on the TSK Marketplace: 1) Complete KYC verification (required for all sellers). 2) Navigate to the 'My Items' section and select 'Create Listing'. 3) Complete the listing form with title, description, category, and price. 4) Upload product images and any files for the buyer. 5) Set additional options like quantity and listing duration. 6) Submit for review. Listings are typically approved within 24 hours if they meet the platform guidelines. The platform charges a 5% fee on successful sales.",
      relationships: JSON.stringify([
        { topic: "KYC Verification", relation: "required before" },
        { topic: "Platform Fees", relation: "charged during" },
        { topic: "Content Guidelines", relation: "must be followed for" }
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
      topic: "Marketplace",
      subtopic: "Fees and Payments",
      information: "The TSK Marketplace fee structure includes: 1) Listing Fee - Free for basic listings, 10 TSK for featured listings. 2) Transaction Fee - 5% of sale price paid by the seller. 3) Withdrawal Fee - 1% for converting marketplace earnings to external wallet. All transactions use TSK tokens; there are no fiat payment options. Earnings from sales are available in your platform wallet immediately after the buyer confirms receipt and leaves feedback.",
      relationships: JSON.stringify([
        { topic: "Platform Wallet", relation: "holds earnings from" },
        { topic: "Featured Listings", relation: "special category in" },
        { topic: "Transaction Fees", relation: "applied to sales in" }
      ]),
      confidence: 100,
      category: "marketplace",
      source: "official"
    },
    {
      topic: "Marketplace",
      subtopic: "Dispute Resolution",
      information: "The TSK Marketplace has a comprehensive dispute resolution system to handle issues between buyers and sellers. If a problem occurs: 1) Buyers can open a dispute within 7 days of purchase. 2) Sellers are notified and have 3 days to respond. 3) Both parties can submit evidence and communications. 4) A platform moderator reviews the case within 48 hours. 5) Resolution options include full refund, partial refund, or confirming the transaction as complete. The dispute system maintains a 98% satisfaction rate for resolutions.",
      relationships: JSON.stringify([
        { topic: "Escrow System", relation: "enables" },
        { topic: "Platform Moderators", relation: "manage" },
        { topic: "Buyer Protection", relation: "implemented through" }
      ]),
      confidence: 100,
      category: "marketplace",
      source: "official"
    },

    // WALLET SYSTEM ============================================================
    {
      topic: "Wallet",
      subtopic: "Overview",
      information: "The TSK Platform Wallet is a multi-functional digital wallet system that allows users to store, transfer, and manage their TSK tokens. The platform offers both a custodial wallet (managed by the platform) and integration with non-custodial wallets (like MetaMask and WalletConnect). Your wallet dashboard shows your balance, recent transactions, and options for deposits and withdrawals. All wallet activities are secured with encryption and optional two-factor authentication.",
      relationships: JSON.stringify([
        { topic: "TSK Token", relation: "stored in" },
        { topic: "Security", relation: "protects" },
        { topic: "MetaMask", relation: "can connect to" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Wallet",
      subtopic: "Connection Types",
      information: "The TSK Platform supports multiple wallet connection options: 1) Platform Wallet - the default custodial wallet created with your account. 2) MetaMask - connect your MetaMask wallet for direct blockchain transactions. 3) WalletConnect - compatible with mobile wallets like Trust Wallet. 4) Hardware Wallets - Ledger and Trezor supported via WalletConnect. You can switch between connected wallets or use multiple wallets simultaneously for different purposes. External wallet connections require signing a verification message to prove ownership.",
      relationships: JSON.stringify([
        { topic: "Custodial Wallet", relation: "type of" },
        { topic: "Non-custodial Wallet", relation: "alternative to" },
        { topic: "Wallet Security", relation: "varies by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Wallet",
      subtopic: "Deposits and Withdrawals",
      information: "Managing funds in your TSK wallet: 1) Deposits - Receive tokens from mining, marketplace sales, referrals, or external transfers. External deposits require the correct wallet address and network (BNB Smart Chain). 2) Withdrawals - Transfer tokens to external wallets or other platform users. Withdrawals over 1000 TSK require KYC verification. The platform charges a 1% fee for external withdrawals. Processing times are instant for internal transfers and typically 5-10 minutes for blockchain transactions.",
      relationships: JSON.stringify([
        { topic: "KYC Verification", relation: "required for large" },
        { topic: "BNB Smart Chain", relation: "network for" },
        { topic: "Withdrawal Fees", relation: "applied to" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Wallet",
      subtopic: "Security Features",
      information: "TSK Wallet security includes multiple protective measures: 1) End-to-end encryption for all transactions. 2) Optional two-factor authentication for withdrawals. 3) Withdrawal whitelisting - restrict transfers to approved addresses only. 4) Multiple approval levels for large transactions. 5) Suspicious activity monitoring and automatic alerts. 6) Cold storage for majority of platform funds. 7) Regular security audits by third-party firms. Enable all security features in your profile settings for maximum protection.",
      relationships: JSON.stringify([
        { topic: "Two-Factor Authentication", relation: "secures" },
        { topic: "Encryption", relation: "protects data in" },
        { topic: "Security Audits", relation: "verify" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },

    // TOKEN ECONOMICS ==========================================================
    {
      topic: "TSK Token",
      subtopic: "Overview",
      information: "The TSK Token is the native digital currency of the TSK Platform, built on the BNB Smart Chain as a BEP-20 token. It serves multiple purposes within the ecosystem: medium of exchange for marketplace transactions, reward for mining and community activities, staking for platform benefits, and governance participation. The token has a total supply of 1 billion TSK with a deflationary mechanism through regular token burns from platform fees.",
      relationships: JSON.stringify([
        { topic: "BNB Smart Chain", relation: "blockchain for" },
        { topic: "Platform Economy", relation: "foundation of" },
        { topic: "Token Burns", relation: "reduce supply of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "TSK Token",
      subtopic: "Tokenomics",
      information: "TSK Token economics are designed for long-term sustainability: Total Supply: 1 billion tokens. Distribution: 30% mining rewards, 20% team & development (vested), 15% platform treasury, 15% community rewards, 10% partnerships, 10% public sale. The token implements a deflationary model where 25% of all platform fees are used for token burns, reducing supply over time. Price stability is managed through controlled release of mining rewards based on platform growth metrics.",
      relationships: JSON.stringify([
        { topic: "Token Distribution", relation: "defines allocation of" },
        { topic: "Deflationary Model", relation: "controls supply of" },
        { topic: "Mining Rewards", relation: "major distribution mechanism for" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "TSK Token",
      subtopic: "Utility and Use Cases",
      information: "TSK Tokens have multiple utility functions on the platform: 1) Marketplace Currency - buy and sell digital products and services. 2) Premium Memberships - subscribe to tiered platform benefits. 3) Staking - earn passive income and platform privileges. 4) Governance - vote on platform proposals and changes. 5) Advertising - purchase featured listings and promotional space. 6) Content Unlocking - access premium educational content. 7) API Access - use platform services programmatically. The multi-utility design ensures consistent token demand.",
      relationships: JSON.stringify([
        { topic: "Marketplace", relation: "uses as currency" },
        { topic: "Staking", relation: "locks up" },
        { topic: "Governance", relation: "uses weight of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "TSK Token",
      subtopic: "Purchasing",
      information: "TSK Tokens can be acquired through several methods: 1) Platform Mining - earn daily rewards through consistent mining. 2) Direct Purchase - buy tokens using BNB through the platform's token sale interface. 3) External Exchanges - available on PancakeSwap and other decentralized exchanges. 4) Marketplace Sales - earn tokens by selling products or services. 5) Referral Program - earn for bringing new users to the platform. Minimum purchase amount is 100 TSK and KYC verification is required for purchases over 5000 TSK.",
      relationships: JSON.stringify([
        { topic: "Mining", relation: "method to earn" },
        { topic: "Token Sale", relation: "direct purchase of" },
        { topic: "KYC", relation: "required for large purchases of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },

    // KYC VERIFICATION =========================================================
    {
      topic: "KYC",
      subtopic: "Overview",
      information: "Know Your Customer (KYC) verification is a security and regulatory compliance process that confirms your identity on the TSK Platform. KYC is required for certain platform activities like selling on the marketplace, withdrawing large amounts of tokens, and accessing premium features. The verification process involves submitting identity documents and proof of address, which are securely processed and verified by our compliance team. Most verifications are completed within 24-48 hours.",
      relationships: JSON.stringify([
        { topic: "Compliance", relation: "ensured through" },
        { topic: "Marketplace Selling", relation: "requires" },
        { topic: "Identity Verification", relation: "core process of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "KYC",
      subtopic: "Requirements",
      information: "To complete KYC verification, you need to provide: 1) Government-issued photo ID (passport, driver's license, or national ID card). 2) Proof of address document dated within the last 3 months (utility bill, bank statement, official government letter). 3) A selfie holding your ID document. 4) Basic personal information including full name, date of birth, and residential address. All documents must be clear, unmodified, and show all corners and edges. The name on all documents must match exactly.",
      relationships: JSON.stringify([
        { topic: "Identity Documents", relation: "required for" },
        { topic: "Document Verification", relation: "process within" },
        { topic: "Personal Information", relation: "collected during" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "KYC",
      subtopic: "Verification Process",
      information: "The KYC verification process follows these steps: 1) Navigate to Profile > KYC Verification. 2) Select the verification level needed (Basic or Advanced). 3) Fill out the personal information form. 4) Upload the required documents (ID and proof of address). 5) Take or upload a selfie with your ID. 6) Submit your application for review. 7) Receive updates on your verification status via email and platform notifications. 8) Once approved, your account is immediately upgraded with the verified status and associated privileges.",
      relationships: JSON.stringify([
        { topic: "Document Upload", relation: "step in" },
        { topic: "Verification Levels", relation: "options in" },
        { topic: "Compliance Team", relation: "reviews submissions for" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "KYC",
      subtopic: "Verification Levels",
      information: "The TSK Platform offers two KYC verification levels: 1) Basic Verification - Requires government ID and selfie. Unlocks marketplace selling, withdrawals up to 5000 TSK monthly, and basic premium features. Processing time: 24 hours. 2) Advanced Verification - Requires government ID, proof of address, selfie, and additional information. Unlocks unlimited marketplace selling, withdrawals up to 50,000 TSK monthly, and all premium features. Processing time: 48 hours. Users can upgrade from Basic to Advanced at any time.",
      relationships: JSON.stringify([
        { topic: "Basic Verification", relation: "entry level of" },
        { topic: "Advanced Verification", relation: "higher tier of" },
        { topic: "Withdrawal Limits", relation: "determined by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "KYC",
      subtopic: "Privacy and Data Security",
      information: "Your KYC data is protected with industry-leading security measures: 1) All documents are encrypted using AES-256 encryption. 2) Data is stored in compliance with GDPR and other privacy regulations. 3) Access to verification documents is strictly limited to authorized compliance personnel. 4) Documents are automatically purged from active storage 30 days after verification. 5) You can request complete deletion of your KYC data at any time from Privacy Settings. 6) The platform never shares your verification data with third parties except when legally required.",
      relationships: JSON.stringify([
        { topic: "Data Encryption", relation: "protects" },
        { topic: "GDPR Compliance", relation: "framework for" },
        { topic: "Privacy Settings", relation: "controls for" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },

    // REFERRAL PROGRAM =========================================================
    {
      topic: "Referrals",
      subtopic: "Program Overview",
      information: "The TSK Referral Program allows users to earn additional tokens by inviting new members to the platform. Each user gets a unique referral code and link that can be shared with friends, family, or followers. When someone joins using your referral, they become your referral, and you receive rewards based on their activity. The program has a two-tier structure, rewarding you for both direct referrals and their referrals (second level). Referral relationships are permanent and continue to generate rewards for as long as your referrals remain active.",
      relationships: JSON.stringify([
        { topic: "Referral Code", relation: "unique identifier in" },
        { topic: "Reward Structure", relation: "defines earnings in" },
        { topic: "Platform Growth", relation: "accelerated by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Referrals",
      subtopic: "Rewards Structure",
      information: "The TSK Referral Program offers multiple reward mechanisms: 1) Sign-up Bonus - 25 TSK when a referred user completes registration and onboarding. 2) Mining Boost - 10% of all tokens your referrals mine daily (5% for second-level referrals). 3) Activity Bonus - 5% of marketplace fees generated by your referrals. 4) Milestone Bonuses - One-time rewards when reaching 5, 10, 25, 50, and 100 active referrals. 5) Special Promotions - Temporary increased rewards during referral competitions. There's no limit to how many people you can refer or how much you can earn.",
      relationships: JSON.stringify([
        { topic: "Mining Rewards", relation: "enhanced by" },
        { topic: "Milestone Bonuses", relation: "special rewards in" },
        { topic: "Referral Tracking", relation: "monitors progress in" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Referrals",
      subtopic: "Sharing Tools",
      information: "The platform provides multiple tools to share your referral link: 1) Personal Referral Dashboard - Access your unique code, link, and promotional materials. 2) Social Media Integration - Direct sharing to Twitter, Facebook, Telegram, and other platforms. 3) Email Templates - Customizable invitation emails to send to contacts. 4) Embeddable Widgets - Add referral banners to your website or blog. 5) QR Code Generator - Create scannable codes for print materials. 6) Performance Analytics - Track clicks, sign-ups, and conversion rates. These tools are available in the Referrals section of your dashboard.",
      relationships: JSON.stringify([
        { topic: "Referral Dashboard", relation: "centralized location for" },
        { topic: "Social Sharing", relation: "distribution method for" },
        { topic: "Analytics", relation: "measures effectiveness of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },

    // PREMIUM MEMBERSHIP ======================================================
    {
      topic: "Premium Membership",
      subtopic: "Overview",
      information: "TSK Platform offers tiered Premium Memberships that provide enhanced benefits and features. Premium status is visible through profile badges and unlocks exclusive platform capabilities. There are four membership tiers: Silver, Gold, Platinum, and Diamond, each with progressively better benefits. Memberships are purchased with TSK tokens and last for 30 days, with discounts for longer subscriptions (3-month, 6-month, and annual options available). Premium status applies across all platform features including mining, marketplace, and token utilities.",
      relationships: JSON.stringify([
        { topic: "Membership Tiers", relation: "structure of" },
        { topic: "Mining Multipliers", relation: "benefit of" },
        { topic: "Subscription Management", relation: "maintains" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Premium Membership",
      subtopic: "Tier Benefits",
      information: "Premium Membership benefits by tier: 1) Silver (100 TSK/month): 1.5× mining multiplier, 1-day streak protection, reduced marketplace fees (4%). 2) Gold (250 TSK/month): 1.8× mining multiplier, 2-day streak protection, reduced marketplace fees (3%), featured marketplace listings. 3) Platinum (500 TSK/month): 2.2× mining multiplier, 3-day streak protection, reduced marketplace fees (2%), priority KYC processing. 4) Diamond (1000 TSK/month): 2.5× mining multiplier, 5-day streak protection, minimal marketplace fees (1%), VIP support access, exclusive platform features.",
      relationships: JSON.stringify([
        { topic: "Mining Multiplier", relation: "increases with" },
        { topic: "Streak Protection", relation: "feature of" },
        { topic: "Marketplace Fees", relation: "reduced by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },

    // AI ASSISTANT ============================================================
    {
      topic: "AI Assistant",
      subtopic: "Capabilities",
      information: "The TSK Platform AI Assistant is an intelligent help system that provides personalized support and information. It can: 1) Answer questions about all platform features and processes. 2) Provide step-by-step guidance for tasks like mining, marketplace usage, and KYC verification. 3) Troubleshoot common issues and error messages. 4) Offer personalized recommendations based on your activity. 5) Help find specific marketplace items matching your criteria. 6) Track and explain your mining rewards and referral earnings. The assistant learns from interactions to continuously improve its responses.",
      relationships: JSON.stringify([
        { topic: "Platform Knowledge", relation: "utilizes" },
        { topic: "Personalization", relation: "feature of" },
        { topic: "Natural Language Processing", relation: "technology behind" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "AI Assistant",
      subtopic: "Learning Capabilities",
      information: "The TSK AI Assistant employs advanced self-learning mechanisms including: 1) Feedback Analysis - Improves responses based on user ratings and comments. 2) Platform Scanning - Automatically updates knowledge when platform features change. 3) Knowledge Gap Identification - Detects and fills missing information areas. 4) Conversation Memory - Remembers context from previous interactions for more relevant help. 5) Content Analysis - Monitors marketplace listings and community content to stay current. 6) Admin-triggered Learning - Receives manual knowledge updates for critical information. This multi-layered learning system ensures the assistant continuously improves over time.",
      relationships: JSON.stringify([
        { topic: "Auto-Learning", relation: "core mechanism of" },
        { topic: "User Feedback", relation: "improves" },
        { topic: "Knowledge Base", relation: "constantly updated by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "AI Assistant",
      subtopic: "Interaction Methods",
      information: "You can interact with the TSK AI Assistant in multiple ways: 1) Chat Widget - Available on every page via the chat icon in the bottom right. 2) Command Bar - Type '/' followed by your question anywhere on the platform. 3) Help Sections - Contextual AI assistance in complex areas like marketplace listings and KYC. 4) Email Integration - Send questions to assistant@tskplatform.com for AI responses. 5) Mobile App - Voice interaction through the mobile application. The assistant maintains conversation context across sessions and different interaction methods.",
      relationships: JSON.stringify([
        { topic: "Chat Interface", relation: "primary method for" },
        { topic: "Voice Recognition", relation: "mobile feature of" },
        { topic: "Context Awareness", relation: "enhances" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "AI Assistant",
      subtopic: "Commands and Keywords",
      information: "The AI Assistant recognizes special commands and keywords to provide faster assistance: 1) 'help' - Shows available topics and common questions. 2) 'mining' - Provides mining mechanics explanation and your mining stats. 3) 'wallet' - Shows wallet information and recent transactions. 4) 'marketplace' - Explains marketplace features or searches for items. 5) 'kyc' - Guides through verification process or checks status. 6) 'referrals' - Displays referral stats and sharing tools. 7) 'support' - Escalates to human support if needed. Commands can be combined with specific questions for more targeted help.",
      relationships: JSON.stringify([
        { topic: "Command System", relation: "streamlines" },
        { topic: "Quick Access", relation: "provided by" },
        { topic: "Human Support", relation: "accessed through" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    
    // SPECIALTY ASSISTANTS ===================================================
    {
      topic: "Product Assistant",
      subtopic: "Overview",
      information: "The Product Assistant is a specialized AI service that helps users find, understand, and purchase items on the TSK Marketplace. It can search for products based on categories, price ranges, keywords, and other criteria. The assistant provides detailed information about products including features, usage instructions, compatibility, and seller reputation. It can also compare similar items, recommend products based on your needs, and guide you through the purchase process. The Product Assistant is accessible through the AI chat by using marketplace-related queries.",
      relationships: JSON.stringify([
        { topic: "Marketplace", relation: "specialized assistant for" },
        { topic: "Product Recommendations", relation: "provides" },
        { topic: "Product Search", relation: "facilitates" }
      ]),
      confidence: 100,
      category: "ai",
      source: "official"
    },
    {
      topic: "KYC Assistant",
      subtopic: "Overview",
      information: "The KYC Assistant is a specialized AI service that guides users through the identity verification process. It provides step-by-step instructions for each verification level, explains document requirements, helps troubleshoot common issues, and checks verification status. The assistant can answer specific questions about document formats, rejection reasons, and resubmission processes. It can also help with document preparation by providing guidelines for photo quality, lighting, and positioning. The KYC Assistant is accessible through the AI chat by asking KYC-related questions.",
      relationships: JSON.stringify([
        { topic: "KYC Verification", relation: "specialized assistant for" },
        { topic: "Document Guidelines", relation: "provides" },
        { topic: "Verification Process", relation: "streamlines" }
      ]),
      confidence: 100,
      category: "ai",
      source: "official"
    },
    {
      topic: "Token Purchase Assistant",
      subtopic: "Overview",
      information: "The Token Purchase Assistant is a specialized AI service that helps users buy TSK tokens. It explains the different purchase methods (direct BNB purchase, exchanges, PayPal options), guides users through the purchase process, troubleshoots common payment issues, and provides real-time price information. The assistant can calculate conversion rates, recommend purchase amounts based on your goals, and explain transaction fees. It also monitors transaction status and provides updates on pending purchases. The Token Purchase Assistant is accessible through the AI chat by asking token-buying related questions.",
      relationships: JSON.stringify([
        { topic: "TSK Token", relation: "specialized assistant for" },
        { topic: "Payment Methods", relation: "explains" },
        { topic: "Price Information", relation: "provides" }
      ]),
      confidence: 100,
      category: "ai",
      source: "official"
    }
  ];
}

/**
 * Seed reasoning patterns to help the AI provide better structured responses
 */
async function seedReasoningPatterns() {
  console.log("Seeding AI reasoning patterns...");
  
  // Delete any existing reasoning patterns for platform guide
  await db.delete(aiReasoning).where(
    sql\`${aiReasoning.category} = 'platform-guide'\`
  ).execute();
  
  console.log("Deleted existing platform guide reasoning patterns to update them.");
  
  // Create reasoning patterns for different question types
  const reasoningPatterns = [
    {
      pattern: "Platform Feature Explanation",
      category: "platform-guide",
      priority: 90,
      rules: JSON.stringify([
        "Start with a clear definition of the feature",
        "Explain primary use cases and benefits",
        "Provide step-by-step usage instructions if applicable",
        "Mention any requirements or prerequisites",
        "Include related features or next steps"
      ]),
      examples: JSON.stringify([
        {
          question: "What is KYC verification?",
          answer: "KYC (Know Your Customer) verification is the identity confirmation process required for certain platform activities. It involves submitting government ID and proof of address documents. KYC verification enables marketplace selling and higher withdrawal limits. The process typically takes 24-48 hours to complete once documents are submitted."
        },
        {
          question: "How does mining work?",
          answer: "Mining on the TSK Platform is a daily activity where you earn tokens by clicking the 'Mine' button once every 24 hours. Your mining rewards increase with consecutive daily mining (streaks), premium membership status, and active referrals. Mining requires no special hardware and rewards are instantly added to your wallet."
        }
      ]),
      metadata: JSON.stringify({
        applicableTopics: ["Mining", "Marketplace", "KYC", "Wallet", "Referrals"],
        responseStyle: "informative"
      })
    },
    {
      pattern: "Step-by-Step Process Guide",
      category: "platform-guide",
      priority: 85,
      rules: JSON.stringify([
        "Start with a brief overview of the process goal",
        "Present numbered steps in logical sequence",
        "Use clear action verbs to begin each step",
        "Include any warnings or special considerations",
        "End with expected outcome or next steps"
      ]),
      examples: JSON.stringify([
        {
          question: "How do I verify my account?",
          answer: "To complete KYC verification on the TSK Platform:\n\n1. Navigate to Profile > KYC Verification in the sidebar menu\n2. Select your verification level (Basic or Advanced)\n3. Fill out the personal information form completely\n4. Upload a clear photo of your government ID\n5. Upload a recent proof of address document (for Advanced verification)\n6. Take a selfie holding your ID following the on-screen guidelines\n7. Submit your verification request\n\nYou'll receive email notifications about your verification status, and most requests are processed within 24-48 hours."
        },
        {
          question: "How do I sell items on the marketplace?",
          answer: "To sell items on the TSK Marketplace:\n\n1. Complete KYC verification if you haven't already\n2. Go to Marketplace > My Items in the sidebar menu\n3. Click the 'Create Listing' button\n4. Fill out the product details form (title, description, price, category)\n5. Upload product images and any digital files for delivery\n6. Set additional options like quantity and listing duration\n7. Review your listing details\n8. Submit for approval\n\nYour listing will be reviewed and typically approved within a day if it meets all platform guidelines. You'll be notified when it's live on the marketplace."
        }
      ]),
      metadata: JSON.stringify({
        applicableTopics: ["KYC", "Marketplace", "Mining", "Wallet", "Referrals"],
        responseStyle: "instructional"
      })
    },
    {
      pattern: "Troubleshooting Assistance",
      category: "platform-guide",
      priority: 80,
      rules: JSON.stringify([
        "Acknowledge the problem clearly",
        "Identify potential causes",
        "Provide solutions in order of likelihood",
        "Include verification steps to check if problem is resolved",
        "Offer alternative contact method if solutions don't work"
      ]),
      examples: JSON.stringify([
        {
          question: "Why can't I withdraw my tokens?",
          answer: "There are several possible reasons for withdrawal issues:\n\n1. KYC Verification: Withdrawals over 1000 TSK require completed KYC verification. Check your verification status in Profile > KYC Verification.\n\n2. Withdrawal Limits: You may have reached your daily or monthly withdrawal limit. Basic users can withdraw up to 5000 TSK monthly.\n\n3. Minimum Amount: Withdrawals must be at least 100 TSK to cover network fees.\n\n4. Wallet Configuration: Ensure your external wallet is correctly connected and on the BNB Smart Chain network.\n\n5. System Maintenance: Occasionally withdrawals may be temporarily disabled during system updates.\n\nIf you've checked all these issues and still can't withdraw, please contact support@tskplatform.com with details of the problem."
        },
        {
          question: "Why didn't I receive my mining rewards?",
          answer: "If you didn't receive expected mining rewards, check these common causes:\n\n1. Mining Cooldown: You can only mine once every 24 hours. Check your next available mining time on the mining page.\n\n2. Streak Reset: If you missed a day, your streak resets and rewards return to the base amount.\n\n3. Transaction Delay: Occasionally there might be a slight delay in rewards appearing in your wallet. Refresh the page after a few minutes.\n\n4. Account Issues: Ensure your account is in good standing without any restrictions.\n\n5. System Updates: During maintenance, mining might be temporarily affected.\n\nYou can verify your mining history in Dashboard > Mining History. If the problem persists after checking these items, please reach out to our support team through the Help section."
        }
      ]),
      metadata: JSON.stringify({
        applicableTopics: ["Mining", "Wallet", "Marketplace", "KYC", "Technical Issues"],
        responseStyle: "problem-solving"
      })
    },
    {
      pattern: "Feature Comparison",
      category: "platform-guide",
      priority: 75,
      rules: JSON.stringify([
        "Clearly identify the features being compared",
        "Use parallel structure to present comparable aspects",
        "Highlight key differences objectively",
        "Include advantages and limitations of each option",
        "Provide a summary recommendation if appropriate"
      ]),
      examples: JSON.stringify([
        {
          question: "What's the difference between Basic and Advanced KYC?",
          answer: "Basic vs. Advanced KYC Verification:\n\nDocuments Required:\n- Basic: Government ID and selfie\n- Advanced: Government ID, selfie, and proof of address\n\nProcessing Time:\n- Basic: Typically 24 hours\n- Advanced: Typically 48 hours\n\nWithdrawal Limits:\n- Basic: Up to 5,000 TSK monthly\n- Advanced: Up to 50,000 TSK monthly\n\nMarketplace Privileges:\n- Basic: Standard selling capabilities\n- Advanced: Enhanced listing options and higher selling limits\n\nFees:\n- Basic: Standard platform fees\n- Advanced: Reduced fees on certain transactions\n\nAdvanced verification provides significantly higher limits and additional privileges, making it recommended for active traders and sellers on the platform."
        },
        {
          question: "How do premium membership tiers compare?",
          answer: "Premium Membership Tier Comparison:\n\nSilver (100 TSK/month):\n- 1.5× mining multiplier\n- 1-day streak protection\n- 4% marketplace fees\n- Basic priority support\n\nGold (250 TSK/month):\n- 1.8× mining multiplier\n- 2-day streak protection\n- 3% marketplace fees\n- Featured marketplace listings\n- Standard priority support\n\nPlatinum (500 TSK/month):\n- 2.2× mining multiplier\n- 3-day streak protection\n- 2% marketplace fees\n- Priority KYC processing\n- High priority support\n\nDiamond (1000 TSK/month):\n- 2.5× mining multiplier\n- 5-day streak protection\n- 1% marketplace fees\n- VIP support access\n- Exclusive platform features\n- Early access to new features\n\nHigher tiers provide increasingly valuable benefits for active users, with Diamond offering the maximum advantages but at a premium price point. The Gold tier offers the best value for most regular users."
        }
      ]),
      metadata: JSON.stringify({
        applicableTopics: ["Membership", "KYC", "Wallet", "Mining"],
        responseStyle: "analytical"
      })
    }
  ];
  
  // Insert all reasoning patterns
  for (const pattern of reasoningPatterns) {
    await storage.createAIReasoningPattern(pattern);
  }
  
  console.log(`Added ${reasoningPatterns.length} reasoning patterns`);
}

// Run the main function
seedCompletePlatformKnowledge()
  .then(() => {
    console.log("Platform knowledge base successfully populated");
    process.exit(0);
  })
  .catch(error => {
    console.error("Error:", error);
    process.exit(1);
  });
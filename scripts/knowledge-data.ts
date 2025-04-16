/**
 * Knowledge Base Data
 * 
 * This file contains the comprehensive platform knowledge data and reasoning patterns
 * that are used by the seeding scripts to populate the AI knowledge base.
 */

import { InsertAIKnowledge } from "../shared/schema";

/**
 * Generate a complete knowledge base with detailed information about all platform aspects
 */
export function generateCompleteKnowledgeBase(): InsertAIKnowledge[] {
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
    
    // WALLET SYSTEM ===========================================================
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
      topic: "Wallet",
      subtopic: "Deposits",
      information: "To deposit TSK tokens into your platform wallet: 1) Navigate to the Wallet section. 2) Click 'Deposit' and select the deposit method (platform transfer, blockchain transfer, or purchase). 3) For blockchain transfers, copy your unique wallet address or scan the QR code. 4) Send TSK tokens from an external wallet to this address. 5) Wait for network confirmations (typically 1-2 minutes). 6) Receive notification when deposit is confirmed. Minimum deposit amount is 10 TSK tokens, and there are no deposit fees.",
      relationships: JSON.stringify([
        { topic: "Blockchain Transfer", relation: "method for" },
        { topic: "Wallet Address", relation: "required for" }
      ]),
      confidence: 100,
      category: "wallet",
      source: "official"
    },
    {
      topic: "Wallet",
      subtopic: "Withdrawals",
      information: "To withdraw TSK tokens from your platform wallet: 1) Navigate to the Wallet section. 2) Click 'Withdraw' and enter the withdrawal amount. 3) Specify the destination wallet address. 4) Confirm the transaction with your 2FA code if enabled. 5) Pay the withdrawal fee (1% of amount). 6) Wait for processing (typically completed within 10 minutes). Withdrawal limits depend on KYC verification level: Unverified (500 TSK/month), Basic KYC (5,000 TSK/month), Full KYC (unlimited). Minimum withdrawal amount is 50 TSK tokens.",
      relationships: JSON.stringify([
        { topic: "Withdrawal Limits", relation: "determined by" },
        { topic: "KYC Verification", relation: "affects" },
        { topic: "Destination Address", relation: "required for" }
      ]),
      confidence: 100,
      category: "wallet",
      source: "official"
    },
    {
      topic: "Wallet",
      subtopic: "Security Features",
      information: "TSK Platform Wallet security features include: 1) Encryption - all wallet data is encrypted at rest and in transit. 2) Two-Factor Authentication - required for withdrawals and large transfers. 3) Whitelisted Addresses - option to restrict withdrawals to pre-approved addresses only. 4) Activity Notifications - email and in-platform alerts for all wallet actions. 5) Cold Storage - majority of tokens stored in offline cold wallets. 6) Biometric Verification - optional fingerprint or face ID for mobile app transactions. 7) Transaction Limits - customizable daily and weekly transaction limits.",
      relationships: JSON.stringify([
        { topic: "Two-Factor Authentication", relation: "secures" },
        { topic: "Cold Storage", relation: "protection method for" },
        { topic: "Transaction Limits", relation: "safety feature of" }
      ]),
      confidence: 100,
      category: "wallet",
      source: "official"
    },
    {
      topic: "Wallet",
      subtopic: "External Wallet Integration",
      information: "The TSK Platform supports integration with external Web3 wallets including MetaMask, WalletConnect, Coinbase Wallet, and Trust Wallet. To connect an external wallet: 1) Go to Wallet section and select 'Connect External Wallet'. 2) Choose your wallet provider from the list. 3) Confirm the connection request in your wallet app. 4) Once connected, you can transfer tokens between platform and external wallets with reduced fees (0.5% instead of 1%). Connected wallets can also be used directly for marketplace purchases and staking activities without moving tokens to the platform wallet.",
      relationships: JSON.stringify([
        { topic: "MetaMask", relation: "supported by" },
        { topic: "WalletConnect", relation: "supported by" },
        { topic: "Marketplace", relation: "accessible via" }
      ]),
      confidence: 100,
      category: "wallet",
      source: "official"
    },
    
    // TSK TOKEN ==============================================================
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
      topic: "TSK Token",
      subtopic: "Token Utility",
      information: "TSK Tokens have multiple utility functions on the platform: 1) Marketplace Currency - buy and sell digital products and services. 2) Premium Memberships - subscribe to tiered platform benefits. 3) Staking - earn passive income and platform privileges. 4) Governance - vote on platform proposals and changes. 5) Advertising - purchase featured listings and promotional space. 6) Content Unlocking - access premium educational content. 7) API Access - use platform services programmatically. The multi-utility design ensures consistent token demand.",
      relationships: JSON.stringify([
        { topic: "Marketplace", relation: "uses as currency" },
        { topic: "Premium Membership", relation: "purchased with" },
        { topic: "Staking", relation: "supported by" }
      ]),
      confidence: 100,
      category: "token",
      source: "official"
    },
    {
      topic: "TSK Token",
      subtopic: "Tokenomics",
      information: "TSK Token's tokenomics structure includes: Initial Distribution - 30% to mining rewards, 20% to development fund, 15% to founding team (vested), 15% to early investors, 10% to marketing, 10% to liquidity pool. Current Circulation - approximately 35% of total supply. Burn Mechanism - 1% of all marketplace fees are permanently burned. Mining Emissions - gradually decreasing rewards schedule over 10 years. The token maintains price stability through utility demand balanced with mining supply and strategic burning.",
      relationships: JSON.stringify([
        { topic: "Token Distribution", relation: "defines initial" },
        { topic: "Burn Mechanism", relation: "reduces supply of" },
        { topic: "Mining Emissions", relation: "introduces new" }
      ]),
      confidence: 100,
      category: "token",
      source: "official"
    },
    {
      topic: "TSK Token",
      subtopic: "Purchase Options",
      information: "There are several ways to acquire TSK tokens: 1) Mining - earn daily rewards through the platform mining feature. 2) Direct Purchase - buy with BNB, BUSD, or other cryptocurrencies on the platform. 3) Exchanges - trade on partner exchanges like PancakeSwap and other DEXs. 4) P2P Marketplace - buy directly from other users with escrow protection. 5) Referral Program - earn from referring new users who mine or make purchases. The most cost-effective methods are mining (free but limited daily amount) and direct platform purchase (lowest fees).",
      relationships: JSON.stringify([
        { topic: "Mining", relation: "source of" },
        { topic: "Exchanges", relation: "trading venues for" },
        { topic: "Referral Program", relation: "rewards with" }
      ]),
      confidence: 100,
      category: "token",
      source: "official"
    },
    {
      topic: "TSK Token",
      subtopic: "Staking",
      information: "TSK Token staking allows users to lock their tokens for rewards and benefits. Staking options include: 1) Flexible Staking - withdraw anytime, 5-8% APY. 2) Locked Staking - higher rewards for fixed time periods: 30 days (10% APY), 90 days (15% APY), 180 days (20% APY). 3) Governance Staking - stake to vote on platform decisions, 7% APY plus voting rights. 4) Marketplace Boost Staking - receive seller fee discounts, 10% APY plus up to 50% reduction in marketplace fees. Staking rewards are distributed daily and can be automatically reinvested.",
      relationships: JSON.stringify([
        { topic: "APY", relation: "reward rate for" },
        { topic: "Locked Staking", relation: "type of" },
        { topic: "Governance", relation: "right earned through" }
      ]),
      confidence: 100,
      category: "token",
      source: "official"
    },
    
    // KYC VERIFICATION ======================================================
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
      topic: "KYC Verification",
      subtopic: "Basic KYC Process",
      information: "The Basic KYC verification process involves these steps: 1) Navigate to Profile and select 'KYC Verification'. 2) Enter personal information including full name, date of birth, and nationality. 3) Verify your phone number through an SMS code. 4) Upload a clear photo of your government-issued ID (passport, driver's license, or national ID). 5) Wait for review and approval (typically 1-2 business days). Basic KYC enables withdrawals up to 5,000 TSK per month and participation in premium platform features.",
      relationships: JSON.stringify([
        { topic: "Government ID", relation: "required for" },
        { topic: "Phone Verification", relation: "step in" },
        { topic: "Withdrawal Limits", relation: "increased by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "KYC Verification",
      subtopic: "Full KYC Process",
      information: "The Full KYC verification builds on Basic KYC with additional steps: 1) Complete Basic KYC first. 2) Upload proof of address (utility bill, bank statement less than 3 months old). 3) Complete a liveness check (short video recording following specific instructions). 4) Answer a questionnaire about anticipated platform usage. 5) Wait for review and approval (typically 2-3 business days). Full KYC enables unlimited withdrawals, seller status on the marketplace, and participation in governance.",
      relationships: JSON.stringify([
        { topic: "Proof of Address", relation: "required for" },
        { topic: "Liveness Check", relation: "component of" },
        { topic: "Seller Status", relation: "enabled by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "KYC Verification",
      subtopic: "Data Privacy",
      information: "The TSK Platform takes KYC data privacy seriously. All verification information is: 1) Encrypted in transit and at rest using bank-grade encryption. 2) Stored in compliance with GDPR and other regional privacy regulations. 3) Accessed only by authorized compliance personnel. 4) Never shared with third parties except as required by law. 5) Automatically deleted if verification is declined or account closed (after regulatory retention periods). Users can request data deletion after account closure through the privacy portal.",
      relationships: JSON.stringify([
        { topic: "Encryption", relation: "protects" },
        { topic: "GDPR", relation: "compliance standard for" },
        { topic: "Data Deletion", relation: "right regarding" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "KYC Verification",
      subtopic: "Common Issues",
      information: "Common issues during KYC verification include: 1) Blurry or incomplete document images - ensure well-lit, clear photos showing all corners. 2) Information mismatch - details must match across all documents and profile. 3) Expired documents - must be currently valid IDs. 4) Missing selfie or liveness issues - follow instructions carefully for the video verification. 5) Proof of address too old - must be less than 3 months old. If your verification is rejected, you'll receive specific feedback and can resubmit with corrections.",
      relationships: JSON.stringify([
        { topic: "Document Quality", relation: "affects" },
        { topic: "Verification Rejection", relation: "result of" },
        { topic: "Resubmission", relation: "solution for" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    
    // PREMIUM MEMBERSHIP =====================================================
    {
      topic: "Premium Membership",
      subtopic: "Overview",
      information: "TSK Platform's Premium Membership program offers enhanced benefits and privileges through four subscription tiers: Silver, Gold, Platinum, and Diamond. Each tier provides increasingly valuable benefits including mining reward multipliers, reduced marketplace fees, additional voting power, exclusive content access, and priority support. Memberships are purchased with TSK tokens on a monthly or annual basis, with annual subscriptions offering a 20% discount over monthly rates.",
      relationships: JSON.stringify([
        { topic: "Membership Tiers", relation: "structure of" },
        { topic: "Platform Benefits", relation: "enhanced by" },
        { topic: "Subscription", relation: "payment model for" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Premium Membership",
      subtopic: "Membership Tiers",
      information: "The four Premium Membership tiers include: 1) Silver - 100 TSK/month, 1.2× mining multiplier, 10% marketplace fee reduction. 2) Gold - 250 TSK/month, 1.5× mining multiplier, 25% marketplace fee reduction, 1-day streak protection. 3) Platinum - 500 TSK/month, 2.0× mining multiplier, 40% marketplace fee reduction, 2-day streak protection, priority support. 4) Diamond - 1000 TSK/month, 2.5× mining multiplier, 50% marketplace fee reduction, 3-day streak protection, priority support, exclusive content, and early feature access.",
      relationships: JSON.stringify([
        { topic: "Mining Multiplier", relation: "benefit of" },
        { topic: "Marketplace Fees", relation: "reduced by" },
        { topic: "Streak Protection", relation: "provided by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Premium Membership",
      subtopic: "Purchase and Management",
      information: "To purchase a Premium Membership: 1) Navigate to Account Settings > Premium Membership. 2) Select your desired tier and subscription duration (monthly or annual). 3) Review the benefits and cost summary. 4) Confirm payment with your wallet balance. Your membership activates immediately and renews automatically. You can cancel auto-renewal, upgrade, or downgrade your membership at any time through the same section. When upgrading, you'll receive prorated credit for your remaining subscription time.",
      relationships: JSON.stringify([
        { topic: "Subscription Duration", relation: "option for" },
        { topic: "Auto-renewal", relation: "feature of" },
        { topic: "Wallet Balance", relation: "pays for" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Premium Membership",
      subtopic: "Mining Benefits",
      information: "Premium Membership significantly enhances mining rewards through: 1) Mining Multipliers - direct increases to daily mining reward (1.2× to 2.5× depending on tier). 2) Streak Protection - prevents streak reset for 1-3 days of missed mining (tier dependent). 3) Priority Mining - members can mine earlier than standard users when system is under heavy load. 4) Exclusive Mining Events - special high-reward mining opportunities for members only. 5) Referral Bonus Boost - increased rewards from referral mining (additional 10-25% based on tier).",
      relationships: JSON.stringify([
        { topic: "Mining Rewards", relation: "increased by" },
        { topic: "Mining Streak", relation: "protected by" },
        { topic: "Exclusive Events", relation: "available through" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    
    // REFERRAL PROGRAM ======================================================
    {
      topic: "Referral Program",
      subtopic: "Overview",
      information: "The TSK Platform Referral Program allows users to earn rewards by inviting others to join the platform. For each successful referral who completes registration and begins mining, the referrer receives ongoing benefits including: 10% bonus on all mining rewards earned by referrals, 2% commission on marketplace purchases, and 5 TSK tokens when referrals complete KYC verification. The program has unlimited referral slots, enabling significant passive income potential for active community builders.",
      relationships: JSON.stringify([
        { topic: "Mining Rewards", relation: "provides bonus on" },
        { topic: "Marketplace", relation: "provides commission from" },
        { topic: "Passive Income", relation: "source of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Referral Program",
      subtopic: "Referral Process",
      information: "To participate in the referral program: 1) Navigate to the Referrals section in your dashboard. 2) Copy your unique referral link or code. 3) Share with friends, family, social media followers, or other potential users. 4) Track registrations, activity, and rewards through your referral dashboard. 5) Receive rewards automatically as your referrals engage with the platform. Each referral is permanently linked to your account, providing ongoing rewards regardless of when they joined.",
      relationships: JSON.stringify([
        { topic: "Referral Link", relation: "unique to" },
        { topic: "Sharing", relation: "growth method for" },
        { topic: "Tracking", relation: "monitors" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Referral Program",
      subtopic: "Reward Structure",
      information: "The TSK Referral Program rewards include: 1) Mining Bonus - 10% of all tokens mined by your referrals, with no effort required from you. 2) Marketplace Commission - 2% of all purchases made by your referrals in the marketplace. 3) KYC Completion Bonus - 5 TSK tokens for each referral who completes KYC verification. 4) Mining Multiplier - your mining rate increases by 5% for each active referral (up to 50% boost). 5) Leaderboard Rewards - additional monthly bonuses for top referrers. All rewards are paid in TSK tokens directly to your wallet.",
      relationships: JSON.stringify([
        { topic: "Mining Bonus", relation: "primary reward in" },
        { topic: "Marketplace Commission", relation: "secondary reward in" },
        { topic: "Wallet", relation: "destination for" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "Referral Program",
      subtopic: "Tips for Success",
      information: "Strategies for referral program success include: 1) Target the right audience - focus on crypto enthusiasts, online earners, and digital product users. 2) Provide value - explain platform benefits before sharing your link. 3) Create helpful content - tutorials, reviews, and guides about the platform. 4) Be transparent - clearly explain how the platform works and manage expectations. 5) Leverage social media - use platforms like Twitter, Reddit, and Telegram crypto communities. 6) Track and optimize - monitor which sharing methods produce the most active referrals.",
      relationships: JSON.stringify([
        { topic: "Target Audience", relation: "critical for" },
        { topic: "Content Creation", relation: "strategy for" },
        { topic: "Social Media", relation: "channel for" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    
    // AI ASSISTANT ==========================================================
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
    },
    {
      topic: "AI Assistant",
      subtopic: "Capabilities",
      information: "The AI Assistant's core capabilities include: 1) Platform Information - detailed explanations of all features, processes, and policies. 2) Step-by-Step Guidance - walkthrough instructions for complex tasks. 3) Problem Solving - troubleshooting for common issues and errors. 4) Personalized Recommendations - suggestions based on your activity and goals. 5) Market Information - current token prices and trends. 6) Natural Language Understanding - ability to interpret questions asked in everyday language. 7) Self-Improvement - the AI learns from interactions to provide better answers over time.",
      relationships: JSON.stringify([
        { topic: "Natural Language Processing", relation: "technology behind" },
        { topic: "Guidance", relation: "provided by" },
        { topic: "Self-Learning", relation: "capability of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "AI Assistant",
      subtopic: "Using the Assistant",
      information: "To use the AI Assistant: 1) Click the chat icon in the top navigation bar to open the assistant window. 2) Type your question or request in natural language. 3) Review the AI's response, which may include text explanations, links, images, or interactive elements. 4) For multi-step processes, the AI will guide you through each step and can be minimized while you complete actions. 5) Rate responses with thumbs up/down to help improve the AI. 6) Type 'help' for a list of suggested topics or 'clear' to start a new conversation.",
      relationships: JSON.stringify([
        { topic: "Chat Interface", relation: "access point for" },
        { topic: "Natural Language", relation: "input method for" },
        { topic: "Multi-step Guidance", relation: "specialty of" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    },
    {
      topic: "AI Assistant",
      subtopic: "Specialized Assistance",
      information: "The AI Assistant offers specialized guidance in several key areas: 1) New User Onboarding - helps first-time users navigate and understand the platform. 2) KYC Verification - guides through document preparation and submission process. 3) Token Purchase - explains options and walks through the buying process. 4) Marketplace - helps with finding, buying, and selling items. 5) Mining Optimization - strategies to maximize mining rewards. 6) Technical Support - troubleshoots common issues and escalates complex problems. Each specialty area includes detailed step-by-step workflows.",
      relationships: JSON.stringify([
        { topic: "Onboarding", relation: "area of" },
        { topic: "Technical Support", relation: "provides" },
        { topic: "Step-by-Step Workflows", relation: "utilized by" }
      ]),
      confidence: 100,
      category: "platform",
      source: "official"
    }
    
    // Add more entries as needed
  ];
}

// Define reasoning patterns for the AI
export const REASONING_PATTERNS = [
  {
    pattern: "step_by_step_process",
    description: "When the user asks how to perform a specific task, break down the response into clear numbered steps that they can follow sequentially.",
    exampleInput: "How do I complete KYC verification?",
    exampleOutput: "To complete KYC verification on the TSK Platform, follow these steps:\n\n1. Go to your Profile section from the sidebar menu\n2. Click on the 'KYC Verification' button\n3. Select the verification level you need (Basic or Full)\n4. Fill in your personal information accurately\n5. Upload clear photos of your required documents\n6. Complete the liveness check if applying for Full KYC\n7. Submit your application and wait for review (typically 1-3 business days)\n\nMake sure your documents are valid, clearly visible, and match the information in your profile.",
    category: "instruction",
    priority: 3
  },
  {
    pattern: "comparison_analysis",
    description: "When the user is deciding between multiple options, present a structured comparison highlighting the key differences, benefits, and drawbacks of each option.",
    exampleInput: "What's the difference between the premium membership tiers?",
    exampleOutput: "Here's a comparison of the TSK Platform's Premium Membership tiers:\n\n📊 Silver ($100 TSK/month)\n• 1.2× mining multiplier\n• 10% marketplace fee reduction\n• No streak protection\n\n📊 Gold ($250 TSK/month)\n• 1.5× mining multiplier\n• 25% marketplace fee reduction\n• 1-day streak protection\n\n📊 Platinum ($500 TSK/month)\n• 2.0× mining multiplier\n• 40% marketplace fee reduction\n• 2-day streak protection\n• Priority support\n\n📊 Diamond ($1000 TSK/month)\n• 2.5× mining multiplier\n• 50% marketplace fee reduction\n• 3-day streak protection\n• Priority support\n• Exclusive content access\n• Early feature access\n\nThe best value depends on your usage: Diamond maximizes mining profits for active daily miners, while Silver offers basic benefits for occasional users.",
    category: "analysis",
    priority: 2
  },
  {
    pattern: "troubleshooting_guide",
    description: "When the user reports a problem, provide a troubleshooting guide that addresses potential causes and solutions in order of likelihood.",
    exampleInput: "I can't withdraw my tokens. What's wrong?",
    exampleOutput: "Let's troubleshoot your token withdrawal issue:\n\n1. **Verify your balance**\n   - Ensure you have enough tokens (minimum withdrawal is 50 TSK)\n   - Check that your balance exceeds the withdrawal amount plus the 1% fee\n\n2. **Check KYC verification status**\n   - Unverified accounts: limited to 500 TSK/month\n   - Basic KYC: limited to 5,000 TSK/month\n   - Full KYC: unlimited withdrawals\n\n3. **Confirm withdrawal address**\n   - Verify the destination wallet address is correct\n   - Ensure the address is compatible with TSK tokens (BSC network)\n\n4. **Security checks**\n   - Complete any pending 2FA verification\n   - Check if you have enabled withdrawal address whitelisting\n   - Ensure you're not exceeding your custom transaction limits\n\nIf you've checked all these and still have issues, please contact support through your profile page with the specific error message you're receiving.",
    category: "support",
    priority: 3
  },
  {
    pattern: "feature_explanation",
    description: "When explaining a platform feature, start with a concise overview followed by detailed information about functionality, benefits, and how to access it.",
    exampleInput: "What is TSK staking?",
    exampleOutput: "TSK Staking is a feature that allows you to earn passive income by locking your TSK tokens for a specified period.\n\n**Overview:**\nStaking works by temporarily removing tokens from circulation, which helps maintain token value while rewarding you with additional tokens and platform benefits.\n\n**Staking Options:**\n• Flexible Staking: No lock period, withdraw anytime, 5-8% APY\n• Locked Staking: Fixed periods with higher returns\n  - 30 days: 10% APY\n  - 90 days: 15% APY\n  - 180 days: 20% APY\n• Governance Staking: 7% APY plus voting rights\n• Marketplace Boost: 10% APY plus reduced seller fees\n\n**Benefits:**\n• Earn passive income through regular rewards\n• Gain additional platform privileges\n• Participate in governance decisions\n• Reduce marketplace selling fees\n\n**How to Access:**\nGo to Wallet > Staking in your dashboard, select your preferred staking option, enter the amount, and confirm the staking transaction.\n\nRewards are distributed daily and can be automatically compounded for maximum returns.",
    category: "education",
    priority: 2
  },
  {
    pattern: "cost_benefit_analysis",
    description: "When users are considering an investment or purchase decision, provide a clear analysis of the costs, potential returns, risks, and timeline considerations.",
    exampleInput: "Is it worth buying the Diamond membership?",
    exampleOutput: "Let's analyze whether Diamond membership (1,000 TSK/month) is worthwhile for you:\n\n**Cost Analysis:**\n• 1,000 TSK monthly or 9,600 TSK annually (20% discount)\n• Equivalent to approximately $XXX at current token value\n\n**Benefits Quantified:**\n• 2.5× mining multiplier (150% increase from base rate)\n   - If you mine 10 TSK daily normally, you'll earn 25 TSK daily with Diamond\n   - Monthly difference: +450 TSK (worth more than your membership cost)\n• 50% marketplace fee reduction\n   - Saves 2.5 TSK per 100 TSK in sales (normally 5% fee)\n   - Break-even point: 40,000 TSK monthly marketplace sales\n• 3-day streak protection (prevents losing up to ~50% in streak bonuses)\n\n**Breakeven Analysis:**\n• For active daily miners: Profitable if you consistently mine and have a high streak\n• For marketplace sellers: Profitable with 40,000+ TSK monthly sales\n• For combined users: Profitable with moderate mining and selling\n\n**Recommendation:**\nDiamond membership is worth it if you:\n• Mine daily without exception\n• Maintain high mining streaks\n• Actively sell on the marketplace\n• Value priority support and exclusive content\n\nIf you're a casual user or inconsistent miner, consider starting with Gold or Platinum instead.",
    category: "analysis",
    priority: 2
  }
];
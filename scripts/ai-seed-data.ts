import { db } from "../server/db";
import { aiKnowledgeBase, aiReasoning } from "../shared/schema";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

/**
 * Seed initial AI knowledge base with platform information and common questions
 */
async function seedAIKnowledgeBase() {
  console.log("Seeding AI knowledge base...");
  
  // Check if we already have knowledge entries
  const existingEntries = await db.select().from(aiKnowledgeBase).execute();
  
  // We'll add new entries even if there are existing ones
  console.log(`Found ${existingEntries.length} existing knowledge entries.`);
  
  // Delete any existing mining entries to replace them with updated ones
  await db.delete(aiKnowledgeBase).where(
    sql`${aiKnowledgeBase.topic} = 'Mining'`
  ).execute();
  
  console.log("Deleted existing mining knowledge entries to update them.");
  
  // Data array for knowledge base entries
  const knowledgeData = [
    // Mining capabilities
    {
      topic: "Mining",
      subtopic: "Overview",
      information: "TSK Platform offers daily mining rewards for active users. You can earn TSK tokens by logging in daily and maintaining a mining streak. The daily mining reward increases with your streak length and can be boosted with referrals. If you miss a day, your streak will reset.",
      relationships: JSON.stringify([]),
      confidence: 95,
      lastUpdated: new Date(),
      createdAt: new Date()
    },
    {
      topic: "Mining",
      subtopic: "Streaks",
      information: "Mining streaks increase your daily token rewards. Each consecutive day you mine increases your streak multiplier. The maximum streak multiplier is 7x, achieved after 7 consecutive days. Missing a day resets your streak to 1x.",
      category: "platform",
      confidence: 90,
      source: "official",
      createdAt: new Date()
    },
    {
      topic: "Mining",
      subtopic: "Boost",
      information: "You can boost your mining rewards through several methods: 1) Maintaining a daily streak, 2) Referring new users who actively mine, 3) Holding certain NFTs that provide mining boosts, 4) Completing daily platform tasks.",
      category: "platform",
      confidence: 90,
      source: "official",
      createdAt: new Date()
    },
    
    // Wallet functionality
    {
      topic: "Wallet",
      subtopic: "Connection",
      information: "The TSK Platform supports connecting various cryptocurrency wallets including MetaMask, WalletConnect, and Coinbase Wallet. To connect your wallet, click on the wallet icon in the top right corner and select your preferred wallet provider. Follow the prompts to complete the connection process.",
      category: "platform",
      confidence: 95,
      source: "official",
      createdAt: new Date()
    },
    {
      topic: "Wallet",
      subtopic: "Token Transfers",
      information: "You can transfer TSK tokens to other users by navigating to your wallet page, selecting 'Transfer', and entering the recipient's username or wallet address. Transfers between platform users are free, while transfers to external wallets incur a small network fee.",
      category: "platform",
      confidence: 90,
      source: "official",
      createdAt: new Date()
    },
    
    // Marketplace information
    {
      topic: "Marketplace",
      subtopic: "Overview",
      information: "The TSK Marketplace allows users to buy, sell and trade digital items using TSK tokens. These items include NFTs, digital collectibles, in-platform upgrades, and virtual goods. All transactions on the marketplace are recorded on the blockchain for transparency and security.",
      category: "platform",
      confidence: 95,
      source: "official",
      createdAt: new Date()
    },
    {
      topic: "Marketplace",
      subtopic: "Listing Items",
      information: "To list an item on the marketplace, go to the 'My Items' section, select the item you wish to sell, click 'List Item', set your price in TSK tokens, add a description, and confirm the listing. The platform charges a 2.5% fee on successful sales.",
      category: "platform",
      confidence: 90,
      source: "official",
      createdAt: new Date()
    },
    
    // KYC verification
    {
      topic: "KYC",
      subtopic: "Verification",
      information: "KYC (Know Your Customer) verification is required for users who wish to withdraw large amounts of tokens or access premium platform features. The process involves submitting government-issued ID and providing basic personal information. KYC verification typically takes 1-3 business days to complete.",
      category: "platform",
      confidence: 95,
      source: "official",
      createdAt: new Date()
    },
    {
      topic: "KYC",
      subtopic: "Requirements",
      information: "To complete KYC verification, you need: 1) A valid government-issued photo ID (passport, driver's license, or national ID card), 2) A clear selfie holding your ID, 3) Proof of address (utility bill or bank statement less than 3 months old), 4) Your basic personal information.",
      category: "platform",
      confidence: 90,
      source: "official",
      createdAt: new Date()
    },
    
    // Referral system
    {
      topic: "Referrals",
      subtopic: "Program",
      information: "The TSK Platform referral program rewards users for inviting others. You earn a 10% bonus on your referrals' mining rewards and a one-time bonus of 50 TSK tokens for each new user who completes KYC verification. Your referral link can be found in your profile settings.",
      category: "platform",
      confidence: 95,
      source: "official",
      createdAt: new Date()
    },
    {
      topic: "Referrals",
      subtopic: "Tracking",
      information: "You can track your referrals in the 'My Network' section of your profile. This shows who you've referred, their activity status, and the rewards you've earned from them. The system automatically credits your account with referral bonuses daily.",
      category: "platform",
      confidence: 90,
      source: "official",
      createdAt: new Date()
    },
    
    // Platform policies
    {
      topic: "Policy",
      subtopic: "Terms of Service",
      information: "The TSK Platform Terms of Service outline the rules for platform usage, user responsibilities, prohibited activities, and intellectual property rights. By using the platform, you agree to abide by these terms. Violations may result in account suspension or termination.",
      category: "policy",
      confidence: 95,
      source: "official",
      createdAt: new Date()
    },
    {
      topic: "Policy",
      subtopic: "Privacy",
      information: "The TSK Platform Privacy Policy explains how we collect, use, and protect your personal data. We only collect information necessary for platform functionality and comply with global data protection regulations. Users have the right to access, modify, or delete their personal data.",
      category: "policy",
      confidence: 95,
      source: "official",
      createdAt: new Date()
    },
    
    // Technical support
    {
      topic: "Support",
      subtopic: "Account Recovery",
      information: "If you've lost access to your account, you can recover it by clicking 'Forgot Password' on the login page. You'll receive a recovery link via email. If you've lost access to your email, contact support with proof of identity. For wallet-connected accounts, you'll need access to your original wallet.",
      category: "support",
      confidence: 90,
      source: "official",
      createdAt: new Date()
    },
    {
      topic: "Support",
      subtopic: "Common Issues",
      information: "Common platform issues include: 1) Mining rewards not credited - usually resolved within 24 hours, 2) Wallet connection errors - try refreshing the page or using a different browser, 3) Marketplace transactions failing - check your token balance and network status, 4) KYC verification delays - typically due to high volume.",
      category: "support",
      confidence: 85,
      source: "official",
      createdAt: new Date()
    },
    
    // AI Assistant capabilities
    {
      topic: "Assistant",
      subtopic: "Overview",
      information: "The TSK Platform AI Assistant helps users navigate the platform, answer questions, troubleshoot issues, and provide personalized recommendations. The assistant uses context-aware technology to understand your specific situation and learning capabilities to improve over time.",
      category: "platform",
      confidence: 95,
      source: "official",
      createdAt: new Date()
    },
    {
      topic: "Assistant",
      subtopic: "Commands",
      information: "The AI Assistant recognizes certain commands: 1) 'help' - shows available topics, 2) 'mining' - explains mining mechanics, 3) 'wallet' - provides wallet information, 4) 'marketplace' - explains marketplace features, 5) 'support' - connects you to human support if needed.",
      category: "platform",
      confidence: 90,
      source: "official",
      createdAt: new Date()
    }
  ];
  
  // Insert all knowledge entries
  for (const entry of knowledgeData) {
    await storage.createAIKnowledgeEntry(entry);
  }
  
  console.log(`Added ${knowledgeData.length} knowledge base entries`);
}

/**
 * Seed reasoning patterns for the AI system
 */
async function seedReasoningPatterns() {
  console.log("Seeding AI reasoning patterns...");
  
  // Check if we already have reasoning patterns
  const existingPatterns = await db.select().from(aiReasoning).execute();
  
  // We'll add or update mining related reasoning patterns
  console.log(`Found ${existingPatterns.length} existing reasoning patterns.`);
  
  // Delete any mining-related reasoning patterns to update them
  await db.delete(aiReasoning).where(
    sql`${aiReasoning.pattern} LIKE '%Mining%'`
  ).execute();
  
  console.log("Deleted existing mining-related reasoning patterns to update them.");
  
  // Data array for reasoning patterns
  const patternsData = [
    // Mining-specific reasoning pattern
    {
      category: "mining",
      pattern: "Mining-specific reasoning",
      priority: 95, // Higher priority for mining questions
      rules: [
        "If [question] contains mining terms, then prioritize mining knowledge",
        "If user's mining status is active, then provide status-aware information",
        "If mining question is technical, then provide step-by-step explanation",
        "If question is about rewards, then explain streak and bonus system",
        "If mining issue reported, then troubleshoot in sequential order"
      ],
      examples: [
        {
          input: "Why did I get fewer mining rewards today?",
          output: "Mining rewards can vary for several reasons: 1) Your streak may have reset if you missed a day (streak affects multiplier), 2) Referral bonuses may have changed if your referrals haven't mined recently, 3) The platform might be running a special event that's now ended, or 4) There might be a temporary system issue. Check your streak status on the mining dashboard to confirm your current multiplier, and verify your referrals' activity in the network section.",
          reasoning: "Identified mining rewards issue > Check streak and multiplier first > Consider referral changes > Look at platform events > Suggest diagnostic actions"
        },
        {
          input: "What happens if I miss a day of mining?",
          output: "If you miss a day of mining, your streak counter will reset to 1 and you'll lose your streak multiplier. For example, if you had a 7-day streak (which gives a 7x multiplier), missing one day will reset it to a 1x multiplier. This significantly reduces your daily rewards. The streak builds again as you mine consecutively each day. Some users set calendar reminders to avoid missing their daily mining activity.",
          reasoning: "Recognized streak continuation question > Explained consequence (reset) > Quantified impact (multiplier loss) > Provided practical mitigation strategy"
        }
      ]
    },
    // Sequential logic for problem-solving
    {
      category: "problem-solving",
      pattern: "Sequential logical reasoning",
      priority: 90,
      rules: [
        "If [problem] is specific, then identify key components",
        "If components are identified, then analyze relationships",
        "If relationships are understood, then apply relevant platform knowledge",
        "If multiple solutions exist, then rank by effectiveness",
        "If solution requires user action, then provide step-by-step instructions"
      ],
      examples: [
        {
          input: "I can't find my mining rewards",
          output: "Your mining rewards are credited to your wallet automatically every 24 hours. To check your rewards: 1) Go to the Wallet section, 2) View your transaction history, 3) Look for entries labeled 'Mining Reward'. If you don't see recent rewards, verify your mining streak is active on the Mining page. Sometimes there's a delay of up to 24 hours in processing rewards.",
          reasoning: "Identified specific problem > Located relevant knowledge > Provided step-by-step solution with troubleshooting"
        },
        {
          input: "How do I increase my mining rate?",
          output: "To increase your mining rate: 1) Maintain a daily mining streak (up to 7 days for maximum bonus), 2) Refer new users (10% bonus on their mining), 3) Hold special NFTs with mining boosts, 4) Complete daily tasks. The most effective method is combining all these strategies, with daily streaks being the easiest to maintain.",
          reasoning: "Identified goal > Found multiple relevant solutions > Ranked by effectiveness > Provided actionable steps"
        }
      ]
    },
    
    // Inference for platform knowledge
    {
      category: "inference",
      pattern: "Analogical reasoning",
      priority: 80,
      rules: [
        "If [query] relates to platform feature, then find similar features for comparison",
        "If similar features exist, then map relationships between features",
        "If relationships are mapped, then transfer insights between features",
        "If transfer is possible, then explain using familiar concepts",
        "If explanation requires context, then provide relevant examples"
      ],
      examples: [
        {
          input: "What's the difference between marketplace fees and transfer fees?",
          output: "Marketplace fees and transfer fees are similar in that both are small charges for platform transactions, but they differ in purpose and amount. Marketplace fees (2.5%) apply when selling items and help maintain the platform. Transfer fees only apply when sending tokens to external wallets and cover blockchain network costs. In-platform transfers between users have no fees.",
          reasoning: "Identified comparison request > Mapped relationships between fee types > Explained similarities and differences"
        },
        {
          input: "Is mining like staking?",
          output: "Mining on TSK Platform is similar to staking in some ways but has key differences. Both reward users for platform participation over time. However, mining requires daily active participation (clicking the mine button), while traditional staking is passive after the initial stake. Mining rewards are based on streak consistency rather than the amount staked. Mining also doesn't lock your tokens like staking typically does.",
          reasoning: "Found analogous concept > Mapped relationships > Highlighted similarities and differences"
        }
      ]
    },
    
    // Contextual analysis for user-specific situations
    {
      category: "interpretation",
      pattern: "Contextual analysis",
      priority: 85,
      rules: [
        "If [query] contains ambiguous terms, then consider current user context",
        "If user context includes location/page, then prioritize relevant information",
        "If user has interaction history, then incorporate relevant past interactions",
        "If multiple interpretations exist, then select most relevant to context",
        "If context changes interpretation, then explicitly acknowledge context"
      ],
      examples: [
        {
          input: "How do I use this?",
          output: "I see you're on the Marketplace page. To use the marketplace: 1) Browse listings using the category filters at the top, 2) Click on items to view details, 3) Use the 'Buy Now' button to purchase with TSK tokens, or 4) Place bids on auction items. Your purchases will appear in your 'My Items' section after the transaction is confirmed.",
          reasoning: "Recognized ambiguous query > Identified user location context (Marketplace) > Provided contextually relevant explanation"
        },
        {
          input: "What do these numbers mean?",
          output: "On the Mining Dashboard, these numbers represent your mining statistics: The large number at the top is your current mining streak (consecutive days). The percentage shows your streak bonus (up to +600% at 7 days). The green numbers show today's mining rewards, and the blue chart displays your 30-day mining history.",
          reasoning: "Interpreted ambiguous question > Used page context > Explained specific elements visible to user"
        }
      ]
    },
    
    // Learning reasoning for continuous improvement
    {
      category: "learning",
      pattern: "Bayesian updating",
      priority: 70,
      rules: [
        "If new [information] contradicts existing knowledge, then assess source reliability",
        "If source is reliable, then update confidence values",
        "If pattern of questions emerges, then identify knowledge gaps",
        "If knowledge gap exists, then flag for learning",
        "If multiple sources conflict, then synthesize balanced view"
      ],
      examples: [
        {
          input: "I heard the mining rate was increased recently",
          output: "Based on our most recent information, the base mining rate remains at 10 TSK tokens per day. However, the platform occasionally runs special mining events with increased rates during promotions or holidays. If there's been a permanent change, it would be announced in the platform news section. I'll check for any recent updates on this topic.",
          reasoning: "Recognized potential new information > Maintained 60% confidence in current knowledge > Acknowledged possibility of change > Suggested verification source"
        },
        {
          input: "Someone told me KYC isn't required anymore",
          output: "Our current information indicates that KYC verification is still required for withdrawals above 1000 TSK tokens and for accessing premium features. This is an important compliance requirement. However, platform policies do evolve. For the most accurate information, I recommend checking the KYC section in your profile or the official announcement channel. I'll note this question to verify if there have been recent policy changes.",
          reasoning: "Identified contradiction with existing knowledge > Maintained 80% confidence in current policy > Provided verification method > Flagged for verification"
        }
      ]
    },
    
    // Personalization for user-specific responses
    {
      category: "personalization",
      pattern: "Pattern recognition",
      priority: 75,
      rules: [
        "If [user] has profile information, then incorporate relevant details",
        "If user interaction history exists, then identify behavioral patterns",
        "If behavioral patterns exist, then tailor response to user preferences",
        "If user expertise level is known, then adjust technical language",
        "If user has specific goals, then prioritize goal-relevant information"
      ],
      examples: [
        {
          input: "What should I do next to maximize my earnings?",
          output: "Based on your profile, I see you've been consistent with daily mining but haven't utilized the referral program yet. Since you already have a 7-day streak (maximum mining bonus), your best opportunity for increasing earnings now would be to refer friends using your personal link in the Profile section. Each active referral gives you a 10% bonus on their mining. You could also explore the marketplace for NFTs with mining boost properties.",
          reasoning: "Analyzed user account data > Identified maximized streak but unused referral potential > Suggested personalized next steps based on user's specific situation"
        },
        {
          input: "Is there anything I'm missing out on?",
          output: "Looking at your activity, I notice you haven't participated in the weekly contests yet, which award bonus tokens to winners. Given your interest in digital art (based on your marketplace browsing), this week's NFT design contest would be particularly relevant for you. Also, you currently have 3 unclaimed daily task rewards in your notification center that will expire in 24 hours.",
          reasoning: "Recognized broad question > Examined user activity patterns > Identified unused opportunities matching user interests > Prioritized time-sensitive information"
        }
      ]
    }
  ];
  
  // Insert all reasoning patterns
  for (const pattern of patternsData) {
    await storage.createAIReasoningPattern(pattern);
  }
  
  console.log(`Added ${patternsData.length} reasoning patterns`);
}

/**
 * Run all seeding functions
 */
async function seedAllAIData() {
  try {
    await seedAIKnowledgeBase();
    await seedReasoningPatterns();
    console.log("AI data seeding completed successfully!");
  } catch (error) {
    console.error("Error seeding AI data:", error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedAllAIData();
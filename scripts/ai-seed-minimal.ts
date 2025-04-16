import { db } from "../server/db";
import { aiKnowledgeBase, aiReasoning } from "../shared/schema";

/**
 * Simple script to seed minimal AI data for testing
 */
async function seedMinimalAIData() {
  try {
    console.log("Seeding minimal AI knowledge base...");
    
    // Add a few knowledge entries
    await db.insert(aiKnowledgeBase).values([
      {
        topic: "Mining",
        subtopic: "Overview",
        information: "TSK Platform offers daily mining rewards for active users. You can earn TSK tokens by logging in daily and maintaining a mining streak. The daily mining reward increases with your streak length and can be boosted with referrals. If you miss a day, your streak will reset.",
        relationships: [],
        confidence: 95
      },
      {
        topic: "AI Assistant",
        subtopic: "Overview",
        information: "The TSK Platform AI Assistant helps users navigate the platform, answer questions, troubleshoot issues, and provide personalized recommendations. The assistant uses context-aware technology to understand your specific situation and learning capabilities to improve over time.",
        relationships: [],
        confidence: 95
      }
    ]);
    
    console.log("Added knowledge base entries");
    
    // Add reasoning patterns
    await db.insert(aiReasoning).values([
      {
        category: "problem-solving",
        pattern: "Sequential logical reasoning",
        priority: 90,
        rules: [
          "If [problem] is specific, then identify key components",
          "If components are identified, then analyze relationships",
          "If relationships are understood, then apply relevant platform knowledge"
        ],
        examples: [
          {
            input: "How do mining rewards work?",
            output: "Mining rewards are earned by clicking the mine button daily. You get a streak bonus for consecutive days, up to 7 days maximum. Your rewards are credited to your wallet automatically. To maximize rewards, maintain your streak and refer friends.",
            reasoning: "Identified specific question > Retrieved mining knowledge > Provided clear explanation"
          }
        ]
      }
    ]);
    
    console.log("Added reasoning patterns");
    console.log("Minimal AI data seeding completed successfully!");
    
  } catch (error) {
    console.error("Error seeding AI data:", error);
  } finally {
    process.exit(0);
  }
}

// Run the seeding
seedMinimalAIData();
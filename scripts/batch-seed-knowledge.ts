/**
 * Batched Knowledge Base Seeding Script
 * 
 * This script runs the comprehensive platform knowledge seeding process
 * in smaller batches to avoid timeouts and provide better progress tracking.
 */

import { db } from "../server/db";
import { aiKnowledgeBase, aiReasoning } from "../shared/schema";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

// Import the full knowledge base data from the complete script
import { generateCompleteKnowledgeBase, REASONING_PATTERNS } from "./knowledge-data";

const BATCH_SIZE = 10; // Process 10 entries at a time

async function seedKnowledgeInBatches() {
  console.log("Starting batched knowledge base seeding...");

  // Check if we already have knowledge entries
  const existingEntries = await db.select().from(aiKnowledgeBase).execute();
  console.log(`Found ${existingEntries.length} existing knowledge entries.`);
  
  // Get the complete knowledge base data
  const knowledgeData = generateCompleteKnowledgeBase();
  
  console.log(`Processing ${knowledgeData.length} knowledge entries in batches of ${BATCH_SIZE}`);
  
  // Process in batches
  for (let i = 0; i < knowledgeData.length; i += BATCH_SIZE) {
    const batch = knowledgeData.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(knowledgeData.length/BATCH_SIZE)}`);
    
    // Insert batch of knowledge entries
    for (const entry of batch) {
      try {
        await storage.createAIKnowledgeEntry(entry);
        console.log(`Added: ${entry.topic} - ${entry.subtopic}`);
      } catch (error) {
        console.error(`Error adding ${entry.topic} - ${entry.subtopic}:`, error);
      }
    }
    
    console.log(`Completed batch ${Math.floor(i/BATCH_SIZE) + 1}`);
  }
  
  console.log("Knowledge entries completed. Now adding reasoning patterns...");
  
  // Add reasoning patterns
  for (const pattern of REASONING_PATTERNS) {
    try {
      await db.insert(aiReasoning).values({
        pattern: pattern.pattern,
        description: pattern.description,
        exampleInput: pattern.exampleInput,
        exampleOutput: pattern.exampleOutput,
        category: pattern.category,
        priority: pattern.priority || 1
      }).onConflictDoUpdate({
        target: [aiReasoning.pattern],
        set: {
          description: pattern.description,
          exampleInput: pattern.exampleInput,
          exampleOutput: pattern.exampleOutput,
          category: pattern.category,
          priority: pattern.priority || 1
        }
      });
      console.log(`Added reasoning pattern: ${pattern.description.substring(0, 50)}...`);
    } catch (error) {
      console.error(`Error adding reasoning pattern:`, error);
    }
  }
  
  console.log("Batched knowledge base seeding completed!");
}

// Run the function
seedKnowledgeInBatches()
  .catch(console.error)
  .finally(() => {
    console.log("Script execution completed");
    // Close DB connection (optional, as the process will terminate anyway)
    // db.$pool.end();
  });
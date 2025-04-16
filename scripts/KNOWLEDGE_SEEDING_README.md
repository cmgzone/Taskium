# AI Knowledge Base Seeding Guide

This guide explains how to seed the AI knowledge base with essential platform information.

## Overview

The TSK Platform AI Assistant uses a knowledge base of structured information about the platform's features, workflows, and capabilities. This knowledge base is stored in the database and accessed by the AI when responding to user queries.

Due to the large amount of information needed for comprehensive AI knowledge, we've implemented a batched seeding approach that breaks the process into smaller, more manageable chunks to avoid timeouts.

## Available Scripts

### Complete Knowledge Seeding

To run the full knowledge seeding process in batched mode:

```bash
node scripts/seed-knowledge.js
```

This script coordinates the seeding process by running individual seed scripts in sequence.

### Individual Seed Scripts

If you need to seed specific categories of knowledge:

```bash
# Seed essential platform knowledge (core concepts and basic reasoning patterns)
npx tsx scripts/seed-essential-knowledge.ts

# Seed detailed marketplace knowledge
npx tsx scripts/seed-marketplace-knowledge.ts 

# Seed TSK token-specific knowledge
npx tsx scripts/seed-token-knowledge.ts
```

## Creating New Knowledge Seeds

To add more specific knowledge to the AI system:

1. Create a new seed script following the pattern in `seed-essential-knowledge.ts`
2. Define knowledge entries with appropriate topics, subtopics, and relationships
3. Add your new script to the `run-knowledge-seeding.sh` shell script

Example structure for a new seed script:

```typescript
import { db } from "../server/db";
import { aiKnowledgeBase } from "../shared/schema";
import { storage } from "../server/storage";
import { sql } from "drizzle-orm";

// Define your knowledge entries
const YOUR_KNOWLEDGE = [
  {
    topic: "Topic Name",
    subtopic: "Subtopic Name",
    information: "Detailed information about this topic...",
    relationships: JSON.stringify([
      { topic: "Related Topic", relation: "type of relation" }
    ]),
    confidence: 100,
    category: "your-category",
    source: "official"
  }
];

async function seedYourKnowledge() {
  // Implementation similar to other seed scripts
}

// Run the function
seedYourKnowledge()
  .catch(error => console.error("Error:", error))
  .finally(() => console.log("Completed"));
```

## Knowledge Base Structure

Each knowledge entry consists of:

- **topic**: Main subject area (e.g., "Marketplace", "TSK Token")
- **subtopic**: Specific aspect of the topic (e.g., "Overview", "Purchasing")  
- **information**: Detailed knowledge content in clear, concise language
- **relationships**: JSON string of related topics and their relationships
- **confidence**: Confidence score (0-100) for the information
- **category**: Organizational category (e.g., "marketplace", "token")
- **source**: Origin of the information (typically "official" for core platform info)

## AI Reasoning Patterns

In addition to factual knowledge, the system uses reasoning patterns that guide how the AI structures responses. These patterns include:

- `step_by_step_process`: For breaking down instructions into clear steps
- `feature_explanation`: For explaining platform features in a structured way

You can add more reasoning patterns by following the examples in `seed-essential-knowledge.ts`.

## Troubleshooting

If you encounter timeouts during seeding, try:

1. Running individual seed scripts separately
2. Breaking large knowledge sets into smaller batches
3. Adding delays between batch insertions for very large datasets
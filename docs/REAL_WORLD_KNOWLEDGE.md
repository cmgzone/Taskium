# Real-World Knowledge Enhancement for AI Assistant

## Overview

The TSK Platform AI Assistant has been enhanced with the ability to answer general real-world questions beyond platform-specific information. This feature allows the AI to provide valuable information about a wide range of topics including science, history, mathematics, arts, technology, and more.

## Features

- **Real-world question detection**: Automatically identifies when a user is asking about general knowledge vs. platform-specific information
- **Knowledge categorization**: Organizes knowledge into categories for better retrieval
- **OpenAI integration**: Uses OpenAI's powerful language models for enhanced responses when an API key is available
- **Fallback mechanisms**: Provides reasonable responses even when OpenAI is not available
- **Conversation context**: Maintains conversation history for more coherent multi-turn exchanges

## Implementation

The real-world knowledge capability is implemented through several components:

1. **RealWorldAssistantService**: A dedicated service that handles real-world questions
2. **Knowledge base seeding**: Pre-seeded general knowledge across various domains
3. **AIService integration**: Integration with the main AI service for seamless user experience
4. **OpenAI service**: Enhanced functionality to leverage external AI models

## Setting Up

To enable the full functionality of real-world knowledge:

1. Add your OpenAI API key to the environment variables:
   - Set `OPENAI_API_KEY` environment variable
   - Or add it through the admin dashboard system settings

2. Seed the real-world knowledge base by running:
   ```bash
   ./scripts/run-knowledge-seeding.sh
   ```
   
   Select option 4 to seed real-world knowledge, or option 7 to seed all knowledge including real-world information.

3. Test the functionality by asking general knowledge questions like:
   - "What is nuclear fusion?"
   - "Can you explain black holes?"
   - "How does a blockchain work?"

## Architecture

```
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│   AI Service        │────▶│  OpenAI Service     │
│   (Main Router)     │     │  (External AI)      │
│                     │     │                     │
└─────────┬───────────┘     └─────────────────────┘
          │
          │
          ▼
┌─────────────────────┐     ┌─────────────────────┐
│                     │     │                     │
│  RealWorld Assistant│────▶│  Knowledge Base     │
│  (Topic Handler)    │     │  (Structured Data)  │
│                     │     │                     │
└─────────────────────┘     └─────────────────────┘
```

## Extending the Knowledge Base

You can extend the real-world knowledge base by:

1. Adding entries to `scripts/seed-realworld-knowledge.ts`
2. Creating your own specialized knowledge seeding scripts
3. Letting the system learn through user interactions

Each knowledge entry follows this structure:

```typescript
{
  topic: "CategoryName",     // Main category (e.g., "Science")
  subtopic: "SpecificArea",  // Specific area (e.g., "Physics")
  information: "Detailed factual information about the topic...",
  confidence: 90,            // Confidence score (0-100)
  source: "manual",          // Source of information
  category: "general",       // Type of knowledge
  relationships: []          // Related topics
}
```

## Usage Guidelines

When users ask real-world questions, the AI will:

1. Detect if it's a real-world question vs. platform-specific
2. Retrieve relevant knowledge from its knowledge base
3. Generate a comprehensive and accurate response
4. Acknowledge limitations when information is incomplete
5. Suggest when more specialized information might be needed

## OpenAI Integration

When an OpenAI API key is provided, the system will:

1. Use the OpenAI API for enhanced responses
2. Generate new knowledge entries for questions it hasn't seen before
3. Provide more detailed and nuanced answers

Without an OpenAI API key, the system will:

1. Use its pre-seeded knowledge base for responses
2. Provide more limited but still helpful information
3. Clearly indicate when it doesn't have sufficient knowledge

## Limitations

- Without an OpenAI API key, responses are limited to pre-seeded knowledge
- The system cannot access real-time information (news, weather, etc.)
- Highly specialized or technical questions may receive simplified answers
- The knowledge base requires regular updates to stay current

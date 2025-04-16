import { storage } from '../server/storage';

/**
 * Seed AI knowledge base with general conversation topics and dictionary definitions
 * This extends the AI assistant to handle more general questions beyond platform specifics
 */
async function seedGeneralKnowledge() {
  console.log("Seeding general knowledge and dictionary entries...");
  
  // Common greeting patterns
  await storage.createAIKnowledgeEntry({
    topic: "Greetings",
    subtopic: "Hello",
    information: "Hello! How can I assist you today with the TSK Platform?",
    confidence: 95,
    source: "manual",
    category: "general",
    relationships: ["related:Hi", "related:Hey", "related:Welcome"],
    training_score: 10,
    training_count: 5
  });
  
  // Dictionary entries
  const dictionaryEntries = [
    {
      topic: "Dictionary",
      subtopic: "Blockchain",
      information: "A blockchain is a distributed database or ledger shared among computer network nodes. It stores information electronically in digital format, maintaining a secure and decentralized record of transactions. It's best known for its role in cryptocurrency systems for maintaining secure and decentralized records of transactions.",
      confidence: 90,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Cryptocurrency", "related:Decentralized", "related:Ledger", "related:Smart Contract"],
      training_score: 20,
      training_count: 8
    },
    {
      topic: "Dictionary",
      subtopic: "Cryptocurrency",
      information: "A cryptocurrency is a digital or virtual currency secured by cryptography, making it nearly impossible to counterfeit. Many cryptocurrencies are decentralized networks based on blockchain technology—a distributed ledger enforced by a disparate network of computers.",
      confidence: 90,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Blockchain", "related:Bitcoin", "related:Ethereum", "related:Token"],
      training_score: 18,
      training_count: 7
    },
    {
      topic: "Dictionary",
      subtopic: "Mining",
      information: "In cryptocurrency, mining is the process where specialized computers validate and process transactions on a blockchain network. Miners compete to solve complex mathematical problems, and the winner gets to add a new block of transactions to the blockchain and receives newly created cryptocurrency as a reward.",
      confidence: 92,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Blockchain", "related:Cryptocurrency", "related:Hash", "related:Proof of Work"],
      training_score: 22,
      training_count: 9
    },
    {
      topic: "Dictionary",
      subtopic: "Token",
      information: "In blockchain technology, a token is a digital asset created on an existing blockchain. Unlike coins that operate on their own blockchain, tokens are built on existing blockchain platforms like Ethereum. Tokens can represent various assets or utilities, from cryptocurrency to voting rights or even real-world assets.",
      confidence: 88,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Cryptocurrency", "related:Smart Contract", "related:Blockchain", "related:NFT"],
      training_score: 15,
      training_count: 6
    },
    {
      topic: "Dictionary",
      subtopic: "NFT",
      information: "A Non-Fungible Token (NFT) is a digital asset that represents ownership of a unique item or content, stored on a blockchain. Unlike cryptocurrencies, NFTs are not interchangeable with each other, making each one unique. They commonly represent digital art, collectibles, music, videos, and other forms of creative content.",
      confidence: 90,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Blockchain", "related:Token", "related:Digital Art", "related:Collectible"],
      training_score: 19,
      training_count: 7
    },
    {
      topic: "Dictionary",
      subtopic: "Smart Contract",
      information: "A smart contract is a self-executing program stored on a blockchain that automatically runs when predetermined conditions are met. These contracts eliminate the need for intermediaries and can facilitate, verify, and enforce the negotiation or performance of a contract.",
      confidence: 91,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Blockchain", "related:Ethereum", "related:DApp", "related:Automated"],
      training_score: 21,
      training_count: 8
    },
    {
      topic: "Dictionary",
      subtopic: "Wallet",
      information: "In cryptocurrency, a wallet is a digital tool that allows users to store, manage, and use their digital assets. It contains the user's private and public keys, which are used to track ownership, receive, and spend cryptocurrencies. Wallets can be software-based (hot wallets) or hardware-based (cold wallets).",
      confidence: 89,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Private Key", "related:Public Key", "related:Cryptocurrency", "related:Security"],
      training_score: 17,
      training_count: 6
    },
    {
      topic: "Dictionary",
      subtopic: "DeFi",
      information: "Decentralized Finance (DeFi) refers to blockchain-based financial applications that operate without central financial intermediaries such as banks or brokerages. DeFi platforms allow users to lend, borrow, trade, earn interest, and more with cryptocurrencies through automated smart contracts.",
      confidence: 87,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Blockchain", "related:Smart Contract", "related:Lending", "related:DEX"],
      training_score: 16,
      training_count: 6
    },
    {
      topic: "Dictionary",
      subtopic: "DAO",
      information: "A Decentralized Autonomous Organization (DAO) is an organization represented by rules encoded as a transparent computer program, controlled by organization members rather than centralized leadership. DAOs use blockchain technology and smart contracts to establish rules and execute decisions.",
      confidence: 86,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Governance", "related:Voting", "related:Smart Contract", "related:Decentralized"],
      training_score: 14,
      training_count: 5
    },
    {
      topic: "Dictionary",
      subtopic: "Gas Fee",
      information: "In blockchain networks like Ethereum, a gas fee is the payment made by users to compensate for the computing energy required to process and validate transactions. The fee is typically paid in the network's native cryptocurrency and varies based on network congestion and transaction complexity.",
      confidence: 89,
      source: "dictionary",
      category: "dictionary",
      relationships: ["related:Ethereum", "related:Transaction", "related:Blockchain", "related:Mining"],
      training_score: 18,
      training_count: 7
    }
  ];
  
  // Seed each dictionary entry
  for (const entry of dictionaryEntries) {
    await storage.createAIKnowledgeEntry(entry);
  }
  
  // General knowledge entries
  const generalKnowledgeEntries = [
    {
      topic: "Conversation",
      subtopic: "Small Talk",
      information: "I'd be happy to chat about various topics, but I'm primarily designed to help you with TSK Platform features, blockchain concepts, and cryptocurrency topics. Feel free to ask me about these areas or any platform-specific questions you might have.",
      confidence: 85,
      source: "manual",
      category: "general"
    },
    {
      topic: "Conversation",
      subtopic: "Help Request",
      information: "I'm here to help! I can provide information about the TSK Platform features, explain blockchain concepts, assist with cryptocurrency questions, or guide you through platform functions. What specific area would you like assistance with today?",
      confidence: 90,
      source: "manual",
      category: "general"
    },
    {
      topic: "Conversation",
      subtopic: "Thank You Response",
      information: "You're welcome! I'm glad I could help. If you need anything else regarding the TSK Platform or have other questions, please don't hesitate to ask. I'm here to assist you.",
      confidence: 92,
      source: "manual",
      category: "general"
    },
    {
      topic: "Conversation",
      subtopic: "Greeting Response",
      information: "Hello! Welcome to the TSK Platform. I'm your AI assistant, ready to help with any questions about our platform, blockchain technology, mining tokens, or other related topics. How can I assist you today?",
      confidence: 94,
      source: "manual",
      category: "general"
    }
  ];
  
  // Seed general knowledge entries
  for (const entry of generalKnowledgeEntries) {
    await storage.createAIKnowledgeEntry(entry);
  }
  
  // Seed reasoning patterns for general conversation
  await storage.createAIReasoningPattern({
    category: "conversation",
    pattern: "conversational",
    rules: [
      "Be friendly and conversational",
      "Use a natural, engaging tone",
      "Keep responses concise but informative",
      "Maintain consistency with platform terminology",
      "Personalize when possible using user context"
    ],
    examples: [
      {
        input: "Hello, how are you?",
        output: "Hello! I'm functioning well and ready to assist you with the TSK Platform. How can I help you today?"
      },
      {
        input: "Thanks for your help!",
        output: "You're welcome! I'm glad I could assist. Feel free to ask if you have any other questions about the platform."
      }
    ],
    priority: 50,
    metadata: {
      successRate: 0.95,
      creationDate: new Date().toISOString(),
      createdBySystem: false
    }
  });
  
  // Seed fallback reasoning pattern
  await storage.createAIReasoningPattern({
    category: "fallback",
    pattern: "unknown_topic",
    rules: [
      "Be honest about limitations",
      "Offer alternative options",
      "Maintain a helpful tone",
      "Suggest platform-related topics"
    ],
    examples: [
      {
        input: "Can you write a poem?",
        output: "I'm primarily designed to help with TSK Platform topics and blockchain concepts. While I can't write poetry, I'd be happy to assist you with platform features, cryptocurrency questions, or mining information instead. How can I help you with those topics?"
      },
      {
        input: "What's the weather like today?",
        output: "I don't have access to current weather information as I'm focused on providing assistance with the TSK Platform and blockchain technology. Is there something about the platform or cryptocurrency I can help you with instead?"
      }
    ],
    priority: 10,
    metadata: {
      successRate: 0.85,
      creationDate: new Date().toISOString(),
      createdBySystem: false
    }
  });
  
  console.log("General knowledge and dictionary entries seeded successfully!");
}

/**
 * Run the seeding function
 */
seedGeneralKnowledge().catch(console.error);

export { seedGeneralKnowledge };
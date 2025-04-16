import { storage } from '../server/storage';

/**
 * Seed AI knowledge base with real-world information
 * This extends the AI assistant to handle general real-world questions beyond platform specifics
 */
async function seedRealWorldKnowledge() {
  console.log("Seeding real-world knowledge...");
  
  // Current events and general information
  const realWorldEntries = [
    {
      topic: "RealWorld",
      subtopic: "CurrentEvents",
      information: "As an AI assistant, I can discuss general world events and news, though I don't have real-time data beyond my training. For the most current information, I'll recommend checking reliable news sources. I can help interpret or explain events based on general knowledge, historical context, and trends.",
      confidence: 85,
      source: "manual",
      category: "general",
      relationships: ["related:News", "related:GlobalAffairs", "related:CurrentTopics"],
      training_score: 15,
      training_count: 8
    },
    {
      topic: "RealWorld",
      subtopic: "Science",
      information: "I can provide information about scientific topics including physics, chemistry, biology, astronomy, and related fields. My knowledge includes fundamental scientific principles, major discoveries, and general scientific concepts. For specialized or cutting-edge research, I'll note the limitations of my knowledge and suggest consulting recent scientific publications.",
      confidence: 90,
      source: "manual",
      category: "general",
      relationships: ["related:Physics", "related:Biology", "related:Chemistry", "related:Research"],
      training_score: 18,
      training_count: 9
    },
    {
      topic: "RealWorld",
      subtopic: "Technology",
      information: "I can discuss technology topics including computer science, programming languages, AI development, hardware, software, internet technologies, and tech industry trends. This includes explaining how technologies work, their applications, benefits, and limitations. For very recent developments, I'll note that my knowledge may not reflect the latest advancements.",
      confidence: 92,
      source: "manual",
      category: "general",
      relationships: ["related:ComputerScience", "related:AI", "related:Programming", "related:Internet"],
      training_score: 20,
      training_count: 10
    },
    {
      topic: "RealWorld",
      subtopic: "Health",
      information: "I can provide general health information on topics like nutrition, exercise, common medical conditions, preventative care, and wellness. I'll clarify that I'm not a medical professional and that my information should not replace professional medical advice. For specific health concerns, I'll recommend consulting qualified healthcare providers.",
      confidence: 84,
      source: "manual",
      category: "general",
      relationships: ["related:Nutrition", "related:Exercise", "related:Wellness", "related:MedicalInfo"],
      training_score: 16,
      training_count: 8
    },
    {
      topic: "RealWorld",
      subtopic: "History",
      information: "I can discuss historical events, periods, figures, and developments across world history. This includes ancient civilizations, major conflicts, cultural developments, political movements, and significant historical milestones. My knowledge encompasses general historical facts and interpretations as understood in mainstream historical scholarship.",
      confidence: 89,
      source: "manual",
      category: "general",
      relationships: ["related:WorldHistory", "related:HistoricalFigures", "related:Civilizations", "related:Wars"],
      training_score: 17,
      training_count: 9
    },
    {
      topic: "RealWorld",
      subtopic: "Geography",
      information: "I can provide information about world geography including countries, cities, regions, landforms, bodies of water, climate zones, and basic demographic information. I can explain geographical concepts, discuss cultural geography, and provide general information about locations around the world.",
      confidence: 91,
      source: "manual",
      category: "general",
      relationships: ["related:Countries", "related:Cities", "related:Climate", "related:Continents"],
      training_score: 19,
      training_count: 10
    },
    {
      topic: "RealWorld",
      subtopic: "Arts",
      information: "I can discuss topics related to visual arts, literature, music, film, theater, architecture, and other creative fields. This includes information about major works, artists, movements, techniques, and historical developments in various art forms across different cultures and time periods.",
      confidence: 87,
      source: "manual",
      category: "general",
      relationships: ["related:Literature", "related:Music", "related:Film", "related:VisualArts"],
      training_score: 16,
      training_count: 8
    },
    {
      topic: "RealWorld",
      subtopic: "Business",
      information: "I can provide information about business concepts, economics, finance, management, entrepreneurship, marketing, and related fields. This includes explaining business principles, discussing economic theories, and providing general information about business practices and industry trends.",
      confidence: 88,
      source: "manual",
      category: "general",
      relationships: ["related:Economics", "related:Finance", "related:Management", "related:Marketing"],
      training_score: 17,
      training_count: 9
    },
    {
      topic: "RealWorld",
      subtopic: "Philosophy",
      information: "I can discuss philosophical concepts, major philosophical traditions, notable philosophers, ethical frameworks, and philosophical questions across various domains including metaphysics, epistemology, ethics, logic, and political philosophy. I can explain different philosophical perspectives and their historical context.",
      confidence: 86,
      source: "manual",
      category: "general",
      relationships: ["related:Ethics", "related:Metaphysics", "related:Epistemology", "related:Philosophers"],
      training_score: 15,
      training_count: 7
    },
    {
      topic: "RealWorld",
      subtopic: "Mathematics",
      information: "I can provide information about mathematical concepts, theories, formulas, and applications across various branches of mathematics including algebra, geometry, calculus, statistics, number theory, and applied mathematics. I can explain mathematical principles, help solve problems, and discuss the historical development of mathematical ideas.",
      confidence: 90,
      source: "manual",
      category: "general",
      relationships: ["related:Algebra", "related:Geometry", "related:Calculus", "related:Statistics"],
      training_score: 18,
      training_count: 9
    }
  ];
  
  // Seed each real-world knowledge entry
  for (const entry of realWorldEntries) {
    await storage.createAIKnowledgeEntry(entry);
  }
  
  // Seed reasoning pattern for real-world questions
  await storage.createAIReasoningPattern({
    category: "realworld",
    pattern: "general_knowledge",
    rules: [
      "Provide balanced, factual information",
      "Acknowledge when information might be incomplete or outdated",
      "Suggest reliable sources for further information when appropriate",
      "Avoid making definitive claims on controversial topics",
      "Clarify limits of expertise (e.g., medical, legal, financial advice)",
      "Focus on educational value and accuracy"
    ],
    examples: [
      {
        input: "How does nuclear fusion work?",
        output: "Nuclear fusion is the process where atomic nuclei combine to form a heavier nucleus, releasing energy. This is the same process that powers stars like our sun. In fusion, light elements like hydrogen isotopes (deuterium and tritium) are heated to extremely high temperatures (millions of degrees), causing them to overcome their natural electromagnetic repulsion and fuse together. This fusion releases significant energy because the mass of the resulting nucleus is slightly less than the sum of the original nuclei, with the difference converted to energy according to Einstein's E=mc². While fusion promises clean, abundant energy, creating controlled fusion reactions on Earth remains challenging due to the extreme conditions required."
      },
      {
        input: "What are black holes?",
        output: "Black holes are regions in space where gravity is so strong that nothing, not even light, can escape once it passes the event horizon. They form when very massive stars collapse under their own gravity at the end of their life cycle. Black holes are characterized by their event horizon (the boundary beyond which nothing can escape) and singularity (a point of infinite density at the center). They're detected through their effects on nearby matter and radiation rather than direct observation. Black holes come in different sizes: stellar black holes form from collapsed stars, while supermassive black holes exist at the centers of most galaxies, including our Milky Way. Recent advancements like the Event Horizon Telescope have allowed scientists to capture the first images of black hole shadows."
      }
    ],
    priority: 40,
    metadata: {
      successRate: 0.90,
      creationDate: new Date().toISOString(),
      createdBySystem: false
    }
  });

  // Technical topics
  const technicalEntries = [
    {
      topic: "Programming",
      subtopic: "Languages",
      information: "I can provide information about various programming languages including JavaScript, Python, Java, C++, Ruby, Go, Rust, and many others. This includes their syntax, features, use cases, strengths, weaknesses, and ecosystem. I can also explain programming concepts, paradigms, and best practices across different languages.",
      confidence: 92,
      source: "manual",
      category: "technical",
      relationships: ["related:JavaScript", "related:Python", "related:Java", "related:WebDevelopment"],
      training_score: 20,
      training_count: 10
    },
    {
      topic: "Programming",
      subtopic: "WebDevelopment",
      information: "I can discuss web development topics including frontend technologies (HTML, CSS, JavaScript, various frameworks), backend development (server-side languages, APIs, databases), web design principles, responsive design, web performance, accessibility, and web standards. I can explain concepts, suggest approaches, and provide general guidance on web development practices.",
      confidence: 91,
      source: "manual",
      category: "technical",
      relationships: ["related:HTML", "related:CSS", "related:JavaScript", "related:Frameworks"],
      training_score: 19,
      training_count: 10
    },
    {
      topic: "AI",
      subtopic: "MachineLearning",
      information: "I can provide information about machine learning concepts, algorithms, techniques, applications, and developments. This includes explaining different types of machine learning (supervised, unsupervised, reinforcement), neural networks, deep learning, natural language processing, computer vision, and ethical considerations in AI. I can discuss both theoretical aspects and practical applications of machine learning technologies.",
      confidence: 90,
      source: "manual",
      category: "technical",
      relationships: ["related:DeepLearning", "related:NeuralNetworks", "related:DataScience", "related:AI"],
      training_score: 18,
      training_count: 9
    }
  ];
  
  // Seed each technical entry
  for (const entry of technicalEntries) {
    await storage.createAIKnowledgeEntry(entry);
  }
  
  console.log("Real-world knowledge seeded successfully!");
}

/**
 * Run the seeding function
 */
// Self-invocation for ESM modules
seedRealWorldKnowledge().catch(console.error);

export { seedRealWorldKnowledge };
import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, primaryKey, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== TABLE DEFINITIONS ====================

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  fullName: text("full_name"),
  walletAddress: text("wallet_address"),
  tokenBalance: doublePrecision("token_balance").notNull().default(0),
  miningRate: doublePrecision("mining_rate").notNull().default(1),
  lastMiningTime: timestamp("last_mining_time"),
  lastMiningActivation: timestamp("last_mining_activation"),
  miningActive: boolean("mining_active").notNull().default(false),
  referralCode: text("referral_code").notNull().unique(),
  referredBy: integer("referred_by"),
  premiumTier: text("premium_tier").notNull().default("Basic"),
  premiumMultiplier: doublePrecision("premium_multiplier").notNull().default(1),
  role: text("role").notNull().default("user"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  lastLogin: timestamp("last_login"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Separate KYC table
export const userKyc = pgTable("user_kyc", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("unverified"), // unverified, pending, verified, rejected
  fullName: text("full_name"),
  country: text("country"),
  documentType: text("document_type"), // passport, national_id, drivers_license
  documentId: text("document_id"),
  // Document image URLs
  frontImageUrl: text("front_image_url"),
  backImageUrl: text("back_image_url"),
  selfieImageUrl: text("selfie_image_url"),
  submissionDate: timestamp("submission_date"),
  verificationDate: timestamp("verification_date"),
  rejectionReason: text("rejection_reason"),
});

export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
});

export const miningHistory = pgTable("mining_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  amount: doublePrecision("amount").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  bonusType: text("bonus_type"), // 'streak', 'daily', 'random', etc.
  bonusAmount: doublePrecision("bonus_amount").default(0),
  streakDay: integer("streak_day").default(1),
  source: text("source").default('manual'), // 'manual' or 'automatic'
});

export const premiumPackages = pgTable("premium_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  miningMultiplier: doublePrecision("mining_multiplier").notNull(),
  active: boolean("active").notNull().default(true),
  isSubscription: boolean("is_subscription").default(false),
  monthlyPrice: doublePrecision("monthly_price"),
  billingCycle: text("billing_cycle").default('monthly'), // 'monthly', 'quarterly', 'yearly'
});

// Token packages table
export const tokenPackages = pgTable("token_packages", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  tokenAmount: doublePrecision("token_amount").notNull(),
  priceUSD: doublePrecision("price_usd").notNull(),
  discountPercentage: doublePrecision("discount_percentage").notNull().default(0),
  // Payment specific modifiers
  paypalPriceModifier: doublePrecision("paypal_price_modifier").default(0),
  bnbPriceModifier: doublePrecision("bnb_price_modifier").default(0),
  // Promotion and featured settings
  limitedTimeOffer: boolean("limited_time_offer").default(false),
  offerEndDate: timestamp("offer_end_date"),
  featuredPackage: boolean("featured_package").default(false),
  // Bulk discount settings
  minPurchaseForBulkDiscount: integer("min_purchase_for_bulk_discount").default(0),
  bulkDiscountPercentage: doublePrecision("bulk_discount_percentage").default(0),
  // Status and timestamps
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Token transactions table for direct token purchases
export const tokenTransactions = pgTable("token_transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  packageId: integer("package_id").references(() => tokenPackages.id),
  amount: doublePrecision("amount").notNull(),
  priceUSD: doublePrecision("price_usd").notNull(),
  paymentMethod: text("payment_method").notNull(),
  paymentDetails: text("payment_details"),
  additionalInfo: text("additional_info"),
  status: text("status").notNull().default("pending"), // pending, completed, rejected
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  approvedBy: integer("approved_by").references(() => users.id),
  transactionHash: text("transaction_hash"), // For blockchain transactions
});

export const marketplaceItems = pgTable("marketplace_items", {
  id: serial("id").primaryKey(),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  price: doublePrecision("price").notNull(),
  category: text("category").notNull(),
  imageUrl: text("image_url"),
  metadata: text("metadata"), // JSON string for subcategory, condition, tags, etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approved: boolean("approved").default(false),
  sold: boolean("sold").default(false),
  // Enhanced fields for improved display
  featured: boolean("featured").default(false),
  rating: doublePrecision("rating").default(0),
  reviewCount: integer("review_count").default(0),
  additionalImages: text("additional_images").array(), // Array of additional image URLs
  specifications: text("specifications"), // JSON string for detailed product specs
  sellerName: text("seller_name"), // Cached seller name for faster display
  views: integer("views").default(0), // Track product views for popularity metrics
});

export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  itemId: integer("item_id").references(() => marketplaceItems.id),
  packageId: integer("package_id").references(() => premiumPackages.id),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // 'marketplace', 'premium', 'withdrawal', etc.
  metadata: text("metadata"), // JSON string for additional data like wallet address for withdrawals
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Banner images for mining page
export const bannerImages = pgTable("banner_images", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url"), // Optional URL to link to when banner is clicked
  title: text("title").notNull(),
  description: text("description"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  priority: integer("priority").default(0), // Higher priority banners will show first
});

// Embedded ads for mining page
export const embeddedAds = pgTable("embedded_ads", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"), // URL to redirect to when ad is clicked
  htmlContent: text("html_content"), // Optional HTML content for rich ads
  active: boolean("active").notNull().default(false), // Default to inactive until approved or paid
  displayDuration: integer("display_duration").default(30), // Duration in seconds
  createdAt: timestamp("created_at").notNull().defaultNow(),
  priority: integer("priority").default(0), // Higher priority ads will show first
  customBackground: text("custom_background"), // Custom background color for ad dialog
  customTextColor: text("custom_text_color"), // Custom text color for ad content
  customButtonColor: text("custom_button_color"), // Custom button color
  buttonText: text("button_text"), // Custom button text
  // Removed location field as it doesn't exist in the database - using placement instead
  
  // Ad targeting and placement
  placement: jsonb("placement").default(['sidebar']), // banner, sidebar, notification
  targetAudience: jsonb("target_audience").default(['all']), // all, miners, premium, marketplace, new
  startDate: timestamp("start_date").defaultNow(), // When to start showing the ad
  endDate: timestamp("end_date"), // When to stop showing the ad
  status: text("status").default('pending'), // pending, approved, rejected, expired
  
  // User advertising fields
  userId: integer("user_id").references(() => users.id), // User who created the ad
  isUserAd: boolean("is_user_ad").default(false), // Whether this is a user-created ad
  approved: boolean("approved").default(false), // Whether admin has approved the ad
  reviewStatus: text("review_status").default('pending'), // 'pending', 'approved', 'rejected'
  rejectionReason: text("rejection_reason"), // Reason for rejection if rejected
  
  // Payment tracking
  priceTSK: doublePrecision("price_tsk"), // Cost in TSK tokens
  paymentStatus: text("payment_status").default('unpaid'), // 'unpaid', 'paid', 'refunded'
  paidAt: timestamp("paid_at"), // When payment was made
  expiresAt: timestamp("expires_at"), // When ad expires
  impressions: integer("impressions").default(0), // Track number of impressions
  clicks: integer("clicks").default(0), // Track number of clicks
});

// Mining system settings
export const miningSettings = pgTable("mining_settings", {
  id: serial("id").primaryKey(),
  // Streak settings - use lowercase column names to match database
  enablestreakbonus: boolean("enablestreakbonus").notNull().default(true),
  streakbonuspercentperday: integer("streakbonuspercentperday").notNull().default(5),
  maxstreakdays: integer("maxstreakdays").notNull().default(10),
  streakexpirationhours: integer("streakexpirationhours").notNull().default(48),
  
  // Daily lucky bonus settings
  enabledailybonus: boolean("enabledailybonus").notNull().default(true),
  dailybonuschance: integer("dailybonuschance").notNull().default(10),
  
  // Automatic mining settings
  enableautomaticmining: boolean("enableautomaticmining").notNull().default(true),
  hourlyrewardamount: doublePrecision("hourlyrewardamount").notNull().default(0.5),
  dailyactivationrequired: boolean("dailyactivationrequired").notNull().default(true),
  activationexpirationhours: integer("activationexpirationhours").notNull().default(24),
  
  // Withdrawal settings
  globalwithdrawalday: integer("globalwithdrawalday"), // Day of the week (0-6, Sunday-Saturday)
  enablewithdrawallimits: boolean("enablewithdrawallimits").default(false),
  withdrawalstarthour: integer("withdrawalstarthour").default(9), // Hour when withdrawals become available (0-23)
  withdrawalendhour: integer("withdrawalendhour").default(17), // Hour when withdrawals end (0-23)
  
  // General settings
  updatedat: timestamp("updatedat").notNull().defaultNow(),
});

// Contract addresses table
export const contractAddresses = pgTable("contract_addresses", {
  id: serial("id").primaryKey(),
  network: text("network").notNull().unique(), // 'testnet' or 'mainnet'
  address: text("address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Events table for countdown timers
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  imageUrl: text("image_url"),
  linkUrl: text("link_url"),
  active: boolean("active").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  priority: integer("priority").default(1),
  featured: boolean("featured").default(false),
  displayOnDashboard: boolean("display_on_dashboard").notNull().default(true),
});

// Admin tasks table
export const adminTasks = pgTable("admin_tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: integer("assigned_to").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, in-progress, completed, cancelled
  priority: text("priority").notNull().default("medium"), // low, medium, high, urgent
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  createdBy: integer("created_by").notNull().references(() => users.id),
});

// Whitepapers table
export const whitepapers = pgTable("whitepapers", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileUrl: text("file_url").notNull(),
  version: text("version").notNull(),
  published: boolean("published").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  uploadedBy: integer("uploaded_by").references(() => users.id),
});

// ==================== ONBOARDING TABLES ====================

// Learning paths table
export const learningPaths = pgTable("learning_paths", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  difficulty: text("difficulty").notNull().default("beginner"),
  estimatedTimeMinutes: integer("estimatedtimeminutes").default(15),
  priority: integer("priority").notNull().default(1),
  requiredForFeatures: text("requiredforfeatures").array(),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("createdat").notNull().defaultNow(),
  updatedAt: timestamp("updatedat").notNull().defaultNow(),
});

// Learning steps table
export const learningSteps = pgTable("learning_steps", {
  id: serial("id").primaryKey(),
  pathId: integer("pathid").references(() => learningPaths.id, { onDelete: "cascade" }).notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  content: text("content").notNull(),
  orderIndex: integer("orderindex").notNull(),
  estimatedTimeMinutes: integer("estimatedtimeminutes"),
  isRequired: boolean("isrequired").notNull().default(true),
  createdAt: timestamp("createdat").notNull().defaultNow(),
  updatedAt: timestamp("updatedat").notNull().defaultNow(),
});

// User progress table
export const userProgress = pgTable("user_progress", {
  id: serial("id").primaryKey(),
  userId: integer("userid").references(() => users.id, { onDelete: "cascade" }).notNull(),
  pathId: integer("pathid").references(() => learningPaths.id, { onDelete: "cascade" }).notNull(),
  lastStepCompleted: integer("laststepcompleted"),
  isCompleted: boolean("iscompleted").notNull().default(false),
  completedAt: timestamp("completedat"),
  startedAt: timestamp("startedat").notNull().defaultNow(),
  lastActivityAt: timestamp("lastactivityat").notNull().defaultNow(),
  completedSteps: integer("completedsteps").array(),
});

// User interactions table
export const userInteractions = pgTable("user_interactions", {
  id: serial("id").primaryKey(),
  userId: integer("userid").references(() => users.id, { onDelete: "cascade" }).notNull(),
  interactionType: text("interactiontype").notNull(), // 'page_view', 'feature_usage', 'help_request'
  featureName: text("featurename"),
  metadata: jsonb("metadata"),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Onboarding preferences table
export const onboardingPreferences = pgTable("onboarding_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("userid").references(() => users.id, { onDelete: "cascade" }).notNull(),
  interests: text("interests").array(),
  experienceLevel: text("experiencelevel").notNull().default("beginner"),
  learningStyle: text("learningstyle"),
  disableOnboarding: boolean("disableonboarding").notNull().default(false),
  createdAt: timestamp("createdat").notNull().defaultNow(),
  updatedAt: timestamp("updatedat").notNull().defaultNow(),
});

// Token packages and transactions tables are already defined above

// ==================== SYSTEM CONFIGURATION ====================

// ==================== SUBSCRIPTIONS ====================

// User subscriptions table
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  packageId: integer("package_id").notNull().references(() => premiumPackages.id),
  status: text("status").notNull().default("active"), // active, canceled, expired
  startDate: timestamp("start_date").notNull().defaultNow(),
  endDate: timestamp("end_date"),
  nextBillingDate: timestamp("next_billing_date"),
  billingCycle: text("billing_cycle").notNull().default("monthly"), // monthly, quarterly, yearly
  price: doublePrecision("price").notNull(),
  autoRenew: boolean("auto_renew").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Subscription payments
export const subscriptionPayments = pgTable("subscription_payments", {
  id: serial("id").primaryKey(),
  subscriptionId: integer("subscription_id").notNull().references(() => subscriptions.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount: doublePrecision("amount").notNull(),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentDate: timestamp("payment_date").notNull().defaultNow(),
  nextPaymentDate: timestamp("next_payment_date"),
  transactionId: text("transaction_id"),
  paymentMethod: text("payment_method").notNull().default("token"), // token, paypal, crypto
});

// ==================== NOTIFICATIONS ====================

// User notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // 'system', 'mining', 'reward', 'transaction', 'marketing', etc.
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at"),
  priority: integer("priority").default(1), // Higher priority notifications will be shown first
  actionUrl: text("action_url"), // Optional URL for "View" or "Take Action" buttons
  imageUrl: text("image_url"), // Optional image URL for rich notifications
  metadata: jsonb("metadata"), // Additional data specific to the notification type
});

// Push notification device tokens
export const deviceTokens = pgTable("device_tokens", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull(),
  platform: text("platform").notNull(), // 'web', 'android', 'ios'
  deviceId: text("device_id"), // Unique identifier for the device
  createdAt: timestamp("created_at").notNull().defaultNow(),
  lastUsedAt: timestamp("last_used_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
},
(table) => {
  return {
    // Ensure token uniqueness per user
    tokenUserIdx: unique("token_user_idx").on(table.token, table.userId),
  }
});

// ==================== CHAT TABLES ====================
// Chat groups table
export const chatGroups = pgTable("chat_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  imageUrl: text("image_url"),
  isPublic: boolean("is_public").notNull().default(true),
  createdBy: integer("created_by").references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  lastMessageAt: timestamp("last_message_at").notNull().defaultNow(),
  isActive: boolean("is_active").notNull().default(true),
});

// Chat group members table
export const chatGroupMembers = pgTable("chat_group_members", {
  groupId: integer("group_id").references(() => chatGroups.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  role: text("role").notNull().default("member"), // 'member', 'moderator', 'admin'
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
  lastSeen: timestamp("last_seen").notNull().defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.groupId, table.userId] }),
  };
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => chatGroups.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  edited: boolean("edited").notNull().default(false),
  editedAt: timestamp("edited_at"),
  replyTo: integer("reply_to"), // Will be set up in relations definition
  attachments: jsonb("attachments"), // Store info about attached files
  isDeleted: boolean("is_deleted").notNull().default(false),
});

// Chat message reactions table
export const chatMessageReactions = pgTable("chat_message_reactions", {
  messageId: integer("message_id").references(() => chatMessages.id, { onDelete: "cascade" }).notNull(),
  userId: integer("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  reaction: text("reaction").notNull(), // emoji or reaction type
  timestamp: timestamp("timestamp").notNull().defaultNow(),
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.messageId, table.userId, table.reaction] }),
  };
});

// Direct messages between users
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  receiverId: integer("receiver_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  read: boolean("read").notNull().default(false),
  readAt: timestamp("read_at"),
  attachments: jsonb("attachments"),
  isDeleted: boolean("is_deleted").notNull().default(false),
});

// Platform legal and settings table
export const platformSettings = pgTable("platform_settings", {
  id: serial("id").primaryKey(),
  settingType: text("setting_type").notNull().unique(), // 'terms', 'privacy', 'disclaimer', etc.
  title: text("title").notNull(), 
  content: text("content").notNull(),
  version: text("version").notNull(),
  lastUpdatedAt: timestamp("last_updated_at").notNull().defaultNow(),
  updatedById: integer("updated_by_id").references(() => users.id),
  isActive: boolean("is_active").notNull().default(true),
  requiresAcceptance: boolean("requires_acceptance").notNull().default(false),
});

// System secrets and sensitive configuration
export const systemSecrets = pgTable("system_secrets", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // 'wallet_address', 'api_key', 'payment_secret', etc.
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull(), // 'payment', 'blockchain', 'notifications', etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  isEncrypted: boolean("is_encrypted").notNull().default(true),
  isActive: boolean("is_active").notNull().default(true),
  environment: text("environment").notNull().default('production'),
});

// System settings for application configuration
export const systemSettings = pgTable("system_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(),
  value: text("value").notNull(),
  description: text("description"),
  category: text("category").notNull().default('general'), // 'general', 'payment', 'mining', etc.
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Wallet configuration for the platform
export const walletConfiguration = pgTable("wallet_configuration", {
  id: serial("id").primaryKey(),
  network: text("network").notNull(), // 'bscTestnet', 'bscMainnet', etc.
  chainId: integer("chain_id").notNull(),
  rpcUrl: text("rpc_url").notNull(),
  explorerUrl: text("explorer_url").notNull(),
  publicAddress: text("public_address").notNull(),
  contractAddress: text("contract_address").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  isDefault: boolean("is_default").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  createdBy: integer("created_by").references(() => users.id),
  gasLimit: integer("gas_limit"),
  gasPrice: text("gas_price"),
  privateKeyReference: text("private_key_reference"),
  networkName: text("network_name").notNull(),
  decimals: integer("decimals").notNull().default(18),
  symbol: text("symbol").notNull().default('TSK'),
});

// ==================== AI ASSISTANT TABLES ====================

export const aiKnowledgeBase = pgTable("ai_knowledge_base", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  subtopic: text("subtopic").notNull(),
  information: text("information").notNull(),
  relationships: jsonb("relationships").default([]),
  confidence: integer("confidence").default(100),
  lastUpdated: timestamp("last_updated").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  // Added fields for training
  trainingScore: integer("training_score").default(0),
  trainingCount: integer("training_count").default(0),
  source: text("source").default('manual'),
  // Category field for classifying knowledge (platform, general, dictionary, etc.)
  category: text("category").default('platform'),
});

export const aiReasoning = pgTable("ai_reasoning", {
  id: serial("id").primaryKey(),
  pattern: text("pattern").notNull(),
  rules: jsonb("rules").notNull(),
  examples: jsonb("examples").notNull(),
  priority: integer("priority").default(50),
  category: text("category").notNull(),
  metadata: jsonb("metadata").default({}),
  createdAt: timestamp("created_at").defaultNow(),
});

export const aiConversationMemory = pgTable("ai_conversation_memory", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  conversations: jsonb("conversations").default([]),
  preferences: jsonb("preferences").default({}),
  insights: jsonb("insights").default([]),
  lastInteraction: timestamp("last_interaction").defaultNow(),
  // Added field for training
  feedbackHistory: jsonb("feedback_history").default([]),
});

export const aiSystemTasks = pgTable("ai_system_tasks", {
  id: serial("id").primaryKey(),
  taskType: text("task_type").notNull(),
  priority: integer("priority").default(50),
  status: text("status").default('pending'),
  data: jsonb("data").default({}),
  scheduledFor: timestamp("scheduled_for").defaultNow(),
  completedAt: timestamp("completed_at"),
});

// New table for AI feedback
export const aiFeedback = pgTable("ai_feedback", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  conversationId: text("conversation_id").notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  rating: integer("rating").notNull(), // 1-5 scale
  feedback: text("feedback"),
  topics: jsonb("topics").default([]), 
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  processed: boolean("processed").default(false),
  applicationArea: text("application_area"),
});

// Platform scan results table for tracking platform changes
export const platformScanResults = pgTable("platform_scan_results", {
  id: serial("id").primaryKey(),
  scanTime: timestamp("scan_time").notNull().defaultNow(),
  userStats: jsonb("user_stats").default({}),
  miningStats: jsonb("mining_stats").default({}),
  marketplaceStats: jsonb("marketplace_stats").default({}),
  systemStats: jsonb("system_stats").default({}),
  aiStats: jsonb("ai_stats").default({}),
  knowledgeSnapshot: jsonb("knowledge_snapshot").default({}),
  changeDetected: boolean("change_detected").default(false),
  changeDetails: jsonb("change_details").default([]),
});

// Learning efficiency metrics for AI system
export const aiLearningMetrics = pgTable("ai_learning_metrics", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  totalInteractions: integer("total_interactions").default(0),
  positiveRatings: integer("positive_ratings").default(0),
  negativeRatings: integer("negative_ratings").default(0),
  neutralRatings: integer("neutral_ratings").default(0),
  knowledgeGapsIdentified: integer("knowledge_gaps_identified").default(0),
  knowledgeEntriesCreated: integer("knowledge_entries_created").default(0),
  knowledgeEntriesUpdated: integer("knowledge_entries_updated").default(0),
  patternsCreated: integer("patterns_created").default(0),
  averageResponseConfidence: doublePrecision("average_response_confidence").default(0),
  topQuestionCategories: jsonb("top_question_categories").default([]),
  commonMisunderstandings: jsonb("common_misunderstandings").default([]),
});

// ==================== INSERT SCHEMAS ====================

// User and related schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  walletAddress: true,
  referralCode: true,
  referredBy: true,
  role: true,
  email: true,
  fullName: true,
});

// KYC schemas
export const kycSubmissionSchema = createInsertSchema(userKyc).pick({
  userId: true,
  fullName: true,
  country: true,
  documentType: true,
  documentId: true,
  frontImageUrl: true,
  backImageUrl: true,
  selfieImageUrl: true,
});

export const kycVerificationSchema = z.object({
  kycId: z.number(),
  status: z.enum(["verified", "rejected"]),
  rejectionReason: z.string().optional(),
});

// Referral schema
export const insertReferralSchema = createInsertSchema(referrals).pick({
  referrerId: true,
  referredId: true,
});

// Mining schema
export const insertMiningHistorySchema = createInsertSchema(miningHistory).pick({
  userId: true,
  amount: true,
  bonusType: true,
  bonusAmount: true,
  streakDay: true,
  source: true,
});

// Original Premium package schema (now expanded in the updated schema below)

// Token package schema
export const insertTokenPackageSchema = createInsertSchema(tokenPackages).pick({
  name: true,
  description: true,
  tokenAmount: true,
  priceUSD: true,
  discountPercentage: true,
  // Payment specific modifiers
  paypalPriceModifier: true,
  bnbPriceModifier: true,
  // Promotion and featured settings
  limitedTimeOffer: true,
  offerEndDate: true,
  featuredPackage: true,
  // Bulk discount settings
  minPurchaseForBulkDiscount: true,
  bulkDiscountPercentage: true,
  // Status
  active: true,
}).transform((data) => {
  // Convert date if present in string format
  if (data.offerEndDate && typeof data.offerEndDate === 'string') {
    data.offerEndDate = new Date(data.offerEndDate);
  }
  return data;
});

// Token transaction schema
export const insertTokenTransactionSchema = createInsertSchema(tokenTransactions).pick({
  userId: true,
  packageId: true,
  amount: true,
  priceUSD: true,
  paymentMethod: true,
  paymentDetails: true,
  additionalInfo: true,
  status: true,
  approvedBy: true,
  transactionHash: true,
});

// Marketplace schema
export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).pick({
  sellerId: true,
  title: true,
  description: true,
  price: true,
  category: true,
  imageUrl: true,
  metadata: true,
  additionalImages: true,
  specifications: true,
  sellerName: true,
});

// Transaction schema
export const insertTransactionSchema = createInsertSchema(transactions).pick({
  buyerId: true,
  sellerId: true,
  itemId: true,
  packageId: true,
  amount: true,
  type: true,
  metadata: true,
});

// Banner image schema
export const insertBannerImageSchema = createInsertSchema(bannerImages).pick({
  imageUrl: true,
  linkUrl: true,
  title: true,
  description: true,
  active: true,
  priority: true,
});

// Embedded ad schema
export const insertEmbeddedAdSchema = createInsertSchema(embeddedAds).pick({
  title: true,
  description: true,
  imageUrl: true,
  linkUrl: true,
  htmlContent: true,
  active: true,
  displayDuration: true,
  priority: true,
  customBackground: true,
  customTextColor: true,
  customButtonColor: true,
  buttonText: true,
  // location field removed
  
  // Ad targeting and placement
  placement: true,
  targetAudience: true,
  startDate: true,
  endDate: true,
  status: true,
  
  userId: true,
  isUserAd: true,
  approved: true,
  reviewStatus: true,
  rejectionReason: true,
  priceTSK: true,
  paymentStatus: true,
  paidAt: true,
  expiresAt: true,
});

// Mining settings schema
export const miningSettingsSchema = createInsertSchema(miningSettings).pick({
  enablestreakbonus: true,
  streakbonuspercentperday: true,
  maxstreakdays: true,
  streakexpirationhours: true,
  enabledailybonus: true,
  dailybonuschance: true,
  enableautomaticmining: true,
  hourlyrewardamount: true,
  dailyactivationrequired: true,
  activationexpirationhours: true,
  globalwithdrawalday: true,
  enablewithdrawallimits: true,
  withdrawalstarthour: true,
  withdrawalendhour: true,
});

// Contract addresses schema
export const insertContractAddressSchema = createInsertSchema(contractAddresses).pick({
  network: true,
  address: true,
  updatedBy: true,
});

// Events schema
export const insertEventSchema = createInsertSchema(events)
  .pick({
    title: true,
    description: true,
    startDate: true,
    endDate: true,
    imageUrl: true,
    linkUrl: true,
    active: true,
    createdBy: true,
    priority: true,
    featured: true,
    displayOnDashboard: true,
  })
  .transform((data) => {
    // Force date conversion for API requests where dates might come as strings
    if (data.startDate) {
      data.startDate = new Date(data.startDate);
    }
    if (data.endDate) {
      data.endDate = new Date(data.endDate);
    }
    return data;
  });

// Admin task schema
export const insertAdminTaskSchema = createInsertSchema(adminTasks).pick({
  title: true,
  description: true,
  assignedTo: true,
  status: true,
  priority: true,
  dueDate: true,
  createdBy: true,
});

// Learning paths schema
export const insertLearningPathSchema = createInsertSchema(learningPaths).pick({
  title: true,
  description: true,
  category: true,
  difficulty: true,
  priority: true,
  requiredForFeatures: true,
  active: true,
});

// Learning steps schema
export const insertLearningStepSchema = createInsertSchema(learningSteps).pick({
  pathId: true,
  title: true,
  description: true,
  content: true,
  orderIndex: true,
  estimatedTimeMinutes: true,
  isRequired: true,
});

// User progress schema
export const insertUserProgressSchema = createInsertSchema(userProgress).pick({
  userId: true,
  pathId: true,
  lastStepCompleted: true,
  isCompleted: true,
  completedAt: true,
  completedSteps: true,
});

// User interactions schema
export const insertUserInteractionSchema = createInsertSchema(userInteractions).pick({
  userId: true,
  interactionType: true,
  featureName: true,
  metadata: true,
});

// Onboarding preferences schema
export const insertOnboardingPreferencesSchema = createInsertSchema(onboardingPreferences).pick({
  userId: true,
  interests: true,
  experienceLevel: true,
  learningStyle: true,
  disableOnboarding: true,
});

// Whitepaper schema
export const insertWhitepaperSchema = createInsertSchema(whitepapers).pick({
  title: true,
  description: true,
  fileUrl: true,
  version: true,
  published: true,
  uploadedBy: true,
});

// Chat related schemas
export const insertChatGroupSchema = createInsertSchema(chatGroups).pick({
  name: true,
  description: true,
  imageUrl: true,
  isPublic: true,
  createdBy: true,
});

export const insertChatGroupMemberSchema = createInsertSchema(chatGroupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).pick({
  groupId: true,
  userId: true,
  content: true,
  replyTo: true,
  attachments: true,
});

export const insertChatMessageReactionSchema = createInsertSchema(chatMessageReactions).pick({
  messageId: true,
  userId: true,
  reaction: true,
});

export const insertDirectMessageSchema = createInsertSchema(directMessages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  attachments: true,
});

// Notifications schema
export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  read: true,
  expiresAt: true,
  priority: true,
  actionUrl: true,
  imageUrl: true,
  metadata: true,
});

// Device tokens schema for push notifications
export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).pick({
  userId: true,
  token: true,
  platform: true,
  deviceId: true,
  isActive: true,
});

// Platform settings schema
export const insertPlatformSettingSchema = createInsertSchema(platformSettings).pick({
  settingType: true,
  title: true,
  content: true,
  version: true,
  updatedById: true,
  isActive: true,
  requiresAcceptance: true,
});

// System secrets schema
export const insertSystemSecretSchema = createInsertSchema(systemSecrets).pick({
  key: true,
  value: true,
  description: true,
  category: true,
  createdBy: true,
  isEncrypted: true,
  isActive: true,
  environment: true,
});

// System settings schema
export const insertSystemSettingSchema = createInsertSchema(systemSettings).pick({
  key: true,
  value: true,
  description: true,
  category: true,
  isActive: true,
});

// Wallet configuration schema
export const insertWalletConfigurationSchema = createInsertSchema(walletConfiguration).pick({
  network: true,
  chainId: true,
  rpcUrl: true,
  explorerUrl: true,
  publicAddress: true,
  contractAddress: true,
  isActive: true,
  isDefault: true,
  createdBy: true,
  gasLimit: true,
  gasPrice: true,
  privateKeyReference: true,
  networkName: true,
  decimals: true,
  symbol: true,
});

// AI assistant schemas
export const insertAIKnowledgeBaseSchema = createInsertSchema(aiKnowledgeBase).pick({
  topic: true,
  subtopic: true,
  information: true,
  relationships: true,
  confidence: true,
  category: true,
}).extend({
  source: z.string().optional() // Add source field for tracking where knowledge came from
});

export const insertAIReasoningSchema = createInsertSchema(aiReasoning).pick({
  pattern: true,
  rules: true,
  examples: true,
  priority: true,
  category: true,
  metadata: true,
});

export const insertAIConversationMemorySchema = createInsertSchema(aiConversationMemory).pick({
  userId: true,
  conversations: true,
  preferences: true,
  insights: true,
  feedbackHistory: true,
});

export const insertAISystemTaskSchema = createInsertSchema(aiSystemTasks).pick({
  taskType: true,
  priority: true,
  status: true,
  data: true,
  scheduledFor: true,
});

// AI feedback schema
export const insertAIFeedbackSchema = createInsertSchema(aiFeedback).pick({
  userId: true,
  conversationId: true,
  question: true,
  answer: true,
  rating: true,
  feedback: true,
  topics: true,
  applicationArea: true,
});

// Platform scan results schema
export const insertPlatformScanResultSchema = createInsertSchema(platformScanResults).pick({
  userStats: true,
  miningStats: true,
  marketplaceStats: true,
  systemStats: true,
  aiStats: true,
  knowledgeSnapshot: true,
  changeDetected: true,
  changeDetails: true,
});

// AI learning metrics schema
export const insertAILearningMetricsSchema = createInsertSchema(aiLearningMetrics).pick({
  totalInteractions: true,
  positiveRatings: true,
  negativeRatings: true,
  neutralRatings: true,
  knowledgeGapsIdentified: true,
  knowledgeEntriesCreated: true,
  knowledgeEntriesUpdated: true,
  patternsCreated: true,
  averageResponseConfidence: true,
  topQuestionCategories: true,
  commonMisunderstandings: true,
});

// Subscription schemas
export const insertSubscriptionSchema = createInsertSchema(subscriptions).pick({
  userId: true,
  packageId: true,
  status: true,
  startDate: true, 
  endDate: true,
  nextBillingDate: true,
  billingCycle: true,
  price: true,
  autoRenew: true,
});

export const insertSubscriptionPaymentSchema = createInsertSchema(subscriptionPayments).pick({
  subscriptionId: true,
  userId: true,
  amount: true,
  status: true,
  paymentDate: true,
  nextPaymentDate: true,
  transactionId: true,
  paymentMethod: true,
});

// Update premium package schema to include subscription fields
export const insertPremiumPackageSchema = createInsertSchema(premiumPackages).pick({
  name: true,
  description: true,
  price: true,
  miningMultiplier: true,
  active: true,
  isSubscription: true,
  monthlyPrice: true,
  billingCycle: true,
});

// Withdrawal schema for token withdrawals to external wallets
export const withdrawalSchema = z.object({
  walletAddress: z.string().refine(
    (address) => /^0x[a-fA-F0-9]{40}$/.test(address), 
    { message: "Invalid wallet address format. Must be a valid Ethereum/BSC address (0x followed by 40 hex characters)" }
  ),
  amount: z.number().positive(),
  network: z.literal("mainnet").default("mainnet") // Always use mainnet for withdrawals
});

// ==================== TYPE DEFINITIONS ====================

// Main types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertReferral = z.infer<typeof insertReferralSchema>;
export type InsertMiningHistory = z.infer<typeof insertMiningHistorySchema>;
export type InsertPremiumPackage = z.infer<typeof insertPremiumPackageSchema>;
export type InsertTokenPackage = z.infer<typeof insertTokenPackageSchema>;
export type InsertTokenTransaction = z.infer<typeof insertTokenTransactionSchema>;
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertBannerImage = z.infer<typeof insertBannerImageSchema>;
export type InsertEmbeddedAd = z.infer<typeof insertEmbeddedAdSchema>;
export type MiningSettings = z.infer<typeof miningSettingsSchema>;
export type InsertContractAddress = z.infer<typeof insertContractAddressSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type KycSubmission = z.infer<typeof kycSubmissionSchema>;
export type KycVerification = z.infer<typeof kycVerificationSchema>;
export type InsertAdminTask = z.infer<typeof insertAdminTaskSchema>;
export type InsertWhitepaper = z.infer<typeof insertWhitepaperSchema>;

// Subscription types
export type InsertSubscription = z.infer<typeof insertSubscriptionSchema>;
export type InsertSubscriptionPayment = z.infer<typeof insertSubscriptionPaymentSchema>;

// Chat related types
export type InsertChatGroup = z.infer<typeof insertChatGroupSchema>;
export type InsertChatGroupMember = z.infer<typeof insertChatGroupMemberSchema>;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type InsertChatMessageReaction = z.infer<typeof insertChatMessageReactionSchema>;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;
export type InsertPlatformSetting = z.infer<typeof insertPlatformSettingSchema>;
export type InsertSystemSecret = z.infer<typeof insertSystemSecretSchema>;
export type InsertSystemSetting = z.infer<typeof insertSystemSettingSchema>;
export type InsertWalletConfiguration = z.infer<typeof insertWalletConfigurationSchema>;

// AI assistant types
export type InsertAIKnowledgeBase = z.infer<typeof insertAIKnowledgeBaseSchema>;
export type InsertAIReasoning = z.infer<typeof insertAIReasoningSchema>;
export type InsertAIConversationMemory = z.infer<typeof insertAIConversationMemorySchema>;
export type InsertAISystemTask = z.infer<typeof insertAISystemTaskSchema>;
export type InsertAIFeedback = z.infer<typeof insertAIFeedbackSchema>;
export type InsertPlatformScanResult = z.infer<typeof insertPlatformScanResultSchema>;
export type InsertAILearningMetrics = z.infer<typeof insertAILearningMetricsSchema>;

// Onboarding related types
export type InsertLearningPath = z.infer<typeof insertLearningPathSchema>;
export type InsertLearningStep = z.infer<typeof insertLearningStepSchema>;
export type InsertUserProgress = z.infer<typeof insertUserProgressSchema>;
export type InsertUserInteraction = z.infer<typeof insertUserInteractionSchema>;
export type InsertOnboardingPreferences = z.infer<typeof insertOnboardingPreferencesSchema>;
export type Withdrawal = z.infer<typeof withdrawalSchema>;

// Table types
export type User = typeof users.$inferSelect;
export type UserKyc = typeof userKyc.$inferSelect;
export type Referral = typeof referrals.$inferSelect;
export type MiningHistory = typeof miningHistory.$inferSelect;
export type PremiumPackage = typeof premiumPackages.$inferSelect;
export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type TokenPackage = typeof tokenPackages.$inferSelect;
export type TokenTransaction = typeof tokenTransactions.$inferSelect;
export type BannerImage = typeof bannerImages.$inferSelect;
export type EmbeddedAd = typeof embeddedAds.$inferSelect;
export type MiningSetting = typeof miningSettings.$inferSelect;
export type ContractAddress = typeof contractAddresses.$inferSelect;
export type Event = typeof events.$inferSelect;
export type AdminTaskBase = typeof adminTasks.$inferSelect;
export type Whitepaper = typeof whitepapers.$inferSelect;
export type Subscription = typeof subscriptions.$inferSelect;
export type SubscriptionPayment = typeof subscriptionPayments.$inferSelect;
export type LearningPath = typeof learningPaths.$inferSelect;
export type LearningStep = typeof learningSteps.$inferSelect;
export type UserProgress = typeof userProgress.$inferSelect;
export type UserInteraction = typeof userInteractions.$inferSelect;
export type OnboardingPreference = typeof onboardingPreferences.$inferSelect;
export type ChatGroup = typeof chatGroups.$inferSelect;
export type ChatGroupMember = typeof chatGroupMembers.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type ChatMessageReaction = typeof chatMessageReactions.$inferSelect;
export type DirectMessage = typeof directMessages.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type DeviceToken = typeof deviceTokens.$inferSelect;
export type PlatformSetting = typeof platformSettings.$inferSelect;
export type SystemSecret = typeof systemSecrets.$inferSelect;
export type SystemSetting = typeof systemSettings.$inferSelect;
export type WalletConfiguration = typeof walletConfiguration.$inferSelect;
export type AIKnowledgeBase = typeof aiKnowledgeBase.$inferSelect;
export type AIReasoning = typeof aiReasoning.$inferSelect;
export type AIConversationMemory = typeof aiConversationMemory.$inferSelect;
export type AISystemTask = typeof aiSystemTasks.$inferSelect;
export type AIFeedback = typeof aiFeedback.$inferSelect;

// Extended AdminTask type with related user information
export interface AdminTask extends AdminTaskBase {
  assignee?: {
    id: number;
    username: string;
    role: string;
  } | null;
  creator?: {
    id: number;
    username: string;
    role: string;
  } | null;
}

// User physical addresses for shipping and marketplace
export const userAddresses = pgTable("user_addresses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  addressType: text("address_type").notNull().default("shipping"), // shipping, billing, etc.
  isDefault: boolean("is_default").notNull().default(false),
  
  // Basic address fields
  name: text("name").notNull(), // Name of recipient
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  
  // Contact information
  phone: text("phone"),
  email: text("email"),
  
  // Address verification status
  verified: boolean("verified").default(false),
  verificationMethod: text("verification_method"), // sms, email, document, none
  verificationDate: timestamp("verification_date"),
  
  // Additional fields for address management
  label: text("label"), // Home, Office, etc.
  notes: text("notes"),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Address verification history
export const addressVerifications = pgTable("address_verifications", {
  id: serial("id").primaryKey(),
  addressId: integer("address_id").notNull().references(() => userAddresses.id, { onDelete: "cascade" }),
  verificationToken: text("verification_token"),
  tokenExpiryDate: timestamp("token_expiry_date"),
  status: text("status").notNull().default("pending"), // pending, verified, failed, expired
  verificationMethod: text("verification_method").notNull(), // sms, email, document
  createdAt: timestamp("created_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
  ipAddress: text("ip_address"),
  deviceInfo: text("device_info"),
  notes: text("notes"),
});

// Transaction shipping information
export const shippingDetails = pgTable("shipping_details", {
  id: serial("id").primaryKey(),
  transactionId: integer("transaction_id").notNull().references(() => transactions.id, { onDelete: "cascade" }),
  addressId: integer("address_id").references(() => userAddresses.id),
  
  // Copy of address information at time of transaction
  recipientName: text("recipient_name").notNull(),
  addressLine1: text("address_line1").notNull(),
  addressLine2: text("address_line2"),
  city: text("city").notNull(),
  state: text("state"),
  postalCode: text("postal_code"),
  country: text("country").notNull(),
  phone: text("phone"),
  
  // Shipping tracking information
  carrier: text("carrier"),
  trackingNumber: text("tracking_number"),
  shippingMethod: text("shipping_method"),
  estimatedDeliveryDate: timestamp("estimated_delivery_date"),
  actualDeliveryDate: timestamp("actual_delivery_date"),
  shippingStatus: text("shipping_status").default("pending"), // pending, shipped, delivered, failed
  
  // Additional fields
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ==================== TABLE RELATIONS ====================

// User relations
export const usersRelations = relations(users, ({ many, one }) => {
  return {
    miningHistories: many(miningHistory),
    marketplaceItems: many(marketplaceItems, { relationName: "seller" }),
    outgoingReferrals: many(referrals, { relationName: "referrer" }),
    incomingReferrals: many(referrals, { relationName: "referred" }),
    kyc: many(userKyc),
    notifications: many(notifications),
    deviceTokens: many(deviceTokens),
    addresses: many(userAddresses), // Added relationship for user addresses
    referredBy: one(users, {
      fields: [users.referredBy],
      references: [users.id],
    }),
    buyerTransactions: many(transactions, { relationName: "buyer" }),
    sellerTransactions: many(transactions, { relationName: "seller" }),
    tokenTransactions: many(tokenTransactions),
    subscriptions: many(subscriptions),
    subscriptionPayments: many(subscriptionPayments),
    assignedTasks: many(adminTasks, { relationName: "assignee" }),
    createdTasks: many(adminTasks, { relationName: "creator" }),
    userProgress: many(userProgress),
    userInteractions: many(userInteractions),
    onboardingPreferences: many(onboardingPreferences),
    aiConversationMemory: many(aiConversationMemory),
    aiFeedback: many(aiFeedback), // Added relationship for AI feedback
  };
});

// KYC relations
export const userKycRelations = relations(userKyc, ({ one }) => ({
  user: one(users, {
    fields: [userKyc.userId],
    references: [users.id],
  }),
}));

// Referral relations
export const referralsRelations = relations(referrals, ({ one }) => ({
  referrer: one(users, {
    fields: [referrals.referrerId],
    references: [users.id],
    relationName: "referrer"
  }),
  referred: one(users, {
    fields: [referrals.referredId],
    references: [users.id],
    relationName: "referred"
  }),
}));

// Mining history relations
export const miningHistoryRelations = relations(miningHistory, ({ one }) => ({
  user: one(users, {
    fields: [miningHistory.userId],
    references: [users.id],
  }),
}));

// Marketplace items relations
export const marketplaceItemsRelations = relations(marketplaceItems, ({ one, many }) => ({
  seller: one(users, {
    fields: [marketplaceItems.sellerId],
    references: [users.id],
    relationName: "seller"
  }),
  transactions: many(transactions),
}));

// Premium packages relations
export const premiumPackagesRelations = relations(premiumPackages, ({ many }) => ({
  transactions: many(transactions),
  subscriptions: many(subscriptions),
}));

// Subscription relations
export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  user: one(users, {
    fields: [subscriptions.userId],
    references: [users.id],
  }),
  package: one(premiumPackages, {
    fields: [subscriptions.packageId],
    references: [premiumPackages.id],
  }),
  payments: many(subscriptionPayments),
}));

// Subscription payments relations
export const subscriptionPaymentsRelations = relations(subscriptionPayments, ({ one }) => ({
  subscription: one(subscriptions, {
    fields: [subscriptionPayments.subscriptionId],
    references: [subscriptions.id],
  }),
  user: one(users, {
    fields: [subscriptionPayments.userId],
    references: [users.id],
  }),
}));

// Token packages relations
export const tokenPackagesRelations = relations(tokenPackages, ({ many }) => ({
  transactions: many(tokenTransactions),
}));

// Token transactions relations
export const tokenTransactionsRelations = relations(tokenTransactions, ({ one }) => ({
  user: one(users, {
    fields: [tokenTransactions.userId],
    references: [users.id],
  }),
  package: one(tokenPackages, {
    fields: [tokenTransactions.packageId],
    references: [tokenPackages.id],
  }),
  approver: one(users, {
    fields: [tokenTransactions.approvedBy],
    references: [users.id],
  }),
}));

// Transactions relations
export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
    relationName: "buyer"
  }),
  seller: one(users, {
    fields: [transactions.sellerId],
    references: [users.id],
    relationName: "seller"
  }),
  marketplaceItem: one(marketplaceItems, {
    fields: [transactions.itemId],
    references: [marketplaceItems.id],
  }),
  premiumPackage: one(premiumPackages, {
    fields: [transactions.packageId],
    references: [premiumPackages.id],
  }),
  shipping: many(shippingDetails), // Added relation to shipping details
}));

// Admin tasks relations
export const adminTasksRelations = relations(adminTasks, ({ one }) => ({
  assignee: one(users, {
    fields: [adminTasks.assignedTo],
    references: [users.id],
    relationName: "assignee"
  }),
  creator: one(users, {
    fields: [adminTasks.createdBy],
    references: [users.id],
    relationName: "creator"
  }),
}));

// Learning paths relations
export const learningPathsRelations = relations(learningPaths, ({ many }) => ({
  steps: many(learningSteps),
  userProgress: many(userProgress),
}));

// Learning steps relations
export const learningStepsRelations = relations(learningSteps, ({ one }) => ({
  path: one(learningPaths, {
    fields: [learningSteps.pathId],
    references: [learningPaths.id],
  }),
}));

// User progress relations
export const userProgressRelations = relations(userProgress, ({ one }) => ({
  user: one(users, {
    fields: [userProgress.userId],
    references: [users.id],
  }),
  path: one(learningPaths, {
    fields: [userProgress.pathId],
    references: [learningPaths.id],
  }),
}));

// User interactions relations
export const userInteractionsRelations = relations(userInteractions, ({ one }) => ({
  user: one(users, {
    fields: [userInteractions.userId],
    references: [users.id],
  }),
}));

// Onboarding preferences relations
export const onboardingPreferencesRelations = relations(onboardingPreferences, ({ one }) => ({
  user: one(users, {
    fields: [onboardingPreferences.userId],
    references: [users.id],
  }),
}));

// Contract addresses relations
export const contractAddressesRelations = relations(contractAddresses, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [contractAddresses.updatedBy],
    references: [users.id],
  }),
}));

// Events relations
export const eventsRelations = relations(events, ({ one }) => ({
  creator: one(users, {
    fields: [events.createdBy],
    references: [users.id],
  }),
}));

// Embedded ads relations
export const embeddedAdsRelations = relations(embeddedAds, ({ one }) => ({
  creator: one(users, {
    fields: [embeddedAds.userId],
    references: [users.id],
  }),
}));

// Chat groups relations
export const chatGroupsRelations = relations(chatGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [chatGroups.createdBy],
    references: [users.id],
  }),
  members: many(chatGroupMembers),
  messages: many(chatMessages),
}));

// Chat group members relations
export const chatGroupMembersRelations = relations(chatGroupMembers, ({ one }) => ({
  group: one(chatGroups, {
    fields: [chatGroupMembers.groupId],
    references: [chatGroups.id],
  }),
  user: one(users, {
    fields: [chatGroupMembers.userId],
    references: [users.id],
  }),
}));

// Chat messages relations
export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
  group: one(chatGroups, {
    fields: [chatMessages.groupId],
    references: [chatGroups.id],
  }),
  sender: one(users, {
    fields: [chatMessages.userId],
    references: [users.id],
  }),
  // Set up the self-relation (replyTo) properly with explicit typing
  replyToMessage: one(chatMessages, {
    fields: [chatMessages.replyTo],
    references: [chatMessages.id],
    relationName: "parentMessage"
  }),
  replies: many(chatMessages, { relationName: "parentMessage" }),
  reactions: many(chatMessageReactions),
}));

// Chat message reactions relations
export const chatMessageReactionsRelations = relations(chatMessageReactions, ({ one }) => ({
  message: one(chatMessages, {
    fields: [chatMessageReactions.messageId],
    references: [chatMessages.id],
  }),
  user: one(users, {
    fields: [chatMessageReactions.userId],
    references: [users.id],
  }),
}));

// Direct messages relations
export const directMessagesRelations = relations(directMessages, ({ one }) => ({
  sender: one(users, {
    fields: [directMessages.senderId],
    references: [users.id],
  }),
  receiver: one(users, {
    fields: [directMessages.receiverId],
    references: [users.id],
  }),
}));

// Notification relations
export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

// Device tokens relations
export const deviceTokensRelations = relations(deviceTokens, ({ one }) => ({
  user: one(users, {
    fields: [deviceTokens.userId],
    references: [users.id],
  }),
}));

// Platform settings relations
export const platformSettingsRelations = relations(platformSettings, ({ one }) => ({
  updatedBy: one(users, {
    fields: [platformSettings.updatedById],
    references: [users.id],
  }),
}));

// System secrets relations
export const systemSecretsRelations = relations(systemSecrets, ({ one }) => ({
  createdByUser: one(users, {
    fields: [systemSecrets.createdBy],
    references: [users.id],
  }),
}));

// Wallet configuration relations
export const walletConfigurationRelations = relations(walletConfiguration, ({ one }) => ({
  createdByUser: one(users, {
    fields: [walletConfiguration.createdBy],
    references: [users.id],
  }),
}));

// AI conversation memory relations
export const aiConversationMemoryRelations = relations(aiConversationMemory, ({ one }) => ({
  user: one(users, {
    fields: [aiConversationMemory.userId],
    references: [users.id],
  }),
}));

// AI feedback relations
export const aiFeedbackRelations = relations(aiFeedback, ({ one }) => ({
  user: one(users, {
    fields: [aiFeedback.userId],
    references: [users.id],
  }),
}));

// User addresses relations
export const userAddressesRelations = relations(userAddresses, ({ one, many }) => ({
  user: one(users, {
    fields: [userAddresses.userId],
    references: [users.id],
  }),
  verifications: many(addressVerifications),
}));

// Address verification relations
export const addressVerificationsRelations = relations(addressVerifications, ({ one }) => ({
  address: one(userAddresses, {
    fields: [addressVerifications.addressId],
    references: [userAddresses.id],
  }),
}));

// Shipping details relations
export const shippingDetailsRelations = relations(shippingDetails, ({ one }) => ({
  transaction: one(transactions, {
    fields: [shippingDetails.transactionId],
    references: [transactions.id],
  }),
  address: one(userAddresses, {
    fields: [shippingDetails.addressId],
    references: [userAddresses.id],
  }),
}));

// -------------------- Address related schemas --------------------
// User address insert schema 
export const insertUserAddressSchema = createInsertSchema(userAddresses)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    verificationDate: true,
    lastUsed: true,
  })
  .extend({
    postalCode: z.string().trim().optional(),
    phone: z.string().trim().min(5).max(20).optional()
      .refine(phone => !phone || /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,10}[-\s.]?[0-9]{1,10}$/.test(phone), {
        message: "Invalid phone number format"
      }),
    email: z.string().email().optional(),
    country: z.string().min(2).max(2)
      .refine(country => /^[A-Z]{2}$/.test(country), {
        message: "Country must be a 2-letter ISO country code (e.g., US, GB, JP)"
      }),
  });

export type InsertUserAddress = z.infer<typeof insertUserAddressSchema>;
export type UserAddress = typeof userAddresses.$inferSelect;

// Address verification insert schema
export const insertAddressVerificationSchema = createInsertSchema(addressVerifications)
  .omit({
    id: true,
    createdAt: true,
    completedAt: true,
  });

export type InsertAddressVerification = z.infer<typeof insertAddressVerificationSchema>;
export type AddressVerification = typeof addressVerifications.$inferSelect;

// Shipping details insert schema
export const insertShippingDetailsSchema = createInsertSchema(shippingDetails)
  .omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    actualDeliveryDate: true,
  });

export type InsertShippingDetails = z.infer<typeof insertShippingDetailsSchema>;
export type ShippingDetails = typeof shippingDetails.$inferSelect;
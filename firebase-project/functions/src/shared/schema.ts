import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision, jsonb, primaryKey, unique } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==================== TABLE DEFINITIONS ====================

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  email: text("email").unique(),
  fullName: text("full_name"),
  walletAddress: text("wallet_address"),
  walletType: text("wallet_type"),
  tokenBalance: doublePrecision("token_balance").notNull().default(0),
  miningRate: doublePrecision("mining_rate").notNull().default(1),
  lastMiningDate: timestamp("last_mining_date"),
  miningStreak: integer("mining_streak").default(0),
  referralCode: text("referral_code").notNull().unique(),
  registeredWithReferral: text("registered_with_referral"),
  role: text("role").notNull().default("user"),
  profilePictureUrl: text("profile_picture_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Onboarding preferences
export const onboardingPreferences = pgTable("onboarding_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  interests: jsonb("interests").default([]),
  experienceLevel: text("experience_level").default("beginner"),
  learningStyle: text("learning_style"),
  disableOnboarding: boolean("disable_onboarding").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// KYC table
export const userKyc = pgTable("user_kyc", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  status: text("status").notNull().default("unverified"), // unverified, pending, verified, rejected
  fullName: text("full_name"),
  country: text("country"),
  documentType: text("document_type"), // passport, national_id, drivers_license
  documentId: text("document_id"),
  frontImageUrl: text("front_image_url"),
  backImageUrl: text("back_image_url"),
  selfieImageUrl: text("selfie_image_url"),
  submissionDate: timestamp("submission_date"),
  verificationDate: timestamp("verification_date"),
  rejectionReason: text("rejection_reason"),
});

// Referrals table
export const referrals = pgTable("referrals", {
  id: serial("id").primaryKey(),
  referrerId: integer("referrer_id").notNull().references(() => users.id),
  referredId: integer("referred_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  active: boolean("active").notNull().default(true),
});

// Mining history
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

// Mining settings
export const miningSettings = pgTable("mining_settings", {
  id: serial("id").primaryKey(),
  enableStreakBonus: boolean("enablestreakbonus").notNull().default(true),
  streakBonusPercentPerDay: integer("streakbonuspercentperday").notNull().default(5),
  maxStreakDays: integer("maxstreakdays").notNull().default(10),
  streakExpirationHours: integer("streakexpirationhours").notNull().default(48),
  enableDailyBonus: boolean("enabledailybonus").notNull().default(true),
  dailyBonusChance: integer("dailybonuschance").notNull().default(10),
  enableAutomaticMining: boolean("enableautomaticmining").notNull().default(true),
  hourlyRewardAmount: doublePrecision("hourlyrewardamount").notNull().default(0.5),
  dailyActivationRequired: boolean("dailyactivationrequired").notNull().default(true),
  activationExpirationHours: integer("activationexpirationhours").notNull().default(24),
  updatedAt: timestamp("updatedat").notNull().defaultNow(),
});

// Marketplace items
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
  featured: boolean("featured").default(false),
  rating: doublePrecision("rating").default(0),
  reviewCount: integer("review_count").default(0),
  additionalImages: text("additional_images").array(), // Array of additional image URLs
  specifications: text("specifications"), // JSON string for detailed product specs
  sellerName: text("seller_name"), // Cached seller name for faster display
  views: integer("views").default(0), // Track product views for popularity metrics
});

// Transactions
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  buyerId: integer("buyer_id").notNull().references(() => users.id),
  sellerId: integer("seller_id").notNull().references(() => users.id),
  itemId: integer("item_id").references(() => marketplaceItems.id),
  amount: doublePrecision("amount").notNull(),
  type: text("type").notNull(), // 'marketplace', 'premium', 'withdrawal', etc.
  metadata: text("metadata"), // JSON string for additional data like wallet address for withdrawals
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Ads
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
  placement: jsonb("placement").default(['sidebar']), // banner, sidebar, notification
  targetAudience: jsonb("target_audience").default(['all']), // all, miners, premium, marketplace, new
  startDate: timestamp("start_date").defaultNow(), // When to start showing the ad
  endDate: timestamp("end_date"), // When to stop showing the ad
  status: text("status").default('pending'), // pending, approved, rejected, expired
  userId: integer("user_id").references(() => users.id), // User who created the ad
  isUserAd: boolean("is_user_ad").default(false), // Whether this is a user-created ad
  approved: boolean("approved").default(false), // Whether admin has approved the ad
  reviewStatus: text("review_status").default('pending'), // 'pending', 'approved', 'rejected'
  rejectionReason: text("rejection_reason"), // Reason for rejection if rejected
  priceTSK: doublePrecision("price_tsk"), // Cost in TSK tokens
  paymentStatus: text("payment_status").default('unpaid'), // 'unpaid', 'paid', 'refunded'
  paidAt: timestamp("paid_at"), // When payment was made
  expiresAt: timestamp("expires_at"), // When ad expires
  impressions: integer("impressions").default(0), // Track number of impressions
  clicks: integer("clicks").default(0), // Track number of clicks
});

// Banner images
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

// Contract addresses
export const contractAddresses = pgTable("contract_addresses", {
  id: serial("id").primaryKey(),
  network: text("network").notNull().unique(), // 'testnet' or 'mainnet'
  address: text("address").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// Events
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

// AI knowledge base
export const aiKnowledge = pgTable("ai_knowledge", {
  id: serial("id").primaryKey(),
  topic: text("topic").notNull(),
  content: text("content").notNull(),
  keywords: text("keywords").array(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  source: text("source").default("admin"),
  approved: boolean("approved").default(true),
  category: text("category").default("general"),
});

// Branding settings
export const brandingSettings = pgTable("branding_settings", {
  id: serial("id").primaryKey(),
  siteName: text("site_name").default("TSK Platform"),
  siteTagline: text("site_tagline").default("Future of decentralised economy"),
  faviconUrl: text("favicon_url"),
  logoUrl: text("logo_url"),
  logoType: text("logo_type").default("default"), // default, custom
  primaryColor: text("primary_color").default("#19466B"),
  secondaryColor: text("secondary_color"),
  logoText: text("logo_text").default("TSK"),
  accentColor: text("accent_color").default("#4A90E2"),
  useLogoText: boolean("use_logo_text").default(false),
  loginBackgroundImage: text("login_background_image"),
  enableCustomBranding: boolean("enable_custom_branding").default(true),
  mobileLogoUrl: text("mobile_logo_url"),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  updatedBy: integer("updated_by").references(() => users.id),
});

// ==================== RELATIONS ====================

export const usersRelations = relations(users, ({ many }) => ({
  miningHistory: many(miningHistory),
  marketplaceItems: many(marketplaceItems),
  referrals: many(referrals, { relationName: "userReferrals" }),
}));

export const miningHistoryRelations = relations(miningHistory, ({ one }) => ({
  user: one(users, {
    fields: [miningHistory.userId],
    references: [users.id],
  }),
}));

export const marketplaceItemsRelations = relations(marketplaceItems, ({ one, many }) => ({
  seller: one(users, {
    fields: [marketplaceItems.sellerId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  buyer: one(users, {
    fields: [transactions.buyerId],
    references: [users.id],
  }),
  seller: one(users, {
    fields: [transactions.sellerId],
    references: [users.id],
  }),
  item: one(marketplaceItems, {
    fields: [transactions.itemId],
    references: [marketplaceItems.id],
  }),
}));

// ==================== INSERT SCHEMAS ====================

// Create insert schemas using Zod
export const insertUserSchema = createInsertSchema(users, {
  email: (schema) => schema.email.email(),
  passwordHash: z.string().min(8),
}).omit({ id: true });

export const insertOnboardingPreferencesSchema = createInsertSchema(onboardingPreferences).omit({ id: true });

export const insertMiningHistorySchema = createInsertSchema(miningHistory).omit({ id: true });

export const insertMarketplaceItemSchema = createInsertSchema(marketplaceItems).omit({ id: true });

export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true });

export const insertAdSchema = createInsertSchema(embeddedAds).omit({ id: true });

// ==================== TYPES ====================

// Define types for DB operations
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type OnboardingPreference = typeof onboardingPreferences.$inferSelect;
export type InsertOnboardingPreference = z.infer<typeof insertOnboardingPreferencesSchema>;

export type MiningHistoryEntry = typeof miningHistory.$inferSelect;
export type InsertMiningHistoryEntry = z.infer<typeof insertMiningHistorySchema>;

export type MarketplaceItem = typeof marketplaceItems.$inferSelect;
export type InsertMarketplaceItem = z.infer<typeof insertMarketplaceItemSchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type Ad = typeof embeddedAds.$inferSelect;
export type InsertAd = z.infer<typeof insertAdSchema>;

// Define table exports for queries
export { eq, and };
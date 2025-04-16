import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage-new";
import { User as SchemaUser } from "@shared/schema";
import { nanoid } from "nanoid";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import * as schema from "@shared/schema";
import { emailService } from "./services/email-service";
import { add } from "date-fns";

declare global {
  namespace Express {
    interface User extends SchemaUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

function generateReferralCode() {
  return nanoid(10);
}

export function setupAuth(app: Express) {
  // Enhance session security and reliability
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "token-miner-secret",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    },
    rolling: true, // Refresh the cookie on each request
    name: 'tsk_session' // Give the session a unique name
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid username or password" });
        } 
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const { username, password, email, fullName, referralCode } = req.body;
      
      // Validate username and password
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }
      
      if (password.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Validate email if provided
      if (email && !email.includes('@')) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }
      
      // Check if email already exists if provided
      if (email) {
        const existingEmail = await db.query.users.findFirst({
          where: eq(schema.users.email, email)
        });
        
        if (existingEmail) {
          return res.status(400).json({ message: "Email address is already in use" });
        }
      }
      
      // Check referral code if provided
      let referredBy = null;
      if (referralCode) {
        const referrer = await storage.getUserByReferralCode(referralCode);
        if (referrer) {
          referredBy = referrer.id;
        }
      }
      
      // Create the user
      const user = await storage.createUser({
        username,
        password: await hashPassword(password),
        walletAddress: "",
        referralCode: generateReferralCode(),
        referredBy,
        email,
        fullName
      });
      
      // Create onboarding preferences for the new user with default settings
      try {
        await storage.createOnboardingPreferences({
          userId: user.id,
          experienceLevel: "beginner", // Default experience level
          interests: [],               // Empty interests by default
          learningStyle: null,         // No learning style yet
          disableOnboarding: false     // Enable onboarding by default
        });
        console.log(`Created default onboarding preferences for new user ${user.id}`);
      } catch (prefError) {
        console.error(`Error creating onboarding preferences for new user ${user.id}:`, prefError);
        // We don't want to fail registration if onboarding preferences creation fails
      }
      
      // Strip sensitive info
      const userResponse = {
        ...user,
        password: undefined
      };
      
      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(userResponse);
      });
    } catch (err) {
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Add logging to track login attempts and session creation
    console.log(`Login attempt for username: ${req.body.username || 'not provided'}`);
    
    passport.authenticate("local", (err: any, user: SchemaUser | false, info: { message: string } | undefined) => {
      if (err) {
        console.error("Authentication error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log(`Login failed: ${info?.message || "Invalid credentials"}`);
        return res.status(401).json({ message: info?.message || "Invalid credentials" });
      }
      
      console.log(`User authenticated successfully: ${user.username} (ID: ${user.id})`);
      
      // Explicitly regenerate session to prevent session fixation attacks
      req.session.regenerate((sessionErr) => {
        if (sessionErr) {
          console.error("Session regeneration error:", sessionErr);
          return next(sessionErr);
        }
        
        // Now log in with the fresh session
        req.login(user, async (loginErr) => {
          if (loginErr) {
            console.error("Login error after authentication:", loginErr);
            return next(loginErr);
          }
          
          console.log(`Session created for user: ${user.username} (ID: ${user.id})`);
          
          // Check if the user has onboarding preferences
          try {
            const preferences = await storage.getOnboardingPreferences(user.id);
            if (!preferences) {
              // If user doesn't have onboarding preferences, create them
              await storage.createOnboardingPreferences({
                userId: user.id,
                experienceLevel: "beginner",
                interests: [],
                learningStyle: null,
                disableOnboarding: false
              });
              console.log(`Created onboarding preferences for existing user ${user.id} during login`);
            }
          } catch (prefError) {
            console.error(`Error checking/creating onboarding preferences for user ${user.id} during login:`, prefError);
            // Continue login process even if preference creation fails
          }
          
          // Strip sensitive info
          const userResponse = {
            ...user,
            password: undefined
          };
          
          // Save the session before sending response
          req.session.save((saveErr) => {
            if (saveErr) {
              console.error("Error saving session:", saveErr);
              return next(saveErr);
            }
            
            console.log(`Session saved and login complete for: ${user.username}`);
            res.status(200).json(userResponse);
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    if (req.user) {
      const username = (req.user as any).username;
      console.log(`Logout initiated for user: ${username}`);
      
      // First, destroy the session
      req.session.destroy((sessionErr) => {
        if (sessionErr) {
          console.error("Error destroying session during logout:", sessionErr);
          return next(sessionErr);
        }
        
        // Then log out the user (this clears req.user)
        req.logout((logoutErr) => {
          if (logoutErr) {
            console.error("Error during logout operation:", logoutErr);
            return next(logoutErr);
          }
          
          console.log(`User ${username} logged out successfully`);
          
          // Clear the session cookie
          res.clearCookie('tsk_session');
          res.status(200).json({ success: true, message: "Logged out successfully" });
        });
      });
    } else {
      console.log("Logout requested but no user was authenticated");
      res.status(200).json({ success: true, message: "No active session" });
    }
  });
  
  // Create a demo user for quick login
  app.post("/api/create-demo-user", async (req, res, next) => {
    try {
      // Check if demo user already exists
      let user = await storage.getUserByUsername("demo");
      
      if (!user) {
        // Create a demo user with predefined data
        user = await storage.createUser({
          username: "demo",
          password: await hashPassword("password"),
          walletAddress: "0x123456789abcdef123456789abcdef123456789a",
          referralCode: "DEMO12345",
          role: "user"
        });
        
        // Set additional user fields
        try {
          // Use the users table from schema and the update method from drizzle
          await db
            .update(schema.users)
            .set({
              tokenBalance: 5000,
              miningRate: 15,
              miningActive: true,
              premiumTier: "basic",
              premiumMultiplier: 1.5
            })
            .where(eq(schema.users.id, user.id))
            .execute();
            
          console.log("Updated demo user with additional fields");
        } catch (err) {
          console.error("Error updating demo user fields:", err);
        }
        
        // Create onboarding preferences
        await storage.createOnboardingPreferences({
          userId: user.id,
          experienceLevel: "beginner",
          interests: ["mining", "marketplace"],
          learningStyle: "visual",
          disableOnboarding: false
        });
      }
      
      res.status(200).json({ message: "Demo user ready", username: "demo" });
    } catch (err) {
      console.error("Error creating demo user:", err);
      next(err);
    }
  });

  app.get("/api/user", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get the most up-to-date user from the database
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update the session user to keep it in sync
      req.user = user;
      
      // Strip sensitive info
      const userResponse = {
        ...user,
        password: undefined
      };
      
      res.json(userResponse);
    } catch (error) {
      console.error("Error fetching user data:", error);
      res.status(500).json({ message: "Failed to fetch user data" });
    }
  });
  
  // DELETE account endpoint
  app.delete("/api/user", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) return res.sendStatus(401);
      
      const userId = req.user?.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID not found" });
      }
      
      // Password confirmation is required for account deletion
      const { password } = req.body;
      if (!password) {
        return res.status(400).json({ message: "Password confirmation is required" });
      }
      
      // Verify password matches
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const passwordMatches = await comparePasswords(password, user.password);
      if (!passwordMatches) {
        return res.status(401).json({ message: "Incorrect password" });
      }
      
      // Delete the user account
      const success = await storage.deleteUser(userId);
      
      if (success) {
        // Log the user out
        req.logout((err) => {
          if (err) return next(err);
          res.status(200).json({ message: "Account successfully deleted" });
        });
      } else {
        res.status(500).json({ message: "Failed to delete account" });
      }
    } catch (err) {
      console.error("Error deleting account:", err);
      next(err);
    }
  });

  // Check if the user is authenticated
  function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    next();
  }

  // Check if user is admin
  function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    
    if (req.user?.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    
    next();
  }

  // Account recovery routes
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Find user by email
      const user = await db.query.users.findFirst({
        where: eq(schema.users.email, email)
      });
      
      if (!user) {
        // For security reasons, still return success even if email not found
        return res.status(200).json({ 
          message: "If an account with this email exists, password reset instructions have been sent" 
        });
      }
      
      // Generate reset token
      const resetToken = randomBytes(32).toString("hex");
      const resetTokenExpiry = add(new Date(), { hours: 1 }); // Token expires in 1 hour
      
      // Update user with reset token
      await db.update(schema.users)
        .set({
          resetToken,
          resetTokenExpiry
        })
        .where(eq(schema.users.id, user.id));
      
      // Send password reset email
      await emailService.sendPasswordResetEmail(email, resetToken, user.username);
      
      res.status(200).json({ 
        message: "If an account with this email exists, password reset instructions have been sent" 
      });
    } catch (error) {
      console.error("Error in forgot password:", error);
      res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });
  
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ message: "Password must be at least 6 characters" });
      }
      
      // Find user with this reset token and check it hasn't expired
      const user = await db.query.users.findFirst({
        where: eq(schema.users.resetToken, token)
      });
      
      if (!user || !user.resetTokenExpiry) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }
      
      const tokenExpiry = new Date(user.resetTokenExpiry);
      if (tokenExpiry < new Date()) {
        return res.status(400).json({ message: "Reset token has expired" });
      }
      
      // Update password and clear reset token
      const hashedPassword = await hashPassword(newPassword);
      await db.update(schema.users)
        .set({
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null
        })
        .where(eq(schema.users.id, user.id));
      
      // Create notification about password change
      await db.insert(schema.notifications)
        .values({
          userId: user.id,
          title: "Password Reset Successful",
          message: "Your password has been reset successfully. If you did not request this change, please contact support immediately.",
          type: "security",
          priority: 2
        });
      
      res.status(200).json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset password:", error);
      res.status(500).json({ message: "An error occurred while resetting your password" });
    }
  });
  
  // User profile update route to add full name
  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { fullName, email } = req.body;
      
      // Validate email format if provided
      if (email && !email.includes('@')) {
        return res.status(400).json({ message: "Please provide a valid email address" });
      }
      
      // Check if email already exists for another user if changing email
      if (email) {
        const existingUser = await db.query.users.findFirst({
          where: eq(schema.users.email, email)
        });
        
        if (existingUser && existingUser.id !== userId) {
          return res.status(400).json({ message: "Email address is already in use" });
        }
      }
      
      // Update user profile
      const updateData: Record<string, any> = {};
      if (fullName !== undefined) updateData.fullName = fullName;
      if (email !== undefined) updateData.email = email;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({ message: "No valid fields provided for update" });
      }
      
      await db.update(schema.users)
        .set(updateData)
        .where(eq(schema.users.id, userId));
      
      // Get updated user data
      const updatedUser = await db.query.users.findFirst({
        where: eq(schema.users.id, userId)
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found after update" });
      }
      
      // Return updated user data without password
      const userResponse = {
        ...updatedUser,
        password: undefined,
        resetToken: undefined,
        resetTokenExpiry: undefined
      };
      
      res.status(200).json(userResponse);
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(500).json({ message: "An error occurred while updating your profile" });
    }
  });

  // Admin route to send email notification to user
  app.post("/api/admin/send-email-notification", isAdmin, async (req, res) => {
    try {
      const { userId, title, message, type = "system" } = req.body;
      
      if (!userId || !title || !message) {
        return res.status(400).json({ message: "User ID, title, and message are required" });
      }
      
      // First check if user exists and has email
      const user = await db.query.users.findFirst({
        where: eq(schema.users.id, userId),
      });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create notification in database
      await db.insert(schema.notifications)
        .values({
          userId,
          title,
          message,
          type,
          priority: 1
        });
      
      // Send email if user has email address
      let emailSent = false;
      if (user.email) {
        emailSent = await emailService.sendNotificationEmail(userId, title, message, type);
      }
      
      res.status(200).json({ 
        message: "Notification created successfully", 
        emailSent,
        emailAddress: user.email ? true : false
      });
    } catch (error) {
      console.error("Error sending notification:", error);
      res.status(500).json({ message: "An error occurred while sending the notification" });
    }
  });
  
  // Admin route to send bulk email notifications
  app.post("/api/admin/send-bulk-notification", isAdmin, async (req, res) => {
    try {
      const { userIds, title, message, type = "announcement" } = req.body;
      
      if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !title || !message) {
        return res.status(400).json({ 
          message: "Valid user IDs array, title, and message are required" 
        });
      }
      
      // Create notifications for all users
      const notificationValues = userIds.map(userId => ({
        userId,
        title,
        message,
        type,
        priority: 1
      }));
      
      await db.insert(schema.notifications).values(notificationValues);
      
      // Send emails to users with email addresses
      const emailResults = await emailService.sendBulkAnnouncement(userIds, title, message);
      
      res.status(200).json({ 
        message: "Bulk notifications sent", 
        notificationCount: userIds.length,
        emailsSent: emailResults.success,
        emailsFailed: emailResults.failed
      });
    } catch (error) {
      console.error("Error sending bulk notifications:", error);
      res.status(500).json({ message: "An error occurred while sending bulk notifications" });
    }
  });

  // Simple test endpoint for authentication debugging
  app.post("/api/auth-test", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      console.log(`Auth test endpoint called with username: ${username || 'not provided'}`);
      
      if (!username || !password) {
        return res.status(400).json({ 
          success: false, 
          message: "Username and password are required",
          sessionInfo: {
            sessionID: req.sessionID || 'none',
            isAuthenticated: req.isAuthenticated()
          }
        });
      }
      
      // Manual authentication check
      const user = await storage.getUserByUsername(username);
      
      if (!user) {
        console.log(`Auth test: user not found for username: ${username}`);
        return res.status(401).json({ 
          success: false, 
          message: "Invalid username or password",
          sessionInfo: {
            sessionID: req.sessionID || 'none',
            isAuthenticated: req.isAuthenticated()
          }
        });
      }
      
      // Check password
      const passwordValid = await comparePasswords(password, user.password);
      if (!passwordValid) {
        console.log(`Auth test: invalid password for username: ${username}`);
        return res.status(401).json({ 
          success: false, 
          message: "Invalid username or password",
          sessionInfo: {
            sessionID: req.sessionID || 'none',
            isAuthenticated: req.isAuthenticated()
          }
        });
      }
      
      console.log(`Auth test: successful authentication for ${username}`);
      
      // Response with auth details but without creating a session
      res.status(200).json({ 
        success: true,
        message: "Authentication successful (test only - no session created)",
        sessionInfo: {
          sessionID: req.sessionID || 'none',
          isAuthenticated: req.isAuthenticated()
        },
        userInfo: {
          id: user.id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      console.error("Error in auth test endpoint:", error);
      res.status(500).json({ 
        success: false, 
        message: "Server error during authentication test",
        sessionInfo: {
          sessionID: req.sessionID || 'none',
          isAuthenticated: req.isAuthenticated()
        },
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  return { isAdmin, isAuthenticated };
}

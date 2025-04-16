import { Express, Request, Response, NextFunction } from 'express';
import * as bcrypt from 'bcrypt';
import * as passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { db } from './db';
import { users, eq } from './shared/schema';
import { customAlphabet } from 'nanoid';

// For generating referral codes
const nanoid = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 8);

async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

async function comparePasswords(supplied: string, stored: string): Promise<boolean> {
  return bcrypt.compare(supplied, stored);
}

function generateReferralCode(): string {
  return nanoid();
}

export function setupAuth(app: Express): void {
  // Initialize Passport
  app.use(passport.initialize());
  
  // Local Strategy for username/password auth
  passport.use(new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
      try {
        // Find user by username
        const user = await db.query.users.findFirst({
          where: eq(users.username, username)
        });
        
        if (!user) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Check password
        const isValid = await comparePasswords(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: 'Invalid credentials' });
        }
        
        // Return the user
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
  
  // Middleware to check if user is authenticated
  function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
    // Check for Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    // Check if Bearer token
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid authentication format' });
    }
    
    // Verify the token (in a real implementation, use Firebase Admin SDK to verify the token)
    const token = parts[1];
    
    // For simplicity, we're using a middleware approach here
    // In a full implementation, you would verify the token using Firebase Admin SDK
    passport.authenticate('jwt', { session: false }, (err: any, user: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: 'Invalid or expired token' });
      }
      req.user = user;
      next();
    })(req, res, next);
  }
  
  // Middleware to check if user is an admin
  function isAdmin(req: Request, res: Response, next: NextFunction): void {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }
    
    next();
  }
  
  // Login endpoint
  app.post('/api/auth/login', (req, res, next) => {
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return res.status(401).json({ message: info.message || 'Invalid credentials' });
      }
      
      try {
        // Generate Firebase custom token
        // In a real implementation, you would use Firebase Admin SDK to create a custom token
        const admin = require('firebase-admin');
        const token = await admin.auth().createCustomToken(user.id.toString());
        
        // Return user data and token
        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            tokenBalance: user.tokenBalance
          }
        });
      } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Authentication error' });
      }
    })(req, res, next);
  });
  
  // Register endpoint
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, referralCode } = req.body;
      
      // Check if user already exists
      const existingUser = await db.query.users.findFirst({
        where: eq(users.username, username)
      });
      
      if (existingUser) {
        return res.status(400).json({ message: 'Username already exists' });
      }
      
      // Check if email already exists
      const existingEmail = await db.query.users.findFirst({
        where: eq(users.email, email)
      });
      
      if (existingEmail) {
        return res.status(400).json({ message: 'Email already in use' });
      }
      
      // Hash password
      const passwordHash = await hashPassword(password);
      
      // Generate referral code
      const newReferralCode = generateReferralCode();
      
      // Create user
      const result = await db.insert(users).values({
        username,
        email,
        passwordHash,
        role: 'user',
        tokenBalance: 100, // Starting balance
        referralCode: newReferralCode,
        registeredWithReferral: referralCode || null
      }).returning();
      
      const newUser = result[0];
      
      // Process referral if provided
      if (referralCode) {
        // In a real implementation, you would credit the referrer
        // We'll implement that logic in a separate service
      }
      
      // Generate Firebase custom token
      const admin = require('firebase-admin');
      const token = await admin.auth().createCustomToken(newUser.id.toString());
      
      // Return user data and token
      res.status(201).json({
        token,
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          tokenBalance: newUser.tokenBalance
        }
      });
    } catch (error) {
      console.error('Error during registration:', error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });
  
  // Register middleware
  app.use('/api/user', isAuthenticated);
  app.use('/api/admin', isAuthenticated, isAdmin);
  
  // Expose middleware for other routes to use
  app.set('isAuthenticated', isAuthenticated);
  app.set('isAdmin', isAdmin);
}
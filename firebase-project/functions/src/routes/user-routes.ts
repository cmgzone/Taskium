import { Express, Request, Response } from 'express';
import { db } from '../db';
import { users, onboardingPreferences, eq, and } from '../shared/schema';

export function setupUserRoutes(app: Express): void {
  const isAuthenticated = app.get('isAuthenticated');
  const isAdmin = app.get('isAdmin');
  
  // Get current user
  app.get('/api/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          username: true,
          email: true,
          role: true,
          tokenBalance: true,
          walletAddress: true,
          referralCode: true,
          miningStreak: true,
          lastMiningDate: true,
          createdAt: true,
          profilePictureUrl: true
        }
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json(user);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Failed to fetch user data' });
    }
  });
  
  // Update user profile
  app.patch('/api/user', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { username, email } = req.body;
      
      // Check if username is taken by another user
      if (username) {
        const existingUser = await db.query.users.findFirst({
          where: and(
            eq(users.username, username),
            (users) => users.id !== userId
          )
        });
        
        if (existingUser) {
          return res.status(400).json({ message: 'Username already taken' });
        }
      }
      
      // Check if email is taken by another user
      if (email) {
        const existingEmail = await db.query.users.findFirst({
          where: and(
            eq(users.email, email),
            (users) => users.id !== userId
          )
        });
        
        if (existingEmail) {
          return res.status(400).json({ message: 'Email already in use' });
        }
      }
      
      // Update user
      await db.update(users)
        .set({
          username: username || undefined,
          email: email || undefined,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      // Get updated user
      const updatedUser = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
          id: true,
          username: true,
          email: true,
          role: true,
          tokenBalance: true,
          walletAddress: true,
          referralCode: true,
          miningStreak: true,
          lastMiningDate: true,
          createdAt: true,
          profilePictureUrl: true
        }
      });
      
      res.json(updatedUser);
    } catch (error) {
      console.error('Error updating user profile:', error);
      res.status(500).json({ message: 'Failed to update user profile' });
    }
  });
  
  // Connect wallet
  app.post('/api/user/wallet', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { walletAddress, walletType } = req.body;
      
      if (!walletAddress) {
        return res.status(400).json({ message: 'Wallet address is required' });
      }
      
      // Update user's wallet
      await db.update(users)
        .set({
          walletAddress,
          walletType: walletType || 'metamask',
          updatedAt: new Date()
        })
        .where(eq(users.id, userId));
      
      res.json({
        message: 'Wallet connected successfully',
        walletAddress,
        walletType: walletType || 'metamask'
      });
    } catch (error) {
      console.error('Error connecting wallet:', error);
      res.status(500).json({ message: 'Failed to connect wallet' });
    }
  });
  
  // Get user onboarding preferences
  app.get('/api/user/onboarding-preferences', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      
      const preferences = await db.query.onboardingPreferences.findFirst({
        where: eq(onboardingPreferences.userId, userId)
      });
      
      res.json(preferences || { userId, interests: [], experienceLevel: 'beginner' });
    } catch (error) {
      console.error('Error fetching onboarding preferences:', error);
      res.status(500).json({ message: 'Failed to fetch onboarding preferences' });
    }
  });
  
  // Update user onboarding preferences
  app.post('/api/user/onboarding-preferences', isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user.id;
      const { interests, experienceLevel, learningStyle, disableOnboarding } = req.body;
      
      // Check if preferences already exist
      const existingPrefs = await db.query.onboardingPreferences.findFirst({
        where: eq(onboardingPreferences.userId, userId)
      });
      
      if (existingPrefs) {
        // Update existing preferences
        await db.update(onboardingPreferences)
          .set({
            interests: interests || existingPrefs.interests,
            experienceLevel: experienceLevel || existingPrefs.experienceLevel,
            learningStyle: learningStyle || existingPrefs.learningStyle,
            disableOnboarding: disableOnboarding !== undefined ? disableOnboarding : existingPrefs.disableOnboarding,
            updatedAt: new Date()
          })
          .where(eq(onboardingPreferences.userId, userId));
      } else {
        // Create new preferences
        await db.insert(onboardingPreferences).values({
          userId,
          interests: interests || [],
          experienceLevel: experienceLevel || 'beginner',
          learningStyle: learningStyle || null,
          disableOnboarding: disableOnboarding || false,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // Get updated preferences
      const updatedPrefs = await db.query.onboardingPreferences.findFirst({
        where: eq(onboardingPreferences.userId, userId)
      });
      
      res.json(updatedPrefs);
    } catch (error) {
      console.error('Error updating onboarding preferences:', error);
      res.status(500).json({ message: 'Failed to update onboarding preferences' });
    }
  });
  
  // Admin: Get all users
  app.get('/api/admin/users', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      
      const usersList = await db.query.users.findMany({
        columns: {
          id: true,
          username: true,
          email: true,
          role: true,
          tokenBalance: true,
          walletAddress: true,
          referralCode: true,
          createdAt: true,
          profilePictureUrl: true
        },
        limit,
        offset,
        orderBy: (users) => [users.createdAt.desc()]
      });
      
      // Count total users
      const result = await db.select({ count: db.fn.count() }).from(users);
      const totalUsers = Number(result[0].count);
      
      res.json({
        users: usersList,
        pagination: {
          page,
          limit,
          totalUsers,
          totalPages: Math.ceil(totalUsers / limit)
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });
  
  // Admin: Change user role
  app.patch('/api/admin/users/:userId/role', isAuthenticated, isAdmin, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      const { role } = req.body;
      
      if (!role || !['user', 'admin', 'moderator'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role' });
      }
      
      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId)
      });
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      // Update user role
      await db.update(users)
        .set({ role, updatedAt: new Date() })
        .where(eq(users.id, userId));
      
      res.json({
        message: 'User role updated successfully',
        userId,
        role
      });
    } catch (error) {
      console.error('Error updating user role:', error);
      res.status(500).json({ message: 'Failed to update user role' });
    }
  });
}
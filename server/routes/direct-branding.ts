import express, { Request, Response } from 'express';
import { db } from '../db';
import { systemSettings } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

const router = express.Router();

// GET /api/direct-branding-settings
// Public endpoint to fetch all branding settings (no auth required for testing)
router.get('/direct-branding-settings', async (req: Request, res: Response) => {
  try {
    console.log('Fetching branding settings through direct endpoint');
    
    // Fetch all branding settings
    const settings = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.category, 'branding'));
    
    console.log(`Found ${settings.length} branding settings`);
    
    // Convert to branding config object with improved defaults
    const config: any = {
      siteName: 'TSK Platform',
      siteTagline: 'The Future of AI Knowledge Management',
      faviconUrl: null,
      logoUrl: '/custom-logo.svg', // Use the simplified direct path
      logoType: 'custom',
      primaryColor: '#19466B',
      secondaryColor: null,
      loginBackgroundImage: null,
      enableCustomBranding: true,
      logoText: 'TSK',
      accentColor: '#4A90E2',
      useLogoText: false,
      mobileLogoUrl: '/mobile-logo.svg'
    };
    
    // Apply settings from database
    for (const setting of settings) {
      try {
        const value = JSON.parse(setting.value);
        console.log(`Setting ${setting.key} = ${value}`);
        (config as any)[setting.key] = value;
      } catch (parseError) {
        console.error(`Error parsing setting ${setting.key}:`, parseError);
      }
    }
    
    // Post-process logo URL if it contains 'custom-checkmark-logo.svg' to ensure it works reliably
    if (config.logoUrl && typeof config.logoUrl === 'string' && config.logoUrl.includes('custom-checkmark-logo.svg')) {
      console.log('Post-processing logo URL for better reliability');
      config.logoUrl = '/custom-logo.svg'; // Use the simplified direct path
    }
    
    console.log('Returning branding config:', config);
    return res.json(config);
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    return res.status(500).json({ error: 'Failed to fetch branding settings' });
  }
});

// POST /api/update-branding-settings 
// Update branding settings directly (no auth for testing)
router.post('/update-branding-settings', async (req: Request, res: Response) => {
  try {
    const { logoUrl, logoType } = req.body;
    console.log('Updating branding settings:', { logoUrl, logoType });
    
    // Validate required fields
    if (!logoUrl) {
      return res.status(400).json({ error: 'Logo URL is required' });
    }
    
    // Update logoUrl setting
    const existingLogoUrl = await db.select()
      .from(systemSettings)
      .where(
        and(
          eq(systemSettings.category, 'branding'),
          eq(systemSettings.key, 'logoUrl')
        )
      );
    
    if (existingLogoUrl.length > 0) {
      await db.update(systemSettings)
        .set({ 
          value: JSON.stringify(logoUrl),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(systemSettings.category, 'branding'),
            eq(systemSettings.key, 'logoUrl')
          )
        );
        
      console.log(`Updated branding logoUrl to ${logoUrl}`);
    } else {
      await db.insert(systemSettings)
        .values({
          key: 'logoUrl',
          value: JSON.stringify(logoUrl),
          category: 'branding',
          description: `Branding setting: logoUrl`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        
      console.log(`Created new branding logoUrl setting: ${logoUrl}`);
    }
    
    // Update logoType if provided
    if (logoType) {
      const existingLogoType = await db.select()
        .from(systemSettings)
        .where(
          and(
            eq(systemSettings.category, 'branding'),
            eq(systemSettings.key, 'logoType')
          )
        );
      
      if (existingLogoType.length > 0) {
        await db.update(systemSettings)
          .set({ 
            value: JSON.stringify(logoType),
            updatedAt: new Date()
          })
          .where(
            and(
              eq(systemSettings.category, 'branding'),
              eq(systemSettings.key, 'logoType')
            )
          );
          
        console.log(`Updated branding logoType to ${logoType}`);
      } else {
        await db.insert(systemSettings)
          .values({
            key: 'logoType',
            value: JSON.stringify(logoType),
            category: 'branding',
            description: `Branding setting: logoType`,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          
        console.log(`Created new branding logoType setting: ${logoType}`);
      }
    }
    
    // Also set enableCustomBranding to true
    const existingEnableCustom = await db.select()
      .from(systemSettings)
      .where(
        and(
          eq(systemSettings.category, 'branding'),
          eq(systemSettings.key, 'enableCustomBranding')
        )
      );
    
    if (existingEnableCustom.length > 0) {
      await db.update(systemSettings)
        .set({ 
          value: JSON.stringify(true),
          updatedAt: new Date()
        })
        .where(
          and(
            eq(systemSettings.category, 'branding'),
            eq(systemSettings.key, 'enableCustomBranding')
          )
        );
    } else {
      await db.insert(systemSettings)
        .values({
          key: 'enableCustomBranding',
          value: JSON.stringify(true),
          category: 'branding',
          description: `Branding setting: enableCustomBranding`,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
    }
    
    return res.json({ 
      success: true, 
      message: 'Branding settings updated successfully',
      settings: {
        logoUrl,
        logoType: logoType || 'custom'
      }
    });
    
  } catch (error) {
    console.error('Error updating branding settings:', error);
    return res.status(500).json({ error: 'Failed to update branding settings' });
  }
});

export default router;
/**
 * Branding Settings API Routes
 * Handles fetching and updating platform branding configuration
 */

import express, { Request, Response } from 'express';
import { db } from '../db';
import { systemSettings } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Create unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

// File filter for logo uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/svg'];
  
  console.log('File upload mimetype check:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    allowed: allowedTypes.includes(file.mimetype)
  });
  
  // Allow SVG files by checking extension as well
  if (file.originalname.toLowerCase().endsWith('.svg')) {
    console.log('Allowing SVG file by extension check');
    cb(null, true);
  } else if (allowedTypes.includes(file.mimetype)) {
    console.log('Allowing file by mimetype check');
    cb(null, true);
  } else {
    console.error('Rejecting file due to invalid type:', file.mimetype);
    cb(new Error('Invalid file type. Only JPEG, PNG and SVG are allowed.'));
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024 // 2MB max file size
  }
});

// GET /api/admin/branding-settings
// Retrieve current branding settings
router.get('/', async (req: Request, res: Response) => {
  try {
    console.log('Fetching branding settings');
    
    // Fetch all branding settings from the system_settings table
    const results = await db.select()
      .from(systemSettings)
      .where(eq(systemSettings.category, 'branding'));
    
    console.log(`Found ${results.length} branding settings`);
    
    // Default values if no settings found
    let brandingConfig = {
      siteName: 'TSK Platform',
      siteTagline: 'The Future of AI Knowledge Management',
      faviconUrl: null,
      logoUrl: '/icons/taskium-logo-original.png',
      logoType: 'default',
      primaryColor: '#FF6B35',
      secondaryColor: null,
      loginBackgroundImage: null,
      enableCustomBranding: true,
      // Add additional fields that might be expected by the frontend
      logoText: 'TSK',
      accentColor: '#4A90E2',
      useLogoText: false
    };
    
    // Convert array of settings to a single object
    if (results.length > 0) {
      results.forEach(setting => {
        if (setting.key && setting.value) {
          try {
            // Parse JSON value from the database
            const parsedValue = JSON.parse(setting.value);
            
            // @ts-ignore - Dynamically setting properties
            brandingConfig[setting.key] = parsedValue;
            
            console.log(`Setting ${setting.key} = ${typeof parsedValue === 'object' ? JSON.stringify(parsedValue) : parsedValue}`);
          } catch (parseError) {
            console.error(`Error parsing JSON value for setting ${setting.key}:`, parseError);
            // Use the raw value as fallback
            // @ts-ignore - Dynamically setting properties
            brandingConfig[setting.key] = setting.value;
          }
        }
      });
    }
    
    console.log('Returning branding config:', brandingConfig);
    return res.status(200).json(brandingConfig);
  } catch (error) {
    console.error('Error fetching branding settings:', error);
    return res.status(500).json({ error: 'Failed to fetch branding settings' });
  }
});

// POST /api/admin/branding-settings
// Update branding settings
router.post('/', async (req: Request, res: Response) => {
  try {
    console.log('Branding settings update request received:', { 
      body: req.body,
      contentType: req.headers['content-type'],
      userId: req.user?.id
    });
    
    const {
      siteName,
      siteTagline,
      faviconUrl,
      logoUrl,
      logoType,
      primaryColor,
      secondaryColor,
      loginBackgroundImage,
      enableCustomBranding
    } = req.body;
    
    // Validate required fields
    if (!siteName || !logoUrl || !primaryColor) {
      console.error('Missing required fields in branding settings update', {
        siteName: !!siteName,
        logoUrl: !!logoUrl,
        primaryColor: !!primaryColor
      });
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Update or insert each setting
    const settingsToUpdate = [
      { key: 'siteName', value: siteName },
      { key: 'siteTagline', value: siteTagline || null },
      { key: 'faviconUrl', value: faviconUrl || null },
      { key: 'logoUrl', value: logoUrl },
      { key: 'logoType', value: logoType },
      { key: 'primaryColor', value: primaryColor },
      { key: 'secondaryColor', value: secondaryColor || null },
      { key: 'loginBackgroundImage', value: loginBackgroundImage || null },
      { key: 'enableCustomBranding', value: enableCustomBranding }
    ];
    
    console.log('Settings to update:', settingsToUpdate);
    
    for (const setting of settingsToUpdate) {
      try {
        // Check if setting exists
        const existingSetting = await db.select()
          .from(systemSettings)
          .where(
            and(
              eq(systemSettings.category, 'branding'),
              eq(systemSettings.key, setting.key)
            )
          );
        
        console.log(`Processing setting ${setting.key}, exists: ${existingSetting.length > 0}`);
        
        if (existingSetting.length > 0) {
          // Update existing setting
          await db.update(systemSettings)
            .set({ 
              value: JSON.stringify(setting.value),
              updatedAt: new Date()
            })
            .where(
              and(
                eq(systemSettings.category, 'branding'),
                eq(systemSettings.key, setting.key)
              )
            );
            
          console.log(`Updated setting: ${setting.key}`);
        } else {
          // Insert new setting
          await db.insert(systemSettings)
            .values({
              key: setting.key,
              value: JSON.stringify(setting.value),
              category: 'branding',
              description: `Branding setting: ${setting.key}`,
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            });
            
          console.log(`Inserted new setting: ${setting.key}`);
        }
      } catch (settingError) {
        console.error(`Error processing setting ${setting.key}:`, settingError);
      }
    }
    
    console.log('Branding settings updated successfully');
    return res.status(200).json({ success: true, message: 'Branding settings updated successfully' });
  } catch (error) {
    console.error('Error updating branding settings:', error);
    return res.status(500).json({ error: 'Failed to update branding settings', message: error instanceof Error ? error.message : 'Unknown error' });
  }
});

// POST /api/admin/branding-settings/logo-upload
// Handle logo uploads
router.post('/logo-upload', (req: Request, res: Response, next) => {
  // Log detailed request information
  console.log('Logo upload request received', { 
    contentType: req.headers['content-type'],
    hasBody: !!req.body, 
    bodySize: req.body ? JSON.stringify(req.body).length : 0,
    method: req.method,
    path: req.path,
    query: req.query
  });
  
  // No authentication check for now to isolate the issue
  next();
}, upload.single('logo'), async (req: Request, res: Response) => {
  try {
    // More detailed logging of file upload
    console.log('Processing logo upload', { 
      file: req.file ? {
        filename: req.file.filename,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        fieldname: req.file.fieldname
      } : 'missing',
      body: req.body
    });
    
    if (!req.file) {
      console.error('No file in request. Check FormData field name (should be "logo")');
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    // Log current working directory and environment
    console.log('Current working directory:', process.cwd());
    console.log('File storage paths:', {
      uploadsDir: path.join(process.cwd(), 'uploads'),
      publicDir: path.join(process.cwd(), 'public')
    });
    
    // Ensure upload directory exists with better error handling
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
        console.log('Created upload directory:', uploadDir);
      }
      
      // Ensure correct directory permissions
      fs.chmodSync(uploadDir, 0o755);
      console.log('Set directory permissions for:', uploadDir);
    } catch (dirError) {
      console.error('Error creating or setting permissions on upload directory:', dirError);
      // Continue execution as multer might have already created the directory
    }
    
    // Generate URL path for the uploaded file
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    console.log('Logo URL path generated:', logoUrl);
    
    // Make sure the file exists and is readable
    const fullPath = path.join(process.cwd(), 'uploads', 'logos', req.file.filename);
    
    // Check if file was actually saved by multer
    if (!fs.existsSync(fullPath)) {
      console.error('Logo file does not exist after multer upload:', fullPath);
      return res.status(500).json({ error: 'File was not saved properly by multer' });
    }
    
    console.log('File exists at path:', fullPath);
    
    // Ensure readable permissions with better error handling
    try {
      fs.chmodSync(fullPath, 0o644);
      console.log(`Set permissions on ${fullPath}`);
    } catch (permError) {
      console.error('Error setting file permissions:', permError);
      // Continue as this is not critical
    }
    
    // Create public directory with better error handling
    try {
      const publicLogoDir = path.join(process.cwd(), 'public', 'uploads', 'logos');
      
      // Check if directory exists before trying to create it
      if (!fs.existsSync(publicLogoDir)) {
        fs.mkdirSync(publicLogoDir, { recursive: true });
        console.log(`Created public logos directory: ${publicLogoDir}`);
      } else {
        console.log(`Public logos directory already exists: ${publicLogoDir}`);
      }
      
      // Copy the file instead of symlink (more compatible)
      const publicFilePath = path.join(publicLogoDir, req.file.filename);
      fs.copyFileSync(fullPath, publicFilePath);
      console.log(`Copied logo to public directory: ${publicFilePath}`);
      
      // Verify the file was copied correctly
      if (fs.existsSync(publicFilePath)) {
        console.log('Verified file exists in public directory');
      } else {
        console.error('File copy to public directory failed verification:', publicFilePath);
      }
    } catch (copyError) {
      console.error('Error copying file to public directory:', copyError);
      // Don't fail the whole request just for this
    }
    
    // Update the branding settings to use the new logo URL
    try {
      // Check if logo setting exists
      const existingSetting = await db.select()
        .from(systemSettings)
        .where(
          and(
            eq(systemSettings.category, 'branding'),
            eq(systemSettings.key, 'logoUrl')
          )
        );
      
      if (existingSetting.length > 0) {
        // Update existing setting
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
          
        console.log(`Updated branding setting with new logo URL: ${logoUrl}`);
      } else {
        // Insert new setting
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
          
        console.log(`Inserted new branding setting for logo URL: ${logoUrl}`);
      }
      
      // Also update logoType to 'custom'
      const existingLogoTypeSetting = await db.select()
        .from(systemSettings)
        .where(
          and(
            eq(systemSettings.category, 'branding'),
            eq(systemSettings.key, 'logoType')
          )
        );
      
      if (existingLogoTypeSetting.length > 0) {
        await db.update(systemSettings)
          .set({ 
            value: JSON.stringify('custom'),
            updatedAt: new Date()
          })
          .where(
            and(
              eq(systemSettings.category, 'branding'),
              eq(systemSettings.key, 'logoType')
            )
          );
      } else {
        await db.insert(systemSettings)
          .values({
            key: 'logoType',
            value: JSON.stringify('custom'),
            category: 'branding',
            description: `Branding setting: logoType`,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date()
          });
      }
      
      console.log('Updated branding settings with new logo information');
    } catch (dbError) {
      console.error('Error updating branding settings with new logo:', dbError);
      // Continue even if this fails - don't block the upload
    }
    
    // Return success response with all possible URLs
    return res.status(200).json({
      success: true,
      logoUrl: logoUrl,
      alternativeUrls: [
        logoUrl,
        `/api/logos/${req.file.filename}`,
        `/public/uploads/logos/${req.file.filename}`
      ],
      message: 'Logo uploaded successfully and branding settings updated',
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return res.status(500).json({ error: `Failed to upload logo: ${error instanceof Error ? error.message : 'Unknown error'}` });
  }
});

export default router;
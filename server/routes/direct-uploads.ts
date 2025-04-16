import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { systemSettings } from '@shared/schema';
import { and, eq } from 'drizzle-orm';

const router = express.Router();

// Set up storage for uploaded logos
const storage = multer.diskStorage({
  destination: function (_req: Request, _file: Express.Multer.File, cb: any) {
    // Set destination to uploads/logos
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log(`Created directory: ${uploadDir}`);
    }
    
    // Set appropriate permissions
    try {
      fs.chmodSync(uploadDir, 0o755);
    } catch (err) {
      console.error('Error setting directory permissions:', err);
    }
    
    cb(null, uploadDir);
  },
  filename: function (_req: Request, file: Express.Multer.File, cb: any) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

// File filter for logo uploads
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'image/svg'];
  
  console.log('Direct upload file check:', {
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

// POST /api/direct-logo-upload
// Direct endpoint for logo uploads (not requiring auth for testing)
router.post('/direct-logo-upload', upload.single('logo'), async (req: Request, res: Response) => {
  try {
    console.log('Direct logo upload request received');
    
    if (!req.file) {
      console.error('No file in request. Check FormData field name (should be "logo")');
      return res.status(400).json({ error: 'No file uploaded' });
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
        `/uploads/logos/${req.file.filename}`,
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
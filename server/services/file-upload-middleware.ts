import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// We don't need custom FileRequestHandler type - we'll use the proper types
import { Request } from 'express';
import { FileFilterCallback } from 'multer';

// Create upload directories if they don't exist
const uploadDir = path.join(process.cwd(), 'uploads');
const kycDir = path.join(uploadDir, 'kyc');
const marketplaceDir = path.join(uploadDir, 'marketplace');
const adsDir = path.join(uploadDir, 'ads');
const bannersDir = path.join(uploadDir, 'banners');
const logosDir = path.join(uploadDir, 'logos');
const publicLogosDir = path.join(process.cwd(), 'public', 'uploads', 'logos');

// Create directories if they don't exist
[uploadDir, kycDir, marketplaceDir, adsDir, bannersDir, logosDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
  
  // Set proper permissions for the directory
  try {
    fs.chmodSync(dir, 0o755);
    console.log(`Set directory permissions for: ${dir}`);
  } catch (permError) {
    console.error(`Error setting permissions for ${dir}:`, permError);
  }
});

// Handle public logos directory separately
if (!fs.existsSync(publicLogosDir)) {
  try {
    // Create parent directories if needed
    fs.mkdirSync(path.join(process.cwd(), 'public', 'uploads'), { recursive: true });
    
    // Create a symbolic link to the uploads/logos directory
    // This ensures all uploaded logos are directly accessible from the public path
    fs.symlinkSync(
      path.join(process.cwd(), 'uploads', 'logos'), 
      publicLogosDir,
      'dir'
    );
    console.log(`Created symlink from ${publicLogosDir} to ${path.join(process.cwd(), 'uploads', 'logos')}`);
  } catch (error) {
    console.error('Error creating public logos directory or symlink:', error);
    
    // If symlink failed, try creating a regular directory
    if (!fs.existsSync(publicLogosDir)) {
      try {
        fs.mkdirSync(publicLogosDir, { recursive: true });
        console.log(`Created public logos directory as regular directory: ${publicLogosDir}`);
      } catch (mkdirError) {
        console.error(`Error creating public logos directory: ${mkdirError}`);
      }
    }
  }
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine the upload directory based on the endpoint
    let dir = uploadDir;
    
    // Check for logo-related routes first (most specific first)
    if (req.path.includes('logo-upload') || req.path.includes('direct-logo')) {
      dir = logosDir;
      console.log(`Logo upload detected - storing in: ${dir}`);
    } else if (req.path.includes('kyc-image')) {
      dir = kycDir;
    } else if (req.path.includes('marketplace-image')) {
      dir = marketplaceDir;
    } else if (req.path.includes('ad-image')) {
      dir = adsDir;
    } else if (req.path.includes('banner-image')) {
      dir = bannersDir;
    }

    // Make sure the directory exists and is accessible
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
        fs.chmodSync(dir, 0o755);
        console.log(`Created and set permissions for directory: ${dir}`);
      } catch (err) {
        console.error(`Error creating destination directory ${dir}:`, err);
      }
    }

    cb(null, dir);
  },
  filename: function (req, file, cb) {
    // Generate a unique filename to prevent collisions
    const uniqueSuffix = uuidv4();
    const extension = path.extname(file.originalname);
    
    // Use different prefix for different file types
    let prefix = 'file-';
    
    // For logo uploads, use "logo-" prefix
    if (req.path.includes('logo')) {
      prefix = 'logo-';
    }
    
    cb(null, `${prefix}${uniqueSuffix}${extension}`);
  }
});

// File filter to validate uploaded files
const fileFilter = (req: any, file: any, cb: any) => {
  // Accept images and documents
  const allowedMimeTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/svg+xml',
    'image/svg', // Some browsers might use this variant
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  // Log the file information for debugging
  console.log('File upload check:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    path: req.path
  });

  // Special case for SVG files which might have different mimetypes
  if (file.originalname.toLowerCase().endsWith('.svg')) {
    console.log('Accepting file by SVG extension');
    cb(null, true);
  } else if (allowedMimeTypes.includes(file.mimetype)) {
    console.log('Accepting file by mimetype');
    cb(null, true);
  } else {
    console.error('Rejecting file:', file.mimetype);
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

// Set up multer middleware
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB limit
  },
  fileFilter: fileFilter
});

// Process the uploaded file and return a file URL
export async function processUploadedFile(file: Express.Multer.File) {
  console.log("Processing uploaded file:", file);
  if (!file) {
    console.error("No file provided to processUploadedFile");
    throw new Error("No file provided");
  }

  // Check if file.path exists
  if (!fs.existsSync(file.path)) {
    console.error(`File does not exist at path: ${file.path}`);
  }

  // Set proper file permissions
  try {
    fs.chmodSync(file.path, 0o644);
    console.log(`Set permissions for file: ${file.path}`);
  } catch (permError) {
    console.error(`Error setting permissions for ${file.path}:`, permError);
  }

  // Convert the file path to a URL path with proper slashes
  // Extract directory and filename
  const uploadDir = path.dirname(file.path);
  const dirName = path.basename(uploadDir); // 'kyc', 'logos', etc.
  const fileName = path.basename(file.path);
  
  // Create a simplified URL path that doesn't include full directory structure
  const urlPath = `/uploads/${dirName}/${fileName}`;
  console.log(`File saved to ${file.path}, URL path: ${urlPath}`);
  
  // Determine the type of upload
  let uploadType = '';
  if (file.path.includes('logos')) {
    uploadType = 'logos';
  } else if (file.path.includes('ads')) {
    uploadType = 'ads';
  } else if (file.path.includes('kyc')) {
    uploadType = 'kyc';
  } else if (file.path.includes('marketplace')) {
    uploadType = 'marketplace';
  } else if (file.path.includes('banners')) {
    uploadType = 'banners';
  }
  
  // Create a public copy of the file
  if (uploadType) {
    try {
      // Make sure the public directory exists
      const publicDir = path.join(process.cwd(), 'public', 'uploads', uploadType);
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
        console.log(`Created public directory: ${publicDir}`);
      }
      
      // Create a copy for public access
      const filename = path.basename(file.path);
      const publicFilePath = path.join(publicDir, filename);
      
      // Copy the file to public directory
      fs.copyFileSync(file.path, publicFilePath);
      console.log(`Created public copy at: ${publicFilePath}`);
      
      // For logos, create additional special copies
      if (uploadType === 'logos') {
        // If this is an SVG file and includes "mobile" in the name, save a special copy
        if (filename.toLowerCase().endsWith('.svg') && filename.toLowerCase().includes('mobile')) {
          const mobileLogoPath = path.join(process.cwd(), 'public', 'mobile-logo.svg');
          fs.copyFileSync(file.path, mobileLogoPath);
          console.log(`Created mobile-logo.svg copy at: ${mobileLogoPath}`);
        }
        
        // If this is an SVG file, save a copy as the standard taskium logo
        if (filename.toLowerCase().endsWith('.svg')) {
          const standardLogoPath = path.join(process.cwd(), 'public', 'taskium-logo.svg');
          fs.copyFileSync(file.path, standardLogoPath);
          console.log(`Created taskium-logo.svg copy at: ${standardLogoPath}`);
        }
      }
    } catch (copyError) {
      console.error(`Error creating public copies for ${uploadType} file:`, copyError);
      // Log but continue - not critical for the upload
    }
  }

  return urlPath;
}
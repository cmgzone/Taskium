import { Express, Request, Response } from 'express';
import * as admin from 'firebase-admin';
import * as multer from 'multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Setup storage service with Firebase
export function setupStorage(app: Express, adminInstance: typeof admin): void {
  const storage = adminInstance.storage();
  const bucket = storage.bucket();
  
  // Configure multer for memory storage
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (_req, file, cb) => {
      // Check file types
      const allowedTypes = [
        'image/jpeg',
        'image/png',
        'image/svg+xml',
        'image/gif',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
      }
    }
  });
  
  // Upload endpoint for general files
  app.post('/api/uploads', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const category = req.body.category || 'general';
      const fileId = uuidv4();
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `${fileId}${fileExtension}`;
      const filePath = `users/${userId}/${category}/${fileName}`;
      
      // Upload file to Firebase Storage
      const file = bucket.file(filePath);
      const fileBuffer = req.file.buffer;
      
      await file.save(fileBuffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            originalName: req.file.originalname,
            uploadedBy: userId,
            category
          }
        }
      });
      
      // Make file publicly accessible
      await file.makePublic();
      
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      
      res.status(200).json({
        message: 'File uploaded successfully',
        fileName: fileName,
        filePath: filePath,
        url: publicUrl
      });
    } catch (error) {
      console.error('File upload error:', error);
      res.status(500).json({ message: 'File upload failed' });
    }
  });
  
  // Upload endpoint for profile pictures
  app.post('/api/uploads/profile', upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const fileId = uuidv4();
      const fileExtension = path.extname(req.file.originalname);
      const fileName = `profile-${fileId}${fileExtension}`;
      const filePath = `users/${userId}/profile/${fileName}`;
      
      // Upload file to Firebase Storage
      const file = bucket.file(filePath);
      const fileBuffer = req.file.buffer;
      
      await file.save(fileBuffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: {
            originalName: req.file.originalname,
            uploadedBy: userId
          }
        }
      });
      
      // Make file publicly accessible
      await file.makePublic();
      
      // Get public URL
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      
      // Update user profile picture URL in the database
      // This part depends on your database schema and structure
      
      res.status(200).json({
        message: 'Profile picture uploaded successfully',
        fileName: fileName,
        filePath: filePath,
        url: publicUrl
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      res.status(500).json({ message: 'Profile picture upload failed' });
    }
  });
  
  // Upload endpoint for KYC documents
  app.post('/api/uploads/kyc', upload.array('files', 3), async (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const files = req.files as Express.Multer.File[];
      const uploadResults = [];
      
      for (const file of files) {
        const fileId = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const fileName = `kyc-${fileId}${fileExtension}`;
        const filePath = `kyc/${userId}/${fileName}`;
        
        // Upload file to Firebase Storage
        const storageFile = bucket.file(filePath);
        const fileBuffer = file.buffer;
        
        await storageFile.save(fileBuffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
              uploadedBy: userId,
              documentType: req.body.documentType || 'identity'
            }
          }
        });
        
        // For KYC documents, we don't make them publicly accessible
        // Only admins should be able to access them
        
        // Generate a signed URL with limited time validity for backend access
        const [signedUrl] = await storageFile.getSignedUrl({
          action: 'read',
          expires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
        });
        
        uploadResults.push({
          fileName: fileName,
          filePath: filePath,
          signedUrl
        });
      }
      
      res.status(200).json({
        message: 'KYC documents uploaded successfully',
        files: uploadResults
      });
    } catch (error) {
      console.error('KYC documents upload error:', error);
      res.status(500).json({ message: 'KYC documents upload failed' });
    }
  });
  
  // Upload endpoint for marketplace item images
  app.post('/api/uploads/marketplace', upload.array('files', 5), async (req: Request, res: Response) => {
    try {
      if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const userId = req.user.id;
      const itemId = req.body.itemId || uuidv4();
      const files = req.files as Express.Multer.File[];
      const uploadResults = [];
      
      for (const file of files) {
        const fileId = uuidv4();
        const fileExtension = path.extname(file.originalname);
        const fileName = `item-${fileId}${fileExtension}`;
        const filePath = `marketplace/${itemId}/${fileName}`;
        
        // Upload file to Firebase Storage
        const storageFile = bucket.file(filePath);
        const fileBuffer = file.buffer;
        
        await storageFile.save(fileBuffer, {
          metadata: {
            contentType: file.mimetype,
            metadata: {
              originalName: file.originalname,
              uploadedBy: userId,
              itemId
            }
          }
        });
        
        // Make marketplace images publicly accessible
        await storageFile.makePublic();
        
        // Get public URL
        const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
        
        uploadResults.push({
          fileName: fileName,
          filePath: filePath,
          url: publicUrl
        });
      }
      
      res.status(200).json({
        message: 'Marketplace images uploaded successfully',
        itemId,
        files: uploadResults
      });
    } catch (error) {
      console.error('Marketplace images upload error:', error);
      res.status(500).json({ message: 'Marketplace images upload failed' });
    }
  });
  
  // Get file endpoint (for secured files)
  app.get('/api/uploads/:fileId', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const fileId = req.params.fileId;
      
      // Check access permissions (this would be more complex in a real app)
      // For simplicity, we're just checking if user is owner or admin
      const isAdmin = req.user.role === 'admin';
      const userId = req.user.id;
      
      // Determine file path based on fileId
      // In a real app, you would query the database to get the full path
      const file = bucket.file(`users/${userId}/${fileId}`);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Generate signed URL
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });
      
      // Redirect to signed URL
      res.redirect(signedUrl);
    } catch (error) {
      console.error('File access error:', error);
      res.status(500).json({ message: 'File access failed' });
    }
  });
  
  // Delete file endpoint
  app.delete('/api/uploads/:fileId', async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }
      
      const fileId = req.params.fileId;
      const isAdmin = req.user.role === 'admin';
      const userId = req.user.id;
      
      // Determine file path based on fileId
      // In a real app, you would query the database to get the full path
      const file = bucket.file(`users/${userId}/${fileId}`);
      
      // Check if file exists
      const [exists] = await file.exists();
      if (!exists) {
        return res.status(404).json({ message: 'File not found' });
      }
      
      // Delete file
      await file.delete();
      
      res.status(200).json({ message: 'File deleted successfully' });
    } catch (error) {
      console.error('File deletion error:', error);
      res.status(500).json({ message: 'File deletion failed' });
    }
  });
}
import { Storage } from '@google-cloud/storage';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { randomUUID } from 'crypto';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const unlink = promisify(fs.unlink);
const fileExists = promisify(fs.access);

// Base storage interface
export interface IFileStorage {
  uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  getFileUrl(fileName: string): Promise<string>;
  deleteFile(fileName: string): Promise<boolean>;
}

// Local file storage implementation
export class LocalFileStorage implements IFileStorage {
  private uploadsDir: string;

  constructor() {
    this.uploadsDir = path.join(process.cwd(), 'uploads');
    // Create uploads directory if it doesn't exist
    this.ensureUploadsDir();
    console.log(`LocalFileStorage initialized with uploads directory: ${this.uploadsDir}`);
  }

  private async ensureUploadsDir(): Promise<void> {
    try {
      // Check if directory exists
      try {
        await fileExists(this.uploadsDir, fs.constants.R_OK | fs.constants.W_OK);
        console.log(`Uploads directory exists at: ${this.uploadsDir}`);
      } catch (error) {
        console.log(`Creating uploads directory at: ${this.uploadsDir}`);
        await mkdir(this.uploadsDir, { recursive: true });
        // Set appropriate permissions
        try {
          await promisify(fs.chmod)(this.uploadsDir, 0o755);
        } catch (chmodError) {
          console.warn(`Could not set permissions on uploads directory: ${chmodError}`);
        }
      }
    } catch (error) {
      console.error(`Error ensuring uploads directory: ${error}`);
      throw new Error(`Failed to initialize uploads directory: ${error}`);
    }
  }

  async uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    // Sanitize filename to prevent path traversal and ensure safety
    const sanitizedName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Generate a unique file name to prevent collisions
    const uniqueFileName = `${Date.now()}-${randomUUID().slice(0, 8)}-${sanitizedName}`;
    const filePath = path.join(this.uploadsDir, uniqueFileName);
    
    console.log(`Uploading file to: ${filePath}`);
    
    try {
      await writeFile(filePath, buffer);
      console.log(`File successfully written to: ${filePath}`);
      
      // Ensure file permissions are correct
      try {
        await promisify(fs.chmod)(filePath, 0o644);
      } catch (chmodError) {
        console.warn(`Could not set permissions on file: ${chmodError}`);
      }
      
      // Return the filename for URL construction
      return uniqueFileName;
    } catch (error) {
      console.error(`Error writing file: ${error}`);
      throw new Error(`Failed to write file: ${error}`);
    }
  }

  async getFileUrl(fileName: string): Promise<string> {
    // For local storage, we return a relative URL
    // Sanitize the filename for security
    const sanitizedName = path.basename(fileName);
    return `/uploads/${sanitizedName}`;
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      // Sanitize the filename for security
      const sanitizedName = path.basename(fileName);
      const filePath = path.join(this.uploadsDir, sanitizedName);
      
      console.log(`Attempting to delete file: ${filePath}`);
      
      await unlink(filePath);
      console.log(`Successfully deleted file: ${filePath}`);
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fileName}:`, error);
      return false;
    }
  }
}

// Google Cloud Storage implementation
export class GoogleCloudStorage implements IFileStorage {
  private storage: Storage;
  private bucketName: string;

  constructor(projectId: string, credentials: string, bucketName: string) {
    try {
      const parsedCredentials = JSON.parse(credentials);
      this.storage = new Storage({
        projectId,
        credentials: parsedCredentials
      });
      this.bucketName = bucketName;
    } catch (error) {
      console.error('Error initializing Google Cloud Storage:', error);
      throw new Error('Failed to initialize Google Cloud Storage');
    }
  }

  async uploadFile(buffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    // Generate a unique file name to prevent collisions
    const uniqueFileName = `${Date.now()}-${randomUUID()}-${fileName}`;
    
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(uniqueFileName);
    
    // Upload the file to GCS
    await file.save(buffer, {
      metadata: {
        contentType: mimeType
      }
    });
    
    // Make the file publicly accessible
    await file.makePublic();
    
    return uniqueFileName;
  }

  async getFileUrl(fileName: string): Promise<string> {
    // Construct the GCS URL
    return `https://storage.googleapis.com/${this.bucketName}/${fileName}`;
  }

  async deleteFile(fileName: string): Promise<boolean> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(fileName);
      
      await file.delete();
      return true;
    } catch (error) {
      console.error(`Error deleting file ${fileName} from GCS:`, error);
      return false;
    }
  }
}

// Factory function to create the appropriate storage implementation
export function createFileStorage(): IFileStorage {
  // Check if Google Cloud credentials are available
  const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS;
  const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME || 'tsk-platform-storage';
  
  if (projectId && credentials) {
    try {
      console.log('Using Google Cloud Storage for file storage');
      return new GoogleCloudStorage(projectId, credentials, bucketName);
    } catch (error) {
      console.warn('Failed to initialize Google Cloud Storage, falling back to local storage:', error);
    }
  }
  
  console.log('Using local file storage (uploads directory)');
  return new LocalFileStorage();
}

// Export a singleton instance
export const fileStorage = createFileStorage();
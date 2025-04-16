import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./storage-new";
import path from "path";
import fs from "fs";
import cors from "cors";

// Simple in-memory query cache for invalidation
class SimpleQueryClient {
  private cache = new Map<string, any>();

  setQueryData(key: string | string[], data: any): void {
    const stringKey = Array.isArray(key) ? key.join('/') : key;
    this.cache.set(stringKey, data);
  }

  getQueryData(key: string | string[]): any {
    const stringKey = Array.isArray(key) ? key.join('/') : key;
    return this.cache.get(stringKey);
  }

  invalidate(key: string | string[]): void {
    const stringKey = Array.isArray(key) ? key.join('/') : key;

    // If the key is an exact match, delete it
    if (this.cache.has(stringKey)) {
      this.cache.delete(stringKey);
    }

    // Also check for partial matches (for array keys)
    Array.from(this.cache.keys()).forEach(cacheKey => {
      if (cacheKey.startsWith(stringKey)) {
        this.cache.delete(cacheKey);
      }
    });

    log(`Invalidated cache for key: ${stringKey}`);
  }

  clear(): void {
    this.cache.clear();
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configure CORS to allow Netlify and Vercel domains and localhost
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    // Netlify domains
    'https://tsk-platform.netlify.app',
    'https://taskium-platform.netlify.app',
    /\.netlify\.app$/,  // Allow all Netlify subdomains
    // Vercel domains
    'https://taskium-flame.vercel.app',
    /\.vercel\.app$/,   // Allow all Vercel subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Initialize the query client for cache invalidation
const queryClient = new SimpleQueryClient();
app.set('queryClient', queryClient);

// Serve files from uploads directory with proper MIME types and caching
app.use('/uploads', (req, res, next) => {
  // Log access to uploaded files
  console.log(`Accessing uploaded file: ${req.path}`);
  
  // Handle special case for logo files directly
  if (req.path.includes('/logos/')) {
    const logoFilename = path.basename(req.path);
    const logoPath = path.join(process.cwd(), 'uploads', 'logos', logoFilename);
    
    if (fs.existsSync(logoPath)) {
      console.log(`Logo file found: ${logoPath}`);
      return res.sendFile(logoPath);
    }
  }
  
  // Handle special case for KYC files
  if (req.path.includes('/kyc/')) {
    const kycFilename = path.basename(req.path);
    const kycPath = path.join(process.cwd(), 'uploads', 'kyc', kycFilename);
    
    console.log(`[KYC Image] Trying to access KYC file: ${kycPath} from URL: ${req.path}`);
    
    if (fs.existsSync(kycPath)) {
      console.log(`[KYC Image] File found at: ${kycPath}`);
      return res.sendFile(kycPath);
    }
    
    console.log(`[KYC Image] File NOT found at: ${kycPath}. Will try alternative paths.`);
    
    // Check possible alternative paths (maybe without 'file-' prefix)
    if (kycFilename.startsWith('file-')) {
      const altFileName = kycFilename.substring(5); // Remove 'file-' prefix
      const altPath = path.join(process.cwd(), 'uploads', 'kyc', altFileName);
      
      console.log(`[KYC Image] Checking alternative path without 'file-' prefix: ${altPath}`);
      if (fs.existsSync(altPath)) {
        console.log(`[KYC Image] File found at alternative path: ${altPath}`);
        return res.sendFile(altPath);
      }
    }
    
    // Check if we have any files in the KYC directory at all
    try {
      const kycDirPath = path.join(process.cwd(), 'uploads', 'kyc');
      if (fs.existsSync(kycDirPath)) {
        const files = fs.readdirSync(kycDirPath).filter(f => 
          f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png')
        );
        
        console.log(`[KYC Image] Files in uploads/kyc directory (${files.length}):`, files.slice(0, 5));
        
        // Search for files with similar UUID fragments (case insensitive)
        const lowerFileName = kycFilename.toLowerCase();
        const uuidFragment = kycFilename.match(/[0-9a-f]{8}-[0-9a-f]{4}/i);
        
        if (uuidFragment && uuidFragment[0]) {
          console.log(`[KYC Image] Searching for files with similar UUID fragment: ${uuidFragment[0]}`);
          const similarFiles = files.filter(f => f.toLowerCase().includes(uuidFragment[0].toLowerCase()));
          
          if (similarFiles.length > 0) {
            console.log(`[KYC Image] Found ${similarFiles.length} similar files:`, similarFiles);
            // Use the first similar file as a fallback
            const fallbackPath = path.join(process.cwd(), 'uploads', 'kyc', similarFiles[0]);
            console.log(`[KYC Image] Using similar file as fallback: ${fallbackPath}`);
            return res.sendFile(fallbackPath);
          }
        }
        
        // If no similar files but we have at least one image file, use the first one as a generic fallback
        if (files.length > 0) {
          const fallbackPath = path.join(process.cwd(), 'uploads', 'kyc', files[0]);
          console.log(`[KYC Image] Using generic fallback image: ${fallbackPath}`);
          return res.sendFile(fallbackPath);
        }
      } else {
        console.log('[KYC Image] uploads/kyc directory does not exist');
      }
    } catch (err) {
      console.error('[KYC Image] Error checking uploads/kyc directory:', err);
    }
    
    // If we get here, no suitable file was found
    console.log('[KYC Image] No suitable fallback found, returning 404');
  }
  
  // Parse the path for other file types
  const parts = req.path.split('/').filter(Boolean);
  
  if (parts.length === 0) {
    return next(); // Directory listing
  }
  
  // Main approach: Try standard path first
  const standardPath = path.join(process.cwd(), 'uploads', ...parts);
  if (fs.existsSync(standardPath)) {
    console.log(`File exists at standard path: ${standardPath}`);
    return res.sendFile(standardPath);
  }
  
  // Alternative approach 1: Try with just category and filename 
  // (for cases like /uploads/kyc/somefile.jpg)
  if (parts.length >= 2) {
    const category = parts[0];
    const filename = parts[parts.length - 1];
    const simplePath = path.join(process.cwd(), 'uploads', category, filename);
    
    if (fs.existsSync(simplePath)) {
      console.log(`File found at simplified path: ${simplePath}`);
      return res.sendFile(simplePath);
    }
  }
  
  // Alternative approach 2: Check if file exists directly in uploads directory
  if (parts.length >= 1) {
    const filename = parts[parts.length - 1];
    const directPath = path.join(process.cwd(), 'uploads', filename);
    
    if (fs.existsSync(directPath)) {
      console.log(`File found directly in uploads: ${directPath}`);
      return res.sendFile(directPath);
    }
  }
  
  console.log(`File not found for path: ${req.path}`);
  next();
}, express.static(path.join(process.cwd(), 'uploads'), {
  maxAge: '1d', // Cache for 1 day
  etag: true,
  lastModified: true,
  setHeaders: (res, filepath) => {
    // Set appropriate content type based on file extension
    const ext = path.extname(filepath).toLowerCase();
    console.log(`Setting headers for file: ${filepath} with extension: ${ext}`);
    
    switch (ext) {
      case '.jpg':
      case '.jpeg':
        res.setHeader('Content-Type', 'image/jpeg');
        break;
      case '.png':
        res.setHeader('Content-Type', 'image/png');
        break;
      case '.svg':
        res.setHeader('Content-Type', 'image/svg+xml');
        break;
      case '.gif':
        res.setHeader('Content-Type', 'image/gif');
        break;
      case '.pdf':
        res.setHeader('Content-Type', 'application/pdf');
        break;
      case '.doc':
        res.setHeader('Content-Type', 'application/msword');
        break;
      case '.docx':
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
        break;
    }
    
    // Disable caching for development
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
}));

// Special test endpoint to verify web server functionality
app.get('/test-web-endpoint', (req, res) => {
  console.log('TEST ENDPOINT ACCESSED', {
    headers: req.headers,
    url: req.url,
    method: req.method,
    ip: req.ip,
    path: req.path
  });
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>Test Web Server</title>
    </head>
    <body>
        <h1>Web Server Test</h1>
        <p>If you can see this, the web server is working properly.</p>
        <p>The issue might be with the Vite middleware or React setup.</p>
        <p>Server time: ${new Date().toISOString()}</p>
    </body>
    </html>
  `);
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error(`Error encountered: ${message}`, err);
    res.status(status).json({ message });
    // Don't throw the error after sending a response, as it can cause server crashes
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on a port that is not firewalled
  // this serves both the API and the client.
  // Use port 5000 as expected by the Replit workflow
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, async () => {
    log(`serving on port ${port}`);

    // Initialize the database with default data
    try {
      await storage.initialize();
      log("Database initialized successfully");
      
      // ZIP generation disabled to optimize space
      // Previously, this section would generate the project ZIP file for download
      
      // Import and initialize the automatic mining service
      try {
        const { initAutomaticMiningService } = await import("./services/automatic-mining-service");
        initAutomaticMiningService();
        log("Automatic mining service started");
      } catch (serviceError) {
        log(`Error starting automatic mining service: ${serviceError}`);
      }
    } catch (error) {
      log(`Error initializing database: ${error}`);
    }
  });
})();
// API configuration for different environments

// This is the configuration for production deployment on Netlify
// When deploying to Netlify, you will need to set up a separate backend server
// To use your own backend, replace this with your actual backend URL
const PRODUCTION_API_URL = 'https://tsk-platform-api.replit.app';

// This is used for local development - points to the local Express server
const DEVELOPMENT_API_URL = '';

// Determine which URL to use based on the current environment
// When running on Netlify, we need to use the full remote URL
// When running locally with Vite/Express, we can use relative URLs
export const API_BASE_URL = import.meta.env.PROD 
  ? PRODUCTION_API_URL 
  : DEVELOPMENT_API_URL;

// Helper function to build API URLs
export function buildApiUrl(path: string): string {
  // If already has http or https, it's an absolute URL
  if (path.startsWith('http')) {
    return path;
  }
  
  // Make sure path starts with / for consistency
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // For development (empty base URL), just return the path
  if (!API_BASE_URL) {
    return normalizedPath;
  }
  
  // For production, combine base URL with path
  return `${API_BASE_URL}${normalizedPath}`;
}
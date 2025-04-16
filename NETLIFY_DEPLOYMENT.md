# Deploying TSK Platform to Netlify

This document explains how to deploy the frontend of the TSK Platform to Netlify while utilizing a separate backend service.

## Architecture

The TSK Platform is a full-stack application with:
- **Frontend**: React + Vite application built with TypeScript
- **Backend**: Express.js server with PostgreSQL database

When deploying to Netlify, we only deploy the frontend portion, while the backend runs separately, typically on a service like:
- Replit
- Heroku
- DigitalOcean
- AWS
- Railway
- Render

## Prerequisites

1. A Netlify account
2. A running backend instance with a publicly accessible URL
3. Git repository with your TSK Platform code

## Configuration Files

The TSK Platform includes several configuration files for Netlify deployment:

1. **netlify.toml**: Main configuration file that sets up the build command, publish directory, and redirects for SPA routing
2. **netlify-build.sh**: Build script that handles the frontend build process
3. **client/public/_redirects**: Additional redirect rules for SPA routing
4. **client/src/lib/api-config.ts**: Configuration for API endpoints in different environments

## Deployment Steps

### 1. Update API Configuration

Edit the `client/src/lib/api-config.ts` file to point to your backend service:

```typescript
// Update this URL to point to your backend server
const PRODUCTION_API_URL = 'https://your-backend-server.com';
```

### 2. Connect to Netlify

You can deploy to Netlify in two ways:

#### Option A: Deploy from Git

1. Log in to Netlify
2. Click "New site from Git"
3. Select your Git provider (GitHub, GitLab, BitBucket)
4. Select your repository
5. In build settings:
   - Build command: `chmod +x netlify-build.sh && ./netlify-build.sh`
   - Publish directory: `dist`
6. Click "Deploy site"

#### Option B: Drag and Drop Deployment

1. Build the site locally with `npm run build`
2. Drag and drop the `dist` folder to Netlify's deployment section

### 3. Environment Variables

If you need to set environment variables for the frontend build, you can do this in the Netlify UI:

1. Go to Site settings > Build & deploy > Environment
2. Add variables prefixed with `VITE_` to make them available in the frontend code

### 4. Domain Configuration

1. In Netlify dashboard, go to "Domain settings"
2. You can use a Netlify subdomain (yoursite.netlify.app) or set up a custom domain

## CORS Configuration

For your backend to accept requests from your Netlify domain, you'll need to configure CORS:

1. In your backend server (Express), ensure CORS is properly configured:

```javascript
// In your server code
const cors = require('cors');

app.use(cors({
  origin: ['https://your-netlify-site.netlify.app', 'http://localhost:5000'],
  credentials: true
}));
```

## Testing

After deployment, you should test:

1. **Authentication**: Login and registration
2. **API connectivity**: Verify that frontend can communicate with backend
3. **PWA functionality**: Offline capabilities
4. **Routing**: All routes should work with page refreshes

## Troubleshooting

### Page Not Found (404) Errors

If you encounter 404 errors on page refreshes:
- Verify that `netlify.toml` contains the redirect rule
- Check that `_redirects` file is in the build output
- Ensure the Netlify build process is completing correctly

### API Connection Issues

If the frontend can't connect to your backend:
- Check the API URL in the console (should match your backend)
- Verify CORS is correctly configured on your backend
- Check for mixed content warnings (HTTP vs HTTPS)
- Test if backend health check endpoint is accessible

### Authentication Problems

If authentication doesn't persist:
- Make sure cookies are working across domains
- Check if your backend is setting the proper CORS headers for credentials
- Verify that secure and SameSite cookie options are set correctly

## Conclusion

This deployment strategy allows you to host the TSK Platform frontend on Netlify with a separate backend. This gives you the benefits of Netlify's CDN, easy deployments, and branch previews, while maintaining the flexibility of a dedicated backend service with database capabilities.
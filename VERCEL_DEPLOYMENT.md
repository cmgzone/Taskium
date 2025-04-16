# Deploying TSK Platform to Vercel

This document explains how to deploy the frontend of the TSK Platform to Vercel while utilizing a separate backend service.

## Issue Fixed

The screenshot showed that Vercel was displaying raw JavaScript code instead of rendering the application. This happens when Vercel can't find the correct entry point or when SPA routing isn't properly configured.

## Solution: Vercel Configuration

I've created a `vercel.json` configuration file that:

1. Specifies the build command to build only the frontend
2. Sets the correct output directory
3. Configures routing to handle SPA (Single Page Application) routes
4. Tells Vercel this is a Vite project

```json
{
  "buildCommand": "cd client && npm install && npm run build",
  "outputDirectory": "client/dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Deployment Steps

1. Push your code with the `vercel.json` file to GitHub
2. In the Vercel dashboard:
   - Create a new project
   - Import your GitHub repository
   - Under the "Build & Development Settings" section, make sure:
     - Framework Preset is set to "Vite"
     - Build Command is blank (it will use the one from vercel.json)
     - Output Directory is blank (it will use the one from vercel.json)
   - Deploy

## API Configuration

Make sure your frontend is configured to talk to your backend correctly:

1. The API configuration in `client/src/lib/api-config.ts` should have your Replit backend URL set as the `PRODUCTION_API_URL`
2. The backend should have CORS enabled to accept requests from your Vercel domain

## Environment Variables

If your frontend needs environment variables, you can set them in the Vercel dashboard:

1. Go to your project settings
2. Click on "Environment Variables"
3. Add variables prefixed with `VITE_` to make them available in the frontend code

## Backend Configuration

Your backend on Replit needs CORS configured to accept requests from your Vercel domain:

```typescript
app.use(cors({
  origin: [
    // Add your Vercel domain here
    'https://taskium-flame.vercel.app',
    /\.vercel\.app$/,  // Allow all Vercel subdomains
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Testing Vercel Deployment

After deploying to Vercel, make sure to test:

1. The app loads correctly without showing raw JavaScript
2. Navigation works without page reloads
3. Refreshing pages doesn't lead to 404 errors
4. The backend connection works properly

## Troubleshooting

If you still have issues after implementing this configuration:

1. Check Vercel build logs for any errors
2. Make sure your Vite configuration is correct
3. Verify that the entry point (`index.html`) is properly built and included
4. Test the app locally with `npm run build` and serve the `dist` directory to make sure the build works
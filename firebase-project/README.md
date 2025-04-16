# TSK Platform - Firebase Deployment

This directory contains the Firebase-ready version of the TSK Platform. Follow these instructions to deploy the platform to Firebase.

## Prerequisites

1. Install the Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/)

3. Set up a PostgreSQL database (recommended: [Neon Database](https://neon.tech/) for serverless PostgreSQL)

## Setup Instructions

### 1. Clone and Configure

1. Clone this repository to your local machine
2. Log in to Firebase:
   ```bash
   firebase login
   ```
3. Connect to your Firebase project:
   ```bash
   firebase use --add
   ```
   Select your Firebase project when prompted

### 2. Configure Environment Variables

Set up the required environment variables for Firebase Functions:

```bash
# Set database connection string
firebase functions:config:set database.url="postgresql://username:password@your-neon-db-host/dbname"

# Set session secret
firebase functions:config:set session.secret="your-session-secret"

# Set JWT secret for authentication
firebase functions:config:set auth.jwt_secret="your-jwt-secret"

# Set storage bucket name
firebase functions:config:set storage.bucket="your-project-id.appspot.com"
```

### 3. Install Dependencies

```bash
# Install dependencies for Functions
cd functions
npm install

# Return to the root directory
cd ..
```

### 4. Initialize Database

Before deployment, you'll need to initialize your database with the required schema:

1. Set up the `DATABASE_URL` environment variable locally:
   ```bash
   export DATABASE_URL="postgresql://username:password@your-neon-db-host/dbname"
   ```

2. Run the database initialization script:
   ```bash
   cd functions
   npm run db:init
   ```

### 5. Deploy to Firebase

```bash
# Deploy everything
firebase deploy

# Or deploy specific features:
firebase deploy --only functions
firebase deploy --only hosting
firebase deploy --only storage
```

## Project Structure

- `/functions`: Backend API and server code
  - `/src`: Source code
    - `/routes`: API route handlers
    - `/services`: Business logic services
    - `/shared`: Shared code and schemas

- `/public`: Frontend static files
  - `/src`: Frontend source code

## Post-Deployment

After deployment:

1. Set up a custom domain in Firebase Hosting settings
2. Configure Firebase Authentication providers (Email/Password, Google, etc.)
3. Set up Firebase Storage security rules
4. Configure Firebase Firestore security rules

## Maintenance

- **Logs**: View logs for debugging
  ```bash
  firebase functions:log
  ```

- **Update**: After making changes, redeploy
  ```bash
  firebase deploy
  ```

- **Monitoring**: Monitor performance in the Firebase console

## Useful Commands

- **Emulate locally**:
  ```bash
  firebase emulators:start
  ```

- **Deploy only updated functions**:
  ```bash
  firebase deploy --only functions:api
  ```

- **Get current config**:
  ```bash
  firebase functions:config:get
  ```

## Support

For issues or questions, please contact the TSK Platform support team.
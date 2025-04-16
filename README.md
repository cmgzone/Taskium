# TSK Platform

A decentralized advertising platform with advanced blockchain integration, wallet management, and comprehensive admin tools.

## Documentation

This repository contains several documentation files to help you with deployment and usage:

- [Download Instructions](docs/download-instructions.md) - How to download the TSK Platform project
- [Deployment Guides](docs/deployment-guides.md) - Platform-specific deployment instructions
- [Installation Checklist](docs/installation-checklist.md) - Complete checklist for a successful deployment

## Prerequisites

- Node.js (v20.x recommended)
- PostgreSQL database
- Git (optional)

## Deployment Steps

### 1. Download the Project

There are two ways to get the project files:

- **Option 1**: Download the ZIP file directly from the [TSK Platform website](https://tskplatform.replit.app/admin/system) in the Admin > System section.
- **Option 2**: Use the following direct download link: `https://tskplatform.replit.app/downloads/tsk-project-download.zip`

### 2. Extract and Setup

```bash
# Extract the ZIP file
unzip tsk-project-download.zip -d tsk-platform

# Navigate to the project directory
cd tsk-platform

# Install dependencies
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Database configuration
DATABASE_URL=postgresql://username:password@localhost:5432/tsk_platform_db

# Session configuration (generate a secure random string)
SESSION_SECRET=your_secure_session_secret

# Web3 configuration (if using blockchain features)
# Optional - only needed for blockchain functionality
WALLET_PRIVATE_KEY=your_wallet_private_key
```

### 4. Initialize the Database

```bash
# Create the database (if it doesn't exist)
# Using psql command line:
createdb tsk_platform_db

# Push the schema to the database
npm run db:push
```

### 5. Start the Application

For development:
```bash
npm run dev
```

For production (manual method):
```bash
npm run build
npm start
```

For production (automated deployment):
```bash
# Make the deployment script executable
chmod +x scripts/deploy.sh

# Run the deployment script
./scripts/deploy.sh
```

The automated deployment script will install dependencies, build the application, apply database migrations, and set up PM2 for production process management.

### 6. Access the Application

Once the application is running, you can access it at:
- Development: http://localhost:5000
- Production: Configure your web server (Nginx/Apache) to proxy to the application port

## Additional Configuration

### SSL/TLS Setup

For production deployments, configure SSL/TLS using your preferred web server:

#### Example Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Database Backup and Restore

To backup your database:
```bash
pg_dump -U username -d tsk_platform_db > backup.sql
```

To restore from a backup:
```bash
psql -U username -d tsk_platform_db < backup.sql
```

## Troubleshooting

If you encounter any issues during deployment:

1. Check the application logs for errors
2. Verify database connection settings
3. Ensure all environment variables are correctly set
4. Check if required ports are accessible

## Support

For additional support, please refer to the documentation or contact our support team.
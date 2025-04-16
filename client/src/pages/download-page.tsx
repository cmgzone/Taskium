import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { SiGithub, SiDiscord } from 'react-icons/si';
import { FiDownload, FiServer, FiUsers, FiCode, FiDatabase, FiSettings } from 'react-icons/fi';

const DownloadPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const downloadUrl = "/api/download-project";
  
  const handleDownload = () => {
    setLoading(true);
    setProgress(0);
    
    // Start progress animation
    const interval = setInterval(() => {
      setProgress((prevProgress) => {
        // Slowly increase to 95%, then when download completes it will jump to 100%
        if (prevProgress >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prevProgress + 1;
      });
    }, 200);
    
    // Create a hidden anchor and click it to trigger download
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = 'tsk-platform.zip';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      clearInterval(interval);
      setProgress(100);
      setLoading(false);
      setDownloadSuccess(true);
    }, 3000);
  };
  
  return (
    <div className="container mx-auto py-10 px-4 sm:px-6 max-w-6xl">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold tracking-tight">Download TSK Platform</h1>
        <p className="text-xl text-muted-foreground mt-2">
          Get the complete source code and deploy your own decentralized platform
        </p>
      </div>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-2xl">Platform Download</CardTitle>
          <CardDescription>
            Download the complete TSK Platform source code with all components
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center text-center">
            <div className="mb-4 text-8xl text-primary">
              <FiDownload />
            </div>
            <h3 className="text-2xl font-semibold mb-2">
              TSK Platform v1.0.0
            </h3>
            <p className="text-muted-foreground mb-4">
              Complete platform package (~74MB)
            </p>
            {loading && (
              <div className="w-full max-w-md mb-4">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground mt-1">
                  Preparing download... {progress}%
                </p>
              </div>
            )}
            {downloadSuccess && !loading && (
              <div className="text-green-500 mb-4">
                Download completed successfully!
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-center">
          <Button 
            size="lg" 
            onClick={handleDownload}
            disabled={loading}
            className="gap-2"
          >
            <FiDownload className="h-5 w-5" /> 
            {loading ? "Preparing Download..." : "Download Full Platform"}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <Card>
          <CardHeader>
            <CardTitle>What's Included</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <FiServer className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Backend Server</h3>
                <p className="text-sm text-muted-foreground">
                  Express.js server with RESTful API endpoints and database integration
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiUsers className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">User Interface</h3>
                <p className="text-sm text-muted-foreground">
                  Complete React frontend with responsive designs and user dashboard
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiCode className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Smart Contracts</h3>
                <p className="text-sm text-muted-foreground">
                  Solidity contracts for the TSK token and blockchain integration
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiDatabase className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Database Schema</h3>
                <p className="text-sm text-muted-foreground">
                  Complete database models and migration scripts
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FiSettings className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-medium">Admin Panel</h3>
                <p className="text-sm text-muted-foreground">
                  Full-featured admin dashboard with user management and settings
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Deployment Guide</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>
              Follow these steps to deploy your own TSK Platform:
            </p>
            <ol className="space-y-3 list-decimal pl-5">
              <li>
                <span className="font-medium">Extract the downloaded ZIP file</span>
                <p className="text-sm text-muted-foreground">
                  Unpack the contents to your preferred location
                </p>
              </li>
              <li>
                <span className="font-medium">Setup environment variables</span>
                <p className="text-sm text-muted-foreground">
                  Copy .env.example to .env and configure your settings
                </p>
              </li>
              <li>
                <span className="font-medium">Install dependencies</span>
                <p className="text-sm text-muted-foreground">
                  Run npm install to install all required packages
                </p>
              </li>
              <li>
                <span className="font-medium">Setup database</span>
                <p className="text-sm text-muted-foreground">
                  Run npm run db:push to create the database schema
                </p>
              </li>
              <li>
                <span className="font-medium">Generate admin user</span>
                <p className="text-sm text-muted-foreground">
                  Run node scripts/create-admin.js to create an admin account
                </p>
              </li>
              <li>
                <span className="font-medium">Start the platform</span>
                <p className="text-sm text-muted-foreground">
                  Run npm run dev (development) or npm run build && npm start (production)
                </p>
              </li>
            </ol>
            <p className="text-sm text-muted-foreground mt-4">
              For detailed instructions, refer to the README.md and documentation files included in the download.
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Separator className="my-8" />
      
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold mb-4">Need Help?</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          If you encounter any issues during installation or have questions about customizing the platform,
          reach out through our community channels:
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Button variant="outline" className="gap-2">
            <SiGithub className="h-5 w-5" /> GitHub Issues
          </Button>
          <Button variant="outline" className="gap-2">
            <SiDiscord className="h-5 w-5" /> Discord Community
          </Button>
        </div>
      </div>
      
      <div className="text-center text-sm text-muted-foreground">
        <p>
          TSK Platform &copy; {new Date().getFullYear()} - All rights reserved
        </p>
        <p className="mt-1">
          Released under MIT License - You are free to use, modify, and distribute this software
        </p>
      </div>
    </div>
  );
};

export default DownloadPage;
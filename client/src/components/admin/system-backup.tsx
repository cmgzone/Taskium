import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, Upload, RefreshCw, AlertTriangle, CheckCircle2, HardDrive, Database, Lock } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function SystemBackup() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Function to create a full system backup
  const handleSystemBackup = async () => {
    try {
      setLoading("system");
      setProgress(0);
      setError(null);
      setSuccess(null);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 500);

      // Call the API to create a backup
      const response = await apiRequest("GET", "/api/admin/backup/system");
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create system backup");
      }
      
      const data = await response.json();
      setProgress(100);
      setLastBackup(new Date().toISOString());
      setSuccess("System backup created successfully!");
      
      // Create a download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsk-platform-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Created",
        description: "System backup has been created and downloaded successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error("Backup error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      toast({
        title: "Backup Failed",
        description: err instanceof Error ? err.message : "Failed to create backup",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 3000);
    }
  };

  // Function to backup only database
  const handleDatabaseBackup = async () => {
    try {
      setLoading("database");
      setProgress(0);
      setError(null);
      setSuccess(null);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 400);

      // Call the API to create a database backup
      const response = await apiRequest("GET", "/api/admin/backup/database");
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create database backup");
      }
      
      const data = await response.json();
      setProgress(100);
      setLastBackup(new Date().toISOString());
      setSuccess("Database backup created successfully!");
      
      // Create a download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsk-database-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Database Backup Created",
        description: "Database backup has been created and downloaded successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error("Database backup error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      toast({
        title: "Database Backup Failed",
        description: err instanceof Error ? err.message : "Failed to create database backup",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 3000);
    }
  };

  // Function to backup only configuration
  const handleConfigBackup = async () => {
    try {
      setLoading("config");
      setProgress(0);
      setError(null);
      setSuccess(null);
      
      // Start progress animation
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 300);

      // Call the API to create a config backup
      const response = await apiRequest("GET", "/api/admin/backup/config");
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create configuration backup");
      }
      
      const data = await response.json();
      setProgress(100);
      setLastBackup(new Date().toISOString());
      setSuccess("Configuration backup created successfully!");
      
      // Create a download link
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tsk-config-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Configuration Backup Created",
        description: "Configuration backup has been created and downloaded successfully.",
        variant: "default",
      });
    } catch (err) {
      console.error("Config backup error:", err);
      setError(err instanceof Error ? err.message : "Unknown error occurred");
      toast({
        title: "Configuration Backup Failed",
        description: err instanceof Error ? err.message : "Failed to create configuration backup",
        variant: "destructive",
      });
    } finally {
      setLoading(null);
      // Reset progress after a delay
      setTimeout(() => setProgress(0), 3000);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Backup</h2>
          <p className="text-muted-foreground">
            Create backups of the platform's data and configurations
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="default" className="mb-6 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400 border-green-200 dark:border-green-900/30">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="full">
        <TabsList className="mb-4">
          <TabsTrigger value="full">Full System</TabsTrigger>
          <TabsTrigger value="database">Database Only</TabsTrigger>
          <TabsTrigger value="config">Configuration Only</TabsTrigger>
        </TabsList>
        
        <TabsContent value="full">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <HardDrive className="h-5 w-5" />
                Full System Backup
              </CardTitle>
              <CardDescription>
                Creates a complete backup of the entire platform, including database, configurations, and user-uploaded content.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">
                      {lastBackup ? (
                        <span>Last backup: {new Date(lastBackup).toLocaleString()}</span>
                      ) : (
                        <span>No recent backups</span>
                      )}
                    </span>
                  </div>
                  
                  {loading === "system" && (
                    <div className="mb-4">
                      <Progress value={progress} className="h-2 mb-1" />
                      <p className="text-xs text-muted-foreground text-right">{progress}% complete</p>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleSystemBackup} 
                    disabled={loading !== null}
                    className="flex items-center gap-2"
                  >
                    {loading === "system" ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Creating Backup...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Create & Download Full Backup
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="database">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Backup
              </CardTitle>
              <CardDescription>
                Creates a backup of only the database, including user data, transactions, and platform settings.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading === "database" && (
                  <div className="mb-4">
                    <Progress value={progress} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground text-right">{progress}% complete</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleDatabaseBackup} 
                  disabled={loading !== null}
                  className="flex items-center gap-2"
                >
                  {loading === "database" ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating Database Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Create & Download Database Backup
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="config">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Configuration Backup
              </CardTitle>
              <CardDescription>
                Creates a backup of only the system configurations, including platform settings, mining rates, and feature flags.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {loading === "config" && (
                  <div className="mb-4">
                    <Progress value={progress} className="h-2 mb-1" />
                    <p className="text-xs text-muted-foreground text-right">{progress}% complete</p>
                  </div>
                )}
                
                <Button 
                  onClick={handleConfigBackup} 
                  disabled={loading !== null}
                  className="flex items-center gap-2"
                >
                  {loading === "config" ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      Creating Configuration Backup...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Create & Download Configuration Backup
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Download Full Project</h3>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Download Project ZIP
            </CardTitle>
            <CardDescription>
              Download a complete ZIP archive of the entire project codebase including client, server, and contracts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <p className="text-sm text-muted-foreground mb-4">
                Download a pre-generated ZIP file containing all source code files in the project. This ZIP file includes client code, server code, contracts, and configuration files - useful for backup, development, or deployment.
              </p>
              
              <div className="mb-4 text-xs text-muted-foreground bg-slate-50 dark:bg-slate-900 p-3 rounded-md">
                <h4 className="font-medium mb-2">ZIP File Contents:</h4>
                <ul className="list-disc pl-5 space-y-1">
                  <li><span className="font-mono">client/</span> - Frontend React application</li>
                  <li><span className="font-mono">server/</span> - Backend Express server</li>
                  <li><span className="font-mono">contracts/</span> - Solidity smart contracts</li>
                  <li><span className="font-mono">shared/</span> - Shared types and utilities</li>
                  <li><span className="font-mono">scripts/</span> - Deployment and utility scripts</li>
                  <li><span className="font-mono">public/</span> - Static assets</li>
                  <li><span className="font-mono">*.json, *.js, *.ts</span> - Configuration files</li>
                </ul>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <Button 
                  className="flex items-center gap-2 w-full md:w-auto"
                  onClick={() => {
                    const downloadUrl = "/downloads/tsk-project-download.zip";
                    window.location.href = downloadUrl;
                    
                    toast({
                      title: "Download Started",
                      description: "Your project ZIP download has been initiated.",
                      variant: "default",
                    });
                  }}
                >
                  <Download className="h-4 w-4" />
                  Download Complete Project
                </Button>
                
                <Button 
                  variant="outline"
                  className="flex items-center gap-2 w-full md:w-auto"
                  onClick={async () => {
                    try {
                      toast({
                        title: "Regenerating Project ZIP",
                        description: "Please wait while the ZIP file is being regenerated...",
                        variant: "default",
                      });
                      
                      const response = await apiRequest<{success: boolean; message: string; output?: string}>('/api/admin/backup/regenerate-project-zip', {
                        method: 'POST'
                      });
                      
                      if (response && response.success) {
                        toast({
                          title: "Project ZIP Regenerated",
                          description: "The project ZIP file has been successfully regenerated.",
                          variant: "default",
                        });
                      } else {
                        toast({
                          title: "Error",
                          description: response?.message || "Failed to regenerate project ZIP file.",
                          variant: "destructive",
                        });
                      }
                    } catch (err: unknown) {
                      const error = err as Error;
                      console.error("Error regenerating project ZIP:", error);
                      toast({
                        title: "Error",
                        description: "Failed to regenerate project ZIP file: " + (error.message || "Unknown error"),
                        variant: "destructive",
                      });
                    }
                  }}
                >
                  <RefreshCw className="h-4 w-4" />
                  Regenerate ZIP File
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <h3 className="text-lg font-semibold mb-4 mt-8">Restore From Backup</h3>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Restore System
            </CardTitle>
            <CardDescription>
              Restore the system from a previously created backup file.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-900/20 dark:text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Warning</AlertTitle>
              <AlertDescription>
                Restoring from a backup will overwrite existing data. This action cannot be undone.
                Make sure to create a backup of your current system before proceeding.
              </AlertDescription>
            </Alert>
            
            <Button variant="outline" className="flex items-center gap-2" disabled>
              <Upload className="h-4 w-4" />
              Restore from Backup
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Coming soon. Currently only backup functionality is available.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
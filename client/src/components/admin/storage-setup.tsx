import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function StorageSetup() {
  const { toast } = useToast();
  const [projectId, setProjectId] = useState("");
  const [credentials, setCredentials] = useState("");
  const [bucketName, setBucketName] = useState("tsk-platform-storage");
  const [storageStatus, setStorageStatus] = useState<"local" | "cloud" | "checking">("checking");
  const [loading, setLoading] = useState(false);

  // Check current storage status
  useState(() => {
    checkStorageStatus();
  });

  async function checkStorageStatus() {
    setStorageStatus("checking");
    try {
      const response = await apiRequest("GET", "/api/admin/storage/status");
      const data = await response.json();
      setStorageStatus(data.type);
    } catch (error) {
      console.error("Error checking storage status:", error);
      setStorageStatus("local");
    }
  }

  async function handleSaveConfig() {
    if (!projectId || !credentials || !bucketName) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Validate JSON format
      try {
        JSON.parse(credentials);
      } catch (e) {
        toast({
          title: "Invalid credentials format",
          description: "Please provide valid JSON credentials",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const response = await apiRequest("POST", "/api/admin/storage/config", {
        projectId,
        credentials,
        bucketName,
      });

      if (response.ok) {
        toast({
          title: "Storage configuration saved",
          description: "Cloud storage setup successful!",
        });
        
        // Update status
        await checkStorageStatus();
      } else {
        const error = await response.json();
        toast({
          title: "Error saving configuration",
          description: error.message || "An error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving storage config:", error);
      toast({
        title: "Error",
        description: "Failed to save storage configuration",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Storage Configuration
          {storageStatus === "checking" ? (
            <Badge className="ml-2 bg-yellow-500">Checking...</Badge>
          ) : storageStatus === "cloud" ? (
            <Badge className="ml-2 bg-green-500">Cloud Storage Active</Badge>
          ) : (
            <Badge className="ml-2 bg-blue-500">Local Storage</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Configure Google Cloud Storage for handling file uploads at scale
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="projectId">Google Cloud Project ID</Label>
          <Input 
            id="projectId" 
            value={projectId} 
            onChange={(e) => setProjectId(e.target.value)}
            placeholder="my-project-123456"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="credentials">Service Account Credentials (JSON)</Label>
          <Textarea 
            id="credentials" 
            value={credentials} 
            onChange={(e) => setCredentials(e.target.value)}
            placeholder='{"type":"service_account","project_id":"...","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}'
            className="min-h-[200px] font-mono text-sm"
          />
          <p className="text-sm text-muted-foreground">
            Paste your service account key JSON here. This is used to authenticate with Google Cloud Storage.
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bucketName">Bucket Name</Label>
          <Input 
            id="bucketName" 
            value={bucketName} 
            onChange={(e) => setBucketName(e.target.value)}
            placeholder="tsk-platform-storage"
          />
          <p className="text-sm text-muted-foreground">
            This bucket must exist in your Google Cloud project and be configured for public access.
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={checkStorageStatus} disabled={loading}>
          Check Status
        </Button>
        <Button onClick={handleSaveConfig} disabled={loading}>
          {loading ? "Saving..." : "Save Configuration"}
        </Button>
      </CardFooter>
    </Card>
  );
}
import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Key, Loader2, Shield, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function BscscanApiConfig() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [apiKey, setApiKey] = useState("");
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  
  // Query for checking if BSCScan API key is configured
  const { 
    data: bscscanStatus,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['/api/admin/bscscan-status'],
    queryFn: async () => {
      const response = await fetch('/api/admin/bscscan-status');
      if (!response.ok) {
        throw new Error('Failed to fetch BSCScan API status');
      }
      return await response.json();
    }
  });
  
  // Mutation for saving the BSCScan API key
  const { mutate: saveBscscanApiKey, isPending: isSaving } = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/system-secrets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          keyName: "BSCSCAN_API_KEY",
          value: apiKey,
          category: "blockchain",
          isEncrypted: true,
          description: "API key for BSCScan blockchain explorer"
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save BSCScan API key');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "BSCScan API Key Saved",
        description: "The API key was saved successfully. You can now fetch real blockchain transaction data.",
      });
      setApiKey("");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
      
      // Invalidate the query to re-fetch the updated status
      queryClient.invalidateQueries({queryKey: ['/api/admin/bscscan-status']});
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Save API Key",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Status indicator component
  const StatusIndicator = ({ isOk, text }: { isOk: boolean, text: string }) => (
    <div className={`flex items-center ${isOk ? 'text-green-500' : 'text-red-500'}`}>
      {isOk ? <Check className="w-4 h-4 mr-2" /> : <X className="w-4 h-4 mr-2" />}
      <span>{text}</span>
    </div>
  );
  
  // Handle submission of the API key
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) {
      toast({
        title: "API Key Required",
        description: "Please enter a valid BSCScan API key",
        variant: "destructive",
      });
      return;
    }
    
    saveBscscanApiKey();
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Key className="w-5 h-5 mr-2 text-blue-500" />
          BSCScan API Configuration
        </CardTitle>
        <CardDescription>
          Configure BSCScan API key to fetch real blockchain transaction data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Status Section */}
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
            <h3 className="font-medium mb-3 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-primary" />
              BSCScan API Status
            </h3>
            
            {isLoading ? (
              <div className="flex items-center">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking status...
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">BSCScan API Key</span>
                  <StatusIndicator 
                    isOk={!!bscscanStatus?.apiKeyConfigured} 
                    text={bscscanStatus?.apiKeyConfigured ? "Configured" : "Not Configured"} 
                  />
                </div>
                
                <div className="flex justify-between py-1 border-b">
                  <span className="text-muted-foreground">Real Transaction Data</span>
                  <StatusIndicator 
                    isOk={!!bscscanStatus?.apiKeyConfigured} 
                    text={bscscanStatus?.apiKeyConfigured ? "Available" : "Using Mock Data"} 
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Success Message */}
          {showSuccessMessage && (
            <Alert className="bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400">
              <Check className="h-4 w-4 mr-2" />
              <AlertDescription>
                BSCScan API key has been saved successfully. The system will now use real blockchain data.
              </AlertDescription>
            </Alert>
          )}
          
          {/* API Key Input Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="bscscan-api-key">BSCScan API Key</Label>
              <Input
                id="bscscan-api-key"
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your BSCScan API key"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can obtain an API key by registering on{" "}
                <a 
                  href="https://bscscan.com/myapikey" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-blue-500 hover:underline"
                >
                  BSCScan.com
                </a>
              </p>
            </div>
            
            <Button type="submit" disabled={isSaving || !apiKey.trim()}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save API Key"
              )}
            </Button>
          </form>
          
          {/* Information about the API Key */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md text-sm text-blue-700 dark:text-blue-300">
            <h4 className="font-medium mb-2">Why configure a BSCScan API key?</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>View real transaction history directly from the blockchain</li>
              <li>Track token transfers and contract interactions</li>
              <li>Verify user transactions and balance changes</li>
              <li>Without an API key, the system will use mock transaction data</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
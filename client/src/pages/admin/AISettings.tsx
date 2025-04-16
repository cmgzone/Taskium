import React, { useState, useEffect } from 'react';
import { OpenAIKeyManager } from '@/components/admin/OpenAIKeyManager';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Shield, Brain, Settings, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQuery } from '@tanstack/react-query';

// Define user interface with role property
interface User {
  id: number;
  username: string;
  role: string;
  email?: string | null;
  fullName?: string | null;
}

export function AISettings() {
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Check if user is admin
  const { data: userData, isLoading: userLoading } = useQuery<User>({
    queryKey: ['/api/user'],
    refetchOnWindowFocus: false,
  });
  
  // Get system secrets for the OpenAI API key
  const { data: systemSecrets, isLoading: secretsLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/system-secrets'],
    refetchOnWindowFocus: false,
    enabled: isAdmin, // Only fetch if user is admin
  });

  // Set admin status when user data is loaded
  useEffect(() => {
    if (userData) {
      setIsAdmin(userData.role === 'admin');
    }
  }, [userData]);

  // If not admin, show access denied
  if (!userLoading && !isAdmin) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You don't have permission to access the AI settings panel. Please contact an administrator if you need assistance.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure and manage the platform's AI capabilities
          </p>
        </div>
        {isAdmin && (
          <div className="flex items-center text-sm text-muted-foreground">
            <Shield className="h-4 w-4 mr-1" />
            Administrator Access
          </div>
        )}
      </div>
      
      <Separator className="my-6" />
      
      <Tabs defaultValue="openai" className="space-y-6">
        <TabsList>
          <TabsTrigger value="openai">OpenAI Integration</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="analytics">AI Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="openai" className="space-y-6">
          {secretsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-[300px] w-full" />
            </div>
          ) : (
            <OpenAIKeyManager 
              systemSecrets={systemSecrets} 
              isAdmin={isAdmin} 
            />
          )}
          
          <Card>
            <CardHeader>
              <CardTitle className="text-xl flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Advanced OpenAI Configuration
              </CardTitle>
              <CardDescription>
                Fine-tune the OpenAI integration parameters
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                These settings control how the platform interacts with OpenAI's services.
                The default values are optimized for most use cases.
              </p>
              
              {/* Placeholder for future advanced settings */}
              <div className="text-sm text-muted-foreground border rounded-md p-4 bg-muted/30">
                <div className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-primary" />
                  <span>Advanced configuration options coming soon</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="knowledge" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Knowledge Base Management</CardTitle>
              <CardDescription>
                Manage the AI knowledge base and reasoning patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Knowledge base management features will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">AI Usage Analytics</CardTitle>
              <CardDescription>
                Monitor AI performance and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                AI analytics features will be available soon.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
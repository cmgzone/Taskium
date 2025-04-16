import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Key, ChevronRight, CheckCircle, AlertTriangle, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useQuery } from '@tanstack/react-query';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface OpenAIKeyManagerProps {
  systemSecrets?: any[];
  isAdmin: boolean;
}

interface APIKeyFormValues {
  apiKey: string;
}

export function OpenAIKeyManager({ systemSecrets = [], isAdmin }: OpenAIKeyManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [keyStatus, setKeyStatus] = useState<'unknown' | 'valid' | 'invalid'>('unknown');
  const [currentKey, setCurrentKey] = useState<string | null>(null);

  // Query to check if OpenAI API key is needed for enhanced functionality
  const { data: keyNeededData, isLoading: keyNeededLoading, isError: keyNeededError } = useQuery({
    queryKey: ['/api/admin/openai-key-needed'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/openai-key-needed', 'GET');
      return response;
    },
    enabled: isAdmin, // Only run this query if user is an admin
    refetchOnWindowFocus: false,
    refetchInterval: 60000 * 5, // Refetch every 5 minutes
  });

  const form = useForm<APIKeyFormValues>({
    defaultValues: {
      apiKey: '',
    },
  });

  // Find the OpenAI key in the system secrets
  useEffect(() => {
    const openAISecret = systemSecrets.find(secret => secret.key === 'OPENAI_API_KEY');
    if (openAISecret) {
      setCurrentKey(openAISecret.value);
      
      // Only set masked key display value, not the actual key
      const maskedKey = `${openAISecret.value.substring(0, 3)}...${openAISecret.value.substring(openAISecret.value.length - 4)}`;
      form.setValue('apiKey', maskedKey);
      
      // Update status if we have a key
      setKeyStatus(openAISecret.isActive ? 'valid' : 'invalid');
    }
  }, [systemSecrets, form]);

  const onSubmit = async (data: APIKeyFormValues) => {
    if (!isAdmin) {
      toast({
        title: "Permission denied",
        description: "Only administrators can update API keys",
        variant: "destructive"
      });
      return;
    }

    try {
      setLoading(true);
      
      // If the value wasn't changed from the masked display, don't update
      if (data.apiKey.includes('...')) {
        toast({
          title: "No changes detected",
          description: "The API key was not modified",
          variant: "default"
        });
        setLoading(false);
        return;
      }

      // Check if we're adding a new key or updating an existing one
      const existingKey = systemSecrets.find(secret => secret.key === 'OPENAI_API_KEY');
      
      const endpoint = existingKey 
        ? `/api/admin/system-secrets/${existingKey.id}` 
        : '/api/admin/system-secrets';
      
      const payload = existingKey
        ? { value: data.apiKey, isActive: true }
        : { 
            key: 'OPENAI_API_KEY', 
            value: data.apiKey, 
            category: 'ai',
            description: 'OpenAI API Key for enhanced AI capabilities',
            isActive: true
          };
      
      const method = existingKey ? 'PATCH' : 'POST';

      const response = await apiRequest(endpoint, method, payload);
      
      if (response) {
        // Verify the key with OpenAI
        const verifyResponse = await apiRequest('/api/admin/verify-openai-key', 'POST', { apiKey: data.apiKey });
        
        if (verifyResponse && verifyResponse.valid) {
          setKeyStatus('valid');
          toast({
            title: "API Key Updated",
            description: "The OpenAI API key has been successfully saved and verified",
            variant: "default"
          });
        } else {
          setKeyStatus('invalid');
          toast({
            title: "API Key Issue",
            description: "The key was saved but could not be verified with OpenAI",
            variant: "destructive"
          });
        }
        
        // Update the UI with masked key
        const maskedKey = `${data.apiKey.substring(0, 3)}...${data.apiKey.substring(data.apiKey.length - 4)}`;
        form.setValue('apiKey', maskedKey);
        setCurrentKey(data.apiKey);
        
        // Invalidate cache to refresh system secrets
        queryClient.invalidateQueries({ queryKey: ['/api/admin/system-secrets'] });
      }
    } catch (error) {
      console.error("Error updating API key:", error);
      toast({
        title: "Update failed",
        description: "There was an error updating the API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearKey = async () => {
    if (!isAdmin) return;
    
    try {
      setLoading(true);
      const existingKey = systemSecrets.find(secret => secret.key === 'OPENAI_API_KEY');
      
      if (existingKey) {
        // We don't delete the key, just set it as inactive
        await apiRequest(`/api/admin/system-secrets/${existingKey.id}`, 'PATCH', { 
          isActive: false,
          value: '' // Clear the value for security
        });
        
        toast({
          title: "API Key Removed",
          description: "The OpenAI API key has been removed",
          variant: "default"
        });
        
        form.setValue('apiKey', '');
        setCurrentKey(null);
        setKeyStatus('unknown');
        
        // Invalidate cache to refresh system secrets
        queryClient.invalidateQueries({ queryKey: ['/api/admin/system-secrets'] });
      }
    } catch (error) {
      console.error("Error clearing API key:", error);
      toast({
        title: "Operation failed",
        description: "There was an error removing the API key",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (keyStatus) {
      case 'valid':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 flex items-center gap-1">
            <CheckCircle className="h-3.5 w-3.5" />
            Verified
          </Badge>
        );
      case 'invalid':
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5" />
            Invalid
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-slate-100 text-slate-700 border-slate-200 flex items-center gap-1">
            <Key className="h-3.5 w-3.5" />
            Not configured
          </Badge>
        );
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            OpenAI Integration
          </CardTitle>
          <CardDescription>
            AI enhancement with OpenAI integration. Only administrators can manage API keys.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            {keyStatus !== 'unknown' ? 
              'The platform is configured with an OpenAI API key for enhanced AI capabilities.' : 
              'No OpenAI API key is currently configured. Contact an administrator to enable enhanced AI capabilities.'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-xl flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            OpenAI Integration
          </CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>
          Enhance the platform's AI capabilities by connecting to OpenAI's advanced models
        </CardDescription>
      </CardHeader>
      <CardContent>
        {keyNeededData?.isKeyNeeded && (
          <Alert className="mb-4 bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4 text-amber-700" />
            <AlertTitle className="text-amber-700 flex items-center gap-2">
              OpenAI API Key Required
            </AlertTitle>
            <AlertDescription className="text-amber-700">
              {keyNeededData.message || 'An OpenAI API key is required for enhanced AI and KYC verification capabilities.'}
            </AlertDescription>
          </Alert>
        )}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="apiKey"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>OpenAI API Key</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Enter your OpenAI API key" 
                      {...field} 
                      type="text"
                      className="font-mono"
                    />
                  </FormControl>
                  <FormDescription>
                    Your API key is stored securely and never shared with third parties.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex items-center gap-2">
              <Button 
                type="submit" 
                disabled={loading}
                variant="default"
                className={keyNeededData?.isKeyNeeded && keyStatus === 'unknown' ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}
              >
                {loading ? 'Saving...' : 'Save API Key'}
              </Button>
              {currentKey && (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClearKey}
                  disabled={loading}
                >
                  Remove Key
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
      <CardFooter className="flex flex-col items-start">
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            The OpenAI integration provides:
          </p>
          <ul className="space-y-1 list-disc list-inside ml-2">
            <li>Enhanced natural language understanding</li>
            <li>Improved responses for complex questions</li>
            <li>Automatic knowledge base expansion</li>
            <li>Better handling of ambiguous queries</li>
            <li>Advanced KYC document verification and face matching</li>
            <li>Document information extraction and validation</li>
          </ul>
          <p className="mt-2 font-medium">
            If no API key is provided, the system will use its internal knowledge base and provide basic KYC functionality without computer vision capabilities.
          </p>
        </div>
      </CardFooter>
    </Card>
  );
}
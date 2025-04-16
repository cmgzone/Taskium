import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Check, AlertCircle } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Form schema for PayPal settings
const PayPalSettingsSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  sandboxMode: z.boolean().default(true),
  enabled: z.boolean().default(false)
});

type PayPalSettingsType = z.infer<typeof PayPalSettingsSchema>;

// Interface for PayPal settings from API
interface PayPalSettings {
  clientId: string;
  clientSecret: string;
  sandboxMode: boolean;
  enabled: boolean;
}

export default function PayPalSettings() {
  const { toast } = useToast();
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Get current user
  const { user } = useAuth();
  
  // Fetch current PayPal settings
  const { data: settings, isLoading, error } = useQuery<PayPalSettings>({
    queryKey: ['/api/admin/payments/paypal/config'],
    retry: false,
    enabled: !!user && user.role === 'admin'
  });

  // Form setup with defaults
  const form = useForm<PayPalSettingsType>({
    resolver: zodResolver(PayPalSettingsSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      sandboxMode: true,
      enabled: false
    }
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      const typedSettings = settings as PayPalSettings;
      form.reset({
        clientId: typedSettings.clientId || "",
        clientSecret: typedSettings.clientSecret || "",
        sandboxMode: typedSettings.sandboxMode !== false,
        enabled: typedSettings.enabled === true
      });
    }
  }, [settings, form]);

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: PayPalSettingsType) => {
      return apiRequest("POST", '/api/admin/payments/paypal/config', data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "PayPal integration settings have been updated successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments/paypal/config'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: error instanceof Error ? error.message : "Failed to update PayPal settings",
        variant: "destructive"
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", '/api/admin/payments/paypal/test-connection', form.getValues());
    },
    onSuccess: (data) => {
      toast({
        title: "Connection successful",
        description: "Successfully connected to PayPal API",
        variant: "default"
      });
      setIsTestingConnection(false);
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to PayPal API",
        variant: "destructive"
      });
      setIsTestingConnection(false);
    }
  });

  // Submit handler
  const onSubmit = (data: PayPalSettingsType) => {
    updateMutation.mutate(data);
  };

  // Test connection handler
  const testConnection = () => {
    setIsTestingConnection(true);
    testConnectionMutation.mutate();
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PayPal Integration</CardTitle>
          <CardDescription>Loading settings...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>PayPal Integration</CardTitle>
          <CardDescription>Error loading settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error instanceof Error ? error.message : "Failed to load PayPal settings"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>PayPal Integration</CardTitle>
        <CardDescription>
          Configure PayPal integration to allow users to purchase tokens using PayPal
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">Enable PayPal Integration</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <FormField
                  control={form.control}
                  name="sandboxMode"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange} 
                        />
                      </FormControl>
                      <FormLabel className="cursor-pointer">Sandbox Mode</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="clientId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PayPal Client ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your PayPal Client ID" {...field} />
                    </FormControl>
                    <FormDescription>
                      Client ID from your PayPal Developer Dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientSecret"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PayPal Client Secret</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your PayPal Client Secret" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Client Secret from your PayPal Developer Dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={isTestingConnection || testConnectionMutation.isPending || !form.getValues().clientId || !form.getValues().clientSecret}
              >
                {isTestingConnection || testConnectionMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing Connection...
                  </>
                ) : (
                  "Test Connection"
                )}
              </Button>

              <Button 
                type="submit" 
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Settings"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
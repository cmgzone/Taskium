import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

// Define the schema for Flutterwave settings
const flutterwaveSettingsSchema = z.object({
  publicKey: z.string().min(1, "Public key is required when enabling Flutterwave").or(z.string().length(0)),
  secretKey: z.string().min(1, "Secret key is required when enabling Flutterwave").or(z.string().length(0)),
  encryptionKey: z.string().optional(),
  testMode: z.boolean().default(true),
  enabled: z.boolean().default(false),
});

// Define the type for Flutterwave settings
type FlutterwaveSettingsType = z.infer<typeof flutterwaveSettingsSchema>;

export default function FlutterwaveSettings() {
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch current settings
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/admin/payments/flutterwave/config'],
    queryFn: async () => {
      const response = await apiRequest("GET", '/api/admin/payments/flutterwave/config');
      if (!response.ok) {
        throw new Error("Failed to fetch Flutterwave settings");
      }
      return response.json();
    }
  });

  // Initialize form with default values or fetched data
  const form = useForm<FlutterwaveSettingsType>({
    resolver: zodResolver(flutterwaveSettingsSchema),
    defaultValues: {
      publicKey: '',
      secretKey: '',
      encryptionKey: '',
      testMode: true,
      enabled: false
    },
    values: data || undefined
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FlutterwaveSettingsType) => {
      return apiRequest("POST", '/api/admin/payments/flutterwave/config', data);
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Flutterwave integration settings have been updated successfully",
        variant: "default"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments/flutterwave/config'] });
    },
    onError: (error) => {
      toast({
        title: "Error updating settings",
        description: error instanceof Error ? error.message : "Failed to update Flutterwave settings",
        variant: "destructive"
      });
    }
  });

  // Test connection mutation
  const testConnectionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", '/api/admin/payments/flutterwave/test-connection', form.getValues());
    },
    onSuccess: (data) => {
      toast({
        title: "Connection successful",
        description: "Successfully connected to Flutterwave API",
        variant: "default"
      });
      setIsTestingConnection(false);
    },
    onError: (error) => {
      toast({
        title: "Connection failed",
        description: error instanceof Error ? error.message : "Failed to connect to Flutterwave API",
        variant: "destructive"
      });
      setIsTestingConnection(false);
    }
  });

  // Submit handler
  const onSubmit = (data: FlutterwaveSettingsType) => {
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
          <CardTitle>Flutterwave Integration</CardTitle>
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
          <CardTitle>Flutterwave Integration</CardTitle>
          <CardDescription>Error loading settings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error instanceof Error ? error.message : "Failed to load Flutterwave settings"}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Flutterwave Integration</CardTitle>
        <CardDescription>
          Configure Flutterwave payment gateway for token purchases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="enabled"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Enable Flutterwave Payments
                    </FormLabel>
                    <FormDescription>
                      Activate Flutterwave as a payment option for token purchases
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6">
              <FormField
                control={form.control}
                name="publicKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flutterwave Public Key</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter your Flutterwave Public Key" {...field} />
                    </FormControl>
                    <FormDescription>
                      Public Key from your Flutterwave Dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="secretKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Flutterwave Secret Key</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your Flutterwave Secret Key" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Secret Key from your Flutterwave Dashboard
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="encryptionKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Encryption Key (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Enter your Flutterwave Encryption Key" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Encryption Key for enhanced security (optional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="testMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Test Mode
                      </FormLabel>
                      <FormDescription>
                        Use Flutterwave test environment instead of production
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={isTestingConnection || updateMutation.isPending}
              >
                {isTestingConnection ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>Test Connection</>
                )}
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>Save Settings</>
                )}
              </Button>
            </div>
          </form>
        </Form>

        {testConnectionMutation.isSuccess && (
          <Alert variant="default" className="mt-4">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Connection Successful</AlertTitle>
            <AlertDescription>
              Successfully connected to the Flutterwave API
            </AlertDescription>
          </Alert>
        )}

        {testConnectionMutation.isError && (
          <Alert variant="destructive" className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Connection Failed</AlertTitle>
            <AlertDescription>
              {testConnectionMutation.error instanceof Error 
                ? testConnectionMutation.error.message 
                : "Failed to connect to Flutterwave API"}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-2 border-t px-6 py-4">
        <p className="text-sm text-muted-foreground">
          <strong>Note:</strong> You will need to obtain your API keys from the Flutterwave Dashboard.
        </p>
        <p className="text-sm text-muted-foreground">
          Your Flutterwave credentials are securely stored and never exposed to clients.
        </p>
      </CardFooter>
    </Card>
  );
}
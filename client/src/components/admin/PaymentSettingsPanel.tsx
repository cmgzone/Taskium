import React, { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Component imports
import FlutterwaveSettings from './flutterwave-settings';

// UI components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  Wallet,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  XCircle,
  DollarSign,
  Eye,
  EyeOff,
  CreditCard as CreditCardIcon
} from 'lucide-react';

// Form schema
const paypalFormSchema = z.object({
  clientId: z.string().min(1, {
    message: "Client ID is required.",
  }),
  clientSecret: z.string().optional(),
  sandboxMode: z.boolean().default(true),
  enabled: z.boolean().default(false),
});

type PayPalFormValues = z.infer<typeof paypalFormSchema>;

const PaymentSettingsPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  
  // Fetch PayPal settings
  const { 
    data: paypalConfig, 
    isLoading: paypalLoading,
    error: paypalError,
    refetch: refetchPayPal
  } = useQuery({
    queryKey: ['/api/admin/payments/paypal/config'],
    queryFn: async () => {
      const response = await fetch('/api/admin/payments/paypal/config');
      if (!response.ok) {
        throw new Error('Failed to fetch PayPal settings');
      }
      return response.json();
    }
  });
  
  // Initialize PayPal form
  const paypalForm = useForm<PayPalFormValues>({
    resolver: zodResolver(paypalFormSchema),
    defaultValues: {
      clientId: '',
      clientSecret: '',
      sandboxMode: true,
      enabled: false,
    },
  });
  
  // Set form values when data is loaded
  React.useEffect(() => {
    if (paypalConfig) {
      paypalForm.reset({
        clientId: paypalConfig.clientId || '',
        clientSecret: '', // Don't populate for security
        sandboxMode: paypalConfig.sandboxMode ?? true,
        enabled: paypalConfig.enabled ?? false,
      });
    }
  }, [paypalConfig, paypalForm]);
  
  // Handle PayPal form submission
  const onSubmitPayPal = async (data: PayPalFormValues) => {
    try {
      const response = await fetch('/api/admin/payments/paypal/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save PayPal settings');
      }
      
      const result = await response.json();
      
      toast({
        title: "Success",
        description: "PayPal settings saved successfully",
      });
      
      // If we tested the connection as part of saving, show the result
      if (result.testResult) {
        setTestResult(result.testResult);
      } else {
        setTestResult(null);
      }
      
      // Refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/payments/paypal/config'] });
      
    } catch (error) {
      console.error('Error saving PayPal settings:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save PayPal settings",
        variant: "destructive",
      });
    }
  };
  
  // Test PayPal connection
  const testPayPalConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/admin/payments/paypal/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Connection test failed');
      }
      
      const result = await response.json();
      setTestResult(result);
      
      if (result.success) {
        toast({
          title: "Connection Successful",
          description: result.message,
          variant: "default",
        });
      } else {
        toast({
          title: "Connection Failed",
          description: result.message,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error testing PayPal connection:', error);
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Request failed. Check your network connection.'
      });
      
      toast({
        title: "Connection Test Failed",
        description: "An error occurred while testing the connection",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Gateway Settings
        </CardTitle>
        <CardDescription>
          Configure payment methods and gateways for token purchases
        </CardDescription>
      </CardHeader>
      
      <Tabs defaultValue="paypal" className="w-full">
        <div className="px-6">
          <TabsList className="mb-4">
            <TabsTrigger value="paypal" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              PayPal
            </TabsTrigger>
            <TabsTrigger value="flutterwave" className="flex items-center gap-2">
              <CreditCardIcon className="h-4 w-4" />
              Flutterwave
            </TabsTrigger>
            <TabsTrigger value="blockchain" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              Blockchain
            </TabsTrigger>
          </TabsList>
        </div>
        
        <CardContent className="p-6 pt-0">
          {/* PayPal Settings Tab */}
          <TabsContent value="paypal" className="m-0">
            <div className="space-y-6">
              {/* Status Badge */}
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">PayPal Integration</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure PayPal API for token purchases (API keys are used for testing only, not stored in database)
                  </p>
                </div>
                
                {!paypalLoading && paypalConfig && (
                  <Badge
                    variant={paypalConfig.enabled ? "default" : "outline"}
                    className={`${
                      paypalConfig.enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                    } flex items-center gap-1`}
                  >
                    {paypalConfig.enabled ? (
                      <>
                        <CheckCircle2 className="h-3 w-3" />
                        Enabled
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3" />
                        Disabled
                      </>
                    )}
                  </Badge>
                )}
              </div>
              
              {/* Connection Status */}
              {testResult && (
                <Alert variant={testResult.success ? "default" : "destructive"}>
                  {testResult.success ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                  <AlertTitle>
                    {testResult.success ? "Connection Successful" : "Connection Failed"}
                  </AlertTitle>
                  <AlertDescription>
                    {testResult.message}
                  </AlertDescription>
                </Alert>
              )}
              
              {/* PayPal Settings Form */}
              {paypalLoading ? (
                <div className="py-4 text-center">Loading PayPal settings...</div>
              ) : paypalError ? (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>
                    Failed to load PayPal settings. Please try again.
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => refetchPayPal()}
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : (
                <Form {...paypalForm}>
                  <form onSubmit={paypalForm.handleSubmit(onSubmitPayPal)} className="space-y-6">
                    <FormField
                      control={paypalForm.control}
                      name="enabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Enable PayPal</FormLabel>
                            <FormDescription>
                              Allow users to purchase tokens using PayPal
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
                    
                    <FormField
                      control={paypalForm.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client ID</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter PayPal Client ID" />
                          </FormControl>
                          <FormDescription>
                            The Client ID from your PayPal Developer dashboard
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paypalForm.control}
                      name="clientSecret"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Client Secret</FormLabel>
                          <div className="flex relative">
                            <FormControl>
                              <Input
                                {...field}
                                type={showClientSecret ? "text" : "password"}
                                placeholder={paypalConfig?.hasSecret ? "••••••••••••••••" : "Enter PayPal Client Secret"}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="absolute right-2 top-1/2 transform -translate-y-1/2"
                              onClick={() => setShowClientSecret(!showClientSecret)}
                            >
                              {showClientSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <FormDescription>
                            {paypalConfig?.hasSecret
                              ? "Leave blank to keep the current client secret"
                              : "The Client Secret from your PayPal Developer dashboard"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={paypalForm.control}
                      name="sandboxMode"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Sandbox Mode</FormLabel>
                            <FormDescription>
                              Use PayPal sandbox for testing instead of production
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
                    
                    <div className="flex justify-between pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={testPayPalConnection}
                        disabled={testingConnection}
                      >
                        {testingConnection ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>Test Connection</>
                        )}
                      </Button>
                      <Button type="submit">Save Settings</Button>
                    </div>
                  </form>
                </Form>
              )}
              
              {/* Usage Instructions */}
              <div className="mt-6 p-4 bg-muted rounded-md">
                <h4 className="font-medium mb-2">Setup Instructions</h4>
                <ol className="list-decimal list-inside space-y-1 text-sm">
                  <li>Create a PayPal Developer account at <a href="https://developer.paypal.com" target="_blank" rel="noopener noreferrer" className="text-primary">developer.paypal.com</a></li>
                  <li>Create a new app in the Developer Dashboard</li>
                  <li>Copy the Client ID and Client Secret</li>
                  <li>Set environment variables <strong>PAYPAL_CLIENT_ID</strong> and <strong>PAYPAL_CLIENT_SECRET</strong> for production use</li>
                  <li>For testing, you can enter credentials directly in this form (they will not be stored in the database)</li>
                  <li>Use Sandbox mode during testing</li>
                  <li>Switch to Production mode when ready to accept real payments</li>
                </ol>
                
                <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm">
                  <strong>Note:</strong> For security, API keys are not stored in the database. You should set environment 
                  variables <strong>PAYPAL_CLIENT_ID</strong> and <strong>PAYPAL_CLIENT_SECRET</strong> for production.
                  Keys entered here are used for testing the connection only.
                </div>
              </div>
            </div>
          </TabsContent>
          
          {/* Flutterwave Settings Tab */}
          <TabsContent value="flutterwave" className="m-0">
            <FlutterwaveSettings />
          </TabsContent>
          
          {/* Blockchain Settings Tab (Placeholder) */}
          <TabsContent value="blockchain" className="m-0">
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium">Blockchain Payments</h3>
                  <p className="text-sm text-muted-foreground">
                    Accept payments directly through blockchain networks
                  </p>
                </div>
                <Badge variant="outline" className="bg-gray-100 text-gray-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Configured
                </Badge>
              </div>
              
              <div className="bg-muted rounded-md p-4">
                <p className="text-sm">
                  Blockchain payments are configured through the Wallet Settings section.
                  Please use the Wallet Configuration panel to manage blockchain payment options.
                </p>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex flex-col items-start px-6">
        <Separator className="mb-4" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <span>Changing payment settings may affect active payment processing. Test thoroughly before enabling in production.</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default PaymentSettingsPanel;
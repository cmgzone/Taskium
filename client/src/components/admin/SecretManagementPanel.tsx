import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { SystemSecret } from '../../../../shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

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
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { 
  Key, 
  KeyRound, 
  Lock, 
  Unlock, 
  ShieldCheck, 
  AlertTriangle, 
  Trash, 
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

// Form schema for creating/editing secrets
const secretFormSchema = z.object({
  key: z.string().min(2, {
    message: "Key must be at least 2 characters.",
  }),
  value: z.string().min(1, {
    message: "Value cannot be empty.",
  }),
  description: z.string().optional(),
  category: z.string().default('general'),
  isEncrypted: z.boolean().default(true),
  environment: z.string().default('production'),
});

type SecretFormValues = z.infer<typeof secretFormSchema>;

const SecretManagementPanel: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<string>('all');
  const [secretToDelete, setSecretToDelete] = useState<string | null>(null);
  const [selectedSecret, setSelectedSecret] = useState<SystemSecret | null>(null);
  const [showSecretValue, setShowSecretValue] = useState<boolean>(false);
  
  // Fetch secrets
  const { 
    data: secrets = [], 
    isLoading: secretsLoading, 
    error: secretsError,
    refetch: refetchSecrets
  } = useQuery({
    queryKey: ['/api/admin/secrets'],
    queryFn: async () => {
      const response = await fetch('/api/admin/secrets');
      if (!response.ok) {
        throw new Error('Failed to fetch secrets');
      }
      return response.json();
    }
  });
  
  // Fetch categories
  const { 
    data: categories = [],
    isLoading: categoriesLoading
  } = useQuery({
    queryKey: ['/api/admin/secrets/categories'],
    queryFn: async () => {
      const response = await fetch('/api/admin/secrets/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    }
  });
  
  // Initialize form with default values
  const form = useForm<SecretFormValues>({
    resolver: zodResolver(secretFormSchema),
    defaultValues: {
      key: '',
      value: '',
      description: '',
      category: 'general',
      isEncrypted: true,
      environment: 'production',
    },
  });
  
  // Reset form when selectedSecret changes
  useEffect(() => {
    if (selectedSecret) {
      form.reset({
        key: selectedSecret.key,
        value: '',  // Don't show the actual value for security
        description: selectedSecret.description || '',
        category: selectedSecret.category,
        isEncrypted: selectedSecret.isEncrypted,
        environment: selectedSecret.environment,
      });
    } else {
      form.reset({
        key: '',
        value: '',
        description: '',
        category: 'general',
        isEncrypted: true,
        environment: 'production',
      });
    }
  }, [selectedSecret, form]);
  
  // Handle form submission
  const onSubmit = async (data: SecretFormValues) => {
    try {
      const response = await apiRequest({
        url: '/api/admin/secrets',
        method: 'POST',
        data
      });
      
      toast({
        title: "Success",
        description: "Secret saved successfully",
      });
      
      // Refresh secrets list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/secrets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/secrets/categories'] });
      
      // Reset form and selected secret
      setSelectedSecret(null);
      form.reset();
      
    } catch (error) {
      console.error('Error saving secret:', error);
      toast({
        title: "Error",
        description: "Failed to save secret",
        variant: "destructive",
      });
    }
  };
  
  // Handle secret deletion
  const handleDeleteSecret = async () => {
    if (!secretToDelete) return;
    
    try {
      await apiRequest({
        url: `/api/admin/secrets/${secretToDelete}`,
        method: 'DELETE'
      });
      
      toast({
        title: "Success",
        description: "Secret deleted successfully",
      });
      
      // Refresh secrets list
      queryClient.invalidateQueries({ queryKey: ['/api/admin/secrets'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/secrets/categories'] });
      
      // Reset selected secret if it was deleted
      if (selectedSecret?.key === secretToDelete) {
        setSelectedSecret(null);
      }
      
    } catch (error) {
      console.error('Error deleting secret:', error);
      toast({
        title: "Error",
        description: "Failed to delete secret",
        variant: "destructive",
      });
    } finally {
      setSecretToDelete(null);
    }
  };
  
  // Handle selecting a secret for editing
  const handleSelectSecret = async (key: string) => {
    try {
      const response = await fetch(`/api/admin/secrets/by-key/${key}`);
      if (!response.ok) {
        throw new Error('Failed to fetch secret details');
      }
      setSelectedSecret(await response.json());
      setShowSecretValue(false);
    } catch (error) {
      console.error('Error fetching secret details:', error);
      toast({
        title: "Error",
        description: "Failed to load secret details",
        variant: "destructive",
      });
    }
  };
  
  // Filter secrets by category
  const filteredSecrets = activeTab === 'all' 
    ? secrets 
    : secrets.filter((secret: SystemSecret) => secret.category === activeTab);
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="h-5 w-5" />
          System Secrets Management
        </CardTitle>
        <CardDescription>
          Manage sensitive API keys and credentials securely
        </CardDescription>
      </CardHeader>
      
      <Tabs 
        defaultValue="all" 
        value={activeTab} 
        onValueChange={setActiveTab} 
        className="w-full"
      >
        <div className="px-6">
          <TabsList className="grid grid-cols-4 mb-4 sm:grid-cols-6">
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((category: string) => (
              <TabsTrigger key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        
        <CardContent className="p-6 pt-0">
          <TabsContent value={activeTab} forceMount className="m-0">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Secrets List */}
              <div className="lg:w-2/3">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-lg font-medium">
                    {activeTab === 'all' ? 'All Secrets' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Secrets`}
                  </h3>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => refetchSecrets()}
                    title="Refresh list"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                
                {secretsLoading ? (
                  <div className="py-4 text-center">Loading secrets...</div>
                ) : secretsError ? (
                  <div className="py-4 text-center text-red-500">
                    Error loading secrets. Please try again.
                  </div>
                ) : filteredSecrets.length === 0 ? (
                  <div className="py-4 text-center text-muted-foreground">
                    No secrets found in this category.
                  </div>
                ) : (
                  <div className="border rounded-md">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[40%]">Key</TableHead>
                          <TableHead className="w-[20%]">Category</TableHead>
                          <TableHead className="w-[20%]">Encryption</TableHead>
                          <TableHead className="w-[20%]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredSecrets.map((secret: SystemSecret) => (
                          <TableRow key={secret.key}>
                            <TableCell className="font-medium">{secret.key}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {secret.category}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {secret.isEncrypted ? (
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <Lock className="h-3 w-3" />
                                  Encrypted
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <Unlock className="h-3 w-3" />
                                  Plain
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleSelectSecret(secret.key)}
                                >
                                  Edit
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="sm"
                                      className="text-red-500"
                                      onClick={() => setSecretToDelete(secret.key)}
                                    >
                                      <Trash className="h-4 w-4" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        This will permanently delete the secret "{secret.key}". This action cannot be undone.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel onClick={() => setSecretToDelete(null)}>
                                        Cancel
                                      </AlertDialogCancel>
                                      <AlertDialogAction onClick={handleDeleteSecret}>
                                        Delete
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
              
              {/* Secret Form */}
              <div className="lg:w-1/3">
                <div className="border rounded-md p-4">
                  <h3 className="text-lg font-medium mb-4">
                    {selectedSecret ? 'Edit Secret' : 'Add New Secret'}
                  </h3>
                  
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="key"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secret Key</FormLabel>
                            <FormControl>
                              <Input 
                                {...field} 
                                placeholder="e.g., STRIPE_API_KEY"
                                readOnly={!!selectedSecret}
                              />
                            </FormControl>
                            <FormDescription>
                              A unique identifier for this secret
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Secret Value</FormLabel>
                            <div className="flex relative">
                              <FormControl>
                                <Input 
                                  {...field} 
                                  type={showSecretValue ? "text" : "password"}
                                  placeholder={selectedSecret ? "••••••••••••••••" : "Enter secret value"}
                                />
                              </FormControl>
                              <Button 
                                type="button" 
                                variant="ghost" 
                                size="sm"
                                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                                onClick={() => setShowSecretValue(!showSecretValue)}
                              >
                                {showSecretValue ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                            <FormDescription>
                              {selectedSecret 
                                ? "Leave blank to keep the current value" 
                                : "The sensitive data to store securely"}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                {...field} 
                                placeholder="What is this secret used for?"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="category"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Category</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a category" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {['general', 'payment', 'blockchain', 'notifications', 'api', 'storage'].map((category) => (
                                  <SelectItem key={category} value={category}>
                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="isEncrypted"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Encrypt Value</FormLabel>
                              <FormDescription>
                                Store this secret with encryption
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
                        control={form.control}
                        name="environment"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Environment</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select environment" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="production">Production</SelectItem>
                                <SelectItem value="development">Development</SelectItem>
                                <SelectItem value="test">Test</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex justify-between pt-2">
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setSelectedSecret(null);
                            form.reset();
                          }}
                        >
                          Cancel
                        </Button>
                        <Button type="submit">
                          {selectedSecret ? 'Update Secret' : 'Save Secret'}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </div>
              </div>
            </div>
          </TabsContent>
        </CardContent>
      </Tabs>
      
      <CardFooter className="flex flex-col items-start px-6 pt-0">
        <Separator className="mb-4" />
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4" />
          <span>Secrets are stored securely and sensitive values are encrypted</span>
        </div>
      </CardFooter>
    </Card>
  );
};

export default SecretManagementPanel;
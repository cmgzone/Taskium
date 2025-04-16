import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

// Icons
import { Palette, Upload, Image, Brush, Loader2, Paintbrush, Check, AlertCircle } from 'lucide-react';

// Define the validation schema
const brandingSettingsSchema = z.object({
  siteName: z.string().min(1, 'Site name is required'),
  siteTagline: z.string().optional(),
  faviconUrl: z.string().optional(),
  logoUrl: z.string().min(1, 'Logo URL is required'),
  logoType: z.enum(['default', 'custom']).default('default'),
  primaryColor: z.string().min(1, 'Primary color is required').regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'),
  secondaryColor: z.union([
    z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Must be a valid hex color'),
    z.string().max(0),
    z.null()
  ]).optional(),
  loginBackgroundImage: z.string().optional(),
  enableCustomBranding: z.boolean().default(true),
});

type BrandingSettingsFormValues = z.infer<typeof brandingSettingsSchema>;

export default function BrandingSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploadingLogo, setIsUploadingLogo] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<string>('general');

  // Interface for branding settings
  interface BrandingSettings {
    siteName: string;
    siteTagline: string | null;
    faviconUrl: string | null;
    logoUrl: string;
    logoType: 'default' | 'custom';
    primaryColor: string;
    secondaryColor: string | null;
    loginBackgroundImage: string | null;
    enableCustomBranding: boolean;
  }

  // Get current user
  const { user } = useAuth();
  
  // Fetch current branding settings
  const { data: settings, isLoading, error, refetch } = useQuery<BrandingSettings>({
    queryKey: ['/api/admin/branding-settings'],
    refetchOnWindowFocus: false,
    enabled: !!user && user.role === 'admin',
    retry: false,
  });

  // Set up form with default values
  const form = useForm<BrandingSettingsFormValues>({
    resolver: zodResolver(brandingSettingsSchema),
    defaultValues: {
      siteName: 'TSK Platform',
      siteTagline: 'The Future of AI Knowledge Management',
      faviconUrl: '',
      logoUrl: '/icons/taskium-logo-original.png',
      logoType: 'default',
      primaryColor: '#FF6B35',
      secondaryColor: '#3498db',
      loginBackgroundImage: '',
      enableCustomBranding: true,
    },
  });

  // Update form when settings are loaded
  useEffect(() => {
    if (settings) {
      const typedSettings = settings as BrandingSettings;
      form.reset({
        siteName: typedSettings.siteName || 'TSK Platform',
        siteTagline: typedSettings.siteTagline || 'The Future of AI Knowledge Management',
        faviconUrl: typedSettings.faviconUrl || '',
        logoUrl: typedSettings.logoUrl || '/icons/taskium-logo-original.png',
        logoType: typedSettings.logoType || 'default',
        primaryColor: typedSettings.primaryColor || '#FF6B35',
        secondaryColor: typedSettings.secondaryColor || '',
        loginBackgroundImage: typedSettings.loginBackgroundImage || '',
        enableCustomBranding: typedSettings.enableCustomBranding !== false,
      });
      
      // Set logo preview
      setLogoPreview(typedSettings.logoUrl || '/icons/taskium-logo-original.png');
    }
  }, [settings, form]);

  // Handle form submission
  const onSubmit = async (data: BrandingSettingsFormValues) => {
    try {
      console.log('Submitting branding settings:', data);
      
      // Ensure all required fields are present and have values
      if (!data.siteName || !data.logoUrl || !data.primaryColor || !data.logoType) {
        toast({
          title: 'Validation Error',
          description: 'Please ensure all required fields are filled out.',
          variant: 'destructive',
        });
        return;
      }
      
      // Create a clean copy of the data to send (avoid any proxy issues)
      const cleanData = {
        siteName: data.siteName,
        siteTagline: data.siteTagline || null,
        faviconUrl: data.faviconUrl || null,
        logoUrl: data.logoUrl,
        logoType: data.logoType,
        primaryColor: data.primaryColor,
        secondaryColor: data.secondaryColor || null,
        loginBackgroundImage: data.loginBackgroundImage || null,
        enableCustomBranding: Boolean(data.enableCustomBranding)
      };
      
      console.log('Sending branding settings to server:', cleanData);
      
      const response = await apiRequest(
        'POST',
        '/api/admin/branding-settings',
        cleanData
      );
      
      console.log('Branding settings update response:', response);

      // Immediately invalidate the query to refresh the data
      queryClient.invalidateQueries({ queryKey: ['/api/admin/branding-settings'] });
      
      // Refresh the page to see changes
      await refetch();
      
      toast({
        title: 'Branding settings updated',
        description: 'Your branding configuration has been saved successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Failed to update branding settings:', error);
      toast({
        title: 'Failed to update settings',
        description: error instanceof Error ? error.message : 'There was an error saving your branding configuration.',
        variant: 'destructive',
      });
    }
  };

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    console.log(`Attempting to upload file: ${file.name} (${file.type}, ${file.size} bytes)`);
    
    // Reset the input field to ensure we can upload the same file again if needed
    e.target.value = '';
    
    // Only accept PNG, JPG, JPEG, SVG
    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/svg+xml'].includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Please upload a PNG, JPG, JPEG, or SVG file.',
        variant: 'destructive',
      });
      return;
    }
    
    // File size check (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Logo file must be less than 2MB.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploadingLogo(true);
    
    try {
      // Create form data with file
      const formData = new FormData();
      formData.append('logo', file);
      
      console.log('Sending logo upload request...');
      
      // Call API to upload logo
      const response = await fetch('/api/admin/branding-settings/logo-upload', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header - browser will set it with correct boundary for FormData
        credentials: 'same-origin', // Include cookies for authentication
      });
      
      console.log('Upload response status:', response.status);
      
      const data = await response.json();
      console.log('Upload response data:', data);
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload logo');
      }
      
      // Ensure the logo URL starts with a slash if it's a relative path
      const logoUrl = data.logoUrl.startsWith('/') ? data.logoUrl : `/${data.logoUrl}`;
      console.log('Setting logo URL to:', logoUrl);
      
      // Create alternative URLs for fallback
      const filename = logoUrl.split('/').pop();
      const alternativeUrls = [
        logoUrl,                       // Original URL from response
        `/api/logos/${filename}`,      // Direct API endpoint we created
        `/uploads/logos/${filename}`   // Direct upload path
      ];
      
      console.log('Alternative logo URLs for fallback:', alternativeUrls);
      
      // Update form with new logo URL
      form.setValue('logoUrl', logoUrl);
      form.setValue('logoType', 'custom');
      
      // Add a timestamp to bypass browser cache
      const cacheBustUrl = `${logoUrl}?t=${Date.now()}`;
      setLogoPreview(cacheBustUrl);
      
      // Preload all image versions to ensure at least one works
      alternativeUrls.forEach(url => {
        const preloadImg = new Image();
        preloadImg.src = `${url}?t=${Date.now()}`;
        
        // Add event listeners to see which one loads successfully
        preloadImg.onload = () => console.log(`Successfully loaded logo from: ${url}`);
        preloadImg.onerror = () => console.log(`Failed to load logo from: ${url}`);
      });
      
      toast({
        title: 'Logo uploaded',
        description: 'Your custom logo has been uploaded successfully.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: 'Upload failed',
        description: error instanceof Error ? error.message : 'There was an error uploading your logo.',
        variant: 'destructive',
      });
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Reset to default logo
  const resetToDefaultLogo = () => {
    const defaultLogoUrl = '/icons/taskium-logo-original.png';
    form.setValue('logoUrl', defaultLogoUrl);
    form.setValue('logoType', 'default');
    setLogoPreview(defaultLogoUrl);
    
    toast({
      title: 'Default logo restored',
      description: 'The platform logo has been reset to default.',
      variant: 'default',
    });
  };

  if (isLoading) {
    return <div className="p-6">Loading branding settings...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-1 text-red-700">Failed to load branding settings. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Branding & Appearance</h2>
        <p className="text-muted-foreground">
          Customize the look and feel of your platform with branding options.
        </p>
      </div>

      <Tabs defaultValue={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="logo">Logo</TabsTrigger>
          <TabsTrigger value="colors">Colors</TabsTrigger>
          <TabsTrigger value="login">Login Screen</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-6">
            <TabsContent value="general" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    General Branding
                  </CardTitle>
                  <CardDescription>
                    Configure general information about your platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="siteName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Name</FormLabel>
                        <FormControl>
                          <Input placeholder="TSK Platform" {...field} />
                        </FormControl>
                        <FormDescription>
                          The name of your platform displayed throughout the site
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="siteTagline"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tagline</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="The Future of AI Knowledge Management" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          A short description or slogan for your platform
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="faviconUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Favicon URL</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="/favicon.ico" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          The URL to your site's favicon (displayed in browser tabs)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="enableCustomBranding"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Enable Custom Branding</FormLabel>
                          <FormDescription>
                            When enabled, the platform will use your custom branding settings
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logo" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5" />
                    Logo Configuration
                  </CardTitle>
                  <CardDescription>
                    Customize your platform's logo
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <FormField
                        control={form.control}
                        name="logoType"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Logo Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                value={field.value}
                                className="flex flex-col space-y-1"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="default" id="default" />
                                  <Label htmlFor="default">Use Default Logo</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="custom" id="custom" />
                                  <Label htmlFor="custom">Use Custom Logo</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch('logoType') === 'custom' && (
                        <div className="mt-4">
                          <FormLabel>Upload Custom Logo</FormLabel>
                          <div className="mt-2">
                            <div className="flex items-center gap-3">
                              <Input
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/svg+xml"
                                onChange={handleLogoUpload}
                                disabled={isUploadingLogo}
                                className="w-full"
                              />
                              {isUploadingLogo && (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Upload a PNG, JPG, or SVG (max 2MB)
                            </p>
                          </div>
                        </div>
                      )}

                      <FormField
                        control={form.control}
                        name="logoUrl"
                        render={({ field }) => (
                          <FormItem className="mt-4">
                            <FormLabel>Logo URL</FormLabel>
                            <FormControl>
                              <Input {...field} value={field.value || ''} />
                            </FormControl>
                            <FormDescription>
                              Direct URL to the logo image
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {form.watch('logoType') === 'custom' && (
                        <Button
                          type="button"
                          variant="outline"
                          className="mt-4"
                          onClick={resetToDefaultLogo}
                        >
                          Reset to Default Logo
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-col items-center justify-center p-6 border rounded-lg">
                      <h3 className="mb-4 text-sm font-medium">Logo Preview</h3>
                      <div className="bg-gray-50 dark:bg-slate-900 rounded-md p-4 flex items-center justify-center h-48 w-full">
                        {logoPreview ? (
                          <>
                            <img
                              src={logoPreview}
                              alt="Logo Preview"
                              className="max-h-full max-w-full object-contain"
                              onError={(e) => {
                                console.error(`Failed to load logo from ${logoPreview}`);
                                e.currentTarget.src = '/icons/taskium-logo-original.png';
                                toast({
                                  title: 'Error loading logo image',
                                  description: `Failed to load: ${logoPreview}. Using default logo.`,
                                  variant: 'destructive',
                                });
                              }}
                            />
                            <div className="absolute bottom-2 right-2 text-xs text-muted-foreground bg-white/70 dark:bg-black/70 p-1 rounded">
                              {logoPreview}
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-muted-foreground">No logo selected</div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="colors" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brush className="h-5 w-5" />
                    Color Scheme
                  </CardTitle>
                  <CardDescription>
                    Define the colors used throughout your platform
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="primaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input {...field} type="text" />
                              <div className="flex items-center">
                                <Input
                                  type="color"
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  className="w-12 h-10 p-1"
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Main color used for buttons, links, and accents
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="secondaryColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Secondary Color (Optional)</FormLabel>
                          <FormControl>
                            <div className="flex gap-2">
                              <Input 
                                {...field} 
                                type="text" 
                                value={field.value || ''} 
                              />
                              <div className="flex items-center">
                                <Input
                                  type="color"
                                  value={field.value || '#3498db'}
                                  onChange={(e) => field.onChange(e.target.value)}
                                  className="w-12 h-10 p-1"
                                />
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Secondary color used for visual elements
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Color Preview</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div 
                        className="h-20 rounded-md flex items-center justify-center text-white"
                        style={{ 
                          backgroundColor: form.watch('primaryColor') || '#FF6B35',
                        }}
                      >
                        Primary Color
                      </div>
                      <div 
                        className="h-20 rounded-md flex items-center justify-center text-white"
                        style={{ 
                          backgroundColor: form.watch('secondaryColor') || '#3498db',
                        }}
                      >
                        Secondary Color
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="login" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Paintbrush className="h-5 w-5" />
                    Login Screen Customization
                  </CardTitle>
                  <CardDescription>
                    Customize the appearance of your login page
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="loginBackgroundImage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Login Background Image URL (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="https://example.com/background.jpg" 
                            {...field} 
                            value={field.value || ''} 
                          />
                        </FormControl>
                        <FormDescription>
                          URL to a background image for the login screen (leave empty for default gradient)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="mt-6">
                    <h3 className="text-sm font-medium mb-3">Login Preview</h3>
                    <div 
                      className="border rounded-md h-64 overflow-hidden relative"
                      style={form.watch('loginBackgroundImage') ? {
                        backgroundImage: `url(${form.watch('loginBackgroundImage')})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      } : {
                        background: `linear-gradient(45deg, ${form.watch('primaryColor') || '#FF6B35'}, ${form.watch('secondaryColor') || '#3498db'})`
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/90 dark:bg-gray-900/90 p-6 rounded-lg shadow-xl w-64">
                          <div className="flex justify-center mb-4">
                            <img
                              src={logoPreview || '/icons/taskium-logo-original.png'}
                              alt="Logo"
                              className="h-10 object-contain"
                              onError={(e) => {
                                console.error(`Failed to load login logo from ${logoPreview}`);
                                e.currentTarget.src = '/icons/taskium-logo-original.png';
                              }}
                            />
                          </div>
                          <div className="space-y-3">
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-md animate-pulse"></div>
                            <div className="h-10 bg-primary/80 rounded-md mt-4"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => refetch()}>
                Reset Changes
              </Button>
              <Button type="submit">
                Save Branding Settings
              </Button>
            </div>
          </form>
        </Form>
      </Tabs>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, Plus, FileText, Edit, Eye, Check, X, RefreshCw } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

// Define validation schema for platform settings
const platformSettingSchema = z.object({
  settingType: z.string().min(1, { message: "Setting type is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  content: z.string().min(10, { message: "Content must be at least 10 characters" }),
  version: z.string().min(1, { message: "Version is required" }),
  isActive: z.boolean().default(true),
  requiresAcceptance: z.boolean().default(false)
});

type PlatformSetting = z.infer<typeof platformSettingSchema> & {
  id: number;
  lastUpdatedAt: string;
  updatedBy?: { id: number; username: string; } | null;
};

export default function PlatformSettings() {
  const [selectedTab, setSelectedTab] = useState<string>("terms");
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingSetting, setEditingSetting] = useState<PlatformSetting | null>(null);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState<boolean>(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Form setup for creating/editing platform settings
  const form = useForm<z.infer<typeof platformSettingSchema>>({
    resolver: zodResolver(platformSettingSchema),
    defaultValues: {
      settingType: selectedTab,
      title: "",
      content: "",
      version: "1.0",
      isActive: true,
      requiresAcceptance: true
    }
  });

  // Query to fetch all platform settings
  const { data: settings, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/admin/platform-settings'],
    queryFn: async () => {
      const response = await apiRequest<PlatformSetting[]>('/api/admin/platform-settings');
      return response.data || [];
    }
  });

  // Get settings of the selected type
  const selectedSettings = settings?.filter(setting => setting.settingType === selectedTab) || [];
  const activeSetting = selectedSettings.find(setting => setting.isActive);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof platformSettingSchema>) => {
      const response = await apiRequest('/api/admin/platform-settings', {
        method: 'POST',
        data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-settings'] });
      toast({
        title: "Settings Created",
        description: "New platform settings have been created successfully.",
      });
      form.reset();
      setIsEditing(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to create platform settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<z.infer<typeof platformSettingSchema>> }) => {
      const response = await apiRequest(`/api/admin/platform-settings/${id}`, {
        method: 'PUT',
        data
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-settings'] });
      toast({
        title: "Settings Updated",
        description: "Platform settings have been updated successfully.",
      });
      form.reset();
      setIsEditing(false);
      setEditingSetting(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update platform settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Deactivate mutation
  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/platform-settings/${id}/deactivate`, {
        method: 'PUT'
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/platform-settings'] });
      toast({
        title: "Settings Deactivated",
        description: "Platform settings have been deactivated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to deactivate platform settings. Please try again.",
        variant: "destructive"
      });
    }
  });

  // When tab changes, reset form and editing state
  useEffect(() => {
    if (!isEditing) {
      form.setValue("settingType", selectedTab);
      
      if (selectedTab === "terms") {
        form.setValue("title", "Terms and Conditions");
      } else if (selectedTab === "privacy") {
        form.setValue("title", "Privacy Policy");
      } else {
        form.setValue("title", "");
      }
    }
  }, [selectedTab, form, isEditing]);

  // When editing an existing setting
  const handleEdit = (setting: PlatformSetting) => {
    setEditingSetting(setting);
    form.reset({
      settingType: setting.settingType,
      title: setting.title,
      content: setting.content,
      version: setting.version,
      isActive: setting.isActive,
      requiresAcceptance: setting.requiresAcceptance
    });
    setIsEditing(true);
  };

  // Preview content in Markdown
  const handlePreview = () => {
    setIsPreviewDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: z.infer<typeof platformSettingSchema>) => {
    if (editingSetting) {
      updateMutation.mutate({ id: editingSetting.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  // Cancel editing
  const handleCancel = () => {
    form.reset();
    setIsEditing(false);
    setEditingSetting(null);
  };

  // Render settings list
  const renderSettingsList = () => {
    if (isLoading) return <div className="text-center py-4">Loading settings...</div>;
    if (isError) return (
      <Alert variant="destructive" className="my-4">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          Failed to load platform settings. Please try again.
          <Button variant="outline" size="sm" className="mt-2" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );

    if (selectedSettings.length === 0) {
      return (
        <Alert className="my-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>No Settings</AlertTitle>
          <AlertDescription>
            No {selectedTab === "terms" ? "terms and conditions" : selectedTab === "privacy" ? "privacy policy" : selectedTab} settings found.
            Click the "Create New" button to add one.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="space-y-4 mt-4">
        {selectedSettings.map((setting) => (
          <Card key={setting.id} className={`border-l-4 ${setting.isActive ? 'border-l-green-500' : 'border-l-gray-300'}`}>
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    {setting.title}
                  </CardTitle>
                  <CardDescription>
                    Version: {setting.version} | Last updated: {new Date(setting.lastUpdatedAt).toLocaleString()}
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  {setting.isActive && (
                    <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200">
                      Active
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="pb-2">
              <div className="text-sm text-muted-foreground">
                {setting.content.length > 150 ? `${setting.content.substring(0, 150)}...` : setting.content}
              </div>
              {setting.requiresAcceptance && (
                <Badge variant="secondary" className="mt-2">
                  Requires Acceptance
                </Badge>
              )}
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 pt-2">
              <Button variant="outline" size="sm" onClick={() => {
                form.reset({
                  ...setting,
                  settingType: setting.settingType,
                });
                handlePreview();
              }}>
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleEdit(setting)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              {setting.isActive && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => deactivateMutation.mutate(setting.id)}
                  disabled={deactivateMutation.isPending}
                  className="text-red-500 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-2" />
                  Deactivate
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Platform Settings</h2>
          <p className="text-muted-foreground">
            Manage terms, privacy policy, and other legal documents for your platform.
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create New
          </Button>
        )}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="terms">Terms & Conditions</TabsTrigger>
          <TabsTrigger value="privacy">Privacy Policy</TabsTrigger>
          <TabsTrigger value="custom">Custom Documents</TabsTrigger>
        </TabsList>

        {["terms", "privacy", "custom"].map((tab) => (
          <TabsContent key={tab} value={tab} className="space-y-4">
            {isEditing ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    {editingSetting ? "Edit" : "Create"} {tab === "terms" ? "Terms & Conditions" : tab === "privacy" ? "Privacy Policy" : "Custom Document"}
                  </CardTitle>
                  <CardDescription>
                    {editingSetting 
                      ? `Editing version ${editingSetting.version} of your ${tab === "terms" ? "terms and conditions" : tab === "privacy" ? "privacy policy" : "custom document"}.`
                      : `Create a new version of your ${tab === "terms" ? "terms and conditions" : tab === "privacy" ? "privacy policy" : "custom document"}.`
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="settingType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Setting Type</FormLabel>
                              <FormControl>
                                <Input {...field} disabled={tab !== "custom"} />
                              </FormControl>
                              <FormDescription>
                                Identifies the type of setting (e.g., terms, privacy)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                The display title for this document
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="version"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Version</FormLabel>
                              <FormControl>
                                <Input {...field} />
                              </FormControl>
                              <FormDescription>
                                Document version (e.g., 1.0, 2.1)
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <FormField
                            control={form.control}
                            name="isActive"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Active</FormLabel>
                                  <FormDescription>
                                    Make this document active and visible to users
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
                            name="requiresAcceptance"
                            render={({ field }) => (
                              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                <div className="space-y-0.5">
                                  <FormLabel>Requires Acceptance</FormLabel>
                                  <FormDescription>
                                    Users must accept this document to use the platform
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
                      </div>

                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Content (Markdown)</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                rows={15}
                                className="font-mono"
                                placeholder="# Document Title

## Section 1
Your content here...

## Section 2
More content here..."
                              />
                            </FormControl>
                            <FormDescription>
                              Content supports markdown formatting. Use # for headings, * for bullets, etc.
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2">
                        <Button type="button" variant="outline" onClick={handlePreview}>
                          <Eye className="h-4 w-4 mr-2" />
                          Preview
                        </Button>
                        <Button type="button" variant="outline" onClick={handleCancel}>
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          disabled={createMutation.isPending || updateMutation.isPending}
                        >
                          {(createMutation.isPending || updateMutation.isPending) ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Saving...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4 mr-2" />
                              {editingSetting ? "Update" : "Create"}
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            ) : (
              renderSettingsList()
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl h-[80vh]">
          <DialogHeader>
            <DialogTitle>{form.getValues('title')} - Preview</DialogTitle>
            <DialogDescription>Version: {form.getValues('version')}</DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-full mt-4 p-4">
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {/* Here we would normally use a Markdown renderer. For now, display as preformatted text */}
              <pre className="whitespace-pre-wrap font-sans text-sm">
                {form.getValues('content')}
              </pre>
            </div>
          </ScrollArea>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
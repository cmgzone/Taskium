import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AdContent } from "@/components/mining/ad-display";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Edit, Trash2, Eye, AlertCircle, Check, Upload } from "lucide-react";
import { Label } from "@/components/ui/label";

// Schema for ad form
const adFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  htmlContent: z.string().optional(),
  active: z.boolean().default(true),
  displayDuration: z.number().min(3, "Duration must be at least 3 seconds").max(60, "Duration must be at most 60 seconds"),
  priority: z.number().min(1).max(10),
  customBackground: z.string().optional(),
  customTextColor: z.string().optional(),
  customButtonColor: z.string().optional(),
  buttonText: z.string().optional(),
  // Removed location field as it doesn't exist in the database schema
  placement: z.array(z.string()).default(["sidebar"]),
  targetAudience: z.array(z.string()).default(["all"]),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

type AdFormValues = z.infer<typeof adFormSchema>;

export default function AdManagementNew() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<AdContent | null>(null);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [adTab, setAdTab] = useState<string>("list");

  // Query to get all ads
  const { data: ads = [], isLoading } = useQuery<AdContent[]>({
    queryKey: ["/api/admin/ads"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/ads");
      return await res.json();
    }
  });

  // Mutation to create a new ad
  const createAdMutation = useMutation({
    mutationFn: async (data: AdFormValues) => {
      // Handle file upload first if exists
      let imageUrl = data.imageUrl;
      if (fileUpload) {
        try {
          const formData = new FormData();
          formData.append('file', fileUpload);
          
          // Use direct fetch for FormData upload instead of apiRequest
          const uploadRes = await fetch("/api/admin/upload/ad-image", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          
          if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error("Upload failed:", errorText);
            throw new Error(`Failed to upload image: ${uploadRes.status} ${errorText}`);
          }
          
          const uploadData = await uploadRes.json();
          console.log("Upload successful:", uploadData);
          imageUrl = uploadData.imageUrl;
        } catch (error) {
          console.error("Error during file upload:", error);
          throw new Error(`File upload failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // Transform snake_case column names to camelCase property names for database compatibility
      const transformedData = {
        title: data.title,
        description: data.description,
        imageUrl: imageUrl, // Changed from image_url to match schema.ts property name
        linkUrl: data.linkUrl, // Changed from link_url to match schema.ts property name
        htmlContent: data.htmlContent, // Changed from html_content to match schema.ts property name
        active: data.active,
        displayDuration: data.displayDuration, // Changed from display_duration to match schema.ts property name
        priority: data.priority,
        customBackground: data.customBackground, // Changed from custom_background to match schema.ts property name
        customTextColor: data.customTextColor, // Changed from custom_text_color to match schema.ts property name
        customButtonColor: data.customButtonColor, // Changed from custom_button_color to match schema.ts property name
        buttonText: data.buttonText, // Changed from button_text to match schema.ts property name
        // Removed location field as it doesn't exist in the database schema
        placement: data.placement,
        targetAudience: data.targetAudience, // Changed from target_audience to match schema.ts property name
        startDate: data.startDate, // Changed from start_date to match schema.ts property name
        endDate: data.endDate, // Changed from end_date to match schema.ts property name
        status: 'active',
        isUserAd: false, // Changed from is_user_ad to match schema.ts property name
        reviewStatus: 'approved', // Changed from review_status to match schema.ts property name
        approved: true,
        paymentStatus: 'paid', // Changed from payment_status to match schema.ts property name
        priceTSK: 0, // Admin ads don't require payment, changed from price_tsk to match schema.ts property name
        paidAt: new Date().toISOString(), // Changed from paid_at to match schema.ts property name
        expiresAt: data.endDate ? new Date(data.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Changed from expires_at to match schema.ts property name
      };

      const res = await apiRequest("POST", "/api/admin/ads", transformedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      setIsAddDialogOpen(false);
      setFileUpload(null);
      toast({
        title: "Ad created",
        description: "The ad has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create ad",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to update an ad
  const updateAdMutation = useMutation({
    mutationFn: async (data: AdFormValues & { id: number }) => {
      const { id, ...formData } = data;
      
      // Handle file upload first if exists
      let imageUrl = formData.imageUrl;
      if (fileUpload) {
        try {
          const formData = new FormData();
          formData.append('file', fileUpload);
          
          // Use direct fetch for FormData upload instead of apiRequest
          const uploadRes = await fetch("/api/admin/upload/ad-image", {
            method: "POST",
            body: formData,
            credentials: "include"
          });
          
          if (!uploadRes.ok) {
            const errorText = await uploadRes.text();
            console.error("Upload failed:", errorText);
            throw new Error(`Failed to upload image: ${uploadRes.status} ${errorText}`);
          }
          
          const uploadData = await uploadRes.json();
          console.log("Upload successful:", uploadData);
          imageUrl = uploadData.imageUrl;
        } catch (error) {
          console.error("Error during file upload:", error);
          throw new Error(`File upload failed: ${error instanceof Error ? error.message : String(error)}`);
        }
      }
      
      // Transform snake_case column names to camelCase property names for database compatibility
      const transformedData = {
        title: formData.title,
        description: formData.description,
        imageUrl: imageUrl, // Changed from image_url to match schema.ts property name
        linkUrl: formData.linkUrl, // Changed from link_url to match schema.ts property name
        htmlContent: formData.htmlContent, // Changed from html_content to match schema.ts property name
        active: formData.active,
        displayDuration: formData.displayDuration, // Changed from display_duration to match schema.ts property name
        priority: formData.priority,
        customBackground: formData.customBackground, // Changed from custom_background to match schema.ts property name
        customTextColor: formData.customTextColor, // Changed from custom_text_color to match schema.ts property name
        customButtonColor: formData.customButtonColor, // Changed from custom_button_color to match schema.ts property name
        buttonText: formData.buttonText, // Changed from button_text to match schema.ts property name
        // Removed location field as it doesn't exist in the database schema
        placement: formData.placement,
        targetAudience: formData.targetAudience, // Changed from target_audience to match schema.ts property name
        startDate: formData.startDate, // Changed from start_date to match schema.ts property name
        endDate: formData.endDate, // Changed from end_date to match schema.ts property name
        reviewStatus: 'approved', // Changed from review_status to match schema.ts property name
        approved: true,
        paymentStatus: 'paid', // Changed from payment_status to match schema.ts property name
        expiresAt: formData.endDate ? new Date(formData.endDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Changed from expires_at to match schema.ts property name
      };
      
      const res = await apiRequest("PATCH", `/api/admin/ads/${id}`, transformedData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Ad updated",
        description: "The ad has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update ad",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to delete an ad
  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/ads/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate all related queries
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/content/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      // Force refetch
      queryClient.refetchQueries({ queryKey: ["/api/content/ads"] });
      
      setIsDeleteDialogOpen(false);
      toast({
        title: "Ad deleted",
        description: "The ad has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete ad",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      // Create a new FormData object
      const formData = new FormData();
      // Append the file with the correct field name 'file'
      formData.append("file", file);
      
      console.log("Uploading file:", file.name, "Size:", file.size, "Type:", file.type);
      
      // Use fetch directly for file uploads with proper headers
      const res = await fetch("/api/admin/upload/ad-image", {
        method: "POST",
        body: formData,
        credentials: "same-origin", // Include cookies for authentication
        // Don't manually set Content-Type for multipart/form-data
      });
      
      if (!res.ok) {
        const errorText = await res.text();
        console.error("Upload failed:", errorText);
        throw new Error(`Failed to upload file: ${res.status} ${errorText}`);
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        console.log("Upload successful, image URL:", data.imageUrl);
        if (isAddDialogOpen) {
          addForm.setValue("imageUrl", data.imageUrl);
        } else if (isEditDialogOpen && selectedAd) {
          editForm.setValue("imageUrl", data.imageUrl);
        }
        
        toast({
          title: "Image uploaded",
          description: "The image has been uploaded successfully",
        });
      }
    },
    onError: (error: Error) => {
      console.error("Upload mutation error:", error);
      toast({
        title: "Failed to upload image",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add form
  const addForm = useForm<AdFormValues>({
    resolver: zodResolver(adFormSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      htmlContent: "",
      active: true,
      displayDuration: 5,
      priority: 5,
      customBackground: "",
      customTextColor: "",
      customButtonColor: "",
      buttonText: "Learn More",
      // Removed location field as it doesn't exist in the database schema
      placement: ["sidebar"],
      targetAudience: ["all"],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  // Edit form
  const editForm = useForm<AdFormValues & { id: number }>({
    resolver: zodResolver(adFormSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      htmlContent: "",
      active: true,
      displayDuration: 5,
      priority: 5,
      customBackground: "",
      customTextColor: "",
      customButtonColor: "",
      buttonText: "Learn More",
      // Removed location field as it doesn't exist in the database schema
      placement: ["sidebar"],
      targetAudience: ["all"],
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }
  });

  // Handle add form submission
  const onAddSubmit = (data: AdFormValues) => {
    createAdMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: AdFormValues & { id: number }) => {
    updateAdMutation.mutate(data);
  };

  // Handle delete confirmation
  const onDeleteConfirm = () => {
    if (selectedAd) {
      deleteAdMutation.mutate(selectedAd.id);
    }
  };

  // Handle image upload
  const handleImageUpload = () => {
    if (fileUpload) {
      uploadFileMutation.mutate(fileUpload);
    }
  };

  // Setup for editing
  const setupEditDialog = (ad: AdContent) => {
    setSelectedAd(ad);
    editForm.reset({
      id: ad.id,
      title: ad.title,
      description: ad.description || "",
      imageUrl: ad.imageUrl || "",
      linkUrl: ad.linkUrl || "",
      htmlContent: ad.htmlContent || "",
      active: ad.active,
      displayDuration: ad.displayDuration,
      priority: ad.priority,
      customBackground: ad.customBackground || "",
      customTextColor: ad.customTextColor || "",
      customButtonColor: ad.customButtonColor || "",
      buttonText: ad.buttonText || "Learn More",
      // Removed location field as it doesn't exist in the database schema
      placement: ad.placement || ["sidebar"],
      targetAudience: ad.targetAudience || ["all"],
      startDate: ad.startDate ? new Date(ad.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      endDate: ad.endDate ? new Date(ad.endDate).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
    setIsEditDialogOpen(true);
  };

  // Setup for preview
  const setupPreviewDialog = (ad: AdContent) => {
    setSelectedAd(ad);
    setIsPreviewDialogOpen(true);
  };

  // Setup for delete
  const setupDeleteDialog = (ad: AdContent) => {
    setSelectedAd(ad);
    setIsDeleteDialogOpen(true);
  };

  // Handle dialog close and reset forms
  const handleAddDialogClose = () => {
    addForm.reset();
    setFileUpload(null);
    setIsAddDialogOpen(false);
  };

  const handleEditDialogClose = () => {
    editForm.reset();
    setFileUpload(null);
    setIsEditDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Ad Management</h2>
      </div>

      <Tabs value={adTab} onValueChange={setAdTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Ad List</TabsTrigger>
          <TabsTrigger value="create">Create New Ad</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Ad Manager</CardTitle>
                  <CardDescription>
                    Manage all advertisements that appear in the application
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Ad
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : ads.length === 0 ? (
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-medium text-lg mb-2">No Ads Available</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no ads in the system. Create your first ad to get started.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Ad
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ads.map((ad) => (
                        <TableRow key={ad.id}>
                          <TableCell className="font-medium">{ad.title}</TableCell>
                          <TableCell>
                            {ad.active ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>{ad.priority}</TableCell>
                          <TableCell>{ad.displayDuration}s</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setupPreviewDialog(ad)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setupEditDialog(ad)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setupDeleteDialog(ad)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Create New Ad</CardTitle>
              <CardDescription>
                Fill out the form below to create a new advertisement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...addForm}>
                <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                  <FormField
                    control={addForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Ad Title" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Short description of this ad"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-2">
                    <Label>Image Upload</Label>
                    <div className="flex flex-col gap-2">
                      <Input
                        type="file"
                        accept="image/png,image/jpeg,image/gif"
                        onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          onClick={handleImageUpload}
                          disabled={!fileUpload || uploadFileMutation.isPending}
                          className="flex items-center"
                        >
                          {uploadFileMutation.isPending ? (
                            <>
                              <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Image
                            </>
                          )}
                        </Button>
                        {addForm.watch("imageUrl") && (
                          <div className="text-sm text-green-600 flex items-center">
                            <Check className="h-4 w-4 mr-1" />
                            Image uploaded successfully
                          </div>
                        )}
                      </div>
                      {addForm.watch("imageUrl") && (
                        <div className="mt-2 border rounded p-2">
                          <img 
                            src={addForm.watch("imageUrl")} 
                            alt="Ad preview" 
                            className="max-h-32 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="displayDuration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="3"
                              max="60"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              max="10"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Higher priority ads are shown more frequently
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={addForm.control}
                    name="active"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            Active Status
                          </FormLabel>
                          <FormDescription>
                            Enable or disable this ad immediately
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
                  
                  <div className="flex justify-end pt-4">
                    <Button type="submit" disabled={createAdMutation.isPending}>
                      {createAdMutation.isPending ? (
                        <><div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div> Creating...</>
                      ) : (
                        'Create Ad'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Ad Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={handleAddDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add New Ad</DialogTitle>
            <DialogDescription>
              Create a new ad to display during mining sessions
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Ad Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Short description of this ad"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label>Image Upload</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                  />
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={!fileUpload || uploadFileMutation.isPending}
                  >
                    Upload
                  </Button>
                </div>
              </div>
              
              <FormField
                control={addForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    <FormDescription>
                      This field will be populated automatically after uploading an image,
                      or you can enter a URL directly
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where users will be directed if they click on the ad
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="htmlContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML Content (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="<div>Custom HTML content</div>"
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Advanced: Add custom HTML content to your ad
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={addForm.control}
                  name="displayDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="3"
                          max="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority (1-10)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Higher = shown more often
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-2 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleAddDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createAdMutation.isPending}>
                  {createAdMutation.isPending ? "Creating..." : "Create Ad"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Ad Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Ad</DialogTitle>
            <DialogDescription>
              Modify the selected ad
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Ad Title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Short description of this ad"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-2">
                <Label>Image Upload</Label>
                <div className="flex gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setFileUpload(e.target.files?.[0] || null)}
                  />
                  <Button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={!fileUpload || uploadFileMutation.isPending}
                  >
                    Upload
                  </Button>
                </div>
              </div>
              
              <FormField
                control={editForm.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} />
                    </FormControl>
                    {field.value && (
                      <div className="mt-2">
                        <img
                          src={field.value}
                          alt="Ad preview"
                          className="rounded-md max-h-40 object-contain"
                        />
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="linkUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Link URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormDescription>
                      Where users will be directed if they click on the ad
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="htmlContent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>HTML Content (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="<div>Custom HTML content</div>"
                        className="font-mono text-sm"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Advanced: Add custom HTML content to your ad
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="displayDuration"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (seconds)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="3"
                          max="60"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority (1-10)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="10"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Higher = shown more often
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-end space-x-2 space-y-0 rounded-md border p-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>Active</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button variant="outline" type="button" onClick={handleEditDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateAdMutation.isPending}>
                  {updateAdMutation.isPending ? "Updating..." : "Update Ad"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      {selectedAd && (
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedAd.title}</DialogTitle>
              {selectedAd.description && (
                <DialogDescription>{selectedAd.description}</DialogDescription>
              )}
            </DialogHeader>
            
            <div className="flex flex-col space-y-4">
              {selectedAd.imageUrl && (
                <img
                  src={selectedAd.imageUrl}
                  alt={selectedAd.title}
                  className="rounded-md object-cover w-full max-h-64"
                />
              )}
              
              {selectedAd.htmlContent && (
                <div
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedAd.htmlContent }}
                />
              )}
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-muted-foreground">Duration: </span>
                <span className="font-medium">{selectedAd.displayDuration}s</span>
                <span className="mx-2">•</span>
                <span className="text-muted-foreground">Priority: </span>
                <span className="font-medium">{selectedAd.priority}</span>
              </div>
              
              {selectedAd.linkUrl && (
                <Button
                  variant="default"
                  onClick={() => window.open(selectedAd.linkUrl, '_blank')}
                >
                  Visit Link
                </Button>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Ad</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this ad? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedAd && (
            <div className="py-4">
              <h4 className="font-medium">{selectedAd.title}</h4>
              {selectedAd.description && (
                <p className="text-sm text-muted-foreground mt-1">{selectedAd.description}</p>
              )}
              
              {selectedAd.imageUrl && (
                <div className="mt-2">
                  <img
                    src={selectedAd.imageUrl}
                    alt={selectedAd.title}
                    className="rounded-md max-h-40 object-contain"
                  />
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteConfirm}
              disabled={deleteAdMutation.isPending}
            >
              {deleteAdMutation.isPending ? "Deleting..." : "Delete Ad"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
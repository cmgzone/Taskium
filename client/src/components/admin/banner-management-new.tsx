import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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
  DialogTitle,
  DialogTrigger
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
import { PlusCircle, Edit, Trash2, Eye, ImageIcon } from "lucide-react";
import { Label } from "@/components/ui/label";

// Banner schema definition
const bannerSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().optional(),
  imageUrl: z.string().min(5, "Image URL is required"),
  linkUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  placement: z.enum(["homepage", "dashboard", "mining", "marketplace", "wallet", "referrals"]),
  priority: z.number().min(1).max(10),
  active: z.boolean().default(true),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});

type BannerFormValues = z.infer<typeof bannerSchema>;

interface Banner {
  id: number;
  title: string;
  description: string | null;
  imageUrl: string;
  linkUrl: string | null;
  placement: string;
  priority: number;
  active: boolean;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export default function BannerManagementNew() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [fileUpload, setFileUpload] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<string>("list");

  // Query to get all banners
  const { data: banners = [], isLoading } = useQuery<Banner[]>({
    queryKey: ["/api/admin/banners"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/banners");
      return await res.json();
    }
  });

  // File upload mutation
  const uploadFileMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      
      const res = await fetch("/api/admin/upload/banner-image", {
        method: "POST",
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error("Failed to upload file");
      }
      
      return await res.json();
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        if (isAddDialogOpen) {
          addForm.setValue("imageUrl", data.imageUrl);
        } else if (isEditDialogOpen && selectedBanner) {
          editForm.setValue("imageUrl", data.imageUrl);
        }
        
        toast({
          title: "Image uploaded",
          description: "The image has been uploaded successfully",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to upload image",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to create a new banner
  const createBannerMutation = useMutation({
    mutationFn: async (data: BannerFormValues) => {
      const res = await apiRequest("POST", "/api/admin/banners", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setIsAddDialogOpen(false);
      toast({
        title: "Banner created",
        description: "The banner has been created successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create banner",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to update a banner
  const updateBannerMutation = useMutation({
    mutationFn: async (data: BannerFormValues & { id: number }) => {
      const { id, ...bannerData } = data;
      const res = await apiRequest("PATCH", `/api/admin/banners/${id}`, bannerData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setIsEditDialogOpen(false);
      toast({
        title: "Banner updated",
        description: "The banner has been updated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update banner",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Mutation to delete a banner
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/banners/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/banners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Banner deleted",
        description: "The banner has been deleted successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete banner",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Add form
  const addForm = useForm<BannerFormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      placement: "homepage",
      priority: 5,
      active: true,
      startDate: new Date().toISOString().split('T')[0],
      endDate: ""
    }
  });

  // Edit form
  const editForm = useForm<BannerFormValues & { id: number }>({
    resolver: zodResolver(bannerSchema.extend({ id: z.number() })),
    defaultValues: {
      id: 0,
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      placement: "homepage",
      priority: 5,
      active: true,
      startDate: "",
      endDate: ""
    }
  });

  // Handle add form submission
  const onAddSubmit = (data: BannerFormValues) => {
    createBannerMutation.mutate(data);
  };

  // Handle edit form submission
  const onEditSubmit = (data: BannerFormValues & { id: number }) => {
    updateBannerMutation.mutate(data);
  };

  // Handle delete confirmation
  const onDeleteConfirm = () => {
    if (selectedBanner) {
      deleteBannerMutation.mutate(selectedBanner.id);
    }
  };

  // Handle image upload
  const handleImageUpload = () => {
    if (fileUpload) {
      uploadFileMutation.mutate(fileUpload);
    }
  };

  // Setup for editing
  const setupEditDialog = (banner: Banner) => {
    setSelectedBanner(banner);
    editForm.reset({
      id: banner.id,
      title: banner.title,
      description: banner.description || "",
      imageUrl: banner.imageUrl,
      linkUrl: banner.linkUrl || "",
      placement: banner.placement as any,
      priority: banner.priority,
      active: banner.active,
      startDate: banner.startDate || "",
      endDate: banner.endDate || ""
    });
    setIsEditDialogOpen(true);
  };

  // Setup for preview
  const setupPreviewDialog = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsPreviewDialogOpen(true);
  };

  // Setup for delete
  const setupDeleteDialog = (banner: Banner) => {
    setSelectedBanner(banner);
    setIsDeleteDialogOpen(true);
  };

  // Reset forms when dialogs close
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

  // Get placement display name
  const getPlacementName = (placement: string) => {
    const placements: Record<string, string> = {
      homepage: "Home Page",
      dashboard: "Dashboard",
      mining: "Mining Page",
      marketplace: "Marketplace",
      wallet: "Wallet Page",
      referrals: "Referrals Page"
    };
    return placements[placement] || placement;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Banner Management</h2>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Banner List</TabsTrigger>
          <TabsTrigger value="create">Create New Banner</TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Banner Manager</CardTitle>
                  <CardDescription>
                    Manage promotional banners across the application
                  </CardDescription>
                </div>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add New Banner
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
                </div>
              ) : banners.length === 0 ? (
                <div className="text-center p-6 border rounded-lg">
                  <h3 className="font-medium text-lg mb-2">No Banners Available</h3>
                  <p className="text-muted-foreground mb-4">
                    There are no banners in the system. Create your first banner to get started.
                  </p>
                  <Button onClick={() => setIsAddDialogOpen(true)}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Create Banner
                  </Button>
                </div>
              ) : (
                <div className="border rounded-md">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Placement</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {banners.map((banner) => (
                        <TableRow key={banner.id}>
                          <TableCell className="font-medium">{banner.title}</TableCell>
                          <TableCell>{getPlacementName(banner.placement)}</TableCell>
                          <TableCell>
                            {banner.active ? (
                              <Badge variant="default" className="bg-green-500">Active</Badge>
                            ) : (
                              <Badge variant="outline">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>{banner.priority}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setupPreviewDialog(banner)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => setupEditDialog(banner)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="text-red-500 hover:text-red-700"
                                onClick={() => setupDeleteDialog(banner)}
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
              <CardTitle>Create New Banner</CardTitle>
              <CardDescription>
                Fill out the form below to create a new promotional banner
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
                          <Input placeholder="Banner Title" {...field} />
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
                            placeholder="Short description of this banner"
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
                          Where users will be directed if they click on the banner
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="placement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Placement</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a placement" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="homepage">Home Page</SelectItem>
                              <SelectItem value="dashboard">Dashboard</SelectItem>
                              <SelectItem value="mining">Mining Page</SelectItem>
                              <SelectItem value="marketplace">Marketplace</SelectItem>
                              <SelectItem value="wallet">Wallet Page</SelectItem>
                              <SelectItem value="referrals">Referrals Page</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Where the banner will be displayed
                          </FormDescription>
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
                            Higher priority banners are shown more prominently
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={addForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={addForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date (Optional)</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
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
                            Enable or disable this banner immediately
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
                    <Button type="submit" disabled={createBannerMutation.isPending}>
                      {createBannerMutation.isPending ? (
                        <><div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div> Creating...</>
                      ) : (
                        'Create Banner'
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Banner Preview</DialogTitle>
            <DialogDescription>
              Preview how this banner will appear to users
            </DialogDescription>
          </DialogHeader>
          
          {selectedBanner && (
            <div className="space-y-4">
              <div className="rounded-md overflow-hidden border">
                <img 
                  src={selectedBanner.imageUrl} 
                  alt={selectedBanner.title} 
                  className="w-full h-auto object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">{selectedBanner.title}</h3>
                {selectedBanner.description && (
                  <p className="text-muted-foreground">{selectedBanner.description}</p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Placement:</span> {getPlacementName(selectedBanner.placement)}
                </div>
                <div>
                  <span className="font-medium">Status:</span> {selectedBanner.active ? 'Active' : 'Inactive'}
                </div>
                <div>
                  <span className="font-medium">Priority:</span> {selectedBanner.priority}
                </div>
                {selectedBanner.linkUrl && (
                  <div className="col-span-2">
                    <span className="font-medium">Link:</span> <a href={selectedBanner.linkUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">{selectedBanner.linkUrl}</a>
                  </div>
                )}
                {selectedBanner.startDate && (
                  <div>
                    <span className="font-medium">Start Date:</span> {new Date(selectedBanner.startDate).toLocaleDateString()}
                  </div>
                )}
                {selectedBanner.endDate && (
                  <div>
                    <span className="font-medium">End Date:</span> {new Date(selectedBanner.endDate).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={handleEditDialogClose}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
            <DialogDescription>
              Make changes to the existing banner
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
                      <Input placeholder="Banner Title" {...field} />
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
                        placeholder="Short description of this banner"
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
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="placement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Placement</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a placement" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="homepage">Home Page</SelectItem>
                          <SelectItem value="dashboard">Dashboard</SelectItem>
                          <SelectItem value="mining">Mining Page</SelectItem>
                          <SelectItem value="marketplace">Marketplace</SelectItem>
                          <SelectItem value="wallet">Wallet Page</SelectItem>
                          <SelectItem value="referrals">Referrals Page</SelectItem>
                        </SelectContent>
                      </Select>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="endDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Active Status
                      </FormLabel>
                      <FormDescription>
                        Enable or disable this banner immediately
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
              
              <DialogFooter>
                <Button type="submit" disabled={updateBannerMutation.isPending}>
                  {updateBannerMutation.isPending ? (
                    <><div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div> Updating...</>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this banner?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedBanner && (
            <div className="py-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-md border flex items-center justify-center overflow-hidden">
                  <img 
                    src={selectedBanner.imageUrl} 
                    alt={selectedBanner.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";
                    }}
                  />
                </div>
                <div>
                  <h3 className="font-medium">{selectedBanner.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {getPlacementName(selectedBanner.placement)}
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="space-x-2">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onDeleteConfirm}
              disabled={deleteBannerMutation.isPending}
            >
              {deleteBannerMutation.isPending ? (
                <><div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div> Deleting...</>
              ) : (
                'Delete Banner'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2, PencilLine } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { insertEmbeddedAdSchema } from "@shared/schema";

// Schema for ads
const adSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
  linkUrl: z.string().url("Must be a valid URL").optional(),
  htmlContent: z.string().optional(),
  active: z.boolean().default(true),
  displayDuration: z.number().int().min(1).default(30),
  priority: z.number().int().min(1).max(10).default(5),
  placement: z.array(z.string()).default(['sidebar']),
  customBackground: z.string().optional(),
  customTextColor: z.string().optional(),
  customButtonColor: z.string().optional(),
  buttonText: z.string().optional(),
});

type AdFormData = z.infer<typeof adSchema>;

interface Ad {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  htmlContent?: string;
  active: boolean;
  displayDuration: number;
  priority: number;
  placement: string[];  // Changed from location to placement
  customBackground?: string;
  customTextColor?: string;
  customButtonColor?: string;
  buttonText?: string;
  createdAt: string;
  updatedAt: string;
}

interface Banner extends Ad {}

export default function AdManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("ads");
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [selectedBanner, setSelectedBanner] = useState<Banner | null>(null);
  const [adDialogOpen, setAdDialogOpen] = useState(false);
  const [bannerDialogOpen, setBannerDialogOpen] = useState(false);

  // Fetch ads
  const { data: ads = [], isLoading: adsLoading } = useQuery({
    queryKey: ["/api/ads"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ads");
      return await res.json();
    },
  });

  // Fetch banners
  const { data: banners = [], isLoading: bannersLoading } = useQuery({
    queryKey: ["/api/banners"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/banners");
      return await res.json();
    },
  });

  // Form for ads
  const adForm = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      htmlContent: "",
      active: true,
      displayDuration: 30,
      priority: 5,
      placement: ["sidebar"],
      buttonText: "Learn More"
    }
  });

  // Form for banners
  const bannerForm = useForm<AdFormData>({
    resolver: zodResolver(adSchema),
    defaultValues: {
      title: "",
      description: "",
      imageUrl: "",
      linkUrl: "",
      htmlContent: "",
      active: true,
      displayDuration: 30,
      priority: 5,
      placement: ["banner"],
      buttonText: "Learn More"
    }
  });

  // Reset form when selected ad changes
  useEffect(() => {
    if (selectedAd) {
      adForm.reset({
        title: selectedAd.title,
        description: selectedAd.description || "",
        imageUrl: selectedAd.imageUrl || "",
        linkUrl: selectedAd.linkUrl || "",
        htmlContent: selectedAd.htmlContent || "",
        active: selectedAd.active,
        displayDuration: selectedAd.displayDuration,
        priority: selectedAd.priority,
        placement: selectedAd.placement || ["sidebar"],
        customBackground: selectedAd.customBackground || "",
        customTextColor: selectedAd.customTextColor || "",
        customButtonColor: selectedAd.customButtonColor || "",
        buttonText: selectedAd.buttonText || "Learn More"
      });
    } else {
      adForm.reset({
        title: "",
        description: "",
        imageUrl: "",
        linkUrl: "",
        htmlContent: "",
        active: true,
        displayDuration: 30,
        priority: 5,
        placement: ["sidebar"],
        customBackground: "",
        customTextColor: "",
        customButtonColor: "",
        buttonText: "Learn More"
      });
    }
  }, [selectedAd, adForm]);

  // Reset form when selected banner changes
  useEffect(() => {
    if (selectedBanner) {
      bannerForm.reset({
        title: selectedBanner.title,
        description: selectedBanner.description || "",
        imageUrl: selectedBanner.imageUrl || "",
        linkUrl: selectedBanner.linkUrl || "",
        htmlContent: selectedBanner.htmlContent || "",
        active: selectedBanner.active,
        displayDuration: selectedBanner.displayDuration,
        priority: selectedBanner.priority,
        placement: selectedBanner.placement || ["banner"],
        customBackground: selectedBanner.customBackground || "",
        customTextColor: selectedBanner.customTextColor || "",
        customButtonColor: selectedBanner.customButtonColor || "",
        buttonText: selectedBanner.buttonText || "Learn More"
      });
    } else {
      bannerForm.reset({
        title: "",
        description: "",
        imageUrl: "",
        linkUrl: "",
        htmlContent: "",
        active: true,
        displayDuration: 30,
        priority: 5,
        placement: ["banner"],
        customBackground: "",
        customTextColor: "",
        customButtonColor: "",
        buttonText: "Learn More"
      });
    }
  }, [selectedBanner, bannerForm]);

  // Create/Update ad mutation
  const adMutation = useMutation({
    mutationFn: async (data: AdFormData) => {
      if (selectedAd) {
        // Update existing ad
        const res = await apiRequest("PATCH", `/api/ads/${selectedAd.id}`, data);
        return await res.json();
      } else {
        // Create new ad
        const res = await apiRequest("POST", "/api/ads", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      setAdDialogOpen(false);
      setSelectedAd(null);
      toast({
        title: selectedAd ? "Ad Updated" : "Ad Created",
        description: selectedAd 
          ? "The ad has been successfully updated." 
          : "A new ad has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Create/Update banner mutation
  const bannerMutation = useMutation({
    mutationFn: async (data: AdFormData) => {
      if (selectedBanner) {
        // Update existing banner
        const res = await apiRequest("PATCH", `/api/banners/${selectedBanner.id}`, data);
        return await res.json();
      } else {
        // Create new banner
        const res = await apiRequest("POST", "/api/banners", data);
        return await res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      setBannerDialogOpen(false);
      setSelectedBanner(null);
      toast({
        title: selectedBanner ? "Banner Updated" : "Banner Created",
        description: selectedBanner 
          ? "The banner has been successfully updated." 
          : "A new banner has been successfully created.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete ad mutation
  const deleteAdMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/ads/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ads"] });
      toast({
        title: "Ad Deleted",
        description: "The ad has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete banner mutation
  const deleteBannerMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/banners/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/banners"] });
      toast({
        title: "Banner Deleted",
        description: "The banner has been successfully deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmitAd = adForm.handleSubmit((data) => {
    adMutation.mutate(data);
  });

  const onSubmitBanner = bannerForm.handleSubmit((data) => {
    bannerMutation.mutate(data);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Ad Management</h2>
          <p className="text-muted-foreground">
            Manage all ads and banners that appear in the application
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full md:w-auto grid-cols-2">
          <TabsTrigger value="ads">Popup Ads</TabsTrigger>
          <TabsTrigger value="banners">Banner Ads</TabsTrigger>
        </TabsList>

        {/* Popup Ads Tab */}
        <TabsContent value="ads" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Popup Ads</h3>
            <Dialog open={adDialogOpen} onOpenChange={setAdDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setSelectedAd(null)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add New Ad
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>{selectedAd ? "Edit Ad" : "Create New Ad"}</DialogTitle>
                  <DialogDescription>
                    {selectedAd 
                      ? "Make changes to the existing ad." 
                      : "Fill the form below to create a new ad."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...adForm}>
                  <form onSubmit={onSubmitAd} className="space-y-4">
                    <FormField
                      control={adForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Ad title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={adForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Ad description" 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={adForm.control}
                        name="imageUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Image URL (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adForm.control}
                        name="linkUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={adForm.control}
                        name="placement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Placement</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange([value])} 
                              defaultValue={field.value?.[0] || "sidebar"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select placement" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sidebar">Sidebar</SelectItem>
                                <SelectItem value="banner">Banner (Homepage)</SelectItem>
                                <SelectItem value="notification">Notification</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={adForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority (1-10)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                max={10} 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                              />
                            </FormControl>
                            <FormDescription>
                              Higher priority ads appear more often
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={adForm.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Inactive ads will not be displayed
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
                      <Button type="submit" disabled={adMutation.isPending}>
                        {adMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {selectedAd ? "Update Ad" : "Create Ad"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {adsLoading ? (
              <div className="col-span-full flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : ads.length === 0 ? (
              <div className="col-span-full bg-muted/40 rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No ads found. Create a new ad to get started.</p>
              </div>
            ) : (
              ads.map((ad: Ad) => (
                <Card key={ad.id} className={`overflow-hidden ${!ad.active ? 'opacity-60' : ''}`}>
                  {ad.imageUrl && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={ad.imageUrl} 
                        alt={ad.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className={`text-lg ${!ad.active ? 'text-muted-foreground' : ''}`}>
                        {ad.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedAd(ad);
                            setAdDialogOpen(true);
                          }}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the ad "${ad.title}"?`)) {
                              deleteAdMutation.mutate(ad.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Placement: <span className="font-medium">{ad.placement?.join(', ') || 'sidebar'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Priority: <span className="font-medium">{ad.priority}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-1">
                    <div className="w-full text-xs text-muted-foreground flex justify-between items-center">
                      <span>Status: {ad.active ? 'Active' : 'Inactive'}</span>
                      {ad.linkUrl && (
                        <a 
                          href={ad.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visit Link
                        </a>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Banner Ads Tab */}
        <TabsContent value="banners" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold">Banner Ads</h3>
            <Dialog open={bannerDialogOpen} onOpenChange={setBannerDialogOpen}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setSelectedBanner(null)}
                  className="flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" /> Add New Banner
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>{selectedBanner ? "Edit Banner" : "Create New Banner"}</DialogTitle>
                  <DialogDescription>
                    {selectedBanner 
                      ? "Make changes to the existing banner." 
                      : "Fill the form below to create a new banner."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...bannerForm}>
                  <form onSubmit={onSubmitBanner} className="space-y-4">
                    <FormField
                      control={bannerForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Banner title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={bannerForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Banner description" 
                              {...field} 
                              rows={3}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={bannerForm.control}
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
                        control={bannerForm.control}
                        name="linkUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Link URL</FormLabel>
                            <FormControl>
                              <Input placeholder="https://example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={bannerForm.control}
                        name="placement"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Display Placement</FormLabel>
                            <Select 
                              onValueChange={(value) => field.onChange([value])} 
                              defaultValue={field.value?.[0] || "banner"}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select placement" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="banner">Banner (Homepage)</SelectItem>
                                <SelectItem value="sidebar">Sidebar</SelectItem>
                                <SelectItem value="notification">Notification</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={bannerForm.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority (1-10)</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min={1} 
                                max={10} 
                                {...field} 
                                onChange={(e) => field.onChange(parseInt(e.target.value, 10))}
                              />
                            </FormControl>
                            <FormDescription>
                              Higher priority banners appear more often
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={bannerForm.control}
                      name="active"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Active</FormLabel>
                            <FormDescription>
                              Inactive banners will not be displayed
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
                      <Button type="submit" disabled={bannerMutation.isPending}>
                        {bannerMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {selectedBanner ? "Update Banner" : "Create Banner"}
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {bannersLoading ? (
              <div className="col-span-full flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : banners.length === 0 ? (
              <div className="col-span-full bg-muted/40 rounded-lg p-6 text-center">
                <p className="text-muted-foreground">No banners found. Create a new banner to get started.</p>
              </div>
            ) : (
              banners.map((banner: Banner) => (
                <Card key={banner.id} className={`overflow-hidden ${!banner.active ? 'opacity-60' : ''}`}>
                  {banner.imageUrl && (
                    <div className="h-40 overflow-hidden">
                      <img 
                        src={banner.imageUrl} 
                        alt={banner.title} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  )}
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className={`text-lg ${!banner.active ? 'text-muted-foreground' : ''}`}>
                        {banner.title}
                      </CardTitle>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => {
                            setSelectedBanner(banner);
                            setBannerDialogOpen(true);
                          }}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete the banner "${banner.title}"?`)) {
                              deleteBannerMutation.mutate(banner.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{banner.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">
                        Placement: <span className="font-medium">{banner.placement?.join(', ') || 'banner'}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Priority: <span className="font-medium">{banner.priority}</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-1">
                    <div className="w-full text-xs text-muted-foreground flex justify-between items-center">
                      <span>Status: {banner.active ? 'Active' : 'Inactive'}</span>
                      {banner.linkUrl && (
                        <a 
                          href={banner.linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          Visit Link
                        </a>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
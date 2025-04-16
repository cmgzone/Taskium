import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

// UI Components
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertTriangle, CalendarIcon, Link as LinkIcon, ImageIcon, PlusCircle, Info, Eye, ExternalLink, BarChart2, Trash2, RefreshCcw, CheckCircle2, XCircle } from "lucide-react";

// Form schema for creating/editing ads - matches database structure
const adFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(100, "Title must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(500, "Description must be less than 500 characters"),
  image_url: z.string().url("Please enter a valid URL").nullable().optional(),
  link_url: z.string().url("Please enter a valid URL").nullable().optional(),
  display_duration: z.number().min(5, "Display duration must be at least 5 seconds").default(30),
  html_content: z.string().optional().nullable(),
  button_text: z.string().optional().nullable(),
  custom_background: z.string().optional().nullable(),
  custom_text_color: z.string().optional().nullable(),
  custom_button_color: z.string().optional().nullable(),
  priority: z.number().min(1).max(10).default(1),
  // New fields for enhanced targeting
  placement: z.array(z.string()).default(['sidebar']),
  target_audience: z.array(z.string()).default(['all']),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
});

type AdFormValues = z.infer<typeof adFormSchema>;

// Interface for ad data - matches what the database returns
interface Ad {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  link_url?: string | null;
  display_duration?: number;
  priority?: number;
  html_content?: string | null;
  button_text?: string | null;
  custom_background?: string | null;
  custom_text_color?: string | null;
  custom_button_color?: string | null;
  active?: boolean;
  created_at: string;
  
  // Fields that may be added by the backend for compatibility
  userId?: number;
  placement?: string[] | string;  // New field replacing location
  tokenCost?: number;
  impressions?: number;
  clicks?: number;
  status?: string;
  paymentStatus?: string;
  target_audience?: string[] | string;
  start_date?: string;
  end_date?: string;
  
  // Legacy field (should be removed in future)
  location?: string;
  
  // Aliased properties for UI compatibility
  imageUrl?: string | null;
  linkUrl?: string | null;
  displayDuration?: number;
  htmlContent?: string | null;
  buttonText?: string | null;
  customBackground?: string | null;
  customTextColor?: string | null;
  customButtonColor?: string | null;
  createdAt?: string;
}

const DEFAULT_FORM_VALUES: Partial<AdFormValues> = {
  title: "",
  description: "",
  image_url: null,
  link_url: null,
  display_duration: 30,
  html_content: null,
  button_text: "Learn More",
  custom_background: null,
  custom_text_color: null,
  custom_button_color: null,
  priority: 1,
  placement: ['sidebar'],
  target_audience: ['all'],
  start_date: undefined,
  end_date: undefined
};

const AUDIENCE_OPTIONS = [
  { value: "all", label: "All Users" },
  { value: "miners", label: "Active Miners" },
  { value: "premium", label: "Premium Members" },
  { value: "marketplace", label: "Marketplace Users" },
  { value: "new", label: "New Users (< 30 days)" }
];

const PLACEMENT_OPTIONS = [
  { value: "banner", label: "Banner (Homepage)" },
  { value: "sidebar", label: "Sidebar" },
  { value: "notification", label: "Notification Style" },
];

export default function UserAdsManagement() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [adToDelete, setAdToDelete] = useState<number | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Initialize form with default values
  const form = useForm<AdFormValues>({
    resolver: zodResolver(adFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  // Fetch user's wallet balance for ad payments
  const { data: wallet } = useQuery({
    queryKey: ["/api/wallet/balance"],
    queryFn: async () => {
      const response = await fetch("/api/wallet/balance");
      if (!response.ok) throw new Error("Failed to fetch wallet balance");
      return response.json();
    },
  });

  // Fetch user's ads
  const { data: userAds, isLoading: adsLoading, refetch: refetchAds } = useQuery<Ad[]>({
    queryKey: ["/api/user/ads"],
    queryFn: async () => {
      const response = await fetch("/api/user/ads");
      if (!response.ok) throw new Error("Failed to fetch user ads");
      return response.json();
    },
  });

  // Create ad mutation
  const createAdMutation = useMutation({
    mutationFn: async (values: AdFormValues) => {
      return apiRequest("POST", "/api/user/ads", values);
    },
    onSuccess: () => {
      toast({
        title: "Advertisement Created",
        description: "Your ad has been submitted for review and will be live once approved.",
      });
      setCreateDialogOpen(false);
      form.reset(DEFAULT_FORM_VALUES);
      queryClient.invalidateQueries({ queryKey: ["/api/user/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Create Advertisement",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete ad mutation
  const deleteAdMutation = useMutation({
    mutationFn: async (adId: number) => {
      return apiRequest("DELETE", `/api/user/ads/${adId}`);
    },
    onSuccess: () => {
      toast({
        title: "Advertisement Deleted",
        description: "Your ad has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setAdToDelete(null);
      queryClient.invalidateQueries({ queryKey: ["/api/user/ads"] });
      queryClient.invalidateQueries({ queryKey: ["/api/wallet/balance"] });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Delete Advertisement",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: AdFormValues) => {
    // Fixed price of 10 TSK for all ads
    const adPrice = 10;
    
    if (wallet?.tskBalance < adPrice) {
      toast({
        title: "Insufficient Balance",
        description: `You need at least ${adPrice} TSK in your wallet to create this ad.`,
        variant: "destructive",
      });
      return;
    }
    
    createAdMutation.mutate(values);
  };

  // Delete an advertisement
  const handleDelete = (adId: number) => {
    setAdToDelete(adId);
    setDeleteDialogOpen(true);
  };

  // Confirm deletion
  const confirmDelete = () => {
    if (adToDelete) {
      deleteAdMutation.mutate(adToDelete);
    }
  };

  // Calculate CTR (Click-Through Rate)
  const calculateCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return "0%";
    return ((clicks / impressions) * 100).toFixed(2) + "%";
  };

  // Format date for display
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Get status badge color
  const getStatusBadge = (ad: Ad) => {
    // First try the status field
    if (ad.status) {
      switch (ad.status) {
        case "active":
          return <Badge className="bg-green-100 text-green-800">Active</Badge>;
        case "pending":
          return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
        case "rejected":
          return <Badge variant="destructive">Rejected</Badge>;
        case "expired":
          return <Badge variant="outline" className="bg-gray-100 text-gray-800">Expired</Badge>;
        default:
          return <Badge variant="outline">{ad.status}</Badge>;
      }
    }
    
    // If no status field, use the active field
    if (ad.active === true) {
      return <Badge className="bg-green-100 text-green-800">Active</Badge>;
    } else if (ad.active === false) {
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
    }
    
    // Default fallback
    return <Badge variant="outline">Pending</Badge>;
  };

  // Preview image URL
  const handlePreviewUrl = (url: string | null | undefined) => {
    if (!url) return;
    setPreviewUrl(url);
  };

  // This is a duplicate query and is already defined above
  // Removing it to fix the duplicate variable declaration

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advertising Center</h1>
          <p className="text-muted-foreground">
            Promote your products or services to the TSK community
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Card className="bg-primary/5">
            <CardContent className="p-4">
              <div className="text-sm font-medium">TSK Balance</div>
              <div className="text-2xl font-bold">
                {wallet ? `${wallet.tskBalance.toFixed(2)} TSK` : <Loader2 className="h-4 w-4 animate-spin" />}
              </div>
            </CardContent>
          </Card>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Create Ad
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Advertisement</DialogTitle>
                <DialogDescription>
                  Fill out the form below to create a new advertisement. All ads are subject to review before being published.
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter ad title (max 100 characters)" {...field} />
                        </FormControl>
                        <FormDescription>
                          Catchy and clear title for your advertisement.
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
                            placeholder="Enter ad description (max 500 characters)" 
                            {...field} 
                            className="min-h-[100px]"
                          />
                        </FormControl>
                        <FormDescription>
                          Detailed information about what you're advertising.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="image_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Image URL (Optional)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="https://example.com/image.jpg" {...field} value={field.value || ""} />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={() => handlePreviewUrl(field.value)}
                              disabled={!field.value}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormDescription className="flex items-center gap-1">
                            <ImageIcon className="h-3 w-3" />
                            Link to an image for your ad (recommended for banner ads)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="link_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Link URL (Optional)</FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input placeholder="https://yourdomain.com" {...field} value={field.value || ""} />
                            </FormControl>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => field.value && window.open(field.value, "_blank")}
                                    disabled={!field.value}
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Test link in new tab
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <FormDescription className="flex items-center gap-1">
                            <LinkIcon className="h-3 w-3" />
                            Where users will go when they click your ad
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="display_duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Display Duration (seconds)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={5}
                              max={120}
                              step={5}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              value={field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            How long your ad appears before rotating (in seconds)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Priority (1-10)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              step={1}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                              value={field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Higher priority ads may appear more frequently
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="button_text"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button Text (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Learn More" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Custom text for your ad's call-to-action button
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="html_content"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>HTML Content (Optional)</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="<p>Custom HTML content for your ad</p>" 
                              {...field} 
                              value={field.value || ""}
                              className="min-h-[100px]"
                            />
                          </FormControl>
                          <FormDescription>
                            Custom HTML content for more advanced ads
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="custom_background"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Color (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="#f3f4f6" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Hex color code for custom background
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="custom_text_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Text Color (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="#000000" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Hex color code for custom text color
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="custom_button_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Button Color (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="#3b82f6" {...field} value={field.value || ""} />
                          </FormControl>
                          <FormDescription>
                            Hex color code for button background
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Targeting Options</h3>
                    
                    {/* Placement Selection */}
                    <FormField
                      control={form.control}
                      name="placement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ad Placement</FormLabel>
                          <div className="space-y-2">
                            {PLACEMENT_OPTIONS.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`placement-${option.value}`}
                                  checked={field.value?.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...(field.value || []), option.value]);
                                    } else {
                                      field.onChange(field.value?.filter((value) => value !== option.value) || []);
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`placement-${option.value}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormDescription>
                            Choose where your advertisement will be displayed
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Target Audience Selection */}
                    <FormField
                      control={form.control}
                      name="target_audience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Audience</FormLabel>
                          <div className="space-y-2">
                            {AUDIENCE_OPTIONS.map((option) => (
                              <div key={option.value} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`audience-${option.value}`}
                                  checked={field.value?.includes(option.value)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      field.onChange([...(field.value || []), option.value]);
                                    } else {
                                      field.onChange(field.value?.filter((value) => value !== option.value) || []);
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`audience-${option.value}`}
                                  className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {option.label}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormDescription>
                            Select which user groups will see your ad
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Schedule Date Range */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="start_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Start Date (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a start date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={[{ before: new Date() }]}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When to start showing your ad (defaults to immediate)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="end_date"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>End Date (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className={cn(
                                      "pl-3 text-left font-normal",
                                      !field.value && "text-muted-foreground"
                                    )}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick an end date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={[
                                    { before: new Date() },
                                    (date) => {
                                      const startDate = form.getValues("start_date");
                                      return startDate ? date < startDate : false;
                                    }
                                  ]}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When to stop showing your ad (optional)
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                  
                  <Separator className="my-4" />
                  
                  <Alert className="mb-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Pricing Information</AlertTitle>
                    <AlertDescription>
                      All advertisements cost 10 TSK tokens and will remain active for 30 days, subject to review.
                    </AlertDescription>
                  </Alert>
                  
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={createAdMutation.isPending}>
                      {createAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Advertisement
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active Campaigns</TabsTrigger>
          <TabsTrigger value="all">All Campaigns</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-4">
          {adsLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !userAds || userAds.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No active campaigns</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  You don't have any active advertising campaigns. Create a new ad to start promoting your products or services.
                </p>
                <Button 
                  className="mt-6" 
                  variant="outline"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Ad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="relative overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ad Details</TableHead>
                    <TableHead>Campaign Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Performance</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userAds
                    .filter(ad => ad.active === true || (ad.status && (ad.status === "active" || ad.status === "pending")))
                    .map(ad => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{ad.title}</div>
                          <div className="text-muted-foreground text-sm truncate">{ad.description}</div>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {ad.placement ? (
                              Array.isArray(ad.placement) ? (
                                ad.placement.map((place: string, idx: number) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {place.charAt(0).toUpperCase() + place.slice(1)}
                                  </Badge>
                                ))
                              ) : (
                                <Badge variant="outline" className="text-xs">
                                  {typeof ad.placement === 'string' ? 
                                    ad.placement.charAt(0).toUpperCase() + ad.placement.slice(1) : 
                                    'Unknown'}
                                </Badge>
                              )
                            ) : null}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(ad.created_at)} - {formatDate(null)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(ad)}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Impressions:</span> 
                            <span>{(ad.impressions || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Clicks:</span> 
                            <span>{(ad.clicks || 0).toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">CTR:</span> 
                            <span>{calculateCTR(ad.impressions || 0, ad.clicks || 0)}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{ad.tokenCost || 10} TSK</div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => handleDelete(ad.id)}
                                  disabled={ad.status !== "pending"}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                {ad.status === "pending" ? "Cancel Ad" : "Ads in active state cannot be deleted"}
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="all" className="mt-4">
          {adsLoading ? (
            <div className="flex justify-center p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : !userAds || userAds.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Info className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-medium">No campaigns found</h3>
                <p className="text-muted-foreground mt-2 max-w-md mx-auto">
                  You haven't created any advertising campaigns yet. Create a new ad to start promoting your products or services.
                </p>
                <Button 
                  className="mt-6" 
                  variant="outline"
                  onClick={() => setCreateDialogOpen(true)}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Ad
                </Button>
              </CardContent>
            </Card>
          ) : (
            <>
              <div className="relative overflow-x-auto rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ad Details</TableHead>
                      <TableHead>Campaign Period</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Budget</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {userAds.map(ad => (
                      <TableRow key={ad.id}>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="font-medium truncate">{ad.title}</div>
                            <div className="text-muted-foreground text-sm truncate">{ad.description}</div>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {ad.placement ? (
                                Array.isArray(ad.placement) ? (
                                  ad.placement.map((place: string, idx: number) => (
                                    <Badge key={idx} variant="outline" className="text-xs">
                                      {place.charAt(0).toUpperCase() + place.slice(1)}
                                    </Badge>
                                  ))
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    {typeof ad.placement === 'string' ? 
                                      ad.placement.charAt(0).toUpperCase() + ad.placement.slice(1) : 
                                      'Unknown'}
                                  </Badge>
                                )
                              ) : null}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(ad.created_at)} - {formatDate(null)}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(ad)}
                          {(ad.status === "rejected" || (ad.active === false && ad.active !== undefined)) && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Info className="h-4 w-4 ml-1 text-muted-foreground cursor-help" />
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs">
                                  <p>This ad was rejected. Please contact support for more information.</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Impressions:</span> 
                              <span>{(ad.impressions || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Clicks:</span> 
                              <span>{(ad.clicks || 0).toLocaleString()}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CTR:</span> 
                              <span>{calculateCTR(ad.impressions || 0, ad.clicks || 0)}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{ad.tokenCost || 10} TSK</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="icon"
                                    onClick={() => handleDelete(ad.id)}
                                    disabled={ad.status !== "pending" && ad.status !== "rejected"}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {ad.status === "pending" || ad.status === "rejected" 
                                    ? "Delete Ad" 
                                    : "Only pending or rejected ads can be deleted"}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="flex justify-end mt-4">
                <Button variant="outline" size="sm" onClick={() => refetchAds()}>
                  <RefreshCcw className="mr-2 h-3 w-3" />
                  Refresh Data
                </Button>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
            <DialogDescription>
              Preview of the image that will be used in your advertisement.
            </DialogDescription>
          </DialogHeader>
          
          {previewUrl && (
            <div className="border rounded-md overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-auto max-h-[400px] object-contain"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/600x400?text=Image+Error";
                }}
              />
            </div>
          )}
          
          <DialogFooter>
            <Button onClick={() => setPreviewUrl(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Advertisement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this advertisement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={confirmDelete}
              disabled={deleteAdMutation.isPending}
            >
              {deleteAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
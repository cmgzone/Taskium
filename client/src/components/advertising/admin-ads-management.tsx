import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

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
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  Loader2, 
  AlertTriangle, 
  Eye, 
  ExternalLink, 
  BarChart2, 
  CheckCircle, 
  XCircle,
  User,
  DollarSign,
  Calendar,
  RefreshCcw
} from "lucide-react";

// Interfaces
interface Ad {
  id: number;
  userId: number;
  title: string;
  description: string;
  imageUrl: string | null;
  linkUrl: string | null;
  targetAudience: string[];
  placement: string[];
  startDate: string;
  endDate: string;
  status: string;
  impressions: number;
  clicks: number;
  priceTSK: number;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    role: string;
  };
}

interface RejectionData {
  adId: number;
  reason: string;
}

export default function AdminAdsManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch all ads for admin review
  const { data: allAds, isLoading: adsLoading, refetch: refetchAds } = useQuery<Ad[]>({
    queryKey: ["/api/admin/ads"],
    queryFn: async () => {
      const response = await fetch("/api/admin/ads");
      if (!response.ok) throw new Error("Failed to fetch ads");
      return response.json();
    },
  });

  // Approve ad mutation
  const approveAdMutation = useMutation({
    mutationFn: async (adId: number) => {
      return apiRequest("POST", `/api/admin/ads/${adId}/approve`);
    },
    onSuccess: () => {
      toast({
        title: "Advertisement Approved",
        description: "The advertisement has been approved and is now active.",
        variant: "success",
      });
      setDetailsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Reject ad mutation
  const rejectAdMutation = useMutation({
    mutationFn: async (data: RejectionData) => {
      return apiRequest("POST", `/api/admin/ads/${data.adId}/reject`, { reason: data.reason });
    },
    onSuccess: () => {
      toast({
        title: "Advertisement Rejected",
        description: "The advertisement has been rejected with feedback to the user.",
        variant: "success",
      });
      setRejectionDialogOpen(false);
      setDetailsDialogOpen(false);
      setRejectionReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ads"] });
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle viewing ad details
  const handleViewDetails = (ad: Ad) => {
    setSelectedAd(ad);
    setDetailsDialogOpen(true);
  };

  // Handle ad approval
  const handleApproveAd = () => {
    if (selectedAd) {
      approveAdMutation.mutate(selectedAd.id);
    }
  };

  // Handle ad rejection
  const handleRejectAd = () => {
    if (selectedAd) {
      setRejectionDialogOpen(true);
    }
  };

  // Submit rejection with reason
  const submitRejection = () => {
    if (selectedAd && rejectionReason.trim()) {
      rejectAdMutation.mutate({
        adId: selectedAd.id,
        reason: rejectionReason.trim()
      });
    } else {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejecting this advertisement.",
        variant: "destructive",
      });
    }
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMM d, yyyy");
  };

  // Get status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="success">Active</Badge>;
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending Review</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      case "expired":
        return <Badge variant="outline" className="bg-gray-100 text-gray-800">Expired</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Preview image URL
  const handlePreviewUrl = (url: string | null) => {
    if (!url) return;
    setPreviewUrl(url);
  };

  // Calculate CTR (Click-Through Rate)
  const calculateCTR = (impressions: number, clicks: number) => {
    if (impressions === 0) return "0%";
    return ((clicks / impressions) * 100).toFixed(2) + "%";
  };

  // Count ads by status
  const countAdsByStatus = (status: string) => {
    return allAds ? allAds.filter(ad => ad.status === status).length : 0;
  };

  // Calculate total TSK spent on ads
  const calculateTotalTskSpent = () => {
    if (!allAds) return 0;
    return allAds
      .filter(ad => ad.status === "active" || ad.status === "expired")
      .reduce((total, ad) => total + ad.priceTSK, 0);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Advertisement Management</h1>
        <p className="text-muted-foreground">
          Review and manage user-submitted advertisements
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countAdsByStatus("pending")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Advertisements waiting for approval
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Campaigns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{countAdsByStatus("active")}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Currently running ad campaigns
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total TSK Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculateTotalTskSpent()} TSK</div>
            <p className="text-xs text-muted-foreground mt-1">
              From all ad campaigns
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">Pending Review ({countAdsByStatus("pending")})</TabsTrigger>
          <TabsTrigger value="active">Active ({countAdsByStatus("active")})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({countAdsByStatus("rejected")})</TabsTrigger>
          <TabsTrigger value="all">All Ads</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-4">
          {renderAdTable(allAds?.filter(ad => ad.status === "pending") || [], adsLoading)}
        </TabsContent>
        
        <TabsContent value="active" className="mt-4">
          {renderAdTable(allAds?.filter(ad => ad.status === "active") || [], adsLoading)}
        </TabsContent>
        
        <TabsContent value="rejected" className="mt-4">
          {renderAdTable(allAds?.filter(ad => ad.status === "rejected") || [], adsLoading)}
        </TabsContent>
        
        <TabsContent value="all" className="mt-4">
          {renderAdTable(allAds || [], adsLoading)}
        </TabsContent>
      </Tabs>
      
      {/* Ad Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Advertisement Details</DialogTitle>
            <DialogDescription>
              Review advertisement content and details
            </DialogDescription>
          </DialogHeader>
          
          {selectedAd && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedAd.title}</h3>
                    <p className="text-muted-foreground">{selectedAd.description}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <User className="h-3.5 w-3.5" />
                        User
                      </div>
                      <p>{selectedAd.user?.username || `User ID: ${selectedAd.userId}`}</p>
                    </div>
                    
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5" />
                        Budget
                      </div>
                      <p>{selectedAd.priceTSK} TSK</p>
                    </div>
                    
                    <div>
                      <div className="font-medium flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        Campaign Period
                      </div>
                      <p>{formatDate(selectedAd.startDate)} - {formatDate(selectedAd.endDate)}</p>
                    </div>
                    
                    <div>
                      <div className="font-medium">Status</div>
                      <div>{getStatusBadge(selectedAd.status)}</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-medium">Target Audience</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedAd.targetAudience.map(audience => (
                        <Badge key={audience} variant="outline">
                          {audience === "all" ? "All Users" : 
                           audience === "miners" ? "Active Miners" : 
                           audience === "premium" ? "Premium Members" : 
                           audience === "marketplace" ? "Marketplace Users" : 
                           audience === "new" ? "New Users" : audience}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="font-medium">Ad Placement</div>
                    <div className="flex flex-wrap gap-1">
                      {selectedAd.placement.map(place => (
                        <Badge key={place} variant="outline">
                          {place.charAt(0).toUpperCase() + place.slice(1)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  {selectedAd.linkUrl && (
                    <div className="space-y-2">
                      <div className="font-medium flex items-center gap-1">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Link URL
                      </div>
                      <div className="flex items-center gap-2">
                        <code className="bg-muted p-1 rounded text-sm flex-1 truncate">
                          {selectedAd.linkUrl}
                        </code>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => window.open(selectedAd.linkUrl, "_blank")}
                        >
                          Visit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  {selectedAd.imageUrl ? (
                    <div className="space-y-2">
                      <div className="font-medium">Ad Image</div>
                      <div className="border rounded-md overflow-hidden">
                        <img 
                          src={selectedAd.imageUrl} 
                          alt={selectedAd.title} 
                          className="w-full h-auto object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/400x300?text=Image+Error";
                          }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="border rounded-md p-4 text-center h-full flex items-center justify-center">
                      <p className="text-muted-foreground text-sm">No image provided</p>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedAd.status === "active" && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Campaign Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Impressions</div>
                        <div className="text-xl font-bold">{selectedAd.impressions.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Clicks</div>
                        <div className="text-xl font-bold">{selectedAd.clicks.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">CTR</div>
                        <div className="text-xl font-bold">{calculateCTR(selectedAd.impressions, selectedAd.clicks)}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {selectedAd.status === "pending" && (
                <div className="pt-4 space-y-4 border-t">
                  <Alert variant="warning" className="bg-yellow-50">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Content Review Required</AlertTitle>
                    <AlertDescription>
                      Please review this advertisement for compliance with platform guidelines before approval.
                    </AlertDescription>
                  </Alert>
                  
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={handleRejectAd}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Reject
                    </Button>
                    <Button 
                      onClick={handleApproveAd}
                      disabled={approveAdMutation.isPending}
                    >
                      {approveAdMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      Approve
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Rejection Dialog */}
      <Dialog open={rejectionDialogOpen} onOpenChange={setRejectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Advertisement</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this advertisement. This feedback will be shared with the user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea 
              placeholder="Enter rejection reason..." 
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[120px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectionDialogOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={submitRejection}
              disabled={!rejectionReason.trim() || rejectAdMutation.isPending}
            >
              {rejectAdMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reject Advertisement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Image Preview Dialog */}
      <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Image Preview</DialogTitle>
          </DialogHeader>
          
          {previewUrl && (
            <div className="border rounded-md overflow-hidden">
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-auto max-h-[600px] object-contain"
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
    </div>
  );
  
  // Helper function to render ad table based on filtered data
  function renderAdTable(ads: Ad[], isLoading: boolean) {
    if (isLoading) {
      return (
        <div className="flex justify-center p-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (ads.length === 0) {
      return (
        <Card>
          <CardContent className="py-10 text-center">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <BarChart2 className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium">No advertisements found</h3>
            <p className="text-muted-foreground mt-2 max-w-md mx-auto">
              There are no advertisements in this category at the moment.
            </p>
          </CardContent>
        </Card>
      );
    }
    
    return (
      <>
        <div className="relative overflow-x-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad Details</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Campaign Period</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ads.map(ad => (
                <TableRow key={ad.id}>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium truncate">{ad.title}</div>
                      <div className="text-muted-foreground text-sm truncate">{ad.description}</div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {ad.placement.map(p => (
                          <Badge key={p} variant="outline" className="text-xs">
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ad.user?.username || `User ${ad.userId}`}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDate(ad.startDate)} - {formatDate(ad.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(ad.status)}
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">{ad.priceTSK} TSK</div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewDetails(ad)}
                    >
                      <Eye className="mr-2 h-3.5 w-3.5" />
                      Details
                    </Button>
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
    );
  }
}
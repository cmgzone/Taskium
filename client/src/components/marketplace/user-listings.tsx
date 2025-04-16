import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatTokenAmount } from "@/lib/contract-utils";
import { Trash2, AlertCircle, Loader2 } from "lucide-react";

interface MarketplaceItemMetadata {
  subcategory?: string;
  condition?: string;
  tags?: string[];
  features?: string[];
}

interface MarketplaceItem {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  metadata?: string;
  createdAt: string;
  approved: boolean;
  sold: boolean;
  parsedMetadata?: MarketplaceItemMetadata;
}

export default function UserListings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [itemToDelete, setItemToDelete] = useState<MarketplaceItem | null>(null);

  // Get user's marketplace listings
  const { data: listings = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/user/marketplace-listings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/user/marketplace-listings");
      const data = await res.json();
      
      // Parse metadata for each item
      return data.map((item: MarketplaceItem) => {
        if (item.metadata) {
          try {
            const parsedMetadata = JSON.parse(item.metadata);
            return { ...item, parsedMetadata };
          } catch (e) {
            console.error("Error parsing metadata for item:", item.id, e);
          }
        }
        return item;
      });
    },
  });

  // Delete marketplace item mutation
  const deleteMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("DELETE", `/api/marketplace/${itemId}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Item deleted",
        description: "Your marketplace listing has been deleted successfully",
      });
      
      // Reset state and refetch listings
      setItemToDelete(null);
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Error deleting item",
        description: error.message || "Failed to delete your listing",
        variant: "destructive",
      });
    },
  });

  // Get placeholder image based on category
  const getPlaceholderImage = (category: string) => {
    switch (category.toLowerCase()) {
      case 'digital':
        return 'https://cdn.iconscout.com/icon/premium/png-256-thumb/digital-media-5195328-4347340.png';
      case 'services':
        return 'https://cdn.iconscout.com/icon/premium/png-256-thumb/services-1522831-1290772.png';
      case 'physical':
        return 'https://cdn.iconscout.com/icon/premium/png-256-thumb/physical-product-5060246-4209459.png';
      case 'collectibles':
        return 'https://cdn.iconscout.com/icon/premium/png-256-thumb/collectible-5060245-4209458.png';
      default:
        return 'https://cdn.iconscout.com/icon/premium/png-256-thumb/marketplace-7037401-5739001.png';
    }
  };

  // Handle delete item request
  const handleDeleteClick = (item: MarketplaceItem) => {
    if (item.sold) {
      toast({
        title: "Cannot delete",
        description: "You cannot delete an item that has been sold",
        variant: "destructive",
      });
      return;
    }
    
    setItemToDelete(item);
  };

  // Confirm and execute delete
  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
    }
  };

  // Format relative time
  const getRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds} seconds ago`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    } else {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
  };

  // Get approval status badge
  const getApprovalBadge = (item: MarketplaceItem) => {
    if (item.sold) {
      return (
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
          Sold
        </span>
      );
    } else if (item.approved) {
      return (
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
          Approved
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
          Pending Approval
        </span>
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Your Marketplace Listings</h2>
      
      {listings.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 text-center">
          <div className="w-12 h-12 mx-auto bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="h-6 w-6 text-gray-500 dark:text-gray-400" />
          </div>
          <h3 className="text-lg font-medium mb-2">No listings found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            You haven't listed any items in the marketplace yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {listings.map((item: MarketplaceItem) => (
            <Card key={item.id} className="overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700">
                {item.imageUrl ? (
                  <img 
                    src={item.imageUrl} 
                    alt={item.title} 
                    className="w-full h-40 object-cover" 
                  />
                ) : (
                  <div className="w-full h-40 flex items-center justify-center">
                    <img 
                      src={getPlaceholderImage(item.category)} 
                      alt="Category icon" 
                      className="w-20 h-20 opacity-60"
                    />
                  </div>
                )}
              </div>
              
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                    {item.category}
                  </span>
                  {getApprovalBadge(item)}
                </div>
                
                <h3 className="font-medium text-lg mb-2 line-clamp-1">{item.title}</h3>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {item.description}
                </p>
                
                <div className="flex justify-between items-center mt-auto">
                  <span className="font-bold text-primary dark:text-blue-400">
                    {formatTokenAmount(item.price)} $TSK
                  </span>
                  
                  <div className="flex items-center space-x-2">
                    <Button 
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteClick(item)}
                      disabled={item.sold || deleteMutation.isPending}
                      className="h-9"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Listed {getRelativeTime(item.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog 
        open={itemToDelete !== null} 
        onOpenChange={(open) => !open && setItemToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Marketplace Listing</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{itemToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
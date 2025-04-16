import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";
import { Loader2 } from "lucide-react";

interface MarketplaceItemMetadata {
  subcategory?: string;
  condition?: string;
  tags?: string[];
  features?: string[];
}

interface MarketplaceItemProps {
  item: {
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
    // Enhanced properties
    featured?: boolean;
    rating?: number;
    reviewCount?: number;
    sellerName?: string;
    views?: number;
    specifications?: string;
    additionalImages?: string[];
  };
  onPurchaseSuccess?: () => void;
  condensed?: boolean; // For mobile view - renders a more compact version
}

export default function MarketplaceItem({ item, onPurchaseSuccess, condensed = false }: MarketplaceItemProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [metadata, setMetadata] = useState<MarketplaceItemMetadata | undefined>(item.parsedMetadata);
  
  // Format relative time (e.g., "2 hours ago")
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

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: async (itemId: number) => {
      const res = await apiRequest("POST", `/api/marketplace/${itemId}/buy`);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase successful!",
        description: `You have successfully purchased "${item.title}"`,
      });
      
      // Update user balance in cache
      const currentUser = queryClient.getQueryData<any>(["/api/user"]);
      if (currentUser) {
        queryClient.setQueryData(["/api/user"], {
          ...currentUser,
          tokenBalance: currentUser.tokenBalance - item.price
        });
      }
      
      // Close details dialog
      setIsDetailsOpen(false);
      
      // Notify parent of success
      if (onPurchaseSuccess) {
        onPurchaseSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePurchase = () => {
    // Check if user has enough tokens
    if ((user?.tokenBalance || 0) < item.price) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough tokens to purchase this item",
        variant: "destructive",
      });
      return;
    }
    
    // Prevent buying own item
    if (user?.id === item.sellerId) {
      toast({
        title: "Cannot purchase",
        description: "You cannot purchase your own listing",
        variant: "destructive",
      });
      return;
    }
    
    purchaseMutation.mutate(item.id);
  };

  // Get placeholder image based on category
  const getPlaceholderImage = () => {
    switch (item.category.toLowerCase()) {
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

  // Parse metadata if it exists and not already parsed
  useEffect(() => {
    if (item.metadata && !item.parsedMetadata && !metadata) {
      try {
        const parsedData = JSON.parse(item.metadata);
        setMetadata(parsedData);
      } catch (e) {
        console.error("Error parsing item metadata:", e);
      }
    }
  }, [item.metadata, item.parsedMetadata, metadata]);

  // Get human-readable condition name
  const getConditionName = (conditionId?: string) => {
    if (!conditionId) return null;
    
    const conditions: Record<string, string> = {
      new: "New",
      like_new: "Like New",
      good: "Good",
      fair: "Fair",
      poor: "Poor"
    };
    
    return conditions[conditionId] || conditionId;
  };

  return (
    <>
      {condensed ? (
        // Mobile-optimized condensed view 
        <Card 
          className="marketplace-item overflow-hidden hover:shadow-md transition-all"
          onClick={() => setIsDetailsOpen(true)}
        >
          <div className="h-28 bg-gray-100 dark:bg-gray-700">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img 
                  src={getPlaceholderImage()} 
                  alt="Category icon" 
                  className="w-12 h-12 opacity-60"
                />
              </div>
            )}
          </div>
          
          <CardContent className="p-2">
            <h3 className="font-medium text-sm mb-1 line-clamp-1">{item.title}</h3>
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-primary dark:text-blue-400 text-sm">
                {formatTokenAmount(item.price)}
              </span>
              <span className="text-xs text-gray-500 truncate">
                {getRelativeTime(item.createdAt).replace(' ago', '')}
              </span>
            </div>
          </CardContent>
        </Card>
      ) : (
        // Regular desktop view
        <Card className="marketplace-item overflow-hidden hover:shadow-md transition-all hover:-translate-y-1">
          <div className="aspect-w-16 aspect-h-9 bg-gray-100 dark:bg-gray-700 relative">
            {item.imageUrl ? (
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <img 
                  src={getPlaceholderImage()} 
                  alt="Category icon" 
                  className="w-20 h-20 opacity-60"
                />
              </div>
            )}
            
            {/* Featured badge if item is featured */}
            {item.featured && (
              <div className="absolute top-2 right-2 bg-primary text-white text-xs px-2 py-1 rounded-full">
                Featured
              </div>
            )}
          </div>
          
          <CardContent className="p-4">
            <div className="flex justify-between mb-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{item.category}</span>
              <span className="text-xs font-medium text-primary dark:text-blue-400">{getRelativeTime(item.createdAt)}</span>
            </div>
            
            <h3 className="font-medium text-lg mb-2 line-clamp-1">{item.title}</h3>
            
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {item.description}
            </p>
            
            {/* Show rating if available */}
            {item.rating > 0 && (
              <div className="flex items-center mb-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star} 
                      className={`w-4 h-4 ${star <= Math.round(item.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20" 
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                    </svg>
                  ))}
                </div>
                <span className="text-xs text-gray-500 ml-1">
                  ({item.reviewCount || 0})
                </span>
              </div>
            )}
            
            {/* Seller name if available */}
            {item.sellerName && (
              <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Seller: {item.sellerName}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <span className="font-bold text-lg text-primary dark:text-blue-400">
                {formatTokenAmount(item.price)} $TSK
              </span>
              
              <Button 
                className="py-2 px-3 text-sm"
                onClick={() => setIsDetailsOpen(true)}
              >
                View Details
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Item Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{item.title}</DialogTitle>
            <DialogDescription>
              Listed {getRelativeTime(item.createdAt)} in {item.category}
              {metadata?.subcategory && ` › ${metadata.subcategory}`}
            </DialogDescription>
          </DialogHeader>
          
          {item.imageUrl && (
            <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
              <img 
                src={item.imageUrl} 
                alt={item.title} 
                className="w-full h-full object-contain" 
              />
            </div>
          )}
          
          <div className="space-y-4">
            {/* Image Gallery */}
            {item.additionalImages && item.additionalImages.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-1">Additional Images</h4>
                <div className="grid grid-cols-3 gap-2">
                  {item.additionalImages.map((imageUrl, idx) => (
                    <div key={idx} className="h-16 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                      <img 
                        src={imageUrl} 
                        alt={`${item.title} - image ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Description */}
            <div>
              <h4 className="text-sm font-medium">Description</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {item.description}
              </p>
            </div>
            
            {/* Rating */}
            {item.rating > 0 && (
              <div>
                <h4 className="text-sm font-medium">Rating</h4>
                <div className="flex items-center mt-1">
                  <div className="flex mr-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg 
                        key={star} 
                        className={`w-5 h-5 ${star <= Math.round(item.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                        fill="currentColor" 
                        viewBox="0 0 20 20" 
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {item.rating.toFixed(1)} ({item.reviewCount || 0} reviews)
                  </span>
                </div>
              </div>
            )}
            
            {/* Item Details */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {/* Category */}
              <div>
                <h4 className="font-medium">Category</h4>
                <p className="text-gray-600 dark:text-gray-400">
                  {item.category}
                </p>
              </div>
              
              {/* Subcategory (if exists) */}
              {metadata?.subcategory && (
                <div>
                  <h4 className="font-medium">Subcategory</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {metadata.subcategory}
                  </p>
                </div>
              )}
              
              {/* Condition (if exists) */}
              {metadata?.condition && (
                <div>
                  <h4 className="font-medium">Condition</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {getConditionName(metadata.condition)}
                  </p>
                </div>
              )}
              
              {/* Seller */}
              {item.sellerName && (
                <div>
                  <h4 className="font-medium">Seller</h4>
                  <p className="text-gray-600 dark:text-gray-400">
                    {item.sellerName}
                  </p>
                </div>
              )}
            </div>
            
            {/* Features (if exists) */}
            {metadata?.features && metadata.features.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">Features</h4>
                <ul className="list-disc pl-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {metadata.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Specifications (if exists) */}
            {item.specifications && (
              <div>
                <h4 className="text-sm font-medium">Specifications</h4>
                <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {(() => {
                    try {
                      const specs = JSON.parse(item.specifications);
                      return (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                          {Object.entries(specs).map(([key, value]) => (
                            <div key={key} className="contents">
                              <div className="font-medium">{key}:</div>
                              <div>{String(value)}</div>
                            </div>
                          ))}
                        </div>
                      );
                    } catch (e) {
                      return <p>{item.specifications}</p>;
                    }
                  })()}
                </div>
              </div>
            )}
            
            {/* Tags (if exists) */}
            {metadata?.tags && metadata.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-medium">Tags</h4>
                <div className="flex flex-wrap gap-1 mt-1">
                  {metadata.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Views count */}
            {item.views > 0 && (
              <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                {item.views} views
              </div>
            )}
            
            {/* Price */}
            <div>
              <h4 className="text-sm font-medium">Price</h4>
              <p className="text-xl font-bold text-primary dark:text-blue-400 mt-1">
                {formatTokenAmount(item.price)} $TSK
              </p>
            </div>
            
            {/* Purchase warnings/notices */}
            {user?.id === item.sellerId ? (
              <div className="bg-yellow-100 dark:bg-yellow-900 p-3 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  This is your own listing. You cannot purchase it.
                </p>
              </div>
            ) : (user?.tokenBalance || 0) < item.price ? (
              <div className="bg-red-100 dark:bg-red-900 p-3 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">
                  You don't have enough tokens to purchase this item.
                  You need {formatTokenAmount(item.price - (user?.tokenBalance || 0))} more $TSK.
                </p>
              </div>
            ) : null}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsDetailsOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handlePurchase}
              disabled={
                purchaseMutation.isPending || 
                user?.id === item.sellerId || 
                (user?.tokenBalance || 0) < item.price
              }
            >
              {purchaseMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Purchase Now'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

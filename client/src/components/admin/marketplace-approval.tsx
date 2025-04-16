import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";
import { Loader2, Search, Check, X, Eye, Trash2 } from "lucide-react";

interface MarketplaceItem {
  id: number;
  sellerId: number;
  title: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  createdAt: string;
  approved: boolean;
  sold: boolean;
}

export default function MarketplaceApproval() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<MarketplaceItem | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MarketplaceItem | null>(null);
  const [showAll, setShowAll] = useState(false);

  // Fetch marketplace items
  const { data: items = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/admin/marketplace"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/marketplace");
      return await res.json();
    }
  });

  // Approve/deny mutation
  const approvalMutation = useMutation({
    mutationFn: async ({ id, approved }: { id: number, approved: boolean }) => {
      const res = await apiRequest("PATCH", `/api/admin/marketplace/${id}/approve`, { approved });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Status updated",
        description: "The item status has been updated successfully.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/marketplace/${id}`);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Item deleted",
        description: "The marketplace item has been deleted successfully.",
      });
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Deletion failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Filter items based on search query and show all toggle
  const filteredItems = items.filter((item: MarketplaceItem) => {
    // First apply the search filter
    const matchesSearch = !searchQuery || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Then apply the showAll filter
    return matchesSearch && (showAll || !item.approved);
  });

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  // Handle view item details
  const handleViewItem = (item: MarketplaceItem) => {
    setSelectedItem(item);
    setViewDialogOpen(true);
  };

  // Handle approve/deny
  const handleApproval = (id: number, approved: boolean) => {
    approvalMutation.mutate({ id, approved });
  };
  
  // Handle delete item
  const handleDeleteItem = (item: MarketplaceItem) => {
    setItemToDelete(item);
  };
  
  // Confirm delete item
  const confirmDeleteItem = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete.id);
      setItemToDelete(null);
      
      // If the item being deleted is the currently selected item, close the view dialog
      if (selectedItem && selectedItem.id === itemToDelete.id) {
        setViewDialogOpen(false);
      }
    }
  };

  return (
    <div className="w-full px-2 sm:px-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
        <h2 className="text-xl font-semibold">Marketplace Listings</h2>
        
        <div className="relative w-full md:w-64">
          <Input 
            type="text" 
            placeholder="Search listings..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        </div>
      </div>
      
      <div className="flex items-center mb-4 justify-between space-x-2">
        <Label htmlFor="show-all-toggle" className="cursor-pointer text-sm">
          {showAll ? "Showing all items" : "Showing pending items only"}
        </Label>
        <Switch
          id="show-all-toggle"
          checked={showAll}
          onCheckedChange={setShowAll}
        />
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Desktop view - table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Item</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Category</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date Listed</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item: MarketplaceItem) => (
                    <tr key={item.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium">{item.title}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {item.category}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        {formatTokenAmount(item.price)} TSK
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(item.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={item.approved ? "success" : "secondary"}>
                          {item.approved ? "Approved" : "Pending"}
                        </Badge>
                        {item.sold && (
                          <Badge variant="outline" className="ml-2">
                            Sold
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleViewItem(item)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {!item.approved && !item.sold && (
                            <>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-green-500 hover:bg-green-500 hover:text-white"
                                onClick={() => handleApproval(item.id, true)}
                                disabled={approvalMutation.isPending}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="border-red-500 hover:bg-red-500 hover:text-white"
                                onClick={() => handleApproval(item.id, false)}
                                disabled={approvalMutation.isPending}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {item.approved && !item.sold && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleApproval(item.id, false)}
                              disabled={approvalMutation.isPending}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                          {!item.sold && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-red-500 hover:bg-red-500 hover:text-white"
                              onClick={() => handleDeleteItem(item)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                      No marketplace items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Mobile view - card layout */}
          <div className="grid grid-cols-1 gap-4 md:hidden">
            {filteredItems.length > 0 ? (
              filteredItems.map((item: MarketplaceItem) => (
                <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium truncate flex-1">{item.title}</h3>
                    <div className="flex space-x-1">
                      <Badge variant={item.approved ? "success" : "secondary"}>
                        {item.approved ? "Approved" : "Pending"}
                      </Badge>
                      {item.sold && (
                        <Badge variant="outline">Sold</Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-1 text-xs mb-3">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Category:</span> {item.category}
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Price:</span> {formatTokenAmount(item.price)} TSK
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 dark:text-gray-400">Listed:</span> {formatDate(item.createdAt)}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleViewItem(item)}
                    >
                      <Eye className="h-4 w-4 mr-1" /> View
                    </Button>
                    {!item.approved && !item.sold && (
                      <>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="border-green-500 hover:bg-green-500 hover:text-white"
                          onClick={() => handleApproval(item.id, true)}
                          disabled={approvalMutation.isPending}
                        >
                          <Check className="h-4 w-4 mr-1" /> Approve
                        </Button>
                      </>
                    )}
                    {item.approved && !item.sold && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleApproval(item.id, false)}
                        disabled={approvalMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-1" /> Revoke
                      </Button>
                    )}
                    {!item.sold && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleDeleteItem(item)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                No marketplace items found
              </div>
            )}
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="w-[90%] max-w-md z-[110]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Marketplace Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this item? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteItem}
              className="w-full sm:w-auto bg-red-500 hover:bg-red-600"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Item Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="w-[90%] max-w-md max-h-[85vh] overflow-y-auto z-[100]">
          {selectedItem && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedItem.title}</DialogTitle>
                <DialogDescription>
                  Listed on {formatDate(selectedItem.createdAt)}
                </DialogDescription>
              </DialogHeader>
              
              {selectedItem.imageUrl && (
                <div className="w-full h-48 bg-gray-100 dark:bg-gray-700 rounded-md overflow-hidden">
                  <img 
                    src={selectedItem.imageUrl} 
                    alt={selectedItem.title} 
                    className="w-full h-full object-contain" 
                  />
                </div>
              )}
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium">Description</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {selectedItem.description}
                  </p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Category</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedItem.category}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Price</h4>
                    <p className="text-sm font-bold text-primary dark:text-blue-400 mt-1">
                      {formatTokenAmount(selectedItem.price)} TSK
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-medium">Status</h4>
                    <div className="mt-1">
                      <Badge variant={selectedItem.approved ? "success" : "secondary"}>
                        {selectedItem.approved ? "Approved" : "Pending"}
                      </Badge>
                      {selectedItem.sold && (
                        <Badge variant="outline" className="ml-2">
                          Sold
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium">Seller ID</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      {selectedItem.sellerId}
                    </p>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
                <div>
                  {!selectedItem.sold && (
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto border-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => handleDeleteItem(selectedItem)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </Button>
                  )}
                </div>
                <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full sm:w-auto">
                  {!selectedItem.approved && !selectedItem.sold ? (
                    <>
                      <Button 
                        variant="outline" 
                        className="w-full sm:w-auto border-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => {
                          handleApproval(selectedItem.id, false);
                          setViewDialogOpen(false);
                        }}
                        disabled={approvalMutation.isPending}
                      >
                        <X className="h-4 w-4 mr-2" /> Reject
                      </Button>
                      <Button 
                        variant="default"
                        className="w-full sm:w-auto"
                        onClick={() => {
                          handleApproval(selectedItem.id, true);
                          setViewDialogOpen(false);
                        }}
                        disabled={approvalMutation.isPending}
                      >
                        <Check className="h-4 w-4 mr-2" /> Approve
                      </Button>
                    </>
                  ) : selectedItem.approved && !selectedItem.sold ? (
                    <Button 
                      variant="outline" 
                      className="w-full sm:w-auto border-red-500 hover:bg-red-500 hover:text-white"
                      onClick={() => {
                        handleApproval(selectedItem.id, false);
                        setViewDialogOpen(false);
                      }}
                      disabled={approvalMutation.isPending}
                    >
                      <X className="h-4 w-4 mr-2" /> Revoke Approval
                    </Button>
                  ) : (
                    <Button 
                      variant="outline"
                      className="w-full sm:w-auto"
                      onClick={() => setViewDialogOpen(false)}
                    >
                      Close
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

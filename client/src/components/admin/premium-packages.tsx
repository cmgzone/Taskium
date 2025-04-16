import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";
import { Pencil, Plus, Loader2, Gem } from "lucide-react";

interface PremiumPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  miningMultiplier: number;
  active: boolean;
}

const packageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  miningMultiplier: z.coerce.number().min(1, "Multiplier must be at least 1"),
  active: z.boolean().default(true)
});

export default function PremiumPackages() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<PremiumPackage | null>(null);

  // Fetch premium packages
  const { data: packages = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/premium-packages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/premium-packages");
      return await res.json();
    }
  });

  // Form for adding a new package
  const addForm = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 1,
      miningMultiplier: 1,
      active: true
    }
  });

  // Form for editing a package
  const editForm = useForm<z.infer<typeof packageSchema>>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 1,
      miningMultiplier: 1,
      active: true
    }
  });

  // Create package mutation
  const createMutation = useMutation({
    mutationFn: async (data: z.infer<typeof packageSchema>) => {
      const res = await apiRequest("POST", "/api/admin/premium-packages", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Package created",
        description: "The premium package has been created successfully.",
      });
      setIsAddDialogOpen(false);
      addForm.reset();
      refetch();
    },
    onError: (error: Error) => {
      toast({
        title: "Creation failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update package mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof packageSchema> }) => {
      const res = await apiRequest("PATCH", `/api/admin/premium-packages/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Package updated",
        description: "The premium package has been updated successfully.",
      });
      setIsEditDialogOpen(false);
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

  const onAddSubmit = (data: z.infer<typeof packageSchema>) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof packageSchema>) => {
    if (!selectedPackage) return;
    updateMutation.mutate({ id: selectedPackage.id, data });
  };

  const handleEditPackage = (pkg: PremiumPackage) => {
    setSelectedPackage(pkg);
    editForm.reset({
      name: pkg.name,
      description: pkg.description,
      price: pkg.price,
      miningMultiplier: pkg.miningMultiplier,
      active: pkg.active
    });
    setIsEditDialogOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
            Premium Packages
          </h2>
          <p className="text-muted-foreground mt-1">
            Configure subscription tiers with mining multipliers
          </p>
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center bg-gradient-to-r from-purple-600 to-purple-400 hover:from-purple-700 hover:to-purple-500">
              <Plus className="h-4 w-4 mr-2" /> Add Package
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto z-[100]">
            <DialogHeader>
              <DialogTitle className="text-xl">Add Premium Package</DialogTitle>
              <DialogDescription>
                Create a new premium package for users to purchase.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Package Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Pro, Elite" {...field} />
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
                          placeholder="Short description of the package" 
                          rows={2}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={addForm.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price (TSK)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="1" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={addForm.control}
                    name="miningMultiplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mining Multiplier</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" step="0.1" {...field} />
                        </FormControl>
                        <FormDescription>
                          e.g. 1.5 = +50% mining rate
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
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription>
                          Make this package available for purchase
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
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Package'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="flex flex-col items-center">
            <Loader2 className="h-10 w-10 animate-spin text-purple-500" />
            <p className="mt-4 text-muted-foreground">Loading premium packages...</p>
          </div>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border shadow-sm bg-card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gradient-to-r from-purple-100/80 to-purple-50/50 dark:from-purple-950/20 dark:to-purple-900/10">
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider">Description</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider">Price</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider">Multiplier</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold text-purple-900 dark:text-purple-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {packages.length > 0 ? (
                  packages.map((pkg: PremiumPackage, index: number) => (
                    <tr 
                      key={pkg.id}
                      className={`hover:bg-muted/50 ${index % 2 === 0 ? 'bg-white dark:bg-gray-950/50' : 'bg-gray-50/80 dark:bg-gray-900/30'}`}
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="font-semibold text-purple-800 dark:text-purple-300">{pkg.name}</div>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-700 dark:text-gray-300">
                        {pkg.description}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-amber-600 dark:text-amber-400">
                          <span>{formatTokenAmount(pkg.price)}</span>
                          <span className="text-xs font-semibold">TSK</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                          <span className="text-sm">×{pkg.miningMultiplier.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <Badge className={`${pkg.active 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-100 hover:text-green-700' 
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400'}`}
                        >
                          {pkg.active ? "Active" : "Inactive"}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <Button 
                          className="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 border-purple-200 dark:border-purple-800"
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditPackage(pkg)}
                        >
                          <Pencil className="h-4 w-4 mr-1" />
                          <span>Edit</span>
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="rounded-full bg-purple-100 dark:bg-purple-900/20 p-3 mb-3">
                          <Gem className="h-6 w-6 text-purple-500" />
                        </div>
                        <p className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-1">No premium packages</p>
                        <p className="text-sm text-muted-foreground max-w-sm">
                          Create your first premium package to offer subscription plans to your users
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Edit Package Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Edit Premium Package</DialogTitle>
            <DialogDescription>
              Update the details of this premium package.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Pro, Elite" {...field} />
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
                        placeholder="Short description of the package" 
                        rows={2}
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (TSK)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="miningMultiplier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mining Multiplier</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" step="0.1" {...field} />
                      </FormControl>
                      <FormDescription>
                        e.g. 1.5 = +50% mining rate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={editForm.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Active</FormLabel>
                      <FormDescription>
                        Make this package available for purchase
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
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Package'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

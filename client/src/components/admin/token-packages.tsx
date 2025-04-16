import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Loader2, Plus, Pencil, Trash2, DollarSign, Coins, Gift, Tag, CalendarIcon, CreditCard, Percent } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

// Interface for Token Package
interface TokenPackage {
  id: number;
  name: string;
  description: string;
  tokenAmount: number;
  priceUSD: number;
  paypalPriceModifier?: number;
  bnbPriceModifier?: number;
  discountPercentage: number;
  limitedTimeOffer?: boolean;
  offerEndDate?: string | Date;
  featuredPackage?: boolean;
  minPurchaseForBulkDiscount?: number;
  bulkDiscountPercentage?: number;
  active: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// Form schema for token packages
const TokenPackageSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().min(1, "Description is required"),
  tokenAmount: z.coerce.number().positive("Token amount must be greater than 0"),
  priceUSD: z.coerce.number().positive("Price must be greater than 0"),
  paypalPriceModifier: z.coerce.number().min(-50, "PayPal price modifier cannot be less than -50%").max(50, "PayPal price modifier cannot exceed 50%").default(0),
  bnbPriceModifier: z.coerce.number().min(-50, "BNB price modifier cannot be less than -50%").max(50, "BNB price modifier cannot exceed 50%").default(0),
  discountPercentage: z.coerce.number().min(0, "Discount cannot be negative").max(100, "Discount cannot exceed 100%"),
  limitedTimeOffer: z.boolean().default(false),
  offerEndDate: z.date().optional(),
  featuredPackage: z.boolean().default(false),
  minPurchaseForBulkDiscount: z.coerce.number().min(0, "Minimum purchase cannot be negative").default(0),
  bulkDiscountPercentage: z.coerce.number().min(0, "Bulk discount cannot be negative").max(50, "Bulk discount cannot exceed 50%").default(0),
  active: z.boolean().default(true)
});

type TokenPackageFormValues = z.infer<typeof TokenPackageSchema>;

export default function TokenPackages() {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);

  // Fetch token packages
  const { data: packages = [], isLoading, refetch } = useQuery({
    queryKey: ["/api/token-packages"],
    queryFn: async () => {
      const res = await fetch("/api/token-packages?all=true");
      if (!res.ok) {
        throw new Error("Failed to fetch token packages");
      }
      return await res.json() as TokenPackage[];
    }
  });

  // Form for adding a new package
  const addForm = useForm<TokenPackageFormValues>({
    resolver: zodResolver(TokenPackageSchema),
    defaultValues: {
      name: "",
      description: "",
      tokenAmount: 100,
      priceUSD: 10,
      paypalPriceModifier: 0,
      bnbPriceModifier: 0,
      discountPercentage: 0,
      limitedTimeOffer: false,
      featuredPackage: false,
      minPurchaseForBulkDiscount: 0,
      bulkDiscountPercentage: 0,
      active: true
    }
  });

  // Form for editing a package
  const editForm = useForm<TokenPackageFormValues>({
    resolver: zodResolver(TokenPackageSchema),
    defaultValues: {
      name: "",
      description: "",
      tokenAmount: 100,
      priceUSD: 10,
      paypalPriceModifier: 0,
      bnbPriceModifier: 0,
      discountPercentage: 0,
      limitedTimeOffer: false,
      featuredPackage: false,
      minPurchaseForBulkDiscount: 0,
      bulkDiscountPercentage: 0,
      active: true
    }
  });

  // Update form values when editing a package
  useEffect(() => {
    if (selectedPackage) {
      editForm.reset({
        name: selectedPackage.name,
        description: selectedPackage.description,
        tokenAmount: selectedPackage.tokenAmount,
        priceUSD: selectedPackage.priceUSD,
        paypalPriceModifier: selectedPackage.paypalPriceModifier || 0,
        bnbPriceModifier: selectedPackage.bnbPriceModifier || 0,
        discountPercentage: selectedPackage.discountPercentage,
        limitedTimeOffer: selectedPackage.limitedTimeOffer || false,
        offerEndDate: selectedPackage.offerEndDate ? new Date(selectedPackage.offerEndDate) : undefined,
        featuredPackage: selectedPackage.featuredPackage || false,
        minPurchaseForBulkDiscount: selectedPackage.minPurchaseForBulkDiscount || 0,
        bulkDiscountPercentage: selectedPackage.bulkDiscountPercentage || 0,
        active: selectedPackage.active
      });
    }
  }, [selectedPackage, editForm]);

  // Create package mutation
  const createMutation = useMutation({
    mutationFn: async (data: TokenPackageFormValues) => {
      const res = await apiRequest("POST", "/api/admin/token-packages", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Package created",
        description: "Token package has been created successfully",
      });
      setIsAddDialogOpen(false);
      addForm.reset();
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error creating package",
        description: error instanceof Error ? error.message : "Failed to create token package",
        variant: "destructive"
      });
    }
  });

  // Update package mutation
  const updateMutation = useMutation({
    mutationFn: async (data: { id: number; values: TokenPackageFormValues }) => {
      const res = await apiRequest("PATCH", `/api/admin/token-packages/${data.id}`, data.values);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Package updated",
        description: "Token package has been updated successfully",
      });
      setIsEditDialogOpen(false);
      setSelectedPackage(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error updating package",
        description: error instanceof Error ? error.message : "Failed to update token package",
        variant: "destructive"
      });
    }
  });

  // Delete package mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("DELETE", `/api/admin/token-packages/${id}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Package deleted",
        description: "Token package has been deleted successfully",
      });
      setIsDeleteDialogOpen(false);
      setSelectedPackage(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Error deleting package",
        description: error instanceof Error ? error.message : "Failed to delete token package",
        variant: "destructive"
      });
    }
  });

  // Form submission handlers
  const onAddSubmit = (data: TokenPackageFormValues) => {
    createMutation.mutate(data);
  };

  const onEditSubmit = (data: TokenPackageFormValues) => {
    if (selectedPackage) {
      updateMutation.mutate({ id: selectedPackage.id, values: data });
    }
  };

  const onDeleteConfirm = () => {
    if (selectedPackage) {
      deleteMutation.mutate(selectedPackage.id);
    }
  };

  // Handlers for dialog actions
  const handleEditClick = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    setIsDeleteDialogOpen(true);
  };

  // Show loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Packages</CardTitle>
          <CardDescription>Loading token packages...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Token Packages</CardTitle>
            <CardDescription>Manage token packages available for purchase</CardDescription>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Package
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {packages.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No token packages available. Click "Add Package" to create one.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Tokens</TableHead>
                <TableHead>Price (USD)</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Features</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packages.map((pkg) => (
                <TableRow key={pkg.id} className={pkg.featuredPackage ? "bg-primary/5" : ""}>
                  <TableCell className="font-medium">
                    {pkg.name}
                    {pkg.featuredPackage && (
                      <Badge variant="secondary" className="ml-2">Featured</Badge>
                    )}
                  </TableCell>
                  <TableCell>{pkg.tokenAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    ${pkg.priceUSD.toFixed(2)}
                    {pkg.paypalPriceModifier ? (
                      <div className="text-xs text-muted-foreground">
                        PayPal: {pkg.paypalPriceModifier > 0 ? '+' : ''}{pkg.paypalPriceModifier}%
                      </div>
                    ) : null}
                    {pkg.bnbPriceModifier ? (
                      <div className="text-xs text-muted-foreground">
                        BNB: {pkg.bnbPriceModifier > 0 ? '+' : ''}{pkg.bnbPriceModifier}%
                      </div>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    {pkg.discountPercentage > 0 ? (
                      <Badge variant="outline" className="bg-green-100 dark:bg-green-900/20">
                        {pkg.discountPercentage}% Off
                      </Badge>
                    ) : "None"}
                    {pkg.bulkDiscountPercentage && pkg.bulkDiscountPercentage > 0 && pkg.minPurchaseForBulkDiscount && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Bulk: {pkg.bulkDiscountPercentage}% off {pkg.minPurchaseForBulkDiscount}+ units
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {pkg.limitedTimeOffer && (
                        <Badge variant="outline" className="bg-orange-100 dark:bg-orange-900/20 text-xs whitespace-nowrap">
                          <CalendarIcon className="h-3 w-3 mr-1" />
                          Limited Offer
                          {pkg.offerEndDate && 
                            <span className="ml-1">
                              until {new Date(pkg.offerEndDate).toLocaleDateString()}
                            </span>
                          }
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {pkg.active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="outline">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(pkg)}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteClick(pkg)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      {/* Add Package Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Token Package</DialogTitle>
            <DialogDescription>
              Create a new token package for users to purchase.
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
                      <Input placeholder="e.g. Starter Pack" {...field} />
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
                        placeholder="Describe what's included in this package" 
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
                  name="tokenAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Amount</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                            <Coins className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            type="number" 
                            className="rounded-l-none" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="priceUSD"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            type="number" 
                            step="0.01" 
                            className="rounded-l-none" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Tabs defaultValue="basic" className="w-full mt-2">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="price-control">Payment Options</TabsTrigger>
                  <TabsTrigger value="promotion">Promotions</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={addForm.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Percentage</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="1" 
                                className="rounded-r-none" 
                                {...field} 
                              />
                              <div className="flex items-center px-3 bg-muted rounded-r-md border border-l-0 border-input">
                                %
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Base discount applied to all purchases
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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

                    <FormField
                      control={addForm.control}
                      name="featuredPackage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Featured Package</FormLabel>
                            <FormDescription>
                              Highlight this package to users
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
                </TabsContent>

                <TabsContent value="price-control">
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={addForm.control}
                      name="paypalPriceModifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PayPal Price Modifier (%)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                type="number" 
                                min="-50" 
                                max="50" 
                                step="0.5" 
                                className="rounded-r-none" 
                                {...field} 
                              />
                              <div className="flex items-center px-3 bg-muted rounded-r-md border border-l-0 border-input">
                                %
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Adjustment applied to PayPal payments (e.g., +5% for fees or -10% for discount)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={addForm.control}
                      name="bnbPriceModifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BNB Price Modifier (%)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                type="number" 
                                min="-50" 
                                max="50" 
                                step="0.5" 
                                className="rounded-r-none" 
                                {...field} 
                              />
                              <div className="flex items-center px-3 bg-muted rounded-r-md border border-l-0 border-input">
                                %
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Adjustment applied to BNB payments (e.g., -5% discount for crypto)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="promotion">
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={addForm.control}
                      name="limitedTimeOffer"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Limited Time Offer</FormLabel>
                            <FormDescription>
                              Set as a special limited-time promotion
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

                    {addForm.watch("limitedTimeOffer") && (
                      <FormField
                        control={addForm.control}
                        name="offerEndDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Offer End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
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
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When this offer will expire
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={addForm.control}
                      name="minPurchaseForBulkDiscount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Purchase for Bulk Discount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="Number of units (0 to disable)"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum number of units to qualify for bulk discount (0 to disable)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {addForm.watch("minPurchaseForBulkDiscount") > 0 && (
                      <FormField
                        control={addForm.control}
                        name="bulkDiscountPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bulk Discount Percentage</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="50" 
                                  step="1" 
                                  className="rounded-r-none" 
                                  {...field} 
                                />
                                <div className="flex items-center px-3 bg-muted rounded-r-md border border-l-0 border-input">
                                  %
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Additional discount for bulk purchases
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : "Create Package"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Package Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Token Package</DialogTitle>
            <DialogDescription>
              Update the details of this token package.
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
                      <Input placeholder="e.g. Starter Pack" {...field} />
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
                        placeholder="Describe what's included in this package" 
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
                  name="tokenAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Amount</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                            <Coins className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            type="number" 
                            className="rounded-l-none" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="priceUSD"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (USD)</FormLabel>
                      <FormControl>
                        <div className="flex">
                          <div className="flex items-center px-3 bg-muted rounded-l-md border border-r-0 border-input">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <Input 
                            type="number" 
                            step="0.01" 
                            className="rounded-l-none" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <Tabs defaultValue="basic" className="w-full mt-2">
                <TabsList className="grid grid-cols-3 w-full">
                  <TabsTrigger value="basic">Basic</TabsTrigger>
                  <TabsTrigger value="price-control">Payment Options</TabsTrigger>
                  <TabsTrigger value="promotion">Promotions</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={editForm.control}
                      name="discountPercentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Percentage</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                type="number" 
                                min="0" 
                                max="100" 
                                step="1" 
                                className="rounded-r-none" 
                                {...field} 
                              />
                              <div className="flex items-center px-3 bg-muted rounded-r-md border border-l-0 border-input">
                                %
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Base discount applied to all purchases
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
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

                    <FormField
                      control={editForm.control}
                      name="featuredPackage"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Featured Package</FormLabel>
                            <FormDescription>
                              Highlight this package to users
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
                </TabsContent>

                <TabsContent value="price-control">
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={editForm.control}
                      name="paypalPriceModifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PayPal Price Modifier (%)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                type="number" 
                                min="-50" 
                                max="50" 
                                step="0.5" 
                                className="rounded-r-none" 
                                {...field} 
                              />
                              <div className="flex items-center px-3 bg-muted rounded-r-md border border-l-0 border-input">
                                %
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Adjustment applied to PayPal payments (e.g., +5% for fees or -10% for discount)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="bnbPriceModifier"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>BNB Price Modifier (%)</FormLabel>
                          <FormControl>
                            <div className="flex">
                              <Input 
                                type="number" 
                                min="-50" 
                                max="50" 
                                step="0.5" 
                                className="rounded-r-none" 
                                {...field} 
                              />
                              <div className="flex items-center px-3 bg-muted rounded-r-md border border-l-0 border-input">
                                %
                              </div>
                            </div>
                          </FormControl>
                          <FormDescription>
                            Adjustment applied to BNB payments (e.g., -5% discount for crypto)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent value="promotion">
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={editForm.control}
                      name="limitedTimeOffer"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Limited Time Offer</FormLabel>
                            <FormDescription>
                              Set as a special limited-time promotion
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

                    {editForm.watch("limitedTimeOffer") && (
                      <FormField
                        control={editForm.control}
                        name="offerEndDate"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Offer End Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant={"outline"}
                                    className={`w-full pl-3 text-left font-normal ${!field.value ? "text-muted-foreground" : ""}`}
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
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
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormDescription>
                              When this offer will expire
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={editForm.control}
                      name="minPurchaseForBulkDiscount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Purchase for Bulk Discount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min="0"
                              placeholder="Number of units (0 to disable)"
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription>
                            Minimum number of units to qualify for bulk discount (0 to disable)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {editForm.watch("minPurchaseForBulkDiscount") > 0 && (
                      <FormField
                        control={editForm.control}
                        name="bulkDiscountPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Bulk Discount Percentage</FormLabel>
                            <FormControl>
                              <div className="flex">
                                <Input 
                                  type="number" 
                                  min="0" 
                                  max="50" 
                                  step="1" 
                                  className="rounded-r-none" 
                                  {...field} 
                                />
                                <div className="flex items-center px-3 bg-muted rounded-r-md border border-l-0 border-input">
                                  %
                                </div>
                              </div>
                            </FormControl>
                            <FormDescription>
                              Additional discount for bulk purchases
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : "Update Package"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Delete Token Package</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this token package?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPackage && (
            <div className="py-4">
              <h4 className="font-medium">{selectedPackage.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedPackage.tokenAmount.toLocaleString()} tokens for ${selectedPackage.priceUSD.toFixed(2)}
              </p>
            </div>
          )}
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={onDeleteConfirm}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : "Delete Package"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
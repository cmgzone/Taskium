import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useWeb3 } from "@/lib/web3-provider";
import { ethers } from "ethers";

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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2, AlertTriangle, CreditCard, ExternalLink, DollarSign, InfoIcon, ChevronsUp, Download, ExternalLink as ExternalLinkIcon } from "lucide-react";

// Form schema for purchasing tokens
const purchaseSchema = z.object({
  packageId: z.string().min(1, "Please select a package"),
  paymentMethod: z.string().min(1, "Please select a payment method"),
  paymentDetails: z.string().min(10, "Please provide payment details"),
  additionalInfo: z.string().optional(),
});

type PurchaseFormValues = z.infer<typeof purchaseSchema>;

// Package data interface
interface TokenPackage {
  id: number;
  name: string;
  description: string;
  tokenAmount: number;
  priceUSD: number;
  discountPercentage: number;
  active: boolean;
}

// Transaction data interface
interface TokenTransaction {
  id: number;
  userId: number;
  packageId: number;
  amount: number;
  priceUSD: number;
  status: string;
  paymentMethod: string;
  paymentDetails: string;
  additionalInfo: string | null;
  createdAt: string;
  packageName?: string;
}

const PAYMENT_METHODS = [
  { value: "bnb_direct", label: "Pay with BNB (Direct)" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "crypto", label: "Other Cryptocurrency" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];

export default function TokenPurchase() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { provider, connect, address, network } = useWeb3();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bnbPaymentOpen, setBnbPaymentOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [bnbAmount, setBnbAmount] = useState<string>("");
  const [bnbTxLoading, setBnbTxLoading] = useState(false);

  // Initialize form
  const form = useForm<PurchaseFormValues>({
    resolver: zodResolver(purchaseSchema),
    defaultValues: {
      packageId: "",
      paymentMethod: "",
      paymentDetails: "",
      additionalInfo: "",
    },
  });

  // Fetch token packages
  const { data: packages, isLoading: packagesLoading } = useQuery<TokenPackage[]>({
    queryKey: ["/api/token-packages"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/token-packages");
        if (!response.ok) throw new Error("Failed to fetch token packages");
        return response.json();
      } catch (error) {
        console.error("Error fetching token packages:", error);
        return [];
      }
    },
  });

  // Fetch user's purchase history
  const { data: transactions, isLoading: transactionsLoading, refetch: refetchTransactions } = useQuery<TokenTransaction[]>({
    queryKey: ["/api/token-transactions"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/token-transactions");
        if (!response.ok) throw new Error("Failed to fetch token transactions");
        return response.json();
      } catch (error) {
        console.error("Error fetching token transactions:", error);
        return [];
      }
    },
  });

  // Submit purchase request
  const purchaseMutation = useMutation({
    mutationFn: async (values: PurchaseFormValues) => {
      const selectedPackage = packages?.find(p => p.id.toString() === values.packageId);
      if (!selectedPackage) throw new Error("Invalid package selected");

      const purchaseData = {
        packageId: parseInt(values.packageId),
        paymentMethod: values.paymentMethod,
        paymentDetails: values.paymentDetails,
        additionalInfo: values.additionalInfo || null,
      };

      return apiRequest("POST", "/api/token-purchase", purchaseData);
    },
    onSuccess: () => {
      toast({
        title: "Purchase Request Submitted",
        description: "Your purchase request has been submitted and is pending approval.",
        variant: "default",
      });
      setDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/token-transactions"] });
    },
    onError: (error: any) => {
      toast({
        title: "Purchase Request Failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (values: PurchaseFormValues) => {
    // For BNB direct payment, open BNB payment dialog instead of submitting form
    if (values.paymentMethod === "bnb_direct") {
      const pack = packages?.find(p => p.id.toString() === values.packageId);
      if (pack) {
        setSelectedPackage(pack);
        setDialogOpen(false);
        setBnbPaymentOpen(true);
        // Default BNB amount (assuming 1 BNB = $300 as a rough estimate)
        const estimatedBnbAmount = pack.priceUSD / 300;
        setBnbAmount(estimatedBnbAmount.toFixed(6));
      }
    } else {
      purchaseMutation.mutate(values);
    }
  };
  
  // Handle direct BNB payment
  const handleBnbPayment = async () => {
    if (!selectedPackage || !address || !provider || !bnbAmount) {
      toast({
        title: "Payment Failed",
        description: "Please ensure your wallet is connected and the amount is specified.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setBnbTxLoading(true);
      
      // Admin wallet address (this should come from your backend in production)
      const adminWalletAddress = "0x0000000000000000000000000000000000000000"; // Replace with actual admin address
      
      // Convert BNB amount to wei
      const amountInWei = ethers.parseEther(bnbAmount);
      
      // Create transaction
      const signer = await provider.getSigner();
      const tx = await signer.sendTransaction({
        to: adminWalletAddress,
        value: amountInWei,
      });
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      // Submit the transaction details to the server
      const purchaseData = {
        packageId: selectedPackage.id,
        paymentMethod: "bnb_direct",
        paymentDetails: `Transaction Hash: ${receipt.hash}, Amount: ${bnbAmount} BNB, Block: ${receipt.blockNumber}`,
        additionalInfo: `Direct BNB payment from ${address}`,
      };
      
      await apiRequest("POST", "/api/token-purchase", purchaseData);
      
      toast({
        title: "Payment Successful",
        description: `You have successfully purchased ${selectedPackage.tokenAmount} TSK tokens with ${bnbAmount} BNB.`,
        variant: "default",
      });
      
      // Close dialog and refresh transactions
      setBnbPaymentOpen(false);
      setSelectedPackage(null);
      queryClient.invalidateQueries({ queryKey: ["/api/token-transactions"] });
    } catch (error: any) {
      console.error("BNB payment error:", error);
      toast({
        title: "Payment Failed",
        description: error.message || "Failed to process BNB payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBnbTxLoading(false);
    }
  };

  // Calculate savings amount
  const calculateSavings = (pack: TokenPackage) => {
    if (pack.discountPercentage <= 0) return 0;
    const originalPrice = (pack.tokenAmount * pack.priceUSD) / (1 - pack.discountPercentage / 100);
    return originalPrice - pack.priceUSD;
  };

  // Get status badge based on transaction status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Purchase TSK Tokens</h2>
          <p className="text-muted-foreground">
            Buy TSK tokens to use across the platform
          </p>
        </div>
        
        {/* BNB Payment Dialog */}
        <Dialog open={bnbPaymentOpen} onOpenChange={setBnbPaymentOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Pay with BNB</DialogTitle>
              <DialogDescription>
                Complete your transaction by sending BNB directly to our platform wallet.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6 py-4">
              {!address ? (
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">
                    You need to connect your wallet to make a direct BNB payment.
                  </p>
                  <Button onClick={(e) => {
                      e.preventDefault();
                      connect();
                    }}>
                    Connect Wallet
                  </Button>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Selected Package:</span>
                      <span className="text-sm">{selectedPackage?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Token Amount:</span>
                      <span className="text-sm">{selectedPackage?.tokenAmount} TSK</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Price:</span>
                      <span className="text-sm">${selectedPackage?.priceUSD.toFixed(2)} USD</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Your Wallet:</span>
                      <span className="text-sm truncate max-w-[200px]">{address}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Network:</span>
                      <span className="text-sm">{network || "BNB Smart Chain"}</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">BNB Amount:</label>
                    <div className="flex">
                      <Input
                        type="number"
                        step="0.000001"
                        min="0.000001"
                        value={bnbAmount}
                        onChange={(e) => setBnbAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1"
                      />
                      <Button
                        variant="outline"
                        className="ml-2"
                        onClick={() => {
                          if (selectedPackage) {
                            // Assuming 1 BNB = $300 as a rough estimate
                            const estimatedBnbAmount = selectedPackage.priceUSD / 300;
                            setBnbAmount(estimatedBnbAmount.toFixed(6));
                          }
                        }}
                      >
                        Estimate
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enter the amount of BNB you wish to send. Current exchange rates will apply.
                    </p>
                  </div>
                  
                  <Alert variant="default" className="bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">Important</AlertTitle>
                    <AlertDescription className="text-amber-700 text-sm">
                      Ensure you're on the BNB Smart Chain network before proceeding with the payment.
                      The transaction cannot be reversed once submitted.
                    </AlertDescription>
                  </Alert>
                </>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setBnbPaymentOpen(false);
                  setSelectedPackage(null);
                }}
              >
                Cancel
              </Button>
              
              <Button
                onClick={handleBnbPayment}
                disabled={!address || !bnbAmount || bnbTxLoading || parseFloat(bnbAmount) <= 0}
              >
                {bnbTxLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Pay with BNB
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <CreditCard className="mr-2 h-4 w-4" />
              Buy Tokens
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Purchase TSK Tokens</DialogTitle>
              <DialogDescription>
                Select a package and complete the form to request a token purchase.
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="packageId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Package</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a token package" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {packages?.filter(p => p.active).map(pack => (
                            <SelectItem key={pack.id} value={pack.id.toString()}>
                              {pack.name} - {pack.tokenAmount} TSK (${pack.priceUSD.toFixed(2)})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose the token package you wish to purchase
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentMethod"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a payment method" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_METHODS.map(method => (
                            <SelectItem key={method.value} value={method.value}>
                              {method.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Choose how you would like to pay
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="paymentDetails"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Details</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter payment details (e.g., transaction ID, wallet address, or PayPal email)"
                          className="min-h-[100px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide details about your payment so we can verify it
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="additionalInfo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Information (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional information you'd like to provide"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Optional information that might help process your request
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Alert className="bg-blue-50 border-blue-200">
                  <InfoIcon className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Manual Verification Required</AlertTitle>
                  <AlertDescription>
                    Token purchases require manual verification. Once approved, tokens will be credited to your wallet.
                  </AlertDescription>
                </Alert>
                
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={purchaseMutation.isPending}>
                    {purchaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Purchase Request
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Token packages */}
      <div>
        <h3 className="text-lg font-medium mb-4">Available Token Packages</h3>
        
        {packagesLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <Card key={i} className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 animate-pulse rounded-lg" />
                <CardHeader className="pb-2">
                  <div className="h-6 w-2/3 bg-muted animate-pulse rounded" />
                  <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
                </CardHeader>
                <CardContent>
                  <div className="h-10 w-full bg-muted animate-pulse rounded mb-4" />
                  <div className="h-6 w-3/4 bg-muted animate-pulse rounded" />
                </CardContent>
                <CardFooter>
                  <div className="h-10 w-full bg-muted animate-pulse rounded" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : !packages || packages.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No token packages available at the moment.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {packages.filter(p => p.active).map(pack => (
              <Card key={pack.id} className="relative overflow-hidden">
                {pack.discountPercentage > 0 && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-tl-none rounded-br-none bg-green-500 text-white font-medium">
                      {pack.discountPercentage}% OFF
                    </Badge>
                  </div>
                )}
                <CardHeader className="pb-2">
                  <CardTitle>{pack.name}</CardTitle>
                  <CardDescription>{pack.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end mb-4">
                    <span className="text-3xl font-bold">${pack.priceUSD.toFixed(2)}</span>
                    <span className="text-muted-foreground ml-2">USD</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token amount:</span>
                      <span className="font-medium">{pack.tokenAmount} TSK</span>
                    </div>
                    {pack.discountPercentage > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">You save:</span>
                        <span className="font-medium text-green-600">${calculateSavings(pack).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Price per token:</span>
                      <span className="font-medium">${(pack.priceUSD / pack.tokenAmount).toFixed(4)}</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    onClick={() => {
                      form.setValue("packageId", pack.id.toString());
                      setDialogOpen(true);
                    }}
                  >
                    <CreditCard className="mr-2 h-4 w-4" />
                    Purchase
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Purchase history */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Purchase History</h3>
          <Button variant="outline" size="sm" onClick={() => refetchTransactions()}>
            <Loader2 className={`mr-2 h-3 w-3 ${transactionsLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        
        {transactionsLoading ? (
          <Card>
            <CardContent className="py-6">
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            </CardContent>
          </Card>
        ) : !transactions || transactions.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No purchase history found.</p>
              <Button 
                variant="outline" 
                className="mt-4"
                onClick={() => setDialogOpen(true)}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Make Your First Purchase
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="px-0 py-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="px-4 py-3 text-left font-medium">Package</th>
                      <th className="px-4 py-3 text-left font-medium">Amount</th>
                      <th className="px-4 py-3 text-left font-medium">Price</th>
                      <th className="px-4 py-3 text-left font-medium">Payment Method</th>
                      <th className="px-4 py-3 text-left font-medium">Date</th>
                      <th className="px-4 py-3 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map(tx => (
                      <tr key={tx.id} className="border-b hover:bg-muted/50">
                        <td className="px-4 py-3">{tx.packageName || `Package #${tx.packageId}`}</td>
                        <td className="px-4 py-3">{tx.amount} TSK</td>
                        <td className="px-4 py-3">${tx.priceUSD.toFixed(2)}</td>
                        <td className="px-4 py-3">
                          {tx.paymentMethod === "bank_transfer" ? "Bank Transfer" :
                           tx.paymentMethod === "crypto" ? "Cryptocurrency" :
                           tx.paymentMethod === "paypal" ? "PayPal" :
                           tx.paymentMethod}
                        </td>
                        <td className="px-4 py-3">{formatDate(tx.createdAt)}</td>
                        <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
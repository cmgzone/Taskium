import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { TokenPackage } from "@shared/schema";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Tag, CreditCard as CreditCardIcon } from "lucide-react";
import { useWeb3 } from "../../hooks/use-web3";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import PayPalButton from "@/components/payments/paypal-button";
import FlutterwaveButton from "@/components/payments/flutterwave-button";

interface TokenPurchaseProps {
  onPurchaseComplete?: () => void;
}

export default function TokenPurchase({ onPurchaseComplete }: TokenPurchaseProps) {
  const { toast } = useToast();
  const { connected, address, isCorrectNetwork, connect } = useWeb3();
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"bnb" | "paypal" | "flutterwave">("bnb");
  const [paypalDialogOpen, setPaypalDialogOpen] = useState(false);
  const [flutterwaveDialogOpen, setFlutterwaveDialogOpen] = useState(false);
  
  // Calculate adjusted price based on payment method and modifiers
  const calculateAdjustedPrice = (pkg: TokenPackage, method: "bnb" | "paypal" | "flutterwave"): number => {
    const basePrice = pkg.priceUSD;
    let adjustedPrice = basePrice;
    
    // Apply general discount
    if (pkg.discountPercentage > 0) {
      adjustedPrice = basePrice * (1 - pkg.discountPercentage / 100);
    }
    
    // Apply payment method specific modifiers
    if (method === "paypal" && 
        pkg.paypalPriceModifier !== undefined && 
        pkg.paypalPriceModifier !== null) {
      adjustedPrice = adjustedPrice * (1 + pkg.paypalPriceModifier / 100);
    } else if (method === "bnb" && 
               pkg.bnbPriceModifier !== undefined && 
               pkg.bnbPriceModifier !== null) {
      adjustedPrice = adjustedPrice * (1 + pkg.bnbPriceModifier / 100);
    } else if (method === "flutterwave" && 
               pkg.flutterwavePriceModifier !== undefined && 
               pkg.flutterwavePriceModifier !== null) {
      adjustedPrice = adjustedPrice * (1 + pkg.flutterwavePriceModifier / 100);
    }
    
    return parseFloat(adjustedPrice.toFixed(2));
  };

  // Fetch token packages
  const { data: tokenPackages, isLoading } = useQuery({
    queryKey: ["/api/token-packages"],
    queryFn: async () => {
      const response = await fetch("/api/token-packages");
      if (!response.ok) {
        throw new Error("Failed to fetch token packages");
      }
      return await response.json() as TokenPackage[];
    }
  });
  
  // Check if PayPal is enabled
  interface PaymentConfig {
    enabled: boolean;
    clientId?: string;
  }
  
  const { data: paypalConfig } = useQuery<PaymentConfig>({
    queryKey: ["/api/payments/paypal/config"],
    retry: 1
  });
  
  // Check if Flutterwave is enabled
  const { data: flutterwaveConfig } = useQuery<PaymentConfig>({
    queryKey: ["/api/payments/flutterwave/config"],
    retry: 1
  });

  // Purchase token package mutation
  const purchaseMutation = useMutation({
    mutationFn: async (packageId: number) => {
      const response = await apiRequest("POST", `/api/token-packages/${packageId}/purchase`, {
        paymentMethod: "bnb",
        walletAddress: address,
      });
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/token-transactions"] });
      toast({
        title: "Purchase submitted",
        description: "Your purchase request has been submitted and is pending approval",
      });
      setSelectedPackage(null);
      if (onPurchaseComplete) {
        onPurchaseComplete();
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

  // Handle PayPal payment success
  const handlePayPalSuccess = (orderId: string, paymentDetails: any) => {
    toast({
      title: "Payment Successful",
      description: "Your token purchase was successful!",
    });
    
    // Close the dialog
    setPaypalDialogOpen(false);
    setSelectedPackage(null);
    
    // Refresh transaction history
    queryClient.invalidateQueries({ queryKey: ["/api/user/token-transactions"] });
    
    if (onPurchaseComplete) {
      onPurchaseComplete();
    }
  };
  
  // Handle PayPal payment error
  const handlePayPalError = (error: Error) => {
    toast({
      title: "Payment Failed",
      description: error.message,
      variant: "destructive",
    });
  };
  
  // Handle PayPal payment cancel
  const handlePayPalCancel = () => {
    toast({
      title: "Payment Cancelled",
      description: "You cancelled the payment process",
    });
    setPaypalDialogOpen(false);
  };
  
  // Handle Flutterwave payment success
  const handleFlutterwaveSuccess = (transactionData: any) => {
    toast({
      title: "Payment Successful",
      description: "Your token purchase was successful!",
    });
    
    // Close the dialog
    setFlutterwaveDialogOpen(false);
    setSelectedPackage(null);
    
    // Refresh transaction history
    queryClient.invalidateQueries({ queryKey: ["/api/user/token-transactions"] });
    
    if (onPurchaseComplete) {
      onPurchaseComplete();
    }
  };
  
  // Handle Flutterwave payment error
  const handleFlutterwaveError = (error: Error) => {
    toast({
      title: "Payment Failed",
      description: error.message,
      variant: "destructive",
    });
  };

  const handlePurchase = async (pkg: TokenPackage) => {
    setSelectedPackage(pkg);
    
    // If using PayPal and it's enabled, open PayPal dialog
    if (paymentMethod === "paypal" && paypalConfig?.enabled) {
      setPaypalDialogOpen(true);
      return;
    }
    
    // If using Flutterwave and it's enabled, open Flutterwave dialog
    if (paymentMethod === "flutterwave" && flutterwaveConfig?.enabled) {
      setFlutterwaveDialogOpen(true);
      return;
    }
    
    // For BNB payments, check wallet connection
    if (!connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet first",
        variant: "destructive",
      });
      return;
    }

    if (!isCorrectNetwork) {
      toast({
        title: "Wrong network",
        description: "Please switch to Binance Smart Chain",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsPurchasing(true);
      
      // Call our API to record the purchase intent
      await purchaseMutation.mutateAsync(pkg.id);
    } catch (error) {
      console.error("Error during purchase:", error);
      toast({
        title: "Purchase failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment method selection */}
      <div className="mb-6 border rounded-md p-4 bg-muted/10">
        <h3 className="text-lg font-medium mb-3">Payment Method</h3>
        <div className="flex flex-wrap gap-2">
          <Button 
            variant={paymentMethod === "bnb" ? "default" : "outline"}
            size="sm"
            onClick={() => setPaymentMethod("bnb")}
            className="flex items-center gap-1"
          >
            <CreditCard className="h-4 w-4" />
            Pay with BNB
          </Button>
          
          {paypalConfig?.enabled && (
            <Button 
              variant={paymentMethod === "paypal" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentMethod("paypal")}
              className="flex items-center gap-1"
            >
              <span className="text-[#003087] font-bold">Pay</span>
              <span className="text-[#009cde] font-bold">Pal</span>
            </Button>
          )}
          
          {flutterwaveConfig?.enabled && (
            <Button 
              variant={paymentMethod === "flutterwave" ? "default" : "outline"}
              size="sm"
              onClick={() => setPaymentMethod("flutterwave")}
              className="flex items-center gap-1"
            >
              <CreditCardIcon className="h-4 w-4 mr-1" />
              Flutterwave
            </Button>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tokenPackages?.filter(pkg => pkg.active).map((pkg) => (
          <Card key={pkg.id} className={cn(
            "transition-all hover:shadow-md",
            selectedPackage?.id === pkg.id && "border-2 border-primary"
          )}>
            <CardHeader>
              <CardTitle>{pkg.name}</CardTitle>
              <CardDescription>{pkg.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-primary">
                {pkg.tokenAmount.toLocaleString()} TSK
              </div>
              
              {/* Price display with modifiers */}
              <div>
                {/* Show original price if discounted or modified */}
                {(pkg.discountPercentage > 0 || 
                  (paymentMethod === "paypal" && pkg.paypalPriceModifier !== undefined && pkg.paypalPriceModifier !== null && pkg.paypalPriceModifier !== 0) || 
                  (paymentMethod === "bnb" && pkg.bnbPriceModifier !== undefined && pkg.bnbPriceModifier !== null && pkg.bnbPriceModifier !== 0) ||
                  (paymentMethod === "flutterwave" && pkg.flutterwavePriceModifier !== undefined && pkg.flutterwavePriceModifier !== null && pkg.flutterwavePriceModifier !== 0)) && (
                  <div className="text-sm text-muted-foreground line-through">
                    ${pkg.priceUSD.toFixed(2)} USD
                  </div>
                )}
                
                {/* Show final price with all adjustments */}
                <div className="text-lg font-semibold">
                  ${calculateAdjustedPrice(pkg, paymentMethod).toFixed(2)} USD
                </div>
                
                {/* Show any applicable modifiers */}
                {paymentMethod === "paypal" && pkg.paypalPriceModifier !== undefined && pkg.paypalPriceModifier !== null && pkg.paypalPriceModifier !== 0 && (
                  <Badge variant="outline" className={pkg.paypalPriceModifier < 0 ? "bg-green-100" : "bg-amber-100"}>
                    <Tag className="h-3 w-3 mr-1" />
                    PayPal: {pkg.paypalPriceModifier > 0 ? '+' : ''}{pkg.paypalPriceModifier}%
                  </Badge>
                )}
                
                {paymentMethod === "bnb" && pkg.bnbPriceModifier !== undefined && pkg.bnbPriceModifier !== null && pkg.bnbPriceModifier !== 0 && (
                  <Badge variant="outline" className={pkg.bnbPriceModifier < 0 ? "bg-green-100" : "bg-amber-100"}>
                    <Tag className="h-3 w-3 mr-1" />
                    BNB: {pkg.bnbPriceModifier > 0 ? '+' : ''}{pkg.bnbPriceModifier}%
                  </Badge>
                )}
                
                {paymentMethod === "flutterwave" && pkg.flutterwavePriceModifier !== undefined && pkg.flutterwavePriceModifier !== null && pkg.flutterwavePriceModifier !== 0 && (
                  <Badge variant="outline" className={pkg.flutterwavePriceModifier < 0 ? "bg-green-100" : "bg-amber-100"}>
                    <Tag className="h-3 w-3 mr-1" />
                    Flutterwave: {pkg.flutterwavePriceModifier > 0 ? '+' : ''}{pkg.flutterwavePriceModifier}%
                  </Badge>
                )}
              </div>
              
              {/* Show discount badge */}
              {pkg.discountPercentage > 0 && (
                <div className="inline-block px-2 py-1 rounded-md bg-primary/10 text-primary font-medium text-sm">
                  {pkg.discountPercentage}% discount
                </div>
              )}
              
              {/* Show promotion badge */}
              {pkg.limitedTimeOffer && (
                <Badge variant="outline" className="bg-orange-100 text-xs">
                  Limited Time Offer
                  {pkg.offerEndDate && 
                    <span className="ml-1">
                      until {new Date(pkg.offerEndDate).toLocaleDateString()}
                    </span>
                  }
                </Badge>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handlePurchase(pkg)}
                disabled={isPurchasing || purchaseMutation.isPending}
              >
                {isPurchasing && selectedPackage?.id === pkg.id ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : paymentMethod === "paypal" ? (
                  "Purchase with PayPal"
                ) : paymentMethod === "flutterwave" ? (
                  "Purchase with Flutterwave"
                ) : (
                  "Purchase with BNB"
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      {paymentMethod === "bnb" && !connected && (
        <div className="text-center p-4 mt-4 border rounded-md bg-muted/20">
          <p className="mb-2">Connect your wallet to purchase TSK tokens</p>
          <Button onClick={() => connect()}>Connect Wallet</Button>
        </div>
      )}

      <div className="text-sm text-muted-foreground mt-4">
        {paymentMethod === "bnb" ? (
          <>
            <p>* Token purchase requests are processed within 24 hours.</p>
            <p>* Make sure your wallet has sufficient BNB for the transaction.</p>
          </>
        ) : (
          <>
            <p>* PayPal payments are processed instantly.</p>
            <p>* Tokens will be credited to your account immediately after payment.</p>
          </>
        )}
      </div>
      
      {/* PayPal Dialog */}
      <Dialog open={paypalDialogOpen} onOpenChange={setPaypalDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Purchase with PayPal</DialogTitle>
            <DialogDescription>
              Purchase {selectedPackage?.tokenAmount.toLocaleString()} TSK tokens
              {selectedPackage && (
                <>
                  {" "}for ${calculateAdjustedPrice(selectedPackage, "paypal").toFixed(2)} USD
                  
                  {/* Show original price if discounted */}
                  {(selectedPackage.discountPercentage > 0 || 
                    (selectedPackage.paypalPriceModifier !== undefined && 
                     selectedPackage.paypalPriceModifier !== null && 
                     selectedPackage.paypalPriceModifier !== 0)) && (
                    <span className="text-sm text-muted-foreground line-through ml-2">
                      (${selectedPackage.priceUSD.toFixed(2)})
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {selectedPackage && (
              <PayPalButton
                amount={calculateAdjustedPrice(selectedPackage, "paypal")}
                tokenPackageId={selectedPackage.id}
                tokenAmount={selectedPackage.tokenAmount}
                onSuccess={handlePayPalSuccess}
                onError={handlePayPalError}
                onCancel={handlePayPalCancel}
                className="w-full"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Flutterwave Dialog */}
      <Dialog open={flutterwaveDialogOpen} onOpenChange={setFlutterwaveDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Complete Purchase with Flutterwave</DialogTitle>
            <DialogDescription>
              Purchase {selectedPackage?.tokenAmount.toLocaleString()} TSK tokens
              {selectedPackage && (
                <>
                  {" "}for ${calculateAdjustedPrice(selectedPackage, "flutterwave").toFixed(2)} USD
                  
                  {/* Show original price if discounted */}
                  {(selectedPackage.discountPercentage > 0 || 
                    (selectedPackage.flutterwavePriceModifier !== undefined && 
                     selectedPackage.flutterwavePriceModifier !== null && 
                     selectedPackage.flutterwavePriceModifier !== 0)) && (
                    <span className="text-sm text-muted-foreground line-through ml-2">
                      (${selectedPackage.priceUSD.toFixed(2)})
                    </span>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-6">
            {selectedPackage && (
              <FlutterwaveButton
                amount={calculateAdjustedPrice(selectedPackage, "flutterwave")}
                tokenPackageId={selectedPackage.id}
                onSuccess={handleFlutterwaveSuccess}
                onError={handleFlutterwaveError}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
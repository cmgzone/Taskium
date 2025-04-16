import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export interface FlutterwaveButtonProps {
  amount: number;
  tokenPackageId: number;
  onSuccess: (transactionData: any) => void;
  onError: (error: Error) => void;
}

export default function FlutterwaveButton({ 
  amount, 
  tokenPackageId, 
  onSuccess, 
  onError 
}: FlutterwaveButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [flutterwaveConfig, setFlutterwaveConfig] = useState<any>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [configError, setConfigError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Fetch Flutterwave configuration when component mounts
  useEffect(() => {
    const fetchConfig = async () => {
      setConfigLoading(true);
      setConfigError(null);

      try {
        const response = await apiRequest('GET', '/api/payments/flutterwave/config');

        if (!response.ok) {
          throw new Error('Failed to load Flutterwave configuration');
        }

        const config = await response.json();
        setFlutterwaveConfig(config);
      } catch (error) {
        console.error('Error loading Flutterwave config:', error);
        setConfigError(error instanceof Error ? error : new Error('Failed to load Flutterwave configuration'));
      } finally {
        setConfigLoading(false);
      }
    };

    fetchConfig();
  }, []);

  const makePayment = async () => {
    setIsLoading(true);

    try {
      // Create payment link
      const response = await apiRequest('POST', '/api/payments/flutterwave/create-payment', {
        packageId: tokenPackageId
      });

      if (!response.ok) {
        throw new Error('Failed to create payment link');
      }

      const { paymentLink, txRef } = await response.json();

      // Open the payment link in a new window
      const paymentWindow = window.open(paymentLink, '_blank');
      
      // Store the transaction reference for verification later
      localStorage.setItem('fw_pending_payment', txRef);
      
      // Show a toast to guide the user
      toast({
        title: "Payment Initiated",
        description: "Please complete your payment in the new window. After payment, return here to verify and receive your tokens.",
      });
      
      // Add a "Verify Payment" button or automatically check after a timeout

    } catch (error) {
      console.error('Error creating Flutterwave payment:', error);
      onError(error instanceof Error ? error : new Error('Failed to create payment link'));
    } finally {
      setIsLoading(false);
    }
  };

  const verifyPayment = async (transactionId: string) => {
    setIsLoading(true);

    try {
      const response = await apiRequest('POST', '/api/payments/flutterwave/verify', {
        transactionId
      });

      if (!response.ok) {
        throw new Error('Failed to verify payment');
      }

      const result = await response.json();
      
      // Clear pending payment from localStorage
      localStorage.removeItem('fw_pending_payment');
      
      // Call success callback with transaction data
      onSuccess(result);
      
      // Show success toast
      toast({
        title: "Payment Successful",
        description: `Your payment has been verified and ${result.transaction?.amount} TSK tokens have been added to your account.`,
      });

    } catch (error) {
      console.error('Error verifying Flutterwave payment:', error);
      onError(error instanceof Error ? error : new Error('Failed to verify payment'));
    } finally {
      setIsLoading(false);
    }
  };

  // Check if there's a pending transaction to verify
  useEffect(() => {
    const txRef = localStorage.getItem('fw_pending_payment');
    const transactionId = new URLSearchParams(window.location.search).get('transaction_id');
    
    if (transactionId && txRef) {
      verifyPayment(transactionId);
    }
  }, []);

  // If we're loading the config or there was an error, show appropriate UI
  if (configLoading) {
    return (
      <Button disabled className="w-full">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading payment options...
      </Button>
    );
  }

  if (configError) {
    return (
      <Button variant="destructive" className="w-full" disabled>
        Payment gateway unavailable
      </Button>
    );
  }

  // If Flutterwave is not enabled, show a disabled button
  if (!flutterwaveConfig?.enabled) {
    return (
      <Button variant="outline" className="w-full" disabled>
        Flutterwave payments unavailable
      </Button>
    );
  }

  return (
    <Button 
      className="w-full"
      onClick={makePayment}
      disabled={isLoading}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Processing...
        </>
      ) : (
        <>Pay with Flutterwave</>
      )}
    </Button>
  );
}
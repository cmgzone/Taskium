import React, { useEffect, useState } from 'react';
import { PayPalScriptProvider, PayPalButtons, FUNDING } from '@paypal/react-paypal-js';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';

interface PaymentConfig {
  enabled: boolean;
  clientId?: string;
  clientToken?: string;
}

interface PayPalButtonProps {
  amount: number;
  tokenPackageId: number;
  tokenAmount: number;
  onSuccess: (orderId: string, paymentDetails: any) => void;
  onError: (error: Error) => void;
  onCancel: () => void;
  className?: string;
}

export default function PayPalButton({
  amount,
  tokenPackageId,
  tokenAmount,
  onSuccess,
  onError,
  onCancel,
  className,
}: PayPalButtonProps) {
  const { toast } = useToast();
  const [isReady, setIsReady] = useState(false);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [paypalUrl, setPaypalUrl] = useState('');
  const [creatingOrder, setCreatingOrder] = useState(false);
  
  // Fetch PayPal configuration
  const { data: paypalConfig, isLoading, error } = useQuery<PaymentConfig>({
    queryKey: ['/api/payments/paypal/config'],
    retry: 1
  });

  useEffect(() => {
    if (paypalConfig?.clientId) {
      setIsReady(true);
    }
    
    // Auto-detect if we're in a mobile webview
    const isMobileWebview = /\s+Android\s+.*(wv|WebView)|\s+iPhone.*Version\/[\d\.]+\s+Mobile|Android.*; wv\)/.test(navigator.userAgent);
    
    // Also check for mobile browsers that might have issues with PayPal
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Set fallback mode for mobile webviews
    if (isMobileWebview || isMobileDevice) {
      setFallbackMode(true);
    }
  }, [paypalConfig]);

  // Create PayPal order for fallback mode
  const createPayPalOrder = async () => {
    try {
      setCreatingOrder(true);
      const response = await apiRequest("POST", '/api/payments/paypal/create-order', {
        packageId: tokenPackageId
      });
      
      if (!response.ok) {
        throw new Error('Failed to create PayPal order');
      }
      
      const data = await response.json();
      
      // If we have an approval URL, use it for the fallback mode
      if (data.approvalUrl) {
        setPaypalUrl(data.approvalUrl);
        return data.orderId;
      } else {
        throw new Error('No approval URL returned');
      }
    } catch (error) {
      console.error('Error creating PayPal order:', error);
      onError(error instanceof Error ? error : new Error('Failed to create PayPal order'));
      throw error;
    } finally {
      setCreatingOrder(false);
    }
  };

  // Handle external PayPal window for fallback
  const handleExternalPayPal = async () => {
    try {
      const orderId = await createPayPalOrder();
      
      // Open PayPal in a new window/tab
      if (paypalUrl) {
        const newWindow = window.open(paypalUrl, '_blank');
        
        // Check if the window was blocked
        if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
          toast({
            title: "Popup Blocked",
            description: "Please allow popups for this site to complete PayPal payment",
            variant: "destructive"
          });
        } else {
          // Inform the user what to do next
          toast({
            title: "Complete Payment",
            description: "Please complete your payment in the PayPal window. Return here when done to check status.",
            duration: 8000
          });
          
          // Start polling to check payment status
          startPaymentStatusPolling(orderId);
        }
      }
    } catch (error) {
      console.error('Failed to open PayPal:', error);
      toast({
        title: "PayPal Error",
        description: "Could not open PayPal payment page",
        variant: "destructive"
      });
    }
  };
  
  // Poll for payment status after user is redirected to PayPal
  const startPaymentStatusPolling = (orderId: string) => {
    let attempts = 0;
    const maxAttempts = 30; // Poll for up to 5 minutes (10 seconds × 30)
    const pollInterval = 10000; // 10 seconds
    
    const checkPaymentStatus = async () => {
      if (attempts >= maxAttempts) {
        return; // Stop polling after max attempts
      }
      
      try {
        // Check the payment status
        const response = await fetch(`/api/payments/paypal/order-status?orderId=${orderId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // If payment is complete, process success
          if (data.status === 'COMPLETED' || data.status === 'APPROVED') {
            try {
              // Capture the payment
              const captureResponse = await apiRequest("POST", '/api/payments/paypal/capture-order', {
                orderId
              });
              
              if (captureResponse.ok) {
                const details = await captureResponse.json();
                
                // Handle successful payment
                toast({
                  title: "Payment Successful",
                  description: `Successfully purchased ${tokenAmount} tokens!`,
                  variant: "default"
                });
                
                onSuccess(orderId, details);
                return; // Stop polling
              }
            } catch (error) {
              console.error('Error capturing PayPal order:', error);
            }
          } else if (data.status === 'CANCELLED') {
            toast({
              title: "Payment Cancelled",
              description: "You've cancelled the PayPal payment",
              variant: "default"
            });
            onCancel();
            return; // Stop polling
          } else {
            // Continue polling if still pending
            attempts++;
            setTimeout(checkPaymentStatus, pollInterval);
          }
        } else {
          // Continue polling even on errors
          attempts++;
          setTimeout(checkPaymentStatus, pollInterval);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        attempts++;
        setTimeout(checkPaymentStatus, pollInterval);
      }
    };
    
    // Start the polling
    setTimeout(checkPaymentStatus, pollInterval);
  };

  if (isLoading) {
    return (
      <Button disabled className={className}>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading PayPal...
      </Button>
    );
  }

  if (error || !paypalConfig?.enabled) {
    return (
      <Button disabled variant="outline" className={className}>
        PayPal Temporarily Unavailable
      </Button>
    );
  }

  if (!isReady || !paypalConfig?.clientId) {
    return (
      <Button disabled variant="outline" className={className}>
        PayPal Not Configured
      </Button>
    );
  }
  
  // For fallback mode, show a direct button
  if (fallbackMode) {
    return (
      <Button 
        onClick={handleExternalPayPal} 
        disabled={creatingOrder}
        className={className}
      >
        {creatingOrder ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Opening PayPal...
          </>
        ) : (
          <>
            <span className="text-[#003087] font-bold mr-1">Pay</span>
            <span className="text-[#009cde] font-bold mr-2">Pal</span>
            <ExternalLink className="h-4 w-4" />
          </>
        )}
      </Button>
    );
  }

  // PayPal script options for standard mode
  const initialOptions = {
    clientId: paypalConfig.clientId,
    currency: "USD",
    intent: "capture",
    components: "buttons",
    // Enable popup mode for better compatibility
    "enable-funding": "paypal",
    "data-payment-method-preferred": "alternative"
  };
  
  // Add client token if available
  if (paypalConfig.clientToken) {
    initialOptions["data-client-token" as keyof typeof initialOptions] = paypalConfig.clientToken;
  }

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        style={{ 
          layout: "vertical",
          shape: "rect",
          label: "pay" 
        }}
        fundingSource={FUNDING.PAYPAL}
        forceReRender={[amount, tokenPackageId]}
        createOrder={async () => {
          try {
            const response = await apiRequest("POST", '/api/payments/paypal/create-order', {
              packageId: tokenPackageId
            });
            
            if (!response.ok) {
              throw new Error('Failed to create PayPal order');
            }
            
            const data = await response.json();
            return data.orderId;
          } catch (error) {
            console.error('Error creating PayPal order:', error);
            onError(error instanceof Error ? error : new Error('Failed to create PayPal order'));
            throw error;
          }
        }}
        onApprove={async (data, actions) => {
          try {
            const response = await apiRequest("POST", '/api/payments/paypal/capture-order', {
              orderId: data.orderID
            });
            
            if (!response.ok) {
              throw new Error('Failed to capture PayPal order');
            }
            
            const details = await response.json();

            // Handle successful payment
            toast({
              title: "Payment Successful",
              description: `Successfully purchased ${tokenAmount} tokens!`,
              variant: "default"
            });

            onSuccess(data.orderID, details);
            return details;
          } catch (error) {
            console.error('Error capturing PayPal order:', error);
            
            toast({
              title: "Payment Failed",
              description: error instanceof Error ? error.message : "Payment could not be processed",
              variant: "destructive"
            });
            
            onError(error instanceof Error ? error : new Error('Failed to capture PayPal payment'));
            throw error;
          }
        }}
        onCancel={() => {
          toast({
            title: "Payment Cancelled",
            description: "You've cancelled the PayPal payment",
            variant: "default"
          });
          onCancel();
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          
          toast({
            title: "Payment Error",
            description: "There was an error processing your payment",
            variant: "destructive"
          });
          
          onError(err instanceof Error ? err : new Error('PayPal payment error'));
        }}
      />
    </PayPalScriptProvider>
  );
}
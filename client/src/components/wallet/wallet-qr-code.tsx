import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Copy, ExternalLink, Download } from 'lucide-react';

interface WalletQRCodeProps {
  walletAddress: string | null;
  network: string;
}

export default function WalletQRCode({ walletAddress, network }: WalletQRCodeProps) {
  const { toast } = useToast();
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Generate QR code URL using a public service
  useEffect(() => {
    if (!walletAddress) {
      setQrCodeUrl(null);
      return;
    }

    setIsLoading(true);
    // Generate QR code for the wallet address (using Google Charts API)
    const size = 200;
    const qrUrl = `https://chart.googleapis.com/chart?cht=qr&chs=${size}x${size}&chl=${walletAddress}&choe=UTF-8`;
    
    // Simulate loading delay
    const timer = setTimeout(() => {
      setQrCodeUrl(qrUrl);
      setIsLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [walletAddress]);

  // Copy wallet address to clipboard
  const copyAddressToClipboard = () => {
    if (walletAddress) {
      navigator.clipboard.writeText(walletAddress);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  // Open explorer
  const openExplorer = () => {
    if (walletAddress) {
      const url = network === 'testnet' 
        ? `https://testnet.bscscan.com/address/${walletAddress}` 
        : `https://bscscan.com/address/${walletAddress}`;
      window.open(url, '_blank');
    }
  };

  // Download QR code as image
  const downloadQRCode = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `wallet-qr-${walletAddress?.substring(0, 6)}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Format address for display
  const formatAddress = (address: string | null) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!walletAddress) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wallet QR Code</CardTitle>
        <CardDescription>
          Scan to view your wallet on BSC{network === 'testnet' ? ' Testnet' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        {isLoading ? (
          <div className="flex flex-col items-center space-y-4">
            <Skeleton className="h-[200px] w-[200px] rounded-lg" />
            <Skeleton className="h-5 w-44" />
          </div>
        ) : qrCodeUrl ? (
          <>
            <div className="bg-white p-3 rounded mb-4">
              <img 
                src={qrCodeUrl} 
                alt="Wallet QR Code" 
                className="w-[200px] h-[200px]" 
              />
            </div>
            <div className="text-center mb-4">
              <p className="font-mono text-sm">{formatAddress(walletAddress)}</p>
            </div>
          </>
        ) : (
          <div className="text-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
            <p>Connect your wallet to generate a QR code</p>
          </div>
        )}

        <div className="flex space-x-2 mt-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={copyAddressToClipboard}
            disabled={!walletAddress}
          >
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={openExplorer}
            disabled={!walletAddress}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Explorer
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            onClick={downloadQRCode}
            disabled={!qrCodeUrl}
          >
            <Download className="h-4 w-4 mr-2" />
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
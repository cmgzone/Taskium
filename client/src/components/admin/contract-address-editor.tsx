import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ContractAddresses } from "@/lib/contract-utils";

interface ContractAddressEditorProps {
  network: 'testnet' | 'mainnet';
  currentAddress?: string;
  onUpdate?: (network: 'testnet' | 'mainnet', address: string) => void;
}

export default function ContractAddressEditor({ 
  network, 
  currentAddress, 
  onUpdate 
}: ContractAddressEditorProps) {
  const [address, setAddress] = useState(currentAddress || 
    (network === 'testnet' ? ContractAddresses.Testnet.TokenAddress : ContractAddresses.Mainnet.TokenAddress) || 
    '');
  const { toast } = useToast();
  
  const updateMutation = useMutation({
    mutationFn: async ({ network, address }: { network: string, address: string }) => {
      // Use apiRequest helper from queryClient.ts, but make sure params are right
      return apiRequest(
        'POST',
        '/api/admin/update-contract-address', 
        {
          network,
          address
        }
      );
    },
    onSuccess: (data) => {
      if (onUpdate) {
        onUpdate(network, address);
      }
      toast({
        title: "Contract address updated",
        description: `The ${network} contract address has been updated successfully.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update contract address",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleUpdate = () => {
    // Check if address is valid Ethereum format (0x followed by 40 hex characters)
    if (!address || !/^0x[a-fA-F0-9]{40}$/.test(address)) {
      toast({
        title: "Invalid address",
        description: "Please enter a valid Ethereum address (0x followed by 40 hex characters)",
        variant: "destructive",
      });
      return;
    }
    
    updateMutation.mutate({ network, address });
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-medium capitalize">{network} Address</h4>
            {updateMutation.isSuccess && (
              <span className="text-sm text-green-500 flex items-center">
                <Check className="h-4 w-4 mr-1" /> Updated
              </span>
            )}
          </div>
          <div className="flex space-x-2">
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Contract address (0x...)"
              className="flex-1"
            />
            <Button 
              onClick={handleUpdate} 
              disabled={updateMutation.isPending}
              size="sm"
            >
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating
                </>
              ) : "Update"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the deployed contract address for the {network} network.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
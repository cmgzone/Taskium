import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Plus,
  RefreshCw,
  Key,
  AlertTriangle,
  Copy,
  Check,
  Trash2,
  Edit,
  Wallet,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  XCircle,
  Search,
  Fingerprint,
  ExternalLink
} from "lucide-react";

// Schema for creating/updating a wallet configuration
const walletConfigSchema = z.object({
  network: z.string().min(1, "Network name is required"),
  publicAddress: z.string().min(1, "Public address is required"),
  contractAddress: z.string().min(1, "Contract address is required"),
  privateKeyEncrypted: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
  withdrawalsEnabled: z.boolean().default(false),
  depositsEnabled: z.boolean().default(false),
  chainId: z.number().or(z.string().transform(val => parseInt(val) || 0)).default(0),
  rpcUrl: z.string().default(""),
  explorerUrl: z.string().default(""),
  networkName: z.string().default(""),
  symbol: z.string().default("TSK"),
  decimals: z.number().or(z.string().transform(val => parseInt(val) || 18)).default(18),
});

type WalletConfiguration = {
  id: number;
  network: string;
  publicAddress: string;
  contractAddress: string;
  privateKeyEncrypted: string | null;
  description: string | null;
  isActive: boolean;
  lastUpdatedAt: string;
  updatedById: number | null;
  withdrawalsEnabled: boolean;
  depositsEnabled: boolean;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  networkName: string;
  symbol: string;
  decimals: number;
};

type WalletFormData = z.infer<typeof walletConfigSchema>;

// Explorer URLs for different networks
const explorerUrls: Record<string, string> = {
  "mainnet": "https://etherscan.io/address/",
  "testnet": "https://goerli.etherscan.io/address/",
  "bsc": "https://bscscan.com/address/",
  "polygon": "https://polygonscan.com/address/",
  "arbitrum": "https://arbiscan.io/address/",
  "optimism": "https://optimistic.etherscan.io/address/",
};

// Helper function to get explorer URL
const getExplorerUrl = (network: string, address: string) => {
  const baseUrl = explorerUrls[network.toLowerCase()] || "https://etherscan.io/address/";
  return `${baseUrl}${address}`;
};

// Format wallet address for display
const formatAddress = (address: string) => {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default function WalletConfiguration() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [walletToEdit, setWalletToEdit] = useState<WalletConfiguration | null>(null);
  const [showKeys, setShowKeys] = useState<Record<number, boolean>>({});
  const [copyStatus, setCopyStatus] = useState<Record<number, boolean>>({});

  // Query to fetch all wallet configurations
  const { 
    data: wallets = [], 
    isLoading, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ["/api/admin/wallet-configurations"],
    refetchOnWindowFocus: false,
  });

  // Form for adding a new wallet configuration
  const addForm = useForm<WalletFormData>({
    resolver: zodResolver(walletConfigSchema),
    defaultValues: {
      network: "",
      publicAddress: "",
      contractAddress: "",
      privateKeyEncrypted: null,
      description: "",
      isActive: true,
      withdrawalsEnabled: false,
      depositsEnabled: false,
      chainId: 0,
      rpcUrl: "",
      explorerUrl: "",
      networkName: "",
      symbol: "TSK",
      decimals: 18
    },
  });

  // Form for editing an existing wallet configuration
  const editForm = useForm<WalletFormData>({
    resolver: zodResolver(walletConfigSchema),
    defaultValues: {
      network: "",
      publicAddress: "",
      contractAddress: "",
      privateKeyEncrypted: null,
      description: "",
      isActive: true,
      withdrawalsEnabled: false,
      depositsEnabled: false,
      chainId: 0,
      rpcUrl: "",
      explorerUrl: "",
      networkName: "",
      symbol: "TSK",
      decimals: 18
    },
  });

  // Reset the add form when the modal opens/closes
  useEffect(() => {
    if (!isAddModalOpen) {
      addForm.reset();
    }
  }, [isAddModalOpen, addForm]);

  // Set up the edit form when a wallet is selected for editing
  useEffect(() => {
    if (walletToEdit) {
      // For security, we need to fetch the actual wallet configuration
      apiRequest(`/api/admin/wallet-configurations/${walletToEdit.network}`, {
        method: "GET"
      } as any)
        .then(response => {
          const data = response as any as WalletConfiguration;
          editForm.reset({
            network: data.network,
            publicAddress: data.publicAddress,
            contractAddress: data.contractAddress || "",
            privateKeyEncrypted: data.privateKeyEncrypted || null,
            description: data.description || "",
            isActive: data.isActive,
            withdrawalsEnabled: data.withdrawalsEnabled,
            depositsEnabled: data.depositsEnabled,
            chainId: data.chainId || 0,
            rpcUrl: data.rpcUrl || "",
            explorerUrl: data.explorerUrl || "",
            networkName: data.networkName || "",
            symbol: data.symbol || "TSK",
            decimals: data.decimals || 18
          });
        })
        .catch(err => {
          toast({
            title: "Error",
            description: "Failed to fetch wallet configuration details for editing.",
            variant: "destructive",
          });
          console.error("Error fetching wallet configuration details:", err);
        });
    }
  }, [walletToEdit, editForm, toast]);

  // Mutation for creating a new wallet configuration
  const createMutation = useMutation({
    mutationFn: (data: WalletFormData) => 
      apiRequest("/api/admin/wallet-configurations", {
        method: "POST",
        data,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet-configurations"] });
      setIsAddModalOpen(false);
      toast({
        title: "Success",
        description: "Wallet configuration created successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create wallet configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for updating an existing wallet configuration
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<WalletFormData> }) =>
      apiRequest(`/api/admin/wallet-configurations/${id}`, {
        method: "PUT",
        data,
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet-configurations"] });
      setIsEditModalOpen(false);
      setWalletToEdit(null);
      toast({
        title: "Success",
        description: "Wallet configuration updated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update wallet configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Mutation for deleting a wallet configuration
  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      apiRequest(`/api/admin/wallet-configurations/${id}`, {
        method: "DELETE",
      } as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/wallet-configurations"] });
      toast({
        title: "Success",
        description: "Wallet configuration deleted successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete wallet configuration. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Handle adding a new wallet configuration
  const onAddSubmit = (data: WalletFormData) => {
    createMutation.mutate(data);
  };

  // Handle editing an existing wallet configuration
  const onEditSubmit = (data: WalletFormData) => {
    if (!walletToEdit) return;
    
    updateMutation.mutate({
      id: walletToEdit.id,
      data,
    });
  };

  // Handle deleting a wallet configuration
  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this wallet configuration? This action cannot be undone.")) {
      deleteMutation.mutate(id);
    }
  };

  // Toggle visibility of a private key
  const toggleKeyVisibility = (id: number) => {
    setShowKeys(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Copy an address to clipboard
  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopyStatus(prev => ({ ...prev, [id]: true }));
        setTimeout(() => {
          setCopyStatus(prev => ({ ...prev, [id]: false }));
        }, 2000);
      },
      () => {
        toast({
          title: "Error",
          description: "Failed to copy to clipboard. Please try again.",
          variant: "destructive",
        });
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Wallet Configuration</h2>
          <p className="text-muted-foreground">
            Manage platform wallet addresses for different blockchain networks
          </p>
        </div>
        
        <Button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="h-4 w-4" />
          Add New Wallet
        </Button>
      </div>

      <Alert className="bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800 mb-6">
        <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-500" />
        <AlertTitle className="text-amber-800 dark:text-amber-500">Security Warning</AlertTitle>
        <AlertDescription className="text-amber-800 dark:text-amber-400">
          Wallet private keys are sensitive and should be handled with extreme care. For security, 
          private keys are encrypted in the database and masked in the UI. Only add private keys if withdrawals
          will be processed automatically.
        </AlertDescription>
      </Alert>

      <div className="flex justify-end mb-4">
        <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Display wallets */}
      <Card>
        <CardHeader>
          <CardTitle>Platform Wallet Addresses</CardTitle>
          <CardDescription>
            Configuration for all blockchain networks used by the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          {(!Array.isArray(wallets) || wallets.length === 0) ? (
            <div className="flex flex-col items-center justify-center py-12 bg-muted/30 rounded-lg border border-dashed">
              <div className="flex items-center justify-center rounded-full bg-primary/10 w-16 h-16 mb-4">
                <Wallet className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">No wallet configurations found</h3>
              <p className="text-muted-foreground text-center max-w-md mb-6">
                You haven't added any wallet configurations yet. Click the button below to add your first wallet.
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Add New Wallet Configuration
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Network</TableHead>
                  <TableHead>Public Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Withdrawals</TableHead>
                  <TableHead>Deposits</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(Array.isArray(wallets) ? wallets : []).map((wallet: WalletConfiguration) => (
                  <TableRow key={wallet.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={wallet.isActive ? "default" : "outline"} className="font-medium">
                          {wallet.network.toUpperCase()}
                        </Badge>
                        {wallet.description && (
                          <span className="text-muted-foreground text-xs">{wallet.description}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="font-mono text-sm max-w-[200px] truncate">
                          {formatAddress(wallet.publicAddress)}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(wallet.publicAddress, wallet.id)}
                          className="h-8 w-8 p-0"
                        >
                          {copyStatus[wallet.id] ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(getExplorerUrl(wallet.network, wallet.publicAddress), '_blank')}
                          className="h-8 w-8 p-0"
                          title="View on blockchain explorer"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {wallet.isActive ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Active</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span>Inactive</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {wallet.withdrawalsEnabled ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <ArrowUpRight className="h-4 w-4" />
                          <span>Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span>Disabled</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {wallet.depositsEnabled ? (
                        <div className="flex items-center gap-1.5 text-green-600">
                          <ArrowDownRight className="h-4 w-4" />
                          <span>Enabled</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <XCircle className="h-4 w-4" />
                          <span>Disabled</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setWalletToEdit(wallet);
                            setIsEditModalOpen(true);
                          }}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(wallet.id)}
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Add Wallet Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Wallet Configuration</DialogTitle>
            <DialogDescription>
              Add a new blockchain wallet address for the platform
            </DialogDescription>
          </DialogHeader>
          
          <Form {...addForm}>
            <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
              <FormField
                control={addForm.control}
                name="network"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., mainnet, testnet, bsc" {...field} />
                    </FormControl>
                    <FormDescription>
                      Identifier for the blockchain network (e.g., mainnet, testnet, bsc)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="publicAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Public wallet address for this network
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="contractAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormDescription>
                      TSK Token contract address on this network
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={addForm.control}
                name="privateKeyEncrypted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Private Key (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder="Private key will be encrypted" 
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Only add if automated withdrawals are needed. Will be stored encrypted.
                    </FormDescription>
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
                        placeholder="Optional description for this wallet" 
                        className="resize-none"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <h3 className="text-base font-semibold mt-4">Network Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={addForm.control}
                  name="chainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chain ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1 for Ethereum, 56 for BSC"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="networkName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Ethereum Mainnet, BSC"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="rpcUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RPC URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., https://bsc-dataseed.binance.org"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="explorerUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block Explorer URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., https://bscscan.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Symbol</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="TSK"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={addForm.control}
                  name="decimals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Decimals</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="18"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 18)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={addForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-xs">
                          Enable this wallet
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
                  name="withdrawalsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Withdrawals</FormLabel>
                        <FormDescription className="text-xs">
                          Allow withdrawals
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
                  name="depositsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Deposits</FormLabel>
                        <FormDescription className="text-xs">
                          Allow deposits
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
              
              <DialogFooter className="sm:justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>Save Configuration</>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Wallet Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Wallet Configuration</DialogTitle>
            <DialogDescription>
              Update this wallet configuration. Network name cannot be changed.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="network"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Network</FormLabel>
                    <FormControl>
                      <Input {...field} disabled className="bg-muted/50" />
                    </FormControl>
                    <FormDescription>
                      Network identifier cannot be changed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="publicAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Public Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="contractAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contract Address</FormLabel>
                    <FormControl>
                      <Input placeholder="0x..." {...field} />
                    </FormControl>
                    <FormDescription>
                      TSK Token contract address on this network
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={editForm.control}
                name="privateKeyEncrypted"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Private Key (Optional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={field.value ? "••••••••••••••" : "Enter new private key"}
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Leave empty to keep the current private key. Enter a new value to change it.
                    </FormDescription>
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
                        placeholder="Optional description for this wallet" 
                        className="resize-none"
                        {...field} 
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <h3 className="text-base font-semibold mt-4">Network Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="chainId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Chain ID</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 1 for Ethereum, 56 for BSC"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="networkName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Network Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Ethereum Mainnet, BSC"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="rpcUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>RPC URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., https://bsc-dataseed.binance.org"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="explorerUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Block Explorer URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., https://bscscan.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="symbol"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Symbol</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="TSK"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="decimals"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Token Decimals</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="18"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 18)}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={editForm.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Active</FormLabel>
                        <FormDescription className="text-xs">
                          Enable this wallet
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
                  name="withdrawalsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Withdrawals</FormLabel>
                        <FormDescription className="text-xs">
                          Allow withdrawals
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
                  name="depositsEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                      <div className="space-y-0.5">
                        <FormLabel>Deposits</FormLabel>
                        <FormDescription className="text-xs">
                          Allow deposits
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
              
              <DialogFooter className="sm:justify-end">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setWalletToEdit(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-white"
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>Update Configuration</>
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
import React, { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  Copy,
  ExternalLink,
  Loader2,
  RefreshCw,
  Shield,
  AlertTriangle,
  Users,
  Flame,
} from "lucide-react";
import BscscanApiConfig from "./bscscan-api-config";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useWeb3 } from "@/lib/web3-provider";
import { ContractAddresses, Networks, formatAddress } from "@/lib/contract-utils";
import ContractAddressEditor from "./contract-address-editor";
import BlockchainConfig from "./blockchain-config";

export default function BlockchainManagement() {
  const { toast } = useToast();
  const { connect, connected, provider, signer, address, disconnect, network, isCorrectNetwork, switchNetwork } = useWeb3();
  
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mintAmount, setMintAmount] = useState('');
  const [mintAddress, setMintAddress] = useState('');
  const [fundContractAmount, setFundContractAmount] = useState('');
  const [burnAmount, setBurnAmount] = useState('');
  const [burnAddress, setBurnAddress] = useState('');
  const [globalMiningRate, setGlobalMiningRate] = useState(1);
  const [newMiningRate, setNewMiningRate] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [userMiningRate, setUserMiningRate] = useState('');
  const [users, setUsers] = useState<any[]>([]);
  
  // Mutation for funding the contract
  const fundContractMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/fund-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(fundContractAmount)
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fund contract');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Contract Funded",
        description: `${fundContractAmount} tokens transferred to contract. Users can now withdraw tokens.`,
      });
      setFundContractAmount('');
    },
    onError: (error: Error) => {
      toast({
        title: "Funding Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for minting tokens
  const mintTokensMutation = useMutation({
    mutationFn: async () => {
      const endpoint = selectedUser 
        ? `/api/admin/users/${selectedUser}/tokens` 
        : '/api/admin/mint-tokens';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(mintAmount),
          walletAddress: mintAddress || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to mint tokens');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (selectedUser) {
        toast({
          title: "Balance Updated",
          description: `${mintAmount} $TSK tokens added to user balance`,
        });
        
        // Update users list with new balance
        setUsers(users.map(user => 
          user.id.toString() === selectedUser 
            ? {...user, tokenBalance: user.tokenBalance + parseFloat(mintAmount)} 
            : user
        ));
      } else {
        toast({
          title: "Tokens Minted",
          description: `${mintAmount} $TSK tokens sent to ${mintAddress}`,
        });
      }
      
      setMintAmount('');
    },
    onError: (error: Error) => {
      toast({
        title: "Token Operation Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for burning tokens
  const burnTokensMutation = useMutation({
    mutationFn: async () => {
      // Determine if burning from user balance or from address
      const endpoint = selectedUser 
        ? `/api/admin/users/${selectedUser}/burn-tokens` 
        : '/api/admin/burn-tokens';
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: parseFloat(burnAmount),
          walletAddress: burnAddress || undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to burn tokens');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      if (selectedUser) {
        toast({
          title: "Balance Updated",
          description: `${burnAmount} $TSK tokens burned from user balance`,
        });
        
        // Update users list with new balance
        setUsers(users.map(user => 
          user.id.toString() === selectedUser 
            ? {...user, tokenBalance: user.tokenBalance - parseFloat(burnAmount)} 
            : user
        ));
      } else {
        toast({
          title: "Tokens Burned",
          description: `${burnAmount} $TSK tokens burned from ${burnAddress}`,
        });
      }
      
      setBurnAmount('');
      setBurnAddress('');
    },
    onError: (error: Error) => {
      toast({
        title: "Token Burn Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating global mining rate
  const updateGlobalRateMutation = useMutation({
    mutationFn: async (rate: number) => {
      return { success: true, rate };
    },
    onSuccess: (data) => {
      setGlobalMiningRate(data.rate);
      toast({
        title: "Mining Rate Updated",
        description: `Global mining rate set to ${data.rate} $TSK/hr`,
      });
      setNewMiningRate('');
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating user mining multiplier
  const updateUserMultiplierMutation = useMutation({
    mutationFn: async ({ userId, multiplier }: { userId: string, multiplier: number }) => {
      return { success: true, userId, multiplier };
    },
    onSuccess: (data) => {
      toast({
        title: "User Mining Multiplier Updated",
        description: `User ${data.userId} multiplier set to ${data.multiplier}x`,
      });
      setUserMiningRate('');
      setSelectedUser('');
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Mutation for updating environment
  const updateEnvironmentMutation = useMutation({
    mutationFn: async (network: 'testnet' | 'mainnet') => {
      return { success: true, network };
    },
    onSuccess: (data) => {
      // In a real app, this would trigger a network switch via switchNetwork function
      toast({
        title: "Environment Updated",
        description: `Switched to ${data.network} environment`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Query for fetching users
  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/admin/users'],
    queryFn: async () => {
      const response = await fetch('/api/admin/users');
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      return await response.json();
    },
    enabled: true,
  });
  
  useEffect(() => {
    if (usersData) {
      setUsers(usersData);
    }
  }, [usersData]);
  
  // Function to refresh contract info
  const refreshContractInfo = async () => {
    setIsLoading(true);
    try {
      // Fetch contract info from API
      const response = await fetch('/api/admin/contract-info');
      
      if (!response.ok) {
        throw new Error('Failed to fetch contract information');
      }
      
      const data = await response.json();
      setContractInfo(data);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch contract information",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Copy address to clipboard
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: "Address copied to clipboard",
    });
  };
  
  // View on blockchain explorer
  const viewOnExplorer = (address: string) => {
    const explorerUrl = network === 'testnet'
      ? `${Networks.BSCTestnet.blockExplorerUrls[0]}/address/${address}`
      : `${Networks.BSCMainnet.blockExplorerUrls[0]}/address/${address}`;
    
    window.open(explorerUrl, '_blank');
  };
  
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-3xl font-bold tracking-tight mb-6">Blockchain Management</h2>
      
      <Tabs defaultValue="contract-info" className="space-y-4">
        <TabsList className="grid grid-cols-5 gap-4">
          <TabsTrigger value="contract-info">Contract Info</TabsTrigger>
          <TabsTrigger value="token-management">Token Management</TabsTrigger>
          <TabsTrigger value="mining-rate">Mining Rate</TabsTrigger>
          <TabsTrigger value="bscscan-api">BSCScan API</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
        </TabsList>
        
        {/* CONTRACT INFO */}
        <TabsContent value="contract-info" className="space-y-4">
          <BlockchainConfig />
          <Card>
            <CardHeader>
              <CardTitle>Contract Information</CardTitle>
              <CardDescription>
                View and manage the token contract details
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end mb-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={refreshContractInfo}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Refresh
                </Button>
              </div>
              
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : contractInfo ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Token Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Name</span>
                          <span className="font-medium">{contractInfo.name}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Symbol</span>
                          <span className="font-medium">{contractInfo.symbol}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Total Supply</span>
                          <span className="font-medium">{contractInfo.totalSupply}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Decimals</span>
                          <span className="font-medium">{contractInfo.decimals}</span>
                        </div>
                        <div className="flex justify-between py-1 border-b">
                          <span className="text-muted-foreground">Owner</span>
                          <span className="font-medium">{formatAddress(contractInfo.owner)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Contract Addresses</h3>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Badge variant="outline">Testnet</Badge>
                          </div>
                          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                            <code className="text-xs truncate max-w-[200px]">{contractInfo.testnetAddress}</code>
                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => copyToClipboard(contractInfo.testnetAddress)}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => viewOnExplorer(contractInfo.testnetAddress)}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center">
                            <Badge>Mainnet</Badge>
                          </div>
                          <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-2 rounded-md">
                            <code className="text-xs truncate max-w-[200px]">
                              {contractInfo.mainnetAddress === "0x0000000000000000000000000000000000000000" 
                                ? "Not deployed" 
                                : contractInfo.mainnetAddress}
                            </code>
                            <div className="flex items-center">
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => copyToClipboard(contractInfo.mainnetAddress)}
                                disabled={contractInfo.mainnetAddress === "0x0000000000000000000000000000000000000000"}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => viewOnExplorer(contractInfo.mainnetAddress)}
                                disabled={contractInfo.mainnetAddress === "0x0000000000000000000000000000000000000000"}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t">
                    <h3 className="text-lg font-medium mb-2">Contract Address Management</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ContractAddressEditor 
                        network="testnet"
                        currentAddress={contractInfo.testnetAddress}
                        onUpdate={(network, address) => {
                          toast({
                            title: "Updating Contract Address",
                            description: "Setting new testnet contract address...",
                          });
                          // ContractAddressEditor component already handles the API call,
                          // so we only need to refresh the data
                          setTimeout(() => {
                            refreshContractInfo();
                          }, 500);
                        }}
                      />
                      
                      <ContractAddressEditor 
                        network="mainnet"
                        currentAddress={contractInfo.mainnetAddress}
                        onUpdate={(network, address) => {
                          toast({
                            title: "Updating Contract Address",
                            description: "Setting new mainnet contract address...",
                          });
                          // ContractAddressEditor component already handles the API call,
                          // so we only need to refresh the data
                          setTimeout(() => {
                            refreshContractInfo();
                          }, 500);
                        }}
                      />
                    </div>
                    
                    <div className="mt-6 pt-4 border-t">
                      <h3 className="text-lg font-medium mb-2">Deployment Actions</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium flex items-center">
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Re-deploy to Testnet
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 mb-3">
                            Deploy a new version of the token contract to BSC Testnet
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              toast({
                                title: "Deployment",
                                description: "Please use the deployment scripts as described in DEPLOYMENT.md",
                              });
                            }}
                          >
                            Run Deployment
                          </Button>
                        </div>
                        
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-medium flex items-center">
                            <Shield className="mr-2 h-4 w-4 text-red-500" />
                            Deploy to Mainnet
                          </h4>
                          <p className="text-sm text-muted-foreground mt-1 mb-3">
                            Deploy the token contract to BSC Mainnet (production)
                          </p>
                          <Button 
                            size="sm" 
                            variant="default"
                            className="bg-red-500 hover:bg-red-600"
                            onClick={() => {
                              toast({
                                title: "Mainnet Deployment",
                                description: "Please follow the mainnet deployment instructions in DEPLOYMENT.md",
                                variant: "destructive",
                              });
                            }}
                          >
                            Mainnet Deployment
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">
                    Click refresh to load contract information
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* TOKEN MANAGEMENT */}
        <TabsContent value="token-management" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Token Management</CardTitle>
              <CardDescription>
                Mint, burn, and manage token distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Fund Contract Section */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 bg-yellow-50 dark:bg-yellow-950/20">
                  <h3 className="font-medium mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2 text-yellow-500" />
                    Fund Contract for Withdrawals
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Send tokens to the contract address to enable user withdrawals. The contract must have tokens in its balance for withdrawals to work.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="fundContractAmount">Amount to Fund</Label>
                      <Input
                        id="fundContractAmount"
                        type="number"
                        min="1"
                        placeholder="Enter token amount"
                        value={fundContractAmount}
                        onChange={(e) => setFundContractAmount(e.target.value)}
                      />
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!fundContractAmount) return;
                        const amount = parseFloat(fundContractAmount);
                        if (isNaN(amount) || amount <= 0) {
                          toast({
                            title: "Invalid amount",
                            description: "Please enter a positive number",
                            variant: "destructive",
                          });
                          return;
                        }
                        fundContractMutation.mutate();
                      }}
                      disabled={fundContractMutation.isPending}
                      variant="default"
                    >
                      {fundContractMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Funding Contract...
                        </>
                      ) : (
                        "Fund Contract"
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Mint Tokens Section */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Shield className="w-4 h-4 mr-2" />
                    Mint Tokens
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Mint new tokens and send them to a specific wallet address or user.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="mintAmount">Amount</Label>
                      <Input
                        id="mintAmount"
                        type="number"
                        min="1"
                        placeholder="Enter token amount"
                        value={mintAmount}
                        onChange={(e) => setMintAmount(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="mintAddress">Recipient Address</Label>
                      <Input
                        id="mintAddress"
                        placeholder="0x..."
                        value={mintAddress}
                        onChange={(e) => setMintAddress(e.target.value)}
                      />
                    </div>
                    
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (!mintAmount || !mintAddress) return;
                        const amount = parseFloat(mintAmount);
                        if (isNaN(amount) || amount <= 0) {
                          toast({
                            title: "Invalid amount",
                            description: "Please enter a positive number",
                            variant: "destructive",
                          });
                          return;
                        }
                        if (!mintAddress.startsWith("0x") || mintAddress.length !== 42) {
                          toast({
                            title: "Invalid address",
                            description: "Please enter a valid Ethereum address",
                            variant: "destructive",
                          });
                          return;
                        }
                        mintTokensMutation.mutate();
                      }}
                      disabled={mintTokensMutation.isPending}
                    >
                      {mintTokensMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Minting...
                        </>
                      ) : (
                        "Mint Tokens"
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* Burn Tokens Section */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 bg-red-50 dark:bg-red-950/20">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Flame className="w-4 h-4 mr-2 text-red-500" />
                    Burn Tokens
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Permanently remove tokens from circulation to reduce total supply.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="burnAmount">Amount to Burn</Label>
                      <Input
                        id="burnAmount"
                        type="number"
                        min="1"
                        placeholder="Enter token amount"
                        value={burnAmount}
                        onChange={(e) => setBurnAmount(e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="burnAddress">Source Address</Label>
                      <Input
                        id="burnAddress"
                        placeholder="0x..."
                        value={burnAddress}
                        onChange={(e) => setBurnAddress(e.target.value)}
                      />
                    </div>
                    
                    <Button
                      className="w-full"
                      variant="destructive"
                      onClick={() => {
                        if (!burnAmount || !burnAddress) return;
                        const amount = parseFloat(burnAmount);
                        if (isNaN(amount) || amount <= 0) {
                          toast({
                            title: "Invalid amount",
                            description: "Please enter a positive number",
                            variant: "destructive",
                          });
                          return;
                        }
                        if (!burnAddress.startsWith("0x") || burnAddress.length !== 42) {
                          toast({
                            title: "Invalid address",
                            description: "Please enter a valid Ethereum address",
                            variant: "destructive",
                          });
                          return;
                        }
                        
                        // Confirm burn operation
                        if (confirm(`Are you sure you want to burn ${amount} $TSK tokens from ${burnAddress}? This operation cannot be undone.`)) {
                          burnTokensMutation.mutate();
                        }
                      }}
                      disabled={burnTokensMutation.isPending}
                    >
                      {burnTokensMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Burning...
                        </>
                      ) : (
                        "Burn Tokens"
                      )}
                    </Button>
                  </div>
                </div>
                
                {/* User Token Management */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    User Token Management
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adjust token balances for specific users.
                  </p>
                  
                  <div className="space-y-4">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Username</TableHead>
                          <TableHead>Balance</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell className="font-medium">{user.username}</TableCell>
                            <TableCell>{user.tokenBalance} $TSK</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedUser(user.id.toString());
                                  setMintAddress("");
                                  toast({
                                    title: "User Selected",
                                    description: `${user.username} selected for token management`,
                                  });
                                }}
                              >
                                Select
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    
                    {selectedUser && (
                      <div className="mt-4 pt-4 border-t space-y-4">
                        <h4 className="font-medium">Adjust Balance</h4>
                        
                        <div className="grid grid-cols-1 gap-4">
                          {/* Add Tokens */}
                          <div>
                            <h5 className="text-sm font-medium text-green-600 dark:text-green-500 mb-2">Add Tokens</h5>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={mintAmount}
                                onChange={(e) => setMintAmount(e.target.value)}
                              />
                              <Button
                                variant="outline"
                                className="border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                                onClick={() => {
                                  if (!mintAmount) return;
                                  const amount = parseFloat(mintAmount);
                                  if (isNaN(amount) || amount <= 0) {
                                    toast({
                                      title: "Invalid amount",
                                      description: "Please enter a positive number",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  mintTokensMutation.mutate();
                                }}
                                disabled={mintTokensMutation.isPending}
                              >
                                {mintTokensMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Add"
                                )}
                              </Button>
                            </div>
                          </div>
                          
                          {/* Burn Tokens */}
                          <div>
                            <h5 className="text-sm font-medium text-red-600 dark:text-red-500 mb-2">Burn Tokens</h5>
                            <div className="flex items-center space-x-2">
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={burnAmount}
                                onChange={(e) => setBurnAmount(e.target.value)}
                              />
                              <Button
                                variant="outline"
                                className="border-red-500 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                onClick={() => {
                                  if (!burnAmount) return;
                                  const amount = parseFloat(burnAmount);
                                  if (isNaN(amount) || amount <= 0) {
                                    toast({
                                      title: "Invalid amount",
                                      description: "Please enter a positive number",
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  const selectedUserObj = users.find(u => u.id.toString() === selectedUser);
                                  if (selectedUserObj && amount > selectedUserObj.tokenBalance) {
                                    toast({
                                      title: "Insufficient balance",
                                      description: `User only has ${selectedUserObj.tokenBalance} $TSK available`,
                                      variant: "destructive",
                                    });
                                    return;
                                  }
                                  
                                  // Confirm burn operation
                                  if (confirm(`Are you sure you want to burn ${amount} $TSK tokens from this user's balance? This operation cannot be undone.`)) {
                                    burnTokensMutation.mutate();
                                  }
                                }}
                                disabled={burnTokensMutation.isPending}
                              >
                                {burnTokensMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  "Burn"
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* MINING RATE MANAGEMENT */}
        <TabsContent value="mining-rate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Mining Rate Management</CardTitle>
              <CardDescription>
                Adjust global and user-specific mining rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Global Mining Rate Section */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Global Mining Rate
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Set the base mining rate for all users. This affects how many $TSK tokens can be mined per hour.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Current Rate:</span>
                      <span className="text-lg font-bold">{globalMiningRate} $TSK/hour</span>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="globalMiningRate">New Mining Rate</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="globalMiningRate"
                          type="number"
                          min="0.001"
                          step="0.001"
                          placeholder="Enter new rate"
                          value={newMiningRate}
                          onChange={(e) => setNewMiningRate(e.target.value)}
                        />
                        <Button
                          variant="default"
                          onClick={() => {
                            if (!newMiningRate) return;
                            const rate = parseFloat(newMiningRate);
                            if (isNaN(rate) || rate < 0.001) {
                              toast({
                                title: "Invalid value",
                                description: "Please enter a valid number (minimum 0.001)",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Call API to update global mining rate
                            fetch('/api/admin/mining-settings', {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                baseMiningRate: rate,
                              }),
                            })
                            .then(response => response.json())
                            .then(data => {
                              setGlobalMiningRate(rate);
                              toast({
                                title: "Mining Rate Updated",
                                description: `Global mining rate set to ${rate} $TSK/hr`,
                              });
                              setNewMiningRate('');
                            })
                            .catch(error => {
                              console.error('Error updating mining rate:', error);
                              toast({
                                title: "Update Failed",
                                description: "Failed to update global mining rate",
                                variant: "destructive",
                              });
                            });
                          }}
                          disabled={!newMiningRate}
                        >
                          Update
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Specify the amount of $TSK tokens that can be mined per hour
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* User-specific Mining Rate Section */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <Users className="w-4 h-4 mr-2" />
                    User Mining Multiplier
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Adjust mining multipliers for individual users to reward active participants.
                  </p>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="userSelect">Select User</Label>
                      <select
                        id="userSelect"
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                        value={selectedUser}
                        onChange={(e) => setSelectedUser(e.target.value)}
                      >
                        <option value="">Select a user</option>
                        {users.map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.username} (Current: {user.miningRate}x)
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="userMiningRate">New Multiplier</Label>
                      <div className="flex items-center space-x-2">
                        <Input
                          id="userMiningRate"
                          type="number"
                          min="0.001"
                          step="0.001"
                          max="5"
                          placeholder="Enter multiplier"
                          value={userMiningRate}
                          onChange={(e) => setUserMiningRate(e.target.value)}
                          disabled={!selectedUser}
                        />
                        <Button
                          variant="default"
                          onClick={() => {
                            if (!selectedUser || !userMiningRate) return;
                            const multiplier = parseFloat(userMiningRate);
                            if (isNaN(multiplier) || multiplier < 0.001 || multiplier > 5) {
                              toast({
                                title: "Invalid value",
                                description: "Please enter a multiplier between 0.001 and 5",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            // Call API to update user mining multiplier
                            fetch(`/api/admin/users/${selectedUser}/mining-rate`, {
                              method: 'PATCH',
                              headers: {
                                'Content-Type': 'application/json',
                              },
                              body: JSON.stringify({
                                miningMultiplier: multiplier,
                              }),
                            })
                            .then(response => response.json())
                            .then(data => {
                              toast({
                                title: "Multiplier Updated",
                                description: `Mining multiplier updated for user`,
                              });
                              
                              // Update the users array with the new multiplier
                              setUsers(users.map(user => 
                                user.id === parseInt(selectedUser) 
                                  ? {...user, miningRate: multiplier} 
                                  : user
                              ));
                              
                              setUserMiningRate('');
                              setSelectedUser('');
                            })
                            .catch(error => {
                              console.error('Error updating user mining rate:', error);
                              toast({
                                title: "Update Failed",
                                description: "Failed to update user mining rate",
                                variant: "destructive",
                              });
                            });
                          }}
                          disabled={!selectedUser || !userMiningRate}
                        >
                          Update
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Multiplier applies to the base mining rate (e.g., 1.5x means 50% bonus)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Advanced Mining Settings */}
              <div className="mt-6">
                <Separator className="my-4" />
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Advanced Mining Settings</h3>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      toast({
                        title: "Advanced Settings",
                        description: "Open the Mining Management panel for more options",
                      });
                      window.location.href = "/admin?tab=mining";
                    }}
                  >
                    Open Mining Management
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1 mb-4">
                  Configure mining streaks, bonuses, and daily rewards in the full Mining Management panel.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Mining Cooldown</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">24 hours</div>
                      <p className="text-xs text-muted-foreground">Time between mining sessions</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Streak Bonus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">5% per day</div>
                      <p className="text-xs text-muted-foreground">Bonus for consecutive mining</p>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Lucky Bonus</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xl font-bold">10% chance</div>
                      <p className="text-xs text-muted-foreground">Chance to double mining rewards</p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* ENVIRONMENT MANAGEMENT */}
        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Environment Configuration</CardTitle>
              <CardDescription>
                Manage application environment and blockchain settings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Network Selection */}
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                    <h3 className="font-medium mb-3 flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Network Environment
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select the blockchain network environment for the application.
                      This affects which contract addresses are used for transactions.
                    </p>
                    
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Current Network:</span>
                        <Badge variant={network === 'mainnet' ? 'default' : 'outline'}>
                          {network === 'mainnet' ? 'Mainnet' : 'Testnet'}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <Button 
                          variant={network === 'testnet' ? 'default' : 'outline'}
                          onClick={() => switchNetwork('testnet')}
                          className="w-full"
                        >
                          Switch to Testnet
                        </Button>
                        <Button 
                          variant={network === 'mainnet' ? 'default' : 'outline'}
                          onClick={() => switchNetwork('mainnet')}
                          className="w-full"
                        >
                          Switch to Mainnet
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Connection Status */}
                  <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                    <h3 className="font-medium mb-3 flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Wallet Connection Status
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      View and manage your blockchain wallet connection status.
                    </p>
                    
                    <div className="flex flex-col space-y-4">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Status:</span>
                        <Badge variant={connected ? 'default' : 'outline'}>
                          {connected ? 'Connected' : 'Disconnected'}
                        </Badge>
                      </div>
                      
                      {connected && (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm font-medium">Address:</span>
                          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                            {formatAddress(address)}
                          </code>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium">Network Match:</span>
                        <Badge variant={isCorrectNetwork ? 'success' : 'destructive'}>
                          {isCorrectNetwork ? 'Correct Network' : 'Wrong Network'}
                        </Badge>
                      </div>
                      
                      {connected ? (
                        <Button 
                          variant="outline"
                          onClick={() => disconnect()}
                          className="w-full"
                        >
                          Disconnect Wallet
                        </Button>
                      ) : (
                        <Button 
                          variant="default"
                          onClick={() => connect()}
                          className="w-full"
                        >
                          Connect Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* App Environment Settings */}
                <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
                  <h3 className="font-medium mb-3 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Environment Variables
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These environment variables control application behavior.
                    Changes require redeployment.
                  </p>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded border bg-gray-50 dark:bg-gray-800 p-2">
                        <span className="text-xs font-medium">VITE_CURRENT_NETWORK</span>
                        <div className="text-sm mt-1">{import.meta.env.VITE_CURRENT_NETWORK || 'testnet'}</div>
                      </div>
                      
                      <div className="rounded border bg-gray-50 dark:bg-gray-800 p-2">
                        <span className="text-xs font-medium">NODE_ENV</span>
                        <div className="text-sm mt-1">{import.meta.env.NODE_ENV || 'development'}</div>
                      </div>
                    </div>
                    
                    <div className="rounded border bg-gray-50 dark:bg-gray-800 p-2">
                      <span className="text-xs font-medium">Environment Note</span>
                      <div className="text-sm mt-1">
                        To permanently change environment variables, update the .env file and redeploy the application.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* BSCSCAN API */}
        <TabsContent value="bscscan-api" className="space-y-4">
          <BscscanApiConfig />
        </TabsContent>
      </Tabs>
    </div>
  );
}
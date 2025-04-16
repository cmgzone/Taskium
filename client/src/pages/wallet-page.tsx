import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import BlockchainActivityVisualization from "@/components/blockchain/activity-visualization";
import TransactionHistory from "@/components/wallet/transaction-history";
import WalletQRCode from "@/components/wallet/wallet-qr-code";
import TokenPriceChart from "@/components/wallet/token-price-chart";
import { WalletSelector } from "@/components/wallet/wallet-selector";
import { WalletDiagnostic } from "@/components/wallet/wallet-diagnostic";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTokenAmount, formatAddress, isValidAddress } from "@/lib/contract-utils";
import { useWeb3 } from "@/lib/web3-provider";
import { 
  Loader2, ExternalLink, Copy, AlertTriangle, Check, X, Wallet, 
  Info as InfoIcon, Activity, TrendingUp, QrCode
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { NetworkType } from "@/lib/web3-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function WalletPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { 
    connected, 
    address, 
    connect, 
    network, 
    switchNetwork, 
    isCorrectNetwork,
    chainId
  } = useWeb3();
  
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [customWalletAddress, setCustomWalletAddress] = useState("");
  const [customAddressValid, setCustomAddressValid] = useState<boolean | null>(null);
  const [useConnectedWallet, setUseConnectedWallet] = useState(true);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Handle wallet connection
  const handleConnectWallet = async () => {
    try {
      // This is now handled by the WalletSelector component directly
      setUseConnectedWallet(true);
    } catch (error) {
      toast({
        title: "Wallet Connection Failed",
        description: "Failed to connect to your wallet. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Copy wallet address to clipboard
  const copyAddressToClipboard = () => {
    if (address) {
      navigator.clipboard.writeText(address);
      toast({
        title: "Address Copied",
        description: "Wallet address copied to clipboard",
      });
    }
  };

  // Withdraw tokens mutation
  const withdrawMutation = useMutation({
    mutationFn: async () => {
      // Use connected wallet address or custom address based on user selection
      const withdrawalAddress = useConnectedWallet ? address : customWalletAddress;
      
      // Perform explicit validation before sending the request
      if (!withdrawalAddress) {
        console.error("Withdrawal failed: No wallet address provided");
        throw new Error("No wallet address provided");
      }

      // Validate wallet address format using our utility function
      if (!isValidAddress(withdrawalAddress)) {
        console.error("Withdrawal failed: Invalid wallet address format", withdrawalAddress);
        throw new Error("Invalid wallet address format. Must be a valid BNB Smart Chain address (0x followed by 40 hex characters)");
      }
      
      const amount = parseFloat(withdrawAmount);
      if (isNaN(amount) || amount <= 0) {
        throw new Error("Please enter a valid withdrawal amount");
      }
      
      console.log(`Initiating withdrawal of ${amount} $TSK tokens to wallet: ${withdrawalAddress}`);
      console.log(`Using network: mainnet (forced)`);
      
      try {
        // Always use mainnet for withdrawals regardless of connected wallet network
        const res = await apiRequest("POST", "/api/wallet/withdraw", {
          amount: amount,
          walletAddress: withdrawalAddress,
          network: "mainnet" // Always use mainnet
        });
        
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          console.error("Withdrawal API error:", errorData);
          throw new Error(errorData.message || `Withdrawal failed with status ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Withdrawal API response:", data);
        return data;
      } catch (error) {
        console.error("Withdrawal request failed:", error);
        throw error;
      }
    },
    onSuccess: (data) => {
      console.log("Withdrawal successful:", data);
      
      // Update user data in cache with new balance
      const currentUser = queryClient.getQueryData<any>(["/api/user"]);
      if (currentUser) {
        console.log(`Updating user balance from ${currentUser.tokenBalance} to ${data.newBalance}`);
        queryClient.setQueryData(["/api/user"], {
          ...currentUser,
          tokenBalance: data.newBalance
        });
      }

      // Reset withdrawal amount
      setWithdrawAmount("");
      
      toast({
        title: "Withdrawal Successful",
        description: `${formatTokenAmount(parseFloat(withdrawAmount))} $TSK tokens have been sent to your wallet.`,
      });
    },
    onError: (error: Error) => {
      console.error("Withdrawal mutation error:", error);
      
      // Check for specific error messages and provide more user-friendly guidance
      const errorMsg = error.message.toLowerCase();
      
      if (errorMsg.includes("insufficient contract balance") || errorMsg.includes("contract balance")) {
        toast({
          title: "Withdrawal Failed - Insufficient Contract Balance",
          description: "The system contract does not have enough tokens to process withdrawals at this time. Please contact support or try again later when the contract has been funded.",
          variant: "destructive",
        });
      } else if (errorMsg.includes("invalid wallet address") || errorMsg.includes("address format")) {
        toast({
          title: "Withdrawal Failed - Invalid Address",
          description: "The wallet address you provided is not valid. Please check the format and try again.",
          variant: "destructive",
        });
        
        // Highlight the address input field as invalid if using custom address
        if (!useConnectedWallet) {
          setCustomAddressValid(false);
        }
      } else if (errorMsg.includes("no wallet address")) {
        toast({
          title: "Withdrawal Failed",
          description: "No wallet address was provided. Please connect a wallet or enter a valid address.",
          variant: "destructive",
        });
      } else if (errorMsg.includes("amount") || errorMsg.includes("balance")) {
        toast({
          title: "Withdrawal Failed - Invalid Amount",
          description: "The withdrawal amount is invalid or exceeds your available balance.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Withdrawal Failed",
          description: error.message,
          variant: "destructive",
        });
      }
    }
  });
  
  // Keep track of KYC status
  const [kycStatus, setKycStatus] = useState<string | null>(null);
  
  // Fetch KYC status when required for withdrawal
  const checkKycStatus = async () => {
    try {
      console.log("Checking KYC status for withdrawal...");
      const res = await apiRequest("GET", "/api/kyc/status");
      const data = await res.json();
      console.log("KYC status response:", data);
      setKycStatus(data.status);
      
      if (data.status === "verified") {
        console.log("User has verified KYC status - withdrawal allowed");
      } else if (data.status === "pending") {
        console.log("User has pending KYC verification - withdrawal denied");
      } else if (data.status === "rejected") {
        console.log("User has rejected KYC - withdrawal denied");
        console.log("Rejection reason:", data.rejectionReason);
      } else {
        console.log("User has unverified KYC status - withdrawal denied");
      }
      
      return data.status;
    } catch (error) {
      console.error("Failed to fetch KYC status:", error);
      setKycStatus("error");
      return "error";
    }
  };
  
  // Fetch KYC status when component mounts
  useEffect(() => {
    checkKycStatus();
  }, []);
  
  // Reset custom address validation when switching wallet types
  useEffect(() => {
    if (useConnectedWallet) {
      // When switching to connected wallet, we don't need to validate custom address
      setCustomAddressValid(null);
    } else if (customWalletAddress) {
      // When switching to custom wallet, validate any existing address
      setCustomAddressValid(isValidAddress(customWalletAddress));
    }
  }, [useConnectedWallet, customWalletAddress]);

  // Validate withdrawal amount and wallet address
  const isWithdrawalValid = () => {
    const amount = parseFloat(withdrawAmount);
    const walletAddress = useConnectedWallet ? address : customWalletAddress;
    
    // Amount validation
    const isAmountValid = (
      !isNaN(amount) && 
      amount > 0 && 
      amount <= (user?.tokenBalance || 0)
    );
    
    // Address validation using our utility function
    const isAddressValid = isValidAddress(walletAddress);
    
    // Both amount and address must be valid
    const isBasicValid = isAmountValid && isAddressValid;
    
    // For connected wallets, network validation is no longer needed as we always use mainnet
    // We'll leave this code for backward compatibility but remove the network check
    if (useConnectedWallet && connected) {
      // Since we're forcing mainnet on the backend, we don't need to check network here
      return isBasicValid;
    }
    
    return isBasicValid;
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <MobileMenu />
      
      <main className="flex-grow">
        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm p-4">
          <h2 className="text-xl font-semibold">Wallet</h2>
          
          {/* Token Balance Display */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full py-1 px-4">
            <span className="mr-2 text-yellow-500">
              <i className="fas fa-coin"></i>
            </span>
            <span className="font-medium">{formatTokenAmount(user?.tokenBalance || 0)}</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">$TSK</span>
          </div>
        </header>
        
        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Wallet Dashboard</h1>
            <p className="text-muted-foreground">Manage your tokens, track transactions and withdraw to your blockchain wallet</p>
          </div>
          
          {/* Wallet Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="overview" className="flex items-center space-x-2">
                <Activity className="h-4 w-4" /> 
                <span className="hidden sm:inline">Overview</span>
              </TabsTrigger>
              <TabsTrigger value="withdraw" className="flex items-center space-x-2">
                <Wallet className="h-4 w-4" /> 
                <span className="hidden sm:inline">Withdraw</span>
              </TabsTrigger>
              <TabsTrigger value="price" className="flex items-center space-x-2">
                <TrendingUp className="h-4 w-4" /> 
                <span className="hidden sm:inline">Price</span>
              </TabsTrigger>
              <TabsTrigger value="qrcode" className="flex items-center space-x-2">
                <QrCode className="h-4 w-4" /> 
                <span className="hidden sm:inline">QR Code</span>
              </TabsTrigger>
            </TabsList>
          
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Token Balance</CardTitle>
                    <div className="text-2xl font-bold">{formatTokenAmount(user?.tokenBalance || 0)} $TSK</div>
                  </CardHeader>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">Wallet Status</CardTitle>
                    <div className="text-lg font-medium flex items-center space-x-2">
                      {connected ? (
                        <>
                          <Badge variant="success" className="bg-green-500">Connected</Badge>
                          <span className="text-sm text-muted-foreground">{formatAddress(address)}</span>
                        </>
                      ) : (
                        <Badge variant="outline">Not Connected</Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
                
                <Card>
                  <CardHeader className="py-4">
                    <CardTitle className="text-sm font-medium text-muted-foreground">KYC Status</CardTitle>
                    <div className="text-lg font-medium">
                      {kycStatus === "verified" ? (
                        <Badge variant="success" className="bg-green-500">Verified</Badge>
                      ) : kycStatus === "pending" ? (
                        <Badge variant="outline" className="bg-yellow-500 text-yellow-700 border-yellow-400">Pending</Badge>
                      ) : (
                        <Badge variant="destructive">Required</Badge>
                      )}
                    </div>
                  </CardHeader>
                </Card>
              </div>
              
              {/* Transaction History */}
              <TransactionHistory />
              
              {/* Blockchain Activity */}
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Activity</CardTitle>
                  <CardDescription>
                    Real-time insights into $TSK token transactions on the BNB Smart Chain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <BlockchainActivityVisualization />
                </CardContent>
              </Card>
            </TabsContent>
            
            {/* Withdraw Tab */}
            <TabsContent value="withdraw" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle>Withdraw Tokens</CardTitle>
                      <CardDescription>
                        Withdraw your $TSK tokens to your BNB Smart Chain wallet
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Wallet Connection */}
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">1. Select withdrawal destination</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card className={`cursor-pointer border-2 ${useConnectedWallet ? 'border-primary' : 'border-transparent'}`}
                              onClick={() => setUseConnectedWallet(true)}
                            >
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-medium">Connected Wallet</h4>
                                  {useConnectedWallet && (
                                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                                  )}
                                </div>
                                
                                {connected ? (
                                  <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                                    <div className="flex items-center space-x-2 truncate max-w-[200px]">
                                      <span className="truncate">{formatAddress(address)}</span>
                                    </div>
                                    <div className="flex items-center">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={copyAddressToClipboard}
                                      >
                                        <Copy className="h-4 w-4" />
                                      </Button>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-8 w-8"
                                        onClick={() => window.open(`https://bscscan.com/address/${address}`, '_blank')}
                                      >
                                        <ExternalLink className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <WalletSelector 
                                    onWalletConnected={handleConnectWallet}
                                    size="default"
                                    variant="default"
                                    className="w-full"
                                  />
                                )}
                              </CardContent>
                            </Card>
                            
                            <Card className={`cursor-pointer border-2 ${!useConnectedWallet ? 'border-primary' : 'border-transparent'}`}
                              onClick={() => setUseConnectedWallet(false)}
                            >
                              <CardContent className="pt-6">
                                <div className="flex justify-between items-center mb-4">
                                  <h4 className="font-medium">Custom Address</h4>
                                  {!useConnectedWallet && (
                                    <div className="w-4 h-4 rounded-full bg-primary"></div>
                                  )}
                                </div>
                                
                                <div className="space-y-2">
                                  <p className="text-sm text-slate-500 mb-2">
                                    This form has been replaced by the simplified wallet connector above. Please use the wallet connector to add your custom wallet address.
                                  </p>
                                  <div className="relative opacity-60 pointer-events-none">
                                    <Input
                                      placeholder="Enter BNB Smart Chain wallet address"
                                      value={customWalletAddress}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        setCustomWalletAddress(value);
                                        // Only validate if there's some input
                                        setCustomAddressValid(value.length > 0 ? isValidAddress(value) : null);
                                      }}
                                      className={customAddressValid === false ? "border-red-500 pr-10" : ""}
                                    />
                                    {customAddressValid !== null && (
                                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        {customAddressValid ? (
                                          <Check className="h-5 w-5 text-green-500" />
                                        ) : (
                                          <X className="h-5 w-5 text-red-500" />
                                        )}
                                      </div>
                                    )}
                                  </div>
                                  
                                  {customAddressValid === false ? (
                                    <p className="text-xs text-red-500">
                                      Invalid address format. Must be a valid BNB Smart Chain address (0x followed by 40 hex characters)
                                    </p>
                                  ) : (
                                    <p className="text-xs text-gray-500">
                                      Must be a valid BNB Smart Chain (BSC) address
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </div>
                        
                        {/* Amount Selection */}
                        <div className="pt-4 space-y-4">
                          <h3 className="text-lg font-medium">2. Enter withdrawal amount</h3>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <Label htmlFor="withdraw-amount">Amount</Label>
                              <span className="text-sm text-gray-500">
                                Balance: {formatTokenAmount(user?.tokenBalance || 0)} $TSK
                              </span>
                            </div>
                            
                            <div className="flex space-x-3">
                              <div className="relative flex-grow">
                                <Input
                                  id="withdraw-amount"
                                  type="number"
                                  placeholder="0.0"
                                  value={withdrawAmount}
                                  onChange={(e) => setWithdrawAmount(e.target.value)}
                                  className="pr-12"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                  $TSK
                                </div>
                              </div>
                              
                              <Button
                                variant="outline"
                                onClick={() => setWithdrawAmount(user?.tokenBalance?.toString() || "0")}
                              >
                                Max
                              </Button>
                            </div>
                            
                            <div className="flex space-x-2 text-xs text-gray-500 items-center pt-1">
                              <AlertTriangle className="h-3 w-3" />
                              <p>Minimum withdrawal: 10 $TSK. Network fee: 1 $TSK</p>
                            </div>
                            
                            {/* Warning about system availability */}
                            <div className="flex space-x-2 text-xs text-amber-600 dark:text-amber-500 items-center pt-1 bg-amber-50 dark:bg-amber-900/20 p-2 rounded border border-amber-200 dark:border-amber-800">
                              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                              <p>If withdrawal fails with "insufficient contract balance" error, please contact support. The system contract may need to be funded by an administrator.</p>
                            </div>
                          </div>
                        </div>
                        
                        {/* Withdraw Button */}
                        <div className="pt-6">
                          <Button
                            className="w-full"
                            disabled={!isWithdrawalValid() || withdrawMutation.isPending}
                            onClick={async () => {
                              // Check KYC status first
                              const status = await checkKycStatus();
                              if (status !== "verified") {
                                toast({
                                  title: "KYC Verification Required",
                                  description: status === "pending" 
                                    ? "Your KYC verification is pending approval. Please wait for verification before withdrawing."
                                    : "You need to complete KYC verification before withdrawing funds. Go to Settings to submit your verification.",
                                  variant: "destructive",
                                });
                                return;
                              }
                              
                              // Show the confirmation dialog
                              setShowConfirmDialog(true);
                            }}
                          >
                            {withdrawMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                              </>
                            ) : (
                              "Withdraw Tokens"
                            )}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div>
                  <Card>
                    <CardHeader>
                      <CardTitle>Withdrawal Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Network</h4>
                        {connected ? (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">B</div>
                                <span>
                                  {network === 'testnet' ? 'BSC Testnet' : 'BSC Mainnet'}
                                </span>
                              </div>
                              <Badge 
                                variant={isCorrectNetwork ? "default" : "destructive"} 
                                className={`ml-2 ${isCorrectNetwork ? "bg-green-500 hover:bg-green-500/80 text-white" : ""}`}
                              >
                                {isCorrectNetwork ? (
                                  <span className="flex items-center space-x-1">
                                    <Check className="h-3 w-3" />
                                    <span>Connected</span>
                                  </span>
                                ) : (
                                  <span className="flex items-center space-x-1">
                                    <X className="h-3 w-3" />
                                    <span>Wrong Network</span>
                                  </span>
                                )}
                              </Badge>
                            </div>
                            
                            <div className="space-y-2">
                              <Label htmlFor="network-select">Switch Network</Label>
                              <Select
                                value={network}
                                onValueChange={(value: NetworkType) => switchNetwork(value)}
                              >
                                <SelectTrigger id="network-select">
                                  <SelectValue placeholder="Select Network" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="testnet">BSC Testnet</SelectItem>
                                  <SelectItem value="mainnet">BSC Mainnet</SelectItem>
                                </SelectContent>
                              </Select>
                              <p className="text-xs text-gray-500">
                                <span className="text-primary font-medium">Note: </span>
                                Withdrawals always use BSC Mainnet for safety, regardless of the network selected here.
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-800 p-3 rounded-lg">
                            <div className="w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold text-sm">B</div>
                            <span>Connect wallet to select network</span>
                          </div>
                        )}
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Withdrawal Process</h4>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-start space-x-2">
                            <span className="text-primary">1.</span>
                            <span>Tokens are sent to the specified wallet address</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-primary">2.</span>
                            <span>Processing time: 5-30 minutes</span>
                          </li>
                          <li className="flex items-start space-x-2">
                            <span className="text-primary">3.</span>
                            <span>You may check the transaction on BSCScan once processed</span>
                          </li>
                        </ul>
                      </div>
                      
                      {/* KYC Verification Status */}
                      <div className="pt-2">
                        <h4 className="font-medium mb-2">KYC Verification</h4>
                        <div 
                          className={`flex items-center p-3 rounded-lg ${
                            kycStatus === "verified" 
                              ? "bg-green-100 dark:bg-green-900/20" 
                              : kycStatus === "pending" 
                                ? "bg-yellow-100 dark:bg-yellow-900/20" 
                                : "bg-red-100 dark:bg-red-900/20"
                          }`}
                        >
                          {kycStatus === "verified" ? (
                            <>
                              <Check className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
                              <div>
                                <p className="font-medium text-green-600 dark:text-green-400">Verified</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">You can withdraw tokens</p>
                              </div>
                            </>
                          ) : kycStatus === "pending" ? (
                            <>
                              <Loader2 className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mr-2 animate-spin" />
                              <div>
                                <p className="font-medium text-yellow-600 dark:text-yellow-400">Pending Verification</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Withdrawals unavailable until KYC is approved</p>
                              </div>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 mr-2" />
                              <div>
                                <p className="font-medium text-red-600 dark:text-red-400">Verification Required</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Complete KYC in Settings to enable withdrawals</p>
                              </div>
                            </>
                          )}
                        </div>
                        {kycStatus !== "verified" && (
                          <Button 
                            variant="link" 
                            className="mt-2 p-0 h-auto text-primary"
                            onClick={() => window.location.href = "/settings"}
                          >
                            Go to verification page →
                          </Button>
                        )}
                      </div>

                      <div className="pt-2">
                        <h4 className="font-medium mb-2">Important Notes</h4>
                        <div className="text-sm space-y-2 text-gray-600 dark:text-gray-400">
                          <p>• Make sure you're using the correct BNB Smart Chain address</p>
                          <p>• Withdrawals cannot be canceled once submitted</p>
                          <p>• Minimum withdrawal amount: 10 $TSK</p>
                          <p>• KYC verification is required for all withdrawals</p>
                          <p>• The system contract must be funded for withdrawals to work</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Environment Information Card */}
                  <Card className="mt-6">
                    <CardHeader>
                      <CardTitle>Environment Info</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <h4 className="font-medium">Current Configuration</h4>
                        <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Environment</span>
                            <Badge variant={network === 'mainnet' ? "default" : "outline"}>
                              {network === 'mainnet' ? 'Production' : 'Testing'}
                            </Badge>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Network</span>
                            <span className="font-medium">
                              {network === 'testnet' ? 'BSC Testnet' : 'BSC Mainnet'}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">ChainID</span>
                            <span className="font-mono text-xs">
                              {chainId || (network === 'testnet' ? '0x61' : '0x38')}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-500">Token Contract</span>
                            <span className="font-mono text-xs">
                              {network === 'testnet'
                                ? (import.meta.env.VITE_TSK_TOKEN_ADDRESS_TESTNET 
                                  ? import.meta.env.VITE_TSK_TOKEN_ADDRESS_TESTNET.slice(0, 6) + '...' + import.meta.env.VITE_TSK_TOKEN_ADDRESS_TESTNET.slice(-4) 
                                  : 'Not configured')
                                : (import.meta.env.VITE_TSK_TOKEN_ADDRESS_MAINNET
                                  ? import.meta.env.VITE_TSK_TOKEN_ADDRESS_MAINNET.slice(0, 6) + '...' + import.meta.env.VITE_TSK_TOKEN_ADDRESS_MAINNET.slice(-4)
                                  : 'Not configured')
                              }
                            </span>
                          </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 pt-2">
                          This information shows your current environment configuration. 
                          {network === 'testnet' 
                            ? ' You are in TESTING mode. Tokens have no real value.' 
                            : ' You are in PRODUCTION mode. Real tokens will be transferred.'}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
            
            {/* Price Chart Tab */}
            <TabsContent value="price">
              <TokenPriceChart />
            </TabsContent>
            
            {/* QR Code Tab */}
            <TabsContent value="qrcode">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <WalletQRCode walletAddress={address} network={network} />
                
                <Card>
                  <CardHeader>
                    <CardTitle>Wallet Connection</CardTitle>
                    <CardDescription>
                      Connect your blockchain wallet to access more features
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {connected ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <Check className="h-5 w-5 text-green-600 dark:text-green-400" />
                            <h3 className="font-medium text-green-600 dark:text-green-400">Wallet Connected</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            Your wallet is successfully connected to the application.
                          </p>
                          <div className="flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="font-mono text-sm truncate max-w-[150px] sm:max-w-none">
                              {address}
                            </div>
                            <div className="flex items-center space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={copyAddressToClipboard}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                Copy
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => window.open(`https://bscscan.com/address/${address}`, '_blank')}
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-medium">Network Information</h4>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                              <div className="text-sm text-gray-500 mb-1">Network</div>
                              <div className="font-medium">{network === 'testnet' ? 'BSC Testnet' : 'BSC Mainnet'}</div>
                            </div>
                            <div className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                              <div className="text-sm text-gray-500 mb-1">Chain ID</div>
                              <div className="font-mono">{chainId || (network === 'testnet' ? '0x61' : '0x38')}</div>
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          className="w-full" 
                          onClick={() => {
                            // Disconnect wallet - this would be implemented in the web3 provider
                            toast({
                              title: "Wallet Disconnected",
                              description: "Your blockchain wallet has been disconnected.",
                            });
                          }}
                        >
                          Disconnect Wallet
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                          <div className="flex items-center space-x-2 mb-2">
                            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                            <h3 className="font-medium text-yellow-600 dark:text-yellow-400">Wallet Not Connected</h3>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Connect your blockchain wallet to access additional features like token withdrawals and real-time transaction tracking.
                          </p>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          onClick={handleConnectWallet}
                        >
                          <Wallet className="h-4 w-4 mr-2" />
                          Connect Wallet
                        </Button>
                        
                        <div className="text-sm text-gray-500 space-y-2">
                          <h4 className="font-medium">Supported Wallets:</h4>
                          <ul className="list-disc pl-5 space-y-1">
                            <li>MetaMask</li>
                            <li>Trust Wallet</li>
                            <li>Binance Chain Wallet</li>
                            <li>WalletConnect</li>
                          </ul>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Withdrawal</DialogTitle>
            <DialogDescription>
              You are about to withdraw tokens from your account to a blockchain wallet address.
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Amount</span>
                <span className="font-bold text-lg">{formatTokenAmount(parseFloat(withdrawAmount))} $TSK</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Destination</span>
                <span className="font-mono text-xs">
                  {useConnectedWallet 
                    ? `${address?.slice(0, 6)}...${address?.slice(-4)}`
                    : `${customWalletAddress.slice(0, 6)}...${customWalletAddress.slice(-4)}`
                  }
                </span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Network</span>
                <span className="font-medium text-sm">BSC Mainnet</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Fee</span>
                <span className="text-sm">1 $TSK</span>
              </div>
            </div>
            
            <div className="bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-amber-600 dark:text-amber-400">
                  <p className="font-medium mb-1">Important</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Make sure your wallet address is correct</li>
                    <li>Withdrawals cannot be canceled once submitted</li>
                    <li>The transaction may take 5-30 minutes to complete</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowConfirmDialog(false)}
              className="mb-2 sm:mb-0"
            >
              Cancel
            </Button>
            <Button 
              type="button"
              onClick={() => {
                setShowConfirmDialog(false);
                withdrawMutation.mutate();
              }}
              disabled={withdrawMutation.isPending}
              className="w-full sm:w-auto"
            >
              {withdrawMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Withdrawal"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
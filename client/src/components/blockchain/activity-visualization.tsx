import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useWeb3 } from '@/lib/web3-provider';
import { ContractAddresses } from '@/lib/contract-utils';
import { useToast } from '@/hooks/use-toast';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, RefreshCw, AlertCircle, ExternalLink } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
}

interface TransactionSummary {
  transactions: Transaction[];
  totalTransactions: number;
  totalVolume: number;
  uniqueAddresses: number;
  largestTransaction: Transaction;
  recentTransactions: Transaction[];
  distributionData: {
    address: string;
    value: number;
    percentage: number;
    count: number;
  }[];
  timeSeriesData: {
    date: string;
    value: number;
    count: number;
  }[];
  warning?: string;
}

// Colors for pie chart
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#8dd1e1'];

export default function BlockchainActivityVisualization() {
  const { toast } = useToast();
  const { network } = useWeb3();
  const [customAddress, setCustomAddress] = useState<string>('');
  
  // Safely determine the contract address
  const getDefaultContractAddress = () => {
    try {
      const networkKey = network === 'testnet' ? 'Testnet' : 'Mainnet';
      return ContractAddresses[networkKey].TokenAddress || 
             '0x0000000000000000000000000000000000000000';
    } catch (error) {
      console.error("Error getting default contract address:", error);
      return '0x0000000000000000000000000000000000000000';
    }
  };
  
  const [addressToUse, setAddressToUse] = useState<string>(getDefaultContractAddress());
  
  // Update contract address when network changes
  useEffect(() => {
    setAddressToUse(getDefaultContractAddress());
  }, [network]);
  
  // Fetch blockchain data
  const { 
    data: transactionData, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useQuery<TransactionSummary>({
    queryKey: ['/api/blockchain/transactions', addressToUse, network],
    queryFn: async () => {
      const res = await apiRequest(
        'GET', 
        `/api/blockchain/transactions?address=${addressToUse}&network=${network}`
      );
      return await res.json();
    },
    enabled: !!addressToUse,
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Format date for display
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString();
  };
  
  // Format time for display
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString();
  };
  
  // Format address for display
  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };
  
  // Format value for display
  const formatValue = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';
    
    if (num > 1000000) {
      return `${(num / 1000000).toFixed(2)}M`;
    } else if (num > 1000) {
      return `${(num / 1000).toFixed(2)}K`;
    }
    
    return num.toFixed(2);
  };
  
  // Handle custom address submission
  const handleSubmitCustomAddress = () => {
    if (!customAddress || !customAddress.startsWith('0x')) {
      toast({
        title: "Invalid Address",
        description: "Please enter a valid contract address starting with 0x",
        variant: "destructive",
      });
      return;
    }
    
    setAddressToUse(customAddress);
    refetch();
  };
  
  // Reset to default contract address
  const resetToDefaultAddress = () => {
    setCustomAddress('');
    setAddressToUse(getDefaultContractAddress());
    refetch();
  };
  
  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading blockchain data...</span>
      </div>
    );
  }
  
  // Show error state
  if (error || !transactionData) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>Failed to load blockchain data. This is often due to missing API configuration.</p>
          <p className="text-sm">
            Error details: {error instanceof Error ? error.message : 'Unknown error'}
          </p>
          <p className="text-sm mt-1">
            Contract address: {addressToUse}
          </p>
        </AlertDescription>
        <div className="flex gap-2 mt-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => refetch()}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
          <Button 
            variant="secondary" 
            size="sm"
            onClick={() => {
              // Use demo data to allow the component to render
              setAddressToUse('0x0000000000000000000000000000000000000000');
              refetch();
            }}
          >
            <AlertCircle className="mr-2 h-4 w-4" /> Use Demo Data
          </Button>
        </div>
      </Alert>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header with API status and refresh button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-medium">Token Activity Analytics</h3>
          <p className="text-sm text-muted-foreground">
            Analyzing data for contract: {formatAddress(addressToUse)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {transactionData.warning && (
            <Badge variant="outline" className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700 px-3 py-1.5 text-sm font-medium flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" />
              Using Simulated Data
            </Badge>
          )}
          <Button 
            size="sm" 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            <span className="ml-2 hidden sm:inline">Refresh</span>
          </Button>
        </div>
      </div>
      
      {/* Warning for mock data */}
      {transactionData.warning && (
        <Alert className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertTitle>Using Simulated Data</AlertTitle>
          <AlertDescription>
            <p>Currently showing mock transaction data for demonstration purposes.</p>
            <p className="mt-2">To view real blockchain data, a BSCScan API key needs to be configured in the admin settings.</p>
            <Button 
              variant="outline" 
              size="sm"
              className="mt-3 bg-amber-100 dark:bg-amber-900 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-300 hover:bg-amber-200 dark:hover:bg-amber-800"
              onClick={() => {
                window.location.href = '/admin/blockchain-config';
              }}
            >
              Configure BSCScan API Key
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Custom address input */}
      <Card className="bg-gray-50 dark:bg-gray-900">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="space-y-2 flex-grow">
              <Label htmlFor="custom-address">Custom Contract Address (Optional)</Label>
              <Input
                id="custom-address"
                placeholder="Enter contract address (0x...)"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={resetToDefaultAddress}
                disabled={addressToUse === getDefaultContractAddress()}
              >
                Reset
              </Button>
              <Button onClick={handleSubmitCustomAddress}>Apply</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Key stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Transactions</CardTitle>
            <div className="text-2xl font-bold">{(transactionData.totalTransactions || 0).toLocaleString()}</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Volume</CardTitle>
            <div className="text-2xl font-bold">{formatValue(String(transactionData.totalVolume || 0))} $TSK</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Unique Addresses</CardTitle>
            <div className="text-2xl font-bold">{(transactionData.uniqueAddresses || 0).toLocaleString()}</div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium text-muted-foreground">Largest Transaction</CardTitle>
            <div className="text-2xl font-bold">
              {transactionData.largestTransaction ? 
                formatValue(transactionData.largestTransaction.value) : '0'} $TSK
            </div>
          </CardHeader>
        </Card>
      </div>
      
      {/* Visualizations */}
      <Tabs defaultValue="time">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="time">Time Analysis</TabsTrigger>
          <TabsTrigger value="distribution">Token Distribution</TabsTrigger>
        </TabsList>
        
        <TabsContent value="time" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Transaction Volume Over Time</CardTitle>
              <CardDescription>
                Historical view of token transaction activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={transactionData.timeSeriesData || []}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="date"
                      angle={-45}
                      textAnchor="end"
                      height={70}
                    />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)} $TSK`, 'Volume']}
                      labelFormatter={(label) => `Date: ${label}`}
                    />
                    <Bar 
                      dataKey="value" 
                      name="Volume" 
                      fill="#8884d8" 
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="distribution" className="p-0">
          <Card>
            <CardHeader>
              <CardTitle>Token Distribution</CardTitle>
              <CardDescription>
                Analysis of token holdings across addresses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={(transactionData.distributionData || []).slice(0, 8)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      nameKey="address"
                    >
                      {(transactionData.distributionData || []).slice(0, 8).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [`${value.toFixed(2)} $TSK`, 'Amount']}
                      labelFormatter={(name) => `Address: ${name}`}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Recent transactions table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
          <CardDescription>
            Latest token transfers on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-4 py-3 text-left font-medium">Tx Hash</th>
                  <th className="px-4 py-3 text-left font-medium">From</th>
                  <th className="px-4 py-3 text-left font-medium">To</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {(transactionData.recentTransactions || []).map((tx, index) => (
                  <tr key={index} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex items-center">
                        <span className="font-mono">{formatAddress(tx.hash)}</span>
                        <a
                          href={`https://${network === 'mainnet' ? '' : 'testnet.'}bscscan.com/tx/${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono">{formatAddress(tx.from)}</td>
                    <td className="px-4 py-3 font-mono">{formatAddress(tx.to)}</td>
                    <td className="px-4 py-3 text-right">{formatValue(tx.value)} $TSK</td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      {formatDate(tx.timestamp)} {formatTime(tx.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {/* API Attribution */}
      <div className="text-xs text-center pt-4 pb-2">
        {transactionData.warning ? (
          <div className="flex items-center justify-center text-amber-600 dark:text-amber-400 gap-1.5">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>Data simulated for demonstration purposes</span>
          </div>
        ) : (
          <div className="flex items-center justify-center text-muted-foreground gap-1.5">
            <span>Data provided by BSCScan API</span>
            <a 
              href={`https://${network === 'mainnet' ? '' : 'testnet.'}bscscan.com/token/${addressToUse}`}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 text-blue-600 hover:text-blue-800 inline-flex items-center"
            >
              View on BSCScan <ExternalLink size={12} className="ml-1" />
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { Loader2, ExternalLink, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';
import { formatTokenAmount } from '@/lib/contract-utils';

// Interfaces for the transaction data
export interface Transaction {
  id: number;
  buyerId: number;
  sellerId: number;
  amount: number;
  type: 'withdrawal' | 'deposit' | 'purchase' | 'sale' | 'premium' | 'referral' | 'mining';
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
  metadata?: string;
}

interface TransactionMetadata {
  walletAddress?: string;
  network?: string;
  transactionHash?: string;
  packageName?: string;
  itemName?: string;
  referredUser?: string;
  miningType?: string;
}

export default function TransactionHistory() {
  const [tabValue, setTabValue] = useState('all');
  
  // Fetch transactions from the API
  const { data: transactions, isLoading, error, refetch, isFetching } = useQuery<Transaction[]>({
    queryKey: ['/api/wallet/transactions'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/wallet/transactions');
      return await res.json();
    },
    refetchOnWindowFocus: false,
  });

  // Parse the metadata JSON
  const parseMetadata = (metadata?: string): TransactionMetadata => {
    if (!metadata) return {};
    try {
      return JSON.parse(metadata);
    } catch (e) {
      console.error('Failed to parse transaction metadata:', e);
      return {};
    }
  };

  // Format date from ISO string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  // Filter transactions based on the selected tab
  const filterTransactions = (type?: string) => {
    if (!transactions) return [];
    if (type === 'all') return transactions;
    return transactions.filter(tx => tx.type === type);
  };

  // Get transaction icon based on type
  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'withdrawal':
        return <ArrowUpCircle className="text-red-500" />;
      case 'deposit':
        return <ArrowDownCircle className="text-green-500" />;
      case 'purchase':
        return <ArrowUpCircle className="text-red-500" />;
      case 'sale':
        return <ArrowDownCircle className="text-green-500" />;
      case 'premium':
        return <ArrowUpCircle className="text-red-500" />;
      case 'referral':
        return <ArrowDownCircle className="text-green-500" />;
      case 'mining':
        return <ArrowDownCircle className="text-green-500" />;
      default:
        return <ArrowDownCircle className="text-gray-500" />;
    }
  };

  // Get transaction color based on type
  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'withdrawal':
      case 'purchase':
      case 'premium':
        return 'text-red-500';
      case 'deposit':
      case 'sale':
      case 'referral':
      case 'mining':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  // Get transaction sign based on type (+ or -)
  const getTransactionSign = (type: string) => {
    switch (type) {
      case 'withdrawal':
      case 'purchase':
      case 'premium':
        return '-';
      case 'deposit':
      case 'sale':
      case 'referral':
      case 'mining':
        return '+';
      default:
        return '';
    }
  };

  // Get transaction label
  const getTransactionLabel = (transaction: Transaction) => {
    const metadata = parseMetadata(transaction.metadata);
    
    switch (transaction.type) {
      case 'withdrawal':
        return `Withdrawal to ${metadata.walletAddress ? metadata.walletAddress.substring(0, 6) + '...' + metadata.walletAddress.substring(metadata.walletAddress.length - 4) : 'wallet'}`;
      case 'deposit':
        return 'Deposit from wallet';
      case 'purchase':
        return `Purchase: ${metadata.itemName || 'Item'}`;
      case 'sale':
        return `Sale: ${metadata.itemName || 'Item'}`;
      case 'premium':
        return `Premium package: ${metadata.packageName || 'Package'}`;
      case 'referral':
        return `Referral bonus: ${metadata.referredUser || 'User'}`;
      case 'mining':
        return `Mining reward${metadata.miningType ? ': ' + metadata.miningType : ''}`;
      default:
        return 'Transaction';
    }
  };

  // Check if the transaction is external (has a blockchain hash)
  const isExternalTransaction = (transaction: Transaction) => {
    const metadata = parseMetadata(transaction.metadata);
    return !!metadata.transactionHash;
  };

  // Render loading state
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <div className="flex items-center">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            <span>Loading transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
            <p>Failed to load transaction history.</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2" 
              onClick={() => refetch()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render empty state
  if (!transactions || transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your recent transactions will appear here
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-8 text-gray-500">
          <p>No transactions found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Transaction History</CardTitle>
          <CardDescription>
            Your recent token transactions
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isFetching}
        >
          {isFetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      
      <Tabs value={tabValue} onValueChange={setTabValue}>
        <div className="px-6">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="mining">Mining</TabsTrigger>
            <TabsTrigger value="withdrawal">Withdrawals</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="all" className="m-0">
          {renderTransactionList(filterTransactions('all'))}
        </TabsContent>
        
        <TabsContent value="mining" className="m-0">
          {filterTransactions('mining').length > 0 
            ? renderTransactionList(filterTransactions('mining'))
            : (
              <CardContent className="text-center py-8 text-gray-500">
                <p>No mining transactions found</p>
              </CardContent>
            )}
        </TabsContent>
        
        <TabsContent value="withdrawal" className="m-0">
          {filterTransactions('withdrawal').length > 0 
            ? renderTransactionList(filterTransactions('withdrawal'))
            : (
              <CardContent className="text-center py-8 text-gray-500">
                <p>No withdrawal transactions found</p>
              </CardContent>
            )}
        </TabsContent>
        
        <TabsContent value="premium" className="m-0">
          {filterTransactions('premium').length > 0 
            ? renderTransactionList(filterTransactions('premium'))
            : (
              <CardContent className="text-center py-8 text-gray-500">
                <p>No premium transactions found</p>
              </CardContent>
            )}
        </TabsContent>
      </Tabs>
    </Card>
  );

  // Helper function to render the transaction list
  function renderTransactionList(txList: Transaction[]) {
    return (
      <CardContent className="px-0 py-0">
        <div className="divide-y">
          {txList.map(transaction => {
            const metadata = parseMetadata(transaction.metadata);
            
            return (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    
                    <div>
                      <div className="font-medium">{getTransactionLabel(transaction)}</div>
                      <div className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className={`font-medium ${getTransactionColor(transaction.type)}`}>
                      {getTransactionSign(transaction.type)}{formatTokenAmount(transaction.amount)} $TSK
                    </div>
                    
                    <div className="flex items-center justify-end space-x-2 mt-1">
                      <Badge variant={transaction.status === 'completed' ? 'default' : transaction.status === 'pending' ? 'outline' : 'destructive'}>
                        {transaction.status}
                      </Badge>
                      
                      {isExternalTransaction(transaction) && (
                        <a
                          href={`https://bscscan.com/tx/${metadata.transactionHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink size={16} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    );
  }
}
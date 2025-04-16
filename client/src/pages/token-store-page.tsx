import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import TokenPurchase from "@/components/token/token-purchase";
import { TokenTransaction } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { DownloadIcon, RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TokenStorePage() {
  const [activeTab, setActiveTab] = useState("buy");

  // Fetch transaction history
  const { data: transactions, isLoading, refetch } = useQuery({
    queryKey: ["/api/user/token-transactions"],
    queryFn: async () => {
      const response = await fetch("/api/user/token-transactions");
      if (!response.ok) {
        throw new Error("Failed to fetch transaction history");
      }
      return await response.json() as TokenTransaction[];
    },
    enabled: activeTab === "history",
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500";
      case "pending":
        return "bg-yellow-500";
      case "rejected":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container px-4 py-8 mx-auto max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">TSK Token Store</h1>
      <p className="text-muted-foreground mb-6">Purchase TSK tokens using BNB or PayPal and view your transaction history</p>
      
      <Tabs defaultValue="buy" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="buy">Buy Tokens</TabsTrigger>
          <TabsTrigger value="history">Transaction History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="buy">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Purchase TSK Tokens</h2>
            <p className="text-muted-foreground mb-6">
              Select a token package below and choose your preferred payment method. 
              You can pay with BNB (blockchain) or PayPal for instant processing.
            </p>
            <TokenPurchase />
          </div>
        </TabsContent>
        
        <TabsContent value="history">
          <div className="bg-card rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Transaction History</h2>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            
            {isLoading ? (
              <div className="text-center py-12">Loading transaction history...</div>
            ) : transactions && transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Payment Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Transaction Hash</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{formatDate(tx.createdAt)}</TableCell>
                        <TableCell>{tx.amount.toLocaleString()} TSK</TableCell>
                        <TableCell>{tx.paymentMethod}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(tx.status)}>
                            {tx.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {tx.transactionHash ? (
                            <div className="flex items-center">
                              <span className="truncate max-w-xs">
                                {tx.transactionHash.substring(0, 6)}...
                                {tx.transactionHash.substring(tx.transactionHash.length - 4)}
                              </span>
                              <a 
                                href={`https://bscscan.com/tx/${tx.transactionHash}`} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="ml-2 text-blue-500 hover:text-blue-700"
                              >
                                <DownloadIcon className="h-4 w-4" />
                              </a>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">N/A</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No transaction history found. Purchase some tokens to get started!
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Separator className="my-8" />
      
      <div className="bg-card rounded-lg p-6 shadow-sm mt-6">
        <h2 className="text-xl font-semibold mb-4">About TSK Tokens</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium mb-2">What are TSK Tokens?</h3>
            <p className="text-muted-foreground">
              TSK Tokens are the native utility tokens for the TSK platform. They can be used for 
              various transactions within the ecosystem, including marketplace purchases,
              premium subscription payments, and advertising campaigns.
            </p>
          </div>
          <div>
            <h3 className="font-medium mb-2">How to use TSK Tokens?</h3>
            <p className="text-muted-foreground">
              Once you have TSK tokens in your account, you can use them throughout the platform.
              Visit the marketplace to buy items, upgrade to premium for enhanced mining rewards,
              or create advertising campaigns to promote your products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
} from 'recharts';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

// Types for price data
export interface PriceData {
  timestamp: number;
  price: number;
}

export interface PriceDataPoint {
  date: string;
  price: number;
  formattedDate: string;
}

export interface TokenPriceData {
  timeframes: {
    '24h': PriceDataPoint[];
    '7d': PriceDataPoint[];
    '30d': PriceDataPoint[];
    'all': PriceDataPoint[];
  };
  currentPrice: number;
  priceChanges: {
    '24h': { change: number; percentage: number };
    '7d': { change: number; percentage: number };
    '30d': { change: number; percentage: number };
    'all': { change: number; percentage: number };
  };
}

// Function to generate token price data
export function generateTokenPriceData(): TokenPriceData {
  const timeframes: Record<string, {startDaysAgo: number, dataPoints: number}> = {
    '24h': { startDaysAgo: 1, dataPoints: 24 },
    '7d': { startDaysAgo: 7, dataPoints: 7 },
    '30d': { startDaysAgo: 30, dataPoints: 30 },
    'all': { startDaysAgo: 365, dataPoints: 52 }
  };
  
  const basePrice = 0.25 + Math.random() * 0.15;
  const result: any = { timeframes: {}, priceChanges: {} };
  
  // Generate data for each timeframe
  Object.entries(timeframes).forEach(([timeframe, config]) => {
    const now = new Date();
    const endDate = now.getTime();
    const startDate = endDate - config.startDaysAgo * 24 * 60 * 60 * 1000;
    const interval = (endDate - startDate) / config.dataPoints;
    
    const volatility = timeframe === '24h' ? 0.02 : timeframe === '7d' ? 0.05 : 0.1;
    const data: PriceDataPoint[] = [];
    
    for (let i = 0; i <= config.dataPoints; i++) {
      const timestamp = startDate + interval * i;
      const date = new Date(timestamp);
      
      // Add some price volatility and trend
      const randomFactor = 1 + (Math.random() - 0.5) * volatility;
      const trendFactor = 1 + (i / config.dataPoints) * 0.1;
      const price = basePrice * randomFactor * trendFactor;
      
      // Format date for display
      let formattedDate: string;
      if (timeframe === '24h') {
        formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (timeframe === '7d') {
        formattedDate = date.toLocaleDateString([], { weekday: 'short' });
      } else {
        formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      
      data.push({
        date: date.toISOString(),
        price: parseFloat(price.toFixed(4)),
        formattedDate
      });
    }
    
    // Store the timeframe data
    result.timeframes[timeframe] = data;
    
    // Calculate price changes
    const latest = data[data.length - 1];
    const earliest = data[0];
    const priceChange = latest.price - earliest.price;
    const percentChange = (priceChange / earliest.price) * 100;
    
    result.priceChanges[timeframe] = {
      change: parseFloat(priceChange.toFixed(4)),
      percentage: parseFloat(percentChange.toFixed(2))
    };
  });
  
  // Set the current price (from the most recent data point)
  result.currentPrice = result.timeframes['24h'][result.timeframes['24h'].length - 1].price;
  
  return result as TokenPriceData;
}

// The component
export default function TokenPriceChart() {
  const { toast } = useToast();
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');
  
  // Use React Query to fetch and cache the token price data
  const { 
    data: priceData, 
    isLoading, 
    error, 
    refetch,
    isFetching
  } = useQuery<TokenPriceData>({
    queryKey: ['tokenPriceData'],
    queryFn: () => {
      // In a real implementation, this would be an API call
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(generateTokenPriceData());
        }, 600);
      });
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Custom tooltip formatter
  const formatTooltip = (value: number) => {
    return [`$${value.toFixed(4)}`, 'Price'];
  };

  // Format date/time based on timeframe
  const formatXAxis = (tickItem: string) => {
    const date = new Date(tickItem);
    if (timeframe === '24h') {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (timeframe === '7d') {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // Get the change data for the selected timeframe
  const getChangeData = () => {
    if (!priceData) return { currentPrice: 0, change: 0, percentage: 0 };
    
    return {
      currentPrice: priceData.currentPrice,
      change: priceData.priceChanges[timeframe].change,
      percentage: priceData.priceChanges[timeframe].percentage
    };
  };
  
  // Get price data for the selected timeframe
  const getTimeframeData = () => {
    if (!priceData) return [];
    return priceData.timeframes[timeframe];
  };
  
  const { currentPrice, change, percentage } = getChangeData();
  const timeframeData = getTimeframeData();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>$TSK Price Chart</CardTitle>
          <CardDescription>
            Token price performance over time
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
      
      <CardContent className="px-2 pt-0">
        {/* Price info cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6 px-4">
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">Current Price</div>
              <div className="text-2xl font-bold flex items-center">
                <DollarSign className="h-5 w-5 mr-1 text-primary" />
                {currentPrice ? currentPrice.toFixed(4) : '-'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-50 dark:bg-gray-900">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">Price Change</div>
              <div className="text-2xl font-bold flex items-center">
                {change ? (
                  change > 0 ? (
                    <>
                      <TrendingUp className="h-5 w-5 mr-1 text-green-500" />
                      <span className="text-green-500">+${change.toFixed(4)}</span>
                    </>
                  ) : (
                    <>
                      <TrendingDown className="h-5 w-5 mr-1 text-red-500" />
                      <span className="text-red-500">${change.toFixed(4)}</span>
                    </>
                  )
                ) : '-'}
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-50 dark:bg-gray-900 col-span-2 md:col-span-1">
            <CardContent className="p-4">
              <div className="text-sm text-gray-500 mb-1">% Change</div>
              <div className="text-2xl font-bold">
                {percentage ? (
                  percentage > 0 ? (
                    <span className="text-green-500">+{percentage.toFixed(2)}%</span>
                  ) : (
                    <span className="text-red-500">{percentage.toFixed(2)}%</span>
                  )
                ) : '-'}
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Timeframe selector */}
        <Tabs 
          defaultValue="7d" 
          value={timeframe}
          onValueChange={(value) => setTimeframe(value as any)}
          className="w-full"
        >
          <div className="px-4">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="24h">24H</TabsTrigger>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="all">All</TabsTrigger>
            </TabsList>
          </div>
          
          {/* Price chart */}
          <div className="mt-4 h-64">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : error ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-red-500">Failed to load price data</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={timeframeData}
                  margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatXAxis}
                    tickMargin={10}
                    tick={{ fontSize: 12 }}
                    minTickGap={30}
                  />
                  <YAxis 
                    domain={['dataMin - 0.01', 'dataMax + 0.01']}
                    tickFormatter={(value) => `$${value.toFixed(2)}`}
                    tick={{ fontSize: 12 }}
                    width={60}
                  />
                  <Tooltip 
                    formatter={formatTooltip}
                    labelFormatter={(label) => {
                      const date = new Date(label);
                      return date.toLocaleString();
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="price" 
                    stroke="#8884d8" 
                    fillOpacity={1} 
                    fill="url(#colorPrice)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Tabs>
        
        <div className="text-xs text-center text-gray-500 mt-4 px-4">
          Note: Charts show simulated price data for demonstration purposes.
        </div>
      </CardContent>
    </Card>
  );
}
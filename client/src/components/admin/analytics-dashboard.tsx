import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart, 
  LineChart, 
  Line, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  BarChart3, 
  LineChart as LineChartIcon, 
  PieChart as PieChartIcon, 
  Calendar, 
  Download, 
  FileBarChart,
  Users,
  Layers,
  UserPlus,
  ShoppingBag,
  DollarSign,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Coins
} from "lucide-react";

// Import the MiningStatistics component
import { MiningStatistics } from "./mining-statistics";

// Mock data for charts and analytics
const revenueData = [
  { name: 'Jan', revenue: 14000, users: 342, premium: 48 },
  { name: 'Feb', revenue: 18500, users: 403, premium: 65 },
  { name: 'Mar', revenue: 23200, users: 489, premium: 93 },
  { name: 'Apr', revenue: 29800, users: 578, premium: 121 },
  { name: 'May', revenue: 37400, users: 702, premium: 158 },
  { name: 'Jun', revenue: 42100, users: 789, premium: 203 },
  { name: 'Jul', revenue: 47800, users: 843, premium: 265 },
  { name: 'Aug', revenue: 51200, users: 902, premium: 297 },
  { name: 'Sep', revenue: 56400, users: 978, premium: 326 },
  { name: 'Oct', revenue: 61900, users: 1046, premium: 372 },
  { name: 'Nov', revenue: 67300, users: 1122, premium: 404 },
  { name: 'Dec', revenue: 75800, users: 1203, premium: 458 },
];

const dailyActivityData = [
  { hour: '00:00', active: 214, mining: 143, marketplace: 18 },
  { hour: '02:00', active: 128, mining: 85, marketplace: 12 },
  { hour: '04:00', active: 92, mining: 62, marketplace: 5 },
  { hour: '06:00', active: 145, mining: 101, marketplace: 14 },
  { hour: '08:00', active: 378, mining: 248, marketplace: 32 },
  { hour: '10:00', active: 521, mining: 342, marketplace: 63 },
  { hour: '12:00', active: 683, mining: 457, marketplace: 89 },
  { hour: '14:00', active: 712, mining: 486, marketplace: 102 },
  { hour: '16:00', active: 759, mining: 525, marketplace: 95 },
  { hour: '18:00', active: 834, mining: 612, marketplace: 108 },
  { hour: '20:00', active: 768, mining: 548, marketplace: 87 },
  { hour: '22:00', active: 496, mining: 321, marketplace: 46 },
];

const userRetentionData = [
  { bucket: '1d', total: 100, rate: 100 },
  { bucket: '7d', total: 84, rate: 84 },
  { bucket: '14d', total: 76, rate: 76 },
  { bucket: '30d', total: 68, rate: 68 },
  { bucket: '60d', total: 54, rate: 54 },
  { bucket: '90d', total: 45, rate: 45 },
  { bucket: '120d', total: 39, rate: 39 },
  { bucket: '180d', total: 31, rate: 31 },
  { bucket: '1y', total: 22, rate: 22 },
];

const tokenDistributionData = [
  { name: 'Mining Rewards', value: 54 },
  { name: 'Premium Packages', value: 23 },
  { name: 'Marketplace Fees', value: 12 },
  { name: 'Referral Rewards', value: 8 },
  { name: 'System Operations', value: 3 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const userSegmentData = [
  { name: 'Regular Users', value: 63 },
  { name: 'Premium Users', value: 24 },
  { name: 'KYC Verified', value: 8 },
  { name: 'Admin/Staff', value: 5 },
];

const segmentCOLORS = ['#82ca9d', '#8884d8', '#ffc658', '#ff7300'];

// Summary cards data
const summaryCards = [
  {
    title: "Total Users",
    value: "8,732",
    change: "+12.4%",
    trend: "up",
    icon: <Users className="h-5 w-5" />,
    color: "text-blue-500"
  },
  {
    title: "New Users (30d)",
    value: "1,245",
    change: "+18.2%",
    trend: "up",
    icon: <UserPlus className="h-5 w-5" />,
    color: "text-green-500"
  },
  {
    title: "Marketplace Items",
    value: "3,871",
    change: "+5.8%",
    trend: "up",
    icon: <ShoppingBag className="h-5 w-5" />,
    color: "text-purple-500"
  },
  {
    title: "Revenue (30d)",
    value: "$24,582",
    change: "-2.1%",
    trend: "down",
    icon: <DollarSign className="h-5 w-5" />,
    color: "text-amber-500"
  }
];

// KPI cards data
const kpiCards = [
  {
    title: "DAU/MAU Ratio",
    value: "41%",
    description: "Daily active users as a percentage of monthly active users",
    status: "healthy"
  },
  {
    title: "User Retention",
    value: "68%",
    description: "30-day retention rate for new users",
    status: "healthy"
  },
  {
    title: "Conversion Rate",
    value: "6.8%",
    description: "Percentage of users who purchase premium packages",
    status: "warning"
  },
  {
    title: "ARPU",
    value: "$2.82",
    description: "Average Revenue Per User (monthly)",
    status: "healthy"
  }
];

export default function AnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState("30d");
  
  // Fetch dashboard analytics data
  const { data: analyticsData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/analytics/dashboard'],
    queryFn: async () => {
      const response = await fetch('/api/admin/analytics/dashboard');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics dashboard data');
      }
      return response.json();
    }
  });
  
  // Use the fetched data or fallback to empty arrays if not available
  const summaryCards = analyticsData?.summaryCards 
    ? analyticsData.summaryCards.map((card: any) => ({
        ...card,
        icon: getIconForTitle(card.title),
        color: getColorForTitle(card.title)
      }))
    : [];
  const kpiCards = analyticsData?.kpiCards || [];
  const userSegmentData = analyticsData?.userSegments || [];
  
  // Helper function to get icon based on card title
  function getIconForTitle(title: string) {
    if (title.includes("Users")) return <Users className="h-5 w-5" />;
    if (title.includes("New Users")) return <UserPlus className="h-5 w-5" />;
    if (title.includes("Marketplace")) return <ShoppingBag className="h-5 w-5" />;
    if (title.includes("Total TSK")) return <Coins className="h-5 w-5" />;
    if (title.includes("Sales") || title.includes("Volume")) return <DollarSign className="h-5 w-5" />;
    return <Layers className="h-5 w-5" />;
  }
  
  // Helper function to get color based on card title
  function getColorForTitle(title: string) {
    if (title.includes("Users")) return "text-blue-500";
    if (title.includes("New Users")) return "text-green-500";
    if (title.includes("Marketplace")) return "text-purple-500";
    if (title.includes("Total TSK")) return "text-orange-500";
    if (title.includes("Sales") || title.includes("Volume")) return "text-amber-500";
    return "text-sky-500";
  }
  
  // Function to render the trend indicator
  const renderTrendIndicator = (trend: string, change: string) => {
    if (trend === "up") {
      return (
        <div className="flex items-center text-green-500">
          <ArrowUp className="h-3 w-3 mr-1" />
          <span className="text-xs">{change}</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-red-500">
          <ArrowDown className="h-3 w-3 mr-1" />
          <span className="text-xs">{change}</span>
        </div>
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
          <p className="text-muted-foreground">Comprehensive platform analytics and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select defaultValue={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Loading...' : 'Refresh'}
          </Button>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{card.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{card.value}</h3>
                  {renderTrendIndicator(card.trend, card.change)}
                </div>
                <div className={`p-2 rounded-md bg-muted ${card.color}`}>
                  {card.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Main Dashboard */}
      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span>Overview</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Users</span>
            </TabsTrigger>
            <TabsTrigger value="mining" className="flex items-center gap-2">
              <Coins className="h-4 w-4" />
              <span>Mining</span>
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              <span>Revenue</span>
            </TabsTrigger>
            <TabsTrigger value="engagement" className="flex items-center gap-2">
              <Layers className="h-4 w-4" />
              <span>Engagement</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 pt-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((kpi, index) => (
                <Card key={index}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">{kpi.value}</CardTitle>
                    <CardDescription>{kpi.title}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      {kpi.description}
                    </p>
                    <div className={`mt-2 text-xs px-2 py-1 rounded-full inline-flex items-center
                      ${kpi.status === 'healthy' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                        kpi.status === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                      {kpi.status === 'healthy' ? '● Healthy' : 
                        kpi.status === 'warning' ? '● Needs Attention' : 
                        '● Critical'}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Revenue Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue & User Growth</CardTitle>
                    <CardDescription>
                      Monthly revenue and user acquisition metrics
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm">
                    <FileBarChart className="h-4 w-4 mr-2" />
                    Download Report
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={revenueData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
                      <XAxis dataKey="name" stroke="#a1a1aa" />
                      <YAxis yAxisId="left" stroke="#a1a1aa" />
                      <YAxis yAxisId="right" orientation="right" stroke="#a1a1aa" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fafafa'
                        }} 
                      />
                      <Legend />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="revenue"
                        name="Revenue ($)"
                        stroke="#8884d8"
                        strokeWidth={2}
                        activeDot={{ r: 8 }}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="users"
                        name="New Users"
                        stroke="#82ca9d"
                        strokeWidth={2}
                      />
                      <Line
                        yAxisId="right"
                        type="monotone"
                        dataKey="premium"
                        name="Premium Users"
                        stroke="#ffc658"
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Pie Charts - Token Distribution & User Segments */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Token Distribution</CardTitle>
                  <CardDescription>
                    How TSK tokens are distributed across the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={tokenDistributionData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {tokenDistributionData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [`${value}%`, 'Percentage']}
                          contentStyle={{ 
                            backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fafafa'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Segments</CardTitle>
                  <CardDescription>
                    Breakdown of different user types
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px] flex flex-col items-center justify-center">
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={userSegmentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {userSegmentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={segmentCOLORS[index % segmentCOLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [`${value}%`, 'Percentage']}
                          contentStyle={{ 
                            backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fafafa'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="users" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <CardTitle>User Retention</CardTitle>
                <CardDescription>
                  User retention over time (% of users still active after N days)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={userRetentionData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
                      <XAxis dataKey="bucket" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" domain={[0, 100]} />
                      <RechartsTooltip 
                        formatter={(value: number) => [`${value}%`, 'Retention Rate']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fafafa'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="rate" name="Retention Rate (%)" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Referrers</CardTitle>
                  <CardDescription>
                    Users who brought the most new members
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { username: "crypto_king", referrals: 86, conversion: "18%" },
                      { username: "mining_master", referrals: 63, conversion: "22%" },
                      { username: "blockchain_enthusiast", referrals: 51, conversion: "14%" },
                      { username: "token_trader", referrals: 43, conversion: "16%" },
                      { username: "defi_explorer", referrals: 37, conversion: "21%" }
                    ].map((referrer, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{referrer.username}</p>
                            <p className="text-xs text-muted-foreground">Conversion: {referrer.conversion}</p>
                          </div>
                        </div>
                        <div className="font-semibold">{referrer.referrals}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>User Acquisition Channels</CardTitle>
                  <CardDescription>
                    How users are finding the platform
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Referrals', value: 42 },
                            { name: 'Organic Search', value: 28 },
                            { name: 'Social Media', value: 18 },
                            { name: 'Direct', value: 8 },
                            { name: 'Other', value: 4 }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          fill="#8884d8"
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          formatter={(value: number) => [`${value}%`, 'Percentage']}
                          contentStyle={{ 
                            backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fafafa'
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="mining" className="space-y-6 pt-6">
            <MiningStatistics />
          </TabsContent>
          
          <TabsContent value="revenue" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Revenue Breakdown</CardTitle>
                    <CardDescription>
                      Revenue sources and performance over time
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={[
                        { month: 'Jan', premium: 5800, marketplace: 3200, tokens: 5000 },
                        { month: 'Feb', premium: 6700, marketplace: 4100, tokens: 7700 },
                        { month: 'Mar', premium: 8200, marketplace: 4700, tokens: 10300 },
                        { month: 'Apr', premium: 9700, marketplace: 5900, tokens: 14200 },
                        { month: 'May', premium: 12400, marketplace: 7300, tokens: 17700 },
                        { month: 'Jun', premium: 14800, marketplace: 8200, tokens: 19100 }
                      ]}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
                      <XAxis dataKey="month" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <RechartsTooltip 
                        formatter={(value: number) => [`$${value}`, 'Revenue']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fafafa'
                        }}
                      />
                      <Legend />
                      <Bar dataKey="premium" name="Premium Packages" stackId="a" fill="#8884d8" />
                      <Bar dataKey="marketplace" name="Marketplace Fees" stackId="a" fill="#82ca9d" />
                      <Bar dataKey="tokens" name="Token Sales" stackId="a" fill="#ffc658" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Premium Buyers</CardTitle>
                  <CardDescription>
                    Users who spent the most on premium packages
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { username: "whale_investor", spent: "$1,243", tier: "Whale" },
                      { username: "crypto_pro", spent: "$920", tier: "Whale" },
                      { username: "token_stacker", spent: "$764", tier: "Growth" },
                      { username: "blockchain_vip", spent: "$685", tier: "Whale" },
                      { username: "miner_elite", spent: "$612", tier: "Growth" }
                    ].map((buyer, index) => (
                      <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white font-semibold text-sm">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{buyer.username}</p>
                            <p className="text-xs text-muted-foreground">Tier: {buyer.tier}</p>
                          </div>
                        </div>
                        <div className="font-semibold">{buyer.spent}</div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Metrics</CardTitle>
                  <CardDescription>
                    Key financial performance indicators
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">ARPU (30d)</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">$2.82</p>
                          <div className="flex items-center text-green-500">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            <span className="text-xs">+8.3%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">CLV</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">$48.57</p>
                          <div className="flex items-center text-green-500">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            <span className="text-xs">+4.2%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Premium Conversion Rate</h4>
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Overall</span>
                          <span className="font-medium">6.8%</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div className="bg-primary h-full rounded-full" style={{width: '6.8%'}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">After 30 days</span>
                          <span className="font-medium">12.3%</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div className="bg-primary h-full rounded-full" style={{width: '12.3%'}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">From Referrals</span>
                          <span className="font-medium">18.9%</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div className="bg-primary h-full rounded-full" style={{width: '18.9%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="engagement" className="space-y-6 pt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Daily Activity Patterns</CardTitle>
                    <CardDescription>
                      User engagement throughout the day
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={dailyActivityData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#d4d4d8" />
                      <XAxis dataKey="hour" stroke="#a1a1aa" />
                      <YAxis stroke="#a1a1aa" />
                      <RechartsTooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(24, 24, 27, 0.9)', 
                          border: 'none',
                          borderRadius: '6px',
                          color: '#fafafa'
                        }}
                      />
                      <Legend />
                      <Line type="monotone" dataKey="active" name="Active Users" stroke="#8884d8" strokeWidth={2} />
                      <Line type="monotone" dataKey="mining" name="Mining" stroke="#82ca9d" strokeWidth={2} />
                      <Line type="monotone" dataKey="marketplace" name="Marketplace" stroke="#ffc658" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Mining Activity</CardTitle>
                  <CardDescription>
                    Mining performance and engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">Active Miners</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">5,482</p>
                          <div className="flex items-center text-green-500">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            <span className="text-xs">+12.4%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">Avg. Session Time</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">14.2m</p>
                          <div className="flex items-center text-green-500">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            <span className="text-xs">+3.8%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Mining Engagement by User Type</h4>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Regular Users</span>
                          <span className="font-medium">48%</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div className="bg-blue-500 h-full rounded-full" style={{width: '48%'}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Premium Users</span>
                          <span className="font-medium">87%</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div className="bg-purple-500 h-full rounded-full" style={{width: '87%'}}></div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Mobile Users</span>
                          <span className="font-medium">63%</span>
                        </div>
                        <div className="w-full h-2 bg-muted overflow-hidden rounded-full">
                          <div className="bg-green-500 h-full rounded-full" style={{width: '63%'}}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Marketplace Activity</CardTitle>
                  <CardDescription>
                    Transaction volume and user engagement
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">Listed Items</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">3,871</p>
                          <div className="flex items-center text-green-500">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            <span className="text-xs">+5.8%</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <p className="text-sm font-medium text-muted-foreground">30d Transactions</p>
                        <div className="flex items-center justify-between">
                          <p className="text-2xl font-bold">842</p>
                          <div className="flex items-center text-green-500">
                            <ArrowUp className="h-3 w-3 mr-1" />
                            <span className="text-xs">+13.7%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold">Top Categories by Volume</h4>
                      
                      <div className="space-y-3">
                        {[
                          { category: "Digital Art", items: 1243, volume: "23.4K TSK" },
                          { category: "Game Assets", items: 876, volume: "18.7K TSK" },
                          { category: "Collectibles", items: 654, volume: "12.5K TSK" },
                          { category: "Domain Names", items: 423, volume: "9.8K TSK" }
                        ].map((category, index) => (
                          <div key={index} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 transition-colors">
                            <div>
                              <p className="font-medium">{category.category}</p>
                              <p className="text-xs text-muted-foreground">{category.items} items</p>
                            </div>
                            <div className="font-semibold">{category.volume}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
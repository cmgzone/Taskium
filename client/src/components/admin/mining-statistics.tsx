import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Coins, TrendingUp, Users, Clock } from "lucide-react";

export function MiningStatistics() {
  // Fetch analytics data for mining
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['/api/admin/analytics/dashboard'],
    enabled: true,  // Auto fetch on mount
  });

  // Extract mining-specific data from the analytics dashboard
  const totalMined = analyticsData?.summaryCards?.find(card => card.title === "Total TSK Mined")?.value || "Loading...";
  const totalMinedChange = analyticsData?.summaryCards?.find(card => card.title === "Total TSK Mined")?.change || "+0%";
  const miningGrowth = analyticsData?.historicalData?.mining?.growth || 0;

  // Format the growth trend indicator
  const growthTrend = miningGrowth >= 0 ? "up" : "down";
  const growthFormatted = (miningGrowth >= 0 ? "+" : "") + (typeof miningGrowth === "number" ? miningGrowth.toFixed(1) : "0") + "%";

  // Mining statistics cards data
  const miningStats = [
    {
      title: "Total TSK Mined",
      value: totalMined,
      change: totalMinedChange,
      trend: growthTrend,
      icon: <Coins className="h-5 w-5" />,
      color: "text-orange-500"
    },
    {
      title: "Mining Growth",
      value: growthFormatted,
      change: "Last 30 days",
      trend: growthTrend,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "text-blue-500"
    },
    {
      title: "Active Miners",
      value: analyticsData?.kpiCards?.find(kpi => kpi.title === "Active Miners")?.value || "...",
      change: "Last 24 hours",
      trend: "up",
      icon: <Users className="h-5 w-5" />,
      color: "text-green-500"
    },
    {
      title: "Mining Uptime",
      value: "99.8%",
      change: "No interruptions",
      trend: "up",
      icon: <Clock className="h-5 w-5" />,
      color: "text-purple-500"
    }
  ];

  // Function to render the trend indicator
  const renderTrendIndicator = (trend: string, change: string) => {
    return (
      <div className={`flex items-center ${trend === "up" ? "text-green-500" : "text-red-500"}`}>
        {trend === "up" ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z"
              clipRule="evenodd"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-3 h-3 mr-1"
          >
            <path
              fillRule="evenodd"
              d="M10 3a.75.75 0 01.75.75v10.638l3.96-4.158a.75.75 0 111.08 1.04l-5.25 5.5a.75.75 0 01-1.08 0l-5.25-5.5a.75.75 0 111.08-1.04l3.96 4.158V3.75A.75.75 0 0110 3z"
              clipRule="evenodd"
            />
          </svg>
        )}
        <span className="text-xs">{change}</span>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-xl font-bold">Mining Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-6">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-6 w-2/3 mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Mining Statistics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {miningStats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  {renderTrendIndicator(stat.trend, stat.change)}
                </div>
                <div className={`p-2 rounded-md bg-muted ${stat.color}`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {/* Add a mining rewards chart when there's more data */}
      {analyticsData?.historicalData?.mining && (
        <Card>
          <CardHeader>
            <CardTitle>Mining Rewards Trend</CardTitle>
            <CardDescription>
              Total TSK mined over the past 30 days compared to previous period
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-4">
              <div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
                  <span className="text-sm">Current period: {analyticsData.historicalData.mining.recent30d.toFixed(2)} TSK</span>
                </div>
                <div className="flex items-center mt-1">
                  <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                  <span className="text-sm">Previous period: {analyticsData.historicalData.mining.previous30d.toFixed(2)} TSK</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Growth</p>
                <p className={`text-lg font-bold ${miningGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {growthFormatted}
                </p>
              </div>
            </div>
            
            {/* Add bar chart placeholder for now */}
            <div className="h-[200px] text-center flex items-center justify-center text-muted-foreground">
              <p>Mining trend chart will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
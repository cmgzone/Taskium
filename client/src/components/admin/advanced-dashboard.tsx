import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { 
  Cpu, 
  Database, 
  Shield, 
  Lock, 
  RefreshCw, 
  FileCode, 
  LineChart, 
  BadgeCheck, 
  Users, 
  PackageOpen, 
  Clock, 
  Calendar,
  Wallet,
  HardDrive
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Mock data for system metrics
const systemMetrics = {
  ram: 82,
  cpu: 46,
  storage: 63,
  network: 71,
  lastRestart: "2025-03-24T10:15:00Z",
  uptime: "3d 7h 42m",
  apiCalls: {
    total: 23579,
    successful: 22984,
    failed: 595,
    ratio: 97.5
  },
  database: {
    connections: 18,
    queriesPerMinute: 248,
    averageResponseTime: 53, // ms
    status: "healthy"
  },
  users: {
    total: 8732,
    active: 3418,
    premium: 589,
    withKyc: 1257
  },
  security: {
    failedLogins: 187,
    suspiciousActivities: 23,
    blockedIps: 14,
    lastScan: "2025-03-25T02:30:00Z"
  }
};

// Component for showing CPU, memory & storage in a grid
function SystemResources() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">CPU Usage</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">{systemMetrics.cpu}%</span>
            </div>
            <Progress value={systemMetrics.cpu} />
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Cores</span>
              <span>8 vCPU</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Load Average</span>
              <span>1.23, 1.45, 1.62</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">Memory Usage</CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Usage</span>
              <span className="font-medium">{systemMetrics.ram}%</span>
            </div>
            <Progress value={systemMetrics.ram} className={systemMetrics.ram > 80 ? "bg-red-200" : ""} />
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total</span>
              <span>16 GB</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Free</span>
              <span>2.8 GB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base font-medium">Database</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Connections</span>
              <span className="font-medium">{systemMetrics.database.connections}</span>
            </div>
            <Progress value={systemMetrics.database.connections / 30 * 100} />
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Queries/min</span>
              <span>{systemMetrics.database.queriesPerMinute}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Response Time</span>
              <span>{systemMetrics.database.averageResponseTime} ms</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Security overview component
function SecurityOverview() {
  const { toast } = useToast();

  const runSecurityScan = () => {
    toast({
      title: "Security Scan Initiated",
      description: "A full system security scan has been started."
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">Security Overview</CardTitle>
          <Shield className="h-5 w-5 text-primary" />
        </div>
        <CardDescription>System security status and controls</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Failed Login Attempts (24h)</span>
              </div>
              <Badge variant={systemMetrics.security.failedLogins > 100 ? "destructive" : "outline"}>
                {systemMetrics.security.failedLogins}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Suspicious Activities</span>
              </div>
              <Badge variant={systemMetrics.security.suspiciousActivities > 10 ? "destructive" : "outline"}>
                {systemMetrics.security.suspiciousActivities}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Security Scan</span>
              </div>
              <span className="text-sm">
                {new Date(systemMetrics.security.lastScan).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="auto-ban" className="flex items-center gap-2 cursor-pointer">
                <Shield className="h-4 w-4" />
                <span>Auto-ban Suspicious IPs</span>
              </Label>
              <Switch id="auto-ban" defaultChecked />
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="force-2fa" className="flex items-center gap-2 cursor-pointer">
                <Lock className="h-4 w-4" />
                <span>Force 2FA for Admin Access</span>
              </Label>
              <Switch id="force-2fa" defaultChecked />
            </div>

            <Button 
              className="w-full mt-2" 
              variant="outline"
              onClick={runSecurityScan}
            >
              <Shield className="h-4 w-4 mr-2" />
              Run Security Scan
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// System controls component
function SystemControls() {
  const { toast } = useToast();
  const [isRestartDialogOpen, setIsRestartDialogOpen] = useState(false);
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(false);
  const [isTestModeActive, setIsTestModeActive] = useState(false);

  const handleRestart = () => {
    toast({
      title: "System Restart Initiated",
      description: "The system will restart in 30 seconds. All users will be notified."
    });
    setIsRestartDialogOpen(false);
  };

  const toggleMaintenanceMode = () => {
    setIsMaintenanceMode(!isMaintenanceMode);
    toast({
      title: isMaintenanceMode ? "Maintenance Mode Deactivated" : "Maintenance Mode Activated",
      description: isMaintenanceMode 
        ? "The system is now accessible to all users." 
        : "The system is now in maintenance mode. Only admins can access it."
    });
  };

  const toggleTestMode = () => {
    setIsTestModeActive(!isTestModeActive);
    toast({
      title: isTestModeActive ? "Test Mode Deactivated" : "Test Mode Activated",
      description: isTestModeActive
        ? "System is running in production mode." 
        : "System is running in test mode. No real transactions will be processed."
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">System Controls</CardTitle>
          <Cpu className="h-5 w-5 text-primary" />
        </div>
        <CardDescription>Manage core system functions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">System Uptime</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {systemMetrics.uptime}
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Last Restart</span>
              </div>
              <span className="text-sm">
                {new Date(systemMetrics.lastRestart).toLocaleString()}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Database Status</span>
              </div>
              <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                {systemMetrics.database.status}
              </Badge>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="maintenance-mode" className="flex items-center gap-2 cursor-pointer">
                <Cpu className="h-4 w-4" />
                <span>Maintenance Mode</span>
              </Label>
              <Switch 
                id="maintenance-mode" 
                checked={isMaintenanceMode}
                onCheckedChange={toggleMaintenanceMode}
              />
            </div>
            
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="test-mode" className="flex items-center gap-2 cursor-pointer">
                <FileCode className="h-4 w-4" />
                <span>Test Mode</span>
              </Label>
              <Switch 
                id="test-mode" 
                checked={isTestModeActive}
                onCheckedChange={toggleTestMode}
              />
            </div>

            <div className="flex justify-end mt-2">
              <Dialog open={isRestartDialogOpen} onOpenChange={setIsRestartDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="secondary" className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" /> 
                    Restart System
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Confirm System Restart</DialogTitle>
                    <DialogDescription>
                      Are you sure you want to restart the system? All active users will be disconnected.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <p className="text-sm text-muted-foreground mb-4">
                      System will enter maintenance mode for approximately 30 seconds while restarting.
                    </p>
                    <div className="space-y-2 border rounded-md p-3 bg-muted/30">
                      <div className="flex justify-between items-center text-sm">
                        <span>Active Users:</span>
                        <Badge variant="outline">{systemMetrics.users.active}</Badge>
                      </div>
                      <div className="flex justify-between items-center text-sm">
                        <span>Active Sessions:</span>
                        <Badge variant="outline">{systemMetrics.users.active * 1.2}</Badge>
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRestartDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button variant="destructive" onClick={handleRestart}>
                      Restart Now
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Usage statistics component
function UsageStatistics() {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">System Usage</CardTitle>
          <LineChart className="h-5 w-5 text-primary" />
        </div>
        <CardDescription>Overview of platform activity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Total Users</span>
              </div>
              <span className="font-semibold">{systemMetrics.users.total.toLocaleString()}</span>
            </div>
            <Progress value={(systemMetrics.users.active / systemMetrics.users.total) * 100} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Active: {systemMetrics.users.active.toLocaleString()}</span>
              <span>Premium: {systemMetrics.users.premium.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">API Calls (24h)</span>
              </div>
              <span className="font-semibold">{systemMetrics.apiCalls.total.toLocaleString()}</span>
            </div>
            <Progress value={systemMetrics.apiCalls.ratio} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Success: {systemMetrics.apiCalls.successful.toLocaleString()}</span>
              <span>Failed: {systemMetrics.apiCalls.failed.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-4 w-4 text-purple-500" />
                <span className="text-sm font-medium">KYC Verification</span>
              </div>
              <span className="font-semibold">{((systemMetrics.users.withKyc / systemMetrics.users.total) * 100).toFixed(1)}%</span>
            </div>
            <Progress value={(systemMetrics.users.withKyc / systemMetrics.users.total) * 100} className="h-1.5" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Verified: {systemMetrics.users.withKyc.toLocaleString()}</span>
              <span>Pending: 145</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdvancedDashboard() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">System Dashboard</h2>
          <p className="text-muted-foreground">Advanced controls and system metrics</p>
        </div>
        
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="sm" onClick={() => {
                  queryClient.invalidateQueries();
                  toast({
                    title: "Dashboard Refreshed",
                    description: "All system metrics have been refreshed."
                  });
                }}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh all metrics</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm">
                <Shield className="h-4 w-4 mr-2" />
                Security Center
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Security Center</DialogTitle>
                <DialogDescription>
                  Advanced security controls and threat management
                </DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium">Active Threats</h3>
                  <div className="border rounded-md divide-y">
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="destructive">High</Badge>
                        <span>Suspicious login attempts</span>
                      </div>
                      <Button size="sm" variant="outline">Block</Button>
                    </div>
                    <div className="p-3 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">Medium</Badge>
                        <span>API rate limiting triggered</span>
                      </div>
                      <Button size="sm" variant="outline">View</Button>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-medium">Security Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-login-attempts">Max Login Attempts</Label>
                      <Input id="max-login-attempts" type="number" defaultValue="5" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="session-timeout">Session Timeout (mins)</Label>
                      <Input id="session-timeout" type="number" defaultValue="30" />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2 mt-2">
                    <Label htmlFor="advanced-logging" className="cursor-pointer">
                      Enable Advanced Logging
                    </Label>
                    <Switch id="advanced-logging" defaultChecked />
                  </div>
                  
                  <div className="flex items-center justify-between space-x-2">
                    <Label htmlFor="ip-restriction" className="cursor-pointer">
                      Admin IP Restriction
                    </Label>
                    <Switch id="ip-restriction" />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline">Reset to Defaults</Button>
                <Button>Save Changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">System Overview</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6 pt-6">
            <SystemResources />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SystemControls />
              <UsageStatistics />
            </div>
          </TabsContent>
          
          <TabsContent value="security" className="space-y-6 pt-6">
            <SecurityOverview />
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Security Events</CardTitle>
                <CardDescription>Log of recent security-related activity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="relative border rounded-md p-4 pl-8">
                    <div className="absolute left-4 top-4 w-1 h-[calc(100%-32px)] bg-red-500"></div>
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">Multiple failed login attempts</h4>
                        <p className="text-sm text-muted-foreground">User: admin@example.com</p>
                      </div>
                      <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                        Critical
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">2025-03-25 14:32:45</p>
                  </div>
                  
                  <div className="relative border rounded-md p-4 pl-8">
                    <div className="absolute left-4 top-4 w-1 h-[calc(100%-32px)] bg-amber-500"></div>
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">New IP address detected</h4>
                        <p className="text-sm text-muted-foreground">User: john.doe@example.com</p>
                      </div>
                      <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                        Warning
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">2025-03-25 12:18:03</p>
                  </div>
                  
                  <div className="relative border rounded-md p-4 pl-8">
                    <div className="absolute left-4 top-4 w-1 h-[calc(100%-32px)] bg-green-500"></div>
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">Security scan completed</h4>
                        <p className="text-sm text-muted-foreground">No issues found</p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        Info
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">2025-03-25 02:30:12</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">View All Security Logs</Button>
              </CardFooter>
            </Card>
          </TabsContent>
          
          <TabsContent value="blockchain" className="space-y-6 pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium">Contract Status</CardTitle>
                    <FileCode className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Contract Address</span>
                      <Badge variant="outline" className="font-mono text-xs">0xA4E6Dd...</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Network</span>
                      <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        BNB Chain
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">TSK Balance</span>
                      <span className="font-medium">10,000 TSK</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Owner BNB Balance</span>
                      <span className="font-medium">2.487 BNB</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium">Transaction Stats</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">24h Volume</span>
                    <span className="font-medium">3,245 TSK</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Withdrawals (24h)</span>
                    <span className="font-medium">18</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Avg. Gas Fee</span>
                    <span className="font-medium">0.0012 BNB</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Last TX Hash</span>
                    <Badge variant="outline" className="font-mono text-xs">0x83f4...</Badge>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-base font-medium">Hot Wallet</CardTitle>
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Owner Address</span>
                    <Badge variant="outline" className="font-mono text-xs">0x734D...</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">TSK Balance</span>
                    <span className="font-medium">900,000 TSK</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge variant="outline" className="bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                      Active
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Key Security</span>
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
                      Medium
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Blockchain Operations</CardTitle>
                <CardDescription>Perform maintenance and management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-medium">Contract Management</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between space-x-2">
                        <Label className="flex flex-col">
                          <span>Gas Price (Gwei)</span>
                          <span className="text-xs text-muted-foreground">Current: 5 Gwei</span>
                        </Label>
                        <Input className="w-24" type="number" defaultValue="5" />
                      </div>
                      
                      <div className="flex items-center justify-between space-x-2">
                        <Label className="flex flex-col">
                          <span>Max Fee Per Transaction</span>
                          <span className="text-xs text-muted-foreground">In BNB</span>
                        </Label>
                        <Input className="w-24" type="number" defaultValue="0.005" step="0.001" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <Button variant="outline">
                          Pause Contract
                        </Button>
                        <Button>
                          Fund Hot Wallet
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="font-medium">Emergency Operations</h3>
                    <div className="border border-red-200 dark:border-red-900 rounded-md p-4 space-y-3">
                      <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
                        <Shield className="h-5 w-5" />
                        <h4 className="font-medium">Emergency Controls</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        These operations require owner verification. Use with extreme caution.
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" className="border-red-200 dark:border-red-900 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/20">
                          Freeze All Withdrawals
                        </Button>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="destructive">
                              Emergency Stop
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Confirm Emergency Stop</DialogTitle>
                              <DialogDescription>
                                This will halt all blockchain operations immediately. Are you sure?
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                                WARNING: This is an emergency measure that will:
                              </p>
                              <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                                <li>Stop all token withdrawals</li>
                                <li>Pause all contract interactions</li>
                                <li>Disconnect from blockchain networks</li>
                                <li>Notify all users</li>
                              </ul>
                              <div className="mt-4">
                                <Label htmlFor="emergency-reason">Reason for emergency stop</Label>
                                <Input id="emergency-reason" className="mt-1" placeholder="Required reason..." />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline">Cancel</Button>
                              <Button variant="destructive">Confirm Emergency Stop</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
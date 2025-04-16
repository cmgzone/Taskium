import { useState, useEffect } from "react";
import { useTheme } from "@/lib/theme-provider";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { 
  Sun, 
  Moon, 
  Laptop, 
  Palette, 
  ArrowRight, 
  Check, 
  CreditCard,
  Wallet,
  BarChart,
  User,
  Zap,
  Clock,
  Star,
  Shield,
  Sparkles
} from "lucide-react";
import { FaBitcoin, FaEthereum } from "react-icons/fa";
import { SiBinance } from "react-icons/si";

export default function ThemePage() {
  const { mode, colorScheme } = useTheme();
  const [activeTab, setActiveTab] = useState("tab-0");

  // Demo components to showcase theme
  const themeInfo = {
    modes: [
      { name: "Light Mode", icon: <Sun className="h-5 w-5" />, id: "light" },
      { name: "Dark Mode", icon: <Moon className="h-5 w-5" />, id: "dark" },
      { name: "System Preference", icon: <Laptop className="h-5 w-5" />, id: "system" }
    ],
    colorSchemes: [
      { 
        name: "Default", 
        icon: <Palette className="h-5 w-5" />, 
        id: "default", 
        color: "bg-primary",
        lightHsl: "hsl(262.1 83.3% 57.8%)",
        darkHsl: "hsl(263.4 70% 50.4%)",
        description: "The standard Taskium color palette with rich purple tones"
      },
      { 
        name: "Bitcoin", 
        icon: <FaBitcoin className="h-5 w-5" />, 
        id: "bitcoin", 
        color: "bg-orange-500",
        lightHsl: "hsl(32 94% 49%)",
        darkHsl: "hsl(32 94% 59%)",
        description: "Warm orange Bitcoin-inspired design reflecting the original cryptocurrency"
      },
      { 
        name: "Ethereum", 
        icon: <FaEthereum className="h-5 w-5" />, 
        id: "ethereum", 
        color: "bg-blue-500",
        lightHsl: "hsl(210 100% 56%)",
        darkHsl: "hsl(210 100% 66%)",
        description: "Cool blue Ethereum-inspired colors representing smart contract functionality"
      },
      { 
        name: "BNB", 
        icon: <SiBinance className="h-5 w-5" />, 
        id: "bnb", 
        color: "bg-yellow-500",
        lightHsl: "hsl(45 93% 47%)",
        darkHsl: "hsl(45 93% 57%)",
        description: "Gold BNB Chain color scheme representing the Binance Smart Chain ecosystem"
      }
    ]
  };

  // Sample UI elements to showcase in different themes
  const demoComponents = [
    {
      title: "Button Variants",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium mb-2">Primary</h3>
            <Button variant="default">Default Button</Button>
            <Button variant="default" disabled>Disabled</Button>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium mb-2">Secondary</h3>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium mb-2">Accents</h3>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link Style</Button>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-medium mb-2">Status</h3>
            <Button variant="destructive">Destructive</Button>
            <div className="flex gap-2">
              <Button size="sm">Small</Button>
              <Button size="icon"><Check className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "Cards & Badges",
      content: (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Mining Status</CardTitle>
              <CardDescription>Your daily mining progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between mb-2">
                <span className="text-sm">Daily Target</span>
                <span className="text-sm font-medium">100 TSK</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: "65%" }}></div>
              </div>
              <div className="mt-4 flex gap-2">
                <Badge variant="default">Active</Badge>
                <Badge variant="secondary">Streak: 7 days</Badge>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" size="sm" className="ml-auto">Details</Button>
            </CardFooter>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Wallet Balance</CardTitle>
              <CardDescription>Your current holdings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12,345 TSK</div>
              <div className="text-sm text-muted-foreground">≈ $1,234.50 USD</div>
              
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" size="sm">
                  <Wallet className="mr-2 h-4 w-4" /> Withdraw
                </Button>
                <Button variant="default" size="sm">
                  <CreditCard className="mr-2 h-4 w-4" /> Deposit
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    },
    {
      title: "Navigation Elements",
      content: (
        <div className="grid grid-cols-1 gap-4">
          <Tabs defaultValue="dashboard" className="w-full">
            <TabsList className="w-full grid grid-cols-4">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="mining">Mining</TabsTrigger>
              <TabsTrigger value="referrals">Referrals</TabsTrigger>
              <TabsTrigger value="wallet">Wallet</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="p-4 border rounded-md">
              <div className="flex gap-4">
                <Card className="flex-1 p-4">
                  <div className="flex items-center gap-2">
                    <BarChart className="h-5 w-5 text-primary" />
                    <span>Daily Activity</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">87%</div>
                </Card>
                <Card className="flex-1 p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <span>Active Referrals</span>
                  </div>
                  <div className="text-2xl font-bold mt-2">12</div>
                </Card>
              </div>
            </TabsContent>
            <TabsContent value="mining" className="p-4 border rounded-md">
              Mining content will appear here
            </TabsContent>
            <TabsContent value="referrals" className="p-4 border rounded-md">
              Referrals content will appear here
            </TabsContent>
            <TabsContent value="wallet" className="p-4 border rounded-md">
              Wallet content will appear here
            </TabsContent>
          </Tabs>
        </div>
      )
    }
  ];

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Theme Customization</h1>
          <p className="text-muted-foreground">Customize your Taskium experience with different themes</p>
        </div>
        <ThemeSwitcher />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Current Theme</CardTitle>
            <CardDescription>Your active theme settings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Appearance Mode</h3>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                  {themeInfo.modes.find(m => m.id === mode)?.icon}
                  <span className="font-medium capitalize">{mode} Mode</span>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Color Scheme</h3>
                <div className="flex items-center gap-2 p-3 rounded-md bg-muted/50">
                  {themeInfo.colorSchemes.find(c => c.id === colorScheme)?.icon}
                  <span className="font-medium">{colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Theme Preview</CardTitle>
            <CardDescription>See how different elements look with your current theme</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="w-full grid grid-cols-3">
                {demoComponents.map((demo, index) => (
                  <TabsTrigger key={index} value={`tab-${index}`}>
                    {demo.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              
              {demoComponents.map((demo, index) => (
                <TabsContent key={index} value={`tab-${index}`} className="pt-4">
                  {demo.content}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Theme Palettes</CardTitle>
          <CardDescription>Blockchain-themed color schemes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {themeInfo.colorSchemes.map((scheme) => (
              <Card key={scheme.id} className={`overflow-hidden ${colorScheme === scheme.id ? 'ring-2 ring-primary/70 shadow-lg' : ''}`}>
                {/* Color preview with light/dark mode */}
                <div className="h-24 flex">
                  <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: scheme.lightHsl }}>
                    <Sun className="h-6 w-6 text-white drop-shadow-md" />
                  </div>
                  <div className="w-1/2 flex items-center justify-center" style={{ backgroundColor: scheme.darkHsl }}>
                    <Moon className="h-6 w-6 text-white drop-shadow-md" />
                  </div>
                </div>
                
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-2">
                    {scheme.icon}
                    <span className="font-medium">{scheme.name}</span>
                    {colorScheme === scheme.id && (
                      <Badge variant="outline" className="ml-auto">Active</Badge>
                    )}
                  </div>
                  
                  <p className="text-sm text-muted-foreground mt-2">
                    {scheme.description}
                  </p>
                  
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded p-1.5 flex items-center justify-between" 
                         style={{ backgroundColor: scheme.lightHsl, color: 'white' }}>
                      Light
                      <span className="opacity-90 font-mono">HSL</span>
                    </div>
                    <div className="rounded p-1.5 flex items-center justify-between"
                         style={{ backgroundColor: scheme.darkHsl, color: 'white' }}>
                      Dark
                      <span className="opacity-90 font-mono">HSL</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Blockchain-themed Components Showcase */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Blockchain-Themed Components</CardTitle>
          <CardDescription>Special components that adapt to your chosen theme</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Token Card with themed styling */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Token Card</h3>
              <div className="token-card card-stack">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-bold">TSK Token</h4>
                    <p className="text-sm text-muted-foreground">Native platform currency</p>
                  </div>
                  <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Current Price</p>
                    <p className="text-lg font-bold">$0.10 USD</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">24h Change</p>
                    <p className="text-lg font-bold text-green-500">+5.2%</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Auto-Compound</span>
                  <Switch />
                </div>
              </div>
            </div>
            
            {/* Mining Status with themed glow */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Mining Status</h3>
              <div className="p-6 rounded-xl border border-primary/20 bg-card card-highlight">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold">Active Mining</h4>
                  <Badge className="bg-green-500">Online</Badge>
                </div>
                
                <div className="relative my-8 flex justify-center">
                  <div className="absolute w-24 h-24 rounded-full mining-glow"></div>
                  <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center relative z-10">
                    <Zap className="h-10 w-10 text-white" />
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-2 mt-4">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Rate</p>
                    <p className="text-lg font-bold">1.5 TSK/h</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Uptime</p>
                    <p className="text-lg font-bold">18h 42m</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Streak</p>
                    <p className="text-lg font-bold">7 Days</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Blockchain Status Indicators */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Status Indicators</h3>
              <Card className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="status-indicator success"></div>
                      <span>Network Active</span>
                    </div>
                    <Badge variant="outline" className="bg-background/50">Operational</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="status-indicator warning"></div>
                      <span>Consensus Delay</span>
                    </div>
                    <Badge variant="outline" className="bg-background/50">Degraded</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="status-indicator info"></div>
                      <span>Syncing Blocks</span>
                    </div>
                    <Badge variant="outline" className="bg-background/50">In Progress</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                    <div className="flex items-center gap-2">
                      <div className="status-indicator error"></div>
                      <span>Node Connection</span>
                    </div>
                    <Badge variant="outline" className="bg-background/50">Failed</Badge>
                  </div>
                </div>
              </Card>
            </div>
            
            {/* Themed Features Card */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Features Card</h3>
              <Card>
                <CardHeader>
                  <CardTitle>Blockchain Features</CardTitle>
                  <CardDescription>Adaptive components for {colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)} theme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Clock className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Automatic Rewards</p>
                        <p className="text-sm text-muted-foreground">Earn while you sleep</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Star className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Premium Benefits</p>
                        <p className="text-sm text-muted-foreground">Exclusive features</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                        <Shield className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Security First</p>
                        <p className="text-sm text-muted-foreground">Protected transactions</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Theme Animation Showcase */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Adaptive Animations</CardTitle>
          <CardDescription>Theme-based animations and transitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Animated Elements</h3>
              <p className="text-sm text-muted-foreground">
                Elements with animated transitions that respond to theme changes. 
                Try switching theme to see the transition effects.
              </p>
              
              <div className="space-y-4">
                <div className="theme-animate p-4 rounded-xl border border-primary/20 bg-card">
                  <h4 className="text-lg font-medium mb-2">Color Transition</h4>
                  <p className="text-sm mb-3">This card smoothly transitions colors when theme changes.</p>
                  <div className="h-2 w-full bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary theme-animate" style={{ width: "70%" }}></div>
                  </div>
                </div>
                
                <div className="theme-animate p-4 rounded-xl border border-primary/30 bg-background shadow-sm">
                  <div className="flex items-center space-x-2">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center theme-animate">
                      {colorScheme === "bitcoin" && <FaBitcoin className="h-5 w-5 text-primary" />}
                      {colorScheme === "ethereum" && <FaEthereum className="h-5 w-5 text-primary" />}
                      {colorScheme === "bnb" && <SiBinance className="h-5 w-5 text-primary" />}
                      {colorScheme === "default" && <Sparkles className="h-5 w-5 text-primary" />}
                    </div>
                    <div>
                      <h4 className="font-medium">{colorScheme.charAt(0).toUpperCase() + colorScheme.slice(1)} Network</h4>
                      <p className="text-xs text-muted-foreground">Active theme-specific icon</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Data Visualization</h3>
              <p className="text-sm text-muted-foreground">
                Visualizations that automatically adapt to the current theme colors
              </p>
              
              <div className="p-5 border rounded-xl">
                <h4 className="text-base font-medium mb-4">Transaction History</h4>
                <div className="space-y-3">
                  {/* Theme-specific transaction history bars */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Sent</span>
                      <span>250 TSK</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full theme-animate" 
                        style={{ 
                          width: "65%", 
                          backgroundColor: "hsl(var(--primary))" 
                        }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Received</span>
                      <span>420 TSK</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full theme-animate" 
                        style={{ 
                          width: "85%", 
                          backgroundColor: "hsl(var(--primary) / 0.8)" 
                        }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Staked</span>
                      <span>1,000 TSK</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full theme-animate" 
                        style={{ 
                          width: "100%", 
                          backgroundColor: "hsl(var(--primary) / 0.6)" 
                        }}></div>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span>Rewards</span>
                      <span>185 TSK</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full theme-animate" 
                        style={{ 
                          width: "45%", 
                          backgroundColor: "hsl(var(--primary) / 0.9)" 
                        }}></div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Today's Activity</span>
                    <span className={`text-xs px-2 py-1 rounded-full theme-animate ${
                      colorScheme === "bitcoin" ? "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200" :
                      colorScheme === "ethereum" ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" :
                      colorScheme === "bnb" ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" :
                      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200"
                    }`}>
                      High Volume
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
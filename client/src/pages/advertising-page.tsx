import { useAuth } from "@/hooks/use-auth";
import UserAdsManagement from "@/components/advertising/user-ads-management";
import AdminAdsManagement from "@/components/advertising/admin-ads-management";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Info, ArrowRight, LayoutGrid, Menu, Maximize2, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { AdDisplay } from "@/components/advertising/ad-display";
import { EnhancedInlineAd, AdCarousel, EnhancedPopupAd } from "@/components/advertising";

export default function AdvertisingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showPopupAd, setShowPopupAd] = useState(false);
  const [showGuestPopupAd, setShowGuestPopupAd] = useState(false);

  if (!user) {
    return (
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl p-8 mb-8">
          <h1 className="text-3xl font-bold mb-4">Advertise on the TSK Platform</h1>
          <p className="text-xl mb-6">Reach thousands of blockchain enthusiasts and token miners</p>
          <div className="flex flex-wrap gap-4">
            <Link href="/auth">
              <Button className="bg-white text-blue-600 hover:bg-blue-100">
                Sign Up Now <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>Target Your Audience</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Reach miners, premium users, marketplace shoppers, or new users with targeted advertising.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Pay with TSK Tokens</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Advertising costs are paid using TSK tokens, providing utility for your holdings.</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Track Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Get detailed analytics on your ad campaigns to optimize your marketing strategy.</p>
            </CardContent>
          </Card>
        </div>
        
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-4">Example Ad Placements</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">These are examples of how your ads will appear on the platform</p>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold">Ad Display Gallery</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Preview how your ads will appear on the TSK platform
            </p>
          </div>
          <Button 
            className="gap-2"
            onClick={() => setShowGuestPopupAd(true)}
          >
            <Maximize2 className="h-4 w-4" /> Preview Popup Ad
          </Button>
        </div>
            
        {/* Showing popup ad when button is clicked */}
        {showGuestPopupAd && <EnhancedPopupAd onClose={() => setShowGuestPopupAd(false)} delayBeforeShow={0} />}
        
        <Tabs defaultValue="standard" className="mb-10">
          <TabsList className="mb-6">
            <TabsTrigger value="standard">Standard Ads</TabsTrigger>
            <TabsTrigger value="premium">Premium Ad Units</TabsTrigger>
            <TabsTrigger value="carousel">Carousel Ads</TabsTrigger>
          </TabsList>
          
          <TabsContent value="standard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" /> Banner Ad
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Banner ads appear prominently on the dashboard and other main pages
                </p>
                <div className="border rounded-lg p-4">
                  <EnhancedInlineAd 
                    placement="banner" 
                    variant="banner"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <Menu className="h-4 w-4" /> Sidebar Ad
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Sidebar ads appear in the sidebar of pages and are more subtle
                </p>
                <div className="border rounded-lg p-4">
                  <EnhancedInlineAd 
                    placement="sidebar" 
                    variant="sidebar"
                  />
                </div>
              </div>
              
              <div className="space-y-3">
                <h3 className="font-medium flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4" /> Notification Ad
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Notification-style ads appear in the corner of the screen
                </p>
                <div className="border rounded-lg p-4">
                  <EnhancedInlineAd 
                    placement="notification" 
                    variant="notification"
                  />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="premium">
            <Card className="mb-8">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Premium Ad Units</CardTitle>
                <CardDescription>
                  High visibility premium ad placements that stand out on the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Featured Content Box</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <EnhancedInlineAd placement="premium" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Compact Inline Ads</h4>
                    <div className="space-y-3">
                      <EnhancedInlineAd placement="compact" variant="compact" />
                      <EnhancedInlineAd placement="compact" variant="compact" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="carousel">
            <div className="space-y-3 mb-6">
              <h3 className="font-medium">Dynamic Ad Carousel</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Showcase multiple ads in a visually appealing rotating carousel
              </p>
              <div className="rounded-lg overflow-hidden border">
                <AdCarousel placement="carousel" height="300px" />
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Info className="h-5 w-5 mr-2" />
              TSK Advertising Guidelines
            </CardTitle>
            <CardDescription>
              Please follow these guidelines to ensure your ad is approved
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Prohibited Content</h4>
                <ul className="list-disc list-inside text-sm mt-1 text-gray-600 dark:text-gray-400">
                  <li>Illegal products or services</li>
                  <li>Adult content or gambling</li>
                  <li>Misleading or deceptive claims</li>
                  <li>Cryptocurrency pump and dumps or scams</li>
                  <li>Content that violates our terms of service</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium">Ad Quality Requirements</h4>
                <ul className="list-disc list-inside text-sm mt-1 text-gray-600 dark:text-gray-400">
                  <li>Ads must be relevant to the TSK ecosystem and our users</li>
                  <li>Ads must not use excessive capitalization or punctuation</li>
                  <li>Links must lead to legitimate and safe websites</li>
                  <li>Ad content must be clear and not misleading</li>
                  <li>Spelling and grammar should be professional</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-7xl mx-auto px-4 py-8">
      {isAdmin ? (
        <AdminAdsManagement />
      ) : (
        <>
          <UserAdsManagement />
          
          <div className="mt-10 pt-6 border-t">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-bold">Ad Display Gallery</h2>
                <p className="text-muted-foreground">
                  Preview how your ads will appear on the platform. Ad visibility depends on your selected audience and admin approval.
                </p>
              </div>
              <Button 
                className="gap-2"
                onClick={() => setShowPopupAd(true)}
              >
                <Maximize2 className="h-4 w-4" /> Preview Popup Ad
              </Button>
            </div>
            
            {/* Showing popup ad when button is clicked */}
            {showPopupAd && <EnhancedPopupAd onClose={() => setShowPopupAd(false)} delayBeforeShow={0} />}
            
            <Tabs defaultValue="standard">
              <TabsList className="mb-6">
                <TabsTrigger value="standard">Standard Ads</TabsTrigger>
                <TabsTrigger value="premium">Premium Ad Units</TabsTrigger>
                <TabsTrigger value="carousel">Carousel Ads</TabsTrigger>
              </TabsList>
              
              <TabsContent value="standard" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4" /> Banner Ad
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Banner ads appear prominently on the dashboard and other main pages
                    </p>
                    <div className="border rounded-lg p-4">
                      <EnhancedInlineAd 
                        placement="banner" 
                        variant="banner"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <Menu className="h-4 w-4" /> Sidebar Ad
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Sidebar ads appear in the sidebar of pages and are more subtle
                    </p>
                    <div className="border rounded-lg p-4">
                      <EnhancedInlineAd 
                        placement="sidebar" 
                        variant="sidebar"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-medium flex items-center gap-2">
                      <ArrowUpRight className="h-4 w-4" /> Notification Ad
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Notification-style ads appear in the corner of the screen
                    </p>
                    <div className="border rounded-lg p-4">
                      <EnhancedInlineAd 
                        placement="notification" 
                        variant="notification"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="premium" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Premium ad unit example */}
                  <Card className="overflow-hidden">
                    <CardHeader className="pb-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        <span className="text-xs py-0.5 px-2 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 rounded-full">Premium</span>
                        Featured Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <EnhancedInlineAd 
                        placement="premium" 
                        className="border-0 shadow-none" 
                      />
                    </CardContent>
                  </Card>
                  
                  {/* Compact inline ads */}
                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Compact Ad Units</h3>
                    <p className="text-sm text-muted-foreground">
                      Space-efficient ads that can be placed between content sections
                    </p>
                    <div className="space-y-3">
                      <EnhancedInlineAd placement="compact" variant="compact" />
                      <EnhancedInlineAd placement="compact" variant="compact" />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="carousel" className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-medium">Ad Carousel</h3>
                  <p className="text-sm text-muted-foreground">
                    Dynamic carousel that rotates through multiple ads. Ideal for featured content areas.
                  </p>
                  <div className="rounded-lg overflow-hidden">
                    <AdCarousel placement="carousel" height="300px" />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <Card className="mt-8">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Info className="h-5 w-5 mr-2" />
                  TSK Advertising Guidelines
                </CardTitle>
                <CardDescription>
                  Please follow these guidelines to ensure your ad is approved
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium">Prohibited Content</h4>
                    <ul className="list-disc list-inside text-sm mt-1 text-muted-foreground">
                      <li>Illegal products or services</li>
                      <li>Adult content or gambling</li>
                      <li>Misleading or deceptive claims</li>
                      <li>Cryptocurrency pump and dumps or scams</li>
                      <li>Content that violates our terms of service</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Ad Quality Requirements</h4>
                    <ul className="list-disc list-inside text-sm mt-1 text-muted-foreground">
                      <li>Ads must be relevant to the TSK ecosystem and our users</li>
                      <li>Ads must not use excessive capitalization or punctuation</li>
                      <li>Links must lead to legitimate and safe websites</li>
                      <li>Ad content must be clear and not misleading</li>
                      <li>Spelling and grammar should be professional</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="font-medium">Review Process</h4>
                    <p className="text-sm mt-1 text-muted-foreground">
                      All ads are reviewed by our team before being displayed. The review process 
                      typically takes 24-48 hours. You will be notified when your ad is approved 
                      or if it needs revisions.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
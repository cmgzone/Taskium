import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, ChevronRight, Shuffle, Milestone, Wallet, ShoppingBag, Users } from "lucide-react";
import { Progress } from "@/components/ui/progress"; 

interface OnboardingStep {
  title: string;
  description: string;
  content: React.ReactNode;
  icon: React.ReactNode;
}

export default function SimpleOnboarding({
  onComplete
}: {
  onComplete: () => void;
}) {
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("welcome");
  const [progress, setProgress] = useState(20);

  const disableOnboardingMutation = useMutation({
    mutationFn: async () => {
      console.log("Disabling onboarding preferences...");
      const res = await apiRequest("POST", "/api/user/onboarding-preferences/disable");
      return res.json();
    },
    onSuccess: (data) => {
      console.log("Onboarding disabled successfully, data returned:", data);
      // First query the preferences to make sure they're up to date
      queryClient.invalidateQueries({ queryKey: ["/api/user/onboarding-preferences"] });
      
      toast({
        title: "Onboarding Completed",
        description: "You can always access learning materials from your dashboard.",
      });
      
      // Call the parent's onComplete callback to update the state immediately
      console.log("Calling onComplete callback to return to dashboard");
      onComplete();
    },
    onError: (error: Error) => {
      console.error("Error disabling onboarding:", error);
      toast({
        title: "Error",
        description: `Failed to complete onboarding: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const skipOnboarding = () => {
    disableOnboardingMutation.mutate();
  };

  const finishOnboarding = () => {
    toast({
      title: "Congratulations!",
      description: "You've completed the onboarding process. Welcome to TSK Platform!",
    });
    disableOnboardingMutation.mutate();
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value);
    
    // Update progress based on tab
    switch(value) {
      case "welcome":
        setProgress(20);
        break;
      case "mining":
        setProgress(40);
        break;
      case "marketplace":
        setProgress(60);
        break;
      case "wallet":
        setProgress(80);
        break;
      case "referrals":
        setProgress(100);
        break;
      default:
        setProgress(20);
    }
  };

  const nextTab = () => {
    switch(currentTab) {
      case "welcome":
        setCurrentTab("mining");
        setProgress(40);
        break;
      case "mining":
        setCurrentTab("marketplace");
        setProgress(60);
        break;
      case "marketplace":
        setCurrentTab("wallet");
        setProgress(80);
        break;
      case "wallet":
        setCurrentTab("referrals");
        setProgress(100);
        break;
      case "referrals":
        finishOnboarding();
        break;
    }
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto bg-background min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-500 text-transparent bg-clip-text">
            Welcome to TSK Platform
          </h1>
          <p className="text-muted-foreground">Get started with our personalized onboarding experience</p>
        </div>
        <Button variant="ghost" onClick={skipOnboarding}>
          Skip All
        </Button>
      </div>
      
      <div className="mb-6">
        <div className="flex justify-between text-sm mb-2">
          <span>Getting Started</span>
          <span>{progress}% Complete</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="welcome">Welcome</TabsTrigger>
          <TabsTrigger value="mining">Mining</TabsTrigger>
          <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="referrals">Referrals</TabsTrigger>
        </TabsList>
        
        <TabsContent value="welcome">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to TSK Platform</CardTitle>
              <CardDescription>
                Let's get you familiar with the platform and its key features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <p>
                  TSK Platform is a decentralized application that allows you to mine TSK tokens, 
                  trade in the marketplace, manage your cryptocurrency wallet, and earn bonuses through referrals.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg p-4 flex gap-3">
                    <Milestone className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Daily Mining</h3>
                      <p className="text-sm text-muted-foreground">
                        Mine TSK tokens once every 24 hours with increasing streak bonuses
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex gap-3">
                    <ShoppingBag className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Marketplace</h3>
                      <p className="text-sm text-muted-foreground">
                        Buy and sell items using TSK tokens
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex gap-3">
                    <Wallet className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Wallet Integration</h3>
                      <p className="text-sm text-muted-foreground">
                        Connect your BNB Smart Chain wallet for withdrawals
                      </p>
                    </div>
                  </div>
                  
                  <div className="border rounded-lg p-4 flex gap-3">
                    <Users className="h-5 w-5 text-blue-500" />
                    <div>
                      <h3 className="font-medium">Referral Program</h3>
                      <p className="text-sm text-muted-foreground">
                        Invite friends and earn mining bonuses
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={skipOnboarding}>
                  Skip to Dashboard
                </Button>
                <Button onClick={nextTab} className="flex items-center gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="mining">
          <Card>
            <CardHeader>
              <CardTitle>Mining TSK Tokens</CardTitle>
              <CardDescription>
                Learn how to earn TSK tokens through daily mining
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <p>
                  Mining is the primary way to earn TSK tokens on the platform. You can mine once 
                  every 24 hours and earn bonuses through streaks, premium packages, and referrals.
                </p>
                
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 my-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Mining Streaks
                  </h3>
                  <p className="text-sm">
                    Mine consistently every day to build a streak. Each consecutive day increases your 
                    mining bonus by 10%, up to a maximum of 50% after 5 days.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 my-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Premium Multipliers
                  </h3>
                  <p className="text-sm">
                    Premium packages offer mining multipliers that increase your base mining rate.
                    Multipliers range from 1.5x to 5x depending on your premium tier.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 my-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Lucky Mining Bonuses
                  </h3>
                  <p className="text-sm">
                    Each mining attempt has a 10% chance to trigger a "lucky mining" bonus,
                    which doubles your mining reward for that session.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={skipOnboarding}>
                  Skip to Dashboard
                </Button>
                <Button onClick={nextTab} className="flex items-center gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="marketplace">
          <Card>
            <CardHeader>
              <CardTitle>TSK Marketplace</CardTitle>
              <CardDescription>
                Buy and sell items using TSK tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <p>
                  The TSK marketplace allows users to buy and sell digital and physical items using TSK tokens.
                  All transactions are secure and items are verified by our team.
                </p>
                
                <div className="grid md:grid-cols-2 gap-4 mt-6">
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Creating a Listing</h3>
                    <p className="text-sm text-muted-foreground">
                      To create a listing, navigate to the Marketplace page and click on "Create Listing".
                      Fill in the details, upload images, and set your price in TSK tokens.
                    </p>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <h3 className="font-medium mb-2">Buying Items</h3>
                    <p className="text-sm text-muted-foreground">
                      Browse the marketplace, filter by category, and purchase items with your
                      TSK token balance. Purchases are recorded on the blockchain.
                    </p>
                  </div>
                </div>
                
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 my-4">
                  <h3 className="font-medium mb-2">KYC Requirements</h3>
                  <p className="text-sm">
                    To sell items valued over 100 TSK, you must complete KYC verification.
                    This helps ensure marketplace integrity and prevents fraud.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={skipOnboarding}>
                  Skip to Dashboard
                </Button>
                <Button onClick={nextTab} className="flex items-center gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="wallet">
          <Card>
            <CardHeader>
              <CardTitle>Wallet Management</CardTitle>
              <CardDescription>
                Connect your wallet and manage your TSK tokens
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <p>
                  TSK tokens can be withdrawn to your BNB Smart Chain wallet. You can also connect your
                  wallet to verify your identity and improve your account security.
                </p>
                
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 my-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Connecting Your Wallet
                  </h3>
                  <p className="text-sm">
                    Go to the Wallet page and click "Connect Wallet". You'll need MetaMask or another
                    Web3 wallet that supports BNB Smart Chain (BSC).
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 my-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Withdrawing Tokens
                  </h3>
                  <p className="text-sm">
                    Once KYC verified, you can withdraw your TSK tokens to your connected wallet.
                    Withdrawals require a minimum of 100 TSK and may take up to 24 hours to process.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 mt-6">
                  <h3 className="font-medium mb-2 text-yellow-500">Network Selection</h3>
                  <p className="text-sm">
                    Make sure your wallet is connected to the BNB Smart Chain network.
                    Using the wrong network will result in lost tokens.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={skipOnboarding}>
                  Skip to Dashboard
                </Button>
                <Button onClick={nextTab} className="flex items-center gap-2">
                  Next <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="referrals">
          <Card>
            <CardHeader>
              <CardTitle>Referral Program</CardTitle>
              <CardDescription>
                Invite friends and earn mining bonuses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 mb-6">
                <p>
                  Refer friends to TSK Platform and earn mining bonuses for each active referral.
                  The more friends you refer, the more TSK tokens you can mine.
                </p>
                
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 my-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    How Referrals Work
                  </h3>
                  <p className="text-sm">
                    Each user receives a unique referral code. Share this code with friends,
                    and when they sign up using your code, they become your referral.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950 my-4">
                  <h3 className="font-medium mb-2 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    Referral Bonuses
                  </h3>
                  <p className="text-sm">
                    Each active referral increases your mining rate by 10%.
                    An active referral is defined as someone who has mined at least once in the past 7 days.
                  </p>
                </div>
                
                <div className="border rounded-lg p-4 mt-6">
                  <h3 className="font-medium mb-2">Sharing Your Referral Code</h3>
                  <p className="text-sm text-muted-foreground">
                    Go to the Referrals page to find your unique referral code and link.
                    Share it on social media, messaging apps, or directly with friends.
                  </p>
                </div>
              </div>
              
              <div className="flex justify-between">
                <Button variant="outline" onClick={skipOnboarding}>
                  Skip to Dashboard
                </Button>
                <Button onClick={finishOnboarding} className="flex items-center gap-2">
                  Finish & Go to Dashboard <CheckCircle2 className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
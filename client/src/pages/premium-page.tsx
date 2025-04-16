import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/sidebar";
import MobileMenu from "@/components/layout/mobile-menu";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatTokenAmount } from "@/lib/contract-utils";
import { Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface PremiumPackage {
  id: number;
  name: string;
  description: string;
  price: number;
  miningMultiplier: number;
  active: boolean;
}

export default function PremiumPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  // Fetch premium packages
  const { data: packages = [], isLoading } = useQuery({
    queryKey: ["/api/premium-packages"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/premium-packages");
      return await res.json();
    }
  });

  // Purchase package mutation
  const purchaseMutation = useMutation({
    mutationFn: async (packageId: number) => {
      const res = await apiRequest("POST", "/api/premium-packages/purchase", { packageId });
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Purchase successful!",
        description: "Your premium package has been activated.",
      });
      
      // Update user in cache with new premium tier and multiplier
      if (data.user) {
        queryClient.setQueryData(["/api/user"], data.user);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Purchase failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handlePurchase = (packageId: number, price: number) => {
    // Check if user has enough tokens
    if ((user?.tokenBalance || 0) < price) {
      toast({
        title: "Insufficient balance",
        description: "You don't have enough tokens to purchase this package.",
        variant: "destructive",
      });
      return;
    }
    
    purchaseMutation.mutate(packageId);
  };

  const toggleFaq = (index: number) => {
    if (expandedFaq === index) {
      setExpandedFaq(null);
    } else {
      setExpandedFaq(index);
    }
  };

  const faqItems = [
    {
      question: "How do premium packages work?",
      answer: "Premium packages provide a permanent boost to your mining rate. Once purchased, the boost is automatically applied to your account and stacks with your referral bonuses."
    },
    {
      question: "Can I upgrade my package later?",
      answer: "Yes, you can upgrade to a higher tier at any time. You'll only need to pay the difference between your current package and the new one."
    },
    {
      question: "Are premium packages one-time purchases?",
      answer: "Yes, all premium packages are one-time purchases. Once you buy a package, you'll keep the benefits permanently."
    },
    {
      question: "How do I pay for premium packages?",
      answer: "Premium packages can be purchased using your mined $TSK tokens. The tokens will be deducted from your balance automatically when you upgrade."
    }
  ];

  return (
    <div className="flex flex-col lg:flex-row min-h-screen">
      <Sidebar />
      <MobileMenu />

      <main className="flex-grow">
        {/* Desktop Header */}
        <header className="hidden lg:flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm p-4">
          <h2 className="text-xl font-semibold">Premium</h2>
          
          {/* Token Balance Display */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-full py-1 px-4">
            <span className="mr-2 text-yellow-500">
              <i className="fas fa-coin"></i>
            </span>
            <span className="font-medium">{formatTokenAmount(user?.tokenBalance || 0)}</span>
            <span className="ml-1 text-gray-500 dark:text-gray-400">$TSK</span>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Premium Packages</h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Boost your mining rate with our premium packages</p>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {packages.map((pkg: PremiumPackage, index: number) => {
                const isCurrentPackage = user?.premiumTier === pkg.name;
                const isPopular = index === 1; // Make the middle package (usually Pro) as popular
                
                return (
                  <Card 
                    key={pkg.id}
                    className={`overflow-hidden ${
                      isPopular 
                        ? "transform scale-105 border-primary dark:border-blue-600 border-2 shadow-lg" 
                        : "border-2"
                    } ${
                      isCurrentPackage 
                        ? "border-green-500 dark:border-green-600" 
                        : isPopular 
                          ? "border-primary dark:border-blue-600" 
                          : "border-gray-200 dark:border-gray-700"
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute top-0 right-0 bg-primary text-white px-4 py-1 font-medium text-sm">
                        POPULAR
                      </div>
                    )}
                    {isCurrentPackage && (
                      <div className="absolute top-0 left-0 bg-green-500 text-white px-4 py-1 font-medium text-sm">
                        CURRENT
                      </div>
                    )}
                    
                    <CardContent className="p-6">
                      <div className="text-center">
                        <h3 className="text-xl font-bold mb-1">{pkg.name}</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{pkg.description}</p>
                        
                        <div className="mb-6">
                          <span className="text-4xl font-bold text-primary dark:text-blue-400">{pkg.price}</span>
                          <span className="text-lg text-gray-600 dark:text-gray-400">$TSK</span>
                          <span className="text-gray-500 dark:text-gray-400 text-sm block">one-time payment</span>
                        </div>
                        
                        <ul className="text-left space-y-3 mb-6">
                          <li className="flex items-start">
                            <i className="fas fa-check text-accent mt-1 mr-3"></i>
                            <span>+{Math.round((pkg.miningMultiplier - 1) * 100)}% Mining Rate</span>
                          </li>
                          <li className="flex items-start">
                            <i className="fas fa-check text-accent mt-1 mr-3"></i>
                            <span>{pkg.name} Badge on Profile</span>
                          </li>
                          {pkg.name === "Pro" || pkg.name === "Elite" ? (
                            <li className="flex items-start">
                              <i className="fas fa-check text-accent mt-1 mr-3"></i>
                              <span>Priority Marketplace Listings</span>
                            </li>
                          ) : null}
                          {pkg.name === "Pro" || pkg.name === "Elite" ? (
                            <li className="flex items-start">
                              <i className="fas fa-check text-accent mt-1 mr-3"></i>
                              <span>Advanced Mining Statistics</span>
                            </li>
                          ) : null}
                          {pkg.name === "Elite" ? (
                            <li className="flex items-start">
                              <i className="fas fa-check text-accent mt-1 mr-3"></i>
                              <span>Exclusive Discord Access</span>
                            </li>
                          ) : null}
                        </ul>
                        
                        <Button 
                          className="w-full"
                          variant={isCurrentPackage ? "outline" : "default"}
                          disabled={
                            isCurrentPackage || 
                            purchaseMutation.isPending || 
                            (user?.tokenBalance || 0) < pkg.price
                          }
                          onClick={() => handlePurchase(pkg.id, pkg.price)}
                        >
                          {purchaseMutation.isPending && purchaseMutation.variables === pkg.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : isCurrentPackage ? (
                            <>
                              <Check className="mr-2 h-4 w-4" />
                              Current Package
                            </>
                          ) : (
                            `Upgrade to ${pkg.name}`
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          
          {/* Premium Benefits */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-center mb-6">Premium Benefits</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-tachometer-alt text-2xl text-primary dark:text-blue-400"></i>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Increased Mining Rate</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Mine tokens faster with permanent mining rate boosts that stack with your referral bonuses.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-store text-2xl text-accent dark:text-green-400"></i>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Marketplace Perks</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Get priority listings, reduced fees, and increased visibility for your marketplace items.
                  </p>
                </CardContent>
              </Card>
              
              <Card className="text-center">
                <CardContent className="pt-6">
                  <div className="w-16 h-16 mx-auto bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center mb-4">
                    <i className="fas fa-star text-2xl text-yellow-500 dark:text-yellow-400"></i>
                  </div>
                  <h4 className="text-lg font-semibold mb-2">Exclusive Access</h4>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Join our exclusive community, get early access to new features, and receive special badge recognition.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* FAQ */}
          <div className="mt-12">
            <h3 className="text-xl font-semibold text-center mb-6">Frequently Asked Questions</h3>
            
            <Card>
              {faqItems.map((faq, index) => (
                <div key={index}>
                  {index > 0 && <Separator />}
                  <div className="p-4">
                    <button 
                      className="flex justify-between w-full items-center text-left"
                      onClick={() => toggleFaq(index)}
                    >
                      <span className="font-medium">{faq.question}</span>
                      {expandedFaq === index ? (
                        <ChevronUp className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                      )}
                    </button>
                    <div className={`mt-2 text-gray-600 dark:text-gray-400 text-sm ${expandedFaq === index ? 'block' : 'hidden'}`}>
                      {faq.answer}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

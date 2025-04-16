import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Copy } from "lucide-react";

interface ReferralLinkProps {
  referralCode: string;
}

export default function ReferralLink({ referralCode }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  // Generate full referral link
  const baseUrl = window.location.origin;
  const referralLink = `${baseUrl}/auth?ref=${referralCode}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      
      // Reset copy button after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Could not copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Share your unique referral link with friends. When they sign up and start mining, 
          you'll earn a percentage of their mining rewards and increase your mining rate!
        </p>
        
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg flex items-center">
          <Input 
            type="text" 
            value={referralLink} 
            className="flex-grow bg-transparent border-0 focus:ring-0" 
            readOnly 
          />
          <Button 
            onClick={copyToClipboard} 
            className="ml-2" 
            size="icon" 
            variant={copied ? "success" : "default"}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <div className="mt-6">
          <p className="font-medium mb-3">Share via:</p>
          <div className="flex space-x-3">
            <Button 
              className="p-3 bg-blue-500 hover:bg-blue-600 text-white"
              onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank')}
            >
              <i className="fab fa-facebook-f"></i>
            </Button>
            <Button 
              className="p-3 bg-blue-400 hover:bg-blue-500 text-white"
              onClick={() => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=Join me on TokenMiner and earn free tokens!`, '_blank')}
            >
              <i className="fab fa-twitter"></i>
            </Button>
            <Button 
              className="p-3 bg-green-500 hover:bg-green-600 text-white"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Join me on TokenMiner and earn free tokens! ${referralLink}`)}`, '_blank')}
            >
              <i className="fab fa-whatsapp"></i>
            </Button>
            <Button 
              className="p-3 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on TokenMiner and earn free tokens!')}`, '_blank')}
            >
              <i className="fab fa-telegram-plane"></i>
            </Button>
            <Button 
              className="p-3 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => window.open(`mailto:?subject=Join me on TokenMiner&body=I've been mining tokens on TokenMiner and I think you'd like it too! Sign up using my referral link: ${referralLink}`, '_blank')}
            >
              <i className="fas fa-envelope"></i>
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

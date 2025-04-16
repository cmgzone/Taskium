import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAds, AdClickWrapper, type Ad } from "@/lib/ad-service";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface EnhancedPopupAdProps {
  onClose?: () => void;
  className?: string;
  placement?: string;
  delayBeforeShow?: number;
  showRewardInfo?: boolean;
  animatedEntrance?: boolean;
}

export function EnhancedPopupAd({
  onClose,
  className = "",
  placement = "popup",
  delayBeforeShow = 2000,
  showRewardInfo = true,
  animatedEntrance = true,
}: EnhancedPopupAdProps) {
  const { getRandomAdByPlacement } = useAds();
  const [ad, setAd] = useState<Ad | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [animation, setAnimation] = useState(false);

  // Load popup ad
  useEffect(() => {
    if (dismissed) return;
    
    // Show ad after a delay for better user experience
    const timer = setTimeout(() => {
      const randomAd = getRandomAdByPlacement(placement);
      if (randomAd) {
        setAd(randomAd);
        setShowAd(true);
        
        // Trigger animation after a short delay
        if (animatedEntrance) {
          setTimeout(() => setAnimation(true), 100);
        } else {
          setAnimation(true);
        }
      }
    }, delayBeforeShow);

    return () => clearTimeout(timer);
  }, [getRandomAdByPlacement, dismissed, placement, delayBeforeShow, animatedEntrance]);

  // Handle close
  const handleClose = () => {
    setAnimation(false);
    // Wait for exit animation before hiding
    setTimeout(() => {
      setShowAd(false);
      setDismissed(true);
      if (onClose) {
        onClose();
      }
    }, 300);
  };

  // Don't render anything if no ad or if ad shouldn't be shown
  if (!showAd || !ad || dismissed) {
    return null;
  }

  // Use normalized properties (backend uses snake_case, frontend uses camelCase)
  const imageUrl = ad.imageUrl || ad.image_url;
  const linkUrl = ad.linkUrl || ad.link_url;
  const htmlContent = ad.htmlContent || ad.html_content;
  const buttonText = ad.buttonText || ad.button_text || "Learn More";
  const customBackground = ad.customBackground || ad.custom_background;
  const customTextColor = ad.customTextColor || ad.custom_text_color;
  const customButtonColor = ad.customButtonColor || ad.custom_button_color;

  return (
    <Dialog open={showAd} onOpenChange={() => handleClose()}>
      <DialogContent
        className={cn(
          "p-0 rounded-lg overflow-hidden max-w-md w-[95vw] shadow-xl border-0",
          "transition-all duration-300 ease-in-out",
          !animation && "opacity-0 scale-95",
          animation && "opacity-100 scale-100",
          className
        )}
        style={{
          backgroundColor: customBackground || undefined
        }}
        onInteractOutside={(e) => e.preventDefault()}
      >
        {/* Close button */}
        <Button
          variant="outline"
          size="icon"
          className="absolute top-2 right-2 z-10 bg-black/20 text-white rounded-full h-7 w-7 hover:bg-black/40 hover:text-white"
          onClick={handleClose}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Ad Content */}
        <div className="flex flex-col">
          {/* Image */}
          {imageUrl && (
            <AdClickWrapper ad={ad} className="w-full cursor-pointer">
              <div className="relative overflow-hidden">
                <img
                  src={imageUrl}
                  alt={ad.title}
                  className="w-full h-auto object-cover transition-transform hover:scale-105 duration-500"
                />
                
                {/* Promoted badge */}
                <Badge
                  variant="secondary"
                  className="absolute top-2 left-2 bg-black/40 text-white text-xs"
                >
                  Sponsored
                </Badge>
              </div>
            </AdClickWrapper>
          )}

          {/* Content */}
          <div 
            className="p-5"
            style={{ color: customTextColor || undefined }}
          >
            <h3 className="font-bold text-xl mb-2">{ad.title}</h3>
            
            {ad.description && (
              <p className="mt-2 text-sm opacity-90 leading-relaxed">
                {ad.description}
              </p>
            )}

            {htmlContent && (
              <div
                className="ad-html-content mt-3"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}

            {/* Bottom section with reward info and action button */}
            <div className="mt-4 flex items-center justify-between">
              {showRewardInfo && (
                <div className="text-xs opacity-75">
                  <p>View this ad to earn TSK rewards</p>
                </div>
              )}
              
              {linkUrl && (
                <AdClickWrapper ad={ad}>
                  <Button
                    className="gap-1.5"
                    style={{
                      backgroundColor: customButtonColor || undefined
                    }}
                  >
                    {buttonText} <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </AdClickWrapper>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
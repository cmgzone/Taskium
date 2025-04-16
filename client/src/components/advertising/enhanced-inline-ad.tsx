import React, { useState, useEffect } from "react";
import { useAds, AdClickWrapper, type Ad } from "@/lib/ad-service";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, ExternalLink, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface EnhancedInlineAdProps {
  placement: string;
  className?: string;
  variant?: "standard" | "compact" | "banner" | "sidebar" | "notification";
  showCloseButton?: boolean;
  showSponsoredBadge?: boolean;
  showDismissHistory?: boolean;
}

export function EnhancedInlineAd({
  placement,
  className = "",
  variant = "standard",
  showCloseButton = true,
  showSponsoredBadge = true,
  showDismissHistory = true,
}: EnhancedInlineAdProps) {
  const { getRandomAdByPlacement } = useAds();
  const [ad, setAd] = useState<Ad | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [adImpressionSent, setAdImpressionSent] = useState(false);
  
  // Track dismissed ad IDs in localStorage if enabled
  const dismissedAdsKey = "tsk_dismissed_ads";
  
  useEffect(() => {
    const loadAd = () => {
      // Get dismissed ads from localStorage if tracking is enabled
      let dismissedAds: number[] = [];
      if (showDismissHistory) {
        try {
          const stored = localStorage.getItem(dismissedAdsKey);
          if (stored) dismissedAds = JSON.parse(stored);
        } catch (e) {
          console.error("Error parsing dismissed ads:", e);
        }
      }
      
      // Get a random ad for this placement
      const randomAd = getRandomAdByPlacement(placement);
      
      // Only set the ad if it's not in the dismissed list
      if (randomAd && (!showDismissHistory || !dismissedAds.includes(randomAd.id))) {
        setAd(randomAd);
        setIsVisible(true);
      }
    };
    
    loadAd();
  }, [placement, getRandomAdByPlacement, showDismissHistory]);
  
  // When ad dismissal is tracked
  const handleDismiss = () => {
    setIsVisible(false);
    
    if (ad && showDismissHistory) {
      try {
        const stored = localStorage.getItem(dismissedAdsKey);
        const dismissedAds: number[] = stored ? JSON.parse(stored) : [];
        
        // Add this ad ID to the dismissed list
        if (!dismissedAds.includes(ad.id)) {
          dismissedAds.push(ad.id);
          // Keep only the last 20 dismissed ads to avoid excessive storage
          const recentDismissed = dismissedAds.slice(-20); 
          localStorage.setItem(dismissedAdsKey, JSON.stringify(recentDismissed));
        }
      } catch (e) {
        console.error("Error updating dismissed ads:", e);
      }
    }
  };
  
  if (!ad || !isVisible) return null;
  
  // Use normalized properties (backend uses snake_case, frontend uses camelCase)
  const imageUrl = ad.imageUrl || ad.image_url;
  const linkUrl = ad.linkUrl || ad.link_url;
  const htmlContent = ad.htmlContent || ad.html_content;
  const buttonText = ad.buttonText || ad.button_text || "Learn More";
  const customBackground = ad.customBackground || ad.custom_background;
  const customTextColor = ad.customTextColor || ad.custom_text_color;
  const customButtonColor = ad.customButtonColor || ad.custom_button_color;
  
  // Visual layouts based on variant
  const getVariantClasses = () => {
    switch (variant) {
      case "compact":
        return "flex items-center max-h-24 overflow-hidden";
      case "banner":
        return "w-full overflow-hidden";
      case "sidebar":
        return "max-w-[260px] overflow-hidden";
      case "notification":
        return "max-w-md rounded-xl shadow-lg";
      default:
        return "overflow-hidden";
    }
  };
  
  return (
    <Card 
      className={cn(
        "relative transition-all duration-300", 
        getVariantClasses(),
        className
      )}
      style={{
        backgroundColor: customBackground || undefined,
        color: customTextColor || undefined
      }}
    >
      {showCloseButton && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1 right-1 z-10 bg-background/80 rounded-full h-6 w-6 opacity-70 hover:opacity-100"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
      
      {showSponsoredBadge && (
        <Badge
          variant="secondary"
          className="absolute top-2 left-2 bg-black/40 text-white text-xs z-10"
        >
          Sponsored
        </Badge>
      )}
      
      <AdClickWrapper ad={ad} className="w-full h-full cursor-pointer">
        <CardContent className={cn(
          "p-0 flex",
          variant === "compact" ? "flex-row" : "flex-col"
        )}>
          {/* Image */}
          {imageUrl && (
            <div className={cn(
              "overflow-hidden",
              variant === "compact" ? "w-1/3" : "w-full"
            )}>
              <img
                src={imageUrl}
                alt={ad.title}
                className={cn(
                  "object-cover transition-transform hover:scale-105 duration-500",
                  variant === "compact" ? "h-full w-full" : "w-full h-auto"
                )}
              />
            </div>
          )}
          
          {/* Content */}
          <div className={cn(
            "flex flex-col justify-between",
            variant === "compact" ? "p-2 w-2/3" : "p-3"
          )}>
            <div>
              <h3 className={cn(
                "font-medium line-clamp-2",
                variant === "compact" ? "text-sm" : "text-base"
              )}>
                {ad.title}
              </h3>
              
              {ad.description && variant !== "compact" && (
                <p className="mt-1.5 text-sm opacity-80 line-clamp-2">
                  {ad.description}
                </p>
              )}
              
              {htmlContent && variant !== "compact" && (
                <div
                  className="ad-html-content mt-2 text-sm"
                  dangerouslySetInnerHTML={{ __html: htmlContent }}
                />
              )}
            </div>
            
            {linkUrl && (
              <div className={cn("mt-2", variant === "compact" && "mt-1.5")}>
                {variant === "compact" ? (
                  <div className="flex items-center text-xs text-blue-500 font-medium">
                    More <ArrowRight className="h-3 w-3 ml-1" />
                  </div>
                ) : (
                  <Button
                    size="sm"
                    className="mt-1 gap-1"
                    style={{
                      backgroundColor: customButtonColor || undefined
                    }}
                  >
                    {buttonText} <ExternalLink className="h-3 w-3" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </AdClickWrapper>
    </Card>
  );
}
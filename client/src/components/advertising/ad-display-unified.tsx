import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAds, AdClickWrapper, type Ad } from "@/lib/ad-service";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface AdDisplayProps {
  placement: string;
  className?: string;
  showCloseButton?: boolean;
  variant?: "standard" | "compact" | "banner" | "notification";
  audience?: string;
  animated?: boolean;
}

export function AdDisplay({
  placement,
  className,
  showCloseButton = false,
  variant = "standard",
  audience = "all",
  animated = false,
}: AdDisplayProps) {
  const { getRandomAdByPlacement, loading } = useAds();
  const [currentAd, setCurrentAd] = useState<Ad | null>(null);
  const [visible, setVisible] = useState<boolean>(true);
  const [rotation, setRotation] = useState<boolean>(false);
  
  // Handle ad rotation
  useEffect(() => {
    const loadAd = () => {
      const ad = getRandomAdByPlacement(placement);
      setCurrentAd(ad);
      
      // Set rotation timer based on ad's display_duration or default to 30 seconds
      if (ad) {
        const displayDuration = ad.display_duration || 30;
        const timer = setTimeout(() => {
          setRotation(prev => !prev);
        }, displayDuration * 1000);
        
        return () => clearTimeout(timer);
      }
    };
    
    loadAd();
  }, [getRandomAdByPlacement, placement, rotation]);

  // Handle close button
  const handleClose = () => {
    setVisible(false);
    // Only hide for the current session
    // We could store this in localStorage if we wanted to persist the preference
  };

  if (!visible || (!currentAd && !loading)) return null;

  return (
    <div className={cn("ad-container relative", className)}>
      {loading ? (
        <AdSkeleton variant={variant} />
      ) : currentAd ? (
        <AdContent
          ad={currentAd}
          variant={variant}
          showCloseButton={showCloseButton}
          onClose={handleClose}
          animated={animated}
        />
      ) : null}
      
      {/* Ad indicator for accessibility and transparency */}
      <div className="absolute top-1 left-1 text-[10px] opacity-50 z-10 px-1 bg-background/80 rounded">
        Ad
      </div>
    </div>
  );
}

// Ad content with different variants
function AdContent({
  ad,
  variant,
  showCloseButton,
  onClose,
  animated,
}: {
  ad: Ad;
  variant: string;
  showCloseButton: boolean;
  onClose: () => void;
  animated: boolean;
}) {
  // Apply custom styling from the ad if provided
  const customStyle = {
    backgroundColor: ad.custom_background || undefined,
    color: ad.custom_text_color || undefined,
  };
  
  const buttonStyle = {
    backgroundColor: ad.custom_button_color || undefined,
  };

  // Determine the appropriate layout based on variant
  switch (variant) {
    case "compact":
      return (
        <AdClickWrapper ad={ad} className="block w-full h-full">
          <Card className={cn(
            "overflow-hidden h-full",
            animated && "animate-fade-in",
            ad.custom_background && "border-0"
          )} style={customStyle}>
            {showCloseButton && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  onClose();
                }}
                className="absolute top-1 right-1 z-20 rounded-full p-1 bg-background/80 hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            )}
            <CardContent className="p-3 space-y-2">
              <h3 className="font-medium text-sm truncate">{ad.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-2">{ad.description}</p>
            </CardContent>
          </Card>
        </AdClickWrapper>
      );
      
    case "banner":
      return (
        <AdClickWrapper ad={ad} className="block w-full">
          <div 
            className={cn(
              "relative w-full overflow-hidden rounded-lg", 
              animated && "animate-fade-in",
              ad.custom_background ? "bg-opacity-100" : "bg-primary/5 dark:bg-primary/10"
            )}
            style={customStyle}
          >
            {showCloseButton && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  onClose();
                }}
                className="absolute top-2 right-2 z-20 rounded-full p-1 bg-background/80 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <div className="flex flex-col md:flex-row items-center p-4 gap-4">
              {ad.image_url && (
                <div className="shrink-0 h-24 w-24 md:h-32 md:w-32 rounded-md overflow-hidden">
                  <img 
                    src={ad.image_url} 
                    alt={ad.title} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              <div className="flex-1 space-y-2 text-center md:text-left">
                <h3 className="font-bold text-lg">{ad.title}</h3>
                <p className="text-sm line-clamp-2">{ad.description}</p>
                
                {ad.button_text && (
                  <Button 
                    className="mt-2"
                    style={buttonStyle}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {ad.button_text}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </AdClickWrapper>
      );
      
    case "notification":
      return (
        <AdClickWrapper ad={ad} className="block w-full">
          <div 
            className={cn(
              "relative rounded-lg shadow-lg border p-4", 
              animated && "animate-slide-in-right",
              ad.custom_background && "border-0"
            )}
            style={customStyle}
          >
            {showCloseButton && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  onClose();
                }}
                className="absolute top-2 right-2 z-20 rounded-full p-1 bg-background/80 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            <div className="space-y-2">
              <h3 className="font-bold">{ad.title}</h3>
              <p className="text-sm">{ad.description}</p>
              
              {ad.button_text && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2 w-full"
                  style={buttonStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  {ad.button_text}
                </Button>
              )}
            </div>
          </div>
        </AdClickWrapper>
      );
      
    default: // standard
      return (
        <AdClickWrapper ad={ad} className="block w-full h-full">
          <Card className={cn(
            "overflow-hidden h-full",
            animated && "animate-fade-in",
            ad.custom_background && "border-0"
          )} style={customStyle}>
            {showCloseButton && (
              <button 
                onClick={(e) => {
                  e.stopPropagation(); 
                  onClose();
                }}
                className="absolute top-2 right-2 z-20 rounded-full p-1 bg-background/80 hover:bg-background"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            
            {ad.image_url && (
              <div className="h-32 overflow-hidden">
                <img 
                  src={ad.image_url} 
                  alt={ad.title} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            
            <CardContent className="p-4 space-y-2">
              <h3 className="font-bold">{ad.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-3">{ad.description}</p>
              
              {ad.button_text && (
                <Button 
                  className="mt-2 w-full"
                  style={buttonStyle}
                  onClick={(e) => e.stopPropagation()}
                >
                  {ad.button_text}
                </Button>
              )}
            </CardContent>
          </Card>
        </AdClickWrapper>
      );
  }
}

// Loading state skeleton
function AdSkeleton({ variant }: { variant: string }) {
  switch (variant) {
    case "compact":
      return (
        <Card className="overflow-hidden h-full">
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </CardContent>
        </Card>
      );
      
    case "banner":
      return (
        <div className="relative w-full overflow-hidden rounded-lg bg-card">
          <div className="flex flex-col md:flex-row items-center p-4 gap-4">
            <Skeleton className="h-24 w-24 md:h-32 md:w-32 rounded-md" />
            <div className="flex-1 space-y-2 w-full">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-9 w-28 mt-2" />
            </div>
          </div>
        </div>
      );
      
    case "notification":
      return (
        <div className="relative rounded-lg shadow-lg border p-4">
          <div className="space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-8 w-full mt-2" />
          </div>
        </div>
      );
      
    default: // standard
      return (
        <Card className="overflow-hidden h-full">
          <Skeleton className="h-32 w-full" />
          <CardContent className="p-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-9 w-full mt-2" />
          </CardContent>
        </Card>
      );
  }
}

// Add some basic animations
export const adAnimations = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideInRight {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
  }
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  .animate-slide-in-right {
    animation: slideInRight 0.5s ease-out;
  }
`;
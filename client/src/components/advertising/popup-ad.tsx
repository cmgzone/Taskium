import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAds, AdClickWrapper, type Ad } from "@/lib/ad-service";

interface PopupAdProps {
  onClose?: () => void;
  className?: string;
}

export function PopupAd({ onClose, className = "" }: PopupAdProps) {
  const { getRandomAdByPlacement, recordImpression } = useAds();
  const [ad, setAd] = useState<Ad | null>(null);
  const [showAd, setShowAd] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Load popup ad
  useEffect(() => {
    if (dismissed) return;
    
    // Show ad after a short delay for better user experience
    const timer = setTimeout(() => {
      const randomAd = getRandomAdByPlacement("popup");
      if (randomAd) {
        setAd(randomAd);
        setShowAd(true);
        // Record impression is already handled by getRandomAdByPlacement
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [getRandomAdByPlacement, dismissed]);

  // Handle close
  const handleClose = () => {
    setShowAd(false);
    setDismissed(true);
    if (onClose) {
      onClose();
    }
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
    <div className={`fixed inset-0 flex items-center justify-center z-50 bg-black/60 backdrop-blur-sm ${className}`}>
      <Card 
        className="w-full max-w-md relative overflow-hidden shadow-lg"
        style={{
          backgroundColor: customBackground || undefined
        }}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2 z-10 bg-black/20 rounded-full hover:bg-black/40"
          onClick={handleClose}
        >
          <X className="h-4 w-4 text-white" />
        </Button>
        
        <CardContent className="p-0">
          {imageUrl && (
            <AdClickWrapper ad={ad} className="w-full cursor-pointer">
              <img 
                src={imageUrl}
                alt={ad.title}
                className="w-full h-auto object-cover"
              />
            </AdClickWrapper>
          )}
          
          <div className="p-4" style={{ color: customTextColor || undefined }}>
            <h3 className="font-bold text-lg">{ad.title}</h3>
            {ad.description && <p className="mt-2">{ad.description}</p>}
            
            {htmlContent && (
              <div 
                className="ad-html-content mt-3"
                dangerouslySetInnerHTML={{ __html: htmlContent }}
              />
            )}
            
            {linkUrl && (
              <AdClickWrapper ad={ad}>
                <Button 
                  className="mt-4 w-full"
                  style={{
                    backgroundColor: customButtonColor || undefined
                  }}
                >
                  {buttonText}
                </Button>
              </AdClickWrapper>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
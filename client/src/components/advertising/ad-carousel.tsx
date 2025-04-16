import React, { useState, useEffect, useRef } from "react";
import { useAds, AdClickWrapper, type Ad } from "@/lib/ad-service";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface AdCarouselProps {
  placement: string;
  className?: string;
  maxAds?: number;
  autoPlay?: boolean;
  interval?: number;
  showArrows?: boolean;
  showDots?: boolean;
  height?: string;
}

export function AdCarousel({
  placement,
  className = "",
  maxAds = 5,
  autoPlay = true,
  interval = 5000,
  showArrows = true,
  showDots = true,
  height = "320px"
}: AdCarouselProps) {
  const { filterAdsByPlacement } = useAds();
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Load ads for this placement
  useEffect(() => {
    const placementAds = filterAdsByPlacement(placement);
    // Limit number of ads
    setAds(placementAds.slice(0, maxAds));
  }, [placement, filterAdsByPlacement, maxAds]);
  
  // Setup autoplay
  useEffect(() => {
    if (autoPlay && ads.length > 1 && !isHovering) {
      autoPlayTimerRef.current = setInterval(() => {
        setCurrentIndex(prevIndex => (prevIndex + 1) % ads.length);
      }, interval);
    }
    
    return () => {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
      }
    };
  }, [autoPlay, ads.length, interval, isHovering]);
  
  // Navigation handlers
  const handlePrev = () => {
    setCurrentIndex(prevIndex => (prevIndex - 1 + ads.length) % ads.length);
  };
  
  const handleNext = () => {
    setCurrentIndex(prevIndex => (prevIndex + 1) % ads.length);
  };
  
  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };
  
  // Pause autoplay on hover
  const handleMouseEnter = () => {
    setIsHovering(true);
  };
  
  const handleMouseLeave = () => {
    setIsHovering(false);
  };
  
  // Don't render if no ads
  if (ads.length === 0) return null;
  
  return (
    <div 
      className={cn(
        "relative overflow-hidden rounded-lg", 
        className
      )}
      style={{ height }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Ads */}
      <div 
        className="w-full h-full flex transition-transform duration-500 ease-in-out"
        style={{ 
          transform: `translateX(-${currentIndex * 100}%)`,
          width: `${ads.length * 100}%`
        }}
      >
        {ads.map((ad, index) => {
          const imageUrl = ad.imageUrl || ad.image_url;
          const linkUrl = ad.linkUrl || ad.link_url;
          
          return (
            <div 
              key={ad.id}
              className="relative flex-shrink-0"
              style={{ width: `${100 / ads.length}%` }}
            >
              <AdClickWrapper ad={ad} className="w-full h-full">
                <div className="relative w-full h-full">
                  {/* Image */}
                  {imageUrl && (
                    <img 
                      src={imageUrl}
                      alt={ad.title}
                      className="w-full h-full object-cover"
                    />
                  )}
                  
                  {/* Content overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent p-4 flex flex-col justify-end text-white">
                    <Badge
                      variant="secondary"
                      className="absolute top-3 left-3 bg-black/60 text-white text-xs mb-2 self-start"
                    >
                      Sponsored
                    </Badge>
                    
                    <h3 className="text-xl font-bold mb-1">{ad.title}</h3>
                    {ad.description && (
                      <p className="text-sm opacity-90 line-clamp-2 mb-2">
                        {ad.description}
                      </p>
                    )}
                    
                    {linkUrl && (
                      <Button
                        variant="secondary" 
                        size="sm"
                        className="mt-2 self-start bg-white/10 backdrop-blur-sm hover:bg-white/20"
                      >
                        Learn More
                      </Button>
                    )}
                  </div>
                </div>
              </AdClickWrapper>
            </div>
          );
        })}
      </div>
      
      {/* Navigation arrows */}
      {showArrows && ads.length > 1 && (
        <>
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full hover:bg-black/50"
            onClick={handlePrev}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 text-white rounded-full hover:bg-black/50"
            onClick={handleNext}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </>
      )}
      
      {/* Dots */}
      {showDots && ads.length > 1 && (
        <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5">
          {ads.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                index === currentIndex ? "bg-white w-4" : "bg-white/60"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
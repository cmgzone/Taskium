import { useEffect, useState } from 'react';
import { apiRequest } from '@/lib/queryClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Updated to match the database schema (snake_case to camelCase conversion)
interface Ad {
  id: number;
  title: string;
  description?: string;
  image_url?: string;
  link_url?: string;
  html_content?: string;
  active: boolean;
  display_duration: number;
  created_at: string;
  priority: number;
  placement: string[] | string; // Handle both array and JSON string format
  impressions?: number;
  clicks?: number;
}

interface AdDisplayProps {
  placement: string;
  className?: string;
  animation?: 'fadeIn' | 'slideInRight' | 'slideInLeft' | 'slideInBottom' | 'pulse' | 'glow' | 'none';
}

export default function AdDisplay({ 
  placement, 
  className = '',
  animation = 'fadeIn'
}: AdDisplayProps) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const { toast } = useToast();

  // Track impression
  const trackImpression = async (adId: number) => {
    try {
      await apiRequest('POST', `/api/ads/${adId}/impression`);
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  };

  // Track click
  const trackClick = async (adId: number) => {
    try {
      await apiRequest('POST', `/api/ads/${adId}/click`);
    } catch (error) {
      console.error('Error tracking ad click:', error);
    }
  };

  useEffect(() => {
    // Fetch ads
    const fetchAds = async () => {
      try {
        const res = await apiRequest('GET', '/api/ads');
        const ads: Ad[] = await res.json();
        
        // Parse placement if it's a JSON string
        const filteredAds = ads.filter(ad => {
          // Ensure ad is active
          if (!ad.active) return false;
          
          // Check if ad has content to display
          if (!ad.html_content && !ad.image_url && !ad.description) return false;
          
          // Parse placement if it's a string
          let adPlacements: string[] = [];
          if (typeof ad.placement === 'string') {
            try {
              adPlacements = JSON.parse(ad.placement);
            } catch (e) {
              adPlacements = [ad.placement];
            }
          } else if (Array.isArray(ad.placement)) {
            adPlacements = ad.placement;
          }
          
          // Check if ad should be displayed in this placement
          return adPlacements.includes(placement) || adPlacements.includes('global');
        });
        
        if (filteredAds.length > 0) {
          // Use a weighted random selection based on priority
          const totalPriority = filteredAds.reduce((sum, ad) => sum + (ad.priority || 1), 0);
          let random = Math.random() * totalPriority;
          
          let selectedAd: Ad | null = null;
          for (const ad of filteredAds) {
            random -= (ad.priority || 1);
            if (random <= 0) {
              selectedAd = ad;
              break;
            }
          }
          
          // If we didn't select an ad (unlikely but possible due to floating point precision),
          // just take the first one
          const finalAd = selectedAd || filteredAds[0];
          setAd(finalAd);
          
          // Track impression
          if (finalAd) {
            trackImpression(finalAd.id);
          }
        }
      } catch (error) {
        console.error('Error fetching ads:', error);
      }
    };

    fetchAds();
    
    // Reset visibility when placement changes
    setIsVisible(true);
    
    // Every 60 seconds, refresh the ad
    const refreshInterval = setInterval(() => {
      fetchAds();
    }, 60000);
    
    return () => {
      clearInterval(refreshInterval);
    };
  }, [placement]);

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleClick = () => {
    if (ad?.link_url) {
      // Track click
      trackClick(ad.id);
      
      // Open link in new tab
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!ad || !isVisible) {
    return null;
  }
  
  // Define animation class
  const animationClass = animation !== 'none' ? `animate-${animation}` : '';

  return (
    <Card className={`relative overflow-hidden ${className} ${animationClass}`}>
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-1 right-1 z-10 bg-background/80 rounded-full h-6 w-6"
        onClick={handleClose}
      >
        <X className="h-4 w-4" />
      </Button>
      
      <CardContent className="p-3 cursor-pointer" onClick={handleClick}>
        {ad.image_url && (
          <div className="w-full relative">
            <img 
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-auto rounded object-cover"
            />
            {ad.link_url && (
              <ExternalLink className="absolute bottom-2 right-2 h-4 w-4 text-white drop-shadow-md" />
            )}
          </div>
        )}
        
        {ad.html_content && (
          <div 
            className="ad-html-content mt-2"
            dangerouslySetInnerHTML={{ __html: ad.html_content }}
          />
        )}
        
        {(!ad.image_url && !ad.html_content) && (
          <div className="py-3 text-center text-primary">
            <h3 className="font-bold">{ad.title}</h3>
            {ad.description && <p className="text-sm mt-1">{ad.description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
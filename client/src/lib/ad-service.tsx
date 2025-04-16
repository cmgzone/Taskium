import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, createContext, useContext } from "react";

// Define the Ad interface
export interface Ad {
  id: number;
  title: string;
  description: string;
  image_url?: string | null;
  link_url?: string | null;
  display_duration?: number;
  priority?: number;
  html_content?: string | null;
  button_text?: string | null;
  custom_background?: string | null;
  custom_text_color?: string | null;
  custom_button_color?: string | null;
  placement?: string[] | string;
  target_audience?: string[] | string;
  start_date?: string | Date | null;
  end_date?: string | Date | null;
  active?: boolean;
  created_at: string;
  
  // Compatibility fields
  userId?: number;
  // Removed location field as it's been replaced by placement
  tokenCost?: number;
  impressions?: number;
  clicks?: number;
  status?: string;
  paymentStatus?: string;
  
  // Aliased properties for UI compatibility
  imageUrl?: string | null;
  linkUrl?: string | null;
  displayDuration?: number;
  htmlContent?: string | null;
  buttonText?: string | null;
  customBackground?: string | null;
  customTextColor?: string | null;
  customButtonColor?: string | null;
  createdAt?: string;
}

interface AdContextType {
  ads: Ad[];
  loading: boolean;
  error: Error | null;
  refreshAds: () => void;
  recordImpression: (adId: number) => void;
  recordClick: (adId: number) => void;
  filterAdsByPlacement: (placement: string) => Ad[];
  filterAdsByTargetAudience: (audience: string) => Ad[];
  getRandomAdByPlacement: (placement: string) => Ad | null;
}

// Create context with a default value
const AdContext = createContext<AdContextType>({
  ads: [],
  loading: false,
  error: null,
  refreshAds: () => {},
  recordImpression: () => {},
  recordClick: () => {},
  filterAdsByPlacement: () => [],
  filterAdsByTargetAudience: () => [],
  getRandomAdByPlacement: () => null,
});

// Helper function to normalize placement and target_audience fields
const normalizeArrayOrString = (value: string[] | string | undefined): string[] => {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      // Try to parse it as JSON
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch (e) {
      // Not valid JSON, treat as single string
      return [value];
    }
  }
  return value;
};

// Provider component
export function AdProvider({ children }: { children: React.ReactNode }) {
  const [impressions, setImpressions] = useState<Record<number, number>>({});
  const [clicks, setClicks] = useState<Record<number, number>>({});

  // Fetch ads
  const { 
    data: ads = [], 
    isLoading: loading, 
    error, 
    refetch: refreshAds 
  } = useQuery<Ad[]>({
    queryKey: ['/api/ads/active'],
    queryFn: async () => {
      const response = await fetch('/api/ads/active');
      if (!response.ok) throw new Error('Failed to fetch ads');
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Process and normalize ads (handling both string and array formats)
  const processedAds = ads.map(ad => ({
    ...ad,
    placement: normalizeArrayOrString(ad.placement),
    target_audience: normalizeArrayOrString(ad.target_audience),
    // Add local impression and click tracking
    impressions: (ad.impressions || 0) + (impressions[ad.id] || 0),
    clicks: (ad.clicks || 0) + (clicks[ad.id] || 0),
  }));

  // Record impression
  const recordImpression = (adId: number) => {
    setImpressions(prev => ({
      ...prev,
      [adId]: (prev[adId] || 0) + 1
    }));
    
    // Optionally send to server
    fetch(`/api/ads/${adId}/impression`, { method: 'POST' })
      .catch(err => console.error('Failed to record impression:', err));
  };

  // Record click
  const recordClick = (adId: number) => {
    setClicks(prev => ({
      ...prev,
      [adId]: (prev[adId] || 0) + 1
    }));
    
    // Optionally send to server
    fetch(`/api/ads/${adId}/click`, { method: 'POST' })
      .catch(err => console.error('Failed to record click:', err));
  };

  // Filter ads by placement
  const filterAdsByPlacement = (placement: string): Ad[] => {
    return processedAds.filter(ad => {
      const placements = normalizeArrayOrString(ad.placement);
      return placements.includes(placement) || placements.includes('all');
    });
  };

  // Filter ads by target audience
  const filterAdsByTargetAudience = (audience: string): Ad[] => {
    return processedAds.filter(ad => {
      const audiences = normalizeArrayOrString(ad.target_audience);
      return audiences.includes(audience) || audiences.includes('all');
    });
  };

  // Get random ad by placement with weighted priority
  const getRandomAdByPlacement = (placement: string): Ad | null => {
    const validAds = filterAdsByPlacement(placement);
    if (!validAds.length) return null;

    // Check if there's a start_date and end_date and filter based on current date
    const now = new Date();
    const dateFilteredAds = validAds.filter(ad => {
      // If ad has a start date and it's in the future, filter it out
      if (ad.start_date && new Date(ad.start_date) > now) return false;
      
      // If ad has an end date and it's in the past, filter it out
      if (ad.end_date && new Date(ad.end_date) < now) return false;
      
      return true;
    });

    if (!dateFilteredAds.length) return null;

    // Weight by priority (default to 1 if not set)
    const totalWeight = dateFilteredAds.reduce((sum, ad) => sum + (ad.priority || 1), 0);
    let random = Math.random() * totalWeight;
    
    for (const ad of dateFilteredAds) {
      random -= (ad.priority || 1);
      if (random <= 0) {
        // Record an impression
        recordImpression(ad.id);
        return ad;
      }
    }

    // Default fallback (shouldn't reach here)
    return dateFilteredAds[0];
  };

  // Sync impressions and clicks with server periodically
  useEffect(() => {
    if (Object.keys(impressions).length === 0 && Object.keys(clicks).length === 0) return;

    const syncStats = async () => {
      try {
        await fetch('/api/ads/sync-stats', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            impressions,
            clicks
          })
        });
        
        // Clear the local counts after successful sync
        setImpressions({});
        setClicks({});
      } catch (error) {
        console.error('Failed to sync ad stats:', error);
      }
    };

    // Sync every 5 minutes
    const intervalId = setInterval(syncStats, 5 * 60 * 1000);
    
    // Also sync when unmounting
    return () => {
      clearInterval(intervalId);
      syncStats();
    };
  }, [impressions, clicks]);

  return (
    <AdContext.Provider
      value={{
        ads: processedAds,
        loading,
        error,
        refreshAds,
        recordImpression,
        recordClick,
        filterAdsByPlacement,
        filterAdsByTargetAudience,
        getRandomAdByPlacement,
      }}
    >
      {children}
    </AdContext.Provider>
  );
}

// Custom hook for using the ad context
export function useAds() {
  const context = useContext(AdContext);
  if (context === undefined) {
    throw new Error('useAds must be used within an AdProvider');
  }
  return context;
}

// Reusable Ad Click Wrapper Component
export function AdClickWrapper({ 
  ad, 
  children, 
  className 
}: { 
  ad: Ad; 
  children: React.ReactNode; 
  className?: string;
}) {
  const { recordClick } = useAds();
  
  const handleClick = () => {
    recordClick(ad.id);
    
    // If there's a link URL, open it in a new tab
    if (ad.link_url) {
      window.open(ad.link_url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className={className || "cursor-pointer"} 
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleClick()}
    >
      {children}
    </div>
  );
}
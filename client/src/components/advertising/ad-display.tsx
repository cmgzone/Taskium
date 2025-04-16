import { useQuery } from "@tanstack/react-query";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import { ExternalLink } from "lucide-react";

export type AdType = "banner" | "sidebar" | "notification";

interface Ad {
  id: number;
  userId: number;
  title: string;
  description: string;
  imageUrl: string | null;
  linkUrl: string | null;
  targetAudience: string[];
  placement: string[];
  startDate: string;
  endDate: string;
  status: string;
  impressions: number;
  clicks: number;
  priceTSK: number;
  createdAt: string;
}

interface AdDisplayProps {
  type: AdType;
  showPlaceholder?: boolean;
  targetAudience?: string;
}

export function AdDisplay({ type, showPlaceholder = false, targetAudience = "all" }: AdDisplayProps) {
  const { toast } = useToast();
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  const { data: ads, isLoading, error } = useQuery<Ad[]>({
    queryKey: ["/api/ads/active", type, targetAudience],
    queryFn: async () => {
      const response = await fetch(`/api/ads/active?placement=${type}&audience=${targetAudience}`);
      if (!response.ok) {
        throw new Error("Failed to fetch ads");
      }
      return response.json();
    },
    // Fetch active ads every 5 minutes
    refetchInterval: 5 * 60 * 1000,
  });

  const randomAd = ads && ads.length > 0 
    ? ads[Math.floor(Math.random() * ads.length)] 
    : null;

  useEffect(() => {
    // Track impression only once per ad view
    if (randomAd && !hasTrackedImpression) {
      fetch(`/api/ads/${randomAd.id}/impression`, { method: 'POST' })
        .catch(err => console.error("Failed to track impression:", err));
      setHasTrackedImpression(true);
    }
  }, [randomAd, hasTrackedImpression]);

  const handleAdClick = () => {
    if (randomAd) {
      // Track click
      fetch(`/api/ads/${randomAd.id}/click`, { method: 'POST' })
        .catch(err => console.error("Failed to track click:", err));
      
      // Open link in new tab
      if (randomAd.linkUrl) {
        window.open(randomAd.linkUrl, "_blank", "noopener,noreferrer");
      }
    }
  };

  if (isLoading) {
    return renderSkeleton(type);
  }

  if (error || (!randomAd && !showPlaceholder)) {
    return null; // Don't show anything if there's an error or no ads
  }

  // Show placeholder if requested and no real ad is available
  if (!randomAd && showPlaceholder) {
    return renderPlaceholder(type);
  }

  if (!randomAd) {
    return null;
  }

  // Render different ad formats based on type
  switch (type) {
    case "banner":
      return (
        <Card className="w-full overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={handleAdClick}>
          {randomAd.imageUrl && (
            <div className="relative h-32 md:h-48 overflow-hidden">
              <img 
                src={randomAd.imageUrl} 
                alt={randomAd.title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-0 right-0 bg-black/70 text-xs text-white px-2 py-1 rounded-bl">
                Ad
              </div>
            </div>
          )}
          <CardContent className={`p-3 ${!randomAd.imageUrl ? 'border-l-4 border-primary' : ''}`}>
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{randomAd.title}</h3>
                <p className="text-sm text-muted-foreground">{randomAd.description}</p>
              </div>
              {randomAd.linkUrl && (
                <ExternalLink className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      );

    case "sidebar":
      return (
        <Card className="w-full cursor-pointer hover:shadow-md transition-shadow" onClick={handleAdClick}>
          <CardContent className="p-3 border-l-2 border-primary">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Sponsored</p>
                <h4 className="font-medium text-sm">{randomAd.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{randomAd.description}</p>
              </div>
              {randomAd.linkUrl && (
                <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground" />
              )}
            </div>
          </CardContent>
        </Card>
      );

    case "notification":
      return (
        <Alert 
          className="cursor-pointer border-l-4 border-primary hover:bg-accent/50 transition-colors"
          onClick={handleAdClick}
        >
          <div className="flex justify-between items-start">
            <div>
              <AlertTitle className="text-sm font-medium">{randomAd.title}</AlertTitle>
              <AlertDescription className="text-xs text-muted-foreground mt-1">
                {randomAd.description}
              </AlertDescription>
            </div>
            {randomAd.linkUrl && (
              <ExternalLink className="h-3 w-3 flex-shrink-0 text-muted-foreground mt-1" />
            )}
          </div>
        </Alert>
      );
  }
}

function renderSkeleton(type: AdType) {
  switch (type) {
    case "banner":
      return (
        <Card className="w-full overflow-hidden">
          <Skeleton className="h-32 md:h-48 w-full" />
          <CardContent className="p-3">
            <Skeleton className="h-5 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardContent>
        </Card>
      );

    case "sidebar":
      return (
        <Card className="w-full">
          <CardContent className="p-3 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      );

    case "notification":
      return (
        <Alert>
          <Skeleton className="h-4 w-1/2 mb-2" />
          <Skeleton className="h-3 w-full" />
        </Alert>
      );
  }
}

function renderPlaceholder(type: AdType) {
  switch (type) {
    case "banner":
      return (
        <Card className="w-full overflow-hidden border-dashed border-2">
          <CardContent className="p-4 flex items-center justify-center text-center h-40">
            <div>
              <p className="text-muted-foreground text-sm">Your advertisement could appear here</p>
              <p className="text-xs text-muted-foreground mt-2">Banner ad - Premium visibility</p>
            </div>
          </CardContent>
        </Card>
      );

    case "sidebar":
      return (
        <Card className="w-full border-dashed border-2">
          <CardContent className="p-3 flex items-center justify-center text-center">
            <div>
              <p className="text-muted-foreground text-xs">Available ad space</p>
              <p className="text-xs text-muted-foreground mt-1">Sidebar format</p>
            </div>
          </CardContent>
        </Card>
      );

    case "notification":
      return (
        <Alert className="border-dashed border-2">
          <AlertTitle className="text-sm text-muted-foreground">Available ad space</AlertTitle>
          <AlertDescription className="text-xs text-muted-foreground">
            Notification style advertisement
          </AlertDescription>
        </Alert>
      );
  }
}
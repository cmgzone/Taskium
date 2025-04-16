import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarClock, Clock, ExternalLink } from "lucide-react";
import { differenceInSeconds, format } from "date-fns";

interface CountdownEvent {
  id: number;
  title: string;
  description: string | null;
  startDate: string;
  endDate: string;
  imageUrl: string | null;
  linkUrl: string | null;
  active: boolean;
  priority: number;
  featured: boolean;
  displayOnDashboard: boolean;
}

interface CountdownProps {
  className?: string;
}

export default function EventCountdown({ className }: CountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);
  
  const [currentEvent, setCurrentEvent] = useState<CountdownEvent | null>(null);

  // Fetch dashboard events
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['/api/events/dashboard'],
    queryFn: async () => {
      const res = await fetch('/api/events/dashboard');
      if (!res.ok) {
        throw new Error('Failed to fetch events');
      }
      return res.json() as Promise<CountdownEvent[]>;
    }
  });

  // Select the highest priority event when events data changes
  useEffect(() => {
    if (events.length > 0) {
      // Sort by priority (descending) and select the first one
      const sortedEvents = [...events].sort((a, b) => b.priority - a.priority);
      setCurrentEvent(sortedEvents[0]);
    } else {
      setCurrentEvent(null);
    }
  }, [events]);

  // Update countdown timer
  useEffect(() => {
    if (!currentEvent) {
      setTimeRemaining(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const endDate = new Date(currentEvent.endDate);
      
      if (now >= endDate) {
        setTimeRemaining(null);
        return;
      }
      
      const totalSeconds = differenceInSeconds(endDate, now);
      
      const days = Math.floor(totalSeconds / (60 * 60 * 24));
      const hours = Math.floor((totalSeconds % (60 * 60 * 24)) / (60 * 60));
      const minutes = Math.floor((totalSeconds % (60 * 60)) / 60);
      const seconds = Math.floor(totalSeconds % 60);
      
      setTimeRemaining({ days, hours, minutes, seconds });
    };

    // Update immediately
    updateCountdown();
    
    // Then update every second
    const interval = setInterval(updateCountdown, 1000);
    
    return () => clearInterval(interval);
  }, [currentEvent]);

  if (isLoading) {
    return (
      <Card className={`overflow-hidden ${className}`}>
        <CardHeader className="pb-2">
          <Skeleton className="h-4 w-1/3 mb-2" />
          <Skeleton className="h-6 w-2/3" />
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Skeleton className="h-24 w-2/3 rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!currentEvent || !timeRemaining) {
    return null; // No active events to display
  }

  return (
    <Card className={`overflow-hidden ${className}`}>
      {currentEvent.imageUrl && (
        <div className="w-full h-40 overflow-hidden">
          <img 
            src={currentEvent.imageUrl} 
            alt={currentEvent.title} 
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      
      <CardHeader className={`${currentEvent.imageUrl ? 'pt-4' : 'pt-5'} pb-2`}>
        <div className="flex items-center gap-2 mb-1">
          <Badge variant="outline" className="text-blue-500 border-blue-500">
            <CalendarClock className="h-3 w-3 mr-1" />
            Event
          </Badge>
          {currentEvent.featured && (
            <Badge className="bg-amber-500">Featured</Badge>
          )}
        </div>
        <CardTitle className="text-xl">{currentEvent.title}</CardTitle>
        {currentEvent.description && (
          <CardDescription className="line-clamp-2 mt-1">
            {currentEvent.description}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="grid grid-cols-4 gap-2 my-4">
          <CountdownUnit value={timeRemaining.days} label="Days" />
          <CountdownUnit value={timeRemaining.hours} label="Hours" />
          <CountdownUnit value={timeRemaining.minutes} label="Minutes" />
          <CountdownUnit value={timeRemaining.seconds} label="Seconds" />
        </div>
        
        <div className="text-xs text-muted-foreground mt-2">
          <div className="flex items-center">
            <Clock className="h-3 w-3 mr-1" />
            <span>Ends on {format(new Date(currentEvent.endDate), "MMM d, yyyy 'at' h:mm a")}</span>
          </div>
        </div>
      </CardContent>
      
      {currentEvent.linkUrl && (
        <CardFooter className="pt-0">
          <Button 
            variant="outline" 
            className="w-full flex items-center justify-center gap-2"
            onClick={() => window.open(currentEvent.linkUrl!, '_blank')}
          >
            <span>Learn More</span>
            <ExternalLink className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

interface CountdownUnitProps {
  value: number;
  label: string;
}

function CountdownUnit({ value, label }: CountdownUnitProps) {
  return (
    <div className="flex flex-col items-center bg-primary/10 rounded-lg py-2">
      <div className="text-xl font-bold text-primary">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
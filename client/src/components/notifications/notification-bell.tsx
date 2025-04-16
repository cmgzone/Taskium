import { useState, useEffect, useRef } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import NotificationList from './notification-list';

interface NotificationBellProps {
  userId: number;
}

const NotificationBell = ({ userId }: NotificationBellProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  
  // Fetch unread count
  const { 
    data: unreadCount = 0,
    isLoading,
    refetch
  } = useQuery<number>({
    queryKey: ['/api/notifications/unread-count'],
    enabled: !!userId,
    refetchInterval: 60000, // Refetch every minute
  });
  
  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const handleNotificationsRead = () => {
    refetch();
  };
  
  return (
    <div ref={popoverRef}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
            className="relative"
            onClick={() => setIsOpen(!isOpen)}
          >
            <Bell className="h-5 w-5" />
            {!isLoading && unreadCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent 
          className="w-80 p-0 mr-4"
          align="end"
        >
          <NotificationList 
            userId={userId} 
            isPopover={true}
            onNotificationsRead={handleNotificationsRead}
          />
          <div className="p-2 border-t">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-center"
              asChild
              onClick={() => setIsOpen(false)}
            >
              <Link href="/notifications">
                View all notifications
              </Link>
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default NotificationBell;
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import NotificationItem from './notification-item';
import { format } from 'date-fns';
import { CheckCheck, BellOff } from 'lucide-react';

interface NotificationListProps {
  userId: number;
  isPopover?: boolean;
  onNotificationsRead?: () => void;
}

interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  read: boolean;
  priority: number;
  createdAt: string;
  expiresAt: string | null;
  actionUrl: string | null;
  imageUrl: string | null;
  metadata: Record<string, any> | null;
}

const NotificationList = ({ 
  userId, 
  isPopover = false,
  onNotificationsRead
}: NotificationListProps) => {
  const [includeRead, setIncludeRead] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery<Notification[]>({
    queryKey: ['/api/notifications', { includeRead }],
    enabled: !!userId,
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => {
      return apiRequest('PUT', '/api/notifications/mark-all-read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      
      if (onNotificationsRead) {
        onNotificationsRead();
      }
      
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to mark notifications as read',
        variant: 'destructive',
      });
    },
  });

  // Mark a single notification as read
  const markAsReadMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('PUT', `/api/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      
      if (onNotificationsRead) {
        onNotificationsRead();
      }
    },
  });

  // Delete a notification
  const deleteNotificationMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest('DELETE', `/api/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/unread-count'] });
      
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    },
  });

  // Handle error
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Group notifications by date
  const groupedNotifications = notifications.reduce((acc, notification) => {
    const date = new Date(notification.createdAt);
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    
    acc[dateStr].push(notification);
    return acc;
  }, {} as Record<string, Notification[]>);

  const hasUnreadNotifications = notifications.some(n => !n.read);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="font-semibold">Notifications</h2>
        <div className="flex items-center space-x-2">
          {hasUnreadNotifications && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              aria-label="Mark all as read"
            >
              <CheckCheck className="h-4 w-4 mr-1" />
              <span className="text-xs">Mark all read</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIncludeRead(!includeRead)}
            aria-label={includeRead ? "Show unread only" : "Show all notifications"}
          >
            {includeRead ? "Unread only" : "Show all"}
          </Button>
        </div>
      </div>

      <ScrollArea className={isPopover ? "h-[350px]" : "h-[500px]"}>
        {isLoading ? (
          <div className="p-4 space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex flex-col space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
            <BellOff className="h-10 w-10 mb-2 opacity-50" />
            <p>No notifications</p>
            <p className="text-sm">
              {includeRead 
                ? "You don't have any notifications yet" 
                : "You don't have any unread notifications"}
            </p>
          </div>
        ) : (
          <div className="p-2">
            {Object.entries(groupedNotifications).map(([dateStr, notifs]) => (
              <div key={dateStr} className="mb-4">
                <div className="sticky top-0 bg-background px-2 py-1 mb-2 text-xs font-medium text-muted-foreground">
                  {format(new Date(dateStr), 'EEEE, MMMM d, yyyy')}
                </div>
                <div className="space-y-2">
                  {notifs.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={() => markAsReadMutation.mutate(notification.id)}
                      onDelete={() => deleteNotificationMutation.mutate(notification.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default NotificationList;
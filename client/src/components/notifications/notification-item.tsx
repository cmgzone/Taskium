import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Trash2, ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  AlertCircle, 
  Bell, 
  Gift, 
  Award, 
  MessageSquare, 
  CreditCard, 
  Wallet, 
  Shield, 
  Users 
} from 'lucide-react';

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

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onDelete: () => void;
}

const NotificationItem = ({ 
  notification, 
  onMarkAsRead, 
  onDelete 
}: NotificationItemProps) => {
  const [expanded, setExpanded] = useState(false);
  
  // Handle click on the notification
  const handleClick = () => {
    setExpanded(!expanded);
    
    // Mark as read if it's unread
    if (!notification.read) {
      onMarkAsRead();
    }
    
    // Handle action URL if available
    if (notification.actionUrl && expanded) {
      window.open(notification.actionUrl, '_blank');
    }
  };
  
  // Choose icon based on notification type
  const getIcon = () => {
    switch (notification.type) {
      case 'system':
        return <Bell className="h-5 w-5 text-blue-500" />;
      case 'alert':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'reward':
        return <Gift className="h-5 w-5 text-purple-500" />;
      case 'achievement':
        return <Award className="h-5 w-5 text-yellow-500" />;
      case 'message':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'payment':
        return <CreditCard className="h-5 w-5 text-emerald-500" />;
      case 'transaction':
        return <Wallet className="h-5 w-5 text-indigo-500" />;
      case 'security':
        return <Shield className="h-5 w-5 text-rose-500" />;
      case 'social':
        return <Users className="h-5 w-5 text-cyan-500" />;
      default:
        return <Bell className="h-5 w-5 text-blue-500" />;
    }
  };
  
  return (
    <div 
      className={cn(
        "p-3 rounded-md border hover:bg-accent/50 cursor-pointer transition-colors",
        notification.read ? "bg-background" : "bg-accent/20",
        notification.priority >= 2 && "border-yellow-500/50",
        notification.priority >= 3 && "border-red-500/50"
      )}
    >
      <div className="flex items-start space-x-3">
        <div className="mt-0.5">
          {getIcon()}
        </div>
        <div className="flex-1" onClick={handleClick}>
          <div className="flex justify-between items-start">
            <h3 className={cn(
              "font-medium text-sm",
              !notification.read && "font-semibold"
            )}>
              {notification.title}
            </h3>
            <div className="flex items-center ml-2">
              {expanded ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground mb-1">
            {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
          </p>
          
          {expanded ? (
            <div className="mt-2">
              <p className="text-sm whitespace-pre-line">{notification.message}</p>
              
              {notification.actionUrl && (
                <div className="mt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs h-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(notification.actionUrl!, '_blank');
                    }}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View details
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm truncate">{notification.message}</p>
          )}
        </div>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label="Delete notification"
        >
          <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
        </Button>
      </div>
    </div>
  );
};

export default NotificationItem;
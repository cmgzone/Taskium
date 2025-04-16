import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import { useEffect } from 'react';
import { PageHeader } from '@/components/page-header';
import NotificationList from '@/components/notifications/notification-list';

const NotificationsPage = () => {
  const { user, isLoading } = useAuth();
  const [_, setLocation] = useLocation();
  
  // Redirect if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      setLocation('/login');
    }
  }, [user, isLoading, setLocation]);
  
  if (isLoading) {
    return <div className="container py-10">Loading...</div>;
  }
  
  if (!user) return null;
  
  return (
    <div className="container py-6">
      <PageHeader
        title="Notifications"
        description="Stay up-to-date with important updates and activity on your account."
      />
      
      <div className="mt-6 rounded-lg border shadow-sm overflow-hidden">
        <NotificationList userId={user.id} />
      </div>
    </div>
  );
};

export default NotificationsPage;
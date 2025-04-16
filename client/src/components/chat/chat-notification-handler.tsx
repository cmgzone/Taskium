import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';
import { apiRequest } from '@/lib/queryClient';
import { showChatMessageNotification } from '@/lib/androidNotifications';

interface ChatMessage {
  id: number;
  senderId: number;
  recipientId: number;
  groupId: number | null;
  content: string;
  timestamp: string;
  status: string;
  senderName: string;
  isRead: boolean;
}

/**
 * Component that listens for new chat messages and shows notifications
 * This should be mounted somewhere in the app that's always present
 */
export default function ChatNotificationHandler() {
  const { user } = useAuth();
  const lastMessageIdRef = useRef<number | null>(null);
  
  // Poll for new unread messages
  const { data: unreadMessages } = useQuery({
    queryKey: ['/api/chat/unread'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/chat/unread');
      return await res.json() as ChatMessage[];
    },
    // Only run this query if user is logged in
    enabled: !!user,
    // Poll every 15 seconds when tab is active
    refetchInterval: 15 * 1000,
    // Don't refetch on window focus to avoid double notifications
    refetchOnWindowFocus: false
  });

  // Show notification for new messages
  useEffect(() => {
    try {
      if (!unreadMessages || unreadMessages.length === 0) return;
      
      // Sort messages by timestamp (newest first)
      const sortedMessages = [...unreadMessages].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      const latestMessage = sortedMessages[0];
      
      // If we've already shown a notification for this message, don't show it again
      if (lastMessageIdRef.current === latestMessage.id) return;
      
      // Update ref with latest message ID
      lastMessageIdRef.current = latestMessage.id;
      
      // Create a deep link to the chat with this sender
      const deepLink = latestMessage.groupId 
        ? `/chat?group=${latestMessage.groupId}` 
        : `/chat?user=${latestMessage.senderId}`;
      
      // Show notification
      showChatMessageNotification(
        latestMessage.senderName,
        latestMessage.content,
        deepLink
      );
    } catch (error) {
      console.error('Error processing chat messages for notification:', error);
    }
  }, [unreadMessages]);

  // This is a background component with no UI
  return null;
}
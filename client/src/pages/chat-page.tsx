import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useChatWebSocket } from '@/hooks/use-chat-ws';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Send, User, Users, UserPlus, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useQuery, useMutation } from '@tanstack/react-query';

interface ChatGroup {
  id: number;
  name: string;
  description: string | null;
  isPublic: boolean;
  createdBy: number;
  lastMessageAt: string;
  memberCount?: number;
  createdAt: string;
  updatedAt: string;
}

interface ChatMessage {
  id: number;
  groupId: number;
  userId: number;
  content: string;
  timestamp: string;
  edited: boolean;
  editedAt: string | null;
  replyTo: number | null;
  attachments: any | null;
  isDeleted: boolean;
  sender: {
    id: number;
    username: string;
  };
}

interface GroupMember {
  groupId: number;
  userId: number;
  role: string;
  joinedAt: string;
  lastSeen: string | null;
  user: {
    id: number;
    username: string;
  };
}

export default function ChatPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { connected, joinGroup, leaveGroup, sendMessage, sendTypingStatus, events, clientId } = useChatWebSocket();
  const [activeGroupId, setActiveGroupId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);
  const [newGroupData, setNewGroupData] = useState({
    name: '',
    description: '',
    isPublic: true
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [typingUsers, setTypingUsers] = useState<{[groupId: number]: {[userId: number]: number}}>({});
  
  // Fetch user's chat groups
  const { data: userGroups, isLoading: isLoadingGroups } = useQuery({
    queryKey: ['/api/chat/groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/chat/groups');
      return res.json();
    },
    enabled: !!user
  });
  
  // Fetch public groups
  const { data: publicGroups, isLoading: isLoadingPublicGroups } = useQuery({
    queryKey: ['/api/chat/public-groups'],
    queryFn: async () => {
      const res = await apiRequest('GET', '/api/chat/public-groups');
      return res.json();
    }
  });
  
  // Fetch active group details (including members)
  const { data: activeGroupDetails, isLoading: isLoadingGroupDetails } = useQuery({
    queryKey: ['/api/chat/groups', activeGroupId],
    queryFn: async () => {
      if (!activeGroupId) return null;
      const res = await apiRequest('GET', `/api/chat/groups/${activeGroupId}`);
      return res.json();
    },
    enabled: !!activeGroupId
  });
  
  // Fetch messages for active group
  const { data: groupMessages, isLoading: isLoadingMessages } = useQuery({
    queryKey: ['/api/chat/groups', activeGroupId, 'messages'],
    queryFn: async () => {
      if (!activeGroupId) return [];
      const res = await apiRequest('GET', `/api/chat/groups/${activeGroupId}/messages`);
      return res.json();
    },
    enabled: !!activeGroupId
  });
  
  // Create a new chat group
  const createGroupMutation = useMutation({
    mutationFn: async (groupData: typeof newGroupData) => {
      const res = await apiRequest('POST', '/api/chat/groups', groupData);
      return res.json();
    },
    onSuccess: () => {
      // Invalidate groups query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/public-groups'] });
      
      // Reset form and close dialog
      setNewGroupData({
        name: '',
        description: '',
        isPublic: true
      });
      setIsCreateGroupOpen(false);
      
      toast({
        title: 'Group Created',
        description: 'Your chat group has been created successfully.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Create Group',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Join a group
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest('POST', `/api/chat/groups/${groupId}/members`, {
        userId: user!.id,
        role: 'member'
      });
      return res.json();
    },
    onSuccess: (_, groupId) => {
      // Invalidate group details to refresh members
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', groupId] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      
      toast({
        title: 'Joined Group',
        description: 'You have successfully joined the group.',
      });
      
      // Connect to the group via WebSocket
      joinGroup(groupId);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Join Group',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Leave a group
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: number) => {
      const res = await apiRequest('DELETE', `/api/chat/groups/${groupId}/members/${user!.id}`);
      if (res.ok) {
        return { success: true };
      } else {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to leave group');
      }
    },
    onSuccess: (_, groupId) => {
      // Invalidate group queries
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      
      toast({
        title: 'Left Group',
        description: 'You have successfully left the group.',
      });
      
      // Disconnect from the group via WebSocket
      leaveGroup(groupId);
      
      // If this was the active group, clear it
      if (activeGroupId === groupId) {
        setActiveGroupId(null);
      }
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Leave Group',
        description: error.message,
        variant: 'destructive',
      });
    }
  });
  
  // Effect to handle WebSocket events
  useEffect(() => {
    // Process new events
    events.forEach(event => {
      if (event.type === 'new_message' && event.message && event.groupId === activeGroupId) {
        // New message for active group - invalidate messages query
        queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', activeGroupId, 'messages'] });
        // Also invalidate group list to update last message timestamp
        queryClient.invalidateQueries({ queryKey: ['/api/chat/groups'] });
      } else if (event.type === 'user_joined' && event.groupId === activeGroupId) {
        // User joined active group - refresh members
        queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', activeGroupId] });
      } else if (event.type === 'user_left' && event.groupId === activeGroupId) {
        // User left active group - refresh members
        queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', activeGroupId] });
      } else if (event.type === 'error') {
        // Show error toast
        toast({
          title: 'Chat Error',
          description: event.message?.toString() || 'Unknown error',
          variant: 'destructive',
        });
      } else if ((event.type === 'typing' || event.type === 'stopped_typing') && 
                event.groupId === activeGroupId && 
                event.user && 
                event.user.id !== user?.id) {
        // Handle typing indicators
        setTypingUsers(prev => {
          const groupTyping = prev[event.groupId!] || {};
          
          if (event.type === 'typing') {
            // Set or refresh typing timeout
            const timeoutId = window.setTimeout(() => {
              setTypingUsers(prev => {
                const updated = { ...prev };
                if (updated[event.groupId!]) {
                  delete updated[event.groupId!][event.user!.id];
                  if (Object.keys(updated[event.groupId!]).length === 0) {
                    delete updated[event.groupId!];
                  }
                }
                return updated;
              });
            }, 3000); // Typing indicator disappears after 3 seconds
            
            // Clear previous timeout if it exists
            if (groupTyping[event.user!.id]) {
              clearTimeout(groupTyping[event.user!.id]);
            }
            
            return {
              ...prev,
              [event.groupId!]: {
                ...groupTyping,
                [event.user!.id]: timeoutId
              }
            };
          } else {
            // Remove typing indicator
            if (groupTyping[event.user!.id]) {
              clearTimeout(groupTyping[event.user!.id]);
              const updated = { ...prev };
              delete updated[event.groupId!][event.user!.id];
              if (Object.keys(updated[event.groupId!]).length === 0) {
                delete updated[event.groupId!];
              }
              return updated;
            }
            return prev;
          }
        });
      }
    });
    
    // Invalidate messages query when a new message event is received
    const hasNewMessage = events.some(e => e.type === 'new_message' && e.groupId === activeGroupId);
    if (hasNewMessage && activeGroupId) {
      queryClient.invalidateQueries({ queryKey: ['/api/chat/groups', activeGroupId, 'messages'] });
    }
  }, [events, activeGroupId, toast, user?.id]);
  
  // Effect to join active group via WebSocket when it changes
  useEffect(() => {
    if (connected && activeGroupId && user) {
      // Join the active group
      joinGroup(activeGroupId);
      
      // Leave the group when component unmounts or active group changes
      return () => {
        leaveGroup(activeGroupId);
      };
    }
  }, [connected, activeGroupId, user, joinGroup, leaveGroup]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [groupMessages]);
  
  // Handle sending a message
  const handleSendMessage = () => {
    if (!messageInput.trim() || !activeGroupId || !user) return;
    
    // Send via WebSocket
    sendMessage(activeGroupId, messageInput);
    
    // Clear input
    setMessageInput('');
  };
  
  // Handle typing indicator
  const handleTyping = () => {
    if (!activeGroupId || !user) return;
    sendTypingStatus(activeGroupId, true);
  };
  
  // Create a new group
  const handleCreateGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupData.name.trim()) {
      toast({
        title: 'Group Name Required',
        description: 'Please enter a name for your chat group.',
        variant: 'destructive',
      });
      return;
    }
    
    createGroupMutation.mutate(newGroupData);
  };
  
  // Render list of groups (My Groups or Public Groups)
  const renderGroupList = (groups: ChatGroup[] = [], type: 'my' | 'public') => {
    if (!groups.length) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-2" />
          <p className="text-muted-foreground">
            {type === 'my' 
              ? 'You have not joined any groups yet.' 
              : 'No public groups available.'}
          </p>
          {type === 'my' && (
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setIsCreateGroupOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Create a Group
            </Button>
          )}
        </div>
      );
    }
    
    return (
      <div className="space-y-2">
        {groups.map(group => (
          <Card 
            key={group.id} 
            className={`cursor-pointer hover:bg-accent ${activeGroupId === group.id ? 'border-primary' : ''}`}
            onClick={() => setActiveGroupId(group.id)}
          >
            <CardHeader className="p-4 pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-base">{group.name}</CardTitle>
                {group.isPublic && <Badge variant="outline">Public</Badge>}
              </div>
              <CardDescription className="text-xs line-clamp-2">
                {group.description || 'No description'}
              </CardDescription>
            </CardHeader>
            <CardFooter className="p-4 pt-0 flex justify-between items-center text-xs text-muted-foreground">
              <span>{new Date(group.lastMessageAt).toLocaleDateString()}</span>
              {type === 'public' && !userGroups?.some((g: ChatGroup) => g.id === group.id) && (
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    joinGroupMutation.mutate(group.id);
                  }}
                >
                  Join
                </Button>
              )}
              {type === 'my' && (
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    leaveGroupMutation.mutate(group.id);
                  }}
                >
                  Leave
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  // Format timestamp for messages
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Get user initials for avatar
  const getUserInitials = (username: string) => {
    return username.slice(0, 2).toUpperCase();
  };
  
  // Get active group typing users
  const getTypingUsers = () => {
    if (!activeGroupId || !typingUsers[activeGroupId]) return [];
    
    const typingUserIds = Object.keys(typingUsers[activeGroupId]).map(Number);
    if (!typingUserIds.length) return [];
    
    // Find usernames from active group members
    const typingUsernames = activeGroupDetails?.members
      .filter((member: GroupMember) => typingUserIds.includes(member.userId))
      .map((member: GroupMember) => member.user.username);
    
    return typingUsernames || [];
  };
  
  // Show typing indicator
  const renderTypingIndicator = () => {
    const typingUsernames = getTypingUsers();
    if (!typingUsernames.length) return null;
    
    return (
      <div className="text-xs text-muted-foreground italic p-2">
        {typingUsernames.length === 1 
          ? `${typingUsernames[0]} is typing...`
          : `${typingUsernames.join(', ')} are typing...`}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Chat</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Sidebar with Group Lists */}
        <div className="md:col-span-1">
          <Tabs defaultValue="my-groups">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="my-groups" className="flex-1">My Groups</TabsTrigger>
              <TabsTrigger value="public-groups" className="flex-1">Discover</TabsTrigger>
            </TabsList>
            
            <TabsContent value="my-groups" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">My Groups</h2>
                <Button 
                  size="sm" 
                  onClick={() => setIsCreateGroupOpen(true)}
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Create
                </Button>
              </div>
              
              {isLoadingGroups ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-270px)]">
                  {renderGroupList(userGroups, 'my')}
                </ScrollArea>
              )}
            </TabsContent>
            
            <TabsContent value="public-groups" className="mt-0">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Public Groups</h2>
              </div>
              
              {isLoadingPublicGroups ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <ScrollArea className="h-[calc(100vh-270px)]">
                  {renderGroupList(publicGroups, 'public')}
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        {/* Chat Area */}
        <div className="md:col-span-2">
          {activeGroupId ? (
            <Card className="h-[calc(100vh-200px)] flex flex-col">
              {/* Chat Header */}
              <CardHeader className="pb-2">
                {isLoadingGroupDetails ? (
                  <div className="flex items-center space-x-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Loading group details...</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center">
                      <CardTitle>{activeGroupDetails?.group?.name}</CardTitle>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Users className="h-4 w-4 mr-2" />
                            {activeGroupDetails?.members?.length || 0} Members
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Group Members</DialogTitle>
                            <DialogDescription>
                              People in the {activeGroupDetails?.group?.name} group
                            </DialogDescription>
                          </DialogHeader>
                          <div className="max-h-[60vh] overflow-y-auto">
                            {activeGroupDetails?.members?.map((member: GroupMember) => (
                              <div key={member.userId} className="flex items-center justify-between py-2">
                                <div className="flex items-center gap-2">
                                  <Avatar>
                                    <AvatarFallback>{getUserInitials(member.user.username)}</AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{member.user.username}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Joined {new Date(member.joinedAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <Badge variant={member.role === 'admin' ? 'default' : 'outline'}>
                                  {member.role}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <CardDescription>
                      {activeGroupDetails?.group?.description || 'No description'}
                    </CardDescription>
                  </>
                )}
              </CardHeader>
              
              <Separator />
              
              {/* Messages */}
              <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
                {isLoadingMessages ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : groupMessages?.length ? (
                  <>
                    {groupMessages.map((message: ChatMessage) => (
                      <div 
                        key={message.id} 
                        className={`flex gap-2 ${message.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        {message.userId !== user?.id && (
                          <Avatar>
                            <AvatarFallback>
                              {getUserInitials(message.sender.username)}
                            </AvatarFallback>
                          </Avatar>
                        )}
                        <div 
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.userId === user?.id 
                              ? 'bg-primary text-primary-foreground' 
                              : 'bg-muted'
                          }`}
                        >
                          {message.userId !== user?.id && (
                            <p className="text-xs font-medium mb-1">
                              {message.sender.username}
                            </p>
                          )}
                          <p className="break-words">{message.content}</p>
                          <p className="text-xs mt-1 opacity-70 text-right">
                            {formatTimestamp(message.timestamp)}
                            {message.edited && ' (edited)'}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <Send className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Be the first to send a message!</p>
                  </div>
                )}
              </CardContent>
              
              {/* Typing indicator */}
              {renderTypingIndicator()}
              
              {/* Message Input */}
              <CardFooter className="p-4 pt-2">
                <div className="flex w-full gap-2">
                  <Input 
                    placeholder="Type a message..." 
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    onInput={handleTyping}
                  />
                  <Button onClick={handleSendMessage} disabled={!messageInput.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ) : (
            <Card className="h-[calc(100vh-200px)] flex flex-col justify-center items-center p-6 text-center">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold mb-2">Select a Chat Group</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Select a group from the sidebar to start chatting or join a public group to connect with others.
              </p>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateGroupOpen(true)}
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Create a New Group
              </Button>
            </Card>
          )}
        </div>
      </div>
      
      {/* Create Group Dialog */}
      <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create a New Chat Group</DialogTitle>
            <DialogDescription>
              Create a group to chat with other users. Public groups are visible to everyone.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateGroup}>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="name">Group Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter group name" 
                  value={newGroupData.name}
                  onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea 
                  id="description" 
                  placeholder="Enter group description (optional)" 
                  value={newGroupData.description}
                  onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="public" 
                  checked={newGroupData.isPublic}
                  onCheckedChange={(checked) => setNewGroupData({...newGroupData, isPublic: checked})}
                />
                <Label htmlFor="public">Make this group public</Label>
              </div>
            </div>
            
            <DialogFooter className="mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateGroupOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createGroupMutation.isPending || !newGroupData.name.trim()}
              >
                {createGroupMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Group
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
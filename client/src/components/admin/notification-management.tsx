import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Bell, Calendar, Clock, Search, SendHorizonal, Settings, Smartphone, Trash, Users } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Define types based on database schema
type Notification = {
  id: number;
  userId: number | null;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  expiresAt: string | null;
  priority: number;
  actionUrl: string | null;
  imageUrl: string | null;
  metadata: any | null;
};

type DeviceToken = {
  id: number;
  userId: number;
  token: string;
  platform: string;
  deviceId: string | null;
  createdAt: string;
  lastUsedAt: string;
  isActive: boolean;
};

type User = {
  id: number;
  username: string;
};

// Form schema
const sendNotificationSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  message: z.string().min(5, "Message must be at least 5 characters"),
  type: z.string(),
  priority: z.coerce.number().int().min(1).max(10),
  actionUrl: z.string().optional(),
  targetUsers: z.array(z.number()).optional(),
  targetAll: z.boolean().default(false),
  targetPlatforms: z.array(z.string()),
  expiresAt: z.string().optional(),
});

type SendNotificationFormValues = z.infer<typeof sendNotificationSchema>;

export default function NotificationManagement() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("send");
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Get notifications list
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/admin/notifications', page, searchQuery],
    retry: false,
  });

  // Get device tokens
  const { data: deviceTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['/api/admin/device-tokens'],
    retry: false,
  });

  // Get users for targeting
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['/api/admin/users/simple'],
    retry: false,
  });

  // Notification stats 
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/notifications/stats'],
    retry: false,
  });

  // Delete notification mutation
  const deleteNotification = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest(`/api/admin/notifications/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      toast({
        title: "Notification deleted",
        description: "The notification has been successfully deleted.",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete notification: " + error,
        variant: "destructive",
      });
    }
  });

  // Send notification mutation
  const sendNotification = useMutation({
    mutationFn: async (data: SendNotificationFormValues) => {
      return apiRequest('/api/admin/notifications/send', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/notifications/stats'] });
      toast({
        title: "Notification sent",
        description: "The notification has been successfully sent to users.",
      });
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to send notification: " + error,
        variant: "destructive",
      });
    }
  });

  // Form setup
  const form = useForm<SendNotificationFormValues>({
    resolver: zodResolver(sendNotificationSchema),
    defaultValues: {
      title: "",
      message: "",
      type: "system",
      priority: 1,
      actionUrl: "",
      targetAll: true,
      targetUsers: [],
      targetPlatforms: ["web", "android", "ios"],
      expiresAt: ""
    }
  });

  // Handle notification deletion
  const handleDeleteConfirm = () => {
    if (deletingId) {
      deleteNotification.mutate(deletingId);
    }
  };

  const handleDeleteClick = (id: number) => {
    setDeletingId(id);
    setIsDeleteDialogOpen(true);
  };

  // Handle form submission
  const onSubmit = (data: SendNotificationFormValues) => {
    sendNotification.mutate(data);
  };

  // Notifications data for the table
  const notificationsList = notifications?.data || [];
  const totalNotifications = notifications?.total || 0;
  const totalPages = Math.ceil(totalNotifications / pageSize);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold">Notification Management</CardTitle>
              <CardDescription>
                Send and manage application notifications
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select view" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="send">Send Notifications</SelectItem>
                  <SelectItem value="history">Notification History</SelectItem>
                  <SelectItem value="devices">Device Tokens</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="send">
                <SendHorizonal className="h-4 w-4 mr-2" />
                Send
              </TabsTrigger>
              <TabsTrigger value="history">
                <Clock className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="devices">
                <Smartphone className="h-4 w-4 mr-2" />
                Devices
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* SEND NOTIFICATIONS TAB */}
            <TabsContent value="send" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send New Notification</CardTitle>
                  <CardDescription>
                    Create and send notifications to users
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Basic notification info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notification Title</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter notification title" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notification Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select notification type" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="system">System</SelectItem>
                                  <SelectItem value="mining">Mining</SelectItem>
                                  <SelectItem value="reward">Reward</SelectItem>
                                  <SelectItem value="transaction">Transaction</SelectItem>
                                  <SelectItem value="marketing">Marketing</SelectItem>
                                  <SelectItem value="chat">Chat</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Message</FormLabel>
                            <FormControl>
                              <Textarea 
                                placeholder="Enter notification message"
                                className="min-h-[100px]"
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormField
                          control={form.control}
                          name="actionUrl"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Action URL (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="/mining or https://example.com" {...field} />
                              </FormControl>
                              <FormDescription>
                                URL path to direct users when they click the notification
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority (1-10)</FormLabel>
                              <FormControl>
                                <Input type="number" min={1} max={10} {...field} />
                              </FormControl>
                              <FormDescription>
                                Higher priority notifications appear first
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name="expiresAt"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiration Date (Optional)</FormLabel>
                            <FormControl>
                              <Input type="datetime-local" {...field} />
                            </FormControl>
                            <FormDescription>
                              When the notification should expire and be automatically removed
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Target selection */}
                      <div className="bg-muted/50 p-4 rounded-lg border">
                        <h3 className="font-medium mb-4">Targeting Options</h3>
                        
                        <FormField
                          control={form.control}
                          name="targetAll"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={(checked) => {
                                    field.onChange(checked);
                                    if (checked) {
                                      form.setValue('targetUsers', []);
                                    }
                                  }}
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel>Send to all users</FormLabel>
                                <FormDescription>
                                  If unchecked, you can select specific users below
                                </FormDescription>
                              </div>
                            </FormItem>
                          )}
                        />

                        {!form.watch('targetAll') && (
                          <FormField
                            control={form.control}
                            name="targetUsers"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Select Users</FormLabel>
                                <FormControl>
                                  <Select>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select users" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {usersLoading ? (
                                        <SelectItem value="loading">Loading users...</SelectItem>
                                      ) : (
                                        users?.map((user: User) => (
                                          <SelectItem key={user.id} value={user.id.toString()}>
                                            {user.username}
                                          </SelectItem>
                                        ))
                                      )}
                                    </SelectContent>
                                  </Select>
                                </FormControl>
                                <FormDescription>
                                  Select specific users to receive this notification
                                </FormDescription>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        )}

                        <FormField
                          control={form.control}
                          name="targetPlatforms"
                          render={() => (
                            <FormItem className="mt-4">
                              <div className="mb-2">
                                <FormLabel>Target Platforms</FormLabel>
                                <FormDescription>
                                  Select which platforms should receive this notification
                                </FormDescription>
                              </div>
                              <div className="flex flex-wrap gap-4">
                                {['web', 'android', 'ios'].map((platform) => (
                                  <FormField
                                    key={platform}
                                    control={form.control}
                                    name="targetPlatforms"
                                    render={({ field }) => {
                                      return (
                                        <FormItem
                                          key={platform}
                                          className="flex flex-row items-start space-x-3 space-y-0"
                                        >
                                          <FormControl>
                                            <Checkbox
                                              checked={field.value?.includes(platform)}
                                              onCheckedChange={(checked) => {
                                                const updatedPlatforms = checked
                                                  ? [...field.value, platform]
                                                  : field.value?.filter((p) => p !== platform);
                                                field.onChange(updatedPlatforms);
                                              }}
                                            />
                                          </FormControl>
                                          <FormLabel className="capitalize">
                                            {platform}
                                          </FormLabel>
                                        </FormItem>
                                      );
                                    }}
                                  />
                                ))}
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={sendNotification.isPending}
                      >
                        {sendNotification.isPending ? "Sending..." : "Send Notification"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTIFICATION HISTORY TAB */}
            <TabsContent value="history" className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Notification History</CardTitle>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="Search notifications..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[250px]"
                      />
                      <Button variant="outline" size="icon">
                        <Search className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <p>Loading notifications...</p>
                    </div>
                  ) : notificationsList?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40">
                      <Bell className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No notifications found</p>
                    </div>
                  ) : (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {notificationsList?.map((notification: Notification) => (
                            <TableRow key={notification.id}>
                              <TableCell className="font-medium">{notification.title}</TableCell>
                              <TableCell>
                                <Badge className="capitalize" variant="outline">
                                  {notification.type}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <Badge variant={notification.read ? "outline" : "default"}>
                                  {notification.read ? "Read" : "Unread"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteClick(notification.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>

                      {/* Pagination */}
                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-muted-foreground">
                          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalNotifications)} of {totalNotifications} notifications
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                          >
                            Previous
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                          >
                            Next
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* DEVICE TOKENS TAB */}
            <TabsContent value="devices" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Registered Device Tokens</CardTitle>
                  <CardDescription>
                    View all registered device tokens for push notifications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {tokensLoading ? (
                    <div className="flex items-center justify-center h-40">
                      <p>Loading device tokens...</p>
                    </div>
                  ) : deviceTokens?.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40">
                      <Smartphone className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">No device tokens registered</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Platform</TableHead>
                          <TableHead>Last Used</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {deviceTokens?.map((token: DeviceToken) => (
                          <TableRow key={token.id}>
                            <TableCell className="font-medium">
                              User #{token.userId}
                            </TableCell>
                            <TableCell>
                              <Badge className="capitalize" variant="outline">
                                {token.platform}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(token.lastUsedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Badge variant={token.isActive ? "default" : "outline"}>
                                {token.isActive ? "Active" : "Inactive"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* NOTIFICATION SETTINGS TAB */}
            <TabsContent value="settings" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Notification Settings</CardTitle>
                  <CardDescription>
                    Configure global notification settings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Firebase Configuration</h3>
                      <p className="text-muted-foreground mb-4">
                        Configure Firebase Cloud Messaging for push notifications
                      </p>
                      
                      {/* Placeholder for Firebase settings form */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="firebase-api-key">Firebase API Key</Label>
                          <Input
                            id="firebase-api-key"
                            type="password"
                            placeholder="Enter Firebase API key"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="firebase-app-id">Firebase App ID</Label>
                          <Input
                            id="firebase-app-id"
                            placeholder="Enter Firebase App ID"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="firebase-project-id">Firebase Project ID</Label>
                          <Input
                            id="firebase-project-id"
                            placeholder="Enter Firebase Project ID"
                          />
                        </div>
                        
                        <Button className="w-full">Save Firebase Configuration</Button>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-4">Notification Defaults</h3>
                      <p className="text-muted-foreground mb-4">
                        Configure default settings for notifications
                      </p>
                      
                      {/* Placeholder for notification defaults settings */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Default Notification TTL</Label>
                            <p className="text-sm text-muted-foreground">
                              Time to live for notifications
                            </p>
                          </div>
                          <Select defaultValue="7">
                            <SelectTrigger className="w-[120px]">
                              <SelectValue placeholder="Days" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 day</SelectItem>
                              <SelectItem value="3">3 days</SelectItem>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="14">14 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Auto-delete Read Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Automatically delete notifications after read
                            </p>
                          </div>
                          <Switch />
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="space-y-0.5">
                            <Label>Mining Rewards Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              Send automatic notifications for mining rewards
                            </p>
                          </div>
                          <Switch defaultChecked />
                        </div>
                        
                        <Button className="w-full mt-4">Save Default Settings</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Notification stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4 flex flex-col items-center">
            <Bell className="h-8 w-8 mb-2 text-primary" />
            <p className="text-3xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4 flex flex-col items-center">
            <Bell className="h-8 w-8 mb-2 text-amber-500" />
            <p className="text-3xl font-bold">{stats?.unread || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Registered Devices</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4 flex flex-col items-center">
            <Smartphone className="h-8 w-8 mb-2 text-emerald-500" />
            <p className="text-3xl font-bold">{stats?.devices || 0}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="p-4">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 p-4 flex flex-col items-center">
            <Users className="h-8 w-8 mb-2 text-blue-500" />
            <p className="text-3xl font-bold">{stats?.activeUsers || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Notification</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this notification? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Dummy components for TypeScript compatibility
const Label = ({ htmlFor, children }: { htmlFor?: string, children: React.ReactNode }) => (
  <div className="text-sm font-medium">{children}</div>
);

const Switch = ({ defaultChecked }: { defaultChecked?: boolean }) => (
  <div className={`w-10 h-5 rounded-full ${defaultChecked ? 'bg-primary' : 'bg-muted'} relative`}>
    <div className={`absolute top-0.5 ${defaultChecked ? 'right-0.5' : 'left-0.5'} h-4 w-4 rounded-full bg-white transition-all`} />
  </div>
);
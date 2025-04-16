import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface User {
  id: number;
  username: string;
  tokenBalance: number;
  miningRate: number;
}

interface MiningHistory {
  id: number;
  userId: number;
  amount: number;
  bonusAmount: number;
  bonusType: string | null;
  streakDay: number;
  timestamp: string;
  user?: User;
}

const miningSettingsSchema = z.object({
  dailyBonusChance: z.coerce.number().min(0).max(100),
  maxStreakDays: z.coerce.number().min(1).max(30),
  streakBonusPercentPerDay: z.coerce.number().min(1).max(20),
  streakExpirationHours: z.coerce.number().min(24).max(72),
  enableDailyBonus: z.boolean(),
  enableStreakBonus: z.boolean(),
  enableAutomaticMining: z.boolean(),
  hourlyRewardAmount: z.coerce.number().min(0.1).max(10),
  dailyActivationRequired: z.boolean(),
  activationExpirationHours: z.coerce.number().min(12).max(48),
  // Withdrawal settings
  globalWithdrawalDay: z.number().min(0).max(6).nullable(),
  enableWithdrawalLimits: z.boolean(),
  withdrawalStartHour: z.coerce.number().min(0).max(23),
  withdrawalEndHour: z.coerce.number().min(0).max(23)
});

type MiningSettingsValues = z.infer<typeof miningSettingsSchema>;

const userStreakSchema = z.object({
  userId: z.number(),
  newStreakDay: z.coerce.number().min(0)
});

type UserStreakValues = z.infer<typeof userStreakSchema>;

// Interface for mining statistics
interface MiningStatistics {
  totalRewardsDistributed: number;
  totalAutomaticMiningSessions: number;
  lastProcessedTime: string | null;
  activeMinersCount: number;
  totalUsersCount: number;
  activationRate: number;
  averageRewardPerUser: number;
  processedBatches: number;
}

interface MiningStatisticsResponse {
  statistics: MiningStatistics;
  settings: any;
}

export default function MiningManagement() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMiningEntry, setSelectedMiningEntry] = useState<MiningHistory | null>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);

  // Fetch mining history
  const { data: miningHistory, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["/api/admin/mining-history"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/mining-history");
      return await res.json();
    }
  });

  // Fetch mining settings
  const { data: miningSettings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ["/api/admin/mining-settings"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/admin/mining-settings");
      return await res.json();
    }
  });
  
  // Fetch mining statistics
  const { data: miningStatisticsData, isLoading: isStatisticsLoading } = useQuery({
    queryKey: ["/api/mining/statistics"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/mining/statistics");
      return await res.json() as MiningStatisticsResponse;
    },
    // Refresh statistics every 5 minutes
    refetchInterval: 5 * 60 * 1000
  });

  // Set up forms
  const settingsForm = useForm<MiningSettingsValues>({
    resolver: zodResolver(miningSettingsSchema),
    defaultValues: {
      dailyBonusChance: 10,
      maxStreakDays: 10,
      streakBonusPercentPerDay: 5,
      streakExpirationHours: 48,
      enableDailyBonus: true,
      enableStreakBonus: true,
      enableAutomaticMining: true,
      hourlyRewardAmount: 0.5,
      dailyActivationRequired: true,
      activationExpirationHours: 24,
      globalWithdrawalDay: null,
      enableWithdrawalLimits: false,
      withdrawalStartHour: 9,
      withdrawalEndHour: 17
    }
  });

  const streakForm = useForm<UserStreakValues>({
    resolver: zodResolver(userStreakSchema),
    defaultValues: {
      userId: 0,
      newStreakDay: 0
    }
  });

  // Set form values when settings load
  useEffect(() => {
    if (miningSettings) {
      settingsForm.reset({
        dailyBonusChance: miningSettings.dailyBonusChance,
        maxStreakDays: miningSettings.maxStreakDays,
        streakBonusPercentPerDay: miningSettings.streakBonusPercentPerDay,
        streakExpirationHours: miningSettings.streakExpirationHours,
        enableDailyBonus: miningSettings.enableDailyBonus,
        enableStreakBonus: miningSettings.enableStreakBonus,
        enableAutomaticMining: miningSettings.enableAutomaticMining ?? true,
        hourlyRewardAmount: miningSettings.hourlyRewardAmount ?? 0.5,
        dailyActivationRequired: miningSettings.dailyActivationRequired ?? true,
        activationExpirationHours: miningSettings.activationExpirationHours ?? 24,
        globalWithdrawalDay: miningSettings.globalWithdrawalDay ?? null,
        enableWithdrawalLimits: miningSettings.enableWithdrawalLimits ?? false,
        withdrawalStartHour: miningSettings.withdrawalStartHour ?? 9,
        withdrawalEndHour: miningSettings.withdrawalEndHour ?? 17
      });
    }
  }, [miningSettings, settingsForm]);

  // Set form values when user is selected
  useEffect(() => {
    if (selectedUser) {
      streakForm.reset({
        userId: selectedUser.id,
        newStreakDay: 0
      });
    }
  }, [selectedUser, streakForm]);

  // Update mining settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (settings: MiningSettingsValues) => {
      const res = await apiRequest("PATCH", "/api/admin/mining-settings", settings);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Mining settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mining-settings"] });
      setIsSettingsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Update user streak mutation
  const updateStreakMutation = useMutation({
    mutationFn: async (data: UserStreakValues) => {
      const res = await apiRequest("PATCH", `/api/admin/users/${data.userId}/streak`, { streakDay: data.newStreakDay });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Streak updated",
        description: `Streak for user has been updated successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mining-history"] });
      setIsEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update streak",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Delete mining history entry mutation
  const deleteMiningEntryMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/mining-history/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Entry deleted",
        description: "Mining history entry has been deleted",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/mining-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mining/settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/mining/history"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to delete entry",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSettingsSubmit = (data: MiningSettingsValues) => {
    updateSettingsMutation.mutate(data);
  };

  const onStreakSubmit = (data: UserStreakValues) => {
    updateStreakMutation.mutate(data);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (entry: MiningHistory) => {
    setSelectedMiningEntry(entry);
    setIsDeleteDialogOpen(true);
  };

  if (isHistoryLoading || isSettingsLoading || isStatisticsLoading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Mining Management</h2>
          <p className="text-gray-500 dark:text-gray-400">
            Manage mining streaks, bonuses, and settings
          </p>
        </div>
        <Button onClick={() => setIsSettingsDialogOpen(true)}>
          Manage Mining Settings
        </Button>
      </div>

      {/* Global Mining Statistics */}
      <div className="space-y-6">
        <h3 className="text-lg font-medium">Bonus Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Daily Bonus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {miningSettings?.enableDailyBonus ? 
                  `${miningSettings.dailyBonusChance}%` : "Disabled"}
              </div>
              <p className="text-xs text-gray-500">Chance to double rewards</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Streak Bonus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {miningSettings?.enableStreakBonus ? 
                  `${miningSettings.streakBonusPercentPerDay}%` : "Disabled"}
              </div>
              <p className="text-xs text-gray-500">Bonus per day of streak</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Max Streak Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {miningSettings?.maxStreakDays || 0}
              </div>
              <p className="text-xs text-gray-500">Maximum streak bonus days</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Streak Expiration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {miningSettings?.streakExpirationHours || 0}h
              </div>
              <p className="text-xs text-gray-500">Hours until streak resets</p>
            </CardContent>
          </Card>
        </div>

        <h3 className="text-lg font-medium">Automatic Mining Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className={`${miningSettings?.enableAutomaticMining ? "border-green-500" : "border-red-500"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Automatic Mining</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {miningSettings?.enableAutomaticMining ? 
                  "Enabled" : "Disabled"}
              </div>
              <p className="text-xs text-gray-500">Hourly mining system status</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Hourly Reward</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {miningSettings?.hourlyRewardAmount || 0} TSK
              </div>
              <p className="text-xs text-gray-500">Tokens awarded per hour</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Activation Required</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {miningSettings?.dailyActivationRequired ? "Yes" : "No"}
              </div>
              <p className="text-xs text-gray-500">Daily login requirement</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Activation Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {miningSettings?.activationExpirationHours || 24}h
              </div>
              <p className="text-xs text-gray-500">Hours until activation expires</p>
            </CardContent>
          </Card>
        </div>

        {/* Automatic Mining Statistics */}
        {miningStatisticsData && (
          <>
            <div className="flex items-center justify-between mt-8 mb-4">
              <h3 className="text-lg font-medium">Mining System Statistics</h3>
              
              {/* System Status Indicator */}
              {miningStatisticsData.statistics.lastProcessedTime ? (
                <div className="flex items-center space-x-2">
                  <span className={`h-3 w-3 rounded-full ${
                    new Date().getTime() - new Date(miningStatisticsData.statistics.lastProcessedTime).getTime() < 2 * 60 * 60 * 1000 
                      ? "bg-green-500 animate-pulse" 
                      : "bg-amber-500"
                  }`}></span>
                  <span className="text-sm font-medium">
                    {new Date().getTime() - new Date(miningStatisticsData.statistics.lastProcessedTime).getTime() < 2 * 60 * 60 * 1000 
                      ? "System Active" 
                      : "System Idle"}
                  </span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <span className="h-3 w-3 rounded-full bg-red-500"></span>
                  <span className="text-sm font-medium">Not Started</span>
                </div>
              )}
            </div>
            
            {/* Dashboard Summary Card */}
            <Card className="mb-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Distributed</span>
                    <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                      {miningStatisticsData.statistics.totalRewardsDistributed.toFixed(2)} TSK
                    </span>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Miners</span>
                    <div className="flex items-baseline space-x-2">
                      <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                        {miningStatisticsData.statistics.activeMinersCount}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        of {miningStatisticsData.statistics.totalUsersCount} users
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Last Processing</span>
                    <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {miningStatisticsData.statistics.lastProcessedTime ? 
                        `${new Date(miningStatisticsData.statistics.lastProcessedTime).toLocaleTimeString()} on ${new Date(miningStatisticsData.statistics.lastProcessedTime).toLocaleDateString()}` : 
                        "Not yet processed"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detailed Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="border-blue-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {miningStatisticsData.statistics.totalRewardsDistributed.toFixed(2)} TSK
                  </div>
                  <p className="text-xs text-gray-500">Via automatic hourly mining</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Average per User</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {miningStatisticsData.statistics.averageRewardPerUser.toFixed(2)} TSK
                  </div>
                  <p className="text-xs text-gray-500">Per mining session</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Hourly Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {miningStatisticsData.statistics.processedBatches > 0 
                      ? (miningStatisticsData.statistics.totalRewardsDistributed / miningStatisticsData.statistics.processedBatches).toFixed(2) 
                      : "0.00"} TSK
                  </div>
                  <p className="text-xs text-gray-500">Average tokens per hour</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {miningStatisticsData.statistics.totalAutomaticMiningSessions}
                  </div>
                  <p className="text-xs text-gray-500">Individual mining rewards</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Active Miners</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {miningStatisticsData.statistics.activeMinersCount}
                  </div>
                  <p className="text-xs text-gray-500">Users with active mining</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {miningStatisticsData.statistics.totalUsersCount}
                  </div>
                  <p className="text-xs text-gray-500">Registered accounts</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Activation Rate</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center">
                    <div className="text-2xl font-bold mr-2">
                      {miningStatisticsData.statistics.activationRate.toFixed(1)}%
                    </div>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center"
                      style={{
                        background: `conic-gradient(#3b82f6 ${miningStatisticsData.statistics.activationRate * 3.6}deg, #e5e7eb ${miningStatisticsData.statistics.activationRate * 3.6}deg)`,
                      }}
                    >
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">Percentage of users mining</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Processing Cycles</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {miningStatisticsData.statistics.processedBatches}
                  </div>
                  <p className="text-xs text-gray-500">
                    Total hourly distribution cycles
                  </p>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>

      {/* Mining History Table */}
      <Card>
        <CardHeader>
          <CardTitle>Mining History</CardTitle>
          <CardDescription>
            View and manage user mining activities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Bonus</TableHead>
                <TableHead>Streak</TableHead>
                <TableHead>Bonus Type</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {miningHistory && miningHistory.length > 0 ? (
                miningHistory.map((entry: MiningHistory) => (
                  <TableRow key={entry.id}>
                    <TableCell className="font-medium">
                      {entry.user?.username || `User #${entry.userId}`}
                    </TableCell>
                    <TableCell>
                      {new Date(entry.timestamp).toLocaleString()}
                    </TableCell>
                    <TableCell>{entry.amount} TSK</TableCell>
                    <TableCell>
                      {entry.bonusAmount > 0 ? (
                        <span className="text-green-600">+{entry.bonusAmount} TSK</span>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {entry.streakDay > 1 ? (
                        <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                          Day {entry.streakDay}
                        </Badge>
                      ) : "Day 1"}
                    </TableCell>
                    <TableCell>
                      {entry.bonusType ? (
                        entry.bonusType === 'streak' ? (
                          <Badge className="bg-yellow-500">Streak</Badge>
                        ) : (
                          <Badge className="bg-green-500">Lucky</Badge>
                        )
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(entry.user || { id: entry.userId, username: `User #${entry.userId}`, tokenBalance: 0, miningRate: 0 })}
                        >
                          Edit Streak
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          className="text-red-500 hover:text-red-700"
                          onClick={() => openDeleteDialog(entry)}
                        >
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No mining history found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit User Streak Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Edit User Streak</DialogTitle>
            <DialogDescription>
              Change the streak day for user {selectedUser?.username}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...streakForm}>
            <form onSubmit={streakForm.handleSubmit(onStreakSubmit)} className="space-y-4">
              <FormField
                control={streakForm.control}
                name="newStreakDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Streak Day</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>
                      Set to 0 to reset streak, or set a specific day (1-{miningSettings?.maxStreakDays || 10})
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateStreakMutation.isPending}>
                  {updateStreakMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Changes
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Mining Entry Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-lg z-[100]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Mining Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this mining entry? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 hover:bg-red-600"
              onClick={() => selectedMiningEntry && deleteMiningEntryMutation.mutate(selectedMiningEntry.id)}
              disabled={deleteMiningEntryMutation.isPending}
            >
              {deleteMiningEntryMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mining Settings Dialog */}
      <Dialog open={isSettingsDialogOpen} onOpenChange={setIsSettingsDialogOpen}>
        <DialogContent className="sm:max-w-[525px] max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Mining Settings</DialogTitle>
            <DialogDescription>
              Configure global mining bonus and streak settings
            </DialogDescription>
          </DialogHeader>
          
          <Form {...settingsForm}>
            <form onSubmit={settingsForm.handleSubmit(onSettingsSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={settingsForm.control}
                  name="enableDailyBonus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Daily Lucky Bonus</FormLabel>
                        <FormDescription>
                          Chance to double mining rewards
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="enableStreakBonus"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Streak Bonus</FormLabel>
                        <FormDescription>
                          Reward users for daily mining
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={settingsForm.control}
                name="dailyBonusChance"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Daily Bonus Chance (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" max="100" {...field} />
                    </FormControl>
                    <FormDescription>
                      Chance of getting a 2x multiplier on mining rewards (0-100%)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="streakBonusPercentPerDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Streak Bonus Per Day (%)</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="20" {...field} />
                    </FormControl>
                    <FormDescription>
                      Percentage bonus for each consecutive day of mining
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="maxStreakDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Streak Days</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" max="30" {...field} />
                    </FormControl>
                    <FormDescription>
                      Maximum number of days for streak bonuses
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="streakExpirationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Streak Expiration Hours</FormLabel>
                    <FormControl>
                      <Input type="number" min="24" max="72" {...field} />
                    </FormControl>
                    <FormDescription>
                      Hours after last mining until streak resets
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-2">Automatic Mining Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={settingsForm.control}
                  name="enableAutomaticMining"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Automatic Mining</FormLabel>
                        <FormDescription>
                          Enable hourly rewards system
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="dailyActivationRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Daily Activation</FormLabel>
                        <FormDescription>
                          Require daily login to activate
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={settingsForm.control}
                name="hourlyRewardAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hourly Reward Amount (TSK)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0.1" step="0.1" {...field} />
                    </FormControl>
                    <FormDescription>
                      Amount of TSK tokens awarded each hour
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={settingsForm.control}
                name="activationExpirationHours"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Activation Duration (Hours)</FormLabel>
                    <FormControl>
                      <Input type="number" min="12" max="48" {...field} />
                    </FormControl>
                    <FormDescription>
                      How long mining remains active after daily activation
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator className="my-4" />
              
              <h3 className="text-lg font-medium mb-2">Withdrawal Settings</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={settingsForm.control}
                  name="enableWithdrawalLimits"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Withdrawal Limits</FormLabel>
                        <FormDescription>
                          Enable withdrawal day restriction
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={settingsForm.control}
                name="globalWithdrawalDay"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Global Withdrawal Day</FormLabel>
                    <FormControl>
                      <Select
                        onValueChange={(value) => field.onChange(value === "null" ? null : parseInt(value))}
                        value={field.value === null ? "null" : field.value.toString()}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select day of week" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="null">Any day (no restriction)</SelectItem>
                          <SelectItem value="0">Sunday</SelectItem>
                          <SelectItem value="1">Monday</SelectItem>
                          <SelectItem value="2">Tuesday</SelectItem>
                          <SelectItem value="3">Wednesday</SelectItem>
                          <SelectItem value="4">Thursday</SelectItem>
                          <SelectItem value="5">Friday</SelectItem>
                          <SelectItem value="6">Saturday</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormDescription>
                      Day of the week when token withdrawals are allowed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4 mt-4">
                <FormField
                  control={settingsForm.control}
                  name="withdrawalStartHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal Start Hour</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="23" 
                          {...field} 
                          disabled={!settingsForm.watch('enableWithdrawalLimits')}
                        />
                      </FormControl>
                      <FormDescription>
                        Hour when withdrawals become available (0-23)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={settingsForm.control}
                  name="withdrawalEndHour"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Withdrawal End Hour</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          max="23" 
                          {...field} 
                          disabled={!settingsForm.watch('enableWithdrawalLimits')}
                        />
                      </FormControl>
                      <FormDescription>
                        Hour when withdrawals end (0-23)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsSettingsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateSettingsMutation.isPending}>
                  {updateSettingsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Save Settings
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
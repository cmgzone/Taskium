import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import KycForm from "@/components/kyc/kyc-form";
import KycVerificationTasks from "@/components/kyc/verification-tasks";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";
import { isValidAddress } from "@/lib/contract-utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Loader2, AlertTriangle, User, Shield, Wallet, Copy, Save,
  RefreshCcw, Award, Check, CreditCard, BadgeCheck, Key, 
  Trash2, Clipboard, LucideIcon, ExternalLink, XCircle, X,
  Bell, BellOff, Smartphone, Mail
} from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import NotificationPermissionButton from "@/components/notification-permission-button";

export default function SettingsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [walletAddress, setWalletAddress] = useState(user?.walletAddress || "");
  const [walletAddressValid, setWalletAddressValid] = useState<boolean | null>(
    user?.walletAddress ? isValidAddress(user.walletAddress) : null
  );
  const [email, setEmail] = useState(user?.email || "");
  const [emailValid, setEmailValid] = useState<boolean | null>(
    user?.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) : null
  );
  const [, setLocation] = useLocation();
  const [hasChanges, setHasChanges] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // State for delete account dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  
  // Track changes to wallet address and email
  useEffect(() => {
    if (user?.walletAddress !== walletAddress || user?.email !== email) {
      setHasChanges(true);
      setSaveSuccess(false);
    } else {
      setHasChanges(false);
    }
  }, [walletAddress, user?.walletAddress, email, user?.email]);
  
  // Get KYC status to determine whether to show the verification tasks section
  const { data: kycStatus } = useQuery({
    queryKey: ["/api/kyc/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/kyc/status");
      return await response.json();
    },
  });
  
  // Fetch verification tasks if user is verified
  const isVerified = kycStatus?.status === "verified";
  const { data: tasks, isLoading: tasksLoading, error: tasksError } = useQuery({
    queryKey: ["/api/user/tasks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/tasks");
      return await response.json();
    },
    enabled: !!isVerified,
  });
  
  // Delete account mutation
  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      const response = await apiRequest("DELETE", "/api/user", { password });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete account");
      }
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been successfully deleted.",
      });
      // Redirect to login page
      queryClient.clear();
      setLocation("/auth");
    },
    onError: (error: Error) => {
      setDeleteError(error.message || "Failed to delete account. Please try again.");
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async () => {
      // Update profile with email
      if (email) {
        const profileResponse = await apiRequest("PATCH", "/api/user/profile", {
          email,
        });
        
        if (!profileResponse.ok) {
          const errorData = await profileResponse.json();
          throw new Error(errorData.message || "Failed to save email");
        }
      }
      
      // Update settings with wallet address
      const response = await apiRequest("POST", "/api/user/settings", {
        walletAddress,
      });
      
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Your settings have been updated successfully.",
      });
      setHasChanges(false);
      setSaveSuccess(true);
      
      // Reset success indicator after 3 seconds
      setTimeout(() => {
        setSaveSuccess(false);
      }, 3000);
      
      // Refresh user data to update UI
      queryClient.invalidateQueries({ queryKey: ['/api/user'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  });
  
  const handleSaveSettings = () => {
    // Validate wallet address before saving if one is provided
    if (walletAddress && !isValidAddress(walletAddress)) {
      toast({
        title: "Invalid wallet address",
        description: "Please enter a valid BNB Smart Chain wallet address",
        variant: "destructive",
      });
      return;
    }
    
    // Validate email format if provided
    if (email && emailValid === false) {
      toast({
        title: "Invalid email address",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }
    
    saveSettingsMutation.mutate();
  };
  
  const handleDeleteAccount = () => {
    // Check if confirmation text matches
    if (confirmDelete !== "DELETE") {
      toast({
        title: "Error",
        description: "Please type DELETE to confirm account deletion",
        variant: "destructive",
      });
      return;
    }
    
    // Check if password is provided
    if (!deletePassword) {
      toast({
        title: "Error",
        description: "Please enter your password",
        variant: "destructive",
      });
      return;
    }
    
    deleteAccountMutation.mutate(deletePassword);
  };

  return (
    <div className="container mx-auto py-6 md:py-8 px-4 sm:px-6 md:px-8 max-w-5xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 inline-block text-transparent bg-clip-text">
            Account Settings
          </h1>
          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage your account preferences and security
          </p>
        </div>
        
        {user && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex items-center gap-2 p-2.5 bg-muted/50 rounded-lg border border-border/50 mt-3 sm:mt-0 w-full sm:w-auto"
          >
            <div className="h-9 w-9 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {user.username.substring(0, 1).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user.username}</p>
              <p className="text-xs text-muted-foreground">
                <span className="text-primary font-medium">{user.tokenBalance}</span> TSK Balance
              </p>
            </div>
          </motion.div>
        )}
      </div>
      
      <div className="rounded-xl border border-border/60 shadow-sm overflow-hidden bg-card">
        <Tabs defaultValue="general" className="w-full">
          <div className="bg-muted/30 p-2 border-b border-border/60 overflow-x-auto scrollbar-hide">
            <TabsList className="flex w-full md:w-max gap-1">
              <TabsTrigger value="general" className="rounded-md flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-2">
                <User size={16} className="text-muted-foreground hidden sm:inline-block" />
                <span>General</span>
              </TabsTrigger>
              <TabsTrigger value="kyc" className="rounded-md flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-2">
                <Shield size={16} className="text-muted-foreground hidden sm:inline-block" />
                <span>KYC Verification</span>
              </TabsTrigger>
              {isVerified && (
                <TabsTrigger value="verification-tasks" className="rounded-md flex-1 md:flex-initial flex items-center justify-center gap-1.5 py-2">
                  <BadgeCheck size={16} className="text-muted-foreground hidden sm:inline-block" />
                  <span className="text-xs sm:text-sm whitespace-nowrap">Verification Tasks</span>
                </TabsTrigger>
              )}
            </TabsList>
          </div>
          
          <TabsContent value="general" className="p-0 mt-0">
            <div className="p-6 space-y-8">
              {/* General Settings Card */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="overflow-hidden border-primary/20 shadow-sm">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/60 flex items-center gap-2">
                    <User className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-base sm:text-lg">Account Information</h3>
                  </div>
                  
                  <CardContent className="p-4 sm:pt-6 sm:pb-5 sm:px-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* Mobile: User Info Section With Border */}
                      <div className="space-y-4 lg:space-y-5 pb-4 border-b border-border/30 lg:border-0 lg:pb-0">
                        <div className="group">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                            <User size={14} className="text-muted-foreground" />
                            Username
                          </h4>
                          <div className="flex items-center">
                            <p className="text-lg font-medium">{user?.username}</p>
                          </div>
                        </div>
                        
                        <div className="group">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Shield size={14} className="text-muted-foreground" />
                            Role
                          </h4>
                          <div className="flex items-center space-x-2">
                            <div className={`h-2.5 w-2.5 rounded-full ${user?.role === 'admin' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                            <p className="font-medium capitalize">{user?.role || 'User'}</p>
                          </div>
                        </div>
                        
                        <div className="group">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Award size={14} className="text-muted-foreground" />
                            Premium Status
                          </h4>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium">{user?.premiumTier || 'Basic'}</p>
                            {user?.premiumMultiplier && user?.premiumMultiplier > 1 && (
                              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                {user?.premiumMultiplier}x Multiplier
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <div className="group">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Mail size={14} className="text-muted-foreground" />
                            Email Address
                          </h4>
                          <div className="relative">
                            <div className="relative">
                              <Input
                                value={email}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setEmail(value);
                                  // Only validate if there's some input
                                  setEmailValid(value.length > 0 ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) : null);
                                }}
                                placeholder="Enter your email address"
                                className={`pr-12 text-xs sm:text-sm ${emailValid === false ? "border-red-500" : ""}`}
                              />
                              {emailValid !== null && (
                                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                  {emailValid ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            {user?.email && email !== user?.email && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="absolute right-1 top-1 h-8 text-xs px-2"
                                      onClick={() => {
                                        setEmail(user?.email || '');
                                        setEmailValid(user?.email ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) : null);
                                      }}
                                    >
                                      <RefreshCcw size={14} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reset to original</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {emailValid === false ? (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              Invalid email format. Please enter a valid email address.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Bell size={12} />
                              Used for notifications and account recovery
                            </p>
                          )}
                        </div>
                      </div>
                      
                      <div className="space-y-4 lg:space-y-5 pt-1 lg:pt-0">
                        <div className="group">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Wallet size={14} className="text-muted-foreground" />
                            Connected Wallet
                          </h4>
                          <div className="relative">
                            <div className="relative">
                              <Input
                                value={walletAddress}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  setWalletAddress(value);
                                  // Only validate if there's some input
                                  setWalletAddressValid(value.length > 0 ? isValidAddress(value) : null);
                                }}
                                placeholder="Enter BNB wallet address"
                                className={`pr-12 sm:pr-24 font-mono text-xs sm:text-sm ${walletAddressValid === false ? "border-red-500" : ""}`}
                              />
                              {walletAddressValid !== null && (
                                <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
                                  {walletAddressValid ? (
                                    <Check className="h-5 w-5 text-green-500" />
                                  ) : (
                                    <X className="h-5 w-5 text-red-500" />
                                  )}
                                </div>
                              )}
                            </div>
                            {user?.walletAddress && walletAddress !== user?.walletAddress && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      size="sm" 
                                      variant="ghost" 
                                      className="absolute right-1 top-1 h-8 text-xs px-2"
                                      onClick={() => {
                                        setWalletAddress(user?.walletAddress || '');
                                        setWalletAddressValid(user?.walletAddress ? isValidAddress(user.walletAddress) : null);
                                      }}
                                    >
                                      <RefreshCcw size={14} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>Reset to original</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          {walletAddressValid === false ? (
                            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                              <AlertTriangle size={12} />
                              Invalid wallet address format. Must be a valid BNB Smart Chain address.
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                              <Key size={12} />
                              Used for token withdrawals
                            </p>
                          )}
                        </div>
                        
                        <div className="group">
                          <h4 className="text-sm font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
                            <Clipboard size={14} className="text-muted-foreground" />
                            Referral Code
                          </h4>
                          <div className="bg-muted/50 p-2 sm:p-2.5 rounded-md font-mono text-xs sm:text-sm flex items-center justify-between border border-border/40 hover:border-primary/20 transition-colors group-hover:bg-muted/70">
                            <span className="truncate mr-2">{user?.referralCode || 'No referral code'}</span>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button 
                                    variant="ghost" 
                                    size="sm"
                                    className="h-7 text-xs flex-shrink-0"
                                    onClick={() => {
                                      if (user?.referralCode) {
                                        navigator.clipboard.writeText(user?.referralCode || '');
                                        toast({
                                          title: "Copied!",
                                          description: "Referral code copied to clipboard",
                                        });
                                      }
                                    }}
                                  >
                                    <Copy size={14} />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Copy to clipboard</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <CreditCard size={12} />
                            Share for rewards when others register
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  
                  <div className="bg-muted/30 px-4 sm:px-6 py-4 border-t border-border/60">
                    {/* Mobile Layout - Stacked */}
                    <div className="flex flex-col-reverse sm:hidden gap-3">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={handleSaveSettings} 
                              className="w-full"
                              variant={hasChanges ? "default" : "outline"}
                              disabled={!hasChanges || saveSettingsMutation.isPending}
                            >
                              {saveSettingsMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : saveSuccess ? (
                                <>
                                  <Check className="mr-2 h-4 w-4 text-green-500" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hasChanges ? "Save your account settings" : "No changes to save"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      
                      <div className="flex justify-center">
                        {hasChanges && (
                          <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            You have unsaved changes
                          </motion.span>
                        )}
                        
                        {saveSuccess && (
                          <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5"
                          >
                            <Check className="h-4 w-4" />
                            Settings saved successfully
                          </motion.span>
                        )}
                      </div>
                    </div>
                    
                    {/* Desktop Layout - Side by Side */}
                    <div className="hidden sm:flex justify-between items-center">
                      <div>
                        {hasChanges && (
                          <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-sm text-amber-600 dark:text-amber-400 flex items-center gap-1.5"
                          >
                            <AlertTriangle className="h-4 w-4" />
                            You have unsaved changes
                          </motion.span>
                        )}
                        
                        {saveSuccess && (
                          <motion.span 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5"
                          >
                            <Check className="h-4 w-4" />
                            Settings saved successfully
                          </motion.span>
                        )}
                      </div>
                      
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button 
                              onClick={handleSaveSettings} 
                              className="w-auto"
                              variant={hasChanges ? "default" : "outline"}
                              disabled={!hasChanges || saveSettingsMutation.isPending}
                            >
                              {saveSettingsMutation.isPending ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : saveSuccess ? (
                                <>
                                  <Check className="mr-2 h-4 w-4 text-green-500" />
                                  Saved
                                </>
                              ) : (
                                <>
                                  <Save className="mr-2 h-4 w-4" />
                                  Save Changes
                                </>
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {hasChanges ? "Save your account settings" : "No changes to save"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                </Card>
              </motion.div>
              
              {/* Notification Settings */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.05 }}
              >
                <Card className="overflow-hidden border-primary/20 shadow-sm">
                  <div className="bg-gradient-to-r from-primary/10 to-primary/5 px-4 sm:px-6 py-3 sm:py-4 border-b border-border/60 flex items-center gap-2">
                    <Bell className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold text-base sm:text-lg">Notification Settings</h3>
                  </div>
                  
                  <CardContent className="p-4 sm:pt-6 sm:pb-5 sm:px-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <h4 className="text-sm font-medium flex items-center gap-1.5">
                          <Smartphone size={16} className="text-muted-foreground" />
                          Mobile App Notifications
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Receive push notifications on your mobile device for mining rewards, chat messages, and important updates.
                        </p>
                        
                        <div className="flex items-center justify-between p-3 border rounded-md bg-muted/30">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-md">
                              <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <h5 className="font-medium text-sm">Push Notifications</h5>
                              <p className="text-xs text-muted-foreground">For mining rewards and chat messages</p>
                            </div>
                          </div>
                          <NotificationPermissionButton variant="default" />
                        </div>
                        
                        <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                          <Bell size={12} /> 
                          You'll only see this option when using the Android app
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Account Deletion */}
              <motion.div
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card className="border-destructive/60 border bg-gradient-to-b from-background to-destructive/5 relative overflow-hidden mt-12 shadow-sm">
                  <div className="absolute right-0 top-0 h-16 w-16">
                    <div className="absolute transform rotate-45 bg-destructive text-xs text-destructive-foreground font-medium py-1 right-[-35px] top-[32px] w-[170px] text-center">
                      Danger Zone
                    </div>
                  </div>
                  
                  <CardHeader className="pb-2">
                    <CardTitle className="text-destructive flex items-center gap-2 text-xl">
                      <Trash2 className="h-6 w-6" />
                      Delete Account
                    </CardTitle>
                    <CardDescription className="text-destructive/80 font-medium">
                      Permanently delete your account and all associated data
                    </CardDescription>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="bg-background/90 rounded-lg p-4 border border-destructive/20 mb-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-destructive" />
                        <h4 className="text-sm font-medium">Important: Please withdraw your tokens first</h4>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Your current balance:
                        </p>
                        <div className="bg-muted/80 px-3 py-1 rounded-full text-sm font-semibold border border-border/50">
                          {user?.tokenBalance || 0} <span className="text-primary">TSK</span>
                        </div>
                      </div>
                      {(user?.tokenBalance || 0) > 0 && (
                        <div className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0" />
                          <p className="text-xs text-destructive">
                            You still have tokens in your account. Please withdraw them before deleting your account.
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-sm font-medium mb-3 flex items-center gap-1">
                      <AlertTriangle className="h-4 w-4 text-destructive" />
                      When you delete your account:
                    </p>
                    
                    <div className="border border-destructive/20 rounded-lg overflow-hidden mb-4">
                      <ul className="text-sm divide-y divide-destructive/10">
                        <li className="flex items-center gap-3 p-3 bg-background/50 hover:bg-background/80 transition-colors">
                          <div className="rounded-full bg-destructive/10 p-1.5 flex-shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          </div>
                          <span>All your personal information will be permanently deleted</span>
                        </li>
                        <li className="flex items-center gap-3 p-3 bg-background/50 hover:bg-background/80 transition-colors">
                          <div className="rounded-full bg-destructive/10 p-1.5 flex-shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          </div>
                          <span>Your mining history and marketplace listings will be removed</span>
                        </li>
                        <li className="flex items-center gap-3 p-3 bg-background/50 hover:bg-background/80 transition-colors">
                          <div className="rounded-full bg-destructive/10 p-1.5 flex-shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          </div>
                          <span>Any tokens in your account will be lost if not withdrawn</span>
                        </li>
                        <li className="flex items-center gap-3 p-3 bg-background/50 hover:bg-background/80 transition-colors">
                          <div className="rounded-full bg-destructive/10 p-1.5 flex-shrink-0">
                            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                          </div>
                          <span>Your referral links will no longer work</span>
                        </li>
                      </ul>
                    </div>
                  </CardContent>
                  
                  <CardFooter className="flex flex-col sm:flex-row gap-4 sm:gap-3 items-stretch sm:items-center bg-background/80 border-t border-destructive/20 pt-5">
                    <Button 
                      className="w-full sm:w-auto py-5 sm:py-6"
                      variant="outline" 
                      onClick={() => setLocation("/wallet")}
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Withdraw Tokens First
                    </Button>
                    
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            className="w-full sm:w-auto py-5 sm:py-6"
                            variant="destructive" 
                            onClick={() => setDeleteDialogOpen(true)}
                          >
                            <Trash2 className="h-5 w-5 mr-2" /> 
                            Delete Account
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>This action cannot be undone</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardFooter>
                </Card>
              </motion.div>
            </div>
            
            {/* Delete Account Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent className="max-w-md p-0 overflow-hidden w-[95vw] sm:w-auto mx-2 sm:mx-auto">
                <div className="bg-gradient-to-r from-destructive/20 to-destructive/10 p-4 sm:p-6 border-b border-destructive/20 relative">
                  <div className="absolute right-3 sm:right-4 top-3 sm:top-4">
                    <div className="h-8 w-8 rounded-full bg-destructive/10 flex items-center justify-center animate-pulse">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                    </div>
                  </div>
                  
                  <DialogHeader className="text-left space-y-1 items-start">
                    <DialogTitle className="text-xl sm:text-2xl flex items-center gap-2">
                      Delete Account
                    </DialogTitle>
                    <DialogDescription className="text-sm sm:text-base opacity-90">
                      This action is <span className="font-bold text-destructive">permanent</span> and cannot be reversed
                    </DialogDescription>
                  </DialogHeader>
                </div>
                
                <div className="p-4 sm:p-6">
                  <div className="bg-destructive/5 border border-destructive/30 rounded-lg p-3 sm:p-4 mb-5 sm:mb-6">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-sm">
                          Are you sure you want to permanently delete your account?
                        </p>
                        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                          All your data will be erased and cannot be recovered.
                        </p>
                        
                        {(user?.tokenBalance || 0) > 0 && (
                          <div className="mt-3 p-2 sm:p-3 bg-background rounded-md border border-destructive/30">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-destructive">Current Balance:</span>
                              <span className="text-xs font-bold">{user?.tokenBalance} TSK</span>
                            </div>
                            <p className="text-xs text-destructive">
                              Warning: You still have tokens that will be lost forever if you continue
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 sm:space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="delete-password" className="text-sm font-medium flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-muted-foreground" />
                        Enter your password
                      </Label>
                      <div className="relative">
                        <Input
                          id="delete-password"
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          placeholder="Enter your password"
                          className="border-input/50 focus-visible:ring-destructive/30 pr-10 text-sm h-9 sm:h-10"
                        />
                        {deletePassword && (
                          <div className="absolute right-3 top-[9px]">
                            <Check className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="delete-confirm" className="text-sm font-medium flex items-center gap-1.5">
                        <span className="flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" />
                          Type <span className="font-bold text-destructive font-mono ml-1">DELETE</span> to confirm
                        </span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="delete-confirm"
                          value={confirmDelete}
                          onChange={(e) => setConfirmDelete(e.target.value)}
                          placeholder="DELETE"
                          className="font-mono border-input/50 focus-visible:ring-destructive/30 pr-10 text-sm h-9 sm:h-10"
                        />
                        {confirmDelete === "DELETE" && (
                          <div className="absolute right-3 top-[9px]">
                            <Check className="h-4 w-4 text-green-500" />
                          </div>
                        )}
                      </div>
                      {confirmDelete && confirmDelete !== "DELETE" && (
                        <motion.p 
                          className="text-xs text-destructive mt-1 flex items-center gap-1.5"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          transition={{ duration: 0.2 }}
                        >
                          <AlertTriangle className="h-3 w-3" />
                          Please type DELETE exactly as shown (all caps)
                        </motion.p>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="border-t border-border p-3 sm:p-4 bg-muted/30">
                  <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setDeleteDialogOpen(false);
                        setDeletePassword("");
                        setConfirmDelete("");
                      }}
                      className="sm:flex-1 h-10 sm:h-11 text-sm"
                    >
                      Cancel, Keep My Account
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={handleDeleteAccount}
                      disabled={deleteAccountMutation.isPending || confirmDelete !== "DELETE" || !deletePassword}
                      className="sm:flex-1 h-10 sm:h-11 text-sm"
                    >
                      {deleteAccountMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="mr-2 h-4 w-4" />
                          <span className="inline sm:hidden">Delete Forever</span>
                          <span className="hidden sm:inline">Permanently Delete Account</span>
                        </>
                      )}
                    </Button>
                  </div>
                  
                  {deleteError && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-2 bg-destructive/10 border border-destructive/30 rounded text-sm flex items-center gap-2"
                    >
                      <XCircle className="h-4 w-4 text-destructive flex-shrink-0" />
                      <p className="text-xs text-destructive">{deleteError}</p>
                    </motion.div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </TabsContent>
          
          <TabsContent value="kyc" className="p-0 mt-0">
            <div className="p-6">
              <motion.div
                initial={{ opacity: 0, y: 10 }} 
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-5">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Identity Verification</h2>
                  <p className="text-muted-foreground mt-1">
                    Complete KYC verification to enable withdrawals and marketplace features
                  </p>
                </div>
                <KycForm />
              </motion.div>
            </div>
          </TabsContent>
          
          {isVerified && (
            <TabsContent value="verification-tasks" className="p-0 mt-0">
              <div className="p-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="mb-5">
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                      <BadgeCheck className="h-6 w-6 text-primary" />
                      <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">Verification Tasks</span>
                    </h2>
                    <p className="text-muted-foreground mt-1">
                      Help verify other users and earn TSK tokens as a reward
                    </p>
                  </div>
                  <KycVerificationTasks 
                    tasks={tasks || []} 
                    isLoading={tasksLoading} 
                    error={tasksError instanceof Error ? tasksError : tasksError ? new Error(String(tasksError)) : null} 
                  />
                </motion.div>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
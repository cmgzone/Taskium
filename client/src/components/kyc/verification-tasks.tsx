import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Icons
import {
  CheckCircle,
  FileText,
  Loader2,
  XCircle,
  Image,
  User,
  Eye
} from "lucide-react";

// Admin task interface
interface AdminTask {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  dueDate: string | null;
  completedAt: string | null;
  assignedTo: number;
  assignee?: {
    id: number;
    username: string;
    role: string;
  } | null;
  creator?: {
    id: number;
    username: string;
    role: string;
  } | null;
}

// KYC data interface
interface KycVerificationData {
  kycId: number;
  userId: number;
  username: string;
  fullName: string;
  country: string;
  documentType: string;
  documentId: string;
  submissionDate: string;
  frontImageUrl: string;
  backImageUrl?: string;
  selfieImageUrl?: string;
  taskId: number;
}

export default function KycVerificationTasks({ tasks, isLoading, error }: { 
  tasks: AdminTask[] | null, 
  isLoading: boolean, 
  error: Error | null 
}) {
  const { toast } = useToast();
  
  // States
  const [selectedTask, setSelectedTask] = useState<AdminTask | null>(null);
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [documentDialogOpen, setDocumentDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  
  // Fetch user tasks
  const { data: userTasks } = useQuery({
    queryKey: ["/api/user/tasks"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/user/tasks");
      if (!response.ok) {
        throw new Error("Failed to fetch user tasks");
      }
      return await response.json();
    },
  });
  
  // Fetch KYC data for selected user when needed
  const { data: kycData, isLoading: isLoadingKycData, error: kycError } = useQuery({
    queryKey: ["/api/kyc/peer-verification", selectedUserId],
    queryFn: async () => {
      if (!selectedUserId) return null;
      try {
        console.log(`Fetching KYC data for user ID: ${selectedUserId}`);
        const response = await apiRequest("GET", `/api/kyc/peer-verification/${selectedUserId}`);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response from KYC API: ${response.status}`, errorText);
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Raw KYC data received:", data);
        
        // Safe access to ensure all properties exist before using them
        if (!data) {
          console.error("Received null or undefined data from API");
          throw new Error("Invalid data received from server");
        }
        
        // Ensure all URL fields are properly defined with safer null checks
        // Fix image URLs by using absolute paths
        const ensureAbsolutePath = (url: string | null | undefined, imageType: string): string => {
          console.log(`Processing ${imageType} image URL:`, url);
          
          if (!url) {
            console.log(`${imageType} image URL is empty or undefined`);
            return "";
          }
          
          // If it's already an absolute URL (starts with http:// or https://)
          if (url.startsWith('http://') || url.startsWith('https://')) {
            console.log(`${imageType} image URL is already absolute:`, url);
            return url;
          }
          
          // If it's an absolute path (starts with /)
          if (url.startsWith('/')) {
            console.log(`${imageType} image URL is an absolute path:`, url);
            return url;
          }
          
          // Otherwise, treat as a relative path under /uploads/kyc/
          const fullPath = `/uploads/kyc/${url}`;
          console.log(`${imageType} image URL converted to:`, fullPath);
          return fullPath;
        };
        
        const safeData = {
          kycId: data.kycId || 0,
          userId: data.userId || selectedUserId,
          username: data.username || "Unknown User",
          fullName: data.fullName || "Unknown Name",
          country: data.country || "",
          documentType: data.documentType || "",
          documentId: data.documentId || "",
          submissionDate: data.submissionDate || new Date().toISOString(),
          frontImageUrl: ensureAbsolutePath(data?.frontImageUrl, "front"),
          backImageUrl: ensureAbsolutePath(data?.backImageUrl, "back"),
          selfieImageUrl: ensureAbsolutePath(data?.selfieImageUrl, "selfie"),
          taskId: data.taskId || 0
        };
        
        console.log("Enhanced KYC data with fixed URLs:", safeData);
        return safeData;
      } catch (error) {
        console.error("Error fetching KYC data:", error);
        return {
          kycId: 0,
          userId: selectedUserId,
          username: "Unknown",
          fullName: "Error loading data",
          country: "",
          documentType: "",
          documentId: "",
          submissionDate: new Date().toISOString(),
          frontImageUrl: "",
          backImageUrl: "",
          selfieImageUrl: "",
          taskId: 0
        };
      }
    },
    enabled: !!selectedUserId,
  });

  // Complete task mutation
  const completeTaskMutation = useMutation({
    mutationFn: async ({ 
      taskId, 
      status, 
      kycAction, 
      rejectionReason 
    }: { 
      taskId: number, 
      status: string, 
      kycAction?: string, 
      rejectionReason?: string 
    }) => {
      try {
        // Try using PUT method as the server logs indicate it's accepting PUT requests
        const response = await apiRequest("PUT", `/api/admin/tasks/${taskId}`, {
          status,
          kycAction,
          rejectionReason
        });
        
        // Enhanced error handling for possibly corrupted responses
        try {
          // Attempt to parse the response as JSON
          return await response.json();
        } catch (jsonError) {
          console.error("Error parsing JSON response:", jsonError);
          // If parsing fails but the request was successful, return a generic success response
          if (response.ok) {
            return { success: true, message: "Task updated successfully" };
          } else {
            throw new Error("Invalid response from server");
          }
        }
      } catch (error) {
        console.error("Error updating task:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/tasks"] });
      toast({
        title: "Success",
        description: "Task completed successfully",
      });
      // Close dialogs
      setApproveDialogOpen(false);
      setRejectDialogOpen(false);
      setSelectedTask(null);
      setRejectionReason("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete task",
        variant: "destructive",
      });
    },
  });

  const handleApproveKYC = (task: AdminTask) => {
    setSelectedTask(task);
    setApproveDialogOpen(true);
  };

  const handleRejectKYC = (task: AdminTask) => {
    setSelectedTask(task);
    setRejectDialogOpen(true);
  };

  const confirmApproveKYC = () => {
    if (!selectedTask) return;
    completeTaskMutation.mutate({
      taskId: selectedTask.id,
      status: "completed",
      kycAction: "approve"
    });
  };

  const confirmRejectKYC = () => {
    if (!selectedTask || !rejectionReason.trim()) return;
    completeTaskMutation.mutate({
      taskId: selectedTask.id,
      status: "completed",
      kycAction: "reject",
      rejectionReason: rejectionReason
    });
  };
  
  // Get the user ID from the task description (format: "user ID: 123")
  const extractUserId = (description: string): number | null => {
    if (!description) {
      console.error("Task description is empty or undefined");
      return null;
    }
    try {
      const match = description.match(/user ID: (\d+)/);
      return match ? parseInt(match[1]) : null;
    } catch (error) {
      console.error("Error extracting userId from description:", error);
      return null;
    }
  };
  
  // Handle opening the KYC document viewer
  const handleViewDocuments = (task: AdminTask) => {
    if (!task) {
      toast({
        title: "Error",
        description: "Invalid task data",
        variant: "destructive",
      });
      return;
    }
    
    try {
      if (!task.description) {
        toast({
          title: "Error",
          description: "Task missing description",
          variant: "destructive",
        });
        return;
      }
      
      const userId = extractUserId(task.description);
      if (userId) {
        // Set the selected user ID and open the dialog
        setSelectedUserId(userId);
        setDocumentDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Could not determine the user ID from task description",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error handling document view:", error);
      toast({
        title: "Error",
        description: "An error occurred while trying to view documents",
        variant: "destructive",
      });
    }
  };

  const renderPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge variant="destructive">{priority}</Badge>;
      case "medium":
        return <Badge variant="default">{priority}</Badge>;
      case "low":
        return <Badge variant="secondary">{priority}</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">{status}</Badge>;
      case "in-progress":
        return <Badge variant="secondary">{status}</Badge>;
      case "pending":
        return <Badge variant="outline">{status}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 p-4">
        Error loading tasks: {(error as Error).message}
      </div>
    );
  }

  // Filter tasks to only show KYC verification tasks
  const kycTasks = tasks?.filter((task: AdminTask) => 
    task.title.includes("KYC Verification") && task.status !== "completed"
  ) || [] as AdminTask[];

  if (kycTasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KYC Verification Tasks</CardTitle>
          <CardDescription>
            You don't have any KYC verification tasks assigned to you.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">KYC Verification Tasks</h2>
        <p className="text-muted-foreground">
          Review and verify KYC submissions from other users. You'll earn 5 TSK tokens for each verification you complete.
        </p>
      </div>
      
      {/* Verification guidelines card */}
      <Card className="bg-muted/30 border-primary/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FileText className="h-5 w-5 text-primary" />
            Verification Guidelines
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex gap-2">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium">1</span>
              </div>
              <p>Verify that the ID document belongs to the person (check name match)</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium">2</span>
              </div>
              <p>Confirm the document is valid and not expired (check dates)</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium">3</span>
              </div>
              <p>Ensure the selfie matches the ID photo (if provided)</p>
            </div>
            <div className="flex gap-2">
              <div className="flex-shrink-0 h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-medium">4</span>
              </div>
              <p>Check that all required document fields are clearly visible</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <h3 className="text-xl font-semibold mt-4">Pending Tasks ({kycTasks.length})</h3>
      
      <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {kycTasks.map((task: AdminTask) => (
          <Card key={task.id} className="flex flex-col h-full border border-muted-foreground/20 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{task.title}</CardTitle>
                <div className="flex space-x-2">
                  {renderPriorityBadge(task.priority)}
                  {renderStatusBadge(task.status)}
                </div>
              </div>
              <CardDescription>
                {task.dueDate && (
                  <span className="flex items-center gap-1 text-amber-500 dark:text-amber-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 dark:bg-amber-400"></span>
                    Due: {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow py-2">
              <div className="prose prose-sm dark:prose-invert">
                <div className="bg-muted/40 p-3 rounded-md">
                  <p>{task.description}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Assigned: {new Date(task.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-3 pt-2">
              <Button
                variant="outline" 
                size="sm"
                className="w-full border-primary/30 text-primary hover:bg-primary/10"
                onClick={() => handleViewDocuments(task)}
              >
                <Eye className="w-4 h-4 mr-2" />
                View Verification Documents
              </Button>
              <div className="flex space-x-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="w-1/2 border-red-500/30 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                  onClick={() => handleRejectKYC(task)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant="default" 
                  size="sm"
                  className="w-1/2 bg-green-600 hover:bg-green-700"
                  onClick={() => handleApproveKYC(task)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Document Viewing Dialog */}
      <Dialog open={documentDialogOpen} onOpenChange={setDocumentDialogOpen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              KYC Document Verification
            </DialogTitle>
            <DialogDescription>
              Review the submitted documents carefully before approving or rejecting.
            </DialogDescription>
          </DialogHeader>
          
          {isLoadingKycData ? (
            <div className="flex justify-center items-center flex-grow py-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : kycError ? (
            <div className="text-center text-red-500 p-4 flex-grow">
              Error loading KYC data: {kycError instanceof Error ? kycError.message : 'Unknown error'}
            </div>
          ) : kycData ? (
            <div className="flex flex-col space-y-4 overflow-y-auto flex-grow">
              <div className="grid md:grid-cols-2 gap-4 bg-muted/20 p-4 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium flex items-center">
                    <User className="h-5 w-5 text-muted-foreground mr-2" />
                    User Information
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-muted-foreground text-sm">Username:</span>
                      <p className="font-medium">{kycData.username}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Full Name:</span>
                      <p className="font-medium">{kycData.fullName}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Country:</span>
                      <p className="font-medium">{kycData.country}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium flex items-center">
                    <FileText className="h-5 w-5 text-muted-foreground mr-2" />
                    Document Details
                  </h3>
                  <div className="mt-2 space-y-2">
                    <div>
                      <span className="text-muted-foreground text-sm">Document Type:</span>
                      <p className="font-medium capitalize">{kycData.documentType?.replace('_', ' ') || 'Not specified'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Document ID:</span>
                      <p className="font-medium">{kycData.documentId || 'Not provided'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-sm">Submitted:</span>
                      <p className="font-medium">{new Date(kycData.submissionDate).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted/10 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2 flex items-center">
                  <Image className="h-5 w-5 mr-2 text-primary" />
                  Verification Checklist
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-start space-x-2">
                    <div className="h-5 w-5 rounded-full border border-green-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-500">✓</span>
                    </div>
                    <span className="text-sm">Confirm full name matches records</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="h-5 w-5 rounded-full border border-green-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-500">✓</span>
                    </div>
                    <span className="text-sm">Verify document is not expired</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="h-5 w-5 rounded-full border border-green-500 flex items-center justify-center">
                      <span className="text-xs font-bold text-green-500">✓</span>
                    </div>
                    <span className="text-sm">Ensure selfie matches ID photo</span>
                  </div>
                </div>
              </div>
              
              {/* Document Images */}
              <Tabs defaultValue="front" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="front" className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    ID Front
                  </TabsTrigger>
                  <TabsTrigger 
                    value="back" 
                    disabled={!kycData?.backImageUrl || kycData.backImageUrl.length === 0} 
                    className="flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    ID Back
                  </TabsTrigger>
                  <TabsTrigger 
                    value="selfie" 
                    disabled={!kycData?.selfieImageUrl || kycData.selfieImageUrl.length === 0} 
                    className="flex items-center gap-1"
                  >
                    <User className="h-4 w-4" />
                    Selfie
                  </TabsTrigger>
                </TabsList>
                
                {/* Front Image Tab */}
                <TabsContent value="front" className="mt-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-muted/20 px-4 py-2 rounded-t-lg w-full flex justify-between items-center">
                      <h3 className="text-base font-medium">Front of ID Document</h3>
                      <span className="text-xs text-muted-foreground">Check for tampering or editing</span>
                    </div>
                    {kycData && 
                     typeof kycData === 'object' && 
                     kycData.frontImageUrl && 
                     typeof kycData.frontImageUrl === 'string' && 
                     kycData.frontImageUrl.length > 0 ? (
                      <div className="relative border border-t-0 rounded-b-lg overflow-hidden max-w-full max-h-[500px] w-full">
                        <div className="bg-grid-pattern" style={{backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)"}}>
                          {/* Debug overlay */}
                          <div className="text-xs text-muted-foreground bg-black/5 p-1 absolute top-0 right-0 z-10">
                            URL: {kycData.frontImageUrl}
                          </div>
                          <div className="relative min-h-[300px]">
                            <img
                              src={kycData.frontImageUrl}
                              alt="Front of ID Document"
                              className="max-h-[500px] w-full object-contain"
                              onError={(e) => {
                                console.error("Error loading front image:", e);
                                const target = e.target as HTMLImageElement;
                                if (target) target.style.display = 'none';
                                
                                // Create error message
                                const parent = target.parentElement;
                                if (parent) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = "flex flex-col items-center justify-center p-8 text-center";
                                  errorDiv.innerHTML = `
                                    <div class="text-amber-500 mb-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                      </svg>
                                    </div>
                                    <h3 class="text-lg font-medium">Image Not Found</h3>
                                    <p class="text-muted-foreground mt-1">The document image could not be loaded.</p>
                                    <p class="text-xs text-muted-foreground mt-4">You can still approve or reject this KYC based on other information.</p>
                                  `;
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-muted rounded-lg w-full">
                        <p>No front image available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Back Image Tab */}
                <TabsContent value="back" className="mt-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-muted/20 px-4 py-2 rounded-t-lg w-full flex justify-between items-center">
                      <h3 className="text-base font-medium">Back of ID Document</h3>
                      <span className="text-xs text-muted-foreground">Check for security features and details</span>
                    </div>
                    {kycData && 
                     typeof kycData === 'object' && 
                     kycData.backImageUrl && 
                     typeof kycData.backImageUrl === 'string' && 
                     kycData.backImageUrl.length > 0 ? (
                      <div className="relative border border-t-0 rounded-b-lg overflow-hidden max-w-full max-h-[500px] w-full">
                        <div className="bg-grid-pattern" style={{backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)"}}>
                          {/* Debug overlay */}
                          <div className="text-xs text-muted-foreground bg-black/5 p-1 absolute top-0 right-0 z-10">
                            URL: {kycData.backImageUrl}
                          </div>
                          <div className="relative min-h-[300px]">
                            <img
                              src={kycData.backImageUrl}
                              alt="Back of ID Document"
                              className="max-h-[500px] w-full object-contain"
                              onError={(e) => {
                                console.error("Error loading back image:", e);
                                const target = e.target as HTMLImageElement;
                                if (target) target.style.display = 'none';
                                
                                // Create error message
                                const parent = target.parentElement;
                                if (parent) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = "flex flex-col items-center justify-center p-8 text-center";
                                  errorDiv.innerHTML = `
                                    <div class="text-amber-500 mb-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                      </svg>
                                    </div>
                                    <h3 class="text-lg font-medium">Image Not Found</h3>
                                    <p class="text-muted-foreground mt-1">The document image could not be loaded.</p>
                                    <p class="text-xs text-muted-foreground mt-4">You can still approve or reject this KYC based on other information.</p>
                                  `;
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-muted rounded-lg w-full">
                        <p>No back image available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                {/* Selfie Image Tab */}
                <TabsContent value="selfie" className="mt-4">
                  <div className="flex flex-col items-center">
                    <div className="bg-muted/20 px-4 py-2 rounded-t-lg w-full flex justify-between items-center">
                      <h3 className="text-base font-medium">Selfie with ID Document</h3>
                      <span className="text-xs text-muted-foreground">Compare with ID photo to confirm identity</span>
                    </div>
                    {kycData && 
                     typeof kycData === 'object' && 
                     kycData.selfieImageUrl && 
                     typeof kycData.selfieImageUrl === 'string' && 
                     kycData.selfieImageUrl.length > 0 ? (
                      <div className="relative border border-t-0 rounded-b-lg overflow-hidden max-w-full max-h-[500px] w-full">
                        <div className="bg-grid-pattern" style={{backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)"}}>
                          {/* Debug overlay */}
                          <div className="text-xs text-muted-foreground bg-black/5 p-1 absolute top-0 right-0 z-10">
                            URL: {kycData.selfieImageUrl}
                          </div>
                          <div className="relative min-h-[300px]">
                            <img
                              src={kycData.selfieImageUrl}
                              alt="Selfie with ID Document"
                              className="max-h-[500px] w-full object-contain"
                              onError={(e) => {
                                console.error("Error loading selfie image:", e);
                                const target = e.target as HTMLImageElement;
                                if (target) target.style.display = 'none';
                                
                                // Create error message
                                const parent = target.parentElement;
                                if (parent) {
                                  const errorDiv = document.createElement('div');
                                  errorDiv.className = "flex flex-col items-center justify-center p-8 text-center";
                                  errorDiv.innerHTML = `
                                    <div class="text-amber-500 mb-2">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="mx-auto mb-2">
                                        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                                        <line x1="12" y1="9" x2="12" y2="13"></line>
                                        <line x1="12" y1="17" x2="12.01" y2="17"></line>
                                      </svg>
                                    </div>
                                    <h3 class="text-lg font-medium">Image Not Found</h3>
                                    <p class="text-muted-foreground mt-1">The selfie image could not be loaded.</p>
                                    <p class="text-xs text-muted-foreground mt-4">You can still approve or reject this KYC based on other information.</p>
                                  `;
                                  parent.appendChild(errorDiv);
                                }
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center p-8 bg-muted rounded-lg w-full">
                        <p>No selfie image available</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="text-center p-8 bg-muted rounded-lg">
              <p>Failed to load KYC document data. Please try again.</p>
            </div>
          )}

          <DialogFooter className="pt-4 space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setDocumentDialogOpen(false);
                setSelectedUserId(null);
              }}
            >
              Close
            </Button>
            
            {/* Only show action buttons if we have valid KYC data */}
            {kycData && typeof kycData === 'object' && kycData.userId && (
              <>
                <Button 
                  variant="destructive"
                  onClick={() => {
                    try {
                      setDocumentDialogOpen(false);
                      
                      // Find the task matching this KYC - much safer implementation
                      if (!Array.isArray(kycTasks)) {
                        throw new Error("Task data is invalid");
                      }
                      
                      const userId = kycData.userId;
                      if (typeof userId === 'undefined' || userId === null) {
                        throw new Error("User ID is missing in KYC data");
                      }
                      
                      // Find matching task with safe checks
                      const matchingTask = kycTasks.find(task => {
                        if (!task || typeof task !== 'object') return false;
                        if (!task.description) return false;
                        const taskUserId = extractUserId(task.description);
                        return taskUserId === userId;
                      });
                      
                      if (matchingTask) {
                        setSelectedTask(matchingTask);
                        setRejectDialogOpen(true);
                      } else {
                        toast({
                          title: "Task Not Found",
                          description: "Could not find matching task for this user",
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      console.error("Error in reject handler:", error);
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "An error occurred",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                
                <Button 
                  variant="default"
                  onClick={() => {
                    try {
                      setDocumentDialogOpen(false);
                      
                      // Find the task matching this KYC - much safer implementation
                      if (!Array.isArray(kycTasks)) {
                        throw new Error("Task data is invalid");
                      }
                      
                      const userId = kycData.userId;
                      if (typeof userId === 'undefined' || userId === null) {
                        throw new Error("User ID is missing in KYC data");
                      }
                      
                      // Find matching task with safe checks
                      const matchingTask = kycTasks.find(task => {
                        if (!task || typeof task !== 'object') return false;
                        if (!task.description) return false;
                        const taskUserId = extractUserId(task.description);
                        return taskUserId === userId;
                      });
                      
                      if (matchingTask) {
                        setSelectedTask(matchingTask);
                        setApproveDialogOpen(true);
                      } else {
                        toast({
                          title: "Task Not Found",
                          description: "Could not find matching task for this user",
                          variant: "destructive"
                        });
                      }
                    } catch (error) {
                      console.error("Error in approve handler:", error);
                      toast({
                        title: "Error",
                        description: error instanceof Error ? error.message : "An error occurred",
                        variant: "destructive"
                      });
                    }
                  }}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Approve KYC Dialog */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <CheckCircle className="h-5 w-5" />
              Approve KYC Verification
            </DialogTitle>
            <DialogDescription>
              By approving this KYC submission, you confirm all documents are valid and the information is correct.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md p-4">
              <h4 className="text-sm font-medium text-green-800 dark:text-green-400 mb-2">Verification Confirmation</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>All documents are clear, legible, and valid</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>User identity has been confirmed via selfie matching ID photo</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Document information is consistent with the user's submitted details</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>No signs of document tampering or manipulation detected</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-muted/30 p-3 rounded-md">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This approval will allow the user to access platform features requiring KYC verification. You'll receive 5 TSK tokens as a reward for this verification.
              </p>
            </div>
          </div>
          
          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setApproveDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={completeTaskMutation.isPending}
              onClick={confirmApproveKYC}
              className="bg-green-600 hover:bg-green-700"
            >
              {completeTaskMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reject KYC Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <XCircle className="h-5 w-5" />
              Reject KYC Verification
            </DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this KYC submission. The user will be notified and asked to resubmit.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <h4 className="text-sm font-medium text-red-800 dark:text-red-400 mb-2">Rejection Reasons</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Documents are unclear, illegible, or invalid</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Selfie doesn't match the ID photo or is missing</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Document information doesn't match the submitted details</span>
                </li>
                <li className="flex items-start">
                  <XCircle className="h-4 w-4 text-red-600 dark:text-red-500 mt-0.5 mr-2 flex-shrink-0" />
                  <span>Signs of document tampering or manipulation detected</span>
                </li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rejection-reason">Rejection Reason</Label>
              <Textarea
                id="rejection-reason"
                placeholder="Please explain why you're rejecting this KYC submission..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              />
            </div>
          </div>
          
          <DialogFooter className="space-x-2">
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={completeTaskMutation.isPending || !rejectionReason.trim()}
              onClick={confirmRejectKYC}
            >
              {completeTaskMutation.isPending && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
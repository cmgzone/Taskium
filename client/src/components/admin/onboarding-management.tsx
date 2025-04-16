import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { TableHead, TableRow, TableHeader, TableCell, TableBody, Table } from "@/components/ui/table";
import { Check, ChevronRight, Edit, Eye, Loader2, Plus, Trash2, MoveVertical, ArrowUpDown } from "lucide-react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Define types for the learning paths and steps
interface LearningPath {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTimeMinutes: number;
  imageUrl?: string;
  videoUrl?: string;
  active: boolean;
  feature?: string;
  prerequisites?: string[];
  createdAt: string;
  updatedAt: string;
}

interface LearningStep {
  id: number;
  pathId: number;
  title: string;
  description: string;
  content: string;
  mediaType?: string;
  mediaUrl?: string;
  orderIndex: number;
  estimatedTimeMinutes: number;
  createdAt: string;
  updatedAt: string;
}

interface UserProgress {
  userId: number;
  pathId: number;
  isCompleted: boolean;
  completedSteps: number[];
  startedAt: string;
  completedAt?: string;
  lastActivityAt: string;
  lastStepCompleted?: number;
}

interface UserInteraction {
  id: number;
  userId: number;
  interactionType: string;
  featureName: string;
  metadata: Record<string, any>;
  createdAt: string;
}

// Schema for learning path form
const learningPathSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  category: z.string().min(1, "Category is required"),
  difficulty: z.string(),
  estimatedTimeMinutes: z.number().min(1, "Estimated time must be at least 1 minute"),
  imageUrl: z.string().optional(),
  videoUrl: z.string().optional(),
  active: z.boolean().default(true),
  feature: z.string().optional(),
  prerequisites: z.array(z.string()).optional()
});

// Schema for learning step form
const learningStepSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters long"),
  content: z.string().min(20, "Content must be at least 20 characters long"),
  mediaType: z.string().optional(),
  mediaUrl: z.string().optional(),
  estimatedTimeMinutes: z.number().min(1, "Estimated time must be at least 1 minute"),
});

export default function OnboardingManagement() {
  const [activeTab, setActiveTab] = useState<string>("paths");
  const [selectedPathId, setSelectedPathId] = useState<number | null>(null);
  const [showPathForm, setShowPathForm] = useState<boolean>(false);
  const [showStepForm, setShowStepForm] = useState<boolean>(false);
  const [editingPath, setEditingPath] = useState<LearningPath | null>(null);
  const [editingStep, setEditingStep] = useState<LearningStep | null>(null);
  const [deletePathDialog, setDeletePathDialog] = useState<boolean>(false);
  const [deleteStepDialog, setDeleteStepDialog] = useState<boolean>(false);
  const [showReorderDialog, setShowReorderDialog] = useState<boolean>(false);
  const [stepsToReorder, setStepsToReorder] = useState<LearningStep[]>([]);
  const { toast } = useToast();
  
  // Query for fetching all learning paths
  const { data: learningPaths = [], isLoading: pathsLoading, refetch: refetchPaths } = useQuery<LearningPath[]>({
    queryKey: ["/api/learning-paths"],
    refetchOnWindowFocus: false,
  });
  
  // Query for fetching steps for the selected path
  const { data: learningSteps = [], isLoading: stepsLoading, refetch: refetchSteps } = useQuery<LearningStep[]>({
    queryKey: ["/api/learning-paths", selectedPathId, "steps"],
    queryFn: async () => {
      if (!selectedPathId) return [];
      const res = await fetch(`/api/learning-paths/${selectedPathId}/steps`);
      return res.json();
    },
    enabled: !!selectedPathId,
    refetchOnWindowFocus: false,
  });
  
  // Initialize the selected path to the first one when data loads
  useEffect(() => {
    if (learningPaths.length > 0 && !selectedPathId) {
      setSelectedPathId(learningPaths[0].id);
    }
  }, [learningPaths, selectedPathId]);
  
  // Form for creating/editing learning paths
  const pathForm = useForm<z.infer<typeof learningPathSchema>>({
    resolver: zodResolver(learningPathSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      difficulty: "beginner",
      estimatedTimeMinutes: 15,
      active: true,
      prerequisites: []
    }
  });
  
  // Form for creating/editing learning steps
  const stepForm = useForm<z.infer<typeof learningStepSchema>>({
    resolver: zodResolver(learningStepSchema),
    defaultValues: {
      title: "",
      description: "",
      content: "",
      mediaType: "none",
      mediaUrl: "",
      estimatedTimeMinutes: 5
    }
  });
  
  // Set up forms when editing
  useEffect(() => {
    if (editingPath) {
      pathForm.reset({
        title: editingPath.title,
        description: editingPath.description,
        category: editingPath.category,
        difficulty: editingPath.difficulty,
        estimatedTimeMinutes: editingPath.estimatedTimeMinutes,
        imageUrl: editingPath.imageUrl || "",
        videoUrl: editingPath.videoUrl || "",
        active: editingPath.active,
        feature: editingPath.feature || "",
        prerequisites: editingPath.prerequisites || []
      });
    }
  }, [editingPath, pathForm]);
  
  useEffect(() => {
    if (editingStep) {
      stepForm.reset({
        title: editingStep.title,
        description: editingStep.description,
        content: editingStep.content,
        mediaType: editingStep.mediaType || "none",
        mediaUrl: editingStep.mediaUrl || "",
        estimatedTimeMinutes: editingStep.estimatedTimeMinutes
      });
    }
  }, [editingStep, stepForm]);
  
  // Mutations for learning paths
  const createPathMutation = useMutation({
    mutationFn: async (data: z.infer<typeof learningPathSchema>) => {
      const res = await apiRequest("POST", "/api/admin/learning-paths", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning path created successfully",
      });
      setShowPathForm(false);
      pathForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/learning-paths"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create learning path: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updatePathMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof learningPathSchema> }) => {
      const res = await apiRequest("PUT", `/api/admin/learning-paths/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning path updated successfully",
      });
      setShowPathForm(false);
      setEditingPath(null);
      pathForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/learning-paths"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update learning path: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deletePathMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/learning-paths/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning path deleted successfully",
      });
      setDeletePathDialog(false);
      setSelectedPathId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/learning-paths"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete learning path: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Mutations for learning steps
  const createStepMutation = useMutation({
    mutationFn: async ({ pathId, data }: { pathId: number; data: z.infer<typeof learningStepSchema> }) => {
      const res = await apiRequest("POST", `/api/admin/learning-paths/${pathId}/steps`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning step created successfully",
      });
      setShowStepForm(false);
      stepForm.reset();
      refetchSteps();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to create learning step: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const updateStepMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof learningStepSchema> }) => {
      const res = await apiRequest("PUT", `/api/admin/learning-steps/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning step updated successfully",
      });
      setShowStepForm(false);
      setEditingStep(null);
      stepForm.reset();
      refetchSteps();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to update learning step: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const deleteStepMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/learning-steps/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Learning step deleted successfully",
      });
      setDeleteStepDialog(false);
      setEditingStep(null);
      refetchSteps();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to delete learning step: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const reorderStepsMutation = useMutation({
    mutationFn: async ({ pathId, orderedIds }: { pathId: number; orderedIds: number[] }) => {
      const res = await apiRequest("POST", `/api/admin/learning-paths/${pathId}/reorder-steps`, { orderedIds });
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Steps reordered successfully",
      });
      setShowReorderDialog(false);
      refetchSteps();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to reorder steps: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Form handlers
  const onSubmitPath = (data: z.infer<typeof learningPathSchema>) => {
    if (editingPath) {
      updatePathMutation.mutate({ id: editingPath.id, data });
    } else {
      createPathMutation.mutate(data);
    }
  };
  
  const onSubmitStep = (data: z.infer<typeof learningStepSchema>) => {
    if (editingStep) {
      updateStepMutation.mutate({ id: editingStep.id, data });
    } else if (selectedPathId) {
      createStepMutation.mutate({ pathId: selectedPathId, data });
    }
  };
  
  // Helper to open the edit path dialog
  const openEditPathDialog = (path: LearningPath) => {
    setEditingPath(path);
    setShowPathForm(true);
  };
  
  // Helper to open the edit step dialog
  const openEditStepDialog = (step: LearningStep) => {
    setEditingStep(step);
    setShowStepForm(true);
  };
  
  // Helper to open the delete path dialog
  const openDeletePathDialog = (path: LearningPath) => {
    setEditingPath(path);
    setDeletePathDialog(true);
  };
  
  // Helper to open the delete step dialog
  const openDeleteStepDialog = (step: LearningStep) => {
    setEditingStep(step);
    setDeleteStepDialog(true);
  };
  
  // Helper to open the reorder steps dialog
  const openReorderDialog = () => {
    if (learningSteps.length > 0) {
      setStepsToReorder([...learningSteps].sort((a, b) => a.orderIndex - b.orderIndex));
      setShowReorderDialog(true);
    } else {
      toast({
        title: "Cannot reorder",
        description: "There are no steps to reorder",
        variant: "destructive",
      });
    }
  };
  
  // Helper to move a step up or down in the reorder list
  const moveStep = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === stepsToReorder.length - 1)
    ) {
      return;
    }
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newSteps = [...stepsToReorder];
    const temp = newSteps[index];
    newSteps[index] = newSteps[newIndex];
    newSteps[newIndex] = temp;
    
    setStepsToReorder(newSteps);
  };
  
  // Helper to save the reordered steps
  const saveReorderedSteps = () => {
    if (selectedPathId) {
      reorderStepsMutation.mutate({ 
        pathId: selectedPathId, 
        orderedIds: stepsToReorder.map(step => step.id) 
      });
    }
  };
  
  // Helper functions to render UI elements
  const renderPathsList = () => {
    if (pathsLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      );
    }
    
    if (learningPaths.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No learning paths available. Create your first one!</p>
          <Button onClick={() => { setEditingPath(null); setShowPathForm(true); }} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Create Learning Path
          </Button>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {learningPaths.map(path => (
          <Card 
            key={path.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${selectedPathId === path.id ? 'border-primary' : ''}`}
            onClick={() => setSelectedPathId(path.id)}
          >
            <CardHeader className="pb-2">
              <div className="flex justify-between">
                <CardTitle>{path.title}</CardTitle>
                <div className="flex space-x-1">
                  {!path.active && <Badge variant="secondary">Inactive</Badge>}
                  <Badge>{path.difficulty}</Badge>
                </div>
              </div>
              <CardDescription>{path.category}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="line-clamp-2 text-sm">{path.description}</p>
              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <Clock className="mr-1 h-4 w-4" />
                {path.estimatedTimeMinutes} min
                {path.feature && (
                  <>
                    <span className="mx-2">•</span>
                    <Badge variant="outline">{path.feature}</Badge>
                  </>
                )}
              </div>
            </CardContent>
            <CardFooter className="pt-2 flex justify-between">
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openEditPathDialog(path); }}>
                <Edit className="h-4 w-4 mr-1" /> Edit
              </Button>
              <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openDeletePathDialog(path); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };
  
  const renderStepsList = () => {
    if (!selectedPathId) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">Please select a learning path first</p>
        </div>
      );
    }
    
    if (stepsLoading) {
      return (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
        </div>
      );
    }
    
    if (learningSteps.length === 0) {
      return (
        <div className="py-8 text-center">
          <p className="text-muted-foreground">No steps in this learning path. Add your first step!</p>
          <Button onClick={() => { setEditingStep(null); setShowStepForm(true); }} className="mt-4">
            <Plus className="mr-2 h-4 w-4" /> Add Step
          </Button>
        </div>
      );
    }
    
    const sortedSteps = [...learningSteps].sort((a, b) => a.orderIndex - b.orderIndex);
    
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-medium">
            Steps for: {learningPaths.find(p => p.id === selectedPathId)?.title}
          </h3>
          <div className="space-x-2">
            <Button variant="outline" onClick={openReorderDialog}>
              <ArrowUpDown className="h-4 w-4 mr-2" /> Reorder Steps
            </Button>
            <Button onClick={() => { setEditingStep(null); setShowStepForm(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Add Step
            </Button>
          </div>
        </div>
        
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedSteps.map((step, index) => (
              <TableRow key={step.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{step.title}</TableCell>
                <TableCell className="max-w-md">
                  <div className="line-clamp-2">{step.description}</div>
                </TableCell>
                <TableCell>{step.estimatedTimeMinutes} min</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openEditStepDialog(step)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openDeleteStepDialog(step)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };
  
  // Render analytics tab content
  const renderAnalytics = () => {
    return (
      <div className="space-y-6">
        <div className="bg-muted/40 p-6 rounded-lg">
          <h3 className="text-lg font-medium mb-4">Analytics Dashboard</h3>
          <p className="text-muted-foreground">
            This section will display analytics for the onboarding process, including path completion rates, 
            user engagement metrics, and personalized recommendations performance.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Average Completion Rate</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Coming Soon</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Most Popular Path</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Coming Soon</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Avg. Completion Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">Coming Soon</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold tracking-tight">Onboarding Management</h2>
        {activeTab === "paths" && (
          <Button onClick={() => { setEditingPath(null); setShowPathForm(true); }}>
            <Plus className="mr-2 h-4 w-4" /> Create Learning Path
          </Button>
        )}
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="paths">Learning Paths</TabsTrigger>
          <TabsTrigger value="steps">Learning Steps</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="paths" className="space-y-4">
          {renderPathsList()}
        </TabsContent>
        
        <TabsContent value="steps" className="space-y-4">
          {renderStepsList()}
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          {renderAnalytics()}
        </TabsContent>
      </Tabs>
      
      {/* Learning Path Form Dialog */}
      <Dialog open={showPathForm} onOpenChange={setShowPathForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>{editingPath ? 'Edit Learning Path' : 'Create Learning Path'}</DialogTitle>
            <DialogDescription>
              {editingPath 
                ? 'Update the details of this learning path.' 
                : 'Add a new learning path to the onboarding process.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...pathForm}>
            <form onSubmit={pathForm.handleSubmit(onSubmitPath)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={pathForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Getting Started" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={pathForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <FormControl>
                        <Input placeholder="Basics, Advanced, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={pathForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of this learning path" 
                        className="min-h-24"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={pathForm.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select difficulty" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={pathForm.control}
                  name="estimatedTimeMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Time (minutes)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={pathForm.control}
                  name="active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between space-x-2 space-y-0 rounded-md border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Active
                        </FormLabel>
                        <FormDescription>
                          Make this path visible to users
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={pathForm.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Image URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/image.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL to an image representing this path
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={pathForm.control}
                  name="videoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Video URL (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/video.mp4" {...field} />
                      </FormControl>
                      <FormDescription>
                        URL to a video for this path
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={pathForm.control}
                name="feature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Feature (optional)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a feature" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        <SelectItem value="mining">Mining</SelectItem>
                        <SelectItem value="marketplace">Marketplace</SelectItem>
                        <SelectItem value="wallet">Wallet</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="referrals">Referrals</SelectItem>
                        <SelectItem value="kyc">KYC</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Associate this path with a specific platform feature
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowPathForm(false);
                    setEditingPath(null);
                    pathForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={pathForm.formState.isSubmitting || createPathMutation.isPending || updatePathMutation.isPending}
                >
                  {(pathForm.formState.isSubmitting || createPathMutation.isPending || updatePathMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingPath ? 'Save Changes' : 'Create Path'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Learning Step Form Dialog */}
      <Dialog open={showStepForm} onOpenChange={setShowStepForm}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>{editingStep ? 'Edit Learning Step' : 'Create Learning Step'}</DialogTitle>
            <DialogDescription>
              {editingStep 
                ? 'Update the details of this learning step.' 
                : 'Add a new step to this learning path.'}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...stepForm}>
            <form onSubmit={stepForm.handleSubmit(onSubmitStep)} className="space-y-4">
              <FormField
                control={stepForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Introduction to Mining" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={stepForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="A brief description of this step" 
                        className="min-h-16"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={stepForm.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="The main content for this step. Can include markdown formatting." 
                        className="min-h-32"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={stepForm.control}
                  name="mediaType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media Type</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select media type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="embed">Embed (iframe)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={stepForm.control}
                  name="mediaUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Media URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/media.jpg" 
                          {...field}
                          disabled={stepForm.watch("mediaType") === "none"}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={stepForm.control}
                name="estimatedTimeMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Estimated Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setShowStepForm(false);
                    setEditingStep(null);
                    stepForm.reset();
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={stepForm.formState.isSubmitting || createStepMutation.isPending || updateStepMutation.isPending}
                >
                  {(stepForm.formState.isSubmitting || createStepMutation.isPending || updateStepMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {editingStep ? 'Save Changes' : 'Create Step'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Path Confirmation Dialog */}
      <Dialog open={deletePathDialog} onOpenChange={setDeletePathDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Delete Learning Path</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the learning path "{editingPath?.title}"? 
              This action cannot be undone and will also delete all associated steps.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletePathDialog(false);
                setEditingPath(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingPath && deletePathMutation.mutate(editingPath.id)}
              disabled={deletePathMutation.isPending}
            >
              {deletePathMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Step Confirmation Dialog */}
      <Dialog open={deleteStepDialog} onOpenChange={setDeleteStepDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Delete Learning Step</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the step "{editingStep?.title}"? 
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteStepDialog(false);
                setEditingStep(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => editingStep && deleteStepMutation.mutate(editingStep.id)}
              disabled={deleteStepMutation.isPending}
            >
              {deleteStepMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Reorder Steps Dialog */}
      <Dialog open={showReorderDialog} onOpenChange={setShowReorderDialog}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto z-[100]">
          <DialogHeader>
            <DialogTitle>Reorder Learning Steps</DialogTitle>
            <DialogDescription>
              Drag steps or use the buttons to reorder them.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 my-4">
            {stepsToReorder.map((step, index) => (
              <div key={step.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                <div className="flex items-center">
                  <span className="font-mono text-sm w-6 text-center">{index + 1}</span>
                  <span className="ml-3 font-medium">{step.title}</span>
                </div>
                <div className="flex space-x-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={index === 0}
                    onClick={() => moveStep(index, 'up')}
                  >
                    <ChevronUp className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    disabled={index === stepsToReorder.length - 1}
                    onClick={() => moveStep(index, 'down')}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowReorderDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={saveReorderedSteps}
              disabled={reorderStepsMutation.isPending}
            >
              {reorderStepsMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Missing imports
import { ChevronUp, ChevronDown, Clock } from "lucide-react";
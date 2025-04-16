import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Button 
} from "@/components/ui/button";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { 
  Progress 
} from "@/components/ui/progress";
import { 
  Badge 
} from "@/components/ui/badge";
import {
  Separator
} from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Check, 
  CheckCircle,
  ChevronRight, 
  ArrowRight, 
  Clock, 
  Star, 
  Zap, 
  Award, 
  Book, 
  BookOpen, 
  Loader2, 
  ShoppingCart, 
  Wallet, 
  Users, 
  Database,
  Brain,
  Target,
  LightbulbIcon,
  Settings,
  HelpCircle,
  AlertTriangle,
  BookmarkIcon,
  Sparkles,
  Rocket,
  ThumbsUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";

// Define types for our onboarding data
interface LearningPath {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  estimatedTimeMinutes?: number;
  requiredForFeatures?: string[];
  active: boolean;
  priority: number;
  createdAt: string;
  updatedAt: string;
}

interface LearningStep {
  id: number;
  pathId: number;
  title: string;
  description: string;
  content: string;
  orderIndex: number;
  estimatedTimeMinutes?: number;
  isRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

interface UserProgress {
  id: number;
  userId: number;
  pathId: number;
  lastStepCompleted?: number;
  isCompleted: boolean;
  completedAt?: string;
  startedAt: string;
  lastActivityAt: string;
  completedSteps: number[];
}

interface OnboardingPreferences {
  id: number;
  userId: number;
  interests: string[];
  experienceLevel: string;
  learningStyle?: string;
  disableOnboarding: boolean;
  createdAt: string;
  updatedAt: string;
}

interface NextStep {
  pathId: number;
  stepId: number;
  reason: string;
}

interface FeatureDescription {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
}

// Available features for selection in the interests step
const availableFeatures: FeatureDescription[] = [
  { 
    id: "mining", 
    name: "Token Mining", 
    description: "Learn how to mine TSK tokens and maximize your earnings through daily activities", 
    icon: <Zap className="h-5 w-5 text-amber-500" /> 
  },
  { 
    id: "wallet", 
    name: "Wallet Management", 
    description: "Set up your blockchain wallet and learn to manage your tokens securely", 
    icon: <Wallet className="h-5 w-5 text-blue-500" /> 
  },
  { 
    id: "marketplace", 
    name: "Marketplace", 
    description: "Buy and sell items using TSK tokens in our decentralized marketplace", 
    icon: <ShoppingCart className="h-5 w-5 text-green-500" /> 
  },
  { 
    id: "referral", 
    name: "Referral Program", 
    description: "Invite friends and earn rewards for growing the TSK community", 
    icon: <Users className="h-5 w-5 text-purple-500" /> 
  },
  { 
    id: "premium", 
    name: "Premium Features", 
    description: "Discover premium packages that boost your mining rate and unlock exclusive perks", 
    icon: <Award className="h-5 w-5 text-rose-500" /> 
  },
  { 
    id: "blockchain", 
    name: "Blockchain Basics", 
    description: "Understand the fundamentals of blockchain technology powering the TSK platform", 
    icon: <Database className="h-5 w-5 text-cyan-500" /> 
  },
];

// Learning style options
const learningStyles = [
  { 
    value: "visual", 
    label: "Visual Learner", 
    description: "You learn best through images, videos, and diagrams", 
    icon: <BookOpen className="h-5 w-5" />
  },
  { 
    value: "reading", 
    label: "Reading/Writing", 
    description: "You prefer learning through text-based explanations and articles", 
    icon: <Book className="h-5 w-5" />
  },
  { 
    value: "interactive", 
    label: "Interactive Learner", 
    description: "You learn best by doing exercises and engaging with content", 
    icon: <Zap className="h-5 w-5" />
  },
  { 
    value: "social", 
    label: "Social Learner", 
    description: "You enjoy learning in groups and through discussion", 
    icon: <Users className="h-5 w-5" />
  },
];

// Experience level options
const experienceLevels = [
  { 
    value: "beginner", 
    label: "Beginner", 
    description: "New to cryptocurrency and blockchain technology", 
    icon: <BookmarkIcon className="h-5 w-5" />
  },
  { 
    value: "intermediate", 
    label: "Intermediate", 
    description: "Familiar with basic concepts and have some experience", 
    icon: <Rocket className="h-5 w-5" />
  },
  { 
    value: "advanced", 
    label: "Advanced", 
    description: "Experienced with blockchain technology and cryptocurrencies", 
    icon: <Sparkles className="h-5 w-5" />
  },
];

export default function AdaptiveLearningWizard({ 
  onComplete 
}: { 
  onComplete: () => void 
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for the wizard
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedExperience, setSelectedExperience] = useState<string>("beginner");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<string | null>(null);
  const [currentPathId, setCurrentPathId] = useState<number | null>(null);
  const [currentStepId, setCurrentStepId] = useState<number | null>(null);
  const [completedPaths, setCompletedPaths] = useState<number[]>([]);
  const [skippedPaths, setSkippedPaths] = useState<number[]>([]);
  const [wizardProgress, setWizardProgress] = useState<number>(0);
  const [activePathTab, setActivePathTab] = useState<string>("all");
  const [showHelpDialog, setShowHelpDialog] = useState<boolean>(false);
  
  // Fetch user's onboarding preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<OnboardingPreferences>({
    queryKey: ["/api/user/onboarding-preferences"],
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
  
  // Fetch recommended learning paths
  const { data: recommendedPaths = [], isLoading: pathsLoading } = useQuery<LearningPath[]>({
    queryKey: ["/api/user/recommended-paths"],
    enabled: !!user && (currentStep === 3 || currentStep === 4),
    refetchOnWindowFocus: false,
  });
  
  // Fetch suggested next steps
  const { data: nextSteps = [], isLoading: nextStepsLoading } = useQuery<NextStep[]>({
    queryKey: ["/api/user/suggested-next-steps"],
    enabled: !!user && currentStep === 4,
    refetchOnWindowFocus: false,
  });
  
  // Fetch user's progress
  const { data: allProgress = [], isLoading: progressLoading } = useQuery<UserProgress[]>({
    queryKey: ["/api/user/progress"],
    enabled: !!user && (currentStep === 3 || currentStep === 4),
    refetchOnWindowFocus: false,
  });
  
  // Fetch steps for current learning path
  const { data: currentPathSteps = [], isLoading: stepsLoading } = useQuery<LearningStep[]>({
    queryKey: ["/api/learning-paths", currentPathId, "steps"],
    enabled: !!currentPathId,
    refetchOnWindowFocus: false,
  });
  
  // Fetch user progress for current path
  const { data: currentPathProgress, isLoading: currentProgressLoading } = useQuery<UserProgress>({
    queryKey: ["/api/user/progress", currentPathId],
    enabled: !!currentPathId,
    refetchOnWindowFocus: false,
  });
  
  // Save onboarding preferences mutation
  const savePreferencesMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingPreferences>) => {
      // Check if preferences exist already
      if (preferences) {
        const res = await apiRequest("PUT", "/api/user/onboarding-preferences", data);
        return res.json();
      } else {
        const res = await apiRequest("POST", "/api/user/onboarding-preferences", data);
        return res.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/onboarding-preferences"] });
      
      // If we're saving initial preferences, move to the next step
      if (currentStep < 3) {
        setCurrentStep(prevStep => prevStep + 1);
        setWizardProgress(((currentStep + 2) / 5) * 100);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to save preferences: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Start a learning path mutation
  const startPathMutation = useMutation({
    mutationFn: async (pathId: number) => {
      const res = await apiRequest("POST", `/api/user/progress/${pathId}/start`);
      return res.json();
    },
    onSuccess: (data, pathId) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress", pathId] });
      
      // If we're in the path selection step, move to content view
      if (currentStep === 3) {
        setCurrentStep(4);
        setWizardProgress(80);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to start learning path: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Complete a learning step mutation
  const completeStepMutation = useMutation({
    mutationFn: async ({ pathId, stepId }: { pathId: number, stepId: number }) => {
      const res = await apiRequest("POST", `/api/user/progress/${pathId}/complete/${stepId}`);
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress", variables.pathId] });
      
      // Check if the entire path is completed
      if (data.isCompleted) {
        setCompletedPaths(prev => [...prev, variables.pathId]);
        toast({
          title: "Path Completed!",
          description: "Congratulations on completing this learning path!",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to complete step: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Disable onboarding mutation (when user finishes or skips)
  const disableOnboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/onboarding-preferences/disable");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/onboarding-preferences"] });
      toast({
        title: "Onboarding Completed",
        description: "You can always access learning materials from your dashboard.",
      });
      onComplete();
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to disable onboarding: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Set initial values from preferences when they load
  useEffect(() => {
    if (preferences) {
      setSelectedExperience(preferences.experienceLevel || "beginner");
      setSelectedInterests(preferences.interests || []);
      setSelectedLearningStyle(preferences.learningStyle || null);
      
      // Skip to step 3 if preferences are already set
      if (
        preferences.experienceLevel && 
        preferences.interests?.length > 0 && 
        preferences.learningStyle
      ) {
        setCurrentStep(3);
        setWizardProgress(60);
      }
    }
  }, [preferences]);
  
  // Update progress when we have completed paths
  useEffect(() => {
    if (recommendedPaths.length > 0 && allProgress.length > 0) {
      const completedPathIds = allProgress
        .filter(p => p.isCompleted)
        .map(p => p.pathId);
      
      setCompletedPaths(completedPathIds);
      
      // Calculate overall onboarding progress
      const totalPaths = recommendedPaths.length;
      const completedCount = completedPathIds.length;
      
      if (totalPaths > 0) {
        const newProgress = Math.min(100, 60 + (completedCount / totalPaths) * 40);
        setWizardProgress(newProgress);
      }
    }
  }, [recommendedPaths, allProgress]);
  
  // Set current step and path ID when next steps are loaded
  useEffect(() => {
    if (nextSteps.length > 0 && currentStep === 4 && !currentPathId) {
      const nextStep = nextSteps[0];
      setCurrentPathId(nextStep.pathId);
      setCurrentStepId(nextStep.stepId);
    }
  }, [nextSteps, currentStep, currentPathId]);
  
  // Toggle interest selection
  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };
  
  // Save preferences and continue
  const saveAndContinue = () => {
    const data: Partial<OnboardingPreferences> = {};
    
    switch (currentStep) {
      case 0:
        if (!selectedExperience) {
          toast({
            title: "Selection Required",
            description: "Please select your experience level to continue.",
            variant: "destructive",
          });
          return;
        }
        data.experienceLevel = selectedExperience;
        break;
        
      case 1:
        if (selectedInterests.length === 0) {
          toast({
            title: "Selection Required",
            description: "Please select at least one interest to continue.",
            variant: "destructive",
          });
          return;
        }
        data.interests = selectedInterests;
        break;
        
      case 2:
        if (!selectedLearningStyle) {
          toast({
            title: "Selection Required",
            description: "Please select your preferred learning style to continue.",
            variant: "destructive",
          });
          return;
        }
        data.learningStyle = selectedLearningStyle;
        break;
    }
    
    savePreferencesMutation.mutate(data);
  };
  
  // Start a learning path
  const startPath = (pathId: number) => {
    setCurrentPathId(pathId);
    startPathMutation.mutate(pathId);
  };
  
  // Mark current step as completed
  const markStepComplete = (stepId: number) => {
    if (currentPathId) {
      completeStepMutation.mutate({ 
        pathId: currentPathId, 
        stepId 
      });
    }
  };
  
  // Skip a path and move to the next recommendation
  const skipPath = () => {
    if (currentPathId) {
      // Add to skipped paths
      setSkippedPaths(prev => [...prev, currentPathId]);
      
      // Find next path from recommended that isn't completed or skipped
      const nextPath = recommendedPaths.find(path => 
        !completedPaths.includes(path.id) && 
        !skippedPaths.includes(path.id) &&
        path.id !== currentPathId
      );
      
      if (nextPath) {
        setCurrentPathId(nextPath.id);
        setCurrentStepId(null);
      } else {
        // If no more paths, finish onboarding
        finishOnboarding();
      }
    }
  };
  
  // Finish the onboarding process
  const finishOnboarding = () => {
    disableOnboardingMutation.mutate();
  };
  
  // Get a feature icon by ID
  const getFeatureIcon = (featureId: string) => {
    const feature = availableFeatures.find(f => f.id === featureId);
    return feature ? feature.icon : <HelpCircle className="h-5 w-5" />;
  };
  
  // Format time in minutes
  const formatTime = (minutes?: number) => {
    if (!minutes) return "Unknown";
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins > 0 ? `${mins}m` : ""}`;
  };
  
  // Get path progress percentage
  const getPathProgress = (pathId: number) => {
    const progress = allProgress.find(p => p.pathId === pathId);
    if (!progress) return 0;
    
    if (progress.isCompleted) return 100;
    
    const path = recommendedPaths.find(p => p.id === pathId);
    const steps = currentPathSteps.filter(s => s.pathId === pathId);
    
    if (!path || steps.length === 0) return 0;
    
    const completedCount = progress.completedSteps?.length || 0;
    return Math.round((completedCount / steps.length) * 100);
  };
  
  // Check if a step is completed
  const isStepCompleted = (stepId: number) => {
    if (!currentPathProgress) return false;
    return currentPathProgress.completedSteps?.includes(stepId) || false;
  };
  
  // Check if a path has been started
  const isPathStarted = (pathId: number) => {
    return allProgress.some(p => p.pathId === pathId);
  };
  
  // Get feature name by id
  const getFeatureName = (featureId: string) => {
    const feature = availableFeatures.find(f => f.id === featureId);
    return feature ? feature.name : featureId;
  };
  
  // Render the current step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Experience Level
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">Select Your Experience Level</h3>
              <p className="text-muted-foreground">
                This helps us tailor the learning content to your knowledge level.
              </p>
            </div>
            <div className="grid gap-4">
              {experienceLevels.map(level => (
                <Card 
                  key={level.value} 
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    selectedExperience === level.value 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent hover:border-primary/30 hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedExperience(level.value)}
                >
                  <CardHeader className="pb-2 flex flex-row items-start">
                    <div className="mr-2 mt-1">
                      {level.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        {level.label}
                        {selectedExperience === level.value && (
                          <CheckCircle className="h-5 w-5 ml-2 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription>{level.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 1: // Interests
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">What Are You Interested In?</h3>
              <p className="text-muted-foreground">
                Select features you'd like to learn about. Choose as many as you want.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {availableFeatures.map(feature => (
                <Card 
                  key={feature.id} 
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    selectedInterests.includes(feature.id) 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent hover:border-primary/30 hover:bg-muted/50"
                  )}
                  onClick={() => toggleInterest(feature.id)}
                >
                  <CardHeader className="pb-3 pt-4 px-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="mr-3 flex-shrink-0">
                          {feature.icon}
                        </div>
                        <CardTitle className="text-base">{feature.name}</CardTitle>
                      </div>
                      {selectedInterests.includes(feature.id) && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="px-4 pb-4 pt-0">
                    <p className="text-xs text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 2: // Learning Style
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">How Do You Prefer to Learn?</h3>
              <p className="text-muted-foreground">
                This helps us select the right content format for you.
              </p>
            </div>
            <div className="grid gap-4">
              {learningStyles.map(style => (
                <Card 
                  key={style.value} 
                  className={cn(
                    "cursor-pointer transition-all border-2",
                    selectedLearningStyle === style.value 
                      ? "border-primary bg-primary/5" 
                      : "border-transparent hover:border-primary/30 hover:bg-muted/50"
                  )}
                  onClick={() => setSelectedLearningStyle(style.value)}
                >
                  <CardHeader className="pb-2 flex flex-row items-start">
                    <div className="mr-2 mt-1">
                      {style.icon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center">
                        {style.label}
                        {selectedLearningStyle === style.value && (
                          <CheckCircle className="h-5 w-5 ml-2 text-primary" />
                        )}
                      </CardTitle>
                      <CardDescription>{style.description}</CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 3: // Learning Path Selection
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-medium">Your Personalized Learning Paths</h3>
              <p className="text-muted-foreground">
                Based on your preferences, we've recommended these learning paths.
              </p>
            </div>
            
            <Tabs defaultValue="all" className="w-full" onValueChange={setActivePathTab}>
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all">All Paths</TabsTrigger>
                <TabsTrigger value="progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="recommended">Recommended</TabsTrigger>
              </TabsList>
              
              <TabsContent value="all" className="pt-4">
                {renderLearningPaths(recommendedPaths)}
              </TabsContent>
              
              <TabsContent value="progress" className="pt-4">
                {renderLearningPaths(
                  recommendedPaths.filter(path => 
                    isPathStarted(path.id) && !completedPaths.includes(path.id)
                  )
                )}
              </TabsContent>
              
              <TabsContent value="completed" className="pt-4">
                {renderLearningPaths(
                  recommendedPaths.filter(path => 
                    completedPaths.includes(path.id)
                  )
                )}
              </TabsContent>
              
              <TabsContent value="recommended" className="pt-4">
                {renderLearningPaths(
                  recommendedPaths.filter(path => 
                    !isPathStarted(path.id) && !completedPaths.includes(path.id)
                  )
                )}
              </TabsContent>
            </Tabs>
          </div>
        );
        
      case 4: // Learning Content
        if (!currentPathId) {
          return (
            <div className="text-center py-12">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-xl font-medium mb-2">No Learning Path Selected</h3>
              <p className="text-muted-foreground mb-6">
                Please select a learning path to continue.
              </p>
              <Button onClick={() => setCurrentStep(3)}>
                Browse Learning Paths
              </Button>
            </div>
          );
        }
        
        const currentPath = recommendedPaths.find(p => p.id === currentPathId);
        if (!currentPath) return null;
        
        return (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-xl font-medium flex items-center">
                  {currentPath.title}
                  {currentPath.requiredForFeatures?.map(feature => (
                    <TooltipProvider key={feature}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="ml-2">
                            {getFeatureIcon(feature)}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Required for: {getFeatureName(feature)}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </h3>
                <p className="text-muted-foreground">{currentPath.description}</p>
                
                <div className="flex items-center mt-3 space-x-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    {currentPath.difficulty}
                  </Badge>
                  {currentPath.estimatedTimeMinutes && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(currentPath.estimatedTimeMinutes)}
                    </Badge>
                  )}
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={skipPath}
              >
                Skip Path
              </Button>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Progress</span>
                <span className="text-sm text-muted-foreground">
                  {getPathProgress(currentPath.id)}% Complete
                </span>
              </div>
              <Progress value={getPathProgress(currentPath.id)} className="h-2" />
            </div>
            
            <Separator />
            
            <div className="space-y-4">
              <h4 className="font-medium">Learning Steps</h4>
              {stepsLoading ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-3">
                  {currentPathSteps
                    .sort((a, b) => a.orderIndex - b.orderIndex)
                    .map(step => (
                      <Card 
                        key={step.id} 
                        className={cn(
                          "border",
                          isStepCompleted(step.id) 
                            ? "bg-primary/5 border-primary/30" 
                            : "hover:bg-muted/50"
                        )}
                      >
                        <CardHeader className="pb-2 pt-4 px-4">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base flex items-center">
                              {isStepCompleted(step.id) && (
                                <CheckCircle className="h-4 w-4 mr-2 text-primary" />
                              )}
                              {step.title}
                            </CardTitle>
                            {step.estimatedTimeMinutes && (
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTime(step.estimatedTimeMinutes)}
                              </Badge>
                            )}
                          </div>
                          <CardDescription>{step.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-4 pt-0">
                          <div 
                            className={cn(
                              "prose prose-sm dark:prose-invert",
                              selectedLearningStyle === "visual" && "prose-img:my-2 prose-img:max-h-64",
                              selectedLearningStyle === "reading" && "prose-p:my-1 prose-h3:mb-2 prose-h4:mb-1"
                            )}
                            dangerouslySetInnerHTML={{ __html: step.content }}
                          />
                        </CardContent>
                        <CardFooter className="px-4 pb-4 pt-0">
                          <Button
                            className={cn(
                              "ml-auto",
                              isStepCompleted(step.id) && "bg-primary/20 text-primary hover:bg-primary/30 hover:text-primary"
                            )}
                            onClick={() => markStepComplete(step.id)}
                            disabled={completeStepMutation.isPending}
                          >
                            {completeStepMutation.isPending && (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            )}
                            {isStepCompleted(step.id) ? "Completed" : "Mark as Completed"}
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render learning paths list
  const renderLearningPaths = (paths: LearningPath[]) => {
    if (pathsLoading) {
      return (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    
    if (paths.length === 0) {
      return (
        <div className="text-center py-12 bg-muted/30 rounded-lg">
          <p className="text-muted-foreground">
            {activePathTab === "all" ? "No learning paths found." : 
             activePathTab === "progress" ? "You haven't started any learning paths yet." :
             activePathTab === "completed" ? "You haven't completed any learning paths yet." :
             "No recommended learning paths found."}
          </p>
        </div>
      );
    }
    
    return (
      <div className="grid gap-4">
        {paths.map(path => {
          const progress = getPathProgress(path.id);
          const isStarted = isPathStarted(path.id);
          const isCompleted = completedPaths.includes(path.id);
          
          return (
            <Card 
              key={path.id} 
              className={cn(
                "overflow-hidden transition-all",
                isCompleted && "bg-green-50 dark:bg-green-900/10 border-green-200 dark:border-green-900",
                isStarted && !isCompleted && "bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900"
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    {path.title}
                    {isCompleted && (
                      <Badge variant="success" className="ml-2">Completed</Badge>
                    )}
                  </CardTitle>
                  <div className="flex space-x-2">
                    {path.requiredForFeatures?.map(feature => (
                      <TooltipProvider key={feature}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div>
                              {getFeatureIcon(feature)}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Required for: {getFeatureName(feature)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    ))}
                  </div>
                </div>
                <CardDescription className="mt-1">{path.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="pb-3">
                <div className="flex flex-wrap gap-2 mb-4">
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Target className="h-3.5 w-3.5" />
                    {path.difficulty}
                  </Badge>
                  {path.estimatedTimeMinutes && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(path.estimatedTimeMinutes)}
                    </Badge>
                  )}
                  {path.category && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {path.category}
                    </Badge>
                  )}
                </div>
                
                {(isStarted || isCompleted) && (
                  <div>
                    <div className="flex justify-between items-center text-xs mb-2">
                      <span>{isCompleted ? "Completed" : "In progress"}</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-1" />
                  </div>
                )}
              </CardContent>
              
              <CardFooter>
                <Button 
                  className="w-full"
                  variant={isCompleted ? "outline" : "default"}
                  onClick={() => {
                    setCurrentPathId(path.id);
                    if (!isStarted && !isCompleted) {
                      startPathMutation.mutate(path.id);
                    } else {
                      setCurrentStep(4);
                    }
                  }}
                >
                  {isCompleted ? "Review Path" : isStarted ? "Continue Learning" : "Start Learning"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    );
  };
  
  // The main wizard component
  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Intelligent Learning Center</h2>
          <p className="text-muted-foreground">
            Your personalized guide to getting the most out of the TSK platform
          </p>
        </div>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setShowHelpDialog(true)}
          >
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={finishOnboarding}
          >
            Skip All
          </Button>
        </div>
      </div>
      
      {/* Progress bar for the whole onboarding process */}
      {currentStep < 5 && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium">Your Progress</span>
            <span className="text-sm text-muted-foreground">{Math.round(wizardProgress)}% Complete</span>
          </div>
          <Progress value={wizardProgress} className="h-2" />
        </div>
      )}
      
      {/* Main wizard content */}
      {preferencesLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="p-6">
            {renderStepContent()}
            
            {/* Navigation buttons for steps 0-2 */}
            {currentStep < 3 && (
              <div className="flex justify-end mt-6">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => {
                      setCurrentStep(prev => prev - 1);
                      setWizardProgress(((currentStep) / 5) * 100);
                    }}
                  >
                    Back
                  </Button>
                )}
                
                <Button
                  onClick={saveAndContinue}
                  disabled={savePreferencesMutation.isPending}
                >
                  {savePreferencesMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Continue
                </Button>
              </div>
            )}
            
            {/* Back button for step 4 (learning content) */}
            {currentStep === 4 && (
              <div className="flex justify-between mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCurrentStep(3);
                    setWizardProgress(60);
                  }}
                >
                  Back to Paths
                </Button>
                
                {/* If all steps are completed in this path */}
                {currentPathProgress?.isCompleted && (
                  <Button onClick={finishOnboarding}>
                    Complete Onboarding
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Help dialog */}
      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Learning Center Help</DialogTitle>
            <DialogDescription>
              Here's how to get the most out of the intelligent learning system
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium flex items-center">
                <Brain className="h-4 w-4 mr-2 text-primary" />
                Adaptive Learning
              </h4>
              <p className="text-sm">
                Our system adapts content based on your experience level, interests, and learning style to provide a personalized experience.
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium flex items-center">
                <Settings className="h-4 w-4 mr-2 text-primary" />
                How It Works
              </h4>
              <ul className="text-sm space-y-2">
                <li className="flex items-start">
                  <span className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">1</span>
                  <span>Tell us about your experience, interests, and learning preferences</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">2</span>
                  <span>Get personalized learning paths tailored to your needs</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">3</span>
                  <span>Complete learning steps to unlock platform features</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-primary/20 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs mr-2 flex-shrink-0 mt-0.5">4</span>
                  <span>Return anytime to continue your learning journey</span>
                </li>
              </ul>
            </div>
          </div>
          
          <DialogFooter>
            <Button onClick={() => setShowHelpDialog(false)}>
              Got it
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
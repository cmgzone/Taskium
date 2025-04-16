import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Check, 
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
  Database 
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";

// Define types for our onboarding data
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
  startedAt: string | null;
  completedAt: string | null;
  lastActivityAt: string | null;
  lastStepCompleted: number | null;
}

interface OnboardingPreferences {
  userId: number;
  experiencelevel: string | null;
  interests: string[];
  learningstyle: string | null;
  disableonboarding: boolean;
}

interface NextStep {
  pathId: number;
  stepId: number;
  reason: string;
  path: LearningPath;
  step: LearningStep;
}

// Define the experience level options
const experienceLevels = [
  { value: "beginner", label: "Beginner", description: "New to blockchain and cryptocurrencies" },
  { value: "intermediate", label: "Intermediate", description: "Some experience with crypto platforms" },
  { value: "advanced", label: "Advanced", description: "Experienced with blockchain technology" }
];

// Define the learning interest options
const interestOptions = [
  { value: "mining", label: "Mining", icon: Zap },
  { value: "marketplace", label: "Marketplace", icon: ShoppingCart },
  { value: "wallet", label: "Wallet Management", icon: Wallet },
  { value: "referral", label: "Referral Program", icon: Users },
  { value: "premium", label: "Premium Features", icon: Award },
  { value: "blockchain", label: "Blockchain Technology", icon: Database }
];

// Define the learning style options
const learningStyles = [
  { value: "visual", label: "Visual", description: "Learn through images and videos" },
  { value: "reading", label: "Reading", description: "Learn through detailed explanations" },
  { value: "interactive", label: "Interactive", description: "Learn by doing and practicing" }
];

export default function OnboardingWizard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedLearningStyle, setSelectedLearningStyle] = useState<string | null>(null);
  const [currentPathId, setCurrentPathId] = useState<number | null>(null);
  const [currentStepId, setCurrentStepId] = useState<number | null>(null);
  const [showWizard, setShowWizard] = useState<boolean>(true);
  
  // Fetch user's onboarding preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<OnboardingPreferences>({
    queryKey: ["/api/user/onboarding-preferences"],
    enabled: !!user,
    refetchOnWindowFocus: false,
  });
  
  // Fetch recommended learning paths
  const { data: recommendedPaths = [], isLoading: pathsLoading } = useQuery<LearningPath[]>({
    queryKey: ["/api/user/recommended-paths"],
    enabled: !!user && currentStep === 3,
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
  
  // Fetch learning steps when a path is selected
  const { data: currentSteps = [], isLoading: stepsLoading } = useQuery<LearningStep[]>({
    queryKey: ["/api/learning-paths", currentPathId, "steps"],
    queryFn: async () => {
      if (!currentPathId) return [];
      const res = await fetch(`/api/learning-paths/${currentPathId}/steps`);
      return res.json();
    },
    enabled: !!currentPathId,
    refetchOnWindowFocus: false,
  });
  
  // Fetch the current step content
  const { data: currentStepContent, isLoading: stepContentLoading } = useQuery<LearningStep>({
    queryKey: ["/api/learning-steps", currentStepId],
    queryFn: async () => {
      if (!currentStepId) return null;
      const res = await fetch(`/api/learning-steps/${currentStepId}`);
      return res.json();
    },
    enabled: !!currentStepId,
    refetchOnWindowFocus: false,
  });
  
  // Fetch user progress for the current path
  const { data: currentProgress, isLoading: currentProgressLoading } = useQuery<UserProgress>({
    queryKey: ["/api/user/progress", currentPathId],
    queryFn: async () => {
      if (!currentPathId) return null;
      const res = await fetch(`/api/user/progress/${currentPathId}`);
      return res.json();
    },
    enabled: !!currentPathId,
    refetchOnWindowFocus: false,
  });
  
  // Mutations for updating preferences and progress
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
  
  const startPathMutation = useMutation({
    mutationFn: async (pathId: number) => {
      const res = await apiRequest("POST", `/api/user/progress/${pathId}/start`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress", currentPathId] });
      
      // If we're in the path selection step, move to content view
      if (currentStep === 3) {
        setCurrentStep(4);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to start path: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const completeStepMutation = useMutation({
    mutationFn: async ({ pathId, stepId }: { pathId: number; stepId: number }) => {
      const res = await apiRequest("POST", `/api/user/progress/${pathId}/complete-step/${stepId}`);
      return res.json();
    },
    onSuccess: (data: UserProgress) => {
      toast({
        title: "Step Completed",
        description: data.isCompleted 
          ? "Congratulations! You've completed this learning path." 
          : "Great job! Step completed.",
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress"] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/progress", currentPathId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/suggested-next-steps"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: `Failed to complete step: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  const disableOnboardingMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/user/onboarding-preferences/disable");
      return res.json();
    },
    onSuccess: () => {
      setShowWizard(false);
      toast({
        title: "Onboarding Disabled",
        description: "You can always access learning materials from your dashboard.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/onboarding-preferences"] });
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
      setSelectedExperience(preferences.experiencelevel);
      setSelectedInterests(preferences.interests || []);
      setSelectedLearningStyle(preferences.learningstyle);
      
      // Skip to step 3 if preferences are already set
      if (
        preferences.experiencelevel && 
        preferences.interests?.length > 0 && 
        preferences.learningstyle
      ) {
        setCurrentStep(3);
      }
      
      // Hide wizard if onboarding is disabled
      if (preferences.disableonboarding) {
        setShowWizard(false);
      }
    }
  }, [preferences]);
  
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
        data.experiencelevel = selectedExperience;
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
        data.learningstyle = selectedLearningStyle;
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
  const markStepComplete = () => {
    if (currentPathId && currentStepId) {
      completeStepMutation.mutate({ pathId: currentPathId, stepId: currentStepId });
    }
  };
  
  // Move to the next step in the current path
  const goToNextPathStep = () => {
    if (!currentPathId || !currentProgress || !currentSteps.length) return;
    
    const sortedSteps = [...currentSteps].sort((a, b) => a.orderIndex - b.orderIndex);
    
    if (currentStepId) {
      const currentIndex = sortedSteps.findIndex(step => step.id === currentStepId);
      if (currentIndex < sortedSteps.length - 1) {
        setCurrentStepId(sortedSteps[currentIndex + 1].id);
      } else {
        // We've reached the end of this path
        setCurrentPathId(null);
        setCurrentStepId(null);
        
        // If there are other suggested paths, prompt to continue
        if (nextSteps.length > 1) {
          toast({
            title: "Path Completed",
            description: "Would you like to explore another recommended learning path?",
          });
        }
      }
    } else {
      // Start with the first step if none is selected
      setCurrentStepId(sortedSteps[0].id);
    }
  };
  
  // Navigate to a specific step
  const navigateToStep = (stepId: number) => {
    setCurrentStepId(stepId);
  };
  
  // Close the wizard
  const closeWizard = () => {
    disableOnboardingMutation.mutate();
  };
  
  if (!showWizard) {
    return null;
  }
  
  // Render the steps UI based on the current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What's your experience level?</h3>
            <p className="text-muted-foreground">
              This helps us personalize your learning journey.
            </p>
            <div className="grid gap-4 pt-4">
              {experienceLevels.map(level => (
                <Card 
                  key={level.value} 
                  className={`cursor-pointer transition-all ${selectedExperience === level.value ? 'border-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedExperience(level.value)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{level.label}</CardTitle>
                      {selectedExperience === level.value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <CardDescription>{level.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">What are you interested in learning?</h3>
            <p className="text-muted-foreground">
              Select the topics you'd like to explore. You can choose multiple options.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              {interestOptions.map(interest => {
                const Icon = interest.icon;
                return (
                  <Card 
                    key={interest.value} 
                    className={`cursor-pointer transition-all ${selectedInterests.includes(interest.value) ? 'border-primary' : 'hover:border-primary/50'}`}
                    onClick={() => toggleInterest(interest.value)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="mr-3 p-2 rounded-full bg-primary/10">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <div className="font-medium">{interest.label}</div>
                        </div>
                        {selectedInterests.includes(interest.value) && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardHeader>
                  </Card>
                );
              })}
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">How do you prefer to learn?</h3>
            <p className="text-muted-foreground">
              This helps us select the right content format for you.
            </p>
            <div className="grid gap-4 pt-4">
              {learningStyles.map(style => (
                <Card 
                  key={style.value} 
                  className={`cursor-pointer transition-all ${selectedLearningStyle === style.value ? 'border-primary' : 'hover:border-primary/50'}`}
                  onClick={() => setSelectedLearningStyle(style.value)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-center">
                      <CardTitle className="text-lg">{style.label}</CardTitle>
                      {selectedLearningStyle === style.value && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                    <CardDescription>{style.description}</CardDescription>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium">Recommended Learning Paths</h3>
              <p className="text-muted-foreground">
                Based on your preferences, we've selected these learning paths for you.
              </p>
            </div>
            
            {pathsLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : recommendedPaths.length === 0 ? (
              <div className="text-center py-8">
                <p>No learning paths found for your preferences.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setCurrentStep(1)}
                >
                  Update Interests
                </Button>
              </div>
            ) : (
              <div className="grid gap-6">
                {recommendedPaths.map(path => {
                  const progress = allProgress.find(p => p.pathId === path.id);
                  const isStarted = !!progress;
                  const isCompleted = progress?.isCompleted;
                  
                  return (
                    <Card key={path.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{path.title}</CardTitle>
                            <CardDescription className="mt-1">{path.description}</CardDescription>
                          </div>
                          {path.feature && (
                            <Badge variant="outline" className="ml-2">
                              {(() => {
                                switch (path.feature) {
                                  case 'marketplace':
                                    return <span className="flex items-center"><ShoppingCart className="h-3 w-3 mr-1" /> Marketplace</span>;
                                  case 'wallet':
                                    return <span className="flex items-center"><Wallet className="h-3 w-3 mr-1" /> Wallet</span>;
                                  case 'mining':
                                    return <span className="flex items-center"><Zap className="h-3 w-3 mr-1" /> Mining</span>;
                                  case 'referral':
                                    return <span className="flex items-center"><Users className="h-3 w-3 mr-1" /> Referrals</span>;
                                  case 'premium':
                                    return <span className="flex items-center"><Award className="h-3 w-3 mr-1" /> Premium</span>;
                                  default:
                                    return path.feature;
                                }
                              })()}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="flex flex-wrap gap-2 mb-4">
                          <Badge variant="secondary">
                            <Clock className="h-3 w-3 mr-1" />
                            {path.estimatedTimeMinutes} mins
                          </Badge>
                          <Badge variant="secondary">
                            {path.difficulty === 'beginner' && 'Beginner'}
                            {path.difficulty === 'intermediate' && 'Intermediate'}
                            {path.difficulty === 'advanced' && 'Advanced'}
                          </Badge>
                          {path.category && (
                            <Badge variant="outline">{path.category}</Badge>
                          )}
                        </div>
                        
                        {isStarted && (
                          <div className="mb-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>
                                {progress?.completedSteps.length || 0} / {progress?.completedSteps.length + 1 || '?'} steps
                              </span>
                            </div>
                            <Progress 
                              value={isCompleted ? 100 : (progress?.completedSteps.length ? (progress.completedSteps.length / (progress.completedSteps.length + 1)) * 100 : 0)} 
                              className="h-2" 
                            />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          variant={isCompleted ? "outline" : "default"}
                          onClick={() => startPath(path.id)}
                        >
                          {isCompleted ? (
                            <>
                              <Check className="mr-2 h-4 w-4" /> Completed
                            </>
                          ) : isStarted ? (
                            <>
                              <ArrowRight className="mr-2 h-4 w-4" /> Continue Learning
                            </>
                          ) : (
                            <>
                              <BookOpen className="mr-2 h-4 w-4" /> Start Learning
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        );
        
      case 4:
        if (nextStepsLoading) {
          return (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          );
        }
        
        if (nextSteps.length === 0) {
          return (
            <div className="text-center py-8">
              <h3 className="text-lg font-medium mb-2">No Next Steps Found</h3>
              <p className="text-muted-foreground mb-6">
                It looks like you've completed all available learning paths.
              </p>
              <Button onClick={() => setCurrentStep(3)}>
                View All Learning Paths
              </Button>
            </div>
          );
        }
        
        if (!currentPathId || !currentStepId) {
          const nextStep = nextSteps[0];
          return (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Suggested Next Step</h3>
                <p className="text-muted-foreground">
                  We recommend continuing with this learning path.
                </p>
              </div>
              
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>{nextStep.path.title}</CardTitle>
                      <CardDescription className="mt-1">{nextStep.path.description}</CardDescription>
                    </div>
                    {nextStep.path.feature && (
                      <Badge variant="outline" className="ml-2">
                        {nextStep.path.feature === 'marketplace' ? <ShoppingCart className="h-4 w-4" /> :
                        nextStep.path.feature === 'wallet' ? <Wallet className="h-4 w-4" /> :
                        nextStep.path.feature === 'mining' ? <Zap className="h-4 w-4" /> :
                        nextStep.path.feature === 'referral' ? <Users className="h-4 w-4" /> :
                        nextStep.path.feature === 'premium' ? <Award className="h-4 w-4" /> :
                        nextStep.path.feature}
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-muted/50 rounded-lg mb-4">
                    <div className="font-medium mb-1">Why we recommend this:</div>
                    <p className="text-muted-foreground text-sm">{nextStep.reason}</p>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary">
                      <Clock className="h-3 w-3 mr-1" />
                      {nextStep.path.estimatedTimeMinutes} mins
                    </Badge>
                    <Badge variant="secondary">
                      {nextStep.path.difficulty}
                    </Badge>
                    {nextStep.path.category && (
                      <Badge variant="outline">{nextStep.path.category}</Badge>
                    )}
                  </div>
                  
                  <div className="border-t pt-4 mt-4">
                    <div className="font-medium mb-2">You'll learn about:</div>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start">
                        <ChevronRight className="h-5 w-5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                        <span>{nextStep.step.title}</span>
                      </div>
                      <div className="text-sm text-muted-foreground ml-7">
                        {nextStep.step.description}
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full"
                    onClick={() => {
                      setCurrentPathId(nextStep.pathId);
                      setCurrentStepId(nextStep.stepId);
                      startPathMutation.mutate(nextStep.pathId);
                    }}
                  >
                    <BookOpen className="mr-2 h-4 w-4" /> Start Learning
                  </Button>
                </CardFooter>
              </Card>
              
              {nextSteps.length > 1 && (
                <div className="pt-4">
                  <h4 className="font-medium mb-3">Other Recommended Paths</h4>
                  <div className="grid gap-4">
                    {nextSteps.slice(1).map(step => (
                      <Card key={`${step.pathId}-${step.stepId}`} className="overflow-hidden">
                        <CardHeader className="pb-2">
                          <div className="flex justify-between items-start">
                            <CardTitle className="text-base">{step.path.title}</CardTitle>
                            {step.path.feature && (
                              <Badge variant="outline" className="ml-2">
                                {step.path.feature === 'marketplace' ? <ShoppingCart className="h-3 w-3" /> :
                                step.path.feature === 'wallet' ? <Wallet className="h-3 w-3" /> :
                                step.path.feature === 'mining' ? <Zap className="h-3 w-3" /> :
                                step.path.feature === 'referral' ? <Users className="h-3 w-3" /> :
                                step.path.feature === 'premium' ? <Award className="h-3 w-3" /> :
                                step.path.feature}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pb-2">
                          <p className="text-sm text-muted-foreground">{step.reason}</p>
                        </CardContent>
                        <CardFooter>
                          <Button 
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => {
                              setCurrentPathId(step.pathId);
                              setCurrentStepId(step.stepId);
                              startPathMutation.mutate(step.pathId);
                            }}
                          >
                            <BookOpen className="mr-2 h-3 w-3" /> Start Learning
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }
        
        // Display the current learning step content
        return (
          <div className="space-y-6">
            {stepContentLoading || !currentStepContent ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <div>
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-medium">{currentStepContent.title}</h3>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => {
                        setCurrentPathId(null);
                        setCurrentStepId(null);
                        setCurrentStep(3);
                      }}
                    >
                      View All Paths
                    </Button>
                  </div>
                  <p className="text-muted-foreground mt-1">{currentStepContent.description}</p>
                </div>
                
                <div className="grid md:grid-cols-[3fr_1fr] gap-6">
                  <div className="space-y-4">
                    <Card className="p-6">
                      <div className="prose dark:prose-invert max-w-none">
                        {currentStepContent.content.split('\n').map((paragraph, i) => (
                          <p key={i}>{paragraph}</p>
                        ))}
                      </div>
                      
                      {currentStepContent.mediaUrl && (
                        <div className="mt-6 rounded-lg overflow-hidden border">
                          {currentStepContent.mediaType === 'image' ? (
                            <img 
                              src={currentStepContent.mediaUrl} 
                              alt={currentStepContent.title}
                              className="w-full h-auto"
                            />
                          ) : currentStepContent.mediaType === 'video' ? (
                            <div className="aspect-video">
                              <iframe 
                                src={currentStepContent.mediaUrl} 
                                title={currentStepContent.title}
                                className="w-full h-full"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            </div>
                          ) : null}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-center mt-8 pt-6 border-t">
                        <Button
                          variant="outline"
                          onClick={goToNextPathStep}
                        >
                          Skip <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                          onClick={markStepComplete}
                        >
                          Mark as Completed <Check className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </Card>
                  </div>
                  
                  <div className="space-y-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">Path Progress</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        {currentProgressLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : (
                          <>
                            <div className="flex justify-between text-sm mb-1">
                              <span>Progress</span>
                              <span>
                                {currentProgress?.completedSteps.length || 0} / {currentSteps.length} steps
                              </span>
                            </div>
                            <Progress 
                              value={currentProgress?.completedSteps.length ? (currentProgress.completedSteps.length / currentSteps.length) * 100 : 0} 
                              className="h-2 mb-4" 
                            />
                            
                            <div className="text-sm font-medium mb-2 mt-4">All Steps:</div>
                            <div className="space-y-1">
                              {[...currentSteps]
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                                .map(step => {
                                  const isCompleted = currentProgress?.completedSteps.includes(step.id);
                                  const isCurrent = step.id === currentStepId;
                                  
                                  return (
                                    <div 
                                      key={step.id} 
                                      className={`flex items-center py-1 px-2 rounded-md text-sm ${isCurrent ? 'bg-primary/10' : ''}`}
                                    >
                                      {isCompleted ? (
                                        <Check className="h-4 w-4 text-primary mr-2 flex-shrink-0" />
                                      ) : (
                                        <div className={`h-4 w-4 rounded-full border mr-2 flex-shrink-0 ${isCurrent ? 'border-primary' : 'border-muted-foreground'}`} />
                                      )}
                                      <button
                                        className={`text-left ${isCompleted ? 'text-muted-foreground' : ''} ${isCurrent ? 'font-medium' : ''}`}
                                        onClick={() => navigateToStep(step.id)}
                                      >
                                        {step.title}
                                      </button>
                                    </div>
                                  );
                                })}
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">About This Path</CardTitle>
                      </CardHeader>
                      <CardContent className="pb-4">
                        {stepsLoading ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : currentSteps.length > 0 && currentSteps[0].pathId ? (
                          <div className="space-y-3 text-sm">
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 text-muted-foreground mr-2" />
                              <span>{currentSteps.reduce((sum, step) => sum + step.estimatedTimeMinutes, 0)} minutes total</span>
                            </div>
                            
                            <div className="flex items-center">
                              <BookOpen className="h-4 w-4 text-muted-foreground mr-2" />
                              <span>{currentSteps.length} lessons</span>
                            </div>
                            
                            {currentProgress?.startedAt && (
                              <div className="flex items-center">
                                <Star className="h-4 w-4 text-muted-foreground mr-2" />
                                <span>Started {new Date(currentProgress.startedAt).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground">No path data available</p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Learning Center</h2>
          <p className="text-muted-foreground">Personalized guidance to help you get the most out of TSK</p>
        </div>
        <Button variant="ghost" size="sm" onClick={closeWizard}>
          Skip Onboarding
        </Button>
      </div>
      
      {preferencesLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {currentStep < 3 ? (
              <div className="mb-6">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Step {currentStep + 1} of 3</span>
                  <span className="text-sm text-muted-foreground">{((currentStep + 1) / 3) * 100}% Complete</span>
                </div>
                <Progress value={((currentStep + 1) / 3) * 100} className="h-2" />
              </div>
            ) : null}
            
            {renderStepContent()}
            
            {currentStep < 3 && (
              <div className="flex justify-end mt-6">
                {currentStep > 0 && (
                  <Button
                    variant="outline"
                    className="mr-2"
                    onClick={() => setCurrentStep(prev => prev - 1)}
                  >
                    Back
                  </Button>
                )}
                
                <Button onClick={saveAndContinue}>
                  {currentStep === 2 ? 'Finish' : 'Continue'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
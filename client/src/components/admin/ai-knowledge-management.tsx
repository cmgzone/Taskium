import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  PlusCircle, 
  BrainCircuit, 
  Search,
  Edit,
  Trash2,
  Loader2,
  BookOpenCheck
} from 'lucide-react';

// Additional interface definitions for the other tabs
interface AIReasoningPattern {
  id: number;
  name: string;
  description: string;
  pattern: string;
  priority: number;
  createdAt: string;
}

interface AISystemTask {
  id: number;
  type: string;
  status: string;
  priority: number;
  data: any;
  createdAt: string;
}

// Knowledge entry interface with complete properties
interface AIKnowledgeEntry {
  id: number;
  topic: string;
  subtopic: string;
  information: string;
  confidence: number;
  relationships?: string[];
  source?: string;
  needsReview?: boolean;
  createdAt: string;
}

/**
 * Simplified AI Knowledge Management Component
 * 
 * This version is a minimal implementation to debug the previous errors.
 */

/**
 * AI Knowledge Management Component
 * 
 * Admin interface for managing AI knowledge base, reasoning patterns, 
 * and system tasks.
 * 
 * Note: This component is a work in progress and may contain errors.
 * The useEffect is used to log data and troubleshoot rendering issues.
 */
export function AIKnowledgeManagement() {
  // Debug logging
  React.useEffect(() => {
    console.log("AIKnowledgeManagement component mounted");
  }, []);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Tabs state
  const [activeTab, setActiveTab] = useState('knowledge');
  
  // Filter state
  const [topicFilter, setTopicFilter] = useState('');
  const [confidenceFilter, setConfidenceFilter] = useState('all');
  const [reviewFilter, setReviewFilter] = useState<boolean | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Knowledge entry form state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<AIKnowledgeEntry | null>(null);
  const [formData, setFormData] = useState({
    topic: '',
    subtopic: '',
    information: '',
    confidence: 80,
    relationships: '',
    source: 'admin',
    needsReview: false
  });
  
  // Get AI knowledge entries
  const { 
    data: knowledgeEntries = [], 
    isLoading: isLoadingKnowledge,
    error: knowledgeError
  } = useQuery({
    queryKey: ['/api/admin/ai/knowledge', topicFilter],
    queryFn: async () => {
      try {
        const url = topicFilter 
          ? `/api/admin/ai/knowledge?topic=${encodeURIComponent(topicFilter)}` 
          : '/api/admin/ai/knowledge';
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching knowledge entries:', error);
        return [];
      }
    }
  });
  
  // Get reasoning patterns
  const { 
    data: reasoningPatterns = [], 
    isLoading: isLoadingReasoning,
    error: reasoningError
  } = useQuery({
    queryKey: ['/api/admin/ai/reasoning'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/ai/reasoning');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching reasoning patterns:', error);
        return [];
      }
    },
    enabled: activeTab === 'reasoning'
  });
  
  // Get system tasks
  const { 
    data: systemTasks = [], 
    isLoading: isLoadingTasks,
    error: tasksError
  } = useQuery({
    queryKey: ['/api/admin/ai/tasks'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/ai/tasks');
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const data = await response.json();
        return data || [];
      } catch (error) {
        console.error('Error fetching system tasks:', error);
        return [];
      }
    },
    enabled: activeTab === 'tasks'
  });
  
  // Create knowledge entry mutation
  const createKnowledgeMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/admin/ai/knowledge', data, true);
    },
    onSuccess: async () => {
      toast({
        title: 'Success',
        description: 'Knowledge entry created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/knowledge'] });
      resetForm();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create knowledge entry',
        variant: 'destructive'
      });
    }
  });
  
  // Update knowledge entry mutation
  const updateKnowledgeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      return apiRequest('PATCH', `/api/admin/ai/knowledge/${id}`, data, true);
    },
    onSuccess: async () => {
      toast({
        title: 'Success',
        description: 'Knowledge entry updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/knowledge'] });
      resetForm();
      setIsEditDialogOpen(false);
      setEditingEntry(null);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update knowledge entry',
        variant: 'destructive'
      });
    }
  });
  
  // Delete knowledge entry mutation
  const deleteKnowledgeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/admin/ai/knowledge/${id}`, undefined, true);
    },
    onSuccess: async () => {
      toast({
        title: 'Success',
        description: 'Knowledge entry deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/knowledge'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete knowledge entry',
        variant: 'destructive'
      });
    }
  });
  
  // Process tasks mutation
  const processTasksMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/admin/ai/tasks/process', { limit: 5 }, true);
    },
    onSuccess: (data: any) => {
      toast({
        title: 'Success',
        description: `Processed ${data?.processedCount || 0} tasks successfully`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/ai/tasks'] });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to process tasks',
        variant: 'destructive'
      });
    }
  });
  
  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleConfidenceChange = (value: string) => {
    setFormData(prev => ({ ...prev, confidence: parseInt(value) }));
  };
  
  const handleReviewChange = (value: boolean) => {
    setFormData(prev => ({ ...prev, needsReview: value }));
  };
  
  const resetForm = () => {
    setFormData({
      topic: '',
      subtopic: '',
      information: '',
      confidence: 80,
      relationships: '',
      source: 'admin',
      needsReview: false
    });
  };
  
  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Process relationships array from comma-separated string
    const relationships = formData.relationships
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    
    createKnowledgeMutation.mutate({
      ...formData,
      relationships
    });
  };
  
  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingEntry) return;
    
    // Process relationships array from comma-separated string
    const relationships = formData.relationships
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
    
    updateKnowledgeMutation.mutate({
      id: editingEntry.id,
      data: {
        ...formData,
        relationships
      }
    });
  };
  
  // Edit handler function
  const handleEdit = (entry: AIKnowledgeEntry) => {
    setEditingEntry(entry);
    setFormData({
      topic: entry.topic,
      subtopic: entry.subtopic,
      information: entry.information,
      confidence: entry.confidence,
      relationships: Array.isArray(entry.relationships) ? entry.relationships.join(', ') : '',
      source: entry.source || 'admin',
      needsReview: Boolean(entry.needsReview)
    });
    setIsEditDialogOpen(true);
  };
  
  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this knowledge entry?')) {
      deleteKnowledgeMutation.mutate(id);
    }
  };
  
  // Filter and search knowledge entries
  const filteredKnowledgeEntries = knowledgeEntries?.filter((entry: AIKnowledgeEntry) => {
    // Apply topic filter if set
    if (topicFilter && entry.topic !== topicFilter) {
      return false;
    }
    
    // Apply confidence filter
    if (confidenceFilter === 'high' && entry.confidence < 80) {
      return false;
    } else if (confidenceFilter === 'medium' && (entry.confidence < 50 || entry.confidence >= 80)) {
      return false;
    } else if (confidenceFilter === 'low' && entry.confidence >= 50) {
      return false;
    }
    
    // Apply review filter
    if (reviewFilter !== null) {
      // If needsReview is undefined, treat it as false
      const entryNeedsReview = entry.needsReview === true;
      if (entryNeedsReview !== reviewFilter) return false;
    }
    
    // Apply search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        entry.topic.toLowerCase().includes(searchLower) ||
        entry.subtopic.toLowerCase().includes(searchLower) ||
        entry.information.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });
  
  // Extract unique topics for filter
  // Extract unique topics for filter and convert to string array
  const uniqueTopics = knowledgeEntries 
    ? Array.from(new Set(knowledgeEntries.map((entry: AIKnowledgeEntry) => entry.topic)))
        .filter((topic): topic is string => typeof topic === 'string')
    : [];
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center space-x-2 mb-6">
        <BrainCircuit className="h-6 w-6" />
        <h1 className="text-2xl font-bold">AI Knowledge Management</h1>
      </div>
      
      <Tabs 
        defaultValue="knowledge" 
        className="w-full" 
        value={activeTab}
        onValueChange={setActiveTab}
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="reasoning">Reasoning Patterns</TabsTrigger>
          <TabsTrigger value="tasks">System Tasks</TabsTrigger>
        </TabsList>
        
        {/* Knowledge Base Tab */}
        <TabsContent value="knowledge" className="py-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Knowledge Entries</h2>
            <Button onClick={() => setIsAddDialogOpen(true)}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Entry
            </Button>
          </div>
          
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div>
              <Label htmlFor="topic-filter">Topic</Label>
              <Select 
                value={topicFilter} 
                onValueChange={setTopicFilter}
              >
                <SelectTrigger id="topic-filter">
                  <SelectValue placeholder="All Topics" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Topics</SelectItem>
                  {uniqueTopics.map((topic: string) => (
                    <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="confidence-filter">Confidence</Label>
              <Select 
                value={confidenceFilter} 
                onValueChange={setConfidenceFilter}
              >
                <SelectTrigger id="confidence-filter">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="high">High (80%+)</SelectItem>
                  <SelectItem value="medium">Medium (50-79%)</SelectItem>
                  <SelectItem value="low">Low (&lt;50%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="review-filter">Review Status</Label>
              <Select 
                value={reviewFilter === null ? 'all' : reviewFilter ? 'needs' : 'reviewed'} 
                onValueChange={(value) => {
                  if (value === 'all') setReviewFilter(null);
                  else if (value === 'needs') setReviewFilter(true);
                  else setReviewFilter(false);
                }}
              >
                <SelectTrigger id="review-filter">
                  <SelectValue placeholder="All Entries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Entries</SelectItem>
                  <SelectItem value="needs">Needs Review</SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Search entries..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Knowledge Entries Table */}
          {isLoadingKnowledge ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Topic</TableHead>
                    <TableHead>Subtopic</TableHead>
                    <TableHead>Information</TableHead>
                    <TableHead>Confidence</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredKnowledgeEntries && filteredKnowledgeEntries.length > 0 ? (
                    filteredKnowledgeEntries.map((entry: AIKnowledgeEntry) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{entry.topic}</TableCell>
                        <TableCell>{entry.subtopic}</TableCell>
                        <TableCell className="max-w-md truncate">{entry.information}</TableCell>
                        <TableCell>
                          <Badge variant={
                            typeof entry.confidence === 'number' && entry.confidence >= 80 ? "default" : 
                            typeof entry.confidence === 'number' && entry.confidence >= 50 ? "outline" : 
                            "destructive"
                          }>
                            {typeof entry.confidence === 'number' ? `${entry.confidence}%` : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {entry.needsReview === true ? 
                            <Badge variant="destructive">Needs Review</Badge> :
                            (entry.needsReview === false ?
                              <Badge variant="success">Reviewed</Badge> :
                              <Badge variant="outline">Unspecified</Badge>)
                          }
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(entry)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="icon"
                              onClick={() => handleDelete(entry.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No knowledge entries found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
        
        {/* Reasoning Patterns Tab */}
        <TabsContent value="reasoning" className="py-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Reasoning Patterns</h2>
            <Button onClick={() => {/* Open reasoning pattern dialog */}}>
              <PlusCircle className="mr-2 h-4 w-4" />
              Add Pattern
            </Button>
          </div>
          
          {isLoadingReasoning ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reasoningPatterns && reasoningPatterns.map((pattern: AIReasoningPattern) => (
                <Card key={pattern.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex justify-between">
                      <span>{pattern.pattern}</span>
                      <Badge variant="default">{pattern.category || 'Uncategorized'}</Badge>
                    </CardTitle>
                    <CardDescription>Priority: {pattern.priority}</CardDescription>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Rules:</h4>
                      <ul className="text-sm list-disc pl-5 space-y-1">
                        {Array.isArray(pattern.rules) && pattern.rules.map((rule: string, index: number) => (
                          <li key={index}>{rule}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2 flex justify-between">
                    <span className="text-xs text-muted-foreground">
                      Created: {new Date(pattern.createdAt).toLocaleDateString()}
                    </span>
                    <div className="flex space-x-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              ))}
              
              {reasoningPatterns && reasoningPatterns.length === 0 && (
                <div className="col-span-2 text-center py-8">
                  <p>No reasoning patterns found.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        {/* System Tasks Tab */}
        <TabsContent value="tasks" className="py-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">System Tasks</h2>
            <Button 
              onClick={() => processTasksMutation.mutate()}
              disabled={processTasksMutation.isPending}
            >
              {processTasksMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BookOpenCheck className="mr-2 h-4 w-4" />
              )}
              Process Pending Tasks
            </Button>
          </div>
          
          {isLoadingTasks ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Completed</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {systemTasks && systemTasks.length > 0 ? (
                    systemTasks.map((task: AISystemTask) => (
                      <TableRow key={task.id}>
                        <TableCell className="font-medium">
                          {task.taskType.replace('_', ' ')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            typeof task.priority === 'number' && task.priority > 75 ? "destructive" : 
                            typeof task.priority === 'number' && task.priority > 50 ? "default" : 
                            typeof task.priority === 'number' && task.priority > 25 ? "outline" : 
                            "secondary"
                          }>
                            {typeof task.priority === 'number' ? task.priority : 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            task.status === 'completed' ? "success" : 
                            task.status === 'in_progress' ? "default" : 
                            task.status === 'failed' ? "destructive" : 
                            "outline"
                          }>
                            {task.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(task.scheduledFor).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {new Date(task.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {task.completedAt ? 
                            new Date(task.completedAt).toLocaleDateString() : 
                            '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-4">
                        No system tasks found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Add Entry Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Knowledge Entry</DialogTitle>
            <DialogDescription>
              Create a new entry in the AI knowledge base.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    placeholder="e.g. Mining, Wallet, Marketplace"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtopic">Subtopic</Label>
                  <Input
                    id="subtopic"
                    name="subtopic"
                    value={formData.subtopic}
                    onChange={handleInputChange}
                    placeholder="e.g. Activation, Rewards, Features"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="information">Information</Label>
                <Textarea
                  id="information"
                  name="information"
                  value={formData.information}
                  onChange={handleInputChange}
                  placeholder="Detailed information about this topic..."
                  className="min-h-[120px]"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="confidence">Confidence ({formData.confidence}%)</Label>
                  <Select 
                    value={formData.confidence.toString()} 
                    onValueChange={handleConfidenceChange}
                  >
                    <SelectTrigger id="confidence">
                      <SelectValue placeholder="Select confidence level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100% - Certain</SelectItem>
                      <SelectItem value="90">90% - Very High</SelectItem>
                      <SelectItem value="80">80% - High</SelectItem>
                      <SelectItem value="70">70% - Good</SelectItem>
                      <SelectItem value="60">60% - Moderate</SelectItem>
                      <SelectItem value="50">50% - Average</SelectItem>
                      <SelectItem value="40">40% - Uncertain</SelectItem>
                      <SelectItem value="30">30% - Low</SelectItem>
                      <SelectItem value="20">20% - Very Low</SelectItem>
                      <SelectItem value="10">10% - Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="source">Source</Label>
                  <Input
                    id="source"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    placeholder="e.g. admin, user_feedback, knowledge_gap"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="relationships">Related Topics</Label>
                <Input
                  id="relationships"
                  name="relationships"
                  value={formData.relationships}
                  onChange={handleInputChange}
                  placeholder="Comma-separated topics e.g. Mining, Wallet"
                />
                <p className="text-sm text-muted-foreground">
                  Enter related topics separated by commas
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="needs-review"
                  checked={formData.needsReview}
                  onCheckedChange={handleReviewChange}
                />
                <Label htmlFor="needs-review">Needs review by another admin</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsAddDialogOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createKnowledgeMutation.isPending}
              >
                {createKnowledgeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <PlusCircle className="mr-2 h-4 w-4" />
                )}
                Create Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Entry Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Edit Knowledge Entry</DialogTitle>
            <DialogDescription>
              Update existing entry in the AI knowledge base.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-topic">Topic</Label>
                  <Input
                    id="edit-topic"
                    name="topic"
                    value={formData.topic}
                    onChange={handleInputChange}
                    placeholder="e.g. Mining, Wallet, Marketplace"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-subtopic">Subtopic</Label>
                  <Input
                    id="edit-subtopic"
                    name="subtopic"
                    value={formData.subtopic}
                    onChange={handleInputChange}
                    placeholder="e.g. Activation, Rewards, Features"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-information">Information</Label>
                <Textarea
                  id="edit-information"
                  name="information"
                  value={formData.information}
                  onChange={handleInputChange}
                  placeholder="Detailed information about this topic..."
                  className="min-h-[120px]"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-confidence">Confidence ({formData.confidence}%)</Label>
                  <Select 
                    value={formData.confidence.toString()} 
                    onValueChange={handleConfidenceChange}
                  >
                    <SelectTrigger id="edit-confidence">
                      <SelectValue placeholder="Select confidence level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="100">100% - Certain</SelectItem>
                      <SelectItem value="90">90% - Very High</SelectItem>
                      <SelectItem value="80">80% - High</SelectItem>
                      <SelectItem value="70">70% - Good</SelectItem>
                      <SelectItem value="60">60% - Moderate</SelectItem>
                      <SelectItem value="50">50% - Average</SelectItem>
                      <SelectItem value="40">40% - Uncertain</SelectItem>
                      <SelectItem value="30">30% - Low</SelectItem>
                      <SelectItem value="20">20% - Very Low</SelectItem>
                      <SelectItem value="10">10% - Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="edit-source">Source</Label>
                  <Input
                    id="edit-source"
                    name="source"
                    value={formData.source}
                    onChange={handleInputChange}
                    placeholder="e.g. admin, user_feedback, knowledge_gap"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-relationships">Related Topics</Label>
                <Input
                  id="edit-relationships"
                  name="relationships"
                  value={formData.relationships}
                  onChange={handleInputChange}
                  placeholder="Comma-separated topics e.g. Mining, Wallet"
                />
                <p className="text-sm text-muted-foreground">
                  Enter related topics separated by commas
                </p>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-needs-review"
                  checked={formData.needsReview}
                  onCheckedChange={handleReviewChange}
                />
                <Label htmlFor="edit-needs-review">Needs review by another admin</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                  setEditingEntry(null);
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={updateKnowledgeMutation.isPending}
              >
                {updateKnowledgeMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Edit className="mr-2 h-4 w-4" />
                )}
                Update Entry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
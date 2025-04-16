import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Brain, Plus } from 'lucide-react';

// Simple interfaces for our data structures
interface AIKnowledgeEntry {
  id: number;
  topic: string;
  subtopic: string;
  information: string;
  confidence: number;
  relationships?: string[];
  source?: string;
  needsReview?: boolean;
}

interface AIReasoningPattern {
  id: number;
  pattern: string;
  description: string;
}

interface AISystemTask {
  id: number;
  taskType: string;
  status: string;
  description: string;
}

/**
 * Fixed AI Knowledge Management Component
 * 
 * Simplified implementation with proper error handling and minimal UI complexity
 * to avoid React rendering issues. Now includes functionality to add new knowledge entries.
 */
export function AIKnowledgeManagementFixed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for active tab
  const [activeTab, setActiveTab] = useState('knowledge');
  
  // Dialog state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    topic: '',
    subtopic: '',
    information: '',
    confidence: 80,
    relationships: '',
    source: 'admin',
    needsReview: false
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
  
  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleConfidenceChange = (value: string) => {
    setFormData(prev => ({ ...prev, confidence: parseInt(value) }));
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
  
  // Query for knowledge entries
  const { 
    data: knowledgeEntries = [], 
    isLoading: isLoadingKnowledge,
    isError: isKnowledgeError
  } = useQuery({
    queryKey: ['/api/admin/ai/knowledge'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/ai/knowledge');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching knowledge entries:', error);
        return [];
      }
    }
  });
  
  // Query for reasoning patterns
  const { 
    data: reasoningPatterns = [], 
    isLoading: isLoadingReasoning,
    isError: isReasoningError
  } = useQuery({
    queryKey: ['/api/admin/ai/reasoning'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/ai/reasoning');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching reasoning patterns:', error);
        return [];
      }
    },
    enabled: activeTab === 'reasoning'
  });
  
  // Query for system tasks
  const { 
    data: systemTasks = [], 
    isLoading: isLoadingTasks,
    isError: isTasksError
  } = useQuery({
    queryKey: ['/api/admin/ai/tasks'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/admin/ai/tasks');
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        return await response.json();
      } catch (error) {
        console.error('Error fetching system tasks:', error);
        return [];
      }
    },
    enabled: activeTab === 'tasks'
  });
  
  return (
    <div className="container mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Brain className="h-6 w-6" />
          <h1 className="text-2xl font-bold">AI Knowledge Management</h1>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Knowledge
        </Button>
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
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Entries</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingKnowledge ? (
                <p>Loading knowledge entries...</p>
              ) : isKnowledgeError ? (
                <p className="text-red-500">Error loading knowledge entries. Please try again.</p>
              ) : knowledgeEntries.length === 0 ? (
                <p>No knowledge entries found.</p>
              ) : (
                <div className="space-y-4">
                  {knowledgeEntries.slice(0, 5).map((entry: AIKnowledgeEntry) => (
                    <Card key={entry.id} className="p-4">
                      <div className="font-medium">{entry.topic} - {entry.subtopic}</div>
                      <div className="text-sm mt-1">{entry.information}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Confidence: {entry.confidence}%
                      </div>
                    </Card>
                  ))}
                  {knowledgeEntries.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      Showing 5 of {knowledgeEntries.length} entries.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Reasoning Patterns Tab */}
        <TabsContent value="reasoning" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>Reasoning Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingReasoning ? (
                <p>Loading reasoning patterns...</p>
              ) : isReasoningError ? (
                <p className="text-red-500">Error loading reasoning patterns. Please try again.</p>
              ) : reasoningPatterns.length === 0 ? (
                <p>No reasoning patterns found.</p>
              ) : (
                <div className="space-y-4">
                  {reasoningPatterns.slice(0, 5).map((pattern: AIReasoningPattern) => (
                    <Card key={pattern.id} className="p-4">
                      <div className="font-medium">{pattern.pattern}</div>
                      <div className="text-sm mt-1">{pattern.description}</div>
                    </Card>
                  ))}
                  {reasoningPatterns.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      Showing 5 of {reasoningPatterns.length} patterns.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* System Tasks Tab */}
        <TabsContent value="tasks" className="py-4">
          <Card>
            <CardHeader>
              <CardTitle>System Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingTasks ? (
                <p>Loading system tasks...</p>
              ) : isTasksError ? (
                <p className="text-red-500">Error loading system tasks. Please try again.</p>
              ) : systemTasks.length === 0 ? (
                <p>No system tasks found.</p>
              ) : (
                <div className="space-y-4">
                  {systemTasks.slice(0, 5).map((task: AISystemTask) => (
                    <Card key={task.id} className="p-4">
                      <div className="font-medium">{task.taskType}</div>
                      <div className="text-sm mt-1">{task.description}</div>
                      <div className="text-xs text-muted-foreground mt-2">
                        Status: {task.status}
                      </div>
                    </Card>
                  ))}
                  {systemTasks.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      Showing 5 of {systemTasks.length} tasks.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Add Knowledge Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Knowledge Entry</DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Input 
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="subtopic">Subtopic</Label>
              <Input 
                id="subtopic"
                name="subtopic"
                value={formData.subtopic}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="information">Information</Label>
              <Textarea
                id="information"
                name="information"
                value={formData.information}
                onChange={handleInputChange}
                rows={4}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="confidence">Confidence ({formData.confidence}%)</Label>
              <Select
                value={formData.confidence.toString()}
                onValueChange={handleConfidenceChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select confidence level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="50">50% (Low)</SelectItem>
                  <SelectItem value="60">60%</SelectItem>
                  <SelectItem value="70">70%</SelectItem>
                  <SelectItem value="80">80% (Default)</SelectItem>
                  <SelectItem value="90">90%</SelectItem>
                  <SelectItem value="100">100% (High)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="relationships">Related Topics (comma-separated)</Label>
              <Input
                id="relationships"
                name="relationships"
                value={formData.relationships}
                onChange={handleInputChange}
                placeholder="e.g. Mining, Staking, Token"
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                defaultValue="admin"
              />
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={createKnowledgeMutation.isPending}
              >
                {createKnowledgeMutation.isPending ? (
                  <>Loading...</>
                ) : (
                  <>Add Entry</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { AIFeedbackForm } from '@/components/ai/ai-feedback-form';
import { 
  BrainCircuit, 
  BotMessageSquare, 
  Sparkles, 
  User2, 
  SendHorizontal,
  X,
  Info,
  Loader2,
  LogIn,
  Maximize2,
  Minimize2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Camera,
  FileUp,
  Upload
} from 'lucide-react';

// Constants
const AI_NAME = 'TSK Assistant';
const INITIAL_MESSAGE = "Hi, I'm the TSK Assistant. How can I help you today?";

// Types
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system'; // Added 'system' role
  content: string;
  timestamp: Date;
  hasRated?: boolean; // Track if the message has received feedback
}

interface ChatResponse {
  answer: string;
  confidence: number;
  sources: string[];
  action?: {
    type: 'upload_document' | 'review_status';
    data: any;
  };
}

interface ChatHistoryResponse {
  history: {
    question: string;
    answer: string;
    timestamp: string;
    context?: any;
  }[];
  hasHistory: boolean;
}

interface AIFeedback {
  messageId: string;
  rating: number; // 1-5 scale
  comment?: string;
  improvementSuggestion?: string;
}

interface FeedbackResponse {
  success: boolean;
  feedback: {
    id: number;
    userId: number;
    rating: number;
    comment: string | null;
    improvementSuggestion: string | null;
    messageId: string;
    createdAt: string;
  };
}

// KYC Document Uploader Component
// This is a simplified version of the ImageUploader from kyc-form.tsx
function KYCDocumentUploader({ 
  type, 
  onChange,
  onUploadComplete
}: { 
  type: string; 
  onChange: (url: string) => void;
  onUploadComplete?: () => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImageMutation = useMutation({
    mutationFn: async ({ type, file }: { type: string, file: File }) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      const response = await fetch('/api/upload/kyc-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload image');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      if (data.imageUrl) {
        onChange(data.imageUrl);
        toast({
          title: "Image Uploaded",
          description: "Document image has been uploaded successfully.",
        });
        if (onUploadComplete) {
          onUploadComplete();
        }
      }
      setIsUploading(false);
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
      setIsUploading(false);
      setFile(null);
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!validTypes.includes(selectedFile.type)) {
        toast({
          title: "Invalid file type",
          description: "Please upload a JPEG, PNG, or GIF image.",
          variant: "destructive",
        });
        return;
      }
      
      // Validate file size (max 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }
      
      setFile(selectedFile);
      uploadImageMutation.mutate({ type, file: selectedFile });
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleClearImage = () => {
    onChange('');
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png,image/gif"
        onChange={handleFileChange}
      />
      
      {/* Preview area */}
      {file || isUploading ? (
        <div className="relative rounded-md border overflow-hidden">
          {isUploading ? (
            <div className="h-40 w-full flex items-center justify-center bg-muted/20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : file && (
            <>
              <img 
                src={URL.createObjectURL(file)} 
                alt={`${type} document`} 
                className="max-h-40 w-full object-cover" 
              />
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-6 w-6"
                onClick={handleClearImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      ) : (
        <div 
          className="border border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleUploadClick}
        >
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Click to upload document</p>
          <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, or GIF. Max 5MB.</p>
        </div>
      )}
    </div>
  );
}

/**
 * AI Chat Component
 * 
 * This component provides a floating chat interface for the TSK AI Assistant.
 * It can be minimized, expanded, and handles message history.
 */
export function AIChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const queryClient = useQueryClient();
  const isAuthenticated = !!user; // Derive authentication status from user

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'initial',
      role: 'assistant',
      content: isAuthenticated 
        ? INITIAL_MESSAGE 
        : "Hi, I'm the TSK Assistant. I can help with basic platform information, but sign in for personalized assistance. Try asking about the TSK platform, how to login, or password recovery.",
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedbackMessageId, setFeedbackMessageId] = useState<string | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [showFeedbackDialog, setShowFeedbackDialog] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showKYCUploadDialog, setShowKYCUploadDialog] = useState(false); // Add KYC dialog state
  const [availableDocumentTypes, setAvailableDocumentTypes] = useState<string[]>([]); // Add document types state
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);


  // Get chat history
  const { data: chatHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/ai/history'],
    queryFn: async () => {
      if (!isAuthenticated) return null;
      const response = await apiRequest('GET', '/api/ai/history');
      return response.json();
    },
    enabled: isAuthenticated && isOpen,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      // For unauthenticated users, always respond locally without API call
      if (!isAuthenticated) {
        // Instead of returning a hardcoded response, let's use the newly
        // improved AI endpoint for unauthenticated users
        try {
          // Wait a moment to simulate server processing
          await new Promise(resolve => setTimeout(resolve, 800));

          // Make the API call even for unauthenticated users
          const response = await apiRequest('POST', '/api/ai/chat', {
            question: message,
            context: {
              currentPage: location
            }
          });

          const data = await response.json();
          return data as ChatResponse;
        } catch (error) {
          console.error("Error in unauthenticated chat:", error);
          // Fallback if API call fails
          return {
            answer: "You need to sign in to use the TSK Assistant. Please log in to access the full AI features.",
            confidence: 1.0,
            sources: []
          } as ChatResponse;
        }
      }

      // For authenticated users, make the API call
      try {
        const response = await apiRequest('POST', '/api/ai/chat', {
          question: message,
          context: {
            currentPage: location
          }
        });
        const data = await response.json();
        return data as ChatResponse;
      } catch (error) {
        console.error("Error in chat:", error);
        throw error; // Re-throw for authenticated users so onError handler works
      }
    },
    onSuccess: (data) => {
      // Handle KYC-related actions
      if (data.action?.type === 'upload_document') {
        setMessages(prev => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            role: 'system', // Use 'system' role for system messages
            content: data.answer,
            timestamp: new Date()
          }
        ]);

        // Show document upload dialog
        const documentTypes = data.action.data.documentTypes;
        setShowKYCUploadDialog(true);
        setAvailableDocumentTypes(documentTypes);
        return;
      }

      if (data.action?.type === 'review_status') {
        const status = data.action.data;
        setMessages(prev => [
          ...prev,
          {
            id: `system-${Date.now()}`,
            role: 'system', // Use 'system' role for system messages
            content: `${data.answer}\n\nStatus: ${status.status}${
              status.rejectionReason ? `\nReason: ${status.rejectionReason}` : ''
            }`,
            timestamp: new Date()
          }
        ]);
        return;
      }

      // Generate a unique ID for this message
      const messageId = `ai-${Date.now()}`;

      // Add AI response to messages
      setMessages(prev => [
        ...prev,
        {
          id: messageId,
          role: 'assistant',
          content: data.answer,
          timestamp: new Date()
        }
      ]);

      // For authenticated users, invalidate chat history query
      if (isAuthenticated) {
        queryClient.invalidateQueries({ queryKey: ['/api/ai/history'] });
      }

      setIsLoading(false);
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to get AI response. Please try again.',
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedback: AIFeedback) => {
      const response = await apiRequest('POST', '/api/ai/feedback', feedback);
      const data = await response.json();
      return data as FeedbackResponse;
    },
    onSuccess: (data) => {
      // Mark the message as rated in our state
      setMessages(prev => 
        prev.map(msg => 
          msg.id === feedbackMessageId 
            ? { ...msg, hasRated: true } 
            : msg
        )
      );

      // Reset feedback state
      setFeedbackMessageId(null);
      setFeedbackRating(null);
      setFeedbackComment('');
      setShowFeedbackDialog(false);

      // Show success message
      toast({
        title: 'Feedback Submitted',
        description: 'Thank you for your feedback! It helps us improve.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Handle opening the feedback dialog
  const handleOpenFeedback = (messageId: string) => {
    if (!isAuthenticated) {
      toast({
        title: 'Sign in required',
        description: 'Please sign in to provide feedback on AI responses.',
        variant: 'default'
      });
      return;
    }

    setFeedbackMessageId(messageId);
    setFeedbackRating(null);
    setFeedbackComment('');
    setShowFeedbackDialog(true);
  };

  // This function is no longer used since we're using the AIFeedbackForm component
  // Keep it for backward compatibility
  const handleSubmitFeedback = () => {
    console.log("This function is deprecated - using AIFeedbackForm instead");
    setShowFeedbackDialog(false);
  };

  // Load chat history on open
  useEffect(() => {
    if (isOpen && chatHistory && chatHistory.hasHistory && messages.length === 1) {
      // Only load history if we only have the initial message
      const historyMessages: ChatMessage[] = [];

      // Start with the initial greeting
      historyMessages.push({
        id: 'initial',
        role: 'assistant',
        content: INITIAL_MESSAGE,
        timestamp: new Date()
      });

      // Add up to 5 most recent conversations
      const recentHistory = chatHistory.history.slice(-5);

      recentHistory.forEach((item: any, index: number) => {
        // Add user question
        historyMessages.push({
          id: `history-user-${index}`,
          role: 'user',
          content: item.question,
          timestamp: new Date(item.timestamp)
        });

        // Add AI response
        historyMessages.push({
          id: `history-ai-${index}`,
          role: 'assistant',
          content: item.answer,
          timestamp: new Date(item.timestamp)
        });
      });

      setMessages(historyMessages);
      scrollToBottom();
    }
  }, [isOpen, chatHistory]);

  // Auto scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message to chat
    setMessages(prev => [
      ...prev,
      {
        id: `user-${Date.now()}`,
        role: 'user',
        content: inputValue,
        timestamp: new Date()
      }
    ]);

    setIsLoading(true);

    // Send to AI
    sendMessageMutation.mutate(inputValue);

    // Clear input
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Handler for document upload in KYC dialog
  const handleDocumentUploaded = (url: string) => {
    setDocumentUrl(url);
  };

  // Handler for upload completion
  const handleUploadComplete = () => {
    // No action needed, just for notification purposes
  };

  // Handler for KYC document submission
  const handleKYCSubmit = async () => {
    if (!selectedDocumentType || !documentUrl) {
      toast({
        title: "Missing Information",
        description: "Please select a document type and upload an image",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Submit document to KYC API
      const response = await apiRequest('POST', '/api/kyc/document', {
        documentType: selectedDocumentType,
        documentUrl: documentUrl
      });

      const result = await response.json();

      // Close dialog
      setShowKYCUploadDialog(false);
      
      // Add AI confirmation response
      setMessages(prev => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          role: 'assistant',
          content: `Thank you! Your ${selectedDocumentType.replace('_', ' ')} has been uploaded successfully and is pending verification. You can check the status in your profile or ask me about your verification status later.`,
          timestamp: new Date()
        }
      ]);

      // Reset form state
      setSelectedDocumentType('');
      setDocumentUrl('');
      
      // Show success toast
      toast({
        title: "Document Submitted",
        description: "Your document has been submitted successfully for verification.",
      });
    } catch (error) {
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "Failed to submit document",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // We'll show the chat for everyone, but with different functionality based on authentication

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Chat Trigger Button */}
      {!isOpen && (
        <Button 
          onClick={() => setIsOpen(true)}
          className="rounded-full p-3 h-12 w-12 bg-primary shadow-lg hover:shadow-xl transition-all"
        >
          <BotMessageSquare className="h-6 w-6" />
        </Button>
      )}

      {/* Chat Interface */}
      {isOpen && (
        <Card className={`
          bg-card border shadow-lg transition-all duration-200 flex flex-col
          ${isExpanded 
            ? 'fixed inset-4 w-auto h-auto md:inset-16 z-50' 
            : 'w-[350px] h-[500px]'
          }
        `}>
          <CardHeader className="px-4 py-2 flex flex-row items-center justify-between space-y-0 border-b">
            <div className="flex items-center">
              <span className="bg-primary p-1 rounded-md mr-2">
                <BrainCircuit className="h-5 w-5 text-primary-foreground" />
              </span>
              <div>
                <CardTitle className="text-base">{AI_NAME}</CardTitle>
                <CardDescription className="text-xs">AI-powered assistant</CardDescription>
              </div>
            </div>
            <div className="flex items-center space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8" 
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="h-8 w-8"
                onClick={() => setIsOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 p-0 overflow-hidden">
            {isLoadingHistory ? (
              <div className="p-4 space-y-4">
                <Skeleton className="h-12 w-3/4" />
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-12 w-2/3 ml-auto" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : (
              <ScrollArea className="h-full px-4 py-2">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div 
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`
                          max-w-[80%] rounded-lg p-3
                          ${message.role === 'user' 
                            ? 'bg-primary text-primary-foreground ml-4' 
                            : 'bg-muted mr-4'
                          }
                        `}
                      >
                        <div className="flex items-center space-x-2 mb-1">
                          {message.role === 'assistant' ? (
                            <>
                              <Sparkles className="h-3 w-3" />
                              <span className="text-xs font-medium">{AI_NAME}</span>
                            </>
                          ) : (
                            <>
                              <User2 className="h-3 w-3" />
                              <span className="text-xs font-medium">You</span>
                            </>
                          )}
                        </div>
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        <div className="mt-1 flex justify-between items-center">
                          {/* Feedback buttons for AI responses only */}
                          {message.role === 'assistant' && message.id !== 'initial' && !message.hasRated && isAuthenticated && (
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full hover:bg-primary hover:text-primary-foreground"
                                onClick={() => handleOpenFeedback(message.id)}
                                title="Rate this response"
                              >
                                <MessageSquare className="h-3 w-3" />
                              </Button>
                            </div>
                          )}

                          {/* Feedback status indicator */}
                          {message.role === 'assistant' && message.hasRated && (
                            <div className="flex items-center">
                              <span className="text-[10px] text-green-500 flex items-center">
                                <ThumbsUp className="h-3 w-3 mr-1" /> Rated
                              </span>
                            </div>
                          )}

                          <span className="text-[10px] opacity-70 ml-auto">
                            {message.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Login button for unauthenticated users */}
                  {!isAuthenticated && !isLoading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && (
                    <div className="flex justify-center my-4">
                      <Link href="/auth">
                        <Button className="flex items-center space-x-2">
                          <LogIn className="h-4 w-4 mr-2" />
                          <span>Login to continue</span>
                        </Button>
                      </Link>
                    </div>
                  )}

                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-muted rounded-lg p-3 mr-4 flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Thinking...</span>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            )}
          </CardContent>

          <CardFooter className="p-2 border-t">
            <form 
              className="flex w-full items-center space-x-2"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
            >
              <Textarea
                placeholder="Type your message..."
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-10 flex-1 resize-none"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                disabled={isLoading || !inputValue.trim()}
              >
                <SendHorizontal className="h-4 w-4" />
              </Button>
            </form>
          </CardFooter>
        </Card>
      )}

      {/* Feedback Dialog */}
      <Dialog open={showFeedbackDialog} onOpenChange={setShowFeedbackDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>AI Assistant Feedback</DialogTitle>
            <DialogDescription>
              Your feedback helps train and improve the AI assistant. Please rate the response and provide any additional comments.
            </DialogDescription>
          </DialogHeader>
          
          {feedbackMessageId && (
            // Find the message with this ID (the AI response)
            (() => {
              const aiMessageIndex = messages.findIndex(m => m.id === feedbackMessageId);
              if (aiMessageIndex < 0) return null;
              
              // Get the user message that came before this AI response
              const userMessageIndex = aiMessageIndex - 1;
              const userMessage = userMessageIndex >= 0 ? messages[userMessageIndex] : null;
              
              if (!userMessage || userMessage.role !== 'user') return null;
              
              return (
                <AIFeedbackForm
                  conversationId={feedbackMessageId}
                  question={userMessage.content}
                  answer={messages[aiMessageIndex].content}
                  onClose={() => setShowFeedbackDialog(false)}
                  applicationArea={location}
                />
              );
            })()
          )}
        </DialogContent>
      </Dialog>

      {/* KYC Document Upload Dialog */}
      <Dialog open={showKYCUploadDialog} onOpenChange={setShowKYCUploadDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Upload KYC Document</DialogTitle>
            <DialogDescription>
              Upload your identification document to complete verification.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="documentType">Document Type</Label>
              <Select
                value={selectedDocumentType}
                onValueChange={setSelectedDocumentType}
              >
                <SelectTrigger id="documentType">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {availableDocumentTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type === 'passport' ? 'Passport' : 
                       type === 'drivers_license' ? 'Driver\'s License' :
                       type === 'national_id' ? 'National ID' : 
                       type === 'residence_permit' ? 'Residence Permit' : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Document Image</Label>
              <KYCDocumentUploader
                type={selectedDocumentType}
                onChange={handleDocumentUploaded}
                onUploadComplete={handleUploadComplete}
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="secondary" 
              onClick={() => setShowKYCUploadDialog(false)}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={!documentUrl || isSubmitting}
              onClick={handleKYCSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting
                </>
              ) : 'Submit Document'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
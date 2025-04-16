import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Star, StarHalf } from "lucide-react";

interface AIFeedbackFormProps {
  conversationId: string;
  question: string;
  answer: string;
  onClose?: () => void;
  applicationArea?: string;
}

export function AIFeedbackForm({ 
  conversationId, 
  question, 
  answer,
  onClose,
  applicationArea = "general" 
}: AIFeedbackFormProps) {
  const { toast } = useToast();
  const [rating, setRating] = useState<number>(5);
  const [feedback, setFeedback] = useState("");
  const [topics, setTopics] = useState<string[]>([]);
  const [topicInput, setTopicInput] = useState("");

  // Define a feedback mutation
  const feedbackMutation = useMutation({
    mutationFn: async () => {
      // Validate required fields
      if (!conversationId || !question || !answer) {
        throw new Error("Missing required fields");
      }

      const response = await apiRequest("POST", "/api/ai/feedback", {
        conversationId,
        question,
        answer,
        rating,
        feedback: feedback.trim() || undefined,
        topics: topics.length > 0 ? topics : undefined,
        applicationArea
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit feedback");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Feedback submitted",
        description: "Thank you for your feedback!",
      });
      
      if (onClose) {
        onClose();
      }
    },
    onError: (error: Error) => {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Failed to submit feedback",
        description: error.message || "There was an error submitting your feedback. Please try again.",
        variant: "destructive",
      });
    }
  });

  // Handle adding a topic
  const handleAddTopic = () => {
    if (topicInput.trim() && !topics.includes(topicInput.trim())) {
      setTopics([...topics, topicInput.trim()]);
      setTopicInput("");
    }
  };

  // Handle removing a topic
  const handleRemoveTopic = (topicToRemove: string) => {
    setTopics(topics.filter(topic => topic !== topicToRemove));
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    feedbackMutation.mutate();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-lg">Rate this response</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label className="mb-2 block">How helpful was this response?</Label>
              <div className="flex justify-center p-2">
                <RadioGroup 
                  value={rating.toString()} 
                  onValueChange={(value) => setRating(parseInt(value))}
                  className="flex space-x-2"
                >
                  {[1, 2, 3, 4, 5].map((value) => (
                    <div key={value} className="flex flex-col items-center">
                      <RadioGroupItem 
                        id={`rating-${value}`} 
                        value={value.toString()} 
                        className="sr-only" 
                      />
                      <Label 
                        htmlFor={`rating-${value}`}
                        className={`flex flex-col items-center cursor-pointer p-2 rounded-md transition-all ${
                          rating === value 
                            ? 'bg-primary/10 text-primary' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        <Star className={`h-6 w-6 ${
                          value <= rating ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 dark:text-gray-600'
                        }`} />
                        <span className="text-xs mt-1">{value}</span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>

            <div>
              <Label htmlFor="feedback">Additional feedback (optional)</Label>
              <Textarea
                id="feedback"
                placeholder="What could be improved about this response?"
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="flex space-x-2 justify-end">
              {onClose && (
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              )}
              <Button 
                type="submit" 
                disabled={feedbackMutation.isPending}
              >
                {feedbackMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Feedback"
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
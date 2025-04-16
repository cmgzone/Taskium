import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Upload, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// Define schema for form validation
const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }).max(500),
  category: z.string().min(1, { message: "Category is required" }),
  tags: z.string().optional(),
  published: z.boolean().default(false),
  file: z.instanceof(File, { message: "PDF file is required" }),
});

type FormValues = z.infer<typeof formSchema>;

export default function WhitepaperUploadForm() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fileError, setFileError] = useState<string | null>(null);
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "",
      tags: "",
      published: false,
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: FormValues) => {
      const formData = new FormData();
      formData.append("title", data.title);
      formData.append("description", data.description);
      formData.append("category", data.category);
      formData.append("tags", data.tags || "");
      formData.append("published", data.published.toString());
      formData.append("file", data.file);

      const response = await fetch("/api/admin/whitepapers", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to upload whitepaper");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Whitepaper uploaded successfully",
        description: "Your whitepaper has been uploaded and is now available.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/whitepapers'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormValues) => {
    uploadMutation.mutate(data);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);
    
    if (!file) {
      setFileError("Please select a PDF file");
      return;
    }
    
    if (file.type !== "application/pdf") {
      setFileError("Only PDF files are allowed");
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) { // 10 MB max
      setFileError("File size must be less than 10 MB");
      return;
    }
    
    form.setValue("file", file);
  };

  const clearFileSelection = () => {
    form.setValue("file", undefined as any);
    setFileError(null);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Whitepaper title" {...field} />
              </FormControl>
              <FormDescription>
                Give your whitepaper a clear and descriptive title
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Brief description of the whitepaper"
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Provide a short summary of what this whitepaper covers
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Technical, Roadmap, Tokenomics" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (comma separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. blockchain, tokenomics, roadmap" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div>
          <FormLabel htmlFor="file-upload">PDF Document</FormLabel>
          <div className="mt-1">
            {!form.getValues("file") ? (
              <div 
                className="flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md hover:border-primary/50 cursor-pointer transition-colors"
                onClick={() => document.getElementById("file-upload")?.click()}
              >
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                  <div className="flex text-sm">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-primary hover:text-primary/80"
                    >
                      <span>Upload a PDF file</span>
                      <Input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        accept="application/pdf"
                        className="sr-only"
                        onChange={handleFileChange}
                      />
                    </label>
                    <p className="pl-1 text-muted-foreground">or drag and drop</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    PDF up to 10MB
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 border rounded-md">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-primary" />
                  <span className="text-sm font-medium">{form.getValues("file").name}</span>
                </div>
                <Button type="button" variant="ghost" size="sm" onClick={clearFileSelection}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
            {fileError && <p className="mt-2 text-sm text-destructive">{fileError}</p>}
          </div>
        </div>
        
        <FormField
          control={form.control}
          name="published"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <FormLabel className="text-base">Publish immediately</FormLabel>
                <FormDescription>
                  If enabled, the whitepaper will be visible to all users immediately
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
        
        <Button 
          type="submit"
          className="w-full"
          disabled={uploadMutation.isPending}
        >
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload Whitepaper"
          )}
        </Button>
      </form>
    </Form>
  );
}
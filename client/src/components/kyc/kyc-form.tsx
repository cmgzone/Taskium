import React, { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { Camera, FileUp, Loader2, Upload, X } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// KYC form schema
const kycFormSchema = z.object({
  fullName: z.string().min(3, { message: "Full name must be at least 3 characters" }),
  country: z.string().min(2, { message: "Country is required" }),
  documentType: z.enum(["passport", "drivers_license", "national_id", "residence_permit"]),
  documentId: z.string().min(3, { message: "Document ID is required" }),
  frontImageUrl: z.string().optional(),
  backImageUrl: z.string().optional(),
  selfieImageUrl: z.string().optional(),
});

type KycFormValues = z.infer<typeof kycFormSchema>;

// The ImageUploader component
function ImageUploader({ 
  type, 
  value, 
  onChange 
}: { 
  type: string; 
  value?: string; 
  onChange: (url: string) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadImageMutation = useMutation({
    mutationFn: async ({ type, file }: { type: string, file: File }) => {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      console.log(`Uploading file: ${file.name} (${file.size} bytes), type: ${file.type}`);
      
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
      console.log("Upload success:", data);
      if (data.imageUrl) {
        onChange(data.imageUrl);
        toast({
          title: "Image Uploaded",
          description: "Document image has been uploaded successfully.",
        });
      }
      setIsUploading(false);
      setFile(null);
    },
    onError: (error: Error) => {
      console.error("Upload error:", error);
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
      {value ? (
        <div className="relative rounded-md border overflow-hidden">
          <img 
            src={value} 
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
        </div>
      ) : (
        <div 
          className="border border-dashed rounded-md p-8 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors"
          onClick={handleUploadClick}
        >
          {isUploading ? (
            <>
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin mb-2" />
              <p className="text-sm text-muted-foreground">Uploading...</p>
            </>
          ) : (
            <>
              {type === 'selfie' ? (
                <Camera className="h-10 w-10 text-muted-foreground mb-2" />
              ) : (
                <FileUp className="h-10 w-10 text-muted-foreground mb-2" />
              )}
              <p className="text-sm text-muted-foreground">Click to upload {type} image</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}


export default function KycForm() {
  const { toast } = useToast();
  
  // Get current KYC status
  const { data: kycStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/kyc/status"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/kyc/status");
      return response.json();
    }
  });
  
  const form = useForm<KycFormValues>({
    resolver: zodResolver(kycFormSchema),
    defaultValues: {
      fullName: "",
      country: "",
      documentType: "passport",
      documentId: "",
      frontImageUrl: "",
      backImageUrl: "",
      selfieImageUrl: "",
    },
  });
  
  // Separate mutations for image uploads
  const uploadImageMutation = useMutation({
    mutationFn: async ({ type, file }: { type: string, file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);
      
      console.log(`Uploading KYC image for type: ${type}`);
      
      const response = await fetch('/api/upload/kyc-image', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Upload error response:", errorText);
        throw new Error(`Failed to upload image: ${response.status} ${response.statusText}`);
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log("Upload success response:", data);
      toast({
        title: "Image Uploaded",
        description: "Document image has been uploaded successfully.",
      });
    },
    onError: (error: Error) => {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const submitKycMutation = useMutation({
    mutationFn: async (data: KycFormValues) => {
      console.log("Submitting KYC data:", data);
      
      const response = await apiRequest("POST", "/api/kyc/submit", {
        fullName: data.fullName,
        country: data.country,
        documentType: data.documentType,
        documentId: data.documentId,
        frontImageUrl: data.frontImageUrl,
        backImageUrl: data.backImageUrl,
        selfieImageUrl: data.selfieImageUrl
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Unknown error" }));
        console.error("KYC submission error:", errorData);
        throw new Error(errorData.message || "Failed to submit KYC information");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC Submitted",
        description: "Your identity verification request has been submitted and is pending review.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/kyc/status"] });
      form.reset();
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  function onSubmit(data: KycFormValues) {
    // Validate that at least the front image is uploaded
    if (!data.frontImageUrl) {
      toast({
        title: "Missing Document Image",
        description: "Please upload the front image of your ID document",
        variant: "destructive",
      });
      return;
    }
    
    submitKycMutation.mutate(data);
  }
  
  // Status badge component
  const StatusBadge = ({ status }: { status: string }) => {
    const variants: Record<string, any> = {
      pending: { variant: "outline", className: "bg-yellow-50 border-yellow-200 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400" },
      verified: { variant: "outline", className: "bg-green-50 border-green-200 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
      rejected: { variant: "outline", className: "bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:text-red-400" },
      none: { variant: "outline", className: "bg-gray-50 border-gray-200 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400" },
    };
    
    return (
      <Badge
        variant={variants[status]?.variant || "outline"}
        className={variants[status]?.className}
      >
        {status === "none" ? "Not Submitted" : status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };
  
  // Show loading state
  if (statusLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification (KYC)</CardTitle>
          <CardDescription>
            Submit your identity documents for verification
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }
  
  // If KYC is already submitted or verified, show status
  if (kycStatus && kycStatus.status && kycStatus.status !== "unverified") {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Identity Verification (KYC)</CardTitle>
          <CardDescription>
            Your identity verification status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-medium">Status:</span>
              <StatusBadge status={kycStatus.status} />
            </div>
            
            {kycStatus.submissionDate && (
              <div className="text-sm">
                <span className="text-muted-foreground">Submitted on:</span>{" "}
                {new Date(kycStatus.submissionDate).toLocaleDateString()}
              </div>
            )}
            
            {kycStatus.status === "rejected" && kycStatus.rejectionReason && (
              <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50 rounded-md text-sm">
                <p className="font-medium text-red-700 dark:text-red-400">Rejection Reason:</p>
                <p className="mt-1 text-red-600 dark:text-red-300">{kycStatus.rejectionReason}</p>
                <p className="mt-3 text-sm text-red-600 dark:text-red-300">
                  You can submit a new KYC application by contacting support.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Show form for submitting KYC
  return (
    <Card>
      <CardHeader>
        <CardTitle>Identity Verification (KYC)</CardTitle>
        <CardDescription>
          Verify your identity to access all platform features
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <FormControl>
                    <Input placeholder="United States" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="documentType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Type</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a document type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="passport">Passport</SelectItem>
                        <SelectItem value="drivers_license">Driver's License</SelectItem>
                        <SelectItem value="national_id">National ID</SelectItem>
                        <SelectItem value="residence_permit">Residence Permit</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="documentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document ID</FormLabel>
                  <FormControl>
                    <Input placeholder="123456789" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="mt-6 mb-2">
              <h3 className="text-base font-medium mb-2">Document Images</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Please upload clear images of your identification documents
              </p>
              
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="frontImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader
                        type="front"
                        value={field.value}
                        onChange={(url) => form.setValue('frontImageUrl', url)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="backImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader
                        type="back"
                        value={field.value}
                        onChange={(url) => form.setValue('backImageUrl', url)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="selfieImageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <ImageUploader
                        type="selfie"
                        value={field.value}
                        onChange={(url) => form.setValue('selfieImageUrl', url)}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            <CardFooter className="px-0 pt-4">
              <Button
                type="submit"
                className="w-full"
                disabled={submitKycMutation.isPending}
              >
                {submitKycMutation.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Submit Verification
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
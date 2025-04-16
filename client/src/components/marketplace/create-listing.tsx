import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiRequest } from "@/lib/queryClient";
import { Loader2 } from "lucide-react";

interface CreateListingProps {
  onSuccess?: () => void;
}

const listingSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  price: z.coerce.number().positive("Price must be greater than 0"),
  category: z.string().min(1, "Please select a category"),
  subcategory: z.string().optional(),
  condition: z.string().optional(),
  tags: z.string().optional(),
  features: z.string().optional(),
  imageUrl: z.string().url("Please enter a valid URL").optional().or(z.literal(''))
});

export default function CreateListing({ onSuccess }: CreateListingProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("");
  
  const form = useForm<z.infer<typeof listingSchema>>({
    resolver: zodResolver(listingSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 1,
      category: "",
      subcategory: "",
      condition: "",
      tags: "",
      features: "",
      imageUrl: ""
    }
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: z.infer<typeof listingSchema>) => {
      const res = await apiRequest("POST", "/api/marketplace", data);
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Listing created!",
        description: "Your item has been submitted for approval.",
      });
      
      form.reset();
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create listing",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const onSubmit = (data: z.infer<typeof listingSchema>) => {
    // Create metadata JSON object
    const metadata = {
      subcategory: data.subcategory || undefined,
      condition: data.condition || undefined,
      tags: data.tags ? data.tags.split(',').map(tag => tag.trim()) : undefined,
      features: data.features ? data.features.split(',').map(feature => feature.trim()) : undefined
    };
    
    // Convert to JSON string and add to form data
    const submitData = {
      ...data,
      metadata: JSON.stringify(metadata)
    };
    
    // Remove the individual metadata fields from the submitted data
    delete submitData.subcategory;
    delete submitData.condition;
    delete submitData.tags;
    delete submitData.features;
    
    createItemMutation.mutate(submitData);
  };

  const categories = [
    { id: "digital", name: "Digital Goods" },
    { id: "services", name: "Services" },
    { id: "physical", name: "Physical Items" },
    { id: "collectibles", name: "Collectibles" },
    { id: "other", name: "Other" }
  ];
  
  // Subcategories based on current category
  const subcategories = {
    digital: [
      { id: "software", name: "Software" },
      { id: "art", name: "Digital Art" },
      { id: "ebooks", name: "E-Books" },
      { id: "videos", name: "Video Content" }
    ],
    services: [
      { id: "development", name: "Development" },
      { id: "design", name: "Design" },
      { id: "consulting", name: "Consulting" },
      { id: "education", name: "Education" }
    ],
    physical: [
      { id: "electronics", name: "Electronics" },
      { id: "apparel", name: "Apparel" },
      { id: "accessories", name: "Accessories" },
      { id: "collectibles", name: "Collectibles" }
    ],
    collectibles: [
      { id: "cards", name: "Cards" },
      { id: "art", name: "Art" },
      { id: "memorabilia", name: "Memorabilia" },
      { id: "vintage", name: "Vintage Items" }
    ],
    other: [
      { id: "misc", name: "Miscellaneous" }
    ]
  };
  
  // Condition options
  const conditions = [
    { id: "new", name: "New" },
    { id: "like_new", name: "Like New" },
    { id: "good", name: "Good" },
    { id: "fair", name: "Fair" },
    { id: "poor", name: "Poor" }
  ];

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create Marketplace Listing</DialogTitle>
        <DialogDescription>
          List an item or service to sell for $TSK tokens. Your listing will be reviewed before appearing in the marketplace.
        </DialogDescription>
      </DialogHeader>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input placeholder="Enter a title for your listing" {...field} />
                </FormControl>
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
                    placeholder="Describe your item or service in detail" 
                    rows={4}
                    {...field} 
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Price ($TSK)</FormLabel>
                  <FormControl>
                    <Input type="number" min="1" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedCategory(value);
                      // Reset subcategory when category changes
                      form.setValue("subcategory", "");
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Subcategory - only show if a category is selected */}
          {selectedCategory && subcategories[selectedCategory as keyof typeof subcategories] && (
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select subcategory" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {subcategories[selectedCategory as keyof typeof subcategories].map(subcategory => (
                        <SelectItem key={subcategory.id} value={subcategory.id}>
                          {subcategory.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Condition - useful for physical items */}
          {(selectedCategory === "physical" || selectedCategory === "collectibles") && (
            <FormField
              control={form.control}
              name="condition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condition</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {conditions.map(condition => (
                        <SelectItem key={condition.id} value={condition.id}>
                          {condition.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          
          {/* Tags - comma separated */}
          <FormField
            control={form.control}
            name="tags"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tags (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter tags separated by commas (e.g., rare, limited, exclusive)" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Features - comma separated */}
          <FormField
            control={form.control}
            name="features"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Features (Optional)</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder="Enter key features or highlights separated by commas" 
                    rows={2}
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Image URL */}
          <FormField
            control={form.control}
            name="imageUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Image URL (Optional)</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Enter URL for your item image" 
                    {...field} 
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <DialogFooter className="mt-6">
            <Button 
              type="submit" 
              disabled={createItemMutation.isPending}
              className="w-full"
            >
              {createItemMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Listing...
                </>
              ) : (
                'Create Listing'
              )}
            </Button>
          </DialogFooter>
        </form>
      </Form>
    </>
  );
}

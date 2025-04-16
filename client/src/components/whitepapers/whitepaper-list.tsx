import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, FileText, Download, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Whitepaper {
  id: number;
  title: string;
  description: string;
  fileUrl: string;
  category: string;
  tags: string[];
  published: boolean;
  uploadedBy: number;
  createdAt: string;
  updatedAt: string;
}

export default function WhitepaperList() {
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showUnpublished, setShowUnpublished] = useState(isAdmin);

  const { data: whitepapers, isLoading, error } = useQuery<Whitepaper[]>({
    queryKey: ['/api/whitepapers', { publishedOnly: !showUnpublished }],
    queryFn: async ({ queryKey }) => {
      const [_, { publishedOnly }] = queryKey as [string, { publishedOnly: boolean }];
      const res = await fetch(`/api/whitepapers?publishedOnly=${publishedOnly}`);
      if (!res.ok) {
        throw new Error("Failed to fetch whitepapers");
      }
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-48">
        <p className="text-destructive">Error loading whitepapers: {error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    );
  }

  if (!whitepapers || whitepapers.length === 0) {
    return (
      <div className="text-center p-8 border rounded-md bg-muted/20">
        <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium">No whitepapers available</h3>
        <p className="text-muted-foreground mt-2">
          {isAdmin 
            ? "Create your first whitepaper by clicking the 'Upload Whitepaper' button above." 
            : "Check back later for new whitepapers."}
        </p>
      </div>
    );
  }

  return (
    <div>
      {isAdmin && (
        <div className="mb-4 flex justify-end">
          <Button
            variant="outline"
            onClick={() => setShowUnpublished(!showUnpublished)}
            className="flex items-center gap-2"
          >
            {showUnpublished ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showUnpublished ? "Hide Unpublished" : "Show Unpublished"}
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {whitepapers.map((whitepaper) => (
          <Card key={whitepaper.id} className="flex flex-col h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{whitepaper.title}</CardTitle>
                {!whitepaper.published && (
                  <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
                    Draft
                  </Badge>
                )}
              </div>
              <CardDescription>
                {new Date(whitepaper.createdAt).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-4">{whitepaper.description}</p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="secondary">{whitepaper.category}</Badge>
                {whitepaper.tags && whitepaper.tags.map((tag, i) => (
                  <Badge key={i} variant="outline">{tag}</Badge>
                ))}
              </div>
            </CardContent>
            <Separator />
            <CardFooter className="pt-4">
              <Button asChild className="w-full" variant="default">
                <a href={whitepaper.fileUrl} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2">
                  <Download className="h-4 w-4" />
                  Download PDF
                </a>
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
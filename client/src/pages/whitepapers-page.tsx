import { useState } from "react";
import { FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import WhitepaperList from "@/components/whitepapers/whitepaper-list";
import WhitepaperUploadForm from "@/components/whitepapers/whitepaper-upload-form";
import { useAuth } from "@/hooks/use-auth";

export default function WhitepapersPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  return (
    <div className="container py-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Whitepapers</h1>
          <p className="text-muted-foreground mt-1">
            Access essential documentation and technical specifications about the TSK platform
          </p>
        </div>
        
        {isAdmin && (
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Upload Whitepaper
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>Upload Whitepaper</DialogTitle>
                <DialogDescription>
                  Add a new whitepaper to the TSK platform. Fill out the form below with the whitepaper details.
                </DialogDescription>
              </DialogHeader>
              <WhitepaperUploadForm />
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="list" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            All Whitepapers
          </TabsTrigger>
          <TabsTrigger value="featured" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Featured
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="list" className="mt-6">
          <WhitepaperList />
        </TabsContent>
        
        <TabsContent value="featured" className="mt-6">
          <div className="text-center p-8 border rounded-md bg-muted/20">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium">Featured Content Coming Soon</h3>
            <p className="text-muted-foreground mt-2">
              We're currently curating our featured whitepaper collection. Check back soon!
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
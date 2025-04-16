import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

export default function EmbeddedAdManagement() {
  const { toast } = useToast();
  // State for entries that need to be removed
  const [entriesRemoved, setEntriesRemoved] = useState(false);

  // Mock data that needs to be cleared
  const [mockedAds, setMockedAds] = useState<any[]>([]);

  useEffect(() => {
    // Immediately clear any mock data when component mounts
    setMockedAds([]);
    setEntriesRemoved(true);
  }, []);

  const removeAllEntries = () => {
    setMockedAds([]);
    setEntriesRemoved(true);
    
    toast({
      title: "All ad entries removed",
      description: "All embedded ad entries have been successfully removed from the display.",
      variant: "default",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Embedded Ads Management</h2>
      </div>

      <div className="bg-green-50 text-green-800 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-900 p-4 rounded-lg flex items-start">
        <AlertCircle className="h-4 w-4 mt-1 mr-2 flex-shrink-0" />
        <div>
          <h5 className="font-medium leading-none tracking-tight mb-1">Ads Completely Disabled</h5>
          <div className="text-sm">
            All embedded ads have been removed from the application.
          </div>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Complete Ad Removal</CardTitle>
          <CardDescription>
            All types of advertisements have been removed from the application.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p>
              The embedded advertisement system has been completely removed from the application
              platform-wide. This includes:
            </p>
            
            <ul className="list-disc list-inside space-y-1 text-sm ml-4">
              <li>Popup ads during mining</li>
              <li>Banner advertisements</li>
              <li>Embedded marketing content</li>
              <li>All sponsored links and materials</li>
            </ul>
            
            {entriesRemoved ? (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg mt-4 flex items-start">
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 mr-2 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold mb-1">All Ad Entries Cleared</h3>
                  <p className="text-sm">
                    All entries have been removed from the display. The ad system is completely disabled.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg mt-4">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Display Entries</h3>
                  <Button variant="default" size="sm" onClick={removeAllEntries}>
                    Clear All Entries
                  </Button>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Priority</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockedAds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                          No ad entries to display
                        </TableCell>
                      </TableRow>
                    ) : (
                      mockedAds.map((ad) => (
                        <TableRow key={ad.id}>
                          <TableCell>{ad.title}</TableCell>
                          <TableCell>{ad.type}</TableCell>
                          <TableCell>{ad.duration}s</TableCell>
                          <TableCell>{ad.priority}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
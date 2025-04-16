import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function BannerManagement() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Banner Management</h2>
      </div>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Feature Removed</AlertTitle>
        <AlertDescription>
          The banner management system has been removed from the application.
        </AlertDescription>
      </Alert>
      
      <Card>
        <CardHeader>
          <CardTitle>Banner System Removed</CardTitle>
          <CardDescription>
            The banner system has been removed due to persistent technical issues.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>
            The banner functionality has been discontinued in this version of the application.
            If you need to display promotional content, please use alternative methods such as
            in-app notifications or other content delivery systems.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
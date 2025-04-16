import { useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function TestUploadPage() {
  const { toast } = useToast();
  const [kycType, setKycType] = useState<string>("front");
  const [kycFile, setKycFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [adFile, setAdFile] = useState<File | null>(null);
  const [marketplaceFile, setMarketplaceFile] = useState<File | null>(null);
  
  const [kycResult, setKycResult] = useState<any>(null);
  const [bannerResult, setBannerResult] = useState<any>(null);
  const [adResult, setAdResult] = useState<any>(null);
  const [marketplaceResult, setMarketplaceResult] = useState<any>(null);

  const handleFileUpload = async (
    e: FormEvent,
    file: File | null,
    uploadUrl: string,
    fileType: string,
    additionalData: Record<string, string> = {},
    setResult: (result: any) => void
  ) => {
    e.preventDefault();
    
    if (!file) {
      toast({
        title: "Error",
        description: "Please select a file to upload",
        variant: "destructive",
      });
      return;
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "File size exceeds the 10MB limit",
        variant: "destructive",
      });
      setResult({ error: "File size exceeds the 10MB limit" });
      return;
    }
    
    // Validate file type
    const allowedTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Error",
        description: `File type '${file.type}' is not allowed. Please upload one of these types: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX`,
        variant: "destructive",
      });
      setResult({ error: `File type '${file.type}' is not allowed` });
      return;
    }
    
    try {
      setResult({ status: "Uploading..." });
      
      // Create form data
      const formData = new FormData();
      formData.append("file", file);
      
      // Add any additional form data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, value);
      });
      
      console.log(`Uploading ${fileType} (${file.size} bytes, ${file.type}) to ${uploadUrl}`);
      
      // Send the request
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        credentials: "include"
      });
      
      // Parse the response
      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        setResult({ error: "Failed to parse server response" });
        toast({
          title: "Error",
          description: "Failed to parse server response",
          variant: "destructive",
        });
        return;
      }
      
      if (response.ok) {
        console.log(`Upload successful:`, data);
        setResult(data);
        toast({
          title: "Success",
          description: `${fileType} uploaded successfully!`,
        });
        
        // Test accessing the uploaded file
        if (data.imageUrl) {
          fetch(data.imageUrl, { method: 'HEAD' })
            .then(headResponse => {
              console.log(`File accessibility check: ${headResponse.status} ${headResponse.statusText}`);
              if (!headResponse.ok) {
                console.warn(`Warning: Uploaded file may not be accessible: ${data.imageUrl}`);
              }
            })
            .catch(err => {
              console.warn(`Warning: Failed to check file accessibility: ${err}`);
            });
        }
      } else {
        console.error("Upload failed:", data);
        setResult({ error: data });
        toast({
          title: "Error",
          description: data.message || "Upload failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      setResult({ error: String(error) });
      toast({
        title: "Error",
        description: "Failed to upload file. Please check console for details.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold mb-6">File Upload Test</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* KYC Document Upload */}
        <Card>
          <CardHeader>
            <CardTitle>KYC Document Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              className="space-y-4"
              onSubmit={(e) => handleFileUpload(
                e, 
                kycFile, 
                "/api/upload/kyc-image", 
                "KYC document",
                { type: kycType },
                setKycResult
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="kycType">Document Type</Label>
                <Select
                  value={kycType}
                  onValueChange={setKycType}
                >
                  <SelectTrigger id="kycType">
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="front">ID Front</SelectItem>
                    <SelectItem value="back">ID Back</SelectItem>
                    <SelectItem value="selfie">Selfie with ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="kycFile">Select file</Label>
                <Input 
                  id="kycFile" 
                  type="file" 
                  onChange={(e) => e.target.files && setKycFile(e.target.files[0])} 
                />
              </div>
              
              <Button type="submit">Upload KYC Document</Button>
              
              {kycResult && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(kycResult, null, 2)}
                  </pre>
                  {kycResult.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={kycResult.imageUrl} 
                        alt="Uploaded KYC" 
                        className="max-h-40 rounded border" 
                      />
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Banner Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Banner Image Upload (Admin Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              className="space-y-4"
              onSubmit={(e) => handleFileUpload(
                e, 
                bannerFile, 
                "/api/admin/upload/banner-image", 
                "Banner image",
                {},
                setBannerResult
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="bannerFile">Select file</Label>
                <Input 
                  id="bannerFile" 
                  type="file" 
                  onChange={(e) => e.target.files && setBannerFile(e.target.files[0])} 
                />
              </div>
              
              <Button type="submit">Upload Banner Image</Button>
              
              {bannerResult && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(bannerResult, null, 2)}
                  </pre>
                  {bannerResult.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={bannerResult.imageUrl} 
                        alt="Uploaded Banner" 
                        className="max-h-40 rounded border" 
                      />
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Ad Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Ad Image Upload (Admin Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              className="space-y-4"
              onSubmit={(e) => handleFileUpload(
                e, 
                adFile, 
                "/api/admin/upload/ad-image", 
                "Ad image",
                {},
                setAdResult
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="adFile">Select file</Label>
                <Input 
                  id="adFile" 
                  type="file" 
                  onChange={(e) => e.target.files && setAdFile(e.target.files[0])} 
                />
              </div>
              
              <Button type="submit">Upload Ad Image</Button>
              
              {adResult && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(adResult, null, 2)}
                  </pre>
                  {adResult.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={adResult.imageUrl} 
                        alt="Uploaded Ad" 
                        className="max-h-40 rounded border" 
                      />
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Marketplace Item Image Upload */}
        <Card>
          <CardHeader>
            <CardTitle>Marketplace Item Image Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <form 
              className="space-y-4"
              onSubmit={(e) => handleFileUpload(
                e, 
                marketplaceFile, 
                "/api/upload/marketplace-image", 
                "Marketplace image",
                {},
                setMarketplaceResult
              )}
            >
              <div className="space-y-2">
                <Label htmlFor="marketplaceFile">Select file</Label>
                <Input 
                  id="marketplaceFile" 
                  type="file" 
                  onChange={(e) => e.target.files && setMarketplaceFile(e.target.files[0])} 
                />
              </div>
              
              <Button type="submit">Upload Marketplace Image</Button>
              
              {marketplaceResult && (
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <pre className="text-xs overflow-auto">
                    {JSON.stringify(marketplaceResult, null, 2)}
                  </pre>
                  {marketplaceResult.imageUrl && (
                    <div className="mt-2">
                      <img 
                        src={marketplaceResult.imageUrl} 
                        alt="Uploaded Marketplace" 
                        className="max-h-40 rounded border" 
                      />
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
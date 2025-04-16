import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, CheckCircle, XCircle, Users, ClipboardCheck, FileText, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatAddress } from "@/lib/contract-utils";

interface UserKyc {
  id: number;
  userId: number;
  status: string;
  fullName: string;
  country: string;
  documentType: string;
  documentId: string;
  submissionDate: string;
  verificationDate?: string;
  rejectionReason?: string;
  frontImageUrl?: string;
  backImageUrl?: string;
  selfieImageUrl?: string;
  user: {
    id: number;
    username: string;
    walletAddress?: string;
    tokenBalance: number;
  };
}

interface KycAnalysis {
  recommendation: 'approve' | 'review' | 'reject';
  confidenceScore: number;
  checks: Array<{
    check: string;
    passed: boolean;
    details: string;
  }>;
  summary: string;
}

export default function KycManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedKyc, setSelectedKyc] = useState<UserKyc | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<"verified" | "rejected">("verified");
  const [rejectionReason, setRejectionReason] = useState("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"pending" | "verified">("pending");
  const [analysis, setAnalysis] = useState<KycAnalysis | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  
  const { toast } = useToast();
  
  const { data: pendingKyc, isLoading: pendingLoading, error: pendingError } = useQuery({
    queryKey: ["/api/admin/kyc/pending"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/kyc/pending");
        const users = await response.json();
        console.log("Fetched pending KYC data:", users?.length ? users.length : "empty");
        return users || [];
      } catch (error) {
        console.error("Error fetching pending KYC data:", error);
        throw error;
      }
    }
  });
  
  const { data: verifiedKyc, isLoading: verifiedLoading, error: verifiedError } = useQuery({
    queryKey: ["/api/admin/kyc/verified"],
    queryFn: async () => {
      try {
        const response = await apiRequest("GET", "/api/admin/kyc/verified");
        const users = await response.json();
        console.log("Fetched verified KYC data:", users?.length ? users.length : "empty");
        return users || [];
      } catch (error) {
        console.error("Error fetching verified KYC data:", error);
        throw error;
      }
    }
  });
  
  const verifyKycMutation = useMutation({
    mutationFn: async ({ kycId, status, rejectionReason }: { 
      kycId: number, 
      status: "verified" | "rejected", 
      rejectionReason?: string 
    }) => {
      const payload = { 
        kycId, 
        status, 
        ...(status === "rejected" && rejectionReason ? { rejectionReason } : {}) 
      };
      
      const response = await apiRequest("POST", "/api/admin/kyc/verify", payload);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "KYC verification updated",
        description: `The KYC has been ${verificationStatus}.`,
        variant: verificationStatus === "verified" ? "default" : "destructive",
      });
      setIsDetailsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/kyc/verified"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error updating KYC",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  const filteredPendingKyc = pendingKyc
    ? pendingKyc.filter((item: UserKyc) => 
        item.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.country?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
    
  const filteredVerifiedKyc = verifiedKyc
    ? verifiedKyc.filter((item: UserKyc) => 
        item.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.user?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.country?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];
  
  const handleVerify = () => {
    if (!selectedKyc) return;
    
    verifyKycMutation.mutate({
      kycId: selectedKyc.id,
      status: verificationStatus,
      rejectionReason: verificationStatus === "rejected" ? rejectionReason : undefined
    });
  };
  
  // AI Analysis Mutation
  const analyzeKycMutation = useMutation({
    mutationFn: async (kycId: number) => {
      const response = await apiRequest("GET", `/api/admin/kyc/analyze/${kycId}`);
      return response.json();
    },
    onSuccess: (data: KycAnalysis) => {
      setAnalysis(data);
      setAnalysisLoading(false);
      
      // Auto-select recommendation from AI
      if (data.recommendation === 'approve') {
        setVerificationStatus("verified");
      } else if (data.recommendation === 'reject') {
        setVerificationStatus("rejected");
        
        // Set rejection reason based on failed checks
        const failedChecks = data.checks
          .filter(check => !check.passed)
          .map(check => check.details)
          .join(". ");
        
        setRejectionReason(failedChecks || "AI analysis recommends rejection.");
      }
    },
    onError: (error: Error) => {
      setAnalysisLoading(false);
      toast({
        title: "Error analyzing KYC",
        description: "Could not perform AI analysis: " + error.message,
        variant: "destructive",
      });
    }
  });
  
  const openDetails = (kyc: UserKyc) => {
    setSelectedKyc(kyc);
    setVerificationStatus("verified");
    setRejectionReason("");
    setAnalysis(null);
    setIsDetailsOpen(true);
    
    // Only run AI analysis on pending KYC submissions
    if (kyc.status === "pending") {
      setAnalysisLoading(true);
      analyzeKycMutation.mutate(kyc.id);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">KYC Verification Management</h2>
        <div className="relative w-64">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or country"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>
      </div>
      
      <Tabs defaultValue="pending" onValueChange={(val) => setActiveTab(val as "pending" | "verified")}>
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="pending" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Pending Verification</span>
          </TabsTrigger>
          <TabsTrigger value="verified" className="flex items-center space-x-2">
            <ClipboardCheck className="h-4 w-4" />
            <span>Verified Users</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending KYC Requests</CardTitle>
              <CardDescription>
                Review and verify user KYC submissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredPendingKyc.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Submission Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingKyc.map((kyc: UserKyc) => (
                      <TableRow key={kyc.id}>
                        <TableCell>
                          <div className="font-medium">{kyc.user?.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {kyc.user?.walletAddress ? formatAddress(kyc.user.walletAddress) : "No wallet connected"}
                          </div>
                        </TableCell>
                        <TableCell>{kyc.fullName}</TableCell>
                        <TableCell>{kyc.country}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {kyc.documentType?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(kyc.submissionDate).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openDetails(kyc)}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  {searchQuery ? "No matching KYC submissions found" : "No pending KYC submissions"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="verified">
          <Card>
            <CardHeader>
              <CardTitle>Verified KYC Users</CardTitle>
              <CardDescription>
                List of users with verified KYC status
              </CardDescription>
            </CardHeader>
            <CardContent>
              {verifiedLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredVerifiedKyc.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Full Name</TableHead>
                      <TableHead>Country</TableHead>
                      <TableHead>Document</TableHead>
                      <TableHead>Verification Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredVerifiedKyc.map((kyc: UserKyc) => (
                      <TableRow key={kyc.id}>
                        <TableCell>
                          <div className="font-medium">{kyc.user?.username}</div>
                          <div className="text-sm text-muted-foreground">
                            {kyc.user?.walletAddress ? formatAddress(kyc.user.walletAddress) : "No wallet connected"}
                          </div>
                        </TableCell>
                        <TableCell>{kyc.fullName}</TableCell>
                        <TableCell>{kyc.country}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {kyc.documentType?.replace("_", " ")}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {kyc.verificationDate 
                            ? new Date(kyc.verificationDate).toLocaleDateString() 
                            : new Date(kyc.submissionDate).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openDetails(kyc)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-10 text-muted-foreground">
                  {searchQuery ? "No matching verified users found" : "No verified KYC users"}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {selectedKyc && (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="sm:max-w-[625px] max-h-[85vh] overflow-y-auto z-[100]">
            <DialogHeader>
              <DialogTitle>KYC Verification Details</DialogTitle>
              <DialogDescription>
                {selectedKyc.status === "verified" 
                  ? "View verified KYC information" 
                  : "Review the submitted information and make a decision"}
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="mb-2 font-semibold">User Information</h4>
                  <p><span className="text-muted-foreground">Username:</span> {selectedKyc.user?.username}</p>
                  <p><span className="text-muted-foreground">Wallet:</span> {selectedKyc.user?.walletAddress ? formatAddress(selectedKyc.user.walletAddress) : "None"}</p>
                  <p><span className="text-muted-foreground">Balance:</span> {selectedKyc.user?.tokenBalance} TSK</p>
                </div>
                <div>
                  <h4 className="mb-2 font-semibold">KYC Information</h4>
                  <p><span className="text-muted-foreground">Full Name:</span> {selectedKyc.fullName}</p>
                  <p><span className="text-muted-foreground">Country:</span> {selectedKyc.country}</p>
                  <p><span className="text-muted-foreground">Document:</span> {selectedKyc.documentType?.replace("_", " ")} ({selectedKyc.documentId})</p>
                  <p><span className="text-muted-foreground">Submitted:</span> {formatDate(selectedKyc.submissionDate)}</p>
                  {selectedKyc.verificationDate && (
                    <p><span className="text-muted-foreground">Verified:</span> {formatDate(selectedKyc.verificationDate)}</p>
                  )}
                </div>
              </div>
              
              {/* Document Viewer - completely rewritten for better stability */}
              <div className="mt-6">
                <h4 className="mb-2 font-semibold">KYC Documents</h4>
                <div className="mt-4 space-y-4">
                  {/* Front ID Document */}
                  <div className="border rounded-md overflow-hidden">
                    <div className="bg-muted/20 px-4 py-2 w-full flex justify-between items-center">
                      <h3 className="text-base font-medium">Front of ID Document</h3>
                      <span className="text-xs text-muted-foreground">Check for tampering or editing</span>
                    </div>
                    <div className="p-4">
                      {selectedKyc?.frontImageUrl && selectedKyc.frontImageUrl.length > 0 ? (
                        <div className="flex justify-center bg-grid-pattern" style={{backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)"}}>
                          <img
                            src={selectedKyc.frontImageUrl}
                            alt="Front of ID Document"
                            className="max-h-[350px] object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.insertAdjacentHTML('afterend', '<div class="p-4 text-center text-red-500">Error loading image. The file may be missing or inaccessible.</div>');
                            }}
                          />
                        </div>
                      ) : (
                        <div className="text-center p-8 bg-muted rounded-lg">
                          <p>No front image available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Back ID Document (if available) */}
                  {selectedKyc?.backImageUrl && selectedKyc.backImageUrl.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-muted/20 px-4 py-2 w-full flex justify-between items-center">
                        <h3 className="text-base font-medium">Back of ID Document</h3>
                        <span className="text-xs text-muted-foreground">Check for security features and details</span>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-center bg-grid-pattern" style={{backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)"}}>
                          <img
                            src={selectedKyc.backImageUrl}
                            alt="Back of ID Document"
                            className="max-h-[350px] object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.insertAdjacentHTML('afterend', '<div class="p-4 text-center text-red-500">Error loading image. The file may be missing or inaccessible.</div>');
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Selfie (if available) */}
                  {selectedKyc?.selfieImageUrl && selectedKyc.selfieImageUrl.length > 0 && (
                    <div className="border rounded-md overflow-hidden">
                      <div className="bg-muted/20 px-4 py-2 w-full flex justify-between items-center">
                        <h3 className="text-base font-medium">Selfie with ID Document</h3>
                        <span className="text-xs text-muted-foreground">Compare with ID photo to confirm identity</span>
                      </div>
                      <div className="p-4">
                        <div className="flex justify-center bg-grid-pattern" style={{backgroundSize: "20px 20px", backgroundImage: "linear-gradient(to right, rgba(128, 128, 128, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(128, 128, 128, 0.1) 1px, transparent 1px)"}}>
                          <img
                            src={selectedKyc.selfieImageUrl}
                            alt="Selfie with ID Document"
                            className="max-h-[350px] object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                              target.insertAdjacentHTML('afterend', '<div class="p-4 text-center text-red-500">Error loading image. The file may be missing or inaccessible.</div>');
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {selectedKyc?.status === "pending" && (
                <>
                  {/* AI Analysis Section */}
                  {analysisLoading ? (
                    <div className="mt-6 p-4 border rounded-md bg-muted/30">
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        <p className="text-sm font-medium">AI is analyzing this KYC submission...</p>
                      </div>
                    </div>
                  ) : analysis ? (
                    <div className="mt-6 border rounded-md overflow-hidden">
                      <div className="p-4 bg-muted/30">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="font-semibold flex items-center">
                            <svg className="h-5 w-5 mr-1" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 16V16.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M12 8V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            AI Analysis
                          </h4>
                          <Badge
                            variant={
                              analysis.recommendation === 'approve' ? 'success' :
                              analysis.recommendation === 'reject' ? 'destructive' :
                              'default'
                            }
                          >
                            {analysis.recommendation === 'approve' ? 'Recommended Approval' :
                             analysis.recommendation === 'reject' ? 'Recommended Rejection' :
                             'Manual Review Needed'}
                          </Badge>
                        </div>
                        <div className="text-sm mb-3">{analysis.summary}</div>
                        <div className="text-xs text-muted-foreground">
                          Confidence score: {Math.round(analysis.confidenceScore * 100)}%
                        </div>
                      </div>
                      
                      <div className="p-4 bg-card">
                        <h5 className="text-sm font-medium mb-2">Verification Checks</h5>
                        <div className="space-y-2">
                          {analysis.checks.map((check, i) => (
                            <div key={i} className="flex items-start">
                              {check.passed ? (
                                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 mr-2 shrink-0" />
                              ) : (
                                <XCircle className="h-4 w-4 text-red-500 mt-0.5 mr-2 shrink-0" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{check.check}</p>
                                <p className="text-xs text-muted-foreground">{check.details}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ) : null}
                  
                  <div className="mt-4">
                    <h4 className="mb-2 font-semibold">Verification Decision</h4>
                    <Select 
                      value={verificationStatus} 
                      onValueChange={(value: "verified" | "rejected") => setVerificationStatus(value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select decision" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="verified">
                          <div className="flex items-center">
                            <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                            Approve
                          </div>
                        </SelectItem>
                        <SelectItem value="rejected">
                          <div className="flex items-center">
                            <XCircle className="mr-2 h-4 w-4 text-red-500" />
                            Reject
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {verificationStatus === "rejected" && (
                      <div className="mt-3">
                        <label className="text-sm font-medium">Rejection Reason</label>
                        <Textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="Provide reason for rejection"
                          className="mt-1"
                        />
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {selectedKyc?.status === "verified" && (
                <div className="mt-4">
                  <Badge className="mb-2" variant="success">Verified</Badge>
                </div>
              )}
            </div>
            
            <DialogFooter>
              {selectedKyc?.status === "pending" ? (
                <>
                  <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Cancel</Button>
                  <Button 
                    onClick={handleVerify} 
                    disabled={verifyKycMutation.isPending || (verificationStatus === "rejected" && !rejectionReason)}
                    variant={verificationStatus === "verified" ? "default" : "destructive"}
                  >
                    {verifyKycMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {verificationStatus === "verified" ? "Approve KYC" : "Reject KYC"}
                  </Button>
                </>
              ) : (
                <Button variant="outline" onClick={() => setIsDetailsOpen(false)}>Close</Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
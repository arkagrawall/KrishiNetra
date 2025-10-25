import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import {
  CheckCircle,
  Clock,
  FileText,
  MessageSquare,
  Eye,
  IndianRupee,
  Loader2,
  AlertCircle as AlertCircleIcon,
  ExternalLink,
} from "lucide-react";
// Import API and types - Ensure ClaimRecord and NewClaimData types are correctly defined in api.ts
import { claimsApi, ClaimRecord, ApiResponse, NewClaimData } from "../utils/api";
// Removed useAuth import

// Status configuration
const statusConfig: {
  [key: string]: { color: string; text: string; icon: React.ElementType };
} = {
  verified: { color: "bg-blue-100 text-blue-800 border-blue-300", text: "Proof Verified", icon: CheckCircle },
  "in-progress": { color: "bg-yellow-100 text-yellow-800 border-yellow-300", text: "Payout Processing", icon: Clock },
  completed: { color: "bg-green-100 text-green-800 border-green-300", text: "Completed", icon: CheckCircle },
  submitted: { color: "bg-gray-100 text-gray-800 border-gray-300", text: "Submitted", icon: FileText },
  rejected: { color: "bg-red-100 text-red-800 border-red-300", text: "Rejected", icon: AlertCircleIcon },
  default: { color: "bg-gray-100 text-gray-800 border-gray-300", text: "Unknown", icon: FileText },
};


export function Claims() {
  // --- TEMPORARY USER ID ---
  // TODO: Replace this with actual user authentication logic
  const userId = "HARDCODED_TEST_USER_ID_123";
  // --- END TEMPORARY USER ID ---

  const [claims, setClaims] = useState<ClaimRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filingClaim, setFilingClaim] = useState<boolean>(false); // State for new claim action button

  // State for viewing proof details
  const [viewingProofFor, setViewingProofFor] = useState<ClaimRecord | null>(null);
  const [proofLoading, setProofLoading] = useState<boolean>(false);
  const [proofError, setProofError] = useState<string | null>(null);
  const [proofDetails, setProofDetails] = useState<{ proofTxHash?: string; metadata?: any; storedAt?: number } | null>(null);

  // Fetch claims data - includes fix for accessing response.data.claims
  const fetchClaims = useCallback(async () => {
    if (!userId) {
      setError("User ID is missing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    console.log(`Fetching claims for temporary userId: ${userId}`);
    try {
      const response = await claimsApi.getAll(userId);
      console.log("API Response in Component:", response);

      if (response.success && response.data?.claims) {
        if (Array.isArray(response.data.claims)) {
          const sortedClaims = response.data.claims.sort((a, b) =>
            (new Date(b.date || 0).getTime()) - (new Date(a.date || 0).getTime())
          );
          setClaims(sortedClaims);
        } else {
          console.warn("API returned successful response but 'data.claims' is not an array:", response.data.claims);
          setClaims([]);
        }
      } else if (response.success && !response.data?.claims) {
        console.warn("API returned successful response but 'data.claims' is missing or null.");
        setClaims([]);
      } else {
        setError(response.error || "Failed to fetch claims.");
        console.error("API Error fetching claims:", response.error);
        setClaims([]);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unknown error occurred during fetch.";
      setError(errorMessage);
      setClaims([]);
      console.error("Fetch claims runtime error:", err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // Fetch claims on component mount
  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  // Calculate summary data dynamically
  const summaryData = useMemo(() => {
    const totalReceived = claims
      .filter(c => c.status === "completed")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const totalPending = claims
      .filter(c => c.status !== "completed" && c.status !== "rejected")
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    return { totalReceived, totalPending };
  }, [claims]);

  // --- Action Handlers ---
  const handleFileNewClaim = async () => {
    console.log("Attempting to file a new claim (using temporary userId)...");
    setFilingClaim(true);
    setError(null); // Clear previous errors

    try {
      // --- *** ACTUAL API CALL *** ---
      // TODO: Get actual data from a form/modal instead of placeholder
      const newClaimData: NewClaimData = {
        userId: userId, // Use the (currently hardcoded) userId
        crop: "Frontend Test Crop", // Placeholder
        event: "Frontend Test Event", // Placeholder
        amount: Math.floor(Math.random() * 5000) + 1000, // Random amount for testing
        description: `Test claim filed at ${new Date().toLocaleTimeString()}` // Placeholder
      };

      console.log("Sending to claimsApi.file:", newClaimData);
      const response = await claimsApi.file(newClaimData); // <-- ACTUAL API CALL

      if (response.success && response.data) {
        console.log("Claim filed successfully via API:", response.data);
        // Optionally add visual feedback like a toast notification here
        fetchClaims(); // Re-fetch claims list to include the new one
      } else {
        // Set error state to display feedback to the user
        setError(response.error || "Failed to file claim. Please try again.");
        console.error("API Error filing claim:", response.error);
      }
      // --- *** END ACTUAL API CALL SECTION *** ---

      // --- Remove or comment out the placeholder simulation ---
      // await new Promise(resolve => setTimeout(resolve, 1500));
      // console.log("Placeholder: Claim filing complete.");
      // --- End Placeholder ---

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An unexpected error occurred during claim filing.";
      setError(errorMsg); // Show error to user
      console.error("File claim runtime error:", err);
    } finally {
      setFilingClaim(false); // Reset loading state for the button
    }
  };


  const handleViewProof = async (claim: ClaimRecord) => {
    console.log("Viewing proof for claim:", claim.id);
    setViewingProofFor(claim);
    setProofLoading(true);
    setProofError(null);
    setProofDetails(null);
    try {
      const response = await claimsApi.getProof(claim.id);
      if (response.success && response.data) {
        console.log("Proof details received:", response.data);
        setProofDetails(response.data);
      } else {
        setProofError(response.error || "Could not fetch proof details.");
        console.error("API Error fetching proof:", response.error);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "An error occurred fetching proof.";
      setProofError(errorMsg);
      console.error("View proof runtime error:", err);
    } finally {
      setProofLoading(false);
    }
  };

  const handleSupport = (claimId: string) => {
    console.log("Navigating to support for claim:", claimId);
    // TODO: Implement navigation or chat opening logic
  };

  const getExplorerUrl = (txHash: string | undefined | null): string => {
    // Return '#' if txHash is missing
    return txHash ? `https://www.oklink.com/amoy/tx/${txHash}` : '#';
  }

  const formatDate = (dateString: string | undefined | null): string => {
    if (!dateString) return "-";
    try {
      // More robust date parsing attempt
      const date = new Date(dateString);
      if (isNaN(date.getTime())) { // Check if date is valid
        console.warn("Invalid date string encountered:", dateString);
        return dateString; // Return original invalid string
      }
      return date.toLocaleDateString('en-IN', {
        year: 'numeric', month: 'short', day: 'numeric'
      });
    } catch (e) {
      console.warn("Error formatting date:", dateString, e);
      return dateString;
    }
  }

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white border-b border-gray-200 p-4 sticky top-0 z-10"
      >
        <h1 className="text-lg font-semibold text-foreground">My Claims</h1>
        {!loading && !error && (
          <p className="text-sm text-muted-foreground">{claims.length} total claims found</p>
        )}
        {loading && (
          <p className="text-sm text-muted-foreground">Loading claims...</p>
        )}
        {/* Display filing error prominently if it occurs */}
        {error && !loading && !error.toLowerCase().includes("fetch claims") && (
          <p className="text-sm text-red-600 mt-1">Error: {error}</p>
        )}
        {error && !loading && error.toLowerCase().includes("fetch claims") && (
          <p className="text-sm text-red-600 mt-1">Failed to load claims</p>
        )}
      </motion.div>

      {/* Main Content Area */}
      <div className="p-4">
        {/* Loading State */}
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-center items-center pt-20">
            <Loader2 className="w-10 h-10 text-primary animate-spin" />
          </motion.div>
        )}

        {/* Error State for Initial Load */}
        {error && !loading && error.toLowerCase().includes("fetch claims") && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
            <Card className="p-6 border-red-200 bg-red-50 text-center">
              <AlertCircleIcon className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <h4 className="text-destructive font-medium mb-1">Error Loading Claims</h4>
              <p className="text-sm text-red-700 mb-3">{error}</p>
              <Button size="sm" onClick={fetchClaims} variant="outline">
                Try Again
              </Button>
            </Card>
          </motion.div>
        )}


        {/* Data Loaded (potentially with claims or empty) */}
        {!loading && !(error && error.toLowerCase().includes("fetch claims")) && ( // Render even if filing error occurred
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {[
                { label: "Total Received", amount: summaryData.totalReceived, color: "green", icon: CheckCircle },
                { label: "Pending Amount", amount: summaryData.totalPending, color: "blue", icon: Clock },
              ].map((summary, index) => (
                <motion.div
                  key={summary.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 + index * 0.1, type: "spring", stiffness: 150 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                >
                  <Card className={`p-4 bg-${summary.color}-50 border-${summary.color}-200 relative overflow-hidden shadow-sm`}>
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-2">
                        <summary.icon className={`w-4 h-4 text-${summary.color}-700`} />
                        <p className={`text-sm font-medium text-${summary.color}-700`}>{summary.label}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <IndianRupee className={`w-5 h-5 text-${summary.color}-800`} />
                        <motion.span
                          className={`text-xl font-bold text-${summary.color}-800`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.2 + index * 0.1 }}
                        >
                          {summary.amount.toLocaleString('en-IN')}
                        </motion.span>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Claims List or Empty State */}
            {claims.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-10">
                <Card className="p-8 text-center border-dashed">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="font-medium text-muted-foreground mb-2">No Claims Found</p>
                  <p className="text-sm text-muted-foreground mb-4">You haven't filed any claims yet.</p>
                  <Button onClick={handleFileNewClaim} disabled={filingClaim}>
                    {filingClaim ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <FileText className="w-4 h-4 mr-2"/>}
                    File Your First Claim
                  </Button>
                </Card>
              </motion.div>
            ) : (
              <div className="space-y-4">
                {claims.map((claim, index) => {
                  const config = statusConfig[claim.status] || statusConfig.default;
                  const StatusIcon = config.icon || FileText;

                  return (
                    <motion.div
                      key={claim.id || `claim-${index}`}
                      layout
                      initial={{ opacity: 0, x: -50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1, type: "spring", stiffness: 100 }}
                      whileHover={{ x: 3, scale: 1.01 }}
                    >
                      <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-4">
                          {/* Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 pr-2">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h3 className="font-semibold text-foreground mr-1">{claim.crop || "N/A"}</h3>
                                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + index * 0.1, type: "spring" }}>
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${config.color} border`}
                                  >
                                    <StatusIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                                    {config.text}
                                  </Badge>
                                </motion.div>
                              </div>
                              <p className="text-sm text-muted-foreground mb-1">{claim.event || "N/A"}</p>
                              <p className="text-xs text-muted-foreground">Claim ID: {claim.id || "N/A"}</p>
                            </div>
                          </div>

                          <div className="space-y-3">
                            {/* Amount */}
                            <motion.div className="flex items-center justify-between p-3 bg-gray-100/60 rounded-lg border">
                              <span className="text-sm text-muted-foreground">Payout Amount</span>
                              <div className="flex items-center gap-1 font-medium">
                                <IndianRupee className="w-4 h-4" />
                                <span className="text-foreground">{(Number(claim.amount) || 0).toLocaleString('en-IN')}</span>
                              </div>
                            </motion.div>

                            {/* Progress */}
                            {claim.status !== "completed" && claim.status !== "rejected" && (
                              <motion.div>
                                <div className="flex items-center justify-between mb-1.5">
                                  <span className="text-sm text-muted-foreground">Processing Status</span>
                                  <span className="text-sm font-medium">{claim.progress || 0}%</span>
                                </div>
                                <Progress value={claim.progress || 0} className="h-1.5" />
                              </motion.div>
                            )}

                            {/* Date */}
                            <motion.div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
                              <Clock className="w-3 h-3" />
                              <span>Filed on {formatDate(claim.date)}</span>
                            </motion.div>


                            {/* Proof Details */}
                            <AnimatePresence>
                              {viewingProofFor?.id === claim.id && (
                                <motion.div
                                  key={`proof-${claim.id}`}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="overflow-hidden"
                                >
                                  <Alert variant={proofError ? "destructive" : "default"} className="mt-3 text-left">
                                    <AlertTitle className="flex items-center gap-2">
                                      {proofLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                                      {proofError && <AlertCircleIcon className="w-4 h-4"/>}
                                      {!proofLoading && !proofError && proofDetails?.proofTxHash && <CheckCircle className="w-4 h-4 text-green-600"/>}
                                      {!proofLoading && !proofError && !proofDetails?.proofTxHash && <AlertCircleIcon className="w-4 h-4 text-yellow-600"/>}
                                      Proof Details
                                    </AlertTitle>
                                    <AlertDescription className="text-xs space-y-1.5 mt-2">
                                      {proofLoading && "Fetching proof details..."}
                                      {proofError && proofError}
                                      {proofDetails && !proofError && (
                                        <>
                                          {proofDetails.proofTxHash ? (
                                            <div className="flex items-center gap-2 flex-wrap">
                                              <span>Tx Hash:</span>
                                              <a
                                                href={getExplorerUrl(proofDetails.proofTxHash)}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-600 hover:underline break-all"
                                              >
                                                {proofDetails.proofTxHash}
                                                <ExternalLink className="w-3 h-3 inline-block ml-1 align-baseline"/>
                                              </a>
                                            </div>
                                          ) : (
                                            <span>No blockchain transaction hash found.</span>
                                          )}
                                          {proofDetails.storedAt && (
                                            <div>Stored At: {new Date(proofDetails.storedAt * 1000).toLocaleString('en-IN')}</div>
                                          )}
                                        </>
                                      )}
                                      {!proofDetails && !proofLoading && !proofError && (
                                        <span>No proof details available.</span>
                                      )}
                                    </AlertDescription>
                                  </Alert>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            {/* Action buttons */}
                            <motion.div className="flex gap-2 pt-2 border-t mt-3">
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                                <Button
                                  variant="outline" size="sm" className="w-full flex items-center gap-2"
                                  onClick={(e) => { e.stopPropagation(); handleViewProof(claim); }}
                                  disabled={proofLoading && viewingProofFor?.id === claim.id}
                                >
                                  {proofLoading && viewingProofFor?.id === claim.id ? ( <Loader2 className="w-4 h-4 animate-spin"/> ) : ( <Eye className="w-4 h-4" /> )}
                                  View Proof
                                </Button>
                              </motion.div>
                              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="flex-1">
                                <Button
                                  variant="outline" size="sm" className="w-full flex items-center gap-2"
                                  onClick={(e) => { e.stopPropagation(); handleSupport(claim.id); }}
                                >
                                  <MessageSquare className="w-4 h-4" /> Support
                                </Button>
                              </motion.div>
                            </motion.div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}

            {/* New Claim Button */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: claims.length * 0.1 + 0.3, type: "spring" }}
              className="mt-6"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                className="w-full relative overflow-hidden group"
                size="lg"
                onClick={handleFileNewClaim}
                disabled={filingClaim || loading}
              >
                {filingClaim ? ( <Loader2 className="w-5 h-5 mr-2 relative z-10 animate-spin"/> ) : ( <FileText className="w-5 h-5 mr-2 relative z-10" /> )}
                <span className="relative z-10">{filingClaim ? "Processing..." : "File New Claim"}</span>
              </Button>
            </motion.div>
          </>
        )}
      </div> {/* End Main Content Area */}
    </div> // End Root Div
  );
}

// Animation variants
const itemVariants = {
  open: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  collapsed: { opacity: 0, y: 20, transition: { duration: 0.2 } }
};
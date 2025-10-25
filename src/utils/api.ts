import { projectId, publicAnonKey } from "./supabase/info"; // Keep if still using Supabase for anything

// --- Import Types ---
// Ensure paths point correctly to component files or a shared types file
import type { MarketRecord, ApiFilters } from "../components/MarketRates";
import type { ClaimRecord, NewClaimData, ProofDetails } from "../components/Claims";

// ==================== BASE URLs ====================

// Base URL for Supabase functions (if used for Auth, Chat, etc.)
const SUPABASE_API_BASE_URL = `https://${projectId}.supabase.co/functions/v1/make-server-37861144`;

// Base URL for the Python/Flask Backend (Market, Claims, Proof)
const BACKEND_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

// ==================== GENERIC API RESPONSE TYPE ====================

// Generic structure for all API responses from both backends
interface ApiResponse<T> {
  success: boolean;
  data?: T; // The actual data payload
  error?: string; // Error message if success is false
  message?: string; // Optional informational message
}

// ==================== DOMAIN-SPECIFIC TYPES ====================
// (Keep ClaimRecord, NewClaimData, ProofDetails, MarketRecord, ApiFilters imported or defined)

// --- Placeholder types for other APIs (replace with actual types if using Supabase) ---
interface Sensor { id: string; name: string; type: string; location: string; /* ... */ }
interface VitalsData { /* ... define vitals structure ... */ }
interface Alert { id: string; type: string; severity: string; /* ... */ }
interface ChatMessage { id: string; role: 'user' | 'assistant'; content: string; timestamp: number; /* ... */ }
interface ForecastData { /* ... define weather forecast structure ... */ }
interface AuthUser { id: string; name: string; phone: string; email?: string; /* ... other user props */ }


// ==================== GENERIC SUPABASE API CALL FUNCTION ====================
// Use this only for endpoints still handled by Supabase (if any)
async function apiCall<T>(
  endpoint: string,
  method: string = "GET",
  body?: any,
): Promise<ApiResponse<T>> {
  console.log(`Calling Supabase API: ${method} ${endpoint}`); // Log Supabase calls
  try {
    const options: RequestInit = {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${publicAnonKey}`,
      },
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${SUPABASE_API_BASE_URL}${endpoint}`, options);

    let data: any;
    try {
      if (response.status === 204 || response.headers.get('content-length') === '0') {
        data = null;
      } else {
        data = await response.json();
      }
    } catch (jsonError) {
      if (!response.ok) {
        const textError = await response.text();
        console.error(`Supabase API Error (${response.status}): Non-JSON -`, textError);
        return { success: false, error: textError || `Request failed: ${response.status}` };
      }
      console.error("Supabase API Error: Response OK but not JSON.", jsonError);
      return { success: false, error: "Invalid response format from Supabase." };
    }

    if (!response.ok) {
      console.error(`Supabase API Error (${response.status}):`, data);
      return { success: false, error: data?.error || `Request failed: ${response.status}` };
    }

    return { success: true, data: data?.data ?? data, message: data?.message };
  } catch (error) {
    console.error("Supabase API Call Error:", error);
    const errorMsg = error instanceof Error ? error.message : "Network error calling Supabase";
    return { success: false, error: errorMsg };
  }
}

// ==================== APIs Using Supabase apiCall (Keep or Remove as needed) ====================

// Example: Auth API (Modify if moving away from Supabase)
export const authApi = {
  signup: async (data: { name: string; phone: string; email?: string; password: string; }): Promise<ApiResponse<{ userId: string }>> => {
    return apiCall<{ userId: string }>("/auth/signup", "POST", data);
  },
  login: async (data: { phone: string; password: string }): Promise<ApiResponse<{ token: string; user: AuthUser }>> => {
    return apiCall<{ token: string; user: AuthUser }>("/auth/login", "POST", data);
  },
};

// Example: Sensors API
export const sensorsApi = {
  getAll: async (userId: string): Promise<ApiResponse<Sensor[]>> => apiCall<Sensor[]>(`/sensors/${userId}`, "GET"),
  add: async (data: { userId: string; name: string; type: string; location: string; }): Promise<ApiResponse<Sensor>> => apiCall<Sensor>("/sensors", "POST", data),
  remove: async (userId: string, sensorId: string): Promise<ApiResponse<{ message: string }>> => apiCall<{ message: string }>(`/sensors/${userId}/${sensorId}`, "DELETE"),
};

// ... Include Vitals, Alerts, Chat, Weather APIs here using apiCall if they remain on Supabase ...
export const vitalsApi = { /* ... using apiCall ... */ };
export const alertsApi = { /* ... using apiCall ... */ };
export const chatApi = { /* ... using apiCall ... */ };
export const weatherApi = { /* ... using apiCall ... */ };


// ==================== APIs Using Direct Fetch to Python Backend ====================

// --- MARKET API ---
export const marketApi = {
  getPrices: async (filters: ApiFilters): Promise<ApiResponse<{ records: MarketRecord[] }>> => {
    const params = new URLSearchParams();
    if (filters.state) params.append("state", filters.state);
    if (filters.district) params.append("district", filters.district);
    if (filters.commodity) params.append("commodity", filters.commodity);
    // if (filters.search) params.append("search", filters.search); // If backend supports search

    const queryString = params.toString();
    const requestUrl = `${BACKEND_API_BASE_URL}/api/market-prices?${queryString}`;
    console.log("Calling Market Backend API:", requestUrl);

    try {
      const response = await fetch(requestUrl); // Direct GET
      if (!response.ok) { /* ... error handling ... */ throw new Error(`Market API Error: ${response.statusText}`); }
      const backendResponse = await response.json();
      // ... (validation as before) ...
      if (!backendResponse || typeof backendResponse.success !== 'boolean') throw new Error("Invalid market response");
      if (backendResponse.success && (!backendResponse.data || !Array.isArray(backendResponse.data.records))) {
        return { success: true, data: { records: [] } };
      }
      if (!backendResponse.success && !backendResponse.error) {
        return { success: false, error: "Backend failure (no error message)" };
      }
      return backendResponse as ApiResponse<{ records: MarketRecord[] }>;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error calling market backend";
      console.error("Market API Fetch error:", errorMsg);
      return { success: false, error: errorMsg };
    }
  },
};

// --- CLAIMS API ---
export const claimsApi = {
  /** Fetches all claims for a user from the Python backend */
  getAll: async (userId: string): Promise<ApiResponse<{ claims: ClaimRecord[] }>> => {
    console.log(`Fetching claims for userId: ${userId} from Python backend`);
    const requestUrl = `${BACKEND_API_BASE_URL}/api/claims/${userId}`;
    try {
      const response = await fetch(requestUrl); // Direct GET
      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try { const errorData = await response.json(); errorMsg = errorData?.error || errorMsg; } catch (e) {/*ignore*/}
        console.error("Claims GET failed:", errorMsg);
        return { success: false, error: errorMsg };
      }
      const backendResponse = await response.json();
      // Validate structure { success: boolean, data: { claims: [] } }
      if (backendResponse.success && backendResponse.data?.claims && Array.isArray(backendResponse.data.claims)) {
        return backendResponse as ApiResponse<{ claims: ClaimRecord[] }>;
      } else if (backendResponse.success) {
        console.warn("Claims GET success, but invalid data structure:", backendResponse.data);
        return { success: true, data: { claims: [] } }; // Return empty on structure mismatch
      } else {
        console.error("Claims GET failed:", backendResponse.error);
        return { success: false, error: backendResponse.error || "Failed to fetch claims" };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error fetching claims";
      console.error("Claims GET fetch error:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /** Files a new claim via the Python backend */
  file: async (data: NewClaimData): Promise<ApiResponse<ClaimRecord>> => {
    console.log("Filing new claim via Python backend api.ts:", data);
    const requestUrl = `${BACKEND_API_BASE_URL}/api/claims`;
    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data) // Send data in the body
      });

      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try { const errorData = await response.json(); errorMsg = errorData?.error || errorMsg; } catch (e) {/*ignore*/}
        console.error("Claims POST failed:", errorMsg);
        return { success: false, error: errorMsg };
      }
      const backendResponse = await response.json(); // Expects { success: true, data: newClaim }

      // Validate structure { success: boolean, data: claimObject }
      if (backendResponse.success && backendResponse.data?.id) { // Check for ID in data
        return backendResponse as ApiResponse<ClaimRecord>;
      } else if (backendResponse.success) {
        console.warn("Claims POST success, but invalid data structure:", backendResponse.data);
        return { success: false, error: "Backend returned success but claim data is invalid" };
      } else {
        console.error("Claims POST failed:", backendResponse.error);
        return { success: false, error: backendResponse.error || "Failed to file claim" };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error filing claim";
      console.error("Claims POST fetch error:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  /** Fetches proof details for a specific claim from the Python backend */
  getProof: async (claimId: string): Promise<ApiResponse<ProofDetails>> => {
    console.log(`Fetching proof for claimId: ${claimId} from Python backend`);
    const requestUrl = `${BACKEND_API_BASE_URL}/api/claims/${claimId}/proof`;
    try {
      const response = await fetch(requestUrl); // Direct fetch GET
      if (!response.ok) {
        let errorMsg = `Error: ${response.status} ${response.statusText}`;
        try { const errorData = await response.json(); errorMsg = errorData?.error || errorMsg; } catch (e) {/*ignore*/}
        console.error("Proof GET failed:", errorMsg);
        return { success: false, error: errorMsg };
      }
      const backendResponse = await response.json();

      // Validate structure { success: boolean, data: { proofTxHash?: ... } }
      if (backendResponse.success && backendResponse.data) {
        return backendResponse as ApiResponse<ProofDetails>;
      } else if (backendResponse.success) {
        console.warn("Proof GET success, but invalid data structure:", backendResponse.data);
        return { success: true, data: {} }; // Return empty proof details object
      } else {
        console.error("Proof GET failed:", backendResponse.error);
        return { success: false, error: backendResponse.error || "Failed to get proof details" };
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error fetching proof";
      console.error("Proof GET fetch error:", errorMessage);
      return { success: false, error: errorMessage };
    }
  },

  // update function - ** Assuming Python backend handles this **
  update: async (
    userId: string, // Python backend might not need userId in URL if claimId is globally unique
    claimId: string,
    updates: Partial<ClaimRecord>,
  ): Promise<ApiResponse<ClaimRecord>> => {
    console.log(`Updating claim ${claimId} via Python Backend:`, updates);
    const requestUrl = `${BACKEND_API_BASE_URL}/api/claims/${claimId}`; // Example endpoint
    try {
      const response = await fetch(requestUrl, {
        method: 'PUT', // Or PATCH
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });
      if (!response.ok) { /* ... error handling ... */ throw new Error(`Update failed: ${response.statusText}`); }
      const backendResponse = await response.json(); // Expects { success: true, data: updatedClaim }
      // ... (validation) ...
      return backendResponse as ApiResponse<ClaimRecord>;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Network error updating claim";
      console.error("Claims Update error:", errorMsg);
      return { success: false, error: errorMsg };
    }
  },
};
// =======================================================
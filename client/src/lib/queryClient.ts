import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { API_BASE_URL, buildApiUrl } from './api-config';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Clone the response before reading its body to avoid the "body already read" error
    const resClone = res.clone();
    
    try {
      // Try to parse error as JSON
      const errorData = await res.json();
      if (errorData.message) {
        throw new Error(errorData.message);
      } else {
        throw new Error(`${res.status}: ${JSON.stringify(errorData)}`);
      }
    } catch (parseError) {
      try {
        // If JSON parsing fails, check for DOCTYPE which indicates HTML response
        const text = await resClone.text() || res.statusText;
        if (text.includes('DOCTYPE') || text.includes('<!DOCTYPE')) {
          // This is likely an HTML response instead of JSON, summarize it for error message
          const simplifiedMessage = "Server returned HTML instead of JSON. This usually indicates a server-side error.";
          console.error("HTML Response:", text.substring(0, 200) + "...");
          throw new Error(simplifiedMessage);
        }
        throw new Error(`${res.status}: ${text}`);
      } catch (textError) {
        // If all else fails, just use the status
        throw new Error(`${res.status}: ${res.statusText || 'Unknown error'}`);
      }
    }
  }
}

// Enhanced API request with better error handling and retry logic
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  parseJson: boolean = false,
  retries: number = 2
): Promise<Response | any> {
  let lastError: Error | null = null;
  
  // Build the full URL with the API base URL if needed
  const fullUrl = buildApiUrl(url);
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      console.log(`API Request to ${fullUrl}: attempt ${attempt + 1}`);
      
      const res = await fetch(fullUrl, {
        method,
        headers: data ? { "Content-Type": "application/json" } : {},
        body: data ? JSON.stringify(data) : undefined,
        credentials: "include",
      });

      await throwIfResNotOk(res);
      
      // If parseJson is true, return the parsed JSON data
      if (parseJson) {
        return await res.json();
      }
      
      // Otherwise, return the response object
      return res;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      console.error(`API Request failed (attempt ${attempt + 1}):`, error);
      
      // If we've used all our retries, throw the last error
      if (attempt === retries) {
        throw lastError;
      }
      
      // Wait before retrying (simple backoff strategy)
      await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
    }
  }
  
  // This should never be reached due to the throw in the loop
  throw lastError || new Error("API request failed for unknown reason");
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    let retries = 2;
    let lastError: Error | null = null;
    
    // Build the full URL with the API base URL if needed
    const url = typeof queryKey[0] === 'string' 
      ? buildApiUrl(queryKey[0]) 
      : String(queryKey[0]);
    
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        console.log(`Query fetch ${url}: attempt ${attempt + 1}`);
        
        const res = await fetch(url, {
          credentials: "include",
          // Add cache busting for authentication endpoints to prevent stale responses
          cache: typeof url === 'string' && 
                 (url.includes('/api/login') || 
                  url.includes('/api/register') || 
                  url.includes('/api/user')) 
                 ? 'no-cache' : 'default'
        });

        // Handle unauthorized based on the provided behavior
        if (unauthorizedBehavior === "returnNull" && res.status === 401) {
          console.log(`Unauthorized access to ${url}, returning null as configured`);
          return null;
        }

        await throwIfResNotOk(res);
        return await res.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`Query failed (attempt ${attempt + 1}):`, error);
        
        // If we've used all our retries, throw the last error (or return null for 401)
        if (attempt === retries) {
          if (lastError.message.includes("401") && unauthorizedBehavior === "returnNull") {
            return null;
          }
          throw lastError;
        }
        
        // Wait before retrying (simple backoff strategy)
        await new Promise(resolve => setTimeout(resolve, 500 * Math.pow(2, attempt)));
      }
    }
    
    // This should never be reached due to the throw in the loop
    throw lastError || new Error("Query failed for unknown reason");
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});

import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";

type User = {
  id: number;
  username: string;
  email?: string | null;
  walletAddress?: string;
  tokenBalance: number;
  miningRate: number;
  lastMiningTime: string | null;
  miningActive: boolean;
  lastMiningActivation?: string | null;
  referralCode: string;
  referredBy?: number;
  premiumTier: string;
  premiumMultiplier: number;
  role: string;
  fullName?: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<User, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<User, Error, RegisterData>;
};

type LoginData = {
  username: string;
  password: string;
};

type RegisterData = {
  username: string;
  password: string;
  referralCode?: string;
};

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<User | null, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Login attempt for:", credentials.username);
      try {
        // Use parseJson=true to get the JSON response directly
        const user = await apiRequest("POST", "/api/login", credentials, true, 3);
        console.log("Login successful:", user);
        return user;
      } catch (error) {
        console.error("Login error details:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      // Invalidate and refetch user data to ensure it's fresh
      queryClient.invalidateQueries({queryKey: ["/api/user"]});
      queryClient.setQueryData(["/api/user"], user);
      
      // Show success toast
      toast({
        title: "Welcome back!",
        description: `You have successfully logged in as ${user.username}`,
      });
    },
    onError: (error: Error) => {
      console.error("Login mutation error:", error);
      
      // Show more helpful error message
      let errorMessage = error.message;
      if (errorMessage.includes("401") || errorMessage.includes("Invalid")) {
        errorMessage = "Invalid username or password. Please try again.";
      } else if (errorMessage.includes("500")) {
        errorMessage = "Server error. Please try again later.";
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      console.log("Registration attempt for:", data.username);
      try {
        // Use parseJson=true to get the JSON response directly with 3 retries
        const user = await apiRequest("POST", "/api/register", data, true, 3);
        console.log("Registration successful:", user);
        return user;
      } catch (error) {
        console.error("Registration error details:", error);
        throw error;
      }
    },
    onSuccess: (user: User) => {
      // Invalidate and refetch user data to ensure it's fresh
      queryClient.invalidateQueries({queryKey: ["/api/user"]});
      queryClient.setQueryData(["/api/user"], user);
      
      toast({
        title: "Registration successful!",
        description: `Welcome to TokenMiner, ${user.username}!`,
      });
    },
    onError: (error: Error) => {
      console.error("Registration mutation error:", error);
      
      // Show more helpful error message
      let errorMessage = error.message;
      if (errorMessage.includes("Username already exists") || errorMessage.includes("already in use")) {
        // Keep the original message for these cases
      } else if (errorMessage.includes("500")) {
        errorMessage = "Server error during registration. Please try again later.";
      }
      
      toast({
        title: "Registration failed",
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Logout attempt");
      try {
        // Use retry for logout as well
        await apiRequest("POST", "/api/logout", undefined, false, 2);
        console.log("Logout successful");
        return true;
      } catch (error) {
        console.error("Logout error details:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Ensure user is set to null and cached data is cleared
      queryClient.setQueryData(["/api/user"], null);
      queryClient.clear(); // Clear all cache on logout for security
      
      toast({
        title: "Logged out",
        description: "You have been logged out successfully",
      });
    },
    onError: (error: Error) => {
      console.error("Logout mutation error:", error);
      
      // Even if there was an error, still clear user data from client-side
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Logout may not be complete",
        description: "There was an issue with the logout process. Please refresh your browser.",
        variant: "destructive",
      });
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

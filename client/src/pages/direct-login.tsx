import { useState } from "react";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function DirectLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      setErrorMessage("Username and password are required");
      return;
    }
    
    setIsLoggingIn(true);
    setErrorMessage("");
    
    try {
      console.log("Attempting login for:", username);
      
      // Manually make the API request without using React Query
      const response = await fetch("/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
        credentials: "include",
      });
      
      if (!response.ok) {
        // Clone the response before reading the body
        const responseClone = response.clone();
        const errorData = await response.json().catch(() => ({ message: response.statusText }));
        throw new Error(errorData.message || "Login failed");
      }
      
      // Get a fresh response
      const userData = await response.json();
      console.log("Login successful:", userData);
      
      // Show success message
      toast({
        title: "Login successful!",
        description: `Welcome back, ${userData.username}!`,
      });
      
      // Redirect to dashboard
      navigate("/");
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(error instanceof Error ? error.message : "An unexpected error occurred");
      
      toast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gray-900 p-4">
      <div className="w-full max-w-md bg-gray-800 rounded-lg shadow-xl p-8 border border-gray-700">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Direct Login</h1>
          <p className="text-gray-400 mt-2">Simplified login without complex components</p>
        </div>
        
        <form onSubmit={handleLogin} className="space-y-6">
          {errorMessage && (
            <div className="bg-red-900/50 border border-red-500 text-white px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{errorMessage}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <label htmlFor="username" className="block text-sm font-medium text-gray-300">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              placeholder="Enter your username"
            />
          </div>
          
          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-white"
              placeholder="Enter your password"
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoggingIn}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 focus:ring-offset-blue-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoggingIn ? "Logging in..." : "Login"}
          </button>
        </form>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Don't have an account?{" "}
            <button 
              onClick={() => navigate("/auth")}
              className="text-blue-400 hover:underline focus:outline-none"
            >
              Register here
            </button>
          </p>
        </div>
        
        <div className="mt-6">
          <button
            onClick={async () => {
              try {
                // Create demo user
                await fetch("/api/create-demo-user", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" }
                });
                
                // Fill the form
                setUsername("demo");
                setPassword("password");
                
                // Submit with a small delay
                setTimeout(() => {
                  const event = { preventDefault: () => {} } as React.FormEvent;
                  handleLogin(event);
                }, 100);
              } catch (error) {
                console.error("Demo login error:", error);
                setErrorMessage("Failed to setup demo account");
              }
            }}
            className="w-full py-2 px-4 bg-gray-600 hover:bg-gray-700 focus:ring-gray-500 focus:ring-offset-gray-200 text-white transition ease-in duration-200 text-center text-base font-semibold shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-lg"
          >
            Use Demo Account
          </button>
        </div>
      </div>
    </div>
  );
}
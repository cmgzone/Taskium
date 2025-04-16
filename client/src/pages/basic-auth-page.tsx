import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function BasicAuthPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState("");

  const { user, loginMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }
    
    setIsLoggingIn(true);
    
    try {
      loginMutation.mutate({ username, password }, {
        onSuccess: () => {
          setIsLoggingIn(false);
          // Redirect will happen automatically due to the useEffect
        },
        onError: (error: Error) => {
          setIsLoggingIn(false);
          setError(error.message || "Login failed. Please try again.");
        }
      });
    } catch (err) {
      setIsLoggingIn(false);
      setError("An unexpected error occurred. Please try again.");
      console.error("Login error:", err);
    }
  };

  const handleQuickDemo = async () => {
    setError("");
    setIsLoggingIn(true);
    
    try {
      // First ensure the demo user exists
      await fetch("/api/create-demo-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Then perform login
      loginMutation.mutate({ username: "demo", password: "password" }, {
        onSuccess: () => {
          setIsLoggingIn(false);
          // Redirect will happen automatically due to the useEffect
        },
        onError: (error: Error) => {
          setIsLoggingIn(false);
          setError(error.message || "Demo login failed. Please try again.");
        }
      });
    } catch (err) {
      setIsLoggingIn(false);
      setError("An unexpected error occurred with demo login. Please try again.");
      console.error("Demo login error:", err);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-white">Welcome to TSK Platform</h2>
          <p className="mt-2 text-center text-sm text-gray-400">
            Sign in to your account to continue
          </p>
        </div>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-700 placeholder-gray-500 text-white bg-gray-800 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoggingIn ? 'Logging in...' : 'Sign in'}
            </button>
          </div>
          
          <div>
            <button
              type="button"
              onClick={handleQuickDemo}
              disabled={isLoggingIn}
              className="group relative w-full flex justify-center py-2 px-4 border border-gray-700 text-sm font-medium rounded-md text-gray-200 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Quick Demo Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
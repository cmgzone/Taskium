import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, User } from "lucide-react";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export default function SimpleLogin() {
  const [isLogin, setIsLogin] = useState(true);
  const { loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();

  // Login form
  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Registration form
  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    console.log("Login attempt:", data.username);
    loginMutation.mutate(data);
  };

  // Handle registration form submission
  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    console.log("Registration attempt:", data.username);
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-4">
      <Card className="w-full max-w-md border-gray-800/30 bg-gray-900/50 backdrop-blur-xl shadow-xl">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-2xl font-bold text-center text-white">
            {isLogin ? "Welcome Back" : "Create Account"}
          </CardTitle>
          <CardDescription className="text-center text-gray-400">
            {isLogin ? "Login to your account" : "Register a new account"}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {isLogin ? (
            // Login Form
            <Form {...loginForm as any}>
              <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4">
                <FormField
                  control={loginForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Username</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors duration-200">
                            <User size={18} />
                          </span>
                          <Input 
                            placeholder="Enter your username" 
                            className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200 text-white" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={loginForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors duration-200">
                            <Lock size={18} />
                          </span>
                          <Input
                            type="password"
                            placeholder="Enter your password"
                            className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200 text-white"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-300 shadow-lg hover:shadow-primary/20 mt-2" 
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Logging in...
                    </>
                  ) : (
                    "Login"
                  )}
                </Button>
              </form>
            </Form>
          ) : (
            // Registration Form
            <Form {...registerForm as any}>
              <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="space-y-4">
                <FormField
                  control={registerForm.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Username</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors duration-200">
                            <User size={18} />
                          </span>
                          <Input 
                            placeholder="Create a username" 
                            className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200 text-white" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <FormField
                  control={registerForm.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem className="space-y-2">
                      <FormLabel className="text-gray-300">Password</FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors duration-200">
                            <Lock size={18} />
                          </span>
                          <Input
                            type="password"
                            placeholder="Create a password"
                            className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200 text-white"
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit" 
                  className="w-full bg-primary hover:bg-primary/90 text-white transition-all duration-300 shadow-lg hover:shadow-primary/20 mt-2" 
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Register"
                  )}
                </Button>
              </form>
            </Form>
          )}
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary hover:underline text-sm font-medium"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
          
          {isLogin && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                className="w-full border-gray-700 hover:bg-gray-800 hover:text-primary transition-all duration-200"
                onClick={async () => {
                  try {
                    // First ensure the demo user exists
                    await fetch("/api/create-demo-user", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json"
                      }
                    });
                    
                    // Then perform login
                    loginForm.setValue("username", "demo");
                    loginForm.setValue("password", "password");
                    loginForm.handleSubmit(onLoginSubmit)();
                  } catch (error) {
                    console.error("Error with demo login:", error);
                  }
                }}
              >
                Quick Demo Login
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
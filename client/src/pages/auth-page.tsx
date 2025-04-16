import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Link, useLocation } from "wouter";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Loader2, Lock, Mail, User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

// Login form schema
const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

// Registration form schema
const registerSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  referralCode: z.string().optional(),
  termsAccepted: z.boolean().refine(value => value === true, {
    message: "You must accept the Terms and Conditions to continue",
  }),
});

// Interface for branding settings
interface BrandingSettings {
  siteName: string;
  siteTagline: string | null;
  faviconUrl: string | null;
  logoUrl: string;
  logoType: 'default' | 'custom';
  primaryColor: string;
  secondaryColor: string | null;
  loginBackgroundImage: string | null;
  enableCustomBranding: boolean;
}

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<string>("login");
  const { user, loginMutation, registerMutation } = useAuth();
  const [location, navigate] = useLocation();
  const [mounted, setMounted] = useState(false);
  
  // Fetch branding settings
  const { 
    data: brandingSettings, 
    error: brandingError, 
    isLoading: isBrandingLoading 
  } = useQuery<BrandingSettings>({
    queryKey: ['/api/direct-branding-settings'],
    refetchOnWindowFocus: false,
    retry: 2
  });

  // Component mount handling
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

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
      referralCode: "",
      termsAccepted: false,
    },
  });

  // Handle login form submission
  const onLoginSubmit = (data: z.infer<typeof loginSchema>) => {
    loginMutation.mutate(data);
  };

  // Handle registration form submission
  const onRegisterSubmit = (data: z.infer<typeof registerSchema>) => {
    registerMutation.mutate(data);
  };

  // Demo login handler
  const handleDemoLogin = async () => {
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
  };

  if (!mounted) {
    return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-4">
      <div className="text-white">Loading authentication...</div>
    </div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 p-4">
      <div className="flex flex-col lg:flex-row w-full max-w-6xl bg-white/5 backdrop-blur-xl rounded-xl shadow-2xl overflow-hidden border border-white/10">
        {/* App Info Section */}
        <div className="lg:w-1/2 bg-gradient-to-br from-primary/90 to-primary/70 p-8 text-white flex flex-col justify-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/20 animate-pulse" style={{ animationDuration: '8s' }}></div>
            <div className="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/20 animate-pulse" style={{ animationDuration: '12s' }}></div>
          </div>
          
          <div className="relative z-10 mb-8 flex flex-col items-center lg:items-start">
            <div className="flex items-center justify-center lg:justify-start mb-6">
              {/* Show loading or error states */}
              {isBrandingLoading ? (
                <div className="h-16 w-32 bg-white/20 animate-pulse rounded-md"></div>
              ) : brandingError ? (
                <div className="text-white text-sm bg-red-500/30 p-2 rounded-md">
                  Error loading logo: Using default
                  <img 
                    src="/icons/taskium-logo-original.png" 
                    alt="Default Logo"
                    className="h-12 w-auto mt-2"
                  />
                </div>
              ) : (
                <img 
                  src={brandingSettings?.logoUrl || "/icons/taskium-logo-original.png"} 
                  alt={brandingSettings?.siteName || "Taskium"} 
                  className="h-16 w-auto"
                  onError={(e) => {
                    console.error(`Failed to load logo from ${brandingSettings?.logoUrl}`);
                    // Try a series of fallbacks
                    if (brandingSettings?.logoUrl?.includes('custom-checkmark-logo.svg')) {
                      console.log("Trying direct /custom-logo.svg path");
                      e.currentTarget.src = "/custom-logo.svg";
                    } else if (brandingSettings?.logoUrl?.includes('custom-logo.svg')) {
                      console.log("Trying direct /icons/custom-checkmark-logo.svg path");
                      e.currentTarget.src = "/icons/custom-checkmark-logo.svg";
                    } else {
                      console.log("Falling back to default logo");
                      e.currentTarget.src = "/icons/taskium-logo-original.png";
                    }
                  }}
                />
              )}
            </div>
            <h1 className="text-4xl font-bold mb-4 text-center lg:text-left">
              Welcome to {brandingSettings?.siteName || "Taskium"}
            </h1>
            <p className="text-lg opacity-90 text-center lg:text-left">
              {brandingSettings?.siteTagline || "Mint tokens, refer friends, and trade in the marketplace."}
            </p>
          </div>

          <div className="relative z-10 space-y-6">
            <div className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Daily Mining</h3>
                <p className="opacity-80">Mine tokens once per day with just a click</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Referral Program</h3>
                <p className="opacity-80">Invite friends and boost your mining rate</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-4 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300">
              <div className="bg-white/20 p-3 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-lg">Marketplace</h3>
                <p className="opacity-80">Buy and sell products using your mined tokens</p>
              </div>
            </div>
          </div>
        </div>

        {/* Auth Forms Section */}
        <div className="lg:w-1/2 p-8 bg-black/30 backdrop-blur-xl flex flex-col justify-center">
          <div className="max-w-md mx-auto w-full">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-800/50 p-1">
                <TabsTrigger value="login" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">Login</TabsTrigger>
                <TabsTrigger value="register" className="data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">Register</TabsTrigger>
              </TabsList>

              {/* Login Form */}
              <TabsContent value="login">
                <Card className="border-gray-800/30 bg-gray-900/50 backdrop-blur-xl shadow-xl animate-in fade-in-50 duration-500">
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
                    <CardDescription className="text-center text-gray-400">
                      Login to your account to access admin controls
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Form {...loginForm}>
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
                                    className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200" 
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
                                    className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200"
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
                  </CardContent>
                  <CardFooter className="flex flex-col space-y-4 pt-0">
                    <div className="flex justify-center w-full">
                      <Link to="/forgot-password">
                        <Button variant="link" className="text-primary hover:text-primary/80 transition-colors duration-200">
                          Forgot password?
                        </Button>
                      </Link>
                    </div>
                    <p className="text-sm text-gray-400 text-center">
                      Don&apos;t have an account?{" "}
                      <button
                        onClick={() => setActiveTab("register")}
                        className="text-primary font-medium hover:text-primary/80 hover:underline transition-colors duration-200"
                      >
                        Register Now
                      </button>
                    </p>
                    <div className="w-full pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full border-gray-700 hover:bg-gray-800 hover:text-primary transition-all duration-200"
                        onClick={handleDemoLogin}
                      >
                        Quick Demo Login
                      </Button>
                    </div>
                  </CardFooter>
                </Card>
              </TabsContent>

              {/* Registration Form */}
              <TabsContent value="register">
                <Card className="border-gray-800/30 bg-gray-900/50 backdrop-blur-xl shadow-xl animate-in fade-in-50 duration-500">
                  <CardHeader className="space-y-1 pb-2">
                    <CardTitle className="text-2xl font-bold text-center">Create Account</CardTitle>
                    <CardDescription className="text-center text-gray-400">
                      Register to start your mining journey
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <Form {...registerForm}>
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
                                    className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200" 
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
                                    className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200"
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
                          name="referralCode"
                          render={({ field }) => (
                            <FormItem className="space-y-2">
                              <FormLabel className="text-gray-300">Referral Code (Optional)</FormLabel>
                              <FormControl>
                                <div className="relative group">
                                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-primary transition-colors duration-200">
                                    <Mail size={18} />
                                  </span>
                                  <Input 
                                    placeholder="Enter referral code if you have one" 
                                    className="pl-10 bg-gray-800/50 border-gray-700 focus:border-primary transition-all duration-200" 
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
                          name="termsAccepted"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
                              <FormControl>
                                <Checkbox
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                  className="border-gray-600 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                                />
                              </FormControl>
                              <div className="space-y-1 leading-none">
                                <FormLabel className="text-sm font-normal text-gray-300">
                                  I agree to the{" "}
                                  <Link to="/terms" className="text-primary hover:text-primary/80 transition-colors duration-200 hover:underline" target="_blank">
                                    Terms and Conditions
                                  </Link>{" "}
                                  and{" "}
                                  <Link to="/terms?tab=privacy" className="text-primary hover:text-primary/80 transition-colors duration-200 hover:underline" target="_blank">
                                    Privacy Policy
                                  </Link>
                                </FormLabel>
                                <FormMessage className="text-red-400" />
                              </div>
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
                              Creating Account...
                            </>
                          ) : (
                            "Create Account"
                          )}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                  <CardFooter className="flex justify-center pt-0">
                    <p className="text-sm text-gray-400 text-center">
                      Already have an account?{" "}
                      <button
                        onClick={() => setActiveTab("login")}
                        className="text-primary font-medium hover:text-primary/80 hover:underline transition-colors duration-200"
                      >
                        Login Now
                      </button>
                    </p>
                  </CardFooter>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}
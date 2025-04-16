// Import polyfills first - this must be the very first import
import "./web3-polyfills.js";

import React, { Component, ErrorInfo, ReactNode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { syncOfflineActions, setupOfflineSyncListeners } from "./lib/offline-sync";
import { setupGlobalErrorHandlers } from "./lib/error-handlers";
import { Toaster } from "@/components/ui/toaster";
import { useToast } from "@/hooks/use-toast";
// Use the main App instead of TestApp
import App from "./App";
import "./index.css";

// Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    // Register the service worker for PWA functionality
    window.addEventListener('load', () => {
      const swPath = '/service-worker.js';
      console.log('Registering service worker at:', swPath);
      
      navigator.serviceWorker.register(swPath)
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Set up periodic sync check
          setInterval(() => {
            if (navigator.onLine && registration.active) {
              // Try to sync if we're online
              syncOfflineMiningData(registration);
            }
          }, 60000); // Check every minute
          
          // Listen for online/offline events
          window.addEventListener('online', () => {
            console.log('App is back online. Syncing data...');
            syncOfflineMiningData(registration);
          });
          
          window.addEventListener('offline', () => {
            console.log('App is offline. Mining data will be stored locally.');
            // Show offline notification to user here if needed
          });
        })
        .catch(error => {
          console.error('Service Worker registration failed:', error);
          
          // Show error in UI for debugging
          const errorDisplay = document.getElementById('error-display');
          if (errorDisplay) {
            errorDisplay.style.display = 'block';
            errorDisplay.innerHTML += `<div>Service Worker Registration Failed: ${error}</div>`;
          }
        });
    });
  }
}

// Sync offline mining data
function syncOfflineMiningData(registration: ServiceWorkerRegistration) {
  if (registration.active) {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = event => {
      if (event.data && event.data.success) {
        console.log('Successfully synced offline mining data');
      } else {
        console.error('Failed to sync offline mining data:', event.data?.error);
      }
    };
    
    registration.active.postMessage({
      type: 'SYNC_MINING_DATA'
    }, [messageChannel.port2]);
  }
}

// Toast provider with offline status 
function OfflineStatusProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  
  useEffect(() => {
    // Register the service worker
    registerServiceWorker();
    
    // Setup offline/online detection
    const handleOffline = () => {
      document.body.classList.add('offline-mode');
      toast({
        title: "You're offline",
        description: "Mining will continue in offline mode and sync when you're back online.",
        duration: 5000
      });
    };
    
    const handleOnline = () => {
      document.body.classList.remove('offline-mode');
      
      // Attempt to sync when coming back online
      syncOfflineActions().then(result => {
        console.log('Sync results:', result);
        if (result.total > 0) {
          toast({
            title: "Connection restored",
            description: `Successfully synced ${result.success} of ${result.total} mining operations.`,
            duration: 3000
          });
        }
      });
    };
    
    // Check initial status
    if (!navigator.onLine) {
      document.body.classList.add('offline-mode');
    }
    
    // Add event listeners
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    
    // Setup offline sync with toast notifications
    const cleanupSyncListeners = setupOfflineSyncListeners((toastData: any) => {
      if (toastData) {
        toast({
          title: toastData.title || "Sync notification",
          description: toastData.description || "",
          variant: toastData.variant || "default",
          duration: 3000
        });
      }
    });
    
    // Setup global error handlers for unhandled promise rejections and errors
    const cleanupErrorHandlers = setupGlobalErrorHandlers();
    
    // Clean up event listeners
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      cleanupSyncListeners();
      cleanupErrorHandlers();
    };
  }, [toast]);
  
  return (
    <>
      {children}
      <Toaster />
    </>
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Add this to allow queries to use stale data while offline
      staleTime: 1000 * 60 * 60, // 1 hour
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - previously called cacheTime in V4
    },
  },
});

// Simplified React app for debugging the black screen issue
interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

// Proper React ErrorBoundary component
class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({
      errorInfo
    });
    
    // Log to UI
    const errorDisplay = document.getElementById('error-display');
    if (errorDisplay) {
      errorDisplay.style.display = 'block';
      errorDisplay.innerHTML += `<div><strong>React Error:</strong> ${error.toString()}</div>`;
      errorDisplay.innerHTML += `<div><strong>Component Stack:</strong> ${errorInfo.componentStack}</div>`;
    }
    
    console.error("React Error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div style={{ 
          padding: '20px', 
          margin: '20px', 
          backgroundColor: '#fff0f0', 
          border: '1px solid #ffcccc',
          borderRadius: '5px'
        }}>
          <h2 style={{ color: '#cc0000' }}>Something went wrong</h2>
          <p>Error: {this.state.error?.toString()}</p>
          <pre style={{ 
            backgroundColor: '#f8f8f8', 
            padding: '10px', 
            overflow: 'auto', 
            maxHeight: '200px'
          }}>
            {this.state.errorInfo?.componentStack}
          </pre>
        </div>
      );
    }

    return this.props.children;
  }
}

// Simple error logging mechanism
try {
  // Make sure the root element exists
  const rootElement = document.getElementById("root");
  
  if (!rootElement) {
    throw new Error("Could not find #root element to mount React app");
  }

  // Create root and render with error handling
  const root = createRoot(rootElement);
  
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <OfflineStatusProvider>
            <App />
          </OfflineStatusProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </React.StrictMode>
  );
} catch (error) {
  // Log any errors during initialization
  console.error("Failed to initialize React app:", error);
  
  // Display the error in our diagnostic panel
  const errorDisplay = document.getElementById('error-display');
  if (errorDisplay) {
    errorDisplay.style.display = 'block';
    errorDisplay.textContent = `Initialization Error: ${error instanceof Error ? error.message : String(error)}`;
  }
}

import { showErrorDialog } from "@/components/ui/error-dialog";

/**
 * Sets up global error handlers for the application
 * 
 * This includes:
 * - Handling unhandled promise rejections
 * - Catching global errors
 * 
 * @returns A cleanup function to remove the handlers when needed
 */
export function setupGlobalErrorHandlers(): () => void {
  // Handler for unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    // Prevent the default browser behavior (console error)
    event.preventDefault();
    
    // Log to console for debugging
    console.warn("Unhandled Promise Rejection:", event.reason);
    
    // Ignore 401 errors as they're handled by the auth system
    if (event.reason?.message?.includes('401')) {
      return;
    }
    
    // Display a user-friendly error dialog for other errors
    showErrorDialog({
      title: "Operation Failed",
      message: event.reason?.message || "An unexpected error occurred",
      type: "error"
    });
  };
  
  // Handler for uncaught errors
  const handleError = (event: ErrorEvent) => {
    // Prevent default browser error handling
    event.preventDefault();
    
    // Log to console for debugging
    console.error("Global Error:", event.error || event.message);

    // Display a user-friendly error dialog
    showErrorDialog({
      title: "Application Error",
      message: event.error?.message || event.message || "An unexpected error occurred",
      type: "error"
    });
  };
  
  // Add the event listeners
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleError);
  
  // Return a cleanup function
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleError);
  };
}
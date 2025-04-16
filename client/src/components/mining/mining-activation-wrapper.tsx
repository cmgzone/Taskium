import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import FloatingActivateButton from "./floating-activate-button";

/**
 * A wrapper component that determines when to show the FloatingActivateButton
 * across the application.
 */
export default function MiningActivationWrapper() {
  const [location] = useLocation();
  const { user } = useAuth();
  
  // Don't show if mining is already active
  if (user?.miningActive) {
    return null;
  }
  
  // Don't show on the mining page (it has its own instance)
  // Don't show on the auth page
  // Don't show for users who are not logged in
  if (location === "/mining" || location === "/auth" || !user) {
    return null;
  }
  
  // Don't show for admin users in the admin section
  if (user.role === "admin" && location === "/admin") {
    return null;
  }
  
  // Use compact mode in some sections
  const compactMode = location === "/wallet" || location === "/settings";
  
  return (
    <FloatingActivateButton 
      variant={compactMode ? "compact" : "expanded"} 
      position="fixed"
    />
  );
}
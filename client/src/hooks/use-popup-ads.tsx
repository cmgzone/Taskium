import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { EnhancedPopupAd } from '@/components/advertising/enhanced-popup-ad';

// Configurable intervals and settings
const DEFAULT_CONFIG = {
  // Minimum time between showing popup ads (in milliseconds)
  minInterval: 5 * 60 * 1000, // 5 minutes
  
  // Delay before showing a popup ad after navigation or initial load
  initialDelay: 10 * 1000, // 10 seconds
  
  // Pages where popup ads should not be shown (paths)
  excludedPaths: [
    '/login', 
    '/register', 
    '/admin', 
    '/settings',
    '/kyc',
    '/payments',
    '/wallet'
  ],
  
  // Chance (0-1) of showing a popup ad on navigation
  navigationChance: 0.3, // 30% chance on each navigation
  
  // Chance (0-1) of showing a popup ad when returning to the app after inactivity
  returnChance: 0.7, // 70% chance when returning to app
  
  // Time considered as "inactivity" before showing a return ad (in milliseconds)
  inactivityThreshold: 2 * 60 * 1000, // 2 minutes
  
  // Use different ad placements for different scenarios
  initialPlacement: 'popup',
  navigationPlacement: 'popup-navigation',
  returnPlacement: 'popup-return',
  timePlacement: 'popup-time',
};

interface PopupAdConfig {
  minInterval?: number;
  initialDelay?: number;
  excludedPaths?: string[];
  navigationChance?: number;
  returnChance?: number;
  inactivityThreshold?: number;
  initialPlacement?: string;
  navigationPlacement?: string;
  returnPlacement?: string;
  timePlacement?: string;
}

export function usePopupAds(customConfig: PopupAdConfig = {}) {
  // Merge default config with custom config
  const config = { ...DEFAULT_CONFIG, ...customConfig };
  
  const [location] = useLocation();
  const [showPopup, setShowPopup] = useState(false);
  const [placement, setPlacement] = useState(config.initialPlacement);
  const [lastShown, setLastShown] = useState(0);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [delayBeforeShow, setDelayBeforeShow] = useState(config.initialDelay);
  
  // Track activity for return popups
  useEffect(() => {
    const handleActivity = () => {
      const now = Date.now();
      
      // If user has been inactive and now returns, show popup with a chance
      if (now - lastActivity > config.inactivityThreshold && 
          Math.random() < config.returnChance && 
          now - lastShown > config.minInterval && 
          !isExcludedPath(location)) {
        setPlacement(config.returnPlacement);
        setDelayBeforeShow(500); // Short delay for return popups
        setShowPopup(true);
        setLastShown(now);
      }
      
      setLastActivity(now);
    };
    
    // Update last activity on user interactions
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    window.addEventListener('focus', handleActivity);
    
    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      window.removeEventListener('focus', handleActivity);
    };
  }, [lastActivity, lastShown, location, config]);
  
  // Show popup on navigation
  useEffect(() => {
    const now = Date.now();
    
    // If not an excluded path and enough time has passed since last popup
    if (!isExcludedPath(location) && 
        now - lastShown > config.minInterval && 
        Math.random() < config.navigationChance) {
      setPlacement(config.navigationPlacement);
      setDelayBeforeShow(config.initialDelay);
      setShowPopup(true);
      setLastShown(now);
    }
  }, [location, lastShown, config]);
  
  // Show popup on time-based interval
  useEffect(() => {
    // Don't start time-based popups until some time after initial load
    const initialTimer = setTimeout(() => {
      const intervalTimer = setInterval(() => {
        const now = Date.now();
        
        // Only show if not already showing, not on excluded path, and enough time has passed
        if (!showPopup && 
            !isExcludedPath(location) && 
            now - lastShown > config.minInterval && 
            Math.random() < 0.5) { // 50% chance on interval
          setPlacement(config.timePlacement);
          setDelayBeforeShow(1000);
          setShowPopup(true);
          setLastShown(now);
        }
      }, config.minInterval); // Check on interval
      
      return () => clearInterval(intervalTimer);
    }, config.initialDelay * 2); // Wait longer before starting interval popups
    
    return () => clearTimeout(initialTimer);
  }, [showPopup, location, lastShown, config]);
  
  // Helper to check if current path is excluded
  const isExcludedPath = (path: string) => {
    return config.excludedPaths.some(excludedPath => 
      path === excludedPath || path.startsWith(`${excludedPath}/`)
    );
  };
  
  // Handle popup close
  const handleClose = () => {
    setShowPopup(false);
  };
  
  // Popup ad component to render
  const PopupAdComponent = showPopup ? (
    <EnhancedPopupAd
      onClose={handleClose}
      placement={placement}
      delayBeforeShow={delayBeforeShow}
      animatedEntrance={true}
    />
  ) : null;
  
  // Return component and control functions
  return {
    PopupAdComponent,
    showPopupAd: (customPlacement?: string) => {
      const now = Date.now();
      if (now - lastShown > config.minInterval) {
        setPlacement(customPlacement || config.initialPlacement);
        setDelayBeforeShow(500);
        setShowPopup(true);
        setLastShown(now);
      }
    },
    hidePopupAd: () => {
      setShowPopup(false);
    },
    isShowingPopupAd: showPopup
  };
}
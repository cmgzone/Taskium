import { useEffect } from 'react';
import { useMobileEnvironment } from '@/hooks/use-mobile';

/**
 * MobileMetaTags component adds mobile-specific meta tags to optimize the mobile experience
 */
export function MobileMetaTags() {
  return (
    <>
      {/* These meta tags will be included using React Helmet or a similar approach */}
      {/* They are here for reference and documentation */}
      
      {/* Disable user scaling for better PWA experience */}
      {/* <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" /> */}
      
      {/* Apple specific meta tags */}
      {/* <meta name="apple-mobile-web-app-capable" content="yes" /> */}
      {/* <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" /> */}
      {/* <link rel="apple-touch-icon" href="/tsk-logo.svg" /> */}
      
      {/* Microsoft specific meta tags */}
      {/* <meta name="msapplication-TileColor" content="#1E293B" /> */}
      {/* <meta name="msapplication-TileImage" content="/tsk-logo.svg" /> */}
    </>
  );
}

/**
 * MobileOptimizations component applies various optimizations when running on mobile devices
 */
export function MobileOptimizations() {
  const { isMobileDevice, isPWA } = useMobileEnvironment();
  
  useEffect(() => {
    if (isMobileDevice) {
      // Apply mobile-specific optimizations
      document.documentElement.classList.add('mobile-device');
      
      // PWA specific optimizations
      if (isPWA) {
        document.documentElement.classList.add('pwa-mode');
        
        // Prevent pull-to-refresh behavior in PWA mode
        document.body.style.overscrollBehavior = 'none';
        
        // Add styles for mobile status bar if in PWA mode
        const metaTag = document.createElement('meta');
        metaTag.name = 'apple-mobile-web-app-status-bar-style';
        metaTag.content = 'black-translucent';
        document.head.appendChild(metaTag);
      }
    }
    
    return () => {
      // Cleanup
      if (isMobileDevice) {
        document.documentElement.classList.remove('mobile-device');
        if (isPWA) {
          document.documentElement.classList.remove('pwa-mode');
          document.body.style.overscrollBehavior = '';
          
          // Remove the meta tag if we added it
          const metaTag = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
          if (metaTag) metaTag.remove();
        }
      }
    };
  }, [isMobileDevice, isPWA]);
  
  return null; // This component doesn't render anything visible
}

export default MobileOptimizations;
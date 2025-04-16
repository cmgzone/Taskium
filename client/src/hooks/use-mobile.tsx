import * as React from "react"

const MOBILE_BREAKPOINT = 768

/**
 * Determines if the current device is a mobile device based on screen width
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

/**
 * Determines if the current device is a mobile device based on user agent
 */
export function useIsMobileDevice() {
  const [isMobileDevice, setIsMobileDevice] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    setIsMobileDevice(mobileRegex.test(navigator.userAgent))
  }, [])

  return isMobileDevice
}

/**
 * Check specifically for MetaMask mobile capabilities
 * Returns information about MetaMask in various mobile environments
 */
export function useMetaMaskMobile() {
  const isMobileDevice = useIsMobileDevice()
  const [hasMetaMaskMobile, setHasMetaMaskMobile] = React.useState<boolean>(false)
  
  // Generate a WalletConnect compatible URI for deep linking
  const generateWalletConnectUri = () => {
    // This is a placeholder - in a real implementation we would use a proper WalletConnect project ID
    // and create a valid WC session. For demonstration, we're just triggering the app to open
    const dappUrl = `${window.location.protocol}//${window.location.host}`;
    const encodedDappUrl = encodeURIComponent(dappUrl);
    
    // A placeholder URI that will at least open MetaMask mobile
    return `wc:00000000-0000-0000-0000-000000000000@1?bridge=https%3A%2F%2Fbridge.walletconnect.org&key=placeholder&relay-protocol=irn&symKey=placeholder`;
  };
  
  React.useEffect(() => {
    // Check for MetaMask through various methods
    const checkMetaMaskMobile = async () => {
      // Direct check for MetaMask
      const hasEthereum = !!window.ethereum
      
      // Check if we're being loaded in the MetaMask browser
      const isMetaMaskBrowser = /MetaMask/i.test(navigator.userAgent)
      
      // Check if we're on a mobile platform
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
      
      // Universal links/deep links are supported
      const supportsUniversalLinks = isMobile
      
      setHasMetaMaskMobile(hasEthereum || isMetaMaskBrowser || (isMobile && supportsUniversalLinks))
    }
    
    checkMetaMaskMobile()
  }, [])
  
  // The current URL of the app with a connect flag for when returning from MetaMask
  const currentAppUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?connect=true`;
  
  return {
    isMobileDevice,
    hasMetaMaskMobile,
    // Standard MetaMask deep link - tried first for Android 
    metamaskDeepLink: `https://metamask.app.link/dapp/${window.location.host}${window.location.pathname}?connect=true`,
    // WalletConnect-style deep link - better connection flow
    wc2DeepLink: `https://metamask.app.link/wc?uri=${encodeURIComponent(generateWalletConnectUri())}`,
    // Universal link for iOS - better for iPhones
    universalLink: `https://metamask.app/connect?url=${encodeURIComponent(currentAppUrl)}`,
    // Is this the MetaMask browser itself?
    isMetaMaskBrowser: /MetaMask/i.test(navigator.userAgent)
  }
}

/**
 * Determines if the app is currently running in PWA/standalone mode
 */
export function useIsPWA() {
  const [isPWA, setIsPWA] = React.useState<boolean>(false)

  React.useEffect(() => {
    // Check if the app is running in standalone mode (PWA)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');
    setIsPWA(isStandalone)
  }, [])

  return isPWA
}

/**
 * Returns comprehensive mobile environment information
 */
export function useMobileEnvironment() {
  const isMobile = useIsMobile()
  const isMobileDevice = useIsMobileDevice()
  const isPWA = useIsPWA()

  return {
    isMobile,       // Based on screen width
    isMobileDevice, // Based on user agent
    isPWA,          // Running as installed PWA
    isInstallable: isMobileDevice && !isPWA // Can show install prompt
  }
}

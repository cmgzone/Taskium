/**
 * Polyfills for Web3 and crypto libraries
 * 
 * This file provides the necessary polyfills to make ethers.js and other
 * Web3 libraries work correctly in the browser environment.
 */

// Import Buffer from the 'buffer' package
import { Buffer } from 'buffer';

// Make Buffer available globally with proper exports
if (typeof window !== 'undefined') {
  // Set Buffer globally
  window.Buffer = window.Buffer || Buffer;
  
  // Make Buffer constructor available
  (window as any).Buffer.prototype = Buffer.prototype;
  (window as any).Buffer.from = Buffer.from.bind(Buffer);
  (window as any).Buffer.alloc = Buffer.alloc.bind(Buffer);
  (window as any).Buffer.allocUnsafe = Buffer.allocUnsafe.bind(Buffer);
  (window as any).Buffer.isBuffer = Buffer.isBuffer.bind(Buffer);
  (window as any).Buffer.concat = Buffer.concat.bind(Buffer);
  
  // Set global for packages that look for it
  (window as any).global = window;
}

// Add complete process object for libraries that depend on Node.js process
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {
    env: { 
      NODE_ENV: 'production',
      DEBUG: undefined 
    },
    version: '',
    browser: true,
    nextTick: function(fn: Function) {
      setTimeout(fn, 0);
    }
  };
}

// Export the Buffer for modules that need it directly
export { Buffer };
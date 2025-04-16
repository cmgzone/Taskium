/**
 * Web3 Polyfills
 * 
 * This file provides all necessary polyfills for web3 libraries to work in browsers.
 * It must be imported before any web3-related code.
 */

// Import Buffer
import { Buffer as BufferImport } from 'buffer';

// Buffer implementations require isBuffer method to be attached to the constructor
if (typeof BufferImport.isBuffer !== 'function') {
  BufferImport.isBuffer = function(obj) {
    return obj != null && obj.constructor != null && 
      typeof obj.constructor.isBuffer === 'function' && 
      obj.constructor.isBuffer(obj);
  };
}

// Make sure Buffer exists on the window
window.Buffer = BufferImport;

// Ensure Buffer.from exists with proper prototypes
if (!window.Buffer.from) {
  window.Buffer.from = function(data, encoding) {
    return new BufferImport(data, encoding);
  };
}

// Ensure Buffer.alloc exists
if (!window.Buffer.alloc) {
  window.Buffer.alloc = function(size) {
    return new BufferImport(size);
  };
}

// Full global implementation for libraries that expect a Node.js environment
window.global = {
  ...window,
  Buffer: BufferImport,
  process: {
    env: { 
      NODE_ENV: 'production',
      DEBUG: undefined 
    },
    version: '',
    browser: true,
    nextTick: function(fn) {
      setTimeout(fn, 0);
    }
  }
};

// Make global properties available at top level
window.process = window.global.process;

// Stream is often required by web3 libraries
window.Stream = function() {};

// Export for modules that need it
export const Buffer = BufferImport;
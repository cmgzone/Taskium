// Buffer polyfill for Web3 libraries
import { Buffer } from 'buffer';

// Make Buffer available globally
window.Buffer = Buffer;

// Add process object for libraries that need it
window.process = {
  env: { NODE_ENV: 'production' },
  version: '',
  nextTick: function(fn) {
    setTimeout(fn, 0);
  }
};

// Export Buffer for modules that need it directly
export { Buffer };
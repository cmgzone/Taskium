/**
 * Content Security Service
 * 
 * Provides utilities for sanitizing user-generated content to prevent XSS attacks.
 * Uses DOMPurify for HTML sanitation with different configurations depending on context.
 */

import { JSDOM } from 'jsdom';
import DOMPurify from 'dompurify';
import { createHash } from 'crypto';

// Initialize DOMPurify with a DOM window
const window = new JSDOM('').window;
const purify = DOMPurify(window);

// Set default configuration
purify.setConfig({
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span'],
  ALLOWED_ATTR: ['href', 'target', 'class', 'style', 'title'],
  ALLOWED_URI_REGEXP: /^(https?:\/\/|mailto:)/i,
  ADD_ATTR: ['target'],
  FORBID_CONTENTS: ['script', 'style', 'iframe', 'form', 'input', 'object', 'embed'],
  KEEP_CONTENT: true,
  SANITIZE_DOM: true
});

// Custom hook for setting safe links
purify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName.toLowerCase() === 'a') {
    // Set all links to open in a new tab
    node.setAttribute('target', '_blank');
    // Add rel="noopener noreferrer" to prevent security issues
    node.setAttribute('rel', 'noopener noreferrer');
  }
});

/**
 * Sanitize user input text (no HTML allowed)
 * 
 * @param input The text to sanitize
 * @returns Sanitized text with all HTML stripped
 */
export function sanitizeUserInput(input: string): string {
  if (!input) return '';
  
  // Strip all HTML tags and ensure plain text
  return purify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitize a URL
 * 
 * @param url The URL to sanitize
 * @returns Sanitized URL or empty string if invalid
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // Only allow http, https, and mailto protocols
  const urlRegex = /^(https?:\/\/|mailto:)/i;
  if (!urlRegex.test(url)) {
    return '';
  }
  
  return purify.sanitize(url, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: []
  });
}

/**
 * Sanitize HTML content (allow limited tags)
 * 
 * @param html The HTML content to sanitize
 * @returns Sanitized HTML with only allowed tags
 */
export function sanitizeHtml(html: string): string {
  if (!html) return '';
  
  // Use default configuration (limited tags)
  return purify.sanitize(html);
}

/**
 * Sanitize HTML for ad content (more permissive)
 * 
 * @param html The HTML ad content to sanitize
 * @returns Sanitized HTML suitable for ad display
 */
export function sanitizeAdHtml(html: string): string {
  if (!html) return '';
  
  // More permissive configuration for ads, but still secure
  return purify.sanitize(html, {
    ALLOWED_TAGS: [
      'b', 'i', 'em', 'strong', 'p', 'br', 'ul', 'ol', 'li', 'a', 'span', 'div', 
      'h1', 'h2', 'h3', 'h4', 'h5', 'img', 'button'
    ],
    ALLOWED_ATTR: [
      'href', 'target', 'class', 'style', 'title', 'id', 'src', 'alt', 
      'width', 'height', 'rel', 'data-action'
    ],
    ADD_ATTR: ['target', 'rel'],
    ALLOW_DATA_ATTR: true
  });
}

/**
 * Sanitize CSS for safe inline styles
 * 
 * @param css The CSS content to sanitize
 * @returns Sanitized CSS with potentially harmful properties removed
 */
export function sanitizeCss(css: string): string {
  if (!css) return '';
  
  // Whitelist of allowed CSS properties
  const allowedProperties = [
    'color', 'background-color', 'font-size', 'font-weight', 'font-family',
    'text-align', 'margin', 'padding', 'border', 'border-radius', 'display',
    'width', 'height', 'max-width', 'max-height'
  ];
  
  // Simple CSS sanitization (not perfect but reasonable)
  const sanitized = css
    .split(';')
    .map(rule => rule.trim())
    .filter(rule => {
      const property = rule.split(':')[0]?.trim();
      return property && allowedProperties.includes(property.toLowerCase());
    })
    .join('; ');
  
  return sanitized;
}

/**
 * Generate CSP nonce for inline scripts
 * 
 * @returns A random nonce value for CSP
 */
export function generateNonce(): string {
  return createHash('sha256')
    .update(Math.random().toString())
    .digest('base64');
}

/**
 * Validate and sanitize ad content
 * 
 * @param adData The ad data to sanitize
 * @returns Sanitized ad data
 */
export function validateAdContent(adData: any): any {
  if (!adData) return {};
  
  const sanitized: any = { ...adData };
  
  // Sanitize text fields
  if (sanitized.title) sanitized.title = sanitizeUserInput(sanitized.title);
  if (sanitized.description) sanitized.description = sanitizeUserInput(sanitized.description);
  if (sanitized.buttonText) sanitized.buttonText = sanitizeUserInput(sanitized.buttonText);
  
  // Handle arrays properly
  if (sanitized.placement) {
    if (Array.isArray(sanitized.placement)) {
      sanitized.placement = sanitized.placement.map((p: string) => sanitizeUserInput(p));
    } else {
      sanitized.placement = sanitizeUserInput(sanitized.placement);
    }
  }
  
  if (sanitized.targetAudience) {
    if (Array.isArray(sanitized.targetAudience)) {
      sanitized.targetAudience = sanitized.targetAudience.map((a: string) => sanitizeUserInput(a));
    } else {
      sanitized.targetAudience = sanitizeUserInput(sanitized.targetAudience);
    }
  }
  
  // Sanitize HTML content if present
  if (sanitized.htmlContent) sanitized.htmlContent = sanitizeAdHtml(sanitized.htmlContent);
  
  // Sanitize URLs
  if (sanitized.linkUrl) sanitized.linkUrl = sanitizeUrl(sanitized.linkUrl);
  if (sanitized.imageUrl) sanitized.imageUrl = sanitizeUrl(sanitized.imageUrl);
  
  // Sanitize color hex codes
  if (sanitized.customBackground) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(sanitized.customBackground)) {
      sanitized.customBackground = '#ffffff'; // Default to white if invalid
    }
  }
  
  if (sanitized.customTextColor) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(sanitized.customTextColor)) {
      sanitized.customTextColor = '#000000'; // Default to black if invalid
    }
  }
  
  if (sanitized.customButtonColor) {
    const hexColorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
    if (!hexColorRegex.test(sanitized.customButtonColor)) {
      sanitized.customButtonColor = '#007bff'; // Default to blue if invalid
    }
  }
  
  return sanitized;
}

// Aliases for backward compatibility
export const sanitizeHTML = sanitizeHtml;
export const sanitizeURL = sanitizeUrl;

export default {
  sanitizeUserInput,
  sanitizeUrl,
  sanitizeHtml,
  sanitizeAdHtml,
  sanitizeCss,
  generateNonce,
  validateAdContent,
  sanitizeHTML,
  sanitizeURL
};
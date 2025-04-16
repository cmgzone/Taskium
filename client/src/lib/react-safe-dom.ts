/**
 * React Safe DOM utilities
 * 
 * This file provides utility functions for safely working with DOM elements
 * in React components, particularly handling cases where elements might not be
 * mounted or available yet when certain operations are called.
 */

/**
 * Safe getBoundingClientRect implementation
 * 
 * This function wraps the standard getBoundingClientRect method with a safety check
 * and returns an empty DOMRect-like object if the element is null or not yet in the DOM.
 * 
 * @param element - The element to get the bounding client rect for
 * @returns A DOMRect or a DOMRect-like object with all values set to 0
 */
export const safeGetBoundingClientRect = (element: Element | null): DOMRect => {
  if (!element) {
    // Return a default empty DOMRect-like object if the element is null
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      })
    } as DOMRect;
  }
  
  try {
    // Try to get the actual bounding client rect
    return element.getBoundingClientRect();
  } catch (error) {
    console.warn('Error getting bounding client rect:', error);
    // Return the default empty DOMRect-like object if there was an error
    return {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      toJSON: () => ({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      })
    } as DOMRect;
  }
};

/**
 * Safely check if an element is within the viewport
 * 
 * @param element - The element to check
 * @returns boolean - True if element is in viewport, false otherwise
 */
export const isElementInViewport = (element: Element | null): boolean => {
  if (!element) return false;
  
  try {
    const rect = safeGetBoundingClientRect(element);
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  } catch (error) {
    console.warn('Error checking if element is in viewport:', error);
    return false;
  }
};

/**
 * Safety wrapper for adding event listeners
 * 
 * @param element - Element to add the event listener to
 * @param eventType - The event type to listen for
 * @param handler - The event handler
 * @param options - Event listener options
 */
export const safeAddEventListener = <K extends keyof WindowEventMap>(
  element: Window | Document | Element | null,
  eventType: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void => {
  if (!element) return;
  
  try {
    element.addEventListener(eventType, handler as EventListener, options);
  } catch (error) {
    console.warn(`Error adding ${eventType} event listener:`, error);
  }
};

/**
 * Safety wrapper for removing event listeners
 * 
 * @param element - Element to remove the event listener from
 * @param eventType - The event type to remove
 * @param handler - The event handler to remove
 * @param options - Event listener options
 */
export const safeRemoveEventListener = <K extends keyof WindowEventMap>(
  element: Window | Document | Element | null,
  eventType: K,
  handler: (event: WindowEventMap[K]) => void,
  options?: boolean | EventListenerOptions
): void => {
  if (!element) return;
  
  try {
    element.removeEventListener(eventType, handler as EventListener, options);
  } catch (error) {
    console.warn(`Error removing ${eventType} event listener:`, error);
  }
};

/**
 * A custom React hook to safely measure an element's dimensions
 * 
 * @param ref - React ref object for the element to measure
 * @returns An object with width and height properties
 */
export const useSafeMeasure = (ref: React.RefObject<Element>) => {
  const getDimensions = () => {
    const rect = safeGetBoundingClientRect(ref.current);
    return {
      width: rect.width,
      height: rect.height
    };
  };
  
  return getDimensions();
};
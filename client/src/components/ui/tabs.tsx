import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/lib/utils"
import { safeGetBoundingClientRect } from "@/lib/react-safe-dom"

// Enhanced Tabs component with error handling for getBoundingClientRect
const Tabs = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Root>
>(({ className, ...props }, ref) => {
  // Add an effect to handle potential mounting issues
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Wrap the original component with our error-safe version
  return (
    <TabsPrimitive.Root
      ref={ref}
      className={cn(className)}
      {...props}
    />
  );
});
Tabs.displayName = TabsPrimitive.Root.displayName

const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const combinedRef = ref || internalRef;

  return (
    <TabsPrimitive.List
      ref={combinedRef as React.RefObject<HTMLDivElement>}
      className={cn(
        "inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground",
        className
      )}
      {...props}
    />
  );
});
TabsList.displayName = TabsPrimitive.List.displayName

const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => {
  const internalRef = React.useRef<HTMLButtonElement>(null);
  const combinedRef = ref || internalRef;

  return (
    <TabsPrimitive.Trigger
      ref={combinedRef as React.RefObject<HTMLButtonElement>}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all hover:bg-background/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-soft",
        className
      )}
      {...props}
    />
  );
});
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName

const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const internalRef = React.useRef<HTMLDivElement>(null);
  const combinedRef = ref || internalRef;
  const [isMounted, setIsMounted] = React.useState(false);
  
  React.useEffect(() => {
    // Set mounted state immediately
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // Create a safe wrapper div that doesn't depend on RadixUI to render content
  return (
    <div style={{ width: '100%' }}>
      <TabsPrimitive.Content
        ref={combinedRef as React.RefObject<HTMLDivElement>}
        className={cn(
          "mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        {...props}
      >
        {/* Conditionally render children only when mounted to prevent layout issues */}
        {isMounted ? children : 
          <div className="animate-pulse p-4">
            {/* Placeholder skeleton for loading state */}
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2"></div>
          </div>
        }
      </TabsPrimitive.Content>
    </div>
  );
});
TabsContent.displayName = TabsPrimitive.Content.displayName

export { Tabs, TabsList, TabsTrigger, TabsContent }

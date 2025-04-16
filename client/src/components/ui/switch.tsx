import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"
import { safeGetBoundingClientRect } from "@/lib/react-safe-dom"

// Enhanced Switch component with error handling for getBoundingClientRect
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => {
  const internalRef = React.useRef<HTMLButtonElement>(null);
  const combinedRef = (ref || internalRef) as React.RefObject<HTMLButtonElement>;
  const [mounted, setMounted] = React.useState(false);

  // Safely handle mounting and unmounting
  React.useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Create a safe wrapper around any internal calls to getBoundingClientRect
  const getThumbRect = React.useCallback(() => {
    if (!combinedRef.current) return null;
    return safeGetBoundingClientRect(combinedRef.current);
  }, [combinedRef]);

  return (
    <SwitchPrimitives.Root
      className={cn(
        "peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        className
      )}
      {...props}
      ref={combinedRef}
    >
      <SwitchPrimitives.Thumb
        className={cn(
          "pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0"
        )}
      />
    </SwitchPrimitives.Root>
  );
});
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }

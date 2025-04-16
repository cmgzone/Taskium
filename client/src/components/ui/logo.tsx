import { cn } from "@/lib/utils";

interface LogoProps {
  variant?: "default" | "icon-only" | "text-only";
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function Logo({ 
  variant = "default", 
  size = "md", 
  className 
}: LogoProps) {
  const sizeClasses = {
    sm: {
      container: "h-8",
      icon: "h-6 w-6 mr-2",
      text: "text-lg",
    },
    md: {
      container: "h-10",
      icon: "h-8 w-8 mr-2",
      text: "text-xl",
    },
    lg: {
      container: "h-12",
      icon: "h-10 w-10 mr-3",
      text: "text-2xl",
    },
    xl: {
      container: "h-16",
      icon: "h-14 w-14 mr-4",
      text: "text-3xl",
    },
  };

  // Return an empty div to avoid showing any logo
  return (
    <div className={cn("flex items-center", sizeClasses[size].container, className)}>
      {/* Logo removed as requested */}
    </div>
  );
}
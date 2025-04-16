import { useState } from "react";
import { useTheme } from "@/lib/theme-provider";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem
} from "@/components/ui/dropdown-menu";
import { 
  Check, 
  Sun, 
  Moon, 
  Laptop, 
  Palette,
  ChevronRight,
  Settings
} from "lucide-react";
import { FaBitcoin, FaEthereum } from "react-icons/fa";
import { SiBinance } from "react-icons/si";
import { Link } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Create color swatches for each theme
const colorSwatches = {
  default: {
    light: "hsl(262.1 83.3% 57.8%)",
    dark: "hsl(263.4 70% 50.4%)",
    name: "Default",
    icon: <Palette className="h-4 w-4" />
  },
  bitcoin: {
    light: "hsl(32 94% 49%)",
    dark: "hsl(32 94% 59%)",
    name: "Bitcoin",
    icon: <FaBitcoin className="h-4 w-4" />
  },
  ethereum: {
    light: "hsl(210 100% 56%)",
    dark: "hsl(210 100% 66%)",
    name: "Ethereum",
    icon: <FaEthereum className="h-4 w-4" />
  },
  bnb: {
    light: "hsl(45 93% 47%)",
    dark: "hsl(45 93% 57%)",
    name: "BNB",
    icon: <SiBinance className="h-4 w-4" />
  }
};

export function ThemeSwitcher({ variant = "icon" }: { variant?: "icon" | "expanded" }) {
  const { mode, setMode, colorScheme, setColorScheme, isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  // Current theme icon based on mode and color scheme
  const currentIcon = isDark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />;
  const currentColorIcon = colorSwatches[colorScheme].icon;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              {variant === "icon" ? (
                <Button variant="outline" size="icon" className="h-9 w-9 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 rounded-md" 
                    style={{ backgroundColor: isDark ? colorSwatches[colorScheme].dark : colorSwatches[colorScheme].light }}>
                  </div>
                  <div className="relative z-10">
                    {currentIcon}
                  </div>
                  <span className="sr-only">Toggle theme</span>
                </Button>
              ) : (
                <Button variant="outline" className="h-9 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-20 rounded-md" 
                    style={{ backgroundColor: isDark ? colorSwatches[colorScheme].dark : colorSwatches[colorScheme].light }}>
                  </div>
                  <div className="relative z-10 flex items-center gap-2">
                    {currentIcon}
                    <span className="mr-1">{isDark ? "Dark" : "Light"}</span>
                    <div className="w-px h-4 bg-border mx-1"></div>
                    <div className="flex items-center gap-1">
                      {currentColorIcon}
                      <span>{colorSwatches[colorScheme].name}</span>
                    </div>
                  </div>
                </Button>
              )}
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>
            <p>Change theme settings</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel>Appearance Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <div className="p-2 space-y-1">
          <button
            className={`theme-option ${mode === "light" ? "active" : ""}`}
            onClick={() => setMode("light")}
          >
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4" />
              <span>Light</span>
            </div>
            {mode === "light" && <Check className="h-4 w-4" />}
          </button>
          
          <button
            className={`theme-option ${mode === "dark" ? "active" : ""}`}
            onClick={() => setMode("dark")}
          >
            <div className="flex items-center gap-2">
              <Moon className="h-4 w-4" />
              <span>Dark</span>
            </div>
            {mode === "dark" && <Check className="h-4 w-4" />}
          </button>
          
          <button
            className={`theme-option ${mode === "system" ? "active" : ""}`}
            onClick={() => setMode("system")}
          >
            <div className="flex items-center gap-2">
              <Laptop className="h-4 w-4" />
              <span>System</span>
            </div>
            {mode === "system" && <Check className="h-4 w-4" />}
          </button>
        </div>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="flex items-center gap-2">
          <Palette className="h-4 w-4" />
          <span>Blockchain Theme</span>
        </DropdownMenuLabel>
        
        <div className="p-2 space-y-1">
          <button
            className={`theme-option ${colorScheme === "default" ? "active" : ""}`}
            onClick={() => setColorScheme("default")}
          >
            <div className="flex items-center gap-2">
              <div className="color-swatch" style={{
                backgroundColor: isDark ? colorSwatches.default.dark : colorSwatches.default.light
              }}></div>
              <span>Default</span>
            </div>
            {colorScheme === "default" && <Check className="h-4 w-4" />}
          </button>
          
          <button
            className={`theme-option ${colorScheme === "bitcoin" ? "active" : ""}`}
            onClick={() => setColorScheme("bitcoin")}
          >
            <div className="flex items-center gap-2">
              <div className="color-swatch" style={{
                backgroundColor: isDark ? colorSwatches.bitcoin.dark : colorSwatches.bitcoin.light
              }}></div>
              <FaBitcoin className="h-4 w-4 ml-1" />
              <span>Bitcoin</span>
            </div>
            {colorScheme === "bitcoin" && <Check className="h-4 w-4" />}
          </button>
          
          <button
            className={`theme-option ${colorScheme === "ethereum" ? "active" : ""}`}
            onClick={() => setColorScheme("ethereum")}
          >
            <div className="flex items-center gap-2">
              <div className="color-swatch" style={{
                backgroundColor: isDark ? colorSwatches.ethereum.dark : colorSwatches.ethereum.light
              }}></div>
              <FaEthereum className="h-4 w-4 ml-1" />
              <span>Ethereum</span>
            </div>
            {colorScheme === "ethereum" && <Check className="h-4 w-4" />}
          </button>
          
          <button
            className={`theme-option ${colorScheme === "bnb" ? "active" : ""}`}
            onClick={() => setColorScheme("bnb")}
          >
            <div className="flex items-center gap-2">
              <div className="color-swatch" style={{
                backgroundColor: isDark ? colorSwatches.bnb.dark : colorSwatches.bnb.light
              }}></div>
              <SiBinance className="h-4 w-4 ml-1" />
              <span>BNB</span>
            </div>
            {colorScheme === "bnb" && <Check className="h-4 w-4" />}
          </button>
        </div>

        <DropdownMenuSeparator />
        <Link href="/theme">
          <DropdownMenuItem className="cursor-pointer">
            <Settings className="h-4 w-4 mr-2" />
            <span>Advanced Theme Settings</span>
            <ChevronRight className="h-4 w-4 ml-auto" />
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Export a compact version that only toggles between light and dark mode
export function ThemeToggle() {
  const { mode, setMode, isDark } = useTheme();
  
  const toggleTheme = () => {
    setMode(isDark ? "light" : "dark");
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleTheme}
            className="h-9 w-9"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Switch to {isDark ? "light" : "dark"} mode</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
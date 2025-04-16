import { createContext, useContext, useEffect, useState, ReactNode } from "react";

// Define the available theme modes
type ThemeMode = "light" | "dark" | "system";

// Define the available blockchain-themed color schemes
type ColorScheme = "default" | "bitcoin" | "ethereum" | "bnb";

interface ThemeContextProps {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  colorScheme: ColorScheme;
  setColorScheme: (scheme: ColorScheme) => void;
  isDark: boolean;
  isSystem: boolean;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

// Define color scheme configurations with theme descriptions
const colorSchemes: Record<ColorScheme, { 
  light: { primary: string, accent: string },
  dark: { primary: string, accent: string },
  description: string,
  secondaryColors: { light: string[], dark: string[] }
}> = {
  default: {
    light: { primary: "hsl(262.1 83.3% 57.8%)", accent: "hsl(262.1 83.3% 57.8%)" },
    dark: { primary: "hsl(263.4 70% 50.4%)", accent: "hsl(263.4 70% 50.4%)" },
    description: "The standard TSK Platform theme with rich purple tones",
    secondaryColors: {
      light: ["hsl(267 81% 65%)", "hsl(271 70% 60%)"],
      dark: ["hsl(268 75% 55%)", "hsl(270 68% 50%)"]
    }
  },
  bitcoin: {
    light: { primary: "hsl(32 94% 49%)", accent: "hsl(22 90% 52%)" },  // Bitcoin orange
    dark: { primary: "hsl(32 94% 59%)", accent: "hsl(22 90% 62%)" },   // Brighter orange for dark mode
    description: "Warm orange Bitcoin-inspired theme representing the original cryptocurrency",
    secondaryColors: {
      light: ["hsl(36 92% 50%)", "hsl(28 88% 54%)"],
      dark: ["hsl(36 92% 60%)", "hsl(28 88% 64%)"]
    }
  },
  ethereum: {
    light: { primary: "hsl(210 100% 56%)", accent: "hsl(217 92% 51%)" }, // Ethereum blue
    dark: { primary: "hsl(210 100% 66%)", accent: "hsl(217 92% 61%)" },  // Brighter blue for dark mode
    description: "Cool blue Ethereum-inspired colors representing smart contract functionality",
    secondaryColors: {
      light: ["hsl(214 95% 58%)", "hsl(206 90% 54%)"],
      dark: ["hsl(214 95% 68%)", "hsl(206 90% 64%)"]
    }
  },
  bnb: {
    light: { primary: "hsl(45 93% 47%)", accent: "hsl(41 92% 48%)" },  // BNB yellow/gold
    dark: { primary: "hsl(45 93% 57%)", accent: "hsl(41 92% 58%)" },   // Brighter gold for dark mode
    description: "Gold BNB Chain colors representing the Binance Smart Chain ecosystem",
    secondaryColors: {
      light: ["hsl(48 90% 50%)", "hsl(43 88% 48%)"],
      dark: ["hsl(48 90% 60%)", "hsl(43 88% 58%)"]
    }
  }
};

// Helper function to extract HSL components from HSL string
function extractHSLComponents(hslString: string): string | null {
  return hslString.match(/hsl\(([^)]+)\)/)?.[1] || null;
}

// Apply a color scheme to the CSS variables
function applyColorScheme(scheme: ColorScheme, isDark: boolean) {
  const colors = colorSchemes[scheme][isDark ? 'dark' : 'light'];
  const secondaryColors = colorSchemes[scheme].secondaryColors[isDark ? 'dark' : 'light'];
  
  // Apply to CSS custom properties directly
  const root = document.documentElement;
  
  // Extract color values for easier manipulation
  const primaryHSL = extractHSLComponents(colors.primary)?.split(' ');
  const accentHSL = extractHSLComponents(colors.accent)?.split(' ');
  
  // Apply the scheme as a data attribute for custom selectors
  root.setAttribute('data-color-scheme', scheme);
  
  if (primaryHSL && primaryHSL.length === 3) {
    // Apply the primary color as HSL components
    root.style.setProperty('--primary', `${primaryHSL[0]} ${primaryHSL[1]} ${primaryHSL[2]}`);
    // Also add direct vars for components that use the theme-primary property
    root.style.setProperty('--theme-primary', colors.primary);
    
    // Make primary color available for components that use hsl(var(--primary))
    root.style.setProperty('--sidebar-primary', `${primaryHSL[0]} ${primaryHSL[1]} ${primaryHSL[2]}`);
    
    // Set chart color to match the primary color
    root.style.setProperty('--chart-1', `${primaryHSL[0]} ${primaryHSL[1]} ${primaryHSL[2]}`);
  }
  
  if (accentHSL && accentHSL.length === 3) {
    // Apply the accent color as HSL components
    root.style.setProperty('--accent', `${accentHSL[0]} ${accentHSL[1]} ${accentHSL[2]}`);
    root.style.setProperty('--theme-accent', colors.accent);
  }
  
  // Apply secondary colors for gradients and accents
  if (secondaryColors && secondaryColors.length >= 2) {
    const secondaryColor1HSL = extractHSLComponents(secondaryColors[0])?.split(' ');
    const secondaryColor2HSL = extractHSLComponents(secondaryColors[1])?.split(' ');
    
    if (secondaryColor1HSL && secondaryColor1HSL.length === 3) {
      root.style.setProperty('--secondary-1', `${secondaryColor1HSL[0]} ${secondaryColor1HSL[1]} ${secondaryColor1HSL[2]}`);
      root.style.setProperty('--theme-secondary-1', secondaryColors[0]);
    }
    
    if (secondaryColor2HSL && secondaryColor2HSL.length === 3) {
      root.style.setProperty('--secondary-2', `${secondaryColor2HSL[0]} ${secondaryColor2HSL[1]} ${secondaryColor2HSL[2]}`);
      root.style.setProperty('--theme-secondary-2', secondaryColors[1]);
    }
  }
  
  // Set scheme-specific custom properties
  // These properties depend on the selected blockchain theme
  if (scheme === "bitcoin") {
    // Bitcoin scheme - warm orange colors
    root.style.setProperty('--scheme-token-card-bg', 
      `linear-gradient(135deg, ${colors.primary}/0.15, ${colors.accent}/0.05)`);
    root.style.setProperty('--scheme-mining-glow', 
      `0 0 15px ${colors.primary}/0.5`);
    root.style.setProperty('--scheme-card-highlight', 
      `${colors.primary}/0.1`);
    root.style.setProperty('--scheme-success-color', 
      isDark ? 'hsl(142 66% 50%)' : 'hsl(142 71% 45%)');
    root.style.setProperty('--scheme-warning-color', 
      colors.primary);
  } 
  else if (scheme === "ethereum") {
    // Ethereum scheme - cool blue colors
    root.style.setProperty('--scheme-token-card-bg', 
      `linear-gradient(135deg, ${colors.primary}/0.1, ${colors.accent}/0.05)`);
    root.style.setProperty('--scheme-mining-glow', 
      `0 0 20px ${colors.primary}/0.6`);
    root.style.setProperty('--scheme-card-highlight', 
      `${colors.primary}/0.08`);
    root.style.setProperty('--scheme-success-color', 
      isDark ? 'hsl(152 66% 50%)' : 'hsl(152 71% 45%)');
    root.style.setProperty('--scheme-info-color', 
      colors.primary);
  }
  else if (scheme === "bnb") {
    // BNB scheme - gold colors
    root.style.setProperty('--scheme-token-card-bg', 
      `linear-gradient(135deg, ${colors.primary}/0.12, ${colors.accent}/0.05)`);
    root.style.setProperty('--scheme-mining-glow', 
      `0 0 18px ${colors.primary}/0.55`);
    root.style.setProperty('--scheme-card-highlight', 
      `${colors.primary}/0.12`);
    root.style.setProperty('--scheme-success-color', 
      isDark ? 'hsl(142 66% 48%)' : 'hsl(142 71% 43%)');
    root.style.setProperty('--scheme-warning-color', 
      colors.primary);
  }
  else {
    // Default TSK scheme
    root.style.setProperty('--scheme-token-card-bg', 
      `linear-gradient(135deg, ${colors.primary}/0.1, ${colors.accent}/0.05)`);
    root.style.setProperty('--scheme-mining-glow', 
      `0 0 15px ${colors.primary}/0.5`);
    root.style.setProperty('--scheme-card-highlight', 
      `${colors.primary}/0.1`);
  }
  
  // Create a theme.json equivalent config for Replit's theme system
  const themeConfig = {
    variant: "vibrant",
    primary: colors.primary,
    appearance: isDark ? "dark" : "light",
    radius: 1
  };
  
  try {
    localStorage.setItem('theme-config', JSON.stringify(themeConfig));
  } catch (e) {
    console.error('Failed to save theme config to localStorage', e);
  }
  
  // Apply additional theme-specific CSS custom properties
  root.style.setProperty('--theme-name', `"${scheme.charAt(0).toUpperCase() + scheme.slice(1)}"`);
  root.style.setProperty('--theme-description', `"${colorSchemes[scheme].description}"`);
  
  // Apply transition animation to main content
  // This creates a smooth transition effect when changing themes
  const mainElement = document.querySelector('main');
  if (mainElement) {
    mainElement.classList.add('theme-transition');
    // Remove the class after the animation is complete
    setTimeout(() => {
      mainElement.classList.remove('theme-transition');
    }, 300);
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme mode (light, dark, or system)
  const [mode, setMode] = useState<ThemeMode>(() => {
    const savedMode = localStorage.getItem("theme-mode");
    
    if (savedMode === "light" || savedMode === "dark" || savedMode === "system") {
      return savedMode as ThemeMode;
    }
    
    return "system";
  });
  
  // Initialize color scheme
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    const savedScheme = localStorage.getItem("theme-color-scheme");
    
    if (savedScheme === "default" || savedScheme === "bitcoin" || 
        savedScheme === "ethereum" || savedScheme === "bnb") {
      return savedScheme as ColorScheme;
    }
    
    return "default";
  });
  
  // Track if we're in dark mode (either explicit or via system preference)
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (mode === "dark") return true;
    if (mode === "light") return false;
    
    // If system, check system preference
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  
  // Is using system preference
  const isSystem = mode === "system";

  // Listen for system preference changes
  useEffect(() => {
    if (mode !== "system") return;
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);
  
  // Update localStorage and apply classes when mode changes
  useEffect(() => {
    // Save mode to localStorage
    localStorage.setItem("theme-mode", mode);
    
    // If using system preference, determine dark/light from system
    let newIsDark = isDark;
    if (mode === "system") {
      newIsDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(newIsDark);
    } else {
      newIsDark = mode === "dark";
      setIsDark(newIsDark);
    }
    
    // Update document class
    if (newIsDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    
    // Apply color scheme
    applyColorScheme(colorScheme, newIsDark);
  }, [mode, colorScheme, isDark]);
  
  // Update localStorage when color scheme changes
  useEffect(() => {
    localStorage.setItem("theme-color-scheme", colorScheme);
    applyColorScheme(colorScheme, isDark);
  }, [colorScheme, isDark]);
  
  return (
    <ThemeContext.Provider 
      value={{ 
        mode, 
        setMode, 
        colorScheme, 
        setColorScheme,
        isDark,
        isSystem
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

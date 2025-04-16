// Keep the AdContent interface for type compatibility with other components
export interface AdContent {
  id: number;
  title: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  htmlContent?: string;
  active: boolean;
  displayDuration: number;
  createdAt: string;
  priority: number;
  customBackground?: string;
  customTextColor?: string;
  customButtonColor?: string;
  buttonText?: string;
  location?: string;
  placement?: string[];
  targetAudience?: string[];
  startDate?: string;
  endDate?: string;
}

interface AdDisplayProps {
  ad: AdContent | null;
  onClose: () => void;
  open: boolean;
}

// Completely disabled ad display component - immediately calls onClose and returns null
export default function AdDisplay({ onClose, open }: AdDisplayProps) {
  // If the component is opened, immediately close it
  if (open) {
    // Call onClose asynchronously to avoid potential state update issues
    setTimeout(onClose, 0);
  }
  
  // Return null to render nothing
  return null;
}
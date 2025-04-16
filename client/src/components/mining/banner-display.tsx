// This component has been disabled
export interface BannerContent {
  id: number;
  imageUrl: string;
  linkUrl?: string;
  title: string;
  description?: string;
  active: boolean;
  createdAt: string;
  priority: number;
}

interface BannerDisplayProps {
  banner: BannerContent | null;
}

// Banner display functionality has been completely disabled
export default function BannerDisplay({ banner }: BannerDisplayProps) {
  // Always return null to prevent banners from displaying
  return null;
}
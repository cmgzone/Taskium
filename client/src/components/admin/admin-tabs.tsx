import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Users, 
  ClipboardList, 
  Pickaxe, 
  ShoppingBag, 
  Gem, 
  Wallet, 
  Shield, 
  HardDrive,
  BookOpen,
  Image,
  Megaphone,
  ImageIcon,
  LayoutTemplate,
  CalendarClock,
  BarChart3,
  Download,
  Archive,
  FileText,
  Settings,
  KeyRound,
  Lock,
  CreditCard,
  Coins,
  Bell,
  Brain,
  Paintbrush
} from "lucide-react";
import UsersTable from "./users-table";
import MarketplaceApproval from "./marketplace-approval-new";
import PremiumPackages from "./premium-packages";
import BlockchainManagement from "./blockchain-management";
import KycManagement from "./kyc-management";
import StorageSetup from "./storage-setup";
import MiningManagement from "./mining-management";
import TaskManagement from "./task-management";
import OnboardingManagement from "./onboarding-management";
import AdManagement from "./ad-management-new";
import BannerManagementNew from "./banner-management-new";
import EventsManagement from "./events-management";
import AdvancedDashboard from "./advanced-dashboard";
import AnalyticsDashboard from "./analytics-dashboard";
import SystemBackup from "./system-backup";
import PlatformSettings from "./platform-settings";
import SystemSecrets from "./system-secrets";
import WalletConfiguration from "./wallet-configuration";
import TokenPackages from "./token-packages";
import PayPalSettings from "./paypal-settings";
import NotificationManagement from "./notification-management";
import { AIKnowledgeManagementFixed } from "./ai-knowledge-management-fixed";
import EmailSettings from "./email-settings";
import BrandingSettings from "./branding-settings";

// Group tabs into logical categories for better organization
const tabGroups = [
  {
    label: "Dashboard",
    icon: <LayoutTemplate className="h-5 w-5" />,
    color: "bg-green-600 dark:bg-green-700",
    tabs: [
      { id: "advanced", label: "Advanced Dashboard", icon: <HardDrive className="h-5 w-5" /> },
      { id: "analytics", label: "Analytics", icon: <BarChart3 className="h-5 w-5" /> }
    ]
  },
  {
    label: "User Management",
    icon: <Users className="h-5 w-5" />,
    color: "bg-blue-600 dark:bg-blue-700",
    tabs: [
      { id: "users", label: "Users", icon: <Users className="h-5 w-5" /> },
      { id: "kyc", label: "KYC Verification", icon: <Shield className="h-5 w-5" /> },
      { id: "tasks", label: "Tasks", icon: <ClipboardList className="h-5 w-5" /> },
      { id: "notifications", label: "Notifications", icon: <Bell className="h-5 w-5" /> }
    ]
  },
  {
    label: "Platform Features",
    icon: <Gem className="h-5 w-5" />,
    color: "bg-purple-600 dark:bg-purple-700",
    tabs: [
      { id: "mining", label: "Mining System", icon: <Pickaxe className="h-5 w-5" /> },
      { id: "marketplace", label: "Marketplace", icon: <ShoppingBag className="h-5 w-5" /> },
      { id: "premium", label: "Premium Packages", icon: <Gem className="h-5 w-5" /> },
      { id: "token-packages", label: "Token Packages", icon: <Coins className="h-5 w-5" /> },
      { id: "advertising", label: "Advertising", icon: <Megaphone className="h-5 w-5" /> },
      { id: "banners", label: "Banners", icon: <LayoutTemplate className="h-5 w-5" /> },
      { id: "events", label: "Events", icon: <CalendarClock className="h-5 w-5" /> },
      { id: "ai-knowledge", label: "AI Knowledge", icon: <Brain className="h-5 w-5" /> },
      { id: "ai-settings", label: "AI Settings", icon: <Settings className="h-5 w-5" /> }
    ]
  },
  {
    label: "System Settings",
    icon: <HardDrive className="h-5 w-5" />,
    color: "bg-amber-600 dark:bg-amber-700",
    tabs: [
      { id: "blockchain", label: "Blockchain", icon: <Wallet className="h-5 w-5" /> },
      { id: "wallet-config", label: "Wallet Configuration", icon: <Wallet className="h-5 w-5" /> },
      { id: "paypal-settings", label: "PayPal Integration", icon: <CreditCard className="h-5 w-5" /> },
      { id: "email-settings", label: "Email Settings", icon: <Bell className="h-5 w-5" /> },
      { id: "branding-settings", label: "Branding & Logo", icon: <Paintbrush className="h-5 w-5" /> },
      { id: "system-secrets", label: "System Secrets", icon: <KeyRound className="h-5 w-5" /> },
      { id: "storage", label: "Storage", icon: <HardDrive className="h-5 w-5" /> },
      { id: "platform-settings", label: "Platform Settings", icon: <FileText className="h-5 w-5" /> },
      { id: "onboarding", label: "Onboarding", icon: <BookOpen className="h-5 w-5" /> },
      { id: "backup", label: "System Backup", icon: <Archive className="h-5 w-5" /> }
    ]
  }
];

// Flatten all tabs for easy lookup
const allTabs = tabGroups.flatMap(group => group.tabs);

export default function AdminTabs() {
  const [activeTab, setActiveTab] = useState("advanced");

  // For mobile view, we'll use a select dropdown instead of tabs
  const handleSelectChange = (value: string) => {
    setActiveTab(value);
  };

  // Get the group ID for a tab ID
  const getGroupForTab = (tabId: string) => {
    return tabGroups.find(group => 
      group.tabs.some(tab => tab.id === tabId)
    );
  };

  // Get tab details by ID
  const getTabById = (tabId: string) => {
    return allTabs.find(tab => tab.id === tabId);
  };

  // Get the active group color
  const activeGroup = getGroupForTab(activeTab);
  const activeTabInfo = getTabById(activeTab);

  return (
    <div className="w-full">
      {/* Mobile dropdown selector (visible on small screens) */}
      <div className="md:hidden p-4 border-b">
        <Select value={activeTab} onValueChange={handleSelectChange}>
          <SelectTrigger className="border-2 relative h-12">
            {activeTabInfo && (
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-md" 
                   style={{backgroundColor: `var(--${activeGroup?.color || 'primary'})`}} />
            )}
            <div className="flex items-center gap-3">
              {activeTabInfo?.icon}
              <SelectValue>
                {activeTabInfo?.label || "Select Tab"}
              </SelectValue>
            </div>
          </SelectTrigger>
          <SelectContent className="max-h-[70vh]">
            {tabGroups.map(group => (
              <div key={group.label} className="mb-3 last:mb-0">
                <div className={`mb-1 px-2 py-1.5 text-sm font-semibold flex items-center gap-2 rounded-md text-white ${group.color}`}>
                  {group.icon}
                  {group.label}
                </div>
                {group.tabs.map(tab => (
                  <SelectItem key={tab.id} value={tab.id} className="pl-8 mb-1">
                    <div className="flex items-center gap-3">
                      {tab.icon}
                      {tab.label}
                    </div>
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Desktop tabs (hidden on small screens) */}
      <div className="hidden md:flex w-full">
        {/* Left sidebar for tab categories */}
        <div className="w-64 border-r shrink-0 bg-gradient-to-b from-muted/50 to-muted/20">
          {tabGroups.map(group => (
            <div key={group.label} className="mb-4 last:mb-0 px-3 py-2">
              <div className={`rounded-md px-3 py-2 text-white font-medium flex items-center gap-2 ${group.color}`}>
                {group.icon}
                {group.label}
              </div>
              <div className="mt-1.5 ml-2 space-y-1">
                {group.tabs.map(tab => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group w-full px-3 py-2.5 rounded-md flex items-center gap-3 transition-all 
                        ${isActive
                          ? 'bg-primary/10 text-primary font-medium'
                          : 'hover:bg-muted/80 text-muted-foreground'
                        }`}
                    >
                      <div className={`${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                        {tab.icon}
                      </div>
                      {tab.label}
                      {isActive && (
                        <div className="ml-auto w-1 h-5 bg-primary rounded-full"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Content area */}
        <div className="flex-1 p-6">
          {activeTab === "advanced" && <AdvancedDashboard />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
          {activeTab === "users" && <UsersTable />}
          {activeTab === "tasks" && <TaskManagement />}
          {activeTab === "mining" && <MiningManagement />}
          {activeTab === "marketplace" && <MarketplaceApproval />}
          {activeTab === "premium" && <PremiumPackages />}
          {activeTab === "token-packages" && <TokenPackages />}
          {activeTab === "blockchain" && <BlockchainManagement />}
          {activeTab === "wallet-config" && <WalletConfiguration />}
          {activeTab === "paypal-settings" && <PayPalSettings />}
          {activeTab === "email-settings" && <EmailSettings />}
          {activeTab === "system-secrets" && <SystemSecrets />}
          {activeTab === "kyc" && <KycManagement />}
          {activeTab === "storage" && <StorageSetup />}
          {activeTab === "platform-settings" && <PlatformSettings />}
          {activeTab === "onboarding" && <OnboardingManagement />}
          {activeTab === "advertising" && <AdManagement />}
          {activeTab === "banners" && <BannerManagementNew />}
          {activeTab === "events" && <EventsManagement />}
          {activeTab === "backup" && <SystemBackup />}
          {activeTab === "notifications" && <NotificationManagement />}
          {activeTab === "ai-knowledge" && <AIKnowledgeManagementFixed />}
          {activeTab === "branding-settings" && <BrandingSettings />}
          {activeTab === "ai-settings" && (
            <div className="text-center py-3">
              <p className="text-muted-foreground mb-3">
                AI Settings can be accessed on the dedicated page:
              </p>
              <a 
                href="/admin/ai-settings"
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <Settings className="h-4 w-4" />
                Open AI Settings Page
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

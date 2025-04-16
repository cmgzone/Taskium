import { Route, Switch, useLocation } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";

// Providers
import { AuthProvider } from "@/hooks/use-auth";
import { Web3Provider } from "@/lib/web3-provider";
import { ThemeProvider } from "@/lib/theme-provider";
import { AdProvider } from "@/lib/ad-service";
import { queryClient } from "@/lib/queryClient";

// UI Components
import { ErrorDialog } from "@/components/ui/error-dialog";
import { BackendStatusAlert } from "@/components/ui/backend-status";

// Components
import AppInstallPopup from "@/components/app-install-popup";
import MiningRewardNotification from "@/components/mining/mining-reward-notification";
import ChatNotificationHandler from "@/components/chat/chat-notification-handler";
import { WebSocketMonitor } from "@/components/chat/websocket-monitor";
import { PopupAd } from "@/components/advertising/popup-ad";
import { AIChat } from "@/components/ai/ai-chat";

// Pages
import DashboardPage from "@/pages/dashboard-page";
import MiningPage from "@/pages/mining-page";
import MarketplacePage from "@/pages/marketplace-page";
import ReferralsPage from "@/pages/referrals-page";
import WalletPage from "@/pages/wallet-page";
import PremiumPage from "@/pages/premium-page";
import SettingsPage from "@/pages/settings-page";
import WhitepapersPage from "@/pages/whitepapers-page";
import AdminPage from "@/pages/admin-page";
import AdminSettingsPage from "@/pages/AdminSettingsPage";
import { AISettings } from "@/pages/admin/AISettings";
import AdvertisingPage from "@/pages/advertising-page";
import TokenStorePage from "@/pages/token-store-page";
import ChatPage from "@/pages/chat-page";
import AndroidAppPage from "@/pages/android-app-page";
import TestUploadPage from "@/pages/test-upload-page";
import AuthPage from "@/pages/auth-page";
import SimpleLogin from "@/pages/simple-login";
import DirectLogin from "@/pages/direct-login";
import BasicAuthPage from "@/pages/basic-auth-page";
import ForgotPasswordPage from "@/pages/forgot-password-page";
import ResetPasswordPage from "@/pages/reset-password-page";
import NotificationsPage from "@/pages/notifications-page";
import DownloadPage from "@/pages/download-page";
import TermsPage from "@/pages/terms-page";
import LoginTest from "@/pages/login-test";
import WalletDebugPage from "@/pages/wallet-debug";
import MobileWalletDebug from "@/pages/mobile-wallet-debug";
import NotFound from "@/pages/not-found";

// Routes
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={() => <DashboardPage />} />
      <ProtectedRoute path="/mining" component={() => <MiningPage />} />
      <ProtectedRoute path="/marketplace" component={() => <MarketplacePage />} />
      <ProtectedRoute path="/referrals" component={() => <ReferralsPage />} />
      <ProtectedRoute path="/wallet" component={() => <WalletPage />} />
      <ProtectedRoute path="/premium" component={() => <PremiumPage />} />
      <ProtectedRoute path="/advertising" component={() => <AdvertisingPage />} />
      <ProtectedRoute path="/tokens" component={() => <TokenStorePage />} />
      <ProtectedRoute path="/settings" component={() => <SettingsPage />} />
      <ProtectedRoute path="/whitepapers" component={() => <WhitepapersPage />} />
      <ProtectedRoute path="/admin" component={() => <AdminPage />} />
      <ProtectedRoute path="/admin/settings" component={() => <AdminSettingsPage />} />
      <ProtectedRoute path="/admin/ai-settings" component={() => <AISettings />} />
      <ProtectedRoute path="/chat" component={() => <ChatPage />} />
      <ProtectedRoute path="/notifications" component={() => <NotificationsPage />} />
      <Route path="/android-app" component={AndroidAppPage} />
      <Route path="/test-upload" component={TestUploadPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/login" component={SimpleLogin} />
      <Route path="/direct-login" component={DirectLogin} />
      <Route path="/forgot-password" component={ForgotPasswordPage} />
      <Route path="/reset-password" component={ResetPasswordPage} />
      <Route path="/download" component={DownloadPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/login-test" component={() => <LoginTest />} />
      <Route path="/wallet-debug" component={WalletDebugPage} />
      <Route path="/mobile-wallet" component={MobileWalletDebug} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <Web3Provider>
            <AdProvider>
              <Router />
              <AppInstallPopup />
              <MiningRewardNotification />
              <ChatNotificationHandler />
              {/* WebSocketMonitor temporarily disabled */}
              <PopupAd />
              <AIChat />
              <ErrorDialog />
              <BackendStatusAlert />
              <Toaster />
            </AdProvider>
          </Web3Provider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
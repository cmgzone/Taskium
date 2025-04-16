/**
 * Admin Settings Page
 * Provides a centralized interface for managing all platform settings
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

// Admin setting panels
import SecretManagementPanel from '@/components/admin/SecretManagementPanel';
import PaymentSettingsPanel from '@/components/admin/PaymentSettingsPanel';
import { GoogleAPISetup } from '@/components/admin/GoogleAPISetup';
import EmailSettings from '@/components/admin/email-settings';
import BrandingSettings from '@/components/admin/branding-settings';

// Icons
import { 
  AlertCircle, 
  Settings, 
  Shield, 
  Key, 
  CreditCard,
  Bell,
  Users,
  Globe,
  Database,
  Server,
  Search,
  BrainCircuit,
  Mail,
  Palette
} from 'lucide-react';

const AdminSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('secrets');
  
  return (
    <div className="container mx-auto py-6 px-4 max-w-7xl">
      <div className="flex flex-col space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/icons/taskium-logo-original.png" 
                alt="Taskium Logo" 
                className="h-12 w-auto hidden md:block" 
              />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Settings</h1>
                <p className="text-muted-foreground">
                  Configure and manage platform-wide settings and integrations
                </p>
              </div>
            </div>
            <Badge variant="outline" className="px-3 py-1">
              Admin Only
            </Badge>
          </div>
          <Separator />
        </div>
        
        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation */}
          <div className="w-full lg:w-64 space-y-4">
            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center mb-2">
                <Settings className="h-5 w-5 mr-2" />
                <h2 className="font-medium">Settings Categories</h2>
              </div>
              <nav className="space-y-1">
                <Button
                  variant={activeTab === 'secrets' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('secrets')}
                >
                  <Key className="h-4 w-4 mr-2" />
                  Security & Secrets
                </Button>
                <Button
                  variant={activeTab === 'payment' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('payment')}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Payment Gateways
                </Button>
                <Button
                  variant={activeTab === 'notifications' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('notifications')}
                  disabled
                >
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button
                  variant={activeTab === 'users' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('users')}
                  disabled
                >
                  <Users className="h-4 w-4 mr-2" />
                  User Management
                </Button>
                <Button
                  variant={activeTab === 'blockchain' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('blockchain')}
                  disabled
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Blockchain
                </Button>
                <Button
                  variant={activeTab === 'database' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('database')}
                  disabled
                >
                  <Database className="h-4 w-4 mr-2" />
                  Database
                </Button>
                <Button
                  variant={activeTab === 'system' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('system')}
                  disabled
                >
                  <Server className="h-4 w-4 mr-2" />
                  System
                </Button>
                <Button
                  variant={activeTab === 'googleapi' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('googleapi')}
                >
                  <BrainCircuit className="h-4 w-4 mr-2" />
                  AI & API Integration
                </Button>
                <Button
                  variant={activeTab === 'email' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('email')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email Settings
                </Button>
                <Button
                  variant={activeTab === 'branding' ? 'default' : 'ghost'}
                  className="w-full justify-start"
                  onClick={() => setActiveTab('branding')}
                >
                  <Palette className="h-4 w-4 mr-2" />
                  Branding Settings
                </Button>
              </nav>
            </div>
            
            {/* Admin Info */}
            <div className="bg-muted p-3 rounded-md">
              <div className="flex items-center mb-2">
                <Shield className="h-5 w-5 mr-2" />
                <h2 className="font-medium">Admin Tools</h2>
              </div>
              <Alert variant="default" className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Administrator Mode</AlertTitle>
                <AlertDescription className="text-xs">
                  Changes made here will affect the entire platform. Proceed with caution.
                </AlertDescription>
              </Alert>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="flex-1">
            {activeTab === 'secrets' && <SecretManagementPanel />}
            {activeTab === 'payment' && <PaymentSettingsPanel />}
            {activeTab === 'notifications' && (
              <div className="bg-muted p-6 rounded-md text-center">
                <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">Notification Settings</h3>
                <p className="text-muted-foreground mb-4">
                  This feature is coming soon. You'll be able to configure email, SMS, and in-app notifications.
                </p>
              </div>
            )}
            {activeTab === 'users' && (
              <div className="bg-muted p-6 rounded-md text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">User Management Settings</h3>
                <p className="text-muted-foreground mb-4">
                  This feature is coming soon. You'll be able to configure user roles, permissions, and authentication.
                </p>
              </div>
            )}
            {activeTab === 'blockchain' && (
              <div className="bg-muted p-6 rounded-md text-center">
                <Globe className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">Blockchain Settings</h3>
                <p className="text-muted-foreground mb-4">
                  This feature is coming soon. You'll be able to configure blockchain networks, wallets, and contracts.
                </p>
              </div>
            )}
            {activeTab === 'database' && (
              <div className="bg-muted p-6 rounded-md text-center">
                <Database className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">Database Settings</h3>
                <p className="text-muted-foreground mb-4">
                  This feature is coming soon. You'll be able to configure database connections and backups.
                </p>
              </div>
            )}
            {activeTab === 'system' && (
              <div className="bg-muted p-6 rounded-md text-center">
                <Server className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-medium mb-2">System Settings</h3>
                <p className="text-muted-foreground mb-4">
                  This feature is coming soon. You'll be able to configure system-wide settings and logs.
                </p>
              </div>
            )}
            {activeTab === 'googleapi' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BrainCircuit className="h-8 w-8 text-primary" />
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">AI & API Integration</h2>
                      <p className="text-muted-foreground">
                        Configure external APIs to enhance the platform's capabilities
                      </p>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <GoogleAPISetup />
              </div>
            )}
            {activeTab === 'email' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-8 w-8 text-primary" />
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Email Configuration</h2>
                      <p className="text-muted-foreground">
                        Configure SMTP settings for sending emails from the platform
                      </p>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <EmailSettings />
              </div>
            )}
            {activeTab === 'branding' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Palette className="h-8 w-8 text-primary" />
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Branding Settings</h2>
                      <p className="text-muted-foreground">
                        Configure platform logo, colors, and other branding elements
                      </p>
                    </div>
                  </div>
                </div>
                <Separator className="my-4" />
                <BrandingSettings />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
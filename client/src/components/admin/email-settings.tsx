import React, { useState, useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useAuth } from '@/hooks/use-auth';

// UI Components
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';

// Icons
import { Mail, Send, AlertCircle, Loader2 } from 'lucide-react';

// Define the validation schema
const emailSettingsSchema = z.object({
  smtpHost: z.string().min(1, 'SMTP host is required'),
  smtpPort: z.string().min(1, 'SMTP port is required').regex(/^\d+$/, 'Port must be a number'),
  smtpUser: z.string().min(1, 'SMTP username is required'),
  smtpPassword: z.string().min(1, 'SMTP password is required'),
  fromEmail: z.string().email('Please enter a valid email'),
  fromName: z.string().min(1, 'From name is required'),
  enableEmailNotifications: z.boolean().default(true),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

// Define the email settings interface
interface EmailSettings {
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPassword: string;
  fromEmail: string;
  fromName: string;
  enableEmailNotifications: boolean;
}

export default function EmailSettings() {
  // Component state
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testEmailAddress, setTestEmailAddress] = useState('');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [enableNotifications, setEnableNotifications] = useState(true);
  const formRef = useRef<HTMLFormElement>(null);
  
  // Form state for manual validation
  const [formValues, setFormValues] = useState<EmailSettings>({
    smtpHost: '',
    smtpPort: '587',
    smtpUser: '',
    smtpPassword: '',
    fromEmail: 'noreply@tskplatform.com',
    fromName: 'TSK Platform',
    enableEmailNotifications: true
  });
  
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Get current user
  const { user } = useAuth();
  
  // Fetch current email settings
  const { data: settings, isLoading, error } = useQuery<EmailSettings>({
    queryKey: ['/api/admin/email-settings'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/admin/email-settings');
        return response.json();
      } catch (error) {
        console.error('Error fetching email settings:', error);
        throw error;
      }
    },
    refetchOnWindowFocus: false,
    enabled: !!user && user.role === 'admin',
    retry: 1,
  });

  // Update form values when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormValues({
        smtpHost: settings.smtpHost || '',
        smtpPort: settings.smtpPort || '587',
        smtpUser: settings.smtpUser || '',
        smtpPassword: settings.smtpPassword || '',
        fromEmail: settings.fromEmail || 'noreply@tskplatform.com',
        fromName: settings.fromName || 'TSK Platform',
        enableEmailNotifications: settings.enableEmailNotifications !== false
      });
      setEnableNotifications(settings.enableEmailNotifications !== false);
    }
  }, [settings]);

  // Handle form field changes
  const handleFieldChange = (field: keyof EmailSettings, value: string | boolean) => {
    setFormValues(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when changed
    if (formErrors[field]) {
      setFormErrors(prev => {
        const newErrors = {...prev};
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Validate form manually
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!formValues.smtpHost) {
      errors.smtpHost = 'SMTP host is required';
    }
    
    if (!formValues.smtpPort) {
      errors.smtpPort = 'SMTP port is required';
    } else if (!/^\d+$/.test(formValues.smtpPort)) {
      errors.smtpPort = 'Port must be a number';
    }
    
    if (!formValues.smtpUser) {
      errors.smtpUser = 'SMTP username is required';
    }
    
    if (!formValues.smtpPassword) {
      errors.smtpPassword = 'SMTP password is required';
    }
    
    if (!formValues.fromEmail) {
      errors.fromEmail = 'From email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues.fromEmail)) {
      errors.fromEmail = 'Please enter a valid email';
    }
    
    if (!formValues.fromName) {
      errors.fromName = 'From name is required';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSaving(true);
    try {
      await apiRequest(
        'POST',
        '/api/admin/email-settings',
        formValues
      );

      queryClient.invalidateQueries({ queryKey: ['/api/admin/email-settings'] });
      toast({
        title: 'Email settings updated',
        description: 'Your email configuration has been saved successfully.',
      });
    } catch (error) {
      console.error('Failed to update email settings:', error);
      toast({
        title: 'Failed to update settings',
        description: 'There was an error saving your email configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Send test email
  const sendTestEmail = async () => {
    if (!testEmailAddress) {
      toast({
        title: 'Email address required',
        description: 'Please enter an email address to send the test to.',
        variant: 'destructive',
      });
      return;
    }

    setIsSendingTest(true);
    try {
      await apiRequest(
        'POST',
        '/api/admin/email-settings/test',
        { 
          testEmail: testEmailAddress,
          ...formValues
        }
      );

      toast({
        title: 'Test email sent',
        description: `A test email was sent to ${testEmailAddress}. Please check your inbox.`,
      });
    } catch (error) {
      console.error('Failed to send test email:', error);
      toast({
        title: 'Failed to send test email',
        description: 'There was an error sending the test email. Please check your email configuration.',
        variant: 'destructive',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (isLoading) {
    return <div className="p-6">Loading email settings...</div>;
  }

  if (error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-md">
        <h3 className="text-lg font-medium text-red-800">Error</h3>
        <p className="mt-1 text-red-700">Failed to load email settings. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h2 className="text-2xl font-bold">Email Configuration</h2>
        <p className="text-muted-foreground">
          Configure SMTP settings for sending emails from the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            SMTP Configuration
          </CardTitle>
          <CardDescription>
            Set up your email server configuration for sending password resets and notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* SMTP Host Field */}
              <div className="space-y-2">
                <Label htmlFor="smtpHost">SMTP Host</Label>
                <Input 
                  id="smtpHost"
                  placeholder="smtp.example.com" 
                  value={formValues.smtpHost}
                  onChange={(e) => handleFieldChange('smtpHost', e.target.value)}
                  className={formErrors.smtpHost ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  The hostname of your SMTP server
                </p>
                {formErrors.smtpHost && (
                  <p className="text-sm text-red-500">{formErrors.smtpHost}</p>
                )}
              </div>

              {/* SMTP Port Field */}
              <div className="space-y-2">
                <Label htmlFor="smtpPort">SMTP Port</Label>
                <Input 
                  id="smtpPort"
                  placeholder="587" 
                  value={formValues.smtpPort}
                  onChange={(e) => handleFieldChange('smtpPort', e.target.value)}
                  className={formErrors.smtpPort ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  Common ports: 587 (TLS), 465 (SSL)
                </p>
                {formErrors.smtpPort && (
                  <p className="text-sm text-red-500">{formErrors.smtpPort}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* SMTP Username Field */}
              <div className="space-y-2">
                <Label htmlFor="smtpUser">SMTP Username</Label>
                <Input 
                  id="smtpUser"
                  placeholder="username@example.com" 
                  value={formValues.smtpUser}
                  onChange={(e) => handleFieldChange('smtpUser', e.target.value)}
                  className={formErrors.smtpUser ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  The username for SMTP authentication
                </p>
                {formErrors.smtpUser && (
                  <p className="text-sm text-red-500">{formErrors.smtpUser}</p>
                )}
              </div>

              {/* SMTP Password Field */}
              <div className="space-y-2">
                <Label htmlFor="smtpPassword">SMTP Password</Label>
                <Input 
                  id="smtpPassword"
                  type="password"
                  placeholder="••••••••" 
                  value={formValues.smtpPassword}
                  onChange={(e) => handleFieldChange('smtpPassword', e.target.value)}
                  className={formErrors.smtpPassword ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  The password for SMTP authentication
                </p>
                {formErrors.smtpPassword && (
                  <p className="text-sm text-red-500">{formErrors.smtpPassword}</p>
                )}
              </div>
            </div>

            <Separator />

            <div className="grid gap-6 md:grid-cols-2">
              {/* From Email Field */}
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email</Label>
                <Input 
                  id="fromEmail"
                  placeholder="noreply@tskplatform.com" 
                  value={formValues.fromEmail}
                  onChange={(e) => handleFieldChange('fromEmail', e.target.value)}
                  className={formErrors.fromEmail ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  The email address that will appear in the "From" field
                </p>
                {formErrors.fromEmail && (
                  <p className="text-sm text-red-500">{formErrors.fromEmail}</p>
                )}
              </div>

              {/* From Name Field */}
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name</Label>
                <Input 
                  id="fromName"
                  placeholder="TSK Platform" 
                  value={formValues.fromName}
                  onChange={(e) => handleFieldChange('fromName', e.target.value)}
                  className={formErrors.fromName ? 'border-red-500' : ''}
                />
                <p className="text-sm text-muted-foreground">
                  The name that will appear in the "From" field
                </p>
                {formErrors.fromName && (
                  <p className="text-sm text-red-500">{formErrors.fromName}</p>
                )}
              </div>
            </div>

            {/* Enable Email Notifications Toggle */}
            <div className="flex items-center space-x-2 rounded-lg border p-4">
              <div className="flex-1">
                <Label 
                  htmlFor="enableEmailNotifications" 
                  className="text-base font-medium flex items-center space-x-2"
                >
                  <input
                    type="checkbox"
                    id="enableEmailNotifications"
                    checked={enableNotifications}
                    onChange={(e) => {
                      setEnableNotifications(e.target.checked);
                      handleFieldChange('enableEmailNotifications', e.target.checked);
                    }}
                    className="h-4 w-4"
                  />
                  <span>Enable Email Notifications</span>
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  When enabled, the system will send emails for password resets, welcome messages, and notifications
                </p>
              </div>
            </div>

            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Configuration'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Test Email Delivery
          </CardTitle>
          <CardDescription>
            Send a test email to verify your configuration is working correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="flex-1">
              <Label htmlFor="testEmail">Test Email Address</Label>
              <Input
                id="testEmail"
                type="email"
                placeholder="Enter recipient email address"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
              />
            </div>
            <Button 
              onClick={sendTestEmail} 
              disabled={isSendingTest}
              className="md:mt-0 mt-2"
            >
              {isSendingTest ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Test Email'
              )}
            </Button>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Note</AlertTitle>
            <AlertDescription>
              Make sure to save your configuration before sending a test email. The test will use your current saved settings.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
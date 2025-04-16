import { Router, Request, Response } from 'express';
import { systemSettings } from '../../shared/schema';
import { db } from '../db';
import { eq } from 'drizzle-orm';
import { emailService } from '../services/email-service';
import settingsService from '../services/settings-service';

const router = Router();

// Get email settings
router.get('/email-settings', async (req: Request, res: Response) => {
  try {
    // Get settings from database
    const smtpHostSetting = await settingsService.getSettingByKey('SMTP_HOST');
    const smtpPortSetting = await settingsService.getSettingByKey('SMTP_PORT');
    const smtpUserSetting = await settingsService.getSettingByKey('SMTP_USER');
    const smtpPasswordSetting = await settingsService.getSettingByKey('SMTP_PASSWORD');
    const fromEmailSetting = await settingsService.getSettingByKey('FROM_EMAIL');
    const fromNameSetting = await settingsService.getSettingByKey('FROM_NAME');
    const enableEmailNotificationsSetting = await settingsService.getSettingByKey('ENABLE_EMAIL_NOTIFICATIONS');

    // Build the email settings object
    const emailSettings = {
      smtpHost: smtpHostSetting?.value || process.env.SMTP_HOST || '',
      smtpPort: smtpPortSetting?.value || process.env.SMTP_PORT || '587',
      smtpUser: smtpUserSetting?.value || process.env.SMTP_USER || '',
      smtpPassword: smtpPasswordSetting?.value ? '••••••••' : '', // Mask the password
      fromEmail: fromEmailSetting?.value || process.env.FROM_EMAIL || 'noreply@tskplatform.com',
      fromName: fromNameSetting?.value || process.env.FROM_NAME || 'TSK Platform',
      enableEmailNotifications: (enableEmailNotificationsSetting?.value === 'true') ? true : true
    };

    return res.status(200).json(emailSettings);
  } catch (error) {
    console.error('Error fetching email settings:', error);
    return res.status(500).json({ message: 'Failed to fetch email settings' });
  }
});

// Update email settings
router.post('/email-settings', async (req: Request, res: Response) => {
  try {
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      fromEmail,
      fromName,
      enableEmailNotifications
    } = req.body;

    // Save all settings to database
    await settingsService.saveSetting({
      key: 'SMTP_HOST',
      value: smtpHost,
      description: 'SMTP server hostname',
      category: 'email',
      isActive: true
    });

    await settingsService.saveSetting({
      key: 'SMTP_PORT',
      value: smtpPort,
      description: 'SMTP server port',
      category: 'email',
      isActive: true
    });

    await settingsService.saveSetting({
      key: 'SMTP_USER',
      value: smtpUser,
      description: 'SMTP server username',
      category: 'email',
      isActive: true
    });

    if (smtpPassword && smtpPassword !== '••••••••') {
      await settingsService.saveSetting({
        key: 'SMTP_PASSWORD',
        value: smtpPassword,
        description: 'SMTP server password',
        category: 'email',
        isActive: true
      });
    }

    await settingsService.saveSetting({
      key: 'FROM_EMAIL',
      value: fromEmail,
      description: 'Email sender address',
      category: 'email',
      isActive: true
    });

    await settingsService.saveSetting({
      key: 'FROM_NAME',
      value: fromName,
      description: 'Email sender name',
      category: 'email',
      isActive: true
    });

    await settingsService.saveSetting({
      key: 'ENABLE_EMAIL_NOTIFICATIONS',
      value: enableEmailNotifications.toString(),
      description: 'Enable sending of email notifications',
      category: 'email',
      isActive: true
    });

    // Update environment variables for the current process
    process.env.SMTP_HOST = smtpHost;
    process.env.SMTP_PORT = smtpPort;
    process.env.SMTP_USER = smtpUser;
    if (smtpPassword && smtpPassword !== '••••••••') {
      process.env.SMTP_PASSWORD = smtpPassword;
    }
    process.env.FROM_EMAIL = fromEmail;
    process.env.FROM_NAME = fromName;

    // Reinitialize the email service with the new settings
    const isConfigured = emailService.reinitialize();

    return res.status(200).json({ 
      message: 'Email settings updated successfully',
      isConfigured
    });
  } catch (error) {
    console.error('Error updating email settings:', error);
    return res.status(500).json({ message: 'Failed to update email settings' });
  }
});

// Send test email
router.post('/email-settings/test', async (req: Request, res: Response) => {
  try {
    const { testEmail } = req.body;

    if (!testEmail) {
      return res.status(400).json({ message: 'Test email address is required' });
    }

    // If email settings were provided in the request, temporarily update them for this test
    const {
      smtpHost,
      smtpPort,
      smtpUser,
      smtpPassword,
      fromEmail,
      fromName
    } = req.body;

    if (smtpHost && smtpPort && smtpUser && smtpPassword) {
      // Temporarily override environment variables
      const originalHost = process.env.SMTP_HOST;
      const originalPort = process.env.SMTP_PORT;
      const originalUser = process.env.SMTP_USER;
      const originalPassword = process.env.SMTP_PASSWORD;
      const originalFromEmail = process.env.FROM_EMAIL;
      const originalFromName = process.env.FROM_NAME;

      process.env.SMTP_HOST = smtpHost;
      process.env.SMTP_PORT = smtpPort;
      process.env.SMTP_USER = smtpUser;
      
      // Only update password if it's not masked
      if (smtpPassword && smtpPassword !== '••••••••') {
        process.env.SMTP_PASSWORD = smtpPassword;
      }
      
      if (fromEmail) process.env.FROM_EMAIL = fromEmail;
      if (fromName) process.env.FROM_NAME = fromName;

      // Reinitialize email service with new settings
      emailService.reinitialize();

      // Send test email
      const success = await emailService.sendTestEmail(testEmail);

      // Restore original environment variables
      process.env.SMTP_HOST = originalHost;
      process.env.SMTP_PORT = originalPort;
      process.env.SMTP_USER = originalUser;
      process.env.SMTP_PASSWORD = originalPassword;
      process.env.FROM_EMAIL = originalFromEmail;
      process.env.FROM_NAME = originalFromName;

      // Re-initialize with original settings
      emailService.reinitialize();

      if (success) {
        return res.status(200).json({ message: 'Test email sent successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to send test email' });
      }
    } else {
      // Use current configuration to send test email
      const success = await emailService.sendTestEmail(testEmail);

      if (success) {
        return res.status(200).json({ message: 'Test email sent successfully' });
      } else {
        return res.status(500).json({ message: 'Failed to send test email' });
      }
    }
  } catch (error) {
    console.error('Error sending test email:', error);
    return res.status(500).json({ message: 'Failed to send test email' });
  }
});

export default router;
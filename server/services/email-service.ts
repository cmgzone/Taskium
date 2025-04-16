import nodemailer from 'nodemailer';
import { notifications, users } from '../../shared/schema';
import { pool, db } from '../db';
import { eq } from 'drizzle-orm';

/**
 * Email Service for the TSK Platform
 * Handles sending emails for account notifications, admin communications, and system alerts
 */
class EmailService {
  private transporter!: nodemailer.Transporter;
  private isConfigured: boolean = false;
  private fromEmail: string = 'noreply@tskplatform.com';
  private fromName: string = 'TSK Platform';

  constructor() {
    // We'll initialize the transporter when the environment variables are available
    this.initializeTransporter();
  }

  /**
   * Initialize the email transporter with available environment variables
   */
  private initializeTransporter() {
    try {
      // Check if required environment variables are set
      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = process.env.SMTP_PORT;
      const smtpUser = process.env.SMTP_USER;
      const smtpPass = process.env.SMTP_PASSWORD;

      if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
        console.log('Email service is not fully configured. Some env variables are missing.');
        this.isConfigured = false;
        
        // Setup a development/preview transporter for testing
        // This allows viewing email content in the console without actually sending
        this.transporter = nodemailer.createTransport({
          streamTransport: true,
          newline: 'unix',
          buffer: true
        });
        
        return;
      }

      // Setup the actual SMTP transporter
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: parseInt(smtpPort) === 465, // true for 465, false for other ports
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      this.isConfigured = true;
      this.fromEmail = process.env.FROM_EMAIL || 'noreply@tskplatform.com';
      this.fromName = process.env.FROM_NAME || 'TSK Platform';

      console.log('Email service configured successfully');
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
      this.isConfigured = false;
    }
  }

  /**
   * Send a password reset email to a user
   */
  async sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean> {
    try {
      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
      
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: 'Reset Your TSK Platform Password',
        text: `Hello ${username},\n\nYou recently requested to reset your password on the TSK Platform. Click the link below to set a new password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this change, you can safely ignore this email.\n\nBest regards,\nThe TSK Platform Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Reset Your TSK Platform Password</h2>
            <p>Hello ${username},</p>
            <p>You recently requested to reset your password on the TSK Platform. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #4b9aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
            </div>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this change, you can safely ignore this email.</p>
            <p>Best regards,<br>The TSK Platform Team</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (!this.isConfigured) {
        // In development mode, log the email content to console
        console.log('Password reset email would be sent to:', email);
        console.log('Email preview:', info.message.toString());
      } else {
        console.log('Password reset email sent:', info.messageId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send password reset email:', error);
      return false;
    }
  }

  /**
   * Send an account notification email
   */
  async sendNotificationEmail(userId: number, title: string, message: string, type: string): Promise<boolean> {
    try {
      // Get user's email
      const user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      if (!user || !user.email) {
        console.log(`Cannot send notification email to user ${userId}: No email address found`);
        return false;
      }

      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: user.email,
        subject: `TSK Platform: ${title}`,
        text: `${message}\n\nLogin to your account to view more details: ${process.env.APP_URL || 'http://localhost:3000'}/login`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">${title}</h2>
            <p>${message.replace(/\n/g, '<br>')}</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="background-color: #4b9aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">View Account</a>
            </div>
            <p style="font-size: 12px; color: #999; margin-top: 30px;">
              You're receiving this email because you're a member of the TSK Platform.<br>
              You can manage your email preferences in your account settings.
            </p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (!this.isConfigured) {
        // In development mode, log the email content to console
        console.log('Notification email would be sent to:', user.email);
        console.log('Email preview:', info.message.toString());
      } else {
        console.log('Notification email sent:', info.messageId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send notification email:', error);
      return false;
    }
  }

  /**
   * Send a system-wide announcement email to multiple users
   */
  async sendBulkAnnouncement(userIds: number[], title: string, message: string): Promise<{ success: number, failed: number }> {
    let successCount = 0;
    let failureCount = 0;

    for (const userId of userIds) {
      const success = await this.sendNotificationEmail(userId, title, message, 'announcement');
      if (success) {
        successCount++;
      } else {
        failureCount++;
      }
    }

    return {
      success: successCount,
      failed: failureCount
    };
  }

  /**
   * Send account registration confirmation email
   */
  async sendWelcomeEmail(email: string, username: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: email,
        subject: 'Welcome to TSK Platform!',
        text: `Welcome to TSK Platform, ${username}!\n\nThank you for joining our community. Your account has been successfully created.\n\nYou can now login to access all platform features: ${process.env.APP_URL || 'http://localhost:3000'}/login\n\nBest regards,\nThe TSK Platform Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Welcome to TSK Platform!</h2>
            <p>Hello ${username},</p>
            <p>Thank you for joining our community. Your account has been successfully created.</p>
            <ul style="line-height: 1.6;">
              <li>Mine TSK tokens daily</li>
              <li>Trade on our marketplace</li>
              <li>Earn referral bonuses</li>
              <li>Participate in community events</li>
            </ul>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'http://localhost:3000'}/login" style="background-color: #4b9aff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Login to Your Account</a>
            </div>
            <p>Best regards,<br>The TSK Platform Team</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (!this.isConfigured) {
        // In development mode, log the email content to console
        console.log('Welcome email would be sent to:', email);
        console.log('Email preview:', info.message.toString());
      } else {
        console.log('Welcome email sent:', info.messageId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  /**
   * Send a test email to verify email settings
   */
  async sendTestEmail(recipientEmail: string): Promise<boolean> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: recipientEmail,
        subject: 'TSK Platform Email Configuration Test',
        text: 'This is a test email to verify your TSK Platform email configuration is working correctly.',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <h2 style="color: #333;">Email Configuration Test</h2>
            <p>This is a test email to verify your TSK Platform email configuration is working correctly.</p>
            <div style="padding: 15px; background-color: #f5f5f5; border-radius: 4px; margin: 20px 0;">
              <p><strong>SMTP Host:</strong> ${process.env.SMTP_HOST}</p>
              <p><strong>SMTP Port:</strong> ${process.env.SMTP_PORT}</p>
              <p><strong>From Email:</strong> ${this.fromEmail}</p>
              <p><strong>From Name:</strong> ${this.fromName}</p>
              <p><strong>Date/Time:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <p>If you received this email, your email configuration is working correctly.</p>
            <p>Best regards,<br>The TSK Platform Team</p>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      if (!this.isConfigured) {
        // In development mode, log the email content to console
        console.log('Test email would be sent to:', recipientEmail);
        console.log('Email preview:', info.message.toString());
      } else {
        console.log('Test email sent:', info.messageId);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to send test email:', error);
      return false;
    }
  }

  /**
   * Re-initialize the email service with updated configuration
   * Call this if environment variables are updated during runtime
   */
  reinitialize() {
    this.initializeTransporter();
    return this.isConfigured;
  }

  /**
   * Check if the email service is properly configured
   */
  isEmailServiceConfigured(): boolean {
    return this.isConfigured;
  }
}

// Create and export a singleton instance
export const emailService = new EmailService();
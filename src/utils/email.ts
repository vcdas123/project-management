import nodemailer from 'nodemailer';
import { config } from '../config';
import { logger } from './logger';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export const sendEmail = async ({ to, subject, html }: EmailOptions): Promise<boolean> => {
  try {
    const transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.port === 465,
      auth: {
        user: config.email.user,
        pass: config.email.pass
      }
    });

    await transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html
    });

    return true;
  } catch (error) {
    logger.error('Email sending failed:', error);
    return false;
  }
};

export const generatePasswordResetEmail = (to: string, resetToken: string): EmailOptions => {
  const resetUrl = `${config.server.port}/api/auth/reset-password/${resetToken}`;

  return {
    to,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Password Reset Request</h2>
        <p>You are receiving this email because you (or someone else) has requested the reset of your password.</p>
        <p>Please click the link below to reset your password:</p>
        <p>
          <a href="${resetUrl}" style="padding: 10px 15px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
        <p>The link is valid for 1 hour.</p>
      </div>
    `
  };
};
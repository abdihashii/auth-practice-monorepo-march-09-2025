import type { CreateEmailResponseSuccess } from 'resend';

import { Resend } from 'resend';

import env from '@/env';

const resend = new Resend(env.RESEND_API_KEY);

/**
 * Send a verification email to the user
 *
 * @param email - The email address of the user
 * @param token - The token to verify the email
 * @param baseUrl - The base URL of the application
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  baseUrl: string,
): Promise<{
  success: boolean;
  data: CreateEmailResponseSuccess | null;
  error?: undefined;
} | {
  success: boolean;
  error: unknown;
  data?: undefined;
}> {
  const verificationUrl = `${baseUrl}/verify?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@abdirahmanhaji.com',
      to: email,
      subject: 'Verify your email address',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #333;">Verify Your Email</h1>
          <p>Thank you for registering. Please click the button below to verify your email address:</p>
          <a 
            href="${verificationUrl}"
            style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;"
          >
            Verify Email
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${verificationUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send verification email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending verification email:', error);
    return { success: false, error };
  }
}

/**
 * Send a forgot password email to the user
 *
 * @param email - The email address of the user
 * @param token - The token to verify the email
 */
export async function sendForgotPasswordEmail(
  email: string,
  token: string,
  baseUrl: string,
): Promise<{
  success: boolean;
  data: CreateEmailResponseSuccess | null;
  error?: undefined;
} | {
  success: boolean;
  error: unknown;
  data?: undefined;
}> {
  const resetPasswordUrl = `${baseUrl}/reset-password?token=${token}`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'no-reply@abdirahmanhaji.com',
      to: email,
      subject: 'Reset your password',
      html: `
        <div 
          style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"
        >
          <h1 style="color: #333;">Reset Your Password</h1>
          <p>Click the button below to reset your password:</p>
          <a 
            href="${resetPasswordUrl}" 
            style="display: inline-block; background-color: #4a5568; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 20px 0;"
          >
            Reset Password
          </a>
          <p>Or copy and paste this link in your browser:</p>
          <p style="word-break: break-all;">${resetPasswordUrl}</p>
          <p>This link will expire in 24 hours.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send forgot password email:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error sending forgot password email:', error);
    return { success: false, error };
  }
}

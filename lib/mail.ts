import 'server-only';

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL);
}

export function isGmailConfigured(): boolean {
  const email = process.env.EMAIL_USER || process.env.NEXT_PUBLIC_EMAIL;
  const pass = process.env.EMAIL_PASS || process.env.NEXT_PUBLIC_EMAIL_PASS;
  return Boolean(email && pass);
}

export function isEmailConfigured(): boolean {
  return isResendConfigured() || isGmailConfigured();
}

/** Public contact address shown in email footers. */
export function getContactEmail(): string {
  return (
    process.env.CONTACT_EMAIL ||
    process.env.RESEND_FROM_EMAIL ||
    process.env.EMAIL_USER ||
    process.env.NEXT_PUBLIC_EMAIL ||
    'contact@store.com'
  );
}

/** Where new-order admin notifications are delivered (supports comma-separated ADMIN_EMAIL). */
export function getAdminNotificationEmails(): string[] {
  const raw =
    process.env.ADMIN_EMAIL ||
    process.env.RESEND_ADMIN_EMAIL ||
    getContactEmail();
  return raw
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

function getFromAddress(): string {
  const storeName = process.env.RESEND_FROM_NAME || process.env.NEXT_PUBLIC_STORE_NAME || 'Store';

  if (isResendConfigured()) {
    return `${storeName} <${process.env.RESEND_FROM_EMAIL}>`;
  }

  const email = process.env.EMAIL_USER || process.env.NEXT_PUBLIC_EMAIL || 'noreply@store.com';
  return `"${storeName}" <${email}>`;
}

async function sendViaResend(options: SendEmailOptions): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const to = Array.isArray(options.to) ? options.to : [options.to];

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo || getContactEmail(),
  });

  if (error) {
    throw new Error(`Resend: ${error.message}`);
  }
}

async function sendViaGmail(options: SendEmailOptions): Promise<void> {
  const email = process.env.EMAIL_USER || process.env.NEXT_PUBLIC_EMAIL;
  const password = process.env.EMAIL_PASS || process.env.NEXT_PUBLIC_EMAIL_PASS;

  if (!email || !password) {
    throw new Error('Gmail email credentials are not configured');
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: email, pass: password },
  });

  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;

  await transporter.sendMail({
    from: getFromAddress(),
    to,
    subject: options.subject,
    html: options.html,
    replyTo: options.replyTo || getContactEmail(),
  });
}

/** Sends email via Resend when configured, otherwise falls back to Gmail SMTP. */
export async function sendEmail(options: SendEmailOptions): Promise<void> {
  if (!isEmailConfigured()) {
    throw new Error(
      'Email is not configured. Set RESEND_API_KEY + RESEND_FROM_EMAIL (recommended) or Gmail SMTP credentials.'
    );
  }

  try {
    if (isResendConfigured()) {
      await sendViaResend(options);
      return;
    }
    await sendViaGmail(options);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);

    if (
      message.includes('EAUTH') ||
      message.includes('BadCredentials') ||
      message.includes('Username and Password not accepted')
    ) {
      throw new Error(
        'Gmail authentication failed. Use a Gmail App Password in EMAIL_PASS, or switch to Resend (RESEND_API_KEY + RESEND_FROM_EMAIL). ' +
          `Original error: ${message}`
      );
    }

    throw error instanceof Error ? error : new Error(message);
  }
}

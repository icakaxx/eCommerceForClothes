import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import {
  getAdminNotificationEmails,
  getContactEmail,
  isResendConfigured,
} from '@/lib/mail';

export const runtime = 'nodejs';

function normalizeEmailAddress(address: string): string {
  const match = address.match(/<([^>]+)>/);
  return (match ? match[1] : address).trim().toLowerCase();
}

function shouldForwardToInbox(toAddresses: string[]): boolean {
  const inbox =
    process.env.RESEND_INBOUND_ADDRESS ||
    process.env.CONTACT_EMAIL ||
    process.env.RESEND_FROM_EMAIL;

  if (!inbox) {
    return true;
  }

  const target = inbox.trim().toLowerCase();
  return toAddresses.some((address) => normalizeEmailAddress(address) === target);
}

export async function POST(request: NextRequest) {
  if (!isResendConfigured()) {
    return NextResponse.json({ error: 'Resend is not configured' }, { status: 503 });
  }

  const payload = await request.text();
  const resend = new Resend(process.env.RESEND_API_KEY);

  let event: { type?: string; data?: { email_id?: string; to?: string[] } };

  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (webhookSecret) {
    try {
      event = resend.webhooks.verify({
        payload,
        headers: {
          id: request.headers.get('svix-id') ?? '',
          timestamp: request.headers.get('svix-timestamp') ?? '',
          signature: request.headers.get('svix-signature') ?? '',
        },
        webhookSecret,
      }) as typeof event;
    } catch (error) {
      console.error('Resend inbound webhook verification failed:', error);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }
  } else {
    console.warn('RESEND_WEBHOOK_SECRET is not set — inbound webhook is not verified');
    try {
      event = JSON.parse(payload);
    } catch {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
  }

  if (event.type !== 'email.received') {
    return NextResponse.json({ ok: true, ignored: event.type ?? 'unknown' });
  }

  const emailId = event.data?.email_id;
  const toAddresses = event.data?.to ?? [];

  if (!emailId) {
    return NextResponse.json({ error: 'Missing email_id' }, { status: 400 });
  }

  if (!shouldForwardToInbox(toAddresses)) {
    return NextResponse.json({ ok: true, ignored: 'not_target_inbox' });
  }

  const forwardTo = getAdminNotificationEmails();
  if (forwardTo.length === 0) {
    return NextResponse.json({ error: 'No ADMIN_EMAIL configured' }, { status: 503 });
  }

  const fromAddress = getContactEmail();

  const { data, error } = await resend.emails.receiving.forward({
    emailId,
    from: fromAddress,
    to: forwardTo,
  });

  if (error) {
    console.error('Failed to forward inbound email:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    forwardedTo: forwardTo,
    messageId: data?.id,
  });
}

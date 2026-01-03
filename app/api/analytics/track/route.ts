import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';

// Rate limiting store (in-memory, replace with Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per minute
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute

interface TrackingPayload {
  sessionId: string;
  visitorId?: string;
  deviceType?: string;
  browser?: string;
  browserVersion?: string;
  os?: string;
  osVersion?: string;
  referrer?: string;
  referrerCategory?: string;
  entryPage?: string;
  exitPage?: string;
  pageViews?: number;
  sessionDuration?: number;
  isBounce?: boolean;
  isNewSession?: boolean;
  isExit?: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get IP address for rate limiting and geolocation
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
                request.headers.get('x-real-ip') || 
                'unknown';

    // Rate limiting check
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    const payload: TrackingPayload = await request.json();

    // Validate required fields
    if (!payload.sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Get country from IP using geolocation service
    const country = await getCountryFromIP(ip);

    const supabase = createServerClient();

    // Check if this is an update to existing session
    const { data: existingSession } = await supabase
      .from('visitor_sessions')
      .select('sessionid, page_views, created_at')
      .eq('sessionid', payload.sessionId)
      .single();

    if (existingSession) {
      // Update existing session
      const updates: any = {
        exit_page: payload.exitPage,
        page_views: payload.pageViews || existingSession.page_views + 1,
        session_duration: payload.sessionDuration || 0,
        is_bounce: payload.isBounce !== undefined ? payload.isBounce : (payload.pageViews || 0) <= 1,
        last_activity: new Date().toISOString(),
      };

      const { error: updateError } = await supabase
        .from('visitor_sessions')
        .update(updates)
        .eq('sessionid', payload.sessionId);

      if (updateError) {
        console.error('Failed to update session:', updateError);
        return NextResponse.json(
          { error: 'Failed to update session' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, updated: true });
    } else {
      // Create new session
      const sessionData = {
        sessionid: payload.sessionId,
        visitorid: payload.visitorId || 'anonymous',
        ip_address: ip !== 'unknown' ? ip : null,
        country: country,
        device_type: payload.deviceType || 'other',
        browser: payload.browser || 'Unknown',
        browser_version: payload.browserVersion || '',
        os: payload.os || 'Unknown',
        os_version: payload.osVersion || '',
        referrer: payload.referrer || '',
        referrer_category: payload.referrerCategory || 'direct',
        entry_page: payload.entryPage || '/',
        exit_page: payload.exitPage || payload.entryPage || '/',
        page_views: payload.pageViews || 1,
        session_duration: payload.sessionDuration || 0,
        is_bounce: payload.isBounce !== undefined ? payload.isBounce : true,
        consent_given: true,
      };

      const { error: insertError } = await supabase
        .from('visitor_sessions')
        .insert([sessionData]);

      if (insertError) {
        console.error('Failed to create session:', insertError);
        return NextResponse.json(
          { error: 'Failed to create session' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, created: true });
    }
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Check rate limit for IP address
 */
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(ip);

  if (!record || now > record.resetTime) {
    // Create new rate limit record
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW,
    });
    return true;
  }

  if (record.count >= RATE_LIMIT) {
    return false;
  }

  record.count++;
  return true;
}

/**
 * Get country from IP address using free geolocation service
 * Using ip-api.com (free tier: 45 requests/minute)
 */
async function getCountryFromIP(ip: string): Promise<string> {
  // Skip for localhost/private IPs
  if (ip === 'unknown' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return 'Unknown';
  }

  try {
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode`, {
      method: 'GET',
      headers: {
        'User-Agent': 'eCommerce-Analytics/1.0',
      },
    });

    if (!response.ok) {
      return 'Unknown';
    }

    const data = await response.json();
    return data.countryCode || 'Unknown';
  } catch (error) {
    console.error('Geolocation error:', error);
    return 'Unknown';
  }
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of rateLimitStore.entries()) {
    if (now > record.resetTime) {
      rateLimitStore.delete(ip);
    }
  }
}, 5 * 60 * 1000); // Clean up every 5 minutes







import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Middleware for:
 * 1. Capturing IP address and forwarding to client
 * 2. Bot detection (to skip analytics tracking)
 * 3. Adding security headers
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Get IP address
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             request.ip || 
             'unknown';

  // Forward IP to client (for analytics)
  response.headers.set('x-client-ip', ip);

  // Bot detection
  const userAgent = request.headers.get('user-agent') || '';
  const isBot = detectBot(userAgent);
  response.headers.set('x-is-bot', isBot ? 'true' : 'false');

  // Add security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  return response;
}

/**
 * Detect if the user agent is a bot/crawler
 */
function detectBot(userAgent: string): boolean {
  const botPatterns = [
    /bot/i,
    /spider/i,
    /crawl/i,
    /headless/i,
    /phantom/i,
    /slurp/i,
    /scrape/i,
    /googlebot/i,
    /bingbot/i,
    /yandexbot/i,
    /baiduspider/i,
    /facebookexternalhit/i,
    /twitterbot/i,
    /whatsapp/i,
    /linkedinbot/i,
    /telegrambot/i,
    /slack/i,
    /discord/i,
    /apex/i,
    /applebot/i,
    /duckduckbot/i,
    /semrushbot/i,
    /ahrefsbot/i,
    /mj12bot/i,
    /dotbot/i,
    /rogerbot/i,
    /petalbot/i,
  ];

  return botPatterns.some(pattern => pattern.test(userAgent));
}

/**
 * Configure which routes should run the middleware
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes - already handled internally)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};


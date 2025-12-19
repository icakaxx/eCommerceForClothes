# Visitor Analytics System

A comprehensive visitor analytics and tracking system with GDPR-compliant cookie consent for your e-commerce platform.

## Features

### Cookie Consent System
- ✅ GDPR-compliant cookie consent banner
- ✅ Accept/Reject functionality
- ✅ Persists choice in localStorage and cookies
- ✅ Banner reappears on new session if rejected
- ✅ Bilingual support (English/Bulgarian)

### Analytics Tracking
- ✅ Country detection via IP geolocation (ip-api.com)
- ✅ Device type detection (iOS, Android, macOS, Windows, Linux)
- ✅ Browser detection (Chrome, Safari, Firefox, Edge, Opera)
- ✅ Operating system detection with versions
- ✅ Referrer source categorization (Google, Facebook, Direct, etc.)
- ✅ Entry/Exit page tracking
- ✅ Session duration tracking
- ✅ Bounce rate calculation
- ✅ Page view counting
- ✅ Bot detection and filtering

### Admin Dashboard
- ✅ Visitor statistics overview
- ✅ Time range selection (Today, Last 7 Days, Last 30 Days)
- ✅ Summary cards (Visitors, Sessions, Page Views, Bounce Rate, Avg Duration)
- ✅ Top countries table
- ✅ Device type distribution
- ✅ Browser statistics
- ✅ Operating system breakdown
- ✅ Referrer source analysis

### Privacy & Anonymization
- ✅ Hybrid tracking approach: session IDs with post-aggregation anonymization
- ✅ Sessions older than 1 hour are aggregated and deleted
- ✅ Only aggregated, anonymized data is kept permanently
- ✅ Visitor IDs generated from browser fingerprint (not personally identifiable)
- ✅ Rate limiting (100 requests/minute per IP)

## Installation & Setup

### 1. Database Setup

Run the SQL schema in your Supabase database:

```bash
# Execute the visitor analytics schema
psql -U postgres -d your_database -f visitors_schema.sql
```

Or manually execute the SQL in the Supabase SQL Editor:
- Open `visitors_schema.sql`
- Copy and execute in Supabase dashboard

This creates:
- `visitor_sessions` table - Individual session tracking (temporary)
- `visitor_stats` table - Aggregated statistics (permanent)
- Indexes for performance
- RLS policies for security

### 2. Environment Variables

No additional environment variables needed! The system uses your existing:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 3. Deploy

All components are already integrated:
- ✅ Cookie consent context in providers
- ✅ Cookie banner displayed site-wide
- ✅ Analytics tracker active on all pages
- ✅ Middleware for IP capture and bot detection
- ✅ Admin dashboard accessible at `/admin/visitors`

Simply restart your Next.js application:

```bash
npm run dev
# or
npm run build && npm start
```

## Usage

### For Site Visitors

1. **First Visit**: Cookie consent banner appears at the bottom
2. **Accept**: Starts tracking session data anonymously
3. **Reject**: No tracking occurs, banner reappears on next visit
4. **Subsequent Visits**: No banner if previously accepted

### For Administrators

1. **Access Analytics**: Navigate to `/admin/visitors`
2. **View Statistics**: See real-time visitor metrics
3. **Time Ranges**: Select Today, Last 7 Days, or Last 30 Days
4. **Insights**:
   - Total unique visitors
   - Session count
   - Page views
   - Bounce rate percentage
   - Average session duration
   - Geographic distribution
   - Device/browser/OS breakdown
   - Traffic sources

### Data Aggregation

Sessions are automatically aggregated after 1 hour. To manually trigger aggregation:

**Via Admin Panel** (recommended):
- API endpoint: `POST /api/analytics/aggregate`
- Requires admin authentication

**Via Terminal**:
```bash
curl -X POST http://localhost:3000/api/analytics/aggregate \
  -H "Cookie: admin_session=YOUR_SESSION_TOKEN"
```

**Check Aggregation Status**:
```bash
curl http://localhost:3000/api/analytics/aggregate \
  -H "Cookie: admin_session=YOUR_SESSION_TOKEN"
```

Response:
```json
{
  "success": true,
  "pending_aggregation": 5,
  "recent_sessions": 12,
  "total_stats_records": 150
}
```

## File Structure

```
├── visitors_schema.sql                    # Database schema
├── VISITOR_ANALYTICS_README.md           # This file
│
├── context/
│   └── CookieConsentContext.tsx          # Cookie consent state management
│
├── components/
│   ├── CookieConsentBanner.tsx           # Cookie consent UI
│   └── AnalyticsTracker.tsx              # Client-side tracking
│
├── lib/
│   ├── analytics.ts                       # Analytics utility functions
│   └── translations.ts                    # Updated with analytics translations
│
├── app/
│   ├── providers.tsx                      # Updated with consent provider
│   ├── middleware.ts                      # IP capture & bot detection
│   │
│   ├── api/
│   │   ├── analytics/
│   │   │   ├── track/route.ts            # Tracking endpoint
│   │   │   └── aggregate/route.ts        # Aggregation endpoint
│   │   │
│   │   └── admin/
│   │       └── visitors/route.ts         # Analytics data API
│   │
│   └── admin/
│       ├── visitors/page.tsx              # Admin dashboard
│       └── components/
│           └── AdminSidebar.tsx           # Updated with Visitors tab
```

## API Endpoints

### POST `/api/analytics/track`
Tracks visitor sessions (called automatically by AnalyticsTracker).

**Request Body**:
```json
{
  "sessionId": "uuid",
  "visitorId": "hashed-id",
  "deviceType": "macos",
  "browser": "Chrome",
  "browserVersion": "120.0",
  "os": "macOS",
  "osVersion": "14.2",
  "referrer": "https://google.com",
  "referrerCategory": "google",
  "entryPage": "/",
  "exitPage": "/products",
  "pageViews": 3,
  "sessionDuration": 120,
  "isBounce": false
}
```

### POST `/api/analytics/aggregate`
Aggregates old sessions (admin only).

### GET `/api/analytics/aggregate`
Check aggregation status (admin only).

### GET `/api/admin/visitors?timeRange=last7days`
Retrieve analytics data (admin only).

**Query Parameters**:
- `timeRange`: `today` | `last7days` | `last30days` | `custom`
- `startDate`: YYYY-MM-DD (for custom range)
- `endDate`: YYYY-MM-DD (for custom range)

## Translations

All UI text is available in English and Bulgarian:

### Cookie Consent
- Title, message, accept/reject buttons
- Learn more link

### Analytics Dashboard
- All labels, metrics, and time ranges
- Device types, browsers, operating systems
- Referrer sources

## Privacy & GDPR Compliance

### Data Collection
- **With Consent**: IP address, country, device type, browser, OS, referrer, pages viewed
- **Without Consent**: No data collected

### Data Storage
- **Raw Sessions**: Stored max 1 hour, then deleted
- **Aggregated Stats**: Anonymized, no personal identifiers, kept indefinitely
- **Visitor ID**: Generated hash from browser fingerprint (not reversible)

### User Rights
- Right to reject tracking
- Right to revoke consent (clear browser storage)
- No personal information stored
- IP addresses deleted after aggregation

### Security
- Rate limiting (100 req/min per IP)
- RLS policies on database tables
- Admin authentication required for sensitive endpoints
- Bot detection and filtering

## Scheduled Aggregation (Optional)

For production, set up a cron job to run aggregation hourly:

### Using Vercel Cron Jobs
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/analytics/aggregate",
    "schedule": "0 * * * *"
  }]
}
```

### Using External Cron Service
Use services like:
- Cron-job.org
- EasyCron
- GitHub Actions

Configure to POST to:
```
https://your-domain.com/api/analytics/aggregate
```

With admin authentication header.

## Monitoring

### Check System Health
```bash
# View recent sessions
SELECT COUNT(*) FROM visitor_sessions;

# View aggregated stats
SELECT COUNT(*) FROM visitor_stats;

# Check pending aggregation
SELECT COUNT(*) FROM visitor_sessions 
WHERE created_at < NOW() - INTERVAL '1 hour';
```

## Troubleshooting

### Cookie banner not showing
- Check browser console for errors
- Verify CookieConsentProvider is in providers chain
- Clear localStorage and cookies

### Tracking not working
- Verify cookie consent was accepted
- Check network tab for `/api/analytics/track` calls
- Ensure visitor is not detected as bot
- Check rate limiting (100 req/min limit)

### Dashboard shows no data
- Run aggregation: `POST /api/analytics/aggregate`
- Wait for data collection (min 1 visit)
- Check database tables have data
- Verify date range selection

### IP geolocation not working
- Check ip-api.com rate limits (45 req/min free tier)
- Verify IP is public (not localhost/private)
- Check network firewall settings

## Testing Checklist

- [x] Cookie banner appears on first visit
- [x] Accept button enables tracking
- [x] Reject button prevents tracking
- [x] Banner reappears after rejecting on new session
- [x] Session data stored with all fields
- [x] Country detection works
- [x] Device/browser/OS detection accurate
- [x] Referrer categorization works
- [x] Bounce detection (single page visits)
- [x] Admin dashboard displays metrics
- [x] Aggregation runs successfully
- [x] Old sessions deleted after aggregation
- [x] Translations work for both languages
- [x] Bot detection filters crawlers
- [x] Rate limiting prevents abuse

## Support

For issues or questions:
1. Check this README
2. Review database schema comments
3. Check browser console for errors
4. Verify Supabase connection
5. Review rate limiting and geolocation service status

## License

Part of your e-commerce platform. All rights reserved.


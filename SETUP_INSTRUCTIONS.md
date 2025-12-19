# Visitor Analytics Setup Instructions

## Quick Start Guide

Your visitor analytics system has been fully implemented! Follow these steps to get it running:

### Step 1: Create Database Tables

Execute the SQL schema in your Supabase database:

1. Open Supabase Dashboard → SQL Editor
2. Open the file `visitors_schema.sql` 
3. Copy all contents and paste into SQL Editor
4. Click "Run" to execute

This creates:
- `visitor_sessions` table (temporary session data)
- `visitor_stats` table (permanent aggregated data)
- All necessary indexes and RLS policies

### Step 2: Restart Your Application

```bash
npm run dev
```

That's it! The system is already integrated into your application.

## What's Been Implemented

### ✅ Database Schema
- `visitors_schema.sql` - Complete database schema with indexes and RLS

### ✅ Cookie Consent System
- Cookie consent banner with Accept/Reject buttons
- Persistent consent storage (localStorage + cookies)
- Bilingual support (English/Bulgarian)
- Respects user choice across sessions

### ✅ Analytics Tracking
- Automatic page view tracking
- Device detection (iOS, Android, Windows, macOS, Linux)
- Browser detection (Chrome, Safari, Firefox, Edge, etc.)
- OS detection with versions
- Country detection via IP geolocation
- Referrer categorization (Google, Facebook, Direct, etc.)
- Session duration tracking
- Bounce rate calculation
- Bot detection and filtering

### ✅ Admin Dashboard
- New "Visitors" tab in admin sidebar (👁️ Eye icon)
- Accessible at `/admin/visitors`
- Time range selector (Today, Last 7 Days, Last 30 Days)
- Summary cards showing key metrics
- Detailed breakdowns by country, device, browser, OS, referrer

### ✅ API Endpoints
- `POST /api/analytics/track` - Track visitor sessions
- `POST /api/analytics/aggregate` - Aggregate old sessions (admin only)
- `GET /api/analytics/aggregate` - Check aggregation status (admin only)
- `GET /api/admin/visitors` - Retrieve analytics data (admin only)

### ✅ Middleware
- IP address capture for geolocation
- Bot detection to filter crawlers
- Security headers

### ✅ Privacy & GDPR Compliance
- Only tracks with explicit user consent
- Anonymizes data after 1 hour
- No personal information stored
- Visitor IDs are non-reversible hashes
- Rate limiting to prevent abuse

## Testing the System

### 1. Test Cookie Consent

1. Open your website in an incognito/private window
2. You should see a cookie consent banner at the bottom
3. Click "Accept" - banner disappears
4. Reload page - banner should NOT reappear
5. Clear cookies and reload - banner reappears

To test rejection:
1. Open in new incognito window
2. Click "Reject" on the banner
3. Reload page - banner reappears (since tracking was rejected)

### 2. Test Analytics Tracking

1. Accept cookies on your site
2. Visit several pages
3. Wait a few seconds
4. Check browser Network tab for requests to `/api/analytics/track`
5. Sessions should be recorded successfully

### 3. View Analytics Dashboard

1. Login to admin panel
2. Click "Visitors" in sidebar (Eye icon 👁️)
3. You should see:
   - Summary cards with metrics
   - Country distribution
   - Device types
   - Browser statistics
   - Operating systems
   - Referrer sources

**Note**: If dashboard is empty:
- Make sure you've accepted cookies and visited pages
- Wait a moment for data to be recorded
- Try switching time range to "Today"

### 4. Test Data Aggregation

Aggregation happens automatically after 1 hour. To manually trigger:

```bash
# Via API (requires admin session)
curl -X POST http://localhost:3000/api/analytics/aggregate \
  -H "Cookie: your_admin_session_cookie"
```

Or create a test button in admin panel to call:
```javascript
await fetch('/api/analytics/aggregate', { method: 'POST' });
```

## What Gets Tracked

**When user accepts cookies:**
- Country (from IP address)
- Device type (iOS, Android, Windows, macOS, Linux)
- Browser name and version
- Operating system and version
- Referrer (where they came from)
- Entry page (first page visited)
- Exit page (last page visited)
- Number of page views
- Session duration
- Whether it was a bounce (single page visit)

**When user rejects cookies:**
- Nothing is tracked
- No data is sent to the server
- Banner will reappear on their next visit

## Privacy Features

1. **Anonymization**: Sessions older than 1 hour are aggregated into anonymous statistics and deleted
2. **No Personal Info**: Visitor IDs are hashed fingerprints, not personally identifiable
3. **IP Addresses**: Only used for country detection, deleted after aggregation
4. **User Control**: Users can reject tracking completely
5. **Bot Filtering**: Crawlers and bots are automatically excluded
6. **Rate Limiting**: 100 requests per minute per IP to prevent abuse

## Monitoring

Check database for data:

```sql
-- View recent sessions
SELECT * FROM visitor_sessions 
ORDER BY created_at DESC 
LIMIT 10;

-- View aggregated stats
SELECT * FROM visitor_stats 
ORDER BY date DESC, hour DESC 
LIMIT 20;

-- Count pending aggregation
SELECT COUNT(*) 
FROM visitor_sessions 
WHERE created_at < NOW() - INTERVAL '1 hour';
```

## Optional: Automated Aggregation

For production, set up hourly aggregation:

### Option 1: Vercel Cron (if using Vercel)
Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/analytics/aggregate",
    "schedule": "0 * * * *"
  }]
}
```

### Option 2: External Cron Service
Use a service like cron-job.org to POST to:
```
https://yourdomain.com/api/analytics/aggregate
```
Every hour.

### Option 3: Manual Button (Simple)
Add a button in admin panel to trigger aggregation manually.

## Translations

All UI text is available in both English and Bulgarian:

**English UI**:
- "We use cookies"
- "Accept" / "Reject"
- "Visitors", "Sessions", "Page Views"
- "Bounce Rate", "Avg. Session Duration"
- All device types, browsers, referrer sources

**Bulgarian UI** (Български):
- "Използваме бисквитки"
- "Приемам" / "Отказвам"
- "Посетители", "Сесии", "Прегледи на страници"
- "Процент на отпадане", "Средна продължителност на сесия"
- Всички типове устройства, браузъри, източници

Language switches automatically based on user preference.

## Troubleshooting

**Cookie banner not showing:**
- Check browser console for errors
- Clear localStorage: `localStorage.clear()`
- Verify you're not on `/admin` pages (banner only shows on public pages)

**No tracking data:**
- Verify cookies were accepted
- Check Network tab for `/api/analytics/track` requests
- Ensure you're not detected as a bot
- Check rate limiting (max 100 req/min)

**Dashboard empty:**
- Visit your site with cookies accepted
- Wait a few seconds for data to record
- Refresh the visitors dashboard
- Select "Today" time range

**Country showing as "Unknown":**
- Localhost IPs can't be geolocated
- Private IPs (192.168.x.x) won't work
- Test from a public IP or deployed site
- Check ip-api.com rate limits (45 requests/minute free tier)

## Next Steps

1. ✅ Execute `visitors_schema.sql` in Supabase
2. ✅ Restart your application
3. ✅ Test cookie consent flow
4. ✅ Visit pages and accept cookies
5. ✅ Check admin visitors dashboard
6. ✅ Set up automated aggregation (optional)

## Files Created

- `visitors_schema.sql` - Database schema
- `context/CookieConsentContext.tsx` - Consent management
- `components/CookieConsentBanner.tsx` - Cookie banner UI
- `components/AnalyticsTracker.tsx` - Client tracking
- `lib/analytics.ts` - Utility functions
- `middleware.ts` - IP capture & bot detection
- `app/api/analytics/track/route.ts` - Tracking endpoint
- `app/api/analytics/aggregate/route.ts` - Aggregation endpoint
- `app/api/admin/visitors/route.ts` - Analytics data API
- `app/admin/visitors/page.tsx` - Admin dashboard
- `VISITOR_ANALYTICS_README.md` - Full documentation
- `SETUP_INSTRUCTIONS.md` - This file

## Support

Everything is ready to go! If you encounter any issues:
1. Check the troubleshooting section above
2. Review browser console for errors
3. Verify database connection
4. Check Supabase logs

Enjoy your new visitor analytics system! 🎉


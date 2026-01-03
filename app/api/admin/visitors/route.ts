import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

/**
 * GET endpoint to retrieve visitor analytics data
 * Query params:
 * - startDate: Start date (YYYY-MM-DD)
 * - endDate: End date (YYYY-MM-DD)
 * - timeRange: 'today' | 'last7days' | 'last30days' | 'custom'
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'last7days';
    let startDate = searchParams.get('startDate');
    let endDate = searchParams.get('endDate');

    // Calculate date range based on timeRange
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeRange === 'today') {
      startDate = today.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    } else if (timeRange === 'last7days') {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      startDate = sevenDaysAgo.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    } else if (timeRange === 'last30days') {
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      startDate = thirtyDaysAgo.toISOString().split('T')[0];
      endDate = today.toISOString().split('T')[0];
    }

    // Validate dates
    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    // Fetch aggregated stats for date range
    const { data: stats, error: statsError } = await supabase
      .from('visitor_stats')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate);

    if (statsError) {
      console.error('Failed to fetch stats:', statsError);
      return NextResponse.json(
        { error: 'Failed to fetch visitor stats' },
        { status: 500 }
      );
    }

    // Also fetch recent sessions (not yet aggregated)
    const { data: recentSessions, error: sessionsError } = await supabase
      .from('visitor_sessions')
      .select('*')
      .gte('created_at', `${startDate}T00:00:00Z`)
      .lte('created_at', `${endDate}T23:59:59Z`);

    if (sessionsError) {
      console.error('Failed to fetch recent sessions:', sessionsError);
    }

    // Combine and process data
    const analytics = processAnalyticsData(stats || [], recentSessions || []);

    return NextResponse.json({
      success: true,
      data: analytics,
      dateRange: { startDate, endDate, timeRange },
    });
  } catch (error) {
    console.error('Visitor analytics error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Process raw stats and sessions into analytics summary
 */
function processAnalyticsData(stats: any[], recentSessions: any[]) {
  // Calculate totals from aggregated stats
  let totalVisitors = 0;
  let totalSessions = 0;
  let totalPageViews = 0;
  let totalBouncedSessions = 0;
  let totalDuration = 0;

  const countryMap = new Map<string, number>();
  const deviceMap = new Map<string, number>();
  const browserMap = new Map<string, number>();
  const osMap = new Map<string, number>();
  const referrerMap = new Map<string, number>();

  // Process aggregated stats
  for (const stat of stats) {
    totalVisitors += stat.total_visitors || 0;
    totalSessions += stat.total_sessions || 0;
    totalPageViews += stat.total_pageviews || 0;
    totalBouncedSessions += stat.bounced_sessions || 0;
    totalDuration += (stat.avg_session_duration || 0) * (stat.total_sessions || 0);

    // Country distribution
    const country = stat.country || 'Unknown';
    countryMap.set(country, (countryMap.get(country) || 0) + (stat.total_sessions || 0));

    // Device distribution
    const device = stat.device_type || 'other';
    deviceMap.set(device, (deviceMap.get(device) || 0) + (stat.total_sessions || 0));

    // Browser distribution
    const browser = stat.browser || 'Unknown';
    browserMap.set(browser, (browserMap.get(browser) || 0) + (stat.total_sessions || 0));

    // OS distribution
    const os = stat.os || 'Unknown';
    osMap.set(os, (osMap.get(os) || 0) + (stat.total_sessions || 0));

    // Referrer distribution
    const referrer = stat.referrer_category || 'direct';
    referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + (stat.total_sessions || 0));
  }

  // Process recent sessions (not yet aggregated)
  const uniqueVisitors = new Set<string>();
  for (const session of recentSessions) {
    uniqueVisitors.add(session.visitorid);
    totalSessions++;
    totalPageViews += session.page_views || 0;
    if (session.is_bounce) {
      totalBouncedSessions++;
    }
    totalDuration += session.session_duration || 0;

    // Country
    const country = session.country || 'Unknown';
    countryMap.set(country, (countryMap.get(country) || 0) + 1);

    // Device
    const device = session.device_type || 'other';
    deviceMap.set(device, (deviceMap.get(device) || 0) + 1);

    // Browser
    const browser = session.browser || 'Unknown';
    browserMap.set(browser, (browserMap.get(browser) || 0) + 1);

    // OS
    const os = session.os || 'Unknown';
    osMap.set(os, (osMap.get(os) || 0) + 1);

    // Referrer
    const referrer = session.referrer_category || 'direct';
    referrerMap.set(referrer, (referrerMap.get(referrer) || 0) + 1);
  }

  totalVisitors += uniqueVisitors.size;

  // Calculate metrics
  const bounceRate = totalSessions > 0 ? (totalBouncedSessions / totalSessions) * 100 : 0;
  const avgSessionDuration = totalSessions > 0 ? Math.floor(totalDuration / totalSessions) : 0;

  // Convert maps to sorted arrays
  const topCountries = Array.from(countryMap.entries())
    .map(([country, sessions]) => ({ country, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  const deviceTypes = Array.from(deviceMap.entries())
    .map(([device, sessions]) => ({ device, sessions }))
    .sort((a, b) => b.sessions - a.sessions);

  const browsers = Array.from(browserMap.entries())
    .map(([browser, sessions]) => ({ browser, sessions }))
    .sort((a, b) => b.sessions - a.sessions);

  const operatingSystems = Array.from(osMap.entries())
    .map(([os, sessions]) => ({ os, sessions }))
    .sort((a, b) => b.sessions - a.sessions);

  const referrerSources = Array.from(referrerMap.entries())
    .map(([referrer, sessions]) => ({ referrer, sessions }))
    .sort((a, b) => b.sessions - a.sessions);

  return {
    summary: {
      totalVisitors,
      totalSessions,
      totalPageViews,
      bounceRate: Math.round(bounceRate * 100) / 100,
      avgSessionDuration,
    },
    topCountries,
    deviceTypes,
    browsers,
    operatingSystems,
    referrerSources,
  };
}







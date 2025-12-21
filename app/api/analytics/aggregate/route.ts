import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { getAdminSession } from '@/lib/auth';

/**
 * Aggregate old visitor sessions into stats table
 * This endpoint should be called periodically (hourly) to:
 * 1. Aggregate sessions older than 1 hour
 * 2. Store aggregated data in visitor_stats
 * 3. Delete aggregated sessions (anonymization)
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const supabase = createServerClient();

    // Get sessions older than 1 hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { data: sessionsToAggregate, error: fetchError } = await supabase
      .from('visitor_sessions')
      .select('*')
      .lt('created_at', oneHourAgo);

    if (fetchError) {
      console.error('Failed to fetch sessions:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch sessions' },
        { status: 500 }
      );
    }

    if (!sessionsToAggregate || sessionsToAggregate.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No sessions to aggregate',
        aggregated: 0,
      });
    }

    // Group sessions by date, hour, and dimensions
    const aggregationMap = new Map<string, any>();

    for (const session of sessionsToAggregate) {
      const createdDate = new Date(session.created_at);
      const date = createdDate.toISOString().split('T')[0]; // YYYY-MM-DD
      const hour = createdDate.getUTCHours();

      // Create aggregation key
      const key = `${date}|${hour}|${session.country}|${session.device_type}|${session.browser}|${session.os}|${session.referrer_category}`;

      if (!aggregationMap.has(key)) {
        aggregationMap.set(key, {
          date,
          hour,
          country: session.country,
          device_type: session.device_type,
          browser: session.browser,
          os: session.os,
          referrer_category: session.referrer_category,
          total_visitors: new Set(),
          total_sessions: 0,
          total_pageviews: 0,
          bounced_sessions: 0,
          total_duration: 0,
        });
      }

      const aggData = aggregationMap.get(key);
      aggData.total_visitors.add(session.visitorid);
      aggData.total_sessions++;
      aggData.total_pageviews += session.page_views || 0;
      if (session.is_bounce) {
        aggData.bounced_sessions++;
      }
      aggData.total_duration += session.session_duration || 0;
    }

    // Convert aggregation map to database records
    const statsRecords = Array.from(aggregationMap.values()).map(data => ({
      date: data.date,
      hour: data.hour,
      country: data.country,
      device_type: data.device_type,
      browser: data.browser,
      os: data.os,
      referrer_category: data.referrer_category,
      total_visitors: data.total_visitors.size,
      total_sessions: data.total_sessions,
      total_pageviews: data.total_pageviews,
      bounced_sessions: data.bounced_sessions,
      avg_session_duration: data.total_sessions > 0 
        ? Math.floor(data.total_duration / data.total_sessions) 
        : 0,
    }));

    // Insert or update aggregated stats
    let insertedCount = 0;
    let updatedCount = 0;

    for (const record of statsRecords) {
      // Check if record exists
      const { data: existing } = await supabase
        .from('visitor_stats')
        .select('statid, total_visitors, total_sessions, total_pageviews, bounced_sessions, avg_session_duration')
        .eq('date', record.date)
        .eq('hour', record.hour)
        .eq('country', record.country)
        .eq('device_type', record.device_type)
        .eq('browser', record.browser)
        .eq('os', record.os)
        .eq('referrer_category', record.referrer_category)
        .single();

      if (existing) {
        // Update existing record
        const { error: updateError } = await supabase
          .from('visitor_stats')
          .update({
            total_visitors: existing.total_visitors + record.total_visitors,
            total_sessions: existing.total_sessions + record.total_sessions,
            total_pageviews: existing.total_pageviews + record.total_pageviews,
            bounced_sessions: existing.bounced_sessions + record.bounced_sessions,
            avg_session_duration: Math.floor(
              ((existing.avg_session_duration * existing.total_sessions) + 
               (record.avg_session_duration * record.total_sessions)) /
              (existing.total_sessions + record.total_sessions)
            ),
          })
          .eq('statid', existing.statid);

        if (!updateError) {
          updatedCount++;
        } else {
          console.error('Failed to update stat:', updateError);
        }
      } else {
        // Insert new record
        const { error: insertError } = await supabase
          .from('visitor_stats')
          .insert([record]);

        if (!insertError) {
          insertedCount++;
        } else {
          console.error('Failed to insert stat:', insertError);
        }
      }
    }

    // Delete aggregated sessions (anonymization step)
    const sessionIds = sessionsToAggregate.map(s => s.sessionid);
    const { error: deleteError } = await supabase
      .from('visitor_sessions')
      .delete()
      .in('sessionid', sessionIds);

    if (deleteError) {
      console.error('Failed to delete sessions:', deleteError);
      // Don't fail the request, data is already aggregated
    }

    return NextResponse.json({
      success: true,
      message: 'Sessions aggregated successfully',
      aggregated: sessionsToAggregate.length,
      inserted: insertedCount,
      updated: updatedCount,
      deleted: sessionIds.length,
    });
  } catch (error) {
    console.error('Aggregation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check aggregation status
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

    const supabase = createServerClient();

    // Count sessions pending aggregation (older than 1 hour)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    
    const { count: pendingCount } = await supabase
      .from('visitor_sessions')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', oneHourAgo);

    // Count recent sessions (within 1 hour)
    const { count: recentCount } = await supabase
      .from('visitor_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', oneHourAgo);

    // Count total aggregated stats
    const { count: statsCount } = await supabase
      .from('visitor_stats')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      success: true,
      pending_aggregation: pendingCount || 0,
      recent_sessions: recentCount || 0,
      total_stats_records: statsCount || 0,
    });
  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





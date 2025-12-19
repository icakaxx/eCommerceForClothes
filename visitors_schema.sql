-- Visitor Analytics Database Schema
-- This schema tracks visitor sessions and aggregates statistics for analytics

-- Sessions table (stores individual sessions, deleted after aggregation)
CREATE TABLE public.visitor_sessions (
  sessionid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visitorid TEXT NOT NULL,  -- Hashed identifier for privacy
  ip_address TEXT,
  country TEXT,
  device_type TEXT,  -- ios, android, macos, windows, linux, other
  browser TEXT,
  browser_version TEXT,
  os TEXT,
  os_version TEXT,
  referrer TEXT,
  referrer_category TEXT,  -- google, facebook, direct, other
  entry_page TEXT,
  exit_page TEXT,
  page_views INT DEFAULT 1,
  session_duration INT DEFAULT 0,  -- seconds
  is_bounce BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  consent_given BOOLEAN DEFAULT true,
  CONSTRAINT visitor_sessions_page_views_check CHECK (page_views >= 0),
  CONSTRAINT visitor_sessions_duration_check CHECK (session_duration >= 0)
) TABLESPACE pg_default;

-- Aggregated stats table (permanent, anonymized)
CREATE TABLE public.visitor_stats (
  statid UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  hour INT,  -- 0-23
  country TEXT,
  device_type TEXT,
  browser TEXT,
  os TEXT,
  referrer_category TEXT,
  total_visitors INT DEFAULT 0,
  total_sessions INT DEFAULT 0,
  total_pageviews INT DEFAULT 0,
  bounced_sessions INT DEFAULT 0,
  avg_session_duration INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT visitor_stats_hour_check CHECK (hour >= 0 AND hour <= 23),
  CONSTRAINT visitor_stats_totals_check CHECK (
    total_visitors >= 0 AND 
    total_sessions >= 0 AND 
    total_pageviews >= 0 AND 
    bounced_sessions >= 0 AND
    avg_session_duration >= 0
  ),
  UNIQUE(date, hour, country, device_type, browser, os, referrer_category)
) TABLESPACE pg_default;

-- Indexes for performance
CREATE INDEX idx_sessions_created ON public.visitor_sessions(created_at);
CREATE INDEX idx_sessions_country ON public.visitor_sessions(country);
CREATE INDEX idx_sessions_visitorid ON public.visitor_sessions(visitorid);
CREATE INDEX idx_sessions_last_activity ON public.visitor_sessions(last_activity);
CREATE INDEX idx_stats_date ON public.visitor_stats(date);
CREATE INDEX idx_stats_date_hour ON public.visitor_stats(date, hour);
CREATE INDEX idx_stats_country ON public.visitor_stats(country);

-- Trigger to update last_activity timestamp
CREATE OR REPLACE FUNCTION update_session_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_activity = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_session_last_activity
  BEFORE UPDATE ON public.visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_last_activity();

-- Row Level Security (RLS) Policies
ALTER TABLE public.visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.visitor_stats ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service_role to do everything
CREATE POLICY "Service role can do everything on visitor_sessions"
  ON public.visitor_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role can do everything on visitor_stats"
  ON public.visitor_stats
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to read their own sessions
CREATE POLICY "Users can read visitor_stats"
  ON public.visitor_stats
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow anon to insert sessions (for tracking)
CREATE POLICY "Anon can insert visitor_sessions"
  ON public.visitor_sessions
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE public.visitor_sessions IS 'Stores individual visitor sessions with detailed tracking data. Sessions are aggregated and deleted after 1 hour.';
COMMENT ON TABLE public.visitor_stats IS 'Aggregated visitor statistics by date, hour, and various dimensions. This data is anonymized and kept permanently.';
COMMENT ON COLUMN public.visitor_sessions.visitorid IS 'Hashed identifier generated from browser fingerprint (not personally identifiable)';
COMMENT ON COLUMN public.visitor_sessions.session_duration IS 'Duration of session in seconds';
COMMENT ON COLUMN public.visitor_sessions.is_bounce IS 'True if visitor only viewed one page';
COMMENT ON COLUMN public.visitor_stats.avg_session_duration IS 'Average session duration in seconds for this aggregation bucket';


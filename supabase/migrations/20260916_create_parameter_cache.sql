-- Migration: Create parameter_cache table for Luke LLM research results
CREATE TABLE IF NOT EXISTS parameter_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT UNIQUE NOT NULL,
  raw_query TEXT NOT NULL,
  analysis JSONB NOT NULL,
  locale TEXT NOT NULL DEFAULT 'cs',
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_hit_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days')
);

CREATE INDEX IF NOT EXISTS idx_parameter_cache_key ON parameter_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_parameter_cache_locale ON parameter_cache(cache_key, locale);
CREATE INDEX IF NOT EXISTS idx_parameter_cache_expires ON parameter_cache(expires_at);

ALTER TABLE parameter_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read parameter_cache"
  ON parameter_cache FOR SELECT TO anon, authenticated
  USING (expires_at > NOW());

CREATE POLICY "Service role write parameter_cache"
  ON parameter_cache FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Unschedule if the job already exists to avoid duplicate scheduling
SELECT cron.unschedule('daily-google-sheets-sync')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'daily-google-sheets-sync'
);

-- Schedule the daily Google Sheets sync cron job
-- Runs daily at 00:00 UTC (05:30 AM IST)
SELECT cron.schedule(
  'daily-google-sheets-sync',
  '0 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://bkafweywaswykowzrhmx.supabase.co/functions/v1/sync-sessions-to-sheet',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(
        (SELECT secret FROM vault.decrypted_secrets WHERE name = 'service_role_key' LIMIT 1),
        'fallback-placeholder'
      )
    ),
    body := '{}'::jsonb
  );
  $$
);

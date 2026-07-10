CREATE OR REPLACE FUNCTION public.trigger_google_sheets_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_id bigint;
BEGIN
  -- We trigger the edge function using the exact same code as the cron job
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
  ) INTO request_id;

  RETURN jsonb_build_object(
    'success', true, 
    'message', 'Sync triggered. Your Google Sheet will update in a few moments.',
    'request_id', request_id
  );
END;
$$;

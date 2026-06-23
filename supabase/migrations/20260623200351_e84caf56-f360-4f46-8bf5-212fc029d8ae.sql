
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge-deleted-accounts-daily') THEN
    PERFORM cron.unschedule('purge-deleted-accounts-daily');
  END IF;
END
$$;

SELECT cron.schedule(
  'purge-deleted-accounts-daily',
  '15 0 * * *',
  $$
  SELECT net.http_post(
    url := 'https://qvdrwfltbqhlwkqndpdp.supabase.co/functions/v1/purge-deleted-accounts',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

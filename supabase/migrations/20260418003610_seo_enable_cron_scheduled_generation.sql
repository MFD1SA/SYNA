-- Enable cron + async HTTP so we can schedule the generator daily
create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

-- Schedule: every day at 03:15 UTC (06:15 AST) — off-peak
-- Invokes the seo-generate edge function with a scheduled trigger_type
-- so runs can be filtered in the UI.
select cron.schedule(
  'seo-generate-daily',
  '15 3 * * *',
  $$
  select net.http_post(
    url := 'https://nqbobxtlwzvtzxqcdfdo.supabase.co/functions/v1/seo-generate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.supabase_service_role_key', true)
    ),
    body := jsonb_build_object('triggerType', 'scheduled')
  );
  $$
);

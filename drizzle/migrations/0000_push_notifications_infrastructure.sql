-- Push notification infrastructure for the Wooffy iOS app

-- pg_net lets database triggers fire HTTP requests without blocking
create extension if not exists pg_net;

-- Device tokens registered by the iOS app
create table public.push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  token text unique not null,
  platform text not null default 'ios',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;

ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own push tokens"
ON public.push_tokens FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Private key/value store used to authenticate trigger -> edge function calls.
-- No policies: locked to service_role and SECURITY DEFINER code only.
create table public.app_secrets (
  key text primary key,
  value text not null
);

GRANT ALL ON public.app_secrets TO service_role;

ALTER TABLE public.app_secrets ENABLE ROW LEVEL SECURITY;

insert into public.app_secrets (key, value)
values ('push_webhook_secret', encode(gen_random_bytes(32), 'hex'))
on conflict (key) do nothing;

-- Track which notifications have already been pushed
ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS push_sent_at timestamptz;

GRANT UPDATE (push_sent_at) ON public.notifications TO service_role;

-- When a new notification is created, fire an HTTP request to the send-push
-- edge function so Apple devices receive it as a push notification.
CREATE OR REPLACE FUNCTION public.push_notification_to_device()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  secret_value text;
begin
  if NEW.push_sent_at is not null then
    return NEW;
  end if;

  select value into secret_value
  from public.app_secrets
  where key = 'push_webhook_secret';

  if secret_value is null then
    return NEW;
  end if;

  perform net.http_post(
    url := 'https://qvdrwfltbqhlwkqndpdp.supabase.co/functions/v1/send-push',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Internal-Secret', secret_value
    ),
    body := jsonb_build_object('notification_id', NEW.id)
  );

  return NEW;
end;
$$;

DROP TRIGGER IF EXISTS on_notification_created ON public.notifications;
CREATE TRIGGER on_notification_created
AFTER INSERT ON public.notifications
FOR EACH ROW
EXECUTE FUNCTION public.push_notification_to_device();
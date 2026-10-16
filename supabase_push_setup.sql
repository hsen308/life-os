-- ========================================================
-- LifeOS: Web Push Notifications Database Schema
-- ========================================================

-- 1. Table for device push subscriptions
create table if not exists public.push_subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);

-- 2. Table for scheduled notifications queue
create table if not exists public.scheduled_notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  type text not null,
  title text not null,
  body text not null,
  url text default '/',
  actions jsonb default '[]'::jsonb,
  send_at timestamptz not null,
  timezone text not null default 'Asia/Beirut',
  sent_at timestamptz,
  cancelled_at timestamptz,
  dedupe_key text,
  created_at timestamptz default now()
);

-- 3. Unique index for deduplication per user (prevents duplicate alarms)
create unique index if not exists idx_scheduled_notifications_user_dedupe
  on public.scheduled_notifications (user_id, dedupe_key)
  where dedupe_key is not null;

-- 4. Index for high-speed edge function queue processing
create index if not exists idx_scheduled_notifications_send_queue
  on public.scheduled_notifications (send_at)
  where sent_at is null and cancelled_at is null;

-- 5. Enable Row Level Security (RLS)
alter table public.push_subscriptions enable row level security;
alter table public.scheduled_notifications enable row level security;

-- 6. RLS Policies for push_subscriptions (Users can only access their own devices)
drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- 7. RLS Policies for scheduled_notifications (Users can only schedule & view their own notifications)
drop policy if exists "Users can read own scheduled notifications" on public.scheduled_notifications;
create policy "Users can read own scheduled notifications"
  on public.scheduled_notifications for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own scheduled notifications" on public.scheduled_notifications;
create policy "Users can insert own scheduled notifications"
  on public.scheduled_notifications for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own scheduled notifications" on public.scheduled_notifications;
create policy "Users can update own scheduled notifications"
  on public.scheduled_notifications for update
  using (auth.uid() = user_id);

drop policy if exists "Users can delete own scheduled notifications" on public.scheduled_notifications;
create policy "Users can delete own scheduled notifications"
  on public.scheduled_notifications for delete
  using (auth.uid() = user_id);

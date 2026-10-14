-- ========================================================
-- LifeOS: Supabase Database Setup & Realtime Schema
-- ========================================================
-- Instructions:
-- 1. Go to your Supabase project dashboard (https://supabase.com/dashboard)
-- 2. Open the "SQL Editor" tab from the left sidebar
-- 3. Click "New Query", paste this entire script, and click "Run" (Ctrl+Enter)

-- 1. Create table for user synchronization
create table if not exists public.lifeos_userdata (
  user_id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);

-- 2. Enable Row Level Security (RLS) so each user can ONLY see & edit their own data
alter table public.lifeos_userdata enable row level security;

-- 3. Policy: Users can select only their own data
drop policy if exists "Users can read own lifeos data" on public.lifeos_userdata;
create policy "Users can read own lifeos data"
  on public.lifeos_userdata
  for select
  using (auth.uid() = user_id);

-- 4. Policy: Users can insert their own data
drop policy if exists "Users can insert own lifeos data" on public.lifeos_userdata;
create policy "Users can insert own lifeos data"
  on public.lifeos_userdata
  for insert
  with check (auth.uid() = user_id);

-- 5. Policy: Users can update only their own data
drop policy if exists "Users can update own lifeos data" on public.lifeos_userdata;
create policy "Users can update own lifeos data"
  on public.lifeos_userdata
  for update
  using (auth.uid() = user_id);

-- 6. Enable Realtime on the table for live phone <-> laptop sync
alter publication supabase_realtime add table public.lifeos_userdata;

-- Supabase Auth setup: Sync auth.users -> public.profiles and enable RLS
-- Run this in your Supabase project's SQL editor.

-- 1) Enable Row-Level Security for profiles
alter table if exists public.profiles enable row level security;

-- 2) Function to create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, created_at)
  values (
    new.id::text,
    coalesce(new.raw_user_meta->>'username', split_part(new.email, '@', 1)),
    new.email,
    now()
  ) on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

-- 3) Trigger on auth.users to call the function after insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 4) Row-Level Security Policies for profiles
-- Allow anyone (authenticated) to read basic profile information
create policy if not exists "profiles_select_authenticated" on public.profiles
  for select using (auth.role() = 'authenticated' or true);

-- Allow users to insert their own profile row (during signup)
create policy if not exists "profiles_insert_own" on public.profiles
  for insert using (auth.uid() = id);

-- Allow users to update only their own profile
create policy if not exists "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Note: Review the select policy above. If you want public read access, leaving it as 'true' is fine.
-- For tighter privacy, change the select policy to: using (auth.role() = 'authenticated')

-- 5) Optional: If you rely on anon client to read testimonials/profiles, make sure the anon key
-- has appropriate permissions in Supabase, or adjust policies to allow the 'anon' role to select.

-- Create profiles table for Florxup
-- Run this in your Supabase project's SQL editor.

create table if not exists profiles (
  id uuid primary key,
  username text not null,
  email text,
  phone_number text,
  avatar_url text,
  status_bio text,
  public_key text,
  is_online boolean default false,
  last_seen timestamptz,
  created_at timestamptz default now()
);

-- Optional: create an index for username lookups
create unique index if not exists idx_profiles_username on profiles (lower(username));

-- Grant select/insert/update to authenticated/anon roles as appropriate
grant select, insert, update on profiles to authenticated, anon;

-- Notes:
-- 1) In Supabase Auth > Settings, ensure "Enable email signups" is turned on if you want users to register via email/password.
-- 2) To send confirmation emails, configure SMTP in Supabase > Auth > Settings > Email.
-- 3) If you want stricter row-level security (RLS), create policies allowing users to manage only their own profile.

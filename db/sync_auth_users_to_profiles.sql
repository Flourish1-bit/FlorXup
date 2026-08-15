-- Sync all existing auth.users into public.profiles
-- Run this in Supabase SQL editor so every Supabase-authenticated user has a searchable profile row.

create or replace function public.sync_all_auth_users_to_profiles()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, email, created_at)
  select
    au.id::text,
    coalesce(au.raw_user_meta->>'username', split_part(au.email, '@', 1)),
    au.email,
    coalesce(au.created_at, now())
  from auth.users au
  left join public.profiles p on p.id = au.id::text
  where p.id is null
  on conflict (id) do update
    set username = excluded.username,
        email = excluded.email,
        created_at = coalesce(profiles.created_at, excluded.created_at);
end;
$$;

select public.sync_all_auth_users_to_profiles();

-- Florxup database schema for the connected dashboard and encrypted chat.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  email text not null unique,
  role text not null default 'USER' check (role in ('ADMIN', 'USER')),
  avatar_url text,
  status_bio text default '',
  public_key text not null default '',
  is_online boolean not null default false,
  last_seen timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  ciphertext text not null,
  iv text not null,
  is_delivered boolean not null default false,
  is_read boolean not null default false,
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.global_dev_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles(id) on delete cascade,
  content text not null,
  message_type text not null default 'text',
  tags jsonb not null default '[]'::jsonb,
  reactions jsonb not null default '{}'::jsonb,
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles(id) on delete cascade,
  target_type text not null check (target_type in ('group', 'message', 'user')),
  target_id text not null,
  group_id text,
  reason text not null,
  details text,
  offending_content text,
  status text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved')),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.private_messages enable row level security;
alter table public.global_dev_messages enable row level security;
alter table public.reports enable row level security;

create table if not exists public.contacts (
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, contact_id),
  check (user_id <> contact_id)
);

alter table public.contacts enable row level security;

create policy "users read their own contacts" on public.contacts for select to authenticated using (auth.uid() = user_id);
create policy "users manage their own contacts" on public.contacts for insert to authenticated with check (auth.uid() = user_id);
create policy "users remove their own contacts" on public.contacts for delete to authenticated using (auth.uid() = user_id);

create policy "users see themselves and saved contacts" on public.profiles for select to authenticated
using (
  auth.uid() = id or exists (
    select 1 from public.contacts
    where contacts.user_id = auth.uid() and contacts.contact_id = profiles.id
  )
);

create or replace function public.find_profile_by_identity(search_term text, current_user_id uuid)
returns setof public.profiles
language sql
security definer
set search_path = public
as $$
  select * from public.profiles
  where id <> current_user_id
    and (lower(username) = lower(search_term) or lower(email) = lower(search_term))
  limit 1;
$$;

revoke all on function public.find_profile_by_identity(text, uuid) from public;
grant execute on function public.find_profile_by_identity(text, uuid) to authenticated;
create policy "users update their own profile" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "users create their profile" on public.profiles for insert to authenticated with check (auth.uid() = id);

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$ select exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'); $$;

create policy "admins manage profiles" on public.profiles for all to authenticated using (public.is_admin()) with check (public.is_admin());

create or replace function public.enforce_single_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.role := case
    when lower(new.email) = 'flourishokafor13@gmail.com' and new.username = 'Admin_Flourish_Okafor' then 'ADMIN'
    else 'USER'
  end;
  return new;
end;
$$;

drop trigger if exists enforce_single_admin on public.profiles;
create trigger enforce_single_admin before insert or update of email, username, role on public.profiles
for each row execute function public.enforce_single_admin();

create policy "participants read private messages" on public.private_messages for select to authenticated using (auth.uid() = sender_id or auth.uid() = recipient_id);
create policy "users send private messages" on public.private_messages for insert to authenticated with check (auth.uid() = sender_id);
create policy "recipients update delivery state" on public.private_messages for update to authenticated using (auth.uid() = recipient_id);

create policy "signed-in users read global messages" on public.global_dev_messages for select to authenticated using (true);
create policy "signed-in users post global messages" on public.global_dev_messages for insert to authenticated with check (auth.uid() = sender_id);

create policy "users read own reports" on public.reports for select to authenticated using (auth.uid() = reporter_id or public.is_admin());
create policy "users submit reports" on public.reports for insert to authenticated with check (auth.uid() = reporter_id);
create policy "admins manage reports" on public.reports for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- Run this once after creating the approved account to enforce the single-admin rule.
update public.profiles set role = case when lower(email) = 'flourishokafor13@gmail.com' and username = 'Admin_Flourish_Okafor' then 'ADMIN' else 'USER' end;

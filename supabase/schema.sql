-- COLOSO LEAGUE · Supabase initial schema
-- Run this file in Supabase Dashboard > SQL Editor.
-- Safe defaults: no client-side service-role key; all public tables use RLS.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique,
  role text not null default 'participant' check (role in ('participant','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  crest_url text,
  budget numeric(14,2) not null default 0 check (budget >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.club_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  club_id uuid not null references public.clubs(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  approved_at timestamptz,
  unique(user_id, club_id)
);

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  name text not null,
  position text,
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.market_posts (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  player_id uuid not null references public.players(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  category text not null check (category in ('sale','loan','exchange')),
  price numeric(14,2) check (price is null or price >= 0),
  details text,
  status text not null default 'published' check (status in ('published','withdrawn')),
  created_at timestamptz not null default now()
);

create table if not exists public.market_requests (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.market_posts(id) on delete cascade,
  requester_id uuid not null references public.profiles(id),
  requester_club_id uuid not null references public.clubs(id),
  message text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  image_url text,
  published boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean language sql stable security definer
set search_path = '' as $$
  select exists (
    select 1 from public.profiles p
    where p.id = (select auth.uid()) and p.role = 'admin'
  );
$$;

create or replace function public.my_approved_club_ids()
returns setof uuid language sql stable security definer
set search_path = '' as $$
  select cm.club_id from public.club_members cm
  where cm.user_id = (select auth.uid()) and cm.status = 'approved';
$$;

-- New accounts are always ordinary participants. Admin rights are granted manually.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer
set search_path = '' as $$
begin
  insert into public.profiles(id, username, role)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data->>'username',''), split_part(new.email,'@',1)),
    'participant'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.clubs enable row level security;
alter table public.club_members enable row level security;
alter table public.players enable row level security;
alter table public.market_posts enable row level security;
alter table public.market_requests enable row level security;
alter table public.news enable row level security;

-- Remove broad default API privileges, then grant only what the app needs.
revoke all on public.profiles, public.clubs, public.club_members, public.players,
  public.market_posts, public.market_requests, public.news from anon, authenticated;

grant select on public.clubs, public.players, public.market_posts, public.news to anon, authenticated;
grant select, update on public.profiles to authenticated;
grant select on public.club_members to authenticated;
grant insert, update, delete on public.players to authenticated;
grant insert, update, delete on public.market_posts to authenticated;
grant select, insert, update on public.market_requests to authenticated;
grant insert, update, delete on public.news to authenticated;
grant insert, update, delete on public.clubs to authenticated;
grant insert, update, delete on public.club_members to authenticated;

-- Profiles: user reads self; admin reads all. No client update of role/username.
create policy "profiles_read_self_or_admin" on public.profiles
for select to authenticated using (id = (select auth.uid()) or public.is_admin());
create policy "profiles_update_self" on public.profiles
for update to authenticated using (id = (select auth.uid()))
with check (id = (select auth.uid()) and role = 'participant');

-- Clubs: public read, admin writes.
create policy "clubs_public_read" on public.clubs for select to anon, authenticated using (true);
create policy "clubs_admin_all" on public.clubs for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- Membership: user can request membership; only admin can approve/change membership.
create policy "membership_read_own_or_admin" on public.club_members for select to authenticated
using (user_id = (select auth.uid()) or public.is_admin());
create policy "membership_request_own" on public.club_members for insert to authenticated
with check (user_id = (select auth.uid()) and status = 'pending');
create policy "membership_admin_manage" on public.club_members for update to authenticated
using (public.is_admin()) with check (public.is_admin());
create policy "membership_admin_delete" on public.club_members for delete to authenticated
using (public.is_admin());

-- Players: public roster read; approved club members manage only their own club.
create policy "players_public_read" on public.players for select to anon, authenticated using (true);
create policy "players_club_insert" on public.players for insert to authenticated
with check (club_id in (select public.my_approved_club_ids()) or public.is_admin());
create policy "players_club_update" on public.players for update to authenticated
using (club_id in (select public.my_approved_club_ids()) or public.is_admin())
with check (club_id in (select public.my_approved_club_ids()) or public.is_admin());
create policy "players_club_delete" on public.players for delete to authenticated
using (club_id in (select public.my_approved_club_ids()) or public.is_admin());

-- Market posts: public read; approved club members post/manage their own club's entries.
create policy "market_posts_public_read" on public.market_posts for select to anon, authenticated using (status = 'published' or created_by = (select auth.uid()) or public.is_admin());
create policy "market_posts_insert_own_club" on public.market_posts for insert to authenticated
with check (
  created_by = (select auth.uid()) and
  club_id in (select public.my_approved_club_ids()) and
  exists (select 1 from public.players p where p.id = player_id and p.club_id = club_id)
);
create policy "market_posts_update_own_or_admin" on public.market_posts for update to authenticated
using (created_by = (select auth.uid()) or public.is_admin())
with check (
  public.is_admin() or (
    created_by = (select auth.uid()) and
    club_id in (select public.my_approved_club_ids()) and
    exists (select 1 from public.players p where p.id = player_id and p.club_id = club_id)
  )
);
create policy "market_posts_delete_own_or_admin" on public.market_posts for delete to authenticated
using (created_by = (select auth.uid()) or public.is_admin());

-- Negotiation requests: requester can create/read own; admin can review.
create policy "market_requests_read_own_or_admin" on public.market_requests for select to authenticated
using (requester_id = (select auth.uid()) or public.is_admin());
create policy "market_requests_insert_own_club" on public.market_requests for insert to authenticated
with check (
  requester_id = (select auth.uid()) and
  requester_club_id in (select public.my_approved_club_ids())
);
create policy "market_requests_admin_review" on public.market_requests for update to authenticated
using (public.is_admin()) with check (public.is_admin());

-- News: public sees published; admin manages all.
create policy "news_public_read_published" on public.news for select to anon, authenticated
using (published = true or public.is_admin());
create policy "news_admin_manage" on public.news for all to authenticated
using (public.is_admin()) with check (public.is_admin());

-- IMPORTANT: Set the first administrator manually after registering their account:
-- update public.profiles set role = 'admin' where username = 'YOUR_USERNAME';
-- Never expose a Supabase secret/service_role key in GitHub Pages or browser code.

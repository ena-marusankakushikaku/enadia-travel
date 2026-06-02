create extension if not exists "pgcrypto";

do $$
begin
  create type public.trip_role as enum ('owner', 'editor', 'viewer');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.ai_processing_status as enum ('pending', 'processing', 'completed', 'failed', 'skipped');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.conquest_entry_source as enum ('manual', 'photo_suggestion', 'ai_auto');
exception when duplicate_object then null;
end $$;

do $$
begin
  create type public.tourism_event_type as enum (
    'trip_created',
    'photo_uploaded',
    'place_visit_detected',
    'theme_entry_created',
    'prefecture_conquered',
    'ai_analysis_completed',
    'trip_member_joined',
    'travel_log_viewed',
    'photo_commented',
    'conquest_project_created',
    'route_completed'
  );
exception when duplicate_object then null;
end $$;

create or replace function public.safe_uuid(val text)
returns uuid
language plpgsql
immutable
as $$
begin
  return val::uuid;
exception when invalid_text_representation then
  return null;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default 'Traveler',
  avatar_url text,
  language text default 'ja',
  country_code text default 'JP',
  email text,
  stripe_customer_id text,
  plan text not null default 'free',
  points integer not null default 0,
  last_login_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trips (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  area text,
  starts_at timestamptz,
  ends_at timestamptz,
  owner_id uuid not null references auth.users(id) on delete restrict,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.trip_members (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.trip_role not null default 'viewer',
  joined_at timestamptz not null default now(),
  unique (trip_id, user_id)
);

create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  uploaded_by uuid not null references auth.users(id) on delete restrict,
  storage_path text not null,
  thumbnail_path text,
  lat double precision,
  lng double precision,
  place_name text,
  prefecture_id integer,
  confidence double precision,
  ai_tags text[] not null default '{}',
  caption text,
  captured_at timestamptz,
  suggested_themes jsonb not null default '[]'::jsonb,
  ai_processing_status public.ai_processing_status not null default 'pending',
  theme_entry_created boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.photos
  add column if not exists captured_at timestamptz,
  add column if not exists suggested_themes jsonb not null default '[]'::jsonb,
  add column if not exists ai_processing_status public.ai_processing_status not null default 'pending',
  add column if not exists theme_entry_created boolean not null default false;

create table if not exists public.photo_reactions (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction_type text not null check (reaction_type in ('like', 'heart', 'wow', 'seen')),
  created_at timestamptz not null default now(),
  unique (photo_id, user_id, reaction_type)
);

create table if not exists public.photo_comments (
  id uuid primary key default gen_random_uuid(),
  photo_id uuid not null references public.photos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conquest_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  emoji text not null default '🎯',
  color text not null default '#0f8b8d',
  description text,
  category text not null default 'custom',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.conquest_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.conquest_projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  trip_id uuid references public.trips(id) on delete set null,
  photo_id uuid references public.photos(id) on delete set null,
  prefecture_id integer not null,
  title text not null,
  memo text,
  rating integer check (rating is null or rating between 1 and 5),
  visited_at timestamptz not null default now(),
  place_name text,
  lat double precision,
  lng double precision,
  source public.conquest_entry_source not null default 'manual',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  consent_type text not null,
  granted boolean not null,
  version text not null,
  source text not null default 'app',
  created_at timestamptz not null default now()
);

create table if not exists public.tourism_events (
  id uuid primary key default gen_random_uuid(),
  event_type public.tourism_event_type not null,
  user_id uuid not null,
  trip_id uuid,
  photo_id uuid,
  conquest_project_id uuid,
  conquest_entry_id uuid,
  prefecture_id integer,
  lat double precision,
  lng double precision,
  place_name text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = true)
as
select
  id,
  display_name,
  avatar_url,
  language,
  country_code
from public.profiles;

drop view if exists public.latest_user_consents;
create view public.latest_user_consents
with (security_invoker = true)
as
select distinct on (user_id, consent_type)
  user_id,
  consent_type,
  granted,
  version,
  source,
  created_at
from public.user_consents
order by user_id, consent_type, created_at desc;

create or replace function public.is_trip_member(p_trip_id uuid, p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = p_trip_id
      and tm.user_id = p_user_id
  );
$$;

create or replace function public.has_trip_role(p_trip_id uuid, p_user_id uuid, p_roles public.trip_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members tm
    where tm.trip_id = p_trip_id
      and tm.user_id = p_user_id
      and tm.role = any(p_roles)
  );
$$;

create or replace function public.is_admin(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.plan = 'admin'
  );
$$;

create or replace function public.prevent_last_owner_loss()
returns trigger
language plpgsql
as $$
declare
  remaining_owners integer;
begin
  if tg_op = 'DELETE' and old.role = 'owner' then
    select count(*) into remaining_owners
    from public.trip_members
    where trip_id = old.trip_id
      and role = 'owner'
      and id <> old.id;

    if remaining_owners = 0 then
      raise exception 'cannot remove the last owner of a trip'
        using errcode = '23001';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.role = 'owner' and new.role <> 'owner' then
    select count(*) into remaining_owners
    from public.trip_members
    where trip_id = old.trip_id
      and role = 'owner'
      and id <> old.id;

    if remaining_owners = 0 then
      raise exception 'cannot demote the last owner of a trip'
        using errcode = '23001';
    end if;
  end if;

  return coalesce(new, old);
end;
$$;

drop trigger if exists trg_prevent_last_owner_loss on public.trip_members;
create trigger trg_prevent_last_owner_loss
before update or delete on public.trip_members
for each row execute function public.prevent_last_owner_loss();

create or replace function public.create_trip_with_owner(
  p_title text,
  p_area text default null,
  p_starts_at timestamptz default null,
  p_ends_at timestamptz default null,
  p_description text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip_id uuid;
begin
  insert into public.trips(title, area, starts_at, ends_at, owner_id, description)
  values (p_title, p_area, p_starts_at, p_ends_at, auth.uid(), p_description)
  returning id into v_trip_id;

  insert into public.trip_members(trip_id, user_id, role)
  values (v_trip_id, auth.uid(), 'owner');

  return v_trip_id;
end;
$$;

create index if not exists idx_photos_trip_id on public.photos(trip_id);
create index if not exists idx_photos_suggested_themes on public.photos using gin (suggested_themes);
create index if not exists idx_photos_ai_status on public.photos(ai_processing_status)
where ai_processing_status != 'completed';
create index if not exists idx_conquest_entries_project_id on public.conquest_entries(project_id);
create index if not exists idx_conquest_entries_user_prefecture on public.conquest_entries(user_id, prefecture_id);

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.photos enable row level security;
alter table public.photo_reactions enable row level security;
alter table public.photo_comments enable row level security;
alter table public.conquest_projects enable row level security;
alter table public.conquest_entries enable row level security;
alter table public.user_consents enable row level security;
alter table public.tourism_events enable row level security;

drop policy if exists "profiles own select" on public.profiles;
create policy "profiles own select" on public.profiles
for select using (id = auth.uid());

drop policy if exists "trips member select" on public.trips;
create policy "trips member select" on public.trips
for select using (public.is_trip_member(id, auth.uid()));

drop policy if exists "trips owner update" on public.trips;
create policy "trips owner update" on public.trips
for update using (public.has_trip_role(id, auth.uid(), array['owner']::public.trip_role[]));

drop policy if exists "trip members member select" on public.trip_members;
create policy "trip members member select" on public.trip_members
for select using (public.is_trip_member(trip_id, auth.uid()));

drop policy if exists "trip members owner manage" on public.trip_members;
create policy "trip members owner manage" on public.trip_members
for all using (public.has_trip_role(trip_id, auth.uid(), array['owner']::public.trip_role[]))
with check (public.has_trip_role(trip_id, auth.uid(), array['owner']::public.trip_role[]));

drop policy if exists "photos member select" on public.photos;
create policy "photos member select" on public.photos
for select using (public.is_trip_member(trip_id, auth.uid()));

drop policy if exists "photos editor insert" on public.photos;
create policy "photos editor insert" on public.photos
for insert with check (
  uploaded_by = auth.uid()
  and public.has_trip_role(trip_id, auth.uid(), array['owner','editor']::public.trip_role[])
);

drop policy if exists "photos uploader or editor update" on public.photos;
create policy "photos uploader or editor update" on public.photos
for update using (
  uploaded_by = auth.uid()
  or public.has_trip_role(trip_id, auth.uid(), array['owner','editor']::public.trip_role[])
);

drop policy if exists "photo reactions member select" on public.photo_reactions;
create policy "photo reactions member select" on public.photo_reactions
for select using (
  exists (
    select 1 from public.photos p
    where p.id = photo_id
      and public.is_trip_member(p.trip_id, auth.uid())
  )
);

drop policy if exists "photo reactions member insert" on public.photo_reactions;
create policy "photo reactions member insert" on public.photo_reactions
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.photos p
    where p.id = photo_id
      and public.is_trip_member(p.trip_id, auth.uid())
  )
);

drop policy if exists "photo reactions own delete" on public.photo_reactions;
create policy "photo reactions own delete" on public.photo_reactions
for delete using (user_id = auth.uid());

drop policy if exists "photo comments member select" on public.photo_comments;
create policy "photo comments member select" on public.photo_comments
for select using (
  exists (
    select 1 from public.photos p
    where p.id = photo_id
      and public.is_trip_member(p.trip_id, auth.uid())
  )
);

drop policy if exists "photo comments member insert" on public.photo_comments;
create policy "photo comments member insert" on public.photo_comments
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.photos p
    where p.id = photo_id
      and public.is_trip_member(p.trip_id, auth.uid())
  )
);

drop policy if exists "photo comments own update" on public.photo_comments;
create policy "photo comments own update" on public.photo_comments
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "photo comments own or trip owner delete" on public.photo_comments;
create policy "photo comments own or trip owner delete" on public.photo_comments
for delete using (
  user_id = auth.uid()
  or exists (
    select 1 from public.photos p
    where p.id = photo_id
      and public.has_trip_role(p.trip_id, auth.uid(), array['owner']::public.trip_role[])
  )
);

drop policy if exists "conquest projects owner crud" on public.conquest_projects;
create policy "conquest projects owner crud" on public.conquest_projects
for all using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "conquest entries owner project select" on public.conquest_entries;
create policy "conquest entries owner project select" on public.conquest_entries
for select using (
  user_id = auth.uid()
  and exists (
    select 1 from public.conquest_projects cp
    where cp.id = project_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "conquest entries owner project insert" on public.conquest_entries;
create policy "conquest entries owner project insert" on public.conquest_entries
for insert with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.conquest_projects cp
    where cp.id = project_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "conquest entries owner project update" on public.conquest_entries;
create policy "conquest entries owner project update" on public.conquest_entries
for update using (
  user_id = auth.uid()
  and exists (
    select 1 from public.conquest_projects cp
    where cp.id = project_id
      and cp.user_id = auth.uid()
  )
)
with check (
  user_id = auth.uid()
  and exists (
    select 1 from public.conquest_projects cp
    where cp.id = project_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "conquest entries owner project delete" on public.conquest_entries;
create policy "conquest entries owner project delete" on public.conquest_entries
for delete using (
  user_id = auth.uid()
  and exists (
    select 1 from public.conquest_projects cp
    where cp.id = project_id
      and cp.user_id = auth.uid()
  )
);

drop policy if exists "user consents own select" on public.user_consents;
create policy "user consents own select" on public.user_consents
for select using (user_id = auth.uid());

drop policy if exists "user consents own insert" on public.user_consents;
create policy "user consents own insert" on public.user_consents
for insert with check (user_id = auth.uid());

drop policy if exists "tourism events admin select" on public.tourism_events;
create policy "tourism events admin select" on public.tourism_events
for select using (public.is_admin(auth.uid()));

-- No client INSERT policy for tourism_events. Server routes must use service_role.

insert into storage.buckets (id, name, public)
values ('trip-photos', 'trip-photos', false)
on conflict (id) do nothing;

drop policy if exists "trip photo storage member read" on storage.objects;
create policy "trip photo storage member read" on storage.objects
for select using (
  bucket_id = 'trip-photos'
  and exists (
    select 1
    from public.photos p
    where p.storage_path = name
      and public.is_trip_member(p.trip_id, auth.uid())
  )
);

drop policy if exists "trip photo storage editor insert" on storage.objects;
create policy "trip photo storage editor insert" on storage.objects
for insert with check (
  bucket_id = 'trip-photos'
  and public.has_trip_role(
    public.safe_uuid(split_part(name, '/', 1)),
    auth.uid(),
    array['owner','editor']::public.trip_role[]
  )
);

drop table if exists public.sake_logs_archive;
alter table if exists public.sake_logs rename to sake_logs_archive;

-- Formalizes the trip_invites table and redeem_trip_invite() function that were
-- added directly via the Supabase dashboard, so other environments (and future
-- migrations) stay in sync with production.

create table if not exists public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(16), 'hex'),
  created_by uuid not null references auth.users(id) on delete cascade,
  role public.trip_role not null default 'editor',
  is_active boolean not null default true,
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.trip_invites enable row level security;

-- No public/anon select policy: the invite-redemption flow only ever calls
-- redeem_trip_invite() (security definer, below), so a client-side select
-- policy is not needed. RLS "using" clauses can't be scoped to "only when the
-- caller filters by token" - a permissive select policy here would let anyone
-- list every trip's invite tokens, not just the one they already know.
drop policy if exists "trip invites owner manage" on public.trip_invites;
create policy "trip invites owner manage" on public.trip_invites
for all using (public.has_trip_role(trip_id, auth.uid(), array['owner']::public.trip_role[]))
with check (public.has_trip_role(trip_id, auth.uid(), array['owner']::public.trip_role[]));

create or replace function public.redeem_trip_invite(p_token text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.trip_invites%rowtype;
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'authentication required';
  end if;

  select * into v_invite
  from public.trip_invites
  where token = p_token
    and is_active
    and (expires_at is null or expires_at > now())
  limit 1;

  if v_invite.id is null then
    return null;
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_invite.trip_id, v_uid, coalesce(v_invite.role, 'editor'))
  on conflict (trip_id, user_id) do nothing;

  return v_invite.trip_id;
end;
$$;

-- Supabase anonymous sign-ins authenticate as role "authenticated" (with an
-- is_anonymous claim), not "anon", so granting to authenticated is sufficient.
grant execute on function public.redeem_trip_invite(text) to authenticated;

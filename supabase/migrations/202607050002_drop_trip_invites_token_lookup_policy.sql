-- The "trip invites token lookup" policy allowed select using(true), which
-- exposes every trip's invite tokens to any authenticated user, not just the
-- one they already have the token for (RLS can't scope a select policy to
-- "only when the caller filters by token"). The redeem_trip_invite() RPC is
-- SECURITY DEFINER and doesn't need this policy; owner access is already
-- covered by "trip invites owner manage".
drop policy if exists "trip invites token lookup" on public.trip_invites;

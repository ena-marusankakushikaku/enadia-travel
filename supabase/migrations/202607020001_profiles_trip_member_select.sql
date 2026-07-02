-- Allow trip co-members to see each other's profile row (via the public_profiles view,
-- which only exposes display_name/avatar_url/language/country_code). Previously "profiles
-- own select" restricted every row to its owner, so public_profiles returned nothing for
-- anyone but yourself even though the view exists specifically to show co-travelers.
drop policy if exists "profiles trip co-member select" on public.profiles;
create policy "profiles trip co-member select" on public.profiles
for select using (
  exists (
    select 1
    from public.trip_members tm1
    join public.trip_members tm2 on tm1.trip_id = tm2.trip_id
    where tm1.user_id = auth.uid()
      and tm2.user_id = profiles.id
  )
);

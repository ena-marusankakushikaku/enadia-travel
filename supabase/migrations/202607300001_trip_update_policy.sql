-- 旅の情報（タイトル・期間・エリア・メモ）を、オーナーと参加者が編集できるようにする。
--
-- 旅程が延びた・縮んだときに開始日と終了日を直せるようにするための変更。
-- 「何日目」の表示は開始日から計算しているので、ここが直せないと写真の見出しもずれたままになる。
--
-- 注意：trips のポリシーから trip_members を直接参照すると、
-- trip_members 側のポリシーが trips を参照している場合に無限再帰になる。
-- それを避けるため security definer の関数にまとめている。

create or replace function public.is_trip_editor(p_trip_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.trip_members m
    where m.trip_id = p_trip_id
      and m.user_id = auth.uid()
      and m.role in ('owner', 'editor')
  );
$$;

grant execute on function public.is_trip_editor(uuid) to authenticated;

-- 何度実行しても同じ状態になるように、いったん消してから作る
drop policy if exists "trips_update_member" on public.trips;

create policy "trips_update_member"
  on public.trips
  for update
  to authenticated
  using (public.is_trip_editor(id))
  with check (public.is_trip_editor(id));

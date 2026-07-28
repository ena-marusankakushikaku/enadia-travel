-- お気に入り（heart）を本人だけが参照できるようにする。
--
-- 背景：
--   photo_reactions は「いいね(like)」と「お気に入り(heart)」の両方を保存している。
--   いいねは旅のメンバー全員に見えてよいが、お気に入りは自分用のしおりなので
--   他のメンバーからは見えないようにする。
--
-- 実行方法：
--   Supabase の SQL Editor にこのファイルの内容を貼り付けて実行する。
--   （実行しなくてもアプリの画面上は他人のお気に入りは表示されないが、
--     この設定を入れるとデータベースの権限としても参照できなくなる）

drop policy if exists "photo reactions member select" on public.photo_reactions;

create policy "photo reactions member select" on public.photo_reactions
for select using (
  (
    reaction_type <> 'heart'
    and exists (
      select 1
      from public.photos p
      where p.id = photo_id
        and public.is_trip_member(p.trip_id, auth.uid())
    )
  )
  or (reaction_type = 'heart' and user_id = auth.uid())
);

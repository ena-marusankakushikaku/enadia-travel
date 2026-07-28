-- 制覇記録の評価を「1〜5の整数」から「0.0〜5.0の小数（0.1刻み）」に変更する。
--
-- 背景：
--   これまで rating は integer で、1〜5 の範囲しか保存できなかった。
--   「★4.2」のような細かい評価を付けられるようにするため、小数に変更する。
--   評価なし（null）は、これまで通り保存できる。
--
-- 実行方法：
--   Supabase の SQL Editor にこのファイルの内容を貼り付けて実行する。
--   ※このSQLを実行するまで、小数の評価は保存できずエラーになる。

-- 既存の rating に関する制約を名前に依存せず取り除く
do $$
declare
  target record;
begin
  for target in
    select con.conname
    from pg_constraint con
    join pg_class rel on rel.oid = con.conrelid
    join pg_namespace nsp on nsp.oid = rel.relnamespace
    where nsp.nspname = 'public'
      and rel.relname = 'conquest_entries'
      and con.contype = 'c'
      and pg_get_constraintdef(con.oid) ilike '%rating%'
  loop
    execute format('alter table public.conquest_entries drop constraint %I', target.conname);
  end loop;
end $$;

-- 小数1桁（0.0〜9.9）を保存できる型に変更する
alter table public.conquest_entries
  alter column rating type numeric(2, 1) using round(rating::numeric, 1);

-- 0.0〜5.0 の範囲に収まっていることを保証する
alter table public.conquest_entries
  add constraint conquest_entries_rating_range
  check (rating is null or (rating >= 0 and rating <= 5));

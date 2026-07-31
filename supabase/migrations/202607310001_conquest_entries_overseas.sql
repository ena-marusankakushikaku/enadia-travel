-- テーマ記録を海外でも作れるようにする。
--
-- これまで conquest_entries.prefecture_id は必須だった。
-- 海外で撮った写真には都道府県が無い（prefecture_id が null）ため、
-- 「この写真はこのテーマ」という記録をそもそも作れなかった。
--
-- 都道府県の代わりに緯度経度から国を判定するので、国用のカラムは増やさない。

alter table public.conquest_entries
  alter column prefecture_id drop not null;

-- 都道府県も座標も無い記録は、地図のどこにも置けず制覇の集計にも入らないので防ぐ
alter table public.conquest_entries
  drop constraint if exists conquest_entries_location_present;

alter table public.conquest_entries
  add constraint conquest_entries_location_present
  check (prefecture_id is not null or (lat is not null and lng is not null));

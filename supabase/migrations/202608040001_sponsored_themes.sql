-- ============================================================
-- スポンサードテーマのためのデータ構造
--
-- これまでの制覇テーマ（conquest_projects）は「ユーザーが自分のために作るもの」
-- だったため、他人が作ったテーマを配ることができなかった。
--
-- ここで「配布されるテーマの原本（theme_templates）」と
-- 「まわるスポット（theme_spots）」を足して、
-- ユーザーが参加すると conquest_projects に1行コピーされる形にする。
--
-- 既存のテーブル・データは壊さない。追加した列はすべて NULL 許容なので、
-- いまある自作テーマは template_id が NULL のまま今までどおり動く。
--
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- 何度実行しても同じ結果になる（if not exists / drop policy if exists）。
-- ============================================================


-- ------------------------------------------------------------
-- 0) 行動ログの種類を増やす
--    tourism_events.event_type は enum なので、先に値を足しておく
-- ------------------------------------------------------------
do $$
begin
  alter type public.tourism_event_type add value if not exists 'theme_viewed';
  alter type public.tourism_event_type add value if not exists 'theme_joined';
  alter type public.tourism_event_type add value if not exists 'theme_left';
  alter type public.tourism_event_type add value if not exists 'spot_reached';
  alter type public.tourism_event_type add value if not exists 'theme_completed';
exception when others then null;
end $$;


-- ------------------------------------------------------------
-- 1) スポンサー（自治体・観光団体・組合・企業）
-- ------------------------------------------------------------
create table if not exists public.sponsors (
  id                 uuid primary key default gen_random_uuid(),
  name               text not null,
  display_name       text not null,
  logo_url           text,
  contact_email      text,
  note               text,
  contract_starts_on date,
  contract_ends_on   date,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

comment on table public.sponsors is 'スポンサードテーマの主催者';
comment on column public.sponsors.name is '契約上の正式名称（画面には出さない）';
comment on column public.sponsors.display_name is '「提供：〇〇」として画面に出す名称';


-- ------------------------------------------------------------
-- 2) 配布されるテーマの原本
-- ------------------------------------------------------------
create table if not exists public.theme_templates (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  description     text,
  emoji           text not null default '📍',
  color           text not null default '#0f8b8d',
  category        text not null default 'custom',
  kind            text not null default 'spot'
                  check (kind in ('area', 'spot')),
  sponsor_id      uuid references public.sponsors(id) on delete set null,
  is_sponsored    boolean not null default false,
  area_label      text,
  cover_image_url text,
  reward_text     text,
  terms_url       text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  status          text not null default 'draft'
                  check (status in ('draft', 'published', 'closed')),
  published_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on column public.theme_templates.kind is 'area=都道府県制覇 / spot=指定地点をまわる';
comment on column public.theme_templates.is_sponsored is 'true のとき画面に PR バッジを自動表示する（景品表示法のステマ規制対応）';
comment on column public.theme_templates.status is 'draft=下書き / published=公開中 / closed=掲載終了';

create index if not exists theme_templates_status_idx on public.theme_templates (status);


-- ------------------------------------------------------------
-- 3) まわるスポット（目標地点）
-- ------------------------------------------------------------
create table if not exists public.theme_spots (
  id            uuid primary key default gen_random_uuid(),
  template_id   uuid not null references public.theme_templates(id) on delete cascade,
  name          text not null,
  description   text,
  address       text,
  prefecture_id integer,
  lat           double precision not null,
  lng           double precision not null,
  radius_m      integer not null default 300 check (radius_m between 50 and 5000),
  order_no      integer not null default 0,
  image_url     text,
  external_url  text,
  created_at    timestamptz not null default now()
);

comment on column public.theme_spots.radius_m is
  '到達判定の半径（メートル）。温泉街と駅前で最適値が違うのでスポット単位で調整する';

create index if not exists theme_spots_template_idx on public.theme_spots (template_id, order_no);


-- ------------------------------------------------------------
-- 4) 既存テーブルへの列追加（すべて NULL 許容）
-- ------------------------------------------------------------

-- 4-1) 制覇テーマ：参加インスタンスを兼ねる
alter table public.conquest_projects
  add column if not exists template_id  uuid references public.theme_templates(id) on delete set null,
  add column if not exists joined_at    timestamptz,
  add column if not exists completed_at timestamptz,
  add column if not exists archived_at  timestamptz;

comment on column public.conquest_projects.template_id is
  'NULL なら自作テーマ。非NULL なら配布テーマへの参加。参加記録テーブルを別に作らないのは、二重管理で食い違うのを避けるため';

-- 同じ配布テーマに二重参加しない
create unique index if not exists conquest_projects_user_template_uniq
  on public.conquest_projects (user_id, template_id)
  where template_id is not null;

-- 4-2) テーマ記録：どのスポットに、どうやって到達したか
alter table public.conquest_entries
  add column if not exists spot_id      uuid references public.theme_spots(id) on delete set null,
  add column if not exists verification text not null default 'manual';

do $$
begin
  alter table public.conquest_entries
    add constraint conquest_entries_verification_check
    check (verification in ('photo_gps', 'checkin', 'qr', 'manual'));
exception when duplicate_object then null;
end $$;

comment on column public.conquest_entries.verification is
  'photo_gps=写真のGPS / checkin=現在地 / qr=QR読取 / manual=自己申告。主催者レポートでは manual を区別して出す';

create index if not exists conquest_entries_spot_idx on public.conquest_entries (spot_id);

-- 4-3) プロフィール：任意項目と統計同意
alter table public.profiles
  add column if not exists residence_prefecture_id integer,
  add column if not exists birth_year              integer,
  add column if not exists stats_consent_at        timestamptz;

comment on column public.profiles.birth_year is '年代の集計にのみ使う。生年月日は取得しない';


-- ------------------------------------------------------------
-- 5) 権限（RLS）
--    読み取りは公開中のものだけ。
--    書き込みポリシーを作らない = service_role（管理画面のAPI）からしか入稿できない。
-- ------------------------------------------------------------
alter table public.sponsors        enable row level security;
alter table public.theme_templates enable row level security;
alter table public.theme_spots     enable row level security;

drop policy if exists "published templates are readable" on public.theme_templates;
create policy "published templates are readable"
  on public.theme_templates for select
  to authenticated
  using (status = 'published');

drop policy if exists "spots of published templates are readable" on public.theme_spots;
create policy "spots of published templates are readable"
  on public.theme_spots for select
  to authenticated
  using (
    exists (
      select 1
      from public.theme_templates t
      where t.id = theme_spots.template_id
        and t.status = 'published'
    )
  );

drop policy if exists "sponsors are readable" on public.sponsors;
create policy "sponsors are readable"
  on public.sponsors for select
  to authenticated
  using (true);

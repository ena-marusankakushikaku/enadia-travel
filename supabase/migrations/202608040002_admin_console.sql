-- ============================================================
-- 管理画面（/admin）のためのデータ構造
--
-- 3つある。
--   1. 管理者フラグ（profiles.is_admin）
--   2. 利用規約・プライバシーポリシーのバージョン管理（legal_documents）
--   3. 数値パラメータの設定（app_settings）
--
-- 「無料ユーザーが使える範囲」は app_settings で**数値だけ**変えられるようにする。
-- 機能そのもののON/OFF（動画書き出しはProだけ、など）はコード側に固定する。
-- 管理画面から機能を切れるようにすると、課金との整合が崩れたときに
-- 「お金を払っているのに使えない」が起きるうえ、テストすべき組み合わせが一気に増えるため。
--
-- 実行場所: Supabase ダッシュボード > SQL Editor
-- ============================================================


-- ------------------------------------------------------------
-- 1) 管理者フラグ
--    plan とは分けて持つ。plan は課金の状態、is_admin は運営の権限で、別のもの。
-- ------------------------------------------------------------
alter table public.profiles
  add column if not exists is_admin boolean not null default false;

comment on column public.profiles.is_admin is '運営メンバーかどうか。課金プラン（plan）とは別の軸';

-- 自分が管理者かどうかを、RLSの中から安全に判定するための関数。
-- security definer にしないと profiles のポリシーを再帰的に参照して無限ループになる。
create or replace function public.is_admin(p_user_id uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = p_user_id), false);
$$;


-- ------------------------------------------------------------
-- 2) 利用規約・プライバシーポリシー
--
--    「差し替える」＝上書きではなく、新しいバージョンを追加して公開に切り替える。
--    上書きにすると、user_consents に残した「version」がどの本文を指すのか
--    分からなくなり、同意の記録が意味を失う。
-- ------------------------------------------------------------
create table if not exists public.legal_documents (
  id           uuid primary key default gen_random_uuid(),
  doc_type     text not null check (doc_type in ('terms', 'privacy')),
  version      text not null,
  title        text not null,
  body         text not null,
  summary      text,
  status       text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  requires_reconsent boolean not null default false,
  published_at timestamptz,
  effective_on date,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (doc_type, version)
);

comment on column public.legal_documents.body is 'Markdown で書く。表示側で見出し・箇条書き・強調だけを整形する';
comment on column public.legal_documents.requires_reconsent is
  'true にすると、公開後に既存ユーザーへ再同意を求める（統計提供の範囲を不利益に変更した場合など）';

-- 同時に published にできるのは doc_type ごとに1件だけ
create unique index if not exists legal_documents_single_published
  on public.legal_documents (doc_type)
  where status = 'published';

alter table public.legal_documents enable row level security;

drop policy if exists "published legal documents are readable" on public.legal_documents;
create policy "published legal documents are readable"
  on public.legal_documents for select
  using (status = 'published');


-- ------------------------------------------------------------
-- 3) アプリの設定値（数値パラメータのみ）
-- ------------------------------------------------------------
create table if not exists public.app_settings (
  key         text primary key,
  value       jsonb not null,
  label       text not null,
  description text,
  updated_at  timestamptz not null default now(),
  updated_by  uuid
);

insert into public.app_settings (key, value, label, description) values
  ('free_theme_limit', '1'::jsonb, '無料プランの自作テーマ数',
   '登録から一定期間を過ぎたあと、無料プランで新しく作れる自作テーマの数。配布テーマは数えない'),
  ('free_theme_unlimited_days', '30'::jsonb, '無料プランの無制限期間（日）',
   '登録からこの日数のあいだは、無料プランでも自作テーマを何個でも作れる'),
  ('free_taste_insight_months', '12'::jsonb, '無料プランの「好みの傾向」の期間（か月）',
   '無料プランでさかのぼって見られる期間。Proは全期間'),
  ('free_taste_insight_top_n', '3'::jsonb, '無料プランの「好みの傾向」の表示件数',
   'ランキングの表示件数。Proは制限なし'),
  ('free_export_per_month', '1'::jsonb, '無料プランの一括書き出し回数（月）',
   '「いつでも持ち出せる」を担保するため、0にはしないこと'),
  ('spot_default_radius_m', '300'::jsonb, 'スポット到達判定の既定の半径（m）',
   '新しいスポットを登録するときの初期値。スポットごとに個別に変えられる'),
  ('report_min_group_size', '5'::jsonb, 'レポートに出す最小人数',
   'この人数に満たない区分は主催者レポートに出さない。利用規約 第13条3項の実装')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;

drop policy if exists "app settings are readable" on public.app_settings;
create policy "app settings are readable"
  on public.app_settings for select
  to authenticated
  using (true);
-- 書き込みポリシーは作らない = service_role（管理画面のAPI）からのみ更新できる


-- ------------------------------------------------------------
-- 4) 管理画面の集計を軽くするためのインデックス
-- ------------------------------------------------------------
create index if not exists tourism_events_type_created_idx
  on public.tourism_events (event_type, created_at desc);

create index if not exists conquest_projects_template_idx
  on public.conquest_projects (template_id)
  where template_id is not null;


-- ------------------------------------------------------------
-- 5) 最初の管理者を作る
--    ↓のメールアドレスを自分のものに書き換えてから実行すること。
-- ------------------------------------------------------------
-- update public.profiles
--    set is_admin = true
--  where id = (select id from auth.users where email = 'あなたのメールアドレス');

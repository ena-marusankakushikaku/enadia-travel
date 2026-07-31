-- 連続ログイン日数を記録できるようにする。
--
-- これまで画面には「0」と固定値を出していただけで、
-- ログインした日を残す処理がどこにも無かった。
--
-- last_login_date は既にあるので、そこに連続日数のカラムを足す。
-- 初回は1になる（0が出るのはおかしいという指摘に対応）。

alter table public.profiles
  add column if not exists login_streak_days integer not null default 0;

comment on column public.profiles.login_streak_days is '連続でアプリを開いた日数。1日でも空くと1に戻る';
comment on column public.profiles.last_login_date is 'アプリを最後に開いた日（日本時間の日付）';

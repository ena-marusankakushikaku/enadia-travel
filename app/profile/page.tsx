import { Crown } from 'lucide-react';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import { LogoutButton } from '@/components/profile/LogoutButton';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function getRank(points: number): string {
  if (points >= 1000) return 'レジェンド旅人';
  if (points >= 500) return 'グローバル探検家';
  if (points >= 200) return '旅マスター';
  if (points >= 50) return '見習い冒険者';
  return 'ビギナー旅人';
}

export default async function ProfilePage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const [
    { data: profileRow },
    { count: tripCount },
    { data: entryRows },
    { data: projectRows },
    { data: consentRows },
    { data: photoRows }
  ] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('trip_members').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('conquest_entries').select('prefecture_id').eq('user_id', user.id),
    supabase.from('conquest_projects').select('id').eq('user_id', user.id),
    supabase.from('latest_user_consents').select('*').eq('user_id', user.id),
    supabase.from('photos').select('prefecture_id').eq('uploaded_by', user.id)
  ]);

  const displayName = profileRow?.display_name || user.email || 'Traveler';
  const plan = profileRow?.plan ?? 'free';
  const points = profileRow?.points ?? 0;
  // Login streak isn't tracked in the DB yet; falls back to 0 until that's built.
  const loginStreakDays = 0;

  const userTripCount = tripCount ?? 0;
  const conquestProjectCount = (projectRows ?? []).length;
  const visitedPrefectureCount = new Set(
    (photoRows ?? []).map((photo) => photo.prefecture_id).filter((id): id is number => id !== null)
  ).size;
  const achievedPrefectureCount = new Set((entryRows ?? []).map((entry) => entry.prefecture_id)).size;
  const consents = consentRows ?? [];

  return (
    <AppShell subtitle="プロフィールとプラン" title="マイページ">
      <section className="rounded-lg border border-enadia-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-enadia-primary text-xl font-bold text-white">
            {displayName.slice(0, 1)}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold text-enadia-ink">{displayName}</h2>
            <p className="mt-1 text-sm font-semibold text-enadia-primary">{getRank(points)}</p>
            {user.email ? <p className="mt-1 break-all text-xs text-enadia-muted">{user.email}</p> : null}
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            ['旅の数', userTripCount],
            ['訪問県数', visitedPrefectureCount],
            ['ポイント', points.toLocaleString()],
            ['連続ログイン', `${loginStreakDays}日`],
            ['制覇テーマ', conquestProjectCount],
            ['達成県数', achievedPrefectureCount]
          ].map(([label, value]) => (
            <div className="rounded-lg bg-slate-50 p-3" key={label}>
              <p className="text-xl font-bold text-enadia-ink">{value}</p>
              <p className="text-xs text-enadia-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-5 rounded-lg border border-enadia-line bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm text-enadia-muted">現在プラン</p>
            <h2 className="text-xl font-bold uppercase text-enadia-ink">{plan}</h2>
          </div>
          <Button icon={<Crown className="h-4 w-4" aria-hidden="true" />} variant="premium">
            アップグレード
          </Button>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-lg bg-slate-50 p-3">Free<br />広告あり</div>
          <div className="rounded-lg bg-blue-50 p-3">Pro<br />地図解放</div>
          <div className="rounded-lg bg-violet-50 p-3">Premium<br />AI強化</div>
        </div>
      </section>

      <section className="mt-5 space-y-3">
        <h2 className="text-base font-bold text-enadia-ink">User consents</h2>
        {consents.length === 0 ? (
          <p className="rounded-lg border border-dashed border-enadia-line bg-white p-4 text-center text-sm text-enadia-muted">
            同意記録はまだありません。
          </p>
        ) : (
          consents.map((consent) => (
            <article className="flex items-center justify-between rounded-lg border border-enadia-line bg-white p-4" key={consent.consent_type}>
              <span className="text-sm font-semibold text-enadia-ink">{consent.consent_type}</span>
              <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-enadia-primary">
                {consent.granted ? 'accepted' : 'revoked'}
              </span>
            </article>
          ))
        )}
      </section>

      <section className="mt-5 rounded-lg border border-enadia-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-bold text-enadia-ink">アカウント</h2>
        <p className="mb-3 mt-1 text-xs text-enadia-muted">
          ログアウトすると、次に使うときに再度ログインが必要になります。
        </p>
        <LogoutButton />
      </section>
    </AppShell>
  );
}

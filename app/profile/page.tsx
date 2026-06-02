import { Crown } from 'lucide-react';
import { AppShell } from '@/components/common/AppShell';
import { Button } from '@/components/common/Button';
import {
  mockConquestProjects,
  mockCurrentUserId,
  mockPhotos,
  mockTrips,
  mockUserConsents,
  mockUsers,
  mockUserStats
} from '@/constants/mockData';

function getRank(points: number): string {
  if (points >= 1000) return 'レジェンド旅人';
  if (points >= 500) return 'グローバル探検家';
  if (points >= 200) return '旅マスター';
  if (points >= 50) return '見習い冒険者';
  return 'ビギナー旅人';
}

export default function ProfilePage() {
  const user = mockUsers.find((item) => item.id === mockCurrentUserId) ?? mockUsers[0];
  const stats = mockUserStats.find((item) => item.userId === mockCurrentUserId);
  const consents = mockUserConsents.filter((consent) => consent.userId === mockCurrentUserId);
  const userTripCount = mockTrips.filter((trip) => trip.memberIds.includes(mockCurrentUserId)).length;
  const visitedPrefectureCount = new Set(
    mockPhotos
      .filter((photo) => photo.seenBy.includes(mockCurrentUserId) || photo.uploadedBy === mockCurrentUserId)
      .map((photo) => photo.prefectureId)
      .filter((id): id is number => id !== null)
  ).size;
  const achievedPrefectureCount = new Set(mockConquestProjects.flatMap((project) => project.entries.map((entry) => entry.prefectureId))).size;

  return (
    <AppShell subtitle="プロフィールとプラン" title="マイページ">
      <section className="rounded-lg border border-enadia-line bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-enadia-primary text-xl font-bold text-white">
            {user.displayName.slice(0, 1)}
          </div>
          <div>
            <h2 className="text-xl font-bold text-enadia-ink">{user.displayName}</h2>
            <p className="mt-1 text-sm font-semibold text-enadia-primary">{getRank(stats?.points ?? 0)}</p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            ['旅の数', userTripCount],
            ['訪問県数', visitedPrefectureCount],
            ['ポイント', (stats?.points ?? 0).toLocaleString()],
            ['連続ログイン', `${stats?.loginStreakDays ?? 0}日`],
            ['制覇テーマ', mockConquestProjects.length],
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
            <h2 className="text-xl font-bold uppercase text-enadia-ink">{user.plan}</h2>
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
        {consents.map((consent) => (
          <article className="flex items-center justify-between rounded-lg border border-enadia-line bg-white p-4" key={consent.id}>
            <span className="text-sm font-semibold text-enadia-ink">{consent.consentKey}</span>
            <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-bold text-enadia-primary">
              {consent.accepted ? 'accepted' : 'revoked'}
            </span>
          </article>
        ))}
      </section>
    </AppShell>
  );
}

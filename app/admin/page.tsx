import Link from 'next/link';
import { createSupabaseServiceClient } from '@/lib/supabase/service';
import { loadOverviewStats, loadThemeStats } from '@/lib/admin/stats';

export const dynamic = 'force-dynamic';

function StatCard({
  hint,
  label,
  value
}: {
  hint?: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-enadia-line bg-white p-4">
      <p className="text-xs font-semibold text-enadia-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold text-enadia-ink">{value}</p>
      {hint ? <p className="mt-1 text-xs text-enadia-muted">{hint}</p> : null}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const supabase = createSupabaseServiceClient();
  const [overview, themes] = await Promise.all([
    loadOverviewStats(supabase),
    loadThemeStats(supabase)
  ]);

  const publishedThemes = themes.filter((theme) => theme.status === 'published');

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-base font-bold text-enadia-ink">利用状況</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="登録ユーザー" value={overview.userCount} hint={`直近30日 +${overview.newUsersLast30d}`} />
          <StatCard label="直近30日に使った人" value={overview.activeUsersLast30d} hint="行動ログのある人数" />
          <StatCard label="有料プラン" value={overview.paidUserCount} hint="黒字ラインは16〜25人" />
          <StatCard label="テーマ記録" value={overview.entryCount} hint={`写真 ${overview.photoCount}枚 / 旅 ${overview.tripCount}件`} />
        </div>
      </section>

      <section>
        <h2 className="text-base font-bold text-enadia-ink">継続の指標</h2>
        <p className="mt-1 text-xs text-enadia-muted">
          数十人の規模では、この割合は1人増減するだけで大きく動きます。数字そのものより、
          使わなくなった人に直接理由を聞くほうが価値があります。
        </p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <StatCard
            label="旅を2回以上記録した割合"
            value={`${overview.repeatTripRate}%`}
            hint="目標 40%"
          />
          <StatCard
            label="テーマ記録を1件以上作った割合"
            value={`${overview.themeEntryRate}%`}
            hint="目標 50%"
          />
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-enadia-ink">テーマの成績</h2>
          <Link className="text-sm font-semibold text-enadia-primary" href="/admin/themes">
            テーマ入稿へ
          </Link>
        </div>

        {themes.length === 0 ? (
          <p className="mt-3 rounded-lg border border-dashed border-enadia-line bg-white p-6 text-center text-sm text-enadia-muted">
            まだテーマがありません。「テーマ入稿」から作成してください。
          </p>
        ) : (
          <div className="mt-3 space-y-4">
            {themes.map((theme) => (
              <div className="rounded-lg border border-enadia-line bg-white p-4" key={theme.templateId}>
                <div className="flex flex-wrap items-center gap-2">
                  {theme.isSponsored ? (
                    <span className="rounded bg-enadia-accent px-2 py-0.5 text-[10px] font-bold text-white">PR</span>
                  ) : null}
                  <Link
                    className="text-sm font-bold text-enadia-ink hover:text-enadia-primary"
                    href={`/admin/themes/${theme.templateId}`}
                  >
                    {theme.title}
                  </Link>
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-enadia-muted">
                    {theme.status === 'published' ? '公開中' : theme.status === 'draft' ? '下書き' : '掲載終了'}
                  </span>
                  {theme.sponsorName ? (
                    <span className="text-xs text-enadia-muted">提供：{theme.sponsorName}</span>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-4">
                  <StatCard label="参加者" value={theme.participantCount} />
                  <StatCard label="達成者" value={theme.completedCount} />
                  <StatCard label="達成率" value={`${theme.completionRate}%`} hint="目標 30%" />
                  <StatCard
                    label="平均評価"
                    value={theme.averageRating === null ? '—' : theme.averageRating.toFixed(1)}
                    hint={`記録 ${theme.entryCount}件`}
                  />
                </div>

                {theme.spots.length > 0 ? (
                  <table className="mt-3 w-full text-left text-xs">
                    <thead className="text-enadia-muted">
                      <tr>
                        <th className="py-1 font-semibold">スポット</th>
                        <th className="py-1 font-semibold">到達</th>
                        <th className="py-1 font-semibold">平均評価</th>
                      </tr>
                    </thead>
                    <tbody>
                      {theme.spots.map((spot) => (
                        <tr className="border-t border-enadia-line" key={spot.spotId}>
                          <td className="py-1.5">{spot.name}</td>
                          <td className="py-1.5">{spot.reachedCount}</td>
                          <td className="py-1.5">
                            {spot.averageRating === null ? '—' : spot.averageRating.toFixed(1)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>

      {publishedThemes.length === 0 ? (
        <p className="rounded-lg border border-enadia-line bg-white p-4 text-sm text-enadia-muted">
          いま公開中のテーマがありません。スポンサー案件が無い期間も、運営の公式テーマを1つ出しておくと、
          旅に出る理由が途切れずにすみます。
        </p>
      ) : null}
    </div>
  );
}

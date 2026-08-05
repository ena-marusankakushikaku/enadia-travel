import Link from 'next/link';
import { ChevronRight, Compass } from 'lucide-react';
import { SponsoredBadge } from '@/components/themes/SponsoredBadge';

/**
 * ホーム（旅一覧）の最上部に置く、テーマへの入口。
 *
 * 旅の頻度は低いので、テーマを「制覇タブの奥」に置くと存在に気づかれない。
 * 参加中のテーマは「次にどこへ行くか」を示すもので、このアプリで
 * 旅に出る理由をつくれる唯一の場所なので、いちばん上に置く。
 */
export type JoinedThemeSummary = {
  projectId: string;
  title: string;
  emoji: string;
  color: string;
  isSponsored: boolean;
  sponsorName: string | null;
  achieved: number;
  total: number;
  unit: string;
  daysLeft: number | null;
};

export type AvailableThemeSummary = {
  templateId: string;
  title: string;
  emoji: string;
  isSponsored: boolean;
  sponsorName: string | null;
  spotCount: number;
  daysLeft: number | null;
};

export function ThemeHighlights({
  available,
  joined
}: {
  available: AvailableThemeSummary[];
  joined: JoinedThemeSummary[];
}) {
  if (joined.length === 0 && available.length === 0) {
    return null;
  }

  return (
    <section className="mb-5 space-y-3">
      {joined.map((theme) => {
        const percent = theme.total === 0 ? 0 : Math.round((theme.achieved / theme.total) * 100);

        return (
          <Link
            className="block rounded-lg border border-enadia-line bg-white p-4 shadow-sm transition hover:bg-slate-50"
            href={`/conquest/${theme.projectId}`}
            key={theme.projectId}
          >
            <div className="flex items-center justify-between gap-2">
              {theme.isSponsored ? <SponsoredBadge /> : <span className="text-xs font-bold text-enadia-primary">参加中</span>}
              {theme.daysLeft !== null ? (
                <span className="text-xs text-enadia-muted">のこり{theme.daysLeft}日</span>
              ) : null}
            </div>

            <p className="mt-2 text-sm font-bold text-enadia-ink">
              {theme.emoji} {theme.title}
            </p>
            {theme.sponsorName ? (
              <p className="text-xs text-enadia-muted">提供：{theme.sponsorName}</p>
            ) : null}

            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${percent}%`, backgroundColor: theme.color }}
              />
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <span className="text-xs text-enadia-muted">
                {theme.achieved} / {theme.total}
                {theme.unit}
              </span>
              <span className="text-xs font-bold text-enadia-primary">つづきを回る →</span>
            </div>
          </Link>
        );
      })}

      {available.length > 0 ? (
        <Link
          className="flex items-center gap-3 rounded-lg border border-enadia-primary/30 bg-enadia-primary/5 p-4 transition hover:bg-enadia-primary/10"
          href="/conquest/discover"
        >
          <Compass className="h-5 w-5 shrink-0 text-enadia-primary" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-enadia-ink">
              参加できるテーマが{available.length}件あります
            </p>
            <p className="truncate text-xs text-enadia-muted">
              {available
                .slice(0, 2)
                .map((theme) => `${theme.emoji} ${theme.title}`)
                .join(' / ')}
              {available.length > 2 ? ' ほか' : ''}
            </p>
          </div>
          <ChevronRight className="h-5 w-5 shrink-0 text-enadia-muted" aria-hidden="true" />
        </Link>
      ) : null}
    </section>
  );
}

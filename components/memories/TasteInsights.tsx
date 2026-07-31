'use client';

import { useMemo } from 'react';
import { Sparkles, Star, Trophy } from 'lucide-react';
import { getPrefectureName } from '@/constants/japan';
import { formatRating } from '@/components/conquest/RatingInput';
import type { ConquestEntry, ConquestProject } from '@/types/app';

type TasteInsightsProps = {
  projects: ConquestProject[];
  entries: ConquestEntry[];
};

function average(values: number[]): number {
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export function TasteInsights({ entries, projects }: TasteInsightsProps) {
  const insights = useMemo(() => {
    const rated = entries.filter((entry) => entry.rating !== null);

    const byProject = projects
      .map((project) => {
        const projectEntries = entries.filter((entry) => entry.projectId === project.id);
        const projectRated = projectEntries.filter((entry) => entry.rating !== null);
        const best = [...projectRated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))[0] ?? null;

        return {
          project,
          count: projectEntries.length,
          ratedCount: projectRated.length,
          averageRating: projectRated.length > 0 ? average(projectRated.map((entry) => entry.rating ?? 0)) : null,
          best
        };
      })
      .filter((item) => item.count > 0)
      .sort((a, b) => b.count - a.count);

    const topEntries = [...rated].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)).slice(0, 5);

    const prefectureMap = new Map<number, number[]>();
    for (const entry of rated) {
      // 海外の記録には都道府県が無いので、都道府県の集計からは外す
      if (entry.prefectureId === null) {
        continue;
      }
      const list = prefectureMap.get(entry.prefectureId) ?? [];
      list.push(entry.rating ?? 0);
      prefectureMap.set(entry.prefectureId, list);
    }
    const topPrefectures = Array.from(prefectureMap.entries())
      .map(([prefectureId, ratings]) => ({
        prefectureId,
        count: ratings.length,
        averageRating: average(ratings)
      }))
      .sort((a, b) => b.averageRating - a.averageRating || b.count - a.count)
      .slice(0, 3);

    return { rated, byProject, topEntries, topPrefectures };
  }, [entries, projects]);

  const mostActive = insights.byProject[0] ?? null;

  if (entries.length === 0) {
    return (
      <section className="rounded-lg border border-enadia-line bg-white p-5">
        <h2 className="flex items-center gap-2 text-base font-bold text-enadia-ink">
          <Sparkles className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
          好みの傾向
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-enadia-muted">
          「制覇」タブでテーマを作り、写真にテーマを付けて評価すると、ここに自分の好みの傾向が見えてきます。
        </p>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      <h2 className="flex items-center gap-2 text-base font-bold text-enadia-ink">
        <Sparkles className="h-4 w-4 text-enadia-primary" aria-hidden="true" />
        好みの傾向
      </h2>

      {mostActive ? (
        <div className="rounded-lg bg-enadia-ink p-4 text-white">
          <p className="text-xs text-white/60">いま一番熱心なテーマ</p>
          <p className="mt-1 text-xl font-bold">
            {mostActive.project.emoji} {mostActive.project.name}
          </p>
          <p className="mt-1 text-sm text-white/75">
            {mostActive.count}件の記録
            {mostActive.averageRating !== null ? ` ・ 平均 ${formatRating(mostActive.averageRating)}` : ''}
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        {insights.byProject.map((item) => (
          <article className="rounded-lg border border-enadia-line bg-white p-3" key={item.project.id}>
            <div className="flex items-center justify-between gap-2">
              <p className="min-w-0 truncate text-sm font-bold text-enadia-ink">
                {item.project.emoji} {item.project.name}
              </p>
              <span className="shrink-0 text-xs font-bold text-enadia-muted">
                {item.averageRating !== null ? (
                  <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                    平均 {formatRating(item.averageRating)}
                  </span>
                ) : (
                  <span className="rounded-full bg-slate-100 px-2 py-1">評価なし</span>
                )}
              </span>
            </div>
            <p className="mt-1.5 text-xs text-enadia-muted">
              {item.count}件
              {item.ratedCount > 0 && item.ratedCount < item.count ? `（うち${item.ratedCount}件を評価）` : ''}
              {item.best ? ` ・ マイベスト：${item.best.title}` : ''}
            </p>
          </article>
        ))}
      </div>

      {insights.topEntries.length > 0 ? (
        <div className="rounded-lg border border-enadia-line bg-white p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-enadia-ink">
            <Trophy className="h-4 w-4 text-amber-500" aria-hidden="true" />
            高評価だった記録
          </h3>
          <ol className="mt-3 space-y-2">
            {insights.topEntries.map((entry, index) => {
              const project = projects.find((item) => item.id === entry.projectId);

              return (
                <li className="flex items-center gap-3" key={entry.id}>
                  <span className="w-4 shrink-0 text-center text-xs font-bold text-enadia-muted">{index + 1}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-bold text-enadia-ink">{entry.title}</span>
                    <span className="block truncate text-xs text-enadia-muted">
                      {project ? `${project.emoji} ${project.name} ・ ` : ''}
                      {getPrefectureName(entry.prefectureId)}
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-bold text-amber-600">{formatRating(entry.rating)}</span>
                </li>
              );
            })}
          </ol>
        </div>
      ) : (
        <p className="rounded-lg border border-dashed border-enadia-line bg-white p-4 text-center text-xs text-enadia-muted">
          記録に評価を付けると、お気に入りの順位が出せるようになります。
        </p>
      )}

      {insights.topPrefectures.length > 0 ? (
        <div className="rounded-lg border border-enadia-line bg-white p-4">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-enadia-ink">
            <Star className="h-4 w-4 text-amber-500" aria-hidden="true" />
            評価が高かった都道府県
          </h3>
          <div className="mt-3 space-y-2">
            {insights.topPrefectures.map((item) => (
              <div className="flex items-center justify-between gap-3" key={item.prefectureId}>
                <span className="truncate text-sm font-semibold text-enadia-ink">
                  {getPrefectureName(item.prefectureId)}
                </span>
                <span className="shrink-0 text-xs text-enadia-muted">
                  {item.count}件 ・ 平均 {formatRating(item.averageRating)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

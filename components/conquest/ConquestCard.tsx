import Link from 'next/link';
import { countAchievedPrefectures, PREFECTURE_TOTAL, prefectureProgress } from '@/lib/conquest/progress';
import type { ConquestProject } from '@/types/app';

type ConquestCardProps = {
  project: ConquestProject;
  /** 海外で記録した国の数。日本は含まない。サーバー側で数えて渡す */
  overseasCountryCount?: number;
};

export function ConquestCard({ overseasCountryCount = 0, project }: ConquestCardProps) {
  const prefectureCount = countAchievedPrefectures(project.entries);
  const progress = prefectureProgress(project.entries);

  return (
    <Link className="block rounded-lg border border-enadia-line bg-white p-4 shadow-sm" href={`/conquest/${project.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{project.emoji}</p>
          <h2 className="mt-2 text-base font-bold text-enadia-ink">{project.name}</h2>
          {project.description ? <p className="mt-1 line-clamp-2 text-sm text-enadia-muted">{project.description}</p> : null}
        </div>
        <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-enadia-muted">
          {progress}%
        </span>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: project.color }} />
      </div>

      {/* 日本と海外は数え方の単位が違うので、率でまとめず並べて出す */}
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-enadia-muted">
        <span>
          日本 {prefectureCount} / {PREFECTURE_TOTAL}県
        </span>
        <span>海外 {overseasCountryCount}か国</span>
        <span>記録 {project.entries.length}件</span>
      </div>
    </Link>
  );
}

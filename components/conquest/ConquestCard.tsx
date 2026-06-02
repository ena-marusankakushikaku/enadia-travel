import Link from 'next/link';
import type { ConquestProject } from '@/types/app';

type ConquestCardProps = {
  project: ConquestProject;
};

export function ConquestCard({ project }: ConquestCardProps) {
  const prefectureCount = new Set(project.entries.map((entry) => entry.prefectureId)).size;
  const progress = Math.round((prefectureCount / 47) * 100);

  return (
    <Link className="block rounded-lg border border-enadia-line bg-white p-4 shadow-sm" href={`/conquest/${project.id}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl">{project.emoji}</p>
          <h2 className="mt-2 text-base font-bold text-enadia-ink">{project.name}</h2>
          {project.description ? <p className="mt-1 line-clamp-2 text-sm text-enadia-muted">{project.description}</p> : null}
        </div>
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-enadia-muted">{progress}%</span>
      </div>
      <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: project.color }} />
      </div>
      <p className="mt-3 text-xs font-semibold text-enadia-muted">{prefectureCount} / 47 prefectures</p>
    </Link>
  );
}

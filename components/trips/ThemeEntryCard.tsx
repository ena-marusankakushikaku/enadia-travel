import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';
import { getPrefectureName } from '@/constants/japan';
import { MockPhoto } from '@/components/photos/MockPhoto';

type ThemeEntryCardProps = {
  entry: ConquestEntry;
  project: ConquestProject | null;
  photo?: Photo;
  user: UserProfile | null;
  onDelete?: (entryId: string) => void;
};

export function ThemeEntryCard({ entry, onDelete, photo, project, user }: ThemeEntryCardProps) {
  return (
    <article className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {photo ? (
          <MockPhoto className="h-20 w-20 shrink-0 rounded-lg" index={photo.mockImageIndex} title={null} />
        ) : (
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-slate-100 text-2xl">
            {project?.emoji ?? '🎯'}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs font-bold text-enadia-primary">
                {project?.emoji ?? '🎯'} {project?.name ?? 'テーマ'}
              </p>
              <h3 className="mt-1 truncate text-base font-bold text-enadia-ink">{entry.title}</h3>
            </div>
            {entry.rating ? <span className="shrink-0 text-sm font-bold text-enadia-accent">★ {entry.rating}</span> : null}
          </div>
          <p className="mt-2 text-xs text-enadia-muted">
            {getPrefectureName(entry.prefectureId)} / {entry.placeName ?? '地点未設定'}
          </p>
          {entry.memo ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-enadia-muted">{entry.memo}</p> : null}
          <div className="mt-3 flex items-center justify-between text-xs text-enadia-muted">
            <span>記録者: {user?.displayName ?? 'Unknown'}</span>
            {onDelete ? (
              <button className="font-bold text-enadia-danger" onClick={() => onDelete(entry.id)} type="button">
                削除
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

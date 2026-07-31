import { Pencil } from 'lucide-react';
import type { ConquestEntry, ConquestProject, Photo, UserProfile } from '@/types/app';
import { getPrefectureName } from '@/constants/japan';
import { formatRating } from '@/components/conquest/RatingInput';
import { MockPhoto } from '@/components/photos/MockPhoto';

type ThemeEntryCardProps = {
  entry: ConquestEntry;
  project: ConquestProject | null;
  photo?: Photo;
  user: UserProfile | null;
  onEdit?: (entryId: string) => void;
  onDelete?: (entryId: string) => void;
};

export function ThemeEntryCard({ entry, onDelete, onEdit, photo, project, user }: ThemeEntryCardProps) {
  const ratingLabel = formatRating(entry.rating);

  return (
    <article className="rounded-lg border border-enadia-line bg-white p-4 shadow-sm">
      <div className="flex gap-3">
        {photo ? (
          <MockPhoto className="h-20 w-20 shrink-0 rounded-lg" index={photo.mockImageIndex} src={photo.imageUrl} title={null} />
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
            {ratingLabel ? (
              <span className="shrink-0 rounded-full bg-amber-50 px-2 py-1 text-xs font-bold text-amber-700">
                {ratingLabel}
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-xs text-enadia-muted">
            {entry.prefectureId !== null ? getPrefectureName(entry.prefectureId) : '海外'} / {entry.placeName ?? '地点未設定'}
          </p>
          {entry.memo ? <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-enadia-muted">{entry.memo}</p> : null}
          <div className="mt-3 flex items-center justify-between gap-2 text-xs text-enadia-muted">
            <span className="truncate">記録者: {user?.displayName ?? 'Unknown'}</span>
            <span className="flex shrink-0 items-center gap-3">
              {onEdit ? (
                <button
                  className="inline-flex items-center gap-1 font-bold text-enadia-primary"
                  onClick={() => onEdit(entry.id)}
                  type="button"
                >
                  <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  編集
                </button>
              ) : null}
              {onDelete ? (
                <button className="font-bold text-enadia-danger" onClick={() => onDelete(entry.id)} type="button">
                  削除
                </button>
              ) : null}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

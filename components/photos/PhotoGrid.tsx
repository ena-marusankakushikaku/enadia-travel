'use client';

import { useMemo } from 'react';
import { Heart, MessageCircle, Star } from 'lucide-react';
import { MockPhoto } from '@/components/photos/MockPhoto';
import type { Photo } from '@/types/app';

type PhotoGridProps = {
  photos: Photo[];
  currentUserId: string;
  onOpenPhoto: (photoId: string) => void;
};

function toDateKey(photo: Photo): string {
  const value = photo.capturedAt ?? photo.ts;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  // 日本時間での日付でまとめる
  return new Date(parsed.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function formatDateHeading(dateKey: string): string {
  if (dateKey === '') {
    return '日付不明';
  }

  const [year, month, day] = dateKey.split('-');
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

export function PhotoGrid({ currentUserId, onOpenPhoto, photos }: PhotoGridProps) {
  // 新しい日付が上に来るように並べ、同じ日の中では新しい写真から表示する
  const groups = useMemo(() => {
    const byDate = new Map<string, Photo[]>();

    for (const photo of photos) {
      const key = toDateKey(photo);
      const group = byDate.get(key);
      if (group) {
        group.push(photo);
      } else {
        byDate.set(key, [photo]);
      }
    }

    return Array.from(byDate.entries())
      .map(([dateKey, groupPhotos]) => ({
        dateKey,
        photos: [...groupPhotos].sort(
          (a, b) => new Date(b.capturedAt ?? b.ts).getTime() - new Date(a.capturedAt ?? a.ts).getTime()
        )
      }))
      .sort((a, b) => (a.dateKey < b.dateKey ? 1 : -1));
  }, [photos]);

  if (photos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-enadia-line bg-white p-6 text-center text-sm text-enadia-muted">
        写真はまだありません。
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => (
        <section key={group.dateKey}>
          <div className="mb-2 flex items-center gap-3">
            <h3 className="text-sm font-bold text-enadia-ink">{formatDateHeading(group.dateKey)}</h3>
            <span className="text-xs font-semibold text-enadia-muted">{group.photos.length}枚</span>
            <span className="h-px flex-1 bg-enadia-line" />
          </div>

          <div className="grid grid-cols-3 gap-1">
            {group.photos.map((photo) => {
              const likeCount = photo.reactions.filter((reaction) => reaction.reactionType === 'like').length;
              const isFavorite = photo.reactions.some(
                (reaction) => reaction.reactionType === 'heart' && reaction.userId === currentUserId
              );

              return (
                <button
                  aria-label={`${photo.placeName ?? '写真'}を開く`}
                  className="relative aspect-square overflow-hidden rounded-md"
                  key={photo.id}
                  onClick={() => onOpenPhoto(photo.id)}
                  type="button"
                >
                  <MockPhoto className="h-full w-full" index={photo.mockImageIndex} src={photo.imageUrl} title={null} />

                  {isFavorite ? (
                    <span className="absolute right-1 top-1 grid h-5 w-5 place-items-center rounded-full bg-black/40 backdrop-blur">
                      <Star className="h-3 w-3 fill-amber-300 text-amber-300" aria-hidden="true" />
                    </span>
                  ) : null}

                  {likeCount > 0 || photo.comments.length > 0 ? (
                    <span className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/55 to-transparent px-1.5 pb-1 pt-3 text-[10px] font-bold text-white">
                      {likeCount > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                          <Heart className="h-3 w-3 fill-white" aria-hidden="true" />
                          {likeCount}
                        </span>
                      ) : null}
                      {photo.comments.length > 0 ? (
                        <span className="inline-flex items-center gap-0.5">
                          <MessageCircle className="h-3 w-3" aria-hidden="true" />
                          {photo.comments.length}
                        </span>
                      ) : null}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

'use client';

import { useMemo } from 'react';
import { Heart, MessageCircle, Star } from 'lucide-react';
import { MockPhoto } from '@/components/photos/MockPhoto';
import { groupByTripDay } from '@/lib/trips/tripDay';
import type { Photo } from '@/types/app';

type PhotoGridProps = {
  photos: Photo[];
  currentUserId: string;
  /** 旅の期間。「2日目」の見出しを出すのに使う */
  tripStartsAt: string;
  tripEndsAt: string;
  onOpenPhoto: (photoId: string) => void;
};

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

function photoDate(photo: Photo): string {
  return photo.capturedAt ?? photo.ts;
}

/** 日本時間での「YYYY-MM-DD」。日付がおかしければ空文字 */
function toDateKey(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }

  return new Date(parsed.getTime() + JST_OFFSET_MS).toISOString().slice(0, 10);
}

function formatDate(value: string | null): string {
  const dateKey = value ? toDateKey(value) : '';
  if (dateKey === '') {
    return '日付不明';
  }

  const [year, month, day] = dateKey.split('-');
  return `${Number(year)}年${Number(month)}月${Number(day)}日`;
}

/**
 * 見出しに出す日付。
 * 旅行前・旅行後は日付が散らばることがあるので、その場合は範囲で見せる。
 */
function formatDateLabel(firstDate: string | null, lastDate: string | null): string {
  if (!firstDate) {
    return '';
  }

  const first = formatDate(firstDate);
  const last = formatDate(lastDate);

  return first === last ? first : `${first} 〜 ${last}`;
}

export function PhotoGrid({
  currentUserId,
  onOpenPhoto,
  photos,
  tripEndsAt,
  tripStartsAt
}: PhotoGridProps) {
  // 旅行前 → 1日目 → 2日目 → … → 旅行後 の順。
  // 旅行前と旅行後は、日付が違ってもひとつの括りにまとめる。
  const groups = useMemo(
    () => groupByTripDay(photos, photoDate, tripStartsAt, tripEndsAt),
    [photos, tripEndsAt, tripStartsAt]
  );

  if (photos.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-enadia-line bg-white p-6 text-center text-sm text-enadia-muted">
        写真はまだありません。
      </p>
    );
  }

  return (
    <div className="space-y-5">
      {groups.map((group) => {
        // その括りの写真がすべて撮影日不明なら、見出しの日付はアップロード日ということになる
        const isUploadDate = group.items.every((photo) => photo.capturedAt === null);
        const dateLabel = formatDateLabel(group.firstDate, group.lastDate);

        return (
          <section key={group.key}>
            <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1">
              <h3 className="text-sm font-bold text-enadia-ink">{group.label}</h3>
              {dateLabel ? (
                <span className="text-xs font-semibold text-enadia-muted">{dateLabel}</span>
              ) : null}
              <span className="text-xs font-semibold text-enadia-muted">{group.items.length}枚</span>
              {isUploadDate ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                  アップロード日
                </span>
              ) : null}
              <span className="h-px min-w-4 flex-1 bg-enadia-line" />
            </div>

            <div className="grid grid-cols-3 gap-1">
              {group.items.map((photo) => {
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
                    {/* 一覧では小さい画像を使う。原寸を並べると1画面で何十MBにもなる */}
                    <MockPhoto
                      className="h-full w-full"
                      index={photo.mockImageIndex}
                      src={photo.thumbnailUrl ?? photo.imageUrl}
                      title={null}
                    />

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
        );
      })}
    </div>
  );
}
